# Changelog: Xóa chức năng "Trạm dừng" phía sinh viên

Ghi lại log thay đổi. Đây là thay đổi có chủ đích, không phải lỗi.

## Tóm tắt
Loại bỏ chức năng "Trạm dừng" độc lập ở phía sinh viên. Sinh viên không còn màn hình
tra cứu danh sách trạm riêng. Dữ liệu stop vẫn được giữ cho các luồng nghiệp vụ khác
(điểm lên/xuống, tìm tuyến, theo dõi xe, vé, lịch sử chuyến). Chức năng quản lý trạm
dừng phía điều phối viên (crd-stops) giữ nguyên.

## Thay đổi gì
- Xóa mục menu sinh viên `stu-stops` ("Trạm dừng") trong `frontend/src/components/bus/nav-config.ts`.
- Xóa case render `stu-stops` khỏi `StudentModule`.
- Xóa toàn bộ component `StopsScreen` của sinh viên trong
  `frontend/src/components/bus/roles/student-module.tsx` (ô tìm kiếm trạm, thống kê tổng
  trạm/tuyến/mái che, danh sách trạm cùng tuyến đi qua).
- Cập nhật CTA "Xem tất cả" trên dashboard sinh viên: trỏ sang `stu-notifications`
  thay vì màn hình trạm dừng đã xóa.

## Lý do
- Đơn giản hóa trải nghiệm phía sinh viên: không cần màn hình tra cứu trạm dừng độc lập.
- Sinh viên vẫn thao tác với điểm lên/xuống trong các luồng cần thiết (đăng ký tuyến/vé,
  tìm tuyến, tracking), nên việc bỏ màn hình riêng không làm mất chức năng cốt lõi.

## Phạm vi không đụng tới
- Không xóa API stop ở backend (`/stops`, `/routes/search`, `/routes/{id}/stops/{stopId}/eta`).
- Không thay đổi chức năng quản lý trạm dừng phía điều phối viên.
- Dữ liệu `ctx.stops` vẫn dùng cho tìm tuyến, chọn điểm lên/xuống, tracking, AI gợi ý tuyến.

## Kiểm tra "xóa chưa sạch"
- Không còn tham chiếu `stu-stops` trong `frontend/src`.
- `StopsScreen` còn lại chỉ thuộc `coordinator-module.tsx` (hợp lệ).
- Các import dùng chung (`MapPin`, `Search`, `ShieldCheck`, `PackageSearch`, `EmptyState`,
  `Section`) vẫn còn usage khác nên không trở thành import thừa.

## Lưu ý khi test
- Vai trò sinh viên: menu không còn mục "Trạm dừng".
- Dashboard sinh viên: CTA "Xem tất cả" không điều hướng tới màn hình đã xóa.
- Các luồng vẫn cần dữ liệu trạm: tìm tuyến, đăng ký tuyến/vé, chọn điểm lên/xuống,
  theo dõi xe/timeline, lịch sử chuyến (điểm lên/xuống).
- Vai trò điều phối viên: màn hình quản lý "Trạm dừng" vẫn hoạt động.
- Chạy build/lint frontend để bắt lỗi type/import tiềm ẩn.

---

# Changelog: Cập nhật chức năng "Tìm tuyến xe" phía sinh viên

Ghi lại log thay đổi sau khi đã bỏ màn hình "Trạm dừng" độc lập. Dữ liệu trạm vẫn
được dùng trong luồng tìm tuyến, nhưng sinh viên không tra cứu trạm qua màn hình riêng.

## Tóm tắt
Cập nhật màn hình `stu-find` để sinh viên tìm tuyến theo trạm/trường muốn đến.
Màn hình ban đầu hiển thị tất cả tuyến có thể đi đến các trạm/trường. Khi sinh viên
nhập tên trạm/trường, hệ thống hiện dropdown gợi ý và lọc danh sách tuyến phù hợp.

## Thay đổi gì
- Thay luồng tìm tuyến cũ chọn cả `trạm lên` và `trạm xuống` bằng ô nhập `Trạm đến`.
- Ô nhập `Trạm đến` cho phép sinh viên tự gõ tên trạm/trường.
- Khi focus hoặc nhập từ khóa, hiển thị dropdown gợi ý kiểu search map:
  - ô nhập cố định phía trên;
  - danh sách gợi ý bên dưới;
  - mỗi gợi ý có icon, tên trạm, thông tin phụ (địa chỉ/mã trạm/số tuyến);
  - click gợi ý sẽ điền tên trạm và lọc tuyến.
- Dropdown được render dạng overlay để không làm giãn hero/card tìm kiếm.
- Danh sách gợi ý giới hạn chiều cao (`max-height: 320px`) và chỉ scroll trong phần list,
  tránh scrollbar tràn khỏi bo góc.
- Card tìm kiếm giữ chiều rộng ổn định, không nở theo nội dung gợi ý dài.
- Kết quả tuyến hiển thị:
  - thời gian xuất phát;
  - thời gian đến trạm lên;
  - thời gian ước tính xuống;
  - tổng số km;
  - trạng thái chuyến (`Chưa đi` / `Đang đi`);
  - tần suất, giá vé/vé tháng nếu có dữ liệu.
- Thêm mục `Xem thêm thông tin trạm dừng` dạng dropdown trong từng card tuyến để xem
  danh sách trạm trên tuyến.

## Nguồn dữ liệu
- Ưu tiên dữ liệu từ `experienceApi.studentRouteSuggestions()` (`/students/me/route-suggestions`).
- Nếu API gợi ý chưa có dữ liệu thì fallback sang `ctx.routes` từ dashboard sinh viên.
- Danh sách trạm lấy từ `ctx.stops`.
- Trạng thái `Đang đi` / `Chưa đi` lấy từ `ctx.trips` nếu có trip gắn với tuyến.
- Các thông tin tuyến như `distanceKm`, `estimatedMinutes`, `frequencyMin`, `singleFare`,
  `monthlyFare`, `firstTrip` lấy từ dữ liệu route/suggestion hiện có.
