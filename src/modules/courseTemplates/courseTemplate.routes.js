const express = require('express');
const courseTemplateController = require('./courseTemplate.controller');
const authenticate = require('../../common/middlewares/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/:course', courseTemplateController.getTemplate);
router.put('/:course', courseTemplateController.upsertTemplate);

module.exports = router;
