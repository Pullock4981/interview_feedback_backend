const mongoose = require('mongoose');
const { CATALOG_STATUSES } = require('../../common/constants/enums');

/**
 * A Topic belongs to exactly one Technology (e.g. "Closures" under
 * JavaScript). Instructor-created topics start as "pending" and need
 * Manager approval (catalog governance, PRD 10.1) unless the creator
 * is a Manager, in which case they're auto-approved.
 */
const topicSchema = new mongoose.Schema(
  {
    technology: { type: mongoose.Schema.Types.ObjectId, ref: 'Technology', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: CATALOG_STATUSES, default: 'approved' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// A topic name should be unique within its technology (not globally -
// "Basics" could reasonably exist under both HTML and CSS).
topicSchema.index({ technology: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Topic', topicSchema);
