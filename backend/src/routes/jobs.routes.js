const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { runAllJobs } = require('../jobs/scheduler');

const router = express.Router();

// POST /api/jobs/run - admin can trigger licence-expiry + SLA-breach checks on demand (handy for demos)
router.post('/run', requireAuth, requireRole('admin'), async (req, res) => {
  res.json(await runAllJobs());
});

module.exports = router;
