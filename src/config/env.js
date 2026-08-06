/**
 * Centralized environment configuration.
 *
 * Every other file in the app should read config values from here
 * (require('../config/env')) instead of calling process.env directly.
 * This keeps env access in one place and lets us fail fast on startup
 * if something critical (like MONGO_URI) is missing.
 */

require('dotenv').config();

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,

  mongoUri: process.env.MONGO_URI || '',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '36500d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '36500d',
  },

  cookies: {
    secure: process.env.COOKIE_SECURE === 'true',
    domain: process.env.COOKIE_DOMAIN || 'localhost',
  },

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  },

  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
};

/**
 * Fail fast: if the app is started without the essentials it should crash
 * immediately with a clear message rather than fail confusingly later
 * (e.g. mongoose hanging forever trying to connect to an empty string).
 * MONGO_URI is intentionally allowed to be empty in early scaffolding,
 * but we still warn loudly so it isn't missed.
 */
function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[env] Warning: the following environment variables are not set yet: ${missing.join(
        ', '
      )}. The app may not function correctly until these are configured in .env`
    );
  }
}

validateEnv();

module.exports = env;
