# Plan tích hợp Driver mới từ TruongPhuc

## Kết luận audit

- Nguồn tham khảo: `origin/TruongPhuc` tại `0623674d`, PR #63.
- PR #63 pass CI và không conflict văn bản với `DucHai`, nhưng không merge/cherry-pick nguyên khối vì lẫn phụ xe, tracking dùng chung, script dữ liệu cũ và thay đổi menu ngoài phạm vi Driver.
- Working tree `DucHai` đã có một phần lifecycle và trip-specific tracking tốt hơn PR #63. Phải tích hợp thủ công trên trạng thái hiện tại, không ghi đè file dirty.
- Không thay đổi schema, không thêm Flyway, không chạy live RDS trong lúc tích hợp code.

## Phạm vi lấy

### 1. Lifecycle chuyến Driver

Các file:

- `backend/src/main/java/com/unibus/api/operations/OperationsRepository.java`
- `backend/src/main/java/com/unibus/api/operations/OperationsService.java`
- `backend/src/test/java/com/unibus/api/operations/DriverOperationsServiceTests.java`

Thực hiện:

- Start atomic: chỉ update trip `NOT_STARTED`.
- End atomic: chỉ update trip `RUNNING`.
- Dùng query `hasOtherRunningTrip(driverId, tripId)` thay cho tải toàn bộ chuyến rồi lọc trong Java.
- Driver chỉ bắt đầu chuyến từ 30 phút trước đến 60 phút sau giờ khởi hành.
- Dùng `Asia/Ho_Chi_Minh` cho ngày hiện tại, cửa sổ bắt đầu chuyến và phân loại upcoming/history.
- Update count bằng 0 phải trả conflict rõ ràng để chặn hai request đồng thời.
- Không giữ trạng thái lỗi `RUNNING` nhưng thiếu `departed_at`; sửa data demo thay vì nới lifecycle.

### 2. Overview và lịch sử Driver

Các file:

- `backend/src/main/java/com/unibus/api/operations/OperationsRepository.java`
- `backend/src/main/java/com/unibus/api/operations/OperationsService.java`
- `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`

Thực hiện:

- Tách rõ chuyến đang chạy, chuyến sắp tới và lịch sử hoàn thành/hủy.
- Không hiện trip `NOT_STARTED` đã quá cửa sổ khởi hành như chuyến sắp tới.
- Không tạo card `NOT_CREATED` cho lịch lặp đã hết cửa sổ trong ngày; chuyển sang lần chạy hợp lệ kế tiếp.
- Loại trùng giữa card chuyến hiện tại và danh sách chuyến tiếp theo.
- Query overview/history dùng mapper không load stop; chỉ màn cần chi tiết mới load stop để tránh N+1.

### 3. Tracking đúng chuyến

Các file:

- `backend/src/main/java/com/unibus/api/operations/DriverTripController.java`
- `backend/src/main/java/com/unibus/api/operations/OperationsService.java`
- `backend/src/main/java/com/unibus/api/transport/JourneyTrackingService.java`
- `frontend/src/lib/api/client.ts`
- `frontend/src/components/bus/roles/driver-module.tsx`

Thực hiện:

- Không lấy implementation PR #63 gọi `routeSnapshot(routeId)`, vì tuyến có nhiều xe có thể trả vị trí xe khác.
- Giữ `tripSnapshot(tripId)` hiện có để tracking đúng xe/chuyến.
- Kiểm tra trip thuộc tài xế đăng nhập trước khi trả snapshot.
- Không đổi thuật toán mô phỏng, icon xe, map style hoặc tracking sinh viên/điều phối.
- Không lấy rewrite lớn của `JourneyTrackingService` ngoài phần khóa đúng `tripId`.

### 4. UI Driver

Các file:

- `frontend/src/components/bus/roles/driver-module.tsx`
- `frontend/src/components/bus/nav-config.ts`

Thực hiện:

