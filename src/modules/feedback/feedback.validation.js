const { z } = require('zod');
const { objectId } = require('../../common/utils/commonSchemas');
const { LEVELS, RECOMMENDATIONS, EVALUATION_RESULTS } = require('../../common/constants/enums');

const levelEnum = z.enum(LEVELS).nullable().optional();

/**
 * Draft schema: every field optional (FR-06 / PRD 9.8) - only
 * type/enum correctness is enforced. Full "required on submit"
 * validation happens in feedback.service.js at submit time, not here,
 * because that check also needs to look at the evaluation count.
 */
const feedbackDraftSchema = z.object({
  bengaliLevel: levelEnum,
  bengaliComment: z.string().nullable().optional(),
  englishLevel: levelEnum,
  englishComment: z.string().nullable().optional(),

  communicationLevel: levelEnum,
  communicationComment: z.string().nullable().optional(),

  cameraOn: z.boolean().nullable().optional(),
  eyeContact: levelEnum,
  cameraAngle: levelEnum,
  lighting: levelEnum,
  backgroundLevel: levelEnum,
  faceVisibility: levelEnum,
  cameraComment: z.string().nullable().optional(),

  behaviourLevel: levelEnum,
  behaviourComment: z.string().nullable().optional(),

  problemSolvingLevel: z.string().nullable().optional(),
  problemSolvingComment: z.string().nullable().optional(),

  interpersonalLevel: levelEnum,
  interpersonalComment: z.string().nullable().optional(),

  technicalEvaluation: z.any().optional(),

  finalRecommendation: z.enum(RECOMMENDATIONS).nullable().optional(),
  finalComment: z.string().nullable().optional(),
});

// Final submit accepts the same shape - required-ness is enforced in the service layer
const feedbackSubmitSchema = feedbackDraftSchema;

const managerEditSchema = feedbackDraftSchema.extend({
  editReason: z.string().trim().optional(),
});

const upsertEvaluationSchema = z.object({
  questionId: objectId,
  result: z.enum(EVALUATION_RESULTS),
  comment: z.string().trim().optional(),
});

const interviewIdParamSchema = z.object({ interviewId: objectId });
const evaluationIdParamSchema = z.object({ interviewId: objectId, id: objectId });

module.exports = {
  feedbackDraftSchema,
  feedbackSubmitSchema,
  managerEditSchema,
  upsertEvaluationSchema,
  interviewIdParamSchema,
  evaluationIdParamSchema,
};
