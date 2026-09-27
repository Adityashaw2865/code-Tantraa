const express = require('express');
const Application = require('../models/Application');
const BusinessProfile = require('../models/BusinessProfile');
const DocumentVaultItem = require('../models/DocumentVaultItem');
const { requireAuth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');
const { notify } = require('../utils/notify');
const { addHistory } = require('../utils/applicationHistory');
const { calculateApplicationRisk } = require('../services/rulesEngine');

const router = express.Router();

// Legal status transitions - a status can only move forward along these edges
// (or to 'rejected'/'query_raised' from most active states). Prevents the client
// from, say, jumping straight from 'draft' to 'approved'.
const ALLOWED_TRANSITIONS = {
  draft: ['ready_for_submission'],
  ready_for_submission: ['submitted'],
  submitted: ['under_verification', 'rejected'],
  under_verification: ['query_raised', 'inspection_required', 'under_final_review', 'rejected'],
  query_raised: ['documents_resubmitted', 'rejected'],
  documents_resubmitted: ['under_verification'],
  inspection_required: ['inspection_scheduled'],
  inspection_scheduled: ['inspection_completed'],
  inspection_completed: ['under_final_review', 'query_raised'],
  under_final_review: ['approved', 'rejected', 'query_raised'],
  approved: [],
  rejected: []
};

// Confirms a business profile belongs to the logged-in applicant, or throws
// a res.status().json() style rejection by returning null.
async function ownedBusinessOrNull(businessId, applicantId) {
  const business = await BusinessProfile.findById(businessId);
  if (!business || String(business.applicantId) !== String(applicantId)) return null;
  return business;
}

// POST /api/applications - applicant starts a new application for an approval type
router.post('/', requireAuth, requireRole('applicant'), async (req, res) => {
  const { businessId, renewalOfLicenceId } = req.body;
  let { approvalTypeId, departmentId } = req.body;

  const business = await ownedBusinessOrNull(businessId, req.user._id);
  if (!business) return res.status(403).json({ error: 'This business profile does not belong to you' });

  // Renewal: linked to an existing licence; approval type/department are taken from that licence.
  let renewalOf;
  if (renewalOfLicenceId) {
    const DigitalLicence = require('../models/DigitalLicence');
    const ApprovalType = require('../models/ApprovalType');
    const old = await DigitalLicence.findById(renewalOfLicenceId);
    if (!old || String(old.businessId) !== String(business._id)) {
      return res.status(403).json({ error: 'This licence does not belong to your business' });
    }
    if (old.renewedByLicenceId) return res.status(409).json({ error: 'This licence has already been renewed' });
    if (!old.canRenew) {
      return res.status(400).json({ error: `Renewal is not open yet (${old.daysToExpiry} days to expiry)` });
    }
    const open = await Application.findOne({ renewalOfLicenceId: old._id, status: { $ne: 'rejected' } });
    if (open) return res.status(409).json({ error: `A renewal application (${open.applicationNumber}) is already in progress` });
    const at = await ApprovalType.findById(old.approvalTypeId);
    approvalTypeId = old.approvalTypeId;
    departmentId = at && at.departmentId;
    renewalOf = old._id;
  }

  const application = new Application({ businessId, approvalTypeId, departmentId, status: 'draft', renewalOfLicenceId: renewalOf });
  addHistory(application, req.user, renewalOf ? 'Renewal application drafted' : 'Application drafted', { newStatus: 'draft' });
  await application.save();

  res.status(201).json({ application });
});

// GET /api/applications - list, scoped by role
// applicant -> only their own business's applications
// officer/inspector -> assigned to them, or unassigned in their department
// admin -> all (optionally filtered by department/status query params)
router.get('/', requireAuth, async (req, res) => {
  const filter = {};

  if (req.user.role === 'applicant') {
    const myBusinesses = await BusinessProfile.find({ applicantId: req.user._id }).select('_id');
    filter.businessId = { $in: myBusinesses.map((b) => b._id) };
  } else if (req.user.role === 'officer') {
    // officer sees: applications assigned to them + unassigned submitted ones (drafts are private to the applicant)
    filter.$or = [{ assignedOfficerId: req.user._id }, { assignedOfficerId: null }];
  } else if (req.user.role === 'inspector') {
    filter.assignedInspectorId = req.user._id;
  }
  // admin: no scoping, sees everything

  if (req.query.status) {
    // An officer can never use ?status=draft to peek at another applicant's private drafts.
    if (req.user.role === 'officer' && req.query.status === 'draft') {
      return res.status(403).json({ error: 'Officers cannot view draft applications' });
    }
    filter.status = req.query.status;
  } else if (req.user.role === 'officer') {
    filter.status = { $ne: 'draft' };
  }
  if (req.query.departmentId && req.user.role === 'admin') filter.departmentId = req.query.departmentId;

  const applications = await Application.find(filter)
    .populate('businessId', 'businessName industrySector state district')
    .populate('approvalTypeId', 'approvalName processingSLADays')
    .sort({ createdAt: -1 })
    .limit(2000);

  res.json({ applications });
});

// GET /api/applications/:id
router.get('/:id', requireAuth, async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('businessId')
    .populate('approvalTypeId')
    .populate('departmentId')
    .populate('attachedDocumentIds');

  if (!application) return res.status(404).json({ error: 'Application not found' });

  if (req.user.role === 'applicant' && !(await ownedBusinessOrNull(application.businessId, req.user._id))) {
    return res.status(403).json({ error: 'Not authorized to view this application' });
  }

  res.json({ application });
});

