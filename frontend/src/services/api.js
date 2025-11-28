import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: Authorization 헤더 추가
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 처리 (토큰 만료/유효하지 않은 경우만)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 에러이지만 로그인/회원가입 엔드포인트가 아닌 경우만 리다이렉트
    // (로그인/회원가입 실패는 일반적인 인증 에러이므로 처리하지 않음)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      tokenStorage.removeToken();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// 인증 API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
};

// 할일 API
export const todoAPI = {
  getTodos: (status) => {
    const params = status ? { status } : {};
    return api.get('/todos', { params });
  },
  createTodo: (data) => api.post('/todos', data),
  updateTodo: (id, data) => api.put(`/todos/${id}`, data),
  deleteTodo: (id) => api.delete(`/todos/${id}`),
  restoreTodo: (id) => api.post(`/todos/${id}/restore`),
  toggleComplete: (id) => api.patch(`/todos/${id}/complete`),
  reorderTodo: (id, data) => api.patch(`/todos/${id}/priority`, data),
  permanentDeleteTodo: (id) => api.delete(`/todos/${id}/permanent`),
};

export default api;
