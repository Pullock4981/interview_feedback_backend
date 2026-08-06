const express = require('express');
const feedbackController = require('./feedback.controller');
const authenticate = require('../../common/middlewares/authenticate');
const authorize = require('../../common/middlewares/authorize');
const validateRequest = require('../../common/middlewares/validateRequest');
const { ROLES } = require('../../common/constants/enums');
const {
  feedbackDraftSchema,
  feedbackSubmitSchema,
  managerEditSchema,
  upsertEvaluationSchema,
  interviewIdParamSchema,
  evaluationIdParamSchema,
} = require('./feedback.validation');

const router = express.Router();

router.use(authenticate);

router.get(
  '/:interviewId',
  validateRequest({ params: interviewIdParamSchema }),
  feedbackController.getByInterview
);

router.get(
  '/:interviewId/summary',
  validateRequest({ params: interviewIdParamSchema }),
  feedbackController.getTechnicalSummary
);

router.patch(
  '/:interviewId/draft',
  authorize(ROLES.INSTRUCTOR),
  validateRequest({ params: interviewIdParamSchema, body: feedbackDraftSchema }),
  feedbackController.saveDraft
);

router.post(
  '/:interviewId/submit',
  authorize(ROLES.INSTRUCTOR),
  validateRequest({ params: interviewIdParamSchema, body: feedbackSubmitSchema }),
  feedbackController.submitFinal
);

router.patch(
  '/:interviewId',
  authorize(ROLES.MANAGER),
  validateRequest({ params: interviewIdParamSchema, body: managerEditSchema }),
  feedbackController.managerEdit
);

router.get(
  '/:interviewId/audit-log',
  authorize(ROLES.MANAGER),
  validateRequest({ params: interviewIdParamSchema }),
  feedbackController.getAuditLog
);

router.post(
  '/:interviewId/evaluations',
  authorize(ROLES.INSTRUCTOR),
  validateRequest({ params: interviewIdParamSchema, body: upsertEvaluationSchema }),
  feedbackController.upsertEvaluation
);

router.delete(
  '/:interviewId/evaluations/:id',
  authorize(ROLES.INSTRUCTOR),
  validateRequest({ params: evaluationIdParamSchema }),
  feedbackController.removeEvaluation
);

module.exports = router;
