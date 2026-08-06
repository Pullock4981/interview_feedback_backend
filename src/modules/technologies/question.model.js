const mongoose = require('mongoose');
const { CATALOG_STATUSES } = require('../../common/constants/enums');

/**
 * A Question belongs to exactly one Topic and is reused across many
 * interviews (it's a catalog entry, not free text typed per-interview -
 * see PRD 10.1). Evaluations reference a Question by id.
 */
const questionSchema = new mongoose.Schema(
  {
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    text: { type: String, required: true, trim: true },
    status: { type: String, enum: CATALOG_STATUSES, default: 'approved' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

questionSchema.index({ topic: 1 });
// Full-text-ish search on question text
questionSchema.index({ text: 'text' });

module.exports = mongoose.model('Question', questionSchema);
