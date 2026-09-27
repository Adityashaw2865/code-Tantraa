const express = require('express');
const Inspection = require('../models/Inspection');
const Application = require('../models/Application');
const BusinessProfile = require('../models/BusinessProfile');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');
const { notify } = require('../utils/notify');
const { addHistory } = require('../utils/applicationHistory');

const router = express.Router();

// Loads an inspection and 403s if it isn't assigned to the logged-in inspector.
// Used by both the checklist and submit-report steps below.
async function loadOwnInspectionOrNull(id, inspectorId) {
  const inspection = await Inspection.findById(id);
  if (!inspection) return { inspection: null, forbidden: false };
  if (String(inspection.assignedInspectorId) !== String(inspectorId)) {
    return { inspection: null, forbidden: true };
  }
  return { inspection, forbidden: false };
}

// POST /api/inspections - officer/admin schedules an inspection for an application
router.post('/', requireAuth, requireRole('officer', 'admin'), async (req, res) => {
  const application = await Application.findById(req.body.applicationId);
  if (!application) return res.status(404).json({ error: 'Application not found' });

  // Only allow scheduling once the application has actually reached the
  // inspection-required stage - stops an inspection being created (and the
  // application's status being force-moved) while it's still e.g. 'submitted'
  // or already 'approved'.
  if (application.status !== 'inspection_required') {
    return res.status(400).json({
      error: `Cannot schedule an inspection while application status is '${application.status}'. It must first be moved to 'inspection_required'.`
    });
  }

  // Make sure whoever is being assigned is actually an active inspector -
  // without this check, an officer could (accidentally or otherwise) assign
  // any user id and the inspection would silently vanish from every
  // inspector's queue since that queue is filtered by role: 'inspector'.
  const inspector = await User.findById(req.body.assignedInspectorId);
  if (!inspector || inspector.role !== 'inspector' || inspector.isActive === false) {
    return res.status(400).json({ error: 'assignedInspectorId must belong to an active inspector' });
  }

  const inspection = await Inspection.create({
    ...req.body,
    assignedInspectorName: inspector.name,
    status: 'scheduled'
  });

  application.assignedInspectorId = inspection.assignedInspectorId;
  application.assignedInspectorName = inspection.assignedInspectorName;
  application.status = 'inspection_scheduled';
  addHistory(application, req.user, `Inspection ${inspection.inspectionNumber} scheduled`, {
    newStatus: 'inspection_scheduled'
  });
  await application.save();

  await notify({
    userId: inspection.assignedInspectorId,
    title: 'New inspection assigned',
    message: `${inspection.inspectionNumber} scheduled for ${inspection.scheduledDate}`,
    category: 'inspection',
    relatedEntityId: String(inspection._id)
  });

  res.status(201).json({ inspection });
});

// GET /api/inspections - scoped by role
// applicant -> only inspections for applications on their own business(es)
// inspector -> only inspections assigned to them
// officer/admin -> all (officer scoping to their department's applications is out of scope of this endpoint's use)
router.get('/', requireAuth, async (req, res) => {
  const filter = {};
  if (req.user.role === 'inspector') filter.assignedInspectorId = req.user._id;
  if (req.user.role === 'applicant') {
    const myBusinesses = await BusinessProfile.find({ applicantId: req.user._id }).select('_id');
    const myApplications = await Application.find({ businessId: { $in: myBusinesses.map((b) => b._id) } }).select('_id');
    filter.applicationId = { $in: myApplications.map((a) => a._id) };
  }
  if (req.query.status) filter.status = req.query.status;

  const inspections = await Inspection.find(filter).populate('applicationId').sort({ scheduledDate: 1 }).limit(1000);
  res.json({ inspections });
});

// GET /api/inspections/:id
router.get('/:id', requireAuth, async (req, res) => {
  const inspection = await Inspection.findById(req.params.id).populate({ path: 'applicationId', populate: { path: 'businessId' } });
  if (!inspection) return res.status(404).json({ error: 'Inspection not found' });

  if (req.user.role === 'applicant') {
    const owns = inspection.applicationId && inspection.applicationId.businessId
      && String(inspection.applicationId.businessId.applicantId) === String(req.user._id);
    if (!owns) return res.status(403).json({ error: 'Not authorized to view this inspection' });
  }
  if (req.user.role === 'inspector' && String(inspection.assignedInspectorId) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized to view this inspection' });
  }

  res.json({ inspection });
});

// PATCH /api/inspections/:id/checklist - inspector fills out checklist items during the visit
router.patch('/:id/checklist', requireAuth, requireRole('inspector'), async (req, res) => {
  const { checklist } = req.body; // array of { _id, isCompliant, findingsRemarks }
  const { inspection, forbidden } = await loadOwnInspectionOrNull(req.params.id, req.user._id);
  if (forbidden) return res.status(403).json({ error: 'Not your assigned inspection' });
  if (!inspection) return res.status(404).json({ error: 'Inspection not found' });

  checklist.forEach((update) => {
    const item = inspection.checklist.id(update._id);
    if (item) {
      if (typeof update.isCompliant === 'boolean') item.isCompliant = update.isCompliant;
      if (update.findingsRemarks !== undefined) item.findingsRemarks = update.findingsRemarks;
    }
  });
  inspection.status = 'in_progress';
  await inspection.save();

  res.json({ inspection });
});

// POST /api/inspections/:id/submit-report - inspector finalizes the visit
router.post('/:id/submit-report', requireAuth, requireRole('inspector'), async (req, res) => {
  const { overallComplianceOutcome, inspectorRemarks, evidencePhotosCount } = req.body;
  const { inspection, forbidden } = await loadOwnInspectionOrNull(req.params.id, req.user._id);
  if (forbidden) return res.status(403).json({ error: 'Not your assigned inspection' });
  if (!inspection) return res.status(404).json({ error: 'Inspection not found' });

  inspection.status = 'completed';
  inspection.overallComplianceOutcome = overallComplianceOutcome;
  inspection.inspectorRemarks = inspectorRemarks;
  inspection.evidencePhotosCount = evidencePhotosCount || 0;
  inspection.reportSubmittedDate = new Date();
  await inspection.save();

  const application = await Application.findById(inspection.applicationId);
  if (application) {
    // Record the intermediate 'inspection_completed' step, then move straight
    // to 'under_final_review' so it's ready for the officer's final decision -
    // keeps both history entries consistent with ALLOWED_TRANSITIONS.
    addHistory(application, req.user, `Inspection report submitted: ${overallComplianceOutcome}`, {
      previousStatus: application.status,
      newStatus: 'inspection_completed'
    });
    addHistory(application, req.user, 'Moved to final review', {
      previousStatus: 'inspection_completed',
      newStatus: 'under_final_review'
    });
    await application.save();
    if (application.assignedOfficerId) {
      await notify({
        userId: application.assignedOfficerId,
        title: 'Inspection completed',
        message: `${inspection.inspectionNumber}: ${overallComplianceOutcome}. Final decision pending.`,
        category: 'inspection',
        relatedEntityId: String(application._id)
      });
    }
  }

  await writeAudit({
    req,
    action: 'SUBMIT_INSPECTION_REPORT',
    entityType: 'Inspection',
    entityId: inspection._id,
    description: `${inspection.inspectionNumber}: ${overallComplianceOutcome}`
  });

  res.json({ inspection });
});

module.exports = router;
