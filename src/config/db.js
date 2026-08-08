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
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!env.mongoUri) {
    logger.error('MONGO_URI is not set.');
    process.exit(1);
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(env.mongoUri, {
      autoIndex: env.nodeEnv !== 'production',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).then((mongoose) => {
      logger.info(`MongoDB connected: ${mongoose.connection.host}`);
      return mongoose;
    }).catch(err => {
      logger.error({ err }, 'MongoDB connection failed');
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = connectDB;
