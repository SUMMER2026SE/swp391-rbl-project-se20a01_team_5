# UniBus External Agent Full-Role QA Runbook

Tài liệu này giao cho ChatGPT Agent/QA Agent bên ngoài kiểm thử UniBus như người dùng thật. Agent ưu tiên thao tác qua CloudFront; terminal, API và live RDS chỉ dùng cho preflight, xác minh và cleanup.

## 1. Gói file cung cấp cho Agent

Bắt buộc upload:

- `docs/external-agent-full-qa-runbook.md`
- `database/RunDemoData.ps1`
- `database/AuditDemoDataUntilAugust.sql`
- `database/SeedDemoDataUntilAugust.sql`
- `database/ResetDemoScenario.sql`
- `database/CompleteDemoSePayWebhook.ps1`

Cung cấp riêng, không commit/dán công khai:

- `dbauth.txt`
- `SEPAY_WEBHOOK_API_KEY`
- Tài khoản Google test nếu cần OAuth thật
- Email inbox test nếu cần OTP thật

Nếu Agent chỉ có browser, vẫn chạy toàn bộ black-box UI. Bước terminal/RDS không làm được phải ghi `BLOCKED_BY_ENVIRONMENT`, không được tự nhận PASS.

### Environment mặc định

```text
App: https://d8xawk4fn4vfd.cloudfront.net
API: https://d8xawk4fn4vfd.cloudfront.net/api/v1
SePay simulator: https://my.sepay.vn/testmode/transaction/simulate
Webhook: https://d8xawk4fn4vfd.cloudfront.net/api/v1/payments/sepay/webhook
Local frontend: http://localhost:3000
Local backend: http://localhost:8080
```

Ghi rõ URL, commit/deployment SHA, thời gian và timezone trước khi test. Không suy đoán CloudFront đang chạy commit mới nhất.

---

## 2. Prompt copy thẳng cho Agent

```text
Bạn là Senior QA Engineer độc lập của UniBus.

Mục tiêu:
- Test black-box đầy đủ tất cả role trên CloudFront như người dùng ngoài.
- Test UI, nghiệp vụ liên role, API negative paths, SePay, invoice, ticket provisioning, scan và notification.
- Được phép mutation live RDS qua UI/API và bộ script chuẩn được cung cấp.
- Sau test bắt buộc Reset và Audit để chứng minh dữ liệu demo sạch.

Quy tắc:
1. Không sửa source code trong quá trình QA.
2. Không đổi schema, không thêm Flyway, không chạy DDL/DROP/TRUNCATE.
3. Chỉ dùng RunDemoData.ps1 cùng SQL chuẩn được cung cấp.
4. Test UI trước; không dùng API/SQL để giả vờ UI đã hoạt động.
5. Ghi Mutation Journal cho mọi thay đổi.
6. Không bỏ qua console error, 4xx/5xx bất thường, loading vô hạn, stale data hoặc layout vỡ.
7. Không kết luận PASS trước cleanup và Audit cuối.
8. Thiếu secret/quyền/browser/terminal phải ghi BLOCKED_BY_ENVIRONMENT.
9. Không tự sửa bug; thu thập evidence và báo cáo.
10. Mỗi test case có PASS, FAIL, BLOCKED hoặc NOT_APPLICABLE.

Thứ tự bắt buộc:
Preflight/Audit → Auth → Student → University Admin → Dispatcher → Driver → Conductor → System Admin → Cross-role → API/security → Responsive/performance → Reset → Audit → Final report.
```

---

## 3. Safety contract

Được phép:

- Login toàn bộ account demo.
- Tạo order/payment/ticket/invoice và quét vé demo.
- Tạo feedback, lost item, incident, notification `[QA]`.
- Thay đổi assignment/trip demo nếu cần.
- Tạo dữ liệu tạm chỉ khi entity có đường xóa qua UI/API hoặc nằm chắc chắn trong phạm vi Reset.
- Chạy Seed/Reset/Audit bằng runner chuẩn.

Cấm:

- Chạy SQL mutation tự viết hoặc script ngoài bundle chuẩn.
- Chạy trực tiếp Seed/Reset SQL; phải dùng runner có xác nhận.
- Xóa dữ liệu không mang marker demo.
- Tạo operator/role/schema mới.
- Dùng frontend mock để che API/RDS lỗi.
- Ghi password DB, JWT secret, token hoặc webhook key vào report.
- Để lại `[QA]` data sau test.

**Không giả định Reset xóa mọi record `[QA]` tùy ý.** Trước khi tạo university/domain/policy/account/roster mới, Agent phải chứng minh record nằm trong cleanup marker của script hoặc có API/UI để xóa thủ công. Nếu không chứng minh được, chỉ test validation/read-only và không tạo record.

### Mutation Journal

| Giờ VN | Account/role | Mutation | Entity/ID | Result | Cleanup |
|---|---|---|---|---|---|
| | | | | | |

---

