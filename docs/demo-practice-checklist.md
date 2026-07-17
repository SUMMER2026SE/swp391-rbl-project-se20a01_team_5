# Hướng dẫn chạy script và demo UniBus cho team

Đây là tài liệu thực hành chính của team. Dùng tài liệu này để chuẩn bị dữ liệu, tập demo liên role và khôi phục baseline sau khi test. Bộ test QA đầy đủ hơn nằm tại `docs/external-agent-full-qa-runbook.md`.

## 1. Nguyên tắc an toàn

- Chạy lệnh từ thư mục gốc repository bằng Windows PowerShell.
- `database\RunDemoData.ps1` đọc kết nối từ `dbauth.txt` và thao tác trên **live RDS được cấu hình trong file đó**, không phải database local.
- Trước khi chạy, luôn đọc dòng `Target database: ...` để chắc chắn đúng host/database.
- Script reset dữ liệu diễn tập chính rồi tự audit; không có chế độ seed hoặc tạo trip giả.
- Không commit hoặc gửi công khai `dbauth.txt`, `SEPAY_WEBHOOK_API_KEY`, JWT secret hay AWS credentials.
- Không dùng các script `*Stable*` cũ. Bộ script dưới đây là nguồn dữ liệu demo duy nhất.

Yêu cầu máy có một trong hai lựa chọn:

- Python + `psycopg2`; hoặc
- PostgreSQL `psql` trong `PATH`.

## 2. Reset và audit bằng một file

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1
```

Script tự reset luồng diễn tập chính rồi audit ngay trong cùng một transaction. Lệnh yêu cầu `RESET DEMO` hoặc `RESET DEMO PRODUCTION` khi chạy trên RDS.

Checkpoint sau khi chạy:

- `student.supported@unibus.local` không còn đăng ký tuyến, order, payment, vé hoặc lịch sử quét.
- Script không tạo trip hoặc tuyến giả.
- Sinh viên tìm từ khu vực FPT Đà Nẵng đến Duy Tân 254 Nguyễn Văn Linh; planner có thể trả nhiều phương án, gồm cả liên tuyến.
- Sau khi sinh viên mua vé, Dispatcher tạo ca và phân công xe/tài xế/phụ xe cho từng tuyến cần trình diễn.
- Driver và Conductor chỉ thấy những chuyến vừa được Dispatcher phân công.
- Lịch sử của các account demo khác được giữ để các dashboard vẫn có dữ liệu.
- Admin và University Admin trở về baseline dựng sẵn; dữ liệu mới của luồng chính chỉ xuất hiện sau khi sinh viên mua vé và các role vận hành thao tác.

## 3. Tài khoản demo

Mật khẩu chung: `Password123!`

### Sinh viên

| Kịch bản | Tài khoản | MSSV |
| --- | --- | --- |
| DTU được trợ giá, bắt đầu luồng mới | `student.supported@unibus.local` | `27211200001` |
| DTU mua giá thường | `student.fullprice@unibus.local` | `27212100002` |
| DTU có vé tháng | `student.monthly@unibus.local` | `27211200003` |
| DTU có vé lượt | `student.day@unibus.local` | `27217100004` |
| DTU đăng ký tuyến, chưa thanh toán | `student.unpaid@unibus.local` | `27212100005` |
| DTU có lịch sử/hóa đơn | `student.history@unibus.local` | `27217200006` |
| UTE vé tháng/vé lượt | `student.ute.monthly@unibus.local`, `student.ute.single@unibus.local` | `2411505001`, `2411505002` |
| VKU vé tháng/vé lượt | `student.vku.monthly@unibus.local`, `student.vku.single@unibus.local` | `24ITB001`, `24ITB002` |
| FPT vé tháng/vé lượt | `student.fpt.monthly@unibus.local`, `student.fpt.single@unibus.local` | `DE210001`, `DE210002` |

Có thể dùng `khanhnv20a02@gmail.com` cho flow sinh viên thật đã tồn tại; không dùng tài khoản này thay baseline khi cả team cùng tập.

### Nhân sự

| Role | Tài khoản chính | Nội dung demo |
| --- | --- | --- |
| Admin trường DTU | `uniadmin.demo@unibus.local` | sinh viên, cơ sở, chính sách, giao dịch |
| Admin trường UTE | `uniadmin.ute.demo@unibus.local` | dữ liệu UTE |
| Admin trường VKU | `uniadmin.vku.demo@unibus.local` | dữ liệu VKU |
| Admin trường FPT | `uniadmin.fpt.demo@unibus.local` | dữ liệu FPT |
| Điều phối viên | `dispatcher.demo@unibus.local` | lịch, phân công, theo dõi đội xe |
| Tài xế | `driver.demo@unibus.local` | chuyến được phân, bắt đầu/kết thúc |
| Phụ xe | `conductor.demo@unibus.local` | chọn chuyến được phân, quét vé, sự cố |
| Quản trị hệ thống | `admin.demo@unibus.local` | trường, tuyến, tài khoản nhân sự |

Baseline còn có các tài khoản ca sáng/chiều và tài xế/phụ xe theo tuyến. Chỉ dùng khi cần demo nhiều xe; chạy `Audit` để đối chiếu dữ liệu hiện có.

## 4. Chuẩn bị trước buổi demo

1. Pull đúng branch/commit cần trình bày.
2. Chạy `Audit`.
3. Nếu audit fail hoặc thiếu baseline: chạy `Seed`, sau đó chạy lại `Audit`.
4. Kiểm tra CloudFront/API đã deploy cùng phiên bản.
5. Đăng nhập thử bốn role chính: Student, Dispatcher, Driver, Conductor.
6. Không Reset ngay trước giờ demo nếu chưa thống nhất với cả team vì thao tác này đổi dữ liệu live đang dùng chung.

## 5. Kịch bản demo liên role 15–20 phút

### Bước 1 — Sinh viên

Dùng `student.supported@unibus.local`:

1. Mở dashboard, xác nhận trường Duy Tân và số liệu hiển thị ngay sau khi tải dữ liệu.
2. Mở `Tìm tuyến xe` hoặc `Tìm đường`, xem tuyến/trạm và đăng ký tuyến nếu kịch bản yêu cầu.
3. Mở `Vé của tôi`:
   - tuyến có vé tháng hiện `Đã có vé hợp lệ`;
   - tuyến chưa có vé hiện `Cần mua vé`;
   - QR vé đã mua mở được.
4. Mở `Theo dõi xe`, chọn xe/chuyến trên tuyến và xem vị trí hiện tại.
5. Mở lịch sử chuyến, phản hồi hoặc báo mất đồ nếu cần minh họa.

Nghiệp vụ vé:

- Vé tháng không yêu cầu chọn điểm lên/xuống.
- Vé lượt yêu cầu điểm lên và điểm xuống hợp lệ trên cùng tuyến.
- Điểm lên/xuống của vé lượt là metadata; giá vẫn theo tuyến, **không tính theo khoảng cách**.
- Vé lượt hết hạn cuối ngày theo giờ Việt Nam và không còn hiển thị khi đã dùng/hết hạn.
- Hệ thống hiện quét lúc lên xe; không có scan-out cho vé tháng hoặc vé lượt.

### Bước 2 — Thanh toán SePay

Dùng tài khoản chưa thanh toán hoặc giá thường:

1. Chọn tuyến và loại vé.
2. Với vé lượt, chọn điểm xuống nằm sau điểm lên.
3. Kiểm tra `Giá vé`, `Trường hỗ trợ`, `Sinh viên trả` và tổng QR khớp nhau.
4. Tạo order, ghi lại `orderId`, số tiền chính xác và nội dung `DH<orderId>`.
5. Mô phỏng giao dịch tại `https://my.sepay.vn/testmode/transaction/simulate`.
6. Sau thành công, kiểm tra:
   - order chuyển paid;
   - vé tháng/vé lượt đúng loại được tạo;
   - màn hình hoàn tất xuất hiện;
   - hóa đơn mới nhất nằm trên cùng;
   - không hiện hóa đơn pending vô nghĩa.

