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
  PackageSearch,
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
import { JourneyMap, type JourneyBus, type JourneyPolyline } from "@/components/m3/journey-map";
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
  apiFetch,
  adminApi,
  operationsApi,
  transportApi,
  coordinatorRoutesApi,
  experienceApi,
  feedbackApi,
  coordinatorFeedbackApi,
  coordinatorLostItemApi,
  notificationApi,
  messagingApi,
  type ScheduleDashboard,
  type RouteListItem,
  type RouteStopDto,
  type LiveFleetVehicle,
  type ExperienceFeedbackCard,
  type ExperienceLostItemCard,
  type ExperienceDashboardStat,
  type CoordinatorUniversityMetric,
  type CoordinatorUniversityRouteMetric,
  type ContactThreadCard,
  type InternalMessageCard,
  type RouteMapPreviewDTO,
  type JourneyTrackingSnapshotDTO,
} from "@/lib/api/client";
import type { BusStop } from "@/lib/types";

type CoordinatorModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function CoordinatorModule({ activeId, onNavigate }: CoordinatorModuleProps) {
  const proto = useCoordinatorPrototypeData();

  if (proto.error) return <ErrorScreen message={proto.error} onRetry={proto.reload} />;
  if (proto.loading || !proto.data) return <LoadingScreen label="Đang tải dữ liệu điều phối..." />;

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
      case "crd-notifications":
        return <FeedbackScreen ctx={ctx} initialTab="sos" />;
      default:
        return <FallbackScreen activeId={activeId} />;
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      <div className="min-w-0">
        {renderScreen()}
      </div>
      <CoordinatorChatOverlay />
    </div>
  );
}

export function CoordinatorChatOverlay() {
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <>
      <FloatingChatButton onClick={() => setChatOpen((open) => !open)} open={chatOpen} unreadCount={unreadCount} />
      <InternalChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
}

