const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const notifService = require('../services/notification.service');

const router = Router();
router.use(authenticate);

// GET /notifications — paginated list
router.get('/', async (req, res, next) => {
  try {
    const result = await notifService.getAll(req.user.id, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// GET /notifications/unread-count — for notification bell badge
router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await notifService.unreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
});

// PATCH /notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await notifService.markAllRead(req.user.id);
    res.json({ success: true, message: 'All marked as read.' });
  } catch (err) { next(err); }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const data = await notifService.markRead(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

module.exports = router;
