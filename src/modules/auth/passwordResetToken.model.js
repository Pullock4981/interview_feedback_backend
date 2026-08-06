const mongoose = require('mongoose');

/**
 * Single-use, time-limited password reset tokens (PRD 14.3).
 * Only the hash is stored; the raw token is emailed to the user and
 * never persisted, so a DB read alone can't be used to reset a password.
 */
const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
