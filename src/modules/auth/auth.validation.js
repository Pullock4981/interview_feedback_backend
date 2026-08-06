const { z } = require('zod');
const { ROLES } = require('../../common/constants/enums');

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([ROLES.INSTRUCTOR, ROLES.MANAGER]).default(ROLES.INSTRUCTOR),
});

module.exports = { loginSchema, forgotPasswordSchema, resetPasswordSchema, registerSchema };
