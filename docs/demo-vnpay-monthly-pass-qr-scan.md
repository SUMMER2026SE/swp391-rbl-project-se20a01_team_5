# Hướng Dẫn Demo Module Thanh Toán VNPay, Vé Tháng Và Quét Vé QR

## 1. Phạm vi module demo

Module này bao gồm các chức năng trong tracking phần sinh viên:

| STT | Màn hình / Chức năng | Nội dung demo |
| --- | --- | --- |
| 5 | Thanh toán | Sinh viên thanh toán phí dịch vụ / vé tháng qua VNPay mock hoặc sandbox |
| 6 | Hóa đơn | Sinh viên xem hóa đơn, trạng thái thanh toán |
| 7 | Mua vé tháng | Sinh viên mua vé tháng, hệ thống tạo vé và QR |

Phần mở rộng để demo trọn nghiệp vụ:

| Vai trò | Chức năng liên quan |
| --- | --- |
| Điều phối | Phân công tuyến, tài xế, xe bus, phụ xe |
| Phụ xe | Xem chuyến được phân công và quét QR vé tháng |

Luồng chính khi demo:

```text
Điều phối phân công chuyến
-> Phụ xe thấy chuyến được phân công
-> Sinh viên mua vé tháng bằng VNPay
-> Hệ thống tạo hóa đơn và QR vé tháng
-> Phụ xe quét QR để xác nhận sinh viên lên xe
```

## 2. Chuẩn bị trước khi demo

### 2.1. Chạy backend

Mở terminal PowerShell tại backend:

```powershell
cd D:\UNIBUS\swp391-rbl-project-se20a01_team_5\backend

$env:DB_URL="jdbc:postgresql://localhost:5432/unibus"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="MAT_KHAU_POSTGRES_CUA_BAN"
$env:JWT_SECRET="your-secret-at-least-32-characters-long"
$env:FRONTEND_URL="http://localhost:3000"

$env:VNPAY_TMN_CODE="DEMO"
$env:VNPAY_HASH_SECRET="DEMO_SECRET"
$env:VNPAY_PAY_URL="mock"
$env:VNPAY_RETURN_URL="http://localhost:8080/api/v1/payments/vnpay-return"

$env:MAVEN_OPTS="-Xmx384m -XX:ReservedCodeCacheSize=48m -XX:MaxMetaspaceSize=160m -XX:+UseSerialGC"

& "C:\Program Files\Apache\Maven\apache-maven-3.9.10\apache-maven-3.9.10\bin\mvn.cmd" "-Dspring-boot.run.jvmArguments=-Xmx384m -XX:ReservedCodeCacheSize=48m -XX:MaxMetaspaceSize=160m -XX:+UseSerialGC" spring-boot:run
```

Backend chạy ổn khi thấy log gần giống:

```text
Tomcat started on port 8080
Started UnibusApiApplication
```

### 2.2. Chạy frontend

Mở terminal PowerShell tại frontend:

```powershell
cd D:\UNIBUS\swp391-rbl-project-se20a01_team_5\frontend
npm.cmd run dev
```

Mở trình duyệt:

```text
http://localhost:3000
```

### 2.3. Kiểm tra dữ liệu demo

Trong pgAdmin, chạy query kiểm tra có chuyến hôm nay cho phụ xe:

```sql
SELECT t.trip_id, r.route_name, b.license_plate, t.service_date, t.status, u.email
FROM trips t
JOIN routes r ON r.route_id = t.route_id
JOIN buses b ON b.bus_id = t.bus_id
JOIN conductors c ON c.conductor_id = t.conductor_id
JOIN users u ON u.user_id = c.user_id
WHERE t.service_date = CURRENT_DATE
ORDER BY t.trip_id DESC;
```

Nếu chưa có dữ liệu, điều phối có thể tạo ca mới trên web hoặc chạy seed demo có sẵn trong repo:

```text
D:\UNIBUS\swp391-rbl-project-se20a01_team_5\database\SeedStudentVerificationTestData.sql
```

## 3. Tài khoản demo đề xuất

### 3.1. Sinh viên

