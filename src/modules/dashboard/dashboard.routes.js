const express = require('express');
const dashboardController = require('./dashboard.controller');
const authenticate = require('../../common/middlewares/authenticate');
const authorize = require('../../common/middlewares/authorize');
const { ROLES } = require('../../common/constants/enums');

const router = express.Router();

router.use(authenticate);

router.get('/instructor', authorize(ROLES.INSTRUCTOR), dashboardController.instructorDashboard);
router.get('/manager', authorize(ROLES.MANAGER), dashboardController.managerDashboard);
router.get(
  '/technology-performance',
  authorize(ROLES.MANAGER),
  dashboardController.technologyPerformance
);
router.get(
  '/instructor-activity',
  authorize(ROLES.MANAGER),
  dashboardController.instructorActivity
);

module.exports = router;
