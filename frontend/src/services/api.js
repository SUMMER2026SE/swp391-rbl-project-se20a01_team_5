import axios from 'axios';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_ROLE_KEY = 'user_role';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function readStorage(key) {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(key);
}

function unwrap(response) {
  return response.data?.data ?? null;
}

function toApiError(error) {
  const message = error.response?.data?.message || error.message || 'Không thể kết nối máy chủ';
  return new Error(message);
}

function isAuthEndpoint(url = '') {
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

apiClient.interceptors.request.use((config) => {
  const token = readStorage(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = readStorage(REFRESH_TOKEN_KEY);

    if (
      error.response?.status === 401 &&
      refreshToken &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const tokenPair = unwrap(refreshResponse);
        setAuthSession(tokenPair);
        originalRequest.headers.Authorization = `Bearer ${tokenPair.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearAuthSession();
        return Promise.reject(toApiError(refreshError));
      }
    }

    return Promise.reject(toApiError(error));
  },
);

export function setAuthSession(tokenPair) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, tokenPair.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokenPair.refreshToken);
  localStorage.setItem(USER_ROLE_KEY, tokenPair.role);
}

export function getAuthSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    role: localStorage.getItem(USER_ROLE_KEY),
  };
}

export function getStoredRole() {
  return readStorage(USER_ROLE_KEY);
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
}

export function getDefaultRouteForRole(role) {
  const routes = {
    STUDENT: '/student',
    DRIVER: '/driver',
    CONDUCTOR: '/assistant',
    DISPATCHER: '/coordinator',
    ADMIN: '/admin',
  };

  return routes[role] || '/student';
}

export const authApi = {
  async requestRegistrationOtp(email) {
    const response = await apiClient.post('/auth/register/otp', { email });
    return unwrap(response);
  },

  async register(payload) {
    const response = await apiClient.post('/auth/register', payload);
    return unwrap(response);
  },

  async login(payload) {
    const response = await apiClient.post('/auth/login', {
      ...payload,
      device: payload.device || 'web',
    });
    return unwrap(response);
  },

  async refresh(refreshToken) {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return unwrap(response);
  },

  async logout() {
    const response = await apiClient.post('/auth/logout');
    return unwrap(response);
  },

  async requestPasswordResetOtp(email) {
    const response = await apiClient.post('/auth/forgot-password/otp', { email });
    return unwrap(response);
  },

  async resetPassword(payload) {
    const response = await apiClient.post('/auth/forgot-password/reset', payload);
    return unwrap(response);
  },
};

export const travelApi = {
  async getHistory({ page = 0, size = 20 } = {}) {
    const response = await apiClient.get('/students/me/travel-history', {
      params: { page, size },
    });
    return unwrap(response);
  },
};

export const studentApi = {
  async getProfile() {
    const response = await apiClient.get('/students/me/profile');
    return unwrap(response);
  },

  async updateProfile(payload) {
    const response = await apiClient.patch('/students/me/profile', payload);
    return unwrap(response);
  },
};

export const transportApi = {
  async getStops() {
    const response = await apiClient.get('/stops');
    return unwrap(response);
  },

  async searchRoutes(boardingStopId, alightingStopId) {
    const response = await apiClient.get('/routes/search', {
      params: { boardingStopId, alightingStopId },
    });
    return unwrap(response);
  },

  async getEta(routeId, stopId) {
    const response = await apiClient.get(`/routes/${routeId}/stops/${stopId}/eta`);
    return unwrap(response);
  },
};

export const registrationApi = {
  async getCurrent() {
    const response = await apiClient.get('/students/me/route-registrations/current');
    return unwrap(response);
  },

  async register(payload) {
    const response = await apiClient.post('/students/me/route-registrations', payload);
    return unwrap(response);
  },

  async change(registrationId, payload) {
    const response = await apiClient.put(`/students/me/route-registrations/${registrationId}`, payload);
    return unwrap(response);
  },

  async cancel(registrationId, reason) {
    const response = await apiClient.delete(`/students/me/route-registrations/${registrationId}`, {
      data: reason ? { reason } : undefined,
    });
    return unwrap(response);
  },
};
