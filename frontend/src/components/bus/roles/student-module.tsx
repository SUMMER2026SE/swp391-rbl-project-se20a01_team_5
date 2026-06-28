"use client";

// =============================================================================
// Student Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// 14 role-specific screens driven by `activeId`:
//   stu-dashboard, stu-university, stu-stops, stu-find, stu-my-journeys,
//   stu-history, stu-chatbot, stu-payment, stu-invoices plus legacy hidden routes
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
  Bell,
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
  ImageUp,
  Upload,
  Crosshair,
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
import {
  JourneyMap,
  type JourneyExtraMarker,
  type JourneyPolyline,
} from "@/components/m3/journey-map";
// Bus shared primitives
import { PageHeader, StatCard, Section, EmptyState } from "../primitives";

// Real backend data adapter
import {
  useStudentPrototypeData,
  useApi,
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
  universityApi,
  type StudentDashboardView,
  type StudentUniversityView,
  type VerificationView,
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
  type CoordinateDTO,
  type JourneyStopDTO,
  type PlaceSuggestionDTO,
  type JourneyOptionDTO,
  type JourneyTrackingSnapshotDTO,
  type AiSource,
  type AiRouteSuggestionCard,
  ApiError,
} from "@/lib/api/client";
import { ProtectedImage } from "@/components/bus/protected-image";
import { JourneyPlannerDesktop } from "@/components/bus/student/journey-planner-desktop";

type StudentModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
  onProfileRefresh?: () => Promise<void>;
};

export function StudentModule({ activeId, onNavigate, onProfileRefresh }: StudentModuleProps) {
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
      return <UniversityScreen ctx={ctx} onProfileRefresh={onProfileRefresh} />;
    case "stu-stops":
      return <StopsScreen ctx={ctx} />;
    case "stu-find":
      return <JourneyPlannerDesktop ctx={ctx} onNavigate={onNavigate} />;
    case "stu-my-journeys":
      return <MyJourneysScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-tracking":
      return <TrackingScreen ctx={ctx} />;
    case "stu-my-routes":
      return <MyRoutesScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-my-ticket":
      return <MyTicketScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-history":
      return <HistoryScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-ai":
      return <AIScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-chatbot":
      return <ChatbotScreen ctx={ctx} onNavigate={onNavigate} />;
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

function InfoCell({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#14140f]/8 p-3 min-w-0">
      <p className="text-[10px] font-bold opacity-70 uppercase truncate">{label}</p>
      <p className="text-sm font-bold leading-snug break-words">{value || "—"}</p>
    </div>
  );
}

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
  const tripFrom = ctx.registration?.boardingStopName || activeTicket?.boardingStopName || activeRoute?.from || "Điểm lên";
  const tripTo = ctx.registration?.alightingStopName || activeTicket?.alightingStopName || activeRoute?.to || "Điểm xuống";
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
    { id: "stu-my-journeys", label: "Chuyến đi của tôi", icon: TicketCheck, bg: "#ff8c5f", fg: "#14140f", iconBg: "#14140f", iconFg: "#ff8c5f" },
    { id: "stu-payment", label: "Mua vé tháng", icon: CreditCard, bg: "#14140f", fg: "#fff", iconBg: "#beff50", iconFg: "#14140f" },
    { id: "stu-chatbot", label: "Hỏi Copilot", icon: Bot, bg: "#c8a0ff", fg: "#14140f", iconBg: "#14140f", iconFg: "#c8a0ff" },
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
                  {tripFrom} → {tripTo}
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
                    onClick={() => onNavigate("stu-my-journeys")}
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
                    onClick={() => onNavigate("stu-my-journeys")}
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
                onClick={() => { setQrExpanded(false); onNavigate("stu-my-journeys"); }}
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

function HistoryRow({
  history,
  routes,
  onFeedback,
  onSupport,
  onLostItem,
}: {
  history: any;
  routes: any[];
  onFeedback: (history: any) => void;
  onSupport: (history: any) => void;
  onLostItem: () => void;
}) {
  const route = routes.find((r) => r.id === String(history.routeId));
  const routeName = history.routeName || route?.name || "Chuyến xe";
  const routeCode = route?.code || routeName.slice(0, 2) || "?";
  const boarding = history.boardingStopName || "?";
  const alighting = history.alightingStopName || "?";

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl bg-surface-container-low min-w-0 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="size-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs"
          style={{ backgroundColor: route?.color || "#14b8a6", color: "#14140f" }}
        >
          {routeCode.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{routeName}</p>
          <p className="text-xs text-on-surface-variant truncate">
            {boarding} → {alighting}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">{formatDate(history.boardedAt || history.serviceDate)}</p>
        </div>
        <CheckCircle2 className="size-4 text-success shrink-0" />
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        <ExpressiveButton variant="outlined" size="sm" onClick={() => onFeedback?.(history)}>
          <Star className="size-4" />
          Phản hồi
        </ExpressiveButton>
        <ExpressiveButton variant="tonal" size="sm" onClick={() => onSupport?.(history)}>
          <LifeBuoy className="size-4" />
          Hỗ trợ
        </ExpressiveButton>
        <ExpressiveButton variant="text" size="sm" onClick={onLostItem}>
          <PackageSearch className="size-3.5" />
          Mất đồ
        </ExpressiveButton>
      </div>
    </div>
  );
}

// =============================================================================
// Screen 2: University linkage
// =============================================================================
const MAX_STUDENT_CARD_SIZE = 10 * 1024 * 1024;
const STUDENT_CARD_TYPES = ["image/jpeg", "image/png", "image/webp"];

function normalizeVerificationStatus(status?: string | null) {
  if (!status) return "NOT_SUBMITTED";
  return status === "PENDING" ? "PENDING_REVIEW" : status;
}

function verificationStatusCopy(status: string) {
  const copy: Record<string, { label: string; description: string; tone: "neutral" | "primary" | "tertiary" | "success" | "warning" | "error" }> = {
    NOT_SUBMITTED: {
      label: "Chưa xác minh",
      description: "Gửi ảnh thẻ sinh viên để hệ thống OCR đọc thông tin và admin duyệt.",
      tone: "neutral",
    },
    PENDING_REVIEW: {
      label: "Đang chờ duyệt",
      description: "Hồ sơ đã gửi thành công. Admin sẽ kiểm tra ảnh thẻ và kết quả OCR.",
      tone: "warning",
    },
    VERIFIED: {
      label: "Đã xác minh",
      description: "Tài khoản đã liên kết với trường và có thể dùng quyền lợi sinh viên.",
      tone: "success",
    },
    REJECTED: {
      label: "Bị từ chối",
      description: "Hồ sơ cần sửa lại trước khi gửi mới.",
      tone: "error",
    },
    RESUBMISSION_REQUIRED: {
      label: "Cần gửi lại",
      description: "Admin yêu cầu bổ sung ảnh hoặc thông tin rõ hơn.",
      tone: "warning",
    },
  };
  return copy[status] || copy.NOT_SUBMITTED;
}

function formatOcrConfidence(score?: number) {
  if (score == null || Number.isNaN(score)) return "Chưa có";
  const percent = score <= 1 ? score * 100 : score;
  return `${Math.round(percent)}%`;
}

function FieldLine({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-3 min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-on-surface">{value || "—"}</p>
    </div>
  );
}

function OcrSummary({ verification }: { verification?: VerificationView | null }) {
  if (!verification) return null;
  const hasOcr =
    !!verification.ocrFullName ||
    !!verification.ocrStudentCode ||
    !!verification.ocrUniversity ||
    !!verification.ocrRawText ||
    verification.ocrConfidenceScore != null;

  if (!hasOcr) return null;

  const confidence = verification.ocrConfidenceScore;
  const confidencePercent = confidence == null ? null : (confidence <= 1 ? confidence * 100 : confidence);
  const confidenceTone = confidencePercent == null ? "neutral" : confidencePercent >= 80 ? "success" : confidencePercent >= 60 ? "warning" : "error";

  return (
    <ExpressiveCard variant="elevated" className="p-5 min-w-0">
      {/* Header with icon + confidence bar */}
      <div className="flex items-center gap-3 mb-4 min-w-0">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#c8a0ff] text-[#14140f]">
          <Sparkles className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold flex items-center gap-2">
            Kết quả OCR
            <span className="inline-flex items-center h-5 px-2 rounded-full bg-[#c8a0ff]/20 text-[#c8a0ff] text-[10px] font-bold uppercase tracking-wide">
              AI
            </span>
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Dữ liệu backend đọc từ ảnh thẻ sinh viên</p>
        </div>
      </div>

      {/* Confidence progress bar */}
      {confidencePercent != null && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-on-surface-variant font-medium">Độ tin cậy</span>
            <span className={cn(
              "font-bold",
              confidenceTone === "success" && "text-success",
              confidenceTone === "warning" && "text-warning",
              confidenceTone === "error" && "text-error"
            )}>
              {Math.round(confidencePercent)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                confidenceTone === "success" && "bg-success",
                confidenceTone === "warning" && "bg-warning",
                confidenceTone === "error" && "bg-error"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${confidencePercent}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      )}

      {/* Fields grid */}
      <div className="grid gap-2 sm:grid-cols-3">
        <FieldLine label="Họ tên OCR" value={verification.ocrFullName} />
        <FieldLine label="MSSV OCR" value={verification.ocrStudentCode} />
        <FieldLine label="Trường OCR" value={verification.ocrUniversity} />
      </div>

      {/* Raw text collapsible */}
      {verification.ocrRawText && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-xs font-bold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 list-none">
            <ChevronRight className="size-3.5 group-open:rotate-90 transition-transform" />
            Xem raw text OCR
          </summary>
          <div className="mt-2 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3">
            <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs text-on-surface-variant scrollbar-soft font-mono">
              {verification.ocrRawText}
            </p>
          </div>
        </details>
      )}
    </ExpressiveCard>
  );
}

