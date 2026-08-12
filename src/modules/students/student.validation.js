const { z } = require('zod');
const { objectId, paginationSchema } = require('../../common/utils/commonSchemas');

const listStudentsQuerySchema = paginationSchema.extend({
  course: z.string().trim().optional(),
  batch: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

const importStudentsSchema = z.object({
  sourceSheetId: z.string().trim().min(1, 'sourceSheetId is required'),
  mergePolicy: z.enum(['merge', 'skip']).optional().default('merge'),
  rows: z
    .array(
      z.object({
        name: z.string().trim().optional(),
        email: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        course: z.string().trim().optional(),
        batch: z.string().trim().optional(),
        slot: z.string().trim().optional(),
        assignedInstructorId: objectId.optional(),
      })
    )
    .min(1, 'At least one row is required'),
});

const assignInstructorSchema = z.object({
  instructorId: objectId,
});

const updateStudentSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().optional(),
  course: z.string().trim().optional(),
  batch: z.string().trim().optional(),
  slot: z.string().trim().optional(),
});

const createManualStudentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  course: z.string().trim().optional(),
  level: z.string().trim().optional(),
  batch: z.string().trim().optional(),
});

module.exports = {
  listStudentsQuerySchema,
  importStudentsSchema,
  assignInstructorSchema,
  updateStudentSchema,
  createManualStudentSchema,
};
