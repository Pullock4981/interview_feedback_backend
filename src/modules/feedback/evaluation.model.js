const mongoose = require('mongoose');
const { EVALUATION_RESULTS } = require('../../common/constants/enums');

/**
 * One row per (Feedback, Question) pair - the bottom of the
 * Technology -> Topic -> Question -> Evaluation hierarchy (PRD Section
 * 10). The unique compound index prevents the same question being
 * evaluated twice within one interview's feedback.
 */
const evaluationSchema = new mongoose.Schema(
  {
    feedback: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback', required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    result: { type: String, enum: EVALUATION_RESULTS, required: true },
    comment: { type: String, default: null },
  },
  { timestamps: true }
);

evaluationSchema.index({ feedback: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);
