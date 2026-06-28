# UniBus Student Journey Flow Handoff

Date: 2026-06-27

## 2026-06-28 Desktop UX Correction Pass

This pass rebuilds the student route finder around the user's latest desktop-web feedback.

Key decisions:

- The active student route finder is now `frontend/src/components/bus/student/journey-planner-desktop.tsx`.
- `stu-find` in `frontend/src/components/bus/roles/student-module.tsx` renders `JourneyPlannerDesktop`; the older in-file `JourneyPlannerDesktopScreen` is legacy and is not active.
- `frontend/src/components/bus/app-shell.tsx` auto-collapses the desktop sidebar when the student opens `stu-find`, and removes the normal `max-w-7xl` cap for this module so the map/planner can use the full desktop width.
- Palette follows the existing student theme in `frontend/src/app/globals.css`: warm off-white surfaces, off-black `#14140f`, and a youthful lime accent. The active planner pass uses `#BDFD4F` for route-planner accent states and avoids blue text in this screen.
- Planner/map shadows were removed. `frontend/src/components/m3/journey-map.tsx` now disables injected shadow on zoom controls, popups, and custom markers.
- Lookup tab behavior:
  - Default map is blank over Da Nang until a route is selected.
  - Route list uses official BusMap/DanaBus routes only; no `V14/V15` labels appear in the UI.
  - Selecting a route opens a left-side route detail panel and draws backend route `path_points` on Leaflet.
  - Direction controls use different active colors: outbound lime `#BDFD4F`, return terracotta. The lookup map polyline also changes with direction.
  - Route lookup now has a quick `Đăng ký tuyến` CTA fixed at the bottom of the left panel. It registers first stop to last stop for the selected direction and navigates to `stu-payment`. There is no `Mua QR` button in this flow.
- Journey planner tab behavior:
  - Origin/destination inputs are vertical and saved in `localStorage` under `unibus.studentJourneyPlanner.v1`.
  - GPS success always labels the origin as `Vị trí hiện tại` instead of trusting reverse-geocode display text.
  - Max bus legs selector is now a no-shadow dropdown, not the old segmented selector.
  - The old swap-origin/destination icon was removed because it caused bad spacing in the vertical desktop form.
  - Result cards are clickable summaries. Clicking a card opens a separate left detail panel with route steps, boarding/alighting info, the actual stops passed by each bus leg, and a fixed bottom `Đăng ký` CTA.
  - The confusing compact icon-only sequence was replaced with readable step rows such as `Đi bộ 2 phút` and `Tuyến 16 · 33 trạm`.
  - Route and journey cards no longer use blue text for prices or labels. Lookup cards use a centered lime bus icon chip and lighter state-layer press feedback.
  - Successful route registration stores lightweight context in `localStorage.unibus.lastRegisteredRouteContext` so the future My Tickets/tracking redesign can infer whether the user came from route lookup or journey planning.
- Address suggestions are still backend-driven through `GET /api/v1/places/search`, which prioritizes local stops/landmarks and then falls back to geocoders. Browser QA confirmed suggestions include `Bến xe buýt Đại học Việt Hàn` with Da Nang stop address data.

Verification for this pass:

- `npm run build` passed in `frontend/` after the latest color/icon/dropdown/detail changes.
- Browser visual QA at 1440x900 confirmed:
  - Sidebar collapses to full-width planner when opening `Tìm tuyến xe`.
  - Lookup default has 19 active routes and a blank map path count before selection.
  - Selecting route `02` draws a backend polyline; switching direction changes active color.
  - Lookup detail shows `Đăng ký tuyến` fixed in the left panel.
  - Planner result cards open a separate journey detail panel with fixed `Đăng ký`; no `Mua QR` appears.
  - Reloading the app and returning to `Tìm tuyến xe > Tìm đường` restores saved origin/destination and results.
  - GPS physical accuracy was not accepted/validated in browser automation; implementation uses `navigator.geolocation.getCurrentPosition({ enableHighAccuracy: true })` and keeps the label as `Vị trí hiện tại`.

## 2026-06-28 Student IA, Chatbot, and Business Policy Research

