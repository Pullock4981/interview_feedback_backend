const CourseTemplate = require('./courseTemplate.model');

const courseTemplateRepository = {
  getByCourse(course) {
    return CourseTemplate.findOne({ course });
  },

  upsertTemplate(course, data) {
    return CourseTemplate.findOneAndUpdate(
      { course },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );
  }
};

module.exports = courseTemplateRepository;
