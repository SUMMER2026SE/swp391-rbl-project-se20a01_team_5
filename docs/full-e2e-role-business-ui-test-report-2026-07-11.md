# Báo cáo kiểm thử E2E UniBus: nghiệp vụ, role, dữ liệu, thanh toán và UI

Ngày kiểm thử: 10–11/07/2026
Workspace: `unibus-api`, nhánh `DucHai`
Baseline GitHub đối chiếu: `origin/DucHai` tại commit `3ede9dfdb68b19478e1b554fbabbdb4f8c2ea38b`
Tài liệu thay đổi được review: `docs/coordinator-flow-fleet-tracking-hardening-log.md`

## 1. Kết luận điều hành

**Kết luận: chưa nên merge/deploy bản hardening hiện tại.**

Hướng tiếp cận mới **thông minh hơn code cũ trên GitHub về mặt kiến trúc**: scan vé bám trạng thái `RUNNING`, khóa row để giảm duplicate trip, bỏ đội xe giả riêng ở Coordinator, và cho Student/Coordinator đọc chung `trips + vehicle_locations`. Đây là bước tiến đúng.

Tuy nhiên, chất lượng triển khai chưa đạt mức release-ready vì còn một lỗ hổng thanh toán nghiêm trọng, reset script không chạy được nguyên bản trên RDS thật, một số màn Coordinator bị mất chức năng, trạng thái/dữ liệu giữa dashboard và màn chi tiết mâu thuẫn, cùng nhiều lỗi nghiệp vụ ở Driver, Conductor, University Admin và Admin.

Đánh giá ngắn gọn Agent trước: **có tư duy hệ thống tốt, nhưng kiểm thử đối kháng và kiểm tra tích hợp với RDS thật chưa đủ sâu**. Báo cáo cũ ghi “chưa thao tác live RDS” nên không phát hiện hai lỗi reset script mà lần kiểm thử này đã tái hiện trực tiếp.

## 2. Phạm vi đã kiểm thử

Đã đi qua toàn bộ menu nhìn thấy và các luồng chính của 6 nhóm role:

| Role | Phạm vi chính | Kết quả tổng quát |
|---|---|---|
| Student | dashboard, tìm tuyến, đăng ký, tracking, QR/vé, thanh toán, lịch sử, đánh giá, đồ thất lạc, thông báo, hồ sơ | Chạy được phần lớn, nhưng payment/tracking/scoping còn lỗi nghiêm trọng |
| Conductor | dashboard, chọn chuyến, nhập mã vé, vé tháng/vé lượt, duplicate/expired/wrong-route, sự cố, chat, thông báo, hồ sơ | Rule `RUNNING` hoạt động; UI/dữ liệu chuyến và vé tháng còn sai |
| Driver | dashboard, bắt đầu/kết thúc chuyến, lịch trình, bản đồ, lịch sử, GPS, SOS/chat, thông báo, hồ sơ | GPS end-to-end chạy; nhiều mâu thuẫn thời gian/trạng thái và màn dữ liệu rỗng |
| Coordinator | dashboard, live fleet, lịch trình, trạm, phân công, tuyến, trường, hỗ trợ/SOS, gửi thông báo, hồ sơ | Live GPS chạy; hai màn nghiệp vụ chính không render đúng |
| University Admin | dashboard, cơ sở, domain, import, sinh viên, trợ giá, thống kê, thông báo, đối soát, hồ sơ | Dữ liệu tài chính có thật nhưng nhiều KPI/màn chi tiết mâu thuẫn |
| System Admin | dashboard, trường, admin trường, gán tuyến, user, khiếu nại, xác minh, vi phạm, audit, giá vé, giao dịch, thông báo, hồ sơ | Audit/giá vé/giao dịch có dữ liệu; nhiều API quản lý trả rỗng sai |

