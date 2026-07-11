# Thiết kế tích hợp role Driver và Phụ xe từ nhánh TruongPhuc

## Mục tiêu

Tích hợp có chọn lọc các cải tiến giao diện và trải nghiệm của hai role Driver và Phụ xe từ `origin/TruongPhuc` vào nền hiện tại của `DucHai`, đồng thời giữ nguyên các quy tắc hardening về vòng đời chuyến, quét vé, tracking nhiều xe và GPS thật.

## Quyết định kiến trúc

Thực hiện trên nhánh riêng `codex/integrate-truongphuc-roles` trong worktree cô lập. Không merge nguyên nhánh `TruongPhuc`. Các thay đổi được đưa vào theo từng luồng nghiệp vụ nhỏ, dựa trên diff và hành vi mong muốn, để tránh kéo lại các đoạn code demo hoặc các hồi quy đã phát hiện.

Nền tích hợp phải bao gồm trạng thái hiện tại của `DucHai`, kể cả các thay đổi hardening chưa commit đang có trong working tree. Trước khi tích hợp, trạng thái này phải được chốt thành một baseline có thể phục hồi và được kiểm tra bằng test.

## Các phương án đã cân nhắc

1. **Tích hợp chọn lọc — được chọn.** Giữ backend hardening, lấy UI và các cải tiến quét vé hữu ích. Diff nhỏ hơn và dễ chứng minh đúng nghiệp vụ.
2. **Merge toàn bộ rồi sửa conflict.** Nhanh lúc bắt đầu nhưng có nguy cơ đưa lại GPS giả, quét vé trước khi chạy và các lỗi dữ liệu đã biết.
3. **Viết lại hai role từ đầu.** Cho code sạch hơn về lý thuyết nhưng tốn thời gian, tăng phạm vi và không tận dụng được phần UI tốt đã có.

## Phạm vi Driver

- Giữ và tinh chỉnh giao diện card, timeline, lịch chạy và trạng thái chuyến từ `TruongPhuc`.
- Lịch theo ngày chỉ hiển thị chuyến thuộc ngày được chọn; không tự cộng mọi chuyến `RUNNING` của ngày khác.
- Bản ghi `NOT_CREATED` không được gọi API bắt đầu với `tripId` rỗng. Nếu nghiệp vụ cần tạo trip từ lịch, phải đi qua luồng backend tạo hoặc bảo đảm trip rồi mới bắt đầu.
- Đồng hồ chuyến tính từ `departedAt`; đổi màn hình hoặc tải lại trang không làm thời gian quay về 0.
- Danh sách trạm mặc định thu gọn. Màn đang chạy không lặp lại toàn bộ 50–60 trạm cho từng card.
- Loại bỏ dữ liệu chuyến trùng tại nguồn truy vấn hoặc tại khóa nhận diện ổn định gần nguồn nhất, không che lỗi bằng CSS.
- Driver chỉ thao tác chuyến được phân công cho mình.

## Phạm vi Phụ xe

- Giữ giao diện quét vé, bộ lọc vé, kết quả chi tiết, lịch sử quét gần đây và chống gửi trùng ngắn hạn.
- Cả frontend và backend chỉ cho quét khi trạng thái chuyến là `RUNNING`.
- Vé lượt được tiêu thụ bằng cập nhật atomic; hai request đồng thời chỉ có một request thành công.
- Vé sai tuyến, hết hạn, đã dùng hoặc không thuộc chuyến phải trả thông báo cụ thể và không thay đổi dữ liệu.
- Màn vé tháng phải lấy vé theo `tripId` đang chọn, không dùng danh sách dashboard chung.
- CTA “Xem danh sách chuyến” phải mở đúng danh sách chuyến; CTA quét vé phải có nhãn riêng.
- Số liệu dashboard, dòng mô tả chuyến và danh sách thực tế phải dùng cùng nguồn dữ liệu và không mâu thuẫn.

## Tracking và GPS

- API tracking thật không dựng xe giả từ lịch chạy.
- Danh sách xe gồm toàn bộ trip `RUNNING` có vị trí GPS đủ mới theo ngưỡng cấu hình hiện tại.
- Không dùng `LIMIT 1` cho fleet tracking.
- Mô phỏng GPS chỉ tồn tại trong simulator/demo đã tách riêng và phải gửi location qua API giống thiết bị thật; response tracking vẫn đánh dấu rõ nguồn dữ liệu khi cần.

## Các sửa lỗi kèm theo

- Sửa chuỗi mojibake ở trạng thái mật khẩu.
- Trạng thái đồ thất lạc `SEARCHING` không được thông báo là “Đã tìm thấy”.
- Endpoint tracking theo route phải kiểm tra quyền sở hữu/phân công, trừ khi được xác định rõ là endpoint công khai.
- Không thêm endpoint hoặc abstraction không có consumer thực tế.

## Dữ liệu và khôi phục

Test tự động ưu tiên mock hoặc transaction rollback. E2E dùng kịch bản demo có script reset hiện có. Không quét vé, bắt đầu hoặc kết thúc chuyến trên RDS nếu chưa xác nhận script reset chạy được và baseline dữ liệu đã được ghi nhận.

## Kiểm thử bắt buộc

### Backend

- Quét vé bị từ chối với `NOT_STARTED`, `NOT_CREATED`, `COMPLETED` và `CANCELLED`.
- Quét vé thành công với chuyến `RUNNING` hợp lệ.
- Vé lượt atomic dưới hai request cạnh tranh.
- Driver không bắt đầu/kết thúc/cập nhật vị trí cho chuyến không được phân công.
- Truy vấn lịch tôn trọng ngày được chọn.
- Tracking trả nhiều xe thật, bỏ GPS quá hạn và không tạo fallback giả.
- Test hiện có của hardening và test từ `TruongPhuc` cùng chạy qua sau khi hợp nhất.

### Frontend

- Lint và production build chạy qua.
- Driver: dashboard, lịch theo ngày, bắt đầu/kết thúc, timer, tracking, lịch sử và responsive.
- Phụ xe: danh sách chuyến, nhập mã vé thủ công, các trạng thái vé, vé tháng theo chuyến, mất đồ, sự cố, liên hệ và responsive.
- Không còn dữ liệu mâu thuẫn, CTA sai đích, chữ lỗi hoặc danh sách trạm bung quá mức.

## Điều kiện được merge vào DucHai

- Không còn conflict với baseline `DucHai` đã chốt.
- Toàn bộ backend test, frontend lint và frontend build chạy qua bằng lệnh đầy đủ.
- E2E Driver và Phụ xe qua các ca chính và ca lỗi nêu trên.
- Diff cuối không đưa lại GPS giả hoặc cơ chế quét vé ngoài trạng thái `RUNNING`.
- Không push hoặc tạo PR nếu chưa được người dùng yêu cầu.
