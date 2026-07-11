# TruongPhuc Driver and Conductor Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tích hợp chọn lọc UI/UX tốt của Driver và Phụ xe từ `origin/TruongPhuc` vào hardening hiện tại mà không đưa lại quét vé ngoài trạng thái `RUNNING`, GPS giả hoặc tracking một xe.

**Architecture:** Tạo nhánh `codex/integrate-truongphuc-roles` trong worktree cô lập, chuyển nguyên trạng hardening chưa commit sang đó rồi commit thành baseline. Mỗi luồng backend được khóa bằng test trước; frontend chỉ port các hunk UI cần thiết, dùng API và helper hiện có, không thêm dependency hoặc abstraction mới.

**Tech Stack:** Java 21, Spring Boot 4, JdbcTemplate, JUnit 5/Mockito/AssertJ, PostgreSQL/H2 tests, Next.js 16, React 19, TypeScript, Framer Motion, Tailwind CSS.

---

## File map

- `backend/src/main/java/com/unibus/api/operations/OperationsRepository.java`: truy vấn lịch Driver/Phụ xe, tạo trip, atomic ticket use, live fleet.
- `backend/src/main/java/com/unibus/api/operations/OperationsService.java`: quyền Driver, vòng đời chuyến và luật quét vé.
- `backend/src/main/java/com/unibus/api/operations/DriverTripController.java`: endpoint Driver và route tracking.
- `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`: thông báo trạng thái đồ thất lạc.
- `backend/src/main/java/com/unibus/api/transport/JourneyTrackingService.java`: tracking route/fleet bằng GPS thật.
- `backend/src/test/java/com/unibus/api/operations/OperationsRepositoryTests.java`: regression test SQL lịch và tạo trip.
- `backend/src/test/java/com/unibus/api/operations/OperationsServiceTests.java`: regression test scan và quyền chuyến.
- `backend/src/test/java/com/unibus/api/transport/JourneyTrackingServiceTests.java`: regression test nhiều xe/GPS quá hạn.
- `frontend/src/components/bus/roles/driver-module.tsx`: UI và hành vi Driver.
- `frontend/src/components/bus/roles/assistant-module.tsx`: UI và hành vi Phụ xe.
- `frontend/src/components/m3/journey-map.tsx`: vòng đời animation frame của bản đồ.
- `frontend/src/lib/api/client.ts`: type/API Driver và Phụ xe.
- `docs/full-e2e-role-business-ui-test-report-2026-07-11.md`: bổ sung kết quả integration E2E.

### Task 1: Tạo worktree và chốt hardening baseline

**Files:**
- Preserve: toàn bộ tracked diff hiện tại so với `DucHai`
- Copy: `backend/src/main/java/com/unibus/api/operations/DemoFleetSimulator.java`
- Copy: `backend/src/test/java/com/unibus/api/operations/DemoFleetSimulatorTests.java`
- Copy: `backend/src/test/java/com/unibus/api/transport/**`
- Copy: `docs/coordinator-flow-fleet-tracking-hardening-log.md`
- Copy: `docs/full-e2e-role-business-ui-test-report-2026-07-11.md`

- [ ] **Step 1: Tạo worktree trên nhánh tích hợp**

Run:

```powershell
git worktree add .worktrees/integrate-truongphuc-roles -b codex/integrate-truongphuc-roles
```

Expected: worktree sạch tại `.worktrees/integrate-truongphuc-roles`, không thay đổi working tree `DucHai` hiện tại.

- [ ] **Step 2: Chuyển tracked diff hiện tại sang worktree**

Run từ root hiện tại:

```powershell
git diff --binary HEAD | git -C .worktrees/integrate-truongphuc-roles apply --whitespace=nowarn -
```

Expected: diff trong worktree tương ứng với hardening hiện tại; bốn rename script RDS vẫn giữ đúng nội dung working tree.

- [ ] **Step 3: Copy các file hardening chưa tracked**

Copy đúng các path trong mục Files, loại trừ `.zcode/`. Kiểm tra từng target nằm dưới `.worktrees/integrate-truongphuc-roles` trước khi copy.

- [ ] **Step 4: Cài dependency và chạy baseline đầy đủ**

Run:

