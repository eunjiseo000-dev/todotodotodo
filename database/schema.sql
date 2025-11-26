-- ============================================================================
-- ToDoToDoToDo 데이터베이스 스키마
-- PostgreSQL (Supabase) 기반
-- ============================================================================
-- 생성일: 2025-11-26
-- 참고 문서: docs/6-erd.md
-- ============================================================================

-- 기존 테이블 삭제 (개발 환경에서만 사용)
-- DROP TABLE IF EXISTS todo CASCADE;
-- DROP TABLE IF EXISTS "user" CASCADE;

-- ============================================================================
-- 1. USER (사용자) 테이블
-- ============================================================================
-- 목적: 애플리케이션의 사용자 정보 관리
-- ============================================================================

CREATE TABLE IF NOT EXISTS "user" (
    -- 기본 키
    userId UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 필수 필드
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL,

    -- 메타데이터
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 제약 조건
    CONSTRAINT user_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT user_name_length CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 50),
    CONSTRAINT user_password_length CHECK (LENGTH(passwordHash) >= 60) -- bcrypt 해시 길이
);

-- USER 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_unique ON "user"(email);

-- USER 테이블 설명
COMMENT ON TABLE "user" IS '사용자 정보 테이블 - 회원가입/로그인 관리';
COMMENT ON COLUMN "user".userId IS '사용자 고유 식별자 (UUID)';
COMMENT ON COLUMN "user".email IS '사용자 이메일 (고유, 로그인 시 사용)';
COMMENT ON COLUMN "user".passwordHash IS 'bcrypt로 해시된 비밀번호';
COMMENT ON COLUMN "user".name IS '사용자 이름';
COMMENT ON COLUMN "user".createdAt IS '계정 생성 시각';

-- ============================================================================
-- 2. TODO (할일) 테이블
-- ============================================================================
-- 목적: 사용자의 할일 항목 관리
-- 특징: Soft Delete 적용 (isDeleted 플래그로 논리적 삭제)
-- ============================================================================

CREATE TABLE IF NOT EXISTS todo (
    -- 기본 키
    todoId UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 외래 키 (사용자 참조)
    userId UUID NOT NULL REFERENCES "user"(userId) ON DELETE CASCADE,

    -- 할일 기본 정보
    title VARCHAR(500) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,

    -- 상태 필드
    priority INTEGER NOT NULL DEFAULT 999999,
    isCompleted BOOLEAN NOT NULL DEFAULT false,
    isDeleted BOOLEAN NOT NULL DEFAULT false,

    -- 메타데이터
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,

    -- 제약 조건
    CONSTRAINT todo_title_length CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 500),
    CONSTRAINT todo_date_order CHECK (startDate <= endDate),
    CONSTRAINT todo_priority_range CHECK (priority >= 1 AND priority <= 999999),
    CONSTRAINT todo_deleted_at_consistency CHECK (
        (isDeleted = true AND deletedAt IS NOT NULL) OR
        (isDeleted = false AND deletedAt IS NULL)
    )
);

-- TODO 테이블 인덱스
-- 사용자별 할일 조회 최적화
CREATE INDEX IF NOT EXISTS idx_todo_userId ON todo(userId);

-- Soft Delete 필터링 최적화
CREATE INDEX IF NOT EXISTS idx_todo_isDeleted ON todo(isDeleted);

-- 완료/진행중 상태 필터링 최적화
CREATE INDEX IF NOT EXISTS idx_todo_isCompleted ON todo(isCompleted);

-- 복합 인덱스: 가장 일반적인 쿼리 패턴
-- 사용자별로 활성 할일만 조회 (isDeleted=false)
CREATE INDEX IF NOT EXISTS idx_todo_composite ON todo(userId, isDeleted, isCompleted);

-- 날짜 범위 쿼리 최적화 (선택사항)
CREATE INDEX IF NOT EXISTS idx_todo_dates ON todo(startDate, endDate);

-- TODO 테이블 설명
COMMENT ON TABLE todo IS '할일 항목 테이블 - Soft Delete 적용으로 삭제된 항목 복구 가능';
COMMENT ON COLUMN todo.todoId IS '할일 고유 식별자 (UUID)';
COMMENT ON COLUMN todo.userId IS '소유자 사용자 ID (User 테이블 참조)';
COMMENT ON COLUMN todo.title IS '할일 제목 (1-500자)';
COMMENT ON COLUMN todo.startDate IS '할일 시작 날짜 (YYYY-MM-DD)';
COMMENT ON COLUMN todo.endDate IS '할일 종료 날짜 (YYYY-MM-DD, startDate 이상)';
COMMENT ON COLUMN todo.priority IS '표시 순서 (작을수록 상위, 기본값: 999999)';
COMMENT ON COLUMN todo.isCompleted IS '완료 여부 (false: 진행중, true: 완료)';
COMMENT ON COLUMN todo.isDeleted IS 'Soft Delete 플래그 (false: 활성, true: 휴지통)';
COMMENT ON COLUMN todo.createdAt IS '할일 생성 시각';
COMMENT ON COLUMN todo.updatedAt IS '할일 마지막 수정 시각';
COMMENT ON COLUMN todo.deletedAt IS '할일 삭제 시각 (isDeleted=true일 때만 값 보유)';