Webhook môi trường CloudFront:

```text
https://d8xawk4fn4vfd.cloudfront.net/api/v1/payments/sepay/webhook
```

Nếu cần hoàn tất order qua helper local/API:

```powershell
$env:SEPAY_WEBHOOK_API_KEY = '<nhận riêng từ người quản lý môi trường>'
powershell -NoProfile -ExecutionPolicy Bypass -File database\CompleteDemoSePayWebhook.ps1 -OrderId <ORDER_ID> -Amount <EXACT_AMOUNT> -BackendUrl 'https://d8xawk4fn4vfd.cloudfront.net'
```

Không ghi API key vào lệnh đã commit, ảnh chụp hoặc tài liệu công khai.

### Bước 3 — Điều phối viên

Dùng `dispatcher.demo@unibus.local`:

1. Xem lịch chạy theo ngày và trạng thái từng chuyến.
2. Kiểm tra xe, tài xế và phụ xe được phân công đầy đủ.
3. Chỉ chỉnh phân công khi kịch bản yêu cầu; sau đó xác nhận role Driver/Conductor nhận đúng chuyến.
4. Mở `Theo dõi tất cả xe`.

Kỳ vọng tracking:

- Bản đồ chỉ hiển thị các chuyến thực sự đang chạy từ backend live fleet; không lấy tổng số xe đã phân công để giả thành xe đang chạy.
- Driver, Dispatcher và Student đọc cùng snapshot tracking cho cùng `tripId`.
- Vị trí mô phỏng được chia sẻ và xác định theo chuyến; không có bộ đếm giả chạy riêng ở frontend.
- Nhiều xe trên cùng tuyến phải phân biệt theo xe/chuyến, không nhảy sang xe khác.

### Bước 4 — Tài xế

