# UniBus Master AI Context And Prompt

Last updated: 2026-06-28 19:20 +07

Use this file as the master handoff prompt when starting a new ChatGPT/Codex account or a new AI thread for this project.

## Master Prompt

You are an expert product-minded coding agent working on the UniBus SWP391 project with the user DuckHai. Act as a senior engineer, business analyst, and UI/UX reviewer. Be neutral, direct, and evidence-driven. Do not flatter the user; push back when a product or engineering idea is risky. Prefer verified facts from code, database, logs, or browser behavior over assumptions.

Repository:

- Path: `C:\Users\DuckHai\Documents\Semester5\SWP391\unibus-api`
- Main working branch: `DucHai`
- Primary target PR direction: `DucHai -> main`
- Backend: Spring Boot, Java 21, PostgreSQL/RDS, Flyway, Spring Security, JPA plus JDBC repositories, mail, WebSocket, AWS SDK, AI provider integrations.
- Frontend: Next.js 16.2.6, React 19.2.4, TypeScript, Tailwind v4, Radix UI, Leaflet, framer-motion, lucide-react, sonner.

Operating rules:

- Always inspect the current dirty worktree before editing.
- Never revert user/team changes unless explicitly asked.
- Use `rg` for search and `apply_patch` for manual edits.
- Do not expose secrets from `dbauth.txt`, `.env`, RDS credentials, provider API keys, or OCR credentials.
- Prefer narrow verified fixes over broad refactors.
- For UI work, preserve the existing UniBus student visual language: warm off-white surface, off-black `#14140f`, lime `#BDFD4F` / `#beff50`, restrained coral/blue accents only where already appropriate.
- For the student journey planner, desktop web is the priority. Mobile responsive polish is later.
- Browser visual testing is expensive; use it only when the user explicitly requests it or when visual risk is high.
- Do not push/PR unless the user explicitly asks in the current context.
- Record meaningful context in `docs/AGENT_JOURNEY_FLOW_HANDOFF.md`.

## Current Live RDS Report

Live RDS audit was run read-only through local `dbauth.txt` and PostgreSQL JDBC.

Audit timestamp:

- `2026-06-28 19:12:57.155544 +07`

Connection:

- Database: `postgres`
- User: `postgres`
- Server private addr observed from DB: `172.30.1.198/32`
- Port: `5432`
- Public endpoint is stored in local `dbauth.txt`; do not print secrets.

Flyway history on RDS:

| Rank | Version | Description | Script | Checksum | Installed |
| ---: | --- | --- | --- | ---: | --- |
| 1 | 1 | Flyway Baseline | `<< Flyway Baseline >>` | null | 2026-05-24 15:00:53 |
| 2 | 2 | add verification codes | `V2__add_verification_codes.sql` | -559593816 | 2026-05-24 15:00:54 |
| 3 | 3 | student verification and oauth | `V3__student_verification_and_oauth.sql` | -1748163943 | 2026-05-31 17:13:23 |
| 4 | 5 | make assignments nullable | `V5__make_assignments_nullable.sql` | -1989288806 | 2026-06-16 11:00:45 |
| 5 | 6 | drop verification codes and eta | `V6__drop_verification_codes_and_eta.sql` | 491033266 | 2026-06-16 20:50:02 |
| 6 | 7 | demo flow ticket scan and live fleet | `V7__demo_flow_ticket_scan_and_live_fleet.sql` | -1196603921 | 2026-06-17 09:19:38 |
| 7 | 8 | university subsidy foundation | `V8__university_subsidy_foundation.sql` | -1249045332 | 2026-06-18 09:15:42 |
| 8 | 9 | university linkage mvp | `V9__university_linkage_mvp.sql` | -276311820 | 2026-06-19 22:47:16 |
| 9 | 10 | align university linkage schema | `V10__align_university_linkage_schema.sql` | 437611086 | 2026-06-20 11:26:07 |
| 10 | 11 | prototype fidelity display fields | `V11__prototype_fidelity_display_fields.sql` | -327045017 | 2026-06-20 06:53:36 |
| 11 | 12 | sepay integration | `V12__sepay_integration.sql` | 1439509764 | 2026-06-21 15:24:17 |
| 12 | 13 | recreate verification codes and additions | `V13__recreate_verification_codes_and_additions.sql` | -1163727172 | 2026-06-22 00:14:00 |
| 13 | 14 | danang journey planner foundation | `V14__danang_journey_planner_foundation.sql` | 1023636243 | 2026-06-27 21:51:10 |
| 14 | 15 | journey seed conflict keys | `V15__journey_seed_conflict_keys.sql` | 333943014 | 2026-06-27 22:12:09 |
| 15 | 16 | sepay journey combo orders | `V16__sepay_journey_combo_orders.sql` | -3587936 | 2026-06-28 11:57:46 |

