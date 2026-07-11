# UniBus UI v1.1 Production Integration

The frontend keeps UIPrototype v1.1 as the look and feel, but all runtime data comes from Spring Boot APIs under `/api/v1`. There is no frontend fallback data.

## API Boundary

- Single frontend boundary: `frontend/src/lib/api/client.ts`.
- Role modules consume typed view models from that file.
- API errors must produce loading/error/empty/unavailable states, never local mock data.
- Google login uses Google Identity Services with `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, then calls `/auth/oauth/google`.

## Connected Matrix

| Area | Frontend usage | Backend endpoints |
| --- | --- | --- |
| Auth | Email login/register/forgot password, Google login, logout | `/auth/login`, `/auth/register/otp`, `/auth/register`, `/auth/forgot-password/otp`, `/auth/forgot-password/reset`, `/auth/oauth/google`, `/auth/logout` |
| Session/profile | App shell user, profile edit, password change | `/users/me/profile`, `/users/me/password` |
| Student dashboard | v1.1-style home with hero, pass, route, notifications, history | `/students/me/dashboard` |
| Student transport | Stops, route search, route detail, ETA list | `/stops`, `/routes/search`, `/routes/{routeId}`, `/routes/{routeId}/stops/{stopId}/eta` |
| Student route registration | Current route, register/cancel route | `/students/me/route-registrations/current`, `/students/me/route-registrations` |
| Student ticketing | Monthly pass, QR, payments, invoices | `/students/me/tickets`, `/students/me/tickets/monthly-pass`, `/students/me/payments` |
| Student support | Lost item and support ticket flows | `/students/me/lost-items`, `/students/me/support-tickets`, `/students/me/assistant-chat` |
| Student history | Travel history | `/students/me/travel-history` |
| Notifications | List/read/create/unread count | `/notifications/me`, `/notifications/me/unread-count`, `/notifications/{notificationId}/read`, `/notifications` |
| Feedback | Student submit/list, coordinator/admin resolve | `/students/me/feedback`, `/feedback`, `/feedback/{feedbackId}/resolve` |
| Driver | Dashboard, trips, start/end, location/occupancy, feedback | `/driver/dashboard`, `/driver/trips`, `/driver/trips/{tripId}/start`, `/driver/trips/{tripId}/end`, `/driver/trips/{tripId}/location`, `/driver/feedback` |
| Assistant | Dashboard, trips, ticket list, QR scan, incidents, lost items | `/conductor/dashboard`, `/conductor/trips`, `/conductor/tickets`, `/conductor/tickets/scan`, `/conductor/incidents`, `/conductor/lost-items` |
| Coordinator | Dashboard, schedules, live fleet, feedback | `/coordinator/dashboard`, `/coordinator/schedules`, `/coordinator/fleet/live`, `/coordinator/feedback` |
| Admin | Stats, users, verifications, fares, complaints, violations | `/admin/stats`, `/admin/users`, `/admin/student-verifications`, `/admin/fares`, `/admin/complaints`, `/admin/violations` |
| University catalog | Public university list | `/universities/da-nang` |
| Student university linkage | My university status, roster/domain hint | `/students/me/university` |
| Admin university MVP | Universities, campuses, domains, university admins, route links, subsidies, audit | `/admin/universities`, `/admin/universities/{id}/campuses`, `/admin/universities/{id}/domains`, `/admin/university-admins`, `/admin/route-universities`, `/admin/subsidy-policies`, `/admin/audit-logs` |
| University Admin MVP | Scoped profile, campus/domain, roster import, subsidy, stats, reconciliation, notify | `/university-admin/profile`, `/university-admin/campuses`, `/university-admin/domains`, `/university-admin/roster`, `/university-admin/roster/import`, `/university-admin/subsidy-policies`, `/university-admin/stats`, `/university-admin/reconciliation`, `/university-admin/notifications` |

## Database And Seed Order

Run migrations through Flyway first. For the prototype-fidelity demo world, apply seed scripts in this order on a development database:

1. `database/SeedStudentVerificationTestData.sql`
2. `database/SeedUniversitySubsidyDemo.sql`
3. `database/SeedUiV11MvpDemo.sql`
4. `database/SeedKhanhStudentUiTestData.sql`
5. `database/SeedPrototypeFidelityDemo.sql`

`SeedPrototypeFidelityDemo.sql` enriches the UI with route codes/colors/frequency, stop codes/shelter state, vehicle occupancy, Duy Tan/VKU data, running trips, notifications, feedback, incidents, lost items, support tickets, route registrations, monthly pass, and travel history.

Primary student QA account: `khanhnv20a02@gmail.com`. Seed password for password-based demo accounts is `Password123!`.

Useful seeded role accounts:

- `student.verified@unibus.local`
- `driver.iter1@unibus.local`
- `conductor.iter1@unibus.local`
- `dispatcher.iter1@unibus.local`
- `admin.verify@unibus.local`
- `uniadmin.demo@unibus.local`

## Backend Display Fields

V11 adds display fields required for prototype fidelity:

- `routes.route_code`
- `routes.color_hex`
- `routes.frequency_min`
- `stops.stop_code`
- `stops.has_shelter`
- `vehicle_locations.occupancy`

Keep future UI display fields additive through new migrations. Do not edit applied migration files after they have reached a shared database.

## Verification Checklist

Frontend:

```powershell
cd frontend
npm run lint
npm run build
rg "mock-data|services/mocks|NEXT_PUBLIC_USE_MOCK|Demo nhanh|demo1234" src package.json package-lock.json Dockerfile .env.example
```

Backend:

```powershell
cd backend
mvn -q test
```

Repository:

```powershell
git diff --check
```

Manual QA at `390px`, `768px`, and `1440px` should cover Student, Driver, Assistant, Coordinator, Admin, and University Admin dashboards.
