// No hardcoded data. Everything real comes from the backend.
const guest = (role) => ({ id: '', name: 'Guest', email: '', mobile: '', role });
export const DEMO_USERS = {
    applicant: guest('applicant'), officer: guest('officer'), inspector: guest('inspector'), admin: guest('admin')
};
// Blank profile: neutral defaults only (valid dropdown values, zeros, empty text). No personal/business data.
export const INITIAL_BUSINESS = {
    id: '', applicantId: '', businessName: '', businessType: 'Private Limited', industrySector: 'Food Processing',
    state: 'Maharashtra', district: '', pincode: '', address: '', projectSize: 'Micro', investmentAmountCr: 0,
    investmentAmountText: '', numberOfEmployees: 0, currentStage: 'Idea', panNumber: '', contactEmail: '', contactPhone: '',
    landType: 'Owned Industrial Plot', builtUpAreaSqFt: 0, connectedPowerLoadKVA: 0, waterRequirementKLD: 0,
    environmentalCategory: 'Green', hazardousMaterialsPresent: false, effluentGenerationExpected: false,
    boilerInstallationRequired: false, productionCapacityAnnual: ''
};
export const DEPARTMENTS = [];
export const APPROVAL_TYPES = [];
export const INITIAL_DOCUMENTS = [];
export const INITIAL_QUERIES = [];
export const INITIAL_APPLICATIONS = [];
export const INITIAL_INSPECTIONS = [];
export const INITIAL_LICENCES = [];
export const INITIAL_SCHEMES = [];
export const INITIAL_NOTIFICATIONS = [];
export const INITIAL_GRIEVANCES = [];
export const INITIAL_AUDIT_LOGS = [];
export const INITIAL_REGULATORY_RULES = [];
