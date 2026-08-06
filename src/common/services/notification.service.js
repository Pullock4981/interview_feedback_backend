const Notification = require('../../modules/notifications/notification.model');
const logger = require('../utils/logger');

/**
 * Reserved NotificationService interface (PRD Section 15 / 19.6).
 * The MVP implementation only persists a row - it does NOT send an
 * email or push anything. Swapping in real delivery later (e.g. an
 * email provider) means changing only the body of `send()`, not any
 * of its call sites elsewhere in the codebase.
 */
const NotificationService = {
  async send(userId, type, payload = {}) {
    const notification = await Notification.create({ user: userId, type, payload });
    logger.info({ userId, type }, 'Notification recorded (delivery not implemented in MVP)');
    return notification;
  },
};

module.exports = NotificationService;