## 4. Demo accounts

Shared password: `Password123!`

| ID | Role | Account | MSSV | Scenario |
|---|---|---|---|---|
| DTU-SUB | Student | `student.supported@unibus.local` | `27211200001` | Route 12 trợ giá, active monthly pass, QR, tracking |
| DTU-FULL | Student | `student.fullprice@unibus.local` | `27212100002` | Route 02 full price |
| DTU-MONTH | Student | `student.monthly@unibus.local` | `27211200003` | Monthly pass/paid transaction |
| DTU-SINGLE | Student | `student.day@unibus.local` | `27217100004` | Active unused single ticket |
| DTU-UNPAID | Student | `student.unpaid@unibus.local` | `27212100005` | Approved registration, unpaid |
| DTU-HIST | Student | `student.history@unibus.local` | `27217200006` | Travel history/invoice |
| UTE-MONTH | Student | `student.ute.monthly@unibus.local` | `2411505001` | UTE monthly pass |
| UTE-SINGLE | Student | `student.ute.single@unibus.local` | `2411505002` | UTE single ticket |
| UTE-UNPAID | Student | `student.ute.unpaid@unibus.local` | `2411505003` | UTE unpaid order |
| UTE-HIST | Student | `student.ute.history@unibus.local` | `2411505004` | UTE history/invoice |
| VKU-MONTH | Student | `student.vku.monthly@unibus.local` | `24ITB001` | VKU monthly pass |
| VKU-SINGLE | Student | `student.vku.single@unibus.local` | `24ITB002` | VKU single ticket |
| VKU-UNPAID | Student | `student.vku.unpaid@unibus.local` | `24ITB003` | VKU unpaid order |
| VKU-HIST | Student | `student.vku.history@unibus.local` | `24ITB004` | VKU history/invoice |
| FPT-MONTH | Student | `student.fpt.monthly@unibus.local` | `DE210001` | FPT monthly pass |
| FPT-SINGLE | Student | `student.fpt.single@unibus.local` | `DE210002` | FPT single ticket |
| FPT-UNPAID | Student | `student.fpt.unpaid@unibus.local` | `DE210003` | FPT unpaid order |
| FPT-HIST | Student | `student.fpt.history@unibus.local` | `DE210004` | FPT history/invoice |
| STU-REAL | Student | `khanhnv20a02@gmail.com` | `DTU202032312` | Existing Duy Tân flow khi cần |
| UNI-DTU | University Admin | `uniadmin.demo@unibus.local` | — | Duy Tân roster/policy/finance |
| UNI-UTE | University Admin | `uniadmin.ute.demo@unibus.local` | — | UTE roster/policy/finance |
| UNI-VKU | University Admin | `uniadmin.vku.demo@unibus.local` | — | VKU roster/policy/finance |
| UNI-FPT | University Admin | `uniadmin.fpt.demo@unibus.local` | — | FPT roster/policy/finance |
| DSP | Dispatcher | `dispatcher.demo@unibus.local` | — | Schedule/assignment/fleet |
| DRV | Driver | `driver.demo@unibus.local` | — | Today trip/route 02 |
| CND | Conductor | `conductor.demo@unibus.local` | — | Assigned trip/scan/support |
| ADM | System Admin | `admin.demo@unibus.local` | — | System management |

Baseline:

- Universities: DTU, UTE, VKU và FPT Đà Nẵng; mỗi trường có tối thiểu 15 roster rows và 2 university admins.
- Route matrix: DTU `12/06`, UTE `11/01`, VKU `02/16`, FPT `N1/02`.
- MSSV dùng định dạng theo từng trường và không chứa `DEMO`; ownership cleanup dựa trên whitelist email.
- Không chấp nhận registration demo `UB-DN-*`.
- Business timezone: `Asia/Ho_Chi_Minh`.

---

## 5. Live RDS scripts

Chạy từ repository root.

### Pre-test Audit

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Audit
```

Nếu Audit fail: lưu output → Reset nếu được phép → Audit lại. Nếu vẫn fail, dừng và báo `ENVIRONMENT_BLOCKER`.

### Seed

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Seed
```

Nhập `SEED DEMO` khi runner yêu cầu.

