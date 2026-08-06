const { z } = require('zod');
const { objectId } = require('../../common/utils/commonSchemas');

const createTechnologySchema = z.object({
  name: z.string().trim().min(1).max(60),
});

const createTopicSchema = z.object({
  technologyId: objectId,
  name: z.string().trim().min(1).max(120),
});

const listTopicsQuerySchema = z.object({
  technologyId: objectId.optional(),
  search: z.string().trim().optional(),
  status: z.enum(['approved', 'pending']).optional(),
});

const createQuestionSchema = z.object({
  topicId: objectId,
  text: z.string().trim().min(1),
});

const listQuestionsQuerySchema = z.object({
  topicId: objectId.optional(),
  search: z.string().trim().optional(),
  status: z.enum(['approved', 'pending']).optional(),
});

module.exports = {
  createTechnologySchema,
  createTopicSchema,
  listTopicsQuerySchema,
  createQuestionSchema,
  listQuestionsQuerySchema,
};
