const Interview = require('./interview.model');
const InterviewLog = require('./interviewLog.model');

const ACTIVE_STATUSES = ['Pending', 'Assigned', 'Interview Started', 'Draft Saved'];

const interviewRepository = {
  create(data) {
    return Interview.create(data);
  },

  findById(id) {
    return Interview.findById(id)
      .populate('student')
      .populate('instructor', 'name email');
  },

  /** Used to enforce "only one active interview per student at a time". */
  findActiveForStudent(studentId) {
    return Interview.findOne({ student: studentId, status: { $in: ACTIVE_STATUSES } });
  },

  async list({ instructorId, status, technologyId, dateFrom, dateTo, page = 1, pageSize = 20 } = {}) {
    const filter = {};
    if (instructorId) filter.instructor = instructorId;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    // technologyId filtering requires a join through feedback/evaluations -
    // handled at the service layer via a secondary query, kept out of this
    // simple repository method to avoid an expensive $lookup on every list call.

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      Interview.find(filter)
        .populate('student', 'name email course batch')
        .populate('instructor', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Interview.countDocuments(filter),
    ]);
    return { items, total };
  },

  updateById(id, updates) {
    return Interview.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  },

  addLog(data) {
    return InterviewLog.create(data);
  },

  listLogs(interviewId) {
    return InterviewLog.find({ interview: interviewId })
      .populate('actor', 'name email')
      .sort({ createdAt: -1 });
  },

  countByInstructorAndStatus(instructorId, status) {
    return Interview.countDocuments({ instructor: instructorId, status });
  },
};

module.exports = interviewRepository;
