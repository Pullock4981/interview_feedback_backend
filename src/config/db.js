const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../common/utils/logger');

/**
 * Connects to MongoDB via Mongoose.
 *
 * MONGO_URI is expected in .env (see .env.example). This function is
 * called once from server.js on boot. We deliberately do NOT retry
 * forever in a silent loop - if the DB is unreachable we want the
 * process to log clearly and exit, so orchestration (Docker/PM2/etc.)
 * can restart it and surface the failure instead of the app limping
 * along without a database.
 */
async function connectDB() {
  if (!env.mongoUri) {
    logger.error(
      'MONGO_URI is not set. Add your MongoDB connection string to .env before starting the server.'
    );
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: env.nodeEnv !== 'production',
    });

    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    logger.error({ err }, 'MongoDB connection failed');
    // Don't exit process in serverless, just throw error
    throw err;
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });
}

module.exports = connectDB;
