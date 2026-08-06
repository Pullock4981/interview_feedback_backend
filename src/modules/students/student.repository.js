const Student = require('./student.model');
const StudentImportLog = require('./studentImportLog.model');

const studentRepository = {
  create(data) {
    return Student.create(data);
  },

  findById(id) {
    return Student.findById(id).populate('assignedInstructor', 'name email');
  },

  findByEmail(email) {
    return Student.findOne({ email: email.toLowerCase().trim() });
  },

  async list({
    instructorId, // scoping: if set, only this instructor's students
    status, // note: status lives on Interview, so status filtering happens in interview.service if needed
    course,
    batch,
    search,
    page = 1,
    pageSize = 20,
  } = {}) {
    const filter = {};
    if (instructorId) filter.assignedInstructor = instructorId;
    if (course) filter.course = course;
    if (batch) filter.batch = batch;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      Student.find(filter)
        .populate('assignedInstructor', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Student.countDocuments(filter),
    ]);

    return { items, total };
  },

  updateById(id, updates) {
    return Student.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate(
      'assignedInstructor',
      'name email'
    );
  },

  assignInstructor(id, instructorId) {
    return Student.findByIdAndUpdate(
      id,
      { assignedInstructor: instructorId },
      { new: true }
    ).populate('assignedInstructor', 'name email');
  },

  // --- Import logs ---
  createImportLog(data) {
    return StudentImportLog.create(data);
  },

  listImportLogs({ page = 1, pageSize = 20 } = {}) {
    const skip = (page - 1) * pageSize;
    return Promise.all([
      StudentImportLog.find()
        .populate('triggeredBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      StudentImportLog.countDocuments(),
    ]).then(([items, total]) => ({ items, total }));
  },
};

module.exports = studentRepository;
