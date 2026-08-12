const feedbackRepository = require('./feedback.repository');
const technologyRepository = require('../technologies/technology.repository');
const interviewRepository = require('../interviews/interview.repository');
const {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} = require('../../common/utils/AppError');
const { ROLES, EVALUATION_RESULTS } = require('../../common/constants/enums');

/** Fields required for a valid FINAL submission (PRD Section 9.8). */
const REQUIRED_ON_FINAL = [
  'interpersonalLevel',
  'finalRecommendation',
];

const CAMERA_SUB_FIELDS = [
  'eyeContact',
  'backgroundLevel',
];

/**
 * Server-side re-validation of the camera conditional logic (PRD 9.3):
 * if cameraOn is false/unset, camera sub-fields are ignored/nulled out
 * regardless of what the client sent - the frontend's conditional
 * rendering is a UX nicety, not something the backend should trust.
 */
function sanitizeCameraFields(payload) {
  const clean = { ...payload };
  if (!clean.cameraOn) {
    for (const field of CAMERA_SUB_FIELDS) clean[field] = null;
  }
  return clean;
}

function assertFinalReady(feedback) {
  const missing = REQUIRED_ON_FINAL.filter((field) => !feedback[field]);

  // Require either bengaliLevel OR englishLevel
  if (!feedback.bengaliLevel && !feedback.englishLevel) {
    missing.push('bengaliLevel or englishLevel');
  }

  if (feedback.cameraOn === true) {
    for (const field of CAMERA_SUB_FIELDS) {
      if (!feedback[field]) missing.push(field);
    }
  } else if (feedback.cameraOn === null || feedback.cameraOn === undefined) {
    missing.push('cameraOn');
  }

  // Check if technicalEvaluation object has at least one topic evaluated
  let hasEvaluations = false;
  if (feedback.technicalEvaluation && typeof feedback.technicalEvaluation === 'object') {
    for (const cat of Object.values(feedback.technicalEvaluation)) {
      if (cat.topics && cat.topics.length > 0) {
        hasEvaluations = true;
        break;
      }
    }
  }
  if (!hasEvaluations) missing.push('technicalEvaluation (at least one topic)');

  if (missing.length > 0) {
    throw new ValidationError(
      `Cannot submit final feedback - missing required fields: ${missing.join(', ')}`,
      missing
    );
  }
}

/** Computes a before/after diff of only the fields that actually changed. */
function computeDiff(before, after) {
  const beforeObj = before.toObject ? before.toObject() : before;
  const diffBefore = {};
  const diffAfter = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(beforeObj[key]) !== JSON.stringify(after[key])) {
      diffBefore[key] = beforeObj[key];
      diffAfter[key] = after[key];
    }
  }
  return { before: diffBefore, after: diffAfter };
}

