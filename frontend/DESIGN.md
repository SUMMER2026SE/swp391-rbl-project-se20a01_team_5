# UniBus — Design System Documentation

> Tài liệu này dành cho AI/developer kế thừa dự án. Đọc kỹ trước khi chỉnh sửa UI.

## Tổng quan

UniBus là hệ thống đặt xe bus sinh viên liên kết trường đại học tại Đà Nẵng. UI được thiết kế theo **Material 3 Expressive** kết hợp **bảng màu phong cách perk.com** (bold, vibrant, không pale).

- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **UI lib**: shadcn/ui (New York) + Lucide icons
- **Animation**: framer-motion (spring physics)
- **Map**: Leaflet + OpenStreetMap (real tiles, không API key)
- **Font**: Roboto Flex (variable)

---

## Bảng màu (Palette)

### Quy tắc cốt lõi: BOLD, KHÔNG pale

Tất cả màu phải **đậm, rực rỡ**. KHÔNG dùng màu nhạt/pastel (như `#e8ffa3`, `rgb(232,255,163)`). Container tokens được redefine thành bold colors.

### Bảng màu chính

| Token | Hex | Mô tả | Dùng cho |
|---|---|---|---|
| **Primary** | `#beff50` | Lime rực rỡ (perk green) | Nút chính, accent, active state |
| **on-primary** | `#14140f` | Off-black (text trên lime) | Text trên nền lime |
| **Secondary** | `#144fcc` | Perk blue | Nút phụ, link, icon accent |
| **Tertiary** | `#ff8c5f` | Coral | Hero cards, rating, accent |
| **Error** | `#dc2626` | Đỏ đậm | Lỗi, xóa, badge |
| **Success** | `#16a34a` | Xanh đậm | Thành công, verified |
| **Warning** | `#f59e0b` | Amber | Cảnh báo |
| **Purple** | `#c8a0ff` | Tím nhạt (bold) | AI, điểm tích lũy |
| **Off-black** | `#14140f` | Nền dark, text | Dark cards, text chính |
| **Off-white** | `#f5f5eb` (warm) | Nền chính | Background |

### Màu accent mở rộng (perk multicolor)

Dùng cho StatCards, Quick Actions, badges:

| Màu | Hex | Ví dụ dùng |
|---|---|---|
| Lime | `#beff50` | Primary CTA, active nav |
| Off-black | `#14140f` | Dark card, dark stat |
| Coral | `#ff8c5f` | Coral stat, MoMo |
| Blue | `#144fcc` | Blue stat, VNPay |
| Purple | `#c8a0ff` | Purple stat, AI |
| Red | `#dc2626` | Error badge, vi phạm |
| Green | `#16a34a` | Success, verified |
| Amber | `#f59e0b` | Warning |

### CSS Tokens (globals.css)

```css
/* Student role scoped theme — data-role-theme="student" */
--m3-primary: #beff50;
--m3-on-primary: #14140f;
--m3-primary-container: #14140f;      /* BOLD dark, KHÔNG pale */
--m3-on-primary-container: #beff50;
--m3-secondary: #144fcc;
--m3-secondary-container: #144fcc;    /* BOLD */
--m3-on-secondary-container: #ffffff;
--m3-tertiary: #ff8c5f;
--m3-tertiary-container: #ff8c5f;     /* BOLD */
--m3-on-tertiary-container: #14140f;
--m3-error: #dc2626;
--m3-error-container: #dc2626;        /* BOLD */
--m3-success: #16a34a;
--m3-success-container: #16a34a;      /* BOLD */
--m3-warning: #f59e0b;
--m3-warning-container: #f59e0b;      /* BOLD */
```

> **Quan trọng**: `bg-primary-container` giờ = `#14140f` (dark), KHÔNG phải pale green. Nếu thấy pale, kiểm tra CSS tokens có bị override không.

---

## Typography

