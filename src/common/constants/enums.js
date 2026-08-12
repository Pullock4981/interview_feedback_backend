/**
 * Shared enum values used across multiple Mongoose schemas and validation
 * layers. Keeping these in one place avoids the same string list being
 * copy-pasted (and drifting) between models/validators/frontend.
 */

const ROLES = Object.freeze({
  MANAGER: 'manager',
  INSTRUCTOR: 'instructor',
});

const LEVELS = Object.freeze(['Excellent', 'Good', 'Average', 'Poor']);

const RECOMMENDATIONS = Object.freeze(['Strongly Recommended (Potential Candidate)', 'Recommended', 'Need Improvement', 'Not Recommended']);

const EVALUATION_RESULTS = Object.freeze(['Correct', 'Partial', 'Incorrect']);

const INTERVIEW_STATUSES = Object.freeze([
  'Pending',
  'Assigned',
  'Interview Started',
  'Draft Saved',
  'Completed',
  'Cancelled',
]);

const FEEDBACK_STATUSES = Object.freeze(['draft', 'final']);

const CATALOG_STATUSES = Object.freeze(['approved', 'pending']);

const STUDENT_SOURCES = Object.freeze(['google_sheet', 'manual']);

module.exports = {
  ROLES,
  LEVELS,
  RECOMMENDATIONS,
  EVALUATION_RESULTS,
  INTERVIEW_STATUSES,
  FEEDBACK_STATUSES,
  CATALOG_STATUSES,
  STUDENT_SOURCES,
};
