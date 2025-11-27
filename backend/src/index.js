// ToDoToDoToDo API 서버 메인 파일
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const errorHandler = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger 문서 불러오기
const swaggerDocument = require('../../swagger/swagger.json');

// CORS 설정: 환경변수에서 쉼표로 구분된 여러 origin 처리
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(o => o.trim());

// 미들웨어
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI 미들웨어
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 기본 health check 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'ToDoToDoToDo API Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 라우트
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/todos', require('./routes/todoRoutes'));

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path,
  });
});

// 에러 핸들러 (전역)
app.use(errorHandler);

// 서버 시작 (테스트 환경에서는 skip)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✓ Server is running on http://localhost:${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