### Reset bắt buộc sau test

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Reset
```

Nhập `RESET DEMO`, sau đó chạy Audit lại.

### SQL/script manifest

| File | Type | Purpose |
|---|---|---|
| `AuditDemoDataUntilAugust.sql` | Read-only | Accounts, routes, trips, tickets, university, legacy audit |
| `SeedDemoDataUntilAugust.sql` | Mutation | Tạo/cập nhật demo đến 31/08/2026 |
| `ResetDemoScenario.sql` | Mutation | Khôi phục baseline demo |
| `RunDemoData.ps1` | Safe runner | Auth file, confirmation, execute SQL |
| `CompleteDemoSePayWebhook.ps1` | Mutation helper | Complete exact SePay order |

Không chạy file tên `*Stable*`. `Mode All` chỉ Seed + Audit, không Reset.

---

## 6. Evidence và severity

Mỗi bug cần: test ID, URL, commit, role/account, giờ VN, precondition, steps, expected, actual, screenshot/video, console, request/status/response đã che secret, frequency và severity.

- `P0`: security/data loss/toàn hệ thống unusable.
- `P1`: core demo flow fail, payment/ticket/scan sai, role data trống.
- `P2`: secondary flow lỗi hoặc UI gây hiểu sai rõ.
- `P3`: polish/copy/alignment nhỏ.

Evidence naming: `TC-STU-PAY-05-before.png`, `TC-CND-SCAN-04-network.json`.

---

## 7. Preflight

### TC-PRE-01 — Deployment

- [ ] Ghi App/API URL, giờ VN và commit SHA.
- [ ] GitHub Actions validate pass.
- [ ] CloudFront không phục vụ build cũ.
- [ ] Refresh trực tiếp không 404/XML/AccessDenied.

### TC-PRE-02 — Browser/network

- [ ] Login page, logo, font, icons tải.
- [ ] API không gọi nhầm localhost.
- [ ] Không CORS/mixed-content lỗi.
- [ ] Mở Console + Network preserve log.

### TC-PRE-03 — RDS

- [ ] Audit toàn bộ PASS.
- [ ] Route 12/02, accounts, tickets, 2 assigned trips và demo fleet hợp lệ.

Viewports tối thiểu: `1440x900`, `1366x768`, `390x844`; thêm `768x1024` nếu có thời gian.

---

## 8. Auth/session QA

### TC-AUTH-01 — Wrong password

Login `student.supported@unibus.local` bằng password sai. Expected HTTP 401, UI báo tự nhiên, không stack trace/SQL, không vào dashboard.

### TC-AUTH-02 — All roles

Login lần lượt toàn bộ account. Kiểm tra đúng role label/menu, không thấy menu role khác, không blank screen/loading vô hạn.

### TC-AUTH-03 — Logout/login without F5

Login → logout → login lại ngay; nếu có Google account, thử Google login ngay sau logout. Không được cần F5, không giữ token/user data cũ.

### TC-AUTH-04 — Fast account switching

```text
student.supported → student.day → driver.demo → conductor.demo → admin.demo
```

Avatar/name/role/dashboard/notification phải đổi đúng sau data load, không stale data account trước.

### TC-AUTH-05 — OTP/cooldown

Chỉ chạy khi có inbox test:

- [ ] Gửi OTP, resend disable khoảng 60 giây.
- [ ] Double click không gửi request trùng.
- [ ] OTP sai không chuyển bước.
- [ ] OTP đúng mới hiện password form.
- [ ] Shared account phải được khôi phục password nếu bị đổi.

### TC-AUTH-06 — Registration wizard

Chỉ chạy với sacrificial email được cung cấp riêng:

- [ ] Info → OTP → complete theo từng bước.
- [ ] Domain đại học nhận diện đúng; `ute.udn.vn` map đúng trường.
- [ ] Domain/roster đủ điều kiện không bị bắt upload vô lý.
- [ ] Không còn phone input nếu UI đã loại bỏ.

---

## 9. Student full QA

### 9.1 Dashboard — `student.supported@unibus.local`

- [ ] Duy Tân và verification đúng.
- [ ] Counter render khi data sẵn sàng, không cần scroll/click trigger.
- [ ] Number animation một lần, không nhảy giá trị sai.
- [ ] Route, cost, unread count khớp backend sau settle.
- [ ] Không còn menu Student `Trạm dừng`.
- [ ] Quick actions điều hướng đúng.
- [ ] Navbar Back quay về state/list hợp lý, không luôn nhảy dashboard.

### 9.2 Tìm tuyến xe

#### TC-STU-ROUTE-01 — Lookup

- [ ] List backend tải; route 02/12 đúng code/name.
- [ ] Operating hours không thành `17:30 - 17:30`.
- [ ] Search có dấu/không dấu/code/empty/clear.
- [ ] Dropdown không làm card nở/rung khi scroll.
- [ ] Long names wrap, không khuất chữ.
- [ ] Map zoom in/out hoạt động.

#### TC-STU-ROUTE-02 — Detail/register

- [ ] Stop list/geometry đúng direction.
- [ ] Không giả first/last stop là recommendation khi thiếu suggestion.
- [ ] Có recommendation thì marker boarding xanh/alighting đỏ đúng.
- [ ] Quick register trong tab Tra cứu hoạt động.
- [ ] Không hiện `Không xác định` khi backend có tên stop.

### 9.3 Tìm đường

#### TC-STU-JOURNEY-01 — Guidance

- [ ] Origin/destination search.
- [ ] Boarding stop hợp lý gần origin; không bắt đi bộ xa khi có stop gần hơn.
- [ ] Walking dashed line chỉ nối origin → selected boarding stop.
- [ ] Route/transfer/alighting đúng.
- [ ] Chi tiết cách đi đủ chiều cao; CTA đăng ký không bị khuất trên laptop.

#### TC-STU-JOURNEY-02 — Edge cases

- [ ] Origin = destination.
- [ ] No journey.
- [ ] Route thiếu geometry.
- [ ] Stop ID/order lặp.
- [ ] Không duplicate React key warning.

### 9.4 Vé của tôi

#### TC-STU-TICKET-01 — Supported monthly

Account `student.supported@unibus.local`:

- [ ] Route 12, `Đã đăng ký`, `Đã có vé hợp lệ`.
- [ ] `Xem vé / QR`; hủy khóa khi active monthly pass liên quan.
- [ ] Không label `Hiệu lực đăng ký`.
- [ ] Vé tháng có kỳ, trạng thái, giá gốc, Trường hỗ trợ, Sinh viên trả.
- [ ] QR căn giữa, đọc được.

#### TC-STU-TICKET-02 — Unpaid route

Account `student.unpaid@unibus.local`:

- [ ] `Cần mua vé`, `Chọn vé / thanh toán`.
- [ ] Có hủy nếu backend cho phép; fail phải có lý do thật.
- [ ] Không `Đang kiểm tra vé` vô hạn.

#### TC-STU-TICKET-03 — Single ticket

Account `student.day@unibus.local`:

- [ ] Chỉ active `UNUSED`, chưa hết hạn trong ngày ở list chính.
- [ ] Điểm lên/điểm xuống, trạng thái, hạn và QR đúng.
- [ ] USED/expired không làm rác active UI.

#### TC-STU-TICKET-04 — Multiple routes/tickets

- [ ] Route card dò toàn bộ tickets, không chỉ một global active ticket.
- [ ] Chọn/xem vé khác ngoài vé chính.
- [ ] Expand card không làm card cạnh bên/button giãn lệch.
- [ ] Collapsed cards cùng hàng có chiều cao hợp lý.

### 9.5 Tracking

- [ ] Route 12 map, bus icon, stops, selected stop, boarding/alighting markers.
- [ ] Chọn xe khi nhiều xe; map không rung/reset vô lý.
- [ ] Zoom hoạt động; wheel không làm layout rung.
- [ ] `Dùng vị trí của tôi` chọn stop gần hợp lý.
- [ ] Không vẽ walking route tới stop xa khi có stop gần.
- [ ] Mock fleet được chấp nhận cho demo; không giả rằng đây là GPS production.

### 9.6 History/feedback/lost item

Account ưu tiên `student.history@unibus.local`:

- [ ] Timeline dọc, newest first, route/time/stops rõ.
- [ ] Select trip mở detail; Back quay về list.
- [ ] Button có hover/press feedback.
- [ ] Feedback `[QA]` gắn đúng trip, submit một lần, list refresh.
- [ ] Coordinator thấy/resolve đúng feedback.
- [ ] Lost item `[QA]` gắn đúng trip, cho phép nhiều item hợp lý.
- [ ] Conductor/Coordinator thấy report.
- [ ] Found/returned không lỗi DB constraint.
- [ ] Student nhận notification khi trạng thái đổi.

### 9.7 Notifications

- [ ] Bell chỉ icon, không nền/viền lạc tông.
- [ ] Click animation nhẹ, icon trở về thẳng.
- [ ] Red dot còn khi vẫn có unread; đọc hết mới mất.
- [ ] Dashboard count đồng bộ bell/API.
- [ ] Refresh giữ read state backend.

### 9.8 Chatbot, profile và trường của tôi

- [ ] Student menu coverage: `Trang chủ`, `Tìm tuyến xe`, `Vé của tôi`, `Lịch sử chuyến`, `Chatbot tra cứu`, `Thanh toán & hóa đơn`.
- [ ] Chatbot trả lời route/payment/ticket intent dựa trên dữ liệu thật; không hallucinate route, giá hoặc trạng thái vé.
- [ ] Streaming/loading/error state rõ; AI provider unavailable có fallback tự nhiên, không treo UI.
- [ ] Profile hiển thị đúng account sau switching; update/refresh không stale.
- [ ] `Trường của tôi` hiển thị Duy Tân, trạng thái `Đã xác minh` căn đúng và không lặp `Verified`.
- [ ] Student verification/OCR action không xuất hiện nếu account đã verified, trừ màn quản trị phù hợp.

### 9.9 Payment/invoice

#### TC-STU-PAY-01 — Monthly supported

- [ ] Monthly không hiển thị stop selectors.
- [ ] Giá niêm yết giữ nguyên; subsidy và final tách rõ.
- [ ] `Sinh viên trả` = original - subsidy.
- [ ] CTA/QR exact same amount.
- [ ] Xác nhận chuyển sang QR/completion state rõ.

#### TC-STU-PAY-02 — Single stops

- [ ] Boarding selector; alighting chỉ stop phía sau.
- [ ] Đổi boarding clear alighting invalid.
- [ ] Đổi stop không làm amount nhảy loạn.
- [ ] Copy nói giá theo tuyến, không gọi giá theo chặng.
- [ ] Missing/equal/reversed stops báo lỗi rõ.

#### TC-STU-PAY-03 — Business rules

- [ ] Single public active route mua được không cần approved registration.
- [ ] Không subsidy vẫn mua full price.
- [ ] Monthly vẫn yêu cầu approved registration.
- [ ] Same student/type/route/amount/stops có thể reuse unpaid order.
- [ ] Stop pair khác phải tạo order mới; không stale `legs_json`.

#### TC-STU-PAY-04 — Complete SePay

1. Tạo QR qua UI, ghi `orderId`, `DH<orderId>`, exact amount.
2. Dùng SePay testmode hoặc helper.
3. Chờ UI polling.

Expected: success popup → completion state → order Paid → ticket provisioned → invoice created → ticket/invoice hiện không cần relogin.

```powershell
$env:SEPAY_WEBHOOK_API_KEY = '<provided-separately>'
powershell -NoProfile -ExecutionPolicy Bypass -File database\CompleteDemoSePayWebhook.ps1 `
  -OrderId <ORDER_ID> `
  -Amount <EXACT_AMOUNT> `
  -BackendUrl 'https://d8xawk4fn4vfd.cloudfront.net'
```