```powershell
cd .worktrees/integrate-truongphuc-roles/frontend
npm ci
npm run lint
npm run build
cd ../backend
./mvnw test
```

Expected: lint không có error, production build exit 0, Maven báo 0 failure và 0 error. Nếu baseline fail, dừng integration và sửa/ghi nhận baseline trước.

- [ ] **Step 5: Commit baseline trong nhánh tích hợp**

```powershell
git add --all
git commit -m "chore: preserve fleet tracking hardening baseline"
```

Expected: commit chỉ nằm trên `codex/integrate-truongphuc-roles`; working tree `DucHai` gốc không bị sửa hoặc dọn.

### Task 2: Khóa đúng lịch và vòng đời chuyến Driver

**Files:**
- Modify: `backend/src/main/java/com/unibus/api/operations/OperationsRepository.java`
- Modify: `backend/src/main/java/com/unibus/api/operations/OperationsService.java`
- Test: `backend/src/test/java/com/unibus/api/operations/OperationsRepositoryTests.java`
- Test: `backend/src/test/java/com/unibus/api/operations/OperationsServiceTests.java`

- [ ] **Step 1: Viết test fail cho lọc ngày và trip chưa tạo**

Thêm test repository tạo một trip `RUNNING` ngày A và truy vấn ngày B:

```java
@Test
void findDriverTripsDoesNotLeakRunningTripFromAnotherDate() {
    LocalDate requested = LocalDate.of(2026, 7, 11);
    seedDriverScheduleAndTrip(requested.minusDays(1), "RUNNING");

    List<DriverTripView> trips = operationsRepository.findDriverTrips(10, requested);

    assertThat(trips).noneMatch(trip -> requested.minusDays(1).equals(trip.serviceDate()));
}

private void seedDriverScheduleAndTrip(LocalDate serviceDate, String status) {
    jdbcTemplate.update("""
            INSERT INTO users(user_id, email, password_hash, full_name, role, status, student_verification_status, created_at)
            VALUES (1, 'driver@example.com', 'unused', 'Driver One', 'DRIVER', 'ACTIVE', 'NOT_SUBMITTED', CURRENT_TIMESTAMP)
            """);
    jdbcTemplate.update("INSERT INTO drivers(driver_id, user_id) VALUES (10, 1)");
    jdbcTemplate.update("""
            INSERT INTO routes(route_id, route_name, is_circular, status, created_at)
            VALUES (100, 'Campus Loop', FALSE, 'ACTIVE', CURRENT_TIMESTAMP)
            """);
    jdbcTemplate.update("INSERT INTO buses(bus_id, license_plate) VALUES (200, '43B-TEST')");
    jdbcTemplate.update("""
            INSERT INTO bus_schedules(schedule_id, route_id, bus_id, driver_id, weekday_number, departure_time)
            VALUES (300, 100, 200, 10, ?, ?)
            """, serviceDate.getDayOfWeek().getValue(), LocalTime.of(7, 30));
    jdbcTemplate.update("""
            INSERT INTO trips(trip_id, schedule_id, route_id, bus_id, driver_id, service_date, status)
            VALUES (400, 300, 100, 200, 10, ?, ?)
            """, serviceDate, status);
}
```

Thêm import `OperationsDtos.DriverTripView`. Không tạo endpoint start mới cho `NOT_CREATED`; frontend sẽ không gọi endpoint cho bản ghi không có `tripId`.

- [ ] **Step 2: Chạy test và xác nhận RED**

```powershell
cd backend
./mvnw -Dtest=OperationsRepositoryTests,OperationsServiceTests test
```

Expected: test lọc ngày fail nếu query còn `OR t.status = 'RUNNING'`.

- [ ] **Step 3: Sửa SQL nhỏ nhất tại nguồn**

Giữ điều kiện chính xác:

```sql
WHERE t.driver_id = ?
  AND t.service_date = ?
```

và lịch sử:

```sql
WHERE t.driver_id = ?
  AND t.service_date BETWEEN ? AND ?
```

Không thêm dedupe frontend để che row SQL trùng. Giữ `NOT_CREATED` chỉ để hiển thị lịch; thao tác start phải đi qua trip thật đã được `ensureTrip` tạo.