Dùng `driver.demo@unibus.local`:

1. Kiểm tra dashboard và `Danh sách chuyến được phân công`.
2. Mỗi card phải có tuyến, giờ, biển số, trạng thái và timeline trạm ngang.
3. Chọn đúng chuyến rồi bắt đầu chuyến.
4. Kiểm tra Điều phối viên thấy cùng xe/chuyến và vị trí được cập nhật.
5. Kết thúc chuyến bằng thao tác tài xế.

Quy tắc:

- Chỉ được bắt đầu từ 30 phút trước đến 60 phút sau giờ xuất phát.
- Một tài xế không thể có hai chuyến đang chạy cùng lúc.
- Tracking chuyến hiện tại bám theo `tripId` được chọn.
- Tới trạm cuối không tự động hoàn tất; tài xế phải nhấn kết thúc chuyến.

### Bước 5 — Phụ xe

Dùng `conductor.demo@unibus.local`:

1. Chọn một chuyến được phân công hợp lệ, không chọn tùy ý mọi tuyến.
2. Quét QR vé tháng và/hoặc vé lượt của sinh viên.
3. Kiểm tra lịch sử vé quét theo chuyến.
4. Thử QR hết hạn/không hợp lệ để thấy thông báo rõ ràng.
5. Gửi báo cáo sự cố hoặc báo mất đồ nếu kịch bản yêu cầu.

Quy tắc scan:

- Backend quyết định cửa sổ scan theo giờ Việt Nam và lịch chuyến.
- Vé lượt chỉ dùng thành công một lần trên toàn hệ thống (`UNUSED` → `USED`). Quét lại phải thất bại và không tạo trùng lịch sử.
- Vé tháng có thể dùng cho các chuyến hợp lệ trong thời hạn. Hiện tại cùng một chuyến có thể nhận lại kết quả scan hợp lệ, nhưng travel history chỉ giữ một bản ghi.
- Không demo scan xuống xe vì hệ thống chưa có nghiệp vụ scan-out.

### Bước 6 — Admin trường và Admin hệ thống

Admin trường:

1. Đăng nhập đúng tài khoản trường cần trình bày.
2. Kiểm tra dashboard chỉ có dữ liệu thuộc trường đó.
3. Xem sinh viên, cơ sở/domain, chính sách trợ giá và giao dịch.
4. Xử lý hồ sơ xác minh nếu kịch bản yêu cầu.

Admin hệ thống:

1. Xem danh sách trường và tuyến.
2. Kiểm tra gán tuyến cho trường.
3. Xem/tạo tài khoản nhân sự với đúng role.
4. Không tạo thêm operator hoặc dữ liệu schema-level ngoài phạm vi demo.

## 6. Sau khi tập demo

Nếu buổi tập có thay đổi dữ liệu:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1
```

Chỉ kết thúc khi Audit pass. Nếu Audit fail, ghi lại lỗi và sửa dữ liệu/script; không che lỗi bằng mock frontend.

## 7. Xử lý lỗi nhanh

| Hiện tượng | Kiểm tra |
| --- | --- |
| Script báo thiếu auth | Có `dbauth.txt` ở root và đủ `endpoint`, `port`, `initialdb`, `username`, `password` |
| Script không có runner | Cài `psycopg2` hoặc thêm `psql` vào `PATH` |
| Seed/Reset không chạy | Nhập đúng `SEED DEMO` hoặc `RESET DEMO` |
| Role không thấy dữ liệu | Chạy Audit; kiểm tra đúng account/trường và backend đang trỏ cùng RDS |
| Driver không thấy chuyến | Kiểm tra ngày, phân công, lifecycle và tài khoản driver |
| Dispatcher không thấy xe | Chuyến phải ở trạng thái đang chạy; xe đã phân công chưa đồng nghĩa đang chạy |
| Conductor không quét được | Kiểm tra chuyến được phân, cửa sổ scan, loại vé, hạn vé và route |
| Thanh toán thành công nhưng chưa có vé | Kiểm tra đúng `DH<orderId>`, amount, webhook response, order/payment/ticket |
| CloudFront khác localhost | Xác nhận commit deploy, cache trình duyệt và backend API đang chạy đúng version |

## 8. Checklist chốt trước khi trình bày

- [ ] `Audit` pass.
- [ ] CloudFront và backend cùng phiên bản.
- [ ] Tài khoản demo đăng nhập được.
- [ ] Student thấy tuyến, vé, QR và tracking.
- [ ] SePay dùng đúng amount và `DH<orderId>`.
- [ ] Driver thấy timeline chuyến và thao tác đúng cửa sổ giờ.
- [ ] Dispatcher thấy cùng snapshot của chuyến đang chạy.
- [ ] Conductor chỉ chọn chuyến được phân và quét đúng loại vé.
- [ ] Admin trường thấy đúng dữ liệu trường.
- [ ] Sau rehearsal đã Reset + Audit nếu có mutation.
