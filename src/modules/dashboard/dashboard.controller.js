const dashboardService = require('./dashboard.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');

const dashboardController = {
  instructorDashboard: catchAsync(async (req, res) => {
    const data = await dashboardService.getInstructorDashboard(req.user._id);
    return sendSuccess(res, { data });
  }),

  managerDashboard: catchAsync(async (req, res) => {
    const data = await dashboardService.getManagerDashboard(req.query);
    return sendSuccess(res, { data });
  }),

  technologyPerformance: catchAsync(async (req, res) => {
    const data = await dashboardService.getTechnologyPerformance();
    return sendSuccess(res, { data });
  }),

  instructorActivity: catchAsync(async (req, res) => {
    const data = await dashboardService.getInstructorActivity();
    return sendSuccess(res, { data });
  }),
};

module.exports = dashboardController;
