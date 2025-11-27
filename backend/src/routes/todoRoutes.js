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

// PUT /api/todos/:id - 할일 수정
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const todoId = req.params.id;
    const { title, startDate, endDate } = req.body;

    // 1. 할일 존재 여부 확인 및 사용자 권한 검증
    const findTodoQuery = `
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
      WHERE todoid = $1
    `;
    const findTodoResult = await pool.query(findTodoQuery, [todoId]);

    if (findTodoResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found',
        errorCode: 'NOT_FOUND',
      });
    }

    const todo = findTodoResult.rows[0];

    // 2. 사용자 권한 확인 (자신의 할일만 수정 가능)
    if (todo.userid !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource',
        errorCode: 'FORBIDDEN',
      });
    }

    // 3. 삭제된 할일인지 확인 (isDeleted=true일 경우 수정 불가)
    if (todo.isdeleted) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot modify a deleted todo',
        errorCode: 'BAD_REQUEST',
      });
    }

    // 4. 요청 바디 필드 검증 (title, startDate, endDate가 모두 없을 경우는 통과)
    const hasTitle = title !== undefined && title !== null;
    const hasStartDate = startDate !== undefined && startDate !== null;
    const hasEndDate = endDate !== undefined && endDate !== null;

    if (hasTitle) {
      const titleValidation = validateTitle(title);
      if (!titleValidation.valid) {
        return res.status(400).json({
          status: 'error',
          message: titleValidation.error,
          errorCode: 'INVALID_TITLE',
        });
      }
    }

    if (hasStartDate) {
      const dateValidation = validateDate(startDate);
      if (!dateValidation.valid) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid startDate: ${dateValidation.error}`,
          errorCode: 'INVALID_DATE',
        });
      }
    }

    if (hasEndDate) {
      const dateValidation = validateDate(endDate);
      if (!dateValidation.valid) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid endDate: ${dateValidation.error}`,
          errorCode: 'INVALID_DATE',
        });
      }
    }

    // 5. 날짜 범위 검증: startDate와 endDate가 모두 있는 경우
    let actualStartDate = hasStartDate ? startDate : todo.startdate;
    let actualEndDate = hasEndDate ? endDate : todo.enddate;

    if (hasStartDate || hasEndDate) {
      const dateRangeValidation = validateDateRange(actualStartDate, actualEndDate);
      if (!dateRangeValidation.valid) {
        return res.status(400).json({
          status: 'error',
          message: dateRangeValidation.error,
          errorCode: 'INVALID_DATE_RANGE',
        });
      }
    }

    // 6. 업데이트 쿼리 - 제공된 필드만 업데이트
    let updateQuery = 'UPDATE todo SET updatedat = NOW()';
    const updateParams = [];
    let paramIndex = 2; // 1번은 todoId

    if (hasTitle) {
      updateQuery += `, title = $${paramIndex}`;
      updateParams.push(title);
      paramIndex++;
    }

    if (hasStartDate) {
      updateQuery += `, startdate = $${paramIndex}`;
      updateParams.push(startDate);
      paramIndex++;
    }

    if (hasEndDate) {
      updateQuery += `, enddate = $${paramIndex}`;
      updateParams.push(endDate);
      paramIndex++;
    }

    updateQuery += ` WHERE todoid = $${paramIndex} AND userid = $1 RETURNING *`;
    updateParams.unshift(userId); // userId를 배열 맨 앞에 추가 (파라미터 1번)
    updateParams.push(todoId); // todoId를 배열 끝에 추가 (마지막 파라미터)

    const updateResult = await pool.query(updateQuery, updateParams);

    // 7. 업데이트된 할일 객체 변환 (camelCase로)
    const updatedRow = updateResult.rows[0];
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const updatedTodo = {
      todoId: updatedRow.todoid,
      userId: updatedRow.userid,
      title: updatedRow.title,
      startDate: formatDate(updatedRow.startdate),
      endDate: formatDate(updatedRow.enddate),
      priority: updatedRow.priority,
      isCompleted: updatedRow.iscompleted,
      isDeleted: updatedRow.isdeleted,
      createdAt: updatedRow.createdat,
      updatedAt: updatedRow.updatedat,
      deletedAt: updatedRow.deletedat,
    };

    // 8. 응답 반환
    res.status(200).json({
      status: 'success',
      message: 'Todo updated successfully',
      data: updatedTodo,
    });
  } catch (err) {
    console.error('Update todo error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// DELETE /api/todos/:id - 할일 삭제 (소프트 삭제)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const todoId = req.params.id;

    // 1. 할일 존재 여부 확인 및 사용자 권한 검증
    const findTodoQuery = `
      SELECT
        todoid,
        userid
      FROM todo
      WHERE todoid = $1
    `;
    const findTodoResult = await pool.query(findTodoQuery, [todoId]);

    if (findTodoResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found',
        errorCode: 'NOT_FOUND',
      });
    }

    const todo = findTodoResult.rows[0];

    // 2. 사용자 권한 확인 (자신의 할일만 삭제 가능)
    if (todo.userid !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource',
        errorCode: 'FORBIDDEN',
      });
    }

    // 3. 소프트 삭제 쿼리 실행 (isdeleted=true, deletedat=현재 시각)
    const updateQuery = `
      UPDATE todo
      SET
        isdeleted = true,
        deletedat = NOW(),
        updatedat = NOW()
      WHERE todoid = $1 AND userid = $2
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

    const updateResult = await pool.query(updateQuery, [todoId, userId]);

    // 4. 업데이트된 할일 객체 변환 (camelCase로)
    const updatedRow = updateResult.rows[0];
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const deletedTodo = {
      todoId: updatedRow.todoid,
      userId: updatedRow.userid,
      title: updatedRow.title,
      startDate: formatDate(updatedRow.startdate),
      endDate: formatDate(updatedRow.enddate),
      priority: updatedRow.priority,
      isCompleted: updatedRow.iscompleted,
      isDeleted: updatedRow.isdeleted,
      createdAt: updatedRow.createdat,
      updatedAt: updatedRow.updatedat,
      deletedAt: updatedRow.deletedat,
    };

    // 5. 응답 반환
    res.status(200).json({
      status: 'success',
      message: 'Todo moved to trash successfully',
      data: deletedTodo,
    });
  } catch (err) {
    console.error('Delete todo error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// POST /api/todos/:id/restore - 할일 복원
router.post('/:id/restore', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const todoId = req.params.id;

    // 1. 할일 존재 여부 확인 및 사용자 권한 검증
    const findTodoQuery = `
      SELECT
        todoid,
        userid,
        isdeleted
      FROM todo
      WHERE todoid = $1
    `;
    const findTodoResult = await pool.query(findTodoQuery, [todoId]);

    if (findTodoResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found',
        errorCode: 'NOT_FOUND',
      });
    }

    const todo = findTodoResult.rows[0];

    // 2. 사용자 권한 확인 (자신의 할일만 복원 가능)
    if (todo.userid !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource',
        errorCode: 'FORBIDDEN',
      });
    }

    // 3. 삭제된 할일인지 확인 (복원은 삭제된 할일만 가능)
    if (!todo.isdeleted) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot restore a non-deleted todo',
        errorCode: 'BAD_REQUEST',
      });
    }

    // 4. 복원 쿼리 실행 (isdeleted=false, deletedat=null)
    const updateQuery = `
      UPDATE todo
      SET
        isdeleted = false,
        deletedat = NULL,
        updatedat = NOW()
      WHERE todoid = $1 AND userid = $2
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

    const updateResult = await pool.query(updateQuery, [todoId, userId]);

    // 5. 복원된 할일 객체 변환 (camelCase로)
    const updatedRow = updateResult.rows[0];
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const restoredTodo = {
      todoId: updatedRow.todoid,
      userId: updatedRow.userid,
      title: updatedRow.title,
      startDate: formatDate(updatedRow.startdate),
      endDate: formatDate(updatedRow.enddate),
      priority: updatedRow.priority,
      isCompleted: updatedRow.iscompleted,
      isDeleted: updatedRow.isdeleted,
      createdAt: updatedRow.createdat,
      updatedAt: updatedRow.updatedat,
      deletedAt: updatedRow.deletedat,
    };

    // 6. 응답 반환
    res.status(200).json({
      status: 'success',
      message: 'Todo restored successfully',
      data: restoredTodo,
    });
  } catch (err) {
    console.error('Restore todo error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// PATCH /api/todos/:id/complete - 할일 완료 처리
router.patch('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const todoId = req.params.id;

    // 1. 할일 존재 여부 확인 및 사용자 권한 검증
    const findTodoQuery = `
      SELECT
        todoid,
        userid,
        iscompleted,
        isdeleted
      FROM todo
      WHERE todoid = $1
    `;
    const findTodoResult = await pool.query(findTodoQuery, [todoId]);

    if (findTodoResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found',
        errorCode: 'NOT_FOUND',
      });
    }

    const todo = findTodoResult.rows[0];

    // 2. 사용자 권한 확인 (자신의 할일만 완료 처리 가능)
    if (todo.userid !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource',
        errorCode: 'FORBIDDEN',
      });
    }

    // 3. 삭제된 할일인지 확인 (삭제된 할일은 완료 처리할 수 없음)
    if (todo.isdeleted) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot complete a deleted todo',
        errorCode: 'BAD_REQUEST',
      });
    }

    // 4. 완료 상태 토글 (true <-> false)
    const newCompletedStatus = !todo.iscompleted;
    const updateQuery = `
      UPDATE todo
      SET
        iscompleted = $1,
        updatedat = NOW()
      WHERE todoid = $2 AND userid = $3
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

    const updateResult = await pool.query(updateQuery, [newCompletedStatus, todoId, userId]);

    // 5. 업데이트된 할일 객체 변환 (camelCase로)
    const updatedRow = updateResult.rows[0];
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const completedTodo = {
      todoId: updatedRow.todoid,
      userId: updatedRow.userid,
      title: updatedRow.title,
      startDate: formatDate(updatedRow.startdate),
      endDate: formatDate(updatedRow.enddate),
      priority: updatedRow.priority,
      isCompleted: updatedRow.iscompleted,
      isDeleted: updatedRow.isdeleted,
      createdAt: updatedRow.createdat,
      updatedAt: updatedRow.updatedat,
      deletedAt: updatedRow.deletedat,
    };

    // 6. 응답 반환
    res.status(200).json({
      status: 'success',
      message: newCompletedStatus ? 'Todo completed successfully' : 'Todo uncompleted successfully',
      data: completedTodo,
    });
  } catch (err) {
    console.error('Complete todo error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// PATCH /api/todos/:id/priority - 할일 우선순위 변경
router.patch('/:id/priority', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const todoId = req.params.id;
    const { priority: newPriority } = req.body;

    // 1. 요청 바디 검증
    if (newPriority === undefined || newPriority === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Priority is required',
        errorCode: 'MISSING_FIELDS',
      });
    }

    // 2. 우선순위 범위 검증
    if (typeof newPriority !== 'number' || newPriority <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Priority must be a number greater than 0',
        errorCode: 'INVALID_PRIORITY',
      });
    }

    if (newPriority > 999999) {
      return res.status(400).json({
        status: 'error',
        message: 'Priority exceeds maximum allowed value',
        errorCode: 'INVALID_PRIORITY',
      });
    }

    // 3. 할일 존재 여부 확인 및 사용자 권한 검증
    const findTodoQuery = `
      SELECT
        todoid,
        userid,
        priority,
        isdeleted
      FROM todo
      WHERE todoid = $1 AND isdeleted = false
    `;
    const findTodoResult = await pool.query(findTodoQuery, [todoId]);

    if (findTodoResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found',
        errorCode: 'NOT_FOUND',
      });
    }

    const todo = findTodoResult.rows[0];

    // 4. 사용자 권한 확인 (자신의 할일만 변경 가능)
    if (todo.userid !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource',
        errorCode: 'FORBIDDEN',
      });
    }

    // 트랜잭션 시작: 변경하려는 우선순위와 같은 우선순위를 가진 다른 할일들의 우선순위를 조정
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (newPriority < todo.priority) {
        // 새로운 우선순위가 현재보다 작을 때 (즉, 앞으로 이동)
        // 기존 우선순위 이전에서 새로운 우선순위까지에 있는 항목들을 하나씩 밀어냄
        await client.query(`
          UPDATE todo
          SET priority = priority + 1, updatedat = NOW()
          WHERE userid = $1
            AND isdeleted = false
            AND priority >= $2
            AND priority < $3
        `, [userId, newPriority, todo.priority]);
      } else if (newPriority > todo.priority) {
        // 새로운 우선순위가 현재보다 클 때 (즉, 뒤로 이동)
        // 현재 우선순위 이후에서 새로운 우선순위 이전에 있는 항목들을 하나씩 당겨옴
        await client.query(`
          UPDATE todo
          SET priority = priority - 1, updatedat = NOW()
          WHERE userid = $1
            AND isdeleted = false
            AND priority > $2
            AND priority <= $3
        `, [userId, todo.priority, newPriority]);
      }

      // 5. 변경된 항목의 우선순위 업데이트
      const updateQuery = `
        UPDATE todo
        SET
          priority = $1,
          updatedat = NOW()
        WHERE todoid = $2 AND userid = $3
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

      const updateResult = await client.query(updateQuery, [newPriority, todoId, userId]);

      // 6. 업데이트된 할일 객체 변환 (camelCase로)
      const updatedRow = updateResult.rows[0];
      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const reorderedTodo = {
        todoId: updatedRow.todoid,
        userId: updatedRow.userid,
        title: updatedRow.title,
        startDate: formatDate(updatedRow.startdate),
        endDate: formatDate(updatedRow.enddate),
        priority: updatedRow.priority,
        isCompleted: updatedRow.iscompleted,
        isDeleted: updatedRow.isdeleted,
        createdAt: updatedRow.createdat,
        updatedAt: updatedRow.updatedat,
        deletedAt: updatedRow.deletedat,
      };

      await client.query('COMMIT');

      // 7. 응답 반환
      res.status(200).json({
        status: 'success',
        message: 'Todo priority updated successfully',
        data: reorderedTodo,
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Reorder todo error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// DELETE /api/todos/:id/permanent - 할일 영구 삭제
router.delete('/:id/permanent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const todoId = req.params.id;

    // 1. 할일 존재 여부 확인 및 사용자 권한 검증
    const findTodoQuery = `
      SELECT
        todoid,
        userid,
        isdeleted
      FROM todo
      WHERE todoid = $1
    `;
    const findTodoResult = await pool.query(findTodoQuery, [todoId]);

    if (findTodoResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found',
        errorCode: 'NOT_FOUND',
      });
    }

    const todo = findTodoResult.rows[0];

    // 2. 사용자 권한 확인 (자신의 할일만 영구 삭제 가능)
    if (todo.userid !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource',
        errorCode: 'FORBIDDEN',
      });
    }

    // 3. 삭제된 상태인지 확인 (isdeleted=true여야 영구 삭제 가능)
    if (!todo.isdeleted) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot permanently delete a non-deleted todo',
        errorCode: 'BAD_REQUEST',
      });
    }

    // 4. 물리적 삭제 쿼리 실행
    const deleteQuery = `
      DELETE FROM todo
      WHERE todoid = $1 AND userid = $2
    `;

    const deleteResult = await pool.query(deleteQuery, [todoId, userId]);

    if (deleteResult.rowCount === 0) {
      // 이 경우는 위에서 권한 확인과 삭제 상태 확인을 했으므로 거의 발생하지 않음
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found',
        errorCode: 'NOT_FOUND',
      });
    }

    // 5. 응답 반환
    res.status(200).json({
      status: 'success',
      message: 'Todo permanently deleted successfully',
    });
  } catch (err) {
    console.error('Permanent delete todo error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