export function CoordinatorAlertsScreen() {
  const feedback = useApi(() => coordinatorFeedbackApi.all(), undefined, []);
  const lostItems = useApi(() => coordinatorLostItemApi.all(), undefined, []);
  const notifications = useApi(() => notificationApi.mine(), undefined, []);
  const feedbackItems = ((feedback.raw || []) as any[]);
  const sosItems = feedbackItems.filter(isSosFeedback);
  const feedbackOnly = feedbackItems.filter((item) => !isSosFeedback(item));
  const historicalAlerts = ((notifications.raw || []) as any[])
    .filter((item) => !isPrivateMessageNotification(item))
    .map((item) => ({
      ...item,
      _type: isSosFeedback(item) ? "sos" as const : isLostItemNotification(item) ? "lost" as const : "feedback" as const,
    }))
    .filter((item) => item._type === "sos" || item._type === "lost" || isFeedbackNotification(item));
  const alertItems = [
    ...sosItems.map((item) => ({ ...item, _type: "sos" as const })),
    ...feedbackOnly.map((item) => ({ ...item, _type: "feedback" as const })),
    ...((lostItems.raw || []) as any[]).map((item) => ({ ...item, _type: "lost" as const })),
    ...historicalAlerts,
  ].sort((left, right) => Date.parse(right.createdAt || right.reportedAt || "") - Date.parse(left.createdAt || left.reportedAt || ""));

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Thông báo điều phối"
        description="Hiển thị SOS, phản hồi và mất đồ. Tin nhắn riêng nằm trong pop up chat."
        icon={<AlertTriangle className="size-7" />}
        actions={
          <ExpressiveButton variant="outlined" size="sm" onClick={() => { feedback.reload(); lostItems.reload(); notifications.reload(); }}>
            <RefreshCw className={cn("size-4", (feedback.loading || lostItems.loading || notifications.loading) && "animate-spin")} />
            Làm mới
          </ExpressiveButton>
        }
      />
      {feedback.loading || lostItems.loading || notifications.loading ? (
        <LoadingScreen label="Đang tải thông báo..." />
      ) : feedback.error || lostItems.error || notifications.error ? (
        <ErrorScreen message={feedback.error || lostItems.error || notifications.error || "Không tải được thông báo"} onRetry={() => { feedback.reload(); lostItems.reload(); notifications.reload(); }} />
      ) : alertItems.length === 0 ? (
        <EmptyState icon={<Bell className="size-7" />} title="Không có thông báo" description="Tin nhắn riêng được gom vào biểu tượng chat ở góc màn hình." />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {alertItems.map((item: any, index) => {
            const isSos = item._type === "sos";
            const isLost = item._type === "lost";
            const title = isSos ? "SOS" : isLost ? "Mất đồ" : "Phản hồi";
            const icon = isSos ? <AlertTriangle className="size-3.5" /> : isLost ? <PackageSearch className="size-3.5" /> : <MessageSquare className="size-3.5" />;
            const isResolved = ["RESOLVED", "FOUND", "NOT_FOUND", "CLOSED", "resolved"].includes(String(item.status || ""));
            return (
            <StaggerItem key={`${item._type}-${item.feedbackId || item.lostItemReportId || item.lostItemId || item.supportTicketId || item.id || index}`}>
              <ExpressiveCard variant="elevated" className={cn("p-5 min-w-0", isSos ? "border-error/40 bg-error-container/10" : "") }>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", isSos ? "bg-error text-on-error" : isLost ? "bg-tertiary-container text-on-tertiary-container" : "bg-primary-container text-on-primary-container")}>
                    {icon} {title}
                  </span>
                  <M3StatusPill label={isResolved ? "Đã xử lý" : isSos ? "Khẩn cấp" : "Cần xử lý"} tone={isResolved ? "success" : isSos ? "error" : "warning"} />
                  <span className="text-xs text-on-surface-variant">{formatDateTime(item.createdAt || item.reportedAt)}</span>
                </div>
                <p className="font-bold text-on-surface truncate">{item.studentName || item.reporterName || item.senderName || item.itemName || (isLost ? "Báo mất đồ" : "Sinh viên gửi phản hồi")}</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-on-surface">{item.content || item.description || item.notes || "Không có nội dung"}</p>
              </ExpressiveCard>
            </StaggerItem>
          );})}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

function AssignmentScreen({ ctx }: { ctx: Ctx }) {
  return <AssignStaffScreen ctx={ctx} />;
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

const COORDINATOR_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  RUNNING: "Đang chạy",
  NOT_STARTED: "Chưa khởi hành",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  READY: "Sẵn sàng",
  MAINTENANCE: "Bảo trì",
  SCHEDULED: "Đã lên lịch",
  OPEN: "Chưa phân công",
};

function coordinatorStatusLabel(status?: string | null) {
  const normalized = String(status || "").trim().toUpperCase();
  return COORDINATOR_STATUS_LABELS[normalized] || status || "Chưa xác định";
}

function cleanRouteDescription(description?: string | null) {
  return String(description || "")
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part && !/^(source|operationtime)\s*=/i.test(part))
    .join(" • ");
}

function hasDisplaySpeed(vehicle: LiveFleetVehicle) {
  return Number.isFinite(Number(vehicle.speedKmh)) && Number(vehicle.speedKmh) > 0;
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
  const runningFleet = ctx.fleet.filter((vehicle: any) => String(vehicle.status).toUpperCase() === "RUNNING");
  const runningBusCount = new Set(runningFleet.map((vehicle: any) => vehicle.busId).filter(Boolean)).size;
  const runningDriverCount = new Set(runningFleet.map((vehicle: any) => vehicle.driverName).filter(Boolean)).size;
  const todayShifts = useMemo(() => ctx.schedule?.shifts || [], [ctx.schedule?.shifts]);
  const assignedShifts = useMemo(() => todayShifts.filter((shift: any) => shift.busId && shift.driverStaffId && shift.conductorStaffId), [todayShifts]);

  // Trips per route — derive from today's schedule first, then live fleet.
  const tripsPerRoute = useMemo(() => {
    const counts: Record<string, { name: string; trips: number; color: string }> = {};
    const source = todayShifts.length ? todayShifts : ctx.fleet;
    source.forEach((v: any) => {
      const id = String(v.routeId || v.id || "");
      if (!id) return;
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
  }, [ctx.fleet, ctx.routes, todayShifts]);

  const quickActions = [
    { id: "crd-live-map", label: "Theo dõi tất cả xe", icon: Navigation, accent: "primary" as const },
    { id: "crd-schedule", label: "Lịch trình", icon: Calendar, accent: "tertiary" as const },
    { id: "crd-assign-driver", label: "Phân công chuyến", icon: UserCog, accent: "secondary" as const },
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
        <div className="flex justify-end min-w-0">
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
            {runningBusCount} xe đang vận hành
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
            value={<Counter to={runningBusCount || runningFleet.length} />}
            icon={<BusIcon className="size-5" />}
            hint="Đang hoạt động"
            trend="up"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Chuyến hôm nay"
            value={<Counter to={todayShifts.length} />}
            icon={<RouteIcon className="size-5" />}
            hint={`${assignedShifts.length} chuyến đủ phân công`}
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Chuyến đang chạy"
            value={<Counter to={runningFleet.length} />}
            icon={<Navigation className="size-5" />}
            hint="Theo trạng thái chuyến"
            accent="secondary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tài xế đang chạy"
            value={<Counter to={runningDriverCount} />}
            icon={<UserCog className="size-5" />}
            hint="Theo phân công hiện tại"
            accent="error"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Live fleet + Trips per route chart */}
      <div className="grid gap-4 lg:grid-cols-3 min-w-0">
        {/* Live bus status */}
        <ScrollReveal className="lg:col-span-2 min-w-0">
          <Section
            title="Theo dõi tất cả xe"
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
                        {hasDisplaySpeed(v) && <p className="text-xs font-bold text-primary">{Math.round(Number(v.speedKmh))} km/h</p>}
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
                  <p className="text-xs text-on-surface-variant">Theo lịch hôm nay</p>
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
  const [vehicleLocations, setVehicleLocations] = useState<Record<string, string>>({});
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const fleetReloadRef = useRef(fleet.reload);
  const liveVehicles = useMemo(() => (fleet.raw || ctx.raw.dashboard.raw?.liveFleet || []) as LiveFleetVehicle[], [ctx.raw.dashboard.raw?.liveFleet, fleet.raw]);
  const vehicles = useMemo(() => liveVehicles.filter(isRunningVehicle), [liveVehicles]);
  const displayedVehicles = selectedVehicleId
    ? vehicles.filter((vehicle) => String(vehicle.tripId) === selectedVehicleId)
    : vehicles;

  const toggleSelectedVehicle = useCallback((vehicleId: string) => {
    setSelectedVehicleId((current) => current === vehicleId ? null : vehicleId);
  }, []);

  useEffect(() => {
    fleetReloadRef.current = fleet.reload;
  }, [fleet.reload]);

  useEffect(() => {
    const interval = window.setInterval(() => fleetReloadRef.current(), 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedVehicleId && !vehicles.some((vehicle) => String(vehicle.tripId) === selectedVehicleId)) {
      setSelectedVehicleId(null);
    }
  }, [selectedVehicleId, vehicles]);

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Theo dõi tất cả xe"
        description=""
        icon={<Navigation className="size-7" />}
        actions={
          <ExpressiveButton variant="outlined" size="sm" onClick={fleet.reload}>
            <RefreshCw className={cn("size-4", fleet.loading && "animate-spin")} />
            Làm mới
          </ExpressiveButton>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] gap-4 min-w-0">
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="overflow-hidden h-[620px] xl:h-[680px] min-w-0">
            <LiveFleetMap
              vehicles={vehicles}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={toggleSelectedVehicle}
              onVehicleLocationsChange={setVehicleLocations}
            />
          </ExpressiveCard>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <ExpressiveCard variant="filled" className="p-5 h-full min-w-0">
            <h3 className="text-base font-bold mb-1">{selectedVehicleId ? 'Đang xem 1 xe' : vehicles.length + ' xe đang chạy'}</h3>
            {selectedVehicleId && <p className="mb-3 text-xs text-on-surface-variant">Bấm lại xe để hiện tất cả.</p>}
            <div className="space-y-2 overflow-y-auto max-h-[560px] xl:max-h-[620px]">
              {displayedVehicles.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center mt-8">
                  Không có xe đang chạy lúc này.
                </p>
              ) : (
                displayedVehicles.map((v: any, index) => (
                  <button
                    key={v.tripId}
                    type="button"
                    onClick={() => toggleSelectedVehicle(String(v.tripId))}
                    className={cn(
                      "w-full p-3 rounded-xl border border-transparent bg-surface-container-low text-left min-w-0 transition",
                      selectedVehicleId === String(v.tripId) && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1 min-w-0">
                      <p className="min-w-0 flex-1 font-bold text-sm truncate">{v.routeName}</p>
                      <M3StatusPill label="Đang chạy" tone="success" className="shrink-0 whitespace-nowrap" />
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {v.licensePlate || "—"} • {v.driverName || "—"}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-on-surface-variant">
                      <span className="flex min-w-0 flex-1 items-center gap-1"><MapPin className="size-3 shrink-0" /><span className="truncate">{vehicleLocations[String(v.tripId)] || vehicleLocationLabel(v, ctx.routes, ctx.stops, index)}</span></span>
                      {hasDisplaySpeed(v) && <span className="flex shrink-0 items-center gap-1 text-on-surface"><Gauge className="size-3" />{Math.round(Number(v.speedKmh))} km/h</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

function scheduleFleetFallback(schedule: ScheduleDashboard | null): LiveFleetVehicle[] {
  return (schedule?.shifts || [])
    .filter((shift) => String(shift.status || "").toUpperCase() === "RUNNING")
    .filter((shift) => shift.tripId && shift.routeId && shift.busId && shift.driverStaffId)
    .slice(0, 5)
    .map((shift) => ({
      tripId: Number(shift.tripId),
      routeId: Number(shift.routeId),
      routeName: shift.routeName || `Tuyến ${shift.routeId}`,
      busId: Number(shift.busId),
      licensePlate: shift.licensePlate,
      driverName: shift.driverName,
      conductorName: shift.conductorName,
      serviceDate: schedule?.serviceDate,
      departureTime: shift.departureTime || shift.time,
      status: "RUNNING",
    }));
}

function isRunningVehicle(vehicle: LiveFleetVehicle) {
  return String(vehicle.status || "").trim().toUpperCase() === "RUNNING";
}

function vehicleLocationLabel(vehicle: LiveFleetVehicle, routes: any[], stops: BusStop[], index: number) {
  const route = routes.find((item) => Number(item.routeId || item.id) === Number(vehicle.routeId));
  const preview = route ? buildLocalRoutePreview(Number(vehicle.routeId), routes, stops) : null;
  const actualLat = numberValue(vehicle.latitude);
  const actualLng = numberValue(vehicle.longitude);
  const point = actualLat && actualLng ? { lat: actualLat, lng: actualLng } : pointOnPreview(preview || undefined, index);
  const routeStops = (route?.stops || [])
    .map((stopId: string | number) => stops.find((stop) => String(stop.id) === String(stopId)))
    .filter(Boolean) as BusStop[];
  const nearest = point ? nearestStop(point, routeStops.length ? routeStops : stops) : routeStops[0];
  if (!nearest) return route?.name || vehicle.routeName || "Đang cập nhật vị trí";
  return `Gần ${nearest.name}`;
}

function nearestStop(point: { lat: number; lng: number }, stops: BusStop[]) {
  return stops
    .filter((stop) => validCoordinate({ lat: numberValue(stop.lat), lng: numberValue(stop.lng) }))
    .map((stop) => ({ stop, distance: (numberValue(stop.lat) - point.lat) ** 2 + (numberValue(stop.lng) - point.lng) ** 2 }))
    .sort((left, right) => left.distance - right.distance)[0]?.stop;
}

function shallowEqualRecord(left: Record<string, string>, right: Record<string, string>) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => left[key] === right[key]);
}

function LiveFleetMap({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onVehicleLocationsChange,
}: {
  vehicles: LiveFleetVehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  onVehicleLocationsChange?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const [previews, setPreviews] = useState<Record<number, RouteMapPreviewDTO>>({});
  const [roadPreviews, setRoadPreviews] = useState<Record<number, RouteMapPreviewDTO>>({});
  const [fallbackRouteIds, setFallbackRouteIds] = useState<number[]>([]);
  const [trackingByTrip, setTrackingByTrip] = useState<Record<string, JourneyTrackingSnapshotDTO>>({});

  useEffect(() => {
    let cancelled = false;
    const loadTracking = async () => {
      const running = vehicles.filter((vehicle) => vehicle.tripId != null);
      const results = await Promise.allSettled(running.map((vehicle) => operationsApi.coordinatorTripTracking(vehicle.tripId)));
      if (cancelled) return;
      const next: Record<string, JourneyTrackingSnapshotDTO> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") next[String(running[index].tripId)] = result.value;
      });
      setTrackingByTrip(next);
    };
    void loadTracking();
    const timer = window.setInterval(loadTracking, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [vehicles]);

  useEffect(() => {
    let cancelled = false;
    transportApi.routes()
      .then((routes) => {
        if (cancelled) return;
        setFallbackRouteIds(routes.filter((route) => (route.stopCount || 0) >= 2).map((route) => route.routeId).slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setFallbackRouteIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const routeIds = Array.from(new Set([
      ...vehicles.map((v) => v.routeId).filter(Boolean),
      ...fallbackRouteIds,
    ]));
    const missing = routeIds.filter((routeId) => !previews[routeId]);
    if (!missing.length) return;
    let cancelled = false;
    Promise.allSettled(missing.map((routeId) => transportApi.routePreview(routeId)))
      .then((results) => {
        if (cancelled) return;
        setPreviews((current) => {
          const next = { ...current };
          results.forEach((result) => {
            if (result.status === "fulfilled") next[result.value.routeId] = result.value;
          });
          return next;
        });
      });
    return () => {
      cancelled = true;
    };
  }, [fallbackRouteIds, previews, vehicles]);

  useEffect(() => {
    const source = Object.values(previews).filter((preview) => !roadPreviews[preview.routeId]);
    if (!source.length) return;
    let cancelled = false;
    Promise.allSettled(source.map(toRoadPreview)).then((results) => {
      if (cancelled) return;
      setRoadPreviews((current) => {
        const next = { ...current };
        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value) next[result.value.routeId] = result.value;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [previews, roadPreviews]);

  const displayPreviews = useMemo(() => ({ ...previews, ...roadPreviews }), [previews, roadPreviews]);

  const buses = useMemo<JourneyBus[]>(() => {
    return vehicles.map((vehicle, index) => {
      const snapshot = trackingByTrip[String(vehicle.tripId)];
      const tracked = snapshot?.vehicles?.find((item) => Number(item.tripId) === Number(vehicle.tripId));
      const preview = displayPreviews[vehicle.routeId];
      const trackedPoint = {
        lat: numberValue(tracked?.latitude ?? vehicle.latitude),
        lng: numberValue(tracked?.longitude ?? vehicle.longitude),
      };
      const fallbackPoint = pointOnPreview(preview, index, vehicle);
      const point = validCoordinate(trackedPoint) ? trackedPoint : fallbackPoint;
      if (!point || !validCoordinate(point)) return null;

      return {
        id: String(vehicle.tripId),
        plate: tracked?.plateNumber || vehicle.licensePlate || `Xe ${index + 1}`,
        routeCode: preview?.routeCode || `R${vehicle.routeId}`,
        routeColor: preview?.colorHex || "#BDFD4F",
        lat: point.lat,
        lng: point.lng,
        occupancy: tracked?.occupancy ?? vehicle.occupancy,
        capacity: tracked?.capacity ?? 45,
        driverName: tracked?.driverName || vehicle.driverName,
      } satisfies JourneyBus;
    }).filter(Boolean) as JourneyBus[];
  }, [displayPreviews, trackingByTrip, vehicles]);

  const selectedRouteLines = useMemo(
    () => selectedVehicleRoutePolylines(selectedVehicleId, vehicles, displayPreviews, trackingByTrip, buses),
    [buses, displayPreviews, selectedVehicleId, trackingByTrip, vehicles],
  );
  const selectedRouteStops = useMemo(
    () => selectedVehicleRouteStops(selectedVehicleId, vehicles, displayPreviews, trackingByTrip),
    [displayPreviews, selectedVehicleId, trackingByTrip, vehicles],
  );
  const selectedRouteColor = selectedRouteLines[0]?.color || buses.find((bus) => bus.id === selectedVehicleId)?.routeColor || "#144fcc";
  const visibleBuses = selectedVehicleId ? buses.filter((bus) => bus.id === selectedVehicleId) : buses;
  const visiblePolylines = selectedVehicleId ? selectedRouteLines : mapFitPolylines(displayPreviews, buses);

  useEffect(() => {
    if (!onVehicleLocationsChange) return;
    const locations = Object.fromEntries(buses.map((bus) => {
      const vehicle = vehicles.find((item) => String(item.tripId) === bus.id);
      const preview = vehicle ? displayPreviews[vehicle.routeId] : undefined;
      return [bus.id, busLocationLabel(bus, preview)];
    }));
    onVehicleLocationsChange((current) => shallowEqualRecord(current, locations) ? current : locations);
  }, [buses, onVehicleLocationsChange, displayPreviews, vehicles]);

  return (
    <div className="relative h-full w-full">
      <JourneyMap
        stops={selectedRouteStops}
        buses={visibleBuses}
        polylines={visiblePolylines}
        onSelectBus={onSelectVehicle}
        routeColor={selectedRouteColor}
        originLabel="Điểm khởi hành"
        destinationLabel="Điểm kết thúc"
        fitOnStopsChange={!selectedVehicleId}
        height="100%"
        className="h-full"
        allowFallbackPolyline={false}
      />
      <div className="absolute bottom-3 left-3 z-[500] rounded-full bg-[#14140f]/90 px-3 py-1.5 text-xs font-bold text-[#BDFD4F]">
        {selectedVehicleId ? 'Đang xem 1 xe' : (buses.length || vehicles.length) + ' xe đang vận hành'}
      </div>
    </div>
  );
}

function coordinatorToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${value.year}-${value.month}-${value.day}`;
}

function numberValue(value: unknown) {
  const n = typeof value === "string" ? Number(value) : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function toRoadPreview(preview: RouteMapPreviewDTO): Promise<RouteMapPreviewDTO | null> {
  const stops = (preview.stops || [])
    .map((stop) => ({ lat: numberValue(stop.latitude), lng: numberValue(stop.longitude) }))
    .filter(validCoordinate);
  if (stops.length < 2) return null;
  const coords = stops.slice(0, 24).map((point) => `${point.lng},${point.lat}`).join(";");
  const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`, { cache: "force-cache" });
  if (!res.ok) return null;
  const data = await res.json();
  const coordinates = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  return {
    ...preview,
    polylines: [{
      legId: `road-${preview.routeId}`,
      mode: "BUS",
      colorHex: preview.colorHex,
      points: coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })),
    }],
  };
}

function validCoordinate(point: { lat: number; lng: number }) {
  return Math.abs(point.lat) > 0 && Math.abs(point.lng) > 0;
}

function selectedVehicleRoutePolylines(
  selectedVehicleId: string | null,
  vehicles: LiveFleetVehicle[],
  previews: Record<number, RouteMapPreviewDTO>,
  trackingByTrip: Record<string, JourneyTrackingSnapshotDTO>,
  buses: JourneyBus[],
): JourneyPolyline[] {
  if (!selectedVehicleId) return [];
  const vehicle = vehicles.find((item) => String(item.tripId) === selectedVehicleId);
  const selectedBus = buses.find((bus) => bus.id === selectedVehicleId);
  const preview = vehicle ? previews[vehicle.routeId] : undefined;
  const tracking = trackingByTrip[selectedVehicleId];
  const polylines = tracking?.polylines?.length ? tracking.polylines : preview?.polylines;
  if (!polylines?.length) return [];
  return polylines
    .map((line, index) => ({
      id: `selected-${selectedVehicleId}-${line.legId || index}`,
      color: selectedBus?.routeColor || line.colorHex || preview?.colorHex || "#144fcc",
      label: tracking?.routeName || preview?.routeName || preview?.routeCode || `Tuyến ${vehicle?.routeId ?? ""}`,
      points: (line.points || [])
        .map((point) => ({ lat: numberValue(point.latitude), lng: numberValue(point.longitude) }))
        .filter(validCoordinate),
    }))
    .filter((line) => line.points.length > 1);
}

function selectedVehicleRouteStops(
  selectedVehicleId: string | null,
  vehicles: LiveFleetVehicle[],
  previews: Record<number, RouteMapPreviewDTO>,
  trackingByTrip: Record<string, JourneyTrackingSnapshotDTO>,
): BusStop[] {
  if (!selectedVehicleId) return [];
  const vehicle = vehicles.find((item) => String(item.tripId) === selectedVehicleId);
  const preview = vehicle ? previews[vehicle.routeId] : undefined;
  const tracking = trackingByTrip[selectedVehicleId];
  const stops = tracking?.stops?.length ? tracking.stops : preview?.stops;
  if (!stops?.length) return [];
  const routePoints = (tracking?.polylines?.length ? tracking.polylines : preview?.polylines || [])
    .flatMap((line) => line.points || [])
    .map((point) => ({ lat: numberValue(point.latitude), lng: numberValue(point.longitude) }))
    .filter(validCoordinate);
  return stops
    .map((stop) => {
      const point = snapPointToRoute({ lat: numberValue(stop.latitude), lng: numberValue(stop.longitude) }, routePoints);
      return {
        id: String(stop.stopId),
        name: stop.stopName,
        code: String(stop.stopId),
        address: stop.address || "",
        lat: point.lat,
        lng: point.lng,
        routes: [String(preview?.routeId ?? vehicle?.routeId ?? "")],
        hasShelter: false,
      };
    })
    .filter((stop) => validCoordinate(stop));
}

function snapPointToRoute(point: { lat: number; lng: number }, routePoints: { lat: number; lng: number }[]) {
  if (routePoints.length < 2) return point;
  let best = point;
  let bestDistance = Number.POSITIVE_INFINITY;
  const scale = Math.cos(point.lat * Math.PI / 180);
  for (let index = 0; index < routePoints.length - 1; index += 1) {
    const a = routePoints[index];
    const b = routePoints[index + 1];
    const ax = a.lng * scale;
    const ay = a.lat;
    const bx = b.lng * scale;
    const by = b.lat;
    const px = point.lng * scale;
    const py = point.lat;
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const ratio = lengthSquared ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)) : 0;
    const projected = { lat: ay + dy * ratio, lng: (ax + dx * ratio) / scale };
    const distance = (projected.lat - point.lat) ** 2 + ((projected.lng - point.lng) * scale) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = projected;
    }
  }
  return best;
}

function mapFitPolylines(previews: Record<number, RouteMapPreviewDTO>, buses: JourneyBus[]) {
  const previewPoints = Object.values(previews)
    .flatMap((preview) => preview.polylines || [])
    .flatMap((line) => line.points || [])
    .map((point) => ({ lat: numberValue(point.latitude), lng: numberValue(point.longitude) }))
    .filter(validCoordinate);
  const points = previewPoints.length
    ? previewPoints
    : buses.map((bus) => ({ lat: bus.lat, lng: bus.lng })).filter(validCoordinate);
  if (!points.length) return [];
  if (points.length === 1) {
    const point = points[0];
    return [{
      id: "fleet-fit",
      dashed: true,
      color: "transparent",
      points: [
        { lat: point.lat - 0.018, lng: point.lng - 0.018 },
        { lat: point.lat + 0.018, lng: point.lng + 0.018 },
      ],
    }];
  }
  return [{ id: "fleet-fit", dashed: true, color: "transparent", points }];
}

function busLocationLabel(bus: JourneyBus, preview?: RouteMapPreviewDTO) {
  const stops = (preview?.stops || [])
    .map((stop) => ({
      id: String(stop.stopId),
      name: stop.stopName,
      code: String(stop.stopId),
      address: "",
      lat: numberValue(stop.latitude),
      lng: numberValue(stop.longitude),
      routes: [String(preview?.routeId || "")],
      hasShelter: false,
    }))
    .filter((stop) => validCoordinate(stop));
  const nearest = nearestStop({ lat: bus.lat, lng: bus.lng }, stops);
  return nearest ? `Gần ${nearest.name}` : "Đang cập nhật vị trí";
}

function buildLocalRoutePreview(routeId: number, routes: any[], stops: BusStop[]): RouteMapPreviewDTO | null {
  const route = routes.find((item) => Number(item.routeId || item.id) === Number(routeId));
  if (!route) return null;
  const routeStops = (route.stops || [])
    .map((stopId: string | number) => stops.find((stop) => String(stop.id) === String(stopId)))
    .filter(Boolean) as BusStop[];
  const validStops = routeStops.filter((stop) => validCoordinate({ lat: numberValue(stop.lat), lng: numberValue(stop.lng) }));
  if (validStops.length < 2) return null;
  return {
    routeId: Number(routeId),
    routeCode: route.code || `R${routeId}`,
    routeName: route.name || `Tuyến ${routeId}`,
    colorHex: route.color || "#BDFD4F",
    direction: 0,
    stops: validStops.map((stop, index) => ({
      stopId: Number(stop.id),
      stopName: stop.name,
      address: stop.address,
      latitude: stop.lat,
      longitude: stop.lng,
      stopOrder: index + 1,
    })),
    polylines: [{
      legId: `local-${routeId}`,
      mode: "BUS",
      colorHex: route.color || "#BDFD4F",
      points: validStops.map((stop) => ({ latitude: stop.lat, longitude: stop.lng })),
    }],
  };
}

function pointOnPreview(preview: RouteMapPreviewDTO | undefined, index: number, vehicle?: LiveFleetVehicle) {
  const points = (preview?.polylines || [])
    .flatMap((line) => line.points || [])
    .map((point) => ({ lat: numberValue(point.latitude), lng: numberValue(point.longitude) }))
    .filter(validCoordinate);
  if (!points.length) return null;

  const routeId = preview?.routeId || 0;
  const now = new Date();
  const cycleMinutes = 55 + Math.abs(routeId % 25);
  const cycleSeconds = cycleMinutes * 60;
  const secondOfDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const departureParts = String(vehicle?.departureTime || "").split(":").map(Number);
  const departureSecond = departureParts.length >= 2 && departureParts.every(Number.isFinite)
    ? departureParts[0] * 3600 + departureParts[1] * 60 + (departureParts[2] || 0)
    : null;
  const offsetSeconds = departureSecond == null
    ? (Math.abs(routeId) * 60) + index * Math.max(480, Math.floor(cycleSeconds / 3))
    : Math.max(0, secondOfDay - departureSecond);
  const progress = (offsetSeconds % cycleSeconds) / cycleSeconds;

  const segments = points.slice(1).map((point, pointIndex) => {
    const previous = points[pointIndex];
    const length = Math.hypot(point.lat - previous.lat, point.lng - previous.lng);
    return { from: previous, to: point, length };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (!totalLength) return points[0];
  let targetLength = progress * totalLength;
  const segment = segments.find((item) => {
    if (targetLength <= item.length) return true;
    targetLength -= item.length;
    return false;
  }) || segments[segments.length - 1];
  const ratio = segment.length ? targetLength / segment.length : 0;
  const a = segment.from;
  const b = segment.to;
  return {
    lat: a.lat + (b.lat - a.lat) * ratio,
    lng: a.lng + (b.lng - a.lng) * ratio,
  };
}

// =============================================================================
// Screen 3: Schedule (weekly grid)
// =============================================================================
function ScheduleScreen({ ctx }: { ctx: Ctx }) {
  const [date, setDate] = useState(coordinatorToday);
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
                    label={coordinatorStatusLabel(s.status || (s.scheduleId ? "SCHEDULED" : "OPEN"))}
                    tone={String(s.status || "").toUpperCase() === "COMPLETED" ? "success" : s.scheduleId ? "primary" : "warning"}
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
// Screen 4: Assign trips
// =============================================================================
function AssignStaffScreen({ ctx }: { ctx: Ctx }) {
  const [date, setDate] = useState(coordinatorToday);
  const [dashboard, setDashboard] = useState<ScheduleDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [drivers, setDrivers] = useState<Record<string, number | undefined>>({});
  const [conductors, setConductors] = useState<Record<string, number | undefined>>({});
  const [buses, setBuses] = useState<Record<string, number | undefined>>({});
  const [newShiftOpen, setNewShiftOpen] = useState(false);

  const [assignmentQuery, setAssignmentQuery] = useState("");
  const [assignmentRouteFilter, setAssignmentRouteFilter] = useState("all");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState("all");
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await operationsApi.scheduleDashboard(date);
      setDashboard(d);
      const initDrivers: Record<string, number | undefined> = {};
      const initConductors: Record<string, number | undefined> = {};
      const initBuses: Record<string, number | undefined> = {};
      d.shifts.forEach((s) => {
        if (s.scheduleId) {
          initDrivers[s.scheduleId] = s.driverStaffId;
          initConductors[s.scheduleId] = s.conductorStaffId;
          initBuses[s.scheduleId] = s.busId;
        }
      });
      setDrivers(initDrivers);
      setConductors(initConductors);
      setBuses(initBuses);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được lịch");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const filteredShifts = useMemo(() => {
    const query = assignmentQuery.trim().toLocaleLowerCase("vi-VN");
    return (dashboard?.shifts || []).filter((shift) => {
      const scheduleId = shift.scheduleId;
      const locked = ["RUNNING", "COMPLETED"].includes(String(shift.status || "").toUpperCase());
      const complete = scheduleId
        ? Boolean(drivers[scheduleId] && conductors[scheduleId] && buses[scheduleId])
        : Boolean(shift.driverStaffId && shift.conductorStaffId && shift.busId);
      const matchesRoute = assignmentRouteFilter === "all" || String(shift.routeId) === assignmentRouteFilter;
      const matchesStatus = assignmentStatusFilter === "all"
        || (assignmentStatusFilter === "complete" && complete && !locked)
        || (assignmentStatusFilter === "pending" && !complete && !locked)
        || (assignmentStatusFilter === "locked" && locked);
      const searchText = [shift.routeName, shift.driverName, shift.conductorName, shift.licensePlate]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi-VN");
      return matchesRoute && matchesStatus && (!query || searchText.includes(query));
    });
  }, [assignmentQuery, assignmentRouteFilter, assignmentStatusFilter, buses, conductors, dashboard?.shifts, drivers]);

  const deleteShift = async () => {
    if (deletingScheduleId == null) return;
    try {
      await operationsApi.deleteSchedule(deletingScheduleId, date);
      toast.success("Đã xóa ca phân công");
      setDeletingScheduleId(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa ca phân công");
    }
  };

  const save = async (scheduleId: number) => {
    const driverId = drivers[scheduleId];
    const conductorId = conductors[scheduleId];
    const busId = buses[scheduleId];
    if (!driverId) {
      toast.error("Vui lòng chọn tài xế");
      return;
    }
    if (!conductorId) {
      toast.error("Vui lòng chọn phụ xe");
      return;
    }
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
          driverStaffId: driverId,
          conductorStaffId: conductorId,
          busId,
          departureTime: shift?.departureTime || shift?.time,
        }],
      });
      toast.success("Đã lưu phân công chuyến");
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
        title="Phân công chuyến xe"
        description=""
        icon={<BusIcon className="size-7" />}
        actions={
          <div className="flex items-center gap-2">
            <DateField value={date} onChange={setDate} />
            <ExpressiveButton variant="filled" size="sm" onClick={() => setNewShiftOpen(true)}>
              <Plus className="size-4" />
              Thêm ca
            </ExpressiveButton>
          </div>
        }
      />
      {loading ? (
        <LoadingScreen />
      ) : !dashboard ? (
        <EmptyState icon={<BusIcon className="size-7" />} title="Không tải được dữ liệu phân công" />
      ) : dashboard.shifts.length === 0 ? (
        <EmptyState
          icon={<Calendar className="size-7" />}
          title="Chưa có ca phân công"
          description={`Chưa có ca chạy nào vào ${formatDate(date)}.`}
        />
      ) : (
        <>
          <ExpressiveCard variant="outlined" className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_190px_190px] sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
              <Input
                value={assignmentQuery}
                onChange={(event) => setAssignmentQuery(event.target.value)}
                className="pl-9"
                placeholder="Tìm tuyến, tài xế, phụ xe hoặc biển số"
              />
            </div>
            <Select value={assignmentRouteFilter} onValueChange={setAssignmentRouteFilter}>
              <SelectTrigger><SelectValue placeholder="Tất cả tuyến" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tuyến</SelectItem>
                {dashboard.routes.map((route) => (
                  <SelectItem key={route.routeId} value={String(route.routeId)}>{route.routeName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignmentStatusFilter} onValueChange={setAssignmentStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Cần phân công</SelectItem>
                <SelectItem value="complete">Đủ phân công</SelectItem>
                <SelectItem value="locked">Đang chạy / đã xong</SelectItem>
              </SelectContent>
            </Select>
          </ExpressiveCard>
          <p className="text-xs text-on-surface-variant">Hiển thị {filteredShifts.length}/{dashboard.shifts.length} ca phân công.</p>
          {filteredShifts.length === 0 ? (
            <EmptyState
              icon={<Filter className="size-7" />}
              title="Không có ca phù hợp"
              description="Đổi điều kiện lọc hoặc từ khóa tìm kiếm."
            />
          ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {filteredShifts.map((s, i) => {
            const sid = s.scheduleId;
            const locked = ["RUNNING", "COMPLETED"].includes(String(s.status || "").toUpperCase());
            const hasDriver = sid ? Boolean(drivers[sid]) : Boolean(s.driverStaffId || s.driverName);
            const hasConductor = sid ? Boolean(conductors[sid]) : Boolean(s.conductorStaffId || s.conductorName);
            const hasBus = sid ? Boolean(buses[sid]) : Boolean(s.busId || s.licensePlate);
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
                    ) : hasDriver && hasConductor && hasBus ? (
                      <M3StatusPill label="Đủ phân công" tone="success" />
                    ) : !hasBus ? (
                      <M3StatusPill label="Thiếu xe" tone="warning" />
                    ) : (
                      <M3StatusPill label="Thiếu nhân sự" tone="warning" />
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
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
                            <SelectItem key={drv.staffId} value={String(drv.staffId)}>{drv.fullName} ({coordinatorStatusLabel(drv.status)})</SelectItem>
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
                            <SelectItem key={c.staffId} value={String(c.staffId)}>{c.fullName} ({coordinatorStatusLabel(c.status)})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs font-bold">Xe bus</Label>
                      <Select
                        value={sid && buses[sid] ? String(buses[sid]) : ""}
                        onValueChange={(v) => sid && setBuses((a) => ({ ...a, [sid]: Number(v) }))}
                        disabled={locked}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn xe" /></SelectTrigger>
                        <SelectContent>
                          {dashboard.buses.map((bus) => (
                            <SelectItem key={bus.busId} value={String(bus.busId)}>{bus.licensePlate} ({bus.seatCount || "?"} chỗ)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sid && (
                      <>
                        <ExpressiveButton
                          variant="filled"
                          size="sm"
                          onClick={() => save(sid)}
                          disabled={saving[sid] || locked}
                        >
                          {saving[sid] ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                          Lưu phân công
                        </ExpressiveButton>
                        <ExpressiveButton
                          variant="outlined"
                          size="sm"
                          onClick={() => setDeletingScheduleId(sid)}
                          disabled={locked}
                          className="border-error/30 text-error hover:bg-error-container"
                        >
                          <Trash2 className="size-4" />
                          Xóa ca
                        </ExpressiveButton>
                      </>
                    )}
                  </div>
                </ExpressiveCard>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
          )}
        </>
      )}
      <AlertDialog open={deletingScheduleId != null} onOpenChange={(open) => !open && setDeletingScheduleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ca phân công?</AlertDialogTitle>
            <AlertDialogDescription>
              Ca này sẽ không còn hiển thị cho tài xế và phụ xe. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={deleteShift} className="bg-error text-on-error hover:bg-error/90">
              Xóa ca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {dashboard && (
        <Dialog open={newShiftOpen} onOpenChange={setNewShiftOpen}>
          <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
            <NewShiftCard
              dashboard={dashboard}
              date={date}
              initialRouteId={null}
              onCreated={() => {
                setNewShiftOpen(false);
                load();
              }}
            />
          </DialogContent>
        </Dialog>
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
  dashboard,
  date,
  initialRouteId,
  onCreated,
}: {
  dashboard: ScheduleDashboard;
  date: string;
  initialRouteId: number | null;
  onCreated: () => void;
}) {
  const [routeId, setRouteId] = useState("");
  const [departureTime, setDepartureTime] = useState("07:00");
  const [driverStaffId, setDriverStaffId] = useState("");
  const [conductorStaffId, setConductorStaffId] = useState("");
  const [busId, setBusId] = useState("");
  const [saving, setSaving] = useState(false);
  const timeParts = parseTime12(departureTime);

  useEffect(() => {
    setRouteId(initialRouteId == null ? "" : String(initialRouteId));
  }, [initialRouteId]);

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
    if (!driverStaffId || !conductorStaffId) {
      toast.error("Vui lòng chọn tài xế và phụ xe");
      return;
    }
    if (!busId) {
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
    <ExpressiveCard variant="elevated" className="min-w-0 border border-[#E1E8E1] bg-[#F7FAF7] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">Thêm ca phân công</p>
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
        <div className="min-w-0">
          <Label className="text-xs font-bold">Tài xế</Label>
          <Select value={driverStaffId} onValueChange={setDriverStaffId}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn tài xế" /></SelectTrigger>
            <SelectContent>
              {dashboard.drivers.map((driver) => (
                <SelectItem key={driver.staffId} value={String(driver.staffId)}>{driver.fullName} ({coordinatorStatusLabel(driver.status)})</SelectItem>
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
                <SelectItem key={conductor.staffId} value={String(conductor.staffId)}>{conductor.fullName} ({coordinatorStatusLabel(conductor.status)})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 md:col-span-2">
          <Label className="text-xs font-bold">Xe bus</Label>
          <Select value={busId} onValueChange={setBusId}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn xe" /></SelectTrigger>
            <SelectContent>
              {dashboard.buses.map((bus) => (
                <SelectItem key={bus.busId} value={String(bus.busId)}>{bus.licensePlate} ({bus.seatCount || "?"} chỗ)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
function routeOperationalDetails(route: RouteListItem, lookup?: any) {
  const description = route.description || '';
  const operationTime = description.match(/operationTime=([^|]+)/i)?.[1]?.trim();
  const outbound = description.match(/outBound=([^|]+)/i)?.[1]?.trim();
  const inbound = description.match(/inBound=([^|]+)/i)?.[1]?.trim();
  const firstTrip = lookup?.firstTrip;
  const lastTrip = lookup?.lastTrip;
  const estimatedMinutes = Number(route.estimatedMinutes || lookup?.estimatedMinutes);

  return {
    serviceTime: firstTrip && lastTrip ? firstTrip + ' – ' + lastTrip : operationTime,
    frequency: Number(lookup?.frequencyMin) > 0 ? Number(lookup.frequencyMin) + ' phút/chuyến' : undefined,
    stopCount: Number(lookup?.stopCount) > 0 ? Number(lookup.stopCount) : undefined,
    estimatedMinutes: estimatedMinutes > 0 ? estimatedMinutes : undefined,
    direction: outbound || inbound || 'Lộ trình hai chiều đang cập nhật',
    routeCode: lookup?.routeCode,
  };
}

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
          {routes.map((r) => {
            const lookup = (ctx.routes || []).find((item: any) => Number(item.routeId || item.id) === r.id || item.routeName === r.routeName);
            const details = routeOperationalDetails(r, lookup);
            return (
              <StaggerItem key={r.id}>
                <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {details.routeCode && <span className="rounded-full bg-primary-container px-2 py-0.5 text-[11px] font-bold text-on-primary-container">Tuyến {details.routeCode}</span>}
                        <p className="font-bold text-on-surface truncate">{r.routeName}</p>
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant line-clamp-1">Lượt đi: {details.direction}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
                        {details.serviceTime && <span className="flex items-center gap-1"><Clock className="size-3" /> Hoạt động {details.serviceTime}</span>}
                        {details.frequency && <span className="flex items-center gap-1"><RefreshCw className="size-3" /> Mỗi {details.frequency}</span>}
                        {details.stopCount && <span className="flex items-center gap-1"><MapPin className="size-3" /> {details.stopCount} trạm</span>}
                        {details.estimatedMinutes && <span className="flex items-center gap-1"><Gauge className="size-3" /> Khoảng {details.estimatedMinutes} phút/chuyến</span>}
                        <M3StatusPill label={r.status === "ACTIVE" ? "Đang hoạt động" : r.status} tone={r.status === "ACTIVE" ? "success" : "neutral"} />
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <ExpressiveButton variant="text" size="icon-sm" onClick={() => setEditing(r)}><Edit className="size-4" /></ExpressiveButton>
                      <ExpressiveButton variant="text" size="icon-sm" onClick={() => setDeleting(r.id)}><Trash2 className="size-4 text-error" /></ExpressiveButton>
                    </div>
                  </div>
                </ExpressiveCard>
              </StaggerItem>
            );
          })}
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
  const [assignmentRouteId, setAssignmentRouteId] = useState<number | null>(null);
  const [assignmentDashboard, setAssignmentDashboard] = useState<ScheduleDashboard | null>(null);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
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

  const visibleUniversities = useMemo(() => {
    const priorityUniversityIds = [1, 2, 103, 3, 4];
    const universityMetrics = metrics.raw || [];
    return [...universityMetrics]
      .sort((left, right) => {
        const leftPriority = priorityUniversityIds.indexOf(left.universityId);
        const rightPriority = priorityUniversityIds.indexOf(right.universityId);
        const leftRank = leftPriority === -1 ? priorityUniversityIds.length : leftPriority;
        const rightRank = rightPriority === -1 ? priorityUniversityIds.length : rightPriority;
        if (leftRank !== rightRank) return leftRank - rightRank;
        return (right.tripsToday + right.routeCount + right.studentCount) - (left.tripsToday + left.routeCount + left.studentCount);
      })
      .slice(0, 5);
  }, [metrics.raw]);

  useEffect(() => {
    if (!selectedUniversityId && visibleUniversities.length) {
      setSelectedUniversityId(visibleUniversities[0].universityId);
    }
  }, [selectedUniversityId, visibleUniversities]);

  const selectedUniversity = visibleUniversities.find((u) => u.universityId === selectedUniversityId) || visibleUniversities[0] || null;
  const routes = routeMetrics.raw || [];
  const totalRunning = routes.reduce((sum, r) => sum + r.runningTrips, 0);

  const routeStatus = (route: CoordinatorUniversityRouteMetric) => {
    const demand = Math.max(route.activeMonthlyPasses, route.registeredStudents);
    if (route.tripsToday === 0) return { label: "Cần phân công", tone: "error" as const };
    if (route.tripsToday > 0 && route.runningTrips === 0) return { label: "Chưa chạy", tone: "warning" as const };
    if (demand > route.tripsToday * 40) return { label: "Có nguy cơ quá tải", tone: "warning" as const };
    if (!route.assignedDrivers || !route.assignedConductors) return { label: "Thiếu nhân sự", tone: "warning" as const };
    return { label: "Ổn định", tone: "success" as const };
  };
  const routesNeedingAction = routes.filter((route) => routeStatus(route).tone !== "success").length;

  const openAssignment = async (routeId: number) => {
    setAssignmentLoading(true);
    try {
      const dashboard = await operationsApi.scheduleDashboard(coordinatorToday());
      setAssignmentRouteId(routeId);
      setAssignmentDashboard(dashboard);
      setAssignmentOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể mở form phân công");
    } finally {
      setAssignmentLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Điều phối theo trường"
        description=""
        icon={<School className="size-7" />}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedUniversityId ? String(selectedUniversityId) : ""}
              onValueChange={(value) => setSelectedUniversityId(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-80"><SelectValue placeholder="Chọn trường cần điều phối" /></SelectTrigger>
              <SelectContent>
                {visibleUniversities.map((u) => (
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
                    { label: "Sinh viên", value: selectedUniversity.studentCount, icon: Users },
                    { label: "Đang chạy", value: totalRunning, icon: Navigation },
                    { label: "Cần xử lý", value: routesNeedingAction, icon: AlertTriangle },
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
                        <ExpressiveButton variant="tonal" size="sm" onClick={() => openAssignment(route.routeId)} disabled={assignmentLoading}>
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
      {assignmentDashboard && (
        <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
          <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
            <NewShiftCard
              dashboard={assignmentDashboard}
              date={coordinatorToday()}
              initialRouteId={assignmentRouteId}
              onCreated={() => {
                setAssignmentOpen(false);
                metrics.reload();
                routeMetrics.reload();
              }}
            />
          </DialogContent>
        </Dialog>
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

function isSosFeedback(item: any) {
  return String(item.content || "").toUpperCase().startsWith("[SOS") || String(item.studentName || "").includes("SOS");
}

function isPrivateMessageNotification(item: any) {
  const text = `${item.title || ""} ${item.content || item.body || ""}`.toLowerCase();
  return text.includes("tin nhắn") || text.includes("message") || text.includes("chat");
}

function isLostItemNotification(item: any) {
  const text = `${item.title || ""} ${item.content || item.body || ""}`.toLowerCase();
  return text.includes("[lost_item]") || text.includes("mất đồ") || text.includes("lost item");
}

function isFeedbackNotification(item: any) {
  const text = `${item.title || ""} ${item.content || item.body || ""}`.toLowerCase();
  return text.includes("phản hồi") || text.includes("feedback");
}

﻿// =============================================================================
// Screen 9: Hỗ trợ và phản hồi (Feedback / Lost Items / SOS)
// =============================================================================
function FeedbackScreen({ ctx, initialTab }: { ctx: Ctx; initialTab?: string }) {
  const [tab, setTab] = useState<'feedback' | 'lost' | 'sos'>(
    initialTab === 'sos' ? 'sos' : initialTab === 'lost' ? 'lost' : 'feedback'
  );
  const [filter, setFilter] = useState<'all' | 'new' | 'processing' | 'resolved'>('all');
  const [responding, setResponding] = useState<number | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedLost, setSelectedLost] = useState<any | null>(null);
  const [lostNotes, setLostNotes] = useState<Record<number, string>>({});
  const [violationSource, setViolationSource] = useState<any | null>(null);
  const [violationTargetId, setViolationTargetId] = useState("");
  const [violationCategory, setViolationCategory] = useState("OPERATION");
  const [violationDescription, setViolationDescription] = useState("");
  const [violationTargetRole, setViolationTargetRole] = useState<"ALL" | "DRIVER" | "CONDUCTOR" | "STUDENT">("ALL");
  const [violationTargetSearch, setViolationTargetSearch] = useState("");
  const [reportedViolationSourceIds, setReportedViolationSourceIds] = useState<string[]>([]);
  const [violationSubmitting, setViolationSubmitting] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("unibus.coordinator.reported-violation-sources");
      const parsed = saved ? JSON.parse(saved) : [];
      if (Array.isArray(parsed)) setReportedViolationSourceIds(parsed.map(String));
    } catch {
      setReportedViolationSourceIds([]);
    }
  }, []);

  const feedbackResource = useApi(() => coordinatorFeedbackApi.all(), (items) => items.map(mapFeedback), []);
  const lostItemResource = useApi(() => coordinatorLostItemApi.all(), undefined, []);
  const notificationResource = useApi(() => notificationApi.mine(), undefined, []);
  const violationSearchKeyword = violationTargetSearch.trim();
  const canBrowseViolationTargets = violationTargetRole !== "ALL" || violationSearchKeyword.length >= 2;
  const violationTargets = useApi(
    () => canBrowseViolationTargets
      ? adminApi.users({
          status: "ACTIVE",
          role: violationTargetRole === "ALL" ? undefined : violationTargetRole,
          search: violationSearchKeyword,
        })
      : Promise.resolve([]),
    undefined,
    [canBrowseViolationTargets, violationSearchKeyword, violationTargetRole]
  );
  const suggestedTripCrew = violationSource?.tripId
    ? (ctx.fleet || []).find((trip: any) => Number(trip.tripId) === Number(violationSource.tripId))
    : undefined;
  const feedbackItems = feedbackResource.data || ctx.feedback;
  const historicalItems = ((notificationResource.raw || []) as any[])
    .filter((item) => !isPrivateMessageNotification(item))
    .map((item) => ({
      ...item,
      _history: true,
      _type: isSosFeedback(item) ? 'sos' : isLostItemNotification(item) ? 'lost' : 'feedback',
      status: 'resolved',
      id: 'notification-' + item.notificationId,
      studentName: item.senderName || 'Hệ thống',
      reporterName: item.senderName || 'Hệ thống',
      content: item.content || item.body || '',
      createdAt: item.createdAt,
      category: 'Lịch sử hệ thống',
    }))
    .filter((item) => item._type !== 'feedback' || isFeedbackNotification(item));
  const historicalLostItems = historicalItems
    .filter((item) => item._type === 'lost')
    .map((item) => ({
      lostItemReportId: -Number(item.notificationId),
      reporterName: item.senderName || 'Hệ thống',
      itemDescription: item.content,
      status: 'CLOSED',
      reportedAt: item.createdAt,
      notes: 'Lịch sử hệ thống',
      _history: true,
    })) as ExperienceLostItemCard[];
  const lostItems: ExperienceLostItemCard[] = [...(lostItemResource.data || []), ...historicalLostItems];

  const feedbackOnly = [
    ...feedbackItems.filter((f: any) => !isSosFeedback(f)),
    ...historicalItems.filter((item) => item._type === 'feedback'),
  ];
  const sosOnly = [
    ...feedbackItems.filter(isSosFeedback),
    ...historicalItems.filter((item) => item._type === 'sos'),
  ];

  const applyStatusFilter = (items: any[]) =>
    items
      .filter((f: any) => filter === 'all' || f.status === filter)
      .sort((a: any, b: any) => {
        const at = new Date(a.createdAt || a.reportedAt || 0).getTime() || 0;
        const bt = new Date(b.createdAt || b.reportedAt || 0).getTime() || 0;
        return bt - at;
      });

  const filteredFeedback = applyStatusFilter(feedbackOnly);
  const filteredSos = applyStatusFilter(sosOnly);
  const filteredLost = lostItems
    .filter((l) => {
      if (filter === 'all') return true;
      const mapped = l.status === 'REPORTED' ? 'new' : l.status === 'SEARCHING' ? 'processing' : 'resolved';
      return mapped === filter;
    })
    .sort((a, b) => {
      const at = new Date(a.reportedAt || 0).getTime() || 0;
      const bt = new Date(b.reportedAt || 0).getTime() || 0;
      return bt - at;
    });

  const hasViolationReport = (item: any) => reportedViolationSourceIds.includes(String(item.id));
  const pendingFeedback = feedbackOnly.filter((f: any) => f.status !== 'resolved').length;
  const pendingLost = lostItems.filter((l) => l.status === 'REPORTED' || l.status === 'SEARCHING').length;
  const pendingSos = sosOnly.filter((f: any) => f.status !== 'resolved').length;

  const resolveFeedback = async (item: any) => {
    const id = Number(item.id);
    const isSos = isSosFeedback(item);
    const response = responses[item.id]?.trim() || (isSos ? 'Đã tiếp nhận và xử lý thông báo SOS.' : 'Đã tiếp nhận và xử lý phản hồi.');
    setResponding(id);
    try {
      await coordinatorFeedbackApi.resolve(id, response);
      toast.success(isSos ? 'Đã xử lý SOS' : 'Đã xử lý phản hồi');
      setResponses((prev) => { const next = { ...prev }; delete next[item.id]; return next; });
      setSelectedFeedback(null);
      ctx.reload();
      feedbackResource.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể xử lý');
    } finally {
      setResponding(null);
    }
  };

  const openViolationDialog = (item: any) => {
    const isSos = isSosFeedback(item);
    const sourceLabel = isSos ? "SOS" : "phản hồi";
    setViolationSource(item);
    setViolationTargetId("");
    setViolationTargetRole("ALL");
    setViolationTargetSearch("");
    setViolationCategory(isSos ? "SAFETY" : "OPERATION");
    setViolationDescription([
      `Nguồn: ${sourceLabel}${item.id ? ` #${item.id}` : ""}`,
      item.studentName ? `Người gửi: ${item.studentName}` : "",
      item.routeName || item.routeCode ? `Tuyến: ${item.routeName || item.routeCode}` : "",
      item.tripId ? `Chuyến: #${item.tripId}` : "",
      "",
      item.content || "",
    ].filter(Boolean).join("\n"));
  };

  const submitViolation = async () => {
    const reportedUserId = Number(violationTargetId);
    if (!reportedUserId || !violationDescription.trim()) {
      toast.error("Vui lòng chọn người bị báo cáo và nhập nội dung vi phạm");
      return;
    }
    setViolationSubmitting(true);
    try {
      await experienceApi.createViolation({
        reportedUserId,
        category: violationCategory,
        description: violationDescription.trim(),
      });
      toast.success("Đã gửi báo cáo vi phạm tới Admin");
      if (violationSource?.id != null) {
        setReportedViolationSourceIds((previous) => {
          const next = previous.includes(String(violationSource.id)) ? previous : [...previous, String(violationSource.id)];
          window.localStorage.setItem("unibus.coordinator.reported-violation-sources", JSON.stringify(next));
          return next;
        });
      }
      setViolationSource(null);
      setViolationTargetId("");
      setViolationTargetRole("ALL");
      setViolationTargetSearch("");
      setViolationDescription("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể tạo báo cáo vi phạm");
    } finally {
      setViolationSubmitting(false);
    }
  };

  const updateLostItem = async (item: ExperienceLostItemCard, status: string) => {
    const id = item.lostItemReportId;
    const notes = lostNotes[id]?.trim() || '';
    setResponding(id);
    try {
      await coordinatorLostItemApi.update(id, { status, notes: notes || undefined });
      toast.success('Đã cập nhật mất đồ');
      setLostNotes((prev) => { const next = { ...prev }; delete next[id]; return next; });
      setSelectedLost(null);
      lostItemResource.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể cập nhật');
    } finally {
      setResponding(null);
    }
  };

  const reloadAll = () => { feedbackResource.reload(); lostItemResource.reload(); notificationResource.reload(); };
  const loading = (feedbackResource.loading && !feedbackResource.data) || (lostItemResource.loading && !lostItemResource.data) || (notificationResource.loading && !notificationResource.raw);

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Hỗ trợ và phản hồi"
        description="Xử lý phản hồi, báo mất đồ và SOS từ hành khách."
        icon={<MessageSquare className="size-7" />}
        actions={
          <div className="flex gap-2">
            <ExpressiveButton variant="outlined" size="sm" onClick={reloadAll}>
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
              Làm mới
            </ExpressiveButton>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="new">Mới</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="resolved">Đã xử lý</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-surface-container-low p-1 shadow-none">
          <TabsTrigger value="feedback" className="rounded-xl gap-1.5">
            <Star className="size-3.5" />
            Phản hồi
            {pendingFeedback > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">{pendingFeedback}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="lost" className="rounded-xl gap-1.5">
            <PackageSearch className="size-3.5" />
            Mất đồ
            {pendingLost > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">{pendingLost}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sos" className="rounded-xl gap-1.5">
            <AlertTriangle className="size-3.5" />
            SOS
            {pendingSos > 0 && <Badge className="ml-1 h-5 min-w-5 px-1 text-[10px] bg-error text-on-error">{pendingSos}</Badge>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <LoadingScreen label="Đang tải dữ liệu..." />
      ) : (
        <>
          {/* ===== TAB: PHẢN HỒI ===== */}
          {tab === "feedback" && (
            filteredFeedback.length === 0 ? (
              <EmptyState icon={<Star className="size-7" />} title="Không có phản hồi" />
            ) : (
              <StaggerGroup className="space-y-3 min-w-0">
                {filteredFeedback.map((f: any) => {
                  const isResolved = f.status === "resolved";
                  return (
                    <StaggerItem key={f.id}>
                      <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start min-w-0">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                              <M3StatusPill label={isResolved ? "Đã xử lý" : "Chờ xử lý"} tone={isResolved ? "success" : "warning"} />
                              <span className="text-xs text-on-surface-variant">{formatDate(f.createdAt)}</span>
                            </div>
                            <p className="font-bold text-on-surface truncate">{f.studentName}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {f.routeName || f.routeCode || "Chưa rõ tuyến"}{f.tripId ? " · Chuyến #" + f.tripId : ""}
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={cn("size-3", i < (f.rating || 0) ? "fill-amber-400 text-amber-400" : "text-outline")} />
                              ))}
                              <span className="text-xs text-on-surface-variant ml-2">{f.category}</span>
                            </div>
                            <p className="mt-3 text-sm text-on-surface whitespace-pre-wrap break-words">{f.content}</p>
                            {f.response && (
                              <div className="mt-3 p-2 rounded-lg bg-success-container/30 text-xs">
                                <p className="font-bold text-success">Phản hồi xử lý:</p>
                                <p>{f.response}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 md:w-44">
                            {!isResolved && !hasViolationReport(f) && (
                              <ExpressiveButton
                                variant="text"
                                size="sm"
                                className="order-2 w-full justify-center text-error hover:bg-error-container/30"
                                onClick={() => openViolationDialog(f)}
                              >
                                <AlertTriangle className="size-4" />
                                Báo cáo vi phạm
                              </ExpressiveButton>
                            )}
                            {!isResolved ? (
                              <ExpressiveButton
                                variant="filled" size="sm"
                                className="order-1 w-full justify-center"
                                onClick={() => {
                                  setSelectedFeedback(f);
                                  setResponses((prev) => ({ ...prev, [f.id]: prev[f.id] || "Đã tiếp nhận và xử lý phản hồi." }));
                                }}
                                disabled={responding === Number(f.id)}
                              >
                                {responding === Number(f.id) ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                                Xử lý
                              </ExpressiveButton>
                            ) : (
                              <ExpressiveButton variant="tonal" size="sm" disabled><CheckCircle2 className="size-4" /> Đã xử lý</ExpressiveButton>
                            )}
                          </div>
                        </div>
                      </ExpressiveCard>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>
            )
          )}

          {/* ===== TAB: MẤT ĐỒ ===== */}
          {tab === "lost" && (
            filteredLost.length === 0 ? (
              <EmptyState icon={<PackageSearch className="size-7" />} title="Không có báo mất đồ" />
            ) : (
              <StaggerGroup className="space-y-3 min-w-0">
                {filteredLost.map((item) => {
                  const isResolved = item.status === "FOUND" || item.status === "NOT_FOUND";
                  const statusLabel = item.status === "REPORTED" ? "Mới báo" : item.status === "SEARCHING" ? "Đang tìm" : item.status === "FOUND" ? "Đã tìm thấy" : item.status === "NOT_FOUND" ? "Không tìm thấy" : "Đang xử lý";
                  const statusTone = item.status === "REPORTED" ? "warning" : item.status === "SEARCHING" ? "info" : "success";
                  return (
                    <StaggerItem key={item.lostItemReportId}>
                      <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start min-w-0">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                              <M3StatusPill label={statusLabel} tone={statusTone as any} />
                              <span className="text-xs text-on-surface-variant">{formatDate(item.reportedAt)}</span>
                            </div>
                            <p className="font-bold text-on-surface truncate">{item.reporterName || "Sinh viên"}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {item.routeName || item.routeCode || "Chưa rõ tuyến"}{item.tripId ? " · Chuyến #" + item.tripId : ""}
                            </p>
                            <p className="mt-3 text-sm text-on-surface whitespace-pre-wrap break-words">{item.itemDescription}</p>
                            {item.notes && (
                              <div className="mt-3 p-2 rounded-lg bg-surface-container-low text-xs">
                                <p className="font-bold">Ghi chú:</p>
                                <p>{item.notes}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 md:w-44">
                            {!isResolved ? (
                              <>
                                <ExpressiveButton
                                  variant="filled" size="sm"
                                  onClick={() => {
                                    setSelectedLost({ ...item, _nextStatus: item.status });
                                    setLostNotes((prev) => ({ ...prev, [item.lostItemReportId]: item.notes || "" }));
                                  }}
                                  disabled={responding === item.lostItemReportId}
                                >
                                  {responding === item.lostItemReportId ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                                  Xử lý
                                </ExpressiveButton>
                              </>
                            ) : (
                              <ExpressiveButton variant="tonal" size="sm" disabled><CheckCircle2 className="size-4" /> {statusLabel}</ExpressiveButton>
                            )}
                          </div>
                        </div>
                      </ExpressiveCard>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>
            )
          )}

          {/* ===== TAB: SOS ===== */}
          {tab === "sos" && (
            filteredSos.length === 0 ? (
              <EmptyState icon={<AlertTriangle className="size-7" />} title="Không có SOS" description="Tin nhắn riêng sẽ được gom vào biểu tượng chat ở góc màn hình." />
            ) : (
              <StaggerGroup className="space-y-3 min-w-0">
                {filteredSos.map((item: any) => {
                  const isResolved = item.status === "resolved";
                  return (
                    <StaggerItem key={item.id}>
                      <ExpressiveCard variant="elevated" className="border-error/40 bg-error-container/10 p-5 min-w-0">
                        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start min-w-0">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-error px-2.5 py-1 text-xs font-bold text-on-error">
                                <AlertTriangle className="size-3.5" />
                                SOS
                              </span>
                              <M3StatusPill label={isResolved ? "Đã xử lý" : "Khẩn cấp"} tone={isResolved ? "success" : "error"} />
                              <span className="text-xs text-on-surface-variant">{formatDateTime(item.createdAt)}</span>
                            </div>
                            <p className="font-bold text-on-surface truncate">{item.studentName || "Sinh viên báo SOS"}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {item.routeName || item.routeCode || "Chưa rõ tuyến"}{item.tripId ? " · Chuyến #" + item.tripId : ""}
                            </p>
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-on-surface">{item.content}</p>
                            {item.response && (
                              <div className="mt-3 rounded-lg bg-success-container/30 p-2 text-xs">
                                <p className="font-bold text-success">Ghi chú xử lý:</p>
                                <p>{item.response}</p>
                              </div>
                            )}
                          </div>
                          {!isResolved && (
                            <div className="flex flex-col gap-1.5 md:w-44">
                              <ExpressiveButton
                                variant="filled" size="sm"
                                className="order-1 w-full justify-center"
                                onClick={() => {
                                  setSelectedFeedback(item);
                                  setResponses((prev) => ({ ...prev, [item.id]: prev[item.id] || "Đã tiếp nhận và xử lý thông báo SOS." }));
                                }}
                                disabled={responding === Number(item.id)}
                              >
                                {responding === Number(item.id) ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                                Xử lý
                              </ExpressiveButton>
                              {!hasViolationReport(item) && (
                                <ExpressiveButton
                                  variant="text"
                                  size="sm"
                                  className="order-2 w-full justify-center text-error hover:bg-error-container/30"
                                  onClick={() => openViolationDialog(item)}
                              >
                                <AlertTriangle className="size-4" />
                                  Báo cáo vi phạm
                                </ExpressiveButton>
                              )}
                            </div>
                          )}
                        </div>
                      </ExpressiveCard>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>
            )
          )}
        </>
      )}

      {/* Dialog xử lý feedback/SOS */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        {selectedFeedback && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ghi chú xử lý</DialogTitle>
              <DialogDescription>
                {selectedFeedback.studentName || "Phản hồi"}{selectedFeedback.tripId ? " · Chuyến #" + selectedFeedback.tripId : ""}
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
              <ExpressiveButton variant="text" onClick={() => setSelectedFeedback(null)} disabled={responding === Number(selectedFeedback.id)}>
                Hủy
              </ExpressiveButton>
              <ExpressiveButton variant="filled" onClick={() => resolveFeedback(selectedFeedback)} disabled={responding === Number(selectedFeedback.id)}>
                {responding === Number(selectedFeedback.id) ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Lưu xử lý
              </ExpressiveButton>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog xử lý mất đồ */}
      <Dialog open={!!violationSource} onOpenChange={(open) => !open && !violationSubmitting && setViolationSource(null)}>
        {violationSource && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Gửi báo cáo vi phạm</DialogTitle>
              <DialogDescription>Báo cáo được gửi ngay để Admin xem xét; chỉ Admin mới quyết định khóa tài khoản khi cần.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface">
                {violationSource.content}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Người bị báo cáo</Label>
                {suggestedTripCrew && (
                  <div className="rounded-xl bg-primary-container/30 p-3 text-xs text-on-surface">
                    <p className="font-bold">Gợi ý từ chuyến #{violationSource.tripId}</p>
                    <p className="mt-0.5 text-on-surface-variant">Chọn đúng nhân sự của chuyến trước khi tìm người khác.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestedTripCrew.driverName && (
                        <ExpressiveButton
                          type="button"
                          variant="tonal"
                          size="sm"
                          onClick={() => {
                            setViolationTargetRole("DRIVER");
                            setViolationTargetSearch(suggestedTripCrew.driverName);
                            setViolationTargetId("");
                          }}
                        >
                          Tài xế · {suggestedTripCrew.driverName}
                        </ExpressiveButton>
                      )}
                      {suggestedTripCrew.conductorName && (
                        <ExpressiveButton
                          type="button"
                          variant="tonal"
                          size="sm"
                          onClick={() => {
                            setViolationTargetRole("CONDUCTOR");
                            setViolationTargetSearch(suggestedTripCrew.conductorName);
                            setViolationTargetId("");
                          }}
                        >
                          Phụ xe · {suggestedTripCrew.conductorName}
                        </ExpressiveButton>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid gap-2 sm:grid-cols-[11rem_1fr]">
                  <Select value={violationTargetRole} onValueChange={(value) => { setViolationTargetRole(value as typeof violationTargetRole); setViolationTargetId(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                      <SelectItem value="DRIVER">Tài xế</SelectItem>
                      <SelectItem value="CONDUCTOR">Phụ xe</SelectItem>
                      <SelectItem value="STUDENT">Sinh viên</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={violationTargetSearch}
                    onChange={(event) => { setViolationTargetSearch(event.target.value); setViolationTargetId(""); }}
                    placeholder="Nhập ít nhất 2 ký tự để tìm..."
                  />
                </div>
                <Select value={violationTargetId} onValueChange={setViolationTargetId} disabled={!canBrowseViolationTargets || violationTargets.loading || (violationTargets.data || []).length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={violationTargets.loading ? "Đang tải danh sách..." : !canBrowseViolationTargets ? "Chọn vai trò hoặc nhập từ 2 ký tự" : (violationTargets.data || []).length === 0 ? "Không tìm thấy người phù hợp" : "Chọn người bị báo cáo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(violationTargets.data || []).map((target) => (
                      <SelectItem key={target.userId} value={String(target.userId)}>
                        {target.fullName} · {target.role} · {target.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {violationTargets.error && <p className="text-xs text-error">{violationTargets.error}</p>}
              </div>
              <div>
                <Label className="text-xs font-bold">Loại vi phạm</Label>
                <Select value={violationCategory} onValueChange={setViolationCategory}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATION">Vận hành</SelectItem>
                    <SelectItem value="SAFETY">An toàn</SelectItem>
                    <SelectItem value="SERVICE">Dịch vụ</SelectItem>
                    <SelectItem value="PAYMENT">Thanh toán/vé</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Nội dung báo cáo</Label>
                <Textarea
                  className="mt-1.5"
                  value={violationDescription}
                  onChange={(event) => setViolationDescription(event.target.value)}
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <ExpressiveButton variant="text" onClick={() => setViolationSource(null)} disabled={violationSubmitting}>
                Hủy
              </ExpressiveButton>
              <ExpressiveButton variant="filled" onClick={submitViolation} disabled={violationSubmitting || violationTargets.loading}>
                {violationSubmitting ? <RefreshCw className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                Gửi báo cáo
              </ExpressiveButton>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!selectedLost} onOpenChange={(open) => !open && setSelectedLost(null)}>
        {selectedLost && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Xử lý mất đồ</DialogTitle>
              <DialogDescription>
                {selectedLost.reporterName || "Sinh viên"}{selectedLost.tripId ? " · Chuyến #" + selectedLost.tripId : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface">
                {selectedLost.itemDescription}
              </div>
              <div>
                <Label className="text-xs font-bold">Trạng thái</Label>
                <div className="flex gap-2 mt-1.5">
                  <ExpressiveButton
                    variant={selectedLost._nextStatus === "SEARCHING" ? "filled" : "outlined"} size="sm"
                    onClick={() => setSelectedLost({ ...selectedLost, _nextStatus: "SEARCHING" })}
                  >
                    Đang tìm
                  </ExpressiveButton>
                  <ExpressiveButton
                    variant={selectedLost._nextStatus === "FOUND" ? "filled" : "outlined"} size="sm"
                    onClick={() => setSelectedLost({ ...selectedLost, _nextStatus: "FOUND" })}
                  >
                    Đã tìm thấy
                  </ExpressiveButton>
                  <ExpressiveButton
                    variant={selectedLost._nextStatus === "NOT_FOUND" ? "filled" : "outlined"} size="sm"
                    onClick={() => setSelectedLost({ ...selectedLost, _nextStatus: "NOT_FOUND" })}
                  >
                    Không tìm thấy
                  </ExpressiveButton>
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold">Ghi chú</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder="Nhập ghi chú..."
                  value={lostNotes[selectedLost.lostItemReportId] || ""}
                  onChange={(e) => setLostNotes((prev) => ({ ...prev, [selectedLost.lostItemReportId]: e.target.value }))}
                  rows={3}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <ExpressiveButton variant="text" onClick={() => setSelectedLost(null)} disabled={responding === selectedLost.lostItemReportId}>
                Hủy
              </ExpressiveButton>
              <ExpressiveButton
                variant="filled"
                onClick={() => updateLostItem(selectedLost, selectedLost._nextStatus || "SEARCHING")}
                disabled={responding === selectedLost.lostItemReportId}
              >
                {responding === selectedLost.lostItemReportId ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
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
// Screen 11: Notify broadcast
// =============================================================================
function NotifyScreen({ ctx }: { ctx: Ctx }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const notifications = useApi(() => notificationApi.mine(), undefined, []);
  const recentNotifications = (notifications.raw || ctx.notifications).filter((n: any) => !isPrivateMessageNotification(n));

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
          <Section title={`Gần đây (${recentNotifications.length})`}>
            {recentNotifications.length === 0 ? (
              <EmptyState icon={<Megaphone className="size-7" />} title="Chưa gửi thông báo" />
            ) : (
              <div className="space-y-2">
                {recentNotifications.slice(0, 5).map((n: any, index: number) => (
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
      type="button"
      onClick={(event) => { event.stopPropagation(); onClick(); }}
      className="fixed bottom-20 right-4 z-[2600] flex size-14 touch-manipulation items-center justify-center rounded-full bg-[#14140f] text-[#beff50] shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
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
  const [loadingThreads, setLoadingThreads] = useState(true);
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
        const [data, notifications] = await Promise.all([
          messagingApi.getThreads(),
          notificationApi.mine(),
        ]);
        setThreads(data);
        const driverConductorUnread = data
          .filter((t) => ["DRIVER", "CONDUCTOR"].includes(t.peerRole?.toUpperCase()))
          .reduce((sum, t) => sum + t.unreadCount, 0);
        const notificationUnread = notifications.filter((item) => !item.read && isPrivateMessageNotification(item)).length;
        onUnreadCountChange(Math.max(driverConductorUnread, notificationUnread));
      } catch (error) {
        console.error("Failed to fetch message threads:", error);
      } finally {
        fetchingThreadsRef.current = false;
      }
    };

    void fetchThreads().finally(() => {
      setLoadingThreads(false);
    });

    const interval = setInterval(() => {
      if (!document.hidden) void fetchThreads();
    }, 4000);
    return () => clearInterval(interval);
  }, [onUnreadCountChange]);

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

    messagingApi.markAsRead(activeThread.peerUserId).catch(() => {});
    notificationApi.mine()
      .then((items) => items.filter((item) => !item.read && isPrivateMessageNotification(item) && item.senderName === activeThread.peerName))
      .then((items) => Promise.all(items.map((item) => notificationApi.markRead(item.notificationId))))
      .then((items) => items.forEach(() => window.dispatchEvent(new Event("notification-read"))))
      .catch(() => {});

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
          className="fixed inset-x-3 bottom-20 top-20 z-[2500] flex flex-col overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-0 shadow-2xl focus:outline-none sm:inset-auto sm:bottom-6 sm:right-[92px] sm:h-[580px] sm:w-[380px]"
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
