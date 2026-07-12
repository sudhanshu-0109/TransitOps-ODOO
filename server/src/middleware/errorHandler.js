const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong';

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    const field = err.meta?.target?.[0] || 'field';
    message = `A record with this ${field} already exists.`;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Record not found.';
  }

  // Generic non-operational errors: don't leak details
  if (!err.isOperational && statusCode === 500) {
    console.error('[ERROR]', err);
    message = 'An unexpected error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

module.exports = errorHandler;