RDS data counts:

- `routes_total=31`
- `routes_active=31`
- `stops_total=876`
- `stops_active=876`
- `route_stops=1194`
- `active_fares=62`
- `route_universities_active=9`

Route source split:

- `BUSMAP_DN=25`
- `NULL=6` canonical/demo UniBus routes

Active route codes on RDS:

```text
01, 02, 03, 04, 05, 06, 07, 08, 09, 11, 12, 14, 16, 17,
LK01, LK02, LK21, N1, N2, R15, R16, R17A, R4A, R6A, TMF1,
UB-DN-01, UB-DN-02, UB-DN-03, UB-DN-04, UB-DN-05, UB-DN-06
```

Data quality:

- `routes_missing_code=0`
- `stops_missing_code=0`
- `duplicate_stop_code=0`
- `active_routes_lt_2_stops=0`
- `active_routes_missing_fare=0`
- `duplicate_route_stop_order_old=465`
- `duplicate_route_direction_order=0`

Interpretation of duplicate route stop order:

- The old audit key `route_id + stop_order` is no longer valid because route stops now have directions.
- The correct key is `route_id + station_direction + stop_order`.
- With the correct key, duplicate count is `0`.

Journey order schema:

- `journey_orders` exists.
- `journey_order_items` exists.
- Current live rows: `journey_orders_rows=0`, `journey_order_items_rows=0`.

Demo flow:

- `student.flow@unibus.local` exists.
- `SV-FLOW-001` transactional rows across registrations, passes, tickets, payments, invoices, and travel history: `0`.

## Schema / Flyway Risk

This is the most important backend risk right now.

Local migration folder currently contains:

```text
V5__make_assignments_nullable.sql
V6__drop_verification_codes_and_eta.sql
V7__demo_flow_ticket_scan_and_live_fleet.sql
V8__university_subsidy_foundation.sql
V9__university_linkage_mvp.sql
V10__align_university_linkage_schema.sql
V11__prototype_fidelity_display_fields.sql
V12__sepay_integration.sql
V13__recreate_verification_codes_and_additions.sql
V14__danang_journey_planner_foundation.sql
V15__journey_seed_conflict_keys.sql
```

Local checkout is missing:

- `V2__add_verification_codes.sql`
- `V3__student_verification_and_oauth.sql`
- `V16__sepay_journey_combo_orders.sql`

V2 and V3 are old historical migrations that were already known to be missing locally. The new urgent issue is V16:

- RDS has `V16__sepay_journey_combo_orders.sql`.
- RDS checksum for V16 is `-3587936`.
- After `git fetch --all --prune`, the file was not found in local branches, remote branches, workspace files, or repo reflog.
- Flyway info classifies V16 as `FUTURE_SUCCESS` from the perspective of this checkout.
- Flyway validate against RDS fails without ignore rules.
- With `ignoreMigrationPatterns("*:missing", "*:future")`, validation succeeds and still preserves checksum validation for resolved migrations.

Temporary mitigation already added:

```properties
spring.flyway.ignore-migration-patterns=*:missing,*:future
```

Location:

- `backend/src/main/resources/application-prod.properties`

This lets prod boot against the shared demo RDS history without mutating the database. It is not the ideal long-term fix.

Correct long-term fix:

1. Recover the exact `V16__sepay_journey_combo_orders.sql` that produced checksum `-3587936`.
2. Commit that file into `backend/src/main/resources/db/migration`.
3. Remove or reassess the `*:future` workaround.
4. If the exact file cannot be recovered, agree as a team on a canonical replacement and use Flyway repair deliberately. Do not do this casually.

Do not invent a V16 migration by guessing. A guessed file will not match checksum `-3587936`.

## Current Student UX / Journey Planner State

Active student planner:

- `frontend/src/components/bus/student/journey-planner-desktop.tsx`

Student module switch:

- `stu-find` renders `JourneyPlannerDesktop`.
- The older in-file `JourneyPlannerDesktopScreen` inside `student-module.tsx` is legacy and not the active sidebar route.

Shell/nav:

- `frontend/src/components/bus/app-shell.tsx`
- `frontend/src/components/bus/nav-config.ts`

