// 토큰 저장소 관리
const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  hasToken: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};
