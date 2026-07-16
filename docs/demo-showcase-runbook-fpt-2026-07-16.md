# Kịch bản demo UniBus toàn vai trò tại FPT Đà Nẵng

## Mục tiêu

Demo một hành trình liên vai trò, trong đó sinh viên chính thuộc **Trường Đại học Duy Tân**. Địa điểm thuyết trình tại FPT Đà Nẵng không thay đổi nghiệp vụ trường của tài khoản. Dữ liệu FPT vẫn có sẵn để chứng minh hệ thống đa trường.

## Chuẩn bị trước buổi demo

1. Xác nhận production `https://app.fudabus.store` trả HTTP 200 và backend health `UP`.
2. Xác nhận RDS có Flyway V17 `success=true`.
3. Tạo snapshot RDS mới.
4. Từ repository root chạy:

```powershell
.\database\RunDemoData.ps1 -Mode All -AuthFile .\dbauth.txt -AllowProduction -ConfirmPhrase "SEED DEMO PRODUCTION"
```

5. Không bắt đầu demo nếu Audit có `FAIL`.
6. Đăng nhập sẵn mỗi role ở profile trình duyệt/tab riêng; không lưu mật khẩu trên máy trình chiếu công cộng.

Mật khẩu chung của account demo: `Password123!`.

## Câu chuyện demo khuyến nghị

### 1. Sinh viên Duy Tân — điểm mở đầu

Account: `student.supported@unibus.local`

Show theo thứ tự:

1. Dashboard: thông tin trường Duy Tân, tuyến đang quan tâm, vé và thông báo.
2. Chatbot AI: hỏi “Từ Đại học Duy Tân đi tuyến nào phù hợp?” và mở CTA được gợi ý.
3. Tìm đường: chọn điểm đi/đến, giải thích giờ hoạt động thật; ngoài giờ phải báo hết chuyến thay vì tạo chuyến giả.
4. Tra cứu tuyến: xác nhận các tuyến 01, 06, 09 xuất hiện và xem danh sách trạm/bản đồ.
5. Thanh toán: so sánh `Giá vé`, `Trường hỗ trợ`, `Sinh viên trả`; chọn điểm lên/xuống cho vé lượt nhưng không gọi là giá theo chặng.
6. Vé của tôi: mở vé tháng/QR; đổi sang vé lượt còn hạn nếu cần.
7. Theo dõi xe: xem xe, trạm và timeline.
8. Lịch sử chuyến: mở một chuyến, đánh giá hoặc báo mất đồ.
9. Thông báo và hóa đơn: giao dịch mới nhất nằm trên cùng, không có trạng thái chờ vô nghĩa.

Dữ liệu phụ để show trạng thái khác:

- `student.day@unibus.local`: vé lượt chưa dùng.
- `student.monthly@unibus.local`: vé tháng đang hoạt động.
- `student.unpaid@unibus.local`: đơn chưa thanh toán.
- `student.history@unibus.local`: lịch sử chuyến/feedback.
- `student.fullprice@unibus.local`: tuyến công khai không trợ giá.

### 2. University Admin Duy Tân

Account: `uniadmin.demo@unibus.local`

Show:

1. Dashboard trường và số sinh viên.
2. Danh sách sinh viên/roster Duy Tân.
3. Tuyến liên kết và chính sách trợ giá.
4. Giao dịch, vé tháng/vé lượt và đối soát.
5. Nhấn mạnh dữ liệu bị giới hạn theo trường; không thấy dữ liệu quản trị của FPT/UTE/VKU.

Nếu cần chứng minh đa trường, đăng nhập account university admin FPT đã seed và chỉ show read-only.

### 3. Điều phối

Account: `dispatcher.demo@unibus.local`

Show:

1. Dashboard vận hành hôm nay.
2. Lịch chạy và các chuyến có tài xế/phụ xe được phân công.
3. Theo dõi nhiều xe trên cùng bản đồ, đồng bộ phong cách tracking phía sinh viên.
4. Quản lý tuyến/trạm ở mức read-only trong demo chính.
5. Sự cố, phản hồi và thông báo liên vai trò.

Không chỉnh tuyến/trạm thật trong buổi demo trừ khi đã tập rollback.

### 4. Tài xế

Account: `driver.demo@unibus.local`

Show:

1. Tuyến/chuyến được phân công.
2. Lịch chạy rõ theo thời gian.
3. Chuyến hiện tại và trạng thái bắt đầu/kết thúc.
4. Lịch sử chuyến.
5. Chỉ thao tác lifecycle trên chuyến mang marker demo.

### 5. Phụ xe

Account: `conductor.demo@unibus.local`

Show:

1. Chuyến được phân công; không tự chọn tuyến ngoài phân công.
2. Quét QR vé lượt hợp lệ.
3. Quét lại cùng vé phải bị từ chối, không tạo travel history trùng.
4. Quét vé tháng.
5. Lịch sử chuyến/vé đã quét theo từng chuyến.
6. Báo sự cố hoặc hỗ trợ đồ thất lạc.

### 6. System Admin — điểm kết

Account: `admin.demo@unibus.local`

Show:

1. Tổng quan toàn hệ thống và nhiều trường: DTU, FPTDN, UTE, VKU.
2. Quản lý tài khoản/role.
3. Xác minh sinh viên.
4. Tài chính, giá vé và giao dịch.
5. Khiếu nại/rủi ro/audit log nếu màn hình có dữ liệu.
6. Kết luận chuỗi dữ liệu xuyên suốt từ sinh viên → trường → vận hành → quản trị.

## Tập dợt và reset

Chạy lại baseline bất kỳ lúc nào:

```powershell
.\database\RunDemoData.ps1 -Mode Reset -AuthFile .\dbauth.txt -AllowProduction -ConfirmPhrase "SEED DEMO PRODUCTION"
```

`Reset` và `Seed` cùng tái tạo baseline chuẩn; chạy nhiều lần không nhân bản dữ liệu. Sau mỗi lần tập:

```powershell
.\database\RunDemoData.ps1 -Mode Audit -AuthFile .\dbauth.txt
```

Không kết thúc buổi tập nếu Audit có `FAIL`.

## Integration ngoài và phương án dự phòng

- Gmail OTP: gửi thử trước buổi demo; nếu Gmail chậm, không tạo account mới trong luồng chính.
- Google OAuth/OCR/AI/SePay: test trước và giữ account/data baseline để demo chính không phụ thuộc hoàn toàn vào dịch vụ ngoài.
- SePay: chỉ dùng test mode/webhook chuẩn, không chuyển tiền thật.
- Bản đồ/routing: nếu dịch vụ ngoài chậm, dùng tuyến/trạm đã seed và ghi rõ đây là lỗi integration, không giả PASS.

## Checklist kết thúc

- Reset baseline.
- Audit không có `FAIL`.
- Không còn record `[QA]` ngoài phạm vi demo.
- Không để token, DB password, webhook key hoặc Gmail app password trong báo cáo/screenshot.
- Ghi commit SHA, ECS revision, Flyway version và thời gian kiểm thử vào báo cáo cuối.
