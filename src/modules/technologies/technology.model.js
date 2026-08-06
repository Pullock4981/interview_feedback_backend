const mongoose = require('mongoose');

/**
 * Top level of the Technical Evaluation hierarchy (PRD Section 10):
 *   Technology -> Topic -> Question -> Evaluation
 *
 * Seed list: HTML, CSS, JavaScript, TypeScript, React, Next.js,
 * Node.js, Express.js, MongoDB (see seed/seed.js).
 */
const technologySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Technology', technologySchema);
