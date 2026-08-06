const technologyRepository = require('./technology.repository');
const { ROLES } = require('../../common/constants/enums');
const { NotFoundError, ConflictError } = require('../../common/utils/AppError');

/**
 * Catalog governance rule (PRD 10.1 / 10.3): a Topic or Question
 * created by a Manager is auto-approved; one created by an Instructor
 * starts "pending" until a Manager approves it. This keeps the shared
 * question bank curated instead of growing unchecked duplicates.
 */
function initialCatalogStatus(role) {
  return role === ROLES.MANAGER ? 'approved' : 'pending';
}

const technologyService = {
  async createTechnology({ name }) {
    const existing = await technologyRepository
      .listTechnologies()
      .then((list) => list.find((t) => t.name.toLowerCase() === name.toLowerCase()));
    if (existing) throw new ConflictError('Technology already exists');
    return technologyRepository.createTechnology({ name });
  },

  listTechnologies() {
    return technologyRepository.listTechnologies();
  },

  async createTopic({ technologyId, name, user }) {
    const technology = await technologyRepository.findTechnologyById(technologyId);
    if (!technology) throw new NotFoundError('Technology not found');

    return technologyRepository.createTopic({
      technology: technologyId,
      name,
      status: initialCatalogStatus(user.role),
      createdBy: user._id,
    });
  },

  listTopics(filters) {
    return technologyRepository.listTopics(filters);
  },

  async approveTopic(id) {
    const topic = await technologyRepository.approveTopic(id);
    if (!topic) throw new NotFoundError('Topic not found');
    return topic;
  },

  async createQuestion({ topicId, text, user }) {
    const topic = await technologyRepository.findTopicById(topicId);
    if (!topic) throw new NotFoundError('Topic not found');

    return technologyRepository.createQuestion({
      topic: topicId,
      text,
      status: initialCatalogStatus(user.role),
      createdBy: user._id,
    });
  },

  listQuestions(filters) {
    return technologyRepository.listQuestions(filters);
  },

  async approveQuestion(id) {
    const question = await technologyRepository.approveQuestion(id);
    if (!question) throw new NotFoundError('Question not found');
    return question;
  },
};

module.exports = technologyService;
