# UniBus AI Agent Development Guide

This guide is for teammates using Codex, Cursor, Claude, or another AI agent to continue UniBus development without drifting away from the current architecture.

## Read First

- Visual source of truth: `frontend/UIPrototype_v1.1.tar`.
- Runtime frontend source of truth: `frontend/src/`.
- Runtime API boundary: `frontend/src/lib/api/client.ts`.
- Backend source of truth: Spring Boot APIs under `backend/src/main/java/com/unibus`.
- Database source of truth: Flyway migrations under `backend/src/main/resources/db/migration` plus the snapshot `database/DBSchema.sql`.

Do not copy the prototype app wholesale into the project. Port its visual composition screen by screen, then bind it to the real API client. Do not redesign from taste: if a screen exists in the prototype, compare against it first.

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
- `lucide-react`, `sonner`, `qrcode.react`, `leaflet`, `recharts`

Retired or intentionally avoided:

- Google Material Web runtime packages
- Material Symbols runtime package
- `motion` / `motion/react`
- `axios`
- `qr-scanner`
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
4. `database/SeedKhanhStudentUiTestData.sql`
5. `database/SeedPrototypeFidelityDemo.sql`

Password for seeded password accounts: `Password123!`.

Useful accounts:

- `khanhnv20a02@gmail.com`
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

## Current Prototype Fidelity Layer

The current branch has restored the main v1.1 dashboard composition for Student, Driver, Assistant, Coordinator, and Admin while keeping real auth/session and real API data. Continue in this direction:

- keep role home screens rich, with hero panels, quick actions, route/status cards, charts, and live sections where the prototype has them;
- add thin backend endpoints or database seed data when a visual block needs richer information;
- render unavailable states only when the backend is intentionally deferred;
- never solve visual emptiness by adding frontend fixtures.

University Admin is connected to the University MVP APIs. If a subsection still feels lighter than the prototype, enrich the response DTO or seed data first, then adjust the component.

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
rg "materialTheme|motion/react|from `"motion|axios|qr-scanner" frontend/src frontend/package.json frontend/package-lock.json
```

Mock/runtime shortcut scan:

```powershell
rg "mock-data|services/mocks|NEXT_PUBLIC_USE_MOCK|Demo nhanh|demo1234" frontend/src frontend/package.json frontend/package-lock.json frontend/Dockerfile frontend/.env.example
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
