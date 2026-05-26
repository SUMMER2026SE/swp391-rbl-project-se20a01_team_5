[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/q_6x2v5f)

# BusSVDN Backend

Spring Boot backend for the BusSVDN database.

## Nguyen Truong Phuc scope

Implemented backend APIs for Driver and Bus Assistant features:

- Driver login / assistant login: `POST /api/auth/login`
- Driver schedule: `GET /api/drivers/{maTaiXe}/schedules`
- Driver assigned trips: `GET /api/drivers/{maTaiXe}/trips?from=2026-05-24&to=2026-05-31`
- Start trip: `POST /api/drivers/{maTaiXe}/trips/{maChuyenXe}/start`
- End trip: `POST /api/drivers/{maTaiXe}/trips/{maChuyenXe}/end`
- Assigned route stops: `GET /api/trips/{maChuyenXe}/route-stops`
- Trip contacts: `GET /api/trips/{maChuyenXe}/contacts`
- Internal message: `POST /api/trips/messages`
- Assistant assigned trips: `GET /api/assistants/{maPhuXe}/trips?from=2026-05-24&to=2026-05-31`
- Scan QR ticket: `POST /api/assistants/{maPhuXe}/tickets/scan`
- Assistant lost item report: `POST /api/assistants/{maPhuXe}/lost-items`
- Assistant incident report: `POST /api/assistants/{maPhuXe}/incidents`

## Run

Backend code is inside `backend/`.
JSP frontend pages are inside root `frontend/`.

Set PostgreSQL credentials with environment variables, then run:

```powershell
$env:DB_URL="jdbc:postgresql://your-host:5432/your_database?sslmode=require"
$env:DB_USERNAME="your_username"
$env:DB_PASSWORD="your_password"
```

```bash
cd backend
mvn spring-boot:run
```

For local testing without SQL Server TCP setup:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=test
```
