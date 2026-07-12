const { z } = require('zod');
const AppError = require('../utils/AppError');

/**
 * Generic validation middleware factory.
 * Usage: validate(schema) — validates req.body against the Zod schema.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return next(new AppError(message, 400, 'VALIDATION_ERROR'));
  }
  req.body = result.data; // replace with parsed + coerced data
  next();
};

module.exports = validate;
