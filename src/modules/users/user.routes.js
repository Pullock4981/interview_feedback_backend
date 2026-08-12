const express = require('express');
const userController = require('./user.controller');
const authenticate = require('../../common/middlewares/authenticate');
const authorize = require('../../common/middlewares/authorize');
const validateRequest = require('../../common/middlewares/validateRequest');
const { ROLES } = require('../../common/constants/enums');
const { idParamSchema } = require('../../common/utils/commonSchemas');
const {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
} = require('./user.validation');

const router = express.Router();

// All user-management endpoints are Manager-only (PRD 4.1 / 17.7)
router.use(authenticate, authorize(ROLES.MANAGER));

router.get('/', validateRequest({ query: listUsersQuerySchema }), userController.list);
router.get('/instructors/stats', userController.getInstructorStats);
router.get('/instructors/:id/interviews', validateRequest({ params: idParamSchema }), userController.getInstructorInterviews);
router.post('/', validateRequest({ body: createUserSchema }), userController.create);
router.get('/:id', validateRequest({ params: idParamSchema }), userController.getById);
router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateUserSchema }),
  userController.update
);
router.patch(
  '/:id/deactivate',
  validateRequest({ params: idParamSchema }),
  userController.deactivate
);
router.patch(
  '/:id/reactivate',
  validateRequest({ params: idParamSchema }),
  userController.reactivate
);
router.delete(
  '/:id',
  validateRequest({ params: idParamSchema }),
  userController.delete
);

module.exports = router;
