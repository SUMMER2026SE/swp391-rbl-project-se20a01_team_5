import axios from 'axios';

// Khởi tạo một instance của axios với các cấu hình mặc định
const axiosClient = axios.create({
  // Thay đổi URL này tùy theo port mà Backend đang chạy Spring Boot
  baseURL: 'http://localhost:8080/api/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
  // timeout: 10000, // Có thể bỏ comment nếu muốn set timeout 10 giây
});

// Interceptor cho REQUEST: Xử lý dữ liệu trước khi gửi đi (VD: gắn Token)
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (chỉ chạy dưới client-side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho RESPONSE: Xử lý kết quả trả về hoặc lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => {
    // Thông thường API của Spring Boot sẽ bọc trong cấu trúc { data, message, status }
    // Nên ta có thể return thẳng response.data để dùng cho tiện
    return response.data;
  },
  (error) => {
    // Xử lý các mã lỗi phổ biến
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        console.warn('Bạn chưa đăng nhập hoặc Token đã hết hạn!');
        // Tương lai có thể thêm logic tự động chuyển hướng về trang /login
        // window.location.href = '/login';
      } else if (status === 403) {
        console.warn('Bạn không có quyền truy cập vào chức năng này!');
      } else if (status === 500) {
        console.error('Lỗi từ Server Spring Boot!');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