- Giờ đến từng trạm trong màn này được frontend ước lượng từ giờ xuất phát, tổng thời gian
  tuyến và thứ tự trạm vì dữ liệu hiện có chưa có lịch đến từng trạm riêng cho màn `stu-find`.

## Phạm vi không đụng tới
- Không khôi phục màn hình `stu-stops`.
- Không thay đổi API stop ở backend.
- Không thay đổi chức năng quản lý trạm dừng phía điều phối viên.
- Không thay đổi luồng đăng ký tuyến/vé, tracking, lịch sử chuyến ngoài việc dùng lại dữ liệu trạm.

## Lưu ý khi test
- Vào vai trò sinh viên, mở `Tìm tuyến xe`.
- Khi chưa nhập gì, danh sách tuyến vẫn hiển thị.
- Focus vào ô `Trạm đến`, dropdown gợi ý phải hiện bên dưới ô nhập.
- Nhập từ khóa có dấu/không dấu đều lọc được trạm phù hợp.
- Dropdown nhiều kết quả phải scroll bên trong list, không làm hero/card cao lên và không tràn bo góc.
- Click một gợi ý phải điền tên trạm và lọc danh sách tuyến tương ứng.
- Mỗi tuyến vẫn có thể bung `Xem thêm thông tin trạm dừng`.

---

# Changelog: Fix build Next.js cho trang kết quả thanh toán

## Tóm tắt
Fix lỗi Next.js 16 khi build trang `/student/payment/result` do page dùng
`useSearchParams()` trực tiếp mà chưa nằm trong `Suspense`.

## Thay đổi gì
- Bọc nội dung trang kết quả thanh toán bằng `<Suspense>`.
- Tách phần đọc `useSearchParams()` sang component con.
- Thêm fallback loading đơn giản cho trang kết quả thanh toán.

## Lý do
- Next.js 16 yêu cầu usage `useSearchParams()` ở page prerender phải nằm trong Suspense boundary.
- Nếu không sửa, `npm run build` fail ở `/student/payment/result`.

## Kiểm tra
- `npm run lint` chạy qua, còn các warning hook dependency cũ ở module khác.
- `npm run build` chạy qua.

---

# Changelog: Tự động kết thúc chuyến mô phỏng tại điểm đích

## Tóm tắt
- Thêm tác vụ nền tự động chuyển trip `RUNNING` sang `COMPLETED` sau khi xe mô phỏng đã đến đích và chờ đủ 2 phút.
- Thời điểm đến đích được tính từ giờ khởi hành thực tế và tổng thời lượng lịch trình, bao gồm chuyến chạy qua nửa đêm.

## Thay đổi
- Bật scheduling cho backend và thêm `TripAutoCompletionService`.
- Repository chỉ hoàn tất chuyến có lịch, đang `RUNNING`, đã có `departed_at` và đã vượt thời điểm đến đích cộng grace period.
- Thêm cấu hình bật/tắt, chu kỳ quét và grace period để test không chạy scheduler ngoài ý muốn.
- Thêm test cho truy vấn hoàn tất chuyến và service tự động hoàn tất.

---

# Changelog: Popup xác nhận bắt đầu chuyến của tài xế

## Tóm tắt
- Thay popup `window.confirm` của trình duyệt bằng `AlertDialog` đồng bộ với giao diện web.

## Thay đổi
- Popup hiển thị tuyến, giờ khởi hành và biển số trước khi xác nhận.
- Khóa thao tác đóng/xác nhận trong lúc request bắt đầu chuyến đang chạy.
- Giữ nguyên API và điều kiện nghiệp vụ bắt đầu chuyến hiện có.

---

# Changelog: Đồng bộ tin nhắn đã gửi phía phụ xe

## Tóm tắt
- Tin nhắn phụ xe vừa gửi được thêm ngay vào hội thoại thay vì phải chờ lần tải dữ liệu tiếp theo.

## Thay đổi
- Merge tin nhắn optimistic với dữ liệu poll theo `messageId` để không mất hoặc hiển thị trùng tin.
- Đồng bộ người nhận điều phối viên với điều phối viên active mà danh bạ chuyến trả về.
- Giữ poll định kỳ để nhận tin nhắn mới từ tài xế và điều phối viên.

---

# Changelog: Hiển thị đúng dữ liệu vé tháng phía phụ xe

## Tóm tắt
- Màn `Vé tháng` lấy dữ liệu chi tiết từ API vé theo chuyến đang chạy thay vì danh sách rút gọn của dashboard.

## Thay đổi
- Chỉ hiển thị vé `MONTHLY` và `JOURNEY_MONTHLY` thuộc chuyến đang chạy.
- Hiển thị đúng tên/mã sinh viên, tuyến, ngày bắt đầu và ngày hết hạn từ database.
- Thêm trạng thái loading trong lúc tải danh sách vé.
- Database chỉ được đối chiếu bằng transaction read-only; không sửa dữ liệu.

## Kiểm tra dữ liệu
- Tuyến được đối chiếu có đúng 3 vé `ACTIVE`.
- Hai vé có hiệu lực `01/07/2026 - 01/09/2026`.
- Một vé có hiệu lực `01/07/2026 - 31/07/2026`.

---

# Changelog: Kiểm tra UTF-8 và cảnh báo Node.js

