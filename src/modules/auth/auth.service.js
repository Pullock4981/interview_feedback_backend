const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ms = require('./ms.util');
const env = require('../../config/env');
const userRepository = require('../users/user.repository');
const RefreshToken = require('./refreshToken.model');
const PasswordResetToken = require('./passwordResetToken.model');
const { UnauthorizedError, NotFoundError, ConflictError } = require('../../common/utils/AppError');
const logger = require('../../common/utils/logger');

/**
 * Issues a short-lived access token carrying the user's id and role.
 * Role is embedded for convenience, but authorize() should not be the
 * only gate on sensitive actions - authenticate.js re-checks isActive
 * against the DB on every request, so a stale claim in an old token
 * can't outlive a deactivation.
 */
function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a raw refresh token (sent to the client as an httpOnly
 * cookie) and stores only its hash + expiry in the DB, so it can be
 * looked up and revoked without ever persisting the usable secret.
 */
async function issueRefreshToken(user) {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ms(env.jwt.refreshExpiresIn));

  await RefreshToken.create({ user: user._id, tokenHash, expiresAt });
  return rawToken;
}

const authService = {
  async register({ name, email, password, role }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
    
    const user = await userRepository.create({
      name,
      email,
      passwordHash,
      role,
      isActive: true,
    });

    const accessToken = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user);

    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    return { accessToken, refreshToken, user: safeUser };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, { withPassword: true });
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user);

    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    return { accessToken, refreshToken, user: safeUser };
  },

  async refresh(rawRefreshToken) {
    if (!rawRefreshToken) throw new UnauthorizedError('Refresh token missing');

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await RefreshToken.findOne({ tokenHash }).populate('user');

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is invalid or expired');
    }
    if (!stored.user || !stored.user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    const accessToken = signAccessToken(stored.user);
    return { accessToken };
  },

  /**
   * Logout revokes the specific refresh token presented, rather than
   * deleting it outright, so we retain an audit trail of session ends.
   */
  async logout(rawRefreshToken) {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshToken.updateOne({ tokenHash }, { revokedAt: new Date() });
  },

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    // Deliberately do not throw NotFoundError here - responding
    // differently for "user exists" vs "user doesn't exist" lets an
    // attacker enumerate valid emails. Always respond success upstream.
    if (!user) {
      logger.info({ email }, 'Password reset requested for unknown email (ignored)');
      return null;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await PasswordResetToken.create({ user: user._id, tokenHash, expiresAt });

    // MVP: email delivery is out of scope (PRD Section 15) - the raw
    // token is returned to the caller/logged so it can be wired into
    // an email service later without changing this function's contract.
    logger.info({ userId: user._id }, 'Password reset token generated (delivery not implemented)');
    return rawToken;
  },

  async resetPassword({ token, newPassword }) {
    const tokenHash = hashToken(token);
    const resetRecord = await PasswordResetToken.findOne({ tokenHash });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Reset token is invalid or expired');
    }

    const user = await userRepository.findById(resetRecord.user);
    if (!user) throw new NotFoundError('User not found');

    const passwordHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    await userRepository.updateById(user._id, { passwordHash });

    resetRecord.usedAt = new Date();
    await resetRecord.save();

    // Revoke all existing refresh tokens so other sessions can't
    // continue using the old credentials assumption.
    await RefreshToken.updateMany(
      { user: user._id, revokedAt: null },
      { revokedAt: new Date() }
    );
  },
};

module.exports = authService;
