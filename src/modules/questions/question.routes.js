const express = require('express');
const questionController = require('./question.controller');
const authenticate = require('../../common/middlewares/authenticate');

const router = express.Router();

router.use(authenticate);

router.post('/', questionController.create);
router.get('/', questionController.list);
router.get('/:id', questionController.getById);
router.put('/:id', questionController.update);
router.delete('/:id', questionController.delete);

module.exports = router;
