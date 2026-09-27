const request = require('supertest');
const app = require('../src/app');
const { connect, clearDatabase, closeDatabase } = require('./helpers/db');
const { createUser, createDepartment, createApprovalType, createBusinessProfile } = require('./helpers/factories');

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

// Builds one applicant + business + approval type, ready to file an application.
async function setupApplicant() {
  const { user: applicant, token } = await createUser({ role: 'applicant' });
  const department = await createDepartment();
  const approvalType = await createApprovalType(department._id);
  const business = await createBusinessProfile(applicant._id);
  return { applicant, token, department, approvalType, business };
}

describe('application lifecycle', () => {
  it('draft -> submit -> under_verification -> approved happens in order, and skipping ahead is rejected', async () => {
    const { token, approvalType, department, business } = await setupApplicant();

    const create = await request(app).post('/api/applications').set('Authorization', `Bearer ${token}`)
      .send({ businessId: business._id, approvalTypeId: approvalType._id, departmentId: department._id });
    expect(create.status).toBe(201);
    expect(create.body.application.status).toBe('draft');
    const appId = create.body.application._id;

    const submit = await request(app).post(`/api/applications/${appId}/submit`).set('Authorization', `Bearer ${token}`);
    expect(submit.status).toBe(200);
    expect(submit.body.application.status).toBe('submitted');

    const { token: officerToken } = await createUser({ role: 'officer', departmentId: department._id });

    // Can't jump straight to 'approved' from 'submitted'
    const badJump = await request(app).patch(`/api/applications/${appId}/status`).set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'approved' });
    expect(badJump.status).toBe(400);

    const toVerification = await request(app).patch(`/api/applications/${appId}/status`).set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'under_verification' });
    expect(toVerification.status).toBe(200);

    const toReview = await request(app).patch(`/api/applications/${appId}/status`).set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'under_final_review' });
    expect(toReview.status).toBe(200);

    const approve = await request(app).patch(`/api/applications/${appId}/status`).set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'approved' });
    expect(approve.status).toBe(200);
    expect(approve.body.application.status).toBe('approved');
  });

  it('an applicant cannot see or act on another applicant\'s application', async () => {
    const a = await setupApplicant();
    const create = await request(app).post('/api/applications').set('Authorization', `Bearer ${a.token}`)
      .send({ businessId: a.business._id, approvalTypeId: a.approvalType._id, departmentId: a.department._id });
    const appId = create.body.application._id;

    const { token: otherToken } = await createUser({ role: 'applicant' });
    const res = await request(app).get(`/api/applications/${appId}`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });

  it('an officer cannot use a business profile that is not theirs to create an application for someone else', async () => {
    const a = await setupApplicant();
    const { token: otherApplicantToken } = await createUser({ role: 'applicant' });
    const res = await request(app).post('/api/applications').set('Authorization', `Bearer ${otherApplicantToken}`)
      .send({ businessId: a.business._id, approvalTypeId: a.approvalType._id, departmentId: a.department._id });
    expect(res.status).toBe(403);
  });

  it('officer cannot view or filter for draft applications belonging to applicants (regression: ?status=draft leak)', async () => {
    const a = await setupApplicant();
    await request(app).post('/api/applications').set('Authorization', `Bearer ${a.token}`)
      .send({ businessId: a.business._id, approvalTypeId: a.approvalType._id, departmentId: a.department._id });

    const { token: officerToken } = await createUser({ role: 'officer', departmentId: a.department._id });

    const listDefault = await request(app).get('/api/applications').set('Authorization', `Bearer ${officerToken}`);
    expect(listDefault.body.applications.find((x) => x.status === 'draft')).toBeUndefined();

    const listExplicit = await request(app).get('/api/applications?status=draft').set('Authorization', `Bearer ${officerToken}`);
    expect(listExplicit.status).toBe(403);
  });

  it('one officer cannot change the status of an application assigned to a different officer', async () => {
    const a = await setupApplicant();
    const create = await request(app).post('/api/applications').set('Authorization', `Bearer ${a.token}`)
      .send({ businessId: a.business._id, approvalTypeId: a.approvalType._id, departmentId: a.department._id });
    const appId = create.body.application._id;
    await request(app).post(`/api/applications/${appId}/submit`).set('Authorization', `Bearer ${a.token}`);

    const { token: officer1 } = await createUser({ role: 'officer', departmentId: a.department._id });
    const { token: officer2 } = await createUser({ role: 'officer', departmentId: a.department._id });

    // officer1 claims it by acting first
    const claim = await request(app).patch(`/api/applications/${appId}/status`).set('Authorization', `Bearer ${officer1}`)
      .send({ status: 'under_verification' });
    expect(claim.status).toBe(200);

    // officer2 is now blocked
    const blocked = await request(app).patch(`/api/applications/${appId}/status`).set('Authorization', `Bearer ${officer2}`)
      .send({ status: 'under_final_review' });
    expect(blocked.status).toBe(403);
  });
});

describe('business profile mass-assignment protection', () => {
  it('cannot change applicantId via PATCH, even by including it in the body', async () => {
    const { user: owner, token } = await createUser({ role: 'applicant' });
    const { user: attacker } = await createUser({ role: 'applicant' });
    const business = await createBusinessProfile(owner._id);

    const res = await request(app).patch(`/api/business-profiles/${business._id}`).set('Authorization', `Bearer ${token}`)
      .send({ businessName: 'Renamed Co', applicantId: attacker._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.businessProfile.businessName).toBe('Renamed Co');
    expect(String(res.body.businessProfile.applicantId)).toBe(String(owner._id)); // unchanged
  });

  it('another applicant cannot edit someone else\'s business profile', async () => {
    const { user: owner } = await createUser({ role: 'applicant' });
    const { token: attackerToken } = await createUser({ role: 'applicant' });
    const business = await createBusinessProfile(owner._id);

    const res = await request(app).patch(`/api/business-profiles/${business._id}`).set('Authorization', `Bearer ${attackerToken}`)
      .send({ businessName: 'Hijacked' });
    expect(res.status).toBe(403);
  });
});

describe('grievance mass-assignment protection', () => {
  it('cannot file a grievance that is already Resolved by sending status in the body', async () => {
    const { token } = await createUser({ role: 'applicant' });
    const res = await request(app).post('/api/grievances').set('Authorization', `Bearer ${token}`).send({
      businessName: 'Test Biz', category: 'SLA Delay / Breach', subject: 'Delay', description: 'Too slow',
      status: 'Resolved', officialResolutionRemarks: 'nothing wrong here'
    });
    expect(res.status).toBe(201);
    expect(res.body.grievance.status).toBe('Submitted'); // server-controlled default, not what the client sent
    expect(res.body.grievance.officialResolutionRemarks).toBeUndefined();
  });
});
