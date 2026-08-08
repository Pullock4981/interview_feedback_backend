const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./common/utils/logger');

/**
 * Process entry point: connect to MongoDB first, then start listening.
 * Keeping this separate from app.js means app.js (the Express app
 * itself) can be imported and tested (e.g. with supertest) without
 * opening a real network port or requiring a live DB connection.
 */
async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    logger.info(`EvaLens backend listening on port ${env.port} (${env.nodeEnv})`);
  });

  // Graceful shutdown - let in-flight requests finish before exiting
  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error({ err }, 'Unhandled promise rejection - shutting down');
    server.close(() => process.exit(1));
  });
}

start();
