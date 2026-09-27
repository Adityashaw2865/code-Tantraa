const express = require('express');
const ApprovalType = require('../models/ApprovalType');
const { requireAuth, requireRole } = require('../middleware/auth');

const { writeAudit } = require('../utils/audit');

const router = express.Router();

// GET /api/approval-types - reference data, optionally filtered by department
router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.departmentId) filter.departmentId = req.query.departmentId;
  if (req.query.category) filter.category = req.query.category;

  const approvalTypes = await ApprovalType.find(filter).populate('departmentId', 'name shortCode');
  res.json({ approvalTypes });
});

// GET /api/approval-types/:id
router.get('/:id', async (req, res) => {
  const approvalType = await ApprovalType.findById(req.params.id).populate('departmentId', 'name shortCode');
  if (!approvalType) return res.status(404).json({ error: 'Approval type not found' });
  res.json({ approvalType });
});

// POST /api/approval-types - admin maintain the master rules list
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const approvalType = await ApprovalType.create(req.body);
  await writeAudit({ req, action: 'CREATE_APPROVAL_TYPE', entityType: 'ApprovalType', entityId: approvalType._id, description: `Created approval type ${approvalType.approvalName} (${approvalType.shortCode})` });
  res.status(201).json({ approvalType });
});

// PATCH /api/approval-types/:id
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const approvalType = await ApprovalType.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!approvalType) return res.status(404).json({ error: 'Approval type not found' });
  await writeAudit({
    req, action: 'UPDATE_REGULATORY_RULE', entityType: 'RegulatoryRule', entityId: approvalType._id,
    description: `Updated ${approvalType.approvalName}: SLA ${approvalType.processingSLADays}d, Fee ₹${approvalType.statutoryFeeINR}`
  });
  res.json({ approvalType });
});

module.exports = router;
