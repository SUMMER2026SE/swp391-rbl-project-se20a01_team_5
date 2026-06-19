"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Navigation,
  CalendarClock,
  UserCog,
  Bus as BusIcon,
  Route as RouteIcon,
  MapPinned,
  MessageSquare,
  Megaphone,
  Users,
  Clock,
  Activity,
  AlertTriangle,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Star,
  Send,
  CalendarDays,
  Gauge,
  CheckCircle2,
  X,
  Phone,
  CircleDot,
  Bus,
  MoreVertical,
  Info,
  Zap,
  Filter,
  ShieldCheck,
  GraduationCap,
  Building2,
  School,
  Sparkles,
  ArrowRight,
  Hash,
  UserCheck,
  Wallet,
  TrendingUp,
} from "lucide-react";

import { PageHeader, StatCard, Section, EmptyState } from "../primitives";
import {
  ExpressiveButton,
  ExpressiveCard,
  Chip,
  StatusPill,
  M3Progress,
  ListItem,
  SegmentedButton,
} from "@/components/m3/primitives";
import {
  SplitText,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Counter,
  Parallax,
} from "@/components/m3/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

import {
  allBuses,
  allDrivers,
  buses,
  busStops,
  feedbackList,
  incidents,
  routes,
  schedules,
  trips,
  universities,
  universityById,
  universityStats,
  routeUniversities,
  formatVND,
  routeById,
  stopById,
} from "@/lib/mock-data";
import type { BusStop, Feedback, Route, ScheduleSlot } from "@/lib/types";

// ============================================================
// Shared visual helpers — M3 Expressive tonal
// ============================================================

const shiftMeta = {
  morning: {
    container: "bg-primary-container text-on-primary-container",
    bar: "bg-primary",
    dot: "bg-primary",
    label: "Sáng",
  },
  afternoon: {
    container: "bg-tertiary-container text-on-tertiary-container",
    bar: "bg-tertiary",
    dot: "bg-tertiary",
    label: "Chiều",
  },
  evening: {
    container: "bg-secondary-container text-on-secondary-container",
    bar: "bg-secondary",
    dot: "bg-secondary",
    label: "Tối",
  },
} as const;

type ShiftKey = keyof typeof shiftMeta;

function BusStatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "neutral"> = {
    running: "success",
    active: "success",
    idle: "warning",
    maintenance: "neutral",
  };
  const labels: Record<string, string> = {
    running: "Đang chạy",
    active: "Đang chạy",
    idle: "Chờ",
    maintenance: "Bảo trì",
  };
  return (
    <StatusPill label={labels[status] ?? status} tone={map[status] ?? "neutral"} />
  );
}

function DriverStatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "neutral"> = {
    "on-duty": "success",
    break: "warning",
    off: "neutral",
  };
  const labels: Record<string, string> = {
    "on-duty": "Đang trực",
    break: "Nghỉ giải lao",
    off: "Nghỉ phép",
  };
  return (
    <StatusPill label={labels[status] ?? status} tone={map[status] ?? "neutral"} />
  );
}

function RouteCodeBadge({ code, color }: { code: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: color ?? "#10b981" }}
    >
      {code}
    </span>
  );
}

function Stars({ rating, size = "size-3.5" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size,
            i < rating
              ? "fill-tertiary text-tertiary"
              : "fill-surface-container-highest text-on-surface-variant/40"
          )}
        />
      ))}
    </div>
  );
}

function severityTone(sev: string): "error" | "warning" | "success" {
  if (sev === "high") return "error";
  if (sev === "medium") return "warning";
  return "success";
}

function severityLabel(sev: string) {
  if (sev === "high") return "Cao";
  if (sev === "medium") return "Trung bình";
  return "Thấp";
}

// ============================================================
// Main module
// ============================================================

export function CoordinatorModule({
  activeId,
}: {
  activeId: string;
  onNavigate: (id: string) => void;
}) {
  switch (activeId) {
    case "crd-dashboard":
      return <DashboardScreen />;
    case "crd-live":
      return <LiveMapScreen />;
    case "crd-schedule":
      return <ScheduleScreen />;
    case "crd-assign-driver":
      return <AssignDriverScreen />;
    case "crd-assign-bus":
      return <AssignBusScreen />;
    case "crd-routes":
      return <RoutesScreen />;
    case "crd-stops":
      return <StopsScreen />;
    case "crd-by-university":
      return <ByUniversityScreen />;
    case "crd-feedback":
      return <FeedbackScreen />;
    case "crd-notify":
      return <NotifyScreen />;
    default:
      return <DashboardScreen />;
  }
}

// ============================================================
// 1. Dashboard — Tổng quan điều phối (SplitText title, Counter)
// ============================================================

function DashboardScreen() {
  const runningBuses = allBuses.filter((b) => b.status === "running").length;
  const onDutyDrivers = allDrivers.filter((d) => d.status === "on-duty").length;
  const activeRoutes = routes.filter((r) => r.active).length;
  const pendingFeedback = feedbackList.filter((f) => f.status !== "resolved").length;

  const shiftCounts = {
    morning: schedules.filter((s) => s.shift === "morning").length,
    afternoon: schedules.filter((s) => s.shift === "afternoon").length,
    evening: schedules.filter((s) => s.shift === "evening").length,
  };
  const shiftTotal = shiftCounts.morning + shiftCounts.afternoon + shiftCounts.evening || 1;

  const tripsPerRoute = routes.map((r) => ({
    name: r.code,
    trips: trips.filter((t) => t.routeId === r.id).length,
    color: r.color,
  }));

  const openIncidents = incidents.filter((i) => i.status !== "closed");

  return (
    <div className="space-y-8">
      {/* Hero header with SplitText */}
      <div className="space-y-4">
        <SplitText
          as="h1"
          text="Tổng quan điều phối"
          className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface text-balance leading-[1.05]"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-base text-on-surface-variant text-pretty">
            Trung tâm điều hành hoạt động xe bus sinh viên · Đà Nẵng
          </p>
          <ExpressiveButton
            variant="tonal"
            size="sm"
            onClick={() => toast.success("Đã làm mới dữ liệu trực tiếp")}
          >
            <Activity className="size-4" /> Làm mới
          </ExpressiveButton>
        </div>
      </div>

      {/* Stat cards — StaggerGroup + Counter */}
      <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Xe đang chạy"
            value={
              <Counter
                to={runningBuses}
                format={(n) => `${Math.round(n)}/${allBuses.length}`}
              />
            }
            icon={<Bus className="size-5" />}
            hint="+2 so với giờ này hôm qua"
            trend="up"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tài xế trực"
            value={<Counter to={onDutyDrivers} />}
            icon={<Users className="size-5" />}
            hint={`${allDrivers.length - onDutyDrivers} tài xế nghỉ`}
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tuyến hoạt động"
            value={
              <Counter
                to={activeRoutes}
                format={(n) => `${Math.round(n)}/${routes.length}`}
              />
            }
            icon={<RouteIcon className="size-5" />}
            hint="Tất cả tuyến ổn định"
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live bus status */}
        <ScrollReveal className="lg:col-span-2" y={24}>
          <ExpressiveCard variant="filled" className="p-0">
            <div className="flex items-center justify-between gap-2 border-b border-outline-variant px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                  <Navigation className="size-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-on-surface">
                    Tình trạng xe thời gian thực
                  </h3>
                  <p className="truncate text-xs text-on-surface-variant">
                    Cập nhật mỗi 30 giây · {allBuses.length} xe
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-container px-3 py-1 text-xs font-medium text-white">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                LIVE
              </span>
            </div>
            <div className="max-h-96 space-y-2 overflow-y-auto scrollbar-soft p-3">
              {allBuses.map((b) => {
                const [occ, cap] = b.occupancy
                  .split("/")
                  .map((s) => parseInt(s, 10));
                const pct = cap ? Math.round((occ / cap) * 100) : 0;
                const routeColor = routes.find(
                  (r) => r.code === b.route
                )?.color;
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 transition-colors hover:bg-surface-container"
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        b.status === "maintenance"
                          ? "bg-surface-container-highest text-on-surface-variant"
                          : "bg-primary-container text-on-primary-container"
                      )}
                    >
                      {b.plate.split("-")[1]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-sm">{b.plate}</span>
                        {b.route !== "—" && (
                          <RouteCodeBadge code={b.route} color={routeColor} />
                        )}
                        <BusStatusBadge status={b.status} />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <M3Progress value={pct} className="min-w-0 flex-1" />
                        <span className="shrink-0 text-[11px] font-medium text-on-surface-variant tabular-nums">
                          {b.occupancy}
                        </span>
                      </div>
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-1 text-[11px] text-on-surface-variant sm:flex">
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="size-3" /> {b.status === "maintenance" ? "—" : `${b.occupancy.split("/")[0] && "0"} km/h`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Open incidents */}
        <ScrollReveal y={24} delay={0.05}>
          <ExpressiveCard variant="filled" className="p-0 h-full">
            <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-4 sm:px-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                <AlertTriangle className="size-4" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-on-surface">
                  Sự cố đang mở
                </h3>
                <p className="truncate text-xs text-on-surface-variant">
                  {openIncidents.length} sự cố cần xử lý
                </p>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-soft p-3">
              {openIncidents.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="size-5" />}
                  title="Không có sự cố"
                  description="Mọi hoạt động ổn định"
                />
              ) : (
                <div className="space-y-2">
                  {openIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="rounded-xl bg-surface-container-low p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-on-surface-variant">
                          {inc.code}
                        </span>
                        <StatusPill
                          label={severityLabel(inc.severity)}
                          tone={severityTone(inc.severity)}
                        />
                      </div>
                      <p className="mt-1.5 text-sm text-on-surface line-clamp-2">
                        {inc.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-on-surface-variant">
                        <RouteCodeBadge code={inc.routeCode} />
                        <span>·</span>
                        <span>{inc.reporter}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Shift distribution */}
        <ScrollReveal y={24}>
          <ExpressiveCard variant="filled" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-tertiary-container text-on-tertiary-container">
                <Clock className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-on-surface">
                Phân bố ca trực
              </h3>
            </div>
            <div className="space-y-4">
              {(Object.keys(shiftMeta) as ShiftKey[]).map((sh) => {
                const count = shiftCounts[sh];
                const pct = Math.round((count / shiftTotal) * 100);
                return (
                  <div key={sh}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", shiftMeta[sh].dot)} />
                        <span className="text-sm font-medium text-on-surface">
                          Ca {shiftMeta[sh].label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-on-surface tabular-nums">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", shiftMeta[sh].bar)}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Tổng ca hôm nay</span>
              <span className="font-semibold text-on-surface">
                {shiftTotal} ca
              </span>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Trips per route BarChart */}
        <ScrollReveal y={24} delay={0.05} className="lg:col-span-2">
          <ExpressiveCard variant="filled" className="p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                  <TrendingUp className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">
                    Chuyến theo tuyến (hôm nay)
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Số chuyến đã và đang chạy
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="rounded-full">
                {trips.length} chuyến
              </Badge>
            </div>
            <div className="min-w-0 w-full h-64">
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={tripsPerRoute} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--m3-outline-variant)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--m3-on-surface-variant)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--m3-on-surface-variant)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--m3-surface-container-high)",
                      border: "1px solid var(--m3-outline-variant)",
                      borderRadius: 12,
                      color: "var(--m3-on-surface)",
                      fontSize: 12,
                    }}
                    cursor={{ fill: "var(--m3-surface-container-highest)" }}
                  />
                  <Bar dataKey="trips" radius={[8, 8, 0, 0]}>
                    {tripsPerRoute.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </div>
  );
}

