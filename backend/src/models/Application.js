const mongoose = require('mongoose');

const APPLICATION_STATUSES = [
  'draft',
  'ready_for_submission',
  'submitted',
  'under_verification',
  'query_raised',
  'documents_resubmitted',
  'inspection_required',
  'inspection_scheduled',
  'inspection_completed',
  'under_final_review',
  'approved',
  'rejected'
];

const activityHistorySchema = new mongoose.Schema(
  {
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String },
    previousStatus: { type: String, enum: APPLICATION_STATUSES },
    newStatus: { type: String, enum: APPLICATION_STATUSES }
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false }, _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: { type: String, unique: true }, // auto-generated, e.g. APP-2026-00124
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile', required: true },
    approvalTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalType', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'draft' },

    submissionDate: { type: Date },
    targetSLADate: { type: Date },
    approvalDate: { type: Date },
    expiryDate: { type: Date },
    licenceNumber: { type: String },
    renewalOfLicenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'DigitalLicence' },
    slaBreachNotified: { type: Boolean, default: false },

    assignedOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedOfficerName: { type: String },
    assignedInspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedInspectorName: { type: String },

    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    riskFactors: [{ type: String }],
    completenessScorePercent: { type: Number, default: 0, min: 0, max: 100 },

    attachedDocumentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DocumentVaultItem' }],

    officerRemarks: { type: String },
    rejectionReason: { type: String },
    internalDepartmentNotes: { type: String },

    history: [activityHistorySchema]
  },
  { timestamps: true }
);

// Auto-generate applicationNumber like APP-2026-00124 on first save
applicationSchema.pre('save', async function preSave(next) {
  if (this.isNew && !this.applicationNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Application').countDocuments();
    this.applicationNumber = `APP-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
