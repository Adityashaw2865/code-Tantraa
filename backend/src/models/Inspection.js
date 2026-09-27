const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema(
  {
    itemText: { type: String, required: true },
    standardReference: { type: String },
    isCompliant: { type: Boolean, default: null }, // null = pending
    findingsRemarks: { type: String }
  },
  { _id: true }
);

const inspectionSchema = new mongoose.Schema(
  {
    inspectionNumber: { type: String, unique: true }, // auto, e.g. INS-2026-0042
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    businessName: { type: String, required: true },
    departmentName: { type: String, required: true },
    siteAddress: { type: String, required: true },
    assignedInspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedInspectorName: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    scheduledTimeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending_schedule', 'scheduled', 'assigned', 'in_progress', 'completed', 'followup_required', 'closed'],
      default: 'pending_schedule'
    },
    checklist: [checklistItemSchema],
    inspectorRemarks: { type: String },
    overallComplianceOutcome: {
      type: String,
      enum: [
        'Satisfactory / Recommended',
        'Conditional Approval with Observations',
        'Non-Compliant / Re-inspection Mandated'
      ]
    },
    evidencePhotosCount: { type: Number, default: 0 },
    reportSubmittedDate: { type: Date },
    reportPdfUrl: { type: String }
  },
  { timestamps: true }
);

inspectionSchema.pre('save', async function preSave(next) {
  if (this.isNew && !this.inspectionNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Inspection').countDocuments();
    this.inspectionNumber = `INS-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Inspection', inspectionSchema);
