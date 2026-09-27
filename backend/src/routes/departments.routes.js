const express = require('express');
const Department = require('../models/Department');
const { requireAuth, requireRole } = require('../middleware/auth');

const { writeAudit } = require('../utils/audit');

const router = express.Router();

// GET /api/departments - public reference data, needed on the landing page too
router.get('/', async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  res.json({ departments });
});

// POST /api/departments - admin only
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const dept = await Department.create(req.body);
  await writeAudit({ req, action: 'CREATE_DEPARTMENT', entityType: 'Department', entityId: dept._id, description: `Created department ${dept.name} (${dept.shortCode})` });
  res.status(201).json({ department: dept });
});

// PATCH /api/departments/:id - admin only
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!dept) return res.status(404).json({ error: 'Department not found' });
  await writeAudit({ req, action: 'UPDATE_DEPARTMENT', entityType: 'Department', entityId: dept._id, description: `Updated department ${dept.name}` });
  res.json({ department: dept });
});

module.exports = router;
