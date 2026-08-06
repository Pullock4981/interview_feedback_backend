const express = require('express');
const interviewController = require('./interview.controller');
const authenticate = require('../../common/middlewares/authenticate');
const authorize = require('../../common/middlewares/authorize');
const validateRequest = require('../../common/middlewares/validateRequest');
const { ROLES } = require('../../common/constants/enums');
const { idParamSchema } = require('../../common/utils/commonSchemas');
const {
  listInterviewsQuerySchema,
  startInterviewParamSchema,
  cancelInterviewSchema,
} = require('./interview.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', validateRequest({ query: listInterviewsQuerySchema }), interviewController.list);

router.post(
  '/:studentId/start',
  authorize(ROLES.INSTRUCTOR),
  validateRequest({ params: startInterviewParamSchema }),
  interviewController.start
);

router.get('/:id', validateRequest({ params: idParamSchema }), interviewController.getById);
router.get('/:id/logs', validateRequest({ params: idParamSchema }), interviewController.getLogs);

router.patch(
  '/:id/cancel',
  validateRequest({ params: idParamSchema, body: cancelInterviewSchema }),
  interviewController.cancel
);

module.exports = router;
