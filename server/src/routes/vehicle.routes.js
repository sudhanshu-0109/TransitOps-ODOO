const { Router } = require('express');
const ctrl = require('../controllers/vehicle.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createVehicleSchema, updateVehicleSchema } = require('../validators/vehicle.validator');

const router = Router();
router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/timeline', ctrl.getTimeline);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER'), validate(createVehicleSchema), ctrl.create);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), validate(updateVehicleSchema), ctrl.update);
router.patch('/:id/retire', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.retire);
router.delete('/:id', authorize('ADMIN'), ctrl.remove);

module.exports = router;