Các mutation test có chủ đích gồm: bắt đầu/kết thúc chuyến, gửi GPS, scan vé, tạo payment/order và webhook demo, gửi chat/SOS/thông báo, cập nhật hồ sơ, đổi giờ schedule để kiểm tra vé quá giờ. Không duyệt/từ chối hồ sơ thật và không upload file import thật.

Thanh toán đã được test bằng order SePay demo và webhook mô phỏng; không quét tiền thật từ tài khoản ngân hàng.

## 3. So với code cũ trên GitHub

| Chủ đề | Code cũ trên `origin/DucHai` | Code mới đang ở working tree | Đánh giá |
|---|---|---|---|
| Điều kiện scan | Frontend dùng cửa sổ giờ, backend có thể không đồng nhất | Cả frontend/backend khóa theo trip `RUNNING` | Tốt hơn rõ rệt |
| Duplicate trip | `check rồi insert`, có race | `FOR UPDATE` schedule rồi `NOT EXISTS` | Hướng đúng; test hiện chỉ gọi tuần tự, chưa phải test concurrency thật |
| Nguồn xe Coordinator | Frontend tự dựng `MOCK-*` và tự chạy xe | Chỉ lấy live fleet backend | Tốt hơn |
| Nguồn xe Student route tracking | Tự thêm `route-sim-*` | Lấy toàn bộ trip `RUNNING` có GPS mới | Tốt hơn |
| Simulator | Nhiều nguồn giả không đồng bộ | Một backend simulator ghi `vehicle_locations` | Tốt hơn về demo/integration |
| Vận hành production | Không có simulator thống nhất | `application-prod.properties` mặc định bật simulator | Rủi ro cao, cần default `false` |
| Reset demo | Script cũ chưa có fleet mới | Script mới dựng fleet và kịch bản đầy đủ | Ý tưởng tốt nhưng hiện không chạy nguyên bản trên RDS |

Lưu ý: `JourneyTrackingService.vehicleForLeg()` vẫn tạo xe `sim-*` cho journey planner. Việc hardening đã bỏ fake vehicle ở route snapshot, nhưng chưa loại toàn bộ mô phỏng khỏi mọi endpoint tracking.

## 4. Phát hiện theo mức độ ưu tiên

### P0 — Critical

#### SEC-01 — Webhook SePay không xác thực

- `SecurityConfig` permit-all `/api/v1/payments/sepay/webhook` và `/sepay_webhook.php`.
- `SePayController.handleWebhook()` nhận body rồi gọi `processWebhook()`; không kiểm tra header/API key/signature.
- `app.sepay.webhook-api-key` có cấu hình nhưng không được controller dùng.
- Với order ID/nội dung chuyển khoản phù hợp, người ngoài có thể giả webhook và làm order chuyển sang `Paid`, provision vé/pass và invoice.

Khuyến nghị: bắt buộc API key/signature, allowlist IP nếu SePay hỗ trợ, chống replay, log request ID, và test negative/duplicate/concurrent webhook.

### P1 — High

#### PAY-01 — Giá báo và số tiền QR không đồng nhất

Tài khoản `student.unpaid`: màn quote báo không trợ giá và tổng `100.000đ`, nhưng QR yêu cầu `75.000đ`; sau payment pass lại hiển thị `100.000 → 75.000` với trợ giá `25.000đ`. Đây là sai lệch trực tiếp trước khi người dùng trả tiền.

#### OPS-01 — Chuyến đã hoàn tất vẫn nhận GPS

POST location cho trip `COMPLETED` được chấp nhận và ghi `vehicle_locations`. `OperationsService.updateLocation()` chỉ kiểm tra chủ sở hữu trip, không kiểm tra status `RUNNING`.

#### OPS-02 — Driver có thể bắt đầu chuyến sai giờ

Trip lịch `07:30` được bắt đầu lúc khoảng `23:09` mà không có cảnh báo/confirm/audit lý do. Nếu đây là chủ đích vận hành linh hoạt, UI vẫn cần xác nhận “bắt đầu ngoài khung giờ”.

