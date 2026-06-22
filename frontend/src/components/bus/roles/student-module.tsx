"use client";

// =============================================================================
// Student Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// 14 role-specific screens driven by `activeId`:
//   stu-dashboard, stu-university, stu-stops, stu-find, stu-tracking,
//   stu-my-routes, stu-my-ticket, stu-history, stu-ai, stu-chatbot,
//   stu-payment, stu-invoices, stu-feedback, stu-lost
//
// Visual: keeps prototype v1.1 look (hero lime card, M3 Expressive cards,
// SplitText reveal, ScrollReveal, M3MapCanvas, vertical timeline).
// Data: real backend via @/lib/prototype-data hooks.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
  MapPin,
  Route as RouteIcon,
  Navigation,
  TicketCheck,
  History,
  Star,
  PackageSearch,
  CreditCard,
  Receipt,
  Sparkles,
  Bot,
  Search,
  Bus,
  Wallet,
  Clock,
  TrendingUp,
  ArrowRight,
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Send,
  MapPinned,
  ChevronRight,
  CircleDot,
  Download,
  Plus,
  Coffee,
  Wifi,
  Snowflake,
  Plug,
  Phone,
  Navigation2,
  Gauge,
  Users,
  Gift,
  School,
  BadgeCheck,
  Trash2,
  RefreshCw,
  Banknote,
  QrCode,
  ScanLine,
  CornerDownRight,
  ShieldCheck,
  Dot,
  PhoneCall,
  ChevronUp,
  Maximize2,
  LifeBuoy,
  MessageSquare,
  ChevronLeft,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// M3 Expressive primitives
import {
  ExpressiveButton,
  ExpressiveCard,
  Chip,
  SegmentedButton,
  StatusPill as M3StatusPill,
  M3Progress,
} from "@/components/m3/primitives";
// GSAP-style motion primitives
import {
  SplitText,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Magnetic,
  Counter,
  Shimmer,
  PageTransition,
} from "@/components/m3/motion";
import { BusMap, ETACard } from "@/components/m3/bus-map";
import { RealMap } from "@/components/m3/real-map";
// Bus shared primitives
import { PageHeader, StatCard, Section, EmptyState } from "../primitives";

// Real backend data adapter
import {
  useStudentPrototypeData,
  formatVND,
  formatDateTime,
  formatDate,
} from "@/lib/prototype-data";
import {
  studentApi,
  transportApi,
  experienceApi,
  feedbackApi,
  notificationApi,
  type StudentDashboardView,
  type ExperienceRouteCard,
  type ExperienceStopCard,
  type ExperienceTripCard,
  type ExperienceTicketCard,
  type ExperienceLostItemCard,
  type ExperienceNotificationCard,
  type ExperienceHistoryCard,
  type ExperienceFeedbackCard,
  type ExperienceDashboardStat,
  type TravelHistoryView,
  type RegistrationDTO,
  type PaymentView,
  type TicketView,
  type EtaDTO,
  ApiError,
} from "@/lib/api/client";

type StudentModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function StudentModule({ activeId, onNavigate }: StudentModuleProps) {
  const proto = useStudentPrototypeData();

  if (proto.loading) return <LoadingScreen label="Đang tải dữ liệu sinh viên..." />;
  if (proto.error) return <ErrorScreen message={proto.error} onRetry={proto.reload} />;

  const d = proto.data!;
  const ctx = {
    user: d.user,
    routes: d.routes,
    stops: d.stops,
    trips: d.trips,
    bookings: d.bookings,
    invoices: d.invoices,
    notifications: d.notifications,
    feedback: d.feedback,
    lostItems: d.lostItems,
    tripsHistory: d.tripsHistory,
    stats: d.stats,
    nextTrip: d.nextTrip,
    activeTicket: d.activeTicket,
    registration: d.registration,
    suggestions: d.suggestions,
    university: d.university,
    raw: {
      dashboard: d.dashboard,
      passes: d.passes,
      history: d.history,
      feedbackRaw: d.feedbackRaw,
      lostItemsRaw: d.lostItemsRaw,
      notificationsRaw: d.notificationsRaw,
      profileRaw: d.profileRaw,
      registrationRaw: d.registrationRaw,
      suggestionsRaw: d.suggestionsRaw,
      universityRaw: d.universityRaw,
      stopsRaw: d.stopsRaw,
    },
    reload: proto.reload,
  };

  switch (activeId) {
    case "stu-dashboard":
      return <DashboardScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-university":
      return <UniversityScreen ctx={ctx} />;
    case "stu-stops":
      return <StopsScreen ctx={ctx} />;
    case "stu-find":
      return <FindRoutesScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-tracking":
      return <TrackingScreen ctx={ctx} />;
    case "stu-my-routes":
      return <MyRoutesScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-my-ticket":
      return <MyTicketScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-history":
      return <HistoryScreen ctx={ctx} />;
    case "stu-ai":
      return <AIScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-chatbot":
      return <ChatbotScreen ctx={ctx} />;
    case "stu-payment":
      return <PaymentScreen ctx={ctx} />;
    case "stu-invoices":
      return <InvoicesScreen ctx={ctx} />;
    case "stu-feedback":
      return <FeedbackScreen ctx={ctx} />;
    case "stu-lost":
      return <LostItemsScreen ctx={ctx} />;
    default:
      return <FallbackScreen activeId={activeId} />;
  }
}

export default StudentModule;

// =============================================================================
// Types
// =============================================================================
interface Ctx {
  user: any;
  routes: any[];
  stops: any[];
  trips: any[];
  bookings: any[];
  invoices: any[];
  notifications: any[];
  feedback: any[];
  lostItems: any[];
  tripsHistory: any[];
  stats: ExperienceDashboardStat[];
  nextTrip: any | null;
  activeTicket: any | null;
  registration: any | null;
  suggestions: any[];
  university: any;
  raw: any;
  reload: () => void;
}

// =============================================================================
// Loading & Error screens (keep prototype look)
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
// Shared sub-components (M3 Expressive)
// =============================================================================

function RouteCodeBadge({ route, className }: { route: any; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-bold",
        className
      )}
      style={{ backgroundColor: route.color || "#14b8a6", color: "#14140f" }}
    >
      <CircleDot className="size-3" />
      {route.code}
    </span>
  );
}

function UniRouteChip({ active }: { active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold",
        active
          ? "bg-[#beff50] text-[#14140f]"
          : "bg-surface-container-high text-on-surface-variant"
      )}
    >
      <School className="size-2.5" />
      Trường tôi
    </span>
  );
}