- Giữ layout tốt từ Driver mới: `Chuyến hiện tại`, timer theo `departedAt`, card chuyến sắp tới, map chuyến đang chạy và lịch sử rõ trạng thái.
- Giữ style UniBus hiện tại, không tự redesign UI của thành viên.
- Giữ `Thông báo` và `Hồ sơ cá nhân`; không lấy việc xóa hai menu này từ PR #63.
- Tạm giữ `Tuyến được phân` nếu còn screen/điều hướng phụ thuộc; chỉ bỏ khi nội dung đã được thay thế hoàn toàn.
- Key card dùng `tripId`, hoặc fallback `scheduleId/serviceDate/departureTime`; không dùng key có thể là `null`.
- Frontend chỉ hỗ trợ trạng thái UX; backend vẫn quyết định cuối cùng cho start/end.

### 5. Demo data và script

Các file:

- `database/SeedDemoDataUntilAugust.sql`
- `database/ResetDemoScenario.sql`
- `database/AuditDemoDataUntilAugust.sql`
- `docs/demo-practice-checklist.md`

Thực hiện sau khi code Driver ổn:

- Không lấy `database/RepairBaselineTripSchedules.sql` và không lấy lại script `Stable` cũ.
- Không để trip `RUNNING` thiếu `schedule_id`, driver/conductor hoặc `departed_at`.
- Giữ đội xe production-like nhưng chỉ 3–4 xe `RUNNING`; xe còn lại là chuyến chờ/sắp tới để live fleet khớp lịch vận hành.
- Driver demo có tối thiểu một chuyến hoàn thành, một chuyến có thể bắt đầu trong cửa sổ demo và một chuyến tương lai.
- Audit kiểm tra số trip running khớp live fleet, mọi trip Driver demo có schedule, không có driver chạy hai trip cùng lúc và status/timestamp nhất quán.
- Chỉ apply live RDS sau khi dry-run rollback thành công và được xác nhận riêng.

## Không lấy từ PR #63

- Thay đổi role phụ xe.
- Rewrite tracking chung hoặc tracking sinh viên/điều phối.
- `database/RepairBaselineTripSchedules.sql`.
- `AGENTS.md`, `.gitignore` và script `Stable` cũ.
- Việc xóa menu Driver `Thông báo`, `Hồ sơ cá nhân`.
- Endpoint Driver tracking dựa trên route thay vì trip.

## Test plan

### Backend

- Start đúng tại biên `-30 phút` và `+60 phút`.
- Reject trước `-30 phút` và sau `+60 phút`.
- Reject trip không thuộc driver.
- Reject khi driver có trip khác `RUNNING`.
- Hai request start đồng thời: chỉ một update thành công.
- End chỉ thành công với trip `RUNNING`; end lặp lại bị từ chối.
- Overview dùng ngày Việt Nam và không đưa trip quá giờ vào upcoming.
- Tracking chỉ trả vehicle đúng `tripId` của driver.

```powershell
./mvnw.cmd -f backend/pom.xml -DskipTests compile
./mvnw.cmd -f backend/pom.xml -Dtest=DriverOperationsServiceTests test
./mvnw.cmd -f backend/pom.xml test
```

### Frontend

- Dashboard Driver hiển thị đúng running/upcoming/history.
- `Chuyến hiện tại` không lặp cùng chuyến ở danh sách bên dưới.
- Start/end refresh đúng trạng thái và timer.
- Map chỉ hiển thị xe của trip đang chọn khi cùng tuyến có nhiều xe.
- Notification/profile vẫn truy cập được.

```powershell
npm run lint --prefix frontend
npm run build --prefix frontend
git diff --check
```

### Script dữ liệu

```powershell
powershell -ExecutionPolicy Bypass -File database/RunStableDemoData.ps1 -Mode Audit
```

- Trước khi apply RDS: chạy Seed/Reset trong transaction rollback hoặc database test tương đương.
- Không browser test trong lượt này theo yêu cầu tiết kiệm token; chỉ bật lại khi người dùng cho phép visual QA.

## Thứ tự triển khai

1. Giữ nguyên working tree dirty hiện tại.
2. Tích hợp lifecycle backend và test deterministic.
3. Giữ trip-specific tracking, thêm ownership guard.
4. Hòa UI Driver mới, không đụng phụ xe.
5. Chạy compile/test/lint/build/diff-check.
6. Chuẩn hóa script 13 xe thành 3–4 running.
7. Dry-run data, cập nhật audit và checklist demo.
8. Chỉ sau khi pass mới commit/push PR.
