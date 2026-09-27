const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    serviceType: { type: String, required: true },
    daysTaken: { type: Number, required: true, min: 0 },
    documentRejected: { type: Boolean, default: false },
    rejectionReason: {
      type: String,
      enum: ['None', 'Missing document', 'Wrong / outdated format', 'Incomplete application form', 'Site plan discrepancy', 'Fee / payment mismatch', 'Other'],
      default: 'None'
    },
    difficultyRating: { type: Number, min: 1, max: 5, required: true },
    biggestChallenge: {
      type: String,
      enum: ['Long processing delay', 'Multiple office visits required', 'Document rejection / resubmission', 'No tracking / status updates', 'Unclear requirements', 'Payment / fee confusion', 'Poor communication from department', 'Other'],
      required: true
    },
    respondentType: { type: String, enum: ['Business owner', 'Applicant / individual', 'Consultant / agent', 'Other'], default: 'Business owner' },
    comment: { type: String, maxlength: 500 },
    source: { type: String, enum: ['baseline', 'live'], default: 'live' },
    respondentName: { type: String, maxlength: 100 }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

surveyResponseSchema.index({ department: 1 });
surveyResponseSchema.index({ source: 1 });

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);