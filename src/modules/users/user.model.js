const mongoose = require('mongoose');
const { ROLES } = require('../../common/constants/enums');

/**
 * A User is either a Manager or an Instructor (see PRD Section 4).
 * There is no separate "Instructor" collection - role is a field here.
 *
 * passwordHash is never returned by default (`select: false`) so a
 * stray `User.find()` elsewhere in the codebase can't accidentally
 * leak hashes in an API response.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

// email already has a unique index via `unique: true` above.
// Additional composite index for role/status filtering (Manager account list).
userSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);
