const User = require('./user.model');

/**
 * Repository layer: ALL direct Mongoose/DB queries for the User
 * collection live here. Services call these functions rather than
 * touching the User model directly - this keeps query logic in one
 * place and makes it easy to swap/optimize queries later without
 * touching business logic in the service layer.
 */
const userRepository = {
  create(data) {
    return User.create(data);
  },

  findById(id, { withPassword = false } = {}) {
    const query = User.findById(id);
    if (withPassword) query.select('+passwordHash');
    return query;
  },

  findByEmail(email, { withPassword = false } = {}) {
    const query = User.findOne({ email: email.toLowerCase().trim() });
    if (withPassword) query.select('+passwordHash');
    return query;
  },

  async list({ role, isActive, search, page = 1, pageSize = 20 } = {}) {
    const filter = {};
    if (role) filter.role = role;
    if (typeof isActive === 'boolean') filter.isActive = isActive;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      User.countDocuments(filter),
    ]);

    return { items, total };
  },

  updateById(id, updates) {
    return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  },

  setActive(id, isActive) {
    return User.findByIdAndUpdate(id, { isActive }, { new: true });
  },

  async getInstructorStats() {
    return User.aggregate([
      { $match: { role: 'instructor' } },
      {
        $lookup: {
          from: 'interviews',
          localField: '_id',
          foreignField: 'instructor',
          as: 'interviews'
        }
      },
      {
        $lookup: {
          from: 'feedbacks',
          localField: 'interviews._id',
          foreignField: 'interview',
          as: 'feedbacks'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          isActive: 1,
          totalInterviews: { $size: '$interviews' },
          completedInterviews: {
            $size: {
              $filter: {
                input: '$interviews',
                as: 'i',
                cond: { $eq: ['$$i.status', 'Completed'] }
              }
            }
          },
          strongHireCount: {
            $size: {
              $filter: { input: '$feedbacks', as: 'f', cond: { $eq: ['$$f.finalRecommendation', 'Strong Hire'] } }
            }
          },
          hireCount: {
            $size: {
              $filter: { input: '$feedbacks', as: 'f', cond: { $eq: ['$$f.finalRecommendation', 'Hire'] } }
            }
          },
          maybeCount: {
            $size: {
              $filter: { input: '$feedbacks', as: 'f', cond: { $eq: ['$$f.finalRecommendation', 'Maybe'] } }
            }
          },
          rejectCount: {
            $size: {
              $filter: { input: '$feedbacks', as: 'f', cond: { $eq: ['$$f.finalRecommendation', 'Reject'] } }
            }
          },
        }
      }
    ]);
  },

  async getInstructorInterviews(instructorId) {
    return User.aggregate([
      { $match: { _id: new (require('mongoose').Types.ObjectId)(instructorId), role: 'instructor' } },
      {
        $lookup: {
          from: 'interviews',
          localField: '_id',
          foreignField: 'instructor',
          as: 'interviews'
        }
      },
      { $unwind: { path: '$interviews', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'students',
          localField: 'interviews.student',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'feedbacks',
          localField: 'interviews._id',
          foreignField: 'interview',
          as: 'feedback'
        }
      },
      { $unwind: { path: '$feedback', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          email: { $first: '$email' },
          isActive: { $first: '$isActive' },
          interviews: {
            $push: {
              $cond: [
                { $ifNull: ['$interviews._id', false] },
                {
                  _id: '$interviews._id',
                  status: '$interviews.status',
                  startedAt: '$interviews.startedAt',
                  completedAt: '$interviews.completedAt',
                  student: {
                    _id: '$student._id',
                    name: '$student.name',
                    email: '$student.email',
                    course: '$student.course',
                    batch: '$student.batch',
                    rollNo: '$student.rollNo'
                  },
                  feedback: {
                    _id: '$feedback._id',
                    status: '$feedback.status',
                    finalRecommendation: '$feedback.finalRecommendation',
                    bengaliLevel: '$feedback.bengaliLevel',
                    englishLevel: '$feedback.englishLevel',
                    problemSolvingLevel: '$feedback.problemSolvingLevel',
                    interpersonalLevel: '$feedback.interpersonalLevel'
                  }
                },
                '$$REMOVE'
              ]
            }
          }
        }
      }
    ]);
  }
};

module.exports = userRepository;
