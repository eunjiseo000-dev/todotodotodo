const errorHandler = require('./errorHandler');
const { Request, Response } = require('jest-express');

describe('에러 처리 미들웨어 테스트', () => {
  let mockReq, mockRes, next;

  beforeEach(() => {
    mockReq = new Request();
    mockRes = new Response();
    next = jest.fn();
  });

  test('1. 일반 에러 발생 시 500 응답', () => {
    const error = new Error('일반적인 서버 에러');
    error.status = 500;

    errorHandler(error, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: '일반적인 서버 에러',
      errorCode: 'INTERNAL_ERROR',
    });
  });

  test('2. 상태 코드 400 에러 처리', () => {
    const error = new Error('잘못된 요청');
    error.status = 400;
    error.errorCode = 'INVALID_INPUT';

    errorHandler(error, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: '잘못된 요청',
      errorCode: 'INVALID_INPUT',
    });
  });

  test('3. 상태 코드 401 에러 처리', () => {
    const error = new Error('인증 실패');
    error.status = 401;
    error.errorCode = 'UNAUTHORIZED';

    errorHandler(error, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: '인증 실패',
      errorCode: 'UNAUTHORIZED',
    });
  });

  test('4. 상태 코드 403 에러 처리', () => {
    const error = new Error('권한 없음');
    error.status = 403;
    error.errorCode = 'FORBIDDEN';

    errorHandler(error, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: '권한 없음',
      errorCode: 'FORBIDDEN',
    });
  });

  test('5. 상태 코드 404 에러 처리', () => {
    const error = new Error('찾을 수 없음');
    error.status = 404;
    error.errorCode = 'NOT_FOUND';

    errorHandler(error, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: '찾을 수 없음',
      errorCode: 'NOT_FOUND',
    });
  });

  test('6. 상태 코드가 없는 에러는 500으로 처리', () => {
    const error = new Error('내부 서버 오류');

    errorHandler(error, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: '내부 서버 오류',
      errorCode: 'INTERNAL_ERROR',
    });
  });

  test('7. Prisma 중복 키 에러 처리 (P2002)', () => {
    const prismaError = {
      code: 'P2002',
      meta: { target: ['email'] },
      message: 'Unique constraint failed on the fields: (`email`)'
    };

    errorHandler(prismaError, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'email은(는) 이미 존재합니다',
      errorCode: 'DUPLICATE_ENTRY',
    });
  });

  test('8. Prisma 레코드 없음 에러 처리 (P2025)', () => {
    const prismaError = {
      code: 'P2025',
      meta: { cause: 'Record to update not found' },
      message: 'Record to delete does not exist'
    };

    errorHandler(prismaError, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: '요청하신 데이터를 찾을 수 없습니다',
      errorCode: 'RECORD_NOT_FOUND',
    });
  });

  test('9. 개발 환경에서는 스택 트레이스 포함', () => {
    // 기존 NODE_ENV 백업
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('개발 환경 테스트 에러');
    error.status = 500;

    // errorHandler를 호출
    errorHandler(error, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(500);

    // JSON 호출을 확인하고 스택 정보가 포함되었는지 확인
    const jsonCall = mockRes.json.mock.calls[mockRes.json.mock.calls.length - 1][0];
    expect(jsonCall).toHaveProperty('stack');

    // 환경 변수 원래 상태로 복구
    process.env.NODE_ENV = originalEnv;
  });

  test('10. 운영 환경에서는 스택 트레이스 미포함', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('운영 환경 테스트 에러');
    error.status = 500;
    
    // errorHandler를 적용
    errorHandler(error, mockReq, mockRes, next);

    const jsonCall = mockRes.json.mock.calls[mockRes.json.mock.calls.length - 1][0];
    expect(jsonCall).not.toHaveProperty('stack');

    // 환경 변수 원래 상태로 복구
    process.env.NODE_ENV = originalEnv;
  });

  test('11. 프로덕션 환경에서 상세 에러 정보 숨김', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('민감한 정보 에러');
    error.status = 500;
    error.details = { dbCredentials: 'secret123' }; // 민감한 정보 포함
    
    errorHandler(error, mockReq, mockRes, next);

    const jsonCall = mockRes.json.mock.calls[mockRes.json.mock.calls.length - 1][0];
    expect(jsonCall).not.toHaveProperty('details');
    expect(jsonCall).not.toHaveProperty('stack');

    process.env.NODE_ENV = originalEnv;
  });
});