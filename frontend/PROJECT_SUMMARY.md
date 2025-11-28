# ToDoToDoToDo Frontend - 프로젝트 요약

## 프로젝트 정보

- **프로젝트명**: ToDoToDoToDo Frontend
- **개발 기간**: 2025-11-27
- **버전**: 1.0.0
- **상태**: ✅ 완료

## 구현 통계

### 코드 통계
- **총 파일 수**: 22개 (JS/JSX)
- **총 코드 라인**: 약 569줄 (주석 제외)
- **컴포넌트 수**: 15개
- **Context**: 2개
- **Custom Hooks**: 2개
- **유틸리티 함수**: 4개

### 빌드 통계
- **번들 크기**: 363.95 kB (압축 전)
- **Gzip 크기**: 118.04 kB
- **CSS 크기**: 30.93 kB (압축 전)
- **CSS Gzip**: 6.00 kB
- **빌드 시간**: ~1초

## 기술 스택

### Core
- React 19.2.0
- React DOM 19.2.0
- React Router DOM 7.9.6

### Build Tools
- Vite 7.2.4
- ESLint 9.39.1

### Styling
- Tailwind CSS 3.4.1
- PostCSS 8.4.35
- Autoprefixer 10.4.17

### HTTP & State
- Axios 1.13.2
- Context API (내장)

### UI Libraries
- React Toastify 11.0.5
- @dnd-kit/core 6.3.1
- @dnd-kit/sortable 10.0.0
- @dnd-kit/utilities 3.2.2

## 디렉토리 구조

```
frontend/
├── src/
│   ├── pages/              # 3개 페이지
│   │   ├── Auth/           # 로그인, 회원가입
│   │   └── Dashboard/      # 대시보드
│   ├── components/         # 9개 컴포넌트
│   │   ├── TodoList/       # 목록, 아이템
│   │   ├── TodoForm/       # 폼
│   │   ├── Dialog/         # 다이얼로그 2개
│   │   ├── Tab/            # 탭 네비게이션
│   │   ├── Loading/        # 스피너
│   │   └── PrivateRoute    # 인증 라우트
│   ├── context/            # 2개 Context
│   │   ├── AuthContext     # 인증
│   │   └── TodoContext     # 할일
│   ├── hooks/              # 2개 Hook
│   │   ├── useAuth         # 인증 훅
│   │   └── useTodos        # 할일 훅
│   ├── services/           # 1개 서비스
│   │   └── api             # API 클라이언트
│   ├── utils/              # 4개 유틸
│   │   ├── validation      # 입력 검증
│   │   ├── dateHelpers     # 날짜 헬퍼
│   │   ├── toast           # 토스트
│   │   └── tokenStorage    # 토큰
│   └── styles/             # 2개 스타일
│       ├── index.css       # Tailwind
│       └── globals.css     # 전역 스타일
├── public/                 # 정적 파일
├── dist/                   # 빌드 결과
└── 설정 파일들
```

## 구현된 기능

### 인증 (Auth)
- [x] 회원가입 (이름, 이메일, 비밀번호)
- [x] 로그인 (이메일, 비밀번호)
- [x] 자동 로그인 (토큰 저장)
- [x] 로그아웃
- [x] 인증 라우트 보호
- [x] 401 자동 처리

### 할일 관리 (Todo)
- [x] 목록 조회 (진행중/완료/삭제)
- [x] 할일 추가
- [x] 할일 수정
- [x] 할일 삭제 (휴지통)
- [x] 할일 복원
- [x] 할일 영구삭제
- [x] 완료 토글
- [x] 우선순위 변경 (드래그앤드롭)

### UI/UX
- [x] 반응형 디자인
- [x] 로딩 상태 표시
- [x] 토스트 알림 (성공/에러/경고)
- [x] 확인 다이얼로그
- [x] 알림 다이얼로그
- [x] 탭 네비게이션
- [x] 드래그 앤 드롭
- [x] 에러 처리

## API 엔드포인트

### 인증 API
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인

### 할일 API
- `GET /api/todos?status=active|completed|deleted` - 목록 조회
- `POST /api/todos` - 할일 추가
- `PUT /api/todos/:id` - 할일 수정
- `DELETE /api/todos/:id` - 할일 삭제 (휴지통)
- `PATCH /api/todos/:id/restore` - 할일 복원
- `PATCH /api/todos/:id/complete` - 완료 토글
- `PATCH /api/todos/:id/reorder` - 우선순위 변경
- `DELETE /api/todos/:id/permanent` - 영구 삭제

