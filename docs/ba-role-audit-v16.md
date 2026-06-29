# Báo cáo BA cập nhật: Rà soát role vận hành và tác động schema V16

## 1. Mục tiêu
- Rà soát các role `Conductor`, `Driver`, `Admin`, `Admin trường` để xác định:
  - Chức năng dư thừa.
  - Chức năng sai logic nghiệp vụ.
  - Màn không hoạt động hoặc hoạt động một phần.
  - Mismatch giữa frontend, backend API và schema dữ liệu mới.
- Cập nhật đánh giá theo schema order mới trong `V16`, đặc biệt các nghiệp vụ thanh toán, vé tháng, trợ giá, đối soát và combo journey.

## 2. Dữ kiện mới từ schema V16
File schema tham chiếu: `C:/Users/DuckHai/Downloads/V16__sepay_journey_combo_orders.sql`

Schema này bổ sung các trường mới vào `tb_orders`:

- `order_mode`
  - Mặc định `single-route`
  - Dùng để phân biệt order một tuyến, combo nhiều tuyến hoặc journey phức tạp.
- `ticket_period`
  - Mặc định `month`
  - Backfill thành `day` nếu `ticket_type = single`, ngược lại là `month`.
- `origin_label`
  - Nhãn điểm đi.
- `destination_label`
  - Nhãn điểm đến.
- `legs_json`
  - JSONB lưu các chặng của hành trình.
- `original_amount`
  - Giá gốc trước trợ giá.
- `subsidy_amount`
  - Số tiền được trợ giá.
- `final_amount`
  - Số tiền cuối cùng sau trợ giá.
- Index mới:
  - `idx_tb_orders_order_mode`
  - `idx_tb_orders_ticket_period`

### Ý nghĩa nghiệp vụ
- Hệ thống không còn chỉ bán vé đơn giản theo một tuyến.
- Order đã có khả năng biểu diễn:
  - Vé theo ngày / tháng.
  - Hành trình một tuyến.
  - Hành trình nhiều chặng.
  - Combo order.
  - Trợ giá theo trường/chính sách.
  - Breakdown giá gốc, trợ giá, giá cuối.
- Vì vậy các màn tài chính, giao dịch, đối soát và vé tháng cần được cập nhật để không hiển thị sai hoặc thiếu thông tin.

## 3. Tổng quan kết luận
- Không có role nào nên bị xóa hoàn toàn.
- `Conductor` không dư thừa, nhưng cần siết logic chọn chuyến để tránh thao tác nhầm chuyến.
- `Driver` đúng nghiệp vụ vận hành, nhưng còn nợ naming và logic active trip.
- `Admin` đủ chức năng cấp hệ thống, nhưng màn tài chính/giao dịch chưa phản ánh mô hình order mới.
- `Admin trường` là role bị ảnh hưởng mạnh nhất bởi schema `V16`, vì nghiệp vụ trợ giá, giao dịch, đối soát đều liên quan trực tiếp đến:
  - `subsidy_amount`
  - `final_amount`
  - `ticket_period`
  - `order_mode`
  - `legs_json`
- Màn `uniadm-transactions` hiện không nên dùng chung với `ReconScreen` lâu dài. Đây là mismatch nghiệp vụ rõ ràng.

## 4. Đánh giá theo role

### 4.1. Conductor / Phụ xe

#### Chức năng hiện có
- Dashboard chuyến được phân.
- Quét QR vé.
- Kiểm tra vé tháng.
- Hỗ trợ mất đồ.
- Báo cáo sự cố.
- Liên hệ tài xế/điều phối.
- Lịch sử chuyến.

#### Đánh giá nghiệp vụ
- Role này hợp lý và cần thiết.
- Phụ xe là người kiểm soát hành khách lên xe, quét vé, xác nhận vé tháng và xử lý tình huống trên chuyến.
- Không nên xóa role này.

#### Vấn đề phát hiện
- Trước đó có rủi ro trắng màn khi dữ liệu chưa sẵn sàng; đã được thêm loading guard.
- Logic chọn chuyến đang có rủi ro:
  - Nếu phụ xe có nhiều chuyến trong ngày, hệ thống có thể chọn chuyến đầu tiên.
  - Dẫn đến nguy cơ quét vé, kiểm tra vé tháng hoặc báo sự cố nhầm chuyến.
