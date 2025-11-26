// Jest 환경 설정
process.env.NODE_ENV = 'test';
require('dotenv').config();

// 테스트 환경 변수 설정
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
}

if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '24h';
}