const feedbackService = {
  async getByInterviewId(interviewId, user) {
    const feedback = await feedbackRepository.findByInterviewId(interviewId);
    if (!feedback) throw new NotFoundError('Feedback not found for this interview');
    await assertOwnershipIfInstructor(interviewId, user);
    const evaluations = await feedbackRepository.listEvaluationsByFeedback(feedback._id);
    return { feedback, evaluations };
  },

  /**
   * Save Draft (FR-06): partial validation only - just type-correctness,
   * which Mongoose enum validation already enforces. Camera conditional
   * logic is still sanitized so the stored data never has stale
   * sub-fields hanging around from a toggle the user flipped off.
   */
  async saveDraft(interviewId, payload, user) {
    await assertOwnershipIfInstructor(interviewId, user);
    const feedback = await feedbackRepository.findByInterviewId(interviewId);
    if (!feedback) throw new NotFoundError('Feedback not found for this interview');
    if (feedback.status === 'final') {
      throw new ForbiddenError('Feedback is already final and cannot be edited as a draft');
    }

    const clean = sanitizeCameraFields(payload);
    const updated = await feedbackRepository.updateById(feedback._id, clean);

    await interviewRepository.updateById(interviewId, { status: 'Draft Saved' });
    await interviewRepository.addLog({
      interview: interviewId,
      action: 'draft_saved',
      actor: user._id,
    });

    return updated;
  },

  /**
   * Submit Final (FR-07/FR-08): full validation enforced (Section 9.8),
   * then flips status to 'final', stamps submittedAt, and moves the
   * parent Interview to 'Completed'. Immutable for the instructor from
   * this point on (enforced by the 'final' status check above).
   */
  async submitFinal(interviewId, payload, user) {
    await assertOwnershipIfInstructor(interviewId, user);
    const feedback = await feedbackRepository.findByInterviewId(interviewId);
    if (!feedback) throw new NotFoundError('Feedback not found for this interview');
    if (feedback.status === 'final') {
      throw new ConflictError('Feedback has already been submitted');
    }

    const clean = sanitizeCameraFields({ ...feedback.toObject(), ...payload });
    assertFinalReady(clean);

    const updated = await feedbackRepository.updateById(feedback._id, {
      ...clean,
      status: 'final',
      submittedAt: new Date(),
    });

    await interviewRepository.updateById(interviewId, {
      status: 'Completed',
      completedAt: new Date(),
    });
    await interviewRepository.addLog({
      interview: interviewId,
      action: 'submitted',
      actor: user._id,
    });

    return updated;
  },

  /**
   * Manager edit of an already-final feedback record (FR-13). Writes an
   * immutable audit log entry with a before/after diff instead of
   * silently overwriting history. Status remains 'final'.
   */
  async managerEdit(interviewId, payload, user, editReason) {
    const feedback = await feedbackRepository.findByInterviewId(interviewId);
    if (!feedback) throw new NotFoundError('Feedback not found for this interview');

    const clean = sanitizeCameraFields(payload);
    const { before, after } = computeDiff(feedback, clean);

    if (Object.keys(after).length === 0) {
      return feedback; // nothing actually changed - don't write a no-op audit entry
    }

    const updated = await feedbackRepository.updateById(feedback._id, clean);

    await feedbackRepository.createAuditLog({
      feedback: feedback._id,
      editedBy: user._id,
      diff: { before, after },
      editReason: editReason || null,
    });

    return updated;
  },

  getAuditLog(feedbackId) {
    return feedbackRepository.listAuditLogs(feedbackId);
  },

  /**
   * Add/update one Technical Evaluation entry (PRD Section 10.3
   * workflow). Only allowed while the feedback is still a draft -
   * evaluations, like every other field, become read-only once final
   * for the instructor.
   */
  async upsertEvaluation(interviewId, { questionId, result, comment }, user) {
    await assertOwnershipIfInstructor(interviewId, user);
    const feedback = await feedbackRepository.findByInterviewId(interviewId);
    if (!feedback) throw new NotFoundError('Feedback not found for this interview');
    if (feedback.status === 'final') {
      throw new ForbiddenError('Cannot modify evaluations on finalized feedback');
    }

    if (!EVALUATION_RESULTS.includes(result)) {
      throw new ValidationError(`result must be one of: ${EVALUATION_RESULTS.join(', ')}`);
    }

    const question = await technologyRepository.findQuestionById(questionId);
    if (!question) throw new NotFoundError('Question not found');

    return feedbackRepository.upsertEvaluation({
      feedbackId: feedback._id,
      questionId,
      result,
      comment,
    });
  },

  async removeEvaluation(interviewId, evaluationId, user) {
    await assertOwnershipIfInstructor(interviewId, user);
    const feedback = await feedbackRepository.findByInterviewId(interviewId);
    if (!feedback) throw new NotFoundError('Feedback not found for this interview');
    if (feedback.status === 'final') {
      throw new ForbiddenError('Cannot modify evaluations on finalized feedback');
    }

    const evaluation = await feedbackRepository.findEvaluationById(evaluationId);
    if (!evaluation || evaluation.feedback.toString() !== feedback._id.toString()) {
      throw new NotFoundError('Evaluation not found on this feedback record');
    }
    await feedbackRepository.deleteEvaluation(evaluationId);
    return { deleted: true };
  },

  /**
   * Topic Summary / Technical Summary (PRD 10.4) - computed at
   * read-time from the evaluations table rather than stored, so the
   * numbers can never drift out of sync with the raw evaluation rows.
   */
  async getTechnicalSummary(interviewId, user) {
    const feedback = await feedbackRepository.findByInterviewId(interviewId);
    if (!feedback) throw new NotFoundError('Feedback not found for this interview');
    await assertOwnershipIfInstructor(interviewId, user);

    const evaluations = await feedbackRepository.listEvaluationsByFeedback(feedback._id);

    const byTechnology = {};
    const byTopic = {};

    for (const evalRow of evaluations) {
      const techName = evalRow.question?.topic?.technology?.name || 'Unknown';
      const topicName = evalRow.question?.topic?.name || 'Unknown';

      byTechnology[techName] = byTechnology[techName] || { Correct: 0, Partial: 0, Incorrect: 0 };
      byTechnology[techName][evalRow.result] += 1;

      byTopic[topicName] = byTopic[topicName] || { Correct: 0, Partial: 0, Incorrect: 0 };
      byTopic[topicName][evalRow.result] += 1;
    }

    const passRate = (counts) => {
      const total = counts.Correct + counts.Partial + counts.Incorrect;
      if (total === 0) return 0;
      return Number((((counts.Correct + 0.5 * counts.Partial) / total) * 100).toFixed(1));
    };

    return {
      byTopic: Object.entries(byTopic).map(([name, counts]) => ({ topic: name, ...counts })),
      byTechnology: Object.entries(byTechnology).map(([name, counts]) => ({
        technology: name,
        ...counts,
        passRatePercent: passRate(counts),
      })),
    };
  },
};

/**
 * Instructors may only touch feedback for interviews they own; Managers
 * bypass this check entirely (see role matrix, PRD Section 4.3).
 */
async function assertOwnershipIfInstructor(interviewId, user) {
  if (user.role === ROLES.MANAGER) return;
  const interview = await interviewRepository.findById(interviewId);
  if (!interview) throw new NotFoundError('Interview not found');
  if (interview.instructor._id.toString() !== user._id.toString()) {
    throw new ForbiddenError('You are not the instructor assigned to this interview');
  }
}

module.exports = feedbackService;
