const courseTemplateService = require('./courseTemplate.service');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/response');

const courseTemplateController = {
  getTemplate: catchAsync(async (req, res) => {
    const template = await courseTemplateService.getTemplate(req.params.course);
    return sendSuccess(res, { data: template });
  }),

  upsertTemplate: catchAsync(async (req, res) => {
    const template = await courseTemplateService.upsertTemplate(req.params.course, req.body, req.user);
    return sendSuccess(res, { data: template });
  })
};

module.exports = courseTemplateController;
