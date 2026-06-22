"use client";

// =============================================================================
// Coordinator Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// 10 role-specific screens:
//   crd-dashboard, crd-live-map, crd-schedule, crd-assign-driver, crd-assign-bus,
//   crd-routes, crd-stops, crd-by-university, crd-feedback, crd-notify
// Visual: keeps prototype v1.1 (hero perk card, live fleet map, weekly schedule
// grid, route edit dialog, feedback queue, broadcast notify).
// Data: real backend via /coordinator/* and /operations/* endpoints.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  Navigation,
  Calendar,
  UserCog,
  Bus as BusIcon,
  Route as RouteIcon,
  Users,
  School,
  Star,
  Send,
  Megaphone,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Plus,
  Trash2,
  Edit,
  Save,
  Phone,
  Gauge,
  Clock,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Filter,
  BarChart3,
  Activity,
  MessageSquare,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  ExpressiveButton,
  ExpressiveCard,
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

import {
  useCoordinatorPrototypeData,
  useApi,
  formatVND,
  formatDateTime,
  formatDate,
} from "@/lib/prototype-data";
import {
  operationsApi,
  coordinatorRoutesApi,
  experienceApi,
  feedbackApi,
  notificationApi,
  type ScheduleDashboard,
  type RouteListItem,
  type RouteStopDto,
  type LiveFleetVehicle,
  type ExperienceFeedbackCard,
  type ExperienceDashboardStat,
  type CoordinatorUniversityMetric,
} from "@/lib/api/client";

type CoordinatorModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function CoordinatorModule({ activeId, onNavigate }: CoordinatorModuleProps) {
  const proto = useCoordinatorPrototypeData();

  if (proto.loading) return <LoadingScreen label="Đang tải dữ liệu điều phối..." />;
  if (proto.error) return <ErrorScreen message={proto.error} onRetry={proto.reload} />;

  const d = proto.data!;
  const ctx = {
    user: d.user,
    routes: d.routes,
    stops: d.stops,
    fleet: d.fleet,
    feedback: d.feedback,
    stats: d.stats,
    schedule: d.schedule,
    notifications: d.notifications,
    raw: {
      dashboard: d.dashboard,
      fleetRaw: d.fleetRaw,
      scheduleRaw: d.scheduleRaw,
      feedbackRaw: d.feedbackRaw,
      notificationsRaw: d.notificationsRaw,
      profileRaw: d.profileRaw,
    },
    reload: proto.reload,
  };

  switch (activeId) {
    case "crd-dashboard":
      return <DashboardScreen ctx={ctx} onNavigate={onNavigate} />;
    case "crd-live-map":
      return <LiveMapScreen ctx={ctx} />;
    case "crd-schedule":
      return <ScheduleScreen ctx={ctx} />;
    case "crd-assign-driver":
      return <AssignDriverScreen ctx={ctx} />;
    case "crd-assign-bus":
      return <AssignBusScreen ctx={ctx} />;
    case "crd-routes":
      return <RoutesScreen ctx={ctx} />;
    case "crd-stops":
      return <StopsScreen ctx={ctx} />;
    case "crd-by-university":
      return <ByUniversityScreen />;
    case "crd-feedback":
      return <FeedbackScreen ctx={ctx} />;
    case "crd-notify":
      return <NotifyScreen ctx={ctx} />;
    default:
      return <FallbackScreen activeId={activeId} />;
  }
}

export default CoordinatorModule;

// =============================================================================
interface Ctx {
  user: any;
  routes: any[];
  stops: any[];
  fleet: any[];
  feedback: any[];
  stats: ExperienceDashboardStat[];
  schedule: ScheduleDashboard | null;
  notifications: any[];
  raw: any;
  reload: () => void;
}

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
          <RefreshCw className="size-4" /> Thử lại
        </ExpressiveButton>
      )}
    </div>
  );
}

