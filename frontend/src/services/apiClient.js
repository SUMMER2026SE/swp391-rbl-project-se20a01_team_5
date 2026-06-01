function resolveApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8080/api/v1`;
  }
  return 'http://localhost:8080/api/v1';
}

const API_URL = resolveApiUrl();

export const apiClient = async (endpoint, options = {}) => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') || localStorage.getItem('access_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Xử lý chung các lỗi HTTP
    if (!response.ok) {
      if (response.status === 401) {
        // Handle Unauthorized (ví dụ: token hết hạn)
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('access_token');
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Lỗi máy chủ (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Client Error:', error);
    throw error;
  }
};
