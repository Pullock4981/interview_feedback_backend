const feedbackService = require('./feedback.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');

const feedbackController = {
  getByInterview: catchAsync(async (req, res) => {
    const { feedback, evaluations } = await feedbackService.getByInterviewId(
      req.params.interviewId,
      req.user
    );
    return sendSuccess(res, { data: { feedback, evaluations } });
  }),

  saveDraft: catchAsync(async (req, res) => {
    const feedback = await feedbackService.saveDraft(req.params.interviewId, req.body, req.user);
    return sendSuccess(res, { data: feedback });
  }),

  submitFinal: catchAsync(async (req, res) => {
    const feedback = await feedbackService.submitFinal(
      req.params.interviewId,
      req.body,
      req.user
    );
    return sendSuccess(res, { data: feedback });
  }),

  managerEdit: catchAsync(async (req, res) => {
    const { editReason, ...payload } = req.body;
    const feedback = await feedbackService.managerEdit(
      req.params.interviewId,
      payload,
      req.user,
      editReason
    );
    return sendSuccess(res, { data: feedback });
  }),

  getAuditLog: catchAsync(async (req, res) => {
    const { feedback } = await feedbackService.getByInterviewId(req.params.interviewId, req.user);
    const logs = await feedbackService.getAuditLog(feedback._id);
    return sendSuccess(res, { data: logs });
  }),

  upsertEvaluation: catchAsync(async (req, res) => {
    const evaluation = await feedbackService.upsertEvaluation(
      req.params.interviewId,
      req.body,
      req.user
    );
    return sendSuccess(res, { statusCode: 201, data: evaluation });
  }),

  removeEvaluation: catchAsync(async (req, res) => {
    const result = await feedbackService.removeEvaluation(
      req.params.interviewId,
      req.params.id,
      req.user
    );
    return sendSuccess(res, { data: result });
  }),

  getTechnicalSummary: catchAsync(async (req, res) => {
    const summary = await feedbackService.getTechnicalSummary(req.params.interviewId, req.user);
    return sendSuccess(res, { data: summary });
  }),
};

module.exports = feedbackController;