Không ghi key thật vào report/history.

#### TC-STU-PAY-05 — Invoice/failures

- [ ] Paid invoice visible, newest first; pending/unpaid không giả là completed invoice.
- [ ] Invoice number/type/route/date/original/subsidy/final đúng.
- [ ] Wrong amount/order code không provision.
- [ ] Duplicate webhook không duplicate ticket/payment.
- [ ] Refresh/retry không tạo order vô hạn.
- [ ] Network timeout có error/retry rõ.
- [ ] Invoice UI không flicker/lag, contrast đủ đọc.

---

## 10. University Admin full QA

Account `uniadmin.demo@unibus.local`.

- [ ] Dashboard scoped Duy Tân; baseline 7 students, campus, route, policy, finance không trống.
- [ ] Không lộ private data trường khác ngoài aggregate được phép.
- [ ] Thông tin trường/cơ sở: view và validation; chỉ add/edit khi có cleanup API/UI đã xác minh.
- [ ] Domain: active list gồm `ute.udn.vn`; duplicate bị chặn; toggle refresh.
- [ ] Import roster: template, empty, missing columns, duplicate email/code, valid CSV/XLSX.
- [ ] Roster match authoritative; domain fallback không ghi đè MSSV.
- [ ] Student roster search/filter/status, không raw internal ID làm label.
- [ ] Route 12 subsidy policy visible; route 02 không tự subsidy.
- [ ] Policy mutation phản ánh Student quote chỉ khi có thể rollback/xóa chính xác; nếu không, dùng policy demo sẵn có.
- [ ] Reconciliation/transactions không double count order/payment.
- [ ] Notification có marker QA đến Student và unread count tăng; ghi ID để cleanup/reset verification.

