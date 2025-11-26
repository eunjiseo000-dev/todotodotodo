// JWT 인증 검증 미들웨어
const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing authorization header',
        errorCode: 'MISSING_AUTH_HEADER',
      });
    }

    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authorization header format. Expected: Bearer <token>',
        errorCode: 'INVALID_AUTH_FORMAT',
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
        errorCode: 'INVALID_TOKEN',
      });
    }

    // req.user에 디코딩된 토큰 정보 주입
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
      errorCode: 'AUTH_FAILED',
    });
  }
};

module.exports = authMiddleware;
