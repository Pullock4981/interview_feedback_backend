const express = require('express');
const authController = require('./auth.controller');
const authenticate = require('../../common/middlewares/authenticate');
const validateRequest = require('../../common/middlewares/validateRequest');
const { authLimiter } = require('../../common/middlewares/rateLimiter');
const {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  registerSchema
} = require('./auth.validation');

const router = express.Router();

// Auth endpoints get the stricter rate limiter (brute-force protection)
router.post('/register', authLimiter, validateRequest({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post(
  '/forgot-password',
  authLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword
);
router.get('/me', authenticate, authController.me);

module.exports = router;
