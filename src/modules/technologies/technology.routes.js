const express = require('express');
const technologyController = require('./technology.controller');
const authenticate = require('../../common/middlewares/authenticate');
const authorize = require('../../common/middlewares/authorize');
const validateRequest = require('../../common/middlewares/validateRequest');
const { ROLES } = require('../../common/constants/enums');
const { idParamSchema } = require('../../common/utils/commonSchemas');
const {
  createTechnologySchema,
  createTopicSchema,
  listTopicsQuerySchema,
  createQuestionSchema,
  listQuestionsQuerySchema,
} = require('./technology.validation');

const router = express.Router();

router.use(authenticate); // all routes below require a logged-in user

// Technologies - Manager creates, both roles can view (PRD 17.5)
router.get('/', technologyController.listTechnologies);
router.post(
  '/',
  authorize(ROLES.MANAGER),
  validateRequest({ body: createTechnologySchema }),
  technologyController.createTechnology
);

// Topics
router.get(
  '/topics',
  validateRequest({ query: listTopicsQuerySchema }),
  technologyController.listTopics
);
router.post('/topics', validateRequest({ body: createTopicSchema }), technologyController.createTopic);
router.patch(
  '/topics/:id/approve',
  authorize(ROLES.MANAGER),
  validateRequest({ params: idParamSchema }),
  technologyController.approveTopic
);

// Questions
router.get(
  '/questions',
  validateRequest({ query: listQuestionsQuerySchema }),
  technologyController.listQuestions
);
router.post(
  '/questions',
  validateRequest({ body: createQuestionSchema }),
  technologyController.createQuestion
);
router.patch(
  '/questions/:id/approve',
  authorize(ROLES.MANAGER),
  validateRequest({ params: idParamSchema }),
  technologyController.approveQuestion
);

module.exports = router;
