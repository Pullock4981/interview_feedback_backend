const mongoose = require('mongoose');

/**
 * One row per import job run (PRD 7.5). Lets Managers audit every
 * Google Sheets import: who ran it, how many rows were created /
 * updated / skipped / errored, and why.
 */
const studentImportLogSchema = new mongoose.Schema(
  {
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sourceSheetId: { type: String, required: true },
    createdCount: { type: Number, default: 0 },
    updatedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    errorDetails: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentImportLog', studentImportLogSchema);
