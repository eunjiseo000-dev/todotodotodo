# ToDoToDoToDo 기술 아키텍처 다이어그램

## 시스템 아키텍처 (4계층)

```mermaid
graph TB
    subgraph Client["📱 클라이언트 계층 (Presentation)"]
        React["React App"]
        Auth["Auth Pages<br/>(Login/SignUp)"]
        Dashboard["Dashboard<br/>(Task List)"]
        Form["Task Form<br/>(Add/Edit)"]
    end

    subgraph API["🔌 API 계층 (Express.js)"]
        AuthRoute["Auth Routes<br/>(POST /signup<br/>POST /login)"]
        TodoRoute["Todo Routes<br/>(GET/POST/PUT<br/>DELETE /todos)"]
        AuthMW["Auth Middleware<br/>(JWT Verify)"]
    end

    subgraph BL["⚙️ 비즈니스 로직 계층"]
        AuthService["Auth Service<br/>(Validate, Bcrypt Hash)"]
        TodoService["Todo Service<br/>(CRUD, Soft Delete)"]
    end

    subgraph DB["💾 데이터 접근 계층"]
        Prisma["Prisma ORM<br/>(PostgreSQL 연결)"]
        PG["PostgreSQL<br/>(Supabase)"]
    end

    subgraph Deploy["🚀 배포"]
        Vercel["Vercel<br/>(Frontend + Backend)"]
    end

    React -->|HTTP/REST| AuthMW
    React -->|HTTP/REST| TodoRoute

    AuthMW -->|검증| AuthRoute
    AuthMW -->|검증| TodoRoute

    AuthRoute -->|로직| AuthService
    TodoRoute -->|로직| TodoService

    AuthService -->|Query| Prisma
    TodoService -->|Query| Prisma

    Prisma -->|연결| PG

    Vercel -->|호스팅| React
    Node -->|호스팅| AuthRoute
    Node -->|호스팅| TodoRoute

    style Client fill:#e1f5ff
    style API fill:#f3e5f5
    style BL fill:#fff3e0
    style DB fill:#e8f5e9
    style Deploy fill:#fce4ec
```

## 데이터 플로우

```mermaid
graph LR
    User["👤 사용자"]
    Browser["🌐 브라우저<br/>(React)"]
    APIServer["🔧 API 서버<br/>(Express)"]
    DB["📊 데이터베이스<br/>(PostgreSQL)"]
    Cache["💾 JWT Token"]

    User -->|상호작용| Browser
    Browser -->|1. HTTP Request<br/>+ JWT Token| APIServer
    APIServer -->|2. 검증<br/>(권한/데이터)| APIServer
    APIServer -->|3. 쿼리| DB
    DB -->|4. 데이터| APIServer
    APIServer -->|5. JSON Response| Browser
    Browser -->|6. 렌더링| User
    APIServer -->|JWT 생성| Cache
    Browser -->|저장| Cache

    style User fill:#ffebee
    style Browser fill:#e1f5ff
    style APIServer fill:#f3e5f5
    style DB fill:#e8f5e9
    style Cache fill:#fff3e0
```

## 핵심 모듈별 아키텍처

```mermaid
graph TB
    subgraph AuthModule["🔐 인증 모듈"]
        SignUp["회원가입"]
        Login["로그인"]
        JWT["JWT 토큰<br/>(24시간)"]
    end

    subgraph TodoModule["✅ 할일 관리 모듈"]
        CRUD["CRUD<br/>(Create/Read<br/>Update/Delete)"]
        SoftDel["Soft Delete<br/>(휴지통)"]
        Priority["우선순위<br/>변경"]
        Complete["완료 처리"]
    end

    subgraph Security["🔒 보안"]
        JWT
        Auth["User Isolation<br/>(userId 검증)"]
        Validate["데이터 검증<br/>(날짜, 형식)"]
        Bcrypt["Bcrypt<br/>(비밀번호 해싱)"]
    end

    SignUp -->|토큰 발급| JWT
    Login -->|토큰 발급| JWT
    SignUp -->|해시| Bcrypt
    Login -->|검증| Bcrypt

    CRUD -->|권한 검증| Auth
    SoftDel -->|권한 검증| Auth
    Priority -->|권한 검증| Auth
    Complete -->|권한 검증| Auth

    CRUD -->|입력 검증| Validate
    SoftDel -->|입력 검증| Validate
    Priority -->|입력 검증| Validate

    style AuthModule fill:#fce4ec
    style TodoModule fill:#e3f2fd
    style Security fill:#f1f8e9
```

## 데이터베이스 스키마 (간략)

```mermaid
erDiagram
    USER ||--o{ TODO : owns

    USER {
        string userId PK
        string email UK
        string passwordHash
        string name
        timestamp createdAt
    }

    TODO {
        string todoId PK
        string userId FK
        string title
        date startDate
        date endDate
        int priority
        boolean isCompleted
        boolean isDeleted
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }
```

## 배포 아키텍처

```mermaid
graph LR
    User["👤 사용자"]
    Vercel["🚀 Vercel<br/>(React + Node.js Serverless)"]
    Supabase["📊 Supabase<br/>(PostgreSQL)"]
    HTTPS["🔒 HTTPS<br/>(암호화)"]

    User -->|브라우저| Vercel
    Vercel -->|HTTPS| Supabase

    HTTPS -.->|모든 통신 암호화| Vercel
    HTTPS -.->|모든 통신 암호화| Supabase

    style Vercel fill:#e3f2fd
    style Supabase fill:#e8f5e9
    style HTTPS fill:#ffe0b2
```

## 요청/응답 사이클 (예: 할일 조회)

```mermaid
sequenceDiagram
    participant User as 👤 사용자
    participant Frontend as 🌐 React
    participant API as 🔧 Express API
    participant Prisma as 📦 Prisma ORM
    participant DB as 💾 PostgreSQL

    User->>Frontend: 할일 목록 조회 클릭
    Frontend->>API: GET /todos<br/>(JWT Token)
    API->>API: JWT 검증
    API->>API: userId 확인
    API->>Prisma: getTodos(userId)
    Prisma->>DB: SELECT * FROM todos<br/>WHERE userId=? AND isDeleted=false
    DB-->>Prisma: 결과
    Prisma-->>API: Todo 객체 배열
    API-->>Frontend: JSON Response (200 OK)
    Frontend->>Frontend: 상태 업데이트
    Frontend->>User: 할일 목록 렌더링

    style User fill:#ffebee
    style Frontend fill:#e1f5ff
    style API fill:#f3e5f5
    style Prisma fill:#fff3e0
    style DB fill:#e8f5e9
```

---

**문서 버전**: 1.0
**작성일**: 2025-11-26
**설명**: ToDoToDoToDo 프로젝트의 기술 아키텍처를 시각화한 다이어그램
**참고**: 단순한 구조로 핵심 컴포넌트와 데이터 플로우만 표시
