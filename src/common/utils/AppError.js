/**
 * Base class for all operational (expected) errors thrown by the app.
 *
 * Controllers/services throw these instead of generic Error so the
 * centralized errorHandler middleware can turn them into a consistent
 * HTTP response. Anything that is NOT an AppError is treated as an
 * unexpected bug and gets logged with full detail + a generic 500.
 */
class AppError extends Error {
  constructor(message, statusCode, code = 'APP_ERROR', fields = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields; // optional array of field names, useful for validation errors
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', fields = null) {
    super(message, 400, 'VALIDATION_ERROR', fields);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
};
