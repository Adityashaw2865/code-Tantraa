const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['Application', 'Document', 'Query', 'Inspection', 'RegulatoryRule', 'Licence', 'User', 'Grievance', 'Department', 'ApprovalType', 'Payment'],
      required: true
    },
    entityId: { type: String, required: true },
    description: { type: String, required: true },
    ipAddress: { type: String },
    previousValue: { type: String },
    newValue: { type: String }
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

// Audit logs are write-once from the app's perspective; no update/delete routes are exposed.
module.exports = mongoose.model('AuditLogRecord', auditLogSchema);