```text
Email: student.verified@unibus.local
Password: Password123!
```

### 3.2. Phụ xe

```text
Email: conductor.iter1@unibus.local
Password: Password123!
```

### 3.3. Điều phối / Admin

Dùng tài khoản điều phối hoặc admin đang có trong DB. Nếu cần tìm nhanh:

```sql
SELECT email, role, status
FROM users
WHERE role IN ('ADMIN', 'DISPATCHER', 'COORDINATOR')
ORDER BY role, email;
```

## 4. Kịch bản demo chi tiết

### Bước 1. Điều phối phân công chuyến

Mục tiêu: chứng minh chuyến phụ xe nhìn thấy là chuyến thật được phân công từ điều phối.

Thao tác:

1. Đăng nhập tài khoản điều phối hoặc admin.
2. Vào màn **Lịch trình & Phân công**.
3. Tạo ca mới hoặc chỉnh ca đang có.
4. Chọn đầy đủ thông tin:
   - Tuyến đường
   - Thứ / ngày chạy hôm nay
   - Giờ chạy
   - Tài xế
   - Phụ xe
   - Xe bus
5. Bấm **Tạo mới** hoặc **Lưu Phân Công**.

Lời thoại gợi ý:

```text
Ở bước này điều phối tạo lịch chạy và phân công tài xế, xe bus, phụ xe. Khi lưu, hệ thống đồng bộ lịch phân công sang chuyến thực tế trong bảng trips của ngày hôm nay.
```

Kết quả mong đợi:

```text
Ca được lưu thành công và có trạng thái đã phân công.
```

### Bước 2. Phụ xe xem chuyến được phân công

Mục tiêu: chứng minh phụ xe chỉ thấy chuyến được gán cho mình.

Thao tác:

1. Đăng xuất tài khoản điều phối.
2. Đăng nhập tài khoản phụ xe.
3. Vào màn **Chuyến phân công**.
4. Bấm **Tải chuyến** nếu cần.

Kết quả mong đợi:

```text
Phụ xe thấy chuyến vừa được điều phối phân công.
Màn hình hiển thị mã chuyến, tuyến, biển số xe, ngày chạy và trạng thái.
```

Lời thoại gợi ý:

```text
Màn này không dùng dữ liệu giả. Dữ liệu được lấy theo phụ xe đang đăng nhập, dựa trên bảng trips. Nếu điều phối đổi hoặc xóa phân công, phụ xe tải lại sẽ thấy dữ liệu thay đổi tương ứng.
```

### Bước 3. Chuyển sang quét vé đúng chuyến

Mục tiêu: chứng minh chức năng quét vé dùng chung chuyến được phân công.

Thao tác:

1. Tại màn **Chuyến phân công**, bấm **Quét vé chuyến này**.
2. Hệ thống chuyển sang màn **Quét vé QR**.
3. Kiểm tra dropdown chuyến xe đã tự chọn đúng chuyến.

Kết quả mong đợi:

```text
Dropdown chuyến xe hiển thị đúng trip vừa chọn.
```

Lời thoại gợi ý:

```text
Trip ID được truyền sang màn quét vé, nên phụ xe chỉ kiểm tra vé trên đúng chuyến mình đang phụ trách.
```

### Bước 4. Sinh viên mua vé tháng bằng VNPay mock

Mục tiêu: chứng minh sinh viên mua vé tháng, hệ thống tạo payment, hóa đơn và QR.

Thao tác:

1. Đăng xuất phụ xe.
2. Đăng nhập tài khoản sinh viên.
3. Vào màn **Mua vé tháng** hoặc `/student/passes`.
4. Chọn tuyến phù hợp với chuyến demo, ví dụ:

```text
ITER1 - Campus Loop
```

5. Chọn phương thức thanh toán VNPay / ví điện tử.
6. Bấm thanh toán.
7. Với demo mock, hoàn tất thanh toán theo màn mock.
8. Sau khi thanh toán thành công, quay lại màn vé tháng.

Kết quả mong đợi:

