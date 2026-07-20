# Báo cáo kiểm thử production UniBus — 2026-07-16

## Baseline

- Production: `https://app.fudabus.store`
- Main deploy: `8aeaf0f8`
- ECS task definition: `unibus-prod:7`
- RDS: PostgreSQL 18.3
- Flyway: V17 `success=true`
- Snapshot trước seed: `unibus-before-demo-v2-20260716-1818`
- Demo seed/audit production: PASS, không có dòng FAIL

## Backend/API matrix

PASS:

- Đăng nhập đủ STUDENT, UNIVERSITY_ADMIN, DISPATCHER, DRIVER, CONDUCTOR, ADMIN.
- Student profile, registrations, history, feedback, lost items, chatbot history, notifications.
- University Admin profile, campuses, domains, roster.
- Dispatcher dashboard, fleet live, schedules, routes.
- Driver dashboard, trips, overview, contacts, feedback.
- Conductor dashboard, trips, incidents, lost items.
- Admin stats, fares, users, complaints, violations.

Lỗi phát hiện:

1. `GET /api/v1/students/me/tickets` trả 500 khi sinh viên chưa có approved registration.
   - PostgreSQL: `could not determine data type of parameter $2`.
   - UI che lỗi thành trạng thái “Chưa có vé”.
   - Fix trong PR #76: cast nullable `routeId` thành `integer`.
2. `GET /api/v1/conductor/contact` trả 500 khi không có active trip.
   - PostgreSQL: `could not determine data type of parameter $3`.
   - UI hiển thị danh bạ trống và toast nguyên lỗi database.
   - Fix trong PR #76: cast nullable `tripId` thành `integer`.

Backend tests sau fix: 101 passed, 0 failed.

## Visual test production

### Student

PASS:

- Dashboard đăng nhập và animation render, không có console error.
- Account `student.monthly` hiển thị vé tháng tuyến 16, thời hạn, QR area và trợ giá 100.000 → 50.000 đồng.
- UniBus Copilot render prompt gợi ý phù hợp bối cảnh FPT Đà Nẵng ↔ Duy Tân.
- Bell/unread badge và navigation hoạt động.

Issue:

- Account fresh `student.supported` mở tab vé đã mua sẽ thấy “Chưa có vé” thay vì lỗi tải do backend 500. Retest bắt buộc sau deploy PR #76.

### University Admin

PASS:

- Nhận đúng scope Trường Đại học Duy Tân.
- Dashboard có sinh viên, campus, tuyến, trợ giá, giao dịch, chart và đối soát.
- Không có console error trong visual smoke.

### Dispatcher

PASS:

- Dashboard hiển thị 3 xe vận hành, 14 chuyến đủ phân công, fleet cards và 8 tuyến.
- Tracking/list không có console error trong visual smoke.

### Conductor

PASS:

- Dashboard có chuyến được phân, sự cố và lost-item data.
- Menu QR, vé tháng, sự cố, mất đồ và liên hệ đều xuất hiện.

Issue:

- Contact screen hiển thị dữ liệu rỗng và toast database error do nullable query nêu trên.
- Card đầu trang báo có chuyến được phân nhưng nhóm statistic hiện 0 vì baseline chuyến ưu tiên đã hoàn tất; cần chọn đúng thời điểm/trip khi demo hoặc reset sát buổi trình bày.

### Driver/Admin

- API smoke PASS.
- Visual sâu chờ deploy PR #76 để chạy một vòng cuối trên cùng revision, tránh chụp bằng chứng trên hai bản backend khác nhau.

## Trạng thái

- PR #76 CI PASS nhưng chưa được approve/merge.
- Không tạo PR mới; toàn bộ seed hardening, runbook và hai fix PostgreSQL nằm trong PR #76.
- Sau merge cần: deploy ECS → retest hai endpoint 500 → visual smoke Driver/Admin → reset baseline → audit cuối.
