const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const userRepository = require('./user.repository');
const { ConflictError, NotFoundError } = require('../../common/utils/AppError');

/**
 * Service layer: business rules for user/instructor management
 * (PRD Section 4.1 - Manager can create/deactivate instructor accounts).
 * Controllers call these methods; all Mongoose access goes through
 * user.repository.js.
 */
const userService = {
  async createUser({ name, email, password, role }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
    const user = await userRepository.create({ name, email, passwordHash, role });

    return sanitize(user);
  },

  async listUsers(filters) {
    const { items, total } = await userRepository.list(filters);
    return {
      items: items.map(sanitize),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  },

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return sanitize(user);
  },

  async updateUser(id, updates) {
    const user = await userRepository.updateById(id, updates);
    if (!user) throw new NotFoundError('User not found');
    return sanitize(user);
  },

  async deactivateUser(id) {
    const user = await userRepository.setActive(id, false);
    if (!user) throw new NotFoundError('User not found');
    return sanitize(user);
  },

  async reactivateUser(id) {
    const user = await userRepository.setActive(id, true);
    if (!user) throw new NotFoundError('User not found');
    return sanitize(user);
  },

  async getInstructorStats() {
    return userRepository.getInstructorStats();
  },

  async deleteUser(id) {
    const user = await userRepository.deleteById(id);
    if (!user) throw new NotFoundError('User not found');
    return sanitize(user);
  },

  async getInstructorInterviews(instructorId) {
    const data = await userRepository.getInstructorInterviews(instructorId);
    if (!data || data.length === 0) {
      throw new NotFoundError('Instructor not found');
    }
    return data[0];
  },
};

/** Strips internal/sensitive fields before returning a user to the API layer. */
function sanitize(userDoc) {
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete user.passwordHash;
  delete user.__v;
  return user;
}

module.exports = userService;
