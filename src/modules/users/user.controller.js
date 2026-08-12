const userService = require('./user.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');

/**
 * Controller layer: parses the request, delegates to the service, and
 * shapes the HTTP response. No business logic should live here.
 * (Manager-only routes - see users.routes.js for the authorize() guard.)
 */
const userController = {
  create: catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    return sendSuccess(res, { statusCode: 201, data: user });
  }),

  list: catchAsync(async (req, res) => {
    const { items, total, page, pageSize } = await userService.listUsers(req.query);
    return sendSuccess(res, { data: items, meta: { page, pageSize, total } });
  }),

  getById: catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, { data: user });
  }),

  update: catchAsync(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    return sendSuccess(res, { data: user });
  }),

  deactivate: catchAsync(async (req, res) => {
    const user = await userService.deactivateUser(req.params.id);
    return sendSuccess(res, { data: user });
  }),

  reactivate: catchAsync(async (req, res) => {
    const user = await userService.reactivateUser(req.params.id);
    return sendSuccess(res, { data: user });
  }),

  getInstructorStats: catchAsync(async (req, res) => {
    const stats = await userService.getInstructorStats();
    return sendSuccess(res, { data: stats });
  }),

  delete: catchAsync(async (req, res) => {
    const user = await userService.deleteUser(req.params.id);
    return sendSuccess(res, { data: user });
  }),

  getInstructorInterviews: catchAsync(async (req, res) => {
    const data = await userService.getInstructorInterviews(req.params.id);
    return sendSuccess(res, { data });
  }),
};

module.exports = userController;