Menu coverage:

- [ ] Tổng quan trường.
- [ ] Thống kê sử dụng.
- [ ] Thông tin trường & cơ sở.
- [ ] Domain email.
- [ ] Import danh sách SV.
- [ ] Danh sách sinh viên.
- [ ] Chính sách trợ giá.
- [ ] Đối soát tài chính.
- [ ] Lịch sử giao dịch.
- [ ] Gửi thông báo cho sinh viên.
- [ ] Hồ sơ cá nhân.

---

## 11. Dispatcher full QA

Account `dispatcher.demo@unibus.local`.

- [ ] Dashboard KPI chỉ tính hôm nay; không raw `NOT_CREATED`.
- [ ] Fleet nhiều xe; map/icon/marker đồng bộ Student tracking.
- [ ] Chọn xe không reset/rung; no-location có fallback rõ.
- [ ] Không request loop quá dày.
- [ ] Schedule đúng date/timezone; trip quá giờ không `Chưa khởi hành` sai status.
- [ ] Assignment bus/driver/conductor; chặn resource conflict.
- [ ] Save refresh; Driver/Conductor nhận assignment.
- [ ] Conductor không phải chọn arbitrary route khi có running assignment.
- [ ] Route names/code tự nhiên, không fake `UB`; route 02 hours và route 12 geometry/order hợp lý.
- [ ] `Trạm dừng` vẫn tồn tại ở Dispatcher và không phục hồi menu stop Student.
- [ ] Duy Tân route assignment: route 12 linked subsidy, route 02 full price.
- [ ] Feedback/lost item/incident hiển thị và resolve/update được.

Menu coverage:

- [ ] Tổng quan điều phối.
- [ ] Theo dõi tất cả xe.
- [ ] Lịch trình xe.
- [ ] Phân công xe chạy.
- [ ] Tuyến đường.
- [ ] Trạm dừng.
- [ ] Điều phối theo trường.
- [ ] Hỗ trợ và phản hồi.
- [ ] Gửi thông báo.
- [ ] Thông báo.
- [ ] Hồ sơ cá nhân.

---

## 12. Driver full QA

Account `driver.demo@unibus.local`.

- [ ] Dashboard chỉ hôm nay; route/time/plate/status rõ.
- [ ] Active trip chỉ `RUNNING`; không duplicate card key warning.
- [ ] Start chỉ enabled valid state; double click không start hai lần.
- [ ] Start cập nhật Dispatcher/Conductor/Student tracking nếu scenario hỗ trợ.
- [ ] End chỉ enabled khi running; sau end active trip mất và history có trip.
- [ ] Contact Dispatcher, incident submit và refresh; không fake fallback contact.

Menu coverage:

- [ ] Lịch hôm nay.
- [ ] Lịch chạy xe.
- [ ] Chuyến đang chạy.
- [ ] Tuyến được phân.
- [ ] Lịch sử chuyến.
- [ ] Liên hệ điều phối.
- [ ] Thông báo.
- [ ] Hồ sơ cá nhân.

Chỉ end trip sau khi hoàn tất các scan/cross-role test, rồi Reset.

---

## 13. Conductor full QA

Account `conductor.demo@unibus.local`.

- [ ] Dashboard chỉ assigned trips hôm nay; active chỉ `RUNNING`.
- [ ] Route 02/plate baseline đúng; không dropdown route tùy ý nếu chỉ một assignment.
- [ ] Scan default đúng running assigned trip.
- [ ] Valid ticket list/filter tải; không duplicate key.
- [ ] Camera denied có manual QR fallback.
- [ ] Monthly: valid accept; expired/wrong route reject rõ; retry không duplicate history.
- [ ] Single: UNUSED/valid accept, atomic → USED, scan lần hai reject, không duplicate history.
- [ ] Single hết ngày VN reject; business timezone `Asia/Ho_Chi_Minh`.
- [ ] Invalid QR trả clear failure, không 500.
- [ ] Incident với tripId thật submit/list refresh, không DB enum/check error.
- [ ] Lost item found/returned không DB constraint hoặc notification type error.
- [ ] Student nhận notification.
- [ ] History newest first, baseline 14 completed demo trips, không duplicate same date/route/time.

Known limitation phải ghi riêng: frontend Conductor đang giữ demo mode ngoài strict production scan window. Không được gọi đây là production pass.

Menu coverage:

- [ ] Chuyến được phân.
- [ ] Lịch sử chuyến.
- [ ] Quét QR vé.
- [ ] Kiểm tra vé tháng.
- [ ] Hỗ trợ mất đồ.
- [ ] Báo cáo sự cố.
- [ ] Liên hệ tài xế.
- [ ] Thông báo.
- [ ] Hồ sơ cá nhân.

---

## 14. System Admin full QA

Account `admin.demo@unibus.local`.

- [ ] Dashboard user/trip/revenue/university/chart/recent activity tải; không hardcode sai sau animation.
- [ ] Accounts: search/filter/detail/status; create staff form đủ role/id; không tạo operator ngoài scope.
- [ ] Universities: Duy Tân, campus/domain, route-university assignment.
- [ ] OCR verification: submitted name/code/university, comparison, preview, approve/reject/resubmit.
- [ ] Raw OCR nằm trong collapsed `Xem chi tiết OCR`.
- [ ] Finance/pricing labels/amount đúng; không double count.
- [ ] Complaint/violation/feedback context và resolve.
- [ ] Audit logs/export nếu enabled.
- [ ] Notification target validation và recipient nhận được.

Menu coverage:

- [ ] Báo cáo.
- [ ] Tài khoản & phân quyền.
- [ ] Trường đối tác.
- [ ] Xác minh sinh viên.
- [ ] Giao dịch & hóa đơn.
- [ ] Giá vé.
- [ ] Khiếu nại & vi phạm.
- [ ] Nhật ký hoạt động.
- [ ] Gửi thông báo.

---

## 15. Cross-role E2E scenarios

Chạy đúng thứ tự để không tự phá scenario.

### E2E-01 — Dispatcher → Driver → Conductor

1. Dispatcher gán bus/Driver/Conductor cho trip demo.
2. Driver và Conductor thấy cùng trip/route/plate/time.
3. Driver start nếu cần.
4. Dispatcher thấy running.
5. Conductor scan default đúng trip.

### E2E-02 — Single payment → scan

1. Student chọn public route + valid stop pair.
2. Tạo SePay order và simulate exact amount.
3. Invoice + single ticket xuất hiện.
4. Conductor scan lần một accept; lần hai reject.
5. Student active single list cập nhật USED/ẩn theo UI rule.

### E2E-03 — Monthly subsidy

