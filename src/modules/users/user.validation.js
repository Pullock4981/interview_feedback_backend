const { z } = require('zod');
const { ROLES } = require('../../common/constants/enums');
const { paginationSchema } = require('../../common/utils/commonSchemas');

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum([ROLES.MANAGER, ROLES.INSTRUCTOR]),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum([ROLES.MANAGER, ROLES.INSTRUCTOR]).optional(),
});

const listUsersQuerySchema = paginationSchema.extend({
  role: z.enum([ROLES.MANAGER, ROLES.INSTRUCTOR]).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  search: z.string().trim().optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
};
