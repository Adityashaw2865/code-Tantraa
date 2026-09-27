const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema(
  {
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true },
    tradeName: { type: String },
    businessType: {
      type: String,
      enum: [
        'Private Limited',
        'Public Limited',
        'Limited Liability Partnership (LLP)',
        'Partnership Firm',
        'Sole Proprietorship',
        'One Person Company'
      ],
      required: true
    },
    industrySector: {
      type: String,
      enum: [
        'Food Processing',
        'Textiles & Apparel',
        'Chemicals & Pharmaceuticals',
        'Engineering & Machinery',
        'Electronics & Hardware',
        'Agro-processing & Cold Storage',
        'Information Technology & ITES',
        'Renewable Energy'
      ],
      required: true
    },
    state: { type: String, required: true },
    district: { type: String, required: true },
    pincode: { type: String, required: true },
    address: { type: String, required: true },
    projectSize: { type: String, enum: ['Micro', 'Small', 'Medium', 'Large / Mega Project'], required: true },
    investmentAmountCr: { type: Number, required: true },
    investmentAmountText: { type: String },
    numberOfEmployees: { type: Number, required: true },
    currentStage: {
      type: String,
      enum: ['Idea', 'Land acquisition', 'Construction', 'Setup', 'Pre-operation', 'Operational', 'Expansion'],
      required: true
    },
    panNumber: { type: String, required: true },
    gstin: { type: String },
    udyamNumber: { type: String },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },

    landType: {
      type: String,
      enum: [
        'Owned Industrial Plot',
        'Maharashtra Industrial Development Corp (MIDC) Allotment',
        'State Industrial Development Corporation (MIDC) Allotment',
        'Leased Factory Shed',
        'Rented Commercial Building',
        'Agricultural Converted Non-Agri Land'
      ],
      required: true
    },
    builtUpAreaSqFt: { type: Number, required: true },
    connectedPowerLoadKVA: { type: Number, required: true },
    waterRequirementKLD: { type: Number, required: true },
    environmentalCategory: { type: String, enum: ['White', 'Green', 'Orange', 'Red'], required: true },
    hazardousMaterialsPresent: { type: Boolean, default: false },
    effluentGenerationExpected: { type: Boolean, default: false },
    boilerInstallationRequired: { type: Boolean, default: false },
    productionCapacityAnnual: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
