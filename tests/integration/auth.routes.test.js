// Integration tests for /api/auth endpoints
// The DB pool is mocked — no real PostgreSQL needed

jest.mock('../../src/db/connection', () => ({
  query: jest.fn(),
  on: jest.fn(),
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../../src/db/connection');
const app = require('../../src/index');

const hashedPassword = bcrypt.hashSync('Admin123!', 10);

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 — registers a new user and returns a JWT token', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-1',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'admin',
        status: 'active',
        created_at: new Date(),
      }],
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Admin', email: 'admin@test.com', password: 'Admin123!', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.data.email).toBe('admin@test.com');
  });

  test('400 — rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'bad-email', password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('400 — rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'a@b.com', password: '123' });

    expect(res.status).toBe(400);
  });

  test('409 — returns conflict for duplicate email', async () => {
    const pgError = new Error('duplicate key');
    pgError.code = '23505';
    pool.query.mockRejectedValueOnce(pgError);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'dup@test.com', password: 'Admin123!', role: 'viewer' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 — returns JWT for valid credentials', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-1',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
        status: 'active',
        password_hash: hashedPassword,
      }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('401 — rejects wrong password', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-1',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
        status: 'active',
        password_hash: hashedPassword,
      }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('401 — rejects non-existent user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Admin123!' });

    expect(res.status).toBe(401);
  });

  test('403 — rejects inactive user', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'uuid-2',
        name: 'Inactive',
        email: 'inactive@test.com',
        role: 'viewer',
        status: 'inactive',
        password_hash: hashedPassword,
      }],
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactive@test.com', password: 'Admin123!' });

    expect(res.status).toBe(403);
  });
});

describe('GET /health', () => {
  test('200 — health check is public (no auth needed)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Protected route access control', () => {
  test('401 — /api/records requires Authorization header', async () => {
    const res = await request(app).get('/api/records');
    expect(res.status).toBe(401);
  });

  test('401 — /api/users requires Authorization header', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('401 — /api/analytics/summary requires Authorization header', async () => {
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(401);
  });
});
