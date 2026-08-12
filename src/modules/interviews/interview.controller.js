const interviewService = require('./interview.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');

const interviewController = {
  start: catchAsync(async (req, res) => {
    const result = await interviewService.startInterview(req.params.studentId, req.user);
    return sendSuccess(res, { statusCode: 201, data: result });
  }),

  list: catchAsync(async (req, res) => {
    const { items, total, page, pageSize } = await interviewService.listInterviews({
      user: req.user,
      ...req.query,
    });
    return sendSuccess(res, { data: items, meta: { page, pageSize, total } });
  }),

  getById: catchAsync(async (req, res) => {
    const interview = await interviewService.getInterviewById(req.params.id, req.user);
    return sendSuccess(res, { data: interview });
  }),

  cancel: catchAsync(async (req, res) => {
    const interview = await interviewService.cancelInterview(
      req.params.id,
      req.body.reason,
      req.user
    );
    return sendSuccess(res, { data: interview });
  }),

  getLogs: catchAsync(async (req, res) => {
    const logs = await interviewService.getLogs(req.params.id);
    return sendSuccess(res, { data: logs });
  }),

  delete: catchAsync(async (req, res) => {
    const interview = await interviewService.deleteInterview(req.params.id, req.user);
    return sendSuccess(res, { data: interview });
  }),

  deleteByCourse: catchAsync(async (req, res) => {
    const result = await interviewService.deleteByCourse(req.params.courseName, req.user);
    return sendSuccess(res, { data: result });
  }),
};

module.exports = interviewController;
