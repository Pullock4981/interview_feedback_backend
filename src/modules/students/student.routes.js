const express = require('express');
const studentController = require('./student.controller');
const authenticate = require('../../common/middlewares/authenticate');
const authorize = require('../../common/middlewares/authorize');
const validateRequest = require('../../common/middlewares/validateRequest');
const { ROLES } = require('../../common/constants/enums');
const { idParamSchema } = require('../../common/utils/commonSchemas');
const {
  listStudentsQuerySchema,
  importStudentsSchema,
  assignInstructorSchema,
  updateStudentSchema,
  createManualStudentSchema,
} = require('./student.validation');

const router = express.Router();

router.use(authenticate);

// Both roles can list (scoped in the service layer) and import (PRD 6.1/6.2)
router.get('/', validateRequest({ query: listStudentsQuerySchema }), studentController.list);
router.post(
  '/import',
  validateRequest({ body: importStudentsSchema }),
  studentController.import
);
router.post(
  '/manual',
  validateRequest({ body: createManualStudentSchema }),
  studentController.createManual
);
router.get(
  '/import-logs',
  authorize(ROLES.MANAGER),
  studentController.listImportLogs
);
router.get('/:id', validateRequest({ params: idParamSchema }), studentController.getById);

// Manager-only mutations
router.patch(
  '/:id/assign',
  authorize(ROLES.MANAGER),
  validateRequest({ params: idParamSchema, body: assignInstructorSchema }),
  studentController.assignInstructor
);
router.patch(
  '/:id',
  authorize(ROLES.MANAGER),
  validateRequest({ params: idParamSchema, body: updateStudentSchema }),
  studentController.update
);

module.exports = router;
