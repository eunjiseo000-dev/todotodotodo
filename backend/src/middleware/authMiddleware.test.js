// authMiddleware 테스트
const authMiddleware = require('./authMiddleware');
const { generateToken } = require('../utils/jwt');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('should pass with valid token', () => {
    const token = generateToken('test-user-id');
    req.headers.authorization = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('test-user-id');
  });

  test('should fail with missing authorization header', () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        errorCode: 'MISSING_AUTH_HEADER',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should fail with invalid token format', () => {
    req.headers.authorization = 'InvalidFormat token';

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        errorCode: 'INVALID_AUTH_FORMAT',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should fail with expired or invalid token', () => {
    req.headers.authorization = 'Bearer invalid-token';

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        errorCode: 'INVALID_TOKEN',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
