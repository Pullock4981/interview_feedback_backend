const { z } = require('zod');
const { objectId, paginationSchema } = require('../../common/utils/commonSchemas');
const { INTERVIEW_STATUSES } = require('../../common/constants/enums');

const listInterviewsQuerySchema = paginationSchema.extend({
  status: z.enum(INTERVIEW_STATUSES).optional(),
  technologyId: objectId.optional(),
  dateFrom: z.string().datetime().optional().or(z.string().optional()),
  dateTo: z.string().datetime().optional().or(z.string().optional()),
});

const startInterviewParamSchema = z.object({ studentId: objectId });

const cancelInterviewSchema = z.object({
  reason: z.string().trim().min(1, 'A cancellation reason is required'),
});

module.exports = { listInterviewsQuerySchema, startInterviewParamSchema, cancelInterviewSchema };
