// 할일 조회 API 테스트
const request = require('supertest');
const app = require('../index');
const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');

describe('GET /api/todos - 할일 목록 조회 API', () => {
  let testUser1;
  let testUser2;
  let token1;
  let token2;

  // 테스트 사용자 생성
  beforeAll(async () => {
    try {
      // 테스트 사용자 1 생성
      const user1Result = await pool.query(
        'INSERT INTO "user" (email, passwordhash, name) VALUES ($1, $2, $3) RETURNING userid, email, name',
        [
          `test-todos-user1-${Date.now()}@example.com`,
          '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm', // dummy hash
          'Test User 1',
        ]
      );
      testUser1 = user1Result.rows[0];
      token1 = generateToken(testUser1.userid);

      // 테스트 사용자 2 생성 (다른 사용자 데이터 격리 테스트용)
      const user2Result = await pool.query(
        'INSERT INTO "user" (email, passwordhash, name) VALUES ($1, $2, $3) RETURNING userid, email, name',
        [
          `test-todos-user2-${Date.now()}@example.com`,
          '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvWFm',
          'Test User 2',
        ]
      );
      testUser2 = user2Result.rows[0];
      token2 = generateToken(testUser2.userid);
    } catch (err) {
      console.error('beforeAll error:', err);
    }
  });

  // 각 테스트 후 테스트 데이터 정리
  afterEach(async () => {
    try {
      if (testUser1) {
        await pool.query('DELETE FROM todo WHERE userid = $1', [testUser1.userid]);
      }
      if (testUser2) {
        await pool.query('DELETE FROM todo WHERE userid = $1', [testUser2.userid]);
      }
    } catch (err) {
      console.error('afterEach error:', err);
    }
  });

  // 테스트 종료 후 사용자 정리
  afterAll(async () => {
    try {
      if (testUser1) {
        await pool.query('DELETE FROM "user" WHERE userid = $1', [testUser1.userid]);
      }
      if (testUser2) {
        await pool.query('DELETE FROM "user" WHERE userid = $1', [testUser2.userid]);
      }
    } catch (err) {
      console.error('afterAll error:', err);
    }
    await pool.end();
  });

  // ========== A. 성공 케이스 (5개) ==========

  test('1. 유효한 토큰으로 할일 목록 조회 성공 (status 파라미터 없음)', async () => {
    // 테스트 데이터 생성: 진행중 할일 1개, 완료된 할일 1개
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '진행중 할일', '2025-01-01', '2025-01-10', 1, false, false]
    );
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '완료된 할일', '2025-01-01', '2025-01-10', 2, true, false]
    );

    const response = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token1}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('todos');
    expect(response.body.data).toHaveProperty('count');
    expect(Array.isArray(response.body.data.todos)).toBe(true);
    expect(response.body.data.count).toBe(2); // 진행중 + 완료 (삭제 안된 것만)
  });

  test('2. status=active로 진행 중인 할일만 조회', async () => {
    // 테스트 데이터 생성
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '진행중 할일 1', '2025-01-01', '2025-01-10', 1, false, false]
    );
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '진행중 할일 2', '2025-01-01', '2025-01-10', 2, false, false]
    );
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '완료된 할일', '2025-01-01', '2025-01-10', 3, true, false]
    );

    const response = await request(app)
      .get('/api/todos?status=active')
      .set('Authorization', `Bearer ${token1}`);

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(2);
    // 모든 항목이 isCompleted=false, isDeleted=false여야 함
    response.body.data.todos.forEach(todo => {
      expect(todo.isCompleted).toBe(false);
      expect(todo.isDeleted).toBe(false);
    });
  });

  test('3. status=completed로 완료된 할일만 조회', async () => {
    // 테스트 데이터 생성
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '진행중 할일', '2025-01-01', '2025-01-10', 1, false, false]
    );
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '완료된 할일 1', '2025-01-01', '2025-01-10', 2, true, false]
    );
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '완료된 할일 2', '2025-01-01', '2025-01-10', 3, true, false]
    );

    const response = await request(app)
      .get('/api/todos?status=completed')
      .set('Authorization', `Bearer ${token1}`);

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(2);
    // 모든 항목이 isCompleted=true, isDeleted=false여야 함
    response.body.data.todos.forEach(todo => {
      expect(todo.isCompleted).toBe(true);
      expect(todo.isDeleted).toBe(false);
    });
  });

  test('4. status=deleted로 휴지통 할일 조회', async () => {
    // 테스트 데이터 생성 (삭제된 할일)
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted, deletedat) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [testUser1.userid, '삭제된 할일 1', '2025-01-01', '2025-01-10', 1, false, true, new Date()]
    );
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted, deletedat) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [testUser1.userid, '삭제된 할일 2', '2025-01-01', '2025-01-10', 2, true, true, new Date()]
    );
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '진행중 할일', '2025-01-01', '2025-01-10', 3, false, false]
    );

    const response = await request(app)
      .get('/api/todos?status=deleted')
      .set('Authorization', `Bearer ${token1}`);

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(2);
    // 모든 항목이 isDeleted=true여야 함
    response.body.data.todos.forEach(todo => {
      expect(todo.isDeleted).toBe(true);
    });
  });

  test('5. 할일이 없을 때 빈 배열 반환', async () => {
    const response = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token1}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.todos).toEqual([]);
    expect(response.body.data.count).toBe(0);
  });

  // ========== B. 인증 관련 (3개) ==========

  test('6. 토큰 없이 요청 시 401 Unauthorized', async () => {
    const response = await request(app)
      .get('/api/todos');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('MISSING_AUTH_HEADER');
  });

  test('7. 잘못된 토큰으로 요청 시 401 Unauthorized', async () => {
    const response = await request(app)
      .get('/api/todos')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('INVALID_TOKEN');
  });

  test('8. Bearer 형식이 잘못된 토큰', async () => {
    const response = await request(app)
      .get('/api/todos')
      .set('Authorization', token1); // "Bearer" 없이 토큰만 전달

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('INVALID_AUTH_FORMAT');
  });

  // ========== C. 검증 케이스 (2개) ==========

  test('9. 잘못된 status 파라미터로 400 Bad Request', async () => {
    const response = await request(app)
      .get('/api/todos?status=invalid')
      .set('Authorization', `Bearer ${token1}`);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCode).toBe('INVALID_STATUS');
    expect(response.body.message).toContain('Invalid status parameter');
  });

  test('10. 다른 사용자 데이터 격리 확인', async () => {
    // User1의 할일 생성
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, 'User1의 할일', '2025-01-01', '2025-01-10', 1, false, false]
    );

    // User2의 할일 생성
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser2.userid, 'User2의 할일', '2025-01-01', '2025-01-10', 1, false, false]
    );

    // User1로 조회
    const response1 = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token1}`);

    expect(response1.status).toBe(200);
    expect(response1.body.data.count).toBe(1);
    expect(response1.body.data.todos[0].title).toBe('User1의 할일');

    // User2로 조회
    const response2 = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token2}`);

    expect(response2.status).toBe(200);
    expect(response2.body.data.count).toBe(1);
    expect(response2.body.data.todos[0].title).toBe('User2의 할일');
  });

  // ========== D. 정렬 검증 (2개) ==========

  test('11. priority 순서 정렬 확인', async () => {
    // 다양한 priority로 할일 생성 (순서를 섞어서 생성)
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '우선순위 3', '2025-01-01', '2025-01-10', 30, false, false]
    );
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '우선순위 1', '2025-01-01', '2025-01-10', 10, false, false]
    );
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '우선순위 2', '2025-01-01', '2025-01-10', 20, false, false]
    );

    const response = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token1}`);

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(3);

    // priority 오름차순 확인 (낮은 값이 먼저)
    const priorities = response.body.data.todos.map(todo => todo.priority);
    expect(priorities).toEqual([10, 20, 30]);
  });

  test('12. 동일 priority일 때 createdAt로 정렬', async () => {
    // 동일한 priority로 할일 생성 (시간 차이를 두고 생성)
    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '첫 번째 할일', '2025-01-01', '2025-01-10', 10, false, false]
    );

    // 약간의 지연 (다른 createdAt 보장)
    await new Promise(resolve => setTimeout(resolve, 100));

    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '두 번째 할일', '2025-01-01', '2025-01-10', 10, false, false]
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    await pool.query(
      'INSERT INTO todo (userid, title, startdate, enddate, priority, iscompleted, isdeleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testUser1.userid, '세 번째 할일', '2025-01-01', '2025-01-10', 10, false, false]
    );

    const response = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token1}`);

    expect(response.status).toBe(200);
    expect(response.body.data.count).toBe(3);

    // 모든 priority가 동일한지 확인
    const priorities = response.body.data.todos.map(todo => todo.priority);
    expect(priorities).toEqual([10, 10, 10]);

    // createdAt 오름차순 확인 (먼저 생성된 것이 먼저)
    const titles = response.body.data.todos.map(todo => todo.title);
    expect(titles).toEqual(['첫 번째 할일', '두 번째 할일', '세 번째 할일']);
  });
});