- [ ] **Step 4: Chạy test và xác nhận GREEN**

Run lại command ở Step 2. Expected: các test mục tiêu pass.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/unibus/api/operations/OperationsRepository.java backend/src/main/java/com/unibus/api/operations/OperationsService.java backend/src/test/java/com/unibus/api/operations/OperationsRepositoryTests.java backend/src/test/java/com/unibus/api/operations/OperationsServiceTests.java
git commit -m "fix: enforce driver trip date and identity"
```

### Task 3: Giữ scan ticket an toàn và lấy phần tốt từ TruongPhuc

**Files:**
- Modify: `backend/src/main/java/com/unibus/api/operations/OperationsRepository.java`
- Modify: `backend/src/main/java/com/unibus/api/operations/OperationsService.java`
- Test: `backend/src/test/java/com/unibus/api/operations/OperationsServiceTests.java`

- [ ] **Step 1: Bổ sung test fail cho mọi trạng thái đóng**

Thêm parameterized test hoặc bốn test nhỏ xác nhận chỉ `RUNNING` được đi tiếp:

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@ParameterizedTest
@ValueSource(strings = {"NOT_STARTED", "NOT_CREATED", "COMPLETED", "CANCELLED"})
void scanRejectsEveryTripThatIsNotRunning(String status) {
    when(operationsRepository.tripRouteInfo(TRIP_ID))
            .thenReturn(Optional.of(new TripRouteInfo(
                    TRIP_ID, ROUTE_A, LocalDate.now(), LocalTime.NOON, null, null, status)));

    TicketScanResult result = operationsService.scanTicket(
            conductor, new TicketScanRequest(TRIP_ID, "QR-A"));

    assertThat(result.valid()).isFalse();
    verify(operationsRepository, never()).findMonthlyTicketByQr(anyString());
    verify(operationsRepository, never()).findSingleTicketByQr(anyString());
}
```

Giữ test `singleTicketScanDoesNotCreateHistoryWhenAtomicUseFails` để khóa cập nhật atomic.

- [ ] **Step 2: Xác nhận test chống hồi quy**

Run:

```powershell
cd backend
./mvnw -Dtest=OperationsServiceTests test
```

Expected: test fail nếu áp dụng nguyên `scanWindowBlock` từ `TruongPhuc`.

- [ ] **Step 3: Port tối thiểu thông báo và atomic use**

Giữ guard trung tâm:

```java
if (!"RUNNING".equals(status)) {
    return new TicketScanResult(false, "Tài xế chưa bắt đầu chuyến.", null, null);
}
```

Giữ `UPDATE ... WHERE status = 'UNUSED'` trả row count; khi row count là 0, đọc lại ticket và trả lỗi “đã sử dụng” mà không tạo travel history.

- [ ] **Step 4: Chạy test mục tiêu rồi full backend**

```powershell
./mvnw -Dtest=OperationsServiceTests test
./mvnw test
```

Expected: 0 failure, 0 error.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/unibus/api/operations/OperationsRepository.java backend/src/main/java/com/unibus/api/operations/OperationsService.java backend/src/test/java/com/unibus/api/operations/OperationsServiceTests.java
git commit -m "fix: keep conductor scans running-only and atomic"
```

### Task 4: Tích hợp UI Driver mà không kéo theo logic demo

**Files:**
- Modify: `frontend/src/components/bus/roles/driver-module.tsx`
- Modify only if used: `frontend/src/lib/api/client.ts`

- [ ] **Step 1: Ghi nhận hành vi fail trước khi sửa**

Khởi động app integration ở port riêng và ghi nhận bằng browser:

- đổi ngày nhưng còn chuyến `RUNNING` ngày khác;
- timer về gần 0 sau khi chuyển màn hình;
- card `NOT_CREATED` có khả năng gọi start với id rỗng;
- màn đang chạy bung toàn bộ trạm và lặp chuyến.

- [ ] **Step 2: Port card/timeline có chọn lọc**

Chỉ mang các component trình bày từ `origin/TruongPhuc`: hero chuyến đang chạy, stat card, timeline thu gọn, trạng thái và responsive spacing. Không port `driverTripOverview` nếu không có consumer thực tế và không port route tracking thiếu ownership check.

- [ ] **Step 3: Sửa timer từ timestamp thật**

Đổi helper thành phép tính dựa trên `departedAt`:

```tsx
function elapsedSeconds(departedAt?: string | null, now = Date.now()): number {
  if (!departedAt) return 0;
  const startedAt = Date.parse(departedAt);
  return Number.isFinite(startedAt) ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
}
```

Interval chỉ cập nhật `now`; không giữ bộ đếm bắt đầu từ 0.

- [ ] **Step 4: Chặn start không có trip thật và thu gọn stops**

```tsx
const canStart = Number.isInteger(trip.tripId) && trip.status === "NOT_STARTED";
```

Chỉ render CTA start khi `canStart`. Danh sách trạm dùng collapsed state mặc định và khóa card theo `tripId`, fallback `scheduleId-serviceDate-departureTime`.

- [ ] **Step 5: Kiểm tra frontend**

```powershell
cd frontend
npm run lint
npm run build
```

Expected: 0 lint error và build exit 0.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/components/bus/roles/driver-module.tsx frontend/src/lib/api/client.ts
git commit -m "feat: integrate hardened driver experience"
```

