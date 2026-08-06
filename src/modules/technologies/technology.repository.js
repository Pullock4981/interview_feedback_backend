const Technology = require('./technology.model');
const Topic = require('./topic.model');
const Question = require('./question.model');

/**
 * Repository layer for the Technology -> Topic -> Question hierarchy.
 * Kept in one file since the three collections are tightly related and
 * almost always queried together (see technology.service.js for the
 * business rules built on top of these raw queries).
 */
const technologyRepository = {
  // --- Technology ---
  createTechnology(data) {
    return Technology.create(data);
  },
  listTechnologies() {
    return Technology.find().sort({ name: 1 });
  },
  findTechnologyById(id) {
    return Technology.findById(id);
  },

  // --- Topic ---
  createTopic(data) {
    return Topic.create(data);
  },
  findTopicById(id) {
    return Topic.findById(id);
  },
  async listTopics({ technologyId, search, status }) {
    const filter = {};
    if (technologyId) filter.technology = technologyId;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };
    return Topic.find(filter).populate('technology', 'name').sort({ name: 1 });
  },
  approveTopic(id) {
    return Topic.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
  },

  // --- Question ---
  createQuestion(data) {
    return Question.create(data);
  },
  findQuestionById(id) {
    return Question.findById(id);
  },
  async listQuestions({ topicId, search, status }) {
    const filter = {};
    if (topicId) filter.topic = topicId;
    if (status) filter.status = status;
    if (search) filter.text = { $regex: search, $options: 'i' };
    return Question.find(filter).populate('topic', 'name').sort({ createdAt: -1 });
  },
  approveQuestion(id) {
    return Question.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
  },
};

module.exports = technologyRepository;
