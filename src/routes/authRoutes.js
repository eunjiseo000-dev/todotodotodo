// 인증 API 라우트
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const {
  validateEmail,
  validatePassword,
  validateName,
} = require('../utils/validation');

// 더미 해시 (타이밍 공격 방어용)
const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm';

// POST /api/auth/signup - 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 1. 요청 바디 검증
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: email, password, name',
        errorCode: 'MISSING_FIELDS',
      });
    }

    // 2. 이메일 형식 검증
    if (!validateEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format',
        errorCode: 'INVALID_EMAIL',
      });
    }

    // 3. 비밀번호 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        status: 'error',
        message: passwordValidation.error,
        errorCode: 'INVALID_PASSWORD',
      });
    }

    // 4. 이름 검증
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({
        status: 'error',
        message: nameValidation.error,
        errorCode: 'INVALID_NAME',
      });
    }

    // 5. 이메일 중복 확인
    const existingUser = await pool.query(
      'SELECT userid FROM "user" WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists',
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // 6. 비밀번호 해시
    const passwordHash = await hashPassword(password);

    // 7. 사용자 생성
    const result = await pool.query(
      'INSERT INTO "user" (email, passwordhash, name) VALUES ($1, $2, $3) RETURNING userid, email, name, createdat',
      [email, passwordHash, name]
    );

    const newUser = result.rows[0];

    // 8. 응답 반환
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        userId: newUser.userid,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdat,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);

    // 데이터베이스 unique constraint 오류 처리 (Race condition 대응)
    if (err.code === '23505') {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists',
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// POST /api/auth/login - 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. 요청 바디 검증
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: email, password',
        errorCode: 'MISSING_FIELDS',
      });
    }

    // 2. 이메일로 사용자 조회
    const result = await pool.query(
      'SELECT userid, email, name, passwordhash FROM "user" WHERE email = $1',
      [email]
    );

    let user = result.rows[0];
    let isPasswordValid = false;

    if (user) {
      // 3. 비밀번호 비교
      isPasswordValid = await comparePassword(password, user.passwordhash);
    } else {
      // 타이밍 공격 방어: 존재하지 않는 사용자도 더미 해시와 비교
      await comparePassword(password, DUMMY_HASH);
    }

    // 일관된 응답 (존재 여부 구분 안 함)
    if (!user || !isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    // 4. JWT 토큰 생성
    const token = generateToken(user.userid);

    // 5. 응답 반환
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          userId: user.userid,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
