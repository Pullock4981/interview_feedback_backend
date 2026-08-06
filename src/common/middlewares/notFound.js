const { NotFoundError } = require('../utils/AppError');

/**
 * Catches any request that didn't match a route and forwards a
 * consistent 404 through the same errorHandler pipeline, instead of
 * Express's default HTML "Cannot GET /..." page.
 */
function notFound(req, res, next) {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