## Kết quả
- Toàn bộ file text được Git theo dõi và file code mới đều giải mã hợp lệ bằng UTF-8 strict.
- Không phát hiện mojibake thật trong source; hiện tượng ký tự sai khi dùng `Get-Content` là do code page PowerShell với file UTF-8 không BOM.
- Cảnh báo `DEP0205 module.register()` đến từ `@tailwindcss/node@4.3.0` khi chạy Node.js 26, không phải code dự án.
- CI chính thức dùng Node.js 22 nên không cần sửa `node_modules`; build trên Node.js 26 vẫn hoàn thành thành công dù có cảnh báo.

---

# Changelog: Luồng mua vé sinh viên theo tuyến và hành trình

## Tóm tắt
Triển khai luồng mua vé cho sinh viên dựa trên kết quả `Tìm tuyến xe` đã pull từ nhánh
DucHai. Sinh viên có thể mua vé cho một tuyến hoặc mua combo toàn bộ các tuyến trong
một hành trình nhiều chặng.

## Thay đổi gì
- Màn `Tìm tuyến xe` phân loại hành trình theo số tuyến bus thực tế:
  - 1 tuyến: hiển thị `Vé ngày tuyến này` và `Vé tháng tuyến này`.
  - từ 2 tuyến trở lên: hiển thị `Combo vé ngày` và `Combo vé tháng`.
- `Số chuyến tối đa` chỉ là giới hạn tìm đường, không tự biến vé thành combo.
  - Nếu kết quả tìm được 1 tuyến thì vẫn là vé tuyến.
  - Nếu kết quả tìm được nhiều tuyến thì là combo.
- Khi sinh viên bấm mua vé từ hành trình:
  - frontend lưu `payment context` vào `localStorage` key `unibus.studentPaymentContext.v1`;
  - context gồm `mode`, `ticketPeriod`, `routeId` hoặc `legs`, điểm đi/đến, ngày sử dụng;
  - với hành trình nhiều tuyến, `legs` chứa toàn bộ tuyến/chặng cần mua.
- Màn `Mua vé` đổi nhãn chung từ `Mua vé tháng` thành `Mua vé`.
- Màn `Mua vé` đọc payment context:
  - `single-route`: hiển thị đơn một tuyến;
  - `journey-combo`: hiển thị danh sách tuyến trong combo, giá từng tuyến, trợ giá từng tuyến, tổng tiền.
- Dropdown `Chọn tuyến cần mua vé`:
  - hiển thị tên tuyến ở dòng 1;
  - hiển thị điểm đầu tuyến -> điểm cuối tuyến ở dòng 2;
  - lọc trùng các registration cùng `routeId`;
  - tránh lỗi lặp text và tràn kích cỡ ô select.
- Route chưa có trợ giá từ trường vẫn được mua; chỉ hiển thị trợ giá `0đ`.

## Backend
- Thêm API quote SePay:
  - `POST /api/v1/students/me/payments/sepay/quote`
- Mở rộng API order SePay:
  - `POST /api/v1/students/me/payments/sepay/order`
  - nhận `mode: single-route | journey-combo`;
  - nhận `ticketPeriod: day | month`;
  - nhận `routeId` hoặc `legs`.
- Với combo, backend quote từng tuyến độc lập:
  - lấy fare theo tuyến và loại vé;
  - gọi `SubsidyService.quoteFor(...)`;
  - cộng `originalAmount`, `subsidyAmount`, `finalAmount`.
- Không dùng một `monthlyPassQuote` chung cho nhiều tuyến.
- Webhook SePay paid:
  - vé tháng một tuyến: tạo `monthly_passes`;
  - combo vé tháng: tạo monthly pass cho từng tuyến, tránh tạo trùng vé tháng active, rồi gom vào `journey_order`;
  - vé ngày: tạo `single_trip_tickets` cho từng tuyến/chặng.
- `SePayService` không còn bắt buộc phải có `route_registration APPROVED` khi order có đủ `legs`.
  - Nếu có registration thì dùng để lấy tên tuyến/trạm.
  - Nếu chưa có registration thì dùng `routeId`, `boardingStopId`, `alightingStopId` từ payment context.
- `TransportService.requireValidSelection(...)` không chặn tuyến chưa liên kết trợ giá khi đăng ký tuyến.
- `JourneyPlannerService.primaryAction(...)` không disable mua/đăng ký khi tuyến chưa có trợ giá; chỉ trả note.

## Migration
- Thêm file:
  - `backend/src/main/resources/db/migration/V16__sepay_journey_combo_orders.sql`
- Migration thêm metadata vào `tb_orders`:
  - `order_mode`
  - `ticket_period`
  - `origin_label`
  - `destination_label`
  - `legs_json`
  - `original_amount`
  - `subsidy_amount`
  - `final_amount`
- Cập nhật order cũ:
  - `ticket_type = single` -> `ticket_period = day`;
  - còn lại -> `ticket_period = month`.

## Trợ giá
- Trợ giá áp dụng theo từng tuyến, không áp dụng một lần cho cả combo.
- Tuyến có trợ giá của trường: giảm tiền tuyến đó.
- Tuyến không có trợ giá: vẫn mua được, trợ giá `0đ`.
- Tổng thanh toán combo = tổng `finalAmount` của từng tuyến.

## Ví dụ nghiệp vụ
Sinh viên ở gần một trạm gần trọ muốn đến Đại học FPT:

```text
Trạm gần trọ -> tuyến A -> trạm trung chuyển
Trạm trung chuyển -> tuyến B -> Đại học FPT
```

Nếu không có tuyến thẳng, sinh viên mua:

```text
Combo vé ngày hoặc combo vé tháng
1. Vé tuyến A
2. Vé tuyến B
```

## Lưu ý khi test mua vé
- Restart backend để code Java mới có hiệu lực.
- Chạy migration `V16__sepay_journey_combo_orders.sql`.
- Tìm hành trình 1 tuyến:
  - nút hiển thị `Vé ngày tuyến này` / `Vé tháng tuyến này`;
  - order chỉ có 1 item.
