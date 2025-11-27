/**
 * 에러 처리 미들웨어
 *
 * 역할:
 * - 전역 에러 핸들러
 * - HTTP 상태 코드 표준화
 * - 에러 응답 형식 통일
 * - 개발/운영 환경별 에러 정보 제공
 * - Prisma 에러 처리
 */


// Prisma 에러 코드 매핑
const PRISMA_ERROR_CODES = {
  // P2002: Unique constraint failed
  'P2002': {
    status: 400,
    message: (meta) => {
      const field = meta?.target?.[0] || '필드';
      return `${field}은(는) 이미 존재합니다`;
    },
    errorCode: 'DUPLICATE_ENTRY'
  },

  // P2025: Record to delete does not exist
  'P2025': {
    status: 404,
    message: '요청하신 데이터를 찾을 수 없습니다',
    errorCode: 'RECORD_NOT_FOUND'
  }
};

/**
 * 표준 에러 응답 형식
 */
const createErrorResponse = (status, message, errorCode, stack = null) => {
  const response = {
    status: 'error',
    message,
    errorCode,
  };

  // 개발 환경에서만 스택 트레이스 포함
  if (process.env.NODE_ENV === 'development' && stack) {
    response.stack = stack;
  }

  return response;
};

/**
 * 에러 핸들러 미들웨어
 *
 * @param {Error} err - 발생한 에러
 * @param {Request} req - HTTP 요청 객체
 * @param {Response} res - HTTP 응답 객체
 * @param {Function} next - 다음 미들웨어로 넘어가는 함수
 */
const errorHandler = (err, req, res, next) => {
  // Prisma 에러 처리
  if (err.code && PRISMA_ERROR_CODES[err.code]) {
    const prismaErrorConfig = PRISMA_ERROR_CODES[err.code];
    const message = typeof prismaErrorConfig.message === 'function'
      ? prismaErrorConfig.message(err.meta)
      : prismaErrorConfig.message;

    const response = createErrorResponse(
      prismaErrorConfig.status,
      message,
      prismaErrorConfig.errorCode,
      err.stack
    );

    return res.status(prismaErrorConfig.status).json(response);
  }

  // HTTP 상태 코드가 명시된 에러 처리 (예: 400, 401, 403, 404 등)
  const statusCode = err.status || err.statusCode || 500;

  // 에러 코드 매핑
  let errorCode = err.errorCode || 'INTERNAL_ERROR';

  // 상태 코드별 기본 에러 코드 설정
  if (!err.errorCode) {
    switch (statusCode) {
      case 400:
        errorCode = 'BAD_REQUEST';
        break;
      case 401:
        errorCode = 'UNAUTHORIZED';
        break;
      case 403:
        errorCode = 'FORBIDDEN';
        break;
      case 404:
        errorCode = 'NOT_FOUND';
        break;
      case 500:
        errorCode = 'INTERNAL_ERROR';
        break;
      default:
        errorCode = 'UNKNOWN_ERROR';
    }
  }

  // 개발 환경에서는 에러 자세히 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('에러 발생:', {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body,
      error: err.message,
      stack: err.stack,
    });
  }
  // 운영 환경에서는 최소한의 정보만 로그로 남김
  else {
    console.error(`${req.method} ${req.url} - ${statusCode} ${err.message}`);
  }

  // 에러 응답 보내기
  const response = createErrorResponse(statusCode, err.message || 'Internal Server Error', errorCode, err.stack);
  res.status(statusCode).json(response);
};

module.exports = errorHandler;