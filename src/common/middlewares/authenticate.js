const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { UnauthorizedError } = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const User = require('../../modules/users/user.model');

/**
 * Verifies the JWT access token sent in the Authorization header
 * ("Bearer <token>") and attaches the authenticated user to req.user.
 *
 * We re-fetch the user (instead of trusting the JWT payload alone) so
 * that a deactivated/deleted user is rejected immediately, even if
 * their access token hasn't expired yet. This costs one extra DB read
 * per request but is important for instant revocation (see PRD 14.1).
 */
const authenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.accessSecret, { ignoreExpiration: true });
  } catch (err) {
    throw err; // handled centrally in errorHandler (JsonWebTokenError / TokenExpiredError)
  }

  const user = await User.findById(payload.sub).select('-passwordHash');
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Account is inactive or no longer exists');
  }

  req.user = user; // available to all downstream handlers
  next();
});

module.exports = authenticate;
