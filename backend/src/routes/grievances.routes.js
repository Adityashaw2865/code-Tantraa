const express = require('express');
const Grievance = require('../models/Grievance');
const { requireAuth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');
const { notify } = require('../utils/notify');

const router = express.Router();

// POST /api/grievances - applicant files a grievance/appeal (e.g. under RTSA 2015)
// Only these fields come from the applicant; status/priority/resolution/grievanceNumber
// are server-controlled so a client can't file a grievance that's already "Resolved".
router.post('/', requireAuth, requireRole('applicant'), async (req, res) => {
  const { businessName, relatedApplicationId, category, subject, description } = req.body;
  const grievance = await Grievance.create({
    businessName, relatedApplicationId, category, subject, description,
    applicantId: req.user._id,
    applicantName: req.user.name
  });
  res.status(201).json({ grievance });
});

// GET /api/grievances - applicant sees their own; staff see all/assigned
router.get('/', requireAuth, async (req, res) => {
  const filter = {};
  if (req.user.role === 'applicant') filter.applicantId = req.user._id;
  if (req.query.status) filter.status = req.query.status;

  const grievances = await Grievance.find(filter).sort({ createdDate: -1 }).limit(1000);
  res.json({ grievances });
});

// PATCH /api/grievances/:id - staff updates status/resolution
router.patch('/:id', requireAuth, requireRole('officer', 'admin'), async (req, res) => {
  const { status, assignedOfficerName, officialResolutionRemarks, priority } = req.body;
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) return res.status(404).json({ error: 'Grievance not found' });

  const prevStatus = grievance.status;
  if (status) grievance.status = status;
  if (assignedOfficerName) grievance.assignedOfficerName = assignedOfficerName;
  if (officialResolutionRemarks) grievance.officialResolutionRemarks = officialResolutionRemarks;
  if (priority) grievance.priority = priority;
  await grievance.save();

  await writeAudit({
    req, action: 'UPDATE_GRIEVANCE', entityType: 'Grievance', entityId: grievance._id,
    description: `${grievance.grievanceNumber}: ${prevStatus} -> ${grievance.status}`,
    previousValue: prevStatus, newValue: grievance.status
  });
  await notify({
    userId: grievance.applicantId,
    title: `Grievance ${grievance.grievanceNumber} update`,
    message: `Status: ${grievance.status}.${officialResolutionRemarks ? ' Remarks: ' + officialResolutionRemarks : ''}`,
    category: 'alert',
    relatedEntityId: String(grievance._id)
  });

  res.json({ grievance });
});

module.exports = router;
