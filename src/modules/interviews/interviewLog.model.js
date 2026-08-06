const mongoose = require('mongoose');

/**
 * Append-only activity trail per interview (PRD 16.2 interview_logs
 * table) - e.g. 'started', 'draft_saved', 'submitted', 'cancelled'.
 * Used to power the Manager's "Recent Activity" / instructor activity
 * dashboards without having to diff timestamps across other tables.
 */
const interviewLogSchema = new mongoose.Schema(
  {
    interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true },
    action: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

interviewLogSchema.index({ interview: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewLog', interviewLogSchema);
