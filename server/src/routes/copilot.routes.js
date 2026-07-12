const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const copilotService = require('../services/copilot.service');

const router = Router();
router.use(authenticate);

router.post('/query', authorize('ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Question is required.' } });
    const answer = await copilotService.query({ question });
    res.json({ success: true, data: { answer } });
  } catch (err) { next(err); }
});

module.exports = router;
