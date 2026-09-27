const request = require('supertest');
const app = require('../src/app');
const { connect, clearDatabase, closeDatabase } = require('./helpers/db');
const { createUser, createDepartment, createApprovalType, createBusinessProfile } = require('./helpers/factories');

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe('treasury payments', () => {
  it('computes the total from the server-side fee, not anything the client sends', async () => {
    const { user: applicant, token } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const at1 = await createApprovalType(department._id, { approvalName: 'Factory Licence', statutoryFeeINR: 5000 });
    const at2 = await createApprovalType(department._id, { approvalName: 'Trade Licence', shortCode: 'TRD', statutoryFeeINR: 2000 });
    const business = await createBusinessProfile(applicant._id);

    const res = await request(app).post('/api/payments').set('Authorization', `Bearer ${token}`).send({
      businessId: business._id, approvalTypeIds: [at1._id, at2._id], method: 'upi'
    });
    expect(res.status).toBe(201);
    expect(res.body.payment.totalAmount).toBe(7000); // 5000 + 2000, from the DB - never trusts a client amount
    expect(res.body.payment.grnNumber).toMatch(/^MH-2026-GRAS-\d{4,}$/);
    expect(res.body.payment.status).toBe('success');
  });

  it('rejects paying for a business that is not the caller\'s own', async () => {
    const { user: owner } = await createUser({ role: 'applicant' });
    const { token: attackerToken } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const at = await createApprovalType(department._id);
    const business = await createBusinessProfile(owner._id);

    const res = await request(app).post('/api/payments').set('Authorization', `Bearer ${attackerToken}`)
      .send({ businessId: business._id, approvalTypeIds: [at._id], method: 'upi' });
    expect(res.status).toBe(403);
  });

  it('rejects an invalid payment method', async () => {
    const { user: applicant, token } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const at = await createApprovalType(department._id);
    const business = await createBusinessProfile(applicant._id);

    const res = await request(app).post('/api/payments').set('Authorization', `Bearer ${token}`)
      .send({ businessId: business._id, approvalTypeIds: [at._id], method: 'bitcoin' });
    expect(res.status).toBe(400);
  });

  it('is publicly verifiable by GRN and downloadable as a PDF receipt by the owner only', async () => {
    const { user: applicant, token } = await createUser({ role: 'applicant' });
    const department = await createDepartment();
    const at = await createApprovalType(department._id, { statutoryFeeINR: 3000 });
    const business = await createBusinessProfile(applicant._id);
    const create = await request(app).post('/api/payments').set('Authorization', `Bearer ${token}`)
      .send({ businessId: business._id, approvalTypeIds: [at._id], method: 'netbanking' });
    const { grnNumber, id } = create.body.payment;

    const verify = await request(app).get(`/api/payments/verify/${grnNumber}`);
    expect(verify.body.valid).toBe(true);
    expect(verify.body.payment.totalAmount).toBe(3000);

    const badVerify = await request(app).get('/api/payments/verify/NOT-REAL');
    expect(badVerify.body.valid).toBe(false);

    const receipt = await request(app).get(`/api/payments/${id}/receipt`).set('Authorization', `Bearer ${token}`);
    expect(receipt.status).toBe(200);
    expect(receipt.headers['content-type']).toBe('application/pdf');
    expect(receipt.body.slice(0, 4).toString()).toBe('%PDF');

    const { token: otherToken } = await createUser({ role: 'applicant' });
    const blocked = await request(app).get(`/api/payments/${id}/receipt`).set('Authorization', `Bearer ${otherToken}`);
    expect(blocked.status).toBe(403);
  });
});