#### COO-01 — Màn “Lịch trình xe” và “Trạm dừng” Coordinator bị mất nội dung

Click menu chỉ đổi breadcrumb; main vẫn là dashboard. “Trạm dừng” Coordinator được AGENTS.md xác định là chức năng phải giữ nguyên, nên đây là regression.

#### COO-02 — Không có GPS nhưng UI vẫn bịa tốc độ 28 km/h

Coordinator hiển thị “Chưa có dữ liệu GPS” nhưng đồng thời `28 km/h`; code dùng `v.speedKmh || 28`.

#### CON-01 — Màn vé tháng không lọc theo chuyến/tuyến đang chạy

Đang chọn route `02` nhưng danh sách hiển thị 4 pass route `12`; tên đều là “Sinh viên”, ngày hết hạn `—`. Nội dung không đủ tin cậy để phụ xe đối chiếu.

#### ADM-01 — Các màn quản lý Admin trả rỗng trái với dashboard/RDS

Dashboard có khoảng 34–36 user, 10–11 trường và dữ liệu route; các màn “Trường đại học”, “Admin trường”, “Gán tuyến”, “Tài khoản người dùng” lại trả 0. Audit log, giá vé và giao dịch vẫn có dữ liệu, nên đây không phải database trống.

#### UNI-01 — KPI University Admin mâu thuẫn ngay cùng dashboard

Top KPI hiển thị 0 sinh viên giao dịch, 0 vé tháng, 0 tuyến, 0 trợ giá; cùng trang lại có 7 hồ sơ, chart 4 pass, 2 policy, 14 giao dịch.

#### DB-01 — Reset script dùng status user không tồn tại trên RDS

`fleet.simulator@unibus.local` được insert với `users.status='INACTIVE'`, trong khi constraint RDS chỉ cho `ACTIVE|LOCKED`. Reset rollback ngay ở bước đầu.

#### DB-02 — Reset script vướng FK vé lượt đã scan

Script chỉ clear `used_on_trip_id` cho student code `SV-DEMO-%`. Một vé không có prefix demo nhưng đã dùng trên demo trip khiến `DELETE FROM trips` vi phạm `fk_single_tickets_used_trip`.

#### DB-03 — Reset sinh notification trùng mỗi lần chạy

INSERT dùng title `Dữ liệu demo sẵn sàng`, nhưng `NOT EXISTS` lại kiểm tra title `Demo đã sẵn sàng`. Trước cleanup, mỗi demo recipient có 3–4 notification giống nhau.

#### AUTH-01 — Full backend suite vẫn đỏ

`mvn test`: 69 test, 10 failure, 1 error. Chủ yếu Auth do test H2 thiếu bảng `university_domains` và kỳ vọng OTP attempt không khớp. Không thể coi branch là CI-green.

#### SIM-01 — Simulator mặc định bật ở production

`application-prod.properties`: `app.demo-fleet.enabled=${DEMO_FLEET_ENABLED:true}`. Quên env là production tự sinh GPS demo. Nên default `false` và chỉ bật rõ ràng trong demo/staging.

#### SIM-02 — Publish realtime xảy ra trước persist; delete/insert không transaction rõ ràng

Simulator publish WebSocket trước khi persist. Persist lại tách `DELETE` và `INSERT`; nếu insert fail, REST và realtime có thể lệch hoặc mất vị trí hiện tại.

### P2 — Medium

#### STU-01 — Tìm tuyến có vẻ lộ toàn bộ 19 route công khai cho student DTU

Không thấy scoping theo trường/policy như kỳ vọng nghiệp vụ. Cần chốt product rule: “route công khai toàn thành phố” hay “route được trường hỗ trợ”.

#### STU-02 — Tracking tự tạo ETA khi không có chuyến đang chạy

UI đồng thời báo “Chưa có chuyến đang chạy” nhưng vẫn hiện ETA 0/4/8 phút theo thời gian hiện tại, kể cả sau giờ dịch vụ.

