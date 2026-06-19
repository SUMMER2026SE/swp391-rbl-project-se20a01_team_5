# UniBus UI v1.1 Design System

UniBus uses the UIPrototype v1.1 visual direction as the product UI: Material 3 Expressive-inspired surfaces, bold lime/ink contrast, rounded panels, spring motion, dense-but-touchable operational dashboards, and mobile-first navigation.

## Visual Language

- Primary contrast: ink `#14140f` with lime `#beff50`.
- Supporting accents: blue `#144fcc`, coral `#ff8c5f`, soft violet `#c8a0ff`.
- Surfaces use Material-style tokens from `globals.css`: background, surface containers, outline, primary, secondary, tertiary, error.
- Cards use rounded `1rem-1.5rem` corners, clear elevation, and no nested decorative card stacks.
- Icons come from lucide/shadcn UI currently; Material Symbols can be layered in later where the prototype calls for Android-like icon rhythm.

## Motion

- Page and nav transitions use the UI v1.1 spring-motion patterns already present in the frontend components.
- Motion must communicate continuity: active nav pill, page fade/slide, tap feedback, lightweight reveal.
- Avoid animating width/height for frequent interactions; use transform/opacity.
- Respect reduced-motion in future motion refinements.

## Production Data Rule

The UI may keep screens from the prototype, but runtime content must be one of:

1. Backend data from `/api/v1`.
2. A loading state.
3. An error state with retry.
4. An empty state.
5. An unavailable state explaining the missing backend API.

Do not add generated records, sample counts, local sample users, local role switching, or optimistic success messages that are not backed by an API response.

## Navigation

- Desktop: fixed left rail/sidebar with grouped role navigation.
- Mobile: top app bar plus drawer. Bottom navigation can be added later if the app is split into route-level screens.
- Role is determined by backend auth/session only.
- Notification badges come from `/notifications/me/unread-count`.

## Connected Flow Priorities

- Student: profile, university catalog, university linkage state, route search, route registration, ETA, ticket/pass QR, payments, history, notifications, feedback.
- Driver: assigned trips, start/end trip, location update.
- Assistant: conductor trips, ticket list, QR scan.
- Coordinator: schedules, live fleet, feedback, notifications.
- Admin: users, student verification review, university management, university admins, route-university assignment, subsidy policies, audit logs, feedback, notifications.
- University Admin: scoped profile, campus/domain management, roster import, subsidy policies, stats, reconciliation, notifications.

## Accessibility And UX Rules

- Touch targets should remain at least 44px high.
- Forms need visible labels and inline loading/error feedback.
- Empty/unavailable states must be explicit and helpful.
- Destructive actions use error styling and clear labels.
- Data-heavy cards must wrap text and avoid horizontal overflow at `390px`.
