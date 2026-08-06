const mongoose = require('mongoose');

/**
 * Schema reserved for future use (PRD Section 15 - Notifications).
 * No delivery mechanism (email/in-app push) is implemented in this
 * MVP. The shape exists now so a future version can start writing to
 * and reading from this collection without a schema migration.
 *
 * MVP behavior: rows may be written here (e.g. by a future
 * NotificationService.send() call), but nothing currently reads or
 * delivers them - there is deliberately no route exposed for this
 * module yet.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // e.g. 'assignment', 'edit_alert'
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, readAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
