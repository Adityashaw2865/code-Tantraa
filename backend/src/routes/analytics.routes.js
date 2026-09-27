const express = require('express');
const Application = require('../models/Application');
const DigitalLicence = require('../models/DigitalLicence');
const Grievance = require('../models/Grievance');
const Department = require('../models/Department');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const DAY = 24 * 60 * 60 * 1000;
const OPEN = ['submitted', 'under_verification', 'query_raised', 'documents_resubmitted', 'inspection_required',
  'inspection_scheduled', 'inspection_completed', 'under_final_review'];
const round1 = (n) => Math.round(n * 10) / 10;

// GET /api/analytics/summary - admin only. Real figures computed from the database.
router.get('/summary', requireAuth, requireRole('admin'), async (req, res) => {
  const [byStatusRaw, byDeptRaw, decided, rejectionsRaw, monthlyRaw, licencesRaw, grievancesRaw, departments, historyApps, openBreached] =
    await Promise.all([
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Application.aggregate([
        { $group: {
          _id: '$departmentId', total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          open: { $sum: { $cond: [{ $in: ['$status', OPEN] }, 1, 0] } }
        } }
      ]),
      Application.find({ status: 'approved', submissionDate: { $ne: null }, approvalDate: { $ne: null } })
        .select('submissionDate approvalDate targetSLADate'),
      Application.aggregate([
        { $match: { status: 'rejected', rejectionReason: { $nin: [null, ''] } } },
        { $group: { _id: '$rejectionReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 5 }
      ]),
      Application.aggregate([
        { $match: { submissionDate: { $gte: new Date(Date.now() - 183 * DAY) } } },
        { $group: { _id: { y: { $year: '$submissionDate' }, m: { $month: '$submissionDate' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]),
      DigitalLicence.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Grievance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Department.find().select('name shortCode'),
      Application.find({ 'history.1': { $exists: true } }).select('history').limit(5000).lean(),
      Application.countDocuments({ status: { $in: OPEN }, targetSLADate: { $lt: new Date() } })
    ]);

  const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const byStatus = toMap(byStatusRaw);
  const totalApplications = Object.values(byStatus).reduce((a, b) => a + b, 0);

  // processing time + SLA compliance over approved applications
  const days = decided.map((a) => (new Date(a.approvalDate) - new Date(a.submissionDate)) / DAY);
  const withSla = decided.filter((a) => a.targetSLADate);
  const withinSla = withSla.filter((a) => new Date(a.approvalDate) <= new Date(a.targetSLADate)).length;

  // where time is really spent: average dwell per status, from the activity history
  const dwell = {};
  for (const app of historyApps) {
    const h = (app.history || []).filter((e) => e.newStatus).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    for (let i = 0; i < h.length - 1; i++) {
      const st = h[i].newStatus;
      if (['draft', 'approved', 'rejected'].includes(st)) continue;
      const d = (new Date(h[i + 1].timestamp) - new Date(h[i].timestamp)) / DAY;
      (dwell[st] = dwell[st] || []).push(d);
    }
  }
  const stageDwell = Object.entries(dwell)
    .map(([status, arr]) => ({ status, avgDays: round1(arr.reduce((a, b) => a + b, 0) / arr.length), samples: arr.length }))
    .sort((a, b) => b.avgDays - a.avgDays);

  const deptName = Object.fromEntries(departments.map((d) => [String(d._id), d.name]));
  res.json({
    generatedAt: new Date().toISOString(),
    totalApplications,
    openApplications: Object.entries(byStatus).filter(([s]) => OPEN.includes(s)).reduce((a, [, c]) => a + c, 0),
    approved: byStatus.approved || 0,
    rejected: byStatus.rejected || 0,
    avgProcessingDays: days.length ? round1(days.reduce((a, b) => a + b, 0) / days.length) : null,
    slaCompliancePercent: withSla.length ? Math.round((withinSla / withSla.length) * 100) : null,
    openSlaBreaches: openBreached,
    byStatus,
    byDepartment: byDeptRaw
      .map((r) => ({ department: deptName[String(r._id)] || 'Unknown', total: r.total, approved: r.approved, rejected: r.rejected, open: r.open }))
      .sort((a, b) => b.total - a.total),
    monthly: monthlyRaw.map((r) => ({ month: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`, count: r.count })),
    topRejectionReasons: rejectionsRaw.map((r) => ({ reason: r._id, count: r.count })),
    stageDwell,
    licences: toMap(licencesRaw),
    grievances: toMap(grievancesRaw)
  });
});

module.exports = router;
