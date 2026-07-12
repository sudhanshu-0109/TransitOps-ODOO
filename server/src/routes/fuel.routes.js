const { Router } = require('express');
const ctrl = require('../controllers/fuel.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createFuelLogSchema, createExpenseSchema } = require('../validators/fuel.validator');

const router = Router();
router.use(authenticate);

// Fuel logs
router.get('/fuel-logs', ctrl.getAllFuel);
router.post('/fuel-logs', authorize('ADMIN', 'FINANCIAL_ANALYST'), validate(createFuelLogSchema), ctrl.createFuel);

// Expenses
router.get('/expenses', ctrl.getAllExpenses);
router.post('/expenses', authorize('ADMIN', 'FINANCIAL_ANALYST'), validate(createExpenseSchema), ctrl.createExpense);

// Totals
router.get('/expenses/totals', ctrl.getTotals);

module.exports = router;
