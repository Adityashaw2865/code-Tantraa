const User = require('../../src/models/User');
const Department = require('../../src/models/Department');
const ApprovalType = require('../../src/models/ApprovalType');
const BusinessProfile = require('../../src/models/BusinessProfile');
const { signToken } = require('../../src/utils/token');

// Creates a user with a real hashed password and returns { user, token } so tests can
// hit protected routes as that user. `overrides` can set role/departmentId/etc.
async function createUser(overrides = {}) {
  const n = Math.random().toString(36).slice(2, 8);
  const user = new User({
    name: overrides.name || `Test User ${n}`,
    email: overrides.email || `${n}@example.com`,
    mobile: overrides.mobile || '9800000000',
    role: overrides.role || 'applicant',
    departmentId: overrides.departmentId,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true
  });
  await user.setPassword(overrides.password || 'Password123!');
  await user.save();
  return { user, token: signToken(user) };
}

async function createDepartment(overrides = {}) {
  return Department.create({
    name: overrides.name || 'Directorate of Industries',
    shortCode: overrides.shortCode || 'DOI',
    jurisdiction: overrides.jurisdiction || 'Maharashtra',
    nodalOfficer: 'Test Officer',
    contactEmail: 'dept@example.com',
    contactPhone: '9800000001'
  });
}

async function createApprovalType(departmentId, overrides = {}) {
  return ApprovalType.create({
    departmentId,
    approvalName: overrides.approvalName || 'Factory Licence',
    shortCode: overrides.shortCode || 'FAC-LIC',
    category: overrides.category || 'Licence',
    description: 'Test approval type',
    statutoryFeeINR: overrides.statutoryFeeINR ?? 5000,
    processingSLADays: overrides.processingSLADays ?? 30,
    validityYears: overrides.validityYears ?? 1,
    renewalFrequency: 'Annual',
    applicationMethod: 'Online Single Window',
    requiredDocumentKeys: overrides.requiredDocumentKeys || []
  });
}

async function createBusinessProfile(applicantId, overrides = {}) {
  return BusinessProfile.create({
    applicantId,
    businessName: overrides.businessName || 'Sahyadri Agro Foods Pvt Ltd',
    businessType: 'Private Limited',
    industrySector: 'Food Processing',
    state: 'Maharashtra',
    district: 'Pune',
    pincode: '411001',
    address: '123 MIDC Road',
    projectSize: 'Small',
    investmentAmountCr: 1,
    numberOfEmployees: 10,
    currentStage: 'Setup',
    panNumber: 'ABCDE1234F',
    contactEmail: 'biz@example.com',
    contactPhone: '9800000002',
    landType: 'Owned Industrial Plot',
    builtUpAreaSqFt: 2000,
    connectedPowerLoadKVA: 50,
    waterRequirementKLD: 5,
    environmentalCategory: 'Green',
    ...overrides
  });
}

module.exports = { createUser, createDepartment, createApprovalType, createBusinessProfile };
