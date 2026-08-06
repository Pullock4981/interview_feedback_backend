const technologyService = require('./technology.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');

const technologyController = {
  createTechnology: catchAsync(async (req, res) => {
    const technology = await technologyService.createTechnology(req.body);
    return sendSuccess(res, { statusCode: 201, data: technology });
  }),

  listTechnologies: catchAsync(async (req, res) => {
    const technologies = await technologyService.listTechnologies();
    return sendSuccess(res, { data: technologies });
  }),

  createTopic: catchAsync(async (req, res) => {
    const topic = await technologyService.createTopic({ ...req.body, user: req.user });
    return sendSuccess(res, { statusCode: 201, data: topic });
  }),

  listTopics: catchAsync(async (req, res) => {
    const topics = await technologyService.listTopics(req.query);
    return sendSuccess(res, { data: topics });
  }),

  approveTopic: catchAsync(async (req, res) => {
    const topic = await technologyService.approveTopic(req.params.id);
    return sendSuccess(res, { data: topic });
  }),

  createQuestion: catchAsync(async (req, res) => {
    const question = await technologyService.createQuestion({ ...req.body, user: req.user });
    return sendSuccess(res, { statusCode: 201, data: question });
  }),

  listQuestions: catchAsync(async (req, res) => {
    const questions = await technologyService.listQuestions(req.query);
    return sendSuccess(res, { data: questions });
  }),

  approveQuestion: catchAsync(async (req, res) => {
    const question = await technologyService.approveQuestion(req.params.id);
    return sendSuccess(res, { data: question });
  }),
};

module.exports = technologyController;