// ============================================================
// 2. Live map — Theo dõi tất cả xe (parallax bg + pulsing markers)
// ============================================================

const MAP_BOUNDS = {
  minLat: 10.81,
  maxLat: 10.9,
  minLng: 106.58,
  maxLng: 106.85,
};

function project(lat: number, lng: number) {
  const x =
    ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
  const y =
    ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
  return {
    left: `${Math.max(6, Math.min(94, x))}%`,
    top: `${Math.max(8, Math.min(90, y))}%`,
  };
}

function LiveMapScreen() {
  const activeBuses = buses.filter((b) => b.status === "active");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(buses[0]?.id ?? null);

  const filtered =
    routeFilter === "all"
      ? activeBuses
      : activeBuses.filter((b) => b.routeId === routeFilter);

  const selectedBus = buses.find((b) => b.id === selected) ?? filtered[0];
  const selectedRoute = selectedBus ? routeById(selectedBus.routeId ?? "") : undefined;
  // build polyline for each active route from stop coords
  const routePolylines = routes
    .filter((r) => r.active)
    .map((r) => {
      const pts = r.stops
        .map((sid) => stopById(sid))
        .filter(Boolean)
        .map((s) => project(s!.lat, s!.lng));
      return { id: r.id, code: r.code, color: r.color, pts };
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theo dõi tất cả xe"
        description="Bản đồ điều phối trực tiếp — vị trí các xe đang hoạt động"
        icon={<Navigation className="size-5" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-container px-3 py-1.5 text-xs font-medium text-white">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              LIVE
            </span>
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger className="h-9 w-[160px] rounded-full">
                <Filter className="size-3.5 text-on-surface-variant" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tuyến</SelectItem>
                {routes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.code} · {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Map with parallax bg */}
        <ExpressiveCard variant="elevated" className="overflow-hidden p-0 lg:col-span-2">
          <div className="relative h-[50vh] min-h-[320px] w-full overflow-hidden lg:h-[480px]">
            {/* Aurora-m3 background */}
            <Parallax offset={20} className="absolute inset-0">
              <div className="absolute inset-0 bg-aurora-m3" />
            </Parallax>
            {/* Grid texture overlay */}
            <div className="absolute inset-0 grid-texture opacity-40" />

            {/* Route polylines */}
            <svg className="absolute inset-0 size-full" aria-hidden>
              {routePolylines.map((pl) => {
                if (pl.pts.length < 2) return null;
                const d = pl.pts
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${p.left} ${p.top}`)
                  .join(" ");
                return (
                  <g key={pl.id}>
                    <path
                      d={d}
                      fill="none"
                      stroke={pl.color}
                      strokeWidth="2.5"
                      strokeOpacity="0.55"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="6 4"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Stop markers */}
            {busStops.slice(0, 8).map((s) => {
              const p = project(s.lat, s.lng);
              return (
                <div
                  key={s.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: p.left, top: p.top }}
                  title={s.name}
                >
                  <div className="flex items-center justify-center size-3 rounded-full bg-surface shadow ring-2 ring-primary/40" />
                </div>
              );
            })}

            {/* Bus markers (pulsing) */}
            {filtered.map((b) => {
              const p = project(b.lat, b.lng);
              const isSelected = selectedBus?.id === b.id;
              const routeColor = routeById(b.routeId ?? "")?.color ?? "var(--m3-primary)";
              return (
                <button
                  key={b.id}
                  onClick={() => setSelected(b.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                  style={{ left: p.left, top: p.top }}
                >
                  <span className="relative flex">
                    {/* pulse */}
                    <span
                      className="absolute inline-flex size-full animate-ping rounded-full opacity-60"
                      style={{ backgroundColor: routeColor, opacity: 0.35 }}
                    />
                    <span
                      className={cn(
                        "relative inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-white elev-1 transition-transform",
                        isSelected && "scale-110 ring-2 ring-offset-2 ring-offset-surface"
                      )}
                      style={{
                        backgroundColor: routeColor,
                        // @ts-expect-error css var
                        "--tw-ring-color": routeColor,
                      }}
                    >
                      <Bus className="size-3" />
                      {b.plate.split("-")[1]}
                    </span>
                  </span>
                </button>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-3 left-3 rounded-xl border border-outline-variant bg-surface-container/85 px-3 py-2 text-[11px] elev-1 backdrop-blur">
              <p className="font-medium text-on-surface mb-1">Chú thích</p>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="size-2 rounded-full bg-primary" /> Xe đang chạy
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="size-2 rounded-full bg-surface ring-2 ring-primary/40" /> Trạm dừng
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="block h-0.5 w-3 bg-tertiary" /> Tuyến đường
              </div>
            </div>
          </div>
        </ExpressiveCard>

        {/* Side list */}
        <ExpressiveCard variant="filled" className="flex flex-col p-0">
          <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
              <CircleDot className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-on-surface">
                Xe đang hoạt động
              </h3>
              <p className="text-xs text-on-surface-variant">
                {filtered.length} xe trên đường
              </p>
            </div>
          </div>
          <div className="flex-1 max-h-[60vh] overflow-y-auto scrollbar-soft lg:max-h-[420px]">
            {filtered.length === 0 && (
              <EmptyState
                icon={<Bus className="size-5" />}
                title="Không có xe"
                description="Chưa có xe nào trên tuyến này"
              />
            )}
            {filtered.map((b) => {
              const r = routeById(b.routeId ?? "");
              const isSel = selectedBus?.id === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelected(b.id)}
                  className={cn(
                    "state-layer flex w-full items-start gap-3 border-b border-outline-variant px-4 py-3 text-left transition-colors last:border-b-0",
                    isSel ? "bg-secondary-container text-on-secondary-container" : "hover:bg-surface-container"
                  )}
                >
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold"
                    style={{ backgroundColor: r?.color ?? "var(--m3-primary)" }}
                  >
                    {b.plate.split("-")[1]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 truncate text-sm font-medium">{b.plate}</span>
                      {r && <RouteCodeBadge code={r.code} color={r.color} />}
                    </div>
                    <p className="truncate text-xs text-on-surface-variant">
                      {r?.name ?? "Chưa phân tuyến"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-on-surface-variant">
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="size-3" /> {b.speed} km/h
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" /> {b.occupancy}/{b.capacity}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" /> ETA {b.etaMin} phút
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ExpressiveCard>
      </div>

      {/* Selected bus detail strip */}
      {selectedBus && (
        <ExpressiveCard variant="filled" className="p-0">
          <div className="grid gap-px bg-outline-variant/40 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <DetailField
              icon={<Bus className="size-4" />}
              label="Biển số / Xe"
              value={selectedBus.plate}
              hint={selectedBus.model}
            />
            <DetailField
              icon={<RouteIcon className="size-4" />}
              label="Tuyến đang chạy"
              value={selectedRoute?.code ?? "—"}
              hint={selectedRoute?.name}
            />
            <DetailField
              icon={<Gauge className="size-4" />}
              label="Tốc độ hiện tại"
              value={`${selectedBus.speed} km/h`}
              hint={`Hành khách: ${selectedBus.occupancy}/${selectedBus.capacity}`}
            />
            <DetailField
              icon={<Clock className="size-4" />}
              label="Trạm tiếp theo"
              value={`${selectedBus.etaMin} phút`}
              hint={selectedBus.nextStopId ? stopById(selectedBus.nextStopId)?.name : "—"}
            />
          </div>
        </ExpressiveCard>
      )}
    </div>
  );
}

function DetailField({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-surface-container-low p-5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-on-surface truncate">{value}</p>
        {hint && (
          <p className="mt-0.5 text-xs text-on-surface-variant truncate">{hint}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 3. Schedule — Lịch trình xe (weekly grid, tonal shift chips)
// ============================================================

interface DayCol {
  key: string;
  label: string;
  date: number;
  isToday: boolean;
}

function buildWeek(offset: number): DayCol[] {
  const today = new Date();
  const day = today.getDay();
  const offsetToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + offsetToMon + offset * 7);
  const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const todayKey = today.toISOString().slice(0, 10);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: labels[i],
      date: d.getDate(),
      isToday: key === todayKey,
    };
  });
}

function genWeeklySchedule(days: DayCol[]) {
  const map = new Map<string, ScheduleSlot[]>();
  days.forEach((d, idx) => {
    const isWeekday = idx < 5;
    const slotsBase = isWeekday ? schedules : schedules.slice(0, 2);
    slotsBase.forEach((s) => {
      const slot: ScheduleSlot = {
        ...s,
        id: `${s.id}-${d.key}`,
        date: d.key,
        shift: isWeekday ? s.shift : "morning",
        startTime: isWeekday ? s.startTime : "07:00",
        endTime: isWeekday ? s.endTime : "11:00",
      };
      const key = `${slot.busId}|${d.key}`;
      const arr = map.get(key) ?? [];
      arr.push(slot);
      map.set(key, arr);
    });
  });
  return map;
}

function ScheduleScreen() {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => buildWeek(weekOffset), [weekOffset]);
  const grid = useMemo(() => genWeeklySchedule(days), [days]);
  const [assignDialog, setAssignDialog] = useState<{
    busId: string;
    day: DayCol;
  } | null>(null);
  const [editSlot, setEditSlot] = useState<ScheduleSlot | null>(null);
  // Mobile day selector — default to today (or first day of week)
  const todayIdx = days.findIndex((d) => d.isToday);
  const [mobileDay, setMobileDay] = useState<string>(
    days[todayIdx >= 0 ? todayIdx : 0].key
  );
  // Keep mobileDay valid when week changes
  const activeDayKey = days.some((d) => d.key === mobileDay)
    ? mobileDay
    : days[todayIdx >= 0 ? todayIdx : 0].key;
  const activeDay = days.find((d) => d.key === activeDayKey)!;

  const rowBuses = allBuses;

  const cellHas = (busId: string, dayKey: string) =>
    grid.get(`${busId}|${dayKey}`) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch trình xe"
        description="Phân công lịch chạy xe theo tuần — nhấp ô trống để phân công"
        icon={<CalendarClock className="size-5" />}
        actions={
          <div className="flex items-center gap-2">
            <ExpressiveButton variant="outlined" size="icon-sm" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronLeft className="size-4" />
            </ExpressiveButton>
            <ExpressiveButton
              variant="tonal"
              size="sm"
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
            >
              <CalendarDays className="size-4" /> Tuần này
            </ExpressiveButton>
            <ExpressiveButton variant="outlined" size="icon-sm" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="size-4" />
            </ExpressiveButton>
          </div>
        }
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {(Object.keys(shiftMeta) as ShiftKey[]).map((sh) => (
          <Chip key={sh} variant="assist" className={cn("cursor-default", shiftMeta[sh].container)}>
            <span className="size-2 rounded-full bg-current opacity-70" />
            Ca {shiftMeta[sh].label}
          </Chip>
        ))}
        <span className="ml-auto text-xs text-on-surface-variant">
          Tuần {days[0].date}–{days[6].date}
          {weekOffset !== 0 && ` (offset ${weekOffset > 0 ? "+" : ""}${weekOffset})`}
        </span>
      </div>

      {/* Mobile day selector (lg:hidden) */}
      <div className="lg:hidden -mx-1 overflow-x-auto scrollbar-soft">
        <SegmentedButton
          className="min-w-max"
          options={days.map((d) => ({
            value: d.key,
            label: `${d.label} ${d.date}`,
          }))}
          value={activeDayKey}
          onChange={setMobileDay}
        />
      </div>

      {/* Mobile / tablet vertical day-by-day list (lg:hidden) */}
      <ExpressiveCard variant="filled" className="overflow-hidden p-0 lg:hidden">
        <div className="flex items-center justify-between gap-2 border-b border-outline-variant px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
              <CalendarDays className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-on-surface">
                {activeDay.label} ngày {activeDay.date}
              </h3>
              <p className="truncate text-xs text-on-surface-variant">
                Lịch chạy xe trong ngày
              </p>
            </div>
          </div>
          {activeDay.isToday && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-on-primary">
              Hôm nay
            </span>
          )}
        </div>
        <div className="max-h-[560px] space-y-2 overflow-y-auto scrollbar-soft p-3">
          {rowBuses.map((b) => {
            const slots = cellHas(b.id, activeDay.key);
            const isMaint = b.status === "maintenance";
            return (
              <div
                key={b.id}
                className="rounded-xl bg-surface-container-low p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
                      isMaint
                        ? "bg-surface-container-highest text-on-surface-variant"
                        : "bg-primary-container text-on-primary-container"
                    )}
                  >
                    {b.plate.split("-")[1]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-on-surface">{b.plate}</p>
                    <p className="truncate text-[11px] text-on-surface-variant">
                      {b.model.split(" ").slice(0, 2).join(" ")}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-on-surface-variant">
                    {isMaint ? "Bảo trì" : `${slots.length} ca`}
                  </span>
                </div>
                {isMaint ? (
                  <div className="mt-2 rounded-lg border border-dashed border-outline-variant bg-surface-container-highest px-2 py-2 text-center text-[11px] text-on-surface-variant">
                    Bảo trì
                  </div>
                ) : slots.length === 0 ? (
                  <button
                    onClick={() => setAssignDialog({ busId: b.id, day: activeDay })}
                    className="state-layer mt-2 flex w-full items-center justify-center rounded-lg border border-dashed border-outline-variant px-2 py-2 text-[11px] text-on-surface-variant transition-colors hover:border-[#beff50] hover:bg-[#beff50] hover:text-[#14140f]"
                  >
                    <Plus className="size-3" /> Phân công
                  </button>
                ) : (
                  <div className="mt-2 space-y-1">
                    {slots.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setEditSlot(s)}
                        className={cn(
                          "state-layer w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-medium transition-transform hover:scale-[1.01]",
                          shiftMeta[s.shift].container
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <RouteCodeBadge code={s.routeCode} color={routeById(s.routeId)?.color} />
                          <span className="opacity-80">{s.startTime}</span>
                        </div>
                        <p className="mt-1 truncate opacity-90">{s.driverName}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ExpressiveCard>

      {/* Desktop weekly matrix (hidden on mobile/tablet) */}
      <ExpressiveCard variant="filled" className="hidden overflow-hidden p-0 lg:block">
        <div className="overflow-x-auto overflow-y-auto scrollbar-soft max-h-[560px]">
          <Table className="min-w-[760px]">
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
              <TableRow className="hover:bg-transparent border-outline-variant">
                <TableHead className="sticky left-0 z-20 bg-surface-container-high min-w-[160px]">
                  Xe / Ngày
                </TableHead>
                {days.map((d) => (
                  <TableHead
                    key={d.key}
                    className={cn(
                      "text-center min-w-[110px]",
                      d.isToday && "bg-[#14140f] text-[#beff50]"
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium">{d.label}</span>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex size-6 items-center justify-center rounded-full text-xs",
                          d.isToday
                            ? "bg-primary text-on-primary"
                            : "text-on-surface-variant"
                        )}
                      >
                        {d.date}
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowBuses.map((b) => (
                <TableRow key={b.id} className="hover:bg-transparent border-outline-variant">
                  <TableCell className="sticky left-0 z-10 bg-surface-container-low">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg text-[10px] font-bold",
                          b.status === "maintenance"
                            ? "bg-surface-container-highest text-on-surface-variant"
                            : "bg-primary-container text-on-primary-container"
                        )}
                      >
                        {b.plate.split("-")[1]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{b.plate}</p>
                        <p className="text-[11px] text-on-surface-variant truncate">
                          {b.model.split(" ").slice(0, 2).join(" ")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {days.map((d) => {
                    const slots = cellHas(b.id, d.key);
                    const isMaint = b.status === "maintenance";
                    return (
                      <TableCell
                        key={d.key}
                        className={cn(
                          "align-top p-1.5 min-w-[110px]",
                          d.isToday && "bg-surface-container-lowest"
                        )}
                      >
                        {isMaint ? (
                          <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-highest px-2 py-3 text-center text-[11px] text-on-surface-variant">
                            Bảo trì
                          </div>
                        ) : slots.length === 0 ? (
                          <button
                            onClick={() =>
                              setAssignDialog({ busId: b.id, day: d })
                            }
                            className="state-layer flex w-full items-center justify-center rounded-lg border border-dashed border-outline-variant px-2 py-3 text-[11px] text-on-surface-variant transition-colors hover:border-[#beff50] hover:bg-[#beff50] hover:text-[#14140f]"
                          >
                            <Plus className="size-3" /> Phân công
                          </button>
                        ) : (
                          <div className="space-y-1">
                            {slots.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => setEditSlot(s)}
                                className={cn(
                                  "state-layer w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-medium transition-transform hover:scale-[1.02]",
                                  shiftMeta[s.shift].container
                                )}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <RouteCodeBadge code={s.routeCode} color={routeById(s.routeId)?.color} />
                                  <span className="opacity-80">{s.startTime}</span>
                                </div>
                                <p className="mt-1 truncate opacity-90">{s.driverName}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ExpressiveCard>

      {assignDialog && (
        <AssignDialog
          busId={assignDialog.busId}
          day={assignDialog.day}
          onClose={() => setAssignDialog(null)}
        />
      )}
      {editSlot && (
        <EditSlotDialog slot={editSlot} onClose={() => setEditSlot(null)} />
      )}
    </div>
  );
}

function AssignDialog({
  busId,
  day,
  onClose,
}: {
  busId: string;
  day: DayCol;
  onClose: () => void;
}) {
  const bus = allBuses.find((b) => b.id === busId);
  const [driverId, setDriverId] = useState(allDrivers[0]?.id ?? "");
  const [routeId, setRouteId] = useState(routes[0]?.id ?? "");
  const [shift, setShift] = useState<ShiftKey>("morning");

  const availableDrivers = allDrivers.filter((d) => d.status !== "off");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Phân công lịch chạy</DialogTitle>
          <DialogDescription>
            Xe {bus?.plate} · {day.label} ngày {day.date}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tài xế</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} · {d.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tuyến</Label>
            <Select value={routeId} onValueChange={setRouteId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routes.filter((r) => r.active).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.code} · {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ca trực</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(shiftMeta) as ShiftKey[]).map((sh) => (
                <button
                  key={sh}
                  onClick={() => setShift(sh)}
                  className={cn(
                    "state-layer h-11 rounded-xl text-sm font-medium transition-colors",
                    shift === sh
                      ? shiftMeta[sh].container
                      : "bg-surface-container-low text-on-surface-variant"
                  )}
                >
                  {shiftMeta[sh].label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <ExpressiveButton variant="text" size="sm">Hủy</ExpressiveButton>
          </DialogClose>
          <ExpressiveButton
            variant="filled"
            size="sm"
            onClick={() => {
              toast.success("Đã phân công lịch chạy thành công");
              onClose();
            }}
          >
            <CheckCircle2 className="size-4" /> Phân công
          </ExpressiveButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditSlotDialog({
  slot,
  onClose,
}: {
  slot: ScheduleSlot;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose(); }}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phân công</DialogTitle>
          <DialogDescription>
            {slot.busPlate} · {slot.routeCode} · Ca {shiftMeta[slot.shift].label}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="text-xs text-on-surface-variant">Tài xế</p>
              <p className="mt-1 text-sm font-medium">{slot.driverName}</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="text-xs text-on-surface-variant">Thời gian</p>
              <p className="mt-1 text-sm font-medium">{slot.startTime} – {slot.endTime}</p>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <ExpressiveButton
            variant="error"
            size="sm"
            onClick={() => {
              toast.success("Đã xóa phân công");
              setOpen(false);
            }}
          >
            <Trash2 className="size-4" /> Xóa
          </ExpressiveButton>
          <DialogClose asChild>
            <ExpressiveButton variant="text" size="sm">Đóng</ExpressiveButton>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 4. Assign driver — Phân công tài xế
// ============================================================

function AssignDriverScreen() {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(allDrivers[0]?.id ?? null);
  // Mock: routes that need drivers
  const routeSlots = routes.filter((r) => r.active).map((r) => ({
    route: r,
    driver: allDrivers.find((d) => d.plate !== "—" && r.code === "DN-01" ? d.id === "u2" : false),
  }));

  const selectedDriver = allDrivers.find((d) => d.id === selectedDriverId);
  // Conflict: driver already has >2 trips today
  const hasConflict = selectedDriver && selectedDriver.tripsToday >= 4;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân công tài xế"
        description="Phân công tài xế trực cho các tuyến cần điều phối"
        icon={<UserCog className="size-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Driver cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-on-surface">Tài xế trực hôm nay</h2>
            <Badge variant="outline" className="rounded-full">{allDrivers.length} người</Badge>
          </div>
          <div className="space-y-2 max-h-[640px] overflow-y-auto scrollbar-soft pr-1">
            {allDrivers.map((d) => {
              const isSel = selectedDriverId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDriverId(d.id)}
                  className={cn(
                    "state-layer w-full text-left rounded-2xl p-4 transition-all border-2",
                    isSel
                      ? "bg-[#beff50] border-[#beff50] text-[#14140f]"
                      : "bg-surface-container-low border-transparent hover:border-outline-variant"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container font-bold">
                      {d.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-sm">{d.name}</span>
                        <DriverStatusBadge status={d.status} />
                      </div>
                      <div className={cn("mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs", isSel ? "text-[#14140f]/70" : "text-on-surface-variant")}>
                        <span className="inline-flex items-center gap-1">
                          <Bus className="size-3" /> {d.plate}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" /> {d.phone}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Activity className="size-3" /> {d.tripsToday} chuyến
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: selected driver stats + route slots */}
        <div className="space-y-4">
          {selectedDriver && (
            <ExpressiveCard variant="filled" className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                  <UserCheck className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-on-surface">
                  Thông tin tài xế được chọn
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-container p-3">
                  <p className="text-xs text-on-surface-variant">Chuyến hôm nay</p>
                  <p className="mt-1 text-2xl font-bold text-on-surface">{selectedDriver.tripsToday}</p>
                </div>
                <div className="rounded-xl bg-surface-container p-3">
                  <p className="text-xs text-on-surface-variant">Trạng thái</p>
                  <div className="mt-1.5">
                    <DriverStatusBadge status={selectedDriver.status} />
                  </div>
                </div>
              </div>
              {hasConflict && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-error-container p-3 text-sm text-on-error-container">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Cảnh báo xung đột lịch</p>
                    <p className="text-xs mt-0.5">
                      Tài xế đã có {selectedDriver.tripsToday} chuyến, nên cân nhắc giảm phân công để tránh quá tải.
                    </p>
                  </div>
                </div>
              )}
            </ExpressiveCard>
          )}

          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-3">
              Tuyến cần phân công tài xế
            </h3>
            <div className="space-y-2">
              {routeSlots.map(({ route, driver }) => (
                <ExpressiveCard key={route.id} variant="outlined" className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <RouteCodeBadge code={route.code} color={route.color} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{route.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {route.from} → {route.to}
                        </p>
                      </div>
                    </div>
                    {driver ? (
                      <ExpressiveButton
                        variant="tonal"
                        size="sm"
                        onClick={() => toast.success(`Đã gỡ ${driver.name} khỏi ${route.code}`)}
                      >
                        Gỡ
                      </ExpressiveButton>
                    ) : (
                      <ExpressiveButton
                        variant="filled"
                        size="sm"
                        disabled={!selectedDriver}
                        onClick={() =>
                          toast.success(
                            `Đã phân công ${selectedDriver?.name} cho tuyến ${route.code}`
                          )
                        }
                      >
                        Phân công
                      </ExpressiveButton>
                    )}
                  </div>
                </ExpressiveCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 5. Assign bus — Phân công xe bus
// ============================================================

function AssignBusScreen() {
  const [selectedBusId, setSelectedBusId] = useState<string | null>(allBuses[0]?.id ?? null);
  const routeSlots = routes.filter((r) => r.active).map((r) => ({
    route: r,
    bus: allBuses.find((b) => b.route === r.code && b.status === "running"),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân công xe bus"
        description="Phân công xe cho các tuyến đang hoạt động"
        icon={<BusIcon className="size-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bus cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-on-surface">Danh sách xe</h2>
            <Badge variant="outline" className="rounded-full">{allBuses.length} xe</Badge>
          </div>
          <div className="space-y-2 max-h-[640px] overflow-y-auto scrollbar-soft pr-1">
            {allBuses.map((b) => {
              const isSel = selectedBusId === b.id;
              const isMaint = b.status === "maintenance";
              return (
                <button
                  key={b.id}
                  disabled={isMaint}
                  onClick={() => setSelectedBusId(b.id)}
                  className={cn(
                    "state-layer w-full text-left rounded-2xl p-4 transition-all border-2",
                    isMaint && "opacity-50 cursor-not-allowed",
                    isSel && !isMaint
                      ? "bg-[#beff50] border-[#beff50] text-[#14140f]"
                      : "bg-surface-container-low border-transparent hover:border-outline-variant"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold",
                        isMaint
                          ? "bg-surface-container-highest text-on-surface-variant"
                          : "bg-primary-container text-on-primary-container"
                      )}
                    >
                      {b.plate.split("-")[1]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-sm">{b.plate}</span>
                        <BusStatusBadge status={b.status} />
                      </div>
                      <p className={cn("mt-1 truncate text-xs", isSel && !isMaint ? "text-[#14140f]/70" : "text-on-surface-variant")}>{b.model}</p>
                      <div className={cn("mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs", isSel && !isMaint ? "text-[#14140f]/70" : "text-on-surface-variant")}>
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3" /> {b.occupancy}
                        </span>
                        {b.route !== "—" && (
                          <span className="inline-flex items-center gap-1">
                            <RouteIcon className="size-3" /> {b.route}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: route slots */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-on-surface">
            Tuyến cần phân công xe
          </h3>
          <div className="space-y-2">
            {routeSlots.map(({ route, bus }) => (
              <ExpressiveCard key={route.id} variant="outlined" className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <RouteCodeBadge code={route.code} color={route.color} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{route.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        Tần suất {route.frequencyMin} phút · {route.distanceKm}km
                      </p>
                    </div>
                  </div>
                  {bus ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-on-surface-variant hidden sm:inline">{bus.plate}</span>
                      <ExpressiveButton
                        variant="tonal"
                        size="sm"
                        onClick={() => toast.success(`Đã gỡ ${bus.plate} khỏi ${route.code}`)}
                      >
                        Gỡ
                      </ExpressiveButton>
                    </div>
                  ) : (
                    <ExpressiveButton
                      variant="filled"
                      size="sm"
                      onClick={() => {
                        const b = allBuses.find((x) => x.id === selectedBusId);
                        if (!b) return;
                        if (b.status === "maintenance") {
                          toast.error("Xe đang bảo trì, không thể phân công");
                          return;
                        }
                        toast.success(`Đã phân công ${b.plate} cho ${route.code}`);
                      }}
                    >
                      Phân công
                    </ExpressiveButton>
                  )}
                </div>
              </ExpressiveCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 6. Routes — Điều chỉnh tuyến
// ============================================================

function RoutesScreen() {
  const [editing, setEditing] = useState<Route | null>(null);
  const [adding, setAdding] = useState(false);
  const [routeList, setRouteList] = useState(routes);

  const toggleActive = (id: string) => {
    setRouteList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điều chỉnh tuyến"
        description="Quản lý thông tin và cấu hình các tuyến xe bus"
        icon={<RouteIcon className="size-5" />}
        actions={
          <ExpressiveButton variant="filled" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Thêm tuyến
          </ExpressiveButton>
        }
      />

      <ExpressiveCard variant="filled" className="p-0">
        <div className="-mx-4 overflow-x-auto overflow-y-auto scrollbar-soft max-h-[560px] sm:mx-0">
          <Table className="min-w-[640px]">
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
              <TableRow className="hover:bg-transparent border-outline-variant">
                <TableHead>Tuyến</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead className="hidden md:table-cell">Tuyến đường</TableHead>
                <TableHead className="hidden md:table-cell text-center">Trạm</TableHead>
                <TableHead className="text-right">Giá vé</TableHead>
                <TableHead className="hidden lg:table-cell text-center">Tần suất</TableHead>
                <TableHead className="text-center">Hoạt động</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routeList.map((r) => (
                <TableRow key={r.id} className="border-outline-variant">
                  <TableCell>
                    <RouteCodeBadge code={r.code} color={r.color} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{r.name}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-on-surface-variant">
                    {r.from} → {r.to}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center text-sm">
                    {r.stops.length}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">
                    {formatVND(r.fare)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center text-sm text-on-surface-variant">
                    {r.frequencyMin} phút
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={r.active}
                      onCheckedChange={() => toggleActive(r.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <ExpressiveButton
                      variant="text"
                      size="icon-sm"
                      onClick={() => setEditing(r)}
                    >
                      <Pencil className="size-4" />
                    </ExpressiveButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ExpressiveCard>

      {editing && (
        <RouteEditDialog
          key={editing.id}
          route={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {adding && <RouteAddDialog onClose={() => setAdding(false)} />}
    </div>
  );
}

function RouteEditDialog({
  route,
  onClose,
}: {
  route: Route;
  onClose: () => void;
}) {
  const [fare, setFare] = useState(route.fare.toString());
  const [freq, setFreq] = useState(route.frequencyMin.toString());
  const [firstTrip, setFirstTrip] = useState(route.firstTrip);
  const [lastTrip, setLastTrip] = useState(route.lastTrip);
  const [stops, setStops] = useState<string[]>(route.stops);

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...stops];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setStops(next);
  };
  const moveDown = (idx: number) => {
    if (idx === stops.length - 1) return;
    const next = [...stops];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    setStops(next);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tuyến {route.code}</DialogTitle>
          <DialogDescription>{route.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-soft pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Giá vé lượt (VND)</Label>
              <Input
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Tần suất (phút)</Label>
              <Input
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Chuyến đầu</Label>
              <Input
                value={firstTrip}
                onChange={(e) => setFirstTrip(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Chuyến cuối</Label>
              <Input
                value={lastTrip}
                onChange={(e) => setLastTrip(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Danh sách trạm (thứ tự)</Label>
            <div className="space-y-1.5">
              {stops.map((sid, idx) => {
                const s = stopById(sid);
                return (
                  <div
                    key={`${sid}-${idx}`}
                    className="flex items-center gap-2 rounded-xl bg-surface-container-low p-2.5"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s?.name}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">{s?.code}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <ExpressiveButton
                        variant="text"
                        size="icon-sm"
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="size-4" />
                      </ExpressiveButton>
                      <ExpressiveButton
                        variant="text"
                        size="icon-sm"
                        onClick={() => moveDown(idx)}
                        disabled={idx === stops.length - 1}
                      >
                        <ArrowDown className="size-4" />
                      </ExpressiveButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <ExpressiveButton variant="text" size="sm">Hủy</ExpressiveButton>
          </DialogClose>
          <ExpressiveButton
            variant="filled"
            size="sm"
            onClick={() => {
              toast.success(`Đã cập nhật tuyến ${route.code}`);
              onClose();
            }}
          >
            <CheckCircle2 className="size-4" /> Lưu thay đổi
          </ExpressiveButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RouteAddDialog({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fare, setFare] = useState("5000");
  const [freq, setFreq] = useState("15");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Thêm tuyến mới</DialogTitle>
          <DialogDescription>Nhập thông tin tuyến xe bus mới</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Mã tuyến</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SU-05" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Tần suất (phút)</Label>
              <Input value={freq} onChange={(e) => setFreq(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tên tuyến</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tuyến mới" className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Điểm đầu</Label>
              <Input value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Điểm cuối</Label>
              <Input value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Giá vé lượt (VND)</Label>
            <Input value={fare} onChange={(e) => setFare(e.target.value)} className="rounded-xl" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <ExpressiveButton variant="text" size="sm">Hủy</ExpressiveButton>
          </DialogClose>
          <ExpressiveButton
            variant="filled"
            size="sm"
            onClick={() => {
              if (!code || !name) {
                toast.error("Vui lòng nhập mã và tên tuyến");
                return;
              }
              toast.success(`Đã thêm tuyến ${code}`);
              onClose();
            }}
          >
            <Plus className="size-4" /> Thêm tuyến
          </ExpressiveButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 7. Stops — Trạm dừng
// ============================================================

function StopsScreen() {
  const [query, setQuery] = useState("");
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<BusStop | null>(null);

  const filtered = busStops.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase()) ||
      s.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trạm dừng"
        description="Quản lý thông tin các trạm dừng xe bus"
        icon={<MapPinned className="size-5" />}
        actions={
          <ExpressiveButton variant="filled" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Thêm trạm
          </ExpressiveButton>
        }
      />

      <ExpressiveCard variant="filled" className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, mã hoặc địa chỉ..."
            className="rounded-xl pl-10"
          />
        </div>
      </ExpressiveCard>

      <ExpressiveCard variant="filled" className="p-0">
        <div className="-mx-4 overflow-x-auto overflow-y-auto scrollbar-soft max-h-[520px] sm:mx-0">
          <Table className="min-w-[640px]">
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
              <TableRow className="hover:bg-transparent border-outline-variant">
                <TableHead>Trạm</TableHead>
                <TableHead className="hidden md:table-cell">Địa chỉ</TableHead>
                <TableHead className="text-center">Tuyến đi qua</TableHead>
                <TableHead className="hidden sm:table-cell text-center">Mái che</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="border-outline-variant cursor-pointer hover:bg-surface-container"
                  onClick={() => setSelectedStop(s)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                        <MapPin className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-on-surface-variant font-mono">{s.code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-on-surface-variant max-w-xs">
                    <span className="truncate">{s.address}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {s.routes.slice(0, 3).map((rid) => {
                        const r = routeById(rid);
                        return r ? (
                          <RouteCodeBadge key={rid} code={r.code} color={r.color} />
                        ) : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    {s.hasShelter ? (
                      <CheckCircle2 className="size-4 text-success inline" />
                    ) : (
                      <X className="size-4 text-on-surface-variant inline" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <ExpressiveButton variant="text" size="icon-sm" onClick={(e: any) => e.stopPropagation()}>
                          <MoreVertical className="size-4" />
                        </ExpressiveButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedStop(s)}>
                          <Info className="size-4" /> Chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Mở form chỉnh sửa")}>
                          <Pencil className="size-4" /> Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-error"
                          onClick={() => setDeleting(s)}
                        >
                          <Trash2 className="size-4" /> Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<Search className="size-5" />}
              title="Không tìm thấy trạm"
              description="Thử từ khóa khác"
            />
          )}
        </div>
      </ExpressiveCard>

      {/* Detail Sheet */}
      <Sheet open={!!selectedStop} onOpenChange={(o) => !o && setSelectedStop(null)}>
        <SheetContent className="rounded-l-2xl">
          {selectedStop && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">{selectedStop.name}</SheetTitle>
                <SheetDescription className="font-mono">{selectedStop.code}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                {/* Mini map */}
                <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-aurora-m3">
                  <div className="absolute inset-0 grid-texture opacity-40" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative flex">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-50" />
                      <span className="relative inline-flex size-4 rounded-full bg-primary ring-4 ring-surface" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 rounded-lg bg-surface-container/85 px-2 py-1 text-[10px] backdrop-blur">
                    {selectedStop.lat.toFixed(4)}, {selectedStop.lng.toFixed(4)}
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-low p-3">
                  <p className="text-xs text-on-surface-variant">Địa chỉ</p>
                  <p className="mt-1 text-sm">{selectedStop.address}</p>
                </div>

                <div>
                  <p className="text-xs text-on-surface-variant mb-2">Tuyến đi qua</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStop.routes.map((rid) => {
                      const r = routeById(rid);
                      return r ? (
                        <Chip variant="suggestion" className="cursor-default">
                          <RouteCodeBadge code={r.code} color={r.color} />
                          {r.name}
                        </Chip>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedStop.hasShelter ? (
                    <StatusPill label="Có mái che" tone="success" />
                  ) : (
                    <StatusPill label="Không mái che" tone="warning" />
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add dialog */}
      {adding && <StopAddDialog onClose={() => setAdding(false)} />}

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa trạm dừng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Trạm{" "}
              <span className="font-semibold">{deleting?.name}</span> sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <ExpressiveButton variant="text" size="sm">Hủy</ExpressiveButton>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <ExpressiveButton
                variant="error"
                size="sm"
                onClick={() => {
                  toast.success("Đã xóa trạm");
                  setDeleting(null);
                }}
              >
                <Trash2 className="size-4" /> Xóa trạm
              </ExpressiveButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StopAddDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Thêm trạm dừng</DialogTitle>
          <DialogDescription>Nhập thông tin trạm mới</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tên trạm</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Cổng ĐH Duy Tân" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Mã trạm</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="DTU-Main" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Địa chỉ</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, đường, phường..." className="rounded-xl min-h-[80px]" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <ExpressiveButton variant="text" size="sm">Hủy</ExpressiveButton>
          </DialogClose>
          <ExpressiveButton
            variant="filled"
            size="sm"
            onClick={() => {
              if (!name || !code) {
                toast.error("Vui lòng nhập tên và mã trạm");
                return;
              }
              toast.success("Đã thêm trạm dừng mới");
              onClose();
            }}
          >
            <Plus className="size-4" /> Thêm trạm
          </ExpressiveButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 8. By University — Điều phối theo trường (NEW)
// ============================================================

function ByUniversityScreen() {
  const [universityId, setUniversityId] = useState<string>(universities[0].id);
  const [campusId, setCampusId] = useState<string>("all");

  const uni = universityById(universityId);
  const stats = universityStats.find((s) => s.universityId === universityId);

  // Routes serving this university
  const uniRoutes = useMemo(() => {
    const routeIds = routeUniversities
      .filter((ru) => ru.universityId === universityId && ru.status === "active")
      .map((ru) => ru.routeId);
    return routes.filter((r) => routeIds.includes(r.id));
  }, [universityId]);

  // Trips today for these routes
  const uniTrips = useMemo(
    () => trips.filter((t) => uniRoutes.some((r) => r.id === t.routeId)),
    [uniRoutes]
  );

  // Drivers serving these routes (from schedules)
  const uniDrivers = useMemo(() => {
    const driverIds = new Set<string>();
    schedules
      .filter((s) => uniRoutes.some((r) => r.id === s.routeId))
      .forEach((s) => driverIds.add(s.driverId));
    return allDrivers.filter((d) => driverIds.has(d.id));
  }, [uniRoutes]);

  // Campus options
  const campuses = uni?.campuses ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điều phối theo trường"
        description="Lọc hoạt động điều phối theo trường đại học và cơ sở"
        icon={<GraduationCap className="size-5" />}
      />

      {/* Filter bar */}
      <ExpressiveCard variant="filled" className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <School className="size-3.5" /> Trường đại học
            </Label>
            <Select value={universityId} onValueChange={(v) => { setUniversityId(v); setCampusId("all"); }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {universities.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.shortName} — {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Building2 className="size-3.5" /> Cơ sở
            </Label>
            <Select value={campusId} onValueChange={setCampusId} disabled={campuses.length === 0}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả cơ sở</SelectItem>
                {campuses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ExpressiveCard>

      {/* University hero card — bold dark perk-style */}
      {uni && (
        <ExpressiveCard variant="elevated" className="overflow-hidden p-0">
          <div
            className="relative p-4 sm:p-6 bg-[#14140f]"
            style={{ borderTop: `4px solid ${uni.color}` }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-white text-xl font-bold elev-2"
                  style={{ backgroundColor: uni.color }}
                >
                  {uni.logo}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-bold text-[#beff50]">{uni.name}</h2>
                  <p className="truncate text-sm text-white/70">{uni.address}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusPill
                      label={uni.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
                      tone={uni.status === "active" ? "success" : "warning"}
                    />
                    {uni.subsidyActive && (
                      <StatusPill label="Có trợ giá" tone="primary" />
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#beff50] text-[#14140f] px-3 py-1 text-xs font-semibold">
                      <Hash className="size-3" /> {uni.code}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
                <div className="text-center rounded-xl bg-[#beff50] px-4 py-3 min-w-0">
                  <p className="text-xs text-[#14140f]/70">Sinh viên</p>
                  <p className="mt-1 text-xl font-bold text-[#14140f] tabular-nums">{uni.studentCount.toLocaleString("vi-VN")}</p>
                </div>
                <div className="text-center rounded-xl bg-[#ff8c5f] px-4 py-3 min-w-0">
                  <p className="text-xs text-[#14140f]/70">Tuyến</p>
                  <p className="mt-1 text-xl font-bold text-[#14140f] tabular-nums">{uniRoutes.length}</p>
                </div>
                <div className="text-center rounded-xl bg-[#144fcc] px-4 py-3 min-w-0">
                  <p className="text-xs text-white/70">Cơ sở</p>
                  <p className="mt-1 text-xl font-bold text-white tabular-nums">{uni.campuses.length}</p>
                </div>
              </div>
            </div>
          </div>
        </ExpressiveCard>
      )}

      {/* Stat cards */}
      <StaggerGroup className="grid gap-4 sm:grid-cols-3">
        <StaggerItem>
          <StatCard
            label="Sinh viên trường"
            value={<Counter to={stats?.activeStudents ?? 0} />}
            icon={<Users className="size-5" />}
            hint={`Trong ${uni?.studentCount ?? 0} sinh viên đã đăng ký`}
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Chuyến hôm nay (trường)"
            value={<Counter to={uniTrips.length} />}
            icon={<Activity className="size-5" />}
            hint={`${stats?.tripsThisMonth ?? 0} chuyến trong tháng`}
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tài xế phục vụ trường"
            value={<Counter to={uniDrivers.length} />}
            icon={<UserCheck className="size-5" />}
            hint="Trực tiếp các tuyến của trường"
            accent="secondary"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* University summary cards — 3 cards */}
      <div>
        <h2 className="text-lg font-semibold text-on-surface mb-3">Tổng quan các trường</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((u) => {
            const isSel = u.id === universityId;
            const uStats = universityStats.find((s) => s.universityId === u.id);
            const uRoutes = routeUniversities.filter((ru) => ru.universityId === u.id);
            return (
              <button
                key={u.id}
                onClick={() => { setUniversityId(u.id); setCampusId("all"); }}
                className={cn(
                  "state-layer text-left rounded-2xl p-4 border-2 transition-all min-w-0",
                  isSel
                    ? "bg-[#beff50] border-[#beff50] text-[#14140f]"
                    : "bg-surface-container-low border-transparent hover:border-outline-variant"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex size-10 items-center justify-center rounded-xl text-white text-sm font-bold"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{u.shortName}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{u.code}</p>
                  </div>
                  {u.subsidyActive && (
                    <Wallet className="size-4 text-[#144fcc]" />
                  )}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Sinh viên</span>
                    <span className="font-medium">{uStats?.activeStudents ?? u.studentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Tuyến phục vụ</span>
                    <span className="font-medium">{uRoutes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Chuyến/tháng</span>
                    <span className="font-medium">{uStats?.tripsThisMonth ?? 0}</span>
                  </div>
                  {uStats && uStats.totalSubsidy > 0 && (
                    <div className="flex justify-between pt-1 border-t border-outline-variant mt-1.5">
                      <span className="text-on-surface-variant">Trợ giá</span>
                      <span className="font-semibold text-[#144fcc]">{formatVND(uStats.totalSubsidy)}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trips table */}
        <ScrollReveal y={24}>
          <ExpressiveCard variant="filled" className="p-0">
            <div className="flex items-center justify-between gap-2 border-b border-outline-variant px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                  <Activity className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">Chuyến hôm nay</h3>
                  <p className="text-xs text-on-surface-variant">{uniTrips.length} chuyến · {uni?.shortName}</p>
                </div>
              </div>
            </div>
            <div className="-mx-4 overflow-x-auto overflow-y-auto scrollbar-soft max-h-[400px] sm:mx-0">
              {uniTrips.length === 0 ? (
                <EmptyState
                  icon={<Bus className="size-5" />}
                  title="Không có chuyến"
                  description="Chưa có chuyến nào cho trường này hôm nay"
                />
              ) : (
                <Table className="min-w-[480px]">
                  <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
                    <TableRow className="hover:bg-transparent border-outline-variant">
                      <TableHead>Tuyến</TableHead>
                      <TableHead>Giờ</TableHead>
                      <TableHead className="text-right">HK</TableHead>
                      <TableHead className="text-right">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniTrips.map((t) => {
                      const r = routeById(t.routeId);
                      return (
                        <TableRow key={t.id} className="border-outline-variant">
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-2">
                              {r && <RouteCodeBadge code={r.code} color={r.color} />}
                              <span className="min-w-0 truncate text-xs text-on-surface-variant hidden sm:inline">{r?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">{t.departTime}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{t.passengerCount}</TableCell>
                          <TableCell className="text-right">
                            <StatusPill
                              label={
                                t.status === "completed" ? "Hoàn tất"
                                : t.status === "running" ? "Đang chạy"
                                : t.status === "scheduled" ? "Đã lên lịch"
                                : "Đã hủy"
                              }
                              tone={
                                t.status === "completed" ? "success"
                                : t.status === "running" ? "primary"
                                : t.status === "scheduled" ? "tertiary"
                                : "error"
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Drivers table */}
        <ScrollReveal y={24} delay={0.05}>
          <ExpressiveCard variant="filled" className="p-0">
            <div className="flex items-center justify-between gap-2 border-b border-outline-variant px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-tertiary-container text-on-tertiary-container">
                  <UserCheck className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">Tài xế phục vụ</h3>
                  <p className="text-xs text-on-surface-variant">{uniDrivers.length} tài xế · {uni?.shortName}</p>
                </div>
              </div>
            </div>
            <div className="-mx-4 overflow-x-auto overflow-y-auto scrollbar-soft max-h-[400px] sm:mx-0">
              {uniDrivers.length === 0 ? (
                <EmptyState
                  icon={<Users className="size-5" />}
                  title="Chưa có tài xế"
                  description="Chưa phân công tài xế cho tuyến của trường"
                />
              ) : (
                <Table className="min-w-[480px]">
                  <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
                    <TableRow className="hover:bg-transparent border-outline-variant">
                      <TableHead>Tài xế</TableHead>
                      <TableHead className="hidden sm:table-cell">Biển số</TableHead>
                      <TableHead className="text-right">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniDrivers.map((d) => (
                      <TableRow key={d.id} className="border-outline-variant">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                              {d.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{d.name}</p>
                              <p className="text-[11px] text-on-surface-variant truncate">{d.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm tabular-nums">{d.plate}</TableCell>
                        <TableCell className="text-right">
                          <DriverStatusBadge status={d.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>

      {/* Routes serving the university */}
      <div>
        <h2 className="text-lg font-semibold text-on-surface mb-3">Tuyến phục vụ trường</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {uniRoutes.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={<RouteIcon className="size-5" />}
                title="Chưa có tuyến nào"
                description={`Chưa phân công tuyến nào cho ${uni?.shortName}`}
              />
            </div>
          ) : (
            uniRoutes.map((r) => {
              const ru = routeUniversities.find((x) => x.routeId === r.id && x.universityId === universityId);
              const campus = uni?.campuses.find((c) => c.id === ru?.campusId);
              return (
                <ExpressiveCard key={r.id} variant="outlined" className="p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <RouteCodeBadge code={r.code} color={r.color} />
                    {campus && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container text-on-secondary-container px-2 py-0.5 text-[10px]">
                        <Building2 className="size-3" /> {campus.code}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="mt-1 text-xs text-on-surface-variant truncate">
                    {r.from} → {r.to}
                  </p>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-on-surface-variant">Tần suất</p>
                      <p className="font-medium">{r.frequencyMin} phút</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Cự ly</p>
                      <p className="font-medium">{r.distanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Giá vé</p>
                      <p className="font-medium">{formatVND(r.fare)}</p>
                    </div>
                  </div>
                </ExpressiveCard>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 9. Feedback — Phản hồi
// ============================================================

function FeedbackScreen() {
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [items, setItems] = useState(feedbackList);

  const filtered = items.filter((f) => filter === "all" || f.status === filter);
  const newCount = items.filter((f) => f.status === "new").length;
  const avgRating = (items.reduce((sum, f) => sum + f.rating, 0) / items.length).toFixed(1);
  const resolvedCount = items.filter((f) => f.status === "resolved").length;

  const updateStatus = (id: string, status: Feedback["status"]) => {
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phản hồi"
        description="Quản lý và xử lý phản hồi của hành khách"
        icon={<MessageSquare className="size-5" />}
      />

      <StaggerGroup className="grid gap-4 sm:grid-cols-3">
        <StaggerItem>
          <StatCard
            label="Phản hồi mới"
            value={<Counter to={newCount} />}
            icon={<Sparkles className="size-5" />}
            hint="Cần xử lý sớm"
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Đánh giá trung bình"
            value={<Counter to={parseFloat(avgRating)} format={(n) => n.toFixed(1)} />}
            icon={<Star className="size-5" />}
            hint="Trên thang 5"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Đã giải quyết"
            value={<Counter to={resolvedCount} />}
            icon={<CheckCircle2 className="size-5" />}
            hint={`Trên ${items.length} phản hồi`}
            accent="success"
          />
        </StaggerItem>
      </StaggerGroup>

      <div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="rounded-full">
            <TabsTrigger value="all" className="rounded-full">Tất cả</TabsTrigger>
            <TabsTrigger value="new" className="rounded-full">Mới</TabsTrigger>
            <TabsTrigger value="processing" className="rounded-full">Đang xử lý</TabsTrigger>
            <TabsTrigger value="resolved" className="rounded-full">Đã giải quyết</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ExpressiveCard variant="filled" className="p-0">
        <div className="-mx-4 overflow-x-auto overflow-y-auto scrollbar-soft max-h-[520px] sm:mx-0">
          <Table className="min-w-[640px]">
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
              <TableRow className="hover:bg-transparent border-outline-variant">
                <TableHead>Hành khách</TableHead>
                <TableHead className="hidden md:table-cell">Tuyến</TableHead>
                <TableHead className="hidden lg:table-cell">Danh mục</TableHead>
                <TableHead>Đánh giá</TableHead>
                <TableHead className="text-right">Trạng thái</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow
                  key={f.id}
                  className="border-outline-variant cursor-pointer hover:bg-surface-container"
                  onClick={() => setSelected(f)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                        {f.studentName.split(" ").slice(-2).map((w) => w[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.studentName}</p>
                        <p className="text-[11px] text-on-surface-variant">{f.createdAt}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <RouteCodeBadge code={f.routeCode} color={routes.find((r) => r.code === f.routeCode)?.color} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-on-surface-variant">
                    {f.category === "service" ? "Dịch vụ"
                      : f.category === "driver" ? "Tài xế"
                      : f.category === "vehicle" ? "Phương tiện"
                      : f.category === "punctuality" ? "Đúng giờ"
                      : "Khác"}
                  </TableCell>
                  <TableCell>
                    <Stars rating={f.rating} />
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusPill
                      label={
                        f.status === "new" ? "Mới"
                        : f.status === "processing" ? "Đang xử lý"
                        : "Đã giải quyết"
                      }
                      tone={
                        f.status === "new" ? "tertiary"
                        : f.status === "processing" ? "primary"
                        : "success"
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <ExpressiveButton
                      variant="text"
                      size="icon-sm"
                      onClick={(e: any) => { e.stopPropagation(); setSelected(f); }}
                    >
                      <ArrowRight className="size-4" />
                    </ExpressiveButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<MessageSquare className="size-5" />}
              title="Không có phản hồi"
              description="Không có phản hồi phù hợp với bộ lọc"
            />
          )}
        </div>
      </ExpressiveCard>

      {selected && (
        <FeedbackDetailDialog
          key={selected.id}
          feedback={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
}

function FeedbackDetailDialog({
  feedback,
  onClose,
  onStatusChange,
}: {
  feedback: Feedback;
  onClose: () => void;
  onStatusChange: (id: string, status: Feedback["status"]) => void;
}) {
  const [notes, setNotes] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-xl">
        <DialogHeader>
          <DialogTitle>Chi tiết phản hồi</DialogTitle>
          <DialogDescription>{feedback.createdAt} · Tuyến {feedback.routeCode}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-soft pr-1">
          <div className="rounded-xl bg-surface-container-low p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                  {feedback.studentName.split(" ").slice(-2).map((w) => w[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium">{feedback.studentName}</p>
                  {feedback.driverName && (
                    <p className="text-[11px] text-on-surface-variant">Tài xế: {feedback.driverName}</p>
                  )}
                </div>
              </div>
              <Stars rating={feedback.rating} size="size-4" />
            </div>
            <p className="text-sm text-on-surface line-clamp-4">{feedback.content}</p>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú xử lý</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú xử lý..."
              className="rounded-xl min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {feedback.status !== "processing" && (
              <ExpressiveButton
                variant="tonal"
                size="sm"
                onClick={() => {
                  onStatusChange(feedback.id, "processing");
                  toast.success("Đã chuyển sang đang xử lý");
                }}
              >
                <Zap className="size-4" /> Đang xử lý
              </ExpressiveButton>
            )}
            {feedback.status !== "resolved" && (
              <ExpressiveButton
                variant="filled"
                size="sm"
                onClick={() => {
                  onStatusChange(feedback.id, "resolved");
                  toast.success("Đã đánh dấu đã giải quyết");
                }}
              >
                <CheckCircle2 className="size-4" /> Đã giải quyết
              </ExpressiveButton>
            )}
            {feedback.status === "resolved" && (
              <ExpressiveButton
                variant="outlined"
                size="sm"
                onClick={() => {
                  onStatusChange(feedback.id, "processing");
                  toast.info("Đã mở lại phản hồi");
                }}
              >
                Mở lại
              </ExpressiveButton>
            )}
          </div>
          <DialogClose asChild>
            <ExpressiveButton variant="text" size="sm" className="w-full">Đóng</ExpressiveButton>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 10. Notify — Gửi thông báo
// ============================================================

function NotifyScreen() {
  const [audience, setAudience] = useState("all");
  const [universityTarget, setUniversityTarget] = useState("uni1");
  const [campusTarget, setCampusTarget] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"info" | "warning" | "important">("info");
  const [scheduleNow, setScheduleNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");

  const audienceLabel =
    audience === "all" ? "Tất cả người dùng"
    : audience === "students" ? "Sinh viên"
    : audience === "drivers" ? "Tài xế & phụ xe"
    : audience === "by-university" ? `Trường: ${universityById(universityTarget)?.shortName ?? "—"}`
    : audience === "by-campus" ? `Cơ sở: ${universityById(universityTarget)?.shortName ?? "—"} / ${campusTarget === "all" ? "Tất cả" : campusTarget}`
    : "Nhân viên";

  const recentSent = [
    { id: "n1", title: "Tạm dừng tuyến DN-04 chiều nay", audience: "Sinh viên DN-04", priority: "warning", sentAt: "10 phút trước", recipients: 124 },
    { id: "n2", title: "Đón sinh viên Đại học Duy Tân tại cơ sở Nguyễn Văn Linh", audience: "Duy Tân", priority: "info", sentAt: "2 giờ trước", recipients: 412 },
    { id: "n3", title: "Họp điều phối ca tối", audience: "Tài xế & phụ xe", priority: "important", sentAt: "Hôm qua", recipients: 8 },
    { id: "n4", title: "Khuyến mãi vé tháng 7", audience: "Tất cả sinh viên", priority: "info", sentAt: "2 ngày trước", recipients: 2680 },
  ];

  const priorityTone = (p: string): "primary" | "warning" | "error" =>
    p === "info" ? "primary" : p === "warning" ? "warning" : "error";
  const priorityLabel = (p: string) =>
    p === "info" ? "Thông tin" : p === "warning" ? "Cảnh báo" : "Quan trọng";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gửi thông báo"
        description="Soạn và gửi thông báo đến người dùng hệ thống"
        icon={<Megaphone className="size-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Compose form */}
        <div className="lg:col-span-3 space-y-4">
          <ExpressiveCard variant="filled" className="p-5 space-y-4">
            <div className="space-y-2">
              <Label>Đối tượng nhận</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả người dùng</SelectItem>
                  <SelectItem value="students">Sinh viên</SelectItem>
                  <SelectItem value="drivers">Tài xế & phụ xe</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="by-university">Theo trường</SelectItem>
                  <SelectItem value="by-campus">Theo cơ sở</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(audience === "by-university" || audience === "by-campus") && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Trường</Label>
                  <Select value={universityTarget} onValueChange={(v) => { setUniversityTarget(v); setCampusTarget("all"); }}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.shortName} — {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {audience === "by-campus" && (
                  <div className="space-y-2">
                    <Label>Cơ sở</Label>
                    <Select value={campusTarget} onValueChange={setCampusTarget}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả cơ sở</SelectItem>
                        {universityById(universityTarget)?.campuses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code} — {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Tạm dừng tuyến DN-04 chiều nay"
                className="rounded-xl"
                maxLength={80}
              />
              <p className="text-[11px] text-on-surface-variant text-right">{title.length}/80</p>
            </div>

            <div className="space-y-2">
              <Label>Nội dung</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập nội dung thông báo..."
                className="rounded-xl min-h-[120px]"
                maxLength={500}
              />
              <p className="text-[11px] text-on-surface-variant text-right">{message.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label>Mức ưu tiên</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["info", "warning", "important"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "state-layer h-11 rounded-xl text-sm font-medium transition-colors",
                      priority === p
                        ? p === "info"
                          ? "bg-primary-container text-on-primary-container"
                          : p === "warning"
                          ? "bg-warning-container text-on-surface"
                          : "bg-error-container text-on-error-container"
                        : "bg-surface-container-low text-on-surface-variant"
                    )}
                  >
                    {priorityLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thời gian gửi</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setScheduleNow(true)}
                  className={cn(
                    "state-layer h-11 rounded-xl text-sm font-medium transition-colors",
                    scheduleNow
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-surface-container-low text-on-surface-variant"
                  )}
                >
                  Gửi ngay
                </button>
                <button
                  onClick={() => setScheduleNow(false)}
                  className={cn(
                    "state-layer h-11 rounded-xl text-sm font-medium transition-colors",
                    !scheduleNow
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-surface-container-low text-on-surface-variant"
                  )}
                >
                  Hẹn giờ
                </button>
              </div>
              {!scheduleNow && (
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="rounded-xl"
                />
              )}
            </div>

            <ExpressiveButton
              variant="filled"
              size="lg"
              className="w-full"
              onClick={() => {
                if (!title || !message) {
                  toast.error("Vui lòng nhập tiêu đề và nội dung");
                  return;
                }
                toast.success(
                  scheduleNow
                    ? "Đã gửi thông báo đến " + audienceLabel
                    : `Đã lên lịch gửi cho ${scheduledAt || "thời gian đã chọn"}`
                );
                setTitle("");
                setMessage("");
              }}
            >
              <Send className="size-4" />
              {scheduleNow ? "Gửi thông báo" : "Lên lịch gửi"}
            </ExpressiveButton>
          </ExpressiveCard>
        </div>

        {/* Live preview + recent sent */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-2">Xem trước</h3>
            <ExpressiveCard variant="elevated" className="p-4">
              <div className="mx-auto max-w-[280px] rounded-3xl border-2 border-outline-variant bg-surface-container-lowest p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">
                    UniBus · Thông báo
                  </span>
                  <span className="text-[10px] text-on-surface-variant">bây giờ</span>
                </div>
                <div
                  className={cn(
                    "rounded-xl p-3",
                    priority === "info"
                      ? "bg-primary-container"
                      : priority === "warning"
                      ? "bg-warning-container"
                      : "bg-error-container"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Megaphone
                      className={cn(
                        "size-4 shrink-0 mt-0.5",
                        priority === "info"
                          ? "text-on-primary-container"
                          : priority === "warning"
                          ? "text-on-surface"
                          : "text-on-error-container"
                      )}
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          priority === "info"
                            ? "text-on-primary-container"
                            : priority === "warning"
                            ? "text-on-surface"
                            : "text-on-error-container"
                        )}
                      >
                        {title || "Tiêu đề thông báo"}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs line-clamp-3",
                          priority === "info"
                            ? "text-on-primary-container/80"
                            : priority === "warning"
                            ? "text-on-surface-variant"
                            : "text-on-error-container/80"
                        )}
                      >
                        {message || "Nội dung thông báo sẽ hiển thị tại đây..."}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-on-surface-variant">
                  Gửi đến: {audienceLabel}
                </p>
              </div>
            </ExpressiveCard>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-2">Đã gửi gần đây</h3>
            <ExpressiveCard variant="filled" className="p-0">
              <div className="max-h-80 overflow-y-auto scrollbar-soft divide-y divide-outline-variant">
                {recentSent.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-surface-container">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-medium line-clamp-1">{n.title}</p>
                      <StatusPill label={priorityLabel(n.priority)} tone={priorityTone(n.priority)} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-on-surface-variant">
                      <span>{n.audience}</span>
                      <span>·</span>
                      <span>{n.sentAt}</span>
                      <span>·</span>
                      <span>{n.recipients} người nhận</span>
                    </div>
                  </div>
                ))}
              </div>
            </ExpressiveCard>
          </div>
        </div>
      </div>
    </div>
  );
}