```text
Payment chuyển sang trạng thái PAID.
Vé tháng được kích hoạt.
Hóa đơn được tạo.
Mã QR vé tháng hiển thị với dạng UB-MONTHLY-...
```

Lời thoại gợi ý:

```text
Khi sinh viên thanh toán, backend tạo payment ở trạng thái PENDING. Sau khi VNPay trả kết quả thành công, hệ thống cập nhật payment thành PAID, tạo hóa đơn và kích hoạt vé tháng kèm QR.
```

### Bước 5. Sinh viên xem hóa đơn thanh toán

Mục tiêu: chứng minh sau thanh toán sinh viên xem lại được lịch sử/hóa đơn.

Thao tác:

1. Vẫn ở tài khoản sinh viên.
2. Vào màn **Ví / Hóa đơn** hoặc `/student/wallet`.
3. Quan sát danh sách thanh toán.

Kết quả mong đợi:

```text
Hóa đơn thanh toán hiển thị thông tin số tiền, trạng thái đã thanh toán hoặc thất bại/chưa thanh toán nếu có.
```

Lời thoại gợi ý:

```text
Sinh viên có thể kiểm tra lại hóa đơn và trạng thái thanh toán, giúp minh bạch lịch sử giao dịch.
```

### Bước 6. Phụ xe quét QR vé tháng

Mục tiêu: chứng minh QR vé tháng được kiểm tra thật ở backend.

Thao tác:

1. Copy mã QR vé tháng của sinh viên, dạng:

```text
UB-MONTHLY-...
```

2. Đăng xuất sinh viên.
3. Đăng nhập lại phụ xe.
4. Vào màn **Quét vé QR**.
5. Chọn đúng chuyến đang chạy nếu chưa tự chọn.
6. Dán mã QR vào ô **Mã QR vé tháng**.
7. Bấm **Kiểm tra vé**.

Kết quả mong đợi:

```text
Nếu vé hợp lệ, màn hình hiển thị thông báo vé tháng hợp lệ.
Thông tin sinh viên, mã sinh viên và tuyến được hiển thị.
Backend ghi nhận lịch sử lên xe.
```

Lời thoại gợi ý:

```text
Khi quét vé, backend kiểm tra QR có tồn tại không, vé có ACTIVE không, còn hạn không và tuyến của vé có khớp với tuyến của chuyến không. Nếu hợp lệ, hệ thống ghi nhận sinh viên lên xe vào travel_history.
```

### Bước 7. Demo xóa hoặc gỡ phân công

Mục tiêu: chứng minh dữ liệu phụ xe thay đổi theo điều phối.

Thao tác:

1. Đăng nhập điều phối.
2. Vào **Lịch trình & Phân công**.
3. Xóa ca hoặc gỡ phụ xe / xe / tài xế khỏi ca.
4. Bấm **Lưu Phân Công**.
5. Đăng nhập lại phụ xe.
6. Vào **Chuyến phân công** và bấm **Tải chuyến**.

Kết quả mong đợi:

```text
Chuyến đã bị xóa hoặc gỡ phân công sẽ không còn xuất hiện ở màn phụ xe.
```

Lời thoại gợi ý:

```text
Khi điều phối xóa ca hoặc làm ca không còn đủ thông tin phân công, backend xóa chuyến hôm nay tương ứng. Vì vậy phụ xe không thể quét vé cho chuyến không còn được phân công.
```

## 5. Kiểm tra nhanh bằng SQL khi có lỗi

### 5.1. Kiểm tra phụ xe có tồn tại không

```sql
SELECT u.email, c.conductor_id, c.employee_code
FROM users u
JOIN conductors c ON c.user_id = u.user_id
WHERE u.email = 'conductor.iter1@unibus.local';
```

### 5.2. Kiểm tra chuyến hôm nay của phụ xe

```sql
SELECT t.trip_id, r.route_name, b.license_plate, t.service_date, t.status, u.email
FROM trips t
JOIN routes r ON r.route_id = t.route_id
JOIN buses b ON b.bus_id = t.bus_id
JOIN conductors c ON c.conductor_id = t.conductor_id
JOIN users u ON u.user_id = c.user_id
WHERE u.email = 'conductor.iter1@unibus.local'
  AND t.service_date = CURRENT_DATE
ORDER BY t.trip_id DESC;
```

