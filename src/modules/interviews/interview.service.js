const interviewRepository = require('./interview.repository');
const feedbackRepository = require('../feedback/feedback.repository');
const studentRepository = require('../students/student.repository');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../common/utils/AppError');
const { ROLES } = require('../../common/constants/enums');

const interviewService = {
  /**
   * Start Interview (FR-04): creates the Interview record AND its
   * linked draft Feedback record in one step (PRD Section 21.3 flow),
   * so the frontend can immediately open the feedback form without a
   * separate "create feedback" call.
   */
  async startInterview(studentId, instructor) {
    const student = await studentRepository.findById(studentId);
    if (!student) throw new NotFoundError('Student not found');

    if (
      instructor.role === ROLES.INSTRUCTOR &&
      (!student.assignedInstructor || student.assignedInstructor._id.toString() !== instructor._id.toString())
    ) {
      throw new ForbiddenError('You are not assigned to this student');
    }

    let interview = await interviewRepository.findActiveForStudent(studentId);
    
    if (interview) {
      if (['Interview Started', 'Draft Saved'].includes(interview.status)) {
        // Already started, just fetch its feedback and return
        const feedback = await feedbackRepository.findByInterviewId(interview._id);
        return { interview, feedback };
      }
      
      // If it's Assigned or Pending, update it
      interview = await interviewRepository.updateById(interview._id, {
        status: 'Interview Started',
        startedAt: new Date(),
        instructor: instructor._id // Update instructor if reassigned
      });
    } else {
      // Create new
      interview = await interviewRepository.create({
        student: studentId,
        instructor: instructor._id,
        course: student.course,
        batch: student.batch,
        status: 'Interview Started',
        startedAt: new Date(),
      });
    }

    // Create feedback draft if it doesn't exist
    let feedback = await feedbackRepository.findByInterviewId(interview._id);
    if (!feedback) {
      feedback = await feedbackRepository.create({ interview: interview._id, status: 'draft' });
    }

    await interviewRepository.addLog({
      interview: interview._id,
      action: 'started',
      actor: instructor._id,
    });

    return { interview, feedback };
  },

  async listInterviews({ user, ...filters }) {
    const scoped = user.role === ROLES.INSTRUCTOR ? { ...filters, instructorId: user._id } : filters;
    const { items, total } = await interviewRepository.list(scoped);
    
    // Fetch feedbacks for all returned interviews and attach them
    const interviewIds = items.map(i => i._id);
    const feedbacks = await feedbackRepository.findManyByInterviewIds(interviewIds);
    
    // Create a map for O(1) lookup
    const feedbackMap = {};
    feedbacks.forEach(f => {
      feedbackMap[f.interview.toString()] = f;
    });

    // Attach feedback to the items array (using lean() on repository side would be better, but we can just map it)
    const itemsWithFeedback = items.map(item => {
      const doc = item.toObject ? item.toObject() : item;
      return {
        ...doc,
        feedback: feedbackMap[doc._id.toString()] || null
      };
    });

    return { items: itemsWithFeedback, total, page: filters.page, pageSize: filters.pageSize };
  },

  async getInterviewById(id, user) {
    const interview = await interviewRepository.findById(id);
    if (!interview) throw new NotFoundError('Interview not found');

    if (
      user.role === ROLES.INSTRUCTOR &&
      interview.instructor._id.toString() !== user._id.toString()
    ) {
      throw new ForbiddenError('You are not the instructor assigned to this interview');
    }
    return interview;
  },

  async cancelInterview(id, reason, user) {
    const interview = await this.getInterviewById(id, user);
    if (['Completed', 'Cancelled'].includes(interview.status)) {
      throw new ConflictError(`Cannot cancel an interview that is already ${interview.status}`);
    }

    const updated = await interviewRepository.updateById(id, {
      status: 'Cancelled',
      cancelledReason: reason,
    });

    await interviewRepository.addLog({
      interview: id,
      action: 'cancelled',
      actor: user._id,
      metadata: { reason },
    });

    return updated;
  },

  getLogs(interviewId) {
    return interviewRepository.listLogs(interviewId);
  },

  async deleteInterview(id, user) {
    const interview = await this.getInterviewById(id, user);
    const deleted = await interviewRepository.deleteById(id);
    if (!deleted) throw new NotFoundError('Interview not found');
    return deleted;
  },

  async deleteByCourse(course, user) {
    let instructorId = null;
    if (user.role === 'instructor') {
      instructorId = user._id;
    }
    const result = await interviewRepository.deleteByCourse(course, instructorId);
    return result;
  },
};

module.exports = interviewService;
