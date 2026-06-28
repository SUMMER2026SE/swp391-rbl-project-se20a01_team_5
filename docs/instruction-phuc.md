# Instruction Phuc

Ghi chú cho AI/dev khác khi pull nhánh `TruongPhuc`.

## Luật nhánh này

- Sau mỗi lần pull: đọc `AGENTS.md` trước khi sửa code.
- Đọc thêm `docs/AI_AGENT_DEVELOPMENT_GUIDE.md` nếu đụng luồng lớn hoặc merge nhiều nhánh.
- Không khôi phục màn hình sinh viên `stu-stops`; đã xóa có chủ đích.
- Không commit/push nếu Phúc chưa yêu cầu rõ.
- Ưu tiên giữ logic riêng của nhánh `TruongPhuc`: payment SePay, tracking xe giả lập, driver/conductor fixes.

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
- UI payment trong `frontend/src/components/bus/roles/student-module.tsx` đã được đưa về style cũ theo commit `9b4cf77`/PR payment cũ, rồi chỉnh lại để chạy với main hiện tại.
- Popup QR render bằng portal lên `document.body`; overlay dùng `fixed inset-0 z-[9999] bg-black/70` để phủ toàn app.

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

## Lỗi payment đã xử lý

- `Student must have an approved route registration` khi bấm test:
  - test không cần đăng ký tuyến.
- `tb_orders.route_id violates not-null constraint`:
  - test order dùng route đầu tiên làm placeholder.
- `tb_orders_ticket_type_check` không cho `test`:
  - test order lưu `ticket_type = single`, phân biệt bằng `name = Test UniBus`.
- Popup không hiện thành công dù webhook OK:
  - nguyên nhân QR `TEST...` không gắn order DB.
  - đã đổi test về order DB thật + poll status thật.
- PostgreSQL `could not determine data type of parameter`:
  - sửa `TicketingRepository.approvedRegistration(...)` từ `(? IS NULL OR rr.route_id = ?)` sang `(?::integer IS NULL OR rr.route_id = ?)`.

## Tìm tuyến xe / theo dõi xe giả lập

- Backend mô phỏng xe realtime, không thêm database.
- API chính: `GET /api/v1/routes/{routeId}/stops/{stopId}/live-arrivals`.
- Frontend API client: `transportApi.liveArrivals(routeId, stopId, direction?)`.
- Xe giả lập chạy theo route polyline/path points:
  - có seed riêng theo xe để lệch vị trí nhau;
  - tốc độ dao động;
  - gần trạm thì giảm tốc;
  - tới trạm thì dừng vài giây;
  - sau đó chạy tiếp tới trạm kế tiếp.
- `Tìm tuyến xe` hiện dùng `JourneyPlannerDesktop`, không dùng lại `FindRoutesScreen`, để giữ map/live tracking.
- Đã port UX mới từ nhánh `DucHai` vào `JourneyPlannerDesktop`:
  - ô nhập một trường `Trạm đến`;
  - dropdown gợi ý overlay;
  - search không dấu/có dấu bằng `normalizeSearch`;
  - ban đầu hiện tất cả tuyến;
  - chọn trạm thì lọc tuyến có đi qua trạm đó.
- Khi chọn tuyến trong `Tìm tuyến xe`, map không hiện tất cả xe giả lập nữa; chỉ giữ thông tin tuyến/xe ở panel.
- Khi click một xe ở danh sách xe sắp đến:
  - chuyển sang tab `Theo dõi xe`;
  - theo dõi đúng xe được chọn;
  - đổi tab khác thì reset xe đang theo dõi.
- `Theo dõi xe` sau khi có vé/route:
  - hiện tuyến đã đăng ký;
  - map chỉ hiện xe gần nhất/xe đang theo dõi;
  - panel hiển thị tên tuyến, trạm sắp tới, trạm tiếp theo, ETA, khoảng cách.
- Frontend không tin hoàn toàn `targetStopName` backend cho tracking panel; tự tính vị trí xe trên polyline rồi suy ra trạm sắp tới/trạm tiếp theo để tránh lệch như xe gần trạm A nhưng panel ghi trạm đầu/cuối.

## Tối ưu loading sinh viên

- Màn student từng kẹt lâu ở `Đang tải dữ liệu sinh viên...` vì `/students/me/dashboard` bị N+1 query.
- Đã tối ưu `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`:
  - batch load stops theo route bằng `stopsForRoutes(...)`
  - batch load routes theo stop bằng `routesForStops(...)`
  - `studentDashboard(...)` chỉ gọi `stopCards(...)` một lần.

## File chính liên quan

- Backend payment: `backend/src/main/java/com/unibus/api/ticketing/SePayService.java`
- Backend webhook controller: `backend/src/main/java/com/unibus/api/ticketing/SePayController.java`
- Backend ticket/payment SQL: `backend/src/main/java/com/unibus/api/ticketing/TicketingRepository.java`
- Backend student dashboard: `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`
- Frontend payment UI + tracking tab: `frontend/src/components/bus/roles/student-module.tsx`
- Frontend journey planner/map/live arrivals: `frontend/src/components/bus/student/journey-planner-desktop.tsx`
- API client: `frontend/src/lib/api/client.ts`

## Check trước khi commit/push

```powershell
cd D:\hoctap\SWP\project\backend
& 'C:\Users\phucd\tools\apache-maven-3.9.16\bin\mvn.cmd' -q -DskipTests compile

cd D:\hoctap\SWP\project\frontend
npx tsc --noEmit
npm run lint
npm run build

cd D:\hoctap\SWP\project
git diff --check
```

Lint có thể còn warning cũ về hook deps hoặc `<img>` nếu main/nhánh khác đưa vào; không tự sửa ngoài phạm vi nếu Phúc không yêu cầu.

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