- Tìm hành trình nhiều tuyến:
  - nút hiển thị `Combo vé ngày` / `Combo vé tháng`;
  - order có đủ các tuyến trong combo.
- Tuyến chưa trợ giá vẫn tạo quote/order được, trợ giá hiển thị `0đ`.
- Nếu đã có vé tháng active cho tuyến đó trong tháng, webhook không tạo vé tháng trùng.

---

# Changelog: Lịch sử chuyến đi, phản hồi và đồ thất lạc phía sinh viên

## Tóm tắt
Gộp luồng phản hồi và báo mất đồ vào từng card trong `Lịch sử chuyến đi`.
Sinh viên thao tác từ một chuyến đã đi cụ thể thay vì chọn lại chuyến trong form.

## Thay đổi gì
- Màn `Lịch sử chuyến đi` bỏ tab riêng:
  - `Phản hồi`
  - `Mất đồ`
- Trong mỗi card chuyến đã đi có sẵn 2 action:
  - `Đánh giá`
  - `Mất đồ`
- Khi bấm `Đánh giá`:
  - lưu trip id vào `localStorage` key `unibus.supportTripId`;
  - lưu route id vào `unibus.supportRouteId` nếu có;
  - điều hướng sang màn `stu-feedback`.
- Khi bấm `Mất đồ`:
  - lưu trip id vào `localStorage` key `unibus.lostTripId`;
  - điều hướng sang màn `stu-lost`.
- Màn `Phản hồi` bỏ field:
  - `Chuyến đi cần hỗ trợ`
  - `Tuyến (tùy chọn)`
- Màn `Đồ thất lạc` bỏ field:
  - `Chuyến đi (tùy chọn)`
- Hai form lấy trip/route ngầm từ card chuyến đã đi vừa bấm.
- Thêm nút `Quay lại lịch sử` ở màn `Phản hồi` và `Đồ thất lạc`.
- Nếu chưa có lịch sử thật, frontend hiển thị 1 chuyến giả định để test UI.
- Nếu trip id bắt đầu bằng `mock-`, không gửi id giả lên backend.

## Lưu ý khi test lịch sử
- Vào `Lịch sử chuyến đi`.
- Nếu chưa có dữ liệu thật, phải thấy thông báo đang hiển thị chuyến giả định.
- Trên card chuyến có nút `Đánh giá` và `Mất đồ`.
- Bấm `Đánh giá`:
  - form không còn dropdown chọn chuyến/tuyến;
  - có nút quay lại lịch sử.
- Bấm `Mất đồ`:
  - form không còn dropdown chọn chuyến;
  - có nút quay lại lịch sử.

---

# Changelog: Fix lỗi UI/runtime sau khi cập nhật tìm tuyến và mua vé

## Tóm tắt
Sửa các lỗi phát sinh khi thao tác trên màn tìm tuyến/mua vé.

## Thay đổi gì
- Fix Next dev overlay issue tại `journey-planner-desktop.tsx` khi `journeys` có item thiếu dữ liệu:
  - thêm `safeJourneys`;
  - chỉ render item có `optionId` và `legs`;
  - key render thêm fallback index.
- Fix dropdown chọn tuyến bị lặp text:
  - không dùng `SelectValue` auto render full child text;
  - custom trigger 2 dòng;
  - item dropdown truncate đúng kích cỡ.
- Fix dropdown có nhiều registration trùng tuyến:
  - lọc unique theo `routeId`.
- Fix endpoint bị lặp kiểu `Cao đẳng Việt Hàn -> Cao đẳng Việt Hàn`:
  - fallback tách điểm đầu/cuối từ tên tuyến nếu from/to bị trùng.

## Kiểm tra
- `npm run lint` chạy qua, còn các warning hook dependency cũ ở module khác.
- `npm run build` đã chạy qua trong các lượt kiểm tra frontend trước đó.
- `git diff --check` chạy qua, chỉ có warning CRLF trên Windows.

---

# Changelog: Hoàn thiện flow tìm tuyến liên tuyến và mua vé combo phía sinh viên

## Tóm tắt
Sửa các lỗi chính trong flow sinh viên từ `Tìm đường` sang `Mua vé`, đặc biệt với hành trình nối tuyến.
Sinh viên chọn một hành trình nào thì màn mua vé chỉ xử lý đúng hành trình đó, không cho chọn lẫn các tuyến khác.

## Thay đổi gì
- Màn `Mua vé` khóa lựa chọn tuyến khi đi từ `Tìm đường`:
  - nếu có `paymentContext.legs`, không hiển thị dropdown tất cả tuyến đã đăng ký;
  - quote/order dùng đúng route hoặc combo vừa chọn từ bản đồ.
- Màn `Tìm đường` hỗ trợ hiển thị phương án nối tuyến rõ hơn:
  - tăng số kết quả hành trình từ 2 lên 4;
  - không lọc mất hành trình có trung chuyển khi đã chọn `2 tuyến` trở lên;
  - backend ưu tiên trả thêm phương án `tuyến gần vị trí hiện tại -> trạm trung chuyển -> tuyến đến đích`.
- Dedupe kết quả hành trình trùng tuyến:
  - nếu nhiều card cùng chuỗi tuyến như `16 -> 08`, chỉ giữ phương án tốt nhất;
  - tránh sinh viên thấy 2 card gần như giống nhau nhưng chỉ khác thời gian chờ.
- Combo vé tháng xử lý tuyến đã có vé:
  - nếu sinh viên đã có vé tháng active cho một route trong combo, route đó hiển thị `0đ`;
  - không tạo vé tháng trùng trong webhook;
  - vẫn tính tiền các route còn thiếu vé.
