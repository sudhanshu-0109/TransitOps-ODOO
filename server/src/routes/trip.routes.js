const { Router } = require('express');
const ctrl = require('../controllers/trip.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createTripSchema, dispatchTripSchema, completeTripSchema, cancelTripSchema } = require('../validators/trip.validator');

const router = Router();
router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('ADMIN', 'DISPATCHER'), validate(createTripSchema), ctrl.create);
router.patch('/:id/dispatch', authorize('ADMIN', 'DISPATCHER'), validate(dispatchTripSchema), ctrl.dispatch);
router.patch('/:id/complete', authorize('ADMIN', 'DISPATCHER'), validate(completeTripSchema), ctrl.complete);
router.patch('/:id/cancel', authorize('ADMIN', 'DISPATCHER'), validate(cancelTripSchema), ctrl.cancel);

module.exports = router;
