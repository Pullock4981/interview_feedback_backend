const ManagerNote = require('./managerNote.model');

const managerNoteRepository = {
  create(data) {
    return ManagerNote.create(data);
  },
  listByStudent(studentId) {
    return ManagerNote.find({ student: studentId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
  },
};

module.exports = managerNoteRepository;
