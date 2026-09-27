const request = require('supertest');
const app = require('../src/app');
const { connect, clearDatabase, closeDatabase } = require('./helpers/db');
const { createUser, createDepartment, createApprovalType, createBusinessProfile } = require('./helpers/factories');
const DigitalLicence = require('../src/models/DigitalLicence');
const Application = require('../src/models/Application');

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

// Drives one application all the way from draft to an issued licence, and returns
// everything a test might need afterwards.
async function issueALicence({ applicantToken, applicantId, business, approvalType, department }) {
  const create = await request(app).post('/api/applications').set('Authorization', `Bearer ${applicantToken}`)
    .send({ businessId: business._id, approvalTypeId: approvalType._id, departmentId: department._id });
  const appId = create.body.application._id;
  await request(app).post(`/api/applications/${appId}/submit`).set('Authorization', `Bearer ${applicantToken}`);

  const { token: officerToken } = await createUser({ role: 'officer', departmentId: department._id });
  await request(app).patch(`/api/applications/${appId}/status`).set('Authorization', `Bearer ${officerToken}`).send({ status: 'under_verification' });
  await request(app).patch(`/api/applications/${appId}/status`).set('Authorization', `Bearer ${officerToken}`).send({ status: 'under_final_review' });
  await request(app).patch(`/api/applications/${appId}/status`).set('Authorization', `Bearer ${officerToken}`).send({ status: 'approved' });

  const issue = await request(app).post('/api/licences').set('Authorization', `Bearer ${officerToken}`).send({ applicationId: appId });
  return { licence: issue.body.licence, appId, officerToken };
}

describe('licence renewal linking', () => {
  it('a fresh licence cannot be renewed yet (outside the renewal window)', async () => {
    const { user: applicant, token } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const approvalType = await createApprovalType(department._id, { validityYears: 1 });
    const business = await createBusinessProfile(applicant._id);

    const { licence } = await issueALicence({ applicantToken: token, applicantId: applicant._id, business, approvalType, department });
    expect(licence.canRenew).toBe(false); // 1-year validity, default 90-day renewal window

    const renewAttempt = await request(app).post('/api/applications').set('Authorization', `Bearer ${token}`)
      .send({ businessId: business._id, renewalOfLicenceId: licence._id });
    expect(renewAttempt.status).toBe(400);
  });

  it('renewing a licence that is due extends from its old expiry and links both records', async () => {
    process.env.RENEWAL_WINDOW_DAYS = '400'; // force the freshly issued 1-year licence into its renewal window
    const { user: applicant, token } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const approvalType = await createApprovalType(department._id, { validityYears: 1 });
    const business = await createBusinessProfile(applicant._id);

    const { licence: oldLicence, officerToken } = await issueALicence({ applicantToken: token, applicantId: applicant._id, business, approvalType, department });
    expect(oldLicence.canRenew).toBe(true);

    const renewCreate = await request(app).post('/api/applications').set('Authorization', `Bearer ${token}`)
      .send({ businessId: business._id, renewalOfLicenceId: oldLicence._id });
    expect(renewCreate.status).toBe(201);
    const renewalAppId = renewCreate.body.application._id;
    expect(String(renewCreate.body.application.renewalOfLicenceId)).toBe(String(oldLicence._id));

    await request(app).post(`/api/applications/${renewalAppId}/submit`).set('Authorization', `Bearer ${token}`);
    await request(app).patch(`/api/applications/${renewalAppId}/status`).set('Authorization', `Bearer ${officerToken}`).send({ status: 'under_verification' });
    await request(app).patch(`/api/applications/${renewalAppId}/status`).set('Authorization', `Bearer ${officerToken}`).send({ status: 'under_final_review' });
    await request(app).patch(`/api/applications/${renewalAppId}/status`).set('Authorization', `Bearer ${officerToken}`).send({ status: 'approved' });

    const issue = await request(app).post('/api/licences').set('Authorization', `Bearer ${officerToken}`).send({ applicationId: renewalAppId });
    expect(issue.status).toBe(201);
    const newLicence = issue.body.licence;

    // new licence continues from the OLD expiry date, not from today - no validity days lost
    expect(new Date(newLicence.issueDate) >= new Date(oldLicence.expiryDate) || newLicence.issueDate === oldLicence.expiryDate).toBe(false);
    const oldExpiry = new Date(oldLicence.expiryDate).getTime();
    const newExpiry = new Date(newLicence.expiryDate).getTime();
    const oneYearMs = 364 * 24 * 60 * 60 * 1000;
    expect(newExpiry - oldExpiry).toBeGreaterThan(oneYearMs); // extends a further ~1 year beyond the old expiry

    const refreshedOld = await DigitalLicence.findById(oldLicence._id);
    expect(String(refreshedOld.renewedByLicenceId)).toBe(String(newLicence._id));

    delete process.env.RENEWAL_WINDOW_DAYS;
  });

  it('cannot renew a licence that was never yours', async () => {
    process.env.RENEWAL_WINDOW_DAYS = '400';
    const { user: owner, token: ownerToken } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const approvalType = await createApprovalType(department._id);
    const business = await createBusinessProfile(owner._id);
    const { licence } = await issueALicence({ applicantToken: ownerToken, applicantId: owner._id, business, approvalType, department });

    const { user: attacker, token: attackerToken } = await createUser({ role: 'applicant' });
    const attackerBusiness = await createBusinessProfile(attacker._id);
    const res = await request(app).post('/api/applications').set('Authorization', `Bearer ${attackerToken}`)
      .send({ businessId: attackerBusiness._id, renewalOfLicenceId: licence._id });
    expect(res.status).toBe(403);
    delete process.env.RENEWAL_WINDOW_DAYS;
  });

  it('rejects issuing a second licence for the same application', async () => {
    const { user: applicant, token } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const approvalType = await createApprovalType(department._id);
    const business = await createBusinessProfile(applicant._id);
    const { appId, officerToken } = await issueALicence({ applicantToken: token, applicantId: applicant._id, business, approvalType, department });

    const dupe = await request(app).post('/api/licences').set('Authorization', `Bearer ${officerToken}`).send({ applicationId: appId });
    expect(dupe.status).toBe(409);
  });
});