### Task 5: Tích hợp UI Phụ xe và scope vé theo chuyến

**Files:**
- Modify: `frontend/src/components/bus/roles/assistant-module.tsx`
- Reuse: `frontend/src/lib/api/client.ts`

- [ ] **Step 1: Ghi nhận hành vi fail trước khi sửa**

Qua browser, ghi nhận CTA “Xem danh sách chuyến” đi sang scan, dashboard số 0 nhưng có chuyến và màn vé tháng dùng `ctx.tickets` chung.

- [ ] **Step 2: Scope màn vé tháng bằng trip selector riêng**

Trong `AssistantMonthly`, thêm local state `tripId`, chọn mặc định trip `RUNNING` đầu tiên và hiển thị `Select` giống màn scan. Khi `tripId` đổi, gọi:

```tsx
const tickets = await operationsApi.conductorTickets(selectedTripId);
```

Sau đó lọc `ticketKind` là `MONTHLY` hoặc `JOURNEY_MONTHLY`; không đọc `ctx.tickets` để hiển thị theo chuyến. Không tạo global store chỉ để chia sẻ lựa chọn giữa hai màn.

- [ ] **Step 3: Port filter, audit và debounce từ TruongPhuc**

Port các filter `all/single/monthly/scanned/unscanned`, chi tiết kết quả và danh sách quét gần đây. Dùng `useRef` lưu `{code, at}` để bỏ request trùng trong 2,5 giây; backend vẫn là nguồn chống race chính.

- [ ] **Step 4: Giữ gate RUNNING ở frontend**

```tsx
function isTripOpenForScan(trip: any): boolean {
  return hasTripIdentity(trip) && String(trip.rawStatus || trip.status).toUpperCase() === "RUNNING";
}
```

Không port comment hoặc logic “demo mode keeps scanning open”.

- [ ] **Step 5: Sửa CTA và dashboard consistency**

Vì `ast-dashboard` đã chính là màn “Chuyến được phân” và không có screen danh sách riêng, đổi CTA đang điều hướng sang `ast-scan` từ “Xem danh sách chuyến” thành “Quét vé chuyến này”; không tạo thêm screen `ast-trips`. Stat “Chuyến” lấy từ cùng `ctx.conductorTrips` được render, không từ một counter dashboard khác ngày.

- [ ] **Step 6: Kiểm tra frontend và commit**

```powershell
cd frontend
npm run lint
npm run build
git add src/components/bus/roles/assistant-module.tsx src/lib/api/client.ts
git commit -m "feat: integrate hardened conductor experience"
```

Expected: lint/build pass; không còn usage `ctx.tickets` trong `AssistantMonthly`.

### Task 6: Giữ tracking thật và sửa lỗi dùng chung an toàn

**Files:**
- Modify only if needed: `backend/src/main/java/com/unibus/api/transport/JourneyTrackingService.java`
- Modify: `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`
- Modify: `backend/src/main/java/com/unibus/api/operations/DriverTripController.java`
- Modify: `frontend/src/components/m3/journey-map.tsx`
- Test: `backend/src/test/java/com/unibus/api/transport/JourneyTrackingServiceTests.java`

