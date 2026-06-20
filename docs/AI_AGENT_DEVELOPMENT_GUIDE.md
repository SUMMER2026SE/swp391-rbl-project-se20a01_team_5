# UniBus AI Agent Development Guide

This guide is for teammates using Codex, Cursor, Claude, or another AI agent to continue UniBus development without drifting away from the current architecture.

## Read First

- Visual source of truth: `frontend/UIPrototype_v1.1.tar`.
- Runtime frontend source of truth: `frontend/src/`.
- Runtime API boundary: `frontend/src/lib/api/client.ts`.
- Backend source of truth: Spring Boot APIs under `backend/src/main/java/com/unibus`.
- Database source of truth: Flyway migrations under `backend/src/main/resources/db/migration` plus the snapshot `database/DBSchema.sql`.

Do not copy the prototype app wholesale into the project. Port its visual composition screen by screen, then bind it to the real API client.

## Current Stack

Backend:

- Spring Boot 4, Java 21, Maven
- PostgreSQL, Flyway
- JDBC/JPA mix following existing repository/service patterns
- Apache POI for XLSX roster import

Frontend:

- Next.js 16, React 19, JavaScript/TypeScript mixed source
- Tailwind CSS 4
- shadcn/Radix primitives already present in UI v1.1
- `framer-motion` for screen and component motion
- `lucide-react`, `sonner`, `qrcode.react`, `leaflet`

Retired or intentionally avoided:

- `@material/web`
- `@material/material-color-utilities`
- `material-symbols`
- `motion` / `motion/react`
- `axios`
- `qr-scanner`
- `recharts`
- Prisma, NextAuth, Zustand, TanStack Query
- Frontend mock data, demo login shortcuts, local role switchers

Material 3 Expressive is a visual direction here, not a dependency requirement.

## No-Mock Rule

Runtime UI may render only:

1. Backend data from `/api/v1`.
2. Loading state.
3. Error state with retry.
4. Empty state.
5. Unavailable state for a missing backend API.

If a screen needs data for QA, add or update a database seed script. Do not add frontend fixtures or fake counts.

## Seed Data For UI QA

Run these manually in a development database after migrations:

1. `database/SeedStudentVerificationTestData.sql`
2. `database/SeedUniversitySubsidyDemo.sql`
3. `database/SeedUiV11MvpDemo.sql`

Password for seeded password accounts: `Password123!`.

Useful accounts:

- `student.verified@unibus.local`
- `driver.iter1@unibus.local`
- `conductor.iter1@unibus.local`
- `dispatcher.iter1@unibus.local`
- `admin.verify@unibus.local`
- `uni.admin@unibus.local`

## UI v1.1 Porting Workflow

1. Extract only the files needed for comparison into `.codex-tmp`, for example:

```powershell
New-Item -ItemType Directory -Force .codex-tmp\ui-v1.1 | Out-Null
tar -xf frontend\UIPrototype_v1.1.tar -C .codex-tmp\ui-v1.1 src/components/bus/roles/student-module.tsx src/components/bus/primitives.tsx
```

2. Compare prototype vs runtime:

```powershell
git diff --no-index .codex-tmp\ui-v1.1\src\components\bus\roles\student-module.tsx frontend\src\components\bus\roles\student-module.tsx
```

3. Port visual structure, copy only reusable presentational patterns, and replace prototype selectors/mock state with API data from `frontend/src/lib/api/client.ts`.
4. Keep current auth/session/role routing. Role must come from backend login/session, not local UI state.
5. Keep deep links and existing Next app routing. Do not convert the app back to prototype-only `activeId` navigation.
6. If backend data is missing, render an empty or unavailable state.

## Known Visual Fidelity Gap

The student home dashboard is currently thinner than `UIPrototype_v1.1.tar`. During productionization, it was rewritten around real API blocks and lost prototype sections such as:

- expressive greeting hero
- quick action strip
- rich current-trip card
- ETA/map composition
- QR expansion overlay
- tabbed student panels

To fix this, port the prototype dashboard shell and bind it to real profile, notification, route registration, ticket, route/search, ETA, and history APIs. Do not reintroduce `mock-data.ts`.

## Verification Commands

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Backend:

```powershell
cd backend
mvn -q test
```

Retired dependency/import scan:

```powershell
rg "@material|material-symbols|motion/react|from `"motion|axios|qr-scanner|recharts|materialTheme" frontend/src frontend/package.json frontend/package-lock.json
```

Mock/runtime shortcut scan:

```powershell
rg "mock-data|services/mocks|NEXT_PUBLIC_USE_MOCK|Demo nhanh|demo1234" frontend/src
```

## Agent Safety Checklist

- Read the target files before editing.
- Preserve user changes and unrelated worktree changes.
- Keep backend API contracts stable unless the task explicitly changes them.
- Add migrations instead of editing old migrations after they are shared.
- Keep frontend data access centralized in `frontend/src/lib/api/client.ts`.
- Prefer small, screen-by-screen UI ports over broad rewrites.
- Run lint/build/tests before handing work back.
- Do not commit `.codex-tmp`, extracted prototype folders, local `.env`, database credentials, or generated scratch files.
