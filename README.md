[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/q_6x2v5f)

# UniBus - Student Route, Ticket, QR and Payment Flow

UniBus is a student bus management project with a Spring Boot backend and a
Next.js frontend. The current student experience centers on the **Vé & Tuyến**
hub: students verify their identity, register a route with default boarding and
alighting stops, purchase a monthly pass, then use the issued QR code and invoice
from the database.

## Repository Layout

```text
project-root/
|-- backend/
|   |-- pom.xml
|   |-- requests/
|   `-- src/
|-- database/
|-- docs/
|-- frontend/
|   |-- package.json
|   `-- src/
|-- README.md
`-- .understand-anything/
```

## Implemented Use Cases

- Authentication: register with OTP email, login, Google OAuth, refresh token, logout, forgot password, role-based access.
- Student profile: retrieve and update the authenticated student's profile.
- Transport lookup: list active stops, search valid routes between two ordered stops, retrieve ETA for running trips.
- Route registration: register, view current registration, change route, update default stops on the same route, and cancel when no active monthly pass locks the route.
- Student ticketing: purchase monthly passes, render real QR codes, view payments and invoices.
- University subsidy Core MVP: map verified students to universities, restrict student route discovery to linked routes, calculate monthly-pass subsidy breakdowns, and persist invoice/pass original-subsidy-final amounts.
- Conductor validation: scan ticket QR codes against trip date, route, status, and QR value.
- Travel history: retrieve paginated recent trips for the authenticated student.

## Student Vé & Tuyến Flow

The student flow intentionally separates **route registration** from **monthly pass purchase**:

1. Verify the student account.
2. Choose a route and default boarding/alighting stops.
3. Pay for the monthly pass through the current internal confirmation method.
4. Receive the monthly-pass QR code and invoice.

Important business rules:

- A monthly pass is valid by **route**, not by a hard-locked stop pair.
- `boardingStopId` and `alightingStopId` are default stops used for ETA, statistics, demand planning, and dispatch context.
- While a student has an active monthly pass, the backend blocks changing to a different route and blocks route cancellation.
- During an active pass period, the student may update default stops only when the route stays the same.
- Conductor scan validation remains route/trip/date/status/QR based; it does not reject a valid route pass because the passenger boards at a different stop pair.
- Verified students mapped to a university only see and register routes linked through `route_universities`.
- Subsidies are calculated from `subsidy_policies` and stored on monthly passes and invoices as original amount, subsidy amount, and final amount.
- University admin, roster import, and campus management UI are future scope; the current MVP keeps those as database-backed foundations without fake UI.

Current payment behavior is an internal database confirmation, not a card, wallet, cash, or external gateway flow. `POST /students/me/tickets/monthly-pass` creates or reuses the monthly pass for the current route/month, applies the eligible subsidy breakdown, records a paid payment, creates an invoice, and returns data used to render the real QR code.

## Database

The shared AWS PostgreSQL database was already provisioned before this implementation.
Flyway baselines that existing schema at version `1` and applies:

- `V2__add_verification_codes.sql`: stores hashed OTP challenges for registration and password reset.
- Later migrations add student verification/OAuth support and demo-flow ticket scan/live-fleet columns.
- `V8__university_subsidy_foundation.sql`: adds `universities`, `campuses`, `route_universities`, `subsidy_policies`, university links on students/verifications, and subsidy breakdown columns on `monthly_passes` and `invoices`.

The university subsidy demo seed is intentionally separate from production migrations:

- `database/SeedUniversitySubsidyDemo.sql`: idempotently links the Iteration 1 demo student, route, university, campus, and 50% subsidy policy.
- `database/rollback/V8__rollback_university_subsidy_foundation.sql`: manual rollback script for the additive V8 schema if the environment needs to back out the MVP foundation.

On May 24, 2026, the shared AWS PostgreSQL database was migrated to version `2`; Flyway created
`flyway_schema_history` and the application table `verification_codes`.

## Environment Variables

```properties
DB_URL=jdbc:postgresql://<host>:5432/<database>?sslmode=require
DB_USERNAME=<username>
DB_PASSWORD=<password>
JWT_SECRET=<at-least-32-characters>
JWT_ACCESS_MINUTES=15
JWT_REFRESH_DAYS=14
OTP_EXPIRATION_MINUTES=10
OTP_LOG_CODE=true
SMTP_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=<mailbox>
SMTP_PASSWORD=<app-password>
SMTP_FROM=<mailbox>
SMTP_FROM_NAME=UniBus
SMTP_TLS=true
SMTP_AUTH=true
GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
STORAGE_PROVIDER=local
UPLOAD_BASE_DIR=uploads
S3_UPLOAD_BUCKET=
S3_UPLOAD_PREFIX=
```

Set `SMTP_ENABLED=true` and `OTP_LOG_CODE=false` outside a development environment. For Gmail,
use an App Password instead of the normal mailbox password. No database or SMTP credentials
should be committed; `dbauth.txt` is ignored locally.

For production container deployments, set `STORAGE_PROVIDER=s3` and `S3_UPLOAD_BUCKET` to a private
bucket. The backend stores uploaded avatars under `profile-avatars/` and student verification card
images under `student-verifications/`, then serves them back through authenticated API endpoints.

### IntelliJ Run Configuration

Import `backend/pom.xml` as a Maven project, then open
**Run > Edit Configurations > UnibusApiApplication > Environment variables** and define:

```text
DB_URL=jdbc:postgresql://<endpoint>:<port>/<initialdb>?sslmode=require
DB_USERNAME=<username>
DB_PASSWORD=<password>
JWT_SECRET=<at-least-32-characters>
OTP_LOG_CODE=true
```

The endpoint, port, username, database name, and password are available in the local ignored
`dbauth.txt` file. A missing `DB_URL` fails fast during startup instead of accidentally attempting
a connection to localhost.

## REST Endpoints

All endpoints use the `/api/v1` prefix. Protected endpoints require
`Authorization: Bearer <access-token>` and the `STUDENT` role.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register/otp` | Issue registration OTP by email when SMTP is enabled |
| POST | `/auth/register` | Create a student account after OTP verification |
| POST | `/auth/login` | Issue access and refresh tokens |
| POST | `/auth/refresh` | Rotate refresh token and issue a new access token |
| POST | `/auth/logout` | Revoke the current session |
| POST | `/auth/forgot-password/otp` | Issue reset OTP when the email exists |
| POST | `/auth/forgot-password/reset` | Reset password and revoke active sessions |
| GET/PATCH | `/students/me/profile` | View or update the current profile |
| GET | `/stops` | List active stops and routes passing through them |
| GET | `/routes/search?boardingStopId=&alightingStopId=` | Search routes in valid stop order |
| GET | `/routes/{routeId}/stops/{stopId}/eta` | View ETA from active trip estimates |
| POST | `/students/me/route-registrations` | Register a route |
| GET | `/students/me/route-registrations/current` | View the active registration |
| PUT | `/students/me/route-registrations/{id}` | Change route when allowed, or update default stops on the same route |
| DELETE | `/students/me/route-registrations/{id}` | Cancel route registration when no active monthly pass locks it |
| GET | `/students/me/tickets` | View monthly tickets, quote, payments, and invoice-backed ticket dashboard data |
| POST | `/students/me/tickets/monthly-pass` | Confirm internal payment and create/reuse monthly pass, payment, invoice, and QR |
| GET | `/students/me/payments` | View payment and invoice history |
| GET | `/conductor/tickets?tripId=` | List tickets for a conductor trip |
| POST | `/conductor/tickets/scan` | Validate a QR against trip route/date/status |
| GET | `/students/me/travel-history?page=0&size=20` | View recent travel history |

