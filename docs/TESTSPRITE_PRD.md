# UniBus - Product Requirements Document (PRD) cho TestSprite

## 1. Tổng quan Dự án (Project Overview)
**UniBus** là hệ thống quản lý xe buýt đại học toàn diện (University Bus Management System) với kiến trúc Microservices/Monolithic kết hợp (Spring Boot Backend) và giao diện Web (React/Next.js/Vite Frontend). Hệ thống phục vụ việc vận hành, theo dõi, và cung cấp dịch vụ xe buýt chuyên dụng cho sinh viên các trường đại học.

Mục tiêu chính: Cung cấp lịch trình chính xác, theo dõi vị trí xe thời gian thực (real-time tracking), AI gợi ý tuyến đường, quét mã QR soát vé, và xác thực thẻ sinh viên (OCR).

## 2. Các Vai trò Người dùng (User Roles)
Hệ thống phân quyền chi tiết với 6 vai trò chính:
1. **Student (Sinh viên):** Tìm tuyến xe, xem lịch trình, đăng ký vé tháng, quét QR lên xe, báo cáo đồ thất lạc, nhận gợi ý tuyến đường từ AI.
2. **Driver (Tài xế):** Xem chuyến được phân công, báo cáo sự cố xe, xác nhận điểm dừng.
3. **Conductor (Phụ xe):** Soát vé bằng mã QR, quản lý hành khách lên/xuống, thu tiền vé lẻ.
4. **Dispatcher / Coordinator (Điều phối viên):** Theo dõi lộ trình xe thời gian thực, điều chỉnh lịch trình khi có sự cố, gửi thông báo khẩn cấp.
5. **University Admin (Quản trị Trường ĐH):** Quản lý sinh viên của trường, duyệt xác thực sinh viên (OCR/Manual), xem báo cáo chất lượng dịch vụ.
6. **System Admin (Quản trị Hệ thống):** Quản lý toàn bộ danh mục (Tuyến xe, Trạm dừng, Xe, Tài khoản, Phân quyền).

## 3. Bản đồ Tính năng (Feature Map)
### 3.1. Phân hệ Student (Sinh viên)
- **Xác thực Thẻ Sinh viên (OCR):** Upload ảnh thẻ, hệ thống trích xuất thông tin (Textract/Vision API) và cập nhật trạng thái "Đã xác thực" (Verified).
- **AI Route Suggestions:** Tính năng AI phân tích giờ rảnh, điểm đến, sở thích (nhanh, rẻ, tiện nghi) để gợi ý Top 3 tuyến tối ưu nhất.
- **My Ticket:** Hiển thị vé mã QR để phụ xe quét. 
- **Tracking:** Bản đồ thời gian thực hiển thị vị trí các xe buýt đang chạy trên tuyến.

### 3.2. Phân hệ Conductor (Phụ xe)
- **Quét mã QR:** Sử dụng camera thiết bị để quét QR từ ứng dụng của sinh viên.
- **Xác thực tự động:** Kiểm tra vé hợp lệ, sinh viên đúng trường, vé chưa hết hạn.

### 3.3. Phân hệ Admin / Dispatcher
- **Dashboard Data:** Thống kê chuyến, hành khách, doanh thu bằng biểu đồ trực quan.
- **Live Tracking:** Giao diện radar theo dõi toàn bộ đội xe trên bản đồ.
- **Quản lý Dữ liệu Master:** CRUD Tuyến xe (Routes), Trạm dừng (Stops), Lịch chạy (Schedules).

## 4. API Endpoints Quan trọng (API Testing)
Hệ thống sử dụng RESTful APIs:
- `POST /api/v1/auth/login`: Xác thực và trả về JWT Token.
- `POST /api/v1/students/me/route-suggestions`: Gợi ý tuyến xe (AI).
- `POST /api/v1/student-cards/scan`: Upload thẻ sinh viên để OCR.
- `GET /api/v1/routes`: Lấy danh sách tuyến xe.
- `GET /api/v1/tracking/live`: Socket/Polling lấy vị trí xe buýt.

## 5. Danh sách Tài khoản Kiểm thử (Test Credentials)
*Mật khẩu mặc định cho các tài khoản demo thường là `123456` hoặc `password` (Tuỳ thuộc vào file config của môi trường).*
- **Phụ xe (Conductor):** `conductor.demo@unibus.local`
- **Tài xế (Driver):** `driver.demo@unibus.local`
- **Điều phối (Dispatcher):** `dispatcher.demo@unibus.local`
- **Admin:** `admin.verify@unibus.local`
- **Sinh viên** `student.verified@unibus.local`
- student.pending@unibus.local (Sinh viên đang chờ duyệt).
- student.rejected@unibus.local (Sinh viên bị từ chối hồ sơ).
- student.resubmit@unibus.local (Sinh viên bị yêu cầu nộp lại ảnh thẻ do mờ).
