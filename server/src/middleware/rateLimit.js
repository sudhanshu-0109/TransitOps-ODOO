const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // relaxed for dev testing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again in 15 minutes.' },
  },
});

module.exports = { loginLimiter };
