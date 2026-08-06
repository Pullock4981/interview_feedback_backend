const rateLimit = require('express-rate-limit');
const env = require('../../config/env');

/**
 * General API rate limiter - applied globally in app.js.
 * Loose enough not to interfere with normal dashboard/list usage.
 */
const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
  },
});

/**
 * Stricter limiter for auth endpoints (login, forgot-password) to slow
 * down brute-force / credential-stuffing attempts, per Security section
 * of the PRD (5 attempts / 15 min default).
 */
const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

module.exports = { generalLimiter, authLimiter };
