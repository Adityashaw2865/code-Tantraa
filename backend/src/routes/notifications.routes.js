const express = require('express');
const SystemNotification = require('../models/SystemNotification');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications - the logged-in user's own notifications
router.get('/', requireAuth, async (req, res) => {
  const notifications = await SystemNotification.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(100);
  res.json({ notifications });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res) => {
  const notification = await SystemNotification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  res.json({ notification });
});

// PATCH /api/notifications/read-all
router.patch('/read-all', requireAuth, async (req, res) => {
  await SystemNotification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

module.exports = router;
