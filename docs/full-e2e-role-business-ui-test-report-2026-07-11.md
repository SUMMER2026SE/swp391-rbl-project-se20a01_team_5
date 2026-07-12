# Báo cáo kiểm thử E2E UniBus: tích hợp role và dữ liệu demo

Ngày cập nhật: 12/07/2026
Workspace: `unibus-api`, nhánh `DucHai`
Baseline trước tích hợp: `75cccd82bd365c01f92305e2aaaa69239d372018`

## 1. Kết luận

Phạm vi tích hợp hiện tại đạt mức **merge candidate cho demo** sau khi chạy browser E2E theo role, API negative/payment path, full backend tests, frontend lint/build và live RDS Reset/Audit.

Đợt này tích hợp trực tiếp các phần Admin, University Admin, Driver và Conductor đã chọn từ source của thành viên nhóm; giữ nguyên Student/Coordinator tracking hiện tại, không đổi schema và không thêm Flyway migration. Trong lần E2E cuối, flow SePay thật đã phát hiện thêm lỗi PostgreSQL ở dashboard vé khi routeId tùy chọn là null; lỗi đã được sửa tối thiểu và xác nhận lại trực tiếp qua API.

Điểm còn chủ đích giữ lại: frontend Conductor đang ở **demo mode**, cho phép quét trên chuyến được phân công chưa kết thúc thay vì ép cửa sổ thời gian production. Đây là quyết định tạm thời đã được chấp thuận và phải bật lại rule thời gian nghiêm ngặt trước production.

## 2. Phạm vi thay đổi

| Khu vực | Trước | Sau |
|---|---|---|
| System Admin | Nhiều màn quản lý trả rỗng hoặc thiếu luồng | Khôi phục dashboard/menu và các luồng quản trị được tích hợp từ PR #64, gồm thông báo Admin |
| University Admin | Dashboard Duy Tân thiếu dữ liệu nhìn thấy | Hiển thị dữ liệu trường, cơ sở, sinh viên, tuyến, trợ giá và giao dịch thực từ RDS |
| Driver | Dashboard có thể lấy cả chuyến ngoài hôm nay và chọn nhầm active trip | Chỉ thống kê chuyến hôm nay; active trip chỉ là chuyến `RUNNING` |
| Conductor dashboard | Có thể coi chuyến không chạy là active | Chỉ coi `RUNNING` là chuyến đang chạy |
| Conductor scan | Mặc định lấy phần tử đầu, có thể chọn sai tuyến | Ưu tiên chuyến `RUNNING` được phân công; nhãn vé được Việt hóa |
| Conductor history | Màn lịch sử rỗng vì API mặc định chỉ lấy hôm nay | Dashboard trả 7 ngày chuyến hoàn thành; UI timeline hiển thị 14 chuyến và khử bản ghi trùng cùng ngày/tuyến/giờ |
| OTP/Auth tests | Attempt counting và H2 fixture không khớp | Attempt counting ổn định; bổ sung test schema cần thiết |
| SePay webhook | Endpoint có thể bị gọi khi không có API key hợp lệ | Bắt buộc API key, so sánh constant-time, loại bỏ hành vi test/backdoor ẩn; có negative/security tests |
| Ticket dashboard | PostgreSQL lỗi kiểu tham số khi gọi registration lookup không truyền routeId | Ép kiểu nullable routeId thành `integer`; `GET /students/me/tickets` trả dữ liệu bình thường |
| University roster | Domain fallback có thể ghi đè MSSV roster | Roster match là nguồn ưu tiên; fallback domain không ghi đè kết quả roster |
| Demo data | Bộ script `Stable` trùng lặp, cleanup rộng và auth không rõ | Một bộ script chuẩn hóa, auth bắt buộc, cleanup theo marker, timezone Việt Nam và audit read-only |

## 3. Script demo chuẩn

- `database/RunDemoData.ps1`
- `database/SeedDemoDataUntilAugust.sql`
- `database/ResetDemoScenario.sql`
- `database/AuditDemoDataUntilAugust.sql`

Nguyên tắc an toàn:

- Không có DB host/user/password mặc định.
- Seed/Reset yêu cầu xác nhận rõ ràng.
- Audit là read-only.
- Cleanup chỉ bám marker demo và quan hệ FK liên quan.
- Script đặt timezone `Asia/Ho_Chi_Minh`.
- Không đổi schema, không tạo migration.

## 4. Kết quả live RDS

Đã chạy trực tiếp trên live RDS được cấu hình trong `dbauth.txt`:

1. Reset trước browser E2E: PASS.
2. Audit trước browser E2E: toàn bộ assertion PASS.
3. Tạo order SePay, gửi webhook hợp lệ, xác nhận order Paid và invoice được tạo: PASS.
4. Reset sau mutation payment: PASS.
5. Audit cuối sau reset: toàn bộ assertion PASS.

Các điểm audit chính:

- Đủ account/profile cho Admin, University Admin, Dispatcher, Driver, Conductor và các student demo.
- Không còn registration demo dùng tuyến giả `UB-DN-*`.
- Toàn bộ student demo thuộc Trường Đại học Duy Tân.
- Tuyến trợ giá Duy Tân là BUSMAP 12; tuyến giá thường là BUSMAP 02.
- Hôm nay có 2 chuyến được phân đúng cho Driver/Conductor demo và 14 trip demo fleet.
- Vé tháng, vé lượt, paid order, unpaid order và travel history đều PASS.
- `uniadmin.demo@unibus.local` quản lý Duy Tân, thấy 7 sinh viên và dữ liệu tài chính.
- Có 12 domain email đại học active.

Reset chỉ thay đổi dữ liệu demo theo marker; không thực hiện DDL hay migration.

## 5. Browser E2E

### Student

- `student.supported@unibus.local`: dashboard DTU, counter sau animation, tuyến 12 trợ giá, route card “Đã có vé hợp lệ”, vé tháng/QR và tracking map render đúng.
- Tra cứu tuyến tải 19 tuyến hoạt động, giờ chạy và số trạm; map zoom control hiển thị.
- Lịch sử chuyến hiển thị empty state hợp lệ khi account chưa có lịch sử.
- Thanh toán hiển thị giá niêm yết, hỗ trợ trường và số sinh viên trả.
- `student.day@unibus.local`: vé lượt còn hiệu lực hiển thị điểm lên/xuống, trạng thái và hạn dùng.
- `student.unpaid@unibus.local`: route card hiển thị “Cần mua vé” và CTA “Chọn vé / thanh toán”.
- `student.fullprice@unibus.local`: tuyến 02 hiển thị không trợ giá và tổng thanh toán đủ giá.

### Driver

- Dashboard hiển thị 2 chuyến hôm nay, 1 chuyến `RUNNING`, tuyến 02 active.
- Đã mở và xác nhận tải được: Lịch chạy xe, Chuyến đang chạy, Tuyến được phân, Lịch sử chuyến, Liên hệ điều phối, Hồ sơ cá nhân.
- Không gặp runtime error hoặc duplicate-key warning hiển thị trên UI.

### Conductor

- Dashboard nhận tuyến 02 đang chạy và biển số `43B-80808`.
- Scan mặc định đúng chuyến được phân; danh sách vé hợp lệ tải được.
- QR sai trả “Vé không hợp lệ / Không tìm thấy vé với mã QR này”.
- Lịch sử hiển thị 14 chuyến; các màn Kiểm tra vé tháng, Hỗ trợ mất đồ, Báo cáo sự cố và Liên hệ tài xế đều tải được.
- Không tiêu thụ vé demo hợp lệ trong browser E2E.

### University Admin

- Dashboard Duy Tân hiển thị 7 sinh viên, 1 cơ sở, tuyến, chính sách trợ giá và giao dịch.
- Đã mở và xác nhận tải được toàn bộ menu: Thống kê sử dụng, Thông tin trường & cơ sở, Domain email, Import danh sách SV, Danh sách sinh viên, Chính sách trợ giá, Đối soát tài chính, Lịch sử giao dịch, Gửi thông báo, Hồ sơ cá nhân.

### System Admin

