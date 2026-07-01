"use client";

// =============================================================================
// Driver Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// 6 role-specific screens:
//   drv-dashboard, drv-schedule, drv-active-trip, drv-route, drv-history,
//   drv-contact
// Visual: keeps prototype v1.1 (hero perk card, lime accent, vertical timeline,
// horizontal timeline, route map SVG, contact cards, animated trip timer).
// Data: real backend via /driver/dashboard, /driver/trips, /driver/feedback.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  PlayCircle,
  StopCircle,
  Navigation,
  Route as RouteIcon,
  History,
  Phone,
  MessageSquare,
  Users,
  Gauge,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Info,
  Send,
  ChevronRight,
  ChevronLeft,
  CircleDot,
  PhoneCall,
  MapPin,
  Bus,
  User as UserIcon,
  Star,
  RefreshCw,
  TrendingUp,
  Coffee,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// M3 Expressive + motion
import {
  ExpressiveButton,
  ExpressiveCard,
  Chip,
  StatusPill as M3StatusPill,
  M3Progress,
} from "@/components/m3/primitives";
import {
  SplitText,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Counter,
  PageTransition,
} from "@/components/m3/motion";
import { PageHeader, StatCard, Section, EmptyState } from "../primitives";

// Real backend
import {
  useDriverPrototypeData,
  useApi,
  formatVND,
  formatDateTime,
  formatDate,
} from "@/lib/prototype-data";
import {
  operationsApi,
  experienceApi,
  type DriverTripView,
  type DriverDashboardView,
  type ExperienceTripCard,
  type ExperienceFeedbackCard,
  type ExperienceDashboardStat,
  type DriverContactView,
  driverDispatchApi,
  type DispatcherContact,
} from "@/lib/api/client";

type DriverModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function DriverModule({ activeId, onNavigate }: DriverModuleProps) {
  const proto = useDriverPrototypeData();

  if (proto.loading || !proto.data) return <LoadingScreen label="Đang tải dữ liệu tài xế..." />;
  if (proto.error) return <ErrorScreen message={proto.error} onRetry={proto.reload} />;

  const d = proto.data!;
  const ctx = {
    user: d.user,
    trips: d.trips,
    activeTrip: d.activeTrip,
    feedback: d.feedback,
    stats: d.stats,
    notifications: d.notifications,
    raw: {
      dashboard: d.dashboard,
      tripsRaw: d.tripsRaw,
      feedbackRaw: d.feedbackRaw,
      notificationsRaw: d.notificationsRaw,
      profileRaw: d.profileRaw,
    },
    reload: proto.reload,
  };

  switch (activeId) {
    case "drv-dashboard":
      return <DriverDashboard ctx={ctx} onNavigate={onNavigate} />;
    case "drv-schedule":
      return <DriverSchedule ctx={ctx} />;
    case "drv-active":
    case "drv-active-trip":
      return <DriverActiveTrip ctx={ctx} onNavigate={onNavigate} />;
    case "drv-route":
      return <DriverRoute ctx={ctx} />;
    case "drv-history":
      return <DriverHistory ctx={ctx} />;
    case "drv-contact":
      return <DriverContact />;
    default:
      return <FallbackScreen activeId={activeId} />;
  }
}

export default DriverModule;

// =============================================================================
// Types
// =============================================================================
interface Ctx {
  user: any;
  trips: any[];
  activeTrip: any | null;
  feedback: any[];
  stats: ExperienceDashboardStat[];
  notifications: any[];
  raw: any;
  reload: () => void;
}

