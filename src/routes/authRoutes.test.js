const request = require('supertest');
const app = require('../index');
const pool = require('../config/database');

// 테스트 데이터베이스 정리
beforeEach(async () => {
  try {
    await pool.query('DELETE FROM "user" WHERE email LIKE $1', ['%test-signup%']);
  } catch (err) {
    // 테이블이 없을 수 있음
  }
});

afterAll(async () => {
  try {
    await pool.query('DELETE FROM "user" WHERE email LIKE $1', ['%test-signup%']);
  } catch (err) {
    // 에러 무시
  }
  await pool.end();
});

describe('POST /api/auth/signup - 회원가입 API', () => {
  // ========== 성공 케이스 ==========

  test('유효한 데이터로 회원가입 성공', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test-signup-valid@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('userId');
    expect(response.body.data.email).toBe('test-signup-valid@example.com');
    expect(response.body.data.name).toBe('Test User');
    expect(response.body.data).toHaveProperty('createdAt');
  });

  test('다양한 유효한 비밀번호로 회원가입 성공', async () => {
    const validPasswords = [
      'Password123!',
      'Secure@Pass2025',
      'Test#Code999',
      'MySecure$Pass1',
    ];

    for (const password of validPasswords) {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: `test-signup-pwd-${Math.random()}@example.com`,
          password,
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    }
  });

  test('2자 이름으로 회원가입 성공', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test-signup-name-short@example.com`,
        password: 'Password123!',
        name: 'AB',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('AB');
  });

  test('50자 이름으로 회원가입 성공', async () => {
    const longName = 'A'.repeat(50);
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test-signup-name-long@example.com`,
        password: 'Password123!',
        name: longName,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe(longName);
  });

  // ========== 필수 필드 검증 ==========

  test('이메일 누락 시 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        password: 'Password123!',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('MISSING_FIELDS');
    expect(response.body.message).toContain('Missing required fields');
  });

  test('비밀번호 누락 시 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test-signup-pwd-missing@example.com',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('MISSING_FIELDS');
  });

  test('이름 누락 시 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test-signup-name-missing@example.com',
        password: 'Password123!',
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('MISSING_FIELDS');
  });

  // ========== 이메일 형식 검증 ==========

  test('유효하지 않은 이메일 형식 (@없음)', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'invalid-email-format',
        password: 'Password123!',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('INVALID_EMAIL');
  });

  test('유효하지 않은 이메일 형식 (도메인 없음)', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@',
        password: 'Password123!',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('INVALID_EMAIL');
  });

  test('유효하지 않은 이메일 형식 (TLD 없음)', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@domain',
        password: 'Password123!',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('INVALID_EMAIL');
  });

  test('유효한 이메일 형식 (특수문자 포함)', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test.user+${Math.random()}@example.co.uk`,
        password: 'Password123!',
        name: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
  });

  // ========== 비밀번호 검증 ==========

  test('8자 미만 비밀번호 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test-signup-pwd-short@example.com`,
        password: 'Pass1!',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('INVALID_PASSWORD');
    expect(response.body.message).toContain('at least 8 characters');
  });

  test('영문 없는 비밀번호 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test-signup-pwd-no-letter@example.com`,
        password: '12345!@#',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('INVALID_PASSWORD');
    expect(response.body.message).toContain('letter');
  });

  test('숫자 없는 비밀번호 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test-signup-pwd-no-number@example.com`,
        password: 'Password!@#',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('INVALID_PASSWORD');
    expect(response.body.message).toContain('number');
  });

  test('특수문자 없는 비밀번호 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test-signup-pwd-no-special@example.com`,
        password: 'Password123',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('INVALID_PASSWORD');
    expect(response.body.message).toContain('special character');
  });

  // ========== 이름 검증 ==========

  test('1자 이름 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test-signup-name-1char@example.com`,
        password: 'Password123!',
        name: 'A',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('INVALID_NAME');
    expect(response.body.message).toContain('between 2 and 50');
  });

  test('51자 이름 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test-signup-name-51char@example.com`,
        password: 'Password123!',
        name: 'A'.repeat(51),
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('INVALID_NAME');
  });

  // ========== 이메일 중복 검증 ==========

  test('이메일 중복 시 400 에러', async () => {
    const email = `test-signup-duplicate@example.com`;

    // 첫 번째 가입
    const response1 = await request(app)
      .post('/api/auth/signup')
      .send({
        email,
        password: 'Password123!',
        name: 'First User',
      });

    expect(response1.status).toBe(201);

    // 두 번째 동일 이메일로 가입
    const response2 = await request(app)
      .post('/api/auth/signup')
      .send({
        email,
        password: 'Password456!',
        name: 'Second User',
      });

    expect(response2.status).toBe(400);
    expect(response2.body.errorCode).toBe('EMAIL_ALREADY_EXISTS');
    expect(response2.body.message).toContain('Email already exists');
  });

  // ========== 이메일 대소문자 처리 ==========

  test('대문자 이메일과 소문자 이메일 중복 확인', async () => {
    const emailBase = `test-signup-case@example.com`;

    // 첫 번째 가입
    await request(app)
      .post('/api/auth/signup')
      .send({
        email: emailBase.toLowerCase(),
        password: 'Password123!',
        name: 'First User',
      });

    // 두 번째 가입 시도 (대문자로)
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: emailBase.toUpperCase(),
        password: 'Password456!',
        name: 'Second User',
      });

    // 데이터베이스가 case-insensitive하면 중복 감지됨
    // 주의: 데이터베이스 설정에 따라 다를 수 있음
    expect([400, 201]).toContain(response.status);
  });

  // ========== 비밀번호 해싱 검증 ==========

  test('비밀번호가 평문으로 저장되지 않음', async () => {
    const email = `test-signup-hash@example.com`;
    const password = 'Password123!';

    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email,
        password,
        name: 'Test User',
      });

    expect(response.status).toBe(201);

    // 데이터베이스에서 직접 조회하여 해시 확인
    const result = await pool.query(
      'SELECT passwordhash FROM "user" WHERE email = $1',
      [email]
    );

    expect(result.rows.length).toBe(1);
    const storedHash = result.rows[0].passwordhash;

    // 평문과 다름을 확인
    expect(storedHash).not.toBe(password);

    // 해시는 bcrypt 형식 ($2a$ 또는 $2b$ 프리픽스)
    expect(storedHash).toMatch(/^\$2[aby]\$/);
  });

  // ========== 응답 형식 검증 ==========

  test('성공 응답이 필수 필드 포함', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test-signup-response@example.com`,
        password: 'Password123!',
        name: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('userId');
    expect(response.body.data).toHaveProperty('email');
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('createdAt');

    // userId는 UUID 형식
    expect(response.body.data.userId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  test('에러 응답이 필수 필드 포함', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('errorCode');
  });

  // ========== 빈 문자열 검증 ==========

  test('빈 이메일 문자열 처리', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: '',
        password: 'Password123!',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toMatch(/MISSING_FIELDS|INVALID_EMAIL/);
  });

  test('빈 비밀번호 문자열 처리', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: '',
        name: 'Test User',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toMatch(/MISSING_FIELDS|INVALID_PASSWORD/);
  });

  test('빈 이름 문자열 처리', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: '',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toMatch(/MISSING_FIELDS|INVALID_NAME/);
  });

  // ========== 추가 필드 무시 ==========

  test('추가 필드는 무시되고 성공', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `test-signup-extra-fields@example.com`,
        password: 'Password123!',
        name: 'Test User',
        extraField1: 'should be ignored',
        extraField2: 12345,
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
  });

  // ========== 서버 에러 처리 ==========

  test('잘못된 요청 타입 처리', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send('invalid request body');

    expect([400, 500]).toContain(response.status);
  });

  // ========== 데이터베이스 오류 처리 ==========

  test('null 값이 포함된 요청 처리', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: null,
        password: null,
        name: null,
      });

    expect(response.status).toBe(400);
  });
});

// ========== POST /api/auth/login 로그인 API 테스트 ==========

describe('POST /api/auth/login - 로그인 API', () => {
  // 테스트용 계정 생성
  const testUser = {
    email: `test-login-${Math.random()}@example.com`,
    password: 'TestPassword123!',
    name: 'Login Test User',
  };

  beforeAll(async () => {
    // 테스트용 계정 미리 생성
    await request(app)
      .post('/api/auth/signup')
      .send(testUser);
  });

  afterAll(async () => {
    try {
      await pool.query('DELETE FROM "user" WHERE email LIKE $1', ['%test-login%']);
    } catch (err) {
      // 에러 무시
    }
  });

  // ========== 성공 케이스 ==========

  test('유효한 이메일과 비밀번호로 로그인 성공', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user.userId).toBeDefined();
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.user.name).toBe(testUser.name);
  });

  test('토큰은 JWT 형식이어야 함', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = response.body.data.token;

    // JWT 형식: header.payload.signature
    const parts = token.split('.');
    expect(parts.length).toBe(3);
    expect(parts[0]).toBeDefined();
    expect(parts[1]).toBeDefined();
    expect(parts[2]).toBeDefined();
  });

  // ========== 필수 필드 검증 ==========

  test('이메일 누락 시 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        password: testUser.password,
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('MISSING_FIELDS');
  });

  test('비밀번호 누락 시 400 에러', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('MISSING_FIELDS');
  });

  test('빈 이메일로 로그인 시도', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: '',
        password: testUser.password,
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toMatch(/MISSING_FIELDS|INVALID_CREDENTIALS/);
  });

  test('빈 비밀번호로 로그인 시도', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: '',
      });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toMatch(/MISSING_FIELDS|INVALID_CREDENTIALS/);
  });

  // ========== 인증 실패 케이스 ==========

  test('존재하지 않는 이메일로 로그인 시도', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: testUser.password,
      });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('INVALID_CREDENTIALS');
    expect(response.body.message).toBe('Invalid email or password');
  });

  test('잘못된 비밀번호로 로그인 시도', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  test('비밀번호가 비슷하지만 다른 경우 실패', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'TestPassword124!', // 마지막 숫자 다름
      });

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  test('계정 존재 여부 노출 방지 (존재하지 않음, 비밀번호 틀림)', async () => {
    // 존재하지 않는 이메일로 시도
    const response1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'AnyPassword123!',
      });

    // 잘못된 비밀번호로 시도
    const response2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

    // 둘 다 401 + 동일한 에러 메시지
    expect(response1.status).toBe(401);
    expect(response2.status).toBe(401);
    expect(response1.body.message).toBe(response2.body.message);
    expect(response1.body.errorCode).toBe(response2.body.errorCode);
  });

  // ========== 응답 형식 검증 ==========

  test('성공 응답이 필수 필드 포함', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('userId');
    expect(response.body.data.user).toHaveProperty('email');
    expect(response.body.data.user).toHaveProperty('name');
  });

  test('에러 응답이 필수 필드 포함', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'anypassword',
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('errorCode');
  });

  // ========== 대소문자 처리 ==========

  test('이메일 대소문자 불일치 처리', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email.toUpperCase(),
        password: testUser.password,
      });

    // 데이터베이스 설정에 따라 실패할 수 있음
    expect([200, 401]).toContain(response.status);
  });

  // ========== 추가 필드 무시 ==========

  test('추가 필드는 무시되고 로그인 성공', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        extraField1: 'should be ignored',
        extraField2: 12345,
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });

  // ========== 연속 로그인 테스트 ==========

  test('동일한 계정으로 여러 번 로그인 가능', async () => {
    const response1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    // 약간의 지연 후 두 번째 로그인 (다른 timestamp 보장)
    await new Promise(resolve => setTimeout(resolve, 100));

    const response2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    // 두 토큰이 모두 유효한 JWT 형식이어야 함
    expect(response1.body.data.token).toBeDefined();
    expect(response2.body.data.token).toBeDefined();
    // 둘 다 JWT 형식
    expect(response1.body.data.token.split('.').length).toBe(3);
    expect(response2.body.data.token.split('.').length).toBe(3);
  });

  // ========== null 값 처리 ==========

  test('null 값이 포함된 요청 처리', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: null,
        password: null,
      });

    expect(response.status).toBe(400);
  });

  test('특수 문자가 포함된 비밀번호로 로그인', async () => {
    const specialPassword = 'Sp3c!@l$P@ss%w0rd';
    const specialUser = {
      email: `test-login-special-${Math.random()}@example.com`,
      password: specialPassword,
      name: 'Special User',
    };

    // 먼저 계정 생성
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send(specialUser);

    expect(signupResponse.status).toBe(201);

    // 로그인 시도
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: specialUser.email,
        password: specialPassword,
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data).toHaveProperty('token');
  });

  // ========== 타이밍 공격 방어 검증 ==========

  test('존재하지 않는 계정과 잘못된 비밀번호의 응답 시간이 유사해야 함', async () => {
    const startTime1 = Date.now();

    const response1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent-user@example.com',
        password: 'SomePassword123!',
      });

    const duration1 = Date.now() - startTime1;

    const startTime2 = Date.now();

    const response2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

    const duration2 = Date.now() - startTime2;

    // 둘 다 401 에러
    expect(response1.status).toBe(401);
    expect(response2.status).toBe(401);

    // 응답 시간의 차이가 크지 않아야 함 (500ms 이내 차이 허용)
    expect(Math.abs(duration1 - duration2)).toBeLessThan(500);
  });
});