- Dashboard hệ thống hiển thị user/trip/doanh thu/trường và hoạt động gần đây.
- Đã mở và xác nhận tải được toàn bộ menu: Tài khoản & phân quyền, Trường đối tác, Xác minh sinh viên, Giao dịch & hóa đơn, Giá vé, Khiếu nại & vi phạm, Nhật ký hoạt động, Gửi thông báo.

### Dispatcher regression smoke

- Dashboard hiển thị 14 xe, 13 xe đang chạy và 2 ca hôm nay.
- Đã mở: Theo dõi tất cả xe, Lịch trình xe, Phân công xe chạy, Tuyến đường, Trạm dừng, Điều phối theo trường, Hỗ trợ và phản hồi.
- Không thay đổi cơ chế/UI tracking trong đợt này.

## 6. API E2E

| Kiểm tra | Kết quả |
|---|---|
| Đăng nhập sai mật khẩu | HTTP 401 |
| Đăng nhập 7 account đại diện | HTTP 200, đúng role Student/University Admin/Dispatcher/Driver/Conductor/Admin |
| SePay webhook thiếu key | HTTP 401 |
| SePay webhook sai key | HTTP 401 |
| Tạo monthly order cho student unpaid | PASS |
| Webhook đúng key/đúng amount | Order chuyển `Paid` |
| Provision payment/invoice | Payment `PAID`, invoice được tạo |
| Dashboard vé sau payment | Ban đầu phát hiện HTTP 500; sau fix trả HTTP 200 và có ticket/payment |
| Reset + dashboard vé kiểm tra lại | HTTP 200; demo data trở về baseline |

## 7. Validation tự động

| Lệnh/kiểm tra | Kết quả |
|---|---|
| Backend compile + full `mvn test` | PASS, 70 tests, 0 failure, 0 error, 0 skipped; exit 0 |
| Frontend `npm run lint` | PASS, 0 error; 5 warning hook dependency cũ thuộc Student tracking; exit 0 |
| Frontend `npm run build` | PASS, 11 static pages; explicit exit 0 và BUILD_ID được tạo |
| PowerShell parser scripts | PASS: `RunDemoData.ps1` và `CompleteDemoSePayWebhook.ps1` |
| `git diff --cached --check` | PASS |
| Conflict marker scan | PASS, 0 marker ngoài `.worktrees/` đã loại khỏi scan |
| Live RDS Audit | PASS toàn bộ assertion |

## 8. Bảo mật và nghiệp vụ đã harden

- Webhook SePay bắt buộc API key; request thiếu/sai key bị từ chối.
- So sánh webhook key theo constant-time.
- Không còn nhánh ẩn tự chọn order test hoặc bỏ qua xác thực.
- OTP attempt được tăng đúng và test bằng H2 schema phù hợp.
- Roster import ưu tiên MSSV đã match, không bị domain fallback ghi đè.
- Driver/Conductor dashboard không kéo ±7 ngày vào số liệu “hôm nay”.
- Active trip chỉ lấy trip `RUNNING`.
- Conductor scan ưu tiên trip `RUNNING` được phân công.
- Nullable routeId trong registration lookup có kiểu SQL rõ ràng, tránh lỗi PostgreSQL JDBC.

## 9. Giới hạn còn lại

- Conductor scan frontend vẫn giữ demo mode ngoài cửa sổ giờ. Trước production cần khôi phục rule mở 30 phút trước, đóng theo thời điểm kết thúc hoặc 3 giờ sau lịch chạy.
- 5 warning React hook dependency cũ thuộc Student tracking chưa xử lý vì ngoài phạm vi tích hợp này.
- Chưa chạy test concurrency thật cho duplicate trip/webhook; functional và security path tuần tự đã được kiểm tra.
- Không đại tu Coordinator tracking/GPS vì ngoài phạm vi đã chốt.

## 10. Trạng thái Git trước PR

- Branch: `DucHai`.
- Baseline remote trước commit: `75cccd82bd365c01f92305e2aaaa69239d372018`.
- `.worktrees/` là untracked ngoài phạm vi, không stage và không chỉnh sửa.
- Không có schema change hoặc Flyway migration.
