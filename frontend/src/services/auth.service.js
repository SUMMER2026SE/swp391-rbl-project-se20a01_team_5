import { apiClient } from './apiClient';
import { mockLogin, mockGoogleLogin, mockRegister } from './mocks/auth.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const authService = {
  login: async (username, password) => {
    if (USE_MOCK) {
      return await mockLogin(username, password);
    }
    return await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (fullName, studentId, email, password) => {
    if (USE_MOCK) {
      return await mockRegister(fullName, studentId, email, password);
    }
    return await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, studentId, email, password }),
    });
  },

  googleLogin: async (googleToken) => {
    if (USE_MOCK) {
      return await mockGoogleLogin(googleToken);
    }
    return await apiClient('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    });
  },

  logout: () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user_role');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
  }
};
