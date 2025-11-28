# CORS 문제 해결 완료 보고서

## 📋 요약

**방안 2** (배포 대비 완벽 구성)을 성공적으로 구현했습니다.
프론트엔드 ↔ 백엔드 간 완전한 통신이 가능해졌으며, 배포 시에도 코드 수정 없이 환경 변수만 변경하면 됩니다.

## 🎯 문제 분석

### 증상
- 프론트엔드 (http://localhost:5173)에서 백엔드 API (http://localhost:3000)로 요청 시 CORS 에러 발생
- 에러 메시지: `Access-Control-Allow-Origin: http://localhost:3000 != http://localhost:5173`

### 근본 원인
백엔드의 CORS 설정이 잘못되어 있었습니다:
- 파일: `backend/src/index.js` (라인 15-18)
- 문제: 단일 문자열 기반 CORS 설정으로 하나의 origin만 허용 가능
- 결과: 백엔드 자신의 주소(localhost:3000)만 설정되어 프론트엔드(localhost:5173) 차단

## ✅ 구현한 해결책

### Phase 1: 백엔드 코드 개선

**파일:** `backend/src/index.js` (라인 14-29)

**변경 내용:**
```javascript
// CORS 설정: 환경변수에서 쉼표로 구분된 여러 origin 처리
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

**개선 사항:**
- ✅ 문자열을 배열로 파싱하여 여러 origin 지원
- ✅ 쉼표로 구분된 값 자동 처리
- ✅ 공백 자동 제거 (trim)
- ✅ 와일드카드 '*' 지원
- ✅ 동적 origin 검증

### Phase 2: 환경 변수 설정

**파일:** `backend/.env` (라인 6)

**변경:**
```bash
기존: CORS_ORIGIN=http://localhost:3000
변경: CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**설명:**
- `localhost:5173` - 프론트엔드 Vite 개발 서버
- `localhost:3000` - 백엔드 서버 (내부 요청용)

## 🧪 테스트 결과

### API 기능 검증

#### 1. 회원가입 API
```
✅ 요청: POST /api/auth/signup
✅ CORS 검증 통과
✅ 응답: 201 Created
✅ 데이터: {"status": "success", "data": {...}}
```

#### 2. 로그인 API
```
✅ 요청: POST /api/auth/login
✅ CORS 검증 통과
✅ 응답: 200 OK
✅ JWT 토큰 발급 완료
```

#### 3. 할일 조회 API
```
✅ 요청: GET /api/todos?status=active
✅ Authorization 헤더 포함
✅ CORS 검증 통과
✅ 응답: 200 OK
```

### 브라우저 테스트 결과

**프론트엔드 → 백엔드 통신:**
- ✅ http://localhost:5173/signup 에서 회원가입 성공
- ✅ 자동 로그인 후 대시보드 이동 성공
- ✅ CORS 에러 없음

## 📊 변경 사항 요약

| 구분 | 파일 | 라인 | 변경 사항 |
|------|------|------|---------|
| 코드 | `backend/src/index.js` | 14-29 | CORS 미들웨어 개선 (배열 처리) |
| 설정 | `backend/.env` | 6 | `CORS_ORIGIN` 값 업데이트 |

## 🚀 배포 준비

### 개발 환경 (현재)
```bash
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 배포 환경 (Vercel 예시)
```bash
# Single domain
CORS_ORIGIN=https://yourdomain.com

# Multiple domains
CORS_ORIGIN=https://frontend.vercel.app,https://backend.vercel.app
```

**장점:**
- 코드 수정 없음 (변경된 코드는 이미 배포되어 있음)
- Vercel 환경 변수만 수정
- 모든 환경 지원 (개발, 테스트, 프로덕션)

## 💡 기술적 상세

### CORS 동작 원리

1. **프리플라이트 요청** (Preflight)
   - 브라우저가 OPTIONS 요청 전송
   - 백엔드의 CORS 미들웨어 검증
   - Access-Control-Allow-Origin 헤더 응답

2. **Origin 검증**
   - 요청의 Origin 헤더 확인
   - allowedOrigins 배열에서 매칭 확인
   - 일치하면 요청 허용, 불일치하면 차단

3. **실제 요청**
   - 프리플라이트 통과 후 실제 요청 전송
   - 백엔드에서 API 로직 실행
   - 응답 반환

### 코드 개선의 이점

**이전 (단일 origin):**
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // 문자열만 지원
  credentials: true,
}));
```

**개선 후 (복수 origin):**
```javascript
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(o => o.trim()); // 배열 처리로 다중 origin 지원
```

## 📝 체크리스트

- ✅ CORS 코드 개선 완료
- ✅ 환경 변수 설정 완료
- ✅ 백엔드 서버 재시작 완료
- ✅ 회원가입 API 테스트 완료
- ✅ 로그인 API 테스트 완료
- ✅ 할일 조회 API 테스트 완료
- ✅ 브라우저 통신 테스트 완료
- ✅ Git 커밋 완료
- ✅ 배포 준비 완료

## 🎓 학습 포인트

### CORS란?
Cross-Origin Resource Sharing의 약자로, 브라우저 보안 정책입니다.
- 다른 도메인의 리소스 접근 제어
- 서버에서 허용할 origin 명시
- 모던 웹 애플리케이션의 필수 요소

### 왜 http://localhost:5173과 http://localhost:3000이 다른가?
- 같은 localhost이지만 포트 번호가 다름
- 브라우저는 `프로토콜 + 도메인 + 포트`를 origin으로 판단
- 하나라도 다르면 다른 origin으로 인식

### 환경 변수 기반 설정의 중요성
- 코드 재배포 없음
- 환경별 다른 설정 가능
- 보안 정보 관리 용이
- 12-factor app 원칙 준수

## 📞 연락처 및 지원

문제 발생 시:
1. 백엔드 서버가 실행 중인지 확인
2. 환경 변수 설정 확인
3. 브라우저 개발자 도구 → Network 탭에서 요청 확인
4. CORS 에러 메시지 정확히 읽기

## 최종 결과

✅ **CORS 문제 완전 해결**
✅ **프론트엔드 ↔ 백엔드 정상 통신**
✅ **배포 준비 완료**
✅ **코드 품질 향상**

---

**완료 일시**: 2025-11-27
**커밋 ID**: 64b4734
**변경 파일**: `backend/src/index.js`
