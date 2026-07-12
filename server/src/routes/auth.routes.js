const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const { loginLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const { loginSchema } = require('../validators/auth.validator');

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