// POST /api/applications/:id/submit - applicant submits a draft, server computes risk & SLA date
router.post('/:id/submit', requireAuth, requireRole('applicant'), async (req, res) => {
  const application = await Application.findById(req.params.id).populate('approvalTypeId').populate('businessId');
  if (!application) return res.status(404).json({ error: 'Application not found' });
  if (!['draft', 'ready_for_submission'].includes(application.status)) {
    return res.status(400).json({ error: `Cannot submit an application in status '${application.status}'` });
  }

  const documents = await DocumentVaultItem.find({ businessId: application.businessId._id });
  const requiredKeys = application.approvalTypeId.requiredDocumentKeys || [];
  const uploadedKeys = new Set(documents.map((d) => d.documentKey));
  const missing = requiredKeys.filter((k) => !uploadedKeys.has(k));

  if (missing.length > 0) {
    return res.status(400).json({ error: 'Cannot submit: required documents missing', missingDocumentKeys: missing });
  }

  const { riskLevel, riskFactors } = calculateApplicationRisk(application.businessId, missing.length);
  const slaDate = new Date();
  slaDate.setDate(slaDate.getDate() + (application.approvalTypeId.processingSLADays || 30));

  // attach the latest uploaded file for each required document key
  const latest = {};
  documents.forEach((d) => { if (!latest[d.documentKey] || d.version > latest[d.documentKey].version) latest[d.documentKey] = d; });
  application.attachedDocumentIds = requiredKeys.map((k) => latest[k] && latest[k]._id).filter(Boolean);

  // auto-assign a department officer if none yet (admin can reassign)
  if (!application.assignedOfficerId) {
    const User = require('../models/User');
    const officer = await User.findOne({ role: 'officer', departmentId: application.departmentId, isActive: { $ne: false } })
      || await User.findOne({ role: 'officer', isActive: { $ne: false } });
    if (officer) {
      application.assignedOfficerId = officer._id;
      application.assignedOfficerName = officer.name;
    }
  }

  application.submissionDate = new Date();
  application.targetSLADate = slaDate;
  application.riskLevel = riskLevel;
  application.riskFactors = riskFactors;
  application.completenessScorePercent = 100;
  addHistory(application, req.user, 'Application submitted for review', {
    previousStatus: application.status,
    newStatus: 'submitted'
  });
  await application.save();

  await writeAudit({
    req,
    action: 'SUBMIT_APPLICATION',
    entityType: 'Application',
    entityId: application._id,
    description: `Submitted ${application.applicationNumber}`
  });

  res.json({ application });
});

