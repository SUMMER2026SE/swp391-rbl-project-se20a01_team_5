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
  MapPinned,
  Navigation,
  Calendar,
  CalendarClock,
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
  ArrowLeft,
  Bell,
  Loader2,
  Search,
  X
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
import { UnavailablePanel } from "../real-data";

import {
  useCoordinatorPrototypeData,
  useApi,
  mapFeedback,
  formatVND,
  formatDateTime,
  formatDate,
} from "@/lib/prototype-data";
import {
  operationsApi,
  coordinatorRoutesApi,
  experienceApi,
  feedbackApi,
  coordinatorFeedbackApi,
  notificationApi,
  messagingApi,
  type ScheduleDashboard,
  type RouteListItem,
  type RouteStopDto,
  type LiveFleetVehicle,
  type ExperienceFeedbackCard,
  type ExperienceDashboardStat,
  type CoordinatorUniversityMetric,
  type CoordinatorUniversityRouteMetric,
  type ContactThreadCard,
  type InternalMessageCard,
} from "@/lib/api/client";

type CoordinatorModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function CoordinatorModule({ activeId, onNavigate }: CoordinatorModuleProps) {
  const proto = useCoordinatorPrototypeData();
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const renderScreen = () => {
    switch (activeId) {
      case "crd-dashboard":
        return <DashboardScreen ctx={ctx} onNavigate={onNavigate} />;
      case "crd-live":
      case "crd-live-map":
        return <LiveMapScreen ctx={ctx} />;
      case "crd-schedule":
        return <ScheduleScreen ctx={ctx} />;
      case "crd-assign-driver":
      case "crd-assign-bus":
      case "crd-assign":
        return <AssignmentScreen ctx={ctx} />;
      case "crd-routes":
        return <RoutesScreen ctx={ctx} />;
      case "crd-stops":
        return <StopsScreen ctx={ctx} />;
      case "crd-by-university":
        return <ByUniversityScreen onNavigate={onNavigate} />;
      case "crd-feedback":
        return <FeedbackScreen ctx={ctx} />;
      case "crd-notify":
        return <NotifyScreen ctx={ctx} />;
      default:
        return <FallbackScreen activeId={activeId} />;
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      {renderScreen()}

      {/* Floating Chat Button */}
      <FloatingChatButton onClick={() => setChatOpen(!chatOpen)} open={chatOpen} unreadCount={unreadCount} />

      {/* Slide-out Chat Panel Drawer */}
      <InternalChatPanel 
        open={chatOpen} 
        onOpenChange={setChatOpen} 
        onUnreadCountChange={setUnreadCount} 
      />
    </div>
  );
}

function AssignmentScreen({ ctx }: { ctx: Ctx }) {
  const [activeTab, setActiveTab] = useState<"staff" | "bus">("staff");
  return (
    <div className="space-y-6 min-w-0">
      <div className="flex border-b border-outline-variant/30 min-w-0">
        <button
          onClick={() => setActiveTab("staff")}
          className={cn(
            "px-4 py-2.5 text-sm font-bold border-b-2 transition-colors",
            activeTab === "staff"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Phân công nhân sự
        </button>
        <button
          onClick={() => setActiveTab("bus")}
          className={cn(
            "px-4 py-2.5 text-sm font-bold border-b-2 transition-colors",
            activeTab === "bus"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Phân công xe bus
        </button>
      </div>
      {activeTab === "staff" ? (
        <AssignStaffScreen ctx={ctx} />
      ) : (
        <AssignBusScreen ctx={ctx} />
      )}
    </div>
  );
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

  const features = [
    {
      id: "crd-live",
      title: "Theo dõi xe chạy (Live)",
      description: "Giám sát thời gian thực vị trí xe, lượng hành khách và trạng thái hoạt động trên bản đồ.",
      icon: Navigation,
      color: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      buttonText: "Bản đồ vận hành",
    },
    {
      id: "crd-schedule",
      title: "Lịch trình xe chạy",
      description: "Xem và quản lý thời gian xuất bến, giãn cách giữa các chuyến và theo dõi tiến độ lịch trình.",
      icon: CalendarClock,
      color: "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 hover:bg-blue-500/10 text-blue-700 dark:text-blue-400",
      buttonText: "Xem lịch biểu",
    },
    {
      id: "crd-assign",
      title: "Phân công xe & tài xế",
      description: "Điều phối nhân sự, gán tài xế, phụ xe và gán xe chạy cụ thể vào từng khung giờ trong ngày.",
      icon: UserCog,
      color: "border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 hover:bg-violet-500/10 text-violet-700 dark:text-violet-400",
      buttonText: "Thực hiện phân công",
    },
    {
      id: "crd-routes",
      title: "Quản lý tuyến đường",
      description: "Thiết lập hành trình các tuyến bus, điểm đầu điểm cuối và thời gian chạy dự kiến giữa các điểm.",
      icon: RouteIcon,
      color: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400",
      buttonText: "Danh sách tuyến",
    },
    {
      id: "crd-stops",
      title: "Hệ thống trạm dừng",
      description: "Quản lý vị trí các trạm đón trả khách trên bản đồ, nhà chờ và kết nối trạm vào các tuyến đường.",
      icon: MapPinned,
      color: "border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
      buttonText: "Quản lý trạm",
    },
    {
      id: "crd-by-university",
      title: "Điều phối theo trường",
      description: "Điều phối xe bus chuyên dụng phục vụ các đối tác trường đại học và lịch trình của từng campus.",
      icon: School,
      color: "border-pink-500/20 bg-pink-500/5 hover:border-pink-500/40 hover:bg-pink-500/10 text-pink-700 dark:text-pink-400",
      buttonText: "Theo campus",
    },
    {
      id: "crd-feedback",
      title: "Ý kiến phản hồi",
      description: "Tiếp nhận đóng góp, đánh giá sao từ sinh viên, tài xế và phụ xe để kịp thời điều chỉnh.",
      icon: MessageSquare,
      color: "border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40 hover:bg-orange-500/10 text-orange-700 dark:text-orange-400",
      buttonText: "Hộp thư góp ý",
    },
    {
      id: "crd-notify",
      title: "Gửi thông báo rộng rãi",
      description: "Gửi thông báo khẩn cấp hoặc tin tức điều chỉnh lịch trình đến toàn bộ hệ thống người dùng.",
      icon: Megaphone,
      color: "border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400",
      buttonText: "Tạo thông báo mới",
    },
  ];

  // Framer motion variants for staggered loading
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 120, 
        damping: 18 
      } 
    }
  };

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
  const fleet = useApi(() => operationsApi.liveFleet(), undefined, []);
  const vehicles = (fleet.raw || ctx.raw.dashboard.raw?.liveFleet || []) as LiveFleetVehicle[];

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Bản đồ trực tiếp"
        description="Vị trí xe theo thời gian thực."
        icon={<Navigation className="size-7" />}
        actions={
          <ExpressiveButton variant="outlined" size="sm" onClick={fleet.reload}>
            <RefreshCw className={cn("size-4", fleet.loading && "animate-spin")} />
            Làm mới
          </ExpressiveButton>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 min-w-0">
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="overflow-hidden h-[500px] min-w-0">
            <LiveFleetMap vehicles={vehicles} />
          </ExpressiveCard>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <ExpressiveCard variant="filled" className="p-5 h-full min-w-0">
            <h3 className="text-base font-bold mb-3">{vehicles.length} xe đang chạy</h3>
            <div className="space-y-2 overflow-y-auto max-h-[440px]">
              {vehicles.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center mt-8">
                  Không có xe đang chạy lúc này.
                </p>
              ) : (
                vehicles.map((v: any) => (
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
          <DateField value={date} onChange={setDate} />
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
// Screen 4: Assign staff
// =============================================================================
function AssignStaffScreen({ ctx }: { ctx: Ctx }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dashboard, setDashboard] = useState<ScheduleDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [drivers, setDrivers] = useState<Record<string, number | undefined>>({});
  const [conductors, setConductors] = useState<Record<string, number | undefined>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await operationsApi.scheduleDashboard(date);
      setDashboard(d);
      const initDrivers: Record<string, number | undefined> = {};
      const initConductors: Record<string, number | undefined> = {};
      d.shifts.forEach((s) => {
        if (s.scheduleId) {
          initDrivers[s.scheduleId] = s.driverStaffId;
          initConductors[s.scheduleId] = s.conductorStaffId;
        }
      });
      setDrivers(initDrivers);
      setConductors(initConductors);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được lịch");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const save = async (scheduleId: number) => {
    const driverId = drivers[scheduleId];
    const conductorId = conductors[scheduleId];
    if (!driverId) {
      toast.error("Vui lòng chọn tài xế");
      return;
    }
    if (!conductorId) {
      toast.error("Vui lòng chọn phụ xe");
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
          conductorStaffId: conductorId,
          busId: shift?.busId,
          departureTime: shift?.departureTime || shift?.time,
        }],
      });
      toast.success("Đã phân công nhân sự");
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
        title="Phân công nhân sự"
        description="Gán tài xế và phụ xe cho từng chuyến."
        icon={<UserCog className="size-7" />}
        actions={<DateField value={date} onChange={setDate} />}
      />
      {loading ? (
        <LoadingScreen />
      ) : !dashboard ? (
        <EmptyState icon={<UserCog className="size-7" />} title="Không tải được dữ liệu phân công" />
      ) : dashboard.shifts.length === 0 ? (
        <NewShiftCard mode="staff" dashboard={dashboard} date={date} onCreated={load} />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          <StaggerItem>
            <NewShiftCard mode="staff" dashboard={dashboard} date={date} onCreated={load} compact />
          </StaggerItem>
          {dashboard.shifts.map((s, i) => {
            const sid = s.scheduleId;
            const locked = ["RUNNING", "COMPLETED"].includes(String(s.status || "").toUpperCase());
            return (
              <StaggerItem key={i}>
                <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{s.routeName || `Tuyến ${s.routeId}`}</p>
                      <p className="text-xs text-on-surface-variant">{s.departureTime || s.time || "—"}</p>
                    </div>
                    {locked ? (
                      <M3StatusPill label="Đang chạy/đã xong" tone="neutral" />
                    ) : s.driverName && s.conductorName ? (
                      <M3StatusPill label="Đã gán" tone="success" />
                    ) : (
                      <M3StatusPill label="Thiếu nhân sự" tone="warning" />
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="min-w-0">
                      <Label className="text-xs font-bold">Tài xế</Label>
                      <Select
                        value={sid && drivers[sid] ? String(drivers[sid]) : ""}
                        onValueChange={(v) => sid && setDrivers((a) => ({ ...a, [sid]: Number(v) }))}
                        disabled={locked}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn tài xế" /></SelectTrigger>
                        <SelectContent>
                          {dashboard.drivers.map((drv) => (
                            <SelectItem key={drv.staffId} value={String(drv.staffId)}>{drv.fullName} ({drv.status})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs font-bold">Phụ xe</Label>
                      <Select
                        value={sid && conductors[sid] ? String(conductors[sid]) : ""}
                        onValueChange={(v) => sid && setConductors((a) => ({ ...a, [sid]: Number(v) }))}
                        disabled={locked}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn phụ xe" /></SelectTrigger>
                        <SelectContent>
                          {dashboard.conductors.map((c) => (
                            <SelectItem key={c.staffId} value={String(c.staffId)}>{c.fullName} ({c.status})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-3">
                    {sid && (
                      <ExpressiveButton
                        variant="filled"
                        size="sm"
                        onClick={() => save(sid)}
                        disabled={saving[sid] || locked}
                      >
                        {saving[sid] ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Lưu nhân sự
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
        actions={<DateField value={date} onChange={setDate} />}
      />
      {loading ? (
        <LoadingScreen />
      ) : !dashboard ? (
        <EmptyState icon={<BusIcon className="size-7" />} title="Không tải được dữ liệu phân công" />
      ) : dashboard.shifts.length === 0 ? (
        <NewShiftCard mode="bus" dashboard={dashboard} date={date} onCreated={load} />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          <StaggerItem>
            <NewShiftCard mode="bus" dashboard={dashboard} date={date} onCreated={load} compact />
          </StaggerItem>
          {dashboard.shifts.map((s, i) => {
            const sid = s.scheduleId;
            const locked = ["RUNNING", "COMPLETED"].includes(String(s.status || "").toUpperCase());
            return (
              <StaggerItem key={i}>
                <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{s.routeName || `Tuyến ${s.routeId}`}</p>
                      <p className="text-xs text-on-surface-variant">{s.departureTime || s.time || "—"}</p>
                    </div>
                    {locked ? (
                      <M3StatusPill label="Đang chạy/đã xong" tone="neutral" />
                    ) : s.licensePlate ? (
                      <M3StatusPill label="Đã gán" tone="success" />
                    ) : (
                      <M3StatusPill label="Thiếu xe" tone="warning" />
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-bold">Xe</Label>
                        <Select
                          value={sid && assignments[sid] ? String(assignments[sid]) : ""}
                          onValueChange={(v) => sid && setAssignments((a) => ({ ...a, [sid]: Number(v) }))}
                          disabled={locked}
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
                        disabled={saving[sid] || locked}
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

const HOURS_12 = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const MINUTES_60 = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function parseTime12(value: string) {
  const [rawHour = "07", minute = "00"] = (value || "07:00").split(":");
  const hour24 = Math.max(0, Math.min(23, Number(rawHour) || 7));
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(Math.max(0, Math.min(59, Number(minute) || 0))).padStart(2, "0"),
    period,
  };
}

function formatTime24(hour: string, minute: string, period: string) {
  const hour12 = Math.max(1, Math.min(12, Number(hour) || 7));
  const normalizedMinute = String(Math.max(0, Math.min(59, Number(minute) || 0))).padStart(2, "0");
  const hour24 = period === "PM" ? (hour12 % 12) + 12 : hour12 % 12;
  return `${String(hour24).padStart(2, "0")}:${normalizedMinute}`;
}

function NewShiftCard({
  mode,
  dashboard,
  date,
  onCreated,
  compact = false,
}: {
  mode: "staff" | "bus";
  dashboard: ScheduleDashboard;
  date: string;
  onCreated: () => void;
  compact?: boolean;
}) {
  const [routeId, setRouteId] = useState("");
  const [departureTime, setDepartureTime] = useState("07:00");
  const [driverStaffId, setDriverStaffId] = useState("");
  const [conductorStaffId, setConductorStaffId] = useState("");
  const [busId, setBusId] = useState("");
  const [saving, setSaving] = useState(false);
  const timeParts = parseTime12(departureTime);

  const setTimePart = (part: "hour" | "minute" | "period", value: string) => {
    setDepartureTime(formatTime24(
      part === "hour" ? value : timeParts.hour,
      part === "minute" ? value : timeParts.minute,
      part === "period" ? value : timeParts.period
    ));
  };

  const save = async () => {
    if (!routeId || !departureTime) {
      toast.error("Vui lòng chọn tuyến và giờ chạy");
      return;
    }
    if (mode === "staff" && (!driverStaffId || !conductorStaffId)) {
      toast.error("Vui lòng chọn tài xế và phụ xe");
      return;
    }
    if (mode === "bus" && !busId) {
      toast.error("Vui lòng chọn xe");
      return;
    }
    setSaving(true);
    try {
      await operationsApi.saveSchedules({
        serviceDate: date,
        shifts: [{
          routeId: Number(routeId),
          departureTime,
          driverStaffId: driverStaffId ? Number(driverStaffId) : undefined,
          conductorStaffId: conductorStaffId ? Number(conductorStaffId) : undefined,
          busId: busId ? Number(busId) : undefined,
        }],
      });
      toast.success("Đã tạo ca phân công");
      setRouteId("");
      setDepartureTime("07:00");
      setDriverStaffId("");
      setConductorStaffId("");
      setBusId("");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể tạo ca phân công");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ExpressiveCard variant="elevated" className="p-5 min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">{compact ? "Thêm ca phân công" : "Chưa có chuyến để phân công"}</p>
          <p className="text-xs text-on-surface-variant">Tạo ca chạy mới cho ngày {formatDate(date)}.</p>
        </div>
        <M3StatusPill label="Mới" tone="warning" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="min-w-0">
          <Label className="text-xs font-bold">Tuyến</Label>
          <Select value={routeId} onValueChange={setRouteId}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn tuyến" /></SelectTrigger>
            <SelectContent>
              {dashboard.routes.map((route) => (
                <SelectItem key={route.routeId} value={String(route.routeId)}>{route.routeName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <Label className="text-xs font-bold">Giờ chạy</Label>
          <div className="mt-1.5 grid grid-cols-[1fr_1fr_88px] gap-2">
            <Select value={timeParts.hour} onValueChange={(value) => setTimePart("hour", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOURS_12.map((hour) => (
                  <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeParts.minute} onValueChange={(value) => setTimePart("minute", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MINUTES_60.map((minute) => (
                  <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeParts.period} onValueChange={(value) => setTimePart("period", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">SA</SelectItem>
                <SelectItem value="PM">CH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {mode === "staff" ? (
          <>
            <div className="min-w-0">
              <Label className="text-xs font-bold">Tài xế</Label>
              <Select value={driverStaffId} onValueChange={setDriverStaffId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn tài xế" /></SelectTrigger>
                <SelectContent>
                  {dashboard.drivers.map((driver) => (
                    <SelectItem key={driver.staffId} value={String(driver.staffId)}>{driver.fullName} ({driver.status})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0">
              <Label className="text-xs font-bold">Phụ xe</Label>
              <Select value={conductorStaffId} onValueChange={setConductorStaffId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn phụ xe" /></SelectTrigger>
                <SelectContent>
                  {dashboard.conductors.map((conductor) => (
                    <SelectItem key={conductor.staffId} value={String(conductor.staffId)}>{conductor.fullName} ({conductor.status})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <div className="min-w-0 md:col-span-2">
            <Label className="text-xs font-bold">Xe</Label>
            <Select value={busId} onValueChange={setBusId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn xe" /></SelectTrigger>
              <SelectContent>
                {dashboard.buses.map((bus) => (
                  <SelectItem key={bus.busId} value={String(bus.busId)}>{bus.licensePlate} ({bus.seatCount || "?"} chỗ)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="mt-4">
        <ExpressiveButton variant="filled" size="sm" onClick={save} disabled={saving}>
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Tạo ca phân công
        </ExpressiveButton>
      </div>
    </ExpressiveCard>
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
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadRoutes = useCallback(async () => {
    setLoadingRoutes(true);
    setRouteError(null);
    try {
      const r = await coordinatorRoutesApi.getRoutes();
      setRoutes(r);
    } catch (e) {
      setRoutes([]);
      setRouteError(e instanceof Error ? e.message : "Không thể tải danh sách tuyến");
    } finally {
      setLoadingRoutes(false);
    }
  }, []);

  useEffect(() => { loadRoutes(); }, [loadRoutes]);

  useEffect(() => {
    if (!selectedRouteId && routes.length > 0) setSelectedRouteId(routes[0].id);
  }, [routes, selectedRouteId]);

  const load = useCallback(async () => {
    if (!selectedRouteId) {
      setStops([]);
      return;
    }
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
          <div className="flex items-center gap-2">
            <Select
              value={selectedRouteId ? String(selectedRouteId) : ""}
              onValueChange={(v) => setSelectedRouteId(Number(v))}
              disabled={loadingRoutes || routes.length === 0}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder={loadingRoutes ? "Đang tải tuyến..." : "Chọn tuyến"} />
              </SelectTrigger>
              <SelectContent>
                {routes.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.routeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {routeError && (
              <ExpressiveButton variant="tonal" size="sm" onClick={loadRoutes}>
                <RefreshCw className="size-4" /> Tải lại
              </ExpressiveButton>
            )}
          </div>
        }
      />
      {routes.length === 0 && !loadingRoutes ? (
        <EmptyState
          icon={<RouteIcon className="size-7" />}
          title="Chưa có tuyến"
          description="Cần tạo tuyến trước khi thêm trạm dừng."
          action={<ExpressiveButton variant="filled" onClick={() => toast.info("Vào mục Quản lý tuyến đường để tạo tuyến trước")}>Tạo tuyến ở mục tuyến đường</ExpressiveButton>}
        />
      ) : loading ? (
        <LoadingScreen />
      ) : !stops || stops.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-7" />}
          title="Chưa có trạm"
          description="Tuyến này chưa có trạm nào."
          action={<ExpressiveButton variant="filled" disabled={!selectedRouteId} onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm trạm</ExpressiveButton>}
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
function ByUniversityScreen({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);
  const metrics = useApi<CoordinatorUniversityMetric[]>(
    () => experienceApi.coordinatorByUniversity(),
    undefined,
    []
  );
  const routeMetrics = useApi<CoordinatorUniversityRouteMetric[]>(
    () => selectedUniversityId ? experienceApi.coordinatorUniversityRoutes(selectedUniversityId) : Promise.resolve([]),
    undefined,
    [selectedUniversityId]
  );

  useEffect(() => {
    if (!selectedUniversityId && metrics.raw?.length) {
      setSelectedUniversityId(metrics.raw[0].universityId);
    }
  }, [metrics.raw, selectedUniversityId]);

  const selectedUniversity = metrics.raw?.find((u) => u.universityId === selectedUniversityId) || metrics.raw?.[0] || null;
  const routes = routeMetrics.raw || [];
  const totalRegistered = routes.reduce((sum, r) => sum + r.registeredStudents, 0);
  const totalPasses = routes.reduce((sum, r) => sum + r.activeMonthlyPasses, 0);
  const totalRunning = routes.reduce((sum, r) => sum + r.runningTrips, 0);

  const routeStatus = (route: CoordinatorUniversityRouteMetric) => {
    const demand = Math.max(route.activeMonthlyPasses, route.registeredStudents);
    if (demand > 0 && route.tripsToday === 0) return { label: "Thiếu chuyến", tone: "error" as const };
    if (route.tripsToday > 0 && route.runningTrips === 0) return { label: "Chưa chạy", tone: "warning" as const };
    if (demand > route.tripsToday * 40) return { label: "Có nguy cơ quá tải", tone: "warning" as const };
    return { label: "Ổn định", tone: "success" as const };
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Điều phối theo trường"
        description="Theo dõi nhu cầu sinh viên và năng lực vận hành theo từng trường."
        icon={<School className="size-7" />}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedUniversityId ? String(selectedUniversityId) : ""}
              onValueChange={(value) => setSelectedUniversityId(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Chọn trường" /></SelectTrigger>
              <SelectContent>
                {(metrics.raw || []).map((u) => (
                  <SelectItem key={u.universityId} value={String(u.universityId)}>
                    {u.shortName || u.universityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExpressiveButton variant="outlined" size="sm" onClick={() => { metrics.reload(); routeMetrics.reload(); }}>
              <RefreshCw className={cn("size-4", (metrics.loading || routeMetrics.loading) && "animate-spin")} />
              Làm mới
            </ExpressiveButton>
          </div>
        }
      />
      {metrics.error ? (
        <ErrorScreen message={metrics.error} onRetry={metrics.reload} />
      ) : metrics.loading ? (
        <LoadingScreen label="Đang tải thống kê theo trường..." />
      ) : !metrics.raw?.length ? (
        <EmptyState icon={<School className="size-7" />} title="Chưa có trường liên kết" />
      ) : (
        <div className="space-y-4 min-w-0">
          {selectedUniversity && (
            <ExpressiveCard variant="elevated" className="p-5 min-w-0">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: selectedUniversity.colorHex || "#144fcc", color: "#fff" }}
                  >
                    <School className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface truncate">{selectedUniversity.universityName}</p>
                    <p className="text-sm text-on-surface-variant">{selectedUniversity.shortName || "Trường đối tác"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
                  {[
                    { label: "Tuyến", value: routes.length || selectedUniversity.routeCount, icon: RouteIcon },
                    { label: "Vé tháng", value: totalPasses, icon: Badge },
                    { label: "Đăng ký", value: totalRegistered, icon: Users },
                    { label: "Đang chạy", value: totalRunning, icon: Navigation },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-xl bg-surface-container-high px-3 py-2 min-w-0">
                      <metric.icon className="size-4 text-on-surface-variant" />
                      <p className="mt-1 text-lg font-bold tabular-nums text-on-surface">
                        {metric.value.toLocaleString("vi-VN")}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ExpressiveCard>
          )}

          {routeMetrics.loading ? (
            <LoadingScreen label="Đang tải tuyến theo trường..." />
          ) : routeMetrics.error ? (
            <ErrorScreen message={routeMetrics.error} onRetry={routeMetrics.reload} />
          ) : routes.length === 0 ? (
            <EmptyState icon={<RouteIcon className="size-7" />} title="Trường này chưa có tuyến liên kết" />
          ) : (
            <div className="space-y-3">
              {routes.map((route) => {
                const status = routeStatus(route);
                return (
                  <ExpressiveCard key={route.routeId} variant="elevated" className="p-4 min-w-0">
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_1.5fr_auto] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-3 rounded-full shrink-0"
                            style={{ backgroundColor: route.colorHex || "#144fcc" }}
                          />
                          <p className="font-bold text-on-surface truncate">{route.routeName}</p>
                        </div>
                        <p className="mt-1 text-xs text-on-surface-variant">{route.routeCode || `Tuyến #${route.routeId}`}</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        <MetricMini label="Đăng ký" value={route.registeredStudents} />
                        <MetricMini label="Vé tháng" value={route.activeMonthlyPasses} />
                        <MetricMini label="Chuyến" value={route.tripsToday} />
                        <MetricMini label="Xe" value={route.assignedBuses} />
                        <MetricMini label="Nhân sự" value={`${route.assignedDrivers}/${route.assignedConductors}`} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                        <M3StatusPill label={status.label} tone={status.tone} />
                        <ExpressiveButton variant="outlined" size="sm" onClick={() => onNavigate("crd-schedule")}>
                          <Calendar className="size-4" />
                          Lịch
                        </ExpressiveButton>
                        <ExpressiveButton variant="tonal" size="sm" onClick={() => onNavigate("crd-assign")}>
                          <UserCog className="size-4" />
                          Phân công
                        </ExpressiveButton>
                        <ExpressiveButton variant="text" size="sm" onClick={() => onNavigate("crd-notify")}>
                          <Megaphone className="size-4" />
                          Thông báo
                        </ExpressiveButton>
                      </div>
                    </div>
                  </ExpressiveCard>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}

function MetricMini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-surface-container-high px-3 py-2 min-w-0">
      <p className="font-bold tabular-nums text-on-surface truncate">{typeof value === "number" ? value.toLocaleString("vi-VN") : value}</p>
      <p className="text-[11px] text-on-surface-variant">{label}</p>
    </div>
  );
}

// =============================================================================
// Screen 9: Feedback queue (resolve)
// =============================================================================
function FeedbackScreen({ ctx }: { ctx: Ctx }) {
  const [filter, setFilter] = useState<"all" | "sos" | "new" | "processing" | "resolved">("all");
  const [responding, setResponding] = useState<number | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const feedbackResource = useApi(() => coordinatorFeedbackApi.all(), (items) => items.map(mapFeedback), []);
  const feedbackItems = feedbackResource.data || ctx.feedback;

  const filtered = feedbackItems.filter((f: any) => {
    const isSos = String(f.content || "").toUpperCase().startsWith("[SOS") || String(f.studentName || "").includes("SOS");
    if (filter === "sos") return isSos;
    if (filter === "all") return true;
    return f.status === filter;
  }).sort((a: any, b: any) => {
    const aTime = new Date(a.createdAt || 0).getTime() || 0;
    const bTime = new Date(b.createdAt || 0).getTime() || 0;
    return bTime - aTime;
  });

  const resolve = async (item: any) => {
    const id = Number(item.id);
    const isSos = String(item.content || "").toUpperCase().startsWith("[SOS") || String(item.studentName || "").includes("SOS");
    const response = responses[item.id]?.trim() || (isSos ? "Đã tiếp nhận và xử lý thông báo SOS." : "Đã tiếp nhận và xử lý phản hồi.");
    setResponding(id);
    try {
      await coordinatorFeedbackApi.resolve(id, response);
      toast.success("Đã xử lý phản hồi");
      setResponses((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setSelectedFeedback(null);
      ctx.reload();
      feedbackResource.reload();
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
          <div className="flex gap-2">
            <ExpressiveButton variant="outlined" size="sm" onClick={feedbackResource.reload}>
              <RefreshCw className={cn("size-4", feedbackResource.loading && "animate-spin")} />
              Làm mới
            </ExpressiveButton>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="sos">SOS</SelectItem>
                <SelectItem value="new">Mới</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="resolved">Đã xử lý</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      {feedbackResource.loading && !feedbackResource.data ? (
        <LoadingScreen label="Đang tải phản hồi..." />
      ) : feedbackResource.error ? (
        <ErrorScreen message={feedbackResource.error} onRetry={feedbackResource.reload} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Star className="size-7" />} title="Không có phản hồi" />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {filtered.map((f: any) => {
            const isSos = String(f.content || "").toUpperCase().startsWith("[SOS") || String(f.studentName || "").includes("SOS");
            const isResolved = f.status === "resolved";
            return (
              <StaggerItem key={f.id}>
                <ExpressiveCard
                  variant="elevated"
                  className={cn("p-5 min-w-0", isSos && "border-error/40 bg-error-container/10")}
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start min-w-0">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                        {isSos && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-error text-on-error px-2.5 py-1 text-xs font-bold">
                            <AlertTriangle className="size-3.5" />
                            SOS
                          </span>
                        )}
                        <M3StatusPill
                          label={isResolved ? "Đã xử lý" : "Chờ xử lý"}
                          tone={isResolved ? "success" : isSos ? "error" : "warning"}
                        />
                        <span className="text-xs text-on-surface-variant">{formatDate(f.createdAt)}</span>
                      </div>
                      <p className="font-bold text-on-surface truncate">
                        {isSos ? "Thông báo SOS" : f.studentName}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {f.routeName || f.routeCode || "Chưa rõ tuyến"}{f.tripId ? ` · Chuyến #${f.tripId}` : ""}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("size-3", i < (f.rating || 0) ? "fill-amber-400 text-amber-400" : "text-outline")} />
                        ))}
                        <span className="text-xs text-on-surface-variant ml-2">{isSos ? "Khẩn cấp" : f.category}</span>
                      </div>
                      <p className="mt-3 text-sm text-on-surface whitespace-pre-wrap break-words">{f.content}</p>
                      {f.response && (
                        <div className="mt-3 p-2 rounded-lg bg-success-container/30 text-xs">
                          <p className="font-bold text-success">Phản hồi xử lý:</p>
                          <p>{f.response}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex md:flex-col gap-2 md:items-end">
                      {!isResolved ? (
                        <ExpressiveButton
                          variant="filled"
                          size="sm"
                          onClick={() => {
                            setSelectedFeedback(f);
                            setResponses((prev) => ({
                              ...prev,
                              [f.id]: prev[f.id] || (isSos ? "Đã tiếp nhận và xử lý thông báo SOS." : "Đã tiếp nhận và xử lý phản hồi."),
                            }));
                          }}
                          disabled={responding === Number(f.id)}
                        >
                          {responding === Number(f.id) ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                          Xử lý
                        </ExpressiveButton>
                      ) : (
                        <ExpressiveButton variant="tonal" size="sm" disabled>
                          <CheckCircle2 className="size-4" />
                          Đã xử lý
                        </ExpressiveButton>
                      )}
                    </div>
                  </div>
              </ExpressiveCard>
            </StaggerItem>
          );})}
        </StaggerGroup>
      )}

      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        {selectedFeedback && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ghi chú xử lý</DialogTitle>
              <DialogDescription>
                {selectedFeedback.studentName || "Phản hồi"}{selectedFeedback.tripId ? ` · Chuyến #${selectedFeedback.tripId}` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface">
                {selectedFeedback.content}
              </div>
              <div>
                <Label className="text-xs font-bold">Nội dung xử lý</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder="Nhập ghi chú xử lý..."
                  value={responses[selectedFeedback.id] || ""}
                  onChange={(e) => setResponses((prev) => ({ ...prev, [selectedFeedback.id]: e.target.value }))}
                  rows={4}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <ExpressiveButton
                variant="text"
                onClick={() => setSelectedFeedback(null)}
                disabled={responding === Number(selectedFeedback.id)}
              >
                Hủy
              </ExpressiveButton>
              <ExpressiveButton
                variant="filled"
                onClick={() => resolve(selectedFeedback)}
                disabled={responding === Number(selectedFeedback.id)}
              >
                {responding === Number(selectedFeedback.id) ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Lưu xử lý
              </ExpressiveButton>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
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
  const notifications = useApi(() => notificationApi.mine(), undefined, []);

  const send = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    setSending(true);
    try {
      await notificationApi.createCoordinator({ title: title.trim(), content: content.trim(), target });
      toast.success("Đã gửi thông báo");
      setTitle("");
      setContent("");
      notifications.reload();
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
        description="Soạn thảo và gửi thông báo nhanh tới học sinh, tài xế, phụ xe hoặc toàn hệ thống."
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
          <Section title={`Gần đây (${(notifications.raw || ctx.notifications).length})`}>
            {(notifications.raw || ctx.notifications).length === 0 ? (
              <EmptyState icon={<Megaphone className="size-7" />} title="Chưa gửi thông báo" />
            ) : (
              <div className="space-y-2">
                {(notifications.raw || ctx.notifications).slice(0, 5).map((n: any, index: number) => (
                  <ExpressiveCard key={n.notificationId ?? n.id ?? `${n.title}-${n.createdAt ?? index}`} variant="filled" className="p-3 min-w-0">
                    <p className="font-bold text-sm truncate">{n.title}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{n.content ?? n.body}</p>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block w-full sm:w-[180px]">
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-full border-outline-variant/70 bg-surface-container-lowest pl-4 pr-11 text-sm font-semibold text-on-surface shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/25 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-7 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
      />
      <Calendar className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-on-surface" />
    </label>
  );
}

function Unavailable({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} description="Tính năng đang được nâng cấp và tối ưu hóa hệ thống dữ liệu." icon={<UserCog className="size-7" />} />
      <UnavailablePanel
        title="Tính năng đang được phát triển"
        description="Chúng tôi đang kết nối dữ liệu vận hành thực tế cho chức năng này. Vui lòng quay lại sau."
      />
    </div>
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

// =========================================================================
// Internal Chat UI Components & Format Helpers
// =========================================================================

function FloatingChatButton({ onClick, open, unreadCount }: { onClick: () => void; open: boolean; unreadCount: number }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#14140f] text-[#beff50] shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
      aria-label={open ? "Đóng chat nội bộ" : "Mở chat nội bộ"}
    >
      {open ? <X className="size-6" /> : <MessageSquare className="size-6" />}
      {!open && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white ring-2 ring-white animate-bounce">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

interface InternalChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadCountChange: (count: number) => void;
}

function InternalChatPanel({ open, onOpenChange, onUnreadCountChange }: InternalChatPanelProps) {
  const [threads, setThreads] = useState<ContactThreadCard[]>([]);
  const [activeThread, setActiveThread] = useState<ContactThreadCard | null>(null);
  const [messages, setMessages] = useState<InternalMessageCard[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [isNewChatMode, setIsNewChatMode] = useState(false);
  const [staffList, setStaffList] = useState<{ userId: number; fullName: string; role: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fetchingThreadsRef = useRef(false);
  const fetchingMessagesRef = useRef(false);
  const fetchedStaffRef = useRef(false);

  const chatMessages = useMemo(() => {
    return messages.filter((msg) => !(msg.body || "").startsWith("[SOS]"));
  }, [messages]);

  // Poll active threads & count unread messages
  useEffect(() => {
    const fetchThreads = async () => {
      if (fetchingThreadsRef.current) return;
      fetchingThreadsRef.current = true;
      try {
        const data = await messagingApi.getThreads();
        setThreads(data);
        const driverConductorUnread = data
          .filter((t) => ["DRIVER", "CONDUCTOR"].includes(t.peerRole?.toUpperCase()))
          .reduce((sum, t) => sum + t.unreadCount, 0);
        onUnreadCountChange(driverConductorUnread);
      } catch (error) {
        console.error("Failed to fetch message threads:", error);
      } finally {
        fetchingThreadsRef.current = false;
      }
    };

    if (open) {
      if (threads.length === 0) setLoadingThreads(true);
      fetchThreads().finally(() => {
        setLoadingThreads(false);
      });
      
      const interval = setInterval(() => {
        if (!document.hidden) void fetchThreads();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [open, onUnreadCountChange, threads.length]);

  // Poll conversation messages when a thread is active
  useEffect(() => {
    if (!open || !activeThread) {
      setTimeout(() => setMessages([]), 0);
      return;
    }

    const fetchConversation = async () => {
      if (fetchingMessagesRef.current) return;
      fetchingMessagesRef.current = true;
      try {
        const data = await messagingApi.getConversation(activeThread.peerUserId);
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch conversation:", error);
      } finally {
        fetchingMessagesRef.current = false;
      }
    };

    // Mark as read immediately
    messagingApi.markAsRead(activeThread.peerUserId).catch(() => {});

    if (messages.length === 0) setLoadingMessages(true);
    fetchConversation().finally(() => {
      setLoadingMessages(false);
    });

    const interval = setInterval(() => {
      if (!document.hidden) void fetchConversation();
    }, 3000);
    return () => clearInterval(interval);
  }, [open, activeThread, messages.length]);

  // Fetch driver/conductor list for starting new chats
  useEffect(() => {
    if (!open || !isNewChatMode || fetchedStaffRef.current) return;

    const fetchStaff = async () => {
      try {
        const data = await operationsApi.scheduleDashboard();
        const list: { userId: number; fullName: string; role: string }[] = [];
        (data.drivers || []).forEach((d: any) => {
          if (d.userId) list.push({ userId: d.userId, fullName: d.fullName, role: "DRIVER" });
        });
        (data.conductors || []).forEach((c: any) => {
          if (c.userId) list.push({ userId: c.userId, fullName: c.fullName, role: "CONDUCTOR" });
        });
        setStaffList(list);
        fetchedStaffRef.current = true;
      } catch (error) {
        console.error("Failed to fetch staff list:", error);
      }
    };

    fetchStaff();
  }, [open, isNewChatMode]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeThread || sending) return;

    const text = messageText.trim();
    setMessageText("");
    setSending(true);
    try {
      await messagingApi.sendMessage({
        recipientUserId: activeThread.peerUserId,
        body: text,
      });
      // immediately reload conversation
      const updatedMsgs = await messagingApi.getConversation(activeThread.peerUserId);
      setMessages(updatedMsgs);
      // reload threads to update last message
      const updatedThreads = await messagingApi.getThreads();
      setThreads(updatedThreads);
    } catch (error) {
      toast.error("Không thể gửi tin nhắn");
      setMessageText(text); // restore text
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = (staff: { userId: number; fullName: string; role: string }) => {
    // Check if thread already exists
    const existing = threads.find((t) => t.peerUserId === staff.userId);
    if (existing) {
      setActiveThread(existing);
    } else {
      // Create a temporary thread object
      const tempThread: ContactThreadCard = {
        peerUserId: staff.userId,
        peerName: staff.fullName,
        peerRole: staff.role,
        lastMessageBody: "",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      };
      setActiveThread(tempThread);
    }
    setIsNewChatMode(false);
    setSearchQuery("");
  };

  // Filter threads by role (Driver & Conductor only) and search query
  const filteredThreads = threads
    .filter((t) => ["DRIVER", "CONDUCTOR"].includes(t.peerRole?.toUpperCase()))
    .filter((t) => t.peerName.toLowerCase().includes(searchQuery.toLowerCase()));

  // Filter staff list by search query (only showing staff that don't already have an active thread)
  const filteredStaff = staffList
    .filter((s) => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((s) => !threads.some((t) => t.peerUserId === s.userId));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-0 right-0 w-full h-full sm:bottom-6 sm:right-[92px] sm:w-[380px] sm:h-[580px] sm:rounded-3xl border border-outline-variant/40 p-0 z-40 flex flex-col bg-surface-container-lowest shadow-2xl overflow-hidden focus:outline-none"
        >
          {/* Header section */}
          <div className="border-b border-outline-variant/30 p-4 bg-surface-container-low flex items-center justify-between">
            {activeThread ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveThread(null)}
                    className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                    aria-label="Quay lại"
                  >
                    <ArrowLeft className="size-5 text-on-surface" />
                  </button>
                  <div>
                    <h3 className="font-bold text-on-surface text-sm line-clamp-1">{activeThread.peerName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="size-2 rounded-full bg-green-500" />
                      <span className="text-[11px] font-medium text-on-surface-variant">
                        {activeThread.peerRole === "DRIVER" ? "Tài xế" : "Phụ xe"}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                  aria-label="Đóng"
                >
                  <X className="size-5 text-on-surface-variant" />
                </button>
              </div>
            ) : isNewChatMode ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setIsNewChatMode(false);
                      setSearchQuery("");
                    }}
                    className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                    aria-label="Quay lại"
                  >
                    <ArrowLeft className="size-5 text-on-surface" />
                  </button>
                  <h3 className="font-bold text-on-surface text-sm">Bắt đầu trò chuyện mới</h3>
                </div>
                <button 
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                  aria-label="Đóng"
                >
                  <X className="size-5 text-on-surface-variant" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-5 text-primary" />
                  <h3 className="font-bold text-on-surface text-sm">Chat nội bộ</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsNewChatMode(true);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-[#14140f] text-[#beff50] hover:scale-105 transition-all cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Chat mới
                  </button>
                  <button 
                    onClick={() => onOpenChange(false)}
                    className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                    aria-label="Đóng"
                  >
                    <X className="size-5 text-on-surface-variant" />
                  </button>
                </div>
              </div>
            )}
          </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-surface-container-lowest">
          {activeThread ? (
            /* Conversation messages */
            loadingMessages && chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/80 gap-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs">Đang tải tin nhắn...</span>
              </div>
            ) : (
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-soft"
              >
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant/70">
                    <MessageSquare className="size-10 text-on-surface-variant/40 mb-2" />
                    <p className="text-xs font-semibold">Chưa có tin nhắn</p>
                    <p className="text-[11px] mt-1">Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện.</p>
                  </div>
                ) : (
                  chatMessages.slice().reverse().map((msg) => {
                    const isMe = msg.senderUserId !== activeThread.peerUserId;
                    return (
                      <div 
                        key={msg.messageId} 
                        className={cn(
                          "flex flex-col max-w-[80%]", 
                          isMe ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        <div 
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm shadow-xs whitespace-pre-wrap break-words", 
                            isMe 
                              ? "bg-[#beff50] text-[#14140f] rounded-tr-none font-medium" 
                              : "bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/20"
                          )}
                        >
                          {msg.body}
                        </div>
                        <span className="text-[9px] text-on-surface-variant/70 mt-1 px-1">
                          {formatTime(msg.sentAt)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )
          ) : isNewChatMode ? (
            /* Staff List for New Chat */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-outline-variant/20 bg-surface-container-low">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 size-4 text-on-surface-variant/70" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm tài xế hoặc phụ xe..."
                    className="w-full h-10 rounded-full pl-9 pr-4 text-sm bg-white border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-soft">
                {filteredStaff.length === 0 ? (
                  <div className="py-8 text-center text-xs text-on-surface-variant/70 font-medium">
                    Không tìm thấy nhân viên phù hợp hoặc tất cả đã có trong lịch sử chat.
                  </div>
                ) : (
                  filteredStaff.map((staff) => (
                    <button
                      key={staff.userId}
                      onClick={() => startNewConversation(staff)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container-high text-left transition-colors duration-150 border border-transparent hover:border-outline-variant/30"
                    >
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0 border border-primary/20">
                        {staff.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface text-sm truncate">{staff.fullName}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {staff.role === "DRIVER" ? "Tài xế" : "Phụ xe"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Thread List View */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-outline-variant/20 bg-surface-container-low">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 size-4 text-on-surface-variant/70" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    className="w-full h-10 rounded-full pl-9 pr-4 text-sm bg-white border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface"
                  />
                </div>
              </div>
              
              {loadingThreads && threads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/80 gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <span className="text-xs">Đang tải cuộc trò chuyện...</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-soft">
                  {filteredThreads.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant/70">
                      <MessageSquare className="size-12 text-on-surface-variant/30 mb-2" />
                      <p className="text-xs font-semibold">Chưa có cuộc hội thoại nào</p>
                      <p className="text-[11px] mt-1">Bấm nút {"+ Chat mới"} phía trên để gửi tin nhắn đến tài xế hoặc phụ xe.</p>
                    </div>
                  ) : (
                    filteredThreads.map((thread) => (
                      <button
                        key={thread.peerUserId}
                        onClick={() => setActiveThread(thread)}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all duration-150 border",
                          thread.unreadCount > 0 
                            ? "bg-primary/5 border-primary/20 shadow-xs" 
                            : "border-transparent hover:bg-surface-container-high hover:border-outline-variant/30"
                        )}
                      >
                        <div className={cn(
                          "size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border relative",
                          thread.unreadCount > 0 
                            ? "bg-primary text-white border-primary" 
                            : "bg-surface-container-high text-on-surface border-outline-variant/40"
                        )}>
                          {thread.peerName.slice(0, 2).toUpperCase()}
                          {thread.unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 size-3 bg-red-600 rounded-full ring-2 ring-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className={cn("text-sm truncate", thread.unreadCount > 0 ? "font-extrabold text-on-surface" : "font-bold text-on-surface-variant")}>
                              {thread.peerName}
                            </h4>
                            <span className="text-[10px] text-on-surface-variant/70 shrink-0 ml-2">
                              {formatThreadTime(thread.lastMessageAt)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-1">
                            <p className={cn("text-xs truncate flex-1 pr-2", thread.unreadCount > 0 ? "font-semibold text-on-surface" : "text-on-surface-variant/80")}>
                              {thread.lastMessageBody && !thread.lastMessageBody.startsWith("[SOS]") 
                                ? thread.lastMessageBody 
                                : "Bắt đầu cuộc hội thoại..."}
                            </p>
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                              thread.peerRole === "DRIVER" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                            )}>
                              {thread.peerRole === "DRIVER" ? "Tài xế" : "Phụ xe"}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar (Only displayed in Conversation View) */}
        {activeThread && (
          <form 
            onSubmit={handleSendMessage}
            className="p-3 border-t border-outline-variant/30 bg-surface-container-low flex items-center gap-2"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={sending}
              className="flex-1 h-10 rounded-full px-4 text-sm bg-white border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder:text-on-surface-variant/60"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className={cn(
                "size-10 rounded-full flex items-center justify-center text-white transition-all shrink-0 cursor-pointer",
                messageText.trim() && !sending 
                  ? "bg-[#14140f] text-[#beff50] hover:scale-105" 
                  : "bg-surface-container-high text-on-surface-variant/40"
              )}
              aria-label="Gửi tin nhắn"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin text-[#beff50]" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </form>
        )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helpers
function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatThreadTime(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    if (isYesterday) {
      return "Hôm qua";
    }
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}
