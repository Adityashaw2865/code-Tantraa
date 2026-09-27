const express = require('express');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const BusinessProfile = require('../models/BusinessProfile');
const ApprovalType = require('../models/ApprovalType');
const Department = require('../models/Department');
const { requireAuth, requireRole } = require('../middleware/auth');
const { streamReceipt } = require('../services/paymentReceiptPdf');
const { writeAudit } = require('../utils/audit');
const { notify } = require('../utils/notify');

const router = express.Router();

// No real payment gateway (Razorpay/PayU/MahaGRAS) is wired up yet - that needs a merchant
// account + KYC the applicant/operator must set up separately. This is a real, persisted,
// server-priced payment ledger that settles instantly ("sandbox" provider), the same way a
// UPI/net-banking payment would look to the rest of the app. Swap the `settle()` call below
// for a real gateway's confirm-payment webhook handler once credentials exist, and every
// other route (receipt, verify, audit, notification) keeps working unchanged.
async function settle() {
  return { bankReferenceCIN: `SBIN${Date.now().toString().slice(-10)}`, status: 'success' };
}

async function generateUniqueGrn() {
  for (let i = 0; i < 5; i++) {
    const grn = `MH-2026-GRAS-${crypto.randomInt(1000, 9999)}`;
    if (!(await Payment.findOne({ grnNumber: grn }))) return grn;
  }
  return `MH-2026-GRAS-${Date.now().toString().slice(-6)}`;
}

// POST /api/payments - pay the consolidated statutory fee for a set of approval types.
// The client tells us WHICH approval types apply to their business; we never trust a
// client-supplied amount - every fee is re-fetched from the ApprovalType record by ID.
router.post('/', requireAuth, requireRole('applicant'), async (req, res) => {
  const { businessId, approvalTypeIds, method } = req.body;
  if (!Array.isArray(approvalTypeIds) || approvalTypeIds.length === 0) {
    return res.status(400).json({ error: 'approvalTypeIds must be a non-empty array' });
  }
  if (!['upi', 'netbanking', 'sbiepay'].includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  const business = await BusinessProfile.findById(businessId);
  if (!business || String(business.applicantId) !== String(req.user._id)) {
    return res.status(403).json({ error: 'This business profile does not belong to you' });
  }

  const approvalTypes = await ApprovalType.find({ _id: { $in: approvalTypeIds } });
  if (approvalTypes.length !== approvalTypeIds.length) {
    return res.status(400).json({ error: 'One or more approval types could not be found' });
  }
  const departments = await Department.find({ _id: { $in: approvalTypes.map((a) => a.departmentId) } });
  const deptName = Object.fromEntries(departments.map((d) => [String(d._id), d.name]));

  const breakdown = approvalTypes.map((a) => ({
    approvalTypeId: a._id, approvalName: a.approvalName,
    departmentName: deptName[String(a.departmentId)] || '', amount: a.statutoryFeeINR || 0
  }));
  const totalAmount = breakdown.reduce((sum, b) => sum + b.amount, 0);
  if (totalAmount <= 0) return res.status(400).json({ error: 'No statutory fee is due for the selected approvals' });

  const { bankReferenceCIN } = await settle();
  const payment = await Payment.create({
    grnNumber: await generateUniqueGrn(),
    businessId: business._id, applicantId: req.user._id,
    breakdown, totalAmount, method, status: 'success', bankReferenceCIN
  });

  await writeAudit({
    req, action: 'CREATE_PAYMENT', entityType: 'Payment', entityId: payment._id,
    description: `${payment.grnNumber}: Rs.${totalAmount} paid via ${method} for ${business.businessName}`
  });
  await notify({
    userId: req.user._id, category: 'application', urgency: 'normal', relatedEntityId: String(payment._id),
    title: `Payment successful: ${payment.grnNumber}`,
    message: `Rs.${totalAmount.toLocaleString('en-IN')} paid successfully. Download your e-Challan receipt from the payment center.`
  });

  res.status(201).json({ payment: { ...payment.toJSON(), businessName: business.businessName } });
});

// GET /api/payments?businessId= - owner or admin
router.get('/', requireAuth, async (req, res) => {
  const filter = {};
  if (req.query.businessId) filter.businessId = req.query.businessId;
  if (req.user.role === 'applicant') filter.applicantId = req.user._id;
  const payments = await Payment.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json({ payments });
});

// GET /api/payments/verify/:grn - public, no authentication (matches licence verification pattern)
router.get('/verify/:grn', async (req, res) => {
  const payment = await Payment.findOne({ grnNumber: String(req.params.grn || '').trim().toUpperCase() });
  if (!payment || payment.status !== 'success') return res.json({ valid: false });
  res.json({
    valid: true,
    payment: { grnNumber: payment.grnNumber, totalAmount: payment.totalAmount, paidAt: payment.paidAt, method: payment.method }
  });
});

// GET /api/payments/:id/receipt - real PDF receipt with QR (owner or staff)
router.get('/:id/receipt', requireAuth, async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (req.user.role === 'applicant' && String(payment.applicantId) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const business = await BusinessProfile.findById(payment.businessId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${payment.grnNumber}.pdf"`);
  await streamReceipt({ ...payment.toJSON(), businessName: business && business.businessName }, business, res);
});

module.exports = router;