#### STU-03 — CTA đăng ký vẫn xuất hiện với tuyến đã đăng ký

Route 12 vẫn có “Đăng ký tuyến” cho tài khoản đã có registration.

#### AUTH-UX-01 — Flash dữ liệu tài khoản cũ sau đổi user

Sau logout/login student khác, tên và KPI của student trước hiện 2–3 giây trước khi data mới thay thế. Cần clear store hoặc loading boundary ngay khi auth identity đổi.

#### CON-02 — Scan lại vé tháng trả success như scan mới

Backend idempotent và không tạo history mới là tốt, nhưng UI vẫn báo “Đã ghi nhận” thay vì “Vé đã được quét trước đó”.

#### CON-03 — Vé trạng thái `USED` vẫn nằm trong mục “Vé hợp lệ trên chuyến”

Tên section gây hiểu sai; cần lọc hoặc đổi nhãn.

#### CON-04 — “Xem danh sách chuyến” lại đưa sang màn scan

CTA không đúng kỳ vọng điều hướng.

#### DRV-01 — Timer chuyến reset mỗi lần mount trang

Timer hiển thị thời gian từ lúc mở màn, không phải từ `departed_at`.

#### DRV-02 — “Xem lộ trình” của trip active trả màn rỗng

Combobox hiện `— 10/7`, main báo không có dữ liệu dù dashboard có chuyến active.

#### DRV-03 — Bộ lọc ngày lịch trình/phân công không làm đổi dữ liệu

Đổi sang 11/07 nhưng danh sách/mô tả vẫn là 10/07. Coordinator assignment có hiện tượng tương tự.

#### DRV-04 — Lịch sử driver thiếu tên tuyến

Chỉ còn thời gian; không đủ để kiểm tra lịch sử vận hành.

#### UNI-02 — Chính sách phần trăm hiển thị như tiền

`50%` và `25%` hiển thị thành `50 ₫`, `25 ₫`.

#### UNI-03 — “Thống kê sử dụng” rỗng nhưng dashboard có pass/giao dịch

Reconciliation cũng báo “Chưa có dữ liệu” trong khi bảng bên dưới có 14 giao dịch.

#### UNI-04 — Search không xử lý dấu tiếng Việt

Nhập `bao` không match `Bảo`.

#### NOTIF-01 — Gửi notification thành công nhưng danh sách “Gần đây (0)” không refresh

Xảy ra ở Coordinator/University Admin; có trường hợp không có success toast.

#### UI-01 — Mobile không tràn ngang nhưng touch target nhỏ

Ở viewport 375×812: nút back và notification 40×40 px, nút “Sửa” cao 36 px; dưới chuẩn 44 px.

#### UI-02 — Màn route/schedule quá dài và khó dùng

Driver schedule lặp toàn bộ stop cho nhiều trip; Coordinator route render raw BUSMAP metadata/outBound/inBound thành chuỗi dài. Cần table/card có summary, detail drawer và pagination/virtualization.

#### DATA-01 — Dữ liệu demo có nội dung không chuyên nghiệp

Từng thấy chat/lost-item có câu chửi và từ ngữ xúc phạm, notification rác như `okk`, `alo`, `asd`. Cần scrub trước demo/đánh giá.

### P3 — Low

- Nút gửi chat icon-only không có accessible name.
- Một số filter/date input và action edit/delete không có label rõ cho screen reader.
- `Chức danh: Lê Thu Hà` có vẻ map nhầm họ tên sang chức danh.
- Toast vị trí chỉ báo chung “Không thể lấy vị trí”, không phân biệt denied/timeout/unavailable.
- Header mobile cắt title “Điều chỉnh…” quá sớm.

## 5. Các case đã pass đáng ghi nhận

