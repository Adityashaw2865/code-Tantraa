const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema(
  {
    grievanceNumber: { type: String, unique: true }, // auto, e.g. GRV-2026-0089
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicantName: { type: String, required: true },
    businessName: { type: String, required: true },
    relatedApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    category: {
      type: String,
      enum: [
        'SLA Delay / Breach',
        'Technical Glitch',
        'Officer Clarification Dispute',
        'Inspection Grievance',
        'Fee Discrepancy',
        'Document Rejection Appeal',
        'Officer Query Discrepancy',
        'Portal Technical Issue'
      ],
      required: true
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['Normal', 'High', 'Escalated to Secretary'], default: 'Normal' },
    status: {
      type: String,
      enum: ['Submitted', 'Assigned', 'Under Review', 'Response Provided', 'Resolved', 'Reopened'],
      default: 'Submitted'
    },
    assignedOfficerName: { type: String },
    officialResolutionRemarks: { type: String }
  },
  { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' } }
);

grievanceSchema.pre('save', async function preSave(next) {
  if (this.isNew && !this.grievanceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Grievance').countDocuments();
    this.grievanceNumber = `GRV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Grievance', grievanceSchema);
