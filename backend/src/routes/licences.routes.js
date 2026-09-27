const express = require('express');
const DigitalLicence = require('../models/DigitalLicence');
const Application = require('../models/Application');
const BusinessProfile = require('../models/BusinessProfile');
const { requireAuth, requireRole } = require('../middleware/auth');
const { streamCertificate } = require('../services/certificatePdf');
const { writeAudit } = require('../utils/audit');
const { notify } = require('../utils/notify');

const router = express.Router();

// POST /api/licences - issue the licence once an application is approved.
// For a renewal application the new licence starts from the old expiry (no lost days) and links both ways.
router.post('/', requireAuth, requireRole('officer', 'admin'), async (req, res) => {
  const { applicationId, validityYears } = req.body;
  const application = await Application.findById(applicationId).populate('approvalTypeId').populate('businessId');
  if (!application) return res.status(404).json({ error: 'Application not found' });
  if (application.status !== 'approved') {
    return res.status(400).json({ error: 'Licence can only be issued for an approved application' });
  }
  if (await DigitalLicence.findOne({ applicationId: application._id })) {
    return res.status(409).json({ error: 'A licence has already been issued for this application' });
  }

  const issueDate = new Date();
  const rawYears = validityYears ?? application.approvalTypeId.validityYears;
  const years = rawYears === 'Perpetual' ? 50 : Number(rawYears) || 1;

  let old = null;
  let base = issueDate;
  if (application.renewalOfLicenceId) {
    old = await DigitalLicence.findById(application.renewalOfLicenceId);
    if (old && new Date(old.expiryDate) > issueDate) base = new Date(old.expiryDate);
  }
  const expiryDate = new Date(base);
  expiryDate.setFullYear(expiryDate.getFullYear() + years);

  const licence = await DigitalLicence.create({
    licenceNumber: `LIC-${application.applicationNumber.replace('APP-', '')}`,
    approvalTypeId: application.approvalTypeId._id,
    approvalName: application.approvalTypeId.approvalName,
    departmentName: req.body.departmentName || '',
    businessId: application.businessId._id,
    businessName: application.businessId.businessName,
    applicationId: application._id,
    issueDate,
    expiryDate,
    validityText: rawYears === 'Perpetual' ? 'Perpetual' : `${years} year(s)`,
    certificatePdfUrl: req.body.certificatePdfUrl,
    renewalOfLicenceId: old ? old._id : undefined
  });
  licence.certificatePdfUrl = licence.certificatePdfUrl || `/api/licences/${licence._id}/certificate`;
  await licence.save();

  if (old) {
    old.renewedByLicenceId = licence._id;
    await old.save();
  }

  application.licenceNumber = licence.licenceNumber;
  application.expiryDate = expiryDate;
  await application.save();

  await writeAudit({
    req, action: old ? 'RENEW_LICENCE' : 'ISSUE_LICENCE', entityType: 'Licence', entityId: licence._id,
    description: `${licence.licenceNumber} issued${old ? ` (renewal of ${old.licenceNumber})` : ''}, valid until ${expiryDate.toISOString().slice(0, 10)}`
  });
  await notify({
    userId: application.businessId.applicantId,
    title: old ? `Licence renewed: ${licence.approvalName}` : `Licence issued: ${licence.approvalName}`,
    message: `${licence.licenceNumber} is valid until ${expiryDate.toISOString().slice(0, 10)}. You can download the certificate from your dashboard.`,
    category: old ? 'renewal' : 'application',
    relatedEntityId: String(licence._id)
  });

  res.status(201).json({ licence });
});

// GET /api/licences/:id/certificate - real PDF certificate with QR (owner or staff)
router.get('/:id/certificate', requireAuth, async (req, res) => {
  const licence = await DigitalLicence.findById(req.params.id);
  if (!licence) return res.status(404).json({ error: 'Licence not found' });
  const business = await BusinessProfile.findById(licence.businessId);
  if (req.user.role === 'applicant' && (!business || String(business.applicantId) !== String(req.user._id))) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${licence.licenceNumber}.pdf"`);
  await streamCertificate(licence, business, res);
});

// GET /api/licences?businessId=... - applicant: only their own businesses' licences; staff: all (or one business)
router.get('/', requireAuth, async (req, res) => {
  const filter = {};
  if (req.user.role === 'applicant') {
    const mine = await BusinessProfile.find({ applicantId: req.user._id }).select('_id');
    const ids = mine.map((b) => String(b._id));
    if (req.query.businessId && !ids.includes(String(req.query.businessId))) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    filter.businessId = req.query.businessId || { $in: ids };
  } else if (req.query.businessId) {
    filter.businessId = req.query.businessId;
  }
  const licences = await DigitalLicence.find(filter).sort({ issueDate: -1 });
  res.json({ licences });
});

// GET /api/licences/verify/:code - PUBLIC endpoint, no auth. Powers the QR/document
// verification modal so banks, auditors or the public can confirm a licence is genuine.
router.get('/verify/:code', async (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const licence = await DigitalLicence.findOne({ $or: [{ qrVerificationCode: code }, { licenceNumber: code }] });
  if (!licence) {
    return res.status(404).json({ valid: false, error: 'No licence found for this verification code' });
  }

  res.json({
    valid: true,
    licence: {
      licenceNumber: licence.licenceNumber,
      approvalName: licence.approvalName,
      businessName: licence.businessName,
      issueDate: licence.issueDate,
      expiryDate: licence.expiryDate,
      departmentName: licence.departmentName,
      status: licence.status
    }
  });
});

module.exports = router;
