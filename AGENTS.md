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

# Changelog: ??ng b? xe gi? l?p v?i chuy?n t?i x? ?ang ch?y

## T?m t?t
C?p nh?t tracking ?? xe gi? l?p ch? xu?t hi?n khi c? chuy?n t?i x? ?ang `RUNNING`.
Backend l? ngu?n d? li?u ch?nh cho v? tr? xe, bi?n s?, t?i x?, t?c ?? v? tr?m k? ti?p.

## Thay ??i g?
- Backend `JourneyTrackingService` kh?ng c?n t? t?o xe `route-sim-*` cho tuy?n kh?ng c? chuy?n ?ang ch?y.
- Tracking theo tuy?n ch? tr? v? xe g?n v?i `tripId` c?a chuy?n t?i x? ?ang ch?y.
- Tracking theo h?nh tr?nh ch? th?m xe khi route trong leg c? trip ?ang `RUNNING`.
- X?a fallback t?o nhi?u xe gi? l?p companion theo tuy?n.
- Driver `L? tr?nh chuy?n` ch? hi?n th? dropdown c?c chuy?n ?ang `RUNNING`.
- Student `Theo d?i xe` ch? hi?n th? vehicle c? `tripId`, tr?nh hi?n xe m? ph?ng c? n?u API/cache c?n d? li?u c?.
- S?a mojibake nh?n `T?i x?` trong card th?ng tin xe c?a student tracking.

## L? do
- Tr?nh vi?c student v?n th?y xe gi? l?p kh?ng g?n t?i x?.
- ??m b?o driver v? student c?ng nh?n m?t xe theo chuy?n t?i x? ?ang ch?y.
- Dropdown l? tr?nh c?a t?i x? kh?ng b? l?n chuy?n ch?a b?t ??u.

## L?u ? khi test
- Restart backend sau khi pull code m?i.
- Khi ch?a c? trip `RUNNING`, student tracking kh?ng hi?n th? xe gi? l?p.
- Khi t?i x? b?m `B?t ??u chuy?n`, student v? driver ph?i th?y c?ng xe/bi?n s?/t?i x?.
- Driver `L? tr?nh chuy?n` ch? c? c?c chuy?n ?ang ch?y trong dropdown.

## Ki?m tra ?? ch?y
- `mvn -q -DskipTests compile`
- `npx eslint src/components/bus/roles/student-module.tsx src/components/bus/roles/driver-module.tsx --quiet`
- `npx tsc --noEmit`
