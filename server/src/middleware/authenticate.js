const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please log in.', 401, 'UNAUTHENTICATED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { id, email, role, depotId }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid token.', 401, 'INVALID_TOKEN'));
  }
};

module.exports = authenticate;