// =============================================================================
// Loading & Error
// =============================================================================
function LoadingScreen({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="mt-5 text-sm font-medium text-on-surface-variant">{label}</p>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-error-container">
        <AlertTriangle className="size-7 text-error" />
      </div>
      <p className="mt-4 text-lg font-bold text-on-surface">Không tải được dữ liệu</p>
      <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">{message}</p>
      {onRetry && (
        <ExpressiveButton variant="filled" className="mt-5" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Thử lại
        </ExpressiveButton>
      )}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================
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
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function useElapsed(active: boolean): number {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return sec;
}

function tripStatusPill(status: string): { label: string; tone: any } {
  switch (status?.toUpperCase()) {
    case "RUNNING":
      return { label: "Đang chạy", tone: "primary" };
    case "COMPLETED":
      return { label: "Hoàn thành", tone: "success" };
    case "CANCELLED":
      return { label: "Đã hủy", tone: "error" };
    case "SCHEDULED":
    default:
      return { label: "Lên lịch", tone: "warning" };
  }
}

// =============================================================================
// Sub-components
// =============================================================================
function HorizontalTimeline({ stops, currentIndex }: { stops: any[]; currentIndex?: number }) {
  if (!stops.length) return null;
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-1 min-w-max">
        {stops.map((s, i) => {
          const isPassed = currentIndex != null && i < currentIndex;
          const isCurrent = currentIndex === i;
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={cn(
                    "size-3 rounded-full border-2",
                    isPassed && "bg-primary border-primary",
                    isCurrent && "bg-[#beff50] border-[#14140f] animate-pulse",
                    !isPassed && !isCurrent && "bg-surface border-outline"
                  )}
                />
                <p className={cn("text-[10px] font-bold max-w-[80px] truncate", isCurrent && "text-primary")}>
                  {s.stopName}
                </p>
              </div>
              {i < stops.length - 1 && (
                <div className={cn("h-0.5 w-8", isPassed ? "bg-primary" : "bg-outline-variant")} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function VerticalTimeline({ stops, currentIndex }: { stops: any[]; currentIndex?: number }) {
  if (!stops.length) return null;
  return (
    <div className="relative space-y-0">
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-outline-variant" />
      {stops.map((s, i) => {
        const isPassed = currentIndex != null && i < currentIndex;
        const isCurrent = currentIndex === i;
        return (
          <div
            key={i}
            className={cn(
              "relative flex items-start gap-3 py-2 pl-0",
              isCurrent && "bg-primary-container/30 -mx-2 px-2 rounded-lg"
            )}
          >
            <div
              className={cn(
                "relative z-10 size-3.5 rounded-full border-2 mt-1 shrink-0",
                isPassed && "bg-primary border-primary",
                isCurrent && "bg-[#beff50] border-[#14140f] animate-pulse",
                !isPassed && !isCurrent && "bg-surface border-outline"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", isCurrent && "text-on-surface font-bold")}>
                {s.stopName}
              </p>
              {s.minutesFromPreviousStop != null && i > 0 && (
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  +{s.minutesFromPreviousStop} phút
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RouteMapSVG({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="relative h-32 rounded-xl bg-surface-container-low overflow-hidden">
      <svg viewBox="0 0 400 120" className="w-full h-full">
        <path
          d="M30,80 Q100,20 200,60 T370,40"
          fill="none"
          stroke="#14b8a6"
          strokeWidth="3"
          strokeDasharray="6 4"
        />
        {[0, 1, 2, 3, 4].map((i) => {
          const positions = [
            { x: 30, y: 80 },
            { x: 110, y: 35 },
            { x: 200, y: 60 },
            { x: 290, y: 50 },
            { x: 370, y: 40 },
          ];
          const p = positions[i];
          const isPassed = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="7"
                fill={isCurrent ? "#beff50" : isPassed ? "#14b8a6" : "#fff"}
                stroke={isCurrent ? "#14140f" : "#14b8a6"}
                strokeWidth="2"
              />
              {isCurrent && (
                <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="#beff50" strokeWidth="2">
                  <animate attributeName="r" from="7" to="14" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ContactPersonCard({
  name,
  role,
  phone,
  avatar,
  accent,
}: {
  name: string;
  role: string;
  phone?: string;
  avatar: string;
  accent: string;
}) {
  return (
    <ExpressiveCard variant="elevated" className="p-4 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-sm"
          style={{ backgroundColor: accent, color: "#14140f" }}
        >
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-on-surface-variant">{role}</p>
          <p className="font-bold truncate">{name}</p>
          {phone && <p className="text-xs text-on-surface-variant">{phone}</p>}
        </div>
        {phone && (
          <a href={`tel:${phone}`} className="shrink-0">
            <ExpressiveButton variant="tonal" size="icon-sm">
              <PhoneCall className="size-4" />
            </ExpressiveButton>
          </a>
        )}
      </div>
    </ExpressiveCard>
  );
}

// =============================================================================
// Screen 1: Driver Dashboard
// =============================================================================
function DriverDashboard({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const firstName = (ctx.user.name || "bạn").split(" ").slice(-1)[0];
  const activeTrip = ctx.activeTrip;
  const upcomingTrips = ctx.trips.filter((t: any) => String(t.status || "").toUpperCase() === "NOT_STARTED").slice(0, 3);
  const statCards = ctx.stats.slice(0, 4);

  return (
    <PageTransition className="space-y-6 sm:space-y-8 min-w-0">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="space-y-3 min-w-0"
      >
        <SplitText
          as="h1"
          text={`${greetingByHour()}, ${firstName}!`}
          className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface text-balance"
          stagger={0.06}
        />
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold shrink-0">
            <Bus className="size-3.5" />
            Tài xế
          </span>
          {ctx.user.employeeId && (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#144fcc] text-white text-xs font-bold shrink-0">
              {ctx.user.employeeId}
            </span>
          )}
          {activeTrip && (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#beff50] text-[#14140f] text-xs font-bold shrink-0">
              <motion.span
                className="size-1.5 rounded-full bg-[#14140f]"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              Đang trong chuyến
            </span>
          )}
        </div>
      </motion.div>

      {/* Active trip hero */}
      {activeTrip ? (
        <ScrollReveal>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative overflow-hidden rounded-3xl p-5 sm:p-7 elev-2"
            style={{ backgroundColor: "#beff50", color: "#14140f" }}
          >
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col gap-4 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold items-center">
                  <motion.span
                    className="size-1.5 rounded-full bg-[#beff50]"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  CHUYẾN ĐANG CHẠY
                </span>
                <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f]/10 text-xs font-bold items-center">
                  {activeTrip.licensePlate || "Đang gán"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                {activeTrip.routeName || "Chuyến xe"}
              </h2>
              {activeTrip.stops && activeTrip.stops.length > 0 && (
                <HorizontalTimeline stops={activeTrip.stops} currentIndex={0} />
              )}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <ExpressiveButton
                  variant="filled"
                  onClick={() => onNavigate("drv-active-trip")}
                  className="bg-[#14140f] text-[#beff50]"
                >
                  Quản lý chuyến <ArrowRight className="size-4" />
                </ExpressiveButton>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      ) : (
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-6 text-center min-w-0">
            <Coffee className="size-10 mx-auto text-on-surface-variant" />
            <p className="mt-3 text-base font-bold">Bạn chưa có chuyến nào đang chạy</p>
            <p className="text-sm text-on-surface-variant mt-1">Xem lịch trình hôm nay để bắt đầu chuyến.</p>
            <ExpressiveButton variant="filled" className="mt-4" onClick={() => onNavigate("drv-schedule")}>
              <Calendar className="size-4" />
              Xem lịch trình
            </ExpressiveButton>
          </ExpressiveCard>
        </ScrollReveal>
      )}

      {/* Stats */}
      {statCards.length > 0 && (
        <ScrollReveal delay={0.1}>
          <Section title="Tổng quan hôm nay">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
              {statCards.map((s, i) => (
                <StatCard
                  key={i}
                  label={s.label}
                  value={
                    <Counter
                      to={typeof s.value === "number" ? s.value : 0}
                      format={(n) =>
                        typeof s.value === "string"
                          ? s.value
                          : Math.round(n).toLocaleString("vi-VN")
                      }
                    />
                  }
                  icon={<TrendingUp className="size-5" />}
                  hint={s.unit}
                  accent={(s.tone as any) || "primary"}
                />
              ))}
            </div>
          </Section>
        </ScrollReveal>
      )}

      {/* Upcoming trips */}
      <ScrollReveal delay={0.15}>
        <Section title="Chuyến sắp tới" actions={<button onClick={() => onNavigate("drv-schedule")} className="text-xs font-bold text-primary">Xem tất cả</button>}>
          {upcomingTrips.length === 0 ? (
            <EmptyState
              icon={<Calendar className="size-7" />}
              title="Hôm nay không có chuyến"
              description="Lịch trình trống cho hôm nay."
            />
          ) : (
            <div className="space-y-2">
              {upcomingTrips.map((t: any) => {
                const sp = tripStatusPill(t.status);
                return (
                  <ExpressiveCard key={t.id} variant="elevated" className="p-4 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 shrink-0 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                        <Bus className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{t.routeName}</p>
                        <p className="text-xs text-on-surface-variant">
                          {t.departTime || formatDate(t.date)} • {t.licensePlate || "Chưa gán xe"}
                        </p>
                      </div>
                      <M3StatusPill label={sp.label} tone={sp.tone} />
                    </div>
                  </ExpressiveCard>
                );
              })}
            </div>
          )}
        </Section>
      </ScrollReveal>
    </PageTransition>
  );
}

// =============================================================================
// Screen 2: Driver Schedule
// =============================================================================
function DriverSchedule({ ctx }: { ctx: Ctx }) {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [trips, setTrips] = useState<DriverTripView[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await operationsApi.driverTrips(filterDate);
      setTrips(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được lịch trình");
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => { load(); }, [load]);

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lịch trình"
        description="Lịch chạy của bạn theo ngày."
        icon={<Calendar className="size-7" />}
        actions={
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full sm:w-44"
          />
        }
      />
      {loading ? (
        <LoadingScreen label="Đang tải lịch trình..." />
      ) : error ? (
        <ErrorScreen message={error} onRetry={load} />
      ) : !trips || trips.length === 0 ? (
        <EmptyState
          icon={<Calendar className="size-7" />}
          title="Không có chuyến"
          description={`Không có chuyến nào vào ${formatDate(filterDate)}.`}
        />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {trips.map((t) => {
            const sp = tripStatusPill(t.status);
            return (
              <StaggerItem key={t.tripId}>
                <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-12 shrink-0 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
                        <Bus className="size-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{t.routeName}</p>
                        <p className="text-xs text-on-surface-variant">
                          {t.departureTime || formatDate(t.serviceDate)}
                        </p>
                      </div>
                    </div>
                    <M3StatusPill label={sp.label} tone={sp.tone} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-on-surface-variant">Biển số</p>
                      <p className="font-bold">{t.licensePlate || "—"}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Phụ xe</p>
                      <p className="font-bold truncate">{t.conductorName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Điện thoại PX</p>
                      <p className="font-bold truncate">{t.conductorPhone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Số trạm</p>
                      <p className="font-bold">{t.stops?.length || 0}</p>
                    </div>
                  </div>
                </ExpressiveCard>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 3: Driver Active Trip
// =============================================================================
function DriverActiveTrip({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const [trips, setTrips] = useState<DriverTripView[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  const [ending, setEnding] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await operationsApi.driverTrips();
      setTrips(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được chuyến");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runningTrip = trips?.find((trip) => trip.status?.toUpperCase() === "RUNNING") ?? null;
  const startableTrips = useMemo(() => {
    return (trips ?? []).filter((trip) => {
      const status = trip.status?.toUpperCase();
      return status !== "RUNNING" && status !== "COMPLETED" && status !== "CANCELLED";
    });
  }, [trips]);
  const nextTrip = runningTrip ?? startableTrips[0] ?? null;
  const elapsed = useElapsed(!!runningTrip);

  const startTrip = async (tripId: number) => {
    if (starting || ending) return;
    setStarting(tripId);
    try {
      await operationsApi.startTrip(tripId);
      toast.success("Đã bắt đầu chuyến");
      await load();
      await ctx.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể bắt đầu chuyến");
    } finally {
      setStarting(null);
    }
  };

  const endTrip = async (tripId: number) => {
    if (starting || ending) return;
    setEnding(tripId);
    try {
      await operationsApi.endTrip(tripId);
      toast.success("Đã kết thúc chuyến");
      await load();
      await ctx.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể kết thúc chuyến");
    } finally {
      setEnding(null);
    }
  };

  if (loading) return <LoadingScreen label="Đang tải chuyến..." />;
  if (!trips || trips.length === 0) {
    return (
      <PageTransition>
        <PageHeader title="Chuyến đang chạy" icon={<PlayCircle className="size-7" />} />
        <EmptyState
          icon={<PlayCircle className="size-7" />}
          title="Không có chuyến"
          description="Hôm nay bạn không có chuyến nào để chạy."
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Chuyến đang chạy"
        description={runningTrip ? "Theo dõi và kết thúc chuyến đang chạy." : "Chọn chuyến được phân công để bắt đầu."}
        icon={<PlayCircle className="size-7" />}
      />

      {nextTrip ? (
        <ScrollReveal>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative overflow-hidden rounded-3xl p-5 sm:p-7 elev-2"
            style={{ backgroundColor: runningTrip ? "#beff50" : "#e8def8", color: "#14140f" }}
          >
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" />
            <div className="relative min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold items-center gap-2">
                  {runningTrip ? (
                    <motion.span className="size-1.5 rounded-full bg-[#beff50]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                  ) : (
                    <PlayCircle className="size-3.5" />
                  )}
                  {runningTrip ? "ĐANG CHẠY" : "SẴN SÀNG BẮT ĐẦU"}
                </span>
                <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f]/10 text-xs font-bold items-center">
                  {nextTrip.licensePlate || "Chưa gán xe"}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold mb-2 truncate">{nextTrip.routeName}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-sm">
                <div>
                  <p className="text-[#14140f]/70 font-bold text-xs uppercase">Khởi hành</p>
                  <p className="font-black">{nextTrip.departureTime || formatDate(nextTrip.serviceDate)}</p>
                </div>
                <div>
                  <p className="text-[#14140f]/70 font-bold text-xs uppercase">Phụ xe</p>
                  <p className="font-black truncate">{nextTrip.conductorName || "Chưa gán"}</p>
                </div>
                <div>
                  <p className="text-[#14140f]/70 font-bold text-xs uppercase">Thời gian chạy</p>
                  <p className="font-black tabular-nums">{runningTrip ? fmtTimer(elapsed) : "00:00:00"}</p>
                </div>
              </div>

              {nextTrip.stops && nextTrip.stops.length > 0 && <HorizontalTimeline stops={nextTrip.stops} currentIndex={runningTrip ? 0 : undefined} />}

              <div className="flex flex-wrap gap-2 mt-5">
                {runningTrip ? (
                  <ExpressiveButton
                    variant="filled"
                    className="bg-[#14140f] text-[#beff50]"
                    onClick={() => endTrip(runningTrip.tripId)}
                    disabled={ending === runningTrip.tripId}
                  >
                    {ending === runningTrip.tripId ? <RefreshCw className="size-4 animate-spin" /> : <StopCircle className="size-4" />}
                    Kết thúc chuyến
                  </ExpressiveButton>
                ) : (
                  <ExpressiveButton
                    variant="filled"
                    className="bg-[#14140f] text-white"
                    onClick={() => startTrip(nextTrip.tripId)}
                    disabled={starting === nextTrip.tripId}
                  >
                    {starting === nextTrip.tripId ? <RefreshCw className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                    Bắt đầu chuyến
                  </ExpressiveButton>
                )}
                <ExpressiveButton variant="outlined" className="border-[#14140f] text-[#14140f]" onClick={() => onNavigate("drv-route")}>
                  <Navigation className="size-4" />
                  Xem lộ trình
                </ExpressiveButton>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      ) : (
        <EmptyState
          icon={<CheckCircle2 className="size-7" />}
          title="Đã hoàn thành tất cả chuyến"
          description="Không còn chuyến nào có thể bắt đầu."
        />
      )}

      <Section title="Danh sách chuyến được phân công">
        <div className="space-y-3">
          {trips.map((trip) => {
            const status = trip.status?.toUpperCase();
            const statusPill = tripStatusPill(trip.status);
            const canStart = status !== "RUNNING" && status !== "COMPLETED" && status !== "CANCELLED";
            return (
              <ExpressiveCard key={trip.tripId} variant="elevated" className="p-5 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 shrink-0 rounded-2xl bg-surface-container-high flex items-center justify-center">
                      <Bus className="size-6 text-on-surface-variant" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{trip.routeName}</p>
                      <p className="text-xs text-on-surface-variant">
                        {trip.departureTime || formatDate(trip.serviceDate)} ? {trip.licensePlate || "Chưa gán xe"}
                      </p>
                    </div>
                  </div>
                  <M3StatusPill label={statusPill.label} tone={statusPill.tone} />
                </div>
                {trip.stops && trip.stops.length > 0 && (
                  <div className="mb-3">
                    <HorizontalTimeline stops={trip.stops} currentIndex={status === "RUNNING" ? 0 : undefined} />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {canStart && (
                    <ExpressiveButton variant="filled" size="sm" onClick={() => startTrip(trip.tripId)} disabled={starting === trip.tripId || !!runningTrip}>
                      {starting === trip.tripId ? <RefreshCw className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                      Bắt đầu
                    </ExpressiveButton>
                  )}
                  {status === "RUNNING" && (
                    <ExpressiveButton variant="filled" size="sm" className="bg-error text-on-error" onClick={() => endTrip(trip.tripId)} disabled={ending === trip.tripId}>
                      {ending === trip.tripId ? <RefreshCw className="size-4 animate-spin" /> : <StopCircle className="size-4" />}
                      Kết thúc
                    </ExpressiveButton>
                  )}
                </div>
              </ExpressiveCard>
            );
          })}
        </div>
      </Section>
    </PageTransition>
  );
}

// =============================================================================
// Screen 4: Driver Route — view stops
// =============================================================================
function DriverRoute({ ctx }: { ctx: Ctx }) {
  const [tripId, setTripId] = useState<number | null>(null);
  const [trip, setTrip] = useState<DriverTripView | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const r = await operationsApi.driverTrips();
      const t = r.find((x) => x.tripId === tripId);
      setTrip(t || null);
    } catch {
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId && ctx.trips.length > 0) {
      setTripId(ctx.trips[0].id);
    }
  }, [ctx.trips, tripId]);

  useEffect(() => { load(); }, [load]);

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lộ trình chuyến"
        description="Chi tiết các trạm dừng trên tuyến."
        icon={<RouteIcon className="size-7" />}
        actions={
          <Select value={tripId ? String(tripId) : ""} onValueChange={(v) => setTripId(Number(v))}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Chọn chuyến" /></SelectTrigger>
            <SelectContent>
              {ctx.trips.map((t: any) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.routeName} — {formatDate(t.date)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {loading ? (
        <LoadingScreen />
      ) : !trip ? (
        <EmptyState
          icon={<RouteIcon className="size-7" />}
          title="Không có dữ liệu"
          description="Chọn chuyến để xem lộ trình."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 min-w-0">
          <ScrollReveal>
            <ExpressiveCard variant="elevated" className="p-5 min-w-0">
              <h3 className="text-base font-bold mb-4">Bản đồ lộ trình</h3>
              <RouteMapSVG currentIndex={0} />
            </ExpressiveCard>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <ExpressiveCard variant="filled" className="p-5 min-w-0">
              <h3 className="text-base font-bold mb-4">Danh sách trạm</h3>
              <VerticalTimeline stops={trip.stops || []} currentIndex={0} />
            </ExpressiveCard>
          </ScrollReveal>
        </div>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 5: Driver History — past trips + feedback
// =============================================================================
function DriverHistory({ ctx }: { ctx: Ctx }) {
  const [tab, setTab] = useState("trips");
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lịch sử"
        description="Các chuyến đã chạy và phản hồi từ hành khách."
        icon={<History className="size-7" />}
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="trips">Chuyến đã chạy</TabsTrigger>
          <TabsTrigger value="feedback">Phản hồi</TabsTrigger>
        </TabsList>
        <TabsContent value="trips">
          {ctx.trips.filter((t: any) => String(t.status || "").toUpperCase() === "COMPLETED").length === 0 ? (
            <EmptyState
              icon={<History className="size-7" />}
              title="Chưa có chuyến hoàn thành"
              description="Lịch sử các chuyến đã chạy sẽ hiển thị tại đây."
            />
          ) : (
            <div className="space-y-3">
              {ctx.trips.filter((t: any) => String(t.status || "").toUpperCase() === "COMPLETED").map((t: any) => (
                <ExpressiveCard key={t.id} variant="elevated" className="p-4 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 shrink-0 rounded-xl bg-success-container text-success flex items-center justify-center">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{t.routeCode ? `Tuyến ${t.routeCode} — ${t.routeName}` : t.routeName}</p>
                      <p className="text-xs text-on-surface-variant">
                        {formatDate(t.serviceDate || t.date)} • {t.departureTime || t.departTime || "Chưa có giờ"}
                      </p>
                    </div>
                  </div>
                </ExpressiveCard>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="feedback">
          {ctx.feedback.length === 0 ? (
            <EmptyState
              icon={<Star className="size-7" />}
              title="Chưa có phản hồi"
              description="Hành khách chưa để lại phản hồi cho chuyến của bạn."
            />
          ) : (
            <div className="space-y-3">
              {ctx.feedback.map((f: any) => (
                <ExpressiveCard key={f.id} variant="elevated" className="p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{f.studentName}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(f.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("size-3", i < (f.rating || 0) ? "fill-amber-400 text-amber-400" : "text-outline")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm line-clamp-3">{f.content}</p>
                </ExpressiveCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

// =============================================================================
// Screen 6: Driver Contact — coordinator + dispatcher
// =============================================================================
function DriverContact() {
  const [contact, setContact] = useState<DispatcherContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [chatText, setChatText] = useState("");

  // Incident Form State
  const [incidentType, setIncidentType] = useState("OTHER");
  const [description, setDescription] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const loadContact = useCallback(async () => {
    try {
      const data = await driverDispatchApi.contact();
      setContact(data);
    } catch (err: any) {
      console.error("Lỗi lấy thông tin liên hệ điều phối:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContact();
    }, 0);
    const interval = setInterval(() => {
      if (!document.hidden) void loadContact();
    }, 4000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadContact]);

  const handleSendMessage = async () => {
    if (!chatText.trim() || !contact || sending) return;
    try {
      setSending(true);
      await driverDispatchApi.sendMessage({
        tripId: contact.activeTripId || undefined,
        content: chatText.trim()
      });
      setChatText("");
      await loadContact();
    } catch (err: any) {
      toast.error(err.message || "Không gửi được tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !contact || reporting) return;
    if (!contact.activeTripId) {
      toast.error("Bạn cần có chuyến xe đang chạy để gửi báo cáo sự cố SOS!");
      return;
    }
    try {
      setReporting(true);
      await driverDispatchApi.reportIncident({
        tripId: contact.activeTripId,
        incidentType,
        description: description.trim()
      });
      toast.success("Đã gửi báo cáo sự cố khẩn cấp SOS!");
      setDescription("");
      await loadContact();
    } catch (err: any) {
      toast.error(err.message || "Gửi báo cáo thất bại");
    } finally {
      setReporting(false);
    }
  };

  const displayMessages = useMemo(() => {
    if (!contact || !contact.messages) return [];
    return contact.messages
      .filter((message) => !message.content.startsWith("[SOS]"))
      .sort((left, right) => {
        const leftTime = left.sentAt ? new Date(left.sentAt).getTime() : 0;
        const rightTime = right.sentAt ? new Date(right.sentAt).getTime() : 0;
        if (leftTime !== rightTime) return leftTime - rightTime;
        return left.messageId - right.messageId;
      });
  }, [contact]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "end" });
  }, [displayMessages.length]);

  if (loading && !contact) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <RefreshCw className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="rounded-[28px] bg-surface-container p-6 text-center text-on-surface-variant">
        Không tìm thấy thông tin điều phối chính cho ca chạy này.
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Liên hệ điều phối"
        description="Gửi tin nhắn hoặc báo cáo sự cố khẩn cấp (SOS)."
        icon={<Phone className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0 items-start">
        {/* Khung chat */}
        <ExpressiveCard variant="elevated" className="flex flex-col h-[480px] p-0 overflow-hidden">
          <div className="p-4 border-b-2 border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
            <div>
              <h3 className="font-bold flex items-center gap-2 text-on-surface">
                <MessageSquare className="size-4" />
                {contact.dispatcherName}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{contact.department || "Ban Điều Phối"}</p>
            </div>
            {contact.phoneNumber && (
              <a
                href={`tel:${contact.phoneNumber}`}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                <Phone className="size-3.5" /> {contact.phoneNumber}
              </a>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-lowest scrollbar-soft">
            {displayMessages.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center mt-8">
                Chưa có tin nhắn nào. Gửi tin nhắn cho điều phối viên khi cần hỗ trợ.
              </p>
            ) : (
              displayMessages.map((m) => {
                const isMe = m.senderName !== contact.dispatcherName;
                return (
                  <div key={m.messageId} className={cn("flex max-w-[85%]", isMe && "ml-auto justify-end")}>
                    <div className={cn("px-3.5 py-2.5 rounded-2xl text-sm", isMe ? "bg-[#beff50] text-[#14140f] font-medium rounded-tr-none" : "bg-surface-container-high text-on-surface rounded-tl-none")}>
                      <p className="break-words">{m.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t p-3 bg-surface-container-low flex gap-2 shrink-0">
            <Input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Nhập tin nhắn..."
              disabled={sending}
              className="flex-1 rounded-full bg-surface-container border-none"
            />
            <ExpressiveButton variant="filled" size="icon" onClick={handleSendMessage} disabled={sending || !chatText.trim()}>
              <Send className="size-4" />
            </ExpressiveButton>
          </div>
        </ExpressiveCard>

        {/* Khung SOS */}
        <ExpressiveCard variant="elevated" className="p-5 h-fit space-y-4 border border-error/20 bg-error-container/5 rounded-[2rem]">
          <div className="flex items-center gap-2 text-error">
            <ShieldAlert className="size-6 shrink-0" />
            <h3 className="font-bold text-lg">Báo cáo sự cố khẩn cấp (SOS)</h3>
          </div>

          <form onSubmit={handleReportIncident} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Phân loại sự cố</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full rounded-2xl border bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="OTHER">Nội bộ / Khác</option>
                <option value="TECHNICAL">Sự cố kỹ thuật</option>
                <option value="OVERCROWDED">Xe quá tải</option>
                <option value="EMERGENCY">Khẩn cấp / Tai nạn</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Mô tả chi tiết</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả sự cố cụ thể để điều phối hỗ trợ kịp thời..."
                required
                rows={4}
                className="w-full rounded-2xl bg-surface-container-lowest"
              />
            </div>

            {contact.activeTripId ? (
              <p className="text-[11px] text-on-surface-variant/80">
                Sự cố sẽ được liên kết trực tiếp với chuyến xe đang chạy của bạn.
              </p>
            ) : (
              <p className="text-[11px] text-error font-medium">
                Cảnh báo: Bạn hiện không có chuyến xe nào đang chạy. SOS chỉ được gửi khi đang trong chuyến xe.
              </p>
            )}

            <ExpressiveButton
              type="submit"
              variant="error"
              disabled={reporting || !description.trim() || !contact.activeTripId}
              className="w-full justify-center gap-1.5 rounded-full"
            >
              <AlertTriangle className="size-4" />
              {reporting ? "Đang gửi báo cáo..." : "GỬI BÁO CÁO KHẨN CẤP"}
            </ExpressiveButton>
          </form>
        </ExpressiveCard>
      </div>
    </PageTransition>
  );
}
// =============================================================================
function FallbackScreen({ activeId }: { activeId: string }) {
  return (
    <EmptyState
      icon={<Info className="size-7" />}
      title="Màn chưa hỗ trợ"
      description={`Màn "${activeId}" chưa được triển khai.`}
    />
  );
}

