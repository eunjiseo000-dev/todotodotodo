-- Script to create the todo database and tables
-- This script contains the schema from the database/schema.sql file

-- Create the database (you might need to connect to a default database like 'postgres' first)
-- CREATE DATABASE todo;

-- Connect to the todo database before running the following commands
\c todo

-- Create the user table
CREATE TABLE IF NOT EXISTS "user" (
    userId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT user_name_length CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 50),
    CONSTRAINT user_password_length CHECK (LENGTH(passwordHash) >= 60)
);

-- Create indexes for user table
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_unique ON "user"(email);

-- Add comments to user table
COMMENT ON TABLE "user" IS '사용자 정보 테이블 - 회원가입/로그인 관리';
COMMENT ON COLUMN "user".userId IS '사용자 고유 식별자 (UUID)';
COMMENT ON COLUMN "user".email IS '사용자 이메일 (고유, 로그인 시 사용)';
COMMENT ON COLUMN "user".passwordHash IS 'bcrypt로 해시된 비밀번호';
COMMENT ON COLUMN "user".name IS '사용자 이름';
COMMENT ON COLUMN "user".createdAt IS '계정 생성 시각';

-- Create the todo table
CREATE TABLE IF NOT EXISTS todo (
    todoId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES "user"(userId) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    priority INTEGER NOT NULL DEFAULT 999999,
    isCompleted BOOLEAN NOT NULL DEFAULT false,
    isDeleted BOOLEAN NOT NULL DEFAULT false,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP,
    CONSTRAINT todo_title_length CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 500),
    CONSTRAINT todo_date_order CHECK (startDate <= endDate),
    CONSTRAINT todo_priority_range CHECK (priority >= 1 AND priority <= 999999),
    CONSTRAINT todo_deleted_at_consistency CHECK (
        (isDeleted = true AND deletedAt IS NOT NULL) OR
        (isDeleted = false AND deletedAt IS NULL)
    )
);

-- Create indexes for todo table
CREATE INDEX IF NOT EXISTS idx_todo_userId ON todo(userId);
CREATE INDEX IF NOT EXISTS idx_todo_isDeleted ON todo(isDeleted);
CREATE INDEX IF NOT EXISTS idx_todo_isCompleted ON todo(isCompleted);
CREATE INDEX IF NOT EXISTS idx_todo_composite ON todo(userId, isDeleted, isCompleted);
CREATE INDEX IF NOT EXISTS idx_todo_dates ON todo(startDate, endDate);

-- Add comments to todo table
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

-- Create the trigger function for updating the todo table
CREATE OR REPLACE FUNCTION update_todo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_todo_update_timestamp ON todo;
CREATE TRIGGER trigger_todo_update_timestamp
BEFORE UPDATE ON todo
FOR EACH ROW
EXECUTE FUNCTION update_todo_updated_at();

-- Create views
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