const Interview = require('../interviews/interview.model');
const Feedback = require('../feedback/feedback.model');
const FeedbackAuditLog = require('../feedback/feedbackAuditLog.model');
const feedbackRepository = require('../feedback/feedback.repository');
const { RECOMMENDATIONS } = require('../../common/constants/enums');

/**
 * All widgets described in PRD Section 12 are computed here as
 * read-time aggregations rather than stored counters, so the numbers
 * are always consistent with the underlying Interview/Feedback data
 * and never need a separate "recalculate stats" job.
 */
const dashboardService = {
  /** Instructor Dashboard (PRD 12.1) */
  async getInstructorDashboard(instructorId) {
    const [pendingCount, draftCount, completedThisWeek, recommendationBreakdown, recentLogs] =
      await Promise.all([
        Interview.countDocuments({ instructor: instructorId, status: 'Assigned' }),
        Interview.countDocuments({ instructor: instructorId, status: 'Draft Saved' }),
        Interview.countDocuments({
          instructor: instructorId,
          status: 'Completed',
          completedAt: { $gte: startOfWeek() },
        }),
        recommendationBreakdownForInstructor(instructorId),
        Interview.find({ instructor: instructorId })
          .sort({ updatedAt: -1 })
          .limit(10)
          .select('student status updatedAt')
          .populate('student', 'name email'),
      ]);

    return {
      pendingInterviews: pendingCount,
      myDrafts: draftCount,
      completedThisWeek,
      recommendationBreakdown,
      recentActivity: recentLogs,
    };
  },

  /** Manager Dashboard (PRD 12.2) */
  async getManagerDashboard({ dateFrom, dateTo } = {}) {
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    const createdAtFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [totalInterviews, statusDistribution, recommendationBreakdown, recentEdits] =
      await Promise.all([
        Interview.countDocuments(createdAtFilter),
        statusDistributionAgg(createdAtFilter),
        recommendationBreakdownGlobal(),
        FeedbackAuditLog.find()
          .populate('editedBy', 'name email')
          .sort({ createdAt: -1 })
          .limit(20),
      ]);

    return {
      totalInterviews,
      statusDistribution,
      recommendationBreakdown,
      recentEdits,
    };
  },

  /** Technology Performance widget (PRD 12.2) */
  async getTechnologyPerformance() {
    const raw = await feedbackRepository.aggregateResultsByTechnology();
    return raw.map((row) => {
      const counts = { Correct: 0, Partial: 0, Incorrect: 0 };
      for (const r of row.results) counts[r.result] = r.count;
      const total = counts.Correct + counts.Partial + counts.Incorrect;
      const passRatePercent =
        total === 0 ? 0 : Number((((counts.Correct + 0.5 * counts.Partial) / total) * 100).toFixed(1));
      return { technology: row._id, ...counts, passRatePercent };
    });
  },

  /** Instructor Activity / Leaderboard widget (PRD 12.2) */
  async getInstructorActivity() {
    return Interview.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$instructor',
          completedCount: { $sum: 1 },
          avgDraftToFinalMs: {
            $avg: {
              $cond: [
                { $and: ['$startedAt', '$completedAt'] },
                { $subtract: ['$completedAt', '$startedAt'] },
                null,
              ],
            },
          },
        },
      },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'instructor' },
      },
      { $unwind: '$instructor' },
      {
        $project: {
          _id: 0,
          instructorId: '$instructor._id',
          name: '$instructor.name',
          email: '$instructor.email',
          completedCount: 1,
          avgDraftToFinalHours: {
            $round: [{ $divide: ['$avgDraftToFinalMs', 1000 * 60 * 60] }, 1],
          },
        },
      },
      { $sort: { completedCount: -1 } },
    ]);
  },
};

function startOfWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = now.getDate() - day;
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

async function recommendationBreakdownForInstructor(instructorId) {
  const feedbacks = await Feedback.aggregate([
    { $match: { status: 'final' } },
    {
      $lookup: { from: 'interviews', localField: 'interview', foreignField: '_id', as: 'interview' },
    },
    { $unwind: '$interview' },
    { $match: { 'interview.instructor': instructorId } },
    { $group: { _id: '$finalRecommendation', count: { $sum: 1 } } },
  ]);
  return fillRecommendationCounts(feedbacks);
}

async function recommendationBreakdownGlobal() {
  const feedbacks = await Feedback.aggregate([
    { $match: { status: 'final' } },
    { $group: { _id: '$finalRecommendation', count: { $sum: 1 } } },
  ]);
  return fillRecommendationCounts(feedbacks);
}

function fillRecommendationCounts(aggResult) {
  const counts = Object.fromEntries(RECOMMENDATIONS.map((r) => [r, 0]));
  for (const row of aggResult) {
    if (row._id && counts[row._id] !== undefined) counts[row._id] = row.count;
  }
  return counts;
}

async function statusDistributionAgg(createdAtFilter) {
  const rows = await Interview.aggregate([
    { $match: createdAtFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const distribution = {};
  for (const row of rows) distribution[row._id] = row.count;
  return distribution;
}

module.exports = dashboardService;
