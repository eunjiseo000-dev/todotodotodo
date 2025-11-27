import { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { tokenStorage } from '../utils/tokenStorage';
import { toast } from '../utils/toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 초기화: 저장된 토큰 확인
  useEffect(() => {
    const initAuth = () => {
      const savedToken = tokenStorage.getToken();
      if (savedToken) {
        setToken(savedToken);
        setIsAuthenticated(true);
        // 토큰에서 사용자 정보 추출 (간단한 구현)
        try {
          const payload = JSON.parse(atob(savedToken.split('.')[1]));
          setUser({ id: payload.userId, email: payload.email, name: payload.name });
        } catch (err) {
          console.error('토큰 파싱 실패:', err);
          tokenStorage.removeToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // 회원가입
  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.signup(userData);
      const { token: newToken, user: newUser } = response.data.data;

      tokenStorage.setToken(newToken);
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);

      toast.success('회원가입이 완료되었습니다.');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || '회원가입에 실패했습니다.';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 로그인
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(credentials);
      const { token: newToken, user: newUser } = response.data.data;

      tokenStorage.setToken(newToken);
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);

      toast.success('로그인되었습니다.');
      return { success: true };
    } catch (err) {
      const message = '아이디, 비밀번호를 확인해주세요.';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const logout = () => {
    tokenStorage.removeToken();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    toast.info('로그아웃되었습니다.');
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
