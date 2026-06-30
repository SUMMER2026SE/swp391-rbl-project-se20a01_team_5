# Instruction Phuc

Ghi chú cho AI/dev khác khi pull nhánh `TruongPhuc`.

## Payment SePay hiện tại

- Flow payment chính dùng Java Spring Boot, không dùng PHP.
- Endpoint tạo QR: `POST /api/v1/students/me/payments/sepay/order`.
- Endpoint poll trạng thái: `GET /api/v1/students/me/payments/sepay/order/{orderId}/status`.
- Webhook SePay: `POST /api/v1/payments/sepay/webhook`.
- Webhook match order bằng nội dung chuyển khoản dạng `DH{id}`.
- Khi webhook paid đúng số tiền:
  - insert/update `tb_transactions`
  - update `tb_orders.payment_status = 'Paid'`
  - popup frontend poll status rồi hiện thanh toán thành công.

## Nút test thanh toán

- Nút `Test thanh toán 3.000 VND` chỉ hiện cho MSSV `OKNIGGA`.
- Frontend gate ở `frontend/src/components/bus/roles/student-module.tsx` bằng `canUseTestPayment`.
- Backend cũng chặn: user khác gọi `ticketType=test` sẽ nhận `403`.
- Test order vẫn tạo order thật để webhook/poll hoạt động:
  - lưu `ticket_type = 'single'` để qua constraint DB
  - lưu `total = 3000`
  - lưu `name = 'Test UniBus'`
  - QR vẫn dùng nội dung `DH{id}`
- Khi webhook paid test order, backend không tạo vé thật nếu `name` bắt đầu bằng `Test UniBus`.
- Không dùng lại QR local `TEST...` cũ vì không có `orderId` DB nên popup sẽ không tự chuyển thành công.

## Lỗi đã xử lý

- `Student must have an approved route registration` khi bấm test:
  - test không cần đăng ký tuyến.
- `tb_orders.route_id violates not-null constraint`:
  - test order dùng route đầu tiên làm placeholder.
- `tb_orders_ticket_type_check` không cho `test`:
  - test order lưu `ticket_type = single`, phân biệt bằng `name = Test UniBus`.
- Popup không hiện thành công dù webhook OK:
  - nguyên nhân QR `TEST...` không gắn order DB.
  - đã đổi test về order DB thật + poll status thật.

## Tối ưu loading sinh viên

- Màn student bị kẹt lâu ở `Đang tải dữ liệu sinh viên...` vì `/students/me/dashboard` bị N+1 query.
- Đã tối ưu `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`:
  - batch load stops theo route bằng `stopsForRoutes(...)`
  - batch load routes theo stop bằng `routesForStops(...)`
  - `studentDashboard(...)` chỉ gọi `stopCards(...)` một lần.

## File chính liên quan

- Backend payment: `backend/src/main/java/com/unibus/api/ticketing/SePayService.java`
- Backend webhook controller: `backend/src/main/java/com/unibus/api/ticketing/SePayController.java`
- Backend student dashboard: `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`
- Frontend payment UI: `frontend/src/components/bus/roles/student-module.tsx`
- API client: `frontend/src/lib/api/client.ts`

## Check trước khi commit/push

```powershell
cd D:\hoctap\SWP\project\backend
& 'C:\Users\phucd\tools\apache-maven-3.9.16\bin\mvn.cmd' -q -DskipTests compile

cd D:\hoctap\SWP\project\frontend
npx tsc --noEmit
npm run lint

cd D:\hoctap\SWP\project
git diff --check
```

Lint hiện còn warning cũ về hook deps ở assistant/coordinator/driver, không liên quan payment.

## Chạy backend local

PowerShell dùng `$env:` thay vì `set`:

```powershell
cd D:\hoctap\SWP\project\backend
$env:DB_URL='jdbc:postgresql://postgresdemo.czg6gi08udbc.ap-southeast-1.rds.amazonaws.com:5432/postgres'
$env:DB_USERNAME='postgres'
$env:DB_PASSWORD='bussv12345'
$env:JWT_SECRET='change-this-to-a-long-secret-at-least-32-chars'
& 'C:\Users\phucd\tools\apache-maven-3.9.16\bin\mvn.cmd' spring-boot:run
```

CMD dùng `set`:

```cmd
cd /d D:\hoctap\SWP\project\backend
set DB_URL=jdbc:postgresql://postgresdemo.czg6gi08udbc.ap-southeast-1.rds.amazonaws.com:5432/postgres
set DB_USERNAME=postgres
set DB_PASSWORD=bussv12345
set JWT_SECRET=change-this-to-a-long-secret-at-least-32-chars
mvn spring-boot:run
```
