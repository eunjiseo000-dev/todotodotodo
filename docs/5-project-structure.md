# 프로젝트 구조 설계 원칙

## ToDoToDoToDo

---

## 개요

이 문서는 개발팀이 ToDoToDoToDo 프로젝트를 구현할 때 따를 **아키텍처, 코드 조직, 네이밍, 테스트, 보안** 관련 설계 원칙을 정의합니다.

**참고 문서:**

- [1-domain-definition.md](./1-domain-definition.md) - 기술적 도메인 정의
- [2-prd.md](./2-prd.md) - 기능 요구사항
- [3-user-scenarios.md](./3-user-scenarios.md) - 사용자 사용 시나리오

---

## 1. 최상위 원칙 (모든 스택 공통)

### 1.1 아키텍처 원칙: 계층화 구조

**원칙**: 4계층 아키텍처 구현
- Presentation Layer: React 컴포넌트 (UI 렌더링)
- API Layer: Express.js REST API (요청 처리)
- Business Logic Layer: 검증, 규칙 적용, 계산
- Data Layer: ORM (Prisma), 데이터베이스 쿼리

**의존성 원칙**: 상위 계층은 하위 계층에만 의존 (역의존 금지)

### 1.2 데이터 무결성 원칙

**원칙 1: Soft Delete (논리적 삭제)**

- 모든 할일 삭제는 `isDeleted = true`로 표시 (물리적 삭제 X)
- 모든 조회 쿼리에 `isDeleted = false` 조건 필수
- 휴지통은 `isDeleted = true`인 할일만 조회

**원칙 2: 사용자 격리**

- 모든 할일 조회/수정/삭제 시 `userId` 검증 필수
- 자신의 할일만 접근 가능 (다른 사용자의 할일 접근 시 403 Forbidden)

**원칙 3: 상태 검증**

- 삭제된 할일(isDeleted=true)은 수정 불가 (복원 후 수정)
- 완료된 할일도 수정 가능
- 날짜 검증: 시작일 ≤ 종료일 (BR-001)

### 1.3 보안 우선 원칙

**인증 (Authentication)**

- JWT 토큰 기반 인증 (24시간 유효)
- 모든 API 요청에 JWT 검증 필수
- 비밀번호: bcrypt로 해시 저장 (8자 이상, 영문+숫자+특수문자)

**권한 (Authorization)**

- 모든 엔드포인트에서 사용자 신원 확인
- 사용자 자신의 리소스만 접근 가능
- 권한 없음 시: 403 Forbidden 응답

**통신 보안**

- HTTPS 필수 (production, Vercel에서 자동 제공)
- CORS: 프론트엔드 도메인만 허용
- SQL 인젝션 방지: Prisma ORM 사용 (raw query 금지)

### 1.4 성능 원칙

**데이터베이스 인덱싱**

- userId에 인덱스 (모든 할일은 사용자별 조회)
- isDeleted에 인덱스 (soft delete 필터링)
- isCompleted에 인덱스 (완료/진행중 구분)
- 복합 인덱스: (userId, isDeleted, isCompleted)

**쿼리 최적화**

- N+1 쿼리 문제 해결 (Prisma include/select 사용)
- 필요한 필드만 선택 (Prisma select)
- 페이지네이션: 대량 할일 조회 시 필수

**응답 시간 목표**

- API 응답: 500ms 이내
- DB 쿼리: 50ms 이내

### 1.5 트랜잭션 원칙

**ACID 보장**

- 중요 작업(우선순위 변경 등)은 트랜잭션으로 처리
- 원자성: 여러 할일의 순서 변경 시 모두 성공하거나 모두 실패

**데이터 일관성**

- 상태 전이 검증 (예: 삭제된 할일은 수정 불가)
- 동시성 제어: 낙관적 잠금 (version 필드) 고려

---

## 2. 의존성/레이어 원칙

### 2.1 계층별 책임

**Presentation Layer (React)**

- UI 렌더링 및 사용자 상호작용
- 입력값 기본 검증 (빈 값, 날짜 형식)
- 상태 관리 (Context API / Redux)
- 에러 메시지 표시 (토스트, 모달)

**API Layer (Express.js)**

- HTTP 요청 수신 및 응답 전송
- JWT 토큰 검증
- 요청 유효성 검사 및 응답 포맷팅
- 에러 처리 및 상태 코드 반환

**Business Logic Layer**

- 비즈니스 규칙 검증 (날짜, 상태 등)
- 데이터 변환 및 계산
- 도메인 로직 구현 (Soft Delete, 우선순위 재정렬 등)

**Data Layer (ORM)**

- 데이터베이스 쿼리
- 모델 정의
- 마이그레이션 관리

