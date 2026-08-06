const mongoose = require('mongoose');

/**
 * Immutable, append-only log of every Manager edit to a Final feedback
 * record (PRD FR-13 / FR-18). `diff` stores a before/after snapshot of
 * only the changed fields so Managers can review exactly what changed,
 * who changed it, and why (optional edit_reason).
 */
const feedbackAuditLogSchema = new mongoose.Schema(
  {
    feedback: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback', required: true },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diff: {
      before: { type: mongoose.Schema.Types.Mixed, required: true },
      after: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    editReason: { type: String, default: null },
  },
  { timestamps: true }
);

feedbackAuditLogSchema.index({ feedback: 1, createdAt: -1 });

module.exports = mongoose.model('FeedbackAuditLog', feedbackAuditLogSchema);