-- ============================================================================
-- 3. 트리거 (자동 업데이트)
-- ============================================================================

-- TODO 테이블의 updatedAt 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_todo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_todo_update_timestamp ON todo;

CREATE TRIGGER trigger_todo_update_timestamp
BEFORE UPDATE ON todo
FOR EACH ROW
EXECUTE FUNCTION update_todo_updated_at();

-- ============================================================================
-- 4. 뷰 (자주 사용되는 쿼리)
-- ============================================================================

-- 사용자별 활성 할일 뷰 (진행중)
CREATE OR REPLACE VIEW v_active_todos AS
SELECT
    t.todoId,
    t.userId,
    t.title,
    t.startDate,
    t.endDate,
    t.priority,
    t.isCompleted,
    t.createdAt,
    t.updatedAt
FROM todo t
WHERE t.isDeleted = false
    AND t.isCompleted = false
ORDER BY t.priority ASC, t.createdAt ASC;

-- 사용자별 완료된 할일 뷰
CREATE OR REPLACE VIEW v_completed_todos AS
SELECT
    t.todoId,
    t.userId,
    t.title,
    t.startDate,
    t.endDate,
    t.priority,
    t.createdAt,
    t.updatedAt
FROM todo t
WHERE t.isDeleted = false
    AND t.isCompleted = true
ORDER BY t.priority ASC, t.createdAt ASC;

-- 사용자별 휴지통 할일 뷰
CREATE OR REPLACE VIEW v_trash_todos AS
SELECT
    t.todoId,
    t.userId,
    t.title,
    t.startDate,
    t.endDate,
    t.priority,
    t.isCompleted,
    t.deletedAt,
    t.createdAt
FROM todo t
WHERE t.isDeleted = true
ORDER BY t.deletedAt DESC;

-- ============================================================================
-- 5. 데이터 검증 쿼리 (모니터링/관리용)
-- ============================================================================

-- 고아 외래키 확인 쿼리
-- 존재하지 않는 userId를 가진 할일 확인
-- SELECT COUNT(*) as orphan_count FROM todo
-- WHERE userId NOT IN (SELECT userId FROM "user");

-- 중복 이메일 확인 쿼리
-- SELECT email, COUNT(*) as duplicate_count FROM "user"
-- GROUP BY email HAVING COUNT(*) > 1;

-- Soft Delete 일관성 확인
-- SELECT COUNT(*) as inconsistent_records FROM todo
-- WHERE (isDeleted = true AND deletedAt IS NULL)
--    OR (isDeleted = false AND deletedAt IS NOT NULL);

-- 사용자별 할일 통계
-- SELECT
--     u.userId,
--     u.name,
--     u.email,
--     COUNT(CASE WHEN t.isDeleted = false AND t.isCompleted = false THEN 1 END) as active_count,
--     COUNT(CASE WHEN t.isDeleted = false AND t.isCompleted = true THEN 1 END) as completed_count,
--     COUNT(CASE WHEN t.isDeleted = true THEN 1 END) as trash_count
-- FROM "user" u
-- LEFT JOIN todo t ON u.userId = t.userId
-- GROUP BY u.userId, u.name, u.email;

-- ============================================================================
-- 6. 초기 데이터 (개발/테스트용)
-- ============================================================================

-- 테스트 사용자 추가 (선택사항)
-- INSERT INTO "user" (userId, email, passwordHash, name)
-- VALUES (
--     gen_random_uuid(),
--     'test@example.com',
--     '$2b$10$example_bcrypt_hash_here',
--     'Test User'
-- ) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 7. 성능 최적화
-- ============================================================================

-- ANALYZE 통계 갱신 (선택사항 - 마이그레이션 후 실행)
-- ANALYZE "user";
-- ANALYZE todo;

-- ============================================================================
-- 스키마 생성 완료
-- ============================================================================
-- 다음 단계:
-- 1. Prisma migration 생성: npx prisma migrate dev --name init
-- 2. 애플리케이션 실행 및 기능 검증
-- 3. 데이터 검증 쿼리 실행 (위의 모니터링 용 쿼리 참고)
-- ============================================================================
