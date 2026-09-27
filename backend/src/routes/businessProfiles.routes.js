const express = require('express');
const BusinessProfile = require('../models/BusinessProfile');
const ApprovalType = require('../models/ApprovalType');
const DocumentVaultItem = require('../models/DocumentVaultItem');
const { requireAuth, requireRole } = require('../middleware/auth');
const { evaluateRequiredApprovals } = require('../services/rulesEngine');

const router = express.Router();

function isOwnerOrStaff(req, profile) {
  const staffRoles = ['officer', 'inspector', 'admin'];
  return String(profile.applicantId) === String(req.user._id) || staffRoles.includes(req.user.role);
}

// POST /api/business-profiles - applicant creates their business profile (onboarding wizard)
router.post('/', requireAuth, requireRole('applicant'), async (req, res) => {
  const profile = await BusinessProfile.create({ ...req.body, applicantId: req.user._id });
  res.status(201).json({ businessProfile: profile });
});

// GET /api/business-profiles/mine - applicant's own profile
router.get('/mine', requireAuth, requireRole('applicant'), async (req, res) => {
  const profile = await BusinessProfile.findOne({ applicantId: req.user._id }).sort({ createdAt: -1 });
  if (!profile) return res.status(404).json({ error: 'No business profile found for this account yet' });
  res.json({ businessProfile: profile });
});

// GET /api/business-profiles/mine-all - every business the applicant owns (multi-business support)
router.get('/mine-all', requireAuth, requireRole('applicant'), async (req, res) => {
  const profiles = await BusinessProfile.find({ applicantId: req.user._id }).sort({ createdAt: -1 });
  res.json({ businessProfiles: profiles });
});

// GET /api/business-profiles/:id
router.get('/:id', requireAuth, async (req, res) => {
  const profile = await BusinessProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Business profile not found' });
  if (!isOwnerOrStaff(req, profile)) return res.status(403).json({ error: 'Not authorized to view this profile' });
  res.json({ businessProfile: profile });
});

// Fields the owner is allowed to change. applicantId, _id and timestamps are never
// settable from the request body - this is what stops mass assignment on this route.
const EDITABLE_FIELDS = [
  'businessName', 'tradeName', 'businessType', 'industrySector', 'state', 'district', 'pincode', 'address',
  'projectSize', 'investmentAmountCr', 'investmentAmountText', 'numberOfEmployees', 'currentStage',
  'panNumber', 'gstin', 'udyamNumber', 'contactEmail', 'contactPhone', 'landType', 'builtUpAreaSqFt',
  'connectedPowerLoadKVA', 'waterRequirementKLD', 'environmentalCategory', 'hazardousMaterialsPresent',
  'effluentGenerationExpected', 'boilerInstallationRequired', 'productionCapacityAnnual'
];

// PATCH /api/business-profiles/:id - owner can edit their own profile
router.patch('/:id', requireAuth, async (req, res) => {
  const profile = await BusinessProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Business profile not found' });
  if (String(profile.applicantId) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to edit this profile' });
  }

  EDITABLE_FIELDS.forEach((key) => {
    if (req.body[key] !== undefined) profile[key] = req.body[key];
  });
  await profile.save();
  res.json({ businessProfile: profile });
});

// GET /api/business-profiles/:id/required-approvals
// Runs the server-side rules engine against the profile + this business's uploaded
// documents to return which approvals are needed, their readiness, and reasoning.
router.get('/:id/required-approvals', requireAuth, async (req, res) => {
  const profile = await BusinessProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Business profile not found' });
  if (!isOwnerOrStaff(req, profile)) return res.status(403).json({ error: 'Not authorized to view this profile' });

  const [allApprovals, documents] = await Promise.all([
    ApprovalType.find(),
    DocumentVaultItem.find({ businessId: profile._id })
  ]);

  const evaluated = evaluateRequiredApprovals(profile, allApprovals, documents);
  res.json({ evaluated });
});

module.exports = router;