- **Font**: Roboto Flex (variable, 100-900)
- **Headings**: `font-bold tracking-tight`, `text-balance`
- **Display**: `text-4xl sm:text-5xl lg:text-6xl` cho hero
- **Body**: `text-sm` hoặc `text-base`
- **Numbers**: `tabular-nums` (fixed-width, không shift layout)
- **Labels**: `text-xs font-bold uppercase tracking-wide`

---

## Layout

### App Shell (`src/components/bus/app-shell.tsx`)

```
┌─────────────────────────────────────────┐
│ Sidebar (272px, sticky)  │  Top App Bar  │
│                         │  (glass-m3)    │
│  Brand: UniBus          ├────────────────┤
│  Nav (grouped)          │                │
│  - rounded-2xl items    │   Main content │
│  - layoutId pill active │   (max-w-7xl)  │
│                         │                │
│  Role Switcher          │   Footer       │
└─────────────────────────┴────────────────┘
```

- **Sidebar**: `sticky top-0 h-screen`, `bg-surface-container-low`
- **Nav items**: `rounded-2xl`, active = `bg-[#14140f] text-[#beff50]` (layoutId spring pill)
- **Top app bar**: `glass-m3` (backdrop-blur), `sticky top-0 z-30`
- **Mobile**: hamburger menu (Sheet) + back button (ArrowLeft khi không ở first nav item)
- **Root**: `overflow-x-hidden` (chống horizontal scroll)

### Page Layout (`PageTransition`)

```tsx
<PageTransition className="space-y-6 min-w-0">
  <PageHeader title="..." icon={...} />
  {/* content */}
</PageTransition>
```

- `min-w-0` trên tất cả flex/grid children có text
- `truncate` cho text dài
- `shrink-0` cho icons/badges

---

## Components

### Primitives (`src/components/bus/primitives.tsx`)

| Component | Props | Mô tả |
|---|---|---|
| `PageHeader` | title, description, icon, actions | Header mỗi screen, icon trong dark box |
| `StatCard` | label, value, icon, hint, accent | Bold color block (dark/lime/coral/blue/purple) |
| `Section` | title, description, children, actions | Section wrapper |
| `EmptyState` | icon, title, description, action | Empty state với dark icon box |

### M3 Primitives (`src/components/m3/primitives.tsx`)

| Component | Variants | Mô tả |
|---|---|---|
| `ExpressiveButton` | filled, tonal, outlined, text, elevated, error | Spring press (scale 0.94) |
| `ExpressiveCard` | filled, outlined, elevated | Tonal surface |
| `Chip` | assist, filter, input, suggestion | Small chip |
| `StatusPill` | neutral, primary, tertiary, success, warning, error | Status badge |
| `M3Progress` | value | Spring progress bar |

### Motion (`src/components/m3/motion.tsx`)

| Component | Mô tả |
|---|---|
| `SplitText` | Word-by-word clip reveal (GSAP-style) |
| `ScrollReveal` | In-view fade + translate |
| `StaggerGroup` / `StaggerItem` | Orchestrated children reveal |
| `Counter` | Count-up number, `tabular-nums` + reserved width |
| `Marquee` | Infinite horizontal scroll |
| `ClipReveal` | Clip-path wipe reveal |
| `Shimmer` | Loading shimmer |
| `PageTransition` | Fade + slide (no blur) |

### Map (`src/components/m3/real-map.tsx`)

- **RealMap**: Leaflet + OpenStreetMap, real Đà Nẵng streets
- Dynamic import (tránh SSR `window` error)
- Bus marker animate theo progress (setLatLng)
- Stop markers = divIcon (flat circle, white center)
- Route polyline + glow underlay
- `React.memo` + `preferCanvas: true` (perf)

---

## Design Patterns

### StatCard (bold color block)

```tsx
<StatCard
  label="Tuyến đã đăng ký"
  value={<Counter to={1} />}
  icon={<RouteIcon className="size-5" />}
  accent="primary"  // → dark bg + lime icon
/>
```