- Fix tạo QR SePay cho combo:
  - lỗi cũ: `tb_orders.route_id` null làm DB reject;
  - code dùng route đầu tiên làm route đại diện khi cần;
  - migration `V16` cho phép `tb_orders.route_id` nullable vì chi tiết combo đã nằm trong `legs_json`.

## File thay đổi chính
- `frontend/src/components/bus/roles/student-module.tsx`
- `frontend/src/components/bus/student/journey-planner-desktop.tsx`
- `frontend/src/lib/api/client.ts`
- `backend/src/main/java/com/unibus/api/transport/JourneyPlannerService.java`
- `backend/src/main/java/com/unibus/api/transport/TransportService.java`
- `backend/src/main/java/com/unibus/api/ticketing/SePayController.java`
- `backend/src/main/java/com/unibus/api/ticketing/SePayService.java`
- `backend/src/main/resources/db/migration/V16__sepay_journey_combo_orders.sql`

## Lưu ý khi test
- Restart backend sau khi pull code để class Java mới có hiệu lực.
- Chạy migration `V16` hoặc đảm bảo `tb_orders.route_id` cho phép null.
- Từ `Tìm đường`, chọn `2 tuyến`, tìm hành trình có trung chuyển.
- Bấm `Xem chi tiết` rồi mua vé:
  - màn mua vé không được hiện dropdown chọn tất cả tuyến;
  - chỉ hiển thị đúng route/combo vừa chọn.
- Nếu combo có route đã mua vé tháng, route đó phải hiện `0đ`.
- Bấm tạo QR combo không còn lỗi `tb_orders.route_id violates not-null constraint`.

---

# Changelog: Fix chọn tuyến mua vé mới và tải lại phản hồi/mất đồ phía sinh viên

## Tóm tắt
Hoàn thiện các lỗi còn lại sau flow mua vé theo tuyến/hành trình. Khi sinh viên đăng ký
tuyến mới từ màn tra cứu tuyến, màn `Mua vé` phải nhận đúng tuyến vừa đăng ký thay vì
giữ context tuyến cũ. Đồng thời danh sách phản hồi và báo mất đồ của sinh viên được tải
từ API thật để sau khi gửi có thể thấy lại trên UI.

## So với changelog mua vé trước đó, phần mới thêm
- Changelog trước đã bao gồm logic lớn:
  - tìm tuyến liên tuyến;
  - mua vé 1 tuyến/combo;
  - quote/order SePay;
  - xử lý trợ giá và vé tháng đã có;
  - fix QR combo và migration `V16`.
- Lần cập nhật này chỉ bổ sung phần sau:
  - sửa context khi đăng ký tuyến mới từ route lookup rồi chuyển sang `Mua vé`;
  - sửa trường hợp đăng ký trả `409` nhưng vẫn cần chuyển sang mua đúng tuyến đó;
  - sửa danh sách phản hồi/mất đồ để đọc API thật và reload sau khi gửi.

## Thay đổi gì
- Màn `Tìm tuyến xe` / `route lookup` thêm helper lưu payment context cho tuyến vừa đăng ký:
  - cập nhật `unibus.paymentRouteId`;
  - ghi `unibus.studentPaymentContext.v1` với `mode: single-route`;
  - ghi đầy đủ `routeId`, `boardingStopId`, `alightingStopId`, điểm đi/đến, `serviceDate`, `legs`;
  - vẫn ghi `unibus.lastRegisteredRouteContext.v1` để các luồng cũ dùng được.
- Khi đăng ký tuyến thành công:
  - lưu context tuyến mới trước;
  - reload dữ liệu sinh viên;
  - điều hướng sang `stu-payment`.
- Khi API đăng ký trả `409` do tuyến đã đăng ký:
  - vẫn cập nhật context tuyến mới;
  - điều hướng sang `stu-payment`;
  - tránh màn mua vé tiếp tục hiện tuyến đăng ký trước đó.
- `useStudentPrototypeData()` không còn hardcode:
  - `feedback: []`;
  - `lostItems: []`.
- Frontend gọi API thật:
  - `feedbackApi.mine()`;
  - `experienceApi.studentLostItems()`.
- Mapping dữ liệu:
  - phản hồi dùng `mapFeedback`;
  - báo mất đồ dùng `mapLostItem`.
- Hàm reload dữ liệu sinh viên gọi thêm:
  - `feedback.reload()`;
  - `lostItems.reload()`.

## Phạm vi cố ý không đưa vào PR này
- Không đưa phần `LiveArrival` / `live-arrivals`.
- Không đưa UI tracking từ nhánh TruongPhuc.
- Không thêm menu/card tracking mới.
- Không đưa các chỉnh sửa icon/map xe của tracking.

## File thay đổi
- `frontend/src/components/bus/student/journey-planner-desktop.tsx`
- `frontend/src/lib/prototype-data.tsx`

## Lưu ý khi test
- Vào `Tìm tuyến xe`.
- Chọn một tuyến khác tuyến đã từng đăng ký/mua trước đó.
- Bấm đăng ký tuyến.
- Sang `Mua vé` phải thấy đúng tuyến vừa chọn, không còn giữ tuyến cũ.
- Gửi phản hồi chuyến đi, quay lại danh sách phải thấy phản hồi vừa gửi.
- Gửi báo mất đồ, quay lại danh sách phải thấy báo mất đồ vừa gửi.
- `npm run lint` chạy qua, còn 3 warning cũ.
- `npm run build` chạy qua.
---

# Changelog: Xóa chức năng "Trạm dừng" phía sinh viên

Ghi lại log thay đổi. Đây là thay đổi có chủ đích, không phải lỗi.