- [ ] **Step 1: Chạy test tracking hardening trước**

```powershell
cd backend
./mvnw -Dtest=JourneyTrackingServiceTests test
```

Expected: test khóa nhiều xe, GPS stale và không fallback giả.

- [ ] **Step 2: Port duy nhất lifecycle fix của journey map**

Giữ id của `requestAnimationFrame` và gọi `cancelAnimationFrame(frameId)` trong cleanup. Không port `scheduledRouteVehicle`, cờ simulated hoặc `LIMIT 1` từ `TruongPhuc`.

- [ ] **Step 3: Sửa notification đồ thất lạc**

Mapping rõ ràng:

```java
case "SEARCHING" -> "Đang tìm đồ thất lạc";
case "FOUND", "RESOLVED" -> "Đã tìm thấy đồ thất lạc";
case "RETURNED", "CLOSED" -> "Đã trả đồ thất lạc";
```

- [ ] **Step 4: Bỏ endpoint thừa hoặc thêm ownership check**

Nếu `/driver/trips/routes/{routeId}/tracking` không có consumer thì không port. Nếu UI thực sự dùng, service phải xác nhận route thuộc trip được phân cho Driver hiện tại trước khi trả tracking.

- [ ] **Step 5: Chạy test/build và commit**

```powershell
cd backend
./mvnw test
cd ../frontend
npm run lint
npm run build
git add ../backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java ../backend/src/main/java/com/unibus/api/operations/DriverTripController.java ../backend/src/main/java/com/unibus/api/transport/JourneyTrackingService.java src/components/m3/journey-map.tsx
git commit -m "fix: preserve real fleet tracking during role integration"
```

### Task 7: Full verification và E2E hai role

**Files:**
- Modify: `docs/full-e2e-role-business-ui-test-report-2026-07-11.md`

- [ ] **Step 1: Kiểm tra diff chống hồi quy**

```powershell
rg -n "demo mode keeps scanning|scheduledRouteVehicle|LIMIT 1|\?\? C\? M\?T KH\?U" backend/src frontend/src
git diff DucHai...HEAD --check
```

Expected: không có GPS fallback, scan demo hoặc mojibake; diff check sạch.

- [ ] **Step 2: Chạy full automated verification mới**

```powershell
cd backend
./mvnw test
./mvnw package -DskipTests
cd ../frontend
npm run lint
npm run build
```

Expected: tất cả command exit 0; ghi chính xác test count và warning count.

- [ ] **Step 3: Reset kịch bản demo có kiểm soát**

Chạy `database/RunDemoData.ps1` theo chế độ reset hiện có, sau đó chạy audit script. Không tiếp tục E2E nếu audit báo duplicate assignment/trip hoặc trạng thái không khớp.

- [ ] **Step 4: E2E Driver**

Test không nhảy cóc: dashboard, lịch theo hai ngày khác nhau, trip chưa tạo, bắt đầu, timer qua điều hướng, tracking/location, kết thúc, lịch sử, hỗ trợ, thông báo, hồ sơ và viewport mobile. Sau test, reset scenario.

- [ ] **Step 5: E2E Phụ xe**

Test không nhảy cóc: dashboard, danh sách chuyến, không quét trước `RUNNING`, nhập code hợp lệ, scan trùng, sai tuyến, hết hạn, đã dùng, vé tháng theo trip, mất đồ, sự cố, liên hệ, thông báo, hồ sơ và viewport mobile. Sau test, reset scenario.

- [ ] **Step 6: Cập nhật báo cáo và commit**

Ghi evidence, dữ liệu đã thay đổi/reset, lỗi còn lại và quyết định merge vào báo cáo.

```powershell
git add docs/full-e2e-role-business-ui-test-report-2026-07-11.md
git commit -m "test: verify integrated driver and conductor flows"
```

- [ ] **Step 7: Chốt nhưng không push**

```powershell
git status --short
git log --oneline DucHai..HEAD
```

Expected: worktree sạch, các commit chỉ nằm local trên `codex/integrate-truongphuc-roles`. Báo cáo cho người dùng; không merge, push hoặc tạo PR khi chưa có yêu cầu mới.
