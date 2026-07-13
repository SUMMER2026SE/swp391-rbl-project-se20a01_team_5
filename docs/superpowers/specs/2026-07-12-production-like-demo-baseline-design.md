# Production-like Demo Baseline Design

## Mục tiêu

Mở rộng baseline demo UniBus để các dashboard, bảng dữ liệu và luồng liên role có mật độ gần môi trường production nhưng vẫn dễ hiểu, chạy nhanh và reset được hoàn toàn.

Baseline tập trung vào bốn trường:

- Trường Đại học Duy Tân (`DTU`).
- Trường Đại học Sư phạm Kỹ thuật - Đại học Đà Nẵng (`UTE`).
- Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (`VKU`).
- Trường Đại học FPT Đà Nẵng (`FPTDN`).

## Phạm vi

Chỉ thay đổi dữ liệu demo và tài liệu liên quan:

- `database/SeedDemoDataUntilAugust.sql`.
- `database/ResetDemoScenario.sql`.
- `database/AuditDemoDataUntilAugust.sql`.
- Runbook và hướng dẫn account demo nếu cần.

Không thay đổi database schema, Flyway, backend API, frontend UI, route/stop geometry, tracking, GPS hoặc dữ liệu thật không thuộc marker demo.

## Hiện trạng

Live RDS hiện có đủ master route và lịch vận hành cơ bản nhưng dữ liệu demo phân bố mỏng:

- Mỗi role vận hành chính chỉ có một account đăng nhập.
- Duy Tân có dữ liệu roster, order và ticket; UTE, VKU và FPT chưa có độ sâu tương đương.
- Feedback, lost item, incident và notification chưa đủ trạng thái để demo bảng lọc và dashboard.
- Một số record cũ có tên kỹ thuật hoặc rác như `Cơ sở demo Duy Tân`, policy `dddd`.

## Nguyên tắc dữ liệu

1. Dữ liệu có ý nghĩa nghiệp vụ, không tạo text ngẫu nhiên kiểu AI.
2. Account chính có tên người Việt tự nhiên và mục đích test rõ.
3. Dữ liệu nền dùng SQL `generate_series` khi phù hợp để tránh insert thủ công dài.
4. Seed/Reset nhiều lần cho cùng baseline, không nhân bản.
5. Không tạo route hoặc stop giả; chỉ tham chiếu route/stop đang tồn tại và active.
6. Không xóa theo pattern quá rộng; mỗi entity demo có marker hoặc allowlist cụ thể.
7. Shared demo password giữ là `Password123!`; không thêm secret thật.

## Ma trận account

### Quản trị hệ thống

- Tổng 2 account.
- Giữ `admin.demo@unibus.local` và thêm một account vận hành dự phòng.

### Quản trị viên trường

- Tổng 8 account, mỗi trường 2 account.
- Mỗi account liên kết chính xác một `university_id` qua `university_admins`.
- Chức danh: `Quản trị viên trường` và `Chuyên viên tài chính`.

### Điều phối viên

- Tổng 3 account: ca sáng, ca chiều và điều phối tổng.
- Mỗi account có employee code và department rõ ràng.

### Tài xế

- Tổng 5 account.
- Mỗi tài xế có hồ sơ bằng lái, kinh nghiệm, work status, chuyến hoàn tất và chuyến hôm nay hoặc sắp tới.

### Phụ xe

- Tổng 4 account.
- Mỗi phụ xe có employee code duy nhất và context quét vé, incident hoặc lost item.

### Sinh viên

- Tổng roster 60 sinh viên, 15 mỗi trường.
- Tổng account đăng nhập 18.
- Giữ 6 account Duy Tân hiện có để không phá runbook và regression scenario.
- Thêm 4 account cho mỗi trường UTE, VKU và FPT.
- Bốn scenario chính mỗi trường: vé tháng trợ giá, vé lượt active, registration chưa thanh toán, và lịch sử/hóa đơn/feedback.
- Các roster còn lại là dữ liệu nền cho bảng quản trị, tìm kiếm và thống kê.

## Dữ liệu bốn trường

Mỗi trường có:

- Một campus chính với tên và địa chỉ thật được kiểm chứng.
- Domain email active tương ứng.
- Hai route liên kết nếu route/stop hiện có hỗ trợ; tối thiểu một route active.
- Một policy trợ giá active và một policy lịch sử inactive.
- 15 roster ở nhiều khoa, khóa học và trạng thái phù hợp.
- 12 order phân bố giữa `Paid`, `Unpaid`, `Cancelled`, `Refunded`.
- Payment, invoice và ticket chỉ được tạo khi trạng thái nghiệp vụ cho phép.

Route ưu tiên:

- DTU: route `12` và route BUSMAP có stop Duy Tân phù hợp.
- VKU: route `02` và `16`.
- FPT: route `N1` đang active; route thứ hai chỉ dùng khi stop/campus phù hợp.
- UTE: chọn route active có stop gần campus; không tạo stop mới để ép liên kết.

## Dữ liệu vận hành

### Đội xe

- 10 xe với biển số hợp lệ và duy nhất.
- Phân bố trạng thái sẵn sàng, đang vận hành và bảo trì theo constraint hiện có.
- Không dùng biển số hoặc tên xe chứa từ `STABLE`, `AI`, `TEMP`.

### Lịch và chuyến

- Khoảng thời gian: 14 ngày trước, hôm nay và 7 ngày tiếp theo.
- Chuyến quá khứ chủ yếu `COMPLETED`, có một tỷ lệ nhỏ `CANCELLED`.
- Hôm nay có `NOT_STARTED`, tối đa một số ít `RUNNING`, và chuyến đã `COMPLETED` theo thời gian hợp lý.
- Chuyến tương lai là `NOT_STARTED`.
- Không tạo nhiều chuyến `RUNNING` cho cùng xe hoặc cùng nhân sự tại cùng thời điểm.
- Tất cả trip demo có notes bắt đầu bằng `DEMO_DATA:` để cleanup an toàn.

