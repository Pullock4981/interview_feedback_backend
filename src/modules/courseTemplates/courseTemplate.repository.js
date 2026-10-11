const CourseTemplate = require('./courseTemplate.model');

const escapeRegex = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const courseTemplateRepository = {
  async getByCourse(course) {
    if (!course || course === 'N/A') return null;
    const trimmed = String(course).trim();

    // 1. Exact match
    let doc = await CourseTemplate.findOne({ course: trimmed });
    if (doc) return doc;

    // 2. Case-insensitive exact match
    doc = await CourseTemplate.findOne({
      course: new RegExp(`^${escapeRegex(trimmed)}$`, 'i')
    });
    if (doc) return doc;

    // 3. Strip batch / level suffix like " - B-13" or " - Batch 13"
    if (trimmed.includes(' - ')) {
      const baseName = trimmed.split(' - ')[0].trim();
      doc = await CourseTemplate.findOne({
        course: new RegExp(`^${escapeRegex(baseName)}$`, 'i')
      });
      if (doc) return doc;
    }

    // 4. Underscore vs Space normalization (e.g. Growth_Circle_Interview vs Growth Circle Interview)
    const spaced = trimmed.replace(/_+/g, ' ');
    const underscored = trimmed.replace(/\s+/g, '_');
    doc = await CourseTemplate.findOne({
      course: {
        $in: [
          new RegExp(`^${escapeRegex(spaced)}$`, 'i'),
          new RegExp(`^${escapeRegex(underscored)}$`, 'i')
        ]
      }
    });
    if (doc) return doc;

    // 5. Partial / substring match against existing templates
    const allTemplates = await CourseTemplate.find({});
    for (const tpl of allTemplates) {
      const tplName = (tpl.course || '').toLowerCase().trim();
      const candName = trimmed.toLowerCase();
      if (tplName && (candName.includes(tplName) || tplName.includes(candName))) {
        return tpl;
      }
    }

    return null;
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

