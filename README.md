[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/q_6x2v5f)

# UniBus API - Iteration 1 Backend

Backend implementation for the Iteration 1 use cases assigned to Nguyen Duc Hai.

## Implemented Use Cases

- Authentication: register with development OTP, login, refresh token, logout, forgot password, role-based access.
- Student profile: retrieve and update the authenticated student's profile.
- Transport lookup: list active stops, search valid routes between two ordered stops, retrieve ETA for running trips.
- Route registration: register, view current registration, change route, and cancel registration.
- Travel history: retrieve paginated recent trips for the authenticated student.

## Database

The shared AWS PostgreSQL database was already provisioned before this implementation.
Flyway baselines that existing schema at version `1` and applies:

- `V2__add_verification_codes.sql`: stores hashed OTP challenges for registration and password reset.

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
```

Set `OTP_LOG_CODE=false` outside a development environment. No database credentials should be
committed; `dbauth.txt` is ignored locally.

### IntelliJ Run Configuration

Open **Run > Edit Configurations > UnibusApiApplication > Environment variables** and define:

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
| POST | `/auth/register/otp` | Issue registration OTP; the development code is logged |
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
| PUT | `/students/me/route-registrations/{id}` | Change route while retaining history |
| DELETE | `/students/me/route-registrations/{id}` | Cancel route registration |
| GET | `/students/me/travel-history?page=0&size=20` | View recent travel history |

Route registration is currently auto-approved to match the Iteration 1 requirement that the
system confirms a student's selection. It can be changed to dispatcher approval later by
switching new registrations to `PENDING`.

## Manual API Test

Open `requests/iteration1.http` in IntelliJ after the application has started. Run the requests
in order:

1. Issue a registration OTP and copy the six-digit `DEV OTP` value from the application log.
2. Paste the OTP into the registration request and create a new test student.
3. Log in and paste the returned access token into the `accessToken` variable.
4. Run profile, stops, route search, registration, and travel-history requests as data becomes available.

The automated verification is `mvn test`; it exercises authentication/session state, OTP attempt
limits, route lookup, route registration rules, ETA, and travel history against an isolated H2 database.
