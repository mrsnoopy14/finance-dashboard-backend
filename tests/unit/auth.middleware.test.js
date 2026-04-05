// Unit tests for JWT auth middleware
// Uses mocks — no database connection required

const jwt = require('jsonwebtoken');
const { authenticateUser, authorizeRoles } = require('../../src/middleware/auth');

// Helper: create a mock Express req/res/next
const mockReqResNext = (headers = {}) => {
  const req = { headers };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
};

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

describe('authenticateUser middleware', () => {
  test('returns 401 when Authorization header is missing', () => {
    const { req, res, next } = mockReqResNext({});
    authenticateUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header has wrong format', () => {
    const { req, res, next } = mockReqResNext({ authorization: 'Basic abc123' });
    authenticateUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for an invalid/tampered token', () => {
    const { req, res, next } = mockReqResNext({ authorization: 'Bearer invalid.token.here' });
    authenticateUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for an expired token', () => {
    const expiredToken = jwt.sign(
      { id: 'user-1', role: 'analyst', email: 'a@b.com' },
      JWT_SECRET,
      { expiresIn: -1 } // already expired
    );
    const { req, res, next } = mockReqResNext({ authorization: `Bearer ${expiredToken}` });
    authenticateUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('expired') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() and sets req.user for a valid token', () => {
    const token = jwt.sign(
      { id: 'user-1', role: 'admin', email: 'admin@test.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const { req, res, next } = mockReqResNext({ authorization: `Bearer ${token}` });
    authenticateUser(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 'user-1', role: 'admin', email: 'admin@test.com' });
  });
});

describe('authorizeRoles middleware', () => {
  const makeReqWithRole = (role) => ({
    user: { id: 'u1', role, email: 'x@y.com' },
    headers: {},
  });

  test('returns 403 when user role is not in allowed list', () => {
    const { res, next } = mockReqResNext();
    const req = makeReqWithRole('viewer');
    authorizeRoles(['admin', 'analyst'])(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when user role is allowed', () => {
    const { res, next } = mockReqResNext();
    const req = makeReqWithRole('analyst');
    authorizeRoles(['admin', 'analyst'])(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 401 when req.user is missing', () => {
    const { res, next } = mockReqResNext();
    const req = {}; // no req.user
    authorizeRoles(['admin'])(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
