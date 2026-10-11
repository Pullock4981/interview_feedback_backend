const catchAsync = require('../utils/catchAsync');
const User = require('../../modules/users/user.model');
const { ROLES } = require('../constants/enums');

let defaultUser = null;

/**
 * Direct access middleware:
 * Attaches an active user to req.user for database references.
 * Never blocks or fails a request.
 */
const authenticate = catchAsync(async (req, res, next) => {
  if (!defaultUser) {
    try {
      defaultUser = await User.findOne({ isActive: true });
      if (!defaultUser) {
        defaultUser = await User.findOne({});
      }
    } catch (err) {
      // ignore DB read error
    }

    if (!defaultUser) {
      try {
        defaultUser = await User.create({
          name: 'Default User',
          email: 'admin@nexview.local',
          passwordHash: 'nopassword',
          role: ROLES.MANAGER,
          isActive: true,
        });
      } catch (err) {
        // ignore duplicate or creation error
      }
    }

    if (!defaultUser) {
      defaultUser = {
        _id: '666666666666666666666666',
        name: 'Default User',
        email: 'admin@nexview.local',
        role: ROLES.MANAGER,
        isActive: true,
      };
    }
  }

  req.user = defaultUser;
  next();
});

module.exports = authenticate;
