# Báo cáo thanh lọc RDS transport demo UniBus

Ngày thực hiện: 2026-06-26  
Môi trường: RDS demo `postgresdemo`, ECS `unibus-dev-cluster/unibus-dev-service`

## Mục tiêu

- Làm sạch dữ liệu tuyến/trạm để demo và AI không dùng dữ liệu kiểu `ITER`, `DEMO seed stop`, tuyến prototype hoặc route/stop thiếu code.
- Giữ lại tài khoản demo cần thiết cho flow đăng nhập, đăng ký tuyến, mua vé, SePay và quét QR.
- Chuẩn hóa dataset nhỏ nhưng ổn định cho demo trước; không claim các route `UB-DN-*` là tuyến DanaBus chính thức.

## Nguồn tham khảo

- DanaBus/Danangbus: `https://www.danangbus.vn/`
- Trang điểm dừng tuyến 21 DanaBus: `https://www.danangbus.vn/tin-tuc/tin-tuc/diem-dung-chieu-di-tuyen-buyt-21-5519.html`
- BusMap Đà Nẵng để cross-check UI/bản đồ khi truy cập được: `https://map.busmap.vn/dn/route/1`

Chính sách dữ liệu: tên địa điểm/trạm dựa trên nguồn công khai và địa điểm trường học; giá vé là `DEMO_POLICY` của UniBus, không phải bảng giá chính thức DanaBus.

## Snapshot và maintenance

- Snapshot trước reset: `unibus-pre-transport-cleanup-20260626-192052`
- Snapshot status: `available`
- Backend ECS đã được tạm scale desired count về `0` trong lúc reset, sau đó restore về desired `1`.
- Trạng thái sau restore: service running `1`, rollout completed, task definition `unibus-dev:30`.

## Script đã thêm/cập nhật

- `database/AuditRdsTransportData.sql`: audit read-only cho Flyway, route/stop missing code, demo rows, orphan/duplicate stop order, fare, route university và demo account flow.
- `database/ResetDemoTransportData.sql`: reset dữ liệu giao dịch + transport theo thứ tự FK, giữ user/student/staff/university.
- `database/SeedCanonicalDanangBusData.sql`: seed idempotent stop/route/fare/schedule/trip canonical bằng `route_code` và `stop_code`.
- `database/SeedCompleteDemoFlow.sql`: cập nhật demo flow dùng route canonical `UB-DN-01`, reset `student.flow@unibus.local` về trạng thái brand-new verified.

## Kết quả audit sau reset

```text
flyway_latest=13
routes_total=6
active_routes=6
routes_missing_code=0
routes_demo_seed_like=0
stops_total=12
active_stops=12
stops_missing_code=0
stops_demo_seed_like=0
route_stops=29
active_routes_less_than_two_stops=0
active_routes_missing_fares=0
active_route_universities=6
schedules=9
today_trips=6
running_trips=1
student_flow_exists=1
student_flow_transactional_rows=0
```

Canonical routes:

| Code | Tên tuyến | Stops | Vé lượt | Vé tháng |
| --- | --- | ---: | ---: | ---: |
| `UB-DN-01` | UniBus 01: Bách khoa - FPT | 6 | 7,000 | 120,000 |
| `UB-DN-02` | UniBus 02: Bến xe - Kinh tế - FPT | 5 | 9,000 | 150,000 |
| `UB-DN-03` | UniBus 03: Trung tâm - Biển Đông - Kinh tế | 5 | 8,000 | 135,000 |
| `UB-DN-04` | UniBus 04: Bách khoa - Duy Tân - VKU | 5 | 10,000 | 165,000 |
| `UB-DN-05` | UniBus 05: Bến xe - Bách khoa - Sư phạm | 4 | 6,000 | 110,000 |
| `UB-DN-06` | UniBus 06: FPT - VKU - Kinh tế | 4 | 8,000 | 140,000 |

Demo trip chính:

- `UB-DN-01` đang `RUNNING`.
- Driver: `driver.demo@unibus.local`
- Conductor: `conductor.demo@unibus.local`

## Smoke test CloudFront

Base URL: `https://d8xawk4fn4vfd.cloudfront.net`

- Login `student.flow@unibus.local / Password123!`: OK.
- `GET /api/v1/stops`: trả 12 canonical stops.
- `GET /api/v1/routes/search?boardingStopId=<DN-ST-BKDN>&alightingStopId=<DN-ST-FPT>`: trả 2 tuyến hợp lệ, gồm `UB-DN-01`.
- `GET /api/v1/students/me/route-registrations/current`: chưa có registration, đúng trạng thái brand-new verified.

Ghi chú: endpoint AI `POST /api/v1/students/me/route-suggestions` trên CloudFront vẫn cần deploy backend code mới để siết lọc direct stop match bằng stop order. Dữ liệu RDS đã sạch; phần fix code nằm ở `RouteSuggestionService`.

## Recovery

Nếu cần quay lại trạng thái trước cleanup, restore snapshot:

```text
unibus-pre-transport-cleanup-20260626-192052
```

Nếu chỉ cần reset lại demo nhanh trước buổi demo:

1. Tạm dừng backend hoặc scale ECS service về `0`.
2. Chạy `database/ResetDemoTransportData.sql`.
3. Chạy `database/SeedCanonicalDanangBusData.sql`.
4. Chạy `database/SeedCompleteDemoFlow.sql`.
5. Chạy `database/AuditRdsTransportData.sql`.
6. Restore ECS desired count về `1`.