Implemented UI/IA changes:

- Student sidebar now groups `Theo dõi xe`, `Tuyến của tôi`, and `Vé của tôi` under `Chuyến đi của tôi`.
- `Chuyến đi của tôi` has three internal tabs: registered routes, ticket/QR, and tracking.
- Student sidebar no longer exposes standalone `Phản hồi & đánh giá` or `Báo mất đồ`; `Lịch sử chuyến đi` now contains tabs for trip history, feedback, and lost-item reports.
- Dashboard upcoming-trip copy now prefers the student's registered/ticket boarding and alighting stops before falling back to route endpoints. This fixes the confusing `Bến xe buýt Hội An -> Bến xe buýt Hội An` style display for seeded student demo accounts.
- Chatbot UI no longer uses clipped chat bubble corners or card shadows in the chat surface. The loading state is now an agent-style working indicator that fades between context/tools such as student profile, routes/stops, ticket/subsidy, schedule, and final response.
- `ChatbotService` now has a `FAST_CONTEXT` path for simple, short factual questions. It answers from backend context without waiting for an LLM call. Longer or reasoning-heavy prompts still go through the configured LLM provider/fallback chain.

Verification for this pass:

```powershell
cd frontend
npm run build
```

```powershell
cd backend
& "C:\Users\DuckHai\.m2\wrapper\dists\apache-maven-3.9.15-bin\4rlcemksed9vjmkvgss0jpc4po\apache-maven-3.9.15\bin\mvn.cmd" -q -DskipTests compile
```

Schema note:

- No new schema or Flyway migration was added in this pass.
- Existing journey-planner schema remains V14/V15.

Business policy research, current code behavior:

- Student must be verified before route registration. Enforced in `RouteRegistrationService.requireVerifiedStudent`.
- Registration currently requires the route to be linked to the student's university. Enforced through `TransportService.requireValidSelection`, which calls `SubsidyService.requireRouteLinked`.
- The backend currently allows more than one active route registration as long as the exact route + boarding stop + alighting stop pair is not duplicated. The list endpoint returns all `PENDING`/`APPROVED` registrations.
- Changing an existing registration is supported by `PUT /api/v1/students/me/route-registrations/{registrationId}`. Same-route changes update boarding/alighting stops. Different-route changes cancel the old registration and create a new one through `previous_registration_id`.
- A student cannot cancel a registration while any active monthly pass exists. Enforced by `countActiveMonthlyPasses`.
- A student cannot change to a different route while there is an active monthly pass on another route. Enforced by `countActiveMonthlyPassesOnDifferentRoute`.
- Monthly pass purchase requires an approved route registration. Journey monthly pass purchase requires approved registrations for every bus leg route.
- Current code does not support "register non-university-linked public route and pay full price" for registration/monthly-pass flows. Non-linked routes can be discovered in the new public planner, but registration and subsidized/monthly pass purchase are still university-linked.

Neutral BA recommendation for next decision:

- Do not lock the product forever to "school-linked routes only". It is too restrictive for a real city bus product and creates UX dead ends when the best public route is not subsidized.
- Recommended policy split:
  - Students can search every public old-Da-Nang route.
  - Students can register any public route for personal convenience.
  - Subsidy only applies when the route is linked to the student's university and there is an active subsidy policy.
  - Non-linked route purchase should be allowed at full fare with a clear badge such as `Không trợ giá` / `Giá gốc`.
  - Financial reconciliation remains route-level: linked routes have subsidy accounting; non-linked routes have zero subsidy.
- Recommended implementation later, not done in this pass:
  - Change `RouteRegistrationService`/`TransportService.requireValidSelection` to validate route/stop order without requiring `requireRouteLinked`.
  - Keep subsidy gating in `SubsidyService.quoteFor` and payment quote logic.
  - Add explicit `eligibility/subsidyStatus` to route/journey APIs so UI can show `Trường hỗ trợ`, `Giá gốc`, or `Chưa đủ điều kiện`.
  - Add tests for public non-linked registration, full-price monthly pass, linked subsidized pass, duplicate registration, cancel locked by active pass, and replace locked by active pass.

