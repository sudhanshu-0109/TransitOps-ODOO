const AppError = require('../utils/AppError');

/**
 * RBAC middleware factory.
 * Usage: authorize('ADMIN', 'FLEET_MANAGER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHENTICATED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}.`,
          403,
          'FORBIDDEN'
        )
      );
    }
    next();
  };
};

module.exports = authorize;
