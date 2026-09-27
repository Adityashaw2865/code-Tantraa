const mongoose = require('mongoose');

const queryMessageSchema = new mongoose.Schema(
  {
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    officerName: { type: String, required: true },
    subject: { type: String, required: true },
    queryText: { type: String, required: true },
    requestedDocumentKey: { type: String },
    deadlineDate: { type: Date, required: true },
    isResolved: { type: Boolean, default: false },
    applicantResponse: {
      responseDate: { type: Date },
      responseText: { type: String },
      attachedDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentVaultItem' },
      attachedDocumentName: { type: String }
    }
  },
  { timestamps: { createdAt: 'raisedDate', updatedAt: true } }
);

module.exports = mongoose.model('QueryMessage', queryMessageSchema);