## Tóm tắt
Loại bỏ chức năng "Trạm dừng" độc lập ở phía sinh viên. Sinh viên không còn màn hình
tra cứu danh sách trạm riêng. Dữ liệu stop vẫn được giữ cho các luồng nghiệp vụ khác
(điểm lên/xuống, tìm tuyến, theo dõi xe, vé, lịch sử chuyến). Chức năng quản lý trạm
dừng phía điều phối viên (crd-stops) giữ nguyên.

## Thay đổi gì
- Xóa mục menu sinh viên `stu-stops` ("Trạm dừng") trong `frontend/src/components/bus/nav-config.ts`.
- Xóa case render `stu-stops` khỏi `StudentModule`.
- Xóa toàn bộ component `StopsScreen` của sinh viên trong
  `frontend/src/components/bus/roles/student-module.tsx` (ô tìm kiếm trạm, thống kê tổng
  trạm/tuyến/mái che, danh sách trạm cùng tuyến đi qua).
- Cập nhật CTA "Xem tất cả" trên dashboard sinh viên: trỏ sang `stu-notifications`
  thay vì màn hình trạm dừng đã xóa.

## Lý do
- Đơn giản hóa trải nghiệm phía sinh viên: không cần màn hình tra cứu trạm dừng độc lập.
- Sinh viên vẫn thao tác với điểm lên/xuống trong các luồng cần thiết (đăng ký tuyến/vé,
  tìm tuyến, tracking), nên việc bỏ màn hình riêng không làm mất chức năng cốt lõi.

## Phạm vi không đụng tới
- Không xóa API stop ở backend (`/stops`, `/routes/search`, `/routes/{id}/stops/{stopId}/eta`).
- Không thay đổi chức năng quản lý trạm dừng phía điều phối viên.
- Dữ liệu `ctx.stops` vẫn dùng cho tìm tuyến, chọn điểm lên/xuống, tracking, AI gợi ý tuyến.

## Kiểm tra "xóa chưa sạch"
- Không còn tham chiếu `stu-stops` trong `frontend/src`.
- `StopsScreen` còn lại chỉ thuộc `coordinator-module.tsx` (hợp lệ).
- Các import dùng chung (`MapPin`, `Search`, `ShieldCheck`, `PackageSearch`, `EmptyState`,
  `Section`) vẫn còn usage khác nên không trở thành import thừa.

## Lưu ý khi test
- Vai trò sinh viên: menu không còn mục "Trạm dừng".
- Dashboard sinh viên: CTA "Xem tất cả" không điều hướng tới màn hình đã xóa.
- Các luồng vẫn cần dữ liệu trạm: tìm tuyến, đăng ký tuyến/vé, chọn điểm lên/xuống,
  theo dõi xe/timeline, lịch sử chuyến (điểm lên/xuống).
- Vai trò điều phối viên: màn hình quản lý "Trạm dừng" vẫn hoạt động.
- Chạy build/lint frontend để bắt lỗi type/import tiềm ẩn.

---

# Changelog: Đồng bộ xe giả lập với chuyến tài xế đang chạy

## Tóm tắt
Cập nhật tracking để xe giả lập chỉ xuất hiện khi có chuyến tài xế đang `RUNNING`.
Backend là nguồn dữ liệu chính cho vị trí xe, biển số, tài xế, tốc độ và trạm kế tiếp.

## Thay đổi gì
- Backend `JourneyTrackingService` không còn tự tạo xe `route-sim-*` cho tuyến không có chuyến đang chạy.
- Tracking theo tuyến chỉ trả về xe gắn với `tripId` của chuyến tài xế đang chạy.
- Tracking theo hành trình chỉ thêm xe khi route trong leg có trip đang `RUNNING`.
- Xóa fallback tạo nhiều xe giả lập companion theo tuyến.
- Driver `Lộ trình chuyến` chỉ hiển thị dropdown các chuyến đang `RUNNING`.
- Student `Theo dõi xe` chỉ hiển thị vehicle có `tripId`, tránh hiện xe mô phỏng cũ nếu API/cache còn dữ liệu cũ.
- Sửa mojibake nhãn `Tài xế` trong card thông tin xe của student tracking.

## Lý do
- Tránh việc student vẫn thấy xe giả lập không gắn tài xế.
- Đảm bảo driver và student cùng nhìn một xe theo chuyến tài xế đang chạy.
- Dropdown lộ trình của tài xế không bị lẫn chuyến chưa bắt đầu.

## Lưu ý khi test
- Restart backend sau khi pull code mới.
- Khi chưa có trip `RUNNING`, student tracking không hiển thị xe giả lập.
- Khi tài xế bấm `Bắt đầu chuyến`, student và driver phải thấy cùng xe/biển số/tài xế.
- Driver `Lộ trình chuyến` chỉ có các chuyến đang chạy trong dropdown.

## Kiểm tra đã chạy
- `mvn -q -DskipTests compile`
- `npx eslint src/components/bus/roles/student-module.tsx src/components/bus/roles/driver-module.tsx --quiet`
- `npx tsc --noEmit`

---

# Changelog: Dieu chinh quet ve phu xe cho moi truong demo

## Tom tat
Cap nhat luong quet ve cua phu xe de phu hop demo: khi tai xe bat dau chuyen va phu xe
co chuyen hop le duoc phan cong, phu xe co the quet ve ngay. Luong khong con bi khoa
boi lech gio chay, thieu gio khoi hanh trong du lieu seed, hoac cua so 30 phut truoc / 3 gio sau.

## Thay doi gi
- Frontend phu xe hien thi trang thai quet mem hon: `Dang trong phien quet` va gio chay theo lich.
- Them ly do cu the khi chuyen chua the quet: thieu ma chuyen, thieu ma tuyen, thieu ten tuyen,
  chuyen da hoan thanh, da huy hoac chua duoc tao.