## Objective

Refactor student journey flow into a desktop-first, map-first planner:

1. Search origin/destination by stop, local place, GPS, or geocoder.
2. Show journey options with walking, bus legs, transfer stops, fare, ETA, and route badges.
3. Let student register the route leg, buy one journey QR, and track simulated vehicles.
4. Keep existing UniBus web style: Material 3 expressive cards, lime/ink/blue/coral palette, Leaflet map, framer-motion.

Mobile polish is intentionally later. Current implementation prioritizes desktop demo quality.

## Important Product Decisions

- Journey UX shows one planned journey and one QR to the student.
- Backend still keeps route-level monthly passes/tickets under the journey order for subsidy, reconciliation, and route scan correctness.
- Planner publishes active non-interregional routes by default. Raw import may keep all `regionCode=dn` records for audit.
- Tracking is simulated deterministically from route shape/schedule when no real vehicle snapshot exists.
- Old APIs and old student route screens are preserved for backward compatibility.

## Backend Changes

New migration:

- `backend/src/main/resources/db/migration/V14__danang_journey_planner_foundation.sql`
- `backend/src/main/resources/db/migration/V15__journey_seed_conflict_keys.sql`

Schema extensions:

- `routes`: `external_source`, `external_route_id`, `source_updated_at`, `is_interregional`
- `stops`: `external_source`, `external_stop_id`, `source_updated_at`
- `route_stops`: `station_direction`, `path_points`, `distance_from_previous_m`
- New tables: `journey_orders`, `journey_order_items`

Seed support:

- `V15` adds full unique indexes on `routes.route_code` and `stops.stop_code`.
- The official seed uses `ON CONFLICT (route_code)` and `ON CONFLICT (stop_code)`, so these indexes are required before running `SeedOfficialDanangBusMapData.sql`.
- Planner/place search now prefers `external_source='BUSMAP_DN'` whenever official BusMap data exists, keeping legacy/demo `UB-DN-*` routes out of the new journey planner while preserving old screens.

New/updated services:

- `backend/src/main/java/com/unibus/api/transport/PlaceService.java`
- `backend/src/main/java/com/unibus/api/transport/JourneyPlannerService.java`
- `backend/src/main/java/com/unibus/api/transport/JourneyTrackingService.java`
- `backend/src/main/java/com/unibus/api/experience/ExperienceRepository.java`
- `backend/src/main/java/com/unibus/api/ticketing/TicketingService.java`
- `backend/src/main/java/com/unibus/api/operations/OperationsService.java`

New APIs:

- `GET /api/v1/places/search?q=&lat=&lng=&limit=`
- `GET /api/v1/places/reverse?lat=&lng=`
- `POST /api/v1/journeys/search`
- `GET /api/v1/tracking/journeys/{journeyId}`
- `POST /api/v1/students/me/tickets/journey-monthly-pass`

Scan behavior:

- Monthly pass QR is checked first.
- Journey QR then resolves by the current trip route, so one QR can contain multiple route-level pass items.
- Single-ticket QR fallback remains unchanged.

Performance fix discovered during browser QA:

- `/students/me/dashboard` was blocking the student shell because `ExperienceRepository.routeCards()` and `stopCards()` did N+1 queries after importing real BusMap data.
- The repository now batches route stops and stop route badges. On the RDS demo DB, the dashboard call dropped from timing out over 30s to about 1.6s.

## Data Import / QA

Artifacts:

- `database/ImportDanangBusMapData.ps1`
- `database/SeedOfficialDanangBusMapData.sql`
- `database/AuditDanangJourneyPlannerData.sql`

Importer behavior:

- Pulls BusMap web API decrypt key.
- Fetches route list and route detail for `regionCode=dn`.
- Stores route metadata, stop list, route stop order, direction, and `path_points`.
- Marks known interregional route codes/text so planner can hide them by default.
- Generated seed is idempotent with upserts.

Useful commands:

```powershell
powershell -ExecutionPolicy Bypass -File database/ImportDanangBusMapData.ps1
psql "<connection-string>" -f database/SeedOfficialDanangBusMapData.sql
psql "<connection-string>" -f database/AuditDanangJourneyPlannerData.sql
```

