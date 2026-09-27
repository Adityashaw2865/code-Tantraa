const express = require('express');
const rateLimit = require('express-rate-limit');
const SurveyResponse = require('../models/SurveyResponse');

const router = express.Router();

const CATEGORY_SOLUTIONS = {
  'Long processing delay': 'Live status dashboard with SLA countdown on every application, so delays are visible (and escalated) instead of silent.',
  'Multiple office visits required': 'Single-window dashboard covers every department from one login — no separate physical visits per approval.',
  'Document rejection / resubmission': 'Rules engine + document checklist per approval type catches missing/invalid documents before submission.',
  'No tracking / status updates': 'Real-time status timeline and notifications on every application, from submission to approval.',
  'Unclear requirements': 'Auto-computed required-approvals list based on business profile, plus an AI assistant for clarifications.',
  'Payment / fee confusion': 'Server-computed fee breakdown with a verifiable digital receipt (GRN + QR) for every payment.',
  'Poor communication from department': 'In-app query/clarification thread between applicant and officer, tied to the specific application.',
  'Other': 'Grievance redressal module routes unresolved issues to the right officer with a tracked resolution timeline.'
};

const surveyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many survey submissions from this device. Please try again later.' }
});

router.post('/', surveyLimiter, async (req, res) => {
  const {
    department, serviceType, daysTaken, documentRejected, rejectionReason,
    difficultyRating, biggestChallenge, respondentType, comment, respondentName
  } = req.body;

  if (!department || !serviceType || daysTaken === undefined || !difficultyRating || !biggestChallenge) {
    return res.status(400).json({ error: 'department, serviceType, daysTaken, difficultyRating and biggestChallenge are required' });
  }
  if (Number(daysTaken) < 0 || Number(difficultyRating) < 1 || Number(difficultyRating) > 5) {
    return res.status(400).json({ error: 'Invalid daysTaken or difficultyRating' });
  }

  const response = await SurveyResponse.create({
    department: String(department).slice(0, 100),
    serviceType: String(serviceType).slice(0, 100),
    daysTaken: Number(daysTaken),
    documentRejected: !!documentRejected,
    rejectionReason: rejectionReason || 'None',
    difficultyRating: Number(difficultyRating),
    biggestChallenge,
    respondentType: respondentType || 'Business owner',
    comment: comment ? String(comment).slice(0, 500) : undefined,
    respondentName: respondentName ? String(respondentName).slice(0, 100) : undefined,
    source: 'live'
  });

  res.status(201).json({ response });
});

router.get('/summary', async (req, res) => {
  const all = await SurveyResponse.find().select('-__v').sort({ createdAt: -1 }).limit(5000).lean();

  const baselineCount = all.filter((r) => r.source === 'baseline').length;
  const liveCount = all.filter((r) => r.source === 'live').length;
  const round1 = (n) => Math.round(n * 10) / 10;

  const byDeptMap = {};
  for (const r of all) {
    const d = (byDeptMap[r.department] ||= { department: r.department, days: [], rejected: 0, total: 0 });
    d.days.push(r.daysTaken);
    d.total += 1;
    if (r.documentRejected) d.rejected += 1;
  }
  const byDepartment = Object.values(byDeptMap)
    .map((d) => ({
      department: d.department,
      avgDays: round1(d.days.reduce((a, b) => a + b, 0) / d.days.length),
      responses: d.total,
      rejectionRatePercent: Math.round((d.rejected / d.total) * 100)
    }))
    .sort((a, b) => b.avgDays - a.avgDays);

  const reasonCounts = {};
  for (const r of all) {
    if (r.rejectionReason && r.rejectionReason !== 'None') {
      reasonCounts[r.rejectionReason] = (reasonCounts[r.rejectionReason] || 0) + 1;
    }
  }
  const topRejectionReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const challengeCounts = {};
  for (const r of all) {
    challengeCounts[r.biggestChallenge] = (challengeCounts[r.biggestChallenge] || 0) + 1;
  }
  const totalForPercent = all.length || 1;
  const byChallengeCategory = Object.entries(challengeCounts)
    .map(([category, count]) => ({
      category,
      count,
      percent: Math.round((count / totalForPercent) * 100),
      vyaparSetuSolution: CATEGORY_SOLUTIONS[category] || CATEGORY_SOLUTIONS.Other
    }))
    .sort((a, b) => b.count - a.count);

  const avgDifficulty = all.length ? round1(all.reduce((a, r) => a + r.difficultyRating, 0) / all.length) : null;
  const avgDaysOverall = all.length ? round1(all.reduce((a, r) => a + r.daysTaken, 0) / all.length) : null;

  const recentLive = all
    .filter((r) => r.source === 'live')
    .slice(0, 15)
    .map((r) => ({
      department: r.department, serviceType: r.serviceType, daysTaken: r.daysTaken,
      difficultyRating: r.difficultyRating, biggestChallenge: r.biggestChallenge,
      comment: r.comment, respondentName: r.respondentName || 'Anonymous', createdAt: r.createdAt
    }));

  res.json({ totalResponses: all.length, baselineCount, liveCount, avgDifficulty, avgDaysOverall, byDepartment, topRejectionReasons, byChallengeCategory, recentLive });
});

module.exports = router;