- Backend chi chan quet voi chuyen o trang thai cuoi (`COMPLETED`, `CANCELLED`, `NOT_CREATED`).
- Giu debounce chong quet trung QR lien tuc trong vai giay.
- Giu lich su quet gan day de phu xe xem lai ve vua quet, trang thai va ly do fail.
- Giu bo loc nhanh danh sach ve: tat ca, ve luot, ve thang, da quet, chua quet.
- Khi ve sai tuyen, backend tra them tuyen dung cua ve de phu xe giai thich ro cho hanh khach.

## Ly do
- Demo thuong dung du lieu seed, gio he thong va lich chay co the khong khop tuyet doi.
- Neu van khoa theo cua so gio production, nut quet de bi xam du tai xe da bat dau chuyen.
- Muc tieu demo la the hien quy trinh nghiep vu day du: tai xe bat dau chuyen -> phu xe quet ve ->
  xem ket qua va lich su quet, thay vi bi chan boi dieu kien thoi gian ky thuat.
- Van giu chan cac chuyen da hoan thanh/huy/chua tao de tranh quet nham chuyen khong con hop le.

## Luu y production
- Logic hien tai co chu thich `ponytail` tai frontend/backend.
- Khi len production nen khoi phuc kiem tra cua so thoi gian chat hon de giam gian lan ve.

## Kiem tra
- Phu xe co chuyen hop le: nut quet ve bat.
- Chuyen thieu `tripId`, `routeId` hoac `routeName`: UI hien ly do cu the.
- Chuyen `COMPLETED`, `CANCELLED`, `NOT_CREATED`: backend tu choi quet.
- Khong con text mojibake/dau hoi trong cac chuoi vua sua.

---

# Changelog: Hop nhat luong van hanh tai xe

## Tom tat
Sua driver flow theo trip thuc te: chuyen chi RUNNING sau khi tai xe bam bat dau, tracking bam theo tripId,
dong ho tinh tu departedAt, map nam trong Chuyen hien tai va lich su khong tai stops khong can thiet.

## Backend
- startTrip chi chap nhan NOT_STARTED, trong khoang 30 phut truoc den 60 phut sau gio lich.
- Chan tai xe bat dau chuyen moi neu dang co chuyen RUNNING.
- endTrip chi chap nhan RUNNING; khong con ket thuc NOT_STARTED/COMPLETED.
- Them tracking endpoint theo tripId va xac minh chuyen thuoc tai xe.
- History mapper khong goi findTripStopsBySchedule cho tung dong, loai N+1 query.

## Frontend driver
- Dong ho tinh tu departedAt, khong reset khi component remount.
- Khong fallback vehicles[0]; khong co xe dung trip thi hien dau gach ngang.
- Chuyen hien tai co map, xe dung trip, quick stats va 5 tram gan nhat.
- Loai chuyen RUNNING khoi danh sach phan cong ben duoi.
- Bo timeline ngang dai tren dashboard/chuyen hien tai.
- Bo menu Tuyen duoc phan, Thong bao, Ho so ca nhan; notification/profile van truy cap tu top bar.
- Rut gon lich su con ngay/tuyen/gio bat dau/gio ket thuc/tong thoi gian/trang thai.

## Demo data
- Khong seed san trip RUNNING.
- Chuyen demo gan nhat duoc dat 10 phut sau thoi diem reset de co the bam bat dau khi demo.
- SQL reset co dinh timezone Asia/Ho_Chi_Minh.

## Kiem tra
- Backend full tests.
- Frontend eslint driver/nav/client.
- Frontend tsc --noEmit.

---

# Changelog: Sua lich khoi hanh trip baseline tai xe

## Tom tat
- Gan cac trip `DEMO_DATA:BASELINE` co `schedule_id = NULL` vao `bus_schedules` theo slot gio demo.
- Slot 1/2/3/4 tuong ung 06:30/09:00/14:00/17:30.
- Man Chuyen hien tai uu tien chuyen co the bat dau, sau do den chuyen sap toi; khong uu tien chuyen da qua gio.
- Nhan trang thai phan anh dung dieu kien: thieu lich, chua den gio, san sang hoac da qua gio.

## Kiem tra
- Trip 7211 da co schedule 763 va gio 17:30.
- UI hien `CO THE BAT DAU LUC 17:30`; nut khoa dung vi chua vao cua so 30 phut.
- ESLint va TypeScript chay qua.

---

# Changelog: Loc chuyen tai xe qua gio va don lich su demo

## Tom tat
- Driver overview bo cac trip/schedule chua chay da qua 60 phut sau gio khoi hanh.
- Schedule template bi lo trong ngay se chuyen sang lan chay tuan tiep theo thay vi hien tren dashboard.
- Driver dashboard chi dem cac trip hom nay con lien quan: running, completed/cancelled, thieu gio hoac chua qua cua so bat dau.
- Chuan hoa trip demo 7141 ve NOT_STARTED va xoa ended_at sai.
- Chuan hoa trip 2875 ve thoi luong 90 phut.

## Kiem tra DB
- Khong con trip COMPLETED thieu departed_at trong hai dong muc tieu.
- Khong con trip tai xe demo dai hon 6 gio.
- Chuyen 06:30/07:30/09:00 qua gio khong con nam trong dashboard/overview sap toi.

---

# Changelog: Lam gon man chuyen hien tai cua tai xe

## Thay doi
- Tieu de hien `Chuyen sap toi` khi chua bat dau, `Chuyen dang chay` khi trip da RUNNING.
- Chuyen dang hien trong card chinh bi loai khoi danh sach phan cong ben duoi.
- Truoc khi bat dau, nut phu mo `Lien he dieu phoi`.
- Nut phu luon mo `Lien he dieu phoi`; tracking da nam truc tiep trong man chuyen hien tai.