describe('public licence verification', () => {
  it('finds a licence by number with no authentication required, and rejects a bogus code', async () => {
    const { user: applicant, token } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const approvalType = await createApprovalType(department._id);
    const business = await createBusinessProfile(applicant._id);
    const { licence } = await issueALicence({ applicantToken: token, applicantId: applicant._id, business, approvalType, department });

    const ok = await request(app).get(`/api/licences/verify/${licence.licenceNumber}`);
    expect(ok.status).toBe(200);
    expect(ok.body.valid).toBe(true);

    const bad = await request(app).get('/api/licences/verify/NOT-A-REAL-CODE');
    expect(bad.status).toBe(200);
    expect(bad.body.valid).toBe(false);
  });

  it('downloads a real PDF certificate for the licence owner', async () => {
    const { user: applicant, token } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const approvalType = await createApprovalType(department._id);
    const business = await createBusinessProfile(applicant._id);
    const { licence } = await issueALicence({ applicantToken: token, applicantId: applicant._id, business, approvalType, department });

    const res = await request(app).get(`/api/licences/${licence._id}/certificate`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.body.slice(0, 4).toString()).toBe('%PDF');
  });

  it('refuses to let a different applicant download someone else\'s certificate', async () => {
    const { user: applicant, token } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const approvalType = await createApprovalType(department._id);
    const business = await createBusinessProfile(applicant._id);
    const { licence } = await issueALicence({ applicantToken: token, applicantId: applicant._id, business, approvalType, department });

    const { token: otherToken } = await createUser({ role: 'applicant' });
    const res = await request(app).get(`/api/licences/${licence._id}/certificate`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });
});
