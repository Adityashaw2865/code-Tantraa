const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    jurisdiction: { type: String, required: true },
    nodalOfficer: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    iconName: { type: String, default: 'Building2' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
