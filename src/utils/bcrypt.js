// bcrypt을 사용한 비밀번호 해시/비교 유틸리티
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// 비밀번호 해시
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// 비밀번호 비교
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