Accent map:
- `primary` → bg `#14140f`, icon `#beff50`
- `tertiary` → bg `#ff8c5f`, icon `#14140f`
- `secondary` → bg `#144fcc`, icon `#beff50`
- `error` → bg `#dc2626`, icon `#fff`
- `success` → bg `#16a34a`, icon `#fff`

### Hero Card (bold color)

```tsx
<motion.div
  className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
  style={{ backgroundColor: "#beff50", color: "#14140f" }}
>
  <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl" />
  {/* content */}
</motion.div>
```

### Tab Switcher (layoutId pill)

```tsx
<div className="inline-flex rounded-full bg-surface-container-high p-1">
  {options.map((t) => (
    <button className="relative h-9 px-5 rounded-full">
      {active && (
        <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-full bg-[#14140f]" />
      )}
      <span className="relative">{label}</span>
    </button>
  ))}
</div>
```

### Nav Item (sidebar)

```tsx
<button className="group relative flex w-full items-center gap-3 rounded-2xl px-4 py-2.5">
  {active && (
    <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-2xl bg-[#14140f]" />
  )}
  <Icon className="relative size-5" />
  <span className="relative flex-1 truncate">{label}</span>
</button>
```

---

## Roles

6 roles, mỗi role có nav config riêng (`src/components/bus/nav-config.ts`):

| Role | Label | Nav items | Theme |
|---|---|---|---|
| `student` | Sinh viên | 17 | Perk (scoped `data-role-theme="student"`) |
| `driver` | Tài xế | 8 | Default M3 |
| `assistant` | Phụ xe | 9 | Default M3 |
| `coordinator` | Điều phối viên | 12 | Default M3 |
| `admin` | Quản trị viên | 12 | Default M3 |
| `university_admin` | Admin trường ĐH | 11 | Default M3 |

> **Lưu ý**: Hiện chỉ student role có perk theme scoped. Các role khác dùng default M3 (emerald/teal). Nếu muốn perk cho tất cả, bỏ `[data-role-theme="student"]` selector trong globals.css.

---

## Mobile Responsive

### Quy tắc bắt buộc

1. **Root**: `overflow-x-hidden`
2. **Flex/grid children có text**: `min-w-0` + `truncate`
3. **Icons/badges**: `shrink-0`
4. **Touch targets**: ≥ 44px (`min-h-11`)
5. **Grid collapse**: `grid-cols-1` mobile → `sm:grid-cols-2` → `lg:grid-cols-3`
6. **Tables**: `overflow-x-auto scrollbar-soft` wrapper + `min-w-[640px]`
7. **Padding**: `p-3 sm:p-5 lg:p-6`
8. **Text size**: `text-xs sm:text-sm`, `text-3xl sm:text-5xl`

### Counter (chống layout break)

```tsx
<Counter
  to={126000}
  format={(n) => formatVND(n)}
/>
// Component tự reserve width = finalStr.length + 1 ch
// + tabular-nums (fixed-width digits)
```

---

## Animation

### Spring physics (mặc định)

```tsx
transition={{ type: "spring", stiffness: 400, damping: 22 }}
```

- **Hover lift**: `whileHover={{ y: -3 }}`
- **Tap press**: `whileTap={{ scale: 0.97 }}`
- **Page transition**: spring stiffness 260 damping 28
- **Nav pill**: layoutId spring stiffness 400 damping 32

### KHÔNG dùng

- `whileHover={{ x: 2 }}` (gây jitter)
- `filter: blur()` trong transitions (flicker trên máy yếu)
- `box-shadow` nặng (dùng `elev-1/2/3` subtle)

### Performance (máy yếu)

- `React.memo` cho components nặng (RealMap)
- `willChange: transform` cho animated decorative elements
- `preferCanvas: true` cho Leaflet
- Lightweight animation (setLatLng, không rebuild DOM)
- `tabular-nums` cho số (no layout shift)

---

## Elevation