### 2.2 기능별 의존성 맵

각 기능(FR-001 ~ FR-011)은 다음 계층의 처리를 요구합니다:
- 사용자 검증 (JWT)
- 데이터 검증 (날짜, 상태 등)
- 권한 확인 (userId)
- 데이터 조회/수정/삭제

---

## 3. 코드/네이밍 원칙

### 3.1 네이밍 컨벤션

**백엔드 (Node.js/JavaScript)**

- 변수/함수: `camelCase` (예: `userId`, `getActiveTodos()`)
- 클래스: `PascalCase` (예: `UserService`, `TodoController`)
- 상수: `UPPER_SNAKE_CASE` (예: `MAX_TITLE_LENGTH = 500`)
- 파일: `camelCase.js` (예: `authService.js`, `todoController.js`)
- 폴더: `camelCase` (예: `routes/`, `services/`, `middlewares/`)

**프론트엔드 (JavaScript/React)**

- 변수/함수: `camelCase` (예: `userId`, `getActiveTodos()`)
- 컴포넌트: `PascalCase` (예: `TodoDashboard`, `TodoForm`)
- 상수: `UPPER_SNAKE_CASE` (예: `MAX_TITLE_LENGTH = 500`)
- 파일: `camelCase.jsx` 또는 `PascalCase.jsx` (예: `api.js`, `TodoItem.jsx`)
- 폴더: `camelCase` (예: `components/`, `services/`)

### 3.2 코드 조직

**도메인별 분리**

- 각 기능은 도메인(auth, todos)별로 분리
- 도메인 내에서 routes, controllers, services, models 구성

**재사용 모듈화**

- 공통 로직은 `core/` 폴더에 집중
- Permissions, Pagination, Authentication 등

**상수 관리**

- settings.py: 프로젝트 설정 (DEBUG, SECRET_KEY, DATABASE 등)
- constants.py: 도메인별 상수 (최대길이, 만료시간 등)

### 3.3 주석 및 문서화

**필수 주석**

- 함수/메서드: docstring 포함
- 복잡한 로직에 설명 주석 추가
- 비즈니스 규칙 적용 부분은 명시

**금지**

- 자명한 코드에 주석
- 주석 대신 코드로 표현

---

## 4. 테스트/품질 원칙

### 4.1 단위 테스트

**백엔드 테스트**

tests/auth/, tests/todos/ 디렉토리에서:
- API 엔드포인트별 테스트 (성공, 검증 실패, 권한 검증)
- 모델 메서드 테스트
- 필터 및 유틸리티 테스트

**프론트엔드 테스트**

tests/components/, tests/hooks/ 디렉토리에서:
- 컴포넌트 렌더링 테스트
- 사용자 상호작용 시뮬레이션
- API 호출 모킹 테스트

### 4.2 테스트 커버리지

**목표**: 최소 80% 커버리지

- 모든 API 엔드포인트 테스트
- 비즈니스 로직 (검증, 규칙) 테스트
- 에러 케이스 테스트

### 4.3 테스트 케이스 패턴

- 성공 케이스 (200 OK): 정상적인 입력과 기대 결과
- 유효성 검증 (400 Bad Request): 빈 값, 잘못된 형식, 날짜 검증 등
- 권한 검증 (403 Forbidden): 사용자 격리 및 토큰 검증
- 상태 검증 (400): 삭제/완료된 항목의 상태 전이 검증

---

## 5. 설정/보안/운영 원칙

### 5.1 환경 변수 관리

**`.env` 파일 (git에 커밋 금지)**

프로젝트 실행에 필요한 환경 변수 저장:
- NODE_ENV (development, production)
- PORT (API 서버 포트)
- DATABASE_URL (Supabase PostgreSQL 연결 문자열)
- JWT 설정 (SECRET_KEY, ALGORITHM, EXPIRY_HOURS)
- CORS 허용 도메인
- 외부 서비스 인증 정보

**`.env.example` (git 커밋)**

환경 변수의 키와 설명을 포함하되, 실제 값은 비워두기

### 5.2 에러 응답 표준화

**응답 형식**

모든 응답은 status, data/message, error_code(에러 시)를 포함

**HTTP 상태 코드**

- 200: 요청 성공
- 201: 리소스 생성 성공
- 400: 유효성 검증 실패
- 401: 인증 실패 (JWT 없음/만료)
- 403: 권한 없음 (userId 불일치)
- 500: 서버 에러

### 5.3 로깅 전략

**로그 레벨**

- DEBUG: 개발 디버깅용 세부 정보
- INFO: 중요한 이벤트 (로그인, 리소스 생성 등)
- WARNING: 주의가 필요한 상황 (느린 쿼리 등)
- ERROR: 오류 발생

