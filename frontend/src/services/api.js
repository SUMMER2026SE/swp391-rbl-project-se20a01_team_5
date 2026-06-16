import axios from 'axios';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_ROLE_KEY = 'user_role';
export const STUDENT_VERIFICATION_STATUS_KEY = 'student_verification_status';

function resolveApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:8080/api/v1`;
    }
    return '/api/v1';
  }
  return 'http://localhost:8080/api/v1';
}

export const API_BASE_URL = resolveApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
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
  let message = error.response?.data?.message || error.message || 'Không thể kết nối máy chủ';
  
  if (message === 'Request validation failed' && error.response?.data?.data) {
    const errors = error.response.data.data;
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      if (firstKey === 'otp') message = 'Mã OTP không hợp lệ hoặc chưa đủ 6 số';
      else if (firstKey === 'password') message = 'Mật khẩu phải có ít nhất 8 ký tự';
      else if (firstKey === 'email') message = 'Địa chỉ email không hợp lệ';
      else if (firstKey === 'fullName') message = 'Họ và tên không hợp lệ';
      else message = 'Dữ liệu nhập vào không hợp lệ';
    } else {
      message = 'Dữ liệu không hợp lệ';
    }
  } else {
    const msgMap = {
      'OTP is invalid or expired': 'Mã OTP không chính xác hoặc đã hết hạn',
      'Email is already registered': 'Email này đã được đăng ký',
      'Email or password is incorrect': 'Email hoặc mật khẩu không chính xác',
      'Account is locked': 'Tài khoản đã bị khóa',
      'Session is no longer active': 'Phiên đăng nhập đã hết hạn',
    };
    if (msgMap[message]) message = msgMap[message];
  }

  return new Error(message);
}

function isAuthEndpoint(url = '') {
  return url.includes('/auth/login') || url.includes('/auth/oauth/google') || url.includes('/auth/refresh');
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
  if (tokenPair.studentVerificationStatus) {
    localStorage.setItem(STUDENT_VERIFICATION_STATUS_KEY, tokenPair.studentVerificationStatus);
  }
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
    studentVerificationStatus: localStorage.getItem(STUDENT_VERIFICATION_STATUS_KEY),
  };
}

export function getStoredRole() {
  return readStorage(USER_ROLE_KEY);
}

export function getStoredStudentVerificationStatus() {
  return readStorage(STUDENT_VERIFICATION_STATUS_KEY);
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(STUDENT_VERIFICATION_STATUS_KEY);
}

export function toApiAssetUrl(url) {
  if (!url || url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url || '';
  }
  if (url.startsWith('/')) {
    const origin = API_BASE_URL.startsWith('http')
      ? new URL(API_BASE_URL).origin
      : (typeof window !== 'undefined' ? window.location.origin : '');
    return `${origin}${url}`;
  }
  return url;
}

export function getDefaultRouteForRole(role, studentVerificationStatus) {
  if (role === 'STUDENT' && studentVerificationStatus !== 'VERIFIED') {
    return '/student/verify';
  }

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
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      if (payload.password !== '123456') {
        throw new Error('Sai email hoặc mật khẩu. Tài khoản demo dùng mật khẩu 123456.');
      }
      const email = payload.email || '';
      const lowerEmail = email.toLowerCase();
      const role = lowerEmail.includes('admin')
        ? 'ADMIN'
        : lowerEmail.includes('taixe')
          ? 'DRIVER'
          : lowerEmail.includes('phuxe')
            ? 'CONDUCTOR'
            : lowerEmail.includes('dieuphoi')
              ? 'DISPATCHER'
              : 'STUDENT';
      return {
        tokenType: 'Bearer',
        accessToken: `mock_${role.toLowerCase()}_access_token`,
        refreshToken: `mock_${role.toLowerCase()}_refresh_token`,
        role,
        studentVerificationStatus: role === 'STUDENT' ? 'VERIFIED' : null,
      };
    }
    const response = await apiClient.post('/auth/login', {
      ...payload,
      device: payload.device || 'web',
    });
    return unwrap(response);
  },

  async googleLogin(payload) {
    const response = await apiClient.post('/auth/oauth/google', {
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

export const studentVerificationApi = {
  async listDaNangUniversities() {
    const response = await apiClient.get('/universities/da-nang');
    return unwrap(response);
  },

  async getCurrent() {
    const response = await apiClient.get('/students/me/verification');
    return unwrap(response);
  },

  async submit({ university, studentCode, cardImage }) {
    const formData = new FormData();
    formData.append('university', university);
    formData.append('studentCode', studentCode);
    if (cardImage) {
      formData.append('cardImage', cardImage);
    }

    const response = await apiClient.post('/students/me/verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(response);
  },
};

export const adminVerificationApi = {
  async list(status) {
    const response = await apiClient.get('/admin/student-verifications', {
      params: status && status !== 'ALL' ? { status } : undefined,
    });
    return unwrap(response);
  },

  async approve(verificationId) {
    const response = await apiClient.post(`/admin/student-verifications/${verificationId}/approve`);
    return unwrap(response);
  },

  async reject(verificationId, reason) {
    const response = await apiClient.post(`/admin/student-verifications/${verificationId}/reject`, { reason });
    return unwrap(response);
  },

  async requestResubmission(verificationId, reason) {
    const response = await apiClient.post(`/admin/student-verifications/${verificationId}/request-resubmission`, { reason });
    return unwrap(response);
  },

  async getCardImageBlob(verificationId) {
    const response = await apiClient.get(`/student-verifications/${verificationId}/card-image`, {
      responseType: 'blob',
    });
    return response.data;
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

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(response);
  },

  async changePassword(payload) {
    const response = await apiClient.patch('/users/me/password', payload);
    return unwrap(response);
  },
};

export const userApi = {
  async getProfile() {
    const response = await apiClient.get('/users/me/profile');
    return unwrap(response);
  },

  async updateProfile(payload) {
    const response = await apiClient.patch('/users/me/profile', payload);
    return unwrap(response);
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(response);
  },

  async changePassword(payload) {
    const response = await apiClient.patch('/users/me/password', payload);
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

  async getRoute(routeId) {
    const response = await apiClient.get(`/routes/${routeId}`);
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