function StudentCardPreview({
  verification,
  previewUrl,
}: {
  verification?: VerificationView | null;
  previewUrl?: string | null;
}) {
  if (previewUrl) {
    return (
      <div className="relative group">
        <img
          src={previewUrl}
          alt="Ảnh thẻ sinh viên chuẩn bị gửi"
          className="aspect-[4/3] w-full rounded-2xl border-2 border-[#beff50] object-cover shadow-lg"
        />
        <div className="absolute top-2 right-2 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-[#beff50] text-[#14140f] text-[10px] font-bold">
          <span className="size-1.5 rounded-full bg-[#14140f] animate-pulse" />
          Ảnh mới
        </div>
      </div>
    );
  }
  if (verification?.cardImageUrl) {
    return (
      <div className="relative group">
        <ProtectedImage
          src={verification.cardImageUrl}
          alt="Ảnh thẻ sinh viên đã gửi"
          className="aspect-[4/3] w-full rounded-2xl border-2 border-outline-variant/60"
        />
        <div className="absolute top-2 right-2 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-[#14140f] text-white text-[10px] font-bold">
          Đã gửi
        </div>
      </div>
    );
  }
  return (
    <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant bg-gradient-to-br from-surface-container-low to-surface-container-lowest text-center overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-8 -right-8 size-32 rounded-full bg-[#beff50]/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 size-28 rounded-full bg-[#144fcc]/10 blur-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#14140f] text-[#beff50] mb-3">
          <ImageUp className="size-7" />
        </div>
        <p className="text-sm font-bold text-on-surface">Chưa chọn ảnh thẻ</p>
        <p className="mt-1 max-w-xs text-xs text-on-surface-variant">JPG, PNG hoặc WebP, tối đa 10MB</p>
      </div>
    </div>
  );
}

function UniversityScreen({ ctx, onProfileRefresh }: { ctx: Ctx; onProfileRefresh?: () => Promise<void> }) {
  const verification = useApi(() => studentApi.verification(), undefined, []);
  const university = useApi(() => studentApi.university(), undefined, []);
  const catalog = useApi(() => universityApi.daNang(), undefined, []);

  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [lastSubmission, setLastSubmission] = useState<VerificationView | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentVerification = lastSubmission || verification.raw;
  const currentUniversity = (university.raw || ctx.raw.universityRaw?.raw || ctx.university) as StudentUniversityView | null;
  const status = normalizeVerificationStatus(
    currentVerification?.status ||
      currentUniversity?.studentVerificationStatus ||
      ctx.user.verificationStatus
  );
  const statusCopy = verificationStatusCopy(status);
  const canSubmit = status === "NOT_SUBMITTED" || status === "REJECTED" || status === "RESUBMISSION_REQUIRED";
  const isVerified = status === "VERIFIED";
  const isPending = status === "PENDING_REVIEW";
  const universityOptions = catalog.raw || [];

  const previewUrl = useMemo(() => (cardImage ? URL.createObjectURL(cardImage) : null), [cardImage]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!selectedUniversity && (currentVerification?.university || currentUniversity?.universityName)) {
      setSelectedUniversity(currentVerification?.university || currentUniversity?.universityName || "");
    }
    if (!studentCode && (currentVerification?.studentCode || currentUniversity?.studentCode)) {
      setStudentCode(currentVerification?.studentCode || currentUniversity?.studentCode || "");
    }
  }, [
    currentVerification?.studentCode,
    currentVerification?.university,
    currentUniversity?.studentCode,
    currentUniversity?.universityName,
    selectedUniversity,
    studentCode,
  ]);

  const handleFile = (file?: File | null) => {
    if (!file) {
      setCardImage(null);
      return;
    }
    if (!STUDENT_CARD_TYPES.includes(file.type)) {
      toast.error("Ảnh thẻ phải là JPG, PNG hoặc WebP");
      return;
    }
    if (file.size > MAX_STUDENT_CARD_SIZE) {
      toast.error("Ảnh thẻ tối đa 10MB");
      return;
    }
    setCardImage(file);
  };

  const submit = async () => {
    const universityName = selectedUniversity.trim();
    const normalizedCode = studentCode.trim().toUpperCase();
    if (!universityName || !normalizedCode) {
      toast.error("Vui lòng nhập trường và mã sinh viên");
      return;
    }
    if (!cardImage) {
      toast.error("Vui lòng chọn ảnh thẻ sinh viên");
      return;
    }

    setSubmitting(true);
    try {
      const result = await studentApi.submitVerification({
        university: universityName,
        studentCode: normalizedCode,
        cardImage,
      });
      setLastSubmission(result);
      setCardImage(null);
      verification.reload();
      university.reload();
      ctx.reload();
      await onProfileRefresh?.();
      toast.success("Đã gửi hồ sơ xác minh. OCR đã đọc ảnh và chuyển sang chờ duyệt.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể gửi xác minh");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title={isVerified ? "Trường của tôi" : "Xác minh sinh viên"}
        description={statusCopy.description}
        icon={isVerified ? <School className="size-7" /> : <ShieldCheck className="size-7" />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4 min-w-0">
          <ExpressiveCard variant="elevated" className="p-5 min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4 min-w-0">
                <div className="size-14 shrink-0 rounded-2xl bg-[#beff50] text-[#14140f] flex items-center justify-center text-xl font-black">
                  {(currentUniversity?.shortName || currentVerification?.university || currentUniversity?.universityName || "SV").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold">
                    {currentUniversity?.universityName || currentVerification?.university || "Chưa liên kết trường"}
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    MSSV: <span className="font-bold text-on-surface">{currentUniversity?.studentCode || currentVerification?.studentCode || "—"}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <M3StatusPill label={statusCopy.label} tone={statusCopy.tone} />
                    {currentUniversity?.rosterStatus && <M3StatusPill label={currentUniversity.rosterStatus} tone="primary" />}
                    {currentUniversity?.linkStatus && <M3StatusPill label={currentUniversity.linkStatus} tone="success" />}
                  </div>
                </div>
              </div>
              {(verification.loading || university.loading) && (
                <RefreshCw className="size-5 animate-spin text-on-surface-variant" />
              )}
            </div>
            {currentVerification?.rejectionReason && (
              <div className="mt-4 rounded-2xl border border-error/30 bg-error-container/50 p-4 text-sm text-on-surface">
                <p className="font-bold text-error">Lý do từ admin</p>
                <p className="mt-1 text-on-surface-variant">{currentVerification.rejectionReason}</p>
              </div>
            )}
          </ExpressiveCard>

          {isVerified && (
            <ExpressiveCard variant="filled" className="p-5 min-w-0">
              <h3 className="text-base font-bold mb-3">Domain xác thực</h3>
              {currentUniversity?.domainHint ? (
                <p className="text-sm">
                  Email trường: <span className="font-mono font-bold text-primary">@{currentUniversity.domainHint}</span>
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant">Chưa có thông tin domain</p>
              )}
            </ExpressiveCard>
          )}

          {isPending && (
            <ExpressiveCard variant="filled" className="p-5 min-w-0">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 text-warning" />
                <div className="min-w-0">
                  <h3 className="font-bold">Hồ sơ đang chờ admin duyệt</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Bạn không cần gửi lại. Nếu admin yêu cầu bổ sung, form upload sẽ mở lại ở màn này.
                  </p>
                  {currentVerification?.submittedAt && (
                    <p className="mt-2 text-xs font-semibold text-on-surface-variant">
                      Đã gửi: {formatDateTime(currentVerification.submittedAt)}
                    </p>
                  )}
                </div>
              </div>
            </ExpressiveCard>
          )}

          <OcrSummary verification={currentVerification} />

          {canSubmit && (
            <ExpressiveCard variant="elevated" className="p-5 min-w-0">
              <div className="mb-4">
                <h3 className="text-base font-bold">Gửi hồ sơ xác minh</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Nhập đúng trường/MSSV và chọn ảnh thẻ rõ nét để OCR đọc thông tin.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="student-university">Trường đại học</Label>
                  {universityOptions.length > 0 ? (
                    <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                      <SelectTrigger id="student-university">
                        <SelectValue placeholder={catalog.loading ? "Đang tải danh sách..." : "Chọn trường"} />
                      </SelectTrigger>
                      <SelectContent>
                        {universityOptions.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="student-university"
                      value={selectedUniversity}
                      onChange={(e) => setSelectedUniversity(e.target.value)}
                      placeholder="Ví dụ: Đại học Bách khoa - ĐHĐN"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-code">Mã sinh viên</Label>
                  <Input
                    id="student-code"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    placeholder="Nhập MSSV"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                <StudentCardPreview verification={currentVerification} previewUrl={previewUrl} />
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="student-card-image" className="text-xs font-bold uppercase tracking-wide">Ảnh thẻ sinh viên</Label>
                  {/* Drag-drop upload zone */}
                  <label
                    htmlFor="student-card-image"
                    className={cn(
                      "group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 transition-colors min-w-0",
                      cardImage
                        ? "border-[#beff50] bg-[#beff50]/5"
                        : "border-outline-variant hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <input
                      id="student-card-image"
                      type="file"
                      accept={STUDENT_CARD_TYPES.join(",")}
                      onChange={(e) => handleFile(e.target.files?.[0])}
                      disabled={submitting}
                      className="sr-only"
                    />
                    <div className={cn(
                      "flex size-10 items-center justify-center rounded-xl transition-colors",
                      cardImage ? "bg-[#beff50] text-[#14140f]" : "bg-surface-container-high text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary"
                    )}>
                      {cardImage ? <CheckCircle2 className="size-5" /> : <Upload className="size-5" />}
                    </div>
                    <div className="text-center min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">
                        {cardImage ? cardImage.name : "Chạm để chọn ảnh"}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {cardImage ? `${(cardImage.size / 1024 / 1024).toFixed(2)} MB` : "JPG, PNG, WebP — tối đa 10MB"}
                      </p>
                    </div>
                  </label>
                  <div className="rounded-2xl bg-[#144fcc]/5 border border-[#144fcc]/20 p-4 text-sm text-on-surface-variant">
                    <p className="font-bold text-[#144fcc] flex items-center gap-1.5">
                      <Sparkles className="size-4" />
                      Mẹo OCR đọc tốt hơn
                    </p>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li className="flex items-start gap-1.5"><span className="text-[#144fcc]">•</span> Chụp thẳng mặt thẻ, không nghiêng</li>
                      <li className="flex items-start gap-1.5"><span className="text-[#144fcc]">•</span> Đủ sáng, không bóng đổ</li>
                      <li className="flex items-start gap-1.5"><span className="text-[#144fcc]">•</span> Không che MSSV và tên trường</li>
                    </ul>
                  </div>
                  <ExpressiveButton variant="filled" onClick={submit} disabled={submitting || !cardImage} className="w-full">
                    {submitting ? <RefreshCw className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {submitting ? "Đang gửi..." : "Gửi xác minh"}
                  </ExpressiveButton>
                </div>
              </div>
            </ExpressiveCard>
          )}

          {!canSubmit && !isVerified && !isPending && (
            <EmptyState
              icon={<ShieldCheck className="size-7" />}
              title="Chưa thể gửi lại"
              description="Trạng thái hồ sơ hiện tại chưa cho phép tạo yêu cầu mới."
            />
          )}
        </div>

        <div className="space-y-4 min-w-0">
          <StudentCardPreview verification={currentVerification} previewUrl={previewUrl} />
          <ExpressiveCard variant="filled" className="p-5 min-w-0">
            <h3 className="text-base font-bold">Quy trình duyệt</h3>
            <div className="mt-4 space-y-3">
              {[
                ["1", "Sinh viên gửi ảnh thẻ và MSSV"],
                ["2", "OCR đọc tên, MSSV, trường"],
                ["3", "Admin đối chiếu và duyệt"],
              ].map(([step, label]) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#14140f] text-xs font-bold text-[#beff50]">
                    {step}
                  </span>
                  <span className="text-sm font-medium text-on-surface">{label}</span>
                </div>
              ))}
            </div>
          </ExpressiveCard>
        </div>
      </div>
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

function JourneyPlannerDesktopScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const [originQuery, setOriginQuery] = useState("Đại học Việt Hàn");
  const [destinationQuery, setDestinationQuery] = useState("Bến xe Trung tâm Đà Nẵng");
  const [origin, setOrigin] = useState<PlaceSuggestionDTO | null>(null);
  const [destination, setDestination] = useState<PlaceSuggestionDTO | null>(null);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestionDTO[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestionDTO[]>([]);
  const [focus, setFocus] = useState<"origin" | "destination" | null>(null);
  const [maxBusLegs, setMaxBusLegs] = useState("2");
  const [journeys, setJourneys] = useState<JourneyOptionDTO[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [tracking, setTracking] = useState<JourneyTrackingSnapshotDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const selectedJourney = journeys.find((item) => item.optionId === selectedId) || journeys[0] || null;

  const numberValue = (value: number | string | undefined | null) => Number(value ?? 0) || 0;
  const moneyValue = (value: number | string | undefined | null) => numberValue(value);
  const coordinate = (point: CoordinateDTO) => ({
    lat: numberValue(point.latitude),
    lng: numberValue(point.longitude),
  });

  const placePoint = (place: PlaceSuggestionDTO | null, label: string) => {
    if (!place) return null;
    if (place.stopId) {
      return { stopId: place.stopId, label: place.label };
    }
    return {
      placeId: place.id,
      label: place.label || label,
      latitude: place.latitude,
      longitude: place.longitude,
    };
  };

  const loadSuggestions = useCallback(async (kind: "origin" | "destination", query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      if (kind === "origin") setOriginSuggestions([]);
      else setDestinationSuggestions([]);
      return;
    }
    try {
      const places = await transportApi.searchPlaces(trimmed, undefined, undefined, 8);
      if (kind === "origin") setOriginSuggestions(places);
      else setDestinationSuggestions(places);
    } catch {
      if (kind === "origin") setOriginSuggestions([]);
      else setDestinationSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadSuggestions("origin", originQuery), 220);
    return () => window.clearTimeout(timer);
  }, [loadSuggestions, originQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadSuggestions("destination", destinationQuery), 220);
    return () => window.clearTimeout(timer);
  }, [destinationQuery, loadSuggestions]);

  const runSearch = useCallback(async (nextOrigin = origin, nextDestination = destination) => {
    const originPoint = placePoint(nextOrigin, originQuery);
    const destinationPoint = placePoint(nextDestination, destinationQuery);
    if (!originPoint || !destinationPoint) {
      toast.error("Hãy chọn điểm xuất phát và điểm đến từ gợi ý.");
      return;
    }
    setLoading(true);
    try {
      const result = await transportApi.searchJourneys({
        origin: originPoint,
        destination: destinationPoint,
        maxBusLegs: Number(maxBusLegs),
      });
      setJourneys(result);
      setSelectedId(result[0]?.optionId || "");
      if (result.length) {
        toast.success(`Đã tìm thấy ${result.length} lộ trình phù hợp.`);
      } else {
        toast.info("Chưa tìm thấy lộ trình phù hợp trong mạng tuyến hiện tại.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tìm lộ trình");
      setJourneys([]);
      setSelectedId("");
    } finally {
      setLoading(false);
    }
  }, [destination, destinationQuery, maxBusLegs, origin, originQuery]);

  useEffect(() => {
    if (bootstrapped) return;
    let cancelled = false;
    (async () => {
      try {
        const [originList, destinationList] = await Promise.all([
          transportApi.searchPlaces("Đại học Việt Hàn", undefined, undefined, 3),
          transportApi.searchPlaces("Bến xe Trung tâm Đà Nẵng", undefined, undefined, 3),
        ]);
        if (cancelled) return;
        const nextOrigin = originList[0] || null;
        const nextDestination = destinationList[0] || null;
        if (nextOrigin) {
          setOrigin(nextOrigin);
          setOriginQuery(nextOrigin.label);
        }
        if (nextDestination) {
          setDestination(nextDestination);
          setDestinationQuery(nextDestination.label);
        }
        setBootstrapped(true);
        if (nextOrigin && nextDestination) {
          window.setTimeout(() => void runSearch(nextOrigin, nextDestination), 120);
        }
      } catch {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapped, runSearch]);

  useEffect(() => {
    if (!selectedJourney?.optionId) {
      setTracking(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const snapshot = await transportApi.trackJourney(selectedJourney.optionId);
        if (!cancelled) setTracking(snapshot);
      } catch {
        if (!cancelled) setTracking(null);
      }
    };
    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedJourney?.optionId]);

  const useGps = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ GPS.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const resolved = await transportApi.reversePlace(pos.coords.latitude, pos.coords.longitude);
          const place = {
            id: "gps:current",
            type: "ADDRESS",
            label: resolved.label || "Vị trí hiện tại",
            address: resolved.address,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            stopId: resolved.nearestStopId,
            distanceMeters: resolved.distanceMeters,
          };
          setOrigin(place);
          setOriginQuery(place.label);
          toast.success("Đã lấy vị trí hiện tại.");
        } catch {
          const place = {
            id: "gps:current",
            type: "ADDRESS",
            label: "Vị trí hiện tại",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setOrigin(place);
          setOriginQuery(place.label);
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        toast.error("Không lấy được vị trí hiện tại.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const pickPlace = (kind: "origin" | "destination", place: PlaceSuggestionDTO) => {
    if (kind === "origin") {
      setOrigin(place);
      setOriginQuery(place.label);
      setOriginSuggestions([]);
    } else {
      setDestination(place);
      setDestinationQuery(place.label);
      setDestinationSuggestions([]);
    }
    setFocus(null);
  };

  const swapPlaces = () => {
    const oldOrigin = origin;
    const oldOriginQuery = originQuery;
    setOrigin(destination);
    setOriginQuery(destinationQuery);
    setDestination(oldOrigin);
    setDestinationQuery(oldOriginQuery);
  };

  const busLegs = selectedJourney?.legs.filter((leg) => leg.mode === "BUS") || [];
  const selectedStops = useMemo(() => {
    const rawStops = selectedJourney?.stops?.length
      ? selectedJourney.stops
      : busLegs.flatMap((leg) => leg.stops || []);
    const unique = new Map<number, JourneyStopDTO>();
    rawStops.forEach((stop) => unique.set(stop.stopId, stop));
    return Array.from(unique.values())
      .filter((stop) => stop.latitude != null && stop.longitude != null)
      .map((stop) => ({
        id: String(stop.stopId),
        name: stop.stopName,
        address: stop.address || "Đà Nẵng",
        code: String(stop.stopOrder ?? ""),
        lat: numberValue(stop.latitude),
        lng: numberValue(stop.longitude),
        hasShelter: false,
        routes: selectedJourney?.routeBadges?.map((route) => String(route.routeId)) || [],
      }));
  }, [busLegs, selectedJourney?.routeBadges, selectedJourney?.stops]);

  const journeyPolylines: JourneyPolyline[] = useMemo(() => (
    selectedJourney?.polylines || []
  ).map((line) => ({
    id: line.legId,
    label: line.mode === "WALK" ? "Đi bộ" : "Tuyến xe",
    color: line.colorHex || (line.mode === "WALK" ? "#14140f" : "#144fcc"),
    dashed: line.mode === "WALK",
    points: (line.points || []).map(coordinate).filter((p) => p.lat && p.lng),
  })).filter((line) => line.points.length >= 2), [selectedJourney?.polylines]);

  const journeyBuses = (tracking?.vehicles || []).map((vehicle) => ({
    id: vehicle.vehicleId,
    plate: vehicle.plateNumber || "43B-00000",
    routeCode: vehicle.routeCode || "BUS",
    routeColor: selectedJourney?.routeBadges?.find((route) => route.routeId === vehicle.routeId)?.colorHex || "#144fcc",
    lat: numberValue(vehicle.latitude),
    lng: numberValue(vehicle.longitude),
    speedKmh: numberValue(vehicle.speedKmh),
    occupancy: vehicle.occupancy,
    capacity: vehicle.capacity,
    etaMinutes: vehicle.etaMinutes,
  })).filter((vehicle) => vehicle.lat && vehicle.lng);

  const primaryColor = selectedJourney?.routeBadges?.[0]?.colorHex || "#144fcc";
  const selectedEta = tracking?.stopEtas?.[0];

  const registerSelected = async () => {
    const action = selectedJourney?.primaryAction;
    if (!action?.enabled || !action.routeId || !action.boardingStopId || !action.alightingStopId) {
      toast.error(action?.reason || "Hành trình này chưa đủ điều kiện đăng ký.");
      return;
    }
    try {
      await studentApi.registerRoute({
        routeId: action.routeId,
        boardingStopId: action.boardingStopId,
        alightingStopId: action.alightingStopId,
      });
      localStorage.setItem("unibus.paymentRouteId", String(action.routeId));
      ctx.reload();
      toast.success("Đã đăng ký tuyến. Chuyển sang mua vé tháng.");
      onNavigate("stu-payment");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        localStorage.setItem("unibus.paymentRouteId", String(action.routeId));
        toast.info("Tuyến này đã được đăng ký. Chuyển sang mua vé.");
        onNavigate("stu-payment");
        return;
      }
      toast.error(error instanceof Error ? error.message : "Không thể đăng ký tuyến");
    }
  };

  const buyJourneyPass = async () => {
    if (!selectedJourney || !busLegs.length) return;
    try {
      const seen = new Set<number>();
      const legs = busLegs
        .filter((leg) => leg.routeId && !seen.has(leg.routeId) && seen.add(leg.routeId))
        .map((leg, index) => ({
          routeId: Number(leg.routeId),
          boardingStopId: leg.fromStopId,
          alightingStopId: leg.toStopId,
          legOrder: index + 1,
        }));
      const order = await studentApi.purchaseJourneyMonthlyPass({
        originLabel: origin?.label || originQuery,
        destinationLabel: destination?.label || destinationQuery,
        method: "BANK_TRANSFER",
        legs,
      });
      ctx.reload();
      toast.success(`Đã kích hoạt QR hành trình ${order.qrCode.slice(0, 18)}...`);
      onNavigate("stu-my-ticket");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cần đăng ký các tuyến trước khi mua vé hành trình");
    }
  };

  const trackSelected = () => {
    if (!selectedJourney?.optionId) return;
    localStorage.setItem("unibus.trackingJourneyId", selectedJourney.optionId);
    onNavigate("stu-tracking");
  };

  const renderSuggestions = (kind: "origin" | "destination", suggestions: PlaceSuggestionDTO[]) => (
    focus === kind && suggestions.length > 0 && (
      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-xl">
        {suggestions.map((place) => (
          <button
            key={place.id}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              pickPlace(kind, place);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-container-high"
          >
            <span className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              kind === "origin" ? "bg-[#beff50] text-[#14140f]" : "bg-[#ff8c5f] text-[#14140f]",
            )}>
              <MapPin className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">{place.label}</span>
              <span className="block truncate text-xs text-on-surface-variant">
                {place.address || (place.distanceMeters ? `Cách khoảng ${place.distanceMeters}m` : "Đà Nẵng")}
              </span>
            </span>
          </button>
        ))}
      </div>
    )
  );

  return (
    <PageTransition className="space-y-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#14140f] text-[#beff50]">
            <RouteIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-on-surface">Tìm tuyến</h1>
            <p className="text-sm text-on-surface-variant">Lập hành trình, đăng ký tuyến và theo dõi xe trên bản đồ.</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-bold text-on-surface-variant lg:flex">
          <Calendar className="size-4" />
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
        </div>
      </div>

      <ExpressiveCard variant="elevated" className="p-5 lg:p-6 min-w-0">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)_220px_190px] xl:items-end">
          <div className="relative min-w-0">
            <Label className="mb-2 block text-xs font-black uppercase text-on-surface-variant">Điểm xuất phát</Label>
            <div className="relative">
              <CircleDot className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#16a34a]" />
              <Input
                value={originQuery}
                onFocus={() => setFocus("origin")}
                onBlur={() => window.setTimeout(() => setFocus(null), 140)}
                onChange={(event) => {
                  setOriginQuery(event.target.value);
                  setOrigin(null);
                }}
                className="h-12 rounded-2xl pl-11 text-sm font-bold"
                placeholder="Nhập điểm xuất phát"
              />
            </div>
            {renderSuggestions("origin", originSuggestions)}
          </div>

          <button
            type="button"
            onClick={swapPlaces}
            className="hidden size-12 items-center justify-center rounded-full border border-outline-variant bg-surface-container hover:bg-surface-container-high xl:flex"
            title="Đổi chiều"
          >
            <ArrowLeftRight className="size-5" />
          </button>

          <div className="relative min-w-0">
            <Label className="mb-2 block text-xs font-black uppercase text-on-surface-variant">Điểm đến</Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#ef4444]" />
              <Input
                value={destinationQuery}
                onFocus={() => setFocus("destination")}
                onBlur={() => window.setTimeout(() => setFocus(null), 140)}
                onChange={(event) => {
                  setDestinationQuery(event.target.value);
                  setDestination(null);
                }}
                className="h-12 rounded-2xl pl-11 text-sm font-bold"
                placeholder="Nhập điểm đến"
              />
            </div>
            {renderSuggestions("destination", destinationSuggestions)}
          </div>

          <div>
            <Label className="mb-2 block text-xs font-black uppercase text-on-surface-variant">Tùy chọn</Label>
            <Select value={maxBusLegs} onValueChange={setMaxBusLegs}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Tối đa 1 tuyến</SelectItem>
                <SelectItem value="2">Tối đa 2 tuyến</SelectItem>
                <SelectItem value="3">Tối đa 3 tuyến</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[48px_1fr] gap-2">
            <button
              type="button"
              onClick={useGps}
              disabled={gpsLoading}
              className="flex h-12 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container hover:bg-surface-container-high disabled:opacity-60"
              title="Dùng GPS"
            >
              {gpsLoading ? <RefreshCw className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => runSearch()}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-on-primary disabled:opacity-60"
            >
              {loading ? <RefreshCw className="size-4 animate-spin" /> : <Search className="size-4" />}
              Tìm tuyến
            </button>
          </div>
        </div>
      </ExpressiveCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {["Tuyến đề xuất", "Ít chuyển tuyến", "Ít đi bộ", "Nhanh nhất"].map((label, index) => (
                <span
                  key={label}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-black",
                    index === 0 ? "bg-[#14140f] text-[#beff50]" : "bg-surface-container text-on-surface-variant",
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
            <p className="text-xs font-bold text-on-surface-variant">
              {journeys.length ? `Đã tìm thấy ${journeys.length} lộ trình` : "Sẵn sàng tìm lộ trình"}
            </p>
          </div>

          <StaggerGroup className="space-y-3">
            {journeys.map((option, index) => {
              const selected = selectedJourney?.optionId === option.optionId;
              const badges = option.routeBadges?.length
                ? option.routeBadges
                : option.legs.filter((leg) => leg.mode === "BUS").map((leg) => ({
                    routeId: Number(leg.routeId),
                    routeCode: leg.routeCode,
                    routeName: leg.routeName || "",
                    colorHex: leg.colorHex,
                  }));
              return (
                <StaggerItem key={option.optionId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(option.optionId)}
                    className={cn(
                      "w-full rounded-2xl border bg-surface p-4 text-left transition-all hover:border-primary/60 hover:bg-surface-container-low",
                      selected ? "border-primary ring-4 ring-primary/15" : "border-outline-variant",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-[#beff50] text-sm font-black text-[#14140f]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {badges.map((badge) => (
                            <span
                              key={`${option.optionId}-${badge.routeId}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-black text-white"
                              style={{ backgroundColor: badge.colorHex || "#144fcc" }}
                            >
                              <Bus className="size-3.5" />
                              {badge.routeCode || badge.routeId}
                            </span>
                          ))}
                          {option.primaryAction?.enabled && (
                            <span className="rounded-full bg-[#beff50]/25 px-3 py-1 text-xs font-black text-[#166534]">
                              Đăng ký được
                            </span>
                          )}
                        </div>
                        <p className="truncate text-base font-black text-on-surface">
                          {option.legs.find((leg) => leg.mode === "BUS")?.fromStopName || origin?.label}
                          {" -> "}
                          {[...option.legs].reverse().find((leg) => leg.mode === "BUS")?.toStopName || destination?.label}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">
                          {option.summary.singleFare ? formatVND(moneyValue(option.summary.singleFare)) : "Theo tuyến"}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-on-surface-variant">vé lượt</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                      <InfoCell label="Tổng thời gian" value={`${option.summary.totalMinutes} phút`} />
                      <InfoCell label="Xe tới" value={option.summary.firstEtaText || `${option.summary.waitMinutes || 0} phút`} />
                      <InfoCell label="Đi bộ" value={`${Math.round(numberValue(option.summary.walkMeters))}m`} />
                      <InfoCell label="Chuyển tuyến" value={option.summary.transferCount ? `${option.summary.transferCount} lần` : "Không"} />
                      <InfoCell label="Độ tin cậy" value={option.summary.confidence || "HIGH"} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {option.legs.map((leg, legIndex) => (
                        <span key={`${option.optionId}-${leg.legId}`} className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 text-xs font-bold">
                          {leg.mode === "WALK" ? <Navigation2 className="size-3.5" /> : <Bus className="size-3.5" />}
                          {leg.mode === "WALK"
                            ? `${leg.durationMinutes || 0} phút đi bộ`
                            : `${leg.routeCode} · ${leg.stopCount || leg.stops?.length || 0} trạm`}
                          {legIndex < option.legs.length - 1 && <ArrowRight className="size-3 opacity-60" />}
                        </span>
                      ))}
                    </div>
                  </button>
                </StaggerItem>
              );
            })}
          </StaggerGroup>

          {!loading && journeys.length === 0 && (
            <EmptyState
              icon={<RouteIcon className="size-7" />}
              title="Chưa có kết quả"
              description="Chọn điểm đi và điểm đến để UniBus tìm lộ trình từ dữ liệu tuyến Đà Nẵng."
            />
          )}
        </div>

        <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          <ExpressiveCard variant="elevated" className="overflow-hidden p-0">
            <div className="h-[420px] bg-surface-container">
              {selectedJourney && selectedStops.length >= 2 ? (
                <JourneyMap
                  stops={selectedStops}
                  routeColor={primaryColor}
                  buses={journeyBuses}
                  walkPolylines={journeyPolylines}
                  height="100%"
                  animateCamera
                  arrivalOverlay={
                    selectedEta ? (
                      <div className="rounded-2xl bg-[#14140f]/95 p-3 text-white shadow-xl">
                        <p className="text-[10px] font-black uppercase tracking-wide text-[#beff50]">Xe gần nhất</p>
                        <p className="text-sm font-black">{selectedEta.routeCode} tới {selectedEta.stopName}</p>
                        <p className="text-xs opacity-75">{selectedEta.minutesAway} phút nữa</p>
                      </div>
                    ) : null
                  }
                />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <div>
                    <MapPinned className="mx-auto size-12 text-on-surface-variant" />
                    <p className="mt-3 text-sm font-bold text-on-surface">Bản đồ hành trình</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Kết quả tìm tuyến sẽ hiển thị tại đây.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-on-surface-variant">Chi tiết hành trình</p>
                  <h2 className="mt-1 truncate text-lg font-black text-on-surface">
                    {selectedJourney
                      ? `${selectedJourney.summary.totalMinutes} phút · ${selectedJourney.summary.transferCount ? `${selectedJourney.summary.transferCount} lần chuyển` : "đi thẳng"}`
                      : "Chưa chọn lộ trình"}
                  </h2>
                </div>
                {selectedJourney?.summary.monthlyFare != null && (
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{formatVND(moneyValue(selectedJourney.summary.monthlyFare))}</p>
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant">vé tháng</p>
                  </div>
                )}
              </div>

              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {(selectedJourney?.legs || []).map((leg, index) => (
                  <div key={leg.legId} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className="flex size-8 items-center justify-center rounded-full text-xs font-black text-white"
                        style={{ backgroundColor: leg.mode === "BUS" ? (leg.colorHex || primaryColor) : "#64748b" }}
                      >
                        {index + 1}
                      </span>
                      <span className="mt-1 h-full w-px bg-outline-variant" />
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl bg-surface-container-low p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {leg.mode === "BUS" ? <Bus className="size-4 text-primary" /> : <Navigation2 className="size-4 text-on-surface-variant" />}
                        <p className="text-sm font-black">
                          {leg.mode === "BUS" ? `Tuyến ${leg.routeCode}` : "Đi bộ"}
                        </p>
                        <span className="text-xs font-bold text-on-surface-variant">{leg.durationMinutes || 0} phút</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-on-surface-variant">
                        {leg.fromStopName} {"->"} {leg.toStopName}
                      </p>
                      {leg.mode === "BUS" && leg.stops?.length ? (
                        <p className="mt-2 text-[11px] font-bold text-on-surface-variant">
                          {leg.stops.slice(0, 3).map((stop) => stop.stopName).join(" · ")}
                          {leg.stops.length > 3 ? " · ..." : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={registerSelected}
                  disabled={!selectedJourney}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-xs font-black text-on-primary disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  Đăng ký
                </button>
                <button
                  type="button"
                  onClick={buyJourneyPass}
                  disabled={!selectedJourney}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#14140f] px-4 text-xs font-black text-[#beff50] disabled:opacity-50"
                >
                  <QrCode className="size-4" />
                  Mua QR
                </button>
                <button
                  type="button"
                  onClick={trackSelected}
                  disabled={!selectedJourney}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-outline-variant px-4 text-xs font-black hover:bg-surface-container-high disabled:opacity-50"
                >
                  <Navigation className="size-4" />
                  Theo dõi
                </button>
              </div>
            </div>
          </ExpressiveCard>
        </div>
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
  const [selectedJourneyId, setSelectedJourneyId] = useState("");
  const [selectedRoutePreviewId, setSelectedRoutePreviewId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationFocused, setDestinationFocused] = useState(false);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  const stopById = useMemo(() => {
    const map = new Map<string, any>();
    ctx.stops.forEach((s: any) => map.set(String(s.id), s));
    return map;
  }, [ctx.stops]);

  const distanceKm = useCallback((a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(x));
  }, []);

  const stopsForRoute = useCallback((route: any) => {
    const routeId = String(route?.id ?? route?.routeId ?? "");
    const explicitStops = Array.isArray(route?.stops)
      ? route.stops
          .map((stop: any) => stopById.get(String(stop?.id ?? stop?.stopId ?? stop)))
          .filter(Boolean)
      : [];
    if (explicitStops.length >= 2) return explicitStops;
    return ctx.stops.filter((stop: any) =>
      Array.isArray(stop.routes) && stop.routes.map(String).includes(routeId),
    );
  }, [ctx.stops, stopById]);

  const routeRows = useMemo(() => ctx.routes
    .map((route: any) => ({ route, stops: stopsForRoute(route) })), [ctx.routes, stopsForRoute]);
  const routableRows = useMemo(() => routeRows.filter((row: any) => row.stops.length >= 2), [routeRows]);

  const routeEndpoints = (route: any, stops: any[]) => ({
    from: stops[0]?.name || route.from || route.fromStopName || "Điểm đầu",
    to: stops[stops.length - 1]?.name || route.to || route.toStopName || "Điểm cuối",
  });

  const inferBoardingStop = useCallback((destinationId: string) => {
    const candidates: any[] = [];
    ctx.routes.forEach((route: any) => {
      const stops = stopsForRoute(route);
      const destinationIndex = stops.findIndex((s: any) => String(s.id) === destinationId);
      if (destinationIndex > 0) {
        candidates.push(...stops.slice(0, destinationIndex));
      }
    });
    if (!candidates.length) return "";
    const unique = Array.from(new Map(candidates.map((s: any) => [String(s.id), s])).values());
    if (userLocation) {
      unique.sort((a: any, b: any) =>
        distanceKm(userLocation, { lat: Number(a.lat), lng: Number(a.lng) }) -
        distanceKm(userLocation, { lat: Number(b.lat), lng: Number(b.lng) })
      );
    }
    return String(unique[0].id);
  }, [ctx.routes, distanceKm, stopsForRoute, userLocation]);

  const destinationSuggestions = useMemo(() => {
    const query = destinationQuery.trim().toLowerCase();
    const schoolKeywords = ["bach", "bách", "fpt", "vku", "kinh", "duy", "sư", "su", "dai hoc", "đại học", "campus"];
    const list = ctx.stops.filter((s: any) => {
      const haystack = `${s.name || ""} ${s.code || ""} ${s.address || ""}`.toLowerCase();
      if (query) return haystack.includes(query);
      return schoolKeywords.some((keyword) => haystack.includes(keyword));
    });
    return (list.length ? list : ctx.stops).slice(0, 8);
  }, [ctx.stops, destinationQuery]);

  const pickDestination = (stop: any) => {
    setAlightingId(String(stop.id));
    setDestinationQuery(stop.name);
    setSelectedJourneyId("");
    setSelectedRoutePreviewId("");
    setDestinationFocused(false);
  };

  const journeyOptions = useMemo(() => {
    if (!alightingId) return [];
    const effectiveBoardingId = boardingId || inferBoardingStop(alightingId);
    if (!effectiveBoardingId || effectiveBoardingId === alightingId) return [];

    const sliceLeg = (row: any, fromId: string, toId: string) => {
      const fromIdx = row.stops.findIndex((s: any) => String(s.id) === fromId);
      const toIdx = row.stops.findIndex((s: any) => String(s.id) === toId);
      if (fromIdx < 0 || toIdx <= fromIdx) return null;
      const stops = row.stops.slice(fromIdx, toIdx + 1);
      return {
        route: row.route,
        routeId: String(row.route.id),
        routeCode: row.route.code || row.route.routeCode || `R${row.route.id}`,
        routeName: row.route.name || row.route.routeName || "Tuyến xe",
        fromStop: stops[0],
        toStop: stops[stops.length - 1],
        stops,
      };
    };

    const optionFromLegs = (legs: any[]) => {
      const stops = legs.flatMap((leg, index) => index === 0 ? leg.stops : leg.stops.slice(1));
      if (stops.length < 2) return null;
      const distance = stops.slice(1).reduce((sum: number, stop: any, index: number) => {
        const prev = stops[index];
        if (!prev?.lat || !prev?.lng || !stop?.lat || !stop?.lng) return sum;
        return sum + distanceKm(
          { lat: Number(prev.lat), lng: Number(prev.lng) },
          { lat: Number(stop.lat), lng: Number(stop.lng) },
        );
      }, 0);
      const uniqueRoutes = Array.from(new Map(legs.map((leg) => [leg.routeId, leg.route])).values());
      const transferCount = Math.max(0, legs.length - 1);
      const walkMin = userLocation && stops[0]?.lat && stops[0]?.lng
        ? Math.max(3, Math.round(distanceKm(userLocation, { lat: Number(stops[0].lat), lng: Number(stops[0].lng) }) / 4.5 * 60))
        : 0;
      const rideMin = legs.reduce((sum, leg) => sum + Math.max(6, (leg.stops.length - 1) * 3), 0);
      const totalMinutes = walkMin + rideMin + transferCount * 8;
      const singleFare = uniqueRoutes.reduce((sum: number, route: any) => sum + Number(route.singleFare || route.fare || 0), 0);
      const monthlyFare = uniqueRoutes.reduce((sum: number, route: any) => sum + Number(route.monthlyFare || 0), 0);
      const id = legs.map((leg) => `${leg.routeId}:${leg.fromStop.id}-${leg.toStop.id}`).join("|");
      return {
        id,
        legs,
        stops,
        routeCodes: legs.map((leg) => leg.routeCode),
        transferCount,
        totalStops: stops.length,
        totalMinutes,
        totalDistanceKm: distance,
        walkMin,
        score: totalMinutes + transferCount * 12 + distance,
        singleFare,
        monthlyFare,
        universityLinked: legs.some((leg) => leg.route.universityLinked),
      };
    };

    const options: any[] = [];
    const seen = new Set<string>();
    const pushOption = (legs: any[]) => {
      const option = optionFromLegs(legs);
      if (!option || seen.has(option.id)) return;
      seen.add(option.id);
      options.push(option);
    };

    for (const row of routableRows) {
      const leg = sliceLeg(row, effectiveBoardingId, alightingId);
      if (leg) pushOption([leg]);
    }

    for (const first of routableRows) {
      const firstBoardingIdx = first.stops.findIndex((s: any) => String(s.id) === effectiveBoardingId);
      if (firstBoardingIdx < 0) continue;
      for (let i = firstBoardingIdx + 1; i < first.stops.length; i += 1) {
        const transferId = String(first.stops[i].id);
        const legA = sliceLeg(first, effectiveBoardingId, transferId);
        if (!legA) continue;
        for (const second of routableRows) {
          if (String(second.route.id) === String(first.route.id)) continue;
          const legB = sliceLeg(second, transferId, alightingId);
          if (legB) pushOption([legA, legB]);
        }
      }
    }

    for (const first of routableRows) {
      const firstBoardingIdx = first.stops.findIndex((s: any) => String(s.id) === effectiveBoardingId);
      if (firstBoardingIdx < 0) continue;
      for (let i = firstBoardingIdx + 1; i < first.stops.length; i += 1) {
        const transferAId = String(first.stops[i].id);
        const legA = sliceLeg(first, effectiveBoardingId, transferAId);
        if (!legA) continue;
        for (const second of routableRows) {
          if (String(second.route.id) === String(first.route.id)) continue;
          const secondTransferAIdx = second.stops.findIndex((s: any) => String(s.id) === transferAId);
          if (secondTransferAIdx < 0) continue;
          for (let j = secondTransferAIdx + 1; j < second.stops.length; j += 1) {
            const transferBId = String(second.stops[j].id);
            const legB = sliceLeg(second, transferAId, transferBId);
            if (!legB) continue;
            for (const third of routableRows) {
              if ([first.route.id, second.route.id].map(String).includes(String(third.route.id))) continue;
              const legC = sliceLeg(third, transferBId, alightingId);
              if (legC) pushOption([legA, legB, legC]);
            }
          }
        }
      }
    }

    return options
      .sort((a, b) => a.transferCount - b.transferCount || a.score - b.score)
      .slice(0, 8);
  }, [alightingId, boardingId, distanceKm, inferBoardingStop, routableRows, userLocation]);

  useEffect(() => {
    if (!journeyOptions.length) {
      setSelectedJourneyId("");
      return;
    }
    setSelectedJourneyId((current) =>
      journeyOptions.some((option) => option.id === current) ? current : "",
    );
  }, [journeyOptions]);

  useEffect(() => {
    const routeId = window.sessionStorage.getItem("unibus:assistant:route-preview");
    if (!routeId || !routeRows.some((row: any) => String(row.route.id) === routeId)) return;
    setSelectedJourneyId("");
    setSelectedRoutePreviewId(routeId);
    window.sessionStorage.removeItem("unibus:assistant:route-preview");
  }, [routeRows]);

  useEffect(() => {
    if (!selectedJourneyId && !selectedRoutePreviewId) return;
    window.setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [selectedJourneyId, selectedRoutePreviewId]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Trình duyệt không hỗ trợ GPS.");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(nextLocation);
        setGpsLoading(false);
        toast.success("Đã lấy vị trí hiện tại");
      },
      () => {
        setGpsError("Không lấy được vị trí.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const search = () => {
    if (!alightingId) {
      toast.error("Vui lòng chọn điểm cần đến");
      return;
    }
    const effectiveBoardingId = boardingId || inferBoardingStop(alightingId);
    if (!effectiveBoardingId) {
      toast.error("Chưa có trạm lên phù hợp với điểm đến này");
      return;
    }
    if (effectiveBoardingId === alightingId) {
      toast.error("Trạm lên và trạm xuống phải khác nhau");
      return;
    }
    if (!boardingId) {
      setBoardingId(effectiveBoardingId);
    }
    setError(null);
    setLoading(false);
    if (!journeyOptions.length) {
      toast.info("Chưa tìm thấy lộ trình phù hợp từ dữ liệu tuyến hiện có");
      return;
    }
    setSelectedRoutePreviewId("");
    setSelectedJourneyId(journeyOptions[0].id);
  };

  const selectedJourney = journeyOptions.find((option) => option.id === selectedJourneyId) || null;
  const selectedRouteRow = routeRows.find((row: any) => String(row.route.id) === selectedRoutePreviewId) || null;
  const selectedRoute = selectedJourney?.legs[0]?.route || selectedRouteRow?.route || null;
  const selectedJourneyStops = selectedJourney
    ? selectedJourney.stops.map((s: any) => ({
        ...s,
        lat: Number(s.lat),
        lng: Number(s.lng),
      }))
    : selectedRouteRow
      ? selectedRouteRow.stops.map((s: any) => ({
          ...s,
          lat: Number(s.lat),
          lng: Number(s.lng),
        }))
    : [];
  const selectedWalkLines: JourneyPolyline[] = userLocation && selectedJourneyStops.length
    ? [{
        id: "gps-to-boarding",
        label: "Đi bộ đến trạm lên",
        dashed: true,
        points: [
          userLocation,
          { lat: Number(selectedJourneyStops[0].lat), lng: Number(selectedJourneyStops[0].lng) },
        ],
      }]
    : [];
  const selectedMarkers: JourneyExtraMarker[] = userLocation
    ? [{ id: "current", label: "Vị trí hiện tại", lat: userLocation.lat, lng: userLocation.lng, tone: "current" }]
    : [];

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Tìm tuyến xe"
        description=""
        icon={<RouteIcon className="size-7" />}
      />

      <ScrollReveal>
        <div className="rounded-3xl border border-outline-variant bg-surface p-3 sm:p-4 min-w-0">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="relative min-w-0">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
                <Input
                  value={destinationQuery}
                  onFocus={() => setDestinationFocused(true)}
                  onBlur={() => window.setTimeout(() => setDestinationFocused(false), 120)}
                  onChange={(e) => {
                    setDestinationQuery(e.target.value);
                    setAlightingId("");
                    setSelectedJourneyId("");
                    setSelectedRoutePreviewId("");
                  }}
                  placeholder="Bạn muốn đến đâu?"
                  className="h-12 rounded-2xl pl-12 pr-4 text-base font-bold"
                />
              </div>
              {(destinationFocused || destinationQuery || !alightingId) && destinationSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-xl">
                  {destinationSuggestions.map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        pickDestination(s);
                      }}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-container-high",
                        alightingId === String(s.id) && "bg-primary-container text-on-primary-container",
                      )}
                    >
                      <MapPin className="size-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{s.name}</span>
                        {(s.address || s.code) && (
                          <span className="block truncate text-xs text-on-surface-variant">{s.address || s.code}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 lg:w-[300px]">
              <button
                onClick={detectLocation}
                disabled={gpsLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-outline-variant px-4 text-sm font-black hover:bg-surface-container-high disabled:opacity-60"
              >
                {gpsLoading ? <RefreshCw className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
                GPS
              </button>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                onClick={search}
                disabled={loading || !alightingId}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-on-primary disabled:opacity-50"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : <Navigation className="size-4" />}
                Chỉ đường
              </motion.button>
            </div>
          </div>

          {gpsError && <p className="mt-2 text-xs font-medium text-error">{gpsError}</p>}
        </div>
      </ScrollReveal>

      {error && <ErrorScreen message={error} onRetry={search} />}

      <div ref={mapSectionRef}>
        {selectedJourneyStops.length > 1 && selectedRoute && (
          <ScrollReveal delay={0.05}>
            <JourneyMap
              stops={selectedJourneyStops}
              routeColor={selectedRoute.color || "#144fcc"}
              progress={0}
              nextStopIndex={0}
              buses={[]}
              extraMarkers={selectedMarkers}
              walkPolylines={selectedWalkLines}
              height={480}
              animateCamera
              arrivalOverlay={
                <div className="rounded-2xl bg-[#14140f]/95 p-3 text-white shadow-xl border border-[#beff50]/30">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#beff50]">
                    {selectedJourney ? "Lộ trình gợi ý" : "Tuyến đang chọn"}
                  </p>
                  <p className="mt-1 text-sm font-black">{selectedRoute.code} · {selectedJourneyStops.length} trạm</p>
                  <p className="text-[10px] opacity-70">Bấm vào từng trạm để xem thông tin</p>
                </div>
              }
            />
          </ScrollReveal>
        )}
      </div>

      {alightingId && journeyOptions.length > 0 && (
        <ScrollReveal delay={0.1}>
          <Section title={`${journeyOptions.length} lộ trình tốt nhất`}>
            <StaggerGroup className="space-y-3 min-w-0">
              {journeyOptions.map((option, idx) => {
                const firstLeg = option.legs[0];
                const lastLeg = option.legs[option.legs.length - 1];
                const relatedTrip = ctx.trips.find((t: any) =>
                  option.legs.some((leg: any) => String(leg.routeId) === String(t.routeId)) &&
                  ["running", "scheduled", "RUNNING", "SCHEDULED"].includes(String(t.status)),
                );
                const isRunning = String(relatedTrip?.status || "").toLowerCase() === "running";
                const selected = selectedJourney?.id === option.id;
                const palettes = [
                  { bg: "#14140f", fg: "#ffffff", accent: "#beff50", chipBg: "#beff50", chipFg: "#14140f" },
                  { bg: "#144fcc", fg: "#ffffff", accent: "#beff50", chipBg: "#beff50", chipFg: "#14140f" },
                  { bg: "#ff8c5f", fg: "#14140f", accent: "#14140f", chipBg: "#14140f", chipFg: "#beff50" },
                ];
                const pal = palettes[idx % palettes.length];
                return (
                  <StaggerItem key={option.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoutePreviewId("");
                        setSelectedJourneyId(option.id);
                      }}
                      className={cn(
                        "relative w-full overflow-hidden rounded-3xl p-5 sm:p-6 text-left min-w-0 transition-all",
                        selected && "ring-4 ring-[#beff50]/70",
                      )}
                      style={{ backgroundColor: pal.bg, color: pal.fg }}
                    >
                      <div className="relative flex flex-wrap items-start justify-between gap-4 mb-4 min-w-0">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {option.routeCodes.map((code: string, codeIdx: number) => (
                              <span
                                key={`${option.id}-${code}-${codeIdx}`}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-bold"
                                style={{ backgroundColor: pal.chipBg, color: pal.chipFg }}
                              >
                                <Bus className="size-4" />
                                {code}
                              </span>
                            ))}
                          </div>
                          <p className="text-base font-bold truncate">
                            {firstLeg.fromStop.name} → {lastLeg.toStop.name}
                          </p>
                          <p className="text-xs opacity-80">
                            {option.transferCount === 0 ? "Đi thẳng" : `Chuyển tuyến ${option.transferCount} lần`} · {option.totalStops} trạm
                          </p>
                        </div>
                        {option.universityLinked && (
                          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-bold shrink-0" style={{ backgroundColor: "#beff50", color: "#14140f" }}>
                            <School className="size-3.5" />
                            Dành cho trường bạn
                          </span>
                        )}
                      </div>

                      <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4 min-w-0">
                        {[
                          { label: "Xe đến trạm", value: option.walkMin ? `${option.walkMin} phút đi bộ` : "Bật GPS", icon: Crosshair },
                          { label: "Tổng thời gian", value: `${option.totalMinutes} phút`, icon: Clock },
                          { label: "Chuyển tuyến", value: option.transferCount ? `${option.transferCount} lần` : "Không", icon: ArrowLeftRight },
                          { label: "Tổng km", value: option.totalDistanceKm ? `${option.totalDistanceKm.toFixed(1)} km` : "Ước tính", icon: MapPin },
                          { label: "Trạng thái", value: isRunning ? "Đang đi" : "Chưa đi", icon: Navigation },
                          { label: "Giá vé", value: option.singleFare ? formatVND(option.singleFare) : "Theo tuyến", icon: Wallet },
                        ].map((m) => (
                          <div
                            key={m.label}
                            className="rounded-xl p-3 min-w-0"
                            style={{ backgroundColor: idx % 3 === 2 ? "rgba(20,20,15,0.10)" : "rgba(255,255,255,0.12)" }}
                          >
                            <m.icon className="size-4 mb-1" style={{ color: pal.accent }} />
                            <p className="text-[10px] opacity-70 truncate">{m.label}</p>
                            <p className="text-sm font-bold truncate">{m.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="relative mb-4 space-y-2">
                        {option.legs.map((leg: any, legIdx: number) => (
                          <div key={`${option.id}-${legIdx}`} className="rounded-2xl bg-white/10 p-3">
                            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                              <span style={{ color: pal.accent }}>{leg.routeCode}</span>
                              <span>{leg.fromStop.name}</span>
                              <ArrowRight className="size-4 opacity-60" />
                              <span>{leg.toStop.name}</span>
                            </div>
                            <p className="mt-1 text-xs opacity-75">{leg.stops.length} trạm · bấm card để xem trên bản đồ</p>
                          </div>
                        ))}
                      </div>

                      <div className="relative flex flex-wrap items-center justify-between gap-3 min-w-0">
                        <p className="text-xs opacity-75">Polyline bản đồ theo thứ tự trạm, chưa phải routing theo làn đường thật.</p>
                        <motion.span
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          onClick={(event) => {
                            event.stopPropagation();
                            localStorage.setItem("unibus.pendingRegistration", JSON.stringify({
                              routeId: String(firstLeg.routeId),
                              boardingStopId: String(firstLeg.fromStop.id),
                              alightingStopId: String(firstLeg.toStop.id),
                            }));
                            onNavigate("stu-my-routes");
                          }}
                          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold shrink-0"
                          style={{ backgroundColor: pal.accent, color: pal.bg }}
                        >
                          {option.transferCount ? "Đăng ký chặng đầu" : "Đăng ký tuyến này"}
                          <ArrowRight className="size-4" />
                        </motion.span>
                      </div>
                    </button>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </Section>
        </ScrollReveal>
      )}

      {alightingId && journeyOptions.length === 0 && !loading && (
        <EmptyState
          icon={<RouteIcon className="size-7" />}
          title="Chưa có lộ trình phù hợp"
          description="Dữ liệu hiện tại chưa tìm được tuyến trực tiếp hoặc liên tuyến tới điểm này."
        />
      )}

      <ScrollReveal delay={0.15}>
        <Section title={`Tất cả tuyến đang hoạt động (${routeRows.length})`}>
          <StaggerGroup className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-w-0">
            {routeRows.map(({ route, stops }: any) => {
              const endpoints = routeEndpoints(route, stops);
              const singleFare = route.singleFare || route.fare;
              const monthlyFare = route.monthlyFare || route.monthlyPass;
              return (
                <StaggerItem key={route.id}>
                  <ExpressiveCard
                    variant="filled"
                    interactive
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (stops.length < 2) {
                        toast.error("Tuyến này chưa có dữ liệu trạm để hiển thị bản đồ");
                        return;
                      }
                      setSelectedJourneyId("");
                      setSelectedRoutePreviewId(String(route.id));
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      if (stops.length < 2) {
                        toast.error("Tuyến này chưa có dữ liệu trạm để hiển thị bản đồ");
                        return;
                      }
                      setSelectedJourneyId("");
                      setSelectedRoutePreviewId(String(route.id));
                    }}
                    className={cn(
                      "p-4 min-w-0 transition-all",
                      selectedRoutePreviewId === String(route.id) && "ring-4 ring-primary/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#14140f] px-3 text-xs font-black text-[#beff50]">
                            <Bus className="size-3.5" />
                            {route.code || route.routeCode}
                          </span>
                          {route.universityLinked && <Badge variant="outline">Trường bạn</Badge>}
                        </div>
                        <p className="text-sm font-black truncate">{route.name || route.routeName}</p>
                        <p className="mt-1 text-xs text-on-surface-variant truncate">
                          {endpoints.from} → {endpoints.to}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black">{stops.length || "—"}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">trạm</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <InfoCell label="Tần suất" value={route.frequencyMin ? `${route.frequencyMin} phút` : "Theo lịch"} />
                      <InfoCell label="Vé lượt" value={singleFare ? formatVND(singleFare) : "—"} />
                      <InfoCell label="Vé tháng" value={monthlyFare ? formatVND(monthlyFare) : "—"} />
                    </div>
                    {stops.length > 0 && <details
                      className="mt-3 rounded-2xl bg-surface-container-high px-3 py-2 text-sm"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <summary className="cursor-pointer font-bold">Trạm dừng</summary>
                      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                        {stops.map((stop: any, stopIdx: number) => (
                          <button
                            key={`${route.id}-${stop.id}`}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              pickDestination(stop);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-surface-container-low"
                          >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-[10px] font-black text-on-primary-container">{stopIdx + 1}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-bold">{stop.name}</span>
                              <span className="block truncate text-[10px] text-on-surface-variant">{stop.address || stop.code}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </details>}
                  </ExpressiveCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </Section>
      </ScrollReveal>
    </PageTransition>
  );
}

// =============================================================================
// Screen 5: Tracking — live map + ETA
// =============================================================================
function TrackingScreen({ ctx, compact = false }: { ctx: Ctx; compact?: boolean }) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(ctx.routes[0]?.id || "");
  const [eta, setEta] = useState<EtaDTO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [journeyId, setJourneyId] = useState("");
  const [journeyTracking, setJourneyTracking] = useState<JourneyTrackingSnapshotDTO | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);

  const selectedRoute = ctx.routes.find((r) => r.id === selectedRouteId);
  const routeStops = useMemo(
    () => ctx.stops.filter((s: any) => selectedRoute?.stops?.includes(s.id)),
    [ctx.stops, selectedRoute],
  );

  const numberValue = (value: number | string | undefined | null) => Number(value ?? 0) || 0;
  const firstBusLine = journeyTracking?.polylines?.find((line) => line.mode !== "WALK");
  const journeyRouteColor = firstBusLine?.colorHex || "#6CA82B";
  const journeyPolylines: JourneyPolyline[] = useMemo(() => (
    journeyTracking?.polylines || []
  ).map((line) => ({
    id: line.legId,
    label: line.mode === "WALK" ? "Đi bộ" : "Tuyến xe",
    color: line.colorHex || (line.mode === "WALK" ? "#14140f" : "#6CA82B"),
    dashed: line.mode === "WALK",
    points: (line.points || [])
      .map((point) => ({ lat: numberValue(point.latitude), lng: numberValue(point.longitude) }))
      .filter((point) => point.lat && point.lng),
  })).filter((line) => line.points.length >= 2), [journeyTracking?.polylines]);

  const journeyStops = useMemo(() => {
    const points = journeyPolylines.flatMap((line) => line.points);
    const first = points[0];
    const last = points[points.length - 1];
    if (!first || !last) return [];
    return [
      {
        id: "journey-origin",
        name: "Điểm xuất phát",
        code: "A",
        address: "Đà Nẵng",
        lat: first.lat,
        lng: first.lng,
        routes: [],
        hasShelter: false,
      },
      {
        id: "journey-destination",
        name: "Điểm đến",
        code: "B",
        address: "Đà Nẵng",
        lat: last.lat,
        lng: last.lng,
        routes: [],
        hasShelter: false,
      },
    ];
  }, [journeyPolylines]);

  const journeyBuses = useMemo(() => (journeyTracking?.vehicles || [])
    .map((vehicle) => ({
      id: vehicle.vehicleId,
      plate: vehicle.plateNumber || "43B-00000",
      routeCode: vehicle.routeCode || "BUS",
      routeColor: journeyRouteColor,
      lat: numberValue(vehicle.latitude),
      lng: numberValue(vehicle.longitude),
      occupancy: vehicle.occupancy,
      capacity: vehicle.capacity,
      etaMinutes: vehicle.etaMinutes,
    }))
    .filter((vehicle) => vehicle.lat && vehicle.lng), [journeyRouteColor, journeyTracking?.vehicles]);

  useEffect(() => {
    setJourneyId(localStorage.getItem("unibus.trackingJourneyId") || "");
  }, []);

  const loadJourneyTracking = useCallback(async () => {
    if (!journeyId) return;
    setJourneyLoading(true);
    try {
      const snapshot = await transportApi.trackJourney(journeyId);
      setJourneyTracking(snapshot);
    } catch {
      setJourneyTracking(null);
    } finally {
      setJourneyLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    if (!journeyId) return;
    void loadJourneyTracking();
    const interval = window.setInterval(loadJourneyTracking, 15000);
    return () => window.clearInterval(interval);
  }, [journeyId, loadJourneyTracking]);

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

  const clearJourneyTracking = () => {
    localStorage.removeItem("unibus.trackingJourneyId");
    setJourneyId("");
    setJourneyTracking(null);
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      {!compact && (
        <PageHeader
          title="Theo dõi xe"
          description="Vị trí xe và thời gian đến trạm theo thời gian thực."
          icon={<Navigation className="size-7" />}
          actions={
            journeyId ? (
              <button
                type="button"
                onClick={clearJourneyTracking}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-outline-variant px-4 text-sm font-black hover:bg-surface-container-high"
              >
                <RouteIcon className="size-4" />
                Chọn tuyến khác
              </button>
            ) : (
              <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Chọn tuyến" /></SelectTrigger>
                <SelectContent>
                  {ctx.routes.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.code} - {r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }
        />
      )}

      {compact && !journeyId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface p-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-on-surface-variant">Theo dõi tuyến</p>
            <p className="truncate text-sm font-semibold text-on-surface">
              {selectedRoute ? `${selectedRoute.code} - ${selectedRoute.name}` : "Chọn tuyến để xem ETA"}
            </p>
          </div>
          <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
            <SelectTrigger className="h-10 w-full rounded-xl border-outline-variant bg-surface text-sm shadow-none sm:w-64">
              <SelectValue placeholder="Chọn tuyến" />
            </SelectTrigger>
            <SelectContent>
              {ctx.routes.map((r: any) => (
                <SelectItem key={r.id} value={r.id}>{r.code} - {r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {journeyId && (
        <div className="grid grid-cols-1 gap-4 min-w-0 xl:grid-cols-[minmax(0,1fr)_420px]">
          <ScrollReveal>
            <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
              <div className="h-[460px] bg-surface-container">
                {journeyStops.length >= 2 ? (
                  <JourneyMap
                    stops={journeyStops}
                    routeColor={journeyRouteColor}
                    buses={journeyBuses}
                    walkPolylines={journeyPolylines}
                    height="100%"
                    animateCamera
                    arrivalOverlay={
                      journeyTracking?.stopEtas?.[0] ? (
                        <div className="rounded-2xl bg-[#14140f]/95 p-3 text-white shadow-xl">
                          <p className="text-[10px] font-black uppercase tracking-wide text-[#beff50]">Xe gần nhất</p>
                          <p className="text-sm font-black">
                            {journeyTracking.stopEtas[0].routeCode} tới {journeyTracking.stopEtas[0].stopName}
                          </p>
                          <p className="text-xs opacity-75">{journeyTracking.stopEtas[0].minutesAway} phút nữa</p>
                        </div>
                      ) : null
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <div>
                      <RefreshCw className={cn("mx-auto size-10 text-on-surface-variant", journeyLoading && "animate-spin")} />
                      <p className="mt-3 text-sm font-bold text-on-surface">Đang tải hành trình</p>
                      <p className="mt-1 text-xs text-on-surface-variant">Mô phỏng xe sẽ cập nhật mỗi 15 giây.</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant p-4">
                <div>
                  <p className="text-xs font-black uppercase text-on-surface-variant">Journey ID</p>
                  <p className="max-w-[360px] truncate text-sm font-black text-on-surface">{journeyId}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                  <RefreshCw className={cn("size-4", journeyLoading && "animate-spin")} />
                  {journeyTracking?.updatedAt ? `Cập nhật ${formatDateTime(journeyTracking.updatedAt)}` : "Đang đồng bộ"}
                </div>
              </div>
            </ExpressiveCard>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <ExpressiveCard variant="filled" className="p-5 min-w-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-on-surface-variant">Xe đang chạy</p>
                  <h3 className="text-lg font-black text-on-surface">{journeyBuses.length || 0} xe mô phỏng</h3>
                </div>
                <button onClick={loadJourneyTracking} className="text-on-surface-variant hover:text-primary">
                  <RefreshCw className={cn("size-4", journeyLoading && "animate-spin")} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <InfoCell label="Cập nhật" value="15 giây" />
                <InfoCell label="ETA tiếp theo" value={journeyTracking?.stopEtas?.[0]?.minutesAway != null ? `${journeyTracking.stopEtas[0].minutesAway} phút` : "Đang tính"} />
              </div>

              <div className="mt-5 space-y-3">
                {(journeyTracking?.vehicles || []).map((vehicle) => (
                  <motion.div
                    key={vehicle.vehicleId}
                    layout
                    className="rounded-2xl border border-outline-variant bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-on-surface">
                          {vehicle.routeCode || "BUS"} · {vehicle.plateNumber || "43B-00000"}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Trạm kế: {vehicle.nextStopName || "đang xác định"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#beff50]/25 px-3 py-1 text-xs font-black text-[#166534]">
                        {vehicle.etaMinutes ?? 0} phút
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <InfoCell label="Tốc độ" value={`${Math.round(numberValue(vehicle.speedKmh))} km/h`} />
                      <InfoCell label="Tải" value={vehicle.occupancy != null && vehicle.capacity ? `${vehicle.occupancy}/${vehicle.capacity}` : "--"} />
                      <InfoCell label="Tuyến" value={vehicle.routeCode || "--"} />
                    </div>
                  </motion.div>
                ))}
                {!journeyTracking?.vehicles?.length && (
                  <EmptyState
                    icon={<Bus className="size-7" />}
                    title="Chưa có xe mô phỏng"
                    description="Hệ thống đang dựng snapshot theo lịch chạy và shape tuyến."
                  />
                )}
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-xs font-black uppercase text-on-surface-variant">ETA các trạm</p>
                {(journeyTracking?.stopEtas || []).slice(0, 6).map((stop) => (
                  <div key={`${stop.routeId}-${stop.stopId}`} className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black">{stop.stopName}</p>
                      <p className="text-[10px] text-on-surface-variant">{stop.routeCode || "BUS"}</p>
                    </div>
                    <p className="text-xs font-black text-primary">{stop.minutesAway ?? 0} phút</p>
                  </div>
                ))}
              </div>
            </ExpressiveCard>
          </ScrollReveal>
        </div>
      )}

      {!journeyId && selectedRoute && (
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
// Screen 5.5: My Journeys — registered routes + tickets + tracking in one place
// =============================================================================
function MyJourneysScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const [tab, setTab] = useState("routes");
  const tabs = [
    { id: "routes", label: "Tuyến đã đăng ký", icon: TicketCheck },
    { id: "ticket", label: "Vé & QR", icon: QrCode },
    { id: "tracking", label: "Theo dõi xe", icon: Navigation },
  ];

  return (
    <PageTransition className="space-y-5 min-w-0">
      <PageHeader
        title="Chuyến đi của tôi"
        description="Quản lý tuyến đã đăng ký, vé tháng và trạng thái xe trong một nơi."
        icon={<TicketCheck className="size-7" />}
        actions={
          <ExpressiveButton variant="filled" onClick={() => onNavigate("stu-find")}>
            <RouteIcon className="size-4" />
            Tìm tuyến mới
          </ExpressiveButton>
        }
      />

      <div className="rounded-3xl border border-outline-variant bg-surface p-2">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "state-layer flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-bold transition-colors sm:text-sm",
                  active
                    ? "bg-[#BDFD4F] text-[#14140f]"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {tab === "routes" && <MyRoutesScreen ctx={ctx} onNavigate={onNavigate} compact />}
          {tab === "ticket" && <MyTicketScreen ctx={ctx} onNavigate={onNavigate} compact />}
          {tab === "tracking" && <TrackingScreen ctx={ctx} compact />}
        </motion.div>
      </AnimatePresence>
    </PageTransition>
  );
}

// =============================================================================
// Screen 6: My Routes — registration management
// =============================================================================
function MyRoutesScreen({ ctx, onNavigate, compact = false }: { ctx: Ctx; onNavigate: (id: string) => void; compact?: boolean }) {
  const [showRegister, setShowRegister] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [working, setWorking] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationDTO[]>([]);
  const [targetCancel, setTargetCancel] = useState<RegistrationDTO | null>(null);

  const reg = ctx.registration;
  const activeRegistrations = registrations.length ? registrations : reg ? [reg] : [];

  const loadRegistrations = useCallback(async () => {
    try {
      const list = await studentApi.registrations();
      setRegistrations(list);
    } catch {
      setRegistrations(reg ? [reg] : []);
    }
  }, [reg]);

  useEffect(() => {
    loadRegistrations();
    if (localStorage.getItem("unibus.pendingRegistration")) {
      setShowRegister(true);
    }
  }, [loadRegistrations]);

  const doCancel = async () => {
    const selected = targetCancel || reg;
    if (!selected) return;
    setWorking(true);
    try {
      await studentApi.cancelRegistration(selected.registrationId, cancelReason || undefined);
      toast.success("Đã hủy đăng ký tuyến");
      await loadRegistrations();
      ctx.reload();
      setCancelling(false);
      setTargetCancel(null);
      setCancelReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể hủy đăng ký");
    } finally {
      setWorking(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      {!compact && (
        <PageHeader
          title="Tuyến của tôi"
          description="Quản lý tuyến đã đăng ký và thay đổi trạm lên/xuống."
          icon={<TicketCheck className="size-7" />}
          actions={
            <ExpressiveButton variant="filled" onClick={() => setShowRegister(true)}>
              <Plus className="size-4" />
              Đăng ký tuyến
            </ExpressiveButton>
          }
        />
      )}

      {activeRegistrations.length === 0 ? (
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
        <StaggerGroup className="grid gap-4 lg:grid-cols-2 min-w-0">
          {activeRegistrations.map((item: RegistrationDTO) => {
            const regRoute = ctx.routes.find((r) => r.id === String(item.routeId));
            return (
              <StaggerItem key={item.registrationId}>
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  className="relative overflow-hidden rounded-3xl p-6 elev-2 min-w-0"
                  style={{ backgroundColor: "#beff50", color: "#14140f" }}
                >
                  <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" />
                  <div className="relative flex items-start gap-4 min-w-0">
                    <div
                      className="size-16 shrink-0 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg"
                      style={{ backgroundColor: "#14140f", color: regRoute?.color || "#beff50" }}
                    >
                      {(regRoute?.code || "UB").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <h2 className="text-xl font-black truncate">{item.routeName}</h2>
                        <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-bold bg-[#14140f] text-[#beff50]">
                          {item.status}
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <InfoCell label="Trạm lên" value={item.boardingStopName || "—"} />
                        <InfoCell label="Trạm xuống" value={item.alightingStopName || "—"} />
                        <InfoCell label="Hiệu lực" value={formatDate(item.effectiveDate)} />
                        <InfoCell label="Đăng ký" value={formatDate(item.registeredAt)} />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <motion.button
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          onClick={() => {
                            localStorage.setItem("unibus.paymentRouteId", String(item.routeId));
                            onNavigate("stu-payment");
                          }}
                          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-[#14140f] text-[#beff50] text-sm font-bold"
                        >
                          <CreditCard className="size-4" />
                          Mua vé tháng
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          onClick={() => {
                            setTargetCancel(item);
                            setCancelling(true);
                          }}
                          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-white text-[#14140f] text-sm font-bold border-2 border-[#14140f]"
                        >
                          <Trash2 className="size-4" />
                          Hủy đăng ký
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
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

  useEffect(() => {
    const raw = localStorage.getItem("unibus.pendingRegistration");
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      if (pending.routeId) setRouteId(String(pending.routeId));
      if (pending.boardingStopId) setBoardingStopId(String(pending.boardingStopId));
      if (pending.alightingStopId) setAlightingStopId(String(pending.alightingStopId));
      localStorage.removeItem("unibus.pendingRegistration");
    } catch {
      localStorage.removeItem("unibus.pendingRegistration");
    }
  }, []);

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
function MyTicketScreen({ ctx, onNavigate, compact = false }: { ctx: Ctx; onNavigate: (id: string) => void; compact?: boolean }) {
  const t = ctx.activeTicket;
  const [expanded, setExpanded] = useState(false);

  if (!t) {
    return (
      <PageTransition>
        {!compact && <PageHeader title="Vé của tôi" icon={<QrCode className="size-7" />} />}
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
      {!compact && <PageHeader title="Vé của tôi" icon={<QrCode className="size-7" />} />}

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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Vé tháng sinh viên</p>
                <h2 className="text-2xl sm:text-3xl font-black mt-1 truncate">{t.routeName}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold items-center">
                    {t.routeCode || route?.code || "UNIBUS"}
                  </span>
                  <span className={cn(
                    "inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs font-bold",
                    t.status === "ACTIVE" ? "bg-[#14140f] text-[#beff50]" : "bg-[#f59e0b] text-[#14140f]"
                  )}>
                    <span className={cn("size-1.5 rounded-full", t.status === "ACTIVE" && "animate-pulse")} style={{ backgroundColor: t.status === "ACTIVE" ? "#beff50" : "#14140f" }} />
                    {t.status === "ACTIVE" ? "Đang hoạt động" : t.status}
                  </span>
                  <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white/20 text-xs font-bold backdrop-blur">
                    <Calendar className="size-3.5" />
                    30 ngày
                  </span>
                </div>
              </div>
              {t.qrCode && (
                <motion.button
                  onClick={() => setExpanded((v) => !v)}
                  className="bg-white p-3 rounded-2xl shadow-lg shrink-0 relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <QRCodeCanvas value={t.qrCode} size={expanded ? 180 : 100} level="H" />
                  <div className="absolute -top-1.5 -right-1.5 size-6 rounded-full bg-[#14140f] text-[#beff50] flex items-center justify-center">
                    <Maximize2 className="size-3" />
                  </div>
                </motion.button>
              )}
            </div>

            {/* Info chips — rounded boxes với icon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 min-w-0">
              <div className="bg-[#14140f]/10 rounded-xl p-3 min-w-0">
                <MapPin className="size-4 mb-1 opacity-70" />
                <p className="text-[10px] font-bold opacity-70 uppercase">Trạm lên</p>
                <p className="font-bold text-sm truncate">{t.boardingStopName || "—"}</p>
              </div>
              <div className="bg-[#14140f]/10 rounded-xl p-3 min-w-0">
                <MapPin className="size-4 mb-1 opacity-70" />
                <p className="text-[10px] font-bold opacity-70 uppercase">Trạm xuống</p>
                <p className="font-bold text-sm truncate">{t.alightingStopName || "—"}</p>
              </div>
              <div className="bg-[#14140f]/10 rounded-xl p-3 min-w-0">
                <Calendar className="size-4 mb-1 opacity-70" />
                <p className="text-[10px] font-bold opacity-70 uppercase">Hiệu lực</p>
                <p className="font-bold text-sm truncate">{formatDate(t.validFrom)}</p>
              </div>
              <div className="bg-[#14140f]/10 rounded-xl p-3 min-w-0">
                <Clock className="size-4 mb-1 opacity-70" />
                <p className="text-[10px] font-bold opacity-70 uppercase">Hết hạn</p>
                <p className="font-bold text-sm truncate">{formatDate(t.expiresAt || t.expiresOn)}</p>
              </div>
            </div>

            {t.finalFareAmount != null && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#14140f]/15 min-w-0">
                <div className="flex flex-wrap items-center gap-3 min-w-0">
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
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  onClick={() => onNavigate("stu-payment")}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#14140f] text-[#beff50] text-xs font-bold shrink-0"
                >
                  Gia hạn vé
                  <ArrowRight className="size-4" />
                </motion.button>
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
// Screen 8: History — travel history list with stat cards
// =============================================================================
function HistoryScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const [view, setView] = useState<"trips" | "feedback" | "lost">("trips");
  const totalTrips = ctx.tripsHistory.length;
  const [feedbackTrip, setFeedbackTrip] = useState<any | null>(null);
  const [supportTrip, setSupportTrip] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("service");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [supportContent, setSupportContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Estimate monthly spend from active ticket fare
  const monthlyFare = ctx.activeTicket?.finalFareAmount ?? ctx.activeTicket?.originalFareAmount ?? 0;
  const thisMonthTrips = ctx.tripsHistory.filter((h: any) => {
    const d = new Date(h.boardedAt || h.serviceDate || "");
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const feedbackRoute = feedbackTrip ? ctx.routes.find((r: any) => String(r.id) === String(feedbackTrip.routeId)) : null;
  const supportRoute = supportTrip ? ctx.routes.find((r: any) => String(r.id) === String(supportTrip.routeId)) : null;

  const submitFeedback = async () => {
    if (!feedbackTrip) return;
    if (!feedbackContent.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    setSubmitting(true);
    try {
      await feedbackApi.create({
        tripId: feedbackTrip.tripId ? Number(feedbackTrip.tripId) : undefined,
        routeId: feedbackTrip.routeId ? Number(feedbackTrip.routeId) : undefined,
        rating,
        category,
        content: feedbackContent.trim(),
      });
      toast.success("Đã gửi phản hồi");
      setFeedbackTrip(null);
      setFeedbackContent("");
      setRating(5);
      setCategory("service");
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể gửi phản hồi");
    } finally {
      setSubmitting(false);
    }
  };

  const submitSupport = async () => {
    if (!supportTrip) return;
    if (!supportContent.trim()) {
      toast.error("Vui lòng nhập nội dung cần hỗ trợ");
      return;
    }
    setSubmitting(true);
    try {
      const routeName = supportTrip.routeName || supportRoute?.name || "chuyến đi";
      await experienceApi.createStudentSupportTicket({
        title: `Hỗ trợ ${routeName}`,
        supportType: "TRIP_SUPPORT",
        content: [
          `Chuyến: ${routeName}`,
          `Ngày đi: ${formatDate(supportTrip.boardedAt || supportTrip.serviceDate)}`,
          `Nội dung: ${supportContent.trim()}`,
        ].join("\n"),
      });
      toast.success("Đã gửi yêu cầu hỗ trợ");
      setSupportTrip(null);
      setSupportContent("");
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể gửi yêu cầu hỗ trợ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lịch sử chuyến đi"
        description="Xem chuyến đã đi, gửi đánh giá hoặc báo thất lạc theo từng chuyến."
        icon={<History className="size-7" />}
      />

      <Tabs value={view} onValueChange={(value) => setView(value as "trips" | "feedback" | "lost")}>
        <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-surface-container-low p-1 shadow-none">
          <TabsTrigger value="trips" className="rounded-xl">Chuyến đã đi</TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-xl">Phản hồi</TabsTrigger>
          <TabsTrigger value="lost" className="rounded-xl">Mất đồ</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "feedback" && <FeedbackScreen ctx={ctx} compact />}
      {view === "lost" && <LostItemsScreen ctx={ctx} compact />}
      {view !== "trips" ? null : (
        <>
      {/* Stat cards — 3 mini cards giống prototype */}
      {totalTrips > 0 && (
        <StaggerGroup className="grid grid-cols-3 gap-2 sm:gap-3 min-w-0">
          <StaggerItem>
            <div className="rounded-2xl bg-[#14140f] text-[#beff50] p-3 sm:p-4 text-center min-w-0">
              <p className="text-xl sm:text-2xl font-bold tabular-nums">{totalTrips}</p>
              <p className="text-[10px] sm:text-xs font-bold opacity-70 uppercase truncate">Tổng chuyến</p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="rounded-2xl bg-[#144fcc] text-white p-3 sm:p-4 text-center min-w-0">
              <p className="text-xl sm:text-2xl font-bold tabular-nums">{thisMonthTrips}</p>
              <p className="text-[10px] sm:text-xs font-bold opacity-70 uppercase truncate">Tháng này</p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="rounded-2xl bg-[#ff8c5f] text-[#14140f] p-3 sm:p-4 text-center min-w-0">
              <p className="text-base sm:text-lg font-bold tabular-nums truncate">{monthlyFare ? formatVND(monthlyFare) : "—"}</p>
              <p className="text-[10px] sm:text-xs font-bold opacity-70 uppercase truncate">Chi phí tháng</p>
            </div>
          </StaggerItem>
        </StaggerGroup>
      )}

      {totalTrips === 0 ? (
        <EmptyState
          icon={<History className="size-7" />}
          title="Chưa có chuyến đi nào"
          description="Lịch sử sẽ hiển thị tại đây sau khi bạn dùng vé tháng để đi xe."
        />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {ctx.tripsHistory.map((h: any) => (
            <StaggerItem key={h.id}>
              <HistoryRow
                history={h}
                routes={ctx.routes}
                onFeedback={setFeedbackTrip}
                onSupport={setSupportTrip}
                onLostItem={() => {
                  localStorage.setItem("unibus.lostTripId", String(h.tripId || h.id));
                  setView("lost");
                }}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
        </>
      )}

      <Dialog open={!!feedbackTrip} onOpenChange={(open) => !open && setFeedbackTrip(null)}>
        {feedbackTrip && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Phản hồi chuyến đi</DialogTitle>
              <DialogDescription>
                {feedbackTrip.routeName || feedbackRoute?.name || "Chuyến xe"} · {formatDate(feedbackTrip.boardedAt || feedbackTrip.serviceDate)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold">Đánh giá</Label>
                <div className="mt-1.5"><M3StarRating value={rating} onChange={setRating} size="size-7" /></div>
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
                <Label className="text-xs font-bold">Nội dung</Label>
                <Textarea className="mt-1.5" rows={4} value={feedbackContent} onChange={(e) => setFeedbackContent(e.target.value)} placeholder="Nhập phản hồi về chuyến đi..." />
              </div>
            </div>
            <DialogFooter>
              <ExpressiveButton variant="text" onClick={() => setFeedbackTrip(null)} disabled={submitting}>Hủy</ExpressiveButton>
              <ExpressiveButton variant="filled" onClick={submitFeedback} disabled={submitting}>
                {submitting ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
                Gửi phản hồi
              </ExpressiveButton>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!supportTrip} onOpenChange={(open) => !open && setSupportTrip(null)}>
        {supportTrip && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yêu cầu hỗ trợ</DialogTitle>
              <DialogDescription>
                {supportTrip.routeName || supportRoute?.name || "Chuyến xe"} · {formatDate(supportTrip.boardedAt || supportTrip.serviceDate)}
              </DialogDescription>
            </DialogHeader>
            <div>
              <Label className="text-xs font-bold">Bạn cần hỗ trợ gì?</Label>
              <Textarea className="mt-1.5" rows={5} value={supportContent} onChange={(e) => setSupportContent(e.target.value)} placeholder="VD: Tôi bị quên đồ, cần xác nhận điểm xuống, cần hỗ trợ về vé..." />
            </div>
            <DialogFooter>
              <ExpressiveButton variant="text" onClick={() => setSupportTrip(null)} disabled={submitting}>Hủy</ExpressiveButton>
              <ExpressiveButton variant="filled" onClick={submitSupport} disabled={submitting}>
                {submitting ? <RefreshCw className="size-4 animate-spin" /> : <LifeBuoy className="size-4" />}
                Gửi hỗ trợ
              </ExpressiveButton>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </PageTransition>
  );
}

// =============================================================================
// Screen 9: AI Route Suggestions (prototype-aligned — purple hero + ranked cards)
// =============================================================================
function AIScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  // Form state
  const [freeTime, setFreeTime] = useState("07:00");
  const [boarding, setBoarding] = useState("");
  const [destination, setDestination] = useState("");
  const [prefs, setPrefs] = useState<string[]>(["fast", "cheap"]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AiRouteSuggestionCard[] | null>(null);

  const togglePref = (p: string) =>
    setPrefs((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const prefOptions = [
    { id: "fast", label: "Nhanh nhất", icon: Navigation },
    { id: "cheap", label: "Rẻ nhất", icon: Wallet },
    { id: "comfort", label: "Tiện nghi", icon: Coffee },
    { id: "fewer-stops", label: "Ít trạm", icon: MapPin },
  ];

  const analyze = async () => {
    if (!boarding || !destination) {
      toast.error("Bạn hãy chọn đủ trạm lên và trạm xuống để AI lọc tuyến chính xác.");
      return;
    }
    if (boarding === destination) {
      toast.error("Trạm lên và trạm xuống phải khác nhau.");
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const list = await experienceApi.postRouteSuggestions({
        boardingStopId: Number(boarding),
        alightingStopId: Number(destination),
        preferredDepartureTime: freeTime,
        preferences: prefs,
        naturalLanguageQuery: `Gợi ý tuyến ${prefs.join(", ")} lúc ${freeTime}`,
      });
      await new Promise((resolve) => setTimeout(resolve, 600));
      setResults(list);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải gợi ý tuyến");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Tính "Độ tin cậy" (confidence) cho mỗi kết quả — dựa trên rank
  const getConfidence = (idx: number, total: number) => {
    if (total <= 1) return 95;
    // Top result 92-95%, second 78-85%, third 65-72%
    const presets = [94, 82, 70];
    return presets[idx] ?? Math.max(50, 70 - idx * 8);
  };

  // Tính "Điểm phù hợp" (matchScore 1-5) — dựa trên prefs + route data
  const getMatchScore = (r: any, idx: number) => {
    let score = 5 - idx; // top = 5, second = 4, third = 3
    if (prefs.includes("cheap") && (r.finalFare ?? r.monthlyFare ?? 999999) < 200000) score = Math.min(5, score + 1);
    if (prefs.includes("fewer-stops") && (r.stops?.length ?? 99) < 5) score = Math.min(5, score + 1);
    if ((r.reasons || []).some((reason: string) => reason.toLowerCase().includes("trường"))) score = Math.min(5, score + 1);
    return Math.max(1, Math.min(5, score - 1));
  };

  // Tạo "Lý do" gợi ý tự động dựa trên prefs + route data
  const getReason = (r: any) => {
    if (Array.isArray(r.reasons) && r.reasons.length > 0) {
      const next = Array.isArray(r.nextDepartures) && r.nextDepartures.length
        ? `Chuyến gần nhất: ${r.nextDepartures.join(", ")}`
        : "";
      return [...r.reasons, next].filter(Boolean).join(" · ");
    }
    const reasons: string[] = [];
    if (r.universityLinked) reasons.push("Tuyến liên kết trực tiếp với trường bạn");
    if (prefs.includes("fast") && (r.estimatedMinutes ?? 0) > 0) reasons.push(`Chỉ ${r.estimatedMinutes} phút đi xe`);
    if (prefs.includes("cheap") && (r.monthlyFare ?? 0) > 0) reasons.push(`Vé tháng chỉ ${formatVND(r.monthlyFare)}`);
    if (prefs.includes("fewer-stops") && (r.stops?.length ?? 0) > 0) reasons.push(`Chỉ ${r.stops.length} trạm dừng`);
    if (prefs.includes("comfort")) reasons.push("Xe có điều hòa, ghế nệm");
    if (r.frequencyMin) reasons.push(`Tần suất chuyến mỗi ${r.frequencyMin} phút`);
    if (reasons.length === 0) {
      reasons.push("Tuyến phù hợp với lịch trình và vị trí của bạn");
    }
    return reasons.join(" · ");
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="AI gợi ý tuyến"
        description="Để AI đề xuất tuyến xe phù hợp nhất."
        icon={<Sparkles className="size-6 sm:size-7" />}
      />

      {/* Hero — bold purple card (prototype style) */}
      <ScrollReveal>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 min-w-0"
          style={{ backgroundColor: "#c8a0ff", color: "#14140f" }}
        >
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-8 size-40 rounded-full bg-[#beff50]/20 blur-3xl pointer-events-none" />

          <div className="relative space-y-4 min-w-0">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#14140f] text-[#c8a0ff]">
              <Sparkles className="size-7" />
            </div>
            <SplitText
              as="h2"
              text="AI gợi ý tuyến cho bạn"
              className="text-3xl sm:text-4xl font-bold tracking-tight text-balance leading-tight"
              stagger={0.05}
            />
            <p className="text-sm font-medium opacity-80 max-w-xl">
              Dựa trên giờ rảnh, điểm đến và sở thích — UniBus AI đề xuất 3 tuyến tối ưu.
            </p>
          </div>

          <div className="relative mt-6 space-y-4 min-w-0">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
              <div className="space-y-2 min-w-0">
                <Label className="text-xs font-bold opacity-70 uppercase tracking-wide">Giờ rảnh</Label>
                <input
                  type="time"
                  value={freeTime}
                  onChange={(e) => setFreeTime(e.target.value)}
                  className="w-full h-12 rounded-xl bg-white border-2 border-[#14140f]/20 text-[#14140f] font-bold px-4 focus:outline-none focus:border-[#144fcc] min-w-0"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label className="text-xs font-bold opacity-70 uppercase tracking-wide">Trạm lên</Label>
                <Select value={boarding} onValueChange={setBoarding}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-2 border-[#14140f]/20 text-[#14140f] font-bold">
                    <SelectValue placeholder="Chọn trạm lên" />
                  </SelectTrigger>
                  <SelectContent>
                    {ctx.stops.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-0">
                <Label className="text-xs font-bold opacity-70 uppercase tracking-wide">Trạm xuống</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-2 border-[#14140f]/20 text-[#14140f] font-bold">
                    <SelectValue placeholder="Chọn trạm xuống" />
                  </SelectTrigger>
                  <SelectContent>
                    {ctx.stops.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <Label className="text-xs font-bold opacity-70 uppercase tracking-wide">Sở thích</Label>
              <div className="flex flex-wrap gap-2 min-w-0">
                {prefOptions.map((p) => {
                  const selected = prefs.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePref(p.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold border-2 transition-all shrink-0",
                        selected
                          ? "bg-[#14140f] text-[#beff50] border-[#14140f]"
                          : "bg-white/60 text-[#14140f] border-[#14140f]/20 hover:bg-white"
                      )}
                    >
                      {selected && <CheckCircle2 className="size-3.5" />}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              onClick={analyze}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-[#14140f] text-[#beff50] text-base font-bold disabled:opacity-60"
            >
              <Sparkles className="size-4" />
              {loading ? "Đang phân tích…" : "Phân tích"}
            </motion.button>
          </div>
        </motion.div>
      </ScrollReveal>

      {/* Loading shimmer */}
      {loading && (
        <div className="space-y-4 min-w-0">
          {[1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty state — chưa có kết quả */}
      {!loading && !results && (
        <EmptyState
          icon={<Sparkles className="size-7" />}
          title="Sẵn sàng phân tích"
          description="Nhập giờ rảnh, trạm lên, trạm xuống và sở thích bên trên, rồi nhấn 'Phân tích' để AI gợi ý 3 tuyến phù hợp nhất."
        />
      )}

      {/* Results — bold ranked cards (prototype style) */}
      {results && !loading && (
        <StaggerGroup className="space-y-4 min-w-0">
          <p className="text-sm font-medium text-on-surface-variant">
            Tìm thấy <span className="font-bold text-[#14140f] dark:text-on-surface">{results.length}</span> tuyến phù hợp:
          </p>
          {results.slice(0, 3).map((r: any, idx: number) => {
            const route = ctx.routes.find((x: any) => x.id === String(r.routeId)) || r;
            const isUni = (r.reasons || []).some((reason: string) => reason.toLowerCase().includes("trường"));
            const rankColors = [
              { bg: "#14140f", fg: "#beff50", label: "#1 TỐT NHẤT" },
              { bg: "#144fcc", fg: "#ffffff", label: "#2 PHÙ HỢP" },
              { bg: "#ff8c5f", fg: "#14140f", label: "#3 THAM KHẢO" },
            ];
            const rank = rankColors[idx] ?? { bg: "#14140f", fg: "#beff50", label: `#${idx + 1}` };
            const confidence = r.confidence ?? getConfidence(idx, results.length);
            const matchScore = getMatchScore(r, idx);
            const reason = getReason(r);
            const fare = r.finalFare ?? r.monthlyFare ?? r.singleFare ?? route.fare ?? 0;

            return (
              <StaggerItem key={r.routeId || idx}>
                <motion.div
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="rounded-2xl p-5 sm:p-6 elev-2 min-w-0"
                  style={{ backgroundColor: rank.bg, color: rank.fg }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex items-center h-7 px-3 rounded-full bg-white/20 text-xs font-bold shrink-0">
                        {rank.label}
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-bold truncate">{r.routeName || route.name}</p>
                        <p className="text-xs opacity-70">
                          {r.routeCode || route.code}
                          {route.durationMin ? ` · ${route.durationMin} phút` : ""}
                          {r.score ? ` · điểm ${r.score}` : ""}
                        </p>
                      </div>
                    </div>
                    {isUni && (
                      <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#beff50] text-[#14140f] text-[10px] font-bold shrink-0">
                        TRƯỜNG BẠN
                      </span>
                    )}
                  </div>

                  {/* Lý do gợi ý */}
                  <p className="text-sm opacity-90 bg-white/10 rounded-xl p-3 mb-4">
                    {reason}
                  </p>

                  {/* Độ tin cậy + Điểm phù hợp */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-4 min-w-0">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="opacity-70">Độ tin cậy</span>
                        <span className="font-bold">{confidence}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: rank.fg }}
                          initial={{ width: 0 }}
                          animate={{ width: `${confidence}%` }}
                          transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.2 + idx * 0.1 }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 mb-1.5">Điểm phù hợp</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn("size-4", star <= matchScore ? "fill-current" : "opacity-25")}
                          />
                        ))}
                        <span className="ml-2 text-xs font-bold">{matchScore}/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/15 min-w-0">
                    <p className="text-sm min-w-0">
                      <span className="opacity-70">Giá vé: </span>
                      <span className="font-bold text-lg">{fare ? formatVND(fare) : "—"}</span>
                    </p>
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      onClick={() => {
                        toast.success(`Đã chuyển đến đăng ký tuyến ${r.routeCode || route.code}`);
                        onNavigate("stu-my-journeys");
                      }}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#beff50] text-[#14140f] text-sm font-bold shrink-0"
                    >
                      Đăng ký
                      <ArrowRight className="size-4" />
                    </motion.button>
                  </div>
                </motion.div>
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
const CHATBOT_SUGGESTIONS = [
  "Tìm tuyến từ Đại học Bách khoa Đà Nẵng đến Đại học FPT",
  "So sánh giá vé tháng sau trợ giá cho tuyến phù hợp",
  "Cho biết chuyến gần nhất và các trạm dừng chính",
  "Hướng dẫn tôi đăng ký tuyến và mua vé tháng SePay",
];

type AgentWorkStep = {
  label: string;
  detail: string;
  icon: React.ElementType;
};

function chatbotWorkSteps(prompt: string): AgentWorkStep[] {
  const text = prompt.toLowerCase();
  const steps: AgentWorkStep[] = [
    { label: "Đọc câu hỏi", detail: "Xác định ý định và độ khó", icon: Search },
    { label: "Hồ sơ sinh viên", detail: "Kiểm tra trường, đăng ký và vé hiện tại", icon: School },
  ];
  if (text.includes("tuyến") || text.includes("trạm") || text.includes("đến") || text.includes("route") || text.includes("đường")) {
    steps.push({ label: "Tuyến & trạm", detail: "Tra route, stop order và điểm lên/xuống", icon: RouteIcon });
  }
  if (text.includes("giá") || text.includes("vé") || text.includes("trợ giá") || text.includes("sepay")) {
    steps.push({ label: "Vé & trợ giá", detail: "Tính giá sau trợ giá nếu có dữ liệu", icon: Wallet });
  }
  if (text.includes("lịch") || text.includes("chuyến") || text.includes("eta") || text.includes("mấy giờ")) {
    steps.push({ label: "Lịch chạy", detail: "Đọc chuyến gần nhất và ETA mô phỏng", icon: Clock });
  }
  steps.push({ label: "Soạn phản hồi", detail: "Trả lời ngắn, không bịa dữ liệu ngoài context", icon: Sparkles });
  return steps;
}

function AiWorkingIndicator({ prompt }: { prompt: string }) {
  const steps = useMemo(() => chatbotWorkSteps(prompt), [prompt]);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep(0);
    const timer = window.setInterval(() => {
      setActiveStep((value) => (value + 1) % Math.max(steps.length, 1));
    }, 780);
    return () => window.clearInterval(timer);
  }, [steps.length, prompt]);

  const active = steps[activeStep] || steps[0];
  const ActiveIcon = active?.icon || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex gap-3 max-w-[92%] min-w-0"
      role="status"
      aria-live="polite"
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#BDFD4F] text-[#14140f]">
        <Bot className="size-4" />
      </div>
      <div className="min-w-0 rounded-[28px] border border-outline-variant bg-surface px-4 py-3 text-sm">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold text-on-surface-variant">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-3.5 text-on-surface" />
            Copilot đang làm việc
          </span>
          <span className="inline-flex items-center gap-1" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="size-1.5 rounded-full bg-[#BDFD4F]"
                animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.14 }}
              />
            ))}
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={active?.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-start gap-3 rounded-2xl bg-surface-container-low px-3 py-2.5"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#14140f] text-[#BDFD4F]">
              <ActiveIcon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-on-surface">{active?.label}</span>
              <span className="block text-xs leading-5 text-on-surface-variant">{active?.detail}</span>
            </span>
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;
            return (
              <motion.div
                key={step.label}
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0.5,
                  backgroundColor: isActive ? "#BDFD4F" : "rgba(20,20,15,0.04)",
                }}
                transition={{ duration: 0.18 }}
                className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold text-[#14140f]"
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{step.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function AgentExecutionSummary({ sources, mode }: { sources?: AiSource[]; mode?: string }) {
  const [expanded, setExpanded] = useState(false);
  const sourceCount = sources?.length || 0;
  if (!sourceCount && !mode) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
      >
        <CheckCircle2 className="size-4 shrink-0 text-success" />
        <span className="flex-1">
          {sourceCount ? `Đã tra cứu ${sourceCount} nguồn dữ liệu` : "Đã hoàn tất xử lý"}
        </span>
        <ChevronRight className={cn("size-4 text-on-surface-variant transition-transform", expanded && "rotate-90")} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="border-t border-outline-variant/70 px-3 py-2.5"
          >
            <div className="space-y-2">
              {(sources || []).map((source, index) => (
                <div key={`${source.type}-${index}`} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                  <span>
                    <span className="font-semibold text-on-surface">{source.label}</span>
                    {source.detail && <span className="text-on-surface-variant"> · {source.detail}</span>}
                  </span>
                </div>
              ))}
              {mode && (
                <div className="flex items-start gap-2 text-xs">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-on-surface" />
                  <span className="text-on-surface-variant">
                    {mode === "FAST_CONTEXT"
                      ? "Trả lời nhanh bằng dữ liệu UniBus"
                      : mode === "ZAI"
                      ? "Tổng hợp phản hồi bằng Z.AI"
                      : mode === "BEDROCK"
                        ? "Tổng hợp phản hồi bằng AWS Bedrock"
                        : "Hoàn tất bằng chế độ dự phòng"}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AiRouteResultCard({
  route,
  index,
  onNavigate,
}: {
  route: AiRouteSuggestionCard;
  index: number;
  onNavigate: (id: string) => void;
}) {
  const [showStops, setShowStops] = useState(false);
  const stops = route.stops || [];
  const registerAction = route.actions?.find((action) => action.type === "REGISTER_ROUTE");
  const boardingStopId = registerAction?.boardingStopId || stops[0]?.stopId;
  const alightingStopId = registerAction?.alightingStopId || stops[stops.length - 1]?.stopId;
  const monthlyFare = route.finalFare ?? route.monthlyFare;
  const departure = route.nextDepartures?.[0];

  const viewOnMap = () => {
    window.sessionStorage.setItem("unibus:assistant:route-preview", String(route.routeId));
    onNavigate("stu-find");
  };

  const registerRoute = () => {
    if (boardingStopId && alightingStopId) {
      window.localStorage.setItem("unibus.pendingRegistration", JSON.stringify({
        routeId: String(route.routeId),
        boardingStopId: String(boardingStopId),
        alightingStopId: String(alightingStopId),
      }));
    }
    onNavigate("stu-my-journeys");
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.12), ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-outline-variant bg-surface text-on-surface"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-7 items-center rounded-lg bg-[#14140f] px-2.5 text-xs font-bold text-[#beff50]">
                {route.routeCode || `T-${route.routeId}`}
              </span>
              {route.confidence != null && (
                <span className="text-xs font-medium text-on-surface-variant">{route.confidence}% phù hợp</span>
              )}
            </div>
            <h3 className="mt-2 text-sm font-bold leading-5">{route.routeName}</h3>
          </div>
          <Bus className="size-5 shrink-0 text-on-surface-variant" />
        </div>

        {!!route.reasons?.length && (
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            {route.reasons.slice(0, 2).join(" · ")}
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 divide-x divide-outline-variant rounded-xl border border-outline-variant">
          <div className="min-w-0 px-2.5 py-3">
            <p className="text-[10px] text-on-surface-variant">Chuyến gần nhất</p>
            <p className="mt-1 truncate text-xs font-bold">{departure || "Chưa có"}</p>
          </div>
          <div className="min-w-0 px-2.5 py-3">
            <p className="text-[10px] text-on-surface-variant">Số trạm</p>
            <p className="mt-1 text-xs font-bold">{stops.length || "Chưa rõ"}</p>
          </div>
          <div className="min-w-0 px-2.5 py-3">
            <p className="text-[10px] text-on-surface-variant">Vé tháng</p>
            <p className="mt-1 truncate text-xs font-bold">{monthlyFare != null ? formatVND(monthlyFare) : "Chưa có"}</p>
          </div>
        </div>

        {route.subsidyAmount != null && route.subsidyAmount > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#beff50]/15 px-3 py-2 text-xs">
            <span className="text-on-surface-variant">Trợ giá sinh viên</span>
            <span className="font-bold text-on-surface">-{formatVND(route.subsidyAmount)}</span>
          </div>
        )}

        {stops.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowStops((value) => !value)}
              aria-expanded={showStops}
              className="flex min-h-11 w-full items-center gap-3 text-left"
            >
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <MapPin className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{stops[0]?.stopName}</span>
                <span className="block truncate text-[11px] text-on-surface-variant">
                  đến {stops[stops.length - 1]?.stopName}
                </span>
              </span>
              <span className="text-[11px] font-medium text-on-surface-variant">
                {showStops ? "Thu gọn" : "Xem trạm"}
              </span>
              <ChevronRight className={cn("size-4 text-on-surface-variant transition-transform", showStops && "rotate-90")} />
            </button>
            <AnimatePresence initial={false}>
              {showStops && (
                <motion.ol
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="ml-4 border-l border-outline-variant py-1 pl-5"
                >
                  {stops.map((stop, stopIndex) => (
                    <li key={`${route.routeId}-${stop.stopId}`} className="relative py-1.5 text-xs">
                      <span className="absolute -left-[23px] top-3 size-1.5 rounded-full bg-[#BDFD4F]" />
                      <span className="font-medium">{stop.stopName}</span>
                      {stopIndex > 0 && stop.minutesFromPreviousStop != null && (
                        <span className="ml-2 text-on-surface-variant">+{stop.minutesFromPreviousStop} phút</span>
                      )}
                    </li>
                  ))}
                </motion.ol>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-outline-variant bg-surface-container-low px-4 py-3">
        <button
          type="button"
          onClick={viewOnMap}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-semibold transition-colors hover:bg-surface-container-high"
        >
          <MapPinned className="size-4" />
          Xem bản đồ
        </button>
        <button
          type="button"
          onClick={registerRoute}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#14140f] px-3 text-xs font-semibold text-[#BDFD4F] transition-opacity hover:opacity-90"
        >
          Đăng ký tuyến
          <ArrowRight className="size-4" />
        </button>
      </div>
    </motion.article>
  );
}

type AssistantMessage = {
  role: "user" | "bot";
  text: string;
  time: string;
  mode?: string;
  sources?: AiSource[];
  routeSuggestions?: AiRouteSuggestionCard[];
};

function ChatbotScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const displayName = ctx.user.name?.split(" ").slice(-1)[0] || "bạn";
  const userInitial = (ctx.user.name || ctx.user.email || "M").trim().slice(0, 1).toUpperCase();
  const welcomeMessage = useMemo<AssistantMessage>(() => ({
      role: "bot",
      text: `Xin chào ${displayName}! Mình là UniBus Copilot. Mình có thể tra cứu tuyến, giá vé, lịch xe, trợ giá và hướng dẫn mua vé SePay bằng dữ liệu thật của hệ thống.`,
      time: new Date().toISOString(),
  }), [displayName]);
  const sessionKey = useMemo(
    () => `unibus:assistant:${String(ctx.user.email || ctx.user.id || "student").toLowerCase()}`,
    [ctx.user.email, ctx.user.id]
  );
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(sessionKey);
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((item) =>
        (item?.role === "user" || item?.role === "bot") && typeof item?.text === "string"
      )) {
        setMessages(parsed.slice(-40));
      } else {
        setMessages([welcomeMessage]);
      }
    } catch {
      setMessages([welcomeMessage]);
    }
    setSessionReady(true);
  }, [sessionKey, welcomeMessage]);

  useEffect(() => {
    if (!sessionReady) return;
    try {
      window.sessionStorage.setItem(sessionKey, JSON.stringify(messages.slice(-40)));
    } catch {
      // The active chat still works when browser storage is unavailable.
    }
  }, [messages, sessionKey, sessionReady]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (value = input) => {
    if (!value.trim() || loading || !sessionReady) return;
    const userMsg = { role: "user" as const, text: value.trim(), time: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPendingPrompt(userMsg.text);
    setLoading(true);
    try {
      const res = await experienceApi.sendAssistantChat({
        message: userMsg.text,
        context: {
          preferences: ["fast", "cheap"],
          conversationHistory: [...messages, userMsg].slice(-8).map((message) => ({
            role: message.role === "bot" ? "assistant" : "user",
            content: message.text,
          })),
        },
      });
      setMessages((m) => [...m, {
        role: "bot",
        text: res.message || "Mình đã phân tích dữ liệu UniBus hiện có cho bạn.",
        time: new Date().toISOString(),
        mode: res.mode,
        sources: res.sources || [],
        routeSuggestions: res.routeSuggestions || [],
      }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Xin lỗi, mình không thể trả lời lúc này. Vui lòng thử lại sau.", time: new Date().toISOString() }]);
    } finally {
      setLoading(false);
      setPendingPrompt("");
    }
  };

  const reset = () => {
    setMessages([{ ...welcomeMessage, time: new Date().toISOString() }]);
    setInput("");
    setPendingPrompt("");
    setLoading(false);
    try {
      window.sessionStorage.removeItem(sessionKey);
    } catch {
      // Ignore storage failures; the visible session has already been reset.
    }
  };

  return (
    <PageTransition className="min-w-0">
      <div className="flex h-[calc(100vh-7rem)] min-h-[560px] min-w-0 flex-col overflow-hidden rounded-3xl border border-outline-variant bg-surface">
        <header className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#14140f] text-[#BDFD4F]">
              <Bot className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-on-surface">UniBus Copilot</h2>
              <p className="truncate text-xs text-on-surface-variant">AI agent tra cứu tuyến, vé tháng và SePay</p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <RefreshCw className="size-3.5" />
            Chat mới
          </button>
        </header>

        <div ref={scrollRef} className="scrollbar-soft min-w-0 flex-1 space-y-4 overflow-y-auto bg-surface-container-low/35 px-3 py-4 sm:px-6">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={`${m.time}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn("flex min-w-0 gap-2 sm:gap-3", m.role === "user" && "justify-end")}
              >
                {m.role === "bot" && (
                  <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#BDFD4F] text-[#14140f]">
                    <Bot className="size-4" />
                  </span>
                )}
                <div
                  className={cn(
                    "min-w-0 max-w-[92%] break-words text-sm leading-relaxed sm:max-w-[78%]",
                    m.role === "user"
                      ? "rounded-[28px] bg-[#14140f] px-4 py-3 text-[#BDFD4F]"
                      : "rounded-[28px] border border-outline-variant bg-surface px-4 py-3 text-on-surface"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.role === "bot" && (
                    <>
                      <AgentExecutionSummary sources={m.sources} mode={m.mode} />
                      {!!m.routeSuggestions?.length && (
                        <div className="mt-3 space-y-3">
                          {m.routeSuggestions.slice(0, 3).map((route, routeIndex) => (
                            <AiRouteResultCard
                              key={route.routeId}
                              route={route}
                              index={routeIndex}
                              onNavigate={onNavigate}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {m.role === "user" && (
                  <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#14140f] text-xs font-bold text-[#BDFD4F]">
                    {userInitial}
                  </span>
                )}
              </motion.div>
            ))}
            {loading && <AiWorkingIndicator prompt={pendingPrompt || input} />}
          </AnimatePresence>
        </div>

        {messages.length <= 1 && (
          <div className="border-t border-outline-variant bg-surface px-4 py-3 sm:px-5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CHATBOT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  disabled={loading || !sessionReady}
                  className="shrink-0 rounded-full border border-outline-variant bg-surface px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          className="flex min-w-0 items-end gap-2 border-t border-outline-variant bg-surface px-3 py-3 sm:px-5"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <Input
            placeholder="Hỏi về tuyến xe, điểm đến, giá vé, lịch chạy..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || !sessionReady}
            className="min-h-12 flex-1 rounded-2xl border-outline-variant bg-surface px-4"
          />
          <ExpressiveButton variant="filled" size="icon" type="submit" disabled={loading || !sessionReady || !input.trim()} className="size-12 rounded-2xl">
            <Send className="size-4" />
          </ExpressiveButton>
        </form>
      </div>
    </PageTransition>
  );
}

// =============================================================================
// Screen 11: Payment — buy monthly pass (SePay QR)
// =============================================================================
function PaymentScreen({ ctx }: { ctx: Ctx }) {
  const [purchasing, setPurchasing] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationDTO[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [sepayOrder, setSepayOrder] = useState<{
    orderId: number;
    routeId?: number;
    routeName?: string;
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
  const selectedRegistration = registrations.find((item) => String(item.routeId) === selectedRouteId) || ctx.registration;

  useEffect(() => {
    let cancelled = false;
    studentApi.registrations()
      .then((list) => {
        if (cancelled) return;
        setRegistrations(list);
        const preferred = localStorage.getItem("unibus.paymentRouteId");
        const firstRoute = preferred || list[0]?.routeId?.toString() || ctx.registration?.routeId?.toString() || "";
        setSelectedRouteId(firstRoute);
        localStorage.removeItem("unibus.paymentRouteId");
      })
      .catch(() => {
        if (!cancelled && ctx.registration?.routeId) {
          setSelectedRouteId(String(ctx.registration.routeId));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ctx.registration?.routeId]);

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
    if (!selectedRouteId) {
      toast.error("Hãy chọn tuyến cần mua vé tháng.");
      return;
    }
    setPurchasing(true);
    try {
      const order = await studentApi.createSePayOrder("MONTHLY", Number(selectedRouteId));
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
            {selectedRegistration ? (
              <div className="space-y-3 text-sm">
                {registrations.length > 1 && (
                  <div>
                    <Label className="text-xs font-bold">Chọn tuyến cần mua vé</Label>
                    <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn tuyến" /></SelectTrigger>
                      <SelectContent>
                        {registrations.map((item) => (
                          <SelectItem key={item.registrationId} value={String(item.routeId)}>
                            {item.routeName} — {item.boardingStopName} → {item.alightingStopName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Row label="Tuyến" value={selectedRegistration.routeName} icon={<RouteIcon className="size-4" />} />
                <Row label="Trạm lên" value={selectedRegistration.boardingStopName} icon={<MapPin className="size-4" />} />
                <Row label="Trạm xuống" value={selectedRegistration.alightingStopName} icon={<MapPin className="size-4" />} />
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
function FeedbackScreen({ ctx, compact = false }: { ctx: Ctx; compact?: boolean }) {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("service");
  const [content, setContent] = useState("");
  const [tripId, setTripId] = useState<string>("");
  const [routeId, setRouteId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const pendingTripId = localStorage.getItem("unibus.supportTripId");
    const pendingRouteId = localStorage.getItem("unibus.supportRouteId");
    if (pendingTripId) {
      setTripId(pendingTripId);
      localStorage.removeItem("unibus.supportTripId");
    }
    if (pendingRouteId) {
      setRouteId(pendingRouteId);
      localStorage.removeItem("unibus.supportRouteId");
    }
  }, []);

  const submit = async () => {
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    if (!tripId) {
      toast.error("Vui lòng chọn chuyến đi cần hỗ trợ");
      return;
    }
    setSubmitting(true);
    try {
      await feedbackApi.create({
        tripId: Number(tripId),
        routeId: routeId ? Number(routeId) : undefined,
        rating,
        category,
        content: content.trim(),
      });
      toast.success("Đã gửi phản hồi. Cảm ơn bạn!");
      setRating(5);
      setContent("");
      setTripId("");
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
      {!compact && (
        <PageHeader
          title="Phản hồi"
          description="Chia sẻ trải nghiệm của bạn để chúng tôi cải thiện dịch vụ."
          icon={<Star className="size-7" />}
        />
      )}

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
                <Label className="text-xs font-bold">Chuyến đi cần hỗ trợ</Label>
                <Select value={tripId} onValueChange={(value) => {
                  setTripId(value);
                  const selected = ctx.tripsHistory.find((h: any) => String(h.tripId || h.id) === value);
                  if (selected?.routeId) setRouteId(String(selected.routeId));
                }}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn chuyến từ lịch sử" /></SelectTrigger>
                  <SelectContent>
                    {ctx.tripsHistory.map((h: any) => (
                      <SelectItem key={h.tripId || h.id} value={String(h.tripId || h.id)}>
                        {(h.routeName || "Tuyến xe")} · {formatDate(h.boardedAt || h.serviceDate)}
                      </SelectItem>
                    ))}
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
function LostItemsScreen({ ctx, compact = false }: { ctx: Ctx; compact?: boolean }) {
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

  useEffect(() => {
    const pendingTripId = localStorage.getItem("unibus.lostTripId");
    if (pendingTripId) {
      setTripId(pendingTripId);
      localStorage.removeItem("unibus.lostTripId");
    }
  }, []);

  return (
    <PageTransition className="space-y-6 min-w-0">
      {!compact && (
        <PageHeader
          title="Đồ thất lạc"
          description="Báo mất vật dụng và theo dõi trạng thái tìm kiếm."
          icon={<PackageSearch className="size-7" />}
        />
      )}

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
                      <SelectItem key={h.tripId || h.id} value={String(h.tripId || h.id)}>
                        {(h.routeName || "Tuyến xe")} — {formatDate(h.boardedAt || h.serviceDate)}
                      </SelectItem>
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
