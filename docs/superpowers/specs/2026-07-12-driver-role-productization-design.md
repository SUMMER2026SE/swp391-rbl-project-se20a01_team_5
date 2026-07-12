# Driver Role Productization Design

## Mục tiêu

Hoàn thiện riêng role Driver thành một flow vận hành rõ ràng, thống nhất giữa Dashboard, Lịch chạy, Chuyến hiện tại và Lịch sử. Không thay đổi schema, Flyway, Student, Conductor hoặc Coordinator.

## Nguyên tắc nghiệp vụ

- UniBus dùng timezone `Asia/Ho_Chi_Minh` cho ngày phục vụ và cửa sổ khởi hành.
- Chuyến `RUNNING` chỉ được xem là đang chạy khi có `departedAt` và chưa có `endedAt`.
- Chuyến chưa bắt đầu quá 60 phút không còn là chuyến sắp tới.
- Tài xế chỉ có một chuyến đang chạy; start/end tiếp tục dùng update atomic hiện tại.
- Xe tới điểm cuối không tự ghi `COMPLETED`; UI yêu cầu tài xế xác nhận kết thúc để lịch sử và thời gian thực tế chính xác.
- Tracking luôn theo `tripId`, không lấy một xe bất kỳ cùng tuyến.

## Trải nghiệm

### Dashboard

- Header gọn, không dùng khối neon chiếm toàn chiều ngang.
- Chuyến đang chạy là card ưu tiên số một, hiển thị tuyến, biển số, phụ xe, thời điểm khởi hành và CTA `Mở chuyến hiện tại`.
- Nếu xe đã tới điểm cuối, card đổi trạng thái thành `Chờ kết thúc chuyến`.
- Chuyến sắp tới luôn hiển thị cả ngày và giờ để không nhầm lịch tuần sau là lịch đã quá giờ hôm nay.
- Thống kê chỉ phản ánh dữ liệu hôm nay.

### Lịch chạy và chuyến hiện tại

- Mọi màn dùng chung cách tính thời điểm lịch theo giờ Việt Nam.
- Chuyến không được bắt đầu phải hiển thị lý do ngay trên CTA.
- Danh sách phân công không lặp card đang được chọn.
- Bản đồ chỉ xuất hiện cho chuyến đang chạy; khi tới điểm cuối hiển thị hành động kết thúc rõ ràng.

### Lịch sử

- Timeline dọc, không dùng các card nặng và lặp thông tin.
- Mỗi dòng có ngày, tuyến, biển số, phụ xe, giờ bắt đầu/kết thúc thực tế, thời lượng và trạng thái.
- Chỉ gọi API lịch sử một lần khi mở màn; không reload lại do dependency state thay đổi.

## Phạm vi kỹ thuật

- Backend giữ hardening hiện tại và bổ sung test cho cách chọn chuyến đang chạy/sắp tới nếu cần.
- Frontend tập trung trong `driver-module.tsx`; không tách component lớn hoặc thêm dependency mới.
- Client API giữ adapter tracking theo `/tracking/trips/{tripId}`.
- Demo SQL chỉ chỉnh nếu audit chứng minh dữ liệu Driver không đúng; không reset live RDS tự động.

## Kiểm thử

- Backend Driver tests và full backend tests.
- Frontend lint, production build và `git diff --check`.
- Visual test các màn Dashboard, Lịch chạy, Chuyến hiện tại và Lịch sử bằng `driver.demo@unibus.local`.
- Không thực hiện start/end chuyến trên live RDS trong visual test nếu chưa cần xác minh mutation.
