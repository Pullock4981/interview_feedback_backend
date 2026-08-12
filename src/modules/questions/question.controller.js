const questionService = require('./question.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');

const questionController = {
  create: catchAsync(async (req, res) => {
    const qb = await questionService.createQuestionBank(req.body, req.user._id);
    return sendSuccess(res, { statusCode: 201, data: qb });
  }),
  list: catchAsync(async (req, res) => {
    const qbs = await questionService.listQuestionBanks(req.user._id);
    return sendSuccess(res, { data: qbs });
  }),
  getById: catchAsync(async (req, res) => {
    const qb = await questionService.getQuestionBankById(req.params.id, req.user._id);
    return sendSuccess(res, { data: qb });
  }),
  update: catchAsync(async (req, res) => {
    const qb = await questionService.updateQuestionBank(req.params.id, req.body, req.user._id);
    return sendSuccess(res, { data: qb });
  }),
  delete: catchAsync(async (req, res) => {
    await questionService.deleteQuestionBank(req.params.id, req.user._id);
    return sendSuccess(res, { message: 'Deleted successfully' });
  }),
};

module.exports = questionController;
