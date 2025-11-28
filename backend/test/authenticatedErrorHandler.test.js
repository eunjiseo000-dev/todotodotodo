const request = require('supertest');
const app = require('../src/index');
const jwt = require('jsonwebtoken');

// Mock the database pool and auth middleware to test error handling properly
jest.mock('../src/config/database');
jest.mock('../src/middleware/authMiddleware', () => {
  return (req, res, next) => {
    // Mock a valid user for testing
    req.user = { userId: 'test-user-id' };
    next();
  };
});

// Mock pool queries to simulate different scenarios
const pool = require('../src/config/database');

describe('Authenticated Todo Routes Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/todos with invalid status', () => {
    test('should return 400 for invalid status parameter', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/todos?status=invalid')
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid status parameter');
    });
  });

  describe('POST /api/todos validation errors', () => {
    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({})
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Missing required fields: title, startDate, endDate');
    });

    test('should return 400 for invalid title length', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({
          title: '', // Empty title
          startDate: '2025-12-01',
          endDate: '2025-12-02'
        })
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Title must be between 1 and 500 characters');
    });

    test('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({
          title: 'Test Todo',
          startDate: 'invalid-date',
          endDate: '2025-12-02'
        })
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Date must be in YYYY-MM-DD format');
    });

    test('should return 400 for invalid date range', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({
          title: 'Test Todo',
          startDate: '2025-12-02',
          endDate: '2025-12-01' // endDate before startDate
        })
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Start date must be before or equal to end date');
    });
  });

  describe('PUT /api/todos/:id validation errors', () => {
    test('should return 400 for invalid priority value', async () => {
      const response = await request(app)
        .patch('/api/todos/test-todo-id/priority')
        .send({
          priority: -1 // Invalid priority
        })
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Priority must be a number greater than 0');
    });

    test('should return 400 for missing priority', async () => {
      const response = await request(app)
        .patch('/api/todos/test-todo-id/priority')
        .send({})
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Priority is required');
    });
  });

  describe('Error handler with Prisma-style errors', () => {
    test('should handle Prisma unique constraint error', async () => {
      pool.query.mockRejectedValueOnce({
        code: 'P2002', // Prisma unique constraint violation
        meta: {
          target: ['email']
        }
      });
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'ValidPassword123!',
          name: 'Test User'
        })
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('email은(는) 이미 존재합니다');
      expect(response.body.errorCode).toBe('DUPLICATE_ENTRY');
    });
  });
});