Important current IA:

- Student sidebar no longer shows `Trường của tôi`.
- Verification/university page still exists at hidden route `stu-university` and remains reachable through avatar dropdown.
- `Mua vé tháng` was merged into `Vé tháng & hóa đơn`.
- `Chuyến đi của tôi` was renamed to `Vé của tôi`.
- Internal id remains `stu-my-journeys` to avoid breaking routing/state.
- The student `Tìm tuyến xe` page auto-collapses the sidebar on desktop.
- Hovering/focusing the thin left screen edge opens the sidebar temporarily as an overlay, without resizing the map.

Student planner design decisions:

- Desktop web first.
- Left panel has tabs `Tra cứu` and `Tìm đường`.
- `Tra cứu` lists all published active routes and only draws a route on the map after selection.
- `Tìm đường` uses vertical origin/destination inputs, GPS label `Vị trí hiện tại`, max bus legs dropdown, and compact result cards.
- Result cards show only 1-2 best options after dedupe, similar to Google Maps.
- Clicking a result card previews route on map only.
- `Xem chi tiết` opens the deeper step panel.
- `Đăng ký` is the only CTA in route search/planner. No `Mua QR` button in this flow.
- Route result cards use compact Google/BusMap-like hierarchy with route flow, departure-arrival time, total duration, transfer/walk/wait metrics, and a prominent detail button.
- Map uses Leaflet/OSM and backend `path_points`; avoid drawing arbitrary straight route lines.
- Do not show a GPS marker for the exact user position in planner; focus on walking dashed segments and boarding/alighting stops.

Recent UI fixes:

- Removed thick green card border from route results.
- Removed route card shadows when the user disliked them.
- Bus route badges are pill-shaped, not awkward square chips.
- Lookup route bus icon is vertically centered.
- Planner min height was reduced to better fit lower desktop screens:
  - `h-[calc(100dvh-128px)]`
  - `min-h-[520px]`
- `Vé tháng & hóa đơn` now renders a combined finance screen:
  - `stu-payment` is retained as a legacy alias.
  - `stu-invoices` is the visible nav route.

## Backend / API State

Key backend APIs added or used for the student journey flow:

- `GET /api/v1/places/search?q=&lat=&lng=&limit=`
- `GET /api/v1/places/reverse?lat=&lng=`
- `POST /api/v1/journeys/search`
- `GET /api/v1/tracking/journeys/{journeyId}`
- `POST /api/v1/students/me/tickets/journey-monthly-pass`

Key backend services:

- `PlaceService`
- `JourneyPlannerService`
- `JourneyTrackingService`
- `TicketingService`
- `TicketingRepository`
- `OperationsService`
- `ExperienceRepository`
- `ChatbotService`
- `RouteSuggestionService`

Ticket/journey model:

- User-facing UX should feel like one journey/order/QR.
- Internally, route-level monthly passes/tickets remain necessary for subsidy, reconciliation, and route scan correctness.
- `journey_orders` and `journey_order_items` support the journey-level order wrapper.

Scan behavior:

- Monthly pass QR is checked first.
- Journey QR resolves by current trip route.
- Single-ticket QR fallback remains.

## Data Import And QA

Data tooling:

- `database/ImportDanangBusMapData.ps1`
- `database/SeedOfficialDanangBusMapData.sql`
- `database/AuditDanangJourneyPlannerData.sql`
- `database/AuditRdsTransportData.sql`
- `database/ResetDemoTransportData.sql`
- `database/SeedCanonicalDanangBusData.sql`
- `database/SeedCompleteDemoFlow.sql`

Current RDS route set has both:

- 25 BusMap/DanaBus routes using `external_source='BUSMAP_DN'`
- 6 canonical/demo UniBus routes with `external_source IS NULL`

Important: Do not assume `01` is invalid anymore. Current live RDS includes public route `01` from BusMap/DanaBus plus canonical route `UB-DN-01`.

## Chatbot State

The chatbot was partially redesigned earlier:

- Chat surface has fewer shadows and rounder bubbles.
- Tool/agent working indicator was added.
- Backend `ChatbotService` has a faster context path for simple queries.
- Provider/model hints were added in UI.
- Existing dirty files include chatbot/backend changes:
  - `backend/src/main/java/com/unibus/api/ai/ChatbotService.java`
  - `backend/src/main/java/com/unibus/api/ai/RouteSuggestionService.java`
  - `backend/src/test/java/com/unibus/api/ai/AiCopilotServiceTests.java`
  - `frontend/src/app/globals.css`
  - `frontend/src/components/bus/roles/student-module.tsx`