## 색상 팔레트

- **Primary**: #1976D2 (파란색)
- **Primary Light**: #42A5F5
- **Primary Dark**: #1565C0
- **Secondary**: #424242 (회색)
- **Success**: #4CAF50 (초록색)
- **Warning**: #FF9800 (주황색)
- **Error**: #F44336 (빨간색)
- **Info**: #2196F3 (하늘색)
- **Background**: #FFFFFF (흰색)
- **Background Paper**: #F5F5F5 (연한 회색)

## 코딩 컨벤션

### 네이밍
- **컴포넌트**: PascalCase (Login.jsx, TodoItem.jsx)
- **유틸리티**: camelCase (validation.js, dateHelpers.js)
- **변수/함수**: camelCase (fetchTodos, isAuthenticated)
- **상수**: UPPER_SNAKE_CASE (TOKEN_KEY, DEFAULT_PRIORITY)

### 스타일
- **들여쓰기**: 2 spaces
- **문자열**: 작은따옴표 ('')
- **세미콜론**: 필수
- **주석**: 복잡한 로직에만

### 언어
- **UI 텍스트**: 한국어
- **에러 메시지**: 한국어
- **주석**: 한국어

## 품질 지표

### 코드 품질
- ✅ ESLint 통과
- ✅ 일관된 코딩 스타일
- ✅ 에러 처리 완비
- ✅ 입력 검증 완료
- ✅ 프로덕션 빌드 성공

### 사용자 경험
- ✅ 로딩 상태 표시
- ✅ 명확한 에러 메시지
- ✅ 반응형 디자인
- ✅ 직관적인 UI
- ✅ 부드러운 애니메이션

### 성능
- ✅ 번들 크기 최적화 (118KB gzip)
- ✅ Code Splitting (React Router)
- ✅ 빠른 빌드 시간 (~1초)
- ✅ 최적화된 CSS (6KB gzip)

## 실행 명령어

```bash
# 의존성 설치
npm install

# 개발 서버 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 프리뷰
npm run preview

# 린트 검사
npm run lint
```

## 브라우저 지원

- Chrome (최신)
- Firefox (최신)
- Safari (최신)
- Edge (최신)

## 환경 변수

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 주요 파일 설명

### 설정 파일
- `vite.config.js` - Vite 빌드 설정
- `tailwind.config.js` - Tailwind CSS 설정
- `postcss.config.js` - PostCSS 플러그인 설정
- `.env` - 환경 변수

### 핵심 파일
- `App.jsx` - 라우터 설정 및 Provider
- `main.jsx` - 앱 진입점
- `AuthContext.jsx` - 인증 상태 관리
- `TodoContext.jsx` - 할일 상태 관리
- `api.js` - API 클라이언트 및 인터셉터

## 개발 가이드라인

### Context 사용
- 인증: `useAuth()` 훅 사용
- 할일: `useTodos()` 훅 사용

### API 호출
- `services/api.js`의 `authAPI`, `todoAPI` 사용
- 자동 토큰 추가 (인터셉터)
- 401 자동 로그아웃

### 에러 처리
- try-catch 블록 사용
- `toast.error()` 또는 `toast.success()` 호출
- 사용자 친화적 메시지

### 스타일링
- Tailwind 유틸리티 클래스 우선
- `globals.css`의 재사용 클래스
- 일관된 색상 팔레트 사용

## 테스트

현재 프로젝트는 E2E 테스트나 단위 테스트가 구현되어 있지 않습니다.
추후 다음 도구를 사용한 테스트 추가를 권장합니다:

- **단위 테스트**: Vitest + React Testing Library
- **E2E 테스트**: Playwright 또는 Cypress

## 향후 개선 사항

### 기능
- [ ] 할일 검색 기능
- [ ] 할일 카테고리/태그
- [ ] 할일 기한 알림
- [ ] 다크 모드

### 성능
- [ ] React.lazy를 사용한 Code Splitting
- [ ] 이미지 최적화
- [ ] Service Worker (오프라인 지원)

### 테스트
- [ ] 단위 테스트 추가
- [ ] E2E 테스트 추가
- [ ] 테스트 커버리지 80% 이상

### 문서
- [ ] Storybook 추가
- [ ] API 문서 자동화
- [ ] 컴포넌트 사용 예시

## 라이선스

MIT

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
