const mongoose = require('mongoose');

const ocrSuggestionSchema = new mongoose.Schema(
  {
    documentType: { type: String },
    extractedEntityName: { type: String },
    extractedRegNumber: { type: String },
    extractedIssueDate: { type: String },
    extractedExpiryDate: { type: String },
    extractedAddress: { type: String },
    confidenceScore: { type: Number },
    matchDiscrepancyNotes: { type: String }
  },
  { _id: false }
);

const documentVaultItemSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile', required: true },
    documentKey: { type: String, required: true }, // e.g. 'pan_card', 'fire_safety_layout'
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'Identity & Proof',
        'Business Registration',
        'Land & Building',
        'Technical & Utilities',
        'Environmental & Pollution',
        'Safety & Fire',
        'Labour & Workforce',
        'Financial & Tax'
      ],
      required: true
    },
    fileName: { type: String, required: true },
    fileSize: { type: String },
    mimeType: { type: String },
    storagePath: { type: String, required: true, select: false }, // Cloudinary secure_url, never sent to client
    cloudinaryPublicId: { type: String, select: false }, // needed to delete the file from Cloudinary
    expiryDate: { type: Date },
    verificationStatus: {
      type: String,
      enum: ['verified', 'under_verification', 'rejected', 'expiring_soon', 'pending_upload'],
      default: 'pending_upload'
    },
    version: { type: Number, default: 1 },
    verifiedBy: { type: String },
    verificationDate: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
    ocrAnalysis: ocrSuggestionSchema
  },
  { timestamps: { createdAt: 'uploadDate', updatedAt: true } }
);

module.exports = mongoose.model('DocumentVaultItem', documentVaultItemSchema);