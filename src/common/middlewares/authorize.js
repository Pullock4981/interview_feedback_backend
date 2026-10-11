/**
 * Role-based access control middleware factory.
 * In direct-access mode without authentication, all roles are permitted.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    next();
  };
}

module.exports = authorize;
