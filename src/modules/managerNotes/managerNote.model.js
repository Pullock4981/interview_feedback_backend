const mongoose = require('mongoose');

/**
 * Free-form notes a Manager can attach to a Student and/or Interview
 * (PRD 16.2 manager_notes table) - e.g. "flagged for re-interview next
 * cohort". Not shown to instructors; Manager-only feature.
 */
const managerNoteSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    interview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', default: null },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

managerNoteSchema.index({ student: 1 });
managerNoteSchema.index({ interview: 1 });

module.exports = mongoose.model('ManagerNote', managerNoteSchema);