- Student menu không còn `stu-stops`; Coordinator vẫn có menu trạm dù content hiện bị regression.
- Route search có dropdown gợi ý và card tuyến; build Next.js payment result đã pass.
- Conductor: chỉ trip `RUNNING` mới scan; invalid code, wrong route, expired ticket và re-scan vé lượt đều báo lỗi rõ.
- Vé lượt valid scan thành công, đổi `USED`, tạo travel history; duplicate monthly không tạo history trùng.
- Driver start/end trip hoạt động; DB constraint chặn latitude/longitude, speed và occupancy sai.
- GPS hợp lệ đi từ Driver API → RDS → Coordinator polling/map; hiển thị 32.5 km/h, occupancy 18 và trạm gần nhất.
- Coordinator xử lý SOS với note thành công.
- Admin audit log, bảng 50 giá vé và lịch sử giao dịch tải được; sửa giá mở modal đúng.
- Validation form rỗng cho tạo/gửi notification hoạt động.
- Responsive 375 px không có horizontal overflow.

## 6. Kiểm chứng tự động mới nhất

| Lệnh | Kết quả |
|---|---|
| `npm run build` trong `frontend` | PASS, 11 static pages generated |
| `npm run lint` trong `frontend` | 0 error, 5 warning hook dependency cũ |
| Scoped Maven operations/tracking | 8/8 PASS, BUILD SUCCESS |
| Full `mvn test` | FAIL: 69 total, 10 failure, 1 error |
| `git diff --check` | Không có whitespace error; chỉ cảnh báo LF→CRLF |
| `RunDemoData.ps1 -Mode Audit` | Tất cả assertion PASS sau phục hồi |

## 7. Trạng thái RDS sau kiểm thử

RDS đã được đưa về kịch bản demo:

- 14 demo trip hôm nay trên route `01, 02, 03, 05, 06, 07, 12, 16`.
- Demo account/profile/ticket/order/travel history audit đều PASS.
- Order `SV-DEMO-UNPAID` trở lại `Unpaid`.
- Vé test ngoài demo prefix trở lại `UNUSED`, không còn `used_on_trip_id`, đã hết hạn.
- Không còn notification/message/incident chứa marker `Kiểm thử E2E`.
- Notification demo trùng đã được dedupe còn tối đa 1/recipient.
- Trip thật #2875 được khôi phục `RUNNING`, `ended_at=NULL`; GPS test đã xóa.

Do reset script nguyên bản lỗi, lần phục hồi dùng bản SQL trong bộ nhớ với hai điều chỉnh tương thích: simulator user dùng `LOCKED`, và clear toàn bộ ticket FK trỏ vào demo trip trước khi xóa trip. **Không sửa file source bằng workaround này.**

## 8. Thứ tự sửa đề xuất

1. Khóa webhook SePay bằng signature/API key + replay protection.
2. Fix reset/seed RDS (`LOCKED`, FK ticket, notification title) và thêm integration test trên PostgreSQL schema thật.
3. Fix giá quote/QR/provision dùng một nguồn số tiền duy nhất.
4. Bắt GPS chỉ cho trip `RUNNING`; thêm confirm/audit cho start ngoài giờ.
5. Khôi phục content màn Coordinator “Lịch trình xe” và “Trạm dừng”.
6. Đồng bộ API KPI/list ở Admin và University Admin.
7. Fix các lỗi Conductor/Driver về route filtering, timer, date filter và detail data.
8. Tắt simulator mặc định ở prod, persist transaction trước rồi publish.
9. Làm full test suite xanh; thêm test concurrency thật cho `ensureTrip()`.
10. Dọn demo data và hoàn thiện accessibility/mobile touch targets.

## 9. Trạng thái Git và thao tác source

- `HEAD` bằng `origin/DucHai` tại `3ede9df...`; toàn bộ hardening vẫn là working-tree changes chưa commit.
- Không stage, commit, push, tạo branch hoặc thao tác GitHub.
- Trong phiên tester không sửa application source; chỉ tạo file báo cáo này.
- `.zcode/` vẫn untracked và không đụng tới.