1. University Admin xác nhận policy route 12.
2. Student approved registration route 12.
3. Payment original/subsidy/final đúng.
4. Complete SePay; monthly pass/card hợp lệ.
5. Conductor scan monthly đúng route.

### E2E-04 — Full-price route

Route 02 không subsidy vẫn mua được; final = original; invoice/ticket đúng.

### E2E-05 — Feedback lifecycle

Student history submit feedback có marker QA → ghi feedback ID → Dispatcher/Coordinator thấy đúng trip → resolve → Student thấy response/status nếu UI hỗ trợ.

### E2E-06 — Lost-item lifecycle

Student báo món có marker QA → ghi lost-item ID → Conductor/Coordinator thấy → found → Student notification → returned; không DB constraint error.

### E2E-07 — Notification lifecycle

University Admin/Dispatcher gửi `[QA]` → Student unread/red dot tăng → mark read → đọc hết red dot mất → dashboard count đồng bộ.

### E2E-08 — Trip completion/history

Driver end sau scan → Driver/Conductor history + Student travel history + Dispatcher status đồng bộ. Sau đó bắt buộc Reset.

---

## 16. API/security negative tests

UI/network evidence ưu tiên. Terminal chỉ để xác minh.

### Login helper

```powershell
$ApiBase = 'https://d8xawk4fn4vfd.cloudfront.net/api/v1'
$Login = Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/login" `
  -ContentType 'application/json' `
  -Body (@{
    email = 'student.supported@unibus.local'
    password = 'Password123!'
    device = 'external-qa'
  } | ConvertTo-Json)
$Token = $Login.data.accessToken
$AuthHeaders = @{ Authorization = "Bearer $Token" }
```

Không in token vào report.

| Test | Expected |
|---|---|
| Wrong password | 401 |
| Protected endpoint no token | 401/403 |
| Student calls Admin endpoint | 403 |
| Webhook missing/invalid key | 401 |
| Single missing route/stops | 400 rõ ràng |
| Boarding = alighting hoặc reversed order | 400 |
| Monthly no approved registration | 400 |
| Wrong SePay amount/code | Không provision |
| Duplicate webhook | Không duplicate ticket/payment |
| Duplicate single scan | Reject, no duplicate history |
| Invalid QR | Clear failure, no 500 |
| Cross-role unauthorized mutation | 403 |

Webhook negative sample:

```powershell
$Webhook = 'https://d8xawk4fn4vfd.cloudfront.net/api/v1/payments/sepay/webhook'
$Payload = @{ id = 999999001; transferAmount = 5000; content = 'DH0' } | ConvertTo-Json

# Expected 401
Invoke-WebRequest -Method Post -Uri $Webhook -ContentType 'application/json' -Body $Payload

# Expected 401
Invoke-WebRequest -Method Post -Uri $Webhook `
  -Headers @{ Authorization = 'Apikey invalid-qa-key' } `
  -ContentType 'application/json' -Body $Payload
```

Core Student reads after payment must return 200:

- `GET /students/me/tickets`
- `GET /students/me/tickets/single-trip`
- `GET /students/me/payments`
- `GET /students/me/route-registrations`
- `GET /notifications/me`
- `GET /notifications/me/unread-count`

Không chấp nhận frontend fallback che endpoint 500.

---

## 17. Visual/responsive/interaction QA

### Global

- [ ] Navbar không che content; Back đúng hierarchy.
- [ ] Long Vietnamese wrap; không khuất nửa chữ.
- [ ] Buttons không collide; dropdown/modal trong viewport.
- [ ] Không horizontal scroll mobile ngoài map/table có chủ đích.
- [ ] Hover/press/disabled/focus rõ; Enter/Space/Escape hoạt động.
- [ ] Double click không duplicate mutation.

Không chấp nhận raw code (`NOT_CREATED`, `UNUSED`, `APPROVED`) nếu đã có label Việt hóa; text in hoa vô cớ; copy AI dài/hiển nhiên; `Hiệu lực đăng ký`; trộn `Verified` với `Đã xác minh`.

Thuật ngữ chuẩn: Vé tháng, Vé lượt, Điểm lên dự kiến, Điểm xuống dự kiến, Trường hỗ trợ, Sinh viên trả, Ngày đăng ký, Trạng thái vé, Hiệu lực vé.

### Console/network fail conditions

- Runtime ReferenceError/hydration error.
- Duplicate React key.
- Infinite request/401 loop.
- Unhandled rejection.
- Core API 500.
- Stale account data sau logout/login.

### Performance/resilience

- [ ] Above-fold data không chờ scroll reveal.
- [ ] Counter animation không layout shift/amount jump.
- [ ] Logo above fold không LCP lazy-load sai.
- [ ] Chuyển Dashboard → Vé → Payment → Dashboard → Notifications không lag/flicker.
- [ ] Slow 3G/offline/timeout có loading, error, retry; không duplicate order.
- [ ] F5 payment QR/route detail/dashboard giữ server state đúng.
- [ ] Session expired không khóa app hoặc cần F5 lần hai.

