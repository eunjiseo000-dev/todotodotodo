// 입력 검증 유틸리티

export const validateEmail = (email) => {
  if (!email) {
    return '이메일을 입력해주세요.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) {
    return '비밀번호를 입력해주세요.';
  }
  if (password.length < 6) {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }
  return null;
};

export const validatePasswordConfirm = (password, confirmPassword) => {
  if (!confirmPassword) {
    return '비밀번호 확인을 입력해주세요.';
  }
  if (password !== confirmPassword) {
    return '비밀번호가 일치하지 않습니다.';
  }
  return null;
};

export const validateName = (name) => {
  if (!name) {
    return '이름을 입력해주세요.';
  }
  if (name.length < 2) {
    return '이름은 최소 2자 이상이어야 합니다.';
  }
  return null;
};

export const validateTodoTitle = (title) => {
  if (!title || !title.trim()) {
    return '할일 제목을 입력해주세요.';
  }
  if (title.length > 500) {
    return '할일 제목은 500자를 초과할 수 없습니다.';
  }
  return null;
};

export const validateDates = (startDate, endDate) => {
  if (!startDate) {
    return '시작일을 선택해주세요.';
  }
  if (!endDate) {
    return '종료일을 선택해주세요.';
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    return '시작일은 종료일보다 빠를 수 없습니다.';
  }
  return null;
};
