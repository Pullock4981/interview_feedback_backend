const QuestionBank = require('./question.model');

const questionRepository = {
  create(data) {
    return QuestionBank.create(data);
  },
  list(instructorId) {
    return QuestionBank.find({ instructor: instructorId }).sort({ createdAt: -1 });
  },
  findById(id) {
    return QuestionBank.findById(id);
  },
  updateById(id, data) {
    return QuestionBank.findByIdAndUpdate(id, data, { new: true });
  },
  deleteById(id) {
    return QuestionBank.findByIdAndDelete(id);
  },
};

module.exports = questionRepository;