Current generated seed includes 25 BusMap/DanaBus route records and full route-stop/path SQL from the public BusMap web source.

RDS demo seed/audit snapshot on 2026-06-27:

- BusMap routes: 25
- Published old-Da-Nang routes: 19
- Hidden interregional routes: 6
- BusMap stops: 864
- BusMap route-stop rows: 1165
- Missing stop coordinates: 0
- Duplicate route/stop codes: 0
- Route-stop rows missing source `path_points`: 36. Planner falls back to stop coordinates for these segments.

## Frontend Changes

Main file:

- `frontend/src/components/bus/roles/student-module.tsx`

New desktop planner:

- `JourneyPlannerDesktop`
- Replaces `stu-find` route in the student module switch. The older in-file planner screens remain legacy/backward-compatible but are not active in the sidebar route.
- Uses local stop/place autocomplete plus GPS reverse lookup.
- Calls `transportApi.searchJourneys`.
- Shows result cards, selected journey detail, Leaflet route polylines, bus markers, and CTA buttons.
- Desktop layout uses an `xl` split view: journey results on the left and sticky map/detail panel on the right. This was adjusted after visual QA because `2xl` pushed the map below the fold at 1440px-wide demo viewports.
- CTA flow:
  - `Đăng ký` -> `studentApi.registerRoute` -> `stu-payment`
  - No `Mua QR` button is shown in the route-finder planner. Buying remains in `stu-payment`.
  - Tracking is grouped under `stu-my-journeys`.

Tracking screen:

- If `localStorage.unibus.trackingJourneyId` exists, `TrackingScreen` loads journey tracking snapshots from the new tracking API every 15 seconds.
- If no journey ID exists, route ETA tracking remains available, including inside `Chuyến đi của tôi`.

API client:

- `frontend/src/lib/api/client.ts`
- Added journey/place/tracking DTOs and methods:
  - `transportApi.searchPlaces`
  - `transportApi.reversePlace`
  - `transportApi.searchJourneys`
  - `transportApi.trackJourney`
  - `studentApi.purchaseJourneyMonthlyPass`

## Verification Run

Manual/API QA on 2026-06-27:

- RDS seed applied through generated SQL: 25 BusMap routes, 864 stops, 1165 route-stop rows.
- `POST /api/v1/journeys/search` for `Đại học Việt Hàn` -> `Bến xe Trung tâm Đà Nẵng` returned 8 journey options using official route `02`.
- Browser visual QA at 1440x900 desktop:
  - Planner split layout renders result cards plus right-side Leaflet map/detail panel.
  - Map is nonblank with OSM tiles, route polyline, stop markers, bus marker, and no horizontal overflow.
  - Tracking CTA opens `stu-tracking` with simulated vehicle, ETA cards, and route map.
  - Temporary QA screenshots:
    - `C:/Users/DuckHai/AppData/Local/Temp/unibus-journey-planner-desktop-qa.png`
    - `C:/Users/DuckHai/AppData/Local/Temp/unibus-journey-tracking-desktop-qa.png`

Passed:

```powershell
cd frontend
npm run build
```

Passed:

```powershell
& "C:\Users\DuckHai\.m2\wrapper\dists\apache-maven-3.9.15-bin\4rlcemksed9vjmkvgss0jpc4po\apache-maven-3.9.15\bin\mvn.cmd" -q -DskipTests compile
& "C:\Users\DuckHai\.m2\wrapper\dists\apache-maven-3.9.15-bin\4rlcemksed9vjmkvgss0jpc4po\apache-maven-3.9.15\bin\mvn.cmd" -q test
```

Run again after any backend edit.

## Follow-Up Work

## 2026-06-28 Google Maps Reference Planner Correction

Scope:

