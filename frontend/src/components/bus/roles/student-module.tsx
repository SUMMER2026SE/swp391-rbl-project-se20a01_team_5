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
  const tripsThisMonth = ctx.tripsHistory.length;

  // Stat cards — perk-style: each card has its own bold color (from prototype)
  const monthlyFare = activeTicket?.finalFareAmount ?? 0;
  const subsidyAmount = activeTicket?.subsidyAmount ?? 0;
  const statCards = [
    { label: "Tuyến đã đăng ký", value: ctx.registration ? 1 : 0, hint: "Đang hoạt động", icon: RouteIcon, bg: "#14140f", fg: "#ffffff", iconBg: "#beff50", iconFg: "#14140f", hintColor: "#beff50" },
    { label: "Chuyến tháng này", value: tripsThisMonth, hint: tripsThisMonth > 0 ? `+${Math.min(2, tripsThisMonth)} so với tháng trước` : "Chưa có chuyến", icon: Bus, bg: "#ff8c5f", fg: "#14140f", iconBg: "#14140f", iconFg: "#ff8c5f", hintColor: "#14140f" },
    { label: "Chi phí tháng", value: monthlyFare, hint: subsidyAmount > 0 ? `Trợ giá ${formatVND(subsidyAmount)}` : "Chưa mua vé", icon: CreditCard, bg: "#144fcc", fg: "#ffffff", iconBg: "#beff50", iconFg: "#14140f", hintColor: "#beff50", isMoney: true },
    { label: "Thông báo mới", value: unread, hint: unread > 0 ? "Chưa đọc" : "Đã đọc hết", icon: Sparkles, bg: "#c8a0ff", fg: "#14140f", iconBg: "#14140f", iconFg: "#c8a0ff", hintColor: "#14140f" },
  ];

  const quickActions = [
    { id: "stu-find", label: "Tìm tuyến xe", icon: RouteIcon, bg: "#144fcc", fg: "#fff", iconBg: "#beff50", iconFg: "#14140f" },
    { id: "stu-tracking", label: "Theo dõi xe", icon: Navigation, bg: "#ff8c5f", fg: "#14140f", iconBg: "#14140f", iconFg: "#ff8c5f" },
    { id: "stu-payment", label: "Mua vé tháng", icon: CreditCard, bg: "#14140f", fg: "#fff", iconBg: "#beff50", iconFg: "#14140f" },
    { id: "stu-ai", label: "AI gợi ý", icon: Sparkles, bg: "#c8a0ff", fg: "#14140f", iconBg: "#14140f", iconFg: "#c8a0ff" },
  ];

  const myRoutes = ctx.registration
    ? ctx.routes.filter((r: any) => r.id === String(ctx.registration?.routeId))
    : [];

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

      {/* Upcoming trip HERO — perk-style: bold lime card, dark text, QR round button */}
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

            <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 min-w-0">
              {/* Left: trip info */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#14140f] text-white text-[11px] font-bold">
                    {activeRoute?.code || "UNIBUS"}
                  </span>
                  <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-[#14140f]/10 text-[11px] font-bold">
                    <motion.span
                      className="size-1.5 rounded-full bg-[#14140f]"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    {nextTrip?.status === "RUNNING" ? "Đang chạy" : "Sắp khởi hành"}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-balance leading-tight">
                  Chuyến sắp tới
                </h3>
                <p className="text-sm sm:text-base font-medium opacity-80 truncate">
                  {activeRoute?.from || ctx.registration?.boardingStopName || "Điểm lên"} → {activeRoute?.to || ctx.registration?.alightingStopName || "Điểm xuống"}
                </p>
                <div className="flex items-center gap-3 sm:gap-4 pt-1 flex-wrap">
                  <HeroMetric label="Khởi hành" value={nextTrip?.departTime || activeRoute?.firstTrip || "Hôm nay"} />
                  <div className="w-px h-8 bg-[#14140f]/20 shrink-0" />
                  <HeroMetric label="Biển số" value={(nextTrip as any)?.licensePlate || "Đang gán"} />
                  <div className="w-px h-8 bg-[#14140f]/20 shrink-0" />
                  <HeroMetric
                    label="Mật độ"
                    value={
                      (nextTrip as any)?.occupancy != null
                        ? `${(nextTrip as any).occupancy}/${(nextTrip as any).seatCount || "?"}`
                        : "Đang cập nhật"
                    }
                  />
                </div>
              </div>

              {/* Right: QR round button + 2 action buttons */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <motion.button
                  onClick={() => setQrExpanded(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="relative flex size-24 items-center justify-center rounded-full bg-[#14140f] elev-3 cursor-pointer"
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#beff50]/40"
                    animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  />
                  <QrCode className="size-10 text-[#beff50]" />
                </motion.button>
                <p className="text-[10px] font-bold text-[#14140f]/60 uppercase tracking-wide">Nhấn xem vé</p>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => onNavigate("stu-tracking")}
                    className="state-layer inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#14140f] text-white text-sm font-bold"
                  >
                    <Navigation className="size-4" />
                    Theo dõi
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => onNavigate("stu-payment")}
                    className="state-layer inline-flex items-center gap-1 h-10 px-4 rounded-full bg-white text-[#14140f] text-sm font-bold border-2 border-[#14140f]"
                  >
                    Mua vé
                    <ArrowRight className="size-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      )}

      {/* Stat cards — perk-style: dark cards with lime/coral/sky/purple accents (like prototype) */}
      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        {statCards.map((s, i) => (
          <StaggerItem key={i}>
            <motion.div
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-2xl p-4 sm:p-5 elev-2 h-full min-w-0"
              style={{ backgroundColor: s.bg, color: s.fg }}
            >
              <div
                className="flex size-10 items-center justify-center rounded-xl mb-3 shrink-0"
                style={{ backgroundColor: s.iconBg, color: s.iconFg }}
              >
                <s.icon className="size-5" />
              </div>
              <p className="text-[11px] font-medium opacity-70 uppercase tracking-wide truncate">{s.label}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums">
                {s.isMoney ? (
                  <Counter to={s.value} format={(n) => formatVND(Math.round(n))} />
                ) : (
                  <Counter to={s.value} />
                )}
              </p>
              <p className="text-[11px] font-bold mt-1 truncate" style={{ color: s.hintColor }}>{s.hint}</p>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      {/* My routes + Quick actions — 2-column layout like prototype */}
      <div className="grid lg:grid-cols-2 gap-6 min-w-0">
        <ScrollReveal>
          <Section title="Tuyến của tôi" description="Đang sử dụng tháng này">
            <ExpressiveCard variant="filled" className="p-2 min-w-0">
              {myRoutes.length === 0 ? (
                <div className="p-6 text-center text-sm text-on-surface-variant min-w-0">
                  Chưa có tuyến nào.{" "}
                  <button className="text-[#144fcc] font-bold underline" onClick={() => onNavigate("stu-find")}>
                    Đăng ký ngay
                  </button>
                </div>
              ) : (
                myRoutes.map((r: any) => (
                  <div
                    key={r.id}
                    className="state-layer flex items-center gap-3 p-3 rounded-xl cursor-pointer min-w-0"
                    onClick={() => onNavigate("stu-my-ticket")}
                  >
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: r.color, color: "#14140f" }}
                    >
                      <Bus className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{r.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{r.from} → {r.to}</p>
                    </div>
                    <ChevronRight className="size-4 text-on-surface-variant shrink-0" />
                  </div>
                ))
              )}
            </ExpressiveCard>
          </Section>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Section title="Truy cập nhanh" description="Lối tắt các tác vụ phổ biến">
            <div className="grid grid-cols-2 gap-2 sm:gap-4 items-stretch min-w-0">
              {quickActions.map((qa) => (
                <motion.button
                  key={qa.id}
                  onClick={() => onNavigate(qa.id)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="state-layer flex flex-col w-full text-left rounded-2xl p-3 sm:p-5 min-w-0 min-h-[100px] sm:min-h-[120px]"
                  style={{ backgroundColor: qa.bg, color: qa.fg }}
                >
                  <div
                    className="flex size-9 sm:size-10 items-center justify-center rounded-xl mb-2 sm:mb-3 shrink-0"
                    style={{ backgroundColor: qa.iconBg, color: qa.iconFg }}
                  >
                    <qa.icon className="size-4 sm:size-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold truncate">{qa.label}</p>
                  <p className="text-[10px] sm:text-[11px] opacity-60 mt-0.5 font-medium truncate">Nhấn để mở →</p>
                </motion.button>
              ))}
            </div>
          </Section>
        </ScrollReveal>
      </div>

      {/* Recent notifications */}
      <ScrollReveal>
        <Section
          title="Thông báo gần đây"
          description="Cập nhật mới nhất từ hệ thống"
          actions={
            <button
              className="state-layer inline-flex items-center gap-1 h-8 px-3 rounded-full text-sm font-bold text-[#14140f] hover:bg-[#14140f]/8"
              onClick={() => onNavigate("stu-stops")}
            >
              Xem tất cả
              <ArrowRight className="size-4" />
            </button>
          }
        >
          <ExpressiveCard variant="filled" className="p-2 max-h-72 overflow-y-auto scrollbar-soft min-w-0">
            {ctx.notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-on-surface-variant min-w-0">
                Chưa có thông báo nào.
              </div>
            ) : (
              ctx.notifications.slice(0, 6).map((n: any) => {
                const Icon = n.type === "success" ? CheckCircle2 : n.type === "warning" ? AlertTriangle : n.type === "danger" ? XCircle : Info;
                const iconColor =
                  n.type === "success" ? "#16a34a" :
                  n.type === "warning" ? "#f59e0b" :
                  n.type === "danger" ? "#dc2626" : "#144fcc";
                return (
                  <div key={n.id} className="state-layer flex items-start gap-3 p-3 rounded-xl min-w-0">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full mt-0.5"
                      style={{ backgroundColor: iconColor + "20", color: iconColor }}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-on-surface truncate">{n.title}</p>
                        {!n.read && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: "#144fcc" }} />}
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-on-surface-variant/70 mt-1">{n.createdAt ? formatDateTime(n.createdAt) : ""}</p>
                    </div>
                  </div>
                );
              })
            )}
          </ExpressiveCard>
        </Section>
      </ScrollReveal>

      {/* QR expand overlay — framer-motion animation (matches prototype) */}
      <AnimatePresence>
        {qrExpanded && activeTicket?.qrCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(20, 20, 15, 0.75)" }}
            onClick={() => setQrExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, borderRadius: "50%" }}
              animate={{ scale: 1, opacity: 1, borderRadius: "24px" }}
              exit={{ scale: 0.5, opacity: 0, borderRadius: "50%" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-[#14140f] text-white rounded-3xl p-5 sm:p-8 max-w-sm w-full min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#beff50] text-[#14140f]">
                    <QrCode className="size-5" />
                  </div>
                  <p className="text-sm font-bold">Vé của tôi</p>
                </div>
                <button
                  onClick={() => setQrExpanded(false)}
                  className="state-layer size-8 rounded-full flex items-center justify-center text-white/60 hover:text-white"
                >
                  <XCircle className="size-5" />
                </button>
              </div>

              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 18 }}
                  className="bg-white rounded-2xl p-4"
                >
                  <QRCodeCanvas value={activeTicket.qrCode} size={200} level="H" />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2 mb-4"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Mã vé</span>
                  <span className="font-bold tabular-nums">#{activeTicket.ticketId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Tuyến</span>
                  <span className="font-bold truncate ml-2">{activeTicket.routeCode || activeTicket.routeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Hiệu lực</span>
                  <span className="font-bold text-[#beff50]">
                    Đến {formatDate(activeTicket.expiresAt || activeTicket.expiresOn)}
                  </span>
                </div>
              </motion.div>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                onClick={() => { setQrExpanded(false); onNavigate("stu-my-ticket"); }}
                className="w-full h-11 rounded-full bg-[#beff50] text-[#14140f] text-sm font-bold flex items-center justify-center gap-2"
              >
                Xem chi tiết vé
                <ArrowRight className="size-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
// Screen 3: Stops — list of bus stops with route info (prototype-aligned)
// =============================================================================
function StopsScreen({ ctx }: { ctx: Ctx }) {
  const [query, setQuery] = useState("");
  const filtered = ctx.stops.filter(
    (s: any) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase()) ||
      s.address.toLowerCase().includes(query.toLowerCase())
  );

  const stopsWithShelter = ctx.stops.filter((s: any) => s.hasShelter).length;

  return (
    <PageTransition className="space-y-5 min-w-0">
      <PageHeader
        title="Trạm dừng"
        description="Tra cứu trạm dừng trên toàn tuyến UniBus."
        icon={<MapPin className="size-6 sm:size-7" />}
      />

      {/* Search bar — large, prototype style */}
      <div className="relative min-w-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#144fcc] pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm trạm theo tên, mã, địa chỉ…"
          className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-[#14140f]/15 text-sm font-semibold text-[#14140f] placeholder:text-[#14140f]/40 placeholder:font-normal focus:border-[#144fcc] focus:outline-none transition-colors dark:bg-surface-container-lowest dark:text-on-surface dark:border-outline-variant"
        />
      </div>

      {/* Stats bar — 3 bold mini-cards (prototype) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 min-w-0">
        <div className="rounded-2xl bg-[#14140f] text-[#beff50] p-3 sm:p-4 text-center min-w-0">
          <p className="text-xl sm:text-2xl font-bold tabular-nums">{ctx.stops.length}</p>
          <p className="text-[10px] sm:text-xs font-bold opacity-70 uppercase truncate">Tổng trạm</p>
        </div>
        <div className="rounded-2xl bg-[#144fcc] text-white p-3 sm:p-4 text-center min-w-0">
          <p className="text-xl sm:text-2xl font-bold tabular-nums">{ctx.routes.length}</p>
          <p className="text-[10px] sm:text-xs font-bold opacity-70 uppercase truncate">Tuyến</p>
        </div>
        <div className="rounded-2xl bg-[#ff8c5f] text-[#14140f] p-3 sm:p-4 text-center min-w-0">
          <p className="text-xl sm:text-2xl font-bold tabular-nums">{stopsWithShelter}</p>
          <p className="text-[10px] sm:text-xs font-bold opacity-70 uppercase truncate">Mái che</p>
        </div>
      </div>

      {/* List of stops — clean list, not grid (better mobile, matches prototype) */}
      <div className="space-y-2 min-w-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<MapPin className="size-7" />}
            title="Không tìm thấy trạm"
            description="Thử từ khóa khác."
          />
        ) : (
          filtered.map((s: any, i: number) => {
            const stopRoutes = (s.routes || [])
              .map((rId: string) => ctx.routes.find((r: any) => r.id === rId))
              .filter(Boolean);
            const palette = ["#14140f", "#144fcc", "#ff8c5f", "#c8a0ff"];
            const accent = palette[i % palette.length];
            return (
              <div
                key={s.id}
                className="state-layer w-full text-left rounded-2xl bg-white border-2 border-[#14140f]/10 hover:border-[#144fcc] p-4 transition-colors min-w-0 dark:bg-surface-container-lowest dark:border-outline-variant"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Number badge */}
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                    style={{ backgroundColor: accent, color: accent === "#14140f" ? "#beff50" : "#fff" }}
                  >
                    {s.code?.substring(0, 2) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-bold text-[#14140f] truncate dark:text-on-surface">{s.name}</p>
                      {s.hasShelter && (
                        <ShieldCheck className="size-3.5 text-[#16a34a] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#14140f]/50 truncate dark:text-on-surface-variant">{s.address}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex gap-1">
                      {stopRoutes.slice(0, 2).map((r: any) => (
                        <span
                          key={r.id}
                          className="inline-flex items-center h-5 px-2 rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: r.color }}
                        >
                          {r.code}
                        </span>
                      ))}
                      {stopRoutes.length > 2 && (
                        <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-[#14140f]/10 text-[#14140f] text-[9px] font-bold dark:bg-surface-container-high dark:text-on-surface">
                          +{stopRoutes.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
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
  const [sepayOrder, setSepayOrder] = useState<{
    orderId: number;
    qrUrl: string;
    amount: number;
    description: string;
    bankCode?: string;
    accountNo?: string;
    accountName?: string;
  } | null>(null);
  const [paidStatus, setPaidStatus] = useState<"idle" | "checking" | "paid" | "expired">("idle");
  const [copying, setCopying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const passes = ctx.raw.passes?.data;
  const quote = passes?.monthlyPassQuote;

  // Step state: 1 = review, 2 = pay, 3 = done
  const step = !sepayOrder ? 1 : paidStatus === "paid" ? 3 : 2;

  // Countdown timer
  useEffect(() => {
    if (!sepayOrder || paidStatus === "paid" || paidStatus === "expired") return;
    setSecondsLeft(300); // 5 minutes
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s == null) return null;
        if (s <= 1) {
          setPaidStatus("expired");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [sepayOrder, paidStatus]);

  const buy = async () => {
    setPurchasing(true);
    try {
      const order = await studentApi.createSePayOrder("MONTHLY");
      setSepayOrder(order);
      setPaidStatus("checking");
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
        if (paidStatus !== "paid") setPaidStatus("expired");
      };
      poll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể tạo đơn thanh toán");
    } finally {
      setPurchasing(false);
    }
  };

  const copyAccount = async () => {
    if (!sepayOrder?.accountNo) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(sepayOrder.accountNo);
      toast.success("Đã sao chép số tài khoản");
    } catch {
      toast.error("Không thể sao chép");
    } finally {
      setTimeout(() => setCopying(false), 1500);
    }
  };

  const reset = () => {
    setSepayOrder(null);
    setPaidStatus("idle");
    setSecondsLeft(null);
  };

  const fmtCountdown = (s: number | null) => {
    if (s == null) return "--:--";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Mua vé tháng"
        description="Thanh toán qua SePay bằng mã QR VietQR — nhanh, an toàn."
        icon={<CreditCard className="size-7" />}
      />

      {/* Step indicator */}
      <ScrollReveal>
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {[
            { n: 1, label: "Xem đơn", icon: Info },
            { n: 2, label: "Thanh toán", icon: CreditCard },
            { n: 3, label: "Hoàn tất", icon: CheckCircle2 },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full transition-colors shrink-0",
                step >= s.n ? "bg-[#beff50] text-[#14140f]" : "bg-surface-container-high text-on-surface-variant"
              )}>
                <div className={cn(
                  "size-6 rounded-full flex items-center justify-center text-xs font-black",
                  step >= s.n ? "bg-[#14140f] text-[#beff50]" : "bg-surface-container-lowest"
                )}>
                  {step > s.n ? <CheckCircle2 className="size-4" /> : s.n}
                </div>
                <span className="text-xs font-bold hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <div className={cn("h-0.5 w-4 sm:w-8", step > s.n ? "bg-[#beff50]" : "bg-outline-variant")} />}
            </React.Fragment>
          ))}
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4 min-w-0">
        {/* Order details */}
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-6 h-full min-w-0">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TicketCheck className="size-5 text-primary" />
              Đơn vé tháng
            </h3>
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
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative overflow-hidden rounded-2xl p-4 mt-2"
                      style={{ backgroundColor: "#14140f", color: "#beff50" }}
                    >
                      <p className="text-[10px] font-bold opacity-70 uppercase tracking-wide">Tổng thanh toán</p>
                      <p className="text-3xl font-black mt-1 tabular-nums">
                        {formatVND(quote.payableAmount || quote.finalFareAmount || 0)}
                      </p>
                    </motion.div>
                  </>
                )}
                {step === 1 && (
                  <ExpressiveButton
                    variant="filled"
                    className="w-full mt-5"
                    onClick={buy}
                    disabled={purchasing}
                  >
                    {purchasing ? <RefreshCw className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                    Tạo mã QR thanh toán
                  </ExpressiveButton>
                )}
                {step === 3 && (
                  <ExpressiveButton variant="text" className="w-full mt-5" onClick={reset}>
                    Mua vé khác
                  </ExpressiveButton>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<TicketCheck className="size-7" />}
                title="Chưa đăng ký tuyến"
                description="Vui lòng đăng ký tuyến trước khi mua vé tháng."
              />
            )}
          </ExpressiveCard>
        </ScrollReveal>

        {/* QR / status panel */}
        <ScrollReveal delay={0.1}>
          {!sepayOrder ? (
            <ExpressiveCard variant="filled" className="p-6 h-full flex flex-col items-center justify-center text-center min-w-0">
              <div className="size-16 rounded-3xl bg-primary-container flex items-center justify-center mb-4">
                <QrCode className="size-8 text-on-primary-container" />
              </div>
              <p className="text-base font-bold">Sẵn sàng thanh toán</p>
              <p className="text-sm text-on-surface-variant mt-1 max-w-xs">
                Nhấn “Tạo mã QR thanh toán” bên trái để nhận mã QR VietQR qua SePay.
                Hỗ trợ mọi app ngân hàng: MBBank, Vietcombank, BIDV, TC Bank, v.v.
              </p>
            </ExpressiveCard>
          ) : step === 3 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
            >
              <ExpressiveCard variant="elevated" className="p-8 h-full flex flex-col items-center justify-center text-center min-w-0"
                style={{ backgroundColor: "#beff50", color: "#14140f" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                  className="size-24 rounded-full bg-[#14140f] flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="size-12 text-[#beff50]" />
                </motion.div>
                <h2 className="text-2xl font-black">Thanh toán thành công!</h2>
                <p className="text-sm font-semibold opacity-80 mt-2">
                  Vé tháng đã được kích hoạt. Bạn có thể xem vé trong mục “Vé của tôi”.
                </p>
                <div className="bg-[#14140f]/10 rounded-2xl p-4 mt-4 w-full max-w-xs">
                  <p className="text-xs font-bold opacity-70 uppercase">Mã giao dịch</p>
                  <p className="font-mono font-black text-lg">#{sepayOrder.orderId}</p>
                  <p className="text-xs font-bold opacity-70 uppercase mt-2">Số tiền</p>
                  <p className="font-black text-lg">{formatVND(sepayOrder.amount)}</p>
                </div>
              </ExpressiveCard>
            </motion.div>
          ) : (
            <ExpressiveCard variant="elevated" className="p-6 h-full min-w-0">
              {/* Header with countdown */}
              <div className="flex items-center justify-between mb-4 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <QrCode className="size-5 text-primary" />
                    Quét QR để thanh toán
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Mở app ngân hàng bất kỳ → quét QR</p>
                </div>
                <div className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-black tabular-nums",
                  secondsLeft != null && secondsLeft < 60
                    ? "bg-error text-white animate-pulse"
                    : "bg-warning-container text-on-surface"
                )}>
                  {fmtCountdown(secondsLeft)}
                </div>
              </div>

              {/* QR */}
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-4 rounded-2xl shadow-lg ring-2 ring-[#beff50]/40"
                >
                  <QRCodeCanvas value={sepayOrder.qrUrl} size={240} level="M" includeMargin={false} />
                </motion.div>
                <div className="flex items-center gap-2 text-2xl font-black text-primary">
                  {formatVND(sepayOrder.amount)}
                </div>
                <p className="text-xs text-on-surface-variant text-center break-all max-w-xs font-mono">
                  {sepayOrder.description}
                </p>
              </div>

              {/* Bank info */}
              {sepayOrder.bankCode && sepayOrder.accountNo && (
                <div className="mt-5 p-4 rounded-2xl bg-surface-container-low space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs text-on-surface-variant">Ngân hàng</span>
                    <span className="font-bold text-sm">{sepayOrder.bankCode}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs text-on-surface-variant">Số tài khoản</span>
                    <button
                      onClick={copyAccount}
                      className={cn(
                        "font-mono font-bold text-sm flex items-center gap-1.5 transition-colors",
                        copying ? "text-success" : "text-primary hover:underline"
                      )}
                    >
                      {sepayOrder.accountNo}
                      {copying ? <CheckCircle2 className="size-3.5" /> : <Banknote className="size-3.5" />}
                    </button>
                  </div>
                  {sepayOrder.accountName && (
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-xs text-on-surface-variant">Chủ TK</span>
                      <span className="font-bold text-sm truncate">{sepayOrder.accountName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="mt-4 p-3 rounded-xl bg-primary-container/30 text-primary text-sm flex items-center gap-2 min-w-0">
                <RefreshCw className="size-4 animate-spin shrink-0" />
                <span className="font-medium truncate">Đang chờ xác nhận thanh toán từ SePay...</span>
              </div>

              {paidStatus === "expired" && (
                <div className="mt-3 p-3 rounded-xl bg-error-container/40 text-error text-sm flex items-center gap-2 min-w-0">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span className="font-medium">Đơn hàng hết hạn. Vui lòng tạo lại.</span>
                  <ExpressiveButton variant="text" size="sm" className="ml-auto" onClick={reset}>Tạo lại</ExpressiveButton>
                </div>
              )}
            </ExpressiveCard>
          )}
        </ScrollReveal>
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
