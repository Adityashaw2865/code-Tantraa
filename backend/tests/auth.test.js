const request = require('supertest');
const app = require('../src/app');
const { connect, clearDatabase, closeDatabase } = require('./helpers/db');
const { createUser } = require('./helpers/factories');

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe('POST /api/auth/register', () => {
  it('creates an applicant account and returns a usable token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Asha Patil', email: 'asha@example.com', mobile: '9811111111', password: 'Password123!'
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('applicant');
    expect(typeof res.body.token).toBe('string');

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('asha@example.com');
  });

  it('rejects a password under 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'X', email: 'short@example.com', mobile: '9800000000', password: 'short'
    });
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    await createUser({ email: 'dupe@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dupe', email: 'dupe@example.com', mobile: '9800000000', password: 'Password123!'
    });
    expect(res.status).toBe(409);
  });

  it('never lets a client self-register as officer/admin', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sneaky', email: 'sneaky@example.com', mobile: '9800000000', password: 'Password123!', role: 'admin'
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('applicant'); // role in the request body is ignored
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await createUser({ email: 'login@example.com', password: 'Password123!' });
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects a wrong password without revealing which part was wrong', async () => {
    await createUser({ email: 'login2@example.com', password: 'Password123!' });
    const res = await request(app).post('/api/auth/login').send({ email: 'login2@example.com', password: 'WrongPass1!' });
    expect(res.status).toBe(401);
  });

  it('rejects a deactivated account', async () => {
    await createUser({ email: 'inactive@example.com', password: 'Password123!', isActive: false });
    const res = await request(app).post('/api/auth/login').send({ email: 'inactive@example.com', password: 'Password123!' });
    expect(res.status).toBe(401);
  });
});

describe('session revocation', () => {
  it('logout invalidates the token immediately', async () => {
    const { token } = await createUser({ email: 'revoke@example.com' });
    const before = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(before.status).toBe(200);

    const logout = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(200);

    const after = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
  });

  it('change-password invalidates the old token and issues a working new one', async () => {
    const { token } = await createUser({ email: 'changepw@example.com', password: 'OldPass123!' });
    const change = await request(app).post('/api/auth/change-password').set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass123!', newPassword: 'NewPass456!' });
    expect(change.status).toBe(200);
    const newToken = change.body.token;

    const oldStillWorks = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(oldStillWorks.status).toBe(401);

    const newWorks = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${newToken}`);
    expect(newWorks.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email: 'changepw@example.com', password: 'NewPass456!' });
    expect(login.status).toBe(200);
  });

  it('rejects change-password with the wrong current password', async () => {
    const { token } = await createUser({ email: 'wrongcur@example.com', password: 'RightPass1!' });
    const res = await request(app).post('/api/auth/change-password').set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass1!', newPassword: 'NewPass456!' });
    expect(res.status).toBe(401);
  });
});

describe('forgot / reset password', () => {
  it('resets the password with a valid dev-mode token and logs in with the new one', async () => {
    await createUser({ email: 'forgot@example.com', password: 'OldPass123!' });
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: 'forgot@example.com' });
    expect(forgot.status).toBe(200);
    const resetToken = forgot.body.devResetToken;
    expect(resetToken).toBeTruthy(); // only present because NODE_ENV=test, not production

    const reset = await request(app).post('/api/auth/reset-password').send({ token: resetToken, newPassword: 'BrandNew789!' });
    expect(reset.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email: 'forgot@example.com', password: 'BrandNew789!' });
    expect(login.status).toBe(200);
  });

  it('does not reveal whether an email is registered', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account exists/i);
  });

  it('rejects an invalid or already-used reset token', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'not-a-real-token', newPassword: 'BrandNew789!' });
    expect(res.status).toBe(400);
  });
});

describe('mobile OTP', () => {
  it('verifies with the correct OTP and rejects a wrong one', async () => {
    const { token } = await createUser({ email: 'otp@example.com' });
    const sent = await request(app).post('/api/auth/send-otp').set('Authorization', `Bearer ${token}`);
    expect(sent.status).toBe(200);
    const otp = sent.body.devOtp;
    expect(otp).toMatch(/^\d{6}$/);

    const wrong = await request(app).post('/api/auth/verify-otp').set('Authorization', `Bearer ${token}`).send({ otp: '000000' });
    expect(wrong.status).toBe(400);

    const right = await request(app).post('/api/auth/verify-otp').set('Authorization', `Bearer ${token}`).send({ otp });
    expect(right.status).toBe(200);
    expect(right.body.user.mobileVerified).toBe(true);
  });
});