// PATCH /api/applications/:id/status - officer/admin moves status forward
router.patch('/:id/status', requireAuth, requireRole('officer', 'admin'), async (req, res) => {
  const { status, remarks, rejectionReason } = req.body;
  const application = await Application.findById(req.params.id).populate('businessId');
  if (!application) return res.status(404).json({ error: 'Application not found' });

  // An officer may only act on applications assigned to them, or claim an unassigned one
  // (by acting on it - matches what GET / already lets them see). Never someone else's.
  if (req.user.role === 'officer') {
    if (application.assignedOfficerId && String(application.assignedOfficerId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'This application is assigned to a different officer' });
    }
    if (!application.assignedOfficerId) {
      application.assignedOfficerId = req.user._id;
      application.assignedOfficerName = req.user.name;
    }
  }

  const allowedNext = ALLOWED_TRANSITIONS[application.status] || [];
  if (!allowedNext.includes(status)) {
    return res.status(400).json({
      error: `Cannot move from '${application.status}' to '${status}'`,
      allowedNext
    });
  }

  // Scrutiny isn't actually done until every attached document has been
  // individually verified - without this check an officer could move an
  // application straight through to inspection/final review/approved while
  // documents still sit at 'under_verification' forever, which is
  // misleading to the applicant and skips the actual compliance check.
  // Only gate forward progress (not sending it back via query_raised/rejected).
  const isForwardMove = application.status === 'under_verification' && !['query_raised', 'rejected'].includes(status);
  if (isForwardMove && application.attachedDocumentIds?.length) {
    const docs = await DocumentVaultItem.find({ _id: { $in: application.attachedDocumentIds } }).select('name verificationStatus');
    const unverified = docs.filter((d) => d.verificationStatus !== 'verified');
    if (unverified.length) {
      return res.status(400).json({
        error: 'All attached documents must be verified before moving past scrutiny',
        unverifiedDocuments: unverified.map((d) => d.name)
      });
    }
  }

  const previousStatus = application.status;
  if (remarks) application.officerRemarks = remarks;
  if (status === 'rejected' && rejectionReason) application.rejectionReason = rejectionReason;
  if (status === 'approved') application.approvalDate = new Date();

  addHistory(application, req.user, `Status changed to ${status}`, {
    details: remarks || rejectionReason,
    previousStatus,
    newStatus: status
  });
  await application.save();

  await writeAudit({
    req,
    action: 'UPDATE_APPLICATION_STATUS',
    entityType: 'Application',
    entityId: application._id,
    description: `${application.applicationNumber}: ${previousStatus} -> ${status}`,
    previousValue: previousStatus,
    newValue: status
  });

  const applicantOwner = await BusinessProfile.findById(application.businessId);
  if (applicantOwner) {
    await notify({
      userId: applicantOwner.applicantId,
      title: `Application ${application.applicationNumber} update`,
      message: `Your application status changed to "${status}".`,
      category: 'application',
      relatedEntityId: String(application._id),
      urgency: status === 'rejected' ? 'high' : 'normal'
    });
  }

  res.json({ application });
});

// PATCH /api/applications/:id/assign-officer
router.patch('/:id/assign-officer', requireAuth, requireRole('admin'), async (req, res) => {
  const { officerId, officerName } = req.body;
  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });

  application.assignedOfficerId = officerId;
  application.assignedOfficerName = officerName;
  addHistory(application, req.user, `Assigned to officer ${officerName}`);
  await application.save();

  await notify({
    userId: officerId,
    title: 'New application assigned',
    message: `${application.applicationNumber} has been assigned to you.`,
    category: 'application',
    relatedEntityId: String(application._id)
  });

  res.json({ application });
});

module.exports = router;
