// 데이터 검증 유틸리티

// 이메일 형식 검증 (RFC 5322 간소화)
const validateEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email);
};

// 비밀번호 검증 (8자 이상, 영문+숫자+특수문자)
const validatePassword = (password) => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  return { valid: true };
};

// 사용자 이름 검증 (2-50자)
const validateName = (name) => {
  if (name.length < 2 || name.length > 50) {
    return { valid: false, error: 'Name must be between 2 and 50 characters' };
  }
  return { valid: true };
};

// 할일 제목 검증 (1-500자)
const validateTitle = (title) => {
  if (title.length < 1 || title.length > 500) {
    return { valid: false, error: 'Title must be between 1 and 500 characters' };
  }
  return { valid: true };
};

// 날짜 검증 (YYYY-MM-DD 형식)
const validateDate = (dateString) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }
  return { valid: true, date };
};

// 날짜 범위 검증 (시작일 <= 종료일)
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    return { valid: false, error: 'Start date must be before or equal to end date' };
  }
  return { valid: true };
};

// priority 범위 검증 (1-999999)
const validatePriority = (priority) => {
  const num = parseInt(priority, 10);
  if (isNaN(num) || num < 1 || num > 999999) {
    return { valid: false, error: 'Priority must be between 1 and 999999' };
  }
  return { valid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateTitle,
  validateDate,
  validateDateRange,
  validatePriority,
};
