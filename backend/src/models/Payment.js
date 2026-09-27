const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, unique: true }, // Government Receipt Number
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile', required: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    breakdown: [{
      approvalTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalType' },
      approvalName: String,
      departmentName: String,
      amount: Number
    }],
    totalAmount: { type: Number, required: true },
    method: { type: String, enum: ['upi', 'netbanking', 'sbiepay'], required: true },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    provider: { type: String, default: 'sandbox' }, // swap to 'razorpay' etc. once real gateway keys are configured
    bankReferenceCIN: { type: String },
    paidAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

paymentSchema.set('toJSON', {
  transform: (_doc, ret) => { ret.id = ret._id; return ret; }
});

module.exports = mongoose.model('Payment', paymentSchema);