- Màn kiểm tra vé tháng cần cập nhật tư duy theo schema `V16`:
  - Vé tháng không chỉ đơn giản là `ticket_type = monthly`.
  - Nên kiểm tra theo `ticket_period = month`.
  - Nếu có combo hoặc journey nhiều chặng, cần xác định vé tháng đó có hợp lệ cho tuyến/chặng hiện tại không.
- Với `legs_json`, một order có thể chứa nhiều chặng. Phụ xe cần thấy thông tin:
  - Hành khách có quyền đi chặng hiện tại không.
  - Điểm lên/xuống dự kiến.
  - Chặng hiện tại thuộc order nào.
  - Vé đã được scan ở chặng nào chưa.

#### Gap với schema V16
- Nếu QR scan chỉ kiểm tra `ticketId` hoặc route đơn, có thể thiếu logic cho `legs_json`.
- Nếu order là combo nhiều chặng, phụ xe không nên chỉ thấy “vé hợp lệ” chung chung.
- Cần xác thực theo:
  - `tripId`
  - `routeId`
  - current leg
  - `ticket_period`
  - trạng thái scan của từng leg

#### Đề xuất
- Chỉ auto-select chuyến nếu phụ xe có đúng một chuyến.
- Nếu có nhiều chuyến, bắt buộc chọn chuyến.
- Scan result nên hiển thị thêm:
  - Loại vé: ngày/tháng.
  - Kiểu order: một tuyến/combo.
  - Điểm đi/đến.
  - Chặng hiện tại.
- Cần backend trả thông tin leg-level validation cho phụ xe.

#### Mức ưu tiên
- `P1`: Chọn đúng chuyến trước khi scan.
- `P1`: QR validation theo chặng nếu `legs_json` đã dùng thật.
- `P2`: Cập nhật UI scan result để hiển thị loại vé/chặng.

### 4.2. Driver / Tài xế

#### Chức năng hiện có
- Lịch hôm nay.
- Lịch chạy xe.
- Chuyến đang chạy.
- Tuyến được phân.
- Lịch sử chuyến.
- Liên hệ điều phối.
- Thông báo.
- Hồ sơ cá nhân.

#### Đánh giá nghiệp vụ
- Role này đúng và cần thiết.
- Tài xế tập trung vào vận hành chuyến, trạng thái chuyến và liên hệ điều phối.
- Không nên thêm quá nhiều thông tin tài chính/order cho tài xế.

#### Vấn đề phát hiện
- Có alias cũ `drv-active-trip` song song với `drv-active`.
- Đây không làm vỡ màn ngay, nhưng là technical debt.
- Nếu có deeplink hoặc lưu localStorage active nav cũ, hệ thống vẫn xử lý được, nhưng lâu dài nên chuẩn hóa.
- Timeline/map có khả năng là UI đẹp nhưng chưa chắc phản ánh dữ liệu vận hành thực nếu backend chưa trả:
  - current stop
  - next stop
  - ETA
  - actual departed time
  - actual ended time

#### Tác động schema V16
- Driver ít bị ảnh hưởng trực tiếp bởi order schema mới.
- Tài xế không cần biết:
  - `original_amount`
  - `subsidy_amount`
  - `final_amount`
  - thông tin thanh toán chi tiết
- Tuy nhiên nếu `legs_json` có journey nhiều chặng, driver có thể cần biết:
  - chuyến hiện tại là leg thứ mấy trong hành trình của sinh viên
  - số lượng hành khách dự kiến lên/xuống theo chặng
- Nhưng đây là thông tin tổng hợp vận hành, không phải chi tiết order cá nhân.

#### Đề xuất
- Chuẩn hóa một active id duy nhất:
  - Chọn `drv-active`.
  - Loại dần alias `drv-active-trip` sau khi xử lý compatibility.
- Màn active trip nên hiển thị dữ liệu từ backend thay vì local timer/visual:
  - `departedAt`
  - `endedAt`
  - `status`
  - current stop nếu có.
- Không đưa breakdown giá/trợ giá vào driver UI.

#### Mức ưu tiên
- `P2`: Chuẩn hóa `drv-active`.
- `P2`: Cập nhật active trip theo timestamp backend.
- `P3`: Bổ sung thống kê hành khách theo chặng nếu backend có.

### 4.3. Admin / Quản trị hệ thống

#### Chức năng hiện có
- Dashboard thống kê hệ thống.
- Quản lý trường đại học đối tác.
- Quản lý admin trường.
- Gán tuyến cho trường.
- Quản lý tài khoản người dùng.
- Xử lý khiếu nại.
- Xác minh sinh viên.
- Báo cáo vi phạm.
- Audit log.
- Lịch sử giao dịch.
- Điều chỉnh giá vé.
- Gửi thông báo.

#### Đánh giá nghiệp vụ
- Role này đúng và đầy đủ ở cấp hệ thống.
- Không dư thừa.
- Tuy nhiên module hiện khá lớn, ôm nhiều domain khác nhau.

#### Vấn đề phát hiện
- Màn giao dịch của admin cần được cập nhật theo schema `V16`.
- Nếu hiện chỉ hiển thị `orderTotal`, `paymentStatus`, `studentName`, thì chưa đủ.
- Admin cần nhìn toàn hệ thống theo:
  - doanh thu gốc
  - tổng trợ giá
  - doanh thu thực thu
  - order theo ngày/tháng
  - order single-route/combo
  - tỷ lệ thanh toán thành công/thất bại
- Màn điều chỉnh giá vé (`adm-fare`) cần được kiểm tra lại vì schema mới có `original_amount`, `subsidy_amount`, `final_amount`.
  - Giá vé gốc thuộc fare.
  - Trợ giá thuộc policy.
  - Giá cuối thuộc order.
  - Không nên nhầm giữa điều chỉnh fare và điều chỉnh final amount.

#### Tác động schema V16
- `Admin Transactions` cần bổ sung cột:
  - Mã order
  - Sinh viên
  - Trường
  - `order_mode`
  - `ticket_period`
  - `origin_label`
  - `destination_label`
  - Số chặng
  - `original_amount`
  - `subsidy_amount`
  - `final_amount`
  - Trạng thái thanh toán
  - Thời điểm tạo/thanh toán
- Dashboard admin nên có thêm metric:
  - Tổng tiền gốc
  - Tổng trợ giá
  - Tổng thực thu
  - Tỷ lệ subsidy/revenue
  - Số combo orders
  - Số day passes vs monthly passes

#### Sai logic tiềm ẩn
- Nếu admin dashboard vẫn tính doanh thu từ `total` hoặc `orderTotal`, có thể sai sau schema mới.
- Chuẩn mới nên dùng:
  - `original_amount` cho giá trước trợ giá
  - `subsidy_amount` cho phần trường/hệ thống hỗ trợ
  - `final_amount` cho số tiền người dùng trả
- Nếu báo cáo tài chính không phân biệt ba số này, đối soát sẽ sai.

#### Đề xuất
- Cập nhật DTO/API giao dịch để expose field mới từ `tb_orders`.
- Cập nhật `PaymentTransactionView`.
- Cập nhật `TransactionsScreen`.
- Tách logic tính doanh thu:
  - Gross Revenue = sum `original_amount`
  - Subsidy = sum `subsidy_amount`
  - Net Revenue / Paid Amount = sum `final_amount`
- Thêm filter:
  - `order_mode`
  - `ticket_period`
  - university
  - payment status
  - date range

#### Mức ưu tiên
- `P1`: Cập nhật giao dịch admin theo schema mới.
- `P1`: Chuẩn hóa công thức revenue/subsidy/final.
- `P2`: Thêm filter/report.
- `P3`: Refactor module admin lớn thành các domain nhỏ.

### 4.4. University Admin / Admin trường

#### Chức năng hiện có
- Tổng quan trường.
- Thông tin trường & campus.
- Domain email.
- Import danh sách sinh viên.
- Trạng thái sinh viên.
- Chính sách trợ giá.
- Thống kê sử dụng.
- Gửi thông báo trường.
- Báo cáo đối soát.
- Lịch sử giao dịch.
- Thông báo.
- Hồ sơ cá nhân.

#### Đánh giá nghiệp vụ
- Role này đúng và rất quan trọng.
- Đây là role bị ảnh hưởng nhiều nhất bởi schema `V16`.
- Admin trường cần quản lý sinh viên, trợ giá và kiểm tra số tiền trường phải chi/trợ giá.

#### Vấn đề phát hiện
- `uniadm-transactions` hiện đang dùng chung màn với `ReconScreen`.
- Đây là vấn đề nghiệp vụ rõ:
  - `Lịch sử giao dịch` là danh sách giao dịch chi tiết.
  - `Báo cáo đối soát` là tổng hợp theo kỳ, để trường xác nhận số tiền/trợ giá.
- Hai màn không nên là một.

#### Tác động schema V16
- Với các trường mới:
  - `original_amount`
  - `subsidy_amount`
  - `final_amount`
  - `ticket_period`
  - `order_mode`
  - `origin_label`
  - `destination_label`
  - `legs_json`
- Admin trường cần nhìn rõ:
  - Sinh viên nào mua vé.
  - Vé ngày hay vé tháng.
  - Hành trình từ đâu đến đâu.
  - Có bao nhiêu chặng.
  - Giá gốc bao nhiêu.
  - Trường trợ giá bao nhiêu.
  - Sinh viên thực trả bao nhiêu.
  - Giao dịch có nằm trong kỳ đối soát không.

#### Màn `uniadm-transactions` nên có
- Bảng giao dịch chi tiết:
  - Student code/name/email.
  - Order code.
  - Ticket period.
  - Order mode.
  - Origin → destination.
  - Number of legs.
  - Original amount.
  - Subsidy amount.
  - Final amount.
  - Payment status.
  - Payment time.
- Filter:
  - Date range.
  - Ticket period.
  - Order mode.
  - Payment status.
  - Route/campus nếu có.
- Export CSV/Excel.

#### Màn `uniadm-recon` nên có
- Tổng hợp kỳ:
  - Tổng số giao dịch.
  - Tổng giá gốc.
  - Tổng trợ giá.
  - Tổng sinh viên thực trả.
  - Tổng trường cần thanh toán/ghi nhận.
- Breakdown:
  - Theo chính sách trợ giá.
  - Theo campus.
  - Theo ticket period.
  - Theo route/order mode.
- Trạng thái:
  - Chưa đối soát.
  - Đang đối soát.
  - Đã xác nhận.
  - Có lệch số liệu.
- Nút nghiệp vụ:
  - Xuất báo cáo.
  - Xác nhận kỳ đối soát.
  - Gửi yêu cầu rà soát nếu lệch.

#### Sai logic hiện tại
- Nếu `transactions` và `recon` dùng chung màn, người dùng không có công cụ để:
  - tra cứu một giao dịch cụ thể
  - lọc lịch sử giao dịch
  - đối chiếu từng order với tổng kỳ
- Đây là “hoạt động được nhưng sai mục tiêu nghiệp vụ”.

#### Đề xuất
- Tạo màn riêng `UniversityTransactionsScreen`.
- Giữ `ReconScreen` cho đối soát.
- Cập nhật API `/university-admin/payment-transactions` trả field mới.
- Cập nhật API `/university-admin/reconciliation` tính theo field mới.
- Nếu chưa làm ngay, đổi label menu tạm thời:
  - Từ `Lịch sử giao dịch`
  - Thành `Giao dịch & đối soát`
  - Nhưng đây chỉ là workaround.

#### Mức ưu tiên
- `P1`: Tách `uniadm-transactions` khỏi `ReconScreen`.
- `P1`: Cập nhật giao dịch theo `original/subsidy/final amount`.
- `P1`: Đối soát theo kỳ dựa trên `subsidy_amount`.
- `P2`: Export báo cáo cho trường.
- `P2`: Filter theo `ticket_period`, `order_mode`.

## 5. Gap analysis frontend ↔ schema V16

### 5.1. Field mới chưa chắc đã được expose ra frontend
Cần kiểm tra backend DTO/API đã trả các field này chưa:

- `order_mode`
- `ticket_period`
- `origin_label`
- `destination_label`
- `legs_json`
- `original_amount`
- `subsidy_amount`
- `final_amount`

Nếu chưa expose, frontend không thể cập nhật đúng dù schema đã có.

### 5.2. `PaymentTransactionView` cần cập nhật
Frontend type hiện cần được kiểm tra lại để bổ sung:

- `orderMode`
- `ticketPeriod`
- `originLabel`
- `destinationLabel`
- `legs`
- `originalAmount`
- `subsidyAmount`
- `finalAmount`

### 5.3. Dashboard financial metrics cần chuẩn hóa
Các dashboard không nên dùng lẫn:

- `total`
- `orderTotal`
- `finalAmount`
- `originalAmount`

Cần quy ước:
- `originalAmount`: giá gốc.
- `subsidyAmount`: phần trợ giá.
- `finalAmount`: số tiền sinh viên thanh toán.
- `paidAmount`: số tiền thực nhận qua payment gateway nếu có.
- `refundedAmount`: nếu sau này có hoàn tiền.

### 5.4. Combo/journey cần logic leg-level
Nếu `legs_json` dùng thật:
- Vé không còn là một route đơn.
- Scan vé cần kiểm tra theo chặng.
- Lịch sử chuyến của sinh viên cần hiển thị từng leg.
- Giao dịch cần hiển thị tổng order và chi tiết chặng.

## 6. Issue backlog ưu tiên

### `P1` — Tách màn University Transactions
- Hiện trạng: `uniadm-transactions` dùng chung với `ReconScreen`.
- Tác động: sai mục tiêu nghiệp vụ.
- Cách sửa:
  - Tạo `UniversityTransactionsScreen`.
  - Bảng chi tiết giao dịch.
  - Filter theo schema mới.
  - Export.

### `P1` — Cập nhật transaction DTO theo schema V16
- Hiện trạng: frontend có thể chưa nhận các field mới.
- Tác động: thiếu dữ liệu tài chính/trợ giá.
- Cách sửa:
  - Backend expose fields.
  - Frontend update type.
  - UI update table/card/report.

### `P1` — Chuẩn hóa công thức tài chính
- Hiện trạng: nguy cơ dùng nhầm `total/orderTotal`.
- Tác động: sai báo cáo doanh thu và đối soát.
- Cách sửa:
  - Gross = `original_amount`.
  - Subsidy = `subsidy_amount`.
  - Net/Student paid = `final_amount`.

### `P1` — Conductor scan theo đúng chuyến/chặng
- Hiện trạng: có thể chọn chuyến đầu tiên.
- Tác động: quét nhầm chuyến.
- Cách sửa:
  - Nếu nhiều chuyến, bắt buộc chọn.
  - Backend validate QR theo `tripId` + leg.

### `P2` — Chuẩn hóa Driver active route id
- Hiện trạng: `drv-active` và `drv-active-trip` cùng tồn tại.
- Tác động: technical debt.
- Cách sửa:
  - Dùng `drv-active`.
  - Giữ alias một thời gian để migrate localStorage/deeplink.

### `P2` — Admin dashboard cập nhật metric mới
- Hiện trạng: dashboard chưa phản ánh gross/subsidy/final.
- Tác động: thiếu insight tài chính.
- Cách sửa:
  - Thêm chart theo ticket period/order mode.
  - Thêm gross/subsidy/net.

### `P2` — University reconciliation theo kỳ
- Hiện trạng: đối soát cần rõ kỳ và trạng thái.
- Tác động: trường khó xác nhận số liệu.
- Cách sửa:
  - Date range.
  - Summary.
  - Breakdown.
  - Export.
  - Confirmation workflow.

### `P3` — Refactor module lớn
- Hiện trạng: admin và university admin module quá lớn.
- Tác động: khó maintain.
- Cách sửa:
  - Tách theo domain module.

## 7. Đề xuất thiết kế lại một số màn

### 7.1. Admin Transactions
Nên có layout:

- Header:
  - Tổng giao dịch.
  - Gross amount.
  - Subsidy amount.
  - Final amount.
- Filter bar:
  - Search student/order.
  - University.
  - Payment status.
  - Ticket period.
  - Order mode.
  - Date range.