**구조화된 로그**

사용자 ID, 리소스 ID, 타임스탬프 등 컨텍스트 정보 포함하여 로깅

---

## 6. 백엔드 디렉토리 구조 (Node.js/Express)

**프로젝트 루트**
- package.json, package-lock.json
- .env (git 커밋 금지), .env.example
- server.js 또는 index.js (진입점)
- prisma/ (Prisma 스키마)

**src/** - 소스 코드

**src/routes/** - 라우팅
- auth.js: 인증 관련 라우트 (FR-001, 002, 003)
- todos.js: 할일 관련 라우트 (FR-004~011)

**src/controllers/** - 요청 처리
- authController.js: 회원가입, 로그인 로직
- todoController.js: 할일 CRUD 로직

**src/services/** - 비즈니스 로직
- authService.js: 사용자 검증, 토큰 생성
- todoService.js: 할일 조회, 수정, 삭제 로직

**src/middlewares/** - 미들웨어
- authMiddleware.js: JWT 검증
- errorHandler.js: 에러 처리
- validateRequest.js: 요청 검증

**src/models/** - 데이터 모델 (Prisma 스키마 활용)
- (prisma/schema.prisma에서 정의)

**src/utils/** - 유틸리티
- constants.js: 상수 정의
- validators.js: 검증 함수
- helpers.js: 헬퍼 함수

**tests/** - 테스트
- auth/, todos/ 디렉토리별 테스트

---

## 7. 프론트엔드 디렉토리 구조 (React)

**public/** - 정적 파일
- index.html

**src/**
- index.jsx, App.jsx (진입점, 라우팅)

**pages/** - 페이지별 컴포넌트
- Auth/: SignUp, Login 페이지
- Dashboard/: 메인 할일 페이지

**components/** - 재사용 컴포넌트
- Auth/: SignUpForm, LoginForm
- TodoList/: TodoItem, TodoList, TabNav
- TodoForm/: 할일 추가/수정 폼
- Trash/: 휴지통 관련 컴포넌트
- Common/: Button, Modal 등 공통 컴포넌트

**hooks/** - React Hooks
- useTodos.js: 할일 상태 관리
- useAuth.js: 인증 상태 관리

**services/** - API 호출
- api.js: axios 인스턴스 (JWT 자동 주입)
- authService.js: 회원가입, 로그인 API
- todoService.js: 할일 CRUD API

**context/** - 상태 관리
- AuthContext.jsx, TodoContext.jsx

**utils/** - 유틸리티
- dateValidator.js, constants.js, helpers.js

**styles/** - CSS
- App.css, responsive.css, variables.css

**tests/** - 테스트
- components/, hooks/ 디렉토리별 테스트

---

## 8. 체크리스트

### 새 기능 추가 시 확인사항

- [ ] 기능 ID 확인 (FR-001 등)
- [ ] 도메인 정의서에서 요구사항 확인
- [ ] 백엔드 모델 추가/수정
- [ ] API 엔드포인트 구현
- [ ] 입력 검증 로직 구현
- [ ] 권한 검증 (userId 확인)
- [ ] 프론트엔드 UI 컴포넌트 구현
- [ ] API 호출 서비스 작성
- [ ] 에러 처리 (프론트엔드)
- [ ] 단위 테스트 작성 (백엔드)
- [ ] 통합 테스트 작성 (API)
- [ ] UI 테스트 작성 (프론트엔드)
- [ ] 도메인 정의서 기능 ID 참조

### 배포 전 검증 체크리스트

**보안**

- [ ] 모든 API에 JWT 검증 있는가?
- [ ] 모든 할일 조회에 userId 검증 있는가?
- [ ] CORS 설정 제한적인가?
- [ ] 비밀번호 bcrypt로 저장되는가?
- [ ] 환경 변수로 민감 정보 관리되는가?

**성능**

- [ ] 주요 쿼리에 인덱스 있는가?
- [ ] API 응답 시간 < 500ms인가?
- [ ] N+1 쿼리 문제 없는가?
- [ ] 페이지네이션 구현되어 있는가?

**기능**

- [ ] 모든 FR-001~FR-011 기능 구현되었는가?
- [ ] Soft Delete 구현되었는가?
- [ ] 날짜 검증 (BR-001) 있는가?
- [ ] 완료 자동 분류 작동하는가?
- [ ] 우선순위 변경 정상 작동하는가?

**테스트**

- [ ] 단위 테스트 커버리지 80% 이상인가?
- [ ] 모든 에러 케이스 테스트되었는가?
- [ ] 통합 테스트 통과하는가?

---

**문서 버전**: 1.0
**작성일**: 2025-11-25
