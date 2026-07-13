# Production-like Demo Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo baseline demo production-like, deterministic và reset được cho DTU, UTE, VKU, FPT cùng toàn bộ role UniBus mà không đổi schema, Flyway, backend hoặc frontend.

**Architecture:** Giữ `SeedDemoDataUntilAugust.sql` và `ResetDemoScenario.sql` đồng bộ như hai entry point cùng tái tạo một baseline. Mở rộng `AuditDemoDataUntilAugust.sql` trước để đóng vai trò executable specification; sau đó thêm master data, vận hành, ticketing và support data bằng payload CTE/`generate_series` có marker rõ. Chỉ chạy mutation live RDS sau khi parser, diff và backend validation cục bộ hoàn tất.

**Tech Stack:** PostgreSQL SQL/PLpgSQL hiện có, PowerShell runner, Spring Boot/Maven validation, live AWS RDS, CloudFront browser smoke test.

---

## File map

- Modify: `database/AuditDemoDataUntilAugust.sql` — executable assertions cho baseline bốn trường và tất cả role.
- Modify: `database/SeedDemoDataUntilAugust.sql` — upsert master data, cleanup marker và tái tạo baseline.
- Modify: `database/ResetDemoScenario.sql` — giữ nội dung logic đồng bộ với Seed, khác phần header mô tả.
- Modify: `docs/external-agent-full-qa-runbook.md` — account matrix và test coverage mới.
- Modify: `docs/demo-practice-checklist.md` — hướng dẫn chọn account/kịch bản demo.
- Keep unchanged: backend, frontend, migrations và schema.

## Baseline account payload

Shared password hash tiếp tục dùng hash hiện có của `Password123!`.

| Role | Email | Full name | Purpose |
|---|---|---|---|
| ADMIN | `admin.demo@unibus.local` | Nguyễn Minh Quân | System admin chính |
| ADMIN | `admin.operations.demo@unibus.local` | Nguyễn Hoàng Nam | Account/filter/status coverage |
| UNIVERSITY_ADMIN | `uniadmin.demo@unibus.local` | Lê Thu Hà | DTU quản trị |
| UNIVERSITY_ADMIN | `finance.dtu.demo@unibus.local` | Trần Ngọc Mai | DTU tài chính |
| UNIVERSITY_ADMIN | `uniadmin.ute.demo@unibus.local` | Nguyễn Thị Minh Châu | UTE quản trị |
| UNIVERSITY_ADMIN | `finance.ute.demo@unibus.local` | Lê Quốc Anh | UTE tài chính |
| UNIVERSITY_ADMIN | `uniadmin.vku.demo@unibus.local` | Phạm Khánh Linh | VKU quản trị |
| UNIVERSITY_ADMIN | `finance.vku.demo@unibus.local` | Đỗ Thành Công | VKU tài chính |
| UNIVERSITY_ADMIN | `uniadmin.fpt.demo@unibus.local` | Vũ Ngọc Hà | FPT quản trị |
| UNIVERSITY_ADMIN | `finance.fpt.demo@unibus.local` | Nguyễn Đức Long | FPT tài chính |
| DISPATCHER | `dispatcher.demo@unibus.local` | Phạm Quốc Huy | Điều phối tổng |
| DISPATCHER | `dispatcher.morning.demo@unibus.local` | Bùi Minh Tuấn | Ca sáng |
| DISPATCHER | `dispatcher.evening.demo@unibus.local` | Nguyễn Thanh Phong | Ca chiều |
| DRIVER | `driver.demo@unibus.local` | Nguyễn Minh Tài | Tài xế chính |
| DRIVER | `driver.02.demo@unibus.local` | Trần Quốc Việt | Fleet 02 |
| DRIVER | `driver.03.demo@unibus.local` | Võ Anh Khoa | Fleet 03 |
| DRIVER | `driver.04.demo@unibus.local` | Lê Đức Thành | Fleet 04 |
| DRIVER | `driver.05.demo@unibus.local` | Phan Hoàng Long | Fleet 05 |
| CONDUCTOR | `conductor.demo@unibus.local` | Trần Gia Hân | Phụ xe chính |
| CONDUCTOR | `conductor.02.demo@unibus.local` | Nguyễn Mỹ Linh | Crew 02 |
| CONDUCTOR | `conductor.03.demo@unibus.local` | Đỗ Minh Anh | Crew 03 |
| CONDUCTOR | `conductor.04.demo@unibus.local` | Võ Thanh Hà | Crew 04 |

