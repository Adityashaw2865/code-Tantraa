const request = require('supertest');
const app = require('../src/app');
const { connect, closeDatabase } = require('./helpers/db');

beforeAll(connect);
afterAll(closeDatabase);

describe('GET /api/health', () => {
  it('reports ok with db: connected once MongoDB is reachable', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });
});
