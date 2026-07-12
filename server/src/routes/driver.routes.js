const { Router } = require('express');
const ctrl = require('../controllers/driver.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createDriverSchema, updateDriverSchema, updateStatusSchema } = require('../validators/driver.validator');

const router = Router();
router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('ADMIN', 'SAFETY_OFFICER'), validate(createDriverSchema), ctrl.create);
router.put('/:id', authorize('ADMIN', 'SAFETY_OFFICER'), validate(updateDriverSchema), ctrl.update);
router.patch('/:id/status', authorize('ADMIN', 'SAFETY_OFFICER'), validate(updateStatusSchema), ctrl.updateStatus);

module.exports = router;
