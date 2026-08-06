const { z } = require('zod');

/**
 * Reusable Zod fragments shared across module validation files, so the
 * ObjectId / pagination rules aren't redefined slightly differently in
 * every module.
 */
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Mongo ObjectId');

const idParamSchema = z.object({ id: objectId });

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(10000).optional().default(20),
});

module.exports = { objectId, idParamSchema, paginationSchema };
