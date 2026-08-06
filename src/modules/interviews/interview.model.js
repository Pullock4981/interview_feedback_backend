const mongoose = require('mongoose');
const { INTERVIEW_STATUSES } = require('../../common/constants/enums');

/**
 * An Interview ties one Student to one Instructor for a single attempt
 * (PRD Section 8). A student may have multiple Interview records over
 * time (re-interviews), but only one active (non-cancelled,
 * non-completed) interview at a time - enforced in interview.service.js
 * rather than at the schema level, since Mongoose can't easily express
 * "at most one matching sibling" as a schema constraint.
 */
const interviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: INTERVIEW_STATUSES, default: 'Assigned' },
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledReason: { type: String, default: null },
  },
  { timestamps: true }
);

interviewSchema.index({ student: 1, status: 1 });
interviewSchema.index({ instructor: 1, status: 1 });
interviewSchema.index({ status: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
