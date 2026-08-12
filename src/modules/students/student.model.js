const mongoose = require('mongoose');
const { STUDENT_SOURCES } = require('../../common/constants/enums');

/**
 * A Student record (PRD Section 7). Email is the duplicate-detection
 * key for the Google Sheets import process (student.service.js).
 */
const studentSchema = new mongoose.Schema(
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
    phone: { type: String, trim: true, default: null },
    course: { type: String, required: false, trim: true, default: 'N/A' },
    batch: { type: String, required: false, trim: true, default: 'N/A' },
    level: { type: String, required: false, trim: true, default: 'N/A' },
    slot: { type: String, trim: true, default: null },
    assignedInstructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, enum: STUDENT_SOURCES, default: 'google_sheet' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// email already has a unique index via `unique: true` above.
studentSchema.index({ assignedInstructor: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('Student', studentSchema);
