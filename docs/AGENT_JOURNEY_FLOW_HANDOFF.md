# UniBus Student Journey Flow Handoff

Date: 2026-06-27

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

- `JourneyPlannerDesktopScreen`
- Replaces `stu-find` route in the student module switch.
- Uses local stop/place autocomplete plus GPS reverse lookup.
- Calls `transportApi.searchJourneys`.
- Shows result cards, selected journey detail, Leaflet route polylines, bus markers, and CTA buttons.
- Desktop layout uses an `xl` split view: journey results on the left and sticky map/detail panel on the right. This was adjusted after visual QA because `2xl` pushed the map below the fold at 1440px-wide demo viewports.
- CTA flow:
  - `Đăng ký` -> `studentApi.registerRoute` -> `stu-payment`
  - `Mua QR` -> `studentApi.purchaseJourneyMonthlyPass` -> `stu-my-ticket`
  - `Theo dõi` -> stores `unibus.trackingJourneyId` -> `stu-tracking`

Tracking screen:

- If `localStorage.unibus.trackingJourneyId` exists, `TrackingScreen` loads journey tracking snapshots from the new tracking API every 15 seconds.
- If no journey ID exists, the old route tracking UI remains available.

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

Highest priority:

- For any fresh environment, apply V14/V15 then run official seed and `AuditDanangJourneyPlannerData.sql`.
- Continue visual QA desktop planner against real DB before merging major UI refinements.
- Add backend integration tests for direct journey, transfer journey, old-Da-Nang filtering, journey order, and QR scan by route.
- Extend My Ticket / Payment screens to display journey-order grouping more explicitly; current purchase endpoint works, but UI is still pass-centric.
- Add richer local landmarks for Da Nang so geocoder suggestions feel product-grade even when OSM is slow.

Do not reset/revert user work in dirty files. Existing dirty files before this refactor included `backend/src/main/java/com/unibus/api/ai/ZaiAiLlmService.java`, `frontend/src/app/globals.css`, and `frontend/src/components/bus/roles/student-module.tsx`.
