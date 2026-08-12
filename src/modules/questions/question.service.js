const questionRepository = require('./question.repository');
const { NotFoundError, ForbiddenError } = require('../../common/utils/AppError');

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
    if (qb.instructor.toString() !== instructorId.toString()) {
      throw new ForbiddenError('You do not have access to this question bank');
    }
    return qb;
  },
  async updateQuestionBank(id, data, instructorId) {
    await this.getQuestionBankById(id, instructorId); // Verify ownership
    return questionRepository.updateById(id, data);
  },
  async deleteQuestionBank(id, instructorId) {
    await this.getQuestionBankById(id, instructorId); // Verify ownership
    return questionRepository.deleteById(id);
  },
};

module.exports = questionService;
