const express = require('express');
const managerNoteController = require('./managerNote.controller');
const authenticate = require('../../common/middlewares/authenticate');
const authorize = require('../../common/middlewares/authorize');
const validateRequest = require('../../common/middlewares/validateRequest');
const { ROLES } = require('../../common/constants/enums');
const {
  createManagerNoteSchema,
  studentIdParamSchema,
} = require('./managerNote.validation');

const router = express.Router();

// Manager Notes are a Manager-only feature end to end (PRD Section 16.2)
router.use(authenticate, authorize(ROLES.MANAGER));

router.post('/', validateRequest({ body: createManagerNoteSchema }), managerNoteController.create);
router.get(
  '/:studentId',
  validateRequest({ params: studentIdParamSchema }),
  managerNoteController.listForStudent
);

module.exports = router;