### 5.3. Kiểm tra vé tháng đã tạo QR chưa

```sql
SELECT monthly_pass_id, student_code, route_id, status, qr_code, valid_from, expires_on
FROM monthly_passes
WHERE qr_code IS NOT NULL
ORDER BY monthly_pass_id DESC;
```

### 5.4. Kiểm tra payment và invoice

```sql
SELECT payment_id, student_code, amount, status, created_at
FROM payments
ORDER BY payment_id DESC;

SELECT invoice_id, student_code, total_amount, status, issued_at
FROM invoices
ORDER BY invoice_id DESC;
```

### 5.5. Kiểm tra lịch sử quét vé

```sql
SELECT travel_history_id, student_code, trip_id, boarded_at, confirmation_method, confirmed_by_conductor_id
FROM travel_history
ORDER BY travel_history_id DESC;
```

## 6. Lỗi thường gặp và cách xử lý

### 6.1. Backend không chạy vì port 8080 bị chiếm

```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

Nếu `taskkill` bị timeout, chạy PowerShell bằng quyền Administrator:

```powershell
Stop-Process -Id <PID> -Force
```

### 6.2. Java báo thiếu memory hoặc paging file

Chạy backend với cấu hình nhẹ RAM:

```powershell
$env:MAVEN_OPTS="-Xmx384m -XX:ReservedCodeCacheSize=48m -XX:MaxMetaspaceSize=160m -XX:+UseSerialGC"
```

Nếu vẫn lỗi, tắt bớt Chrome/IDE hoặc tăng Virtual Memory của Windows.

### 6.3. Phụ xe không thấy chuyến

Kiểm tra các điểm sau:

1. Đã chọn đúng phụ xe trong màn điều phối chưa.
2. Ca có đủ xe bus, tài xế và phụ xe chưa.
3. Ca có đúng ngày / thứ hôm nay chưa.
4. Backend đã restart sau khi sửa code chưa.
5. Chạy query kiểm tra bảng `trips` hôm nay.

### 6.4. Quét QR báo không hợp lệ

Kiểm tra:

1. QR có đúng dạng `UB-MONTHLY-...` không.
2. Vé tháng có trạng thái `ACTIVE` không.
3. Vé còn hạn không.
4. Tuyến của vé tháng có trùng tuyến của chuyến đang chọn không.

## 7. Ghi chú kỹ thuật để giải thích khi được hỏi

- Không tạo bảng mới cho module này.
- Dùng các bảng có sẵn:
  - `payments`
  - `monthly_passes`
  - `invoices`
  - `fares`
  - `bus_schedules`
  - `trips`
  - `conductors`
  - `travel_history`
- `bus_schedules.conductor_id` dùng để lưu phụ xe được điều phối.
- `trips.conductor_id` dùng để phụ xe thấy chuyến và được quyền quét vé.
- `monthly_passes.qr_code` là mã QR vé tháng.
- `travel_history.confirmation_method = 'QR_SCAN'` để ghi nhận lượt lên xe bằng QR.
- Với demo chưa có merchant VNPay thật, có thể dùng VNPay mock để chứng minh luồng nghiệp vụ.

## 8. Checklist trước khi trình bày

- [ ] Backend chạy port 8080.
- [ ] Frontend chạy port 3000.
- [ ] PostgreSQL đang bật.
- [ ] Có tài khoản sinh viên, phụ xe, điều phối/admin.
- [ ] Có tuyến, xe, tài xế, phụ xe trong DB.
- [ ] Điều phối tạo được ca có đủ xe, tài xế, phụ xe.
- [ ] Phụ xe thấy chuyến được phân công.
- [ ] Sinh viên mua được vé tháng.
- [ ] Vé tháng có QR `UB-MONTHLY-...`.
- [ ] Phụ xe quét QR thành công.
- [ ] Hóa đơn/payment hiển thị đúng trạng thái.
