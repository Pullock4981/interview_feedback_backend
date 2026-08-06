const { ForbiddenError } = require('../utils/AppError');

/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.post('/', authenticate, authorize('manager'), controller.create);
 *   router.get('/', authenticate, authorize('manager', 'instructor'), controller.list);
 *
 * Must run AFTER `authenticate` so req.user is already populated.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      // Defensive check - should never happen if authenticate ran first
      return next(new ForbiddenError('User context missing'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Role "${req.user.role}" is not permitted to perform this action`)
      );
    }
    return next();
  };
}

module.exports = authorize;
