const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const studentRoutes = require('../modules/students/student.routes');
const interviewRoutes = require('../modules/interviews/interview.routes');
const feedbackRoutes = require('../modules/feedback/feedback.routes');
const technologyRoutes = require('../modules/technologies/technology.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const managerNoteRoutes = require('../modules/managerNotes/managerNote.routes');
const questionRoutes = require('../modules/questions/question.routes');
const courseTemplateRoutes = require('../modules/courseTemplates/courseTemplate.routes');

/**
 * Aggregates every module's router under /api/v1/<module>. Keeping
 * this in one file makes the overall API surface easy to see at a
 * glance without opening app.js itself.
 */
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/interviews', interviewRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/technologies', technologyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/manager-notes', managerNoteRoutes);
router.use('/questions', questionRoutes);
router.use('/course-templates', courseTemplateRoutes);

module.exports = router;
