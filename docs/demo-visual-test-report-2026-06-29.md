# UniBus Visual Demo Test Log — 2026-06-29

## Scope
- Browser target: `http://localhost:3000/`
- Backend target: `http://localhost:8080/`, live RDS `postgresdemo.czg6gi08udbc.ap-southeast-1.rds.amazonaws.com/postgres`
- Demo accounts used:
  - `student.supported@unibus.local`
  - `student.fullprice@unibus.local`
  - `conductor.demo@unibus.local`
  - `driver.demo@unibus.local`
  - `admin.demo@unibus.local`
  - `uniadmin.demo@unibus.local`
- Shared demo password: `Password123!`

## Pre-test State
- Stable demo seed had already been applied to live RDS.
- Audit initially passed for all demo accounts and trip coverage.
- App was already open in the in-app browser.

## Important Runtime Fix During Test
Visual test found the student journey detail still showing the old blocking copy:

> Hành trình này dùng tuyến chưa được trường của bạn liên kết để mua UniPass.

Code in the workspace already had the corrected full-price logic, but the running backend process still held an old loaded class in memory.

Actions taken:
1. Compiled backend with IntelliJ bundled Maven:
   - `cd backend`
   - `mvn -DskipTests compile` via `C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.2\plugins\maven\lib\maven3\bin\mvn.cmd`
   - Result: `BUILD SUCCESS`
2. Restarted backend process on port `8080` with live RDS env:
   - `DB_URL=jdbc:postgresql://postgresdemo.czg6gi08udbc.ap-southeast-1.rds.amazonaws.com:5432/postgres`
   - `DB_USERNAME=postgres`
   - `DB_PASSWORD=...`
   - `JWT_SECRET=change-this-to-a-long-secret-at-least-32-chars`
3. Confirmed `/api/v1/journeys/search` now returns:
   - `label = Mua giá thường`
   - `enabled = true`
   - `subsidyEligible = false`
   - `universityLinked = false`
   - `fullPriceAllowed = true`
   - `availabilityStatus = FULL_PRICE_ALLOWED`

## Student Full-price Flow
Account: `student.fullprice@unibus.local` / Ngô Quốc Bảo / Trường Đại học Duy Tân

Steps:
1. Logged in through the normal email/password form.
2. Dashboard loaded with:
   - University: `Trường Đại học Duy Tân`
   - Route card: `UniBus 04: Bách khoa - Duy Tân - VKU`
   - No current monthly purchase.
3. Opened `Tìm tuyến xe`.
4. Switched to `Tìm đường`.
5. Opened a journey detail for route `16`, path `Bến xe buýt Đại học Việt Hàn → 210 Tôn Đức Thắng`.
6. Verified corrected UI state:
   - Badge/copy: `Giá thường`
   - Message: `Tuyến này chưa thuộc chương trình hỗ trợ phí của trường bạn. Bạn vẫn có thể mua với giá thường.`
   - CTA: `Mua giá thường`
7. Clicked `Mua giá thường`.
8. App navigated to `Vé tháng & hóa đơn`.
9. Registration context displayed correctly:
   - Route: `Kim Liên-Đại học Việt Hàn`
   - Boarding: `Bến xe buýt Đại học Việt Hàn`
   - Alighting: `210 Tôn Đức Thắng`
10. Clicked `Tạo mã QR thanh toán`.
11. SePay QR screen displayed:
   - Amount: `100.000 ₫`
   - Bank: `MB`
   - Status: waiting for SePay confirmation.

Result: PASS. Duy Tân student is no longer blocked only because the university has no active linked routes. Public route full-price purchase can reach SePay QR.

## Conductor Flow
Account: `conductor.demo@unibus.local` / Trần Gia Hân

Steps:
1. Logged in through the normal email/password form.
2. Dashboard displayed non-ambiguous assignment state:
   - `Bạn có chuyến được phân công hôm nay.`
   - `UniBus 01: Bách khoa - FPT • 07:30:00`
3. Verified it no longer showed vague fallback like `Chuyến xe` or plate `—` as a complete running trip.
4. Opened `Quét vé`.
5. Scan screen displayed:
   - Trip selector: `UniBus 01: Bách khoa - FPT — 29 thg 6, 2026`
   - Warning: `Một số chuyến bị thiếu dữ liệu` for incomplete trips.
   - Ticket list with real demo students.
6. Manually entered QR code: `STABLE-DAY-SV-STABLE-DAY`.
7. Clicked `Quét vé`.
8. Result displayed:
   - `Vé hợp lệ`
   - Message: `Vé lượt hợp lệ. Đã ghi nhận sinh viên lên xe.`
   - Student: `Trần Hải Yến`
   - Ticket kind: `SINGLE`
   - Route: `UniBus 01: Bách khoa - FPT`
   - Ticket status: `USED`
   - Travel history id: `35`

Result: PASS. Conductor scan UI is usable with real seeded ticket and displays backend result clearly.

## Driver Flow
Account: `driver.demo@unibus.local` / Nguyễn Minh Tài

