# ToDoToDoToDo 스타일 가이드

## 개요
이 문서는 ToDoToDoToDo 프로젝트의 코드 스타일, 커밋 컨벤션, 그리고 개발 표준을 정의합니다.

---

## 1. 커밋 메시지 컨벤션

### 형식
```
[Type-Number]: Description
```

### 타입 정의

| 타입 | 설명 | 예시 |
|------|------|------|
| `BE-###` | 백엔드 API 구현 | `BE-012: Implement permanent delete API endpoint for deleted todos` |
| `refactor` | 코드 리팩토링 | `refactor: 모듈 분리 및 중복 코드 제거` |
| `docs` | 문서 작성/수정 | `docs: Swagger API 스펙 및 프로젝트 문서 추가` |
| `[Stage-BE-###]` | 스테이지 백엔드 구현 | `[Stage-BE-006] 할일 추가 API 구현 및 테스트 완료` |

### 커밋 메시지 작성 규칙

1. **첫 글자는 대문자로 시작**
   - ✅ `BE-012: Implement permanent delete API endpoint`
   - ❌ `BE-012: implement permanent delete API endpoint`

2. **마침표는 붙이지 않음**
   - ✅ `docs: Swagger API 스펙 추가`
   - ❌ `docs: Swagger API 스펙 추가.`

3. **영문과 한글 혼용 시 띄어쓰기**
   - ✅ `refactor: 모듈 src 폴더 및 중복 설정 파일 제거`
   - ❌ `refactor:모듈src폴더및중복설정파일제거`

4. **명확하고 구체적인 설명**
   - ✅ `BE-010: Implement complete toggle API endpoint for todos`
   - ❌ `BE-010: API 작업`

### 예시

```bash
# 백엔드 API 구현
git commit -m "BE-012: Implement permanent delete API endpoint for deleted todos"

# 리팩토링
git commit -m "refactor: 모듈 분리 및 중복 설정 파일 제거"

# 문서 작성
git commit -m "docs: Swagger API 스펙 및 프로젝트 문서 추가"
```

---

## 2. 브랜치 컨벤션

### 브랜치 이름 규칙

```
feature-{feature-number}
```

### 예시
- `feature-1`: 초기 프로젝트 설정
- `feature-2`: 인증 API 구현
- `feature-3`: 할일 관리 API 구현
- `feature-7`: 할일 수정 API 구현
- `feature-8`: 할일 삭제 및 복구 API 구현

### 규칙
1. **lowercase만 사용**
   - ✅ `feature-8`
   - ❌ `Feature-8` 또는 `FEATURE-8`

2. **단어 구분은 하이픈(-) 사용**
   - ✅ `feature-api-implementation`
   - ❌ `feature_api_implementation` 또는 `featureapiimplementation`

---

## 3. 코드 스타일 가이드

### JavaScript/Node.js

#### 파일 구조
```
backend/src/
├── config/          # 데이터베이스, 환경 설정
├── middleware/      # Express 미들웨어
├── routes/          # API 라우트 정의
├── utils/           # 공통 유틸리티 함수
└── index.js         # 메인 애플리케이션 파일
```

#### 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일명 | camelCase | `authRoutes.js`, `errorHandler.js` |
| 함수명 | camelCase | `generateToken()`, `validateEmail()` |
| 상수명 | UPPER_SNAKE_CASE | `DUMMY_HASH`, `DEFAULT_PRIORITY` |
| 변수명 | camelCase | `passwordHash`, `isPasswordValid` |
| 클래스명 | PascalCase | `AuthController`, `TodoService` |

#### 코드 포맷팅

1. **들여쓰기: 2 spaces (탭 사용 안 함)**
   ```javascript
   // ✅ Good
   router.post('/signup', async (req, res) => {
     const { email, password } = req.body;
     if (!email) {
       return res.status(400).json({ error: 'Email required' });
     }
   });

   // ❌ Bad
   router.post('/signup', async (req, res) => {
       const { email, password } = req.body;
       if (!email) {
           return res.status(400).json({ error: 'Email required' });
       }
   });
   ```

2. **세미콜론 사용**
   ```javascript
   // ✅ Good
   const user = await pool.query(query);

   // ❌ Bad
   const user = await pool.query(query)
   ```

3. **문자열은 작은따옴표('') 사용**
   ```javascript
   // ✅ Good
   const email = 'user@example.com';

   // ❌ Bad
   const email = "user@example.com";
   ```

4. **화살표 함수 선호**
   ```javascript
   // ✅ Good
   const validateEmail = (email) => {
     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   };

   // ❌ Bad
   function validateEmail(email) {
     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   }
   ```

#### 주석 작성

1. **복잡한 로직에만 주석 추가**
   ```javascript
   // ✅ Good - 왜 하는지 설명
   // 타이밍 공격 방어: 존재하지 않는 사용자도 더미 해시와 비교
   await comparePassword(password, DUMMY_HASH);

   // ❌ Bad - 무엇을 하는지만 설명 (코드가 이미 명확함)
   // 더미 해시와 비교한다
   await comparePassword(password, DUMMY_HASH);
   ```