M3 prefers **tonal surface containers** over shadows. Shadows minimal:

```css
.elev-1 { box-shadow: 0 1px 2px oklch(0.2 0.02 155 / 0.05); }
.elev-2 { box-shadow: 0 1px 2px oklch(0.2 0.02 155 / 0.06), 0 2px 4px oklch(0.2 0.02 155 / 0.04); }
.elev-3 { box-shadow: 0 1px 3px oklch(0.2 0.02 155 / 0.08), 0 4px 8px oklch(0.2 0.02 155 / 0.06); }
```

- `elev-1`: cards mặc định
- `elev-2`: hover, raised cards
- `elev-3`: FAB, modals, hero cards

KHÔNG dùng `shadow-sm/md/lg/xl` (non-M3).

---

## State Layer

M3 state layer — overlay hover/focus/press:

```css
.state-layer::after {
  content: "";
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.18s;
}
.state-layer:hover::after { opacity: 0.08; }
.state-layer:active::after { opacity: 0.12; }
```

Thêm `state-layer` class cho mọi interactive element.

---

## File Structure

```
src/
├── app/
│   ├── globals.css          # M3 tokens + perk theme + utilities
│   ├── layout.tsx           # Roboto Flex font + metadata
│   └── page.tsx             # Orchestrator (auth + role routing)
├── lib/
│   ├── types.ts             # Domain types (User, Route, Bus, University...)
│   └── mock-data.ts         # All mock data (Đà Nẵng real locations)
├── components/
│   ├── m3/
│   │   ├── primitives.tsx   # ExpressiveButton, Card, Chip, StatusPill...
│   │   ├── motion.tsx       # SplitText, ScrollReveal, Counter, Marquee...
│   │   ├── real-map.tsx     # Leaflet + OSM (dynamic import)
│   │   └── bus-map.tsx      # SVG fallback map (legacy)
│   ├── bus/
│   │   ├── app-shell.tsx    # Sidebar + topbar + mobile drawer
│   │   ├── auth-screens.tsx # Homepage + login + register + forgot
│   │   ├── common-screens.tsx # Profile, Notifications, Support, Settings, MyUniversity
│   │   ├── primitives.tsx   # PageHeader, StatCard, Section, EmptyState
│   │   ├── nav-config.ts    # Nav items per role + ROLE_LABELS/COLORS/AVATARS
│   │   └── roles/
│   │       ├── student-module.tsx        # 17 screens
│   │       ├── driver-module.tsx         # 8 screens
│   │       ├── assistant-module.tsx      # 9 screens
│   │       ├── coordinator-module.tsx    # 12 screens
│   │       ├── admin-module.tsx          # 12 screens
│   │       └── university-admin-module.tsx # 11 screens
│   └── ui/                  # shadcn/ui components
```

---

## Checklist trước khi commit

- [ ] `bun run lint` → 0 errors
- [ ] Không có `shadow-sm/md/lg` (dùng `elev-1/2/3`)
- [ ] Không có pale tints (`#e8ffa3`, `bg-*-container/30` opacity thấp)
- [ ] `text-primary` trên nền sáng → đổi `text-[#144fcc]` hoặc `text-[#14140f]`
- [ ] `min-w-0` + `truncate` cho flex/grid text children
- [ ] `overflow-x-hidden` trên root wrapper
- [ ] Touch targets ≥ 44px
- [ ] `tabular-nums` cho số
- [ ] Mobile test 390px (không horizontal overflow)
- [ ] `data-role-theme="student"` scope perk theme

---

## Known Issues / TODO

- Real map (Leaflet) cần dynamic import để tránh SSR `window` error
- Counter reserve width dùng `ch` unit — có thể lệch 1-2px trên font lạ
- Sidebar nav pill `layoutId` reset khi switch role (cần unique id per role)
- University theme scoped chỉ cho student — mở rộng nếu cần

---

*Cập nhật lần cuối: 2025-06-19*
