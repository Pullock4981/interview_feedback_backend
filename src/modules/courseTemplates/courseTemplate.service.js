const courseTemplateRepository = require('./courseTemplate.repository');

const courseTemplateService = {
  async getTemplate(course) {
    return courseTemplateRepository.getByCourse(course);
  },

  async upsertTemplate(course, data, user) {
    const payload = {
      ...data,
      instructor: user._id
    };
    return courseTemplateRepository.upsertTemplate(course, payload);
  }
};

module.exports = courseTemplateService;
