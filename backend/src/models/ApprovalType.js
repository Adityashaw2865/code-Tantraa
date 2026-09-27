const mongoose = require('mongoose');

const approvalTypeSchema = new mongoose.Schema(
  {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    approvalName: { type: String, required: true },
    shortCode: { type: String, required: true },
    category: { type: String, enum: ['Registration', 'Licence', 'NOC', 'Clearance', 'Utility'], required: true },
    description: { type: String },
    statutoryFeeINR: { type: Number, default: 0 },
    estimatedFeesText: { type: String },
    processingSLADays: { type: Number, required: true },
    validityYears: { type: mongoose.Schema.Types.Mixed, default: 1 }, // number | 'Perpetual'
    renewalFrequency: {
      type: String,
      enum: ['Annual', 'Bi-annual', 'Every 5 Years', 'Perpetual / No Renewal'],
      default: 'Annual'
    },
    isMandatoryPreOperation: { type: Boolean, default: false },
    applicationMethod: {
      type: String,
      enum: ['Online Single Window', 'Physical Inspection Required', 'Self-Certification'],
      default: 'Online Single Window'
    },
    officialSource: { type: String },
    legalActReference: { type: String },
    lastUpdatedDate: { type: String },

    // Rules engine criteria (server-side, mirrors src/services/rulesEngine.ts)
    applicableSectors: { type: mongoose.Schema.Types.Mixed, default: 'All' }, // array | 'All'
    minEmployees: { type: Number },
    minInvestmentCr: { type: Number },
    pollutionCategories: [{ type: String, enum: ['White', 'Green', 'Orange', 'Red'] }],
    requiresBoiler: { type: Boolean },
    requiresHazardous: { type: Boolean },

    // Workflow dependencies
    prerequisiteApprovalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalType' }],
    parallelApprovalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalType' }],
    requiredDocumentKeys: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApprovalType', approvalTypeSchema);