- Table:
  - Order.
  - Student.
  - University.
  - Period.
  - Mode.
  - Journey.
  - Gross.
  - Subsidy.
  - Final.
  - Status.
  - Paid at.
- Detail drawer:
  - `legs_json` rendered thành danh sách chặng.
  - Payment gateway info.
  - Audit trail.

### 7.2. University Transactions
Nên có layout:

- Summary:
  - Sinh viên đã mua.
  - Tổng giao dịch.
  - Tổng trợ giá.
  - Tổng sinh viên trả.
- Table:
  - Student code.
  - Student name.
  - Ticket period.
  - Journey.
  - Subsidy.
  - Final amount.
  - Payment status.
- Export:
  - Excel/CSV theo kỳ.

### 7.3. University Reconciliation
Nên khác transaction:

- Chọn kỳ.
- Tổng hợp:
  - Tổng vé tháng.
  - Tổng vé ngày.
  - Tổng combo.
  - Tổng trợ giá.
  - Tổng final amount.
- Breakdown:
  - Theo chính sách.
  - Theo campus.
  - Theo tuyến.
  - Theo order mode.
- Actions:
  - Export.
  - Confirm.
  - Request review.

### 7.4. Conductor Scan Result
Nên hiển thị:

- Student name/code.
- Ticket period.
- Valid for current trip?
- Current leg:
  - from stop
  - to stop
  - route
- Scan status:
  - not scanned
  - already scanned
  - wrong trip
  - expired
  - cancelled/refunded nếu có
- Không cần hiển thị tiền trừ khi có nghiệp vụ kiểm tra gian lận.

## 8. Kiểm tra cần làm tiếp

### Backend
- Kiểm tra entity `Order`.
- Kiểm tra DTO trả về payment transaction.
- Kiểm tra API:
  - `/admin/payment-transactions`
  - `/university-admin/payment-transactions`
  - `/university-admin/reconciliation`
  - `/conductor/tickets/scan`
- Kiểm tra `legs_json` có schema thống nhất chưa.

### Frontend
- Kiểm tra `PaymentTransactionView`.
- Kiểm tra `TransactionsScreen`.
- Kiểm tra `ReconScreen`.
- Kiểm tra `AssistantScan`.
- Kiểm tra `Student invoices/history` vì cũng bị ảnh hưởng bởi order mode và legs.

### QA/UAT
- Test case cần có:
  - Vé ngày single-route.
  - Vé tháng single-route.
  - Combo nhiều chặng.
  - Có trợ giá.
  - Không trợ giá.
  - Thanh toán thành công.
  - Thanh toán fail.
  - Sinh viên thuộc trường có policy.
  - Sinh viên không thuộc policy.
  - Phụ xe scan đúng chặng.
  - Phụ xe scan sai chặng.
  - Đối soát kỳ có nhiều loại vé.

## 9. Kết luận cuối
- Các role hiện tại nhìn chung **đúng định hướng nghiệp vụ** và **không có role nào nên xóa**.
- Vấn đề lớn nhất không còn là “màn có trắng hay không”, mà là **frontend role chưa theo kịp mô hình order mới**.
- Schema `V16` cho thấy hệ thống đã tiến sang mô hình:
  - journey/combo order,
  - trợ giá,
  - giá gốc/giá cuối,
  - vé ngày/vé tháng,
  - hành trình nhiều chặng.
- Vì vậy cần ưu tiên cập nhật:
  - Admin Transactions.
  - University Transactions.
  - University Reconciliation.
  - Conductor QR validation.
- Nếu không cập nhật, hệ thống vẫn có thể chạy, nhưng sẽ có rủi ro:
  - báo cáo tài chính sai,
  - đối soát trường sai,
  - phụ xe scan sai chặng,
  - admin không nhìn thấy bản chất order mới,
  - người dùng thấy menu đúng nhưng nội dung chưa đúng nghiệp vụ.

## 10. Khuyến nghị hành động ngay
- Làm trước 4 việc:
  - Tách `uniadm-transactions` thành màn riêng.
  - Cập nhật DTO/API giao dịch theo schema V16.
  - Cập nhật báo cáo đối soát theo `subsidy_amount` và `final_amount`.
  - Sửa conductor scan để bắt buộc chọn đúng chuyến/chặng.
