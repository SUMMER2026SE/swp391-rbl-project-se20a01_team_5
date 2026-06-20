# UniBus UI v1.1 Production Integration

This frontend keeps the UI v1.1 visual system, but runtime data now comes from the Spring Boot backend through `/api/v1`. There is no local fallback data.

## Connected APIs

| Area | Frontend usage | Backend endpoints |
| --- | --- | --- |
| Auth | Email login/register/forgot password, Google login | `/auth/login`, `/auth/register/otp`, `/auth/register`, `/auth/forgot-password/otp`, `/auth/forgot-password/reset`, `/auth/oauth/google` |
| Session/profile | App shell user, profile edit, password change | `/users/me/profile`, `/users/me/password` |
| Student transport | Stops, route search, ETA | `/stops`, `/routes/search`, `/routes/{routeId}`, `/routes/{routeId}/stops/{stopId}/eta` |
| Student route registration | Current route, create/cancel registration | `/students/me/route-registrations/current`, `/students/me/route-registrations` |
| Student ticketing | Monthly pass, QR, payments, invoices | `/students/me/tickets`, `/students/me/tickets/monthly-pass`, `/students/me/payments` |
| Student history | Travel history | `/students/me/travel-history` |
| Feedback | Student submit/list, coordinator/admin resolve | `/students/me/feedback`, `/feedback`, `/feedback/{feedbackId}/resolve` |
| Notifications | List/read/create notification | `/notifications/me`, `/notifications/me/unread-count`, `/notifications/{notificationId}/read`, `/notifications` |
| Driver | Trips, start/end, location update | `/driver/trips`, `/driver/trips/{tripId}/start`, `/driver/trips/{tripId}/end`, `/driver/trips/{tripId}/location` |
| Assistant | Conductor trips, ticket list, scan QR | `/conductor/trips`, `/conductor/tickets`, `/conductor/tickets/scan` |
| Coordinator | Schedule dashboard, live fleet | `/coordinator/schedules`, `/coordinator/fleet/live` |
| Admin | Users and student verifications | `/admin/users`, `/admin/student-verifications` |
| University catalog | Public school list | `/universities/da-nang` |
| Student university linkage | My university status, roster/domain hint | `/students/me/university` |
| Admin university MVP | Universities, campuses, domains, university admins, route assignment, subsidy policies, audit logs | `/admin/universities`, `/admin/universities/{id}/campuses`, `/admin/universities/{id}/domains`, `/admin/university-admins`, `/admin/route-universities`, `/admin/subsidy-policies`, `/admin/audit-logs` |
| University Admin MVP | Scoped profile, campus/domain management, roster import, subsidy, stats, reconciliation, notification | `/university-admin/profile`, `/university-admin/campuses`, `/university-admin/domains`, `/university-admin/roster`, `/university-admin/roster/import`, `/university-admin/subsidy-policies`, `/university-admin/stats`, `/university-admin/reconciliation`, `/university-admin/notifications` |

## Deferred Screens

The following UI v1.1 screens remain visible as intentional unavailable states until matching backend APIs exist:

- Coordinator route/stop CRUD, bus/driver assignment screens beyond the schedule dashboard.
- Assistant lost item, incident report, chat/call.
- Student AI route suggestion, chatbot, lost item support.

These screens must not display sample records or generated statistics.

## Runtime Rules

- `frontend/src/lib/api/client.ts` is the frontend API boundary.
- Google login uses Google Identity Services with `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, then calls `/auth/oauth/google`.
- API errors render loading/error/empty/unavailable states; they must not fall back to local data.
- Legacy local-data services have been retired; the API boundary is now centralized.
- UI QA/demo data must come from database seed scripts, not frontend fixtures. Use `database/SeedUiV11MvpDemo.sql` after the V9 schema and base seed scripts when a screen needs realistic data.

## QA Seed Order

Run these manually in a development database when the team needs full UI coverage:

1. `database/SeedStudentVerificationTestData.sql`
2. `database/SeedUniversitySubsidyDemo.sql`
3. `database/SeedUiV11MvpDemo.sql`
4. Optional account-specific QA: `database/SeedKhanhStudentUiTestData.sql` for `khanhnv20a02@gmail.com`

Seed password for password-based accounts is `Password123!`. Useful accounts include `student.verified@unibus.local`, `driver.iter1@unibus.local`, `conductor.iter1@unibus.local`, `dispatcher.iter1@unibus.local`, `admin.verify@unibus.local`, and `uni.admin@unibus.local`.

## Verification Checklist

- Search the frontend source for retired local-data toggles and sample login shortcuts before release.
- `npm run lint`
- `npm run build`
- `mvn -q test`