Steps:
1. Logged in through the normal email/password form.
2. Dashboard displayed:
   - Greeting for `Tài`
   - Role: `Tài xế`
   - Active trip card:
     - Plate: `43B-80808`
     - Route: `UniBus 01: Bách khoa - FPT`
   - `Chuyến hôm nay`: `12`
   - Upcoming trip entries with `07:30:00` and `17:30:00`.

Result: PASS. Driver has visible live demo data and no obvious missing route/plate issue.

## Admin Flow
Account: `admin.demo@unibus.local` / Nguyễn Minh Quân

Steps:
1. Logged in through the normal email/password form.
2. Dashboard displayed real operational metrics:
   - `47` active users
   - `2` trips today
   - `353.500 ₫` 7-day revenue before full-price test order appeared in transaction list.
   - `9` partner universities.
3. Opened `Lịch sử giao dịch`.
4. Verified transaction list includes the new full-price order from visual test:
   - Student: `Ngô Quốc Bảo`
   - University: `Trường Đại học Duy Tân`
   - Type: `Vé tháng`
   - Route labels: `Bến xe buýt Đại học Việt Hàn → 210 Tôn Đức Thắng`
   - Amount: `100.000 ₫ → 100.000 ₫`
   - Status: `Unpaid`
5. Verified subsidized demo order still shows V16 semantics:
   - Student: `Đặng Minh Khoa`
   - Amount: `140.000 ₫ → 70.000 ₫`
   - Status: `Paid`

Result: PASS. Admin transaction screen shows V16 original/final amounts and full-price order correctly.

## University Admin Flow
Account: `uniadmin.demo@unibus.local` / Lê Thu Hà

Steps:
1. Logged in through the normal email/password form.
2. Dashboard displayed `Đại học Demo UniBus` context.
3. Opened `Lịch sử giao dịch`.
4. Verified this is a transaction list, not reconciliation:
   - Copy: `Danh sách đơn thanh toán của sinh viên; không phải báo cáo đối soát theo kỳ.`
   - Rows for:
     - `Võ Nhật Nam`, unpaid monthly order.
     - `Đặng Minh Khoa`, paid monthly order.
   - Columns include `Giá gốc`, `Trợ giá`, `Sinh viên trả`.
5. Opened `Báo cáo đối soát`.
6. Verified copy is honest/limited:
   - `Tổng hợp theo kỳ, ưu tiên đơn thanh toán V16 và fallback vé tháng legacy khi chưa có dữ liệu đơn.`
   - Detail transaction fallback is visible.

Result: PASS with caveat. Transaction and reconciliation are semantically separated. Dashboard summary still showed `0 sinh viên` despite demo student transaction data being visible elsewhere; this should be tracked as a P2 metric-summary issue, not a blocker for tonight's core demo flow.

## Reset After Test
The visual test intentionally created mutable data:
- Full-price unpaid SePay order for `student.fullprice@unibus.local`.
- A used single-trip ticket scan for `student.day@unibus.local`.

Reset attempt initially failed because the scanned single ticket referenced a demo trip through `single_trip_tickets.used_on_trip_id`.

Fix applied to:
- `database/SeedStableDemoDataUntilAugust.sql`
- `database/ResetStableDemoScenario.sql`

Change:
- Before deleting demo trips, reset demo single-ticket scan FK fields:
  - `used_on_trip_id = NULL`
  - `scanned_by_conductor_id = NULL`
  - `status = 'UNUSED'`

Then ran:
- `"RESET DEMO" | powershell -NoProfile -ExecutionPolicy Bypass -File database\RunStableDemoData.ps1 -Mode Reset`
- `powershell -NoProfile -ExecutionPolicy Bypass -File database\RunStableDemoData.ps1 -Mode Audit`

Final audit result:
- `27/27 PASS`
- `student.day@unibus.local` ticket restored to `UNUSED`.
- Trips today restored.
- Coverage until `2026-08-31` restored.
- Full-price Duy Tân route-link condition still correct: `active_linked_routes=0`.

## Validation Commands
- Backend compile:
  - `cd backend && mvn -DskipTests compile` using IntelliJ bundled Maven
  - Result: PASS
- Backend restart:
  - Spring Boot started successfully on port `8080`
  - Flyway reported schema version `16`, no migration necessary.
- Frontend lint:
  - `cd frontend && npm run lint`
  - Result: PASS with 3 warnings, 0 errors.
  - Existing warnings:
    - `student-module.tsx` hook dependency warnings.
    - `journey-planner-desktop.tsx` `aria-selected` on button warning.
- Stable demo reset/audit:
  - Final `Audit`: PASS all 27 rows.

## Demo Readiness Verdict
Core demo flow is ready for tonight:
1. Student from Duy Tân can buy a public route at full price without university route link.
2. SePay QR order is created with full-price amount.
3. Conductor can scan a seeded real ticket and see a valid result.
4. Driver has assigned trip/live route data.
5. Admin can see the unpaid full-price order and subsidized orders in transaction history.
6. University admin can see separated transaction history and reconciliation wording.
7. Reset script can restore the scenario after practice/demo.