---

# Changelog: Đồng bộ lại UI vận hành tài xế

## Tóm tắt
- Đưa các màn vận hành tài xế về cùng ngôn ngữ giao diện list/card của hệ thống.
- Giữ nguyên nghiệp vụ chuyến, tracking, bản đồ, timeline và dữ liệu hiện có.

## Thay đổi
- `Chuyến hiện tại`: dùng card hệ thống, status pill, typography và nút dạng pill chuẩn.
- Quick stats, bản đồ và danh sách trạm dùng surface token chung, giảm màu hard-code và trang trí dư thừa.
- `Danh sách chuyến được phân công`: khôi phục timeline ngang UX gốc; card dạng list giống `Lịch trình`.
- Thông tin phụ xe, điện thoại và số trạm chuyển về grid gọn, responsive 2/3 cột.
- `Lịch sử`: chuyển card lớn có icon trang trí thành list card gọn, giữ đầy đủ giờ bắt đầu, kết thúc và tổng thời gian.
- Giữ nguyên UI `Liên hệ điều phối` vì đây là màn nghiệp vụ riêng đã được thiết kế trước đó.

## Kiểm tra
- Backend: `mvn -B -ntp clean test` — 73 tests đạt.
- Frontend: `npm ci`, `npm run lint`, `npm run build` đạt.
- File thay đổi và `AGENTS.md` hợp lệ UTF-8, không có mojibake hoặc dấu `?` bất thường.
- `git diff --check` đạt.

---

# Changelog: Can bang card chuyen dang chay tren dashboard tai xe

## Thay doi
- Khoi phuc padding responsive cho card chuyen dang chay trong `Lich hom nay`.
- Giu nguyen mau lime, badge, CTA va bo cuc hien tai; chi sua spacing bi sat vien.

---

# Changelog: Hien thi chuyen qua gio trong lich tai xe

## Thay doi
- Chuyen chua bat dau qua 60 phut sau gio lich hien trang thai `Da qua gio chay`.
- Card qua gio dung tone xam va duoc xep xuong cuoi danh sach lich trinh.
- Chi thay doi hien thi frontend; khong sua status trong DB.

---

# Changelog: Khoi phuc visual pattern cu cua UI tai xe

## Thay doi
- Xay lai `Lich chay xe` bang truc tiep visual structure cua `CoordinatorScheduleScreen`.
- Moi chuyen la mot row card phang: ten tuyen/gio, status pill, tai xe, phu xe va bien so.
- Khong dung grid, timeline, icon xe, metadata chip hoac panel mo rong.
- `Chuyen hien tai` dung tracking surface trang nhu student: thong tin chuyen, map, quick stats va action bar tach ro.
- `Lich su` dung row record phang nhu dispatcher: route/status va ba cot bat dau, ket thuc, thoi luong.
- Van giu logic moi: chuyen qua gio mau xam/xep cuoi, tracking theo trip va fallback dau gach ngang.

---

# Changelog: Đồng bộ giả lập xe theo chuyến đang chạy

## Tóm tắt
- Thêm `VehicleSimulationService` làm engine mô phỏng duy nhất cho student, dispatcher và driver.
- Xe mô phỏng chỉ tồn tại khi trip có trạng thái `RUNNING`.
- Vị trí, tốc độ, trạm kế và ETA được tính deterministic từ `tripId`, `departedAt` và lộ trình.

## Thay đổi
- Driver tracking lấy snapshot theo đúng `tripId`, không còn lấy xe mới nhất cùng tuyến.
- Student route/journey tracking bỏ ưu tiên vị trí GPS cũ; dùng cùng engine của driver.
- Dispatcher thêm endpoint tracking theo trip và poll mỗi 2 giây; bỏ fallback dựng xe trên polyline ở frontend.
- Xe đến cuối tuyến đứng tại đích với tốc độ 0, không chạy vòng lại.
- Chuẩn hóa chuyến chạy qua nửa đêm: nếu giờ kết thúc nhỏ hơn giờ bắt đầu thì cộng sang ngày kế tiếp.
- Loại các trip RUNNING của tài khoản driver bị khóa (fleet simulator cũ) khỏi student/dispatcher tracking.
- Dispatcher fleet vẫn giữ trip RUNNING từ ngày trước nếu chuyến chưa kết thúc.
- Hướng mô phỏng luôn lấy theo trip/driver; boarding/alighting của student không được đảo chiều xe.
- Fleet dashboard dispatcher dùng cùng snapshot mô phỏng nên tốc độ, tọa độ và marker không còn lấy GPS rỗng.
- Thêm test xác nhận cùng trip/thời điểm cho cùng snapshot và xe dừng ở đích.

---

# Changelog: Resolve conflict PR 63 với main

## Quyết định hợp nhất
- Giữ `VehicleSimulationService` và tracking đồng bộ theo `tripId` của nhánh `TruongPhuc`.
- Giữ UI driver, logic phụ xe và cảnh báo quét vé; nhận thêm nhãn trạng thái vé và ưu tiên trip `RUNNING` từ main.
- Nhận lifecycle tài xế của main: timezone nghiệp vụ, row lock khi bắt đầu, kiểm tra trạng thái start/end và endpoint tracking dùng chung.
- Lấy nguyên bản main cho `database/ResetDemoScenario.sql` và `database/SeedDemoDataUntilAugust.sql`.
- Xóa test lifecycle cũ trùng phạm vi; dùng bộ `DriverOperationsServiceTests` đầy đủ hơn từ main.

## Kiểm tra
- Không còn conflict marker.
- Backend `mvn -B -ntp clean test`: 81 tests đạt.
- Frontend lint và build đạt; còn 5 hook warning cũ ở student module.
- UTF-8/mojibake và `git diff --check` đạt.
