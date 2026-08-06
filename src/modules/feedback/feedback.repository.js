const Feedback = require('./feedback.model');
const Evaluation = require('./evaluation.model');
const FeedbackAuditLog = require('./feedbackAuditLog.model');

const feedbackRepository = {
  create(data) {
    return Feedback.create(data);
  },

  findByInterviewId(interviewId) {
    return Feedback.findOne({ interview: interviewId });
  },

  findManyByInterviewIds(interviewIds) {
    return Feedback.find({ interview: { $in: interviewIds } });
  },

  findById(id) {
    return Feedback.findById(id);
  },

  updateById(id, updates) {
    return Feedback.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  },

  // --- Evaluations ---
  upsertEvaluation({ feedbackId, questionId, result, comment }) {
    return Evaluation.findOneAndUpdate(
      { feedback: feedbackId, question: questionId },
      { result, comment: comment ?? null },
      { new: true, upsert: true, runValidators: true }
    );
  },

  deleteEvaluation(id) {
    return Evaluation.findByIdAndDelete(id);
  },

  findEvaluationById(id) {
    return Evaluation.findById(id);
  },

  listEvaluationsByFeedback(feedbackId) {
    return Evaluation.find({ feedback: feedbackId }).populate({
      path: 'question',
      select: 'text topic',
      populate: { path: 'topic', select: 'name technology', populate: { path: 'technology', select: 'name' } },
    });
  },

  // --- Audit log ---
  createAuditLog(data) {
    return FeedbackAuditLog.create(data);
  },

  listAuditLogs(feedbackId) {
    return FeedbackAuditLog.find({ feedback: feedbackId })
      .populate('editedBy', 'name email')
      .sort({ createdAt: -1 });
  },

  // --- Aggregation for technology performance dashboard (PRD 12.2) ---
  aggregateResultsByTechnology() {
    return Evaluation.aggregate([
      {
        $lookup: {
          from: 'questions',
          localField: 'question',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: '$question' },
      {
        $lookup: {
          from: 'topics',
          localField: 'question.topic',
          foreignField: '_id',
          as: 'topic',
        },
      },
      { $unwind: '$topic' },
      {
        $group: {
          _id: { technology: '$topic.technology', result: '$result' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'technologies',
          localField: '_id.technology',
          foreignField: '_id',
          as: 'technology',
        },
      },
      { $unwind: '$technology' },
      {
        $group: {
          _id: '$technology.name',
          results: { $push: { result: '$_id.result', count: '$count' } },
        },
      },
    ]);
  },
};

module.exports = feedbackRepository;