Student login accounts:

- Giữ sáu DTU account: `student.supported`, `student.fullprice`, `student.monthly`, `student.day`, `student.unpaid`, `student.history` tại domain `@unibus.local`.
- UTE: `student.ute.monthly@unibus.local`, `student.ute.single@unibus.local`, `student.ute.unpaid@unibus.local`, `student.ute.history@unibus.local`.
- VKU: `student.vku.monthly@unibus.local`, `student.vku.single@unibus.local`, `student.vku.unpaid@unibus.local`, `student.vku.history@unibus.local`.
- FPT: `student.fpt.monthly@unibus.local`, `student.fpt.single@unibus.local`, `student.fpt.unpaid@unibus.local`, `student.fpt.history@unibus.local`.

---

### Task 1: Expand Audit into the failing specification

**Files:**
- Modify: `database/AuditDemoDataUntilAugust.sql`

- [ ] **Step 1: Add expected university/account matrices**

Add CTEs with exact expected values:

```sql
expected_universities(code, minimum_roster, minimum_login_students, minimum_admins) AS (
    VALUES
        ('DTU', 15, 6, 2),
        ('UTE', 15, 4, 2),
        ('VKU', 15, 4, 2),
        ('FPTDN', 15, 4, 2)
),
expected_staff(email, role) AS (
    VALUES
        ('admin.demo@unibus.local', 'ADMIN'),
        ('admin.operations.demo@unibus.local', 'ADMIN'),
        ('dispatcher.demo@unibus.local', 'DISPATCHER'),
        ('dispatcher.morning.demo@unibus.local', 'DISPATCHER'),
        ('dispatcher.evening.demo@unibus.local', 'DISPATCHER'),
        ('driver.demo@unibus.local', 'DRIVER'),
        ('driver.02.demo@unibus.local', 'DRIVER'),
        ('driver.03.demo@unibus.local', 'DRIVER'),
        ('driver.04.demo@unibus.local', 'DRIVER'),
        ('driver.05.demo@unibus.local', 'DRIVER'),
        ('conductor.demo@unibus.local', 'CONDUCTOR'),
        ('conductor.02.demo@unibus.local', 'CONDUCTOR'),
        ('conductor.03.demo@unibus.local', 'CONDUCTOR'),
        ('conductor.04.demo@unibus.local', 'CONDUCTOR')
)
```

- [ ] **Step 2: Add university density assertions**

For each expected university, report one row containing roster, login student, admin, order, monthly pass, single ticket, invoice and notification counts. PASS thresholds:

```text
roster >= 15
login_students >= configured minimum
admins >= 2
orders >= 12
monthly_passes >= 3
single_tickets >= 3
invoices >= 4
```

- [ ] **Step 3: Add relationship and idempotency assertions**

Add FAIL rows for:

```sql
-- Paid order amount integrity
COALESCE(o.original_amount, 0) <> COALESCE(o.subsidy_amount, 0) + COALESCE(o.final_amount, 0)

-- Duplicate demo QR
qr_code IN (
    SELECT qr_code
    FROM (
        SELECT qr_code FROM monthly_passes WHERE qr_code LIKE 'DEMO-%'
        UNION ALL
        SELECT qr_code FROM single_trip_tickets WHERE qr_code LIKE 'DEMO-%'
    ) q
    GROUP BY qr_code
    HAVING count(*) > 1
)

-- Invalid active ticket dates
(mp.status = 'ACTIVE' AND mp.expires_on < CURRENT_DATE)
OR (st.status = 'UNUSED' AND st.expires_at < CURRENT_TIMESTAMP)
```

Also assert demo trips have route, bus, driver and conductor; demo account emails are unique; no registration uses route code `UB-DN-%`; and junk policy/campus allowlist is absent.