Treat chatbot as not fully finished. Future work should test both UX and actual intelligence:

- Fast simple questions should not wait for LLM unnecessarily.
- Complex reasoning questions should use the configured provider path.
- UI should show what tools/context the agent is using without noisy technical details.

## Business Rules: Current Code Behavior

Student route registration:

- Student must be verified.
- Route currently must be linked to the student's university for registration.
- Backend currently allows multiple active route registrations if the exact route + boarding + alighting combination is not duplicated.
- Changing a registration is supported.
- Cancelling/changing is blocked if active monthly passes would be invalidated.
- Monthly pass purchase requires approved registration.
- Journey monthly pass purchase requires approved registration for every bus leg route.

Neutral BA recommendation for the next product decision:

- Do not permanently lock students to only university-subsidized routes.
- Better product policy:
  - Students can search all public old-Da-Nang routes.
  - Students can register public routes for convenience.
  - Subsidy applies only to routes linked to the student's university and active subsidy policy.
  - Non-linked routes should be purchasable at full price with clear UI labels such as `Gia gốc` or `Không trợ giá`.
  - Financial reconciliation remains route-level.

This policy has not yet been implemented.

## Current Dirty Worktree Awareness

At the time this file was written, the worktree had modifications in:

- `backend/src/main/java/com/unibus/api/ai/ChatbotService.java`
- `backend/src/main/java/com/unibus/api/ai/RouteSuggestionService.java`
- `backend/src/main/resources/application-prod.properties`
- `backend/src/test/java/com/unibus/api/ai/AiCopilotServiceTests.java`
- `docs/AGENT_JOURNEY_FLOW_HANDOFF.md`
- `frontend/src/app/globals.css`
- `frontend/src/components/bus/app-shell.tsx`
- `frontend/src/components/bus/nav-config.ts`
- `frontend/src/components/bus/roles/student-module.tsx`
- `frontend/src/components/bus/student/journey-planner-desktop.tsx`

Do not revert these blindly. Some were from earlier chatbot/planner work; some are from the latest nav/RDS/schema mitigation pass.

## Verification Commands

Frontend build:

```powershell
cd C:\Users\DuckHai\Documents\Semester5\SWP391\unibus-api\frontend
npm run build
```

Backend compile:

```powershell
cd C:\Users\DuckHai\Documents\Semester5\SWP391\unibus-api\backend
& "C:\Users\DuckHai\.m2\wrapper\dists\apache-maven-3.9.15-bin\4rlcemksed9vjmkvgss0jpc4po\apache-maven-3.9.15\bin\mvn.cmd" -q -DskipTests compile
```

Build runtime classpath for Flyway validation helpers:

```powershell
cd C:\Users\DuckHai\Documents\Semester5\SWP391\unibus-api\backend
& "C:\Users\DuckHai\.m2\wrapper\dists\apache-maven-3.9.15-bin\4rlcemksed9vjmkvgss0jpc4po\apache-maven-3.9.15\bin\mvn.cmd" -q dependency:build-classpath "-Dmdep.outputFile=target\runtime-classpath.txt" "-Dmdep.includeScope=runtime"
```

RDS Flyway validation note:

- Normal validation fails because V2/V3/V16 are missing locally.
- With prod ignore patterns `*:missing,*:future`, validation passed against RDS and still preserved checksum validation for resolved migrations.

## Suggested Next Work

1. Recover and commit the exact `V16__sepay_journey_combo_orders.sql` file matching checksum `-3587936`.
2. Decide whether to keep canonical `UB-DN-*` routes visible in planner, or filter planner to `BUSMAP_DN` only.
3. Finish chatbot product pass:
   - UI motion polish.
   - Fast path vs LLM path behavior.
   - Real question tests with logged evidence.
4. Decide the final business policy for non-university-linked route registration and full-price purchases.
5. After worktree is stable, run:
   - frontend build
   - backend compile
   - targeted backend tests
   - optional browser QA only when explicitly requested
6. Only push/PR when user explicitly says so.

## One-Line Context For A Fresh AI

This project is a SWP391 UniBus web app. The current focus is a desktop-first student bus journey planner using real Da Nang BusMap/DanaBus route data, integrated with route registration, monthly pass/journey order payment, and future tracking/chatbot flows. The biggest live backend risk is that RDS has Flyway `V16__sepay_journey_combo_orders.sql` applied but the exact file is missing from the current repo checkout.