function M3StarRating({
  value,
  onChange,
  size = "size-5",
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-transform",
            !readOnly && "hover:scale-125 active:scale-95"
          )}
        >
          <Star
            className={cn(
              size,
              star <= value ? "fill-amber-400 text-amber-400" : "text-outline"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function VerticalTimeline({
  stops,
  currentIndex,
}: {
  stops: any[];
  currentIndex?: number;
}) {
  if (!stops.length) return null;
  return (
    <div className="relative space-y-0">
      {/* vertical line */}
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
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  isCurrent && "text-on-surface font-bold"
                )}
              >
                {s.stopName}
              </p>
              {s.address && (
                <p className="text-xs text-on-surface-variant truncate">{s.address}</p>
              )}
              {s.minutesFromPreviousStop != null && i > 0 && (
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  +{s.minutesFromPreviousStop} phút từ trạm trước
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Screen 1: Dashboard — hero greeting + upcoming trip + quick actions + stats
// =============================================================================
function DashboardScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const firstName = (ctx.user.name || "bạn").split(" ").slice(-1)[0];

  const [qrExpanded, setQrExpanded] = useState(false);

  const activeTicket = ctx.activeTicket;
  const nextTrip = ctx.nextTrip;
  const activeRoute = nextTrip
    ? ctx.routes.find((r) => r.id === String(nextTrip.routeId))
    : ctx.routes[0];
  const unread = ctx.notifications.filter((n: any) => !n.read).length;

  const quickActions = [
    { id: "stu-find", label: "Tìm tuyến xe", icon: RouteIcon, accent: "primary" as const },
    { id: "stu-tracking", label: "Theo dõi xe", icon: Navigation, accent: "tertiary" as const },
    { id: "stu-payment", label: "Mua vé tháng", icon: CreditCard, accent: "secondary" as const },
    { id: "stu-ai", label: "AI gợi ý", icon: Sparkles, accent: "primary" as const },
  ];

  const statCards = (ctx.stats || []).slice(0, 4);

  return (
    <PageTransition className="space-y-6 sm:space-y-8 min-w-0">
      {/* Hero greeting — perk-style: bold lime accent + dark text */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="space-y-3 min-w-0"
      >
        <SplitText
          as="h1"
          text={`${greeting}, ${firstName}!`}
          className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface text-balance"
          stagger={0.06}
        />
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {ctx.university?.universityName && (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#beff50] text-[#14140f] text-xs font-bold shrink-0">
              <School className="size-3.5" />
              {ctx.university.shortName || ctx.university.universityName}
            </span>
          )}
          {ctx.user.verificationStatus === "VERIFIED" && (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold shrink-0">
              <BadgeCheck className="size-3.5" />
              Đã xác thực
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#144fcc] text-white text-xs font-bold shrink-0">
            <ShieldCheck className="size-3.5" />
            {ctx.user.email?.includes("gmail") ? "Google" : "Email"}
          </span>
        </div>
      </motion.div>

      {/* Upcoming trip HERO — perk-style: bold lime card, dark text, no pale aurora */}
      {(activeRoute || nextTrip) && (
        <ScrollReveal>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative overflow-hidden rounded-3xl p-5 sm:p-7 elev-2"
            style={{ backgroundColor: "#beff50", color: "#14140f" }}
          >
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-8 size-40 rounded-full bg-[#144fcc]/10 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center min-w-0">
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold items-center">
                    {activeRoute?.code || "UNIBUS"}
                  </span>
                  <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-[#14140f]/10 text-xs font-bold">
                    <motion.span
                      className="size-1.5 rounded-full bg-[#14140f]"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    {nextTrip?.status === "RUNNING" ? "Đang chạy" : "Sắp khởi hành"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight">Chuyến sắp tới</h2>
                <p className="text-sm font-semibold opacity-80 sm:text-base truncate">
                  {activeRoute?.from || ctx.registration?.boardingStopName || "Điểm lên"} {"→"}{" "}
                  {activeRoute?.to || ctx.registration?.alightingStopName || "Điểm xuống"}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <HeroMetric
                    label="Khởi hành"
                    value={nextTrip?.departTime || activeRoute?.firstTrip || "Hôm nay"}
                  />
                  <HeroMetric
                    label="Biển số"
                    value={nextTrip?.busPlate || "Đang gán"}
                  />
                  <HeroMetric
                    label="Mật độ"
                    value={
                      nextTrip?.occupancy != null
                        ? `${nextTrip.occupancy}/${nextTrip.seatCount || "?"}`
                        : "Đang cập nhật"
                    }
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-3">
                {activeTicket?.qrCode ? (
                  <motion.button
                    onClick={() => setQrExpanded((v) => !v)}
                    className="relative bg-white p-3 rounded-2xl shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <QRCodeCanvas
                      value={activeTicket.qrCode}
                      size={qrExpanded ? 200 : 110}
                      level="H"
                      includeMargin={false}
                    />
                    <div className="absolute -top-1.5 -right-1.5 size-6 rounded-full bg-[#14140f] text-[#beff50] flex items-center justify-center">
                      <Maximize2 className="size-3" />
                    </div>
                  </motion.button>
                ) : (
                  <div className="bg-white/30 p-6 rounded-2xl text-center">
                    <QrCode className="size-12 opacity-50" />
                    <p className="text-[10px] font-bold mt-1 opacity-70">Chưa có vé</p>
                  </div>
                )}
                <p className="text-[10px] font-bold opacity-70 text-center">
                  {qrExpanded ? "Chạm để thu nhỏ" : "Chạm để phóng to"}
                </p>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      )}

      {/* Quick actions — perk-style */}
      <ScrollReveal delay={0.1}>
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
                <ArrowRight className="size-4 mt-2 opacity-70 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* Stats */}
      {statCards.length > 0 && (
        <ScrollReveal delay={0.15}>
          <Section title="Tổng quan" className="min-w-0">
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

      {/* Active ticket + registration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        {ctx.registration && (
          <ScrollReveal delay={0.2}>
            <ExpressiveCard variant="elevated" className="p-5 h-full min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold">Tuyến đã đăng ký</h3>
                <RouteCodeBadge route={ctx.routes.find((r) => r.id === String(ctx.registration?.routeId)) || { code: "", color: "" }} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 text-primary" />
                  <span className="font-medium truncate">{ctx.registration.routeName}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-on-surface-variant">
                  <CornerDownRight className="size-3 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p>Lên: <span className="font-medium text-on-surface truncate">{ctx.registration.boardingStopName}</span></p>
                    <p>Xuống: <span className="font-medium text-on-surface truncate">{ctx.registration.alightingStopName}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="size-3.5" />
                  <span>Hiệu lực: {formatDate(ctx.registration.effectiveDate)}</span>
                  <M3StatusPill label={ctx.registration.status} tone={ctx.registration.status === "ACTIVE" ? "success" : "neutral"} />
                </div>
              </div>
              <ExpressiveButton
                variant="text"
                className="mt-3 -ml-2"
                onClick={() => onNavigate("stu-my-routes")}
              >
                Quản lý tuyến <ArrowRight className="size-4" />
              </ExpressiveButton>
            </ExpressiveCard>
          </ScrollReveal>
        )}

        {activeTicket && (
          <ScrollReveal delay={0.25}>
            <ExpressiveCard variant="elevated" className="p-5 h-full min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold">Vé tháng đang dùng</h3>
                <M3StatusPill label={activeTicket.status} tone={activeTicket.status === "ACTIVE" ? "success" : "warning"} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <QrCode className="size-4 text-primary" />
                  <span className="font-medium">{activeTicket.routeName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <Calendar className="size-3.5" />
                  <span>
                    Hiệu lực: {formatDate(activeTicket.validFrom)} → {formatDate(activeTicket.expiresAt || activeTicket.expiresOn)}
                  </span>
                </div>
                {activeTicket.finalFareAmount != null && (
                  <div className="flex items-center gap-2 text-xs">
                    <Wallet className="size-3.5" />
                    <span className="font-bold text-primary">{formatVND(activeTicket.finalFareAmount)}</span>
                    {activeTicket.subsidyAmount != null && activeTicket.subsidyAmount > 0 && (
                      <span className="text-xs text-success">
                        (trợ giá {formatVND(activeTicket.subsidyAmount)})
                      </span>
                    )}
                  </div>
                )}
              </div>
              <ExpressiveButton
                variant="text"
                className="mt-3 -ml-2"
                onClick={() => onNavigate("stu-my-ticket")}
              >
                Xem vé của tôi <ArrowRight className="size-4" />
              </ExpressiveButton>
            </ExpressiveCard>
          </ScrollReveal>
        )}
      </div>

      {/* Recent notifications + history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal delay={0.3}>
          <Section title="Thông báo mới" actions={<button onClick={() => onNavigate("stu-stops")} className="text-xs font-bold text-primary">Xem tất cả</button>}>
            {ctx.notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="size-7" />}
                title="Chưa có thông báo"
                description="Các thông báo về chuyến xe, thanh toán sẽ xuất hiện tại đây."
              />
            ) : (
              <div className="space-y-2">
                {ctx.notifications.slice(0, 4).map((n: any) => (
                  <NotificationRow key={n.id} notification={n} />
                ))}
              </div>
            )}
          </Section>
        </ScrollReveal>

        <ScrollReveal delay={0.35}>
          <Section title="Lịch sử chuyến đi" actions={<button onClick={() => onNavigate("stu-history")} className="text-xs font-bold text-primary">Xem tất cả</button>}>
            {ctx.tripsHistory.length === 0 ? (
              <EmptyState
                icon={<History className="size-7" />}
                title="Chưa có chuyến nào"
                description="Lịch sử các chuyến đi sẽ hiển thị tại đây sau khi bạn dùng vé."
              />
            ) : (
              <div className="space-y-2">
                {ctx.tripsHistory.slice(0, 4).map((h: any) => (
                  <HistoryRow key={h.id} history={h} routes={ctx.routes} />
                ))}
              </div>
            )}
          </Section>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold opacity-70 uppercase tracking-wide truncate">{label}</p>
      <p className="text-sm sm:text-base font-bold truncate">{value}</p>
    </div>
  );
}

function NotificationRow({ notification }: { notification: any }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl border-l-4 min-w-0",
        notification.read
          ? "bg-surface-container-low border-outline-variant"
          : "bg-primary-container/20 border-primary"
      )}
    >
      <div className={cn("size-8 shrink-0 rounded-lg flex items-center justify-center", notification.read ? "bg-surface-container-high" : "bg-primary-container")}>
        <Bell className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{notification.title}</p>
        <p className="text-xs text-on-surface-variant line-clamp-2">{notification.body}</p>
        <p className="text-[10px] text-on-surface-variant mt-1">{formatDateTime(notification.createdAt)}</p>
      </div>
    </div>
  );
}

function HistoryRow({ history, routes }: { history: any; routes: any[] }) {
  const route = routes.find((r) => r.id === String(history.routeId));
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low min-w-0">
      <div
        className="size-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs"
        style={{ backgroundColor: route?.color || "#14b8a6", color: "#14140f" }}
      >
        {route?.code?.slice(0, 2) || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{history.routeName || route?.name}</p>
        <p className="text-xs text-on-surface-variant truncate">
          {history.boardingStopName || "?"} → {history.alightingStopName || "?"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-on-surface-variant">{formatDate(history.boardedAt || history.serviceDate)}</p>
        <CheckCircle2 className="size-4 text-success ml-auto" />
      </div>
    </div>
  );
}

// Placeholder for Bell icon (already imported at top, but use it directly)
import { Bell } from "lucide-react";

// =============================================================================
// Screen 2: University linkage
// =============================================================================
function UniversityScreen({ ctx }: { ctx: Ctx }) {
  const u = ctx.university;
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Trường của tôi"
        description="Liên kết tài khoản với trường đại học để nhận trợ giá vé."
        icon={<School className="size-7" />}
      />
      {!u || !u.universityName ? (
        <EmptyState
          icon={<School className="size-7" />}
          title="Chưa liên kết trường"
          description="Đăng ký xác thực sinh viên để liên kết với trường đại học của bạn."
          action={<ExpressiveButton variant="filled"><ShieldCheck className="size-4" />Xác thực ngay</ExpressiveButton>}
        />
      ) : (
        <StaggerGroup className="space-y-4 min-w-0">
          <StaggerItem>
            <ExpressiveCard variant="elevated" className="p-6 min-w-0">
              <div className="flex items-start gap-4 min-w-0">
                <div className="size-16 shrink-0 rounded-2xl bg-[#beff50] text-[#14140f] flex items-center justify-center text-2xl font-black">
                  {(u.shortName || u.universityName || "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{u.universityName}</h2>
                  <p className="text-sm text-on-surface-variant mt-1">Mã sinh viên: <span className="font-bold text-on-surface">{u.studentCode || "—"}</span></p>
                  <div className="flex items-center gap-2 mt-2">
                    <M3StatusPill label={u.linkStatus || "LINKED"} tone="success" />
                    <M3StatusPill label={u.rosterStatus || "ACTIVE"} tone="primary" />
                  </div>
                </div>
              </div>
            </ExpressiveCard>
          </StaggerItem>

          <StaggerItem>
            <ExpressiveCard variant="filled" className="p-5 min-w-0">
              <h3 className="text-base font-bold mb-3">Domain xác thực</h3>
              {u.domainHint ? (
                <p className="text-sm">
                  Email trường: <span className="font-mono font-bold text-primary">@{u.domainHint}</span>
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant">Chưa có thông tin domain</p>
              )}
            </ExpressiveCard>
          </StaggerItem>

          <StaggerItem>
            <ExpressiveCard variant="filled" className="p-5 min-w-0">
              <h3 className="text-base font-bold mb-3">Trạng thái xác thực</h3>
              <M3StatusPill
                label={u.studentVerificationStatus || ctx.user.verificationStatus || "UNKNOWN"}
                tone={
                  (u.studentVerificationStatus || ctx.user.verificationStatus) === "VERIFIED"
                    ? "success"
                    : (u.studentVerificationStatus || ctx.user.verificationStatus) === "PENDING"
                    ? "warning"
                    : "error"
                }
              />
            </ExpressiveCard>
          </StaggerItem>
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 3: Stops — list of bus stops with route info
// =============================================================================
function StopsScreen({ ctx }: { ctx: Ctx }) {
  const [search, setSearch] = useState("");
  const filtered = ctx.stops.filter(
    (s: any) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Trạm dừng"
        description={`${ctx.stops.length} trạm trên toàn mạng lưới Đà Nẵng`}
        icon={<MapPin className="size-7" />}
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
            <Input
              placeholder="Tìm trạm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-7" />}
          title="Không tìm thấy trạm"
          description="Thử từ khóa khác hoặc xóa bộ lọc."
        />
      ) : (
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
          {filtered.map((s: any) => (
            <StaggerItem key={s.id}>
              <ExpressiveCard variant="elevated" interactive className="p-4 h-full min-w-0">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn("size-10 shrink-0 rounded-xl flex items-center justify-center", s.hasShelter ? "bg-primary-container text-on-primary-container" : "bg-surface-container-high text-on-surface-variant")}>
                    <MapPin className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-bold">{s.code}</Badge>
                      {s.hasShelter && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success">
                          <ShieldCheck className="size-3" /> Có mái che
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold leading-tight truncate">{s.name}</p>
                    {s.address && <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{s.address}</p>}
                    {s.routes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.routes.slice(0, 3).map((rId: string) => {
                          const r = ctx.routes.find((x) => x.id === rId);
                          return r ? <RouteCodeBadge key={rId} route={r} /> : null;
                        })}
                        {s.routes.length > 3 && (
                          <span className="text-[10px] font-bold text-on-surface-variant">+{s.routes.length - 3}</span>
                        )}
                      </div>
                    )}
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
// Screen 4: Find routes — search boarding → alighting
// =============================================================================
function FindRoutesScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const [boardingId, setBoardingId] = useState<string>("");
  const [alightingId, setAlightingId] = useState<string>("");
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!boardingId || !alightingId) {
      toast.error("Vui lòng chọn trạm lên và trạm xuống");
      return;
    }
    if (boardingId === alightingId) {
      toast.error("Trạm lên và trạm xuống phải khác nhau");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await transportApi.searchRoutes(boardingId, alightingId);
      setResults(r);
      if (r.length === 0) toast.info("Không tìm thấy tuyến trực tiếp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tìm tuyến");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Tìm tuyến xe"
        description="Chọn trạm lên và trạm xuống để tìm tuyến phù hợp."
        icon={<RouteIcon className="size-7" />}
      />

      <ScrollReveal>
        <ExpressiveCard variant="elevated" className="p-5 sm:p-6 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end min-w-0">
            <div>
              <Label className="text-xs font-bold">Trạm lên</Label>
              <Select value={boardingId} onValueChange={setBoardingId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn trạm lên" /></SelectTrigger>
                <SelectContent>
                  {ctx.stops.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="hidden md:flex items-center justify-center pb-2">
              <button
                onClick={() => { setBoardingId(alightingId); setAlightingId(boardingId); }}
                className="size-9 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-primary-container"
                title="Đảo chiều"
              >
                <ArrowLeftRight className="size-4" />
              </button>
            </div>
            <div>
              <Label className="text-xs font-bold">Trạm xuống</Label>
              <Select value={alightingId} onValueChange={setAlightingId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn trạm xuống" /></SelectTrigger>
                <SelectContent>
                  {ctx.stops.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ExpressiveButton variant="filled" onClick={search} disabled={loading}>
              {loading ? <RefreshCw className="size-4 animate-spin" /> : <Search className="size-4" />}
              Tìm
            </ExpressiveButton>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {error && <ErrorScreen message={error} onRetry={search} />}

      {results && results.length > 0 && (
        <ScrollReveal delay={0.1}>
          <Section title={`${results.length} tuyến phù hợp`}>
            <StaggerGroup className="space-y-3 min-w-0">
              {results.map((r) => {
                const route = ctx.routes.find((x) => x.id === String(r.routeId)) || r;
                return (
                  <StaggerItem key={r.routeId}>
                    <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className="size-12 shrink-0 rounded-2xl flex items-center justify-center font-black"
                          style={{ backgroundColor: r.colorHex || route.color || "#14b8a6", color: "#14140f" }}
                        >
                          {r.routeCode?.slice(0, 2) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold truncate">{r.routeName}</h3>
                            {r.universityLinked && <UniRouteChip active />}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-on-surface-variant">Khoảng cách</p>
                              <p className="font-bold">{r.distanceKm ? `${r.distanceKm} km` : "—"}</p>
                            </div>
                            <div>
                              <p className="text-on-surface-variant">Thời gian</p>
                              <p className="font-bold">{r.estimatedMinutes ? `${r.estimatedMinutes} phút` : "—"}</p>
                            </div>
                            <div>
                              <p className="text-on-surface-variant">Tần suất</p>
                              <p className="font-bold">{r.frequencyMin ? `${r.frequencyMin} phút` : "—"}</p>
                            </div>
                            <div>
                              <p className="text-on-surface-variant">Giá vé</p>
                              <p className="font-bold text-primary">{r.singleFare ? formatVND(r.singleFare) : "—"}</p>
                            </div>
                          </div>
                          {r.monthlyFare && (
                            <div className="mt-3 inline-flex items-center gap-2 text-xs bg-primary-container text-on-primary-container px-3 py-1.5 rounded-full">
                              <Wallet className="size-3.5" />
                              Vé tháng: <span className="font-bold">{formatVND(r.monthlyFare)}</span>
                            </div>
                          )}
                        </div>
                        <ExpressiveButton
                          variant="filled"
                          size="sm"
                          onClick={() => onNavigate("stu-my-routes")}
                        >
                          Đăng ký
                        </ExpressiveButton>
                      </div>
                    </ExpressiveCard>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </Section>
        </ScrollReveal>
      )}

      {results && results.length === 0 && !loading && (
        <EmptyState
          icon={<RouteIcon className="size-7" />}
          title="Không có tuyến trực tiếp"
          description="Không tìm thấy tuyến đi thẳng từ trạm lên đến trạm xuống. Hãy thử trạm khác."
        />
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 5: Tracking — live map + ETA
// =============================================================================
function TrackingScreen({ ctx }: { ctx: Ctx }) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(ctx.routes[0]?.id || "");
  const [eta, setEta] = useState<EtaDTO[] | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedRoute = ctx.routes.find((r) => r.id === selectedRouteId);
  const routeStops = ctx.stops.filter((s: any) => selectedRoute?.stops?.includes(s.id));

  const loadEta = useCallback(async () => {
    if (!selectedRouteId || !routeStops.length) return;
    setLoading(true);
    try {
      const firstStopId = routeStops[0].id;
      const e = await transportApi.eta(selectedRouteId, firstStopId);
      setEta(e);
    } catch {
      setEta(null);
    } finally {
      setLoading(false);
    }
  }, [selectedRouteId, routeStops]);

  useEffect(() => {
    loadEta();
    const interval = setInterval(loadEta, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [loadEta]);

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Theo dõi xe"
        description="Vị trí xe và thời gian đến trạm theo thời gian thực."
        icon={<Navigation className="size-7" />}
        actions={
          <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Chọn tuyến" /></SelectTrigger>
            <SelectContent>
              {ctx.routes.map((r: any) => (
                <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {selectedRoute && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 min-w-0">
          {/* Map */}
          <ScrollReveal>
            <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0 h-[400px] lg:h-[500px]">
              <RealMap
                stops={routeStops}
                route={selectedRoute}
                progress={0.3}
                nextStopIndex={0}
              />
            </ExpressiveCard>
          </ScrollReveal>

          {/* ETA list */}
          <ScrollReveal delay={0.1}>
            <ExpressiveCard variant="filled" className="p-5 h-full min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">Thời gian đến trạm</h3>
                <button onClick={loadEta} className="text-on-surface-variant hover:text-primary">
                  <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                </button>
              </div>
              <VerticalTimeline
                stops={routeStops.map((s: any, i: number) => ({ ...s, stopName: s.name, minutesFromPreviousStop: i === 0 ? 0 : 5 }))}
                currentIndex={0}
              />
              {eta && eta.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-[#beff50]/20 border-2 border-[#beff50]">
                  <p className="text-xs font-bold text-on-surface">XE ĐANG ĐẾN</p>
                  <p className="text-lg font-black text-primary mt-1">
                    {eta[0].estimatedArrivalAt
                      ? new Date(eta[0].estimatedArrivalAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                      : "Đang tính..."}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    Cập nhật: {formatDateTime(eta[0].updatedAt)}
                  </p>
                </div>
              )}
            </ExpressiveCard>
          </ScrollReveal>
        </div>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 6: My Routes — registration management
// =============================================================================
function MyRoutesScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const [showRegister, setShowRegister] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [working, setWorking] = useState(false);

  const reg = ctx.registration;
  const regRoute = reg ? ctx.routes.find((r) => r.id === String(reg.routeId)) : null;

  const doCancel = async () => {
    if (!reg) return;
    setWorking(true);
    try {
      await studentApi.cancelRegistration(reg.registrationId, cancelReason || undefined);
      toast.success("Đã hủy đăng ký tuyến");
      ctx.reload();
      setCancelling(false);
      setCancelReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể hủy đăng ký");
    } finally {
      setWorking(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Tuyến của tôi"
        description="Quản lý tuyến đã đăng ký và thay đổi trạm lên/xuống."
        icon={<TicketCheck className="size-7" />}
        actions={
          !reg && (
            <ExpressiveButton variant="filled" onClick={() => setShowRegister(true)}>
              <Plus className="size-4" />
              Đăng ký tuyến
            </ExpressiveButton>
          )
        }
      />

      {!reg ? (
        <EmptyState
          icon={<TicketCheck className="size-7" />}
          title="Chưa đăng ký tuyến nào"
          description="Đăng ký tuyến để sử dụng vé tháng và nhận trợ giá từ trường."
          action={
            <ExpressiveButton variant="filled" onClick={() => setShowRegister(true)}>
              <Plus className="size-4" />
              Đăng ký tuyến đầu tiên
            </ExpressiveButton>
          }
        />
      ) : (
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-6 min-w-0">
            <div className="flex items-start gap-4 min-w-0">
              {regRoute && (
                <div
                  className="size-16 shrink-0 rounded-2xl flex items-center justify-center font-black text-xl"
                  style={{ backgroundColor: regRoute.color, color: "#14140f" }}
                >
                  {regRoute.code?.slice(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h2 className="text-xl font-bold truncate">{reg!.routeName}</h2>
                  <M3StatusPill label={reg!.status} tone={reg!.status === "ACTIVE" ? "success" : "warning"} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface-variant">Trạm lên</p>
                      <p className="font-bold truncate">{reg!.boardingStopName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-error mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface-variant">Trạm xuống</p>
                      <p className="font-bold truncate">{reg!.alightingStopName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-on-surface-variant" />
                    <span className="text-xs">Hiệu lực: <span className="font-bold">{formatDate(reg!.effectiveDate)}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-on-surface-variant" />
                    <span className="text-xs">Đăng ký: <span className="font-bold">{formatDate(reg!.registeredAt)}</span></span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <ExpressiveButton variant="tonal" size="sm" onClick={() => onNavigate("stu-payment")}>
                    <CreditCard className="size-4" />
                    Mua vé tháng
                  </ExpressiveButton>
                  <ExpressiveButton
                    variant="outlined"
                    size="sm"
                    onClick={() => setCancelling(true)}
                  >
                    <Trash2 className="size-4" />
                    Hủy đăng ký
                  </ExpressiveButton>
                </div>
              </div>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      )}

      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <RegisterRouteDialog
          ctx={ctx}
          onClose={() => setShowRegister(false)}
          onRegistered={() => {
            setShowRegister(false);
            ctx.reload();
          }}
        />
      </Dialog>

      <AlertDialog open={cancelling} onOpenChange={setCancelling}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy đăng ký tuyến?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sẽ không thể sử dụng vé tháng đã mua cho tuyến này sau khi hủy. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-xs">Lý do hủy (tùy chọn)</Label>
            <Textarea
              className="mt-1.5"
              placeholder="Nhập lý do hủy đăng ký..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Giữ lại</AlertDialogCancel>
            <AlertDialogAction
              onClick={doCancel}
              disabled={working}
              className="bg-error text-on-error hover:bg-error/90"
            >
              {working ? <RefreshCw className="size-4 animate-spin" /> : null}
              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}

function RegisterRouteDialog({
  ctx,
  onClose,
  onRegistered,
}: {
  ctx: Ctx;
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [routeId, setRouteId] = useState<string>("");
  const [boardingStopId, setBoardingStopId] = useState<string>("");
  const [alightingStopId, setAlightingStopId] = useState<string>("");
  const [working, setWorking] = useState(false);

  const selectedRoute = ctx.routes.find((r) => r.id === routeId);
  const routeStops = ctx.stops.filter((s: any) => selectedRoute?.stops?.includes(s.id));

  const submit = async () => {
    if (!routeId || !boardingStopId || !alightingStopId) {
      toast.error("Vui lòng chọn đầy đủ thông tin");
      return;
    }
    setWorking(true);
    try {
      await studentApi.registerRoute({
        routeId: Number(routeId),
        boardingStopId: Number(boardingStopId),
        alightingStopId: Number(alightingStopId),
      });
      toast.success("Đăng ký tuyến thành công!");
      onRegistered();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể đăng ký tuyến");
    } finally {
      setWorking(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Đăng ký tuyến mới</DialogTitle>
        <DialogDescription>
          Chọn tuyến và trạm lên/xuống. Bạn có thể thay đổi sau nếu cần.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div>
          <Label className="text-xs font-bold">Tuyến xe</Label>
          <Select value={routeId} onValueChange={(v) => { setRouteId(v); setBoardingStopId(""); setAlightingStopId(""); }}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn tuyến" /></SelectTrigger>
            <SelectContent>
              {ctx.routes.map((r: any) => (
                <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {routeId && (
          <>
            <div>
              <Label className="text-xs font-bold">Trạm lên</Label>
              <Select value={boardingStopId} onValueChange={setBoardingStopId} disabled={!routeStops.length}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn trạm lên" /></SelectTrigger>
                <SelectContent>
                  {routeStops.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold">Trạm xuống</Label>
              <Select value={alightingStopId} onValueChange={setAlightingStopId} disabled={!routeStops.length}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn trạm xuống" /></SelectTrigger>
                <SelectContent>
                  {routeStops.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {boardingStopId && alightingStopId && boardingStopId === alightingStopId && (
              <p className="text-xs font-bold text-error">Trạm lên và trạm xuống phải khác nhau</p>
            )}
          </>
        )}
      </div>
      <DialogFooter>
        <ExpressiveButton variant="text" onClick={onClose} disabled={working}>Hủy</ExpressiveButton>
        <ExpressiveButton variant="filled" onClick={submit} disabled={working}>
          {working ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Đăng ký
        </ExpressiveButton>
      </DialogFooter>
    </DialogContent>
  );
}

// =============================================================================
// Screen 7: My Ticket — QR code + ticket details
// =============================================================================
function MyTicketScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const t = ctx.activeTicket;
  const [expanded, setExpanded] = useState(false);

  if (!t) {
    return (
      <PageTransition>
        <PageHeader title="Vé của tôi" icon={<QrCode className="size-7" />} />
        <EmptyState
          icon={<QrCode className="size-7" />}
          title="Chưa có vé tháng"
          description="Mua vé tháng để sử dụng dịch vụ xe buýt không giới hạn trong 30 ngày."
          action={<ExpressiveButton variant="filled" onClick={() => onNavigate("stu-payment")}>
            <CreditCard className="size-4" /> Mua vé tháng
          </ExpressiveButton>}
        />
      </PageTransition>
    );
  }

  const route = ctx.routes.find((r) => r.id === String(t.routeId));

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader title="Vé của tôi" icon={<QrCode className="size-7" />} />

      <ScrollReveal>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative overflow-hidden rounded-3xl elev-2 min-w-0"
          style={{ backgroundColor: route?.color || "#beff50", color: "#14140f" }}
        >
          {/* decorative dark blobs */}
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-8 size-40 rounded-full bg-[#144fcc]/10 blur-3xl pointer-events-none" />

          <div className="relative p-6 sm:p-8 min-w-0">
            <div className="flex items-start justify-between mb-6 min-w-0">
              <div className="min-w-0">
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Vé tháng</p>
                <h2 className="text-2xl sm:text-3xl font-black mt-1 truncate">{t.routeName}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold items-center">
                    {t.routeCode || route?.code || "UNIBUS"}
                  </span>
                  <M3StatusPill label={t.status} tone={t.status === "ACTIVE" ? "success" : "warning"} />
                </div>
              </div>
              {t.qrCode && (
                <motion.button
                  onClick={() => setExpanded((v) => !v)}
                  className="bg-white p-2 rounded-xl shadow-lg shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <QRCodeCanvas value={t.qrCode} size={expanded ? 160 : 80} level="H" />
                </motion.button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold opacity-70 uppercase">Trạm lên</p>
                <p className="font-bold truncate">{t.boardingStopName || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold opacity-70 uppercase">Trạm xuống</p>
                <p className="font-bold truncate">{t.alightingStopName || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold opacity-70 uppercase">Hiệu lực từ</p>
                <p className="font-bold">{formatDate(t.validFrom)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold opacity-70 uppercase">Hết hạn</p>
                <p className="font-bold">{formatDate(t.expiresAt || t.expiresOn)}</p>
              </div>
            </div>

            {t.finalFareAmount != null && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="bg-[#14140f] text-[#beff50] px-4 py-2 rounded-full text-sm font-black">
                  {formatVND(t.finalFareAmount)}
                </div>
                {t.subsidyAmount != null && t.subsidyAmount > 0 && (
                  <div className="text-xs font-bold">
                    <span className="line-through opacity-60">{formatVND(t.originalFareAmount || 0)}</span>
                    {" → "}
                    <span className="text-success">-{formatVND(t.subsidyAmount)} trợ giá</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </ScrollReveal>

      <Section title="Hướng dẫn sử dụng">
        <ExpressiveCard variant="filled" className="p-5 space-y-2 text-sm">
          <p className="flex items-start gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />Mã QR được sử dụng để kiểm tra vé khi lên xe.</p>
          <p className="flex items-start gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />Vé tháng có hiệu lực trong 30 ngày kể từ ngày mua.</p>
          <p className="flex items-start gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />Có thể đi không giới hạn số chuyến trong tuyến đã đăng ký.</p>
          <p className="flex items-start gap-2"><Info className="size-4 text-primary mt-0.5 shrink-0" />Nếu gặp lỗi quét mã, vui lòng liên hệ điều phối viên.</p>
        </ExpressiveCard>
      </Section>
    </PageTransition>
  );
}

// =============================================================================
// Screen 8: History — travel history list
// =============================================================================
function HistoryScreen({ ctx }: { ctx: Ctx }) {
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lịch sử chuyến đi"
        description={`${ctx.tripsHistory.length} chuyến đã đi`}
        icon={<History className="size-7" />}
      />
      {ctx.tripsHistory.length === 0 ? (
        <EmptyState
          icon={<History className="size-7" />}
          title="Chưa có chuyến đi nào"
          description="Lịch sử sẽ hiển thị tại đây sau khi bạn dùng vé tháng để đi xe."
        />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {ctx.tripsHistory.map((h: any) => (
            <StaggerItem key={h.id}>
              <HistoryRow history={h} routes={ctx.routes} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 9: AI Route Suggestions
// =============================================================================
function AIScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const [preference, setPreference] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>(ctx.suggestions);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/students/me/route-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : data?.data || []);
      } else {
        setSuggestions(ctx.suggestions);
      }
    } catch {
      setSuggestions(ctx.suggestions);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="AI gợi ý tuyến xe"
        description="Hệ thống đề xuất tuyến phù hợp dựa trên vị trí trường và lịch sử đi lại."
        icon={<Sparkles className="size-7" />}
      />

      <ScrollReveal>
        <ExpressiveCard variant="elevated" className="p-5 min-w-0">
          <Label className="text-xs font-bold">Sở thích của bạn (tùy chọn)</Label>
          <div className="flex gap-2 mt-2 min-w-0">
            <Input
              placeholder="VD: ít chuyển tuyến, gần trường, rẻ nhất..."
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchSuggestions()}
              className="flex-1 min-w-0"
            />
            <ExpressiveButton variant="filled" onClick={fetchSuggestions} disabled={loading}>
              {loading ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Gợi ý
            </ExpressiveButton>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {suggestions.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-7" />}
          title="Chưa có gợi ý"
          description="Nhập sở thích và nhấn Gợi ý để nhận tuyến phù hợp."
        />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {suggestions.map((r: any, i: number) => {
            const route = ctx.routes.find((x) => x.id === String(r.routeId)) || r;
            return (
              <StaggerItem key={r.routeId || i}>
                <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className="size-12 rounded-2xl flex items-center justify-center font-black"
                        style={{ backgroundColor: r.colorHex || route.color || "#14b8a6", color: "#14140f" }}
                      >
                        {r.routeCode?.slice(0, 2) || "?"}
                      </div>
                      {i === 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#beff50] text-[#14140f] text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white">
                          TOP
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold truncate">{r.routeName}</h3>
                        {r.universityLinked && <UniRouteChip active />}
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {r.distanceKm ? `${r.distanceKm}km` : ""} •{" "}
                        {r.estimatedMinutes ? `${r.estimatedMinutes} phút` : ""} •{" "}
                        {r.frequencyMin ? `mỗi ${r.frequencyMin} phút` : ""}
                      </p>
                      {r.monthlyFare && (
                        <p className="text-sm font-bold text-primary mt-1">
                          Vé tháng: {formatVND(r.monthlyFare)}
                        </p>
                      )}
                    </div>
                    <ExpressiveButton variant="tonal" size="sm" onClick={() => onNavigate("stu-my-routes")}>
                      Đăng ký <ArrowRight className="size-4" />
                    </ExpressiveButton>
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
// Screen 10: Chatbot
// =============================================================================
function ChatbotScreen({ ctx }: { ctx: Ctx }) {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string; time: string }[]>([
    {
      role: "bot",
      text: `Xin chào ${ctx.user.name?.split(" ").slice(-1)[0] || "bạn"}! Mình là trợ lý ảo UniBus. Mình có thể giúp bạn tra cứu tuyến, giá vé, lịch xe... Hôm nay bạn cần hỗ trợ gì?`,
      time: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user" as const, text: input.trim(), time: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/students/me/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });
      let botReply = "Mình đã ghi nhận câu hỏi của bạn. Vui lòng đợi nhân viên hỗ trợ phản hồi.";
      if (res.ok) {
        const data = await res.json();
        if (data?.reply) botReply = data.reply;
        else if (data?.data?.reply) botReply = data.data.reply;
      }
      setMessages((m) => [...m, { role: "bot", text: botReply, time: new Date().toISOString() }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Xin lỗi, mình không thể trả lời lúc này. Vui lòng thử lại sau.", time: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Chatbot tra cứu"
        description="Trò chuyện với trợ lý ảo để được hỗ trợ nhanh."
        icon={<Bot className="size-7" />}
      />
      <ExpressiveCard variant="elevated" className="flex flex-col h-[60vh] min-h-[400px] min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 min-w-0">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-2 max-w-[85%] min-w-0", m.role === "user" && "ml-auto flex-row-reverse")}
            >
              <div
                className={cn(
                  "size-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                  m.role === "user" ? "bg-primary text-on-primary" : "bg-[#beff50] text-[#14140f]"
                )}
              >
                {m.role === "user" ? "M" : <Bot className="size-4" />}
              </div>
              <div
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm break-words min-w-0",
                  m.role === "user"
                    ? "bg-primary text-on-primary rounded-tr-sm"
                    : "bg-surface-container-high text-on-surface rounded-tl-sm"
                )}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="size-8 shrink-0 rounded-full bg-[#beff50] text-[#14140f] flex items-center justify-center">
                <Bot className="size-4" />
              </div>
              <div className="bg-surface-container-high px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-2 rounded-full bg-on-surface-variant"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t-2 border-outline-variant flex gap-2 min-w-0">
          <Input
            placeholder="Nhập câu hỏi..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
            className="flex-1 min-w-0"
          />
          <ExpressiveButton variant="filled" size="icon" onClick={send} disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </ExpressiveButton>
        </div>
      </ExpressiveCard>
    </PageTransition>
  );
}

// =============================================================================
// Screen 11: Payment — buy monthly pass (SePay QR)
// =============================================================================
function PaymentScreen({ ctx }: { ctx: Ctx }) {
  const [purchasing, setPurchasing] = useState(false);
  const [sepayOrder, setSepayOrder] = useState<{ orderId: number; qrUrl: string; amount: number; description: string } | null>(null);
  const [paidStatus, setPaidStatus] = useState<"idle" | "checking" | "paid" | "expired">("idle");

  const passes = ctx.raw.passes?.data;
  const quote = passes?.monthlyPassQuote;

  const buy = async () => {
    setPurchasing(true);
    try {
      const order = await studentApi.createSePayOrder("MONTHLY");
      setSepayOrder(order);
      setPaidStatus("idle");
      toast.success("Đã tạo đơn hàng. Vui lòng quét mã QR để thanh toán.");
      // Poll for payment status
      const poll = async () => {
        for (let i = 0; i < 60; i++) {
          try {
            const s = await studentApi.getSePayOrderStatus(order.orderId);
            if (s.paid) {
              setPaidStatus("paid");
              toast.success("Thanh toán thành công! Vé tháng đã được kích hoạt.");
              ctx.reload();
              return;
            }
          } catch { /* ignore */ }
          await new Promise((r) => setTimeout(r, 5000));
        }
        setPaidStatus("expired");
      };
      poll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể tạo đơn thanh toán");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Mua vé tháng"
        description="Thanh toán qua SePay để nhận vé tháng không giới hạn chuyến."
        icon={<CreditCard className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-6 h-full min-w-0">
            <h3 className="text-lg font-bold mb-4">Chi tiết vé tháng</h3>
            {ctx.registration ? (
              <div className="space-y-3 text-sm">
                <Row label="Tuyến" value={ctx.registration.routeName} icon={<RouteIcon className="size-4" />} />
                <Row label="Trạm lên" value={ctx.registration.boardingStopName} icon={<MapPin className="size-4" />} />
                <Row label="Trạm xuống" value={ctx.registration.alightingStopName} icon={<MapPin className="size-4" />} />
                <Row label="Hiệu lực" value="30 ngày" icon={<Calendar className="size-4" />} />
                {quote && (
                  <>
                    <div className="h-px bg-outline-variant my-2" />
                    <Row label="Giá gốc" value={formatVND(quote.originalFareAmount || quote.baseAmount || 0)} muted />
                    {quote.subsidyAmount != null && quote.subsidyAmount > 0 && (
                      <Row label="Trợ giá trường" value={`-${formatVND(quote.subsidyAmount)}`} accent="success" />
                    )}
                    <div className="flex items-center justify-between pt-2 border-t-2 border-outline-variant">
                      <span className="text-sm font-bold">Tổng thanh toán</span>
                      <span className="text-2xl font-black text-primary">
                        {formatVND(quote.payableAmount || quote.finalFareAmount || 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<TicketCheck className="size-7" />}
                title="Chưa đăng ký tuyến"
                description="Vui lòng đăng ký tuyến trước khi mua vé tháng."
              />
            )}
            {ctx.registration && (
              <ExpressiveButton
                variant="filled"
                className="w-full mt-5"
                onClick={buy}
                disabled={purchasing || paidStatus === "paid"}
              >
                {purchasing ? <RefreshCw className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                {paidStatus === "paid" ? "Đã thanh toán" : "Thanh toán qua SePay"}
              </ExpressiveButton>
            )}
          </ExpressiveCard>
        </ScrollReveal>

        {sepayOrder && (
          <ScrollReveal delay={0.1}>
            <ExpressiveCard variant="elevated" className="p-6 h-full min-w-0">
              <h3 className="text-lg font-bold mb-4">Quét mã QR để thanh toán</h3>
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-lg">
                  <QRCodeCanvas value={sepayOrder.qrUrl} size={200} level="M" />
                </div>
                <p className="text-sm font-bold">{formatVND(sepayOrder.amount)}</p>
                <p className="text-xs text-on-surface-variant text-center break-all">{sepayOrder.description}</p>
                {paidStatus === "checking" && (
                  <p className="text-xs text-primary flex items-center gap-2">
                    <RefreshCw className="size-3 animate-spin" />
                    Đang chờ xác nhận thanh toán...
                  </p>
                )}
                {paidStatus === "paid" && (
                  <div className="flex items-center gap-2 text-success font-bold">
                    <CheckCircle2 className="size-5" /> Đã thanh toán thành công!
                  </div>
                )}
                {paidStatus === "expired" && (
                  <div className="text-error font-bold text-sm">
                    <AlertTriangle className="size-4 inline mr-1" />
                    Đơn hàng hết hạn. Vui lòng tạo lại.
                  </div>
                )}
              </div>
            </ExpressiveCard>
          </ScrollReveal>
        )}
      </div>
    </PageTransition>
  );
}

function Row({
  label,
  value,
  icon,
  muted,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  muted?: boolean;
  accent?: "success" | "error" | "primary";
}) {
  const accentClass = accent === "success" ? "text-success" : accent === "error" ? "text-error" : accent === "primary" ? "text-primary" : "";
  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <span className={cn("flex items-center gap-2 text-on-surface-variant", muted && "opacity-60")}>
        {icon}
        {label}
      </span>
      <span className={cn("font-bold truncate", accentClass)}>{value}</span>
    </div>
  );
}

// =============================================================================
// Screen 12: Invoices — list of past payments
// =============================================================================
function InvoicesScreen({ ctx }: { ctx: Ctx }) {
  const invoices = ctx.invoices;
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Hóa đơn"
        description={`${invoices.length} giao dịch`}
        icon={<Receipt className="size-7" />}
      />
      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-7" />}
          title="Chưa có hóa đơn"
          description="Các giao dịch mua vé sẽ hiển thị tại đây."
        />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {invoices.map((inv: any) => (
            <StaggerItem key={inv.id}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-10 shrink-0 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                      <Receipt className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{inv.description}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {inv.code} • {formatDate(inv.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">{formatVND(inv.amount)}</p>
                    <M3StatusPill
                      label={inv.status}
                      tone={inv.status === "paid" ? "success" : inv.status === "pending" ? "warning" : "error"}
                    />
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
// Screen 13: Feedback — submit + list
// =============================================================================
function FeedbackScreen({ ctx }: { ctx: Ctx }) {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("service");
  const [content, setContent] = useState("");
  const [routeId, setRouteId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    setSubmitting(true);
    try {
      await feedbackApi.create({
        routeId: routeId ? Number(routeId) : undefined,
        rating,
        category,
        content: content.trim(),
      });
      toast.success("Đã gửi phản hồi. Cảm ơn bạn!");
      setRating(5);
      setContent("");
      setRouteId("");
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể gửi phản hồi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Phản hồi"
        description="Chia sẻ trải nghiệm của bạn để chúng tôi cải thiện dịch vụ."
        icon={<Star className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-5 min-w-0">
            <h3 className="text-base font-bold mb-4">Gửi phản hồi mới</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold">Đánh giá</Label>
                <div className="mt-1.5">
                  <M3StarRating value={rating} onChange={setRating} size="size-7" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold">Danh mục</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Chất lượng dịch vụ</SelectItem>
                    <SelectItem value="driver">Tài xế</SelectItem>
                    <SelectItem value="vehicle">Phương tiện</SelectItem>
                    <SelectItem value="punctuality">Đúng giờ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Tuyến (tùy chọn)</Label>
                <Select value={routeId} onValueChange={setRouteId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn tuyến" /></SelectTrigger>
                  <SelectContent>
                    {ctx.routes.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Nội dung</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder="Mô tả trải nghiệm của bạn..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              </div>
              <ExpressiveButton variant="filled" className="w-full" onClick={submit} disabled={submitting}>
                {submitting ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
                Gửi phản hồi
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Section title={`Phản hồi đã gửi (${ctx.feedback.length})`}>
            {ctx.feedback.length === 0 ? (
              <EmptyState
                icon={<Star className="size-7" />}
                title="Chưa có phản hồi"
                description="Các phản hồi bạn đã gửi sẽ hiển thị tại đây."
              />
            ) : (
              <div className="space-y-3">
                {ctx.feedback.map((f: any) => (
                  <ExpressiveCard key={f.id} variant="filled" className="p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{f.category || "Phản hồi"}</p>
                        <p className="text-xs text-on-surface-variant">{formatDate(f.createdAt)}</p>
                      </div>
                      <M3StarRating value={f.rating} size="size-3" readOnly />
                    </div>
                    <p className="text-sm text-on-surface line-clamp-3">{f.content}</p>
                    {f.response && (
                      <div className="mt-2 p-2 rounded-lg bg-success-container/30 text-xs">
                        <p className="font-bold text-success">Phản hồi từ nhà xe:</p>
                        <p>{f.response}</p>
                      </div>
                    )}
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
// Screen 14: Lost Items — report + list
// =============================================================================
function LostItemsScreen({ ctx }: { ctx: Ctx }) {
  const [description, setDescription] = useState("");
  const [tripId, setTripId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!description.trim()) {
      toast.error("Vui lòng mô tả vật dụng mất");
      return;
    }
    setSubmitting(true);
    try {
      await experienceApi.createStudentLostItem({
        itemDescription: description.trim(),
        tripId: tripId ? Number(tripId) : undefined,
      });
      toast.success("Đã báo mất vật dụng. Chúng tôi sẽ liên hệ khi tìm thấy.");
      setDescription("");
      setTripId("");
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể báo mất");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Đồ thất lạc"
        description="Báo mất vật dụng và theo dõi trạng thái tìm kiếm."
        icon={<PackageSearch className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-5 min-w-0">
            <h3 className="text-base font-bold mb-4">Báo mất vật dụng</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold">Chuyến đi (tùy chọn)</Label>
                <Select value={tripId} onValueChange={setTripId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn chuyến" /></SelectTrigger>
                  <SelectContent>
                    {ctx.tripsHistory.map((h: any) => (
                      <SelectItem key={h.id} value={h.id}>{h.routeName} — {formatDate(h.boardedAt)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Mô tả vật dụng</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder="VD: Balo đen, có laptop Dell, để quên ở ghế hàng ghế đầu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <ExpressiveButton variant="filled" className="w-full" onClick={submit} disabled={submitting}>
                {submitting ? <RefreshCw className="size-4 animate-spin" /> : <PackageSearch className="size-4" />}
                Gửi báo mất
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Section title={`Đã báo (${ctx.lostItems.length})`}>
            {ctx.lostItems.length === 0 ? (
              <EmptyState
                icon={<PackageSearch className="size-7" />}
                title="Chưa báo mất"
                description="Các báo mất sẽ hiển thị tại đây."
              />
            ) : (
              <div className="space-y-3">
                {ctx.lostItems.map((l: any) => (
                  <ExpressiveCard key={l.id} variant="filled" className="p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                      <p className="text-sm font-bold truncate">{l.item}</p>
                      <M3StatusPill
                        label={l.status}
                        tone={
                          l.status === "returned" ? "success" :
                          l.status === "found" ? "primary" :
                          l.status === "closed" ? "neutral" : "warning"
                        }
                      />
                    </div>
                    <p className="text-xs text-on-surface-variant">{formatDate(l.createdAt)}</p>
                    {l.description && l.description !== l.item && (
                      <p className="text-xs mt-1 line-clamp-2">{l.description}</p>
                    )}
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
// Fallback
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
