"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bus,
  CalendarDays,
  Clock,
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  Star,
  Users,
  Gauge,
  Banknote,
  Play,
  Square,
  ChevronRight,
  Route as RouteIcon,
  Send,
  CircleDot,
  CheckCircle2,
  Circle,
  Timer,
  PhoneCall,
  University,
  ScrollText,
  Locate,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import {
  ExpressiveButton,
  ExpressiveCard,
  ListItem,
  StatusPill,
} from "@/components/m3/primitives";
import {
  SplitText,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Magnetic,
  Counter,
  PageTransition,
} from "@/components/m3/motion";
import {
  PageHeader,
  StatCard,
  Section,
  EmptyState,
} from "@/components/bus/primitives";
import {
  cn,
} from "@/lib/utils";
import {
  users,
  buses,
  routes,
  trips,
  feedbackList,
  routeById,
  stopById,
  busById,
  formatVND,
} from "@/lib/mock-data";

/* ============================================================================
   Driver Module — Material 3 Expressive + GSAP-style motion
   Driver u2 = Trần Hoàng Long, bus b1 (43B-12345), route r1 (DN-01)
   Serves Đại học Duy Tân (Đà Nẵng).
   ============================================================================ */

const DRIVER = users.find((u) => u.id === "u2")!;
const ASSISTANT = users.find((u) => u.id === "u3")!;
const COORDINATOR = users.find((u) => u.id === "u4")!;
const BUS = buses.find((b) => b.id === "b1")!;
const ROUTE = routes.find((r) => r.id === "r1")!;
const UNIVERSITY_NAME = "Đại học Duy Tân";

const todayISO = new Date().toISOString().slice(0, 10);

