# Yêu cầu liên kết trường đại học

Tài liệu này tóm tắt phạm vi bổ sung cho hệ thống UniBus nhằm xác định sinh viên thuộc trường nào, giới hạn tuyến theo trường hoặc campus và áp dụng chính sách trợ giá.

## Nguyên tắc xác minh

Google Login chỉ xác nhận tài khoản và email là hợp lệ. UniBus xác định trường của sinh viên bằng một trong các nguồn:

1. Domain email đã được trường xác nhận.
2. Danh sách sinh viên do trường import.
3. Quy trình xác minh thẻ sinh viên bằng OCR và duyệt thủ công.

Sinh viên chỉ được đăng ký tuyến và mua vé theo trường sau khi trạng thái xác minh là `VERIFIED`.

## Vai trò liên quan

### University Admin

Đại diện cho một trường đối tác và chỉ được truy cập dữ liệu có `university_id` thuộc trường được gán.

- Quản lý thông tin trường, campus và domain email.
- Import và quản lý danh sách sinh viên.
- Cấu hình chính sách trợ giá.
- Gửi thông báo theo phạm vi trường.
- Xem thống kê và báo cáo đối soát.

### Sinh viên

- Đăng nhập bằng email/mật khẩu hoặc Google.
- Xem trạng thái xác minh và trường đã liên kết.
- Chỉ xem các tuyến phục vụ trường hoặc campus của mình.
- Mua vé tháng với giá gốc, phần trường trợ giá và số tiền cuối cùng.

### System Admin

- Quản lý trường và campus.
- Tạo, gán và khóa tài khoản University Admin.
- Gán tuyến cho trường hoặc campus.
- Theo dõi audit log và dữ liệu toàn hệ thống.

### Điều phối viên

- Lọc tuyến, lịch trình, nhu cầu và chuyến xe theo trường.
- Điều phối xe, tài xế và phụ xe trong phạm vi tuyến được phân công.

### Tài xế và phụ xe

Không cần vai trò mới. Hai vai trò tiếp tục thực hiện chuyến và kiểm tra vé; dữ liệu tuyến/trường được hiển thị khi cần.

## Chức năng MVP

1. Quản lý trường và campus.
2. Role `UNIVERSITY_ADMIN` và phân quyền theo trường.
3. Quản lý domain email.
4. Import danh sách sinh viên từ CSV/XLSX.
5. Xác định trường khi sinh viên đăng nhập hoặc nộp hồ sơ OCR.
6. Liên kết `students.university_id`.
7. Gán tuyến qua `route_universities`.
8. Cấu hình và áp dụng `subsidy_policies`.
9. Hiển thị giá gốc, tiền trợ giá và giá sinh viên thanh toán.
10. Thống kê và đối soát theo trường.

## Mô hình dữ liệu

### Bảng được tái sử dụng

- `users`: tài khoản và role chung.
- `user_auth_providers`: tài khoản Google và email đã xác thực.
- `students`: hồ sơ sinh viên và liên kết `university_id`.
- `student_verifications`: hồ sơ OCR, trạng thái duyệt và trường được xác minh.
- `routes`, `route_stops`, `stops`: nghiệp vụ tuyến và trạm.
- `fares`: giá vé gốc.
- `monthly_passes`: vé tháng, QR và chi tiết trợ giá.
- `payments`, `invoices`: thanh toán và hóa đơn.
- `notifications`: thông báo cá nhân.
- `audit_logs`: truy vết thao tác quản trị.

### Bảng phục vụ liên kết trường

- `universities`: trường đối tác.
- `campuses`: cơ sở đào tạo.
- `university_domains`: domain dùng nhận diện trường.
- `university_admins`: tài khoản quản trị và trường được gán.
- `university_student_rosters`: danh sách sinh viên do trường cung cấp.
- `university_import_batches`: thông tin từng đợt import.
- `university_import_errors`: lỗi theo dòng trong file import.
- `route_universities`: quan hệ nhiều-nhiều giữa tuyến và trường/campus.
- `subsidy_policies`: chính sách trợ giá theo trường.

### Dữ liệu có thể bổ sung sau MVP

- `student_subsidy_eligibilities`: điều kiện và hạn mức trợ giá theo sinh viên.
- `notification_campaigns`: chiến dịch thông báo hàng loạt.
- `reconciliation_exports`: lịch sử xuất báo cáo đối soát.
- `university_daily_statistics`: thống kê tổng hợp theo ngày.

## Quan hệ và quy tắc chính

- Một university có nhiều campus, domain, admin, roster và subsidy policy.
- Một student thuộc một university thông qua `students.university_id`.
- Một route có thể phục vụ nhiều university qua `route_universities`.
- Một monthly pass lưu giá gốc, trợ giá, giá cuối và policy tại thời điểm mua.
- University Admin không được truy cập dữ liệu của trường khác.
- Runtime frontend phải dùng API thật hoặc trạng thái loading/error/empty; không dùng mock để thay dữ liệu nghiệp vụ.

## Nguồn triển khai

Schema thực tế được quản lý bởi:

- Flyway migrations trong `backend/src/main/resources/db/migration/`.
- Snapshot tham khảo `database/DBSchema.sql`.
- API University Admin trong backend.
- Các màn University Admin và “Trường của tôi” trong frontend.

Không chỉnh sửa migration đã được chia sẻ. Thay đổi schema mới phải dùng migration version tiếp theo.