For the `STUDENT` role, route and stop lookup is scoped to the student's verified linked university. If a student is not verified, has no university mapping, or the university has no active route links, the API returns no selectable student routes instead of falling back to global route data.

Route registration is currently auto-approved to match the Iteration 1 requirement that the
system confirms a student's selection. It can be changed to dispatcher approval later by
switching new registrations to `PENDING`.

## Manual API Test

Open `backend/requests/iteration1.http` in IntelliJ after the application has started. Run the requests
in order:

1. Issue a registration OTP and copy the six-digit code from email. In local development with
   `OTP_LOG_CODE=true`, the code is also available as `DEV OTP` in the application log.
2. Paste the OTP into the registration request and create a new test student.
3. Log in and paste the returned access token into the `accessToken` variable.
4. Run profile, stops, route search, registration, and travel-history requests as data becomes available.

Run automated verification from the backend module:

```powershell
cd backend
mvn test
```

If Maven is not installed locally, use a Docker Maven image or a temporary local Maven distribution.
The current suite exercises authentication/session state, OTP attempt limits, route lookup, route registration rules, ETA, travel history, monthly-pass purchase idempotency, payment/invoice creation, route locking during active passes, same-route default-stop updates, and conductor QR scan behavior against an isolated H2 database.

Frontend verification:

```powershell
cd frontend
npm run lint
npm run build
```

Manual browser QA for the student flow should cover `/student`, `/student/passes`, and `/student/routes` in desktop and mobile viewports. Verify these states:

- No route registration: dashboard and hub show the next action, with no blank QR placeholder.
- Route registered but no monthly pass: hub shows payment-ready state, only `Chuyển khoản / xác nhận hệ thống`, and no fake QR.
- Active monthly pass: hub and dashboard render a real QR from `monthly_passes.qr_code`, invoices show DB-backed original-subsidy-final breakdowns, and route switching is blocked while same-route default-stop updates remain possible.
- Active pass missing QR data: UI shows an explicit missing-QR state and reload CTA instead of an empty QR frame.
