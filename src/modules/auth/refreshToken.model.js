const mongoose = require('mongoose');

/**
 * Refresh tokens are stored server-side (rather than only trusted as a
 * signed JWT) so that logging out or deactivating a user can instantly
 * revoke their long-lived session (PRD 14.1 / Security section) - a
 * stateless-only refresh token cannot be revoked before it expires.
 *
 * We store a hash of the token, never the raw token, so a DB leak
 * doesn't hand out valid sessions.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// TTL index: MongoDB automatically deletes expired refresh tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
