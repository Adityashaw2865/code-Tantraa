const express = require('express');
const AuditLogRecord = require('../models/AuditLogRecord');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/audit-logs - admin only, read-only by design
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  const filter = {};
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.userId) filter.userId = req.query.userId;

  const logs = await AuditLogRecord.find(filter).sort({ timestamp: -1 }).limit(500);
  res.json({ logs });
});

module.exports = router;
