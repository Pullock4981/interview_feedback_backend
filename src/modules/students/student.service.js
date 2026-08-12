const studentRepository = require('./student.repository');
const { NotFoundError, ForbiddenError } = require('../../common/utils/AppError');
const { ROLES } = require('../../common/constants/enums');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

/**
 * Validates a single raw import row (PRD 7.4). Returns { valid, reason }
 * rather than throwing, so the caller can collect per-row errors and
 * keep processing the rest of the sheet instead of aborting the batch.
 */
function validateImportRow(row) {
  if (!row.name || !String(row.name).trim()) return { valid: false, reason: 'Missing name' };
  if (!row.email || !EMAIL_REGEX.test(String(row.email).trim())) {
    return { valid: false, reason: 'Missing or invalid email' };
  }
  return { valid: true };
}

const studentService = {
  /**
   * Runs a student import job against an already-fetched array of raw
   * rows (PRD 7.3 workflow diagram). Fetching the actual Google Sheet
   * content via the Sheets API is intentionally left as a thin seam
   * (`rows` is passed in already-parsed) so this function - and its
   * dedup/validation/merge logic - can be unit tested without a live
   * Google API call, and the Sheets client can be swapped later.
   *
   * mergePolicy:
   *   'merge' (default) - existing student is updated with any new
   *      non-empty fields; status/assignment already set is preserved.
   *   'skip' - existing students (matched by email) are left untouched.
   */
  async importStudents({ rows, sourceSheetId, triggeredBy, mergePolicy = 'merge' }) {
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errorDetails = [];

    for (const row of rows) {
      const { valid, reason } = validateImportRow(row);
      if (!valid) {
        errorDetails.push({ row, reason });
        continue;
      }

      const email = String(row.email).trim().toLowerCase();
      const existing = await studentRepository.findByEmail(email);

      if (existing) {
        if (mergePolicy === 'skip') {
          skippedCount += 1;
          continue;
        }
        // Merge: only overwrite fields that are non-empty in the new row
        const updates = {};
        if (row.name) updates.name = row.name;
        if (row.phone) updates.phone = row.phone;
        if (row.course) updates.course = row.course;
        if (row.batch) updates.batch = row.batch;
        if (row.level) updates.level = row.level;
        if (row.slot) updates.slot = row.slot;
        if (row.assignedInstructorId) updates.assignedInstructor = row.assignedInstructorId;
        if (row.metadata && Object.keys(row.metadata).length > 0) {
          updates.metadata = { ...(existing.metadata || {}), ...row.metadata };
        }

        if (Object.keys(updates).length > 0) {
          await studentRepository.updateById(existing._id, updates);
          updatedCount += 1;
        } else {
          skippedCount += 1;
        }

        if (row.assignedInstructorId) {
          const mongoose = require('mongoose');
          require('../interviews/interview.model');
          const Interview = mongoose.model('Interview');

          const existingInterview = await Interview.findOne({ 
            student: existing._id, 
            instructor: row.assignedInstructorId,
            course: row.course || 'N/A',
            status: { $in: ['Assigned', 'Interview Started', 'Draft Saved'] }
          });
          if (!existingInterview) {
            await Interview.create({
              student: existing._id,
              instructor: row.assignedInstructorId,
              course: row.course || 'N/A',
              batch: row.batch || 'N/A',
              status: 'Assigned'
            });
          }
        }

        continue;
      }

      const mongoose = require('mongoose');
      require('../interviews/interview.model');
      const Interview = mongoose.model('Interview');
      
      const newStudent = await studentRepository.create({
        name: row.name,
        email,
        phone: row.phone || null,
        course: row.course || 'N/A',
        batch: row.batch || 'N/A',
        level: row.level || 'N/A',
        slot: row.slot || null,
        assignedInstructor: row.assignedInstructorId || null,
        source: 'google_sheet',
        metadata: row.metadata || {},
      });
      
      if (row.assignedInstructorId) {
        const existingInterview = await Interview.findOne({ 
          student: newStudent._id, 
          instructor: row.assignedInstructorId,
          course: row.course || 'N/A',
          status: { $in: ['Assigned', 'Interview Started', 'Draft Saved'] }
        });
        if (!existingInterview) {
          await Interview.create({
            student: newStudent._id,
            instructor: row.assignedInstructorId,
            course: row.course || 'N/A',
            batch: row.batch || 'N/A',
            status: 'Assigned'
          });
        }
      }
      
      createdCount += 1;
    }

    const log = await studentRepository.createImportLog({
      triggeredBy,
      sourceSheetId,
      createdCount,
      updatedCount,
      skippedCount,
      errorCount: errorDetails.length,
      errorDetails,
    });

    return {
      createdCount,
      updatedCount,
      skippedCount,
      errorCount: errorDetails.length,
      errorDetails,
      logId: log._id,
    };
  },

  async createManualStudent({ name, email, course, level, batch, instructorId }) {
    email = String(email).trim().toLowerCase();
    let student = await studentRepository.findByEmail(email);

    const updates = { assignedInstructor: instructorId };
    if (name) updates.name = name;
    if (course) updates.course = course;
    if (level) updates.level = level;
    if (batch) updates.batch = batch;

    if (student) {
      student = await studentRepository.updateById(student._id, updates);
    } else {
      student = await studentRepository.create({
        name,
        email,
        course: course || 'N/A',
        batch: batch || 'N/A',
        level: level || 'N/A',
        assignedInstructor: instructorId,
        source: 'manual',
      });
    }

    const mongoose = require('mongoose');
    require('../interviews/interview.model');
    const Interview = mongoose.model('Interview');

    let interview = await Interview.findOne({ student: student._id, status: { $in: ['Assigned', 'Interview Started', 'Draft Saved'] } });
    if (!interview) {
      interview = await Interview.create({
        student: student._id,
        instructor: instructorId,
        course: student.course,
        batch: student.batch,
        status: 'Assigned'
      });
    }

    return { student, interview };
  },

  async listStudents({ user, ...filters }) {
    // Scoping rule (PRD 6.2/6.1 role matrix): instructors only ever see
    // their own assigned students; managers see everyone.
    const scoped = user.role === ROLES.INSTRUCTOR ? { ...filters, instructorId: user._id } : filters;
    const { items, total } = await studentRepository.list(scoped);
    return { items, total, page: filters.page, pageSize: filters.pageSize };
  },

  async getStudentById(id, user) {
    const student = await studentRepository.findById(id);
    if (!student) throw new NotFoundError('Student not found');

    if (
      user.role === ROLES.INSTRUCTOR &&
      (!student.assignedInstructor || student.assignedInstructor._id.toString() !== user._id.toString())
    ) {
      throw new ForbiddenError('You are not assigned to this student');
    }
    return student;
  },

  async assignInstructor(studentId, instructorId) {
    const student = await studentRepository.assignInstructor(studentId, instructorId);
    if (!student) throw new NotFoundError('Student not found');
    return student;
  },

  async updateStudent(id, updates) {
    const student = await studentRepository.updateById(id, updates);
    if (!student) throw new NotFoundError('Student not found');
    return student;
  },

  listImportLogs(filters) {
    return studentRepository.listImportLogs(filters);
  },
};

module.exports = studentService;
