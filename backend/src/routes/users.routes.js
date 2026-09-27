const express = require('express');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

// POST /api/users - admin provisions officer/inspector accounts
// GET /api/users/inspectors - officer/admin pick an inspector to assign
router.get('/inspectors', requireAuth, requireRole('officer', 'admin'), async (req, res) => {
  const inspectors = await User.find({ role: 'inspector', isActive: { $ne: false } }).select('name designation');
  res.json({ inspectors });
});

// GET /api/users/officers - admin picks an officer to assign
router.get('/officers', requireAuth, requireRole('admin'), async (req, res) => {
  const officers = await User.find({ role: 'officer', isActive: { $ne: false } }).select('name designation departmentId');
  res.json({ officers });
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, email, mobile, password, role, departmentId, designation, state, district } = req.body;

  if (!name || !email || !mobile || !password || !role) {
    return res.status(400).json({ error: 'name, email, mobile, password and role are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = new User({ name, email: email.toLowerCase(), mobile, role, departmentId, designation, state, district });
  await user.setPassword(password);
  await user.save();

  await writeAudit({
    req,
    action: 'CREATE_USER',
    entityType: 'User',
    entityId: user._id,
    description: `Provisioned ${role} account for ${name} (${email})`
  });

  res.status(201).json({ user: user.toPublicJSON() });
});

// GET /api/users - list users, filterable by role/department (staff only)
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.departmentId) filter.departmentId = req.query.departmentId;

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(1000);
  res.json({ users: users.map((u) => u.toPublicJSON()) });
});

// PATCH /api/users/:id/deactivate - soft-disable an account
router.patch('/:id/deactivate', requireAuth, requireRole('admin'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.isActive = false;
  await user.save();

  await writeAudit({
    req,
    action: 'DEACTIVATE_USER',
    entityType: 'User',
    entityId: user._id,
    description: `Deactivated account for ${user.name} (${user.email})`
  });

  res.json({ user: user.toPublicJSON() });
});

module.exports = router;
