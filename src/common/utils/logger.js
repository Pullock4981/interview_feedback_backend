const pino = require('pino');
const env = require('../../config/env');

/**
 * Structured JSON logger (pino). Using structured logs instead of
 * console.log makes it possible to ship logs to something like
 * Grafana Loki / Datadog later without changing call sites.
 */
const logger = pino({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
});

module.exports = logger;
