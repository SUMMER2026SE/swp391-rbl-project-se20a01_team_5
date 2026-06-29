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
  messagingApi,
  type DriverTripView,
  type DriverDashboardView,
  type ExperienceTripCard,
  type ExperienceFeedbackCard,
  type ExperienceDashboardStat,
  type DriverContactView,
  type InternalMessageCard,
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
  const upcomingTrips = ctx.trips.filter((t: any) => t.status === "scheduled").slice(0, 3);
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
      const r = await operationsApi.driverTrips();
      setTrips(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được chuyến");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const elapsed = useElapsed(!!trips?.find((t) => t.status === "RUNNING"));

  const startTrip = async (tripId: number) => {
    setStarting(tripId);
    try {
      await operationsApi.startTrip(tripId);
      toast.success("Đã bắt đầu chuyến");
      load();
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể bắt đầu chuyến");
    } finally {
      setStarting(null);
    }
  };

  const endTrip = async (tripId: number) => {
    setEnding(tripId);
    try {
      await operationsApi.endTrip(tripId);
      toast.success("Đã kết thúc chuyến");
      load();
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể kết thúc chuyến");
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

  const runningTrip = trips.find((t) => t.status === "RUNNING");

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Chuyến đang chạy"
        description="Bắt đầu/kết thúc chuyến và theo dõi tiến độ."
        icon={<PlayCircle className="size-7" />}
      />

      {/* Running trip — timer hero */}
      {runningTrip && (
        <ScrollReveal>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative overflow-hidden rounded-3xl p-5 sm:p-7 elev-2"
            style={{ backgroundColor: "#beff50", color: "#14140f" }}
          >
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" />
            <div className="relative min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold items-center">
                  <motion.span
                    className="size-1.5 rounded-full bg-[#beff50]"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  ĐANG CHẠY
                </span>
                <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f]/10 text-xs font-bold items-center">
                  {runningTrip.licensePlate || "—"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 truncate">{runningTrip.routeName}</h2>
              <div className="flex items-center gap-2 mb-5">
                <Clock className="size-5" />
                <span className="text-3xl font-black tabular-nums">{fmtTimer(elapsed)}</span>
              </div>
              {runningTrip.stops && runningTrip.stops.length > 0 && (
                <RouteMapSVG currentIndex={0} />
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <ExpressiveButton
                  variant="filled"
                  className="bg-[#14140f] text-[#beff50]"
                  onClick={() => endTrip(runningTrip.tripId)}
                  disabled={ending === runningTrip.tripId}
                >
                  {ending === runningTrip.tripId ? <RefreshCw className="size-4 animate-spin" /> : <StopCircle className="size-4" />}
                  Kết thúc chuyến
                </ExpressiveButton>
                <ExpressiveButton variant="outlined" className="border-[#14140f] text-[#14140f]" onClick={() => onNavigate("drv-route")}>
                  <Navigation className="size-4" />
                  Xem lộ trình
                </ExpressiveButton>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      )}

      {/* All today's trips */}
      <Section title="Tất cả chuyến hôm nay">
        <div className="space-y-3">
          {trips.map((t) => {
            const sp = tripStatusPill(t.status);
            return (
              <ExpressiveCard key={t.tripId} variant="elevated" className="p-5 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 shrink-0 rounded-2xl bg-surface-container-high flex items-center justify-center">
                      <Bus className="size-6 text-on-surface-variant" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{t.routeName}</p>
                      <p className="text-xs text-on-surface-variant">
                        {t.departureTime || formatDate(t.serviceDate)} • {t.licensePlate || "—"}
                      </p>
                    </div>
                  </div>
                  <M3StatusPill label={sp.label} tone={sp.tone} />
                </div>
                {t.stops && t.stops.length > 0 && (
                  <div className="mb-3">
                    <HorizontalTimeline stops={t.stops} currentIndex={t.status === "RUNNING" ? 0 : undefined} />
                  </div>
                )}
                {t.status === "SCHEDULED" && (
                  <ExpressiveButton
                    variant="filled"
                    size="sm"
                    onClick={() => startTrip(t.tripId)}
                    disabled={starting === t.tripId}
                  >
                    {starting === t.tripId ? <RefreshCw className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                    Bắt đầu chuyến
                  </ExpressiveButton>
                )}
                {t.status === "RUNNING" && (
                  <ExpressiveButton
                    variant="filled"
                    size="sm"
                    className="bg-error text-on-error"
                    onClick={() => endTrip(t.tripId)}
                    disabled={ending === t.tripId}
                  >
                    {ending === t.tripId ? <RefreshCw className="size-4 animate-spin" /> : <StopCircle className="size-4" />}
                    Kết thúc chuyến
                  </ExpressiveButton>
                )}
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
  }, [ctx.trips]);

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
          {ctx.trips.filter((t: any) => t.status === "completed").length === 0 ? (
            <EmptyState
              icon={<History className="size-7" />}
              title="Chưa có chuyến hoàn thành"
              description="Lịch sử các chuyến đã chạy sẽ hiển thị tại đây."
            />
          ) : (
            <div className="space-y-3">
              {ctx.trips.filter((t: any) => t.status === "completed").map((t: any) => (
                <ExpressiveCard key={t.id} variant="elevated" className="p-4 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 shrink-0 rounded-xl bg-success-container text-success flex items-center justify-center">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{t.routeName}</p>
                      <p className="text-xs text-on-surface-variant">
                        {formatDate(t.date)} • {t.departTime}
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
  const contacts = useApi<DriverContactView[]>(() => operationsApi.driverContacts(), undefined, []);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<InternalMessageCard[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const coordinator = useMemo(
    () => contacts.raw?.find((contact) => contact.type === "COORDINATOR" && contact.userId) || null,
    [contacts.raw]
  );
  const coordinatorUserId = coordinator?.userId ?? null;

  const loadMessages = useCallback(async () => {
    if (!coordinatorUserId) return;
    setLoadingMessages(true);
    try {
      const data = await messagingApi.getConversation(coordinatorUserId);
      setMessages(data);
      messagingApi.markAsRead(coordinatorUserId).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể tải tin nhắn");
    } finally {
      setLoadingMessages(false);
    }
  }, [coordinatorUserId]);

  useEffect(() => {
    if (!coordinatorUserId) return;
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, [coordinatorUserId, loadMessages]);

  const send = async () => {
    if (!message.trim() || sending || !coordinatorUserId) return;
    const text = message.trim();
    setMessage("");
    setSending(true);
    try {
      await messagingApi.sendMessage({ recipientUserId: coordinatorUserId, body: text });
      await loadMessages();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể gửi tin nhắn");
      setMessage(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Liên hệ"
        description="Liên hệ điều phối viên và bộ phận hỗ trợ."
        icon={<Phone className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal>
          <Section title="Danh bạ">
            <div className="space-y-3">
              {contacts.loading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-on-surface-variant">
                  <RefreshCw className="size-4 animate-spin" />
                  Đang tải danh bạ...
                </div>
              ) : contacts.error ? (
                <EmptyState
                  icon={<Phone className="size-7" />}
                  title="Không tải được danh bạ"
                  description={contacts.error}
                />
              ) : !contacts.raw?.length ? (
                <EmptyState icon={<Phone className="size-7" />} title="Chưa có liên hệ" />
              ) : (
                contacts.raw.map((contact, index) => (
                  <ContactPersonCard
                    key={`${contact.type}-${contact.phone}-${index}`}
                    name={contact.role}
                    role={contact.name}
                    phone={contact.phone}
                    avatar={contact.type === "EMERGENCY"
                      ? "EM"
                      : contact.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase()}
                    accent={contact.type === "EMERGENCY" ? "#dc2626" : "#beff50"}
                  />
                ))
              )}
            </div>
          </Section>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <ExpressiveCard variant="elevated" className="flex flex-col h-[400px] min-w-0">
            <div className="p-4 border-b-2 border-outline-variant">
              <h3 className="font-bold flex items-center gap-2">
                <MessageSquare className="size-4" />
                Nhắn tin điều phối
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-w-0">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center gap-2 text-sm text-on-surface-variant mt-8">
                  <RefreshCw className="size-4 animate-spin" />
                  Đang tải tin nhắn...
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center mt-8">
                  Gửi tin nhắn cho điều phối viên khi cần hỗ trợ.
                </p>
              ) : null}
              {messages.slice().reverse().map((m) => {
                const isMe = m.senderUserId !== coordinatorUserId;
                return (
                <motion.div
                  key={m.messageId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex max-w-[85%]", isMe && "ml-auto justify-end")}
                >
                  <div className={cn("px-3 py-2 rounded-2xl text-sm", isMe ? "bg-primary text-on-primary" : "bg-surface-container-high")}>
                    {m.body}
                  </div>
                </motion.div>
                );
              })}
            </div>
            <div className="p-3 border-t-2 border-outline-variant flex gap-2 min-w-0">
              <Input
                placeholder="Nhập tin nhắn..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={sending || !coordinatorUserId}
                className="flex-1 min-w-0"
              />
              <ExpressiveButton variant="filled" size="icon" onClick={send} disabled={sending || !message.trim() || !coordinatorUserId}>
                <Send className="size-4" />
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
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
