const { Router } = require('express');
const ctrl = require('../controllers/analytics.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = Router();
router.use(authenticate);

// Dashboard — all authenticated users
router.get('/dashboard', ctrl.getDashboard);

// Analytics — restricted
router.get('/analytics', authorize('ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'), ctrl.getAnalytics);
router.get('/analytics/export.csv', authorize('ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'), ctrl.exportCsv);

module.exports = router;