2. **TODO 주석 사용**
   ```javascript
   // TODO: 이메일 재전송 기능 추가
   ```

#### 에러 처리

```javascript
// ✅ Good - 구체적인 에러 코드와 메시지
if (err.code === '23505') {
  return res.status(400).json({
    status: 'error',
    message: 'Email already exists',
    errorCode: 'EMAIL_ALREADY_EXISTS',
  });
}

// ❌ Bad - 모호한 에러 메시지
if (err) {
  return res.status(500).json({ error: 'Error' });
}
```

---

## 4. API 응답 포맷

### 성공 응답
```javascript
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "홍길동",
    "createdAt": "2025-11-26T10:15:00Z"
  }
}
```

### 에러 응답
```javascript
{
  "status": "error",
  "message": "Invalid email format",
  "errorCode": "INVALID_EMAIL"
}
```

### 규칙
1. **항상 `status` 필드 포함** (success, error)
2. **명확한 에러 코드 제공** (에러 디버깅 용이)
3. **필요시 `data` 필드에 추가 정보 포함**

---

## 5. 테스트 컨벤션

### 파일명
```
{filename}.test.js
```

### 테스트 구조
```javascript
describe('signup API', () => {
  it('should create a new user with valid credentials', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      name: '테스트'
    };

    // Act
    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
  });

  it('should return 400 for invalid email', async () => {
    // Test implementation
  });
});
```

### 테스트 네이밍
- `should {expected behavior} {when condition}`
- `should create a new user when valid credentials provided`
- `should return 400 error when email already exists`

---

## 6. 환경 설정

### .env 파일 규칙
```bash
# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/todotodotodo

# 서버
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=*
```

### 규칙
1. **환경 변수명은 UPPER_SNAKE_CASE**
2. **민감한 정보는 .env에 저장** (.gitignore 포함)
3. **환경별 설정 분리** (development, test, production)

---

## 7. 디렉토리 구조 규칙

```
project/
├── backend/                 # 백엔드 애플리케이션
│   ├── src/
│   │   ├── config/         # 설정 파일 (DB, 환경변수 등)
│   │   ├── middleware/     # 미들웨어 (인증, 에러 처리 등)
│   │   ├── routes/         # API 라우트
│   │   ├── utils/          # 유틸리티 함수 (JWT, 암호화 등)
│   │   └── index.js        # 메인 애플리케이션
│   ├── test/               # 테스트 파일
│   ├── package.json        # 의존성 관리
│   └── .env                # 환경 설정
├── frontend/               # 프론트엔드 애플리케이션
├── docs/                   # 프로젝트 문서
└── README.md               # 프로젝트 개요
```

---

## 8. Swagger/OpenAPI 스펙

### 경로 정의
```json
{
  "paths": {
    "/api/auth/signup": {
      "post": {
        "tags": ["인증"],
        "summary": "회원가입",
        "description": "새로운 사용자 계정을 생성합니다"
      }
    }
  }
}
```

### 규칙
1. **경로는 `/api` 프리픽스 포함**
2. **한글 태그와 설명 사용**
3. **스키마는 별도의 `components` 섹션에 정의**

---

## 9. PR 및 코드 리뷰

### Pull Request 템플릿
```markdown
## 📝 변경 내용
어떤 기능을 구현했는지 설명

## 🧪 테스트 방법
1. 테스트 방법 설명
2. 검증 결과

## ✅ 체크리스트
- [ ] 테스트 작성 및 통과
- [ ] 코드 스타일 준수
- [ ] 환경 설정 파일 수정 없음
```

### 코드 리뷰 시 확인 사항
- [ ] 커밋 메시지 규칙 준수
- [ ] 코드 스타일 일관성
- [ ] 테스트 커버리지
- [ ] 에러 처리 적절성
- [ ] 보안 취약점 검토

---

## 10. 버전 관리

### 버전 번호 규칙: Semantic Versioning (Major.Minor.Patch)

| 버전 | 설명 | 예시 |
|------|------|------|
| Major | 호환되지 않는 변경 | 1.0.0 → 2.0.0 |
| Minor | 하위 호환 기능 추가 | 1.0.0 → 1.1.0 |
| Patch | 버그 수정 | 1.0.0 → 1.0.1 |

### Release 태그
```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

---

## 체크리스트

새로운 기능을 구현할 때 다음을 확인하세요:

- [ ] 커밋 메시지가 컨벤션을 따르는가?
- [ ] 코드 스타일이 일관성 있는가?
- [ ] 테스트를 작성했는가?
- [ ] API 응답 포맷이 일관성 있는가?
- [ ] 환경 설정이 .env에 저장되어 있는가?
- [ ] Swagger 스펙을 업데이트했는가?
- [ ] README를 업데이트했는가?

---

**최종 수정 일시**: 2025-11-27