---

## 18. Automated validation

Nếu có repository terminal:

```powershell
cd backend
mvn -B -ntp clean test
```

Expected BUILD SUCCESS, 0 failures/errors. Nếu Maven chỉ có trong IntelliJ, dùng bundled Maven và ghi path.

```powershell
npm ci --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

Expected lint/build exit 0; không claim build pass nếu không có final result/exit evidence.

PowerShell parser:

```powershell
$scripts = @(
  'database/RunDemoData.ps1',
  'database/CompleteDemoSePayWebhook.ps1'
)
foreach ($script in $scripts) {
  $tokens = $null
  $errors = $null
  [void][System.Management.Automation.Language.Parser]::ParseFile(
    (Resolve-Path $script), [ref]$tokens, [ref]$errors
  )
  if ($errors.Count -gt 0) { throw "$script parser errors: $($errors.Count)" }
}
```

Git hygiene:

```powershell
git diff --check
git status --short
git diff --name-only origin/main...HEAD
```

Không được track secret, `dbauth.txt`, `.worktrees`, `.next`, temp logs/build artifacts; không schema/Flyway change.

---

## 19. Cleanup bắt buộc

Kể cả test fail giữa chừng:

1. Hoàn tất Mutation Journal: orders, tickets, feedback, lost item, incident, notification, assignment/trip, policy/domain/roster QA.
2. Xóa/rollback thủ công mọi record mà Reset script không bao phủ, dùng ID đã ghi trong journal. Nếu không xóa được, verdict là `FAIL_CLEANUP`.
3. Chạy Reset:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Reset
```

Nhập `RESET DEMO`.

4. Chạy Audit:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Audit
```

5. Browser sanity sau Reset với:

- `student.supported@unibus.local`
- `student.unpaid@unibus.local`
- `driver.demo@unibus.local`
- `conductor.demo@unibus.local`
- `uniadmin.demo@unibus.local`

Expected: không `[QA]` data; route 12/pass supported trở lại; unpaid scenario trở lại; Driver/Conductor assignment baseline đúng.

Reset/Audit cuối fail thì verdict bắt buộc `FAIL_CLEANUP`.

---

## 20. Exit criteria

### PASS

Không P0/P1; core role flows, payment → invoice → ticket → scan, assignment, feedback/lost item, responsive, API security, Reset/Audit và available CI/build đều pass.

### PASS WITH WARNINGS

Chỉ P2/P3; Google OAuth/camera thật bị blocked do capability; known Conductor demo-mode/mock fleet được ghi rõ; cleanup vẫn phải PASS.

### FAIL

Payment success nhưng DB/UI không đồng bộ; ticket scan sai/duplicate; role chính trống; unauthorized bypass; runtime crash; cleanup/Audit fail; schema bị đổi.

---

## 21. Final report template

```markdown
# UniBus External QA Report

## Verdict
PASS | PASS WITH WARNINGS | FAIL | BLOCKED_BY_ENVIRONMENT

## Environment
- App/API URL:
- Branch/commit/deployment:
- Browser/viewports:
- Started/finished at Asia/Ho_Chi_Minh:

## Baseline
- Pre-test Audit:
- Reset required before test:

## Coverage
| Area | Passed | Failed | Blocked | Notes |
|---|---:|---:|---:|---|
| Auth/session | | | | |
| Student | | | | |
| University Admin | | | | |
| Dispatcher | | | | |
| Driver | | | | |
| Conductor | | | | |
| System Admin | | | | |
| Cross-role | | | | |
| Payment/SePay | | | | |
| API/security | | | | |
| Responsive/performance | | | | |

## Critical flows
- Payment → invoice → ticket:
- Single ticket → scan → USED:
- Assignment → Driver/Conductor:
- Feedback lifecycle:
- Lost item → notification:

## Bugs
| ID | Severity | Area | Summary | Reproduction | Evidence |
|---|---|---|---|---|---|

## Mutation journal
| Time | Account | Mutation | Entity/ID | Cleanup result |
|---|---|---|---|---|

## Known accepted limitations
- Conductor frontend demo mode outside strict production window.
- Mock/simulated fleet locations in current demo scope.

## Cleanup
- Reset:
- Post-reset Audit:
- Browser sanity:

## Automated validation
- Backend tests:
- Frontend lint/build:
- GitHub Actions:

## Recommendation
MERGE | DO NOT MERGE | MERGE AFTER P1 FIXES
```

Agent phải kết thúc bằng bốn câu rõ ràng:

1. Có thể merge/deploy demo không?
2. Backend/payment/ticket/scan có nhất quán không?
3. UI có blocker/layout vỡ/wording gây hiểu sai không?
4. Live RDS đã Reset và Audit sạch chưa?

Không dùng `có vẻ ổn`, `chắc là`, `nên hoạt động`; mọi kết luận phải dựa trên evidence đã chạy.
