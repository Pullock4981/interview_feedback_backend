const managerNoteRepository = require('./managerNote.repository');

const managerNoteService = {
  createNote({ studentId, interviewId, note, author }) {
    return managerNoteRepository.create({
      student: studentId || null,
      interview: interviewId || null,
      note,
      author: author._id,
    });
  },

  listNotesForStudent(studentId) {
    return managerNoteRepository.listByStudent(studentId);
  },
};

module.exports = managerNoteService;
