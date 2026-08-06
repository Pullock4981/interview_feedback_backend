const { z } = require('zod');
const { objectId } = require('../../common/utils/commonSchemas');

const createManagerNoteSchema = z.object({
  studentId: objectId.optional(),
  interviewId: objectId.optional(),
  note: z.string().trim().min(1, 'Note text is required'),
});

const studentIdParamSchema = z.object({ studentId: objectId });

module.exports = { createManagerNoteSchema, studentIdParamSchema };
