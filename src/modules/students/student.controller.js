const studentService = require('./student.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');

const studentController = {
  list: catchAsync(async (req, res) => {
    const { items, total, page, pageSize } = await studentService.listStudents({
      user: req.user,
      ...req.query,
    });
    return sendSuccess(res, { data: items, meta: { page, pageSize, total } });
  }),

  getById: catchAsync(async (req, res) => {
    const student = await studentService.getStudentById(req.params.id, req.user);
    return sendSuccess(res, { data: student });
  }),

  import: catchAsync(async (req, res) => {
    const result = await studentService.importStudents({
      ...req.body,
      rows: req.body.rows ? req.body.rows.map(r => ({ ...r, assignedInstructorId: req.user._id })) : [],
      triggeredBy: req.user._id,
    });
    return sendSuccess(res, { statusCode: 201, data: result });
  }),

  assignInstructor: catchAsync(async (req, res) => {
    const student = await studentService.assignInstructor(req.params.id, req.body.instructorId);
    return sendSuccess(res, { data: student });
  }),

  update: catchAsync(async (req, res) => {
    const student = await studentService.updateStudent(req.params.id, req.body);
    return sendSuccess(res, { data: student });
  }),

  listImportLogs: catchAsync(async (req, res) => {
    const { items, total } = await studentService.listImportLogs(req.query);
    return sendSuccess(res, { data: items, meta: { total } });
  }),
};

module.exports = studentController;