- [ ] **Step 4: Run read-only Audit and capture expected failures**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Audit
```

Expected before implementation: existing baseline checks remain PASS; new UTE/VKU/FPT density and additional staff checks report FAIL. Save output for comparison; do not mutate RDS.

---

### Task 2: Add master accounts, campuses, domains and university admins

**Files:**
- Modify: `database/SeedDemoDataUntilAugust.sql`
- Modify: `database/ResetDemoScenario.sql`

- [ ] **Step 1: Add user payload and upsert all staff/student login accounts**

Use one `user_payload` CTE and `INSERT ... ON CONFLICT (email) DO UPDATE`. Every account must set role, full name, status, verification status and phone deterministically. Use the exact account matrix above; student accounts are `ACTIVE`, email verified and `VERIFIED`.

- [ ] **Step 2: Normalize four university master rows**

Upsert exact codes/names:

```sql
VALUES
    ('DTU', 'Trường Đại học Duy Tân', 'DTU', 'ACTIVE'),
    ('UTE', 'Trường Đại học Sư phạm Kỹ thuật - Đại học Đà Nẵng', 'UTE', 'ACTIVE'),
    ('VKU', 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn', 'VKU', 'ACTIVE'),
    ('FPTDN', 'Trường Đại học FPT Đà Nẵng', 'FPT', 'ACTIVE')
```

Do not delete other university master rows.

- [ ] **Step 3: Upsert official campus/domain data**

Use these baseline addresses and domains:

```text
DTU: 254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng; dtu.edu.vn; duytan.edu.vn
UTE: 48 Cao Thắng, Hải Châu, Đà Nẵng; ute.udn.vn
VKU: 470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng; vku.udn.vn
FPT: Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng; fpt.edu.vn
```

Use stable campus codes `DTU_MAIN`, `UTE_MAIN`, `VKU_MAIN`, `FPTDN_MAIN`. Replace the owned `DTU_DEMO_MAIN` row instead of creating a second DTU campus.

- [ ] **Step 4: Upsert eight university admin profiles**

Resolve `user_id` and `university_id` by email/code, then upsert into `university_admins`. Primary admin title is `Quản trị viên trường`; finance account title is `Chuyên viên tài chính`. Set status `ACTIVE`, permissions using the existing JSON/default pattern, and `assigned_by_user_id` to `admin.demo`.

- [ ] **Step 5: Keep Seed and Reset synchronized**

After each SQL edit, compare:

```powershell
git diff --no-index -- database\SeedDemoDataUntilAugust.sql database\ResetDemoScenario.sql
```

Expected: only the three header comment lines differ.

---

### Task 3: Generate 60 roster rows and student profiles

**Files:**
- Modify: `database/SeedDemoDataUntilAugust.sql`
- Modify: `database/ResetDemoScenario.sql`

- [ ] **Step 1: Define deterministic roster payload**

Use `generate_series(1, 15)` per university with school-like student codes:

```sql
DTU:   (27211200000 + series_no)::text
UTE:   (2411505000 + series_no)::text
VKU:   '24ITB' || lpad(series_no::text, 3, '0')
FPTDN: 'DE21' || lpad(series_no::text, 4, '0')
```

Do not put `DEMO`, `TEST` or scenario names inside `student_code`.

Use deterministic faculties by modulo over these arrays:

```text
DTU: Công nghệ thông tin, Kỹ thuật phần mềm, Du lịch, Tài chính, Logistics
UTE: Công nghệ thông tin, Cơ khí, Điện - Điện tử, Xây dựng, Công nghệ ô tô
VKU: Công nghệ thông tin, Khoa học dữ liệu, Trí tuệ nhân tạo, Thiết kế số, Quản trị kinh doanh
FPT: Kỹ thuật phần mềm, Trí tuệ nhân tạo, An toàn thông tin, Kinh doanh số, Thiết kế mỹ thuật số
```

Academic year cycles through `2021..2025`; date of birth is deterministic from series number. Status distribution is 12 `ACTIVE`, one `INACTIVE`, one `GRADUATED`, one `SUSPENDED` per school.

- [ ] **Step 2: Map login accounts to roster rows**

Preserve the six existing DTU student codes and add them to the DTU roster count. Map UTE/VKU/FPT login accounts to rows `01..04` using scenario suffixes monthly/single/unpaid/history. Populate `students.university`, `students.university_id`, faculty, academic year and matched roster user consistently.

- [ ] **Step 3: Upsert roster without duplicate email/student code**

Use `ON CONFLICT (university_id, student_code) DO UPDATE` and ensure account-backed rows use the account email while filler rows use deterministic addresses such as:

```sql
lower(university_code) || '.student' || lpad(series_no::text, 2, '0') || '@demo.unibus.local'
```

Before insert, delete only baseline-owned roster rows identified by the exact account whitelist or deterministic roster email patterns. Do not use student-code prefixes for ownership.

- [ ] **Step 4: Verify roster/account consistency locally**

Search the scripts:

```powershell
rg -n "272112000|24115050|24ITB|DE21|student\.(ute|vku|fpt)" database\SeedDemoDataUntilAugust.sql database\ResetDemoScenario.sql
```

Expected: all new prefixes/accounts appear in both files; existing six DTU scenario accounts remain.

---

### Task 4: Add routes, policies, staff profiles, buses and operations history

**Files:**
- Modify: `database/SeedDemoDataUntilAugust.sql`
- Modify: `database/ResetDemoScenario.sql`

- [ ] **Step 1: Resolve only existing active routes/stops**

Resolve route IDs by active route code:

```text
DTU: 12 and 06
UTE: 01 and 11
VKU: 02 and 16
FPT: N1 and 02
```

For each route, select boarding/alighting stops using ordered `route_stops`: use an interior stop near the campus where known and a later stop in the same direction. If a route is absent/inactive or has fewer than two ordered stops, raise an exception and abort the transaction instead of inserting fallback IDs.

- [ ] **Step 2: Upsert route-university links and policies**

Create baseline-owned active links for the matrix above. Create one active and one inactive policy per university:

```text
DTU: 50%, max 90,000
UTE: 40%, max 70,000
VKU: 35%, max 60,000
FPT: 25%, max 50,000
```

Active policy dates cover the current demo period. Historical policies end before current month and remain `INACTIVE`. Policy names start with `DEMO_BASELINE:` for safe ownership.

- [ ] **Step 3: Remove known junk only after dependency checks**

Delete policy `dddd` only when no monthly pass references its `subsidy_policy_id`. Replace campus `DTU_DEMO_MAIN` with `DTU_MAIN`. For `UI QA Khanh student subsidy 25%`, keep it if referenced by any pass/order scenario; otherwise remove it by exact name. Never use `%demo%` wildcard cleanup.

- [ ] **Step 4: Upsert staff profiles and ten buses**

Use exact email resolution for 3 dispatchers, 5 drivers and 4 conductors. Assign unique employee/license codes with `DSP-DEMO-`, `DRV-DEMO-`, `CND-DEMO-`. Create ten realistic unique bus plates in a reserved demo range and valid existing status values.

- [ ] **Step 5: Recreate schedules and trips deterministically**

Delete dependent rows for trips where notes start `DEMO_DATA:` or `DEMO_FLEET:`. Generate trips from `CURRENT_DATE - 14` through `CURRENT_DATE + 7` across the selected route matrix. Apply statuses:

```sql
CASE
    WHEN service_date < CURRENT_DATE AND sequence_no % 11 = 0 THEN 'CANCELLED'
    WHEN service_date < CURRENT_DATE THEN 'COMPLETED'
    WHEN service_date = CURRENT_DATE AND departure_time < LOCALTIME - INTERVAL '2 hours' THEN 'COMPLETED'
    WHEN service_date = CURRENT_DATE AND departure_time <= LOCALTIME
         AND departure_time > LOCALTIME - INTERVAL '2 hours'
         AND sequence_no = 1 THEN 'RUNNING'
    ELSE 'NOT_STARTED'
END
```

Set `departed_at`/`ended_at` only when status requires them. Rotate bus/driver/conductor by modulo, but prevent simultaneous `RUNNING` assignments for the same resource.

- [ ] **Step 6: Ensure every operational account has coverage**

Add Audit-compatible data so each driver/conductor has at least one past `COMPLETED` trip and one today/future assignment. Dispatcher dashboards must see all generated trips without creating dispatcher-specific duplicate trips.

---

### Task 5: Add registrations, orders, payments, tickets, invoices and history

**Files:**
- Modify: `database/SeedDemoDataUntilAugust.sql`
- Modify: `database/ResetDemoScenario.sql`

- [ ] **Step 1: Clean only baseline-owned commerce rows**

Delete in foreign-key-safe order for students owned by the exact baseline email whitelist:

```text
invoices → payments → travel_history → monthly_passes/single_trip_tickets →
tb_transactions → tb_orders → route_registrations
```

Do not touch `khanhnv20a02@gmail.com` or any student account outside the whitelist. Student codes intentionally have no demo marker.

- [ ] **Step 2: Create scenario registrations**

For each school:

```text
monthly: APPROVED
single: APPROVED when registration is useful, but purchase must remain valid independently
unpaid: APPROVED
history: APPROVED
filler: mix PENDING/CANCELLED only for account-backed students where UI can display them
```

Boarding/alighting IDs must belong to the route and satisfy ascending stop order.

- [ ] **Step 3: Insert 12 orders per university**

Use this exact distribution:

```text
6 Paid: 3 monthly + 3 single
3 Unpaid: 2 monthly + 1 single
2 Cancelled: 1 monthly + 1 single
1 Refunded: monthly
```

For single orders, populate `legs_json`, `origin_label` and `destination_label`. For every order enforce:

```sql
original_amount = subsidy_amount + final_amount
AND total = final_amount
```

Full-price scenarios set subsidy to zero. Use current route fares rather than hardcoding a second conflicting fare source.

- [ ] **Step 4: Provision paid tickets and invoices consistently**

For each Paid order, create exactly one matching monthly pass or single ticket, one `PAID` payment, one invoice and one matched `tb_transactions` row. Transaction IDs and QR codes derive deterministically from university/scenario/order sequence and use `DEMO-` prefixes. Cancelled/refunded/unpaid orders must not create active tickets.

- [ ] **Step 5: Create ticket state coverage**

Per school create at least:

```text
monthly: ACTIVE, EXPIRED, CANCELLED
single: UNUSED today, USED today, EXPIRED previous day, CANCELLED
```

UNUSED single expiry is end of current day in `Asia/Ho_Chi_Minh`. USED ticket references a generated completed trip and conductor.

- [ ] **Step 6: Create travel history**

Generate approximately 30 history rows across the four schools, only against completed demo trips. Boarding/alighting stops must match route order; confirmation method uses existing valid values; conductor IDs come from the assigned trip.

---

### Task 6: Add feedback, lost items, incidents and notifications

**Files:**
- Modify: `database/SeedDemoDataUntilAugust.sql`
- Modify: `database/ResetDemoScenario.sql`

- [ ] **Step 1: Insert feedback state coverage**

Create 18 feedback rows attached to completed demo trips and account-backed students. Distribute six each across `OPEN`, `IN_PROGRESS`, `RESOLVED`; ratings cycle 3, 4, 5. Only resolved rows have response/handler content.

- [ ] **Step 2: Insert lost-item state coverage**

Create nine rows using only valid statuses:

```text
REPORTED: 3
SEARCHING: 2
FOUND: 2
NOT_FOUND: 2
```

Each report references a real completed trip and reporting student user. `assisted_by_user_id` is populated only for states that have been handled.

- [ ] **Step 3: Insert incident state/type coverage**

Create 12 incidents over valid assigned trips. Cycle types `OVERCROWDED`, `EMERGENCY`, `TECHNICAL`, `OTHER` and statuses `NEW`, `IN_PROGRESS`, `RESOLVED`. Only resolved incidents have resolution and handler.

- [ ] **Step 4: Insert notification coverage**

Create at least 40 notifications using only `SYSTEM`, `TRIP`, `PAYMENT`, `COMPLAINT`, `ALERT`. Every main demo account receives at least one notification; student and staff dashboards receive a mix of read/unread. Use concise natural Vietnamese content tied to existing scenario data.

- [ ] **Step 5: Validate constraints through Audit**

Run Audit after local script review and later after Seed. Expected: no status/check-constraint failures; counts meet thresholds; notification unread totals are non-zero for the designated main accounts.

---

### Task 7: Synchronize scripts and update demo documentation

**Files:**
- Modify: `database/SeedDemoDataUntilAugust.sql`
- Modify: `database/ResetDemoScenario.sql`
- Modify: `docs/external-agent-full-qa-runbook.md`
- Modify: `docs/demo-practice-checklist.md`

- [ ] **Step 1: Synchronize Seed and Reset**

Copy the validated SQL body so both files remain functionally identical. Preserve only the intentional header difference. Verify with:

```powershell
git diff --no-index -- database\SeedDemoDataUntilAugust.sql database\ResetDemoScenario.sql
```

Expected: exactly three comment-line differences.

- [ ] **Step 2: Update the external QA runbook**

Add all new staff and student login accounts, shared password, four-school coverage, and account selection guidance. Add cross-school checks for subsidy, roster visibility, orders and invoices. Keep secrets external.

- [ ] **Step 3: Update the practice checklist**

Document a short demo path per role:

```text
System Admin → inspect four universities/accounts/finance
University Admin → choose one of DTU/UTE/VKU/FPT accounts
Dispatcher → schedules, assignment and fleet density
Driver → past/today/future trips
Conductor → assigned trip, scan, incident/lost item
Student → monthly/single/unpaid/history scenario per school
```

- [ ] **Step 4: Scan for obsolete labels and accounts**

Run:

```powershell
rg -n "STABLE|Cơ sở demo Duy Tân|\bdddd\b|UB-DN-|University Admin" database docs
```

Expected: no baseline data uses `STABLE`, `UB-DN-*`, junk campus/policy names or English role label in Vietnamese instructions. Historical changelog references may remain only when explicitly describing removed data.

---

### Task 8: Local validation before any live mutation

**Files:**
- Validate all modified files.

- [ ] **Step 1: Parse PowerShell scripts**

```powershell
$scripts = @(
  'database/RunDemoData.ps1',
  'database/CompleteDemoSePayWebhook.ps1'
)
foreach ($script in $scripts) {
  $tokens = $null
  $errors = $null
  [void][System.Management.Automation.Language.Parser]::ParseFile(
    (Resolve-Path $script), [ref]$tokens, [ref]$errors
  )
  if ($errors.Count -gt 0) { throw "$script parser errors: $($errors.Count)" }
}
```

Expected: no parser errors.

- [ ] **Step 2: Check SQL transaction/marker structure**

```powershell
rg -n "^(BEGIN;|COMMIT;)|DEMO_DATA:|272112000|24115050|24ITB|DE21" database\SeedDemoDataUntilAugust.sql database\ResetDemoScenario.sql
```

Expected: one outer `BEGIN;`/`COMMIT;` per script; all generated entity families have cleanup markers.

- [ ] **Step 3: Compile and test backend**

```powershell
cd backend
mvn -B -ntp compile
mvn -B -ntp test
cd ..
```

Expected: `BUILD SUCCESS`; all existing tests pass. Do not modify backend to make seed data pass.

- [ ] **Step 4: Check whitespace and touched files**

```powershell
git diff --check
git status --short
git diff --name-only
```

Expected: only the three database scripts and approved docs/spec/plan files are changed. `.worktrees/` remains untouched and untracked.

---

### Task 9: Apply and prove the baseline on live RDS

**Files:**
- Execute: `database/RunDemoData.ps1`
- No additional source changes unless validation reveals a script defect.

- [ ] **Step 1: Capture pre-mutation Audit**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Audit
```

Expected: legacy baseline may fail new density assertions; connection and existing integrity checks must execute successfully.

- [ ] **Step 2: Run Seed with explicit confirmation**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Seed
```

Enter `SEED DEMO`. Expected: transaction commits without constraint/FK errors.

- [ ] **Step 3: Run Audit after Seed**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Audit
```

Expected: every required row reports PASS. WARN is acceptable only for explicitly documented optional route/campus coverage; no FAIL.

- [ ] **Step 4: Browser smoke test CloudFront**

Test at `https://d8xawk4fn4vfd.cloudfront.net`:

```text
admin.demo → four universities, accounts, finance/activity populated
uniadmin.demo → DTU roster/orders/tickets populated
uniadmin.ute.demo → only UTE data
uniadmin.vku.demo → only VKU data
uniadmin.fpt.demo → only FPT data
dispatcher.demo → dense schedules/trips/fleet
driver.02.demo → history + today/future assignment
conductor.02.demo → assigned trips + support data
one monthly/single/history student from each school → expected ticket/payment/history
```

Capture console/network errors and visual evidence. Do not redesign UI during this pass.

- [ ] **Step 5: Prove Reset idempotency**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Reset
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Audit
```

Enter `RESET DEMO`. Expected: Reset recreates the same baseline and Audit remains all PASS without duplicate QR, accounts, roster, orders or trips.

- [ ] **Step 6: Leave live RDS in ready-to-demo state**

Because Reset recreates the ready baseline, do not run an additional destructive cleanup. Run one final Audit and record counts by role/university. If any FAIL remains, stop and report; do not hide it with manual SQL mutation.

---

## Completion report

Report exactly:

- Files changed.
- Account counts by role.
- Roster/order/ticket/trip/support counts by university.
- Known junk removed and dependency checks used.
- Local compile/test/parser/diff results.
- Pre-Seed, post-Seed, post-Reset and final Audit results.
- Browser smoke coverage and any blocked cases.
- Confirmation that schema/Flyway/backend/frontend were unchanged.
- Confirmation that live RDS is left in the Reset-created ready-to-demo baseline.

Do not commit, push or create a PR until the user explicitly requests it.
