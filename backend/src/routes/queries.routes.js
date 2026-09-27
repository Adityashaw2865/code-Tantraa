const express = require('express');
const QueryMessage = require('../models/QueryMessage');
const Application = require('../models/Application');
const BusinessProfile = require('../models/BusinessProfile');
const { requireAuth, requireRole } = require('../middleware/auth');
const { addHistory } = require('../utils/applicationHistory');
const { notify } = require('../utils/notify');

const router = express.Router();

// POST /api/queries - officer raises a query (status is moved to query_raised by the client first)
router.post('/', requireAuth, requireRole('officer', 'admin'), async (req, res) => {
  const { applicationId, subject, queryText, requestedDocumentKey, deadlineDate } = req.body;
  const application = await Application.findById(applicationId);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  const query = await QueryMessage.create({
    applicationId, subject, queryText, requestedDocumentKey,
    officerId: req.user._id, officerName: req.user.name,
    deadlineDate: deadlineDate || new Date(Date.now() + 7 * 864e5)
  });
  const business = await BusinessProfile.findById(application.businessId);
  if (business) {
    await notify({
      userId: business.applicantId,
      title: `Query on ${application.applicationNumber}`,
      message: subject,
      category: 'query',
      relatedEntityId: String(application._id),
      urgency: 'high'
    });
  }
  res.status(201).json({ query });
});

// GET /api/queries - applicant: queries on own applications; staff: all
router.get('/', requireAuth, async (req, res) => {
  const filter = {};
  if (req.user.role === 'applicant') {
    const mine = await BusinessProfile.find({ applicantId: req.user._id }).select('_id');
    const apps = await Application.find({ businessId: { $in: mine.map((b) => b._id) } }).select('_id');
    filter.applicationId = { $in: apps.map((a) => a._id) };
  }
  const queries = await QueryMessage.find(filter).sort({ raisedDate: -1 });
  res.json({ queries });
});

// PATCH /api/queries/:id/respond - applicant answers a query
router.patch('/:id/respond', requireAuth, requireRole('applicant'), async (req, res) => {
  const { responseText, attachedDocumentId, attachedDocumentName } = req.body;
  const query = await QueryMessage.findById(req.params.id);
  if (!query) return res.status(404).json({ error: 'Query not found' });
  const application = await Application.findById(query.applicationId);
  const business = application && (await BusinessProfile.findById(application.businessId));
  if (!business || String(business.applicantId) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Not your application' });
  }
  query.isResolved = true;
  query.applicantResponse = {
    responseDate: new Date(), responseText,
    attachedDocumentId: attachedDocumentId || undefined, attachedDocumentName
  };
  await query.save();

  if (application.status === 'query_raised') {
    addHistory(application, req.user, 'Query response submitted', {
      details: responseText, previousStatus: application.status, newStatus: 'documents_resubmitted'
    });
    await application.save();
  }
  await notify({
    userId: query.officerId,
    title: `Query answered: ${application.applicationNumber}`,
    message: query.subject,
    category: 'query',
    relatedEntityId: String(application._id)
  });
  res.json({ query });
});

module.exports = router;
