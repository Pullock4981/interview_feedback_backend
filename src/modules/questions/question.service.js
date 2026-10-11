const questionRepository = require('./question.repository');
const { NotFoundError } = require('../../common/utils/AppError');

const questionService = {
  async createQuestionBank(data, instructorId) {
    return questionRepository.create({ ...data, instructor: instructorId });
  },
  async listQuestionBanks(instructorId) {
    return questionRepository.list(instructorId);
  },
  async getQuestionBankById(id, instructorId) {
    const qb = await questionRepository.findById(id);
    if (!qb) throw new NotFoundError('Question Bank not found');
    return qb;
  },
  async updateQuestionBank(id, data, instructorId) {
    const qb = await questionRepository.findById(id);
    if (!qb) throw new NotFoundError('Question Bank not found');
    return questionRepository.updateById(id, data);
  },
  async deleteQuestionBank(id, instructorId) {
    const qb = await questionRepository.findById(id);
    if (!qb) throw new NotFoundError('Question Bank not found');
    return questionRepository.deleteById(id);
  },
};

module.exports = questionService;
