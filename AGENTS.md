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
