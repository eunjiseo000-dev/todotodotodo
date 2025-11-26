// 할일 API 라우트
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');
const { validateTitle, validateDate, validateDateRange } = require('../utils/validation');

// GET /api/todos - 할일 목록 조회
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    // 1. status 파라미터 검증
    const validStatuses = ['active', 'completed', 'deleted'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status parameter. Allowed values: ${validStatuses.join(', ')}`,
        errorCode: 'INVALID_STATUS',
      });
    }

    // 2. 동적 SQL 쿼리 구성
    let whereConditions = ['userid = $1'];
    let queryParams = [userId];

    if (status === 'active') {
      // 진행중인 할일: 삭제되지 않고 완료되지 않은 항목
      whereConditions.push('isdeleted = false');
      whereConditions.push('iscompleted = false');
    } else if (status === 'completed') {
      // 완료된 할일: 삭제되지 않고 완료된 항목
      whereConditions.push('isdeleted = false');
      whereConditions.push('iscompleted = true');
    } else if (status === 'deleted') {
      // 휴지통 할일: 삭제된 항목만
      whereConditions.push('isdeleted = true');
    } else {
      // 기본값: 삭제되지 않은 모든 할일 (진행중 + 완료)
      whereConditions.push('isdeleted = false');
    }

    const whereClause = whereConditions.join(' AND ');
    const query = `
      SELECT
        todoid,
        userid,
        title,
        startdate,
        enddate,
        priority,
        iscompleted,
        isdeleted,
        createdat,
        updatedat,
        deletedat
      FROM todo
      WHERE ${whereClause}
      ORDER BY priority ASC, createdat ASC
    `;

    // 3. 데이터베이스 조회
    const result = await pool.query(query, queryParams);

    // 4. 응답 데이터 변환 (데이터베이스 컬럼명 → camelCase)
    const todos = result.rows.map(row => ({
      todoId: row.todoid,
      userId: row.userid,
      title: row.title,
      startDate: row.startdate,
      endDate: row.enddate,
      priority: row.priority,
      isCompleted: row.iscompleted,
      isDeleted: row.isdeleted,
      createdAt: row.createdat,
      updatedAt: row.updatedat,
      deletedAt: row.deletedat,
    }));

    // 5. 응답 반환 (빈 배열도 200 OK)
    res.status(200).json({
      status: 'success',
      data: {
        todos,
        count: todos.length,
      },
    });
  } catch (err) {
    console.error('Get todos error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// POST /api/todos - 할일 추가
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 1. userId 추출
    const userId = req.user.userId;

    // 2. 요청 바디에서 필드 추출
    const { title, startDate, endDate } = req.body;

    // 3-1. 필드 검증: title, startDate, endDate 필수 (undefined/null 체크)
    if (title === undefined || title === null || startDate === undefined || startDate === null || endDate === undefined || endDate === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: title, startDate, endDate',
        errorCode: 'MISSING_FIELDS',
      });
    }

    // 3-2. 형식 검증: 제목 1-500자 (빈 문자열 포함)
    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) {
      return res.status(400).json({
        status: 'error',
        message: titleValidation.error,
        errorCode: 'INVALID_TITLE',
      });
    }

    // 3-3. 형식 검증: 날짜 YYYY-MM-DD
    const startDateValidation = validateDate(startDate);
    if (!startDateValidation.valid) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid startDate: ${startDateValidation.error}`,
        errorCode: 'INVALID_DATE',
      });
    }

    const endDateValidation = validateDate(endDate);
    if (!endDateValidation.valid) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid endDate: ${endDateValidation.error}`,
        errorCode: 'INVALID_DATE',
      });
    }

    // 3-4. 비즈니스 검증: startDate <= endDate
    const dateRangeValidation = validateDateRange(startDate, endDate);
    if (!dateRangeValidation.valid) {
      return res.status(400).json({
        status: 'error',
        message: dateRangeValidation.error,
        errorCode: 'INVALID_DATE_RANGE',
      });
    }

    // 4. Priority 자동 할당: MAX(priority) 조회
    const maxPriorityQuery = `
      SELECT COALESCE(MAX(priority), 0) as maxpriority
      FROM todo
      WHERE userid = $1 AND isdeleted = false
    `;
    const maxPriorityResult = await pool.query(maxPriorityQuery, [userId]);
    const maxPriority = maxPriorityResult.rows[0].maxpriority;

    // 기존 할일이 없으면 1, 있으면 MAX + 1
    const nextPriority = maxPriority === 0 ? 1 : maxPriority + 1;

    // 5. INSERT 쿼리 실행
    const insertQuery = `
      INSERT INTO todo (
        userid,
        title,
        startdate,
        enddate,
        priority,
        iscompleted,
        isdeleted,
        createdat,
        updatedat,
        deletedat
      )
      VALUES ($1, $2, $3, $4, $5, false, false, NOW(), NOW(), NULL)
      RETURNING
        todoid,
        userid,
        title,
        startdate,
        enddate,
        priority,
        iscompleted,
        isdeleted,
        createdat,
        updatedat,
        deletedat
    `;

    const insertResult = await pool.query(insertQuery, [
      userId,
      title,
      startDate,
      endDate,
      nextPriority,
    ]);

    // 6. 생성된 할일 객체 변환 (데이터베이스 컬럼명 → camelCase)
    // 날짜 타입 컬럼은 YYYY-MM-DD 형식 문자열로 변환
    const row = insertResult.rows[0];

    // DATE 타입을 YYYY-MM-DD 형식으로 변환하는 헬퍼 함수
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const createdTodo = {
      todoId: row.todoid,
      userId: row.userid,
      title: row.title,
      startDate: formatDate(row.startdate),
      endDate: formatDate(row.enddate),
      priority: row.priority,
      isCompleted: row.iscompleted,
      isDeleted: row.isdeleted,
      createdAt: row.createdat,
      updatedAt: row.updatedat,
      deletedAt: row.deletedat,
    };

    // 7. 응답 반환
    res.status(201).json({
      status: 'success',
      message: 'Todo created successfully',
      data: createdTodo,
    });
  } catch (err) {
    console.error('Create todo error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
