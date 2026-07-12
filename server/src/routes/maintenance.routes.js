const { Router } = require('express');
const ctrl = require('../controllers/maintenance.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createMaintenanceSchema } = require('../validators/maintenance.validator');

const router = Router();
router.use(authenticate);

router.get('/', ctrl.getAll);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER'), validate(createMaintenanceSchema), ctrl.create);
router.patch('/:id/close', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.close);

module.exports = router;
