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
