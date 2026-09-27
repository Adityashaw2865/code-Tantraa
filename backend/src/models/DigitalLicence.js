const mongoose = require('mongoose');
const crypto = require('crypto');

const digitalLicenceSchema = new mongoose.Schema(
  {
    licenceNumber: { type: String, required: true, unique: true },
    approvalTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalType', required: true },
    approvalName: { type: String, required: true },
    departmentName: { type: String, required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile', required: true },
    businessName: { type: String, required: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    validityText: { type: String },
    status: { type: String, enum: ['Active', 'Renewal Due', 'Expired', 'Suspended'], default: 'Active' },
    qrVerificationCode: { type: String, unique: true },
    certificatePdfUrl: { type: String },
    renewalOfLicenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'DigitalLicence' },
    renewedByLicenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'DigitalLicence' },
    remindersSent: [{ type: Number }] // expiry reminder thresholds (90/60/30 days) already sent
  },
  { timestamps: true }
);

// Generate a random verification code used by the public QR-verify endpoint
digitalLicenceSchema.pre('save', function preSave(next) {
  if (this.isNew && !this.qrVerificationCode) {
    this.qrVerificationCode = crypto.randomBytes(8).toString('hex').toUpperCase();
  }
  next();
});

// Virtual: days to expiry, computed on the fly (not stored, avoids stale data)
digitalLicenceSchema.virtual('daysToExpiry').get(function getDaysToExpiry() {
  const diffMs = new Date(this.expiryDate).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
});

// Renewal opens RENEWAL_WINDOW_DAYS (default 90) before expiry, and stays open after expiry.
digitalLicenceSchema.virtual('canRenew').get(function getCanRenew() {
  const windowDays = Number(process.env.RENEWAL_WINDOW_DAYS || 90);
  const days = Math.ceil((new Date(this.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return !this.renewedByLicenceId && this.status !== 'Suspended' && days <= windowDays;
});

digitalLicenceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('DigitalLicence', digitalLicenceSchema);
