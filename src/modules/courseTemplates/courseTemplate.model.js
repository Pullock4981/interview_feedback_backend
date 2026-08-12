const mongoose = require('mongoose');

const courseTemplateSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, unique: true, trim: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    showProblemSolving: { type: Boolean, default: true },
    categories: { type: mongoose.Schema.Types.Mixed, default: [] } 
  },
  { timestamps: true }
);

module.exports = mongoose.model('CourseTemplate', courseTemplateSchema);