### Phân công

- Trip có bus, driver và conductor nhất quán.
- Mỗi tài xế/phụ xe có lịch sử và lịch sắp tới.
- Điều phối viên nhìn thấy đủ tuyến, xe và trạng thái để test filter, assignment và dashboard.

## Vé, thanh toán và lịch sử

Mỗi trường có dữ liệu gồm:

- Vé tháng `ACTIVE`, `EXPIRED`, `CANCELLED`.
- Vé lượt `UNUSED`, `USED`, `EXPIRED`, `CANCELLED`.
- Registration `APPROVED`, `PENDING`, `CANCELLED`.
- Paid order có payment, invoice và đúng một ticket/pass tương ứng.
- Unpaid/cancelled/refunded order không provision vé active sai nghiệp vụ.
- Trợ giá có original, subsidy và final amount nhất quán.
- Khoảng 30 travel history phân bố theo trường, route và ngày.
- QR code demo duy nhất và có prefix rõ ràng.

## Feedback, mất đồ, sự cố và thông báo

Baseline mục tiêu:

- Khoảng 18 feedback với `OPEN`, `IN_PROGRESS`, `RESOLVED`.
- Khoảng 9 lost-item reports với `REPORTED`, `SEARCHING`, `FOUND`, `NOT_FOUND`.
- Khoảng 12 incidents với `NEW`, `IN_PROGRESS`, `RESOLVED` và các loại hợp lệ.
- Ít nhất 40 notifications gồm `SYSTEM`, `TRIP`, `PAYMENT`, `COMPLAINT`, `ALERT`.
- Mỗi account demo chính có cả thông báo đã đọc và chưa đọc khi phù hợp.
- Nội dung gắn với trip/student/role có thật; không dùng lorem ipsum hoặc câu giải thích vô nghĩa.

## Marker và cleanup

Marker chính:

- Student code dùng định dạng giống MSSV thật của từng trường, tuyệt đối không chứa `DEMO`: DTU `272112000xx`, UTE `24115050xx`, VKU `24ITBxxx`, FPT `DE21xxxx`.
- Ownership sinh viên baseline được xác định bằng whitelist email account và email roster deterministic, không dựa vào prefix MSSV.
- Trip notes: `DEMO_DATA:*` và marker fleet hiện hành nếu còn cần.
- QR/transaction/reference code: prefix `DEMO-`.
- Staff employee code: prefix role + `-DEMO-`.
- Account: whitelist email `*.demo@unibus.local` được khai báo rõ trong script, không delete wildcard toàn domain.

Reset phải xóa theo thứ tự khóa ngoại:

1. Notification/support/history phụ thuộc trip hoặc account demo.
2. Invoice, payment, transaction, ticket/pass và order demo.
3. Registration và roster demo.
4. Trip, schedule và vehicle location demo.
5. Staff profile và account demo bổ sung.
6. University admin, campus, route link và policy baseline-owned.
7. Tái tạo master baseline rồi tới dữ liệu phụ thuộc.

Không xóa university master thật ngoài bốn trường. Các trường khác vẫn tồn tại nhưng không được làm dày trong baseline này.

## Known-junk allowlist

Reset/Seed được phép xử lý đúng các record đã xác minh là rác:

- Policy có tên chính xác `dddd`.
- Campus baseline cũ có code `DTU_DEMO_MAIN` hoặc tên `Cơ sở demo Duy Tân`.
- Policy QA cũ có tên được allowlist cụ thể sau khi xác minh không thuộc giao dịch thật.

Không dùng điều kiện dạng `name ILIKE '%demo%'` để xóa hàng loạt.

## Audit bắt buộc

Audit trả `FAIL` khi có một trong các điều kiện:

- Thiếu account hoặc role/profile liên kết sai.
- Quản trị viên trường nhìn nhầm university.
- Một trong bốn trường có dưới 15 roster hoặc thiếu scenario account.
- Paid order thiếu payment, invoice hoặc ticket/pass.
- Unpaid/cancelled order có vé active được provision sai.
- Amount original/subsidy/final không cân bằng.
- Vé active đã hết hạn hoặc QR bị trùng.
- Trip demo thiếu route/bus/driver/conductor hoặc assignment chồng chéo rõ ràng.
- Staff demo không có lịch sử và lịch sắp tới theo ma trận.
- Có registration demo dùng route `UB-DN-*`.
- Seed/Reset chạy lặp tạo record trùng.
- Known-junk allowlist vẫn còn.

Audit in ra số lượng theo từng trường và role để dễ đối chiếu trên UI.

## Validation

Trước khi chạy live RDS:

- Parse ba file SQL và PowerShell runner.
- Review thứ tự delete/insert theo foreign key.
- Chạy backend compile/test để bảo đảm dữ liệu dùng đúng enum/constraint hiện hành.
- Chạy `git diff --check`.

Khi triển khai live RDS:

1. Chạy Audit trước thay đổi và lưu output.
2. Chạy Seed trên live RDS bằng `RunDemoData.ps1` với xác nhận.
3. Chạy Audit.
4. Browser smoke test account chính của bốn trường và các role vận hành.
5. Chạy Reset rồi Audit để kiểm tra idempotency và cleanup.
6. Seed lại baseline cuối cùng rồi Audit nếu mục tiêu là để web sẵn sàng demo.

Không kết luận thành công nếu Reset/Audit cuối thất bại.