- The FPT Complex testcase was recalibrated against Google Maps screenshots. A walking total around 25 minutes is not automatically a bug for the current GPS point and destination wall/gate coordinate.
- `JourneyPlannerService` now uses Google-like result density: return at most 2 best options after dedupe instead of listing every reachable route/stop combination.
- Stop search radius is 1500m. Access walking is capped at 1300m per origin/destination leg, total access walking at 2400m, and transfer walking at 300m.
- The old "900m is too far" behavior was removed. Options inside the hard caps are scored instead of hard-filtered.
- Backend and frontend rank by `totalMinutes + transferCount*12 + walkMinutes*0.75 + longWalkPenalty + confidencePenalty`, where long-walk penalty only starts after 1800m total walking.
- Journey options are deduplicated by bus route sequence plus direction, for example `16:0` or `16:0 > 06:1`. Boarding/alighting stop choices no longer create duplicate cards for the same route sequence.
- The frontend mirrors backend ranking/dedupe and also caps visible results at 2, so stale or broader API responses do not flood the desktop UI.
- Result card behavior changed: clicking a card now only selects the option and redraws the map. The user enters the deep panel only through `Xem chi tiết`.
- Result cards are intentionally compact: route badges, departure-arrival time, total minutes, transfer count, total walking minutes, and headway/ETA text. Single-trip price and full leg detail are not shown on compact cards.
- Detail panels keep the Google-style step narrative: walk from `Vị trí hiện tại`/origin to boarding stop, take bus leg(s), then walk from alighting stop to destination.
- Leaflet popups now use UniBus map popup classes and app font stack to avoid the default Leaflet font/weight mismatch.
- GPS/current-location is used for journey search coordinates but no longer rendered as a separate extra marker on the map. The green endpoint marker in a route preview represents the boarding stop, not the student's exact GPS point.
- Browser geolocation now requests a fresh high-accuracy reading (`maximumAge: 0`) instead of accepting a cached position.
- Data QA note: route `16` is present in the BusMap seed and linked to student school demo data. Route `06` is present in source policy as interregional (`ImportDanangBusMapData.ps1` marks `06` in `$interregionalCodes`), and the planner currently filters `COALESCE(r.is_interregional, false) = false`. If product decides Google Maps parity should include `06`, this should be treated as a data-policy change, not a hidden planner bug.

Verification:

- `frontend`: `npm run build` passed on 2026-06-28.
- `backend`: Maven compile passed on 2026-06-28 using the local Maven cache path documented in the verification commands above.
- Full `mvn test` currently fails in `AiCopilotServiceTests` because the earlier chatbot fast-path returns mode `FAST_CONTEXT` while two existing assertions still expect provider modes `BEDROCK`/`ZAI`. This is outside the journey planner change set, but the tests should be updated before treating the full backend suite as green again.

Highest priority:

- For any fresh environment, apply V14/V15 then run official seed and `AuditDanangJourneyPlannerData.sql`.
- Continue visual QA desktop planner against real DB before merging major UI refinements.
- Add backend integration tests for direct journey, transfer journey, old-Da-Nang filtering, journey order, and QR scan by route.
- Extend My Ticket / Payment screens to display journey-order grouping more explicitly; current purchase endpoint works, but UI is still pass-centric.
- Decide and implement the public-route full-price policy. Current backend still requires university-linked routes for route registration.
- Add richer local landmarks for Da Nang so geocoder suggestions feel product-grade even when OSM is slow.

Do not reset/revert user work in dirty files. Existing dirty files before this refactor included `backend/src/main/java/com/unibus/api/ai/ZaiAiLlmService.java`, `frontend/src/app/globals.css`, and `frontend/src/components/bus/roles/student-module.tsx`.

## 2026-06-28 Follow-Up: Route Canonicalization, Map Drawing, And Overlay Layering

User QA found that the planner could still show noisy alternatives such as `R16` beside `16`, or transfer options even when direct route `16` is the product-grade result. This was fixed as a general rule, not a one-off testcase:

- Backend direct-route search now checks nearest candidate stops per route line, so a valid direct route is not missed just because global nearest-stop candidates were dominated by another route.
- Result dedupe now canonicalizes alias route codes like `R16` to `16` in the route-sequence signature. Alias routes also receive a small score penalty, so official numeric routes win when they are otherwise comparable.
- Direct journeys are preferred. A transfer option is only kept if it beats the best direct option by a strong margin.
- Current planner thresholds are: nearest stop radius `1700m`, max access walk per end `1600m`, max total walk `2700m`, transfer walk `300m`.
- Planner no longer uses the old hard filter for interregional routes inside journey search. This prevents data-policy hiding from silently blocking valid options, while scoring/dedupe still keeps the UI compact.
- Journey card copy now separates total journey time from waiting time: the right side labels `Tổng`, while the meta line uses `Chờ X phút`/`Xe sắp tới`. This avoids reading `61 phút` and `xe tới trong 11 phút` as conflicting values.
- Compact cards show walking minutes, not raw meters, and no fare. Detail view still contains route steps.
- Journey map now disables stop-to-stop fallback polylines for planner previews. If backend shape data is missing, the planner will not draw a misleading straight bus line.
- Planner does not render a separate GPS marker. It only draws dashed walking segments, boarding/alighting stop markers, and actual bus route polylines from backend `path_points`.
- Header/dropdown overlays were raised above the journey/map stacking context so the avatar menu is not hidden behind the planner.

API verification after backend restart:

- `Vị trí hiện tại` near Hải Châu -> `Bến xe buýt Đại học Việt Hàn`, `maxBusLegs=2`: 1 option, route `16`, direct, 46 minutes, 5 minutes walking, bus polyline 121 points.
- Same origin/destination with `maxBusLegs=1`: 1 option, route `16`, direct.
- Bình Minh-ish GPS -> `Bến xe buýt Đại học Việt Hàn`: 1 option, route `16`, direct, longer walking accepted instead of returning `0 kết quả`.
- Trần Phú-ish GPS -> FPT wall destination: 1 option, route `16`, direct, with start/end walking legs and bus polyline 116 points.
- Place search for `đại học việt` now prioritizes `Bến xe buýt Đại học Việt Hàn` and `Đại học Việt Hàn`; the raw lowercase `đại học việt` stop label is no longer shown as-is.

Verification commands passed after this follow-up:

```powershell
cd frontend
npm run build
```

```powershell
cd backend
& "C:\Users\DuckHai\.m2\wrapper\dists\apache-maven-3.9.15-bin\4rlcemksed9vjmkvgss0jpc4po\apache-maven-3.9.15\bin\mvn.cmd" -q -DskipTests compile
```

## 2026-06-28 Follow-Up: Desktop Result Card Polish Before PR

Scope was intentionally narrow: only route result cards and the lookup route icon alignment were touched. Overall page layout, navigation, map, colors, and backend APIs were not redesigned in this pass.

Route result card changes:

- Reworked the compact result card into a lower two-column layout:
  - Left side: route flow and compact trip metadata.
  - Right side: total duration and `Xem chi tiết` CTA.
- Preserved all required information: route sequence, departure-arrival time, total duration, transfer count, walking time, waiting time, and details button.
- Total duration now uses human-readable labels such as `1 giờ 11 phút` instead of raw `71 phút`.
- Route badges are pill-shaped (`rounded-full`, wider min width) so they no longer look like clipped squares.
- Walking, transfer, and waiting metadata use icons inline to reduce text weight.
- Removed card shadow per latest UI feedback. The card now relies on border, background, and state-layer hover only.
- Kept `Xem chi tiết` behavior unchanged; clicking the card still previews/draws the option, while the button opens the detail panel.

Lookup route card change:

- The bus icon wrapper in route lookup cards is vertically centered against the card content row (`items-center`), fixing the visual misalignment reported in screenshots.

Data/product notes:

- Current published route list does not include route `01`; API `/routes` currently starts at `02` and includes `02, 03, 04, 05, 07, 08, 11, 12, 14, 16, 17, N1, N2, R15, R16, R17A, R4A, R6A, TMF1`.
- If `01` appears again in journey results, treat it as stale frontend/backend state or a route-selection bug, not a valid published route from the current API.

Verification after this polish:

```powershell
cd frontend
npm run build
```

Status:

- Ready for PR review from the frontend/build perspective.
- Do not merge directly to `main` without reviewing the full dirty worktree, because this branch also contains broader chatbot/API edits from earlier work.
