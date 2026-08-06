const mongoose = require('mongoose');
const { LEVELS, RECOMMENDATIONS, FEEDBACK_STATUSES } = require('../../common/constants/enums');

/**
 * The Feedback form (PRD Section 9). One Feedback document per
 * Interview (1:1, unique index on `interview`).
 *
 * Design decision (PRD 16.1): Draft and Final are NOT separate
 * collections - a single document represents both states via `status`
 * ('draft' | 'final'). Submitting final is just a status flip plus a
 * `submittedAt` timestamp, avoiding data duplication/migration when a
 * draft becomes final.
 *
 * Every field below is optional at the schema level on purpose: full
 * validation (all Level fields required, etc. - PRD 9.8) is enforced
 * in feedback.service.js at "Submit Final" time, NOT here, because a
 * Draft must be saveable with only some fields filled in.
 */
const feedbackSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
    },
    status: { type: String, enum: FEEDBACK_STATUSES, default: 'draft' },

    // --- Language ---
    bengaliLevel: { type: String, enum: LEVELS, default: null },
    bengaliComment: { type: String, default: null },
    englishLevel: { type: String, enum: LEVELS, default: null },
    englishComment: { type: String, default: null },

    // --- Communication ---
    communicationLevel: { type: String, enum: LEVELS, default: null },
    communicationComment: { type: String, default: null },

    // --- Camera & Environment ---
    cameraOn: { type: Boolean, default: null },
    eyeContact: { type: String, enum: LEVELS, default: null },
    cameraAngle: { type: String, enum: LEVELS, default: null },
    lighting: { type: String, enum: LEVELS, default: null },
    backgroundLevel: { type: String, enum: LEVELS, default: null },
    faceVisibility: { type: String, enum: LEVELS, default: null },
    cameraComment: { type: String, default: null },

    // --- Behaviour ---
    behaviourLevel: { type: String, enum: LEVELS, default: null },
    behaviourComment: { type: String, default: null },

    // --- Problem Solving ---
    problemSolvingLevel: { type: String, default: null },
    problemSolvingComment: { type: String, default: null },

    // --- Interpersonal ---
    interpersonalLevel: { type: String, enum: LEVELS, default: null },
    interpersonalComment: { type: String, default: null },

    // --- Technical Evaluation ---
    technicalEvaluation: { type: mongoose.Schema.Types.Mixed, default: {} },

    // --- Final Recommendation ---
    finalRecommendation: { type: String, enum: RECOMMENDATIONS, default: null },
    finalComment: { type: String, default: null },

    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// interview already has a unique index via `unique: true` above.
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ finalRecommendation: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
