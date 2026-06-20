# UniBus UI v1.1 Design System

UIPrototype v1.1 is the visual source of truth for UniBus. The production app must keep the same expressive student and operations dashboard language while replacing prototype-only state with real backend data and database seed data.

## Visual Direction

- Mood: bright, Android-like, rounded, animated, operationally dense, and friendly on mobile.
- Primary contrast: ink `#14140f` paired with electric lime `#beff50`.
- Supporting accents: civic blue `#144fcc`, coral `#ff8c5f`, soft violet `#c8a0ff`, and warm neutral surfaces.
- Main surfaces use large rounded panels, high-contrast CTA zones, pill chips, compact metric cards, and touchable list rows.
- Dashboards should look populated from real data. Do not simplify a role home into a plain table when the prototype has a hero, quick actions, route cards, chart, or live-status section.

## Runtime Stack

- Frontend: Next.js 16, React 19, Tailwind CSS 4.
- UI primitives: existing shadcn/Radix layer from the v1.1 port.
- Motion: `framer-motion`, because the prototype already uses it.
- Icons: `lucide-react`, with the existing v1.1 icon treatment.
- Charts/maps/QR: `recharts`, `leaflet`, and `qrcode.react` only where screens actually need them.
- Removed from runtime: Google Material Web packages, Material Symbols, `motion/react`, frontend mock services, demo login state, role switchers, Prisma, NextAuth, Zustand, TanStack Query, and Bun scripts.

Material 3 Expressive is a design influence here, not a dependency requirement. The implementation target is fidelity to `frontend/UIPrototype_v1.1.tar`.

## Motion Rules

- Use springy page/card transitions, active navigation pills, tap feedback, and staggered dashboard reveals similar to the prototype.
- Prefer transform and opacity animation over width/height changes.
- Keep loading and empty transitions calm; operations screens must remain scannable.
- Future motion work must respect reduced-motion preferences.

## Data Rules

Runtime UI may render only:

1. Backend data from `/api/v1`.
2. Loading state.
3. Error state with retry.
4. Empty state.
5. Unavailable state for a screen whose backend is intentionally deferred.

Do not add local sample records, local role switching, fake counts, fake success toasts, generated users, or frontend fixtures. Demo richness belongs in SQL seed files, especially `database/SeedPrototypeFidelityDemo.sql`.

## Role Composition Targets

- Student: greeting hero, next-trip panel, quick actions, route chips, ETA/list composition, QR/pass card, notifications, history, lost item/support flows.
- Driver: active trip hero, today schedule, timeline, location/occupancy update, history, feedback.
- Assistant: trip selector, QR scan workspace, ticket checks, incident create/list, lost item queue.
- Coordinator: live fleet, schedule board, route/stop operational cards, university filter where available, feedback.
- Admin: analytics hero, route metrics chart, users/verifications, fares, complaints/violations, university linkage.
- University Admin: profile/campus/domain/roster/subsidy/stats/reconciliation/notify from scoped APIs.

If a prototype-only block still lacks an API, keep the visual shell but render a clear unavailable state inside that block.

## AI Agent Rules

- Read `docs/AI_AGENT_DEVELOPMENT_GUIDE.md` before UI work.
- Compare against `frontend/UIPrototype_v1.1.tar` before changing a role screen.
- Keep `frontend/src/lib/api/client.ts` as the API boundary.
- Port composition from the prototype, not architecture. Do not bring back mock selectors, local app state, prototype auth, Prisma, or single-page demo routing.
- Add backend endpoints or seed SQL when a beautiful prototype block needs real data.

## QA Checklist

- No horizontal overflow at `390px`, `768px`, or `1440px`.
- Touch targets stay at least 44px high.
- Long Vietnamese labels wrap cleanly.
- Loading, empty, error, and unavailable states are visible.
- Keyboard focus remains visible on forms, menus, and action buttons.
- `npm run lint`, `npm run build`, and backend tests pass before handoff.
