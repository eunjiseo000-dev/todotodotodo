// 할일 API 라우트
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

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

module.exports = router;
