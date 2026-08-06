const logger = require('../utils/logger');
const env = require('../../config/env');

/**
 * Centralized error-handling middleware. Must be registered LAST in
 * app.js (after all routes) - Express recognizes it as an error handler
 * because it has 4 arguments (err, req, res, next).
 *
 * - Operational errors (AppError and subclasses) are returned as-is
 *   with their intended status code and error code.
 * - Mongoose-specific errors (CastError, ValidationError, duplicate key)
 *   are translated into friendly responses instead of leaking internals.
 * - Anything else is treated as an unexpected bug: logged in full,
 *   client only gets a generic 500 message (no stack trace leakage).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Something went wrong';
  let fields = err.fields || undefined;

  // Mongoose invalid ObjectId (e.g. /students/not-a-valid-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid value for ${err.path}: ${err.value}`;
  }

  // Mongoose schema validation errors
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    fields = Object.keys(err.errors);
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  }

  // Mongo duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate value violates a unique constraint';
    fields = field ? [field] : undefined;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  if (!err.isOperational) {
    // Unexpected/programmer error - log full detail for debugging
    logger.error({ err }, 'Unhandled error');
    if (env.nodeEnv === 'production' && statusCode === 500) {
      message = 'Something went wrong. Please try again later.';
    }
  } else {
    logger.warn({ code, statusCode, message }, 'Operational error');
  }

  return res.status(statusCode).json({
    success: false,
    data: null,
    error: { code, message, ...(fields ? { fields } : {}) },
  });
}

module.exports = errorHandler;