/* ---------------- helpers ---------------- */
function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function fmtTimer(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function useElapsed(active: boolean): number {
  const [s, setS] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return s;
}

/* status pill mapping for trips */
function tripStatusPill(status: string): React.ReactNode {
  const map: Record<string, { label: string; tone: "neutral" | "primary" | "success" | "warning" | "error" | "tertiary" }> = {
    scheduled: { label: "Đã lên lịch", tone: "neutral" },
    running: { label: "Đang chạy", tone: "primary" },
    completed: { label: "Hoàn thành", tone: "success" },
    cancelled: { label: "Đã hủy", tone: "error" },
  };
  const m = map[status] ?? map.scheduled;
  return <StatusPill label={m.label} tone={m.tone} />;
}

/* Route mini timeline (horizontal) */
function HorizontalTimeline({
  stops,
  currentIndex,
}: {
  stops: string[];
  currentIndex: number;
}) {
  return (
    <div className="relative flex items-center gap-2 overflow-x-auto scrollbar-soft py-2">
      {stops.map((sid, i) => {
        const stop = stopById(sid);
        const done = i < currentIndex;
        const active = i === currentIndex;
        const upcoming = i > currentIndex;
        return (
          <React.Fragment key={sid}>
            <div className="flex flex-col items-center gap-1.5 min-w-[88px]">
              <div className="relative">
                {active && (
                  <span className="absolute inset-0 -m-1.5 rounded-full bg-[#beff50]/40 animate-ping" />
                )}
                <div
                  className={cn(
                    "relative size-7 rounded-full flex items-center justify-center text-xs font-semibold",
                    done && "bg-[#144fcc] text-white",
                    active && "bg-[#beff50] text-[#14140f] elev-2",
                    upcoming && "bg-surface-container-highest text-on-surface-variant border-2 border-outline-variant"
                  )}
                >
                  {done ? <CheckCircle2 className="size-4" /> : i + 1}
                </div>
              </div>
              <p
                className={cn(
                  "text-[11px] font-medium text-center max-w-[80px] truncate",
                  active ? "text-[#144fcc]" : "text-on-surface-variant"
                )}
              >
                {stop?.name ?? sid}
              </p>
            </div>
            {i < stops.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 min-w-[18px] rounded-full",
                  i < currentIndex ? "bg-[#144fcc]" : "bg-outline-variant"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* Vertical route timeline */
function VerticalTimeline({
  stops,
  currentIndex,
  departTime,
}: {
  stops: string[];
  currentIndex: number;
  departTime: string;
}) {
  // Compute approximate time per stop
  const perStop = Math.max(4, Math.floor((ROUTE.durationMin || 28) / Math.max(1, stops.length - 1)));
  const [dh, dm] = departTime.split(":").map(Number);
  const baseMin = dh * 60 + dm;
  return (
    <ol className="relative pl-2">
      {stops.map((sid, i) => {
        const stop = stopById(sid);
        const done = i < currentIndex;
        const active = i === currentIndex;
        const time = `${String(Math.floor((baseMin + i * perStop) / 60) % 24).padStart(2, "0")}:${String((baseMin + i * perStop) % 60).padStart(2, "0")}`;
        return (
          <li key={sid} className="flex gap-4 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <div className="relative">
                {active && (
                  <span className="absolute inset-0 -m-1.5 rounded-full bg-[#beff50]/40 animate-ping" />
                )}
                <div
                  className={cn(
                    "relative size-8 rounded-full flex items-center justify-center",
                    done && "bg-[#144fcc] text-white",
                    active && "bg-[#beff50] text-[#14140f] elev-2",
                    !done && !active && "bg-surface-container-highest text-on-surface-variant border-2 border-outline-variant"
                  )}
                >
                  {done ? <CheckCircle2 className="size-4" /> : active ? <Locate className="size-4" /> : <Circle className="size-3" />}
                </div>
              </div>
              {i < stops.length - 1 && (
                <div className={cn("w-0.5 flex-1 min-h-[28px] mt-1 rounded-full", done ? "bg-[#144fcc]" : "bg-outline-variant")} />
              )}
            </div>
            <div className="flex-1 pt-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3 min-w-0">
                <p className={cn("text-sm font-semibold truncate", active ? "text-[#144fcc]" : "text-on-surface")}>
                  {stop?.name ?? sid}
                </p>
                <span className="text-xs font-mono text-on-surface-variant tabular-nums shrink-0">{time}</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5 truncate">{stop?.address}</p>
              {active && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-[#144fcc]">
                  <CircleDot className="size-3.5" /> Đang đến trạm
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* Decorative SVG map — projects route stops to normalized coords */
function RouteMapSVG({ currentIndex }: { currentIndex: number }) {
  const stops = ROUTE.stops.map((sid) => stopById(sid)!).filter(Boolean);
  if (!stops.length) return null;
  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const rangeLat = Math.max(0.0001, maxLat - minLat);
  const rangeLng = Math.max(0.0001, maxLng - minLng);
  const pts = stops.map((s) => ({
    x: ((s.lng - minLng) / rangeLng) * 80 + 10,
    y: (1 - (s.lat - minLat) / rangeLat) * 80 + 10,
    name: s.name,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const busIdx = Math.min(currentIndex, pts.length - 1);
  const busPos = pts[busIdx];

  return (
    <div className="relative rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant elev-1">
      <div className="absolute inset-0 grid-texture opacity-60" />
      <div className="absolute inset-0 bg-aurora-m3 opacity-30" />
      <svg viewBox="0 0 100 100" className="relative w-full h-72 sm:h-80">
        {/* Route path */}
        <path
          d={path}
          fill="none"
          stroke="var(--m3-primary)"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="2 2"
          opacity="0.8"
        />
        {/* Stop pins */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="2.2" fill="var(--m3-surface)" stroke="var(--m3-primary)" strokeWidth="1" />
            {i === 0 && <text x={p.x} y={p.y - 3} fontSize="3" textAnchor="middle" fill="var(--m3-on-surface-variant)">Điểm đầu</text>}
            {i === pts.length - 1 && <text x={p.x} y={p.y - 3} fontSize="3" textAnchor="middle" fill="var(--m3-on-surface-variant)">Điểm cuối</text>}
          </g>
        ))}
        {/* Animated bus pin */}
        <g>
          <circle cx={busPos.x} cy={busPos.y} r="3.5" fill="var(--m3-primary)" opacity="0.25">
            <animate attributeName="r" values="3.5;6;3.5" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={busPos.x} cy={busPos.y} r="2.2" fill="var(--m3-primary)" />
          <text x={busPos.x} y={busPos.y + 0.8} fontSize="2.6" textAnchor="middle" fill="var(--m3-on-primary)" fontWeight="700">🚌</text>
        </g>
      </svg>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 rounded-full bg-surface-container-high/90 px-3 py-1.5 elev-1">
          <span className="size-2 rounded-full bg-[#144fcc] animate-pulse" />
          <span className="text-xs font-medium text-on-surface">Vị trí xe trực tiếp</span>
        </div>
        <span className="rounded-full bg-surface-container-high/90 px-3 py-1.5 text-xs font-medium text-on-surface-variant elev-1">
          Tốc độ {BUS.speed} km/h
        </span>
      </div>
    </div>
  );
}

/* Contact person card */
function ContactPersonCard({
  person,
  role,
  onCall,
  onMessage,
}: {
  person: typeof COORDINATOR;
  role: string;
  onCall: () => void;
  onMessage: () => void;
}) {
  return (
    <ExpressiveCard variant="elevated" className="p-5">
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-tertiary-container text-on-tertiary-container font-bold">
          {person.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-on-surface truncate">{person.name}</p>
          <p className="text-sm text-on-surface-variant">{role}</p>
          <p className="text-xs text-on-surface-variant mt-1 truncate">{person.phone}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Magnetic strength={0.25} className="flex-1">
          <ExpressiveButton variant="tonal" size="md" className="w-full" onClick={onCall}>
            <PhoneCall className="size-4" /> Gọi
          </ExpressiveButton>
        </Magnetic>
        <Magnetic strength={0.25} className="flex-1">
          <ExpressiveButton variant="outlined" size="md" className="w-full" onClick={onMessage}>
            <MessageSquare className="size-4" /> Nhắn
          </ExpressiveButton>
        </Magnetic>
      </div>
    </ExpressiveCard>
  );
}

/* ============================================================================
   1) DRIVER DASHBOARD
   ============================================================================ */
function DriverDashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const activeTrip = trips.find((t) => t.driverId === DRIVER.id && t.status === "running");
  const todayTrips = trips
    .filter((t) => t.driverId === DRIVER.id && t.date === todayISO)
    .sort((a, b) => a.departTime.localeCompare(b.departTime));
  const completedToday = todayTrips.filter((t) => t.status === "completed");
  const totalKm = completedToday.length * (ROUTE.distanceKm || 7.8);
  const totalPassengers = completedToday.reduce((s, t) => s + t.passengerCount, 0) + (activeTrip?.passengerCount ?? 0);
  const totalRevenue = completedToday.reduce((s, t) => s + t.revenue, 0) + (activeTrip?.revenue ?? 0);
  const nextTrip = todayTrips.find((t) => t.status === "scheduled");
  const myFeedback = feedbackList.filter((f) => f.driverName === DRIVER.name);
  const avgRating = myFeedback.length
    ? (myFeedback.reduce((s, f) => s + f.rating, 0) / myFeedback.length).toFixed(1)
    : "5.0";

  return (
    <PageTransition id="drv-dashboard">
      {/* Greeting */}
      <ScrollReveal>
        <div className="mb-6 min-w-0">
          <SplitText
            text={`${greetingByHour()}, ${DRIVER.name}!`}
            as="h1"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface"
            stagger={0.04}
          />
          <p className="mt-1.5 text-sm text-on-surface-variant flex items-center gap-2 min-w-0">
            <Sparkles className="size-4 text-tertiary shrink-0" />
            <span className="truncate">Hôm nay bạn có {todayTrips.length} chuyến · Tuyến {ROUTE.code} phục vụ sinh viên {UNIVERSITY_NAME}</span>
          </p>
        </div>
      </ScrollReveal>

      {/* Active trip hero card */}
      {activeTrip && (
        <ScrollReveal delay={0.05}>
          <ExpressiveCard variant="filled" className="relative overflow-hidden mb-6 bg-[#14140f]">
            <div className="absolute inset-0 grid-texture opacity-10" />
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#beff50]/20 blur-2xl" />
            
            <div className="relative p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3 mb-4 min-w-0">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#beff50] px-3 py-1 text-xs font-bold text-[#14140f]">
                    <span className="size-1.5 rounded-full bg-[#14140f] animate-pulse" />
                    ĐANG CHẠY
                  </div>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight text-white truncate">
                    Chuyến {ROUTE.code} · {ROUTE.from} → {ROUTE.to}
                  </h2>
                  <p className="mt-1 text-sm text-white/70 truncate">
                    Xe {BUS.plate} · Khởi hành {activeTrip.departTime} · Phụ xe {ASSISTANT.name}
                  </p>
                </div>
                <div className="hidden sm:flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#beff50] text-[#14140f]">
                  <Bus className="size-8" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-2xl bg-white/10 px-4 py-3 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-[#beff50]/70">Hành khách</p>
                  <p className="text-xl font-bold mt-0.5 text-white tabular-nums">{activeTrip.passengerCount}/{BUS.capacity}</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-[#beff50]/70">Trạm tiếp theo</p>
                  <p className="text-xl font-bold mt-0.5 text-white truncate">{stopById(BUS.nextStopId ?? "s5")?.name ?? "—"}</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-[#beff50]/70">ETA</p>
                  <p className="text-xl font-bold mt-0.5 text-white tabular-nums">{BUS.etaMin} phút</p>
                </div>
              </div>
              <Magnetic strength={0.2}>
                <ExpressiveButton
                  variant="elevated"
                  size="lg"
                  className="bg-[#beff50] text-[#14140f] w-full sm:w-auto hover:brightness-95"
                  onClick={() => onNavigate("drv-active")}
                >
                  <Navigation className="size-5" /> Quản lý chuyến đang chạy
                </ExpressiveButton>
              </Magnetic>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      )}

      {/* Stat cards */}
      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StaggerItem>
          <StatCard
            label="Chuyến hôm nay"
            accent="primary"
            icon={<Bus className="size-5" />}
            value={<Counter to={todayTrips.length} />}
            hint={`${completedToday.length} đã hoàn thành`}
            trend="up"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Km di chuyển"
            accent="tertiary"
            icon={<Gauge className="size-5" />}
            value={<Counter to={Math.round(totalKm)} format={(n) => `${Math.round(n)} km`} />}
            hint="Hôm nay"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Hành khách"
            accent="secondary"
            icon={<Users className="size-5" />}
            value={<Counter to={totalPassengers} />}
            hint="Đã phục vụ"
            trend="up"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Doanh thu"
            accent="success"
            icon={<Banknote className="size-5" />}
            value={<Counter to={totalRevenue} format={(n) => formatVND(Math.round(n))} />}
            hint="Tạm tính"
            trend="up"
          />
        </StaggerItem>
      </StaggerGroup>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today schedule */}
        <ScrollReveal className="lg:col-span-2" delay={0.05}>
          <ExpressiveCard variant="outlined" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-[#144fcc]" />
                <h3 className="text-lg font-semibold text-on-surface">Lịch hôm nay</h3>
              </div>
              <ExpressiveButton variant="text" size="sm" onClick={() => onNavigate("drv-schedule")}>
                Xem tuần <ChevronRight className="size-4" />
              </ExpressiveButton>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-soft pr-1">
              {todayTrips.map((t) => {
                const r = routeById(t.routeId);
                return (
                  <ListItem
                    key={t.id}
                    leading={
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary-container text-on-primary-container font-bold text-xs">
                        {t.departTime}
                      </div>
                    }
                    title={`${r?.code ?? ""} · ${r?.from} → ${r?.to}`}
                    subtitle={`Xe ${busById(t.busId)?.plate} · ${t.passengerCount} hành khách`}
                    trailing={tripStatusPill(t.status)}
                    onClick={() => onNavigate(t.status === "running" ? "drv-active" : "drv-schedule")}
                  />
                );
              })}
              {todayTrips.length === 0 && (
                <EmptyState icon={<CalendarDays className="size-7" />} title="Hôm nay không có chuyến" />
              )}
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Rating summary + next trip */}
        <ScrollReveal delay={0.1}>
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#c8a0ff] text-[#14140f] p-5">
              <div className="flex items-center gap-2 mb-1">
                <Star className="size-5 fill-current" />
                <p className="text-sm font-bold">Đánh giá trung bình</p>
              </div>
              <p className="text-4xl font-bold">{avgRating}</p>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "size-4",
                      Number(avgRating) >= s ? "fill-current" : "opacity-30"
                    )}
                  />
                ))}
                <span className="ml-2 text-xs font-bold">{myFeedback.length} đánh giá</span>
              </div>
            </div>

            {nextTrip && (
              <ExpressiveCard variant="outlined" className="p-5">
                <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">Chuyến tiếp theo</p>
                <p className="text-xl font-bold text-on-surface mt-1">{nextTrip.departTime}</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  {ROUTE.code} · {ROUTE.from} → {ROUTE.to}
                </p>
                <ExpressiveButton
                  variant="tonal"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => onNavigate("drv-schedule")}
                >
                  Xem chi tiết <ArrowRight className="size-4" />
                </ExpressiveButton>
              </ExpressiveCard>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* Route preview with horizontal timeline */}
      <ScrollReveal className="mt-6" delay={0.05}>
        <ExpressiveCard variant="filled" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RouteIcon className="size-5 text-[#144fcc]" />
              <h3 className="text-lg font-semibold text-on-surface">Tuyến đang chạy</h3>
            </div>
            <span className="text-xs text-on-surface-variant">
              {ROUTE.stops.length} trạm · {ROUTE.durationMin} phút
            </span>
          </div>
          <HorizontalTimeline stops={ROUTE.stops} currentIndex={BUS.currentStopIndex ?? 1} />
        </ExpressiveCard>
      </ScrollReveal>
    </PageTransition>
  );
}

/* ============================================================================
   2) DRIVER SCHEDULE (week selector)
   ============================================================================ */
function DriverSchedule() {
  const [weekOffset, setWeekOffset] = React.useState(0);

  // Build 7-day week (Mon-Sun)
  const days = React.useMemo(() => {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7; // 0=Mon
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  // Trips assigned to driver, mock spread across week
  const allMyTrips = React.useMemo(() => {
    const base = trips.filter((t) => t.driverId === DRIVER.id);
    // Add mock upcoming-week trips
    const mock = [
      { id: "tm1", routeId: "r1", busId: "b1", driverId: DRIVER.id, assistantId: ASSISTANT.id, date: days[1].toISOString().slice(0, 10), departTime: "06:30", arriveTime: "06:58", status: "scheduled", passengerCount: 0, revenue: 0 },
      { id: "tm2", routeId: "r1", busId: "b1", driverId: DRIVER.id, assistantId: ASSISTANT.id, date: days[1].toISOString().slice(0, 10), departTime: "16:00", arriveTime: "16:28", status: "scheduled", passengerCount: 0, revenue: 0 },
      { id: "tm3", routeId: "r1", busId: "b1", driverId: DRIVER.id, assistantId: ASSISTANT.id, date: days[2].toISOString().slice(0, 10), departTime: "07:15", arriveTime: "07:43", status: "scheduled", passengerCount: 0, revenue: 0 },
      { id: "tm4", routeId: "r1", busId: "b4", driverId: DRIVER.id, date: days[3].toISOString().slice(0, 10), departTime: "13:00", arriveTime: "13:28", status: "scheduled", passengerCount: 0, revenue: 0 },
      { id: "tm5", routeId: "r1", busId: "b1", driverId: DRIVER.id, assistantId: ASSISTANT.id, date: days[4].toISOString().slice(0, 10), departTime: "06:30", arriveTime: "06:58", status: "scheduled", passengerCount: 0, revenue: 0 },
      { id: "tm6", routeId: "r1", busId: "b1", driverId: DRIVER.id, assistantId: ASSISTANT.id, date: days[5].toISOString().slice(0, 10), departTime: "08:00", arriveTime: "08:28", status: "scheduled", passengerCount: 0, revenue: 0 },
    ];
    return [...base, ...mock];
  }, [days]);

  const [selectedDay, setSelectedDay] = React.useState<string>(todayISO);

  const dayTrips = allMyTrips
    .filter((t) => t.date === selectedDay)
    .sort((a, b) => a.departTime.localeCompare(b.departTime));

  const weekTripsCount = (iso: string) => allMyTrips.filter((t) => t.date === iso).length;

  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <PageTransition id="drv-schedule">
      <PageHeader
        title="Lịch chạy xe"
        description="Tuần làm việc của bạn — điều hành tuyến DN-01 phục vụ sinh viên Đại học Duy Tân."
        icon={<CalendarDays className="size-7" />}
        actions={
          <div className="flex items-center gap-2">
            <ExpressiveButton variant="outlined" size="icon-sm" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronRight className="size-4 rotate-180" />
            </ExpressiveButton>
            <span className="text-sm font-medium text-on-surface min-w-24 text-center">
              {weekOffset === 0 ? "Tuần này" : weekOffset > 0 ? `+${weekOffset} tuần` : `${weekOffset} tuần`}
            </span>
            <ExpressiveButton variant="outlined" size="icon-sm" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="size-4" />
            </ExpressiveButton>
          </div>
        }
      />

      {/* Week selector */}
      <ScrollReveal>
        <ExpressiveCard variant="outlined" className="p-3 mb-6">
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d, i) => {
              const iso = d.toISOString().slice(0, 10);
              const count = weekTripsCount(iso);
              const isSelected = iso === selectedDay;
              const isToday = iso === todayISO;
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDay(iso)}
                  className={cn(
                    "state-layer relative flex flex-col items-center justify-center rounded-2xl py-2.5 sm:py-3 transition-colors",
                    isSelected
                      ? "bg-primary text-on-primary elev-1"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase opacity-80">{dayNames[i]}</span>
                  <span className={cn("text-lg font-bold mt-0.5", isToday && !isSelected && "text-[#144fcc]")}>
                    {d.getDate()}
                  </span>
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center justify-center min-w-5 h-4 px-1 rounded-full text-[10px] font-bold",
                      count > 0
                        ? (isSelected ? "bg-white/25 text-on-primary" : "bg-primary-container text-on-primary-container")
                        : (isSelected ? "bg-white/10 text-on-primary/60" : "bg-surface-container-high text-on-surface-variant/50")
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Trips of selected day */}
      <ScrollReveal delay={0.05}>
        <Section
          title={`Chuyến ngày ${new Date(selectedDay).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" })}`}
          description={`${dayTrips.length} chuyến được phân công`}
        >
          {dayTrips.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-7" />}
              title="Nghỉ ngơi hôm nay"
              description="Không có chuyến nào được phân công cho ngày này."
            />
          ) : (
            <div className="space-y-2">
              {dayTrips.map((t, idx) => {
                const r = routeById(t.routeId);
                const b = busById(t.busId);
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06, type: "spring", stiffness: 220, damping: 26 }}
                  >
                    <ExpressiveCard variant="filled" interactive className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center size-16 rounded-2xl bg-[#14140f] text-[#beff50] shrink-0">
                          <span className="text-xs font-medium opacity-80">Khởi hành</span>
                          <span className="text-lg font-bold tabular-nums">{t.departTime}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base font-semibold text-on-surface">{r?.code}</span>
                            {tripStatusPill(t.status)}
                          </div>
                          <p className="text-sm text-on-surface truncate">
                            {r?.from} → {r?.to}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1"><Bus className="size-3.5" /> {b?.plate}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {t.arriveTime}</span>
                            {t.assistantId && (
                              <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> Có phụ xe</span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="size-5 text-on-surface-variant shrink-0" />
                      </div>
                    </ExpressiveCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Section>
      </ScrollReveal>
    </PageTransition>
  );
}

/* ============================================================================
   3) DRIVER ACTIVE TRIP (HERO)
   ============================================================================ */
function DriverActiveTrip() {
  const activeTrip = trips.find((t) => t.driverId === DRIVER.id && t.status === "running") ?? trips[1];
  const [running, setRunning] = React.useState(activeTrip?.status === "running");
  const [passengerCount, setPassengerCount] = React.useState(activeTrip?.passengerCount ?? 18);
  const [currentStop, setCurrentStop] = React.useState(BUS.currentStopIndex ?? 1);
  const elapsed = useElapsed(running);

  // Auto-advance stop every 8s for demo
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setCurrentStop((s) => {
        if (s + 1 >= ROUTE.stops.length) {
          setRunning(false);
          toast.success("Đã đến trạm cuối!", { description: "Vui lòng kết thúc chuyến." });
          return s;
        }
        setPassengerCount((p) => Math.max(0, Math.min(BUS.capacity, p + Math.floor(Math.random() * 5) - 2)));
        return s + 1;
      });
    }, 8000);
    return () => clearInterval(id);
  }, [running]);

  const handleStart = () => {
    setRunning(true);
    setCurrentStop(0);
    setPassengerCount(0);
    toast.success("Đã bắt đầu chuyến!", { description: `${ROUTE.code} · ${ROUTE.from} → ${ROUTE.to}` });
  };
  const handleEnd = () => {
    setRunning(false);
    toast.success("Đã kết thúc chuyến", { description: `Hành khách: ${passengerCount} · Thời gian: ${fmtTimer(elapsed)}` });
  };

  const progress = Math.round((currentStop / Math.max(1, ROUTE.stops.length - 1)) * 100);

  return (
    <PageTransition id="drv-active">
      <PageHeader
        title="Chuyến đang chạy"
        description="Màn hình điều hành chuyến trực tiếp — cập nhật vị trí, hành khách và thời gian."
        icon={<Navigation className="size-7" />}
      />

      {/* HERO dark card */}
      <ScrollReveal>
        <ExpressiveCard variant="filled" className="relative overflow-hidden mb-6 bg-[#14140f]">
          <div className="absolute inset-0 grid-texture opacity-10" />
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#beff50]/20 blur-2xl" />
          
          <div className="relative p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3 flex-wrap min-w-0">
              <div className="min-w-0">
                <div className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold",
                  running ? "bg-[#beff50] text-[#14140f]" : "bg-[#ff8c5f] text-[#14140f]"
                )}>
                  <span className={cn("size-1.5 rounded-full", running ? "bg-[#14140f] animate-pulse" : "bg-[#14140f]")} />
                  {running ? "ĐANG CHẠY" : "CHƯA BẮT ĐẦU"}
                </div>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight text-white truncate">
                  {ROUTE.code} · {ROUTE.name}
                </h2>
                <p className="mt-1 text-sm text-white/70 flex items-center gap-2 flex-wrap min-w-0">
                  <span className="truncate">{ROUTE.from}</span>
                  <ArrowRight className="size-3.5 shrink-0" />
                  <span className="truncate">{ROUTE.to}</span>
                  <span className="opacity-60">·</span>
                  <University className="size-3.5 shrink-0" />
                  <span className="truncate">{UNIVERSITY_NAME}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs uppercase tracking-wide text-[#beff50]/70">Thời gian đã chạy</p>
                <p className="text-3xl sm:text-4xl font-bold font-mono tabular-nums mt-1 text-[#beff50]">{fmtTimer(elapsed)}</p>
                <p className="text-xs text-white/60 mt-0.5">Khởi hành {activeTrip?.departTime}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-medium text-white/80 mb-2">
                <span>Trạm {currentStop + 1}/{ROUTE.stops.length}</span>
                <span>{progress}% hoàn thành</span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <motion.div
                  className="h-full bg-[#beff50] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {!running ? (
                <Magnetic strength={0.2} className="flex-1">
                  <ExpressiveButton
                    variant="elevated"
                    size="lg"
                    className="bg-[#beff50] text-[#14140f] w-full hover:brightness-95"
                    onClick={handleStart}
                  >
                    <Play className="size-5" /> Bắt đầu chuyến
                  </ExpressiveButton>
                </Magnetic>
              ) : (
                <Magnetic strength={0.2} className="flex-1">
                  <ExpressiveButton
                    variant="error"
                    size="lg"
                    className="w-full"
                    onClick={handleEnd}
                  >
                    <Square className="size-5" /> Kết thúc chuyến
                  </ExpressiveButton>
                </Magnetic>
              )}
              <ExpressiveButton
                variant="outlined"
                size="lg"
                className="border-white/20 text-[#beff50] bg-white/10 hover:bg-white/15"
                onClick={() => {
                  setPassengerCount((p) => Math.min(BUS.capacity, p + 1));
                  toast.success("Đã đón 1 hành khách", { description: `Tổng: ${passengerCount + 1}/${BUS.capacity}` });
                }}
              >
                <Users className="size-5" /> +1 khách
              </ExpressiveButton>
            </div>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical timeline */}
        <ScrollReveal className="lg:col-span-2" delay={0.05}>
          <ExpressiveCard variant="outlined" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RouteIcon className="size-5 text-[#144fcc]" />
                <h3 className="text-lg font-semibold text-on-surface">Lộ trình chuyến</h3>
              </div>
              <StatusPill label={`Trạm ${currentStop + 1}/${ROUTE.stops.length}`} tone="primary" />
            </div>
            <VerticalTimeline
              stops={ROUTE.stops}
              currentIndex={currentStop}
              departTime={activeTrip?.departTime ?? "07:15"}
            />
          </ExpressiveCard>
        </ScrollReveal>

        {/* Side panel */}
        <ScrollReveal delay={0.1}>
          <div className="space-y-4">
            {/* Passenger counter */}
            <ExpressiveCard variant="filled" className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="size-5 text-[#144fcc]" />
                <h3 className="text-base font-semibold text-on-surface">Hành khách trên xe</h3>
              </div>
              <p className="text-4xl font-bold text-on-surface">
                {passengerCount}
                <span className="text-lg font-medium text-on-surface-variant">/{BUS.capacity}</span>
              </p>
              <div className="mt-3 h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <motion.div
                  className="h-full bg-[#144fcc] rounded-full"
                  animate={{ width: `${(passengerCount / BUS.capacity) * 100}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                />
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                {Math.round((passengerCount / BUS.capacity) * 100)}% sức chứa
              </p>
              <div className="flex gap-2 mt-3">
                <ExpressiveButton variant="tonal" size="sm" className="flex-1" onClick={() => setPassengerCount((p) => Math.max(0, p - 1))}>
                  −
                </ExpressiveButton>
                <ExpressiveButton variant="tonal" size="sm" className="flex-1" onClick={() => setPassengerCount((p) => Math.min(BUS.capacity, p + 1))}>
                  +
                </ExpressiveButton>
              </div>
            </ExpressiveCard>

            {/* Trip metrics */}
            <ExpressiveCard variant="outlined" className="p-5">
              <h3 className="text-base font-semibold text-on-surface mb-3 flex items-center gap-2">
                <Timer className="size-5 text-[#144fcc]" /> Chỉ số chuyến
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-on-surface-variant">Doanh thu</p>
                  <p className="font-bold text-on-surface">{formatVND(passengerCount * ROUTE.fare)}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Tốc độ</p>
                  <p className="font-bold text-on-surface">{BUS.speed} km/h</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Quãng đường</p>
                  <p className="font-bold text-on-surface">{ROUTE.distanceKm} km</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Biển số</p>
                  <p className="font-bold text-on-surface">{BUS.plate}</p>
                </div>
              </div>
            </ExpressiveCard>

            {/* Assistant contact */}
            <ExpressiveCard variant="filled" className="p-5 bg-secondary-container text-on-secondary-container">
              <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Phụ xe trên chuyến</p>
              <div className="flex items-center gap-3 mt-2 min-w-0">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-on-secondary-container/15 font-bold">
                  {ASSISTANT.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{ASSISTANT.name}</p>
                  <p className="text-xs opacity-80 truncate">{ASSISTANT.phone}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <ExpressiveButton
                  variant="elevated"
                  size="sm"
                  className="flex-1 bg-surface text-[#144fcc]"
                  onClick={() => toast.success(`Đang gọi ${ASSISTANT.name}…`)}
                >
                  <PhoneCall className="size-4" /> Gọi
                </ExpressiveButton>
                <ExpressiveButton
                  variant="outlined"
                  size="sm"
                  className="flex-1 border-on-secondary-container/40 text-on-secondary-container"
                  onClick={() => toast.success(`Đã gửi tin nhắn đến ${ASSISTANT.name}`)}
                >
                  <MessageSquare className="size-4" /> Nhắn
                </ExpressiveButton>
              </div>
            </ExpressiveCard>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

/* ============================================================================
   4) DRIVER ROUTE
   ============================================================================ */
function DriverRoute() {
  return (
    <PageTransition id="drv-route">
      <PageHeader
        title="Tuyến được phân"
        description="Thông tin chi tiết tuyến DN-01 — phục vụ sinh viên Đại học Duy Tân."
        icon={<RouteIcon className="size-7" />}
      />

      {/* Route hero — bold dark card with lime accents */}
      <ScrollReveal>
        <ExpressiveCard variant="filled" className="relative overflow-hidden mb-6 bg-[#14140f]">
          <div className="absolute inset-0 grid-texture opacity-10" />
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#beff50]/20 blur-2xl" />
          
          <div className="relative p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="rounded-full bg-[#beff50] px-3 py-1 text-xs font-bold text-[#14140f]">{ROUTE.code}</span>
              <span className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                ROUTE.active ? "bg-[#16a34a] text-white" : "bg-[#ff8c5f] text-[#14140f]"
              )}>{ROUTE.active ? "Đang hoạt động" : "Tạm dừng"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">{ROUTE.name}</h2>
            <div className="mt-3 flex items-center gap-3 flex-wrap text-sm text-white/80 min-w-0">
              <span className="font-medium truncate">{ROUTE.from}</span>
              <ArrowRight className="size-4 shrink-0 text-[#beff50]" />
              <span className="font-medium truncate">{ROUTE.to}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Quãng đường", value: `${ROUTE.distanceKm} km` },
                { label: "Thời gian", value: `${ROUTE.durationMin} phút` },
                { label: "Tần suất", value: `${ROUTE.frequencyMin} phút` },
                { label: "Trạm dừng", value: `${ROUTE.stops.length} trạm` },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl bg-white/10 px-4 py-3 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-[#beff50]/70">{m.label}</p>
                  <p className="text-lg font-bold mt-0.5 text-white truncate">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Stop list */}
        <ScrollReveal className="lg:col-span-2" delay={0.05}>
          <ExpressiveCard variant="outlined" className="p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="size-5 text-[#144fcc]" />
              <h3 className="text-lg font-semibold text-on-surface">Danh sách trạm</h3>
            </div>
            <div className="max-h-[28rem] overflow-y-auto scrollbar-soft pr-2">
              <VerticalTimeline stops={ROUTE.stops} currentIndex={BUS.currentStopIndex ?? 1} departTime={ROUTE.firstTrip} />
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Map + bus info */}
        <ScrollReveal className="lg:col-span-3" delay={0.1}>
          <div className="space-y-4">
            <RouteMapSVG currentIndex={BUS.currentStopIndex ?? 1} />
            <ExpressiveCard variant="filled" className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bus className="size-5 text-[#144fcc]" />
                <h3 className="text-lg font-semibold text-on-surface">Xe được phân công</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 min-w-0">
                <div>
                  <p className="text-xs text-on-surface-variant">Biển số</p>
                  <p className="text-base font-bold text-on-surface">{BUS.plate}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Mô hình</p>
                  <p className="text-sm font-semibold text-on-surface">{BUS.model}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Sức chứa</p>
                  <p className="text-base font-bold text-on-surface">{BUS.capacity} chỗ</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Tốc độ hiện tại</p>
                  <p className="text-base font-bold text-on-surface">{BUS.speed} km/h</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Hành khách</p>
                  <p className="text-base font-bold text-on-surface">{BUS.occupancy}/{BUS.capacity}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Trạm tiếp theo</p>
                  <p className="text-sm font-semibold text-on-surface truncate">{stopById(BUS.nextStopId ?? "s5")?.name ?? "—"}</p>
                </div>
              </div>
            </ExpressiveCard>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

/* ============================================================================
   5) DRIVER HISTORY
   ============================================================================ */
function DriverHistory() {
  // Mock history of last 8 trips
  const history = React.useMemo(() => {
    const base = trips.filter((t) => t.driverId === DRIVER.id && t.status === "completed");
    const mock = [
      { id: "h1", routeId: "r1", busId: "b1", date: "2025-06-13", departTime: "16:00", arriveTime: "16:28", status: "completed", passengerCount: 22, revenue: 110000 },
      { id: "h2", routeId: "r1", busId: "b1", date: "2025-06-13", departTime: "06:30", arriveTime: "06:58", status: "completed", passengerCount: 28, revenue: 140000 },
      { id: "h3", routeId: "r1", busId: "b1", date: "2025-06-12", departTime: "16:00", arriveTime: "16:28", status: "completed", passengerCount: 19, revenue: 95000 },
      { id: "h4", routeId: "r1", busId: "b1", date: "2025-06-12", departTime: "06:30", arriveTime: "06:58", status: "completed", passengerCount: 26, revenue: 130000 },
      { id: "h5", routeId: "r1", busId: "b4", date: "2025-06-11", departTime: "12:00", arriveTime: "12:28", status: "completed", passengerCount: 15, revenue: 75000 },
      { id: "h6", routeId: "r1", busId: "b1", date: "2025-06-11", departTime: "06:30", arriveTime: "06:58", status: "completed", passengerCount: 24, revenue: 120000 },
      { id: "h7", routeId: "r1", busId: "b1", date: "2025-06-10", departTime: "16:00", arriveTime: "16:28", status: "cancelled", passengerCount: 0, revenue: 0 },
    ];
    return [...base, ...mock];
  }, []);

  const totalTrips = history.length;
  const totalKm = history.length * ROUTE.distanceKm;
  const totalPassengers = history.reduce((s, t) => s + t.passengerCount, 0);
  const totalRevenue = history.reduce((s, t) => s + t.revenue, 0);
  const myFeedback = feedbackList.filter((f) => f.driverName === DRIVER.name);
  const avgRating = myFeedback.length ? (myFeedback.reduce((s, f) => s + f.rating, 0) / myFeedback.length).toFixed(1) : "5.0";

  return (
    <PageTransition id="drv-history">
      <PageHeader
        title="Lịch sử chuyến"
        description="Tổng kết các chuyến đã hoàn thành trong thời gian gần đây."
        icon={<ScrollText className="size-7" />}
      />

      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StaggerItem>
          <StatCard label="Tổng chuyến" accent="primary" icon={<Bus className="size-5" />} value={<Counter to={totalTrips} />} hint="Đã hoàn thành" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Tổng km" accent="tertiary" icon={<Gauge className="size-5" />} value={<Counter to={Math.round(totalKm)} format={(n) => `${Math.round(n)} km`} />} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Hành khách" accent="secondary" icon={<Users className="size-5" />} value={<Counter to={totalPassengers} />} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Doanh thu" accent="success" icon={<Banknote className="size-5" />} value={<Counter to={totalRevenue} format={(n) => formatVND(Math.round(n))} />} trend="up" />
        </StaggerItem>
      </StaggerGroup>

      <ScrollReveal>
        <ExpressiveCard variant="outlined" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b-2 border-outline-variant">
            <h3 className="text-lg font-semibold text-on-surface">Bảng chuyến gần đây</h3>
            <span className="text-xs text-on-surface-variant">Đánh giá TB: <strong className="text-on-surface">{avgRating}★</strong></span>
          </div>
          <div className="max-h-[28rem] overflow-y-auto scrollbar-soft">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-container-high text-on-surface-variant">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Ngày</th>
                  <th className="text-left font-semibold px-3 py-3 hidden sm:table-cell">Tuyến</th>
                  <th className="text-left font-semibold px-3 py-3">Giờ</th>
                  <th className="text-right font-semibold px-3 py-3">Khách</th>
                  <th className="text-right font-semibold px-3 py-3 hidden md:table-cell">Doanh thu</th>
                  <th className="text-right font-semibold px-5 py-3">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {history.map((t, idx) => {
                  const r = routeById(t.routeId);
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, type: "spring", stiffness: 220, damping: 26 }}
                      className="border-t border-outline-variant hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-on-surface">
                        {new Date(t.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ background: r?.color }} />
                          <span className="text-on-surface-variant">{r?.code}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-on-surface-variant font-mono text-xs tabular-nums">{t.departTime}</td>
                      <td className="px-3 py-3 text-right font-semibold text-on-surface">{t.passengerCount}</td>
                      <td className="px-3 py-3 text-right hidden md:table-cell text-on-surface-variant">{formatVND(t.revenue)}</td>
                      <td className="px-5 py-3 text-right">
                        {t.status === "cancelled" ? (
                          <StatusPill label="Đã hủy" tone="error" />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant">
                            <Star className="size-3.5 fill-tertiary text-tertiary" />
                            {(4 + (idx % 2) * 0.5).toFixed(1)}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ExpressiveCard>
      </ScrollReveal>
    </PageTransition>
  );
}

/* ============================================================================
   6) DRIVER CONTACT
   ============================================================================ */
function DriverContact() {
  const [message, setMessage] = React.useState("");
  const [messages, setMessages] = React.useState([
    { id: "m1", from: "them", text: "Hôm nay bạn có 4 chuyến, chú ý giờ cao điểm nhé.", time: "06:00", name: COORDINATOR.name },
    { id: "m2", from: "me", text: "Vâng, em đã xuất bến chuyến đầu 06:30.", time: "06:05", name: DRIVER.name },
    { id: "m3", from: "them", text: "Xe b4 chiều nay sẽ thay thế b1 để bảo dưỡng.", time: "10:30", name: COORDINATOR.name },
    { id: "m4", from: "them", text: "Phụ xe Lê Thị Phương sẽ cùng đi chuyến chiều.", time: "11:00", name: COORDINATOR.name },
  ]);

  const send = () => {
    if (!message.trim()) return;
    setMessages((m) => [
      ...m,
      { id: `m${m.length + 1}`, from: "me", text: message, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }), name: DRIVER.name },
    ]);
    setMessage("");
    toast.success("Đã gửi tin nhắn đến điều phối");
  };

  return (
    <PageTransition id="drv-contact">
      <PageHeader
        title="Liên hệ điều phối"
        description="Kênh liên lạc trực tiếp với bộ phận điều hành — Đà Nẵng."
        icon={<Phone className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact card */}
        <ScrollReveal>
          <ContactPersonCard
            person={COORDINATOR}
            role="Điều phối viên"
            onCall={() => toast.success(`Đang gọi ${COORDINATOR.name}…`, { description: COORDINATOR.phone })}
            onMessage={() => toast.info("Đã mở khung chat")}
          />
          <ExpressiveCard variant="outlined" className="p-5 mt-4">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-2">Trung tâm điều hành</p>
            <p className="text-sm text-on-surface font-semibold">UniBus Đà Nẵng</p>
            <p className="text-xs text-on-surface-variant mt-1">254 Nguyễn Văn Linh, Thanh Khê</p>
            <p className="text-xs text-on-surface-variant mt-1">Hotline: 0236 3650 529</p>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Messages panel */}
        <ScrollReveal className="lg:col-span-2" delay={0.05}>
          <ExpressiveCard variant="outlined" className="flex flex-col h-[32rem]">
            <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-outline-variant">
              <div className="flex size-10 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container font-bold">
                {COORDINATOR.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">{COORDINATOR.name}</p>
                <p className="text-xs text-success inline-flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" /> Đang hoạt động
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-soft p-4 space-y-3">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5",
                      m.from === "me"
                        ? "bg-[#144fcc] text-white rounded-br-md"
                        : "bg-surface-container-high text-on-surface rounded-bl-md"
                    )}
                  >
                    <p className="text-sm break-words">{m.text}</p>
                    <p className={cn("text-[10px] mt-1 opacity-70", m.from === "me" ? "text-white/70" : "text-on-surface-variant")}>
                      {m.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="border-t-2 border-outline-variant p-3 flex items-center gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Nhập tin nhắn…"
                className="flex-1 h-11 rounded-full bg-surface-container-high text-on-surface px-5 text-sm outline-none focus:ring-2 focus:ring-white/20"
              />
              <Magnetic strength={0.3}>
                <ExpressiveButton variant="filled" size="icon" onClick={send}>
                  <Send className="size-5" />
                </ExpressiveButton>
              </Magnetic>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

/* ============================================================================
   EXPORT
   ============================================================================ */
export function DriverModule({
  activeId,
  onNavigate,
}: {
  activeId: string;
  onNavigate: (id: string) => void;
}) {
  switch (activeId) {
    case "drv-dashboard":
      return <DriverDashboard onNavigate={onNavigate} />;
    case "drv-schedule":
      return <DriverSchedule />;
    case "drv-active":
      return <DriverActiveTrip />;
    case "drv-route":
      return <DriverRoute />;
    case "drv-history":
      return <DriverHistory />;
    case "drv-contact":
      return <DriverContact />;
    default:
      return <DriverDashboard onNavigate={onNavigate} />;
  }
}

export default DriverModule;
