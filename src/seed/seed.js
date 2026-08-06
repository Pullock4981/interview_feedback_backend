/**
 * One-off seed script: creates the initial Technology catalog (PRD
 * Appendix 26.4) and, if none exists yet, a first Manager account so
 * you have a way to log in on a brand-new database.
 *
 * Usage:
 *   node src/seed/seed.js
 *
 * Reads MONGO_URI from .env like the rest of the app. Safe to re-run -
 * it skips technologies/users that already exist instead of duplicating.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const logger = require('../common/utils/logger');
const Technology = require('../modules/technologies/technology.model');
const User = require('../modules/users/user.model');
const { ROLES } = require('../common/constants/enums');

const SEED_TECHNOLOGIES = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Express.js',
  'MongoDB',
];

// Change these before running in a real environment, or set via env vars.
const DEFAULT_MANAGER = {
  name: process.env.SEED_MANAGER_NAME || 'System Manager',
  email: process.env.SEED_MANAGER_EMAIL || 'manager@programminghero.dev',
  password: process.env.SEED_MANAGER_PASSWORD || 'ChangeMe123!',
};

async function seed() {
  if (!env.mongoUri) {
    logger.error('MONGO_URI is not set - add it to .env before seeding.');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);
  logger.info('Connected to MongoDB for seeding');

  for (const name of SEED_TECHNOLOGIES) {
    const existing = await Technology.findOne({ name });
    if (existing) continue;
    await Technology.create({ name });
    logger.info(`Seeded technology: ${name}`);
  }

  const existingManager = await User.findOne({ role: ROLES.MANAGER });
  if (!existingManager) {
    const passwordHash = await bcrypt.hash(DEFAULT_MANAGER.password, env.bcryptSaltRounds);
    await User.create({
      name: DEFAULT_MANAGER.name,
      email: DEFAULT_MANAGER.email,
      passwordHash,
      role: ROLES.MANAGER,
    });
    logger.info(
      `Seeded default manager account: ${DEFAULT_MANAGER.email} / ${DEFAULT_MANAGER.password} (change this password immediately)`
    );
  } else {
    logger.info('A manager account already exists - skipping default manager creation');
  }

  await mongoose.disconnect();
  logger.info('Seeding complete');
}

seed().catch((err) => {
  logger.error({ err }, 'Seeding failed');
  process.exit(1);
});