// =============================================================================
// Screen 1: Dashboard
// =============================================================================
function DashboardScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const runningFleet = ctx.fleet.filter((v: any) => v.status === "RUNNING");
  const statCards = ctx.stats.slice(0, 4);
  const pendingFeedback = ctx.feedback.filter((f: any) => f.status !== "resolved").length;

  // Trips per route — derive from fleet
  const tripsPerRoute = useMemo(() => {
    const counts: Record<string, { name: string; trips: number; color: string }> = {};
    ctx.fleet.forEach((v: any) => {
      const id = String(v.routeId);
      if (!counts[id]) {
        const route = ctx.routes.find((r) => r.id === id);
        counts[id] = {
          name: route?.code || v.routeName?.slice(0, 6) || `R${id}`,
          trips: 0,
          color: route?.color || "#14b8a6",
        };
      }
      counts[id].trips += 1;
    });
    return Object.values(counts);
  }, [ctx.fleet, ctx.routes]);

  const quickActions = [
    { id: "crd-live-map", label: "Bản đồ trực tiếp", icon: Navigation, accent: "primary" as const },
    { id: "crd-schedule", label: "Lịch trình", icon: Calendar, accent: "tertiary" as const },
    { id: "crd-assign-driver", label: "Phân công tài xế", icon: UserCog, accent: "secondary" as const },
    { id: "crd-feedback", label: "Phản hồi", icon: Star, accent: "primary" as const },
  ];

  return (
    <PageTransition className="space-y-6 sm:space-y-8 min-w-0">
      {/* Hero */}
      <div className="space-y-4 min-w-0">
        <SplitText
          as="h1"
          text="Tổng quan điều phối"
          className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface text-balance leading-[1.05]"
          stagger={0.06}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between min-w-0">
          <p className="text-base text-on-surface-variant text-pretty">
            Trung tâm điều hành hoạt động xe bus sinh viên · Đà Nẵng
          </p>
          <ExpressiveButton
            variant="tonal"
            size="sm"
            onClick={() => { ctx.reload(); toast.success("Đã làm mới dữ liệu"); }}
          >
            <Activity className="size-4" /> Làm mới
          </ExpressiveButton>
        </div>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#7c3aed] text-white text-xs font-bold shrink-0">
            <UserCog className="size-3.5" />
            Điều phối viên
          </span>
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#beff50] text-[#14140f] text-xs font-bold shrink-0">
            <motion.span
              className="size-1.5 rounded-full bg-[#14140f]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            {runningFleet.length} xe đang chạy
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
          {quickActions.map((action) => {
            const accentMap: Record<string, { bg: string; fg: string }> = {
              primary: { bg: "#14140f", fg: "#beff50" },
              tertiary: { bg: "#ff8c5f", fg: "#14140f" },
              secondary: { bg: "#144fcc", fg: "#beff50" },
            };
            const a = accentMap[action.accent];
            return (
              <motion.button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="group relative overflow-hidden rounded-2xl p-4 elev-1 hover:elev-2 transition-shadow text-left min-w-0"
                style={{ backgroundColor: a.bg, color: a.fg }}
              >
                <action.icon className="size-6 mb-3" />
                <p className="text-sm font-bold leading-tight">{action.label}</p>
                <ChevronRight className="size-4 mt-2 opacity-70 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* StatCards */}
      <StaggerGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
        <StaggerItem>
          <StatCard
            label="Xe đang chạy"
            value={<Counter to={runningFleet.length} format={(n) => `${Math.round(n)}/${ctx.fleet.length}`} />}
            icon={<BusIcon className="size-5" />}
            hint={`${ctx.fleet.length} xe tổng`}
            trend="up"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tuyến hoạt động"
            value={<Counter to={ctx.routes.length} />}
            icon={<RouteIcon className="size-5" />}
            hint="Tất cả tuyến ổn định"
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Trạm dừng"
            value={<Counter to={ctx.stops.length} />}
            icon={<MapPin className="size-5" />}
            hint="Trên toàn mạng lưới"
            accent="secondary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Phản hồi chờ xử lý"
            value={<Counter to={pendingFeedback} />}
            icon={<MessageSquare className="size-5" />}
            hint="Cần xử lý trong 24h"
            accent="error"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Live fleet + Trips per route chart */}
      <div className="grid gap-4 lg:grid-cols-3 min-w-0">
        {/* Live bus status */}
        <ScrollReveal className="lg:col-span-2 min-w-0">
          <Section
            title="Fleet trực tiếp"
            actions={<button onClick={() => onNavigate("crd-live-map")} className="text-xs font-bold text-primary">Xem bản đồ</button>}
          >
            {runningFleet.length === 0 ? (
              <EmptyState
                icon={<Navigation className="size-7" />}
                title="Không có xe chạy"
                description="Hiện không có chuyến nào đang chạy."
              />
            ) : (
              <div className="space-y-2">
                {runningFleet.slice(0, 5).map((v: any) => (
                  <ExpressiveCard key={v.tripId} variant="elevated" className="p-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 shrink-0 rounded-xl bg-[#beff50] text-[#14140f] flex items-center justify-center">
                        <BusIcon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{v.routeName}</p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {v.licensePlate || "—"} • {v.driverName || "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-primary">{v.speedKmh || 0} km/h</p>
                        {v.occupancy != null && (
                          <p className="text-[10px] text-on-surface-variant">{v.occupancy} khách</p>
                        )}
                      </div>
                    </div>
                  </ExpressiveCard>
                ))}
              </div>
            )}
          </Section>
        </ScrollReveal>

        {/* Trips per route BarChart */}
        <ScrollReveal delay={0.08} className="min-w-0">
          <ExpressiveCard variant="filled" className="p-5 h-full min-w-0">
            <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shrink-0">
                  <TrendingUp className="size-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-on-surface truncate">Chuyến theo tuyến</h3>
                  <p className="text-xs text-on-surface-variant">Đang chạy</p>
                </div>
              </div>
              <M3StatusPill label={`${tripsPerRoute.length}`} tone="tertiary" />
            </div>
            {tripsPerRoute.length === 0 ? (
              <EmptyState icon={<BarChart3 className="size-7" />} title="Chưa có dữ liệu" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={tripsPerRoute} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="name" stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RTooltip
                    contentStyle={{ background: "#14140f", border: "1px solid #14140f", borderRadius: 16, color: "#beff50" }}
                    formatter={(v: any) => [`${v} chuyến`, "Số chuyến"]}
                    cursor={{ fill: "var(--color-surface-container-highest)" }}
                  />
                  <Bar dataKey="trips" radius={[8, 8, 0, 0]}>
                    {tripsPerRoute.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

// =============================================================================
// Screen 2: Live Map
// =============================================================================
function LiveMapScreen({ ctx }: { ctx: Ctx }) {
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Bản đồ trực tiếp"
        description="Vị trí xe theo thời gian thực."
        icon={<Navigation className="size-7" />}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 min-w-0">
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="overflow-hidden h-[500px] min-w-0">
            <LiveFleetMap vehicles={ctx.fleet} />
          </ExpressiveCard>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <ExpressiveCard variant="filled" className="p-5 h-full min-w-0">
            <h3 className="text-base font-bold mb-3">{ctx.fleet.length} xe đang chạy</h3>
            <div className="space-y-2 overflow-y-auto max-h-[440px]">
              {ctx.fleet.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center mt-8">
                  Không có xe đang chạy lúc này.
                </p>
              ) : (
                ctx.fleet.map((v: any) => (
                  <div key={v.tripId} className="p-3 rounded-xl bg-surface-container-low min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                      <p className="font-bold text-sm truncate">{v.routeName}</p>
                      <M3StatusPill label={v.status} tone={v.status === "RUNNING" ? "success" : "neutral"} />
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {v.licensePlate || "—"} • {v.driverName || "—"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="flex items-center gap-1"><Gauge className="size-3" /> {v.speedKmh || 0} km/h</span>
                      {v.occupancy != null && <span className="flex items-center gap-1"><Users className="size-3" /> {v.occupancy}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

function LiveFleetMap({ vehicles }: { vehicles: LiveFleetVehicle[] }) {
  // Use Leaflet via dynamic import — for simplicity use a stylized SVG map
  // (real-map.tsx is for routes; here we want vehicle positions)
  return (
    <div className="relative w-full h-full bg-[#0f172a] overflow-hidden">
      {/* Stylized Đà Nẵng river + districts */}
      <svg viewBox="0 0 800 500" className="w-full h-full">
        <defs>
          <radialGradient id="bg-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
        <rect width="800" height="500" fill="url(#bg-glow)" />
        {/* River */}
        <path d="M0,300 Q200,260 400,290 T800,270" stroke="#1e3a8a" strokeWidth="20" fill="none" opacity="0.5" />
        {/* District circles */}
        {[200, 400, 600].map((x, i) => (
          <circle key={i} cx={x} cy={250} r="60" fill="#1e293b" opacity="0.5" />
        ))}
        {/* Vehicles */}
        {vehicles.map((v, i) => {
          const lat = Number(v.latitude) || 16.07;
          const lng = Number(v.longitude) || 108.15;
          const x = ((lng - 108.0) / 0.3) * 800;
          const y = ((16.15 - lat) / 0.15) * 500;
          return (
            <g key={v.tripId} transform={`translate(${Math.max(20, Math.min(780, x))},${Math.max(20, Math.min(480, y))})`}>
              <circle r="20" fill="#beff50" opacity="0.2">
                <animate attributeName="r" from="12" to="24" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle r="10" fill="#beff50" stroke="#14140f" strokeWidth="2" />
              <text y="-15" textAnchor="middle" fill="#beff50" fontSize="10" fontWeight="bold">
                {v.licensePlate || `Xe ${i + 1}`}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-3 bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
        {vehicles.length} xe • Cập nhật {formatDateTime(new Date().toISOString())}
      </div>
    </div>
  );
}

// =============================================================================
// Screen 3: Schedule (weekly grid)
// =============================================================================
function ScheduleScreen({ ctx }: { ctx: Ctx }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dashboard, setDashboard] = useState<ScheduleDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await operationsApi.scheduleDashboard(date);
      setDashboard(d);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được lịch");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lịch trình"
        description="Phân công chuyến theo ngày."
        icon={<Calendar className="size-7" />}
        actions={
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full sm:w-44"
          />
        }
      />
      {loading ? (
        <LoadingScreen label="Đang tải lịch..." />
      ) : !dashboard || dashboard.shifts.length === 0 ? (
        <EmptyState
          icon={<Calendar className="size-7" />}
          title="Không có chuyến"
          description={`Không có chuyến nào vào ${formatDate(date)}.`}
        />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {dashboard.shifts.map((s, i) => (
            <StaggerItem key={i}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{s.routeName || `Tuyến ${s.routeId}`}</p>
                    <p className="text-xs text-on-surface-variant">
                      {s.departureTime || s.time || "—"}
                    </p>
                  </div>
                  <M3StatusPill
                    label={s.status || (s.scheduleId ? "SCHEDULED" : "OPEN")}
                    tone={s.scheduleId ? "primary" : "warning"}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-on-surface-variant">Tài xế</p>
                    <p className="font-bold truncate">{s.driverName || "Chưa gán"}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant">Phụ xe</p>
                    <p className="font-bold truncate">{s.conductorName || "Chưa gán"}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant">Xe</p>
                    <p className="font-bold truncate">{s.licensePlate || "Chưa gán"}</p>
                  </div>
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 4: Assign Driver
// =============================================================================
function AssignDriverScreen({ ctx }: { ctx: Ctx }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dashboard, setDashboard] = useState<ScheduleDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<Record<string, number | undefined>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await operationsApi.scheduleDashboard(date);
      setDashboard(d);
      const init: Record<string, number | undefined> = {};
      d.shifts.forEach((s) => {
        if (s.scheduleId) init[s.scheduleId] = s.driverStaffId;
      });
      setAssignments(init);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được lịch");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const save = async (scheduleId: number) => {
    const driverId = assignments[scheduleId];
    if (!driverId) {
      toast.error("Vui lòng chọn tài xế");
      return;
    }
    setSaving((s) => ({ ...s, [scheduleId]: true }));
    try {
      const shift = dashboard!.shifts.find((s) => s.scheduleId === scheduleId);
      await operationsApi.saveSchedules({
        serviceDate: date,
        shifts: [{
          scheduleId,
          routeId: shift?.routeId,
          driverStaffId: driverId,
          conductorStaffId: shift?.conductorStaffId,
          busId: shift?.busId,
          departureTime: shift?.departureTime || shift?.time,
        }],
      });
      toast.success("Đã phân công tài xế");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể phân công");
    } finally {
      setSaving((s) => ({ ...s, [scheduleId]: false }));
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Phân công tài xế"
        description="Gán tài xế cho các chuyến."
        icon={<UserCog className="size-7" />}
        actions={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-44" />}
      />
      {loading ? (
        <LoadingScreen />
      ) : !dashboard || dashboard.shifts.length === 0 ? (
        <EmptyState icon={<UserCog className="size-7" />} title="Không có chuyến" description="Không có chuyến cần phân công." />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {dashboard.shifts.map((s, i) => {
            const sid = s.scheduleId;
            return (
              <StaggerItem key={i}>
                <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{s.routeName || `Tuyến ${s.routeId}`}</p>
                      <p className="text-xs text-on-surface-variant">{s.departureTime || s.time || "—"}</p>
                    </div>
                    {s.driverName && <M3StatusPill label="Đã gán" tone="success" />}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-bold">Tài xế</Label>
                      <Select
                        value={sid && assignments[sid] ? String(assignments[sid]) : ""}
                        onValueChange={(v) => sid && setAssignments((a) => ({ ...a, [sid]: Number(v) }))}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn tài xế" /></SelectTrigger>
                        <SelectContent>
                          {dashboard.drivers.map((drv) => (
                            <SelectItem key={drv.staffId} value={String(drv.staffId)}>{drv.fullName} ({drv.status})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {sid && (
                      <ExpressiveButton
                        variant="filled"
                        size="sm"
                        onClick={() => save(sid)}
                        disabled={saving[sid]}
                      >
                        {saving[sid] ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Lưu phân công
                      </ExpressiveButton>
                    )}
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
// Screen 5: Assign Bus
// =============================================================================
function AssignBusScreen({ ctx }: { ctx: Ctx }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dashboard, setDashboard] = useState<ScheduleDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<Record<string, number | undefined>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await operationsApi.scheduleDashboard(date);
      setDashboard(d);
      const init: Record<string, number | undefined> = {};
      d.shifts.forEach((s) => {
        if (s.scheduleId) init[s.scheduleId] = s.busId;
      });
      setAssignments(init);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được lịch");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const save = async (scheduleId: number) => {
    const busId = assignments[scheduleId];
    if (!busId) {
      toast.error("Vui lòng chọn xe");
      return;
    }
    setSaving((s) => ({ ...s, [scheduleId]: true }));
    try {
      const shift = dashboard!.shifts.find((s) => s.scheduleId === scheduleId);
      await operationsApi.saveSchedules({
        serviceDate: date,
        shifts: [{
          scheduleId,
          routeId: shift?.routeId,
          driverStaffId: shift?.driverStaffId,
          conductorStaffId: shift?.conductorStaffId,
          busId,
          departureTime: shift?.departureTime || shift?.time,
        }],
      });
      toast.success("Đã phân công xe");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể phân công");
    } finally {
      setSaving((s) => ({ ...s, [scheduleId]: false }));
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Phân công xe"
        description="Gán xe cho các chuyến."
        icon={<BusIcon className="size-7" />}
        actions={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-44" />}
      />
      {loading ? (
        <LoadingScreen />
      ) : !dashboard || dashboard.shifts.length === 0 ? (
        <EmptyState icon={<BusIcon className="size-7" />} title="Không có chuyến" />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {dashboard.shifts.map((s, i) => {
            const sid = s.scheduleId;
            return (
              <StaggerItem key={i}>
                <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{s.routeName || `Tuyến ${s.routeId}`}</p>
                      <p className="text-xs text-on-surface-variant">{s.departureTime || s.time || "—"}</p>
                    </div>
                    {s.licensePlate && <M3StatusPill label="Đã gán" tone="success" />}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-bold">Xe</Label>
                      <Select
                        value={sid && assignments[sid] ? String(assignments[sid]) : ""}
                        onValueChange={(v) => sid && setAssignments((a) => ({ ...a, [sid]: Number(v) }))}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn xe" /></SelectTrigger>
                        <SelectContent>
                          {dashboard.buses.map((b) => (
                            <SelectItem key={b.busId} value={String(b.busId)}>{b.licensePlate} ({b.seatCount || "?"} chỗ)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {sid && (
                      <ExpressiveButton
                        variant="filled"
                        size="sm"
                        onClick={() => save(sid)}
                        disabled={saving[sid]}
                      >
                        {saving[sid] ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Lưu phân công
                      </ExpressiveButton>
                    )}
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
// Screen 6: Routes management (CRUD)
// =============================================================================
function RoutesScreen({ ctx }: { ctx: Ctx }) {
  const [routes, setRoutes] = useState<RouteListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RouteListItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await coordinatorRoutesApi.getRoutes();
      setRoutes(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được tuyến");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: number) => {
    try {
      await coordinatorRoutesApi.deleteRoute(id);
      toast.success("Đã xóa tuyến");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể xóa");
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Tuyến xe"
        description="Quản lý tuyến đường."
        icon={<RouteIcon className="size-7" />}
        actions={<ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm tuyến</ExpressiveButton>}
      />
      {loading ? (
        <LoadingScreen />
      ) : !routes || routes.length === 0 ? (
        <EmptyState icon={<RouteIcon className="size-7" />} title="Chưa có tuyến" />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {routes.map((r) => (
            <StaggerItem key={r.id}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{r.routeName}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{r.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1"><Clock className="size-3" /> {r.estimatedMinutes} phút</span>
                      <M3StatusPill label={r.status} tone={r.status === "ACTIVE" ? "success" : "neutral"} />
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <ExpressiveButton variant="text" size="icon-sm" onClick={() => setEditing(r)}><Edit className="size-4" /></ExpressiveButton>
                    <ExpressiveButton variant="text" size="icon-sm" onClick={() => setDeleting(r.id)}><Trash2 className="size-4 text-error" /></ExpressiveButton>
                  </div>
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      <Dialog open={adding || !!editing} onOpenChange={(o) => { if (!o) { setAdding(false); setEditing(null); } }}>
        <RouteEditDialog
          route={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={() => { setAdding(false); setEditing(null); load(); }}
        />
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tuyến?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác. Tất cả trạm trên tuyến cũng sẽ bị xóa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove(deleting)} className="bg-error text-on-error hover:bg-error/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}

function RouteEditDialog({ route, onClose, onSaved }: { route: RouteListItem | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(route?.routeName || "");
  const [description, setDescription] = useState(route?.description || "");
  const [minutes, setMinutes] = useState(String(route?.estimatedMinutes || 30));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên tuyến");
      return;
    }
    setSaving(true);
    try {
      if (route) {
        await coordinatorRoutesApi.updateRoute(route.id, {
          routeName: name.trim(),
          description: description.trim(),
          estimatedMinutes: Number(minutes) || 30,
        });
      } else {
        await coordinatorRoutesApi.createRoute({
          routeName: name.trim(),
          description: description.trim(),
          estimatedMinutes: Number(minutes) || 30,
        });
      }
      toast.success(route ? "Đã cập nhật" : "Đã thêm tuyến");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể lưu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{route ? "Sửa tuyến" : "Thêm tuyến mới"}</DialogTitle>
        <DialogDescription>Nhập thông tin tuyến.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div>
          <Label className="text-xs font-bold">Tên tuyến</Label>
          <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Tuyến xanh Duy Tân" />
        </div>
        <div>
          <Label className="text-xs font-bold">Mô tả</Label>
          <Textarea className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div>
          <Label className="text-xs font-bold">Thời gian dự kiến (phút)</Label>
          <Input className="mt-1.5" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <ExpressiveButton variant="text" onClick={onClose} disabled={saving}>Hủy</ExpressiveButton>
        <ExpressiveButton variant="filled" onClick={save} disabled={saving}>
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
          Lưu
        </ExpressiveButton>
      </DialogFooter>
    </DialogContent>
  );
}

// =============================================================================
// Screen 7: Stops management
// =============================================================================
function StopsScreen({ ctx }: { ctx: Ctx }) {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [stops, setStops] = useState<RouteStopDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    coordinatorRoutesApi.getRoutes().then(setRoutes).catch(() => setRoutes([]));
  }, []);

  useEffect(() => {
    if (!selectedRouteId && routes.length > 0) setSelectedRouteId(routes[0].id);
  }, [routes]);

  const load = useCallback(async () => {
    if (!selectedRouteId) return;
    setLoading(true);
    try {
      const s = await coordinatorRoutesApi.getRouteStops(selectedRouteId);
      setStops(s);
    } catch {
      setStops([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRouteId]);

  useEffect(() => { load(); }, [load]);

  const remove = async (stopId: number) => {
    if (!selectedRouteId) return;
    try {
      await coordinatorRoutesApi.deleteStop(selectedRouteId, stopId);
      toast.success("Đã xóa trạm");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể xóa");
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Trạm dừng"
        description="Quản lý trạm trên từng tuyến."
        icon={<MapPin className="size-7" />}
        actions={
          <Select value={selectedRouteId ? String(selectedRouteId) : ""} onValueChange={(v) => setSelectedRouteId(Number(v))}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Chọn tuyến" /></SelectTrigger>
            <SelectContent>
              {routes.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.routeName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {loading ? (
        <LoadingScreen />
      ) : !stops || stops.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-7" />}
          title="Chưa có trạm"
          description="Tuyến này chưa có trạm nào."
          action={<ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm trạm</ExpressiveButton>}
        />
      ) : (
        <>
          <div className="flex justify-end">
            <ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm trạm</ExpressiveButton>
          </div>
          <StaggerGroup className="space-y-3 min-w-0">
            {stops.map((s) => (
              <StaggerItem key={s.id}>
                <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 shrink-0 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
                      {s.stopOrder}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{s.stopName}</p>
                      <p className="text-xs text-on-surface-variant">+{s.minutesFromPreviousStop} phút từ trạm trước</p>
                    </div>
                    <ExpressiveButton variant="text" size="icon-sm" onClick={() => setDeleting(s.id)}>
                      <Trash2 className="size-4 text-error" />
                    </ExpressiveButton>
                  </div>
                </ExpressiveCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <StopAddDialog
          routeId={selectedRouteId!}
          onClose={() => setAdding(false)}
          onAdded={() => { setAdding(false); load(); }}
        />
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa trạm?</AlertDialogTitle>
            <AlertDialogDescription>Trạm sẽ bị xóa khỏi tuyến.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove(deleting)} className="bg-error text-on-error hover:bg-error/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}

function StopAddDialog({ routeId, onClose, onAdded }: { routeId: number; onClose: () => void; onAdded: () => void }) {
  const [stopName, setStopName] = useState("");
  const [stopOrder, setStopOrder] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!stopName.trim()) {
      toast.error("Vui lòng nhập tên trạm");
      return;
    }
    setSaving(true);
    try {
      await coordinatorRoutesApi.addStop(routeId, {
        stopName: stopName.trim(),
        stopOrder: Number(stopOrder) || 1,
        minutesFromPreviousStop: Number(minutes) || 0,
      });
      toast.success("Đã thêm trạm");
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể thêm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Thêm trạm dừng</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div>
          <Label className="text-xs font-bold">Tên trạm</Label>
          <Input className="mt-1.5" value={stopName} onChange={(e) => setStopName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold">Thứ tự</Label>
            <Input className="mt-1.5" type="number" value={stopOrder} onChange={(e) => setStopOrder(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-bold">Phút từ trạm trước</Label>
            <Input className="mt-1.5" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <ExpressiveButton variant="text" onClick={onClose} disabled={saving}>Hủy</ExpressiveButton>
        <ExpressiveButton variant="filled" onClick={save} disabled={saving}>
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Thêm
        </ExpressiveButton>
      </DialogFooter>
    </DialogContent>
  );
}

// =============================================================================
// Screen 8: By University
// =============================================================================
function ByUniversityScreen() {
  const metrics = useApi<CoordinatorUniversityMetric[]>(
    () => experienceApi.coordinatorByUniversity(),
    undefined,
    []
  );

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Tuyến theo trường"
        description="Thống kê tuyến theo từng trường đại học."
        icon={<School className="size-7" />}
        actions={
          <ExpressiveButton variant="outlined" size="sm" onClick={metrics.reload}>
            <RefreshCw className={cn("size-4", metrics.loading && "animate-spin")} />
            Làm mới
          </ExpressiveButton>
        }
      />
      {metrics.error ? (
        <ErrorScreen message={metrics.error} onRetry={metrics.reload} />
      ) : metrics.loading ? (
        <LoadingScreen label="Đang tải thống kê theo trường..." />
      ) : !metrics.raw?.length ? (
        <EmptyState icon={<School className="size-7" />} title="Chưa có trường liên kết" />
      ) : (
        <StaggerGroup className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-w-0">
          {metrics.raw.map((item) => (
            <StaggerItem key={item.universityId}>
              <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                <div className="flex items-start justify-between gap-4 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: item.colorHex || "#144fcc", color: "#fff" }}
                    >
                      <School className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface truncate">{item.universityName}</p>
                      <p className="text-sm text-on-surface-variant">{item.shortName || "Trường đối tác"}</p>
                    </div>
                  </div>
                  <M3StatusPill label={`${item.tripsToday} chuyến hôm nay`} tone="success" />
                </div>
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Tuyến", value: item.routeCount, icon: RouteIcon },
                    { label: "Xe", value: item.fleetCount, icon: BusIcon },
                    { label: "Tài xế", value: item.driverCount, icon: Users },
                    { label: "Sinh viên", value: item.studentCount, icon: School },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-xl bg-surface-container-high p-3 min-w-0">
                      <metric.icon className="size-4 text-on-surface-variant" />
                      <p className="mt-2 text-xl font-bold tabular-nums text-on-surface">
                        {metric.value.toLocaleString("vi-VN")}
                      </p>
                      <p className="text-xs text-on-surface-variant">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 9: Feedback queue (resolve)
// =============================================================================
function FeedbackScreen({ ctx }: { ctx: Ctx }) {
  const [filter, setFilter] = useState<"all" | "new" | "processing" | "resolved">("all");
  const [responding, setResponding] = useState<number | null>(null);
  const [response, setResponse] = useState("");

  const filtered = ctx.feedback.filter((f: any) => {
    if (filter === "all") return true;
    return f.status === filter;
  });

  const resolve = async (id: number) => {
    if (!response.trim()) {
      toast.error("Vui lòng nhập phản hồi");
      return;
    }
    setResponding(id);
    try {
      await feedbackApi.resolve(id, response.trim());
      toast.success("Đã xử lý phản hồi");
      setResponse("");
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể xử lý");
    } finally {
      setResponding(null);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Phản hồi"
        description="Xử lý phản hồi từ hành khách."
        icon={<Star className="size-7" />}
        actions={
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="new">Mới</SelectItem>
              <SelectItem value="processing">Đang xử lý</SelectItem>
              <SelectItem value="resolved">Đã xử lý</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {filtered.length === 0 ? (
        <EmptyState icon={<Star className="size-7" />} title="Không có phản hồi" />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {filtered.map((f: any) => (
            <StaggerItem key={f.id}>
              <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{f.studentName}</p>
                    <p className="text-xs text-on-surface-variant">{formatDate(f.createdAt)}</p>
                  </div>
                  <M3StatusPill
                    label={f.status}
                    tone={f.status === "resolved" ? "success" : f.status === "processing" ? "primary" : "warning"}
                  />
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("size-3", i < (f.rating || 0) ? "fill-amber-400 text-amber-400" : "text-outline")} />
                  ))}
                  <span className="text-xs text-on-surface-variant ml-2">{f.category}</span>
                </div>
                <p className="text-sm line-clamp-3">{f.content}</p>
                {f.response && (
                  <div className="mt-3 p-2 rounded-lg bg-success-container/30 text-xs">
                    <p className="font-bold text-success">Phản hồi:</p>
                    <p>{f.response}</p>
                  </div>
                )}
                {f.status !== "resolved" && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Nhập phản hồi xử lý..."
                      value={responding === f.id ? response : ""}
                      onChange={(e) => { setResponding(f.id); setResponse(e.target.value); }}
                      rows={2}
                    />
                    <ExpressiveButton
                      variant="filled"
                      size="sm"
                      onClick={() => resolve(f.id)}
                      disabled={responding === f.id && !response.trim()}
                    >
                      {responding === f.id ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                      Xử lý
                    </ExpressiveButton>
                  </div>
                )}
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 10: Notify broadcast
// =============================================================================
function NotifyScreen({ ctx }: { ctx: Ctx }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    setSending(true);
    try {
      await notificationApi.create({ title: title.trim(), content: content.trim(), target });
      toast.success("Đã gửi thông báo");
      setTitle("");
      setContent("");
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể gửi");
    } finally {
      setSending(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Gửi thông báo"
        description="Gửi thông báo đến người dùng."
        icon={<Megaphone className="size-7" />}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-5 min-w-0">
            <h3 className="text-base font-bold mb-4">Soạn thông báo</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold">Tiêu đề</Label>
                <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề..." />
              </div>
              <div>
                <Label className="text-xs font-bold">Nội dung</Label>
                <Textarea className="mt-1.5" value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Nội dung..." />
              </div>
              <div>
                <Label className="text-xs font-bold">Đối tượng</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả người dùng</SelectItem>
                    <SelectItem value="students">Sinh viên</SelectItem>
                    <SelectItem value="drivers">Tài xế</SelectItem>
                    <SelectItem value="conductors">Phụ xe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ExpressiveButton variant="filled" className="w-full" onClick={send} disabled={sending}>
                {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
                Gửi thông báo
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Section title={`Gần đây (${ctx.notifications.length})`}>
            {ctx.notifications.length === 0 ? (
              <EmptyState icon={<Megaphone className="size-7" />} title="Chưa gửi thông báo" />
            ) : (
              <div className="space-y-2">
                {ctx.notifications.slice(0, 5).map((n: any) => (
                  <ExpressiveCard key={n.id} variant="filled" className="p-3 min-w-0">
                    <p className="font-bold text-sm truncate">{n.title}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{formatDateTime(n.createdAt)}</p>
                  </ExpressiveCard>
                ))}
              </div>
            )}
          </Section>
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
