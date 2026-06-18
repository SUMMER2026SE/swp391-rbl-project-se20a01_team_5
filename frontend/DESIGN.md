# UniBus Material 3 Expressive Design System

## Design Intent
UniBus should feel like a real Android-native transit product brought to the web: soft, adaptive, personal, and operationally clear. The interface should be playful enough for students on phones, but still dense and reliable for admins, drivers, conductors, and coordinators.

The design direction is Material 3 Expressive, implemented as a custom React/Tailwind layer instead of a wholesale dependency on `@material/web`. Material Web components provide useful reference behavior for state layers, ripple feedback, tokens, and component structure, but UniBus keeps its own UI primitives to preserve existing business logic and Next.js patterns.

## Color Roles
- Source color: `#315FDA`, a transit blue that works well for route tracking, app identity, and selected states.
- Primary: high-emphasis actions, active navigation, route highlights, and main CTAs.
- Secondary: supporting controls, filters, metadata, and role-specific surfaces.
- Tertiary: expressive moments such as AI assistant, feedback, and celebratory states.
- Surface containers: replace flat white cards with layered M3 surfaces from lowest to highest elevation.
- Semantic colors: success, warning, and danger stay stable for operational clarity.

## Typography
- Primary font: Inter, already used by the app.
- Mono font: JetBrains Mono for ticket codes, trip IDs, invoice numbers, QR payloads, timestamps, and vehicle identifiers.
- Use sentence case by default. Avoid all-caps labels except small status chips and section metadata.
- Mobile hierarchy should favor large, friendly screen titles; desktop dashboards should keep headings compact.

## Shape And Elevation
- Extra small `4px`: tiny indicators and progress details.
- Small `8px`: chips and inline controls.
- Medium `12px`: text fields and compact buttons.
- Large `18px`: cards, list items, nav pills.
- Extra large `28px`: sheets, hero panels, scanner/camera frames, modal surfaces.
- Full: FABs, avatars, nav active indicators.
- Elevation is restrained. Prefer tonal surfaces first, then shadow only for floating controls, top app bars, nav rails, sheets, and active cards.

## Motion Rules
- Use `motion` for page entrances, card stagger, sheet/dialog transitions, active nav pill layout animation, and selected-card transitions.
- Use CSS transitions for hover, focus, pressed states, and simple color/opacity changes.
- Use Material-like spring easing: soft overshoot is acceptable for nav indicators, sheets, FABs, and selected cards.
- Always respect `prefers-reduced-motion`.
- Avoid decorative motion that does not explain state, location, hierarchy, or progress.

## Navigation
- Desktop: Material navigation rail or expanded rail, with active pill and clear icon/label pairing.
- Mobile: bottom navigation bar with large touch targets and filled active icon treatment.
- Top app bar: compact on desktop, large and more expressive on mobile.
- Primary contextual action may appear as a FAB on mobile when a page has one dominant action.

## Component Rules
- Buttons: filled for primary, filled tonal for secondary, text/outlined for low emphasis.
- Cards: filled tonal surfaces with rounded corners, clear content hierarchy, and no nested-card clutter unless representing repeated items.
- Forms: rounded M3 fields, visible labels, strong focus rings, and generous touch targets.
- Tables: keep density for admin views, but use tonal row hover, sticky header, and chips instead of raw status text.
- Scanner/QR: camera and ticket surfaces should feel like phone-native utilities, with clear states and large actions.

## Data Density
- Student and mobile-first screens should use spacious cards and bottom actions.
- Admin/coordinator screens should remain information dense, but with better grouping and surface hierarchy.
- Empty/loading/error states must be designed, not left as bare text.

## Implementation Notes
- Global tokens live in `src/app/globals.css` as `--md-sys-*` variables.
- Reusable primitives live in `src/components/ui`.
- Motion wrappers live in `src/components/motion`.
- `BentoDashboardLayout` is kept as the compatibility export but becomes the Material 3 app shell internally.