## Remaining Risks / TODO
- P2: University admin dashboard summary card showed `0 sinh viên` while transaction/history data exists for demo students. Likely summary query mismatch or active student metric definition.
- P2: Reconciliation remains order-first + fallback legacy monthly pass, not a mathematically complete hybrid de-dup reconciliation engine.
- P3: Frontend lint warnings should be cleaned later, but they do not block demo.
- P3: Old `stable.*@unibus.local` accounts may still exist on RDS unless explicitly cleaned with a separate confirmed cleanup script.

## Follow-up Demo Readiness Fixes — 2026-06-29 Evening

Scope:
- No schema/Flyway migration changes.
- No new roles, operator, or multi-operator logic.
- No `stu-stops` restore.
- No reconciliation rewrite or dashboard redesign.

Changes verified:
- University admin dashboard metric `Sinh viên đang hoạt động` was clarified to `Sinh viên có giao dịch`.
- Backend stats query now counts distinct students with UniBus activity/transaction/history, instead of returning a misleading zero from an unmatched roster-style metric.
- Demo naming was polished for visible/internal demo-owned values: payment refs/descriptions now use `DEMO-*` and Vietnamese demo descriptions where safe. Existing demo emails remain natural, such as `student.supported@unibus.local`, `driver.demo@unibus.local`, and `conductor.demo@unibus.local`.
- Duplicate demo subsidy policy handling was tightened; after reset/audit, `active_policies=1`.
- Student tracking wording now says estimated/scheduled tracking, e.g. `vị trí xe ước tính`, `thời gian dự kiến`, and route-schedule simulation wording, so the UI does not imply guaranteed real GPS.

Validation rerun:
- Reset live demo scenario with confirmation: `"RESET DEMO" | powershell -NoProfile -ExecutionPolicy Bypass -File database\RunStableDemoData.ps1 -Mode Reset` — PASS.
- Live demo audit: `powershell -NoProfile -ExecutionPolicy Bypass -File database\RunStableDemoData.ps1 -Mode Audit` — PASS all checks, including `Duy Tan active linked routes = 0`, `demo trips today = 2`, `missing_days = 0`, and `active_policies = 1`.
- Backend compile using IntelliJ bundled Maven: `cd backend && "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.2\plugins\maven\lib\maven3\bin\mvn.cmd" -DskipTests compile` — PASS.
- Frontend lint: `cd frontend && npm run lint` — PASS with 3 existing warnings, 0 errors.

Remaining accepted limitations:
- Reconciliation is still order-first plus legacy monthly-pass fallback, not a 100% hybrid de-dup finance engine.
- Demo student codes still use `SV-STABLE-*` for safe reset scoping; visible emails/names/descriptions are demo-friendly.
- Existing frontend lint warnings remain non-blocking and unrelated to this pass.

## Follow-up Student Tracking UX — 2026-06-29 Night

Scope:
- No schema or Flyway migration changes.
- No new student menu item and no `stu-stops` restore.
- No real GPS requirement; route tracking can use route stops, trips, buses, schedules, and vehicle location fallback.

Changes:
- Student dashboard and `Vé của tôi` now frame the action as `Theo dõi tuyến` / `Xem xe sắp tới`, not generic blank bus tracking.
- Route tracking screen now prioritizes route/stop tracking: selected route, boarding stop, alighting stop, next ETA, route status, ETA rows, and `Các trạm đi qua`.
- Map remains secondary but clearer: route line, bus marker, boarding/alighting markers, and copy distinguishing `Vị trí xe ước tính` from operational vehicle data.
- `/tracking/routes/{routeId}` response was extended with route context, boarding/alighting stop IDs, stop list, and a `simulated` flag, derived from existing route_stops/stops/trips/buses/vehicle_locations data.
- Frontend keeps backward compatibility with the old route-tracking response by falling back from `stopEtas` when the running backend has not been restarted yet.

Visual checks:
- `student.supported@unibus.local`: Dashboard `Xem xe sắp tới` opens route tracking with route line, bus marker, boarding/alighting markers, ETA list, and full `Các trạm đi qua` list.
- `student.supported@unibus.local`: `Vé của tôi` route card `Theo dõi tuyến` opens the same selected route context.
- `student.fullprice@unibus.local`: Dashboard `Xem xe sắp tới` opens route tracking for the Duy Tân full-price route; panel shows route, boarding/alighting names, ETA rows, and stops passed even while the live backend is still serving the pre-restart tracking payload.

Validation:
- Backend compile with IntelliJ bundled Maven: PASS.
- Frontend lint: PASS with the same 3 existing warnings, 0 errors.

Operational note:
- Restart the Spring Boot backend before final demo so the extended `/tracking/routes/{routeId}` payload includes exact stop coordinates/context from the new backend code. Frontend fallback already keeps the panel useful if the old payload is still running.
