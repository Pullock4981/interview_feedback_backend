const managerNoteService = require('./managerNote.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');

const managerNoteController = {
  create: catchAsync(async (req, res) => {
    const note = await managerNoteService.createNote({ ...req.body, author: req.user });
    return sendSuccess(res, { statusCode: 201, data: note });
  }),

  listForStudent: catchAsync(async (req, res) => {
    const notes = await managerNoteService.listNotesForStudent(req.params.studentId);
    return sendSuccess(res, { data: notes });
  }),
};

module.exports = managerNoteController;
