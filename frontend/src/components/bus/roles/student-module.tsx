"use client";

// =============================================================================
// Student Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// 14 role-specific screens driven by `activeId`:
//   stu-dashboard, stu-university, stu-find, stu-my-journeys,
//   stu-history, stu-chatbot, stu-invoices plus legacy hidden routes
//
// Visual: keeps prototype v1.1 look (hero lime card, M3 Expressive cards,
// SplitText reveal, ScrollReveal, M3MapCanvas, vertical timeline).
// Data: real backend via @/lib/prototype-data hooks.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  GraduationCap,
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
  mapInvoice,
  mapFeedback,
  mapLostItem,
} from "@/lib/prototype-data";
import {
  studentApi,
  transportApi,
  experienceApi,
  isPaidStatus,
  isUnpaidStatus,
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
  type SePayOrderRequestDTO,
  type SePayQuoteDTO,
  type PaymentView,
  type SingleTripTicketView,
  type TicketView,
  type EtaDTO,
  type CoordinateDTO,
  type JourneyStopDTO,
  type RouteSuggestionDTO,
  type PassesDashboard,
  type PlaceSuggestionDTO,
  type JourneyOptionDTO,
  type JourneyTrackingSnapshotDTO,
  type AiSource,
  type AiTraceEvent,
  type AiProviderStatus,
  type AiRouteSuggestionCard,
  ApiError,
} from "@/lib/api/client";
import { ProtectedImage } from "@/components/bus/protected-image";
import { JourneyPlannerDesktop } from "@/components/bus/student/journey-planner-desktop";

const normalizeStopText = (value?: string | null) =>
  String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ");

const displayStopLabel = (value?: string | null, fallback = "Chưa xác định") => {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const normalized = normalizeStopText(raw);
  if (normalized === "dai hoc") return fallback;
  if (normalized === "dai hoc viet") return "Đại học Việt Hàn";
  return raw;
};

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
    case "stu-find":
      return <JourneyPlannerDesktop ctx={ctx} onNavigate={onNavigate} />;
    case "stu-my-journeys":
      return <MyJourneysScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-tracking":
      return <TrackingScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-my-routes":
      return <MyRoutesScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-my-ticket":
      return <MyTicketScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-history":
      return <HistoryScreen ctx={ctx} />;
    case "stu-notifications":
      return <NotificationsScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-ai":
      return <AIScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-chatbot":
      return <ChatbotScreen ctx={ctx} onNavigate={onNavigate} />;
    case "stu-payment":
    case "stu-invoices":
      return <FinanceScreen ctx={ctx} onNavigate={onNavigate} />;
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

function normalizeRouteMatchText(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^\s*tuyen\s+\w+\s*\((.*)\)\s*$/, "$1")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectMonthlyTicketsFrom(passesPayload: any, activeTicket?: any | null) {
  const candidates = [
    passesPayload?.tickets,
    passesPayload?.monthlyPasses,
    passesPayload?.passes,
    passesPayload?.activeTickets,
    Array.isArray(passesPayload) ? passesPayload : null,
  ];
  const byId = new Map<string, any>();
  candidates.flatMap((value) => (Array.isArray(value) ? value : [])).concat(activeTicket ? [activeTicket] : []).forEach((ticket: any) => {
    const ticketType = String(ticket?.ticketType || ticket?.type || "MONTHLY").toUpperCase();
    const active = String(ticket?.status || "ACTIVE").toUpperCase() === "ACTIVE";
    if (!ticket || ticketType !== "MONTHLY" || !active) return;
    const key = String(ticket.ticketId ?? ticket.monthlyPassId ?? ticket.passId ?? `${ticket.routeId ?? ticket.routeCode ?? ticket.routeName}-${ticket.expiresOn || ticket.expiresAt || ticket.validTo}`);
    byId.set(key, ticket);
  });
  return Array.from(byId.values());
}

function collectMonthlyTickets(ctx: Ctx) {
  return collectMonthlyTicketsFrom(ctx.raw.passes?.raw ?? ctx.raw.passes?.data ?? ctx.raw.passes, ctx.activeTicket);
}

type RouteTrackingContext = {
  type: "route";
  routeId: number | string;
  boardingStopId?: number | string;
  alightingStopId?: number | string;
  routeCode?: string;
  routeName?: string;
  registrationId?: number | string;
};

function saveRouteTrackingContext(registration: Partial<RegistrationDTO> & { routeCode?: string }) {
  const context: RouteTrackingContext = {
    type: "route",
    routeId: registration.routeId!,
    boardingStopId: registration.boardingStopId,
    alightingStopId: registration.alightingStopId,
    routeCode: registration.routeCode,
    routeName: registration.routeName,
    registrationId: registration.registrationId,
  };
  localStorage.setItem("unibus.trackingContext", JSON.stringify(context));
  localStorage.removeItem("unibus.trackingJourneyId");
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
  const visibleStops = stops.length > 12 ? [...stops.slice(0, 6), ...stops.slice(-6)] : stops;
  const hiddenStopCount = stops.length - visibleStops.length;
  return (
    <div className="relative space-y-0">
      {/* vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-outline-variant" />
      {visibleStops.map((s, visibleIndex) => {
        const i = stops.indexOf(s);
        const isPassed = currentIndex != null && i < currentIndex;
        const isCurrent = currentIndex === i;
        const showGap = hiddenStopCount > 0 && visibleIndex === 6;
        return (
          <React.Fragment key={`${s.stopId || s.id || i}-${i}`}>
            {showGap ? <div className="relative z-10 my-1 ml-6 rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-on-surface-variant">{hiddenStopCount} trạm ở giữa</div> : null}
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
          </React.Fragment>
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
  const [registrations, setRegistrations] = useState<RegistrationDTO[]>([]);
  const [singleTickets, setSingleTickets] = useState<SingleTripTicketView[]>([]);
  const [selectedQrTicketId, setSelectedQrTicketId] = useState("");
  const [qrNowMs] = useState(() => Date.now());

  const activeTicket = ctx.activeTicket;
  const monthlyQrTickets = useMemo(() => collectMonthlyTickets(ctx), [ctx]);
  const qrTicketOptions = useMemo(() => {
    const byId = new Map<string, any>();
    const addTicket = (ticket: any, kind: "MONTHLY" | "SINGLE") => {
      if (!ticket?.qrCode) return;
      const status = String(ticket.status || (kind === "MONTHLY" ? "ACTIVE" : "UNUSED")).toUpperCase();
      if (kind === "MONTHLY" && status !== "ACTIVE") return;
      if (kind === "SINGLE") {
        if (status !== "UNUSED") return;
        if (ticket.expiresAt && Date.parse(ticket.expiresAt) < qrNowMs) return;
      }
      const id = `${kind}-${ticket.ticketId ?? ticket.singleTripTicketId ?? ticket.qrCode}`;
      byId.set(id, { ...ticket, __id: id, __kind: kind });
    };
    monthlyQrTickets.forEach((ticket) => addTicket(ticket, "MONTHLY"));
    if (activeTicket) addTicket(activeTicket, "MONTHLY");
    singleTickets.forEach((ticket) => addTicket(ticket, "SINGLE"));
    return Array.from(byId.values());
  }, [activeTicket, monthlyQrTickets, qrNowMs, singleTickets]);
  const selectedQrTicket = qrTicketOptions.find((ticket) => ticket.__id === selectedQrTicketId) || qrTicketOptions[0] || null;
  const nextTrip = ctx.nextTrip;
  const activeRoute = nextTrip
    ? ctx.routes.find((r) => r.id === String(nextTrip.routeId))
    : ctx.routes[0];
  const normalizeTripText = (value?: string | null) => {
    const text = displayStopLabel(value, "");
    if (!text) return "";
    const letters = text.replace(/[^A-Za-zÀ-ỹĐđ]/g, "");
    const isAllCaps = letters.length > 3 && letters === letters.toLocaleUpperCase("vi-VN");
    if (!isAllCaps) return text;
    return text
      .toLocaleLowerCase("vi-VN")
      .replace(/(^|[\s\-/])([a-zà-ỹđ])/g, (match, prefix: string, char: string) => `${prefix}${char.toLocaleUpperCase("vi-VN")}`)
      .replace(/Bx/g, "BX")
      .replace(/Đh/g, "ĐH")
      .replace(/VkU/gi, "VKU");
  };
  const tripFrom = normalizeTripText(ctx.registration?.boardingStopName || activeTicket?.boardingStopName || activeRoute?.from);
  const tripTo = normalizeTripText(ctx.registration?.alightingStopName || activeTicket?.alightingStopName || activeRoute?.to);
  const tripRouteName = normalizeTripText(ctx.registration?.routeName || activeTicket?.routeName || activeRoute?.name || activeRoute?.routeName || "Tuyến UniBus");
  const tripRouteCode = activeRoute?.code || activeTicket?.routeCode || (ctx.registration as RegistrationDTO & { routeCode?: string } | undefined)?.routeCode || "UNIBUS";
  const unread = ctx.notifications.filter((n: any) => !n.read).length;
  const tripsThisMonth = ctx.tripsHistory.length;

  // Stat cards — perk-style: each card has its own bold color (from prototype)
  const monthlyFare = activeTicket?.finalFareAmount ?? 0;
  const subsidyAmount = activeTicket?.subsidyAmount ?? 0;
  const activeRegistrations = registrations.length ? registrations : ctx.registration ? [ctx.registration] : [];
  const statCards = [
    { label: "Tuyến đã đăng ký", value: activeRegistrations.length, hint: activeRegistrations.length > 0 ? "Đang hoạt động" : "Chưa có tuyến", icon: RouteIcon, bg: "#14140f", fg: "#ffffff", iconBg: "#beff50", iconFg: "#14140f", hintColor: "#beff50" },
    { label: "Chuyến tháng này", value: tripsThisMonth, hint: tripsThisMonth > 0 ? `+${Math.min(2, tripsThisMonth)} so với tháng trước` : "Chưa có chuyến", icon: Bus, bg: "#ff8c5f", fg: "#14140f", iconBg: "#14140f", iconFg: "#ff8c5f", hintColor: "#14140f" },
    { label: "Chi phí tháng", value: monthlyFare, hint: subsidyAmount > 0 ? `Trợ giá ${formatVND(subsidyAmount)}` : "Chưa mua vé", icon: CreditCard, bg: "#144fcc", fg: "#ffffff", iconBg: "#beff50", iconFg: "#14140f", hintColor: "#beff50", isMoney: true },
    { label: "Thông báo mới", value: unread, hint: unread > 0 ? "Chưa đọc" : "Đã đọc hết", icon: Sparkles, bg: "#c8a0ff", fg: "#14140f", iconBg: "#14140f", iconFg: "#c8a0ff", hintColor: "#14140f" },
  ];

  const quickActions = [
    { id: "stu-find", label: "Tìm tuyến xe", icon: RouteIcon, bg: "#144fcc", fg: "#fff", iconBg: "#beff50", iconFg: "#14140f" },
    { id: "stu-my-journeys", label: "Vé của tôi", icon: TicketCheck, bg: "#ff8c5f", fg: "#14140f", iconBg: "#14140f", iconFg: "#ff8c5f" },
    { id: "stu-invoices", label: "Thanh toán & hóa đơn", icon: Receipt, bg: "#14140f", fg: "#fff", iconBg: "#beff50", iconFg: "#14140f" },
    { id: "stu-chatbot", label: "Hỏi Copilot", icon: Bot, bg: "#c8a0ff", fg: "#14140f", iconBg: "#14140f", iconFg: "#c8a0ff" },
  ];

  useEffect(() => {
    let cancelled = false;
    studentApi.registrations()
      .then((list) => {
        if (!cancelled) setRegistrations(list);
      })
      .catch(() => {
        if (!cancelled) setRegistrations(ctx.registration ? [ctx.registration] : []);
      });
    studentApi.singleTripTickets()
      .then((list) => {
        if (!cancelled) setSingleTickets(Array.isArray(list) ? list : []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [ctx.registration]);

  useEffect(() => {
    if (!qrExpanded || !qrTicketOptions.length) return;
    if (!selectedQrTicketId || !qrTicketOptions.some((ticket) => ticket.__id === selectedQrTicketId)) {
      setSelectedQrTicketId(qrTicketOptions[0].__id);
    }
  }, [qrExpanded, qrTicketOptions, selectedQrTicketId]);

  const myRoutes = activeRegistrations.slice(0, 3).map((registration: RegistrationDTO) => {
    const route = ctx.routes.find((r: any) => r.id === String(registration.routeId));
    return {
      id: String(registration.registrationId || registration.routeId),
      name: registration.routeName || route?.name || "Tuyến đã đăng ký",
      from: displayStopLabel(registration.boardingStopName || route?.from, "Điểm lên"),
      to: displayStopLabel(registration.alightingStopName || route?.to, "Điểm xuống"),
      color: route?.color || "#beff50",
      code: route?.code || "UB",
      registration,
    };
  });

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
        </div>
      </motion.div>

      {/* Upcoming trip HERO — perk-style: bold lime card, dark text, QR round button */}
      {(activeRoute || nextTrip) && (
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
                    {tripRouteCode}
                  </span>
                  <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-[#14140f]/10 text-[11px] font-bold">
                    <motion.span
                      className="size-1.5 rounded-full bg-[#14140f]"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    {nextTrip ? (nextTrip.status === "RUNNING" ? "Đang chạy" : "Sắp khởi hành") : "Chưa có chuyến"}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-balance leading-tight">
                  {nextTrip ? "Chuyến sắp tới" : "Chưa có chuyến sắp tới"}
                </h3>
                <p className="text-sm sm:text-base font-medium opacity-80 line-clamp-2">
                  {nextTrip ? tripRouteName : "Xem tuyến hoặc mua vé khi cần."}
                </p>
                {(tripFrom || tripTo) && (
                  <p className="text-xs sm:text-sm font-medium opacity-70 line-clamp-1">
                    {tripFrom || "Trạm lên"} → {tripTo || "Trạm xuống"}
                  </p>
                )}
                <div className="flex items-center gap-3 sm:gap-4 pt-1 flex-wrap">
                  <HeroMetric label="Khởi hành" value={nextTrip?.departTime || activeRoute?.firstTrip || "Hôm nay"} />
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
                  onClick={() => {
                    if (!qrTicketOptions.length) {
                      toast.info("Chưa có vé để hiển thị.");
                      return;
                    }
                    setSelectedQrTicketId(qrTicketOptions[0].__id);
                    setQrExpanded(true);
                  }}
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
                    onClick={() => {
                      const primaryRegistration = activeRegistrations[0];
                      if (primaryRegistration) saveRouteTrackingContext(primaryRegistration);
                      onNavigate(primaryRegistration ? "stu-tracking" : "stu-my-journeys");
                    }}
                    className="state-layer inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#14140f] text-white text-sm font-bold"
                  >
                    <Navigation className="size-4" />
                    Theo dõi tuyến
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    onClick={() => onNavigate("stu-invoices")}
                    className="state-layer inline-flex items-center gap-1 h-10 px-4 rounded-full bg-white text-[#14140f] text-sm font-bold border-2 border-[#14140f]"
                  >
                    Mua vé
                    <ArrowRight className="size-4" />
                  </motion.button>
                </div>
              </div>
            </div>
        </motion.div>
      )}

      {/* Stat cards — perk-style: dark cards with lime/coral/sky/purple accents (like prototype) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
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
                <Counter start="mount" to={Number(s.value || 0)} format={(n) => formatVND(Math.round(n))} />
              ) : (
                <Counter start="mount" to={Number(s.value || 0)} />
              )}
            </p>
            <p className="text-[11px] font-bold mt-1 truncate" style={{ color: s.hintColor }}>{s.hint}</p>
          </motion.div>
        ))}
      </div>

      {/* My routes + Quick actions — 2-column layout like prototype */}
      <div className="grid lg:grid-cols-2 gap-6 min-w-0">
        <div>
          <Section title="Tuyến của tôi" description={activeRegistrations.length > 1 ? `${activeRegistrations.length} tuyến` : "Đang sử dụng"}>
            <ExpressiveCard variant="filled" className="p-2 min-w-0">
              {myRoutes.length === 0 ? (
                <div className="p-6 text-center text-sm text-on-surface-variant min-w-0">
                  Chưa có tuyến nào.{" "}
                  <button className="text-[#144fcc] font-bold underline" onClick={() => onNavigate("stu-find")}>
                    Đăng ký ngay
                  </button>
                </div>
              ) : (
                <>
                {myRoutes.map((r: any) => (
                  <div
                    key={r.id}
                    className="state-layer flex items-center gap-3 p-3 rounded-xl min-w-0"
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
                    <button
                      type="button"
                      onClick={() => {
                        saveRouteTrackingContext(r.registration);
                        onNavigate("stu-tracking");
                      }}
                      className="shrink-0 rounded-full bg-[#14140f] px-3 py-1.5 text-xs font-bold text-[#beff50]"
                    >
                      Xem xe sắp tới
                    </button>
                  </div>
                ))}
                {activeRegistrations.length > 3 && (
                  <button
                    type="button"
                    onClick={() => onNavigate("stu-my-journeys")}
                    className="mt-1 flex w-full items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-[#144fcc] hover:bg-surface-container-high"
                  >
                    Xem tất cả <ChevronRight className="size-3" />
                  </button>
                )}
                </>
              )}
            </ExpressiveCard>
          </Section>
        </div>

        <div>
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
        </div>
      </div>

      {/* Recent notifications */}
      <div>
        <Section
          title="Thông báo gần đây"
          description="Cập nhật mới nhất từ hệ thống"
          actions={
            <button
              className="state-layer inline-flex items-center gap-1 h-8 px-3 rounded-full text-sm font-bold text-[#14140f] hover:bg-[#14140f]/8"
              onClick={() => onNavigate("stu-notifications")}
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
                  <button
                    key={n.id}
                    type="button"
                    onClick={async () => {
                      if (!n.read && n.id) {
                        try {
                          await notificationApi.markRead(Number(n.id));
                          ctx.reload();
                        } catch {
                          toast.error("Không thể cập nhật thông báo");
                        }
                      }
                      onNavigate("stu-notifications");
                    }}
                    className="state-layer flex w-full items-start gap-3 rounded-xl p-3 text-left min-w-0"
                  >
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
                  </button>
                );
              })
            )}
          </ExpressiveCard>
        </Section>
      </div>

      {/* QR expand overlay — framer-motion animation (matches prototype) */}
      <AnimatePresence>
        {qrExpanded && selectedQrTicket?.qrCode && (
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
              animate={{ scale: 1, opacity: 1, borderRadius: "32px" }}
              exit={{ scale: 0.5, opacity: 0, borderRadius: "50%" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-[#14140f] text-white rounded-[32px] p-5 sm:p-8 max-w-sm w-full min-w-0"
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
                  <QRCodeCanvas value={selectedQrTicket.qrCode} size={200} level="H" />
                </motion.div>
              </div>

              {qrTicketOptions.length > 1 && (
                <div className="mb-4 rounded-[24px] bg-white/6 p-2">
                  <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-white/45">Đổi vé</p>
                  <div className="space-y-1.5">
                    {qrTicketOptions.map((ticket) => {
                      const selected = ticket.__id === selectedQrTicket.__id;
                      const routeLabel = ticket.routeCode || ticket.routeName || `#${ticket.ticketId}`;
                      return (
                        <button
                          key={ticket.__id}
                          type="button"
                          onClick={() => setSelectedQrTicketId(ticket.__id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-[18px] px-3 py-2 text-left text-xs transition-colors",
                            selected ? "bg-[#beff50] text-[#14140f]" : "text-white/75 hover:bg-white/10"
                          )}
                        >
                          <span className="min-w-0 truncate font-bold">
                            {ticket.__kind === "SINGLE" ? "Vé lượt" : "Vé tháng"} · {routeLabel}
                          </span>
                          <span className="shrink-0 font-mono font-bold">#{ticket.ticketId}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2 mb-4"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Mã vé</span>
                  <span className="font-bold tabular-nums">#{selectedQrTicket.ticketId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Tuyến</span>
                  <span className="font-bold truncate ml-2">{selectedQrTicket.routeCode || selectedQrTicket.routeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Hiệu lực</span>
                  <span className="font-bold text-[#beff50]">
                    Đến {formatDate(selectedQrTicket.expiresAt || selectedQrTicket.expiresOn)}
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


function NotificationsScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const [items, setItems] = useState<any[]>(ctx.notifications);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  useEffect(() => {
    setItems(ctx.notifications);
  }, [ctx.notifications]);

  const unreadCount = items.filter((item) => !item.read).length;

  const markOneRead = async (notification: any) => {
    if (notification.read || !notification.id) return;
    setUpdatingId(notification.id);
    const previous = items;
    setItems((current) => current.map((item) => String(item.id) === String(notification.id) ? { ...item, read: true } : item));
    try {
      await notificationApi.markRead(Number(notification.id));
      ctx.reload();
    } catch {
      setItems(previous);
      toast.error("Không thể đánh dấu đã đọc");
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllRead = async () => {
    const unreadItems = items.filter((item) => !item.read && item.id);
    if (!unreadItems.length) return;
    const previous = items;
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await Promise.all(unreadItems.map((item) => notificationApi.markRead(Number(item.id))));
      ctx.reload();
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
    } catch {
      setItems(previous);
      toast.error("Không thể cập nhật tất cả thông báo");
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Thông báo"
        description={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Đã đọc hết."}
        icon={<Bell className="size-7" />}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <ExpressiveButton variant="tonal" onClick={() => onNavigate("stu-dashboard")}>
              <ChevronLeft className="size-4" />
              Trang chủ
            </ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={markAllRead} disabled={unreadCount === 0}>
              <CheckCircle2 className="size-4" />
              Đánh dấu đã đọc
            </ExpressiveButton>
          </div>
        )}
      />

      <ExpressiveCard variant="elevated" className="p-3 min-w-0">
        {items.length === 0 ? (
          <EmptyState
            icon={<Bell className="size-7" />}
            title="Chưa có thông báo"
            description="Thông báo sẽ hiển thị tại đây."
          />
        ) : (
          <div className="space-y-2">
            {items.map((notification) => {
              const Icon = notification.type === "success" ? CheckCircle2 : notification.type === "warning" ? AlertTriangle : notification.type === "danger" ? XCircle : Info;
              const iconColor = notification.type === "success" ? "#16a34a" : notification.type === "warning" ? "#f59e0b" : notification.type === "danger" ? "#dc2626" : "#7C4DFF";
              return (
                <motion.button
                  key={notification.id}
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => markOneRead(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors min-w-0",
                    notification.read ? "border-[#E7E0D2] bg-[#FFFEFA]" : "border-[#D9C8FF] bg-[#F6F0FF]",
                  )}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${iconColor}20`, color: iconColor }}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#1F211B]">{notification.title}</p>
                      {!notification.read && <span className="size-2 shrink-0 rounded-full bg-[#7C4DFF]" />}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#6B665C]">{notification.body}</p>
                    <p className="mt-2 text-xs text-[#8A857A]">{notification.createdAt ? formatDateTime(notification.createdAt) : ""}</p>
                  </div>
                  {updatingId === notification.id ? <RefreshCw className="size-4 shrink-0 animate-spin text-[#7C4DFF]" /> : null}
                </motion.button>
              );
            })}
          </div>
        )}
      </ExpressiveCard>
    </PageTransition>
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

function formatTimeOnly(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" }).format(date);
}

function dayKeyOf(value?: string | null): string {
  const d = new Date(value || "");
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabelOf(value?: string | null): string {
  const d = new Date(value || "");
  if (Number.isNaN(d.getTime())) return "Không rõ ngày";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Hôm nay";
  if (sameDay(d, yesterday)) return "Hôm qua";
  return formatDate(value);
}

function HistoryTimelineCard({
  history,
  routes,
  selected,
  onSelect,
  onFeedback,
  onLostItem,
}: {
  history: any;
  routes: any[];
  selected?: boolean;
  onSelect: () => void;
  onFeedback: () => void;
  onLostItem: () => void;
}) {
  const route = routes.find((r) => r.id === String(history.routeId));
  const boardingLabel = displayStopLabel(history.boardingStopName, "Điểm lên chưa rõ");
  const alightingLabel = displayStopLabel(history.alightingStopName, "Điểm xuống chưa rõ");
  const boardedAt = history.boardedAt || history.serviceDate;
  const boardingTime = formatTimeOnly(boardedAt);
  const alightingTime = formatTimeOnly(history.alightedAt);

  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
      onClick={onSelect}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-[24px] border border-[#14140f]/10 bg-white p-3 min-w-0 transition-all hover:border-[#14140f]/20 hover:bg-[#fffdf7]",
        selected && "border-[#BDFD4F] ring-2 ring-[#BDFD4F]/70",
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#BDFD4F] text-xs font-black text-[#14140f] ring-1 ring-[#14140f]/10">
          {route?.code?.slice(0, 2) || history.routeCode?.slice(0, 2) || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#14140f]">
              {history.routeName || route?.name || `Tuyến ${history.routeCode || "UniBus"}`}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-bold text-[#16803c]">
              <CheckCircle2 className="size-3" />
              Hoàn tất
            </span>
          </div>
          {(boardingTime || alightingTime) && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold tabular-nums text-[#6B6B6B]">
              <Clock className="size-3.5" />
              {boardingTime || "—"}{alightingTime ? ` → ${alightingTime}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-[18px] bg-[#F8F6EF] px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B6B6B]">Lên xe</p>
            <p className="mt-0.5 truncate text-sm font-bold text-[#14140f]">{boardingLabel}</p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-[#6B6B6B]" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B6B6B]">Xuống xe</p>
            <p className="mt-0.5 truncate text-sm font-bold text-[#14140f]">{alightingLabel}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex shrink-0 justify-end gap-2 border-t border-[#14140f]/8 pt-2.5">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFeedback();
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#BDFD4F] px-3 text-xs font-bold text-[#14140f] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(189,253,79,0.32)] active:translate-y-0 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BDFD4F] focus-visible:ring-offset-2"
        >
          <Star className="size-3.5" />
          Đánh giá
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onLostItem();
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface transition-all duration-150 hover:-translate-y-0.5 hover:border-[#14140f]/30 hover:bg-white hover:shadow-[0_8px_18px_rgba(20,20,15,0.08)] active:translate-y-0 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BDFD4F] focus-visible:ring-offset-2"
        >
          <PackageSearch className="size-3.5" />
          Mất đồ
        </button>
      </div>
    </motion.div>
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
      description: "Gửi ảnh thẻ sinh viên.",
      tone: "neutral",
    },
    PENDING_REVIEW: {
      label: "Đang chờ duyệt",
      description: "Đang chờ UniBus duyệt.",
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
      <div className="mb-4 flex items-center gap-3 min-w-0">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#c8a0ff] text-[#14140f]">
          <Sparkles className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold">Thông tin đọc từ thẻ</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Thông tin từ ảnh thẻ</p>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid gap-2 sm:grid-cols-3">
        <FieldLine label="Họ tên trên thẻ" value={verification.ocrFullName} />
        <FieldLine label="MSSV trên thẻ" value={verification.ocrStudentCode} />
        <FieldLine label="Trường trên thẻ" value={verification.ocrUniversity} />
      </div>

      {(verification.ocrRawText || confidencePercent != null) && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-xs font-bold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 list-none">
            <ChevronRight className="size-3.5 group-open:rotate-90 transition-transform" />
            Xem chi tiết OCR
          </summary>
          <div className="mt-2 space-y-3 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3">
            {confidencePercent != null && (
              <div className="text-xs text-on-surface-variant">
                Độ tin cậy: <span className="font-bold text-on-surface">{Math.round(confidencePercent)}%</span>
              </div>
            )}
            {verification.ocrRawText && (
              <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs text-on-surface-variant scrollbar-soft font-mono">
                {verification.ocrRawText}
              </p>
            )}
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

      <div className="grid gap-4">
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

          {isPending && (
            <ExpressiveCard variant="filled" className="p-5 min-w-0">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 text-warning" />
                <div className="min-w-0">
                  <h3 className="font-bold">Hồ sơ đang chờ admin duyệt</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Không cần gửi lại.
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

          {!isVerified && <OcrSummary verification={currentVerification} />}

          {canSubmit && (
            <ExpressiveCard variant="elevated" className="p-5 min-w-0">
              <div className="mb-4">
                <h3 className="text-base font-bold">Gửi hồ sơ xác minh</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Nhập trường/MSSV và ảnh thẻ rõ nét.
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

              <div className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
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

      </div>
    </PageTransition>
  );
}

// =============================================================================
// Screen 3: Journey planner desktop wrapper
// =============================================================================
function JourneyPlannerDesktopScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const [originQuery, setOriginQuery] = useState("Trường Đại học Duy Tân");
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
  const distanceMeters = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    const radius = 6371000;
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  const distanceLabel = (meters?: number | null) => {
    if (meters == null) return "Chưa xác định";
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  };
  const walkingLabel = (meters?: number | null) => {
    if (meters == null) return "Chưa xác định";
    return `${Math.max(1, Math.round(meters / 80))} phút đi bộ`;
  };
  const moneyValue = (value: number | string | undefined | null) => numberValue(value);
  const coordinate = useCallback((point: CoordinateDTO) => ({
    lat: numberValue(point.latitude),
    lng: numberValue(point.longitude),
  }), []);

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
      toast.error("Chọn điểm đi và điểm đến.");
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
        toast.success(`Đã tìm thấy ${result.length} lộ trình.`);
      } else {
        toast.info("Chưa có lộ trình.");
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
          transportApi.searchPlaces("Trường Đại học Duy Tân", undefined, undefined, 3),
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
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedJourney?.optionId]);

  const useGps = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ .");
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

  const busLegs = useMemo(() => selectedJourney?.legs.filter((leg) => leg.mode === "BUS") || [], [selectedJourney?.legs]);
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
  })).filter((line) => line.points.length >= 2), [coordinate, selectedJourney?.polylines]);

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

  const stopNameForAction = (stopId?: number) => {
    if (!stopId) return "Chưa xác định";
    return selectedJourney?.stops?.find((stop) => stop.stopId === stopId)?.stopName
      || tracking?.stops?.find((stop) => stop.stopId === stopId)?.stopName
      || "Chưa xác định";
  };

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
      localStorage.setItem("unibus.pendingPaymentRegistration", JSON.stringify({
        registrationId: action.routeId,
        routeId: action.routeId,
        routeName: selectedJourney?.summary || selectedJourney?.primaryAction?.label || "Tuyến đã đăng ký",
        boardingStopId: action.boardingStopId,
        boardingStopName: stopNameForAction(action.boardingStopId),
        alightingStopId: action.alightingStopId,
        alightingStopName: stopNameForAction(action.alightingStopId),
        status: "APPROVED",
        registeredAt: new Date().toISOString(),
      }));
      ctx.reload();
      toast.success("Đã đăng ký tuyến. Chuyển sang mua vé tháng.");
      onNavigate("stu-invoices");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        localStorage.setItem("unibus.paymentRouteId", String(action.routeId));
        localStorage.setItem("unibus.pendingPaymentRegistration", JSON.stringify({
          registrationId: action.routeId,
          routeId: action.routeId,
          routeName: selectedJourney?.summary || selectedJourney?.primaryAction?.label || "Tuyến đã đăng ký",
          boardingStopId: action.boardingStopId,
          boardingStopName: stopNameForAction(action.boardingStopId),
          alightingStopId: action.alightingStopId,
          alightingStopName: stopNameForAction(action.alightingStopId),
          status: "APPROVED",
          registeredAt: new Date().toISOString(),
        }));
        toast.info("Tuyến này đã được đăng ký. Chuyển sang mua vé.");
        onNavigate("stu-invoices");
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
            <p className="text-sm text-on-surface-variant">Tìm tuyến, đăng ký, theo dõi.</p>
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
              title="Dùng "
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
                        <p className="text-[10px] font-black uppercase tracking-wide text-[#beff50]">Xe thời gian dự kiến gần nhất</p>
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
    const rawContext = window.sessionStorage.getItem("unibus:assistant:route-preview-context");
    let routeCode = "";
    try {
      routeCode = rawContext ? String(JSON.parse(rawContext)?.routeCode || "") : "";
    } catch {
      routeCode = "";
    }
    const matched = routeRows.find((row: any) => {
      const route = row.route || {};
      return String(route.id) === routeId
        || String(route.routeId) === routeId
        || (!!routeCode && String(route.code || route.routeCode).toLowerCase() === routeCode.toLowerCase());
    });
    window.sessionStorage.removeItem("unibus:assistant:route-preview");
    window.sessionStorage.removeItem("unibus:assistant:route-preview-context");
    if (!matched) return;
    setSelectedJourneyId("");
    setSelectedRoutePreviewId(String(matched.route.id ?? matched.route.routeId));
  }, [routeRows]);

  useEffect(() => {
    if (!selectedJourneyId && !selectedRoutePreviewId) return;
    window.setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [selectedJourneyId, selectedRoutePreviewId]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Trình duyệt không hỗ trợ .");
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
  const nearestJourneyStop = userLocation && selectedJourneyStops.length
    ? selectedJourneyStops
        .filter((stop: any) => Number.isFinite(Number(stop.lat)) && Number.isFinite(Number(stop.lng)))
        .map((stop: any) => ({
          stop,
          meters: Math.round(distanceKm(userLocation, { lat: Number(stop.lat), lng: Number(stop.lng) }) * 1000),
        }))
        .sort((a, b) => a.meters - b.meters)[0]?.stop
    : null;
  const selectedWalkLines: JourneyPolyline[] = userLocation && nearestJourneyStop
    ? [{
        id: "gps-to-nearest-stop",
        label: "Đi bộ đến trạm gần nhất",
        dashed: true,
        points: [
          userLocation,
          { lat: Number(nearestJourneyStop.lat), lng: Number(nearestJourneyStop.lng) },
        ],
      }]
    : [];
  const selectedMarkers: JourneyExtraMarker[] = [
    ...(userLocation ? [{ id: "current", label: "Vị trí hiện tại", lat: userLocation.lat, lng: userLocation.lng, tone: "current" as const }] : []),
    ...(nearestJourneyStop ? [{ id: "nearest-route-stop", label: "Trạm gần nhất", lat: Number(nearestJourneyStop.lat), lng: Number(nearestJourneyStop.lng), tone: "nearest" as const }] : []),
  ];

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
                          { label: "Xe đến trạm", value: option.walkMin ? `${option.walkMin} phút đi bộ` : "Bật ", icon: Crosshair },
                          { label: "Tổng thời gian", value: `${option.totalMinutes} phút`, icon: Clock },
                          { label: "Chuyển tuyến", value: option.transferCount ? `${option.transferCount} lần` : "Không", icon: ArrowLeftRight },
                          { label: "Tổng km", value: option.totalDistanceKm ? `${option.totalDistanceKm.toFixed(1)} km` : "Thời gian dự kiến", icon: MapPin },
                          { label: "Trạng thái", value: isRunning ? "Đang đi" : "Chưa đi", icon: Navigation },
                          { label: "Vé lượt tham khảo", value: option.singleFare ? formatVND(option.singleFare) : "Theo tuyến", icon: Wallet },
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
                        <p className="text-xs opacity-75">Bản đồ hiển thị theo thứ tự trạm trên tuyến.</p>
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
                        {stops.slice(0, 12).map((stop: any, stopIdx: number) => (
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
                        {stops.length > 12 ? <p className="pt-1 text-center text-xs font-bold text-on-surface-variant">{stops.length - 12} trạm khác</p> : null}
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
// Screen 5: Tracking — estimated map + ETA
// =============================================================================
function TrackingScreen({ ctx, compact = false, onNavigate }: { ctx: Ctx; compact?: boolean; onNavigate?: (id: string) => void }) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(ctx.registration?.routeId ? String(ctx.registration.routeId) : String(ctx.routes[0]?.id || ""));
  const [registrations, setRegistrations] = useState<RegistrationDTO[]>(ctx.registration ? [ctx.registration] : []);
  const [eta, setEta] = useState<EtaDTO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [journeyId, setJourneyId] = useState("");
  const [trackingContext, setTrackingContext] = useState<RouteTrackingContext | null>(null);
  const [journeyTracking, setJourneyTracking] = useState<JourneyTrackingSnapshotDTO | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [choosingRoute, setChoosingRoute] = useState(false);
  const [showAllTrackingStops, setShowAllTrackingStops] = useState(false);
  const [showAllEtaStops, setShowAllEtaStops] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestStopWalkLine, setNearestStopWalkLine] = useState<{ lat: number; lng: number }[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string>("");
  const [selectedStopEtas, setSelectedStopEtas] = useState<EtaDTO[] | null>(null);
  const [selectedStopEtaLoading, setSelectedStopEtaLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const locationRequestedRef = useRef(false);
  const autoSelectedNearestVehicleRef = useRef(false);

  const registeredRoutes = registrations.length ? registrations : ctx.registration ? [ctx.registration] : [];
  const selectedRegistration = registeredRoutes.find((item) => String(item.routeId) === String(trackingContext?.routeId))
    || registeredRoutes.find((item) => String(item.routeId) === String(selectedRouteId));
  const selectedRoute = ctx.routes.find((r) => String(r.id) === String(trackingContext?.routeId))
    || ctx.routes.find((r) => String(r.id) === String(selectedRouteId));
  const routeStops = useMemo(
    () => {
      const normalizeStop = (stop: any) => ({
        id: String(stop.id ?? stop.stopId),
        name: stop.name ?? stop.stopName,
        code: stop.code ?? stop.stopCode ?? String(stop.id ?? stop.stopId),
        address: stop.address,
        lat: stop.lat ?? stop.latitude,
        lng: stop.lng ?? stop.longitude,
        hasShelter: stop.hasShelter,
        routes: stop.routes || [],
      });
      const embeddedStops = selectedRoute?.stops;
      if (Array.isArray(embeddedStops) && embeddedStops.length && typeof embeddedStops[0] === "object") {
        return embeddedStops.map(normalizeStop);
      }
      const routeStopIds = new Set((Array.isArray(embeddedStops) ? embeddedStops : []).map((id: any) => String(id)));
      return ctx.stops
        .filter((stop: any) => routeStopIds.has(String(stop.id ?? stop.stopId)))
        .map(normalizeStop);
    },
    [ctx.stops, selectedRoute],
  );

  const numberValue = (value: number | string | undefined | null) => Number(value ?? 0) || 0;
  const distanceMeters = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    const radius = 6371000;
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  const distanceLabel = (meters?: number | null) => {
    if (meters == null) return "Chưa xác định";
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  };
  const walkingLabel = (meters?: number | null) => {
    if (meters == null) return "Chưa xác định";
    return `${Math.max(1, Math.round(meters / 80))} phút đi bộ`;
  };
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
        name: "Trạm đầu tuyến",
        code: "A",
        address: "Đà Nẵng",
        lat: first.lat,
        lng: first.lng,
        routes: [],
        hasShelter: false,
      },
      {
        id: "journey-destination",
        name: "Trạm cuối tuyến",
        code: "B",
        address: "Đà Nẵng",
        lat: last.lat,
        lng: last.lng,
        routes: [],
        hasShelter: false,
        boarding: false,
        alighting: false,
      },
    ];
  }, [journeyPolylines]);


  const trackingStops = useMemo(() => {
    if (journeyTracking?.stops?.length) {
      return journeyTracking.stops
        .map((stop) => ({
          id: String(stop.stopId),
          name: stop.stopName,
          code: String(stop.stopId),
          address: stop.address || "Đà Nẵng",
          lat: numberValue(stop.latitude),
          lng: numberValue(stop.longitude),
          routes: journeyTracking.routeCode ? [journeyTracking.routeCode] : [],
          hasShelter: false,
          boarding: Boolean(stop.boarding),
          alighting: Boolean(stop.alighting),
        }))
        .filter((stop) => stop.lat && stop.lng);
    }
    if (routeStops.length) {
      return routeStops
        .map((stop: any) => ({
          id: String(stop.id ?? stop.stopId),
          name: stop.name ?? stop.stopName,
          code: stop.code ?? stop.stopCode ?? String(stop.id ?? stop.stopId),
          address: stop.address || "Đà Nẵng",
          lat: numberValue(stop.lat ?? stop.latitude),
          lng: numberValue(stop.lng ?? stop.longitude),
          routes: selectedRoute?.code ? [selectedRoute.code] : [],
          hasShelter: Boolean(stop.hasShelter),
          boarding: trackingContext?.boardingStopId != null && String(trackingContext.boardingStopId) === String(stop.id ?? stop.stopId),
          alighting: trackingContext?.alightingStopId != null && String(trackingContext.alightingStopId) === String(stop.id ?? stop.stopId),
        }))
        .filter((stop) => stop.lat && stop.lng);
    }
    return journeyStops;
  }, [journeyStops, journeyTracking?.routeCode, journeyTracking?.stops, routeStops, selectedRoute?.code, trackingContext?.alightingStopId, trackingContext?.boardingStopId]);

  const boardingStop = trackingStops.find((stop) => stop.boarding) || trackingStops[0];
  const alightingStop = trackingStops.find((stop) => stop.alighting) || trackingStops[trackingStops.length - 1];
  const nextEta = journeyTracking?.stopEtas?.[0];
  const routeTitle = journeyTracking?.routeName || trackingContext?.routeName || selectedRoute?.name || "Tuyến đang theo dõi";
  const routeCode = journeyTracking?.routeCode || trackingContext?.routeCode || journeyTracking?.stopEtas?.[0]?.routeCode || selectedRoute?.code || "BUS";
  const displayVehicles = useMemo(() => journeyTracking?.vehicles || [], [journeyTracking?.vehicles]);
  const selectedVehicle = displayVehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId) || displayVehicles[0];
  const collapsedVehicles = displayVehicles.filter((vehicle) => vehicle.vehicleId !== selectedVehicle?.vehicleId);

  const journeyBuses = useMemo(() => displayVehicles
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
    .filter((vehicle) => vehicle.lat && vehicle.lng), [displayVehicles, journeyRouteColor]);
  const etaStopRows = (journeyTracking?.stopEtas || []).map((stop) => ({
    id: `eta-${stop.routeId}-${stop.stopId}`,
    name: stop.stopName,
    address: stop.estimatedArrivalAt
      ? `${stop.routeCode || routeCode} · ${new Date(stop.estimatedArrivalAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
      : stop.routeCode || routeCode,
    boarding: stop.stopId === journeyTracking?.boardingStopId,
    alighting: stop.stopId === journeyTracking?.alightingStopId,
  }));
  const hasOnlySyntheticStops = trackingStops.length <= 2 && trackingStops.some((stop) => stop.id.startsWith("journey-"));
  const stopRows = hasOnlySyntheticStops && etaStopRows.length ? etaStopRows : trackingStops;
  const boardingName = hasOnlySyntheticStops && nextEta ? nextEta.stopName : boardingStop?.name;
  const alightingName = hasOnlySyntheticStops && etaStopRows.length ? etaStopRows[etaStopRows.length - 1].name : alightingStop?.name;
  const routeStatus = journeyTracking?.vehicles?.length
    ? "Chuyến đang chạy"
    : journeyTracking?.stopEtas?.length
      ? "Xe sắp tới"
      : "Chưa có chuyến";
  const hasTrackingSnapshot = Boolean(journeyId || trackingContext?.routeId);
  const showRouteChooser = choosingRoute || !hasTrackingSnapshot;
  const primaryVehicle = selectedVehicle;
  const nextVehicleStopIndex = primaryVehicle?.nextStopId == null
    ? -1
    : trackingStops.findIndex((stop) => String(stop.id) === String(primaryVehicle.nextStopId));
  const vehicleProjectedNextStopIndex = primaryVehicle && trackingStops.length > 1
    ? (() => {
        const vehicleLat = numberValue(primaryVehicle.latitude);
        const vehicleLng = numberValue(primaryVehicle.longitude);
        if (!vehicleLat || !vehicleLng) return -1;
        const scale = Math.cos(vehicleLat * Math.PI / 180);
        let bestSegmentIndex = -1;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (let index = 0; index < trackingStops.length - 1; index += 1) {
          const from = trackingStops[index];
          const to = trackingStops[index + 1];
          const ax = from.lng * scale;
          const ay = from.lat;
          const bx = to.lng * scale;
          const by = to.lat;
          const px = vehicleLng * scale;
          const py = vehicleLat;
          const dx = bx - ax;
          const dy = by - ay;
          const lengthSquared = dx * dx + dy * dy;
          const progress = lengthSquared ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)) : 0;
          const projectedX = ax + progress * dx;
          const projectedY = ay + progress * dy;
          const distance = (px - projectedX) ** 2 + (py - projectedY) ** 2;
          if (distance < bestDistance) {
            bestDistance = distance;
            bestSegmentIndex = index;
          }
        }
        return bestSegmentIndex < 0 ? -1 : Math.min(trackingStops.length - 1, bestSegmentIndex + 1);
      })()
    : -1;
  const effectiveNextVehicleStopIndex = Math.max(nextVehicleStopIndex, vehicleProjectedNextStopIndex);
  const realtimeEtaRows = primaryVehicle && trackingStops.length && effectiveNextVehicleStopIndex >= 0
    ? trackingStops.map((stop, index) => {
        const passed = index < effectiveNextVehicleStopIndex;
        const current = index === effectiveNextVehicleStopIndex;
        const baseEtaMinutes = Math.max(0, Number(primaryVehicle.etaMinutes ?? 0));
        const minutesAway = passed
          ? -1
          : baseEtaMinutes + Math.max(0, index - effectiveNextVehicleStopIndex) * 4;
        return {
          stopId: Number(stop.id),
          stopName: stop.name,
          routeId: Number(journeyTracking?.routeId || trackingContext?.routeId || selectedRouteId || 0),
          routeCode: journeyTracking?.routeCode || trackingContext?.routeCode || selectedRoute?.code || "BUS",
          estimatedArrivalAt: passed ? undefined : new Date(new Date(journeyTracking?.updatedAt || new Date().toISOString()).getTime() + minutesAway * 60_000).toISOString(),
          minutesAway,
          passed,
          current,
        };
      })
    : (journeyTracking?.stopEtas || []).map((stop, index) => ({ ...stop, passed: false, current: index === 0 }));
  const nearestStop = userLocation && trackingStops.length
    ? trackingStops
      .map((stop) => ({ stop, meters: distanceMeters(userLocation, { lat: stop.lat, lng: stop.lng }) }))
      .sort((left, right) => left.meters - right.meters)[0]
    : null;
  const preferredWalkStop = nearestStop;
  const selectedStop = trackingStops.find((stop) => stop.id === selectedStopId)
    || boardingStop
    || nearestStop?.stop
    || trackingStops[0];
  const selectedStopDistance = userLocation && selectedStop
    ? distanceMeters(userLocation, { lat: selectedStop.lat, lng: selectedStop.lng })
    : null;
  const selectedStopRealtimeEta = realtimeEtaRows.find((stop) => selectedStop && String(stop.stopId) === String(selectedStop.id));
  const selectedStopNextEta = selectedStopRealtimeEta
    || selectedStopEtas?.[0]
    || (journeyTracking?.stopEtas || []).find((stop) => selectedStop && String(stop.stopId) === String(selectedStop.id));
  const selectedStopPassed = Boolean((selectedStopNextEta as { passed?: boolean } | undefined)?.passed);
  const selectedStopMinutes = selectedStopPassed ? null : ((selectedStopNextEta as { minutesAway?: number; etaMinutes?: number } | undefined)?.minutesAway
    ?? (selectedStopNextEta as { minutesAway?: number; etaMinutes?: number } | undefined)?.etaMinutes);
  const selectedStopEtaLabel = selectedStopEtaLoading
    ? "Đang tải"
    : selectedStopPassed
      ? "Đã qua trạm"
      : selectedStopMinutes != null
        ? `${selectedStopMinutes} phút`
        : "Chưa có thời gian dự kiến";
  const trackingMarkers: JourneyExtraMarker[] = [
    userLocation ? { id: "user-location", label: "Bạn đang ở đây", lat: userLocation.lat, lng: userLocation.lng, tone: "user" } : null,
    nearestStop ? { id: "nearest-stop", label: `Gần bạn nhất: ${nearestStop.stop.name}`, lat: nearestStop.stop.lat, lng: nearestStop.stop.lng, tone: "nearest" } : null,
    selectedStop ? { id: "selected-stop", label: `Trạm đang chọn: ${selectedStop.name}`, lat: selectedStop.lat, lng: selectedStop.lng, tone: "selected" } : null,
    boardingStop ? { id: "boarding", label: `Trạm lên: ${boardingStop.name}`, lat: boardingStop.lat, lng: boardingStop.lng, tone: "boarding" } : null,
    alightingStop ? { id: "alighting", label: `Trạm xuống: ${alightingStop.name}`, lat: alightingStop.lat, lng: alightingStop.lng, tone: "destination" } : null,
  ].filter(Boolean) as JourneyExtraMarker[];

  const trackingPolylines = useMemo(() => {
    if (!nearestStopWalkLine.length) return journeyPolylines;
    return [
      ...journeyPolylines,
      {
        id: "user-nearest-stop",
        label: "Đường đi bộ tới trạm gần nhất",
        color: "#16a34a",
        dashed: true,
        points: nearestStopWalkLine,
      },
    ];
  }, [journeyPolylines, nearestStopWalkLine]);

  useEffect(() => {
    if (!userLocation || !preferredWalkStop?.stop) {
      setNearestStopWalkLine([]);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const from = `${userLocation.lng},${userLocation.lat}`;
    const to = `${preferredWalkStop.stop.lng},${preferredWalkStop.stop.lat}`;
    fetch(`https://router.project-osrm.org/route/v1/foot/${from};${to}?overview=full&geometries=geojson&steps=false`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Routing failed")))
      .then((data) => {
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) throw new Error("No route geometry");
        const points = coordinates
          .map((point: [number, number]) => ({ lat: Number(point[1]), lng: Number(point[0]) }))
          .filter((point: { lat: number; lng: number }) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
        if (!cancelled) setNearestStopWalkLine(points.length >= 2 ? points : []);
      })
      .catch((error) => {
        if (!cancelled && error?.name !== "AbortError") setNearestStopWalkLine([]);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [preferredWalkStop?.stop?.lat, preferredWalkStop?.stop?.lng, userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    let cancelled = false;
    studentApi.registrations()
      .then((list) => {
        if (!cancelled) setRegistrations(list.length ? list : ctx.registration ? [ctx.registration] : []);
      })
      .catch(() => {
        if (!cancelled) setRegistrations(ctx.registration ? [ctx.registration] : []);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx.registration]);

  useEffect(() => {
    const storedJourneyId = localStorage.getItem("unibus.trackingJourneyId") || "";
    setJourneyId(storedJourneyId);
    const rawContext = localStorage.getItem("unibus.trackingContext");
    if (rawContext) {
      try {
        const parsed = JSON.parse(rawContext) as RouteTrackingContext;
        if (parsed?.type === "route" && parsed.routeId) {
          setTrackingContext(parsed);
          setSelectedRouteId(String(parsed.routeId));
          setChoosingRoute(false);
        }
      } catch {
        localStorage.removeItem("unibus.trackingContext");
      }
    } else if (!storedJourneyId) {
      setChoosingRoute(true);
    }
  }, []);

  useEffect(() => {
    if (!selectedStopId && trackingStops.length) {
      const fallbackStop = boardingStop || nearestStop?.stop || trackingStops[0];
      if (fallbackStop) setSelectedStopId(fallbackStop.id);
    }
  }, [boardingStop, nearestStop?.stop, selectedStopId, trackingStops]);

  const requestMyLocation = () => {
    if (!navigator.geolocation) {
      toast.info("Trình duyệt chưa hỗ trợ vị trí.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(location);
        if (trackingStops.length) {
          const closest = trackingStops
            .map((stop) => ({ stop, meters: distanceMeters(location, { lat: stop.lat, lng: stop.lng }) }))
            .sort((left, right) => left.meters - right.meters)[0];
          if (closest?.stop?.id) {
            setSelectedStopId(closest.stop.id);
            setSelectedStopEtas(null);
          }
        }
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        toast.info("Không thể lấy vị trí.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    if (locationRequestedRef.current || showRouteChooser || !hasTrackingSnapshot || typeof navigator === "undefined") return;
    locationRequestedRef.current = true;
    requestMyLocation();
  }, [hasTrackingSnapshot, showRouteChooser]);

  useEffect(() => {
    if (!selectedVehicleId && displayVehicles[0]?.vehicleId) setSelectedVehicleId(displayVehicles[0].vehicleId);
  }, [displayVehicles, selectedVehicleId]);
  useEffect(() => {
    autoSelectedNearestVehicleRef.current = false;
  }, [journeyId, trackingContext?.routeId]);

  useEffect(() => {
    if (!userLocation || !displayVehicles.length || autoSelectedNearestVehicleRef.current) return;
    const targetStop = boardingStop || nearestStop?.stop;
    const nearestStopIndex = targetStop
      ? trackingStops.findIndex((stop) => String(stop.id) === String(targetStop.id))
      : -1;
    const vehicleNextIndex = (vehicle: NonNullable<JourneyTrackingSnapshotDTO["vehicles"]>[number]) => {
      const apiIndex = vehicle.nextStopId == null
        ? -1
        : trackingStops.findIndex((stop) => String(stop.id) === String(vehicle.nextStopId));
      const vehicleLat = numberValue(vehicle.latitude);
      const vehicleLng = numberValue(vehicle.longitude);
      if (!vehicleLat || !vehicleLng || trackingStops.length < 2) return apiIndex;
      const scale = Math.cos(vehicleLat * Math.PI / 180);
      let bestSegmentIndex = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < trackingStops.length - 1; index += 1) {
        const from = trackingStops[index];
        const to = trackingStops[index + 1];
        const ax = from.lng * scale;
        const ay = from.lat;
        const bx = to.lng * scale;
        const by = to.lat;
        const px = vehicleLng * scale;
        const py = vehicleLat;
        const dx = bx - ax;
        const dy = by - ay;
        const lengthSquared = dx * dx + dy * dy;
        const progress = lengthSquared ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)) : 0;
        const projectedX = ax + progress * dx;
        const projectedY = ay + progress * dy;
        const distance = (px - projectedX) ** 2 + (py - projectedY) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSegmentIndex = index;
        }
      }
      const projectedIndex = bestSegmentIndex < 0 ? -1 : Math.min(trackingStops.length - 1, bestSegmentIndex + 1);
      return Math.max(apiIndex, projectedIndex);
    };
    const rankedVehicles = displayVehicles
      .filter((vehicle) => vehicle.latitude != null && vehicle.longitude != null)
      .map((vehicle) => {
        const nextIndex = vehicleNextIndex(vehicle);
        return {
          vehicle,
          hasNotPassedNearestStop: nearestStopIndex < 0 || nextIndex < 0 || nextIndex <= nearestStopIndex,
          meters: distanceMeters(userLocation, { lat: numberValue(vehicle.latitude), lng: numberValue(vehicle.longitude) }),
        };
      })
      .sort((left, right) => Number(right.hasNotPassedNearestStop) - Number(left.hasNotPassedNearestStop) || left.meters - right.meters);
    const preferredVehicle = rankedVehicles[0];
    if (!preferredVehicle?.vehicle?.vehicleId) return;
    autoSelectedNearestVehicleRef.current = true;
    setSelectedVehicleId(preferredVehicle.vehicle.vehicleId);
    setShowAllVehicles(false);
  }, [boardingStop, displayVehicles, nearestStop?.stop, trackingStops, userLocation]);


  const selectTrackingStop = (stopId: string) => {
    setSelectedStopId(stopId);
    setSelectedStopEtas(null);
  };

  useEffect(() => {
    const routeId = trackingContext?.routeId || selectedRouteId;
    if (!routeId || !selectedStop?.id || selectedStop.id.startsWith("journey-")) return;
    let cancelled = false;
    setSelectedStopEtas(null);
    setSelectedStopEtaLoading(true);
    transportApi.eta(routeId, selectedStop.id)
      .then((rows) => {
        if (!cancelled) setSelectedStopEtas(rows);
      })
      .catch(() => {
        if (!cancelled) setSelectedStopEtas(null);
      })
      .finally(() => {
        if (!cancelled) setSelectedStopEtaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRouteId, selectedStop?.id, trackingContext?.routeId]);

  const loadJourneyTracking = useCallback(async () => {
    if (!journeyId && !trackingContext?.routeId) return;
    setJourneyLoading(true);
    try {
      const snapshot = journeyId
        ? await transportApi.trackJourney(journeyId)
        : await transportApi.trackRoute(trackingContext!.routeId, {
          boardingStopId: trackingContext?.boardingStopId,
          alightingStopId: trackingContext?.alightingStopId,
        });
      setJourneyTracking(snapshot);
    } catch {
      setJourneyTracking(null);
    } finally {
      setJourneyLoading(false);
    }
  }, [journeyId, trackingContext]);

  useEffect(() => {
    if (!journeyId && !trackingContext?.routeId) return;
    void loadJourneyTracking();
    const interval = window.setInterval(loadJourneyTracking, 2000);
    return () => window.clearInterval(interval);
  }, [journeyId, trackingContext?.routeId, loadJourneyTracking]);

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

  const chooseRegisteredRoute = (registration: RegistrationDTO) => {
    saveRouteTrackingContext(registration);
    setSelectedRouteId(String(registration.routeId));
    setJourneyId("");
    setTrackingContext({
      type: "route",
      routeId: registration.routeId,
      boardingStopId: registration.boardingStopId,
      alightingStopId: registration.alightingStopId,
      routeCode: (registration as RegistrationDTO & { routeCode?: string }).routeCode,
      routeName: registration.routeName,
      registrationId: registration.registrationId,
    });
    setJourneyTracking(null);
    setChoosingRoute(false);
  };

  const openRouteChooser = () => {
    setChoosingRoute(true);
  };

  const nearestEtaIndex = Math.max(0, realtimeEtaRows.findIndex((stop) => Boolean((stop as { current?: boolean }).current)));
  const etaWindowStart = showAllEtaStops ? 0 : Math.max(0, Math.min(nearestEtaIndex - 2, realtimeEtaRows.length - 5));
  const visibleEtaRows = showAllEtaStops ? realtimeEtaRows : realtimeEtaRows.slice(etaWindowStart, etaWindowStart + 5);
  const visibleStopRows = showAllTrackingStops ? stopRows : stopRows.slice(0, 6);
  const trackingUpdatedLabel = journeyTracking?.updatedAt ? `Cập nhật ${formatDateTime(journeyTracking.updatedAt)}` : "Đang đồng bộ";
  const trackingSourceLabel = journeyTracking?.vehicles?.length ? "Chuyến đang chạy" : "Chưa có chuyến";
  const trackingModeBadge = journeyTracking?.vehicles?.length ? "Chuyến đang chạy" : "Chưa có chuyến";

  return (
    <PageTransition className="space-y-6 min-w-0">
      {!compact && (
        <PageHeader
          title="Theo dõi tuyến"
          description="Xem xe sắp tới trạm của bạn, thời gian dự kiến và các trạm đi qua."
          icon={<Navigation className="size-7" />}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {showRouteChooser && hasTrackingSnapshot ? (
                <button
                  type="button"
                  onClick={() => setChoosingRoute(false)}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-outline-variant px-4 text-sm font-bold hover:bg-surface-container-high"
                >
                  <ChevronLeft className="size-4" />
                  Quay lại tuyến đang xem
                </button>
              ) : null}
              <button
                type="button"
                onClick={showRouteChooser ? () => onNavigate?.("stu-dashboard") : openRouteChooser}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-outline-variant px-4 text-sm font-bold hover:bg-surface-container-high"
              >
                {showRouteChooser ? <ChevronLeft className="size-4" /> : <RouteIcon className="size-4" />}
                {showRouteChooser ? "Về trang chủ" : "Chọn tuyến khác"}
              </button>
            </div>
          }
        />
      )}

      {compact && showRouteChooser && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface p-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-on-surface-variant">Theo dõi tuyến</p>
            <p className="truncate text-sm font-semibold text-on-surface">
              {selectedRoute ? `${selectedRoute.code} - ${selectedRoute.name}` : "Chọn tuyến để xem xe sắp tới"}
            </p>
          </div>
          <button type="button" onClick={() => setChoosingRoute(true)} className="h-10 rounded-xl border border-outline-variant px-3 text-sm font-bold hover:bg-surface-container-high">Chọn tuyến</button>
        </div>
      )}

      {showRouteChooser && (
        <ScrollReveal>
          <ExpressiveCard variant="filled" className="p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-on-surface-variant">Tuyến đã đăng ký</p>
                <h3 className="text-xl font-black text-on-surface">Chọn tuyến để theo dõi</h3>
                <p className="mt-1 text-sm text-on-surface-variant">Danh sách này chỉ lấy từ tuyến/vé bạn đã đăng ký, không hiển thị dữ liệu tuyến thô.</p>
              </div>
              {hasTrackingSnapshot ? (
                <button type="button" onClick={() => setChoosingRoute(false)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-outline-variant px-3 text-sm font-bold hover:bg-surface-container-high">
                  <ChevronLeft className="size-4" />
                  Quay lại
                </button>
              ) : null}
            </div>
            {registeredRoutes.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {registeredRoutes.map((registration) => (
                  <button
                    key={registration.registrationId || registration.routeId}
                    type="button"
                    onClick={() => chooseRegisteredRoute(registration)}
                    className="rounded-2xl border border-outline-variant bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:bg-surface-container-low hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#144fcc] px-3 py-1 text-xs font-black text-white">{registration.routeCode || "BUS"}</span>
                      <span className="text-xs font-bold uppercase text-on-surface-variant">Theo dõi tuyến</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-black text-on-surface">{registration.routeName || `Tuyến ${registration.routeCode || registration.routeId}`}</p>
                    <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                      {displayStopLabel(registration.boardingStopName, "Trạm lên")} → {displayStopLabel(registration.alightingStopName, "Trạm xuống")}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<RouteIcon className="size-7" />}
                title="Bạn chưa có tuyến để theo dõi"
                description="Đăng ký tuyến để theo dõi."
                action={onNavigate ? (
                  <ExpressiveButton variant="filled" onClick={() => onNavigate("stu-find")}>
                    <RouteIcon className="size-4" />
                    Tìm tuyến xe
                  </ExpressiveButton>
                ) : undefined}
              />
            )}
          </ExpressiveCard>
        </ScrollReveal>
      )}

      {!showRouteChooser && hasTrackingSnapshot && (
        <div className="grid grid-cols-1 gap-5 min-w-0 xl:grid-cols-[minmax(0,1fr)_390px] 2xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="min-w-0 space-y-5">
          <ScrollReveal>
            <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0 rounded-[28px] border border-[#E8E2D5] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
              <div className="relative h-[520px] bg-[#F8F6EF] lg:h-[680px]">
                {trackingStops.length >= 2 || journeyPolylines.length ? (
                  <JourneyMap
                    stops={trackingStops}
                    routeColor={journeyRouteColor}
                    buses={journeyBuses}
                    polylines={trackingPolylines}
                    allowFallbackPolyline={false}
                    extraMarkers={trackingMarkers}
                    height="100%"
                    animateCamera
                    nextStopIndex={selectedStop ? trackingStops.findIndex((stop) => stop.id === selectedStop.id) : undefined}
                    onSelectStop={selectTrackingStop}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <div>
                      <RefreshCw className={cn("mx-auto size-10 text-on-surface-variant", journeyLoading && "animate-spin")} />
                      <p className="mt-3 text-sm font-semibold text-on-surface">Đang tải dữ liệu theo dõi</p>
                      <p className="mt-1 text-xs text-on-surface-variant">Dữ liệu tuyến đang được tải từ lịch chuyến và điểm dừng hiện có.</p>
                    </div>
                  </div>
                )}


              </div>
            </ExpressiveCard>
          </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <ExpressiveCard variant="filled" className="rounded-[24px] border border-[#E8E2D5] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B6B6B]">Thời gian dự kiến</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#14140f]">Các điểm sắp tới</h3>
                  </div>
                </div>
                {visibleEtaRows.length ? (
                  <div className="max-h-64 overflow-y-auto pr-1 scrollbar-soft">
                    <div className="space-y-0">
                      {visibleEtaRows.map((stop, index) => {
                        const passed = Boolean((stop as { passed?: boolean }).passed);
                        const current = Boolean((stop as { current?: boolean }).current);
                        const displayIndex = showAllEtaStops ? index : etaWindowStart + index;
                        const minutesAway = Math.max(0, Number(stop.minutesAway ?? 0));
                        const timeLabel = passed
                          ? "Đã đi qua"
                          : stop.estimatedArrivalAt
                            ? new Date(stop.estimatedArrivalAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                            : "Đang tính";
                        const etaLabel = passed ? "Đã qua" : `${minutesAway} phút`;
                        return (
                          <button
                            type="button"
                            onClick={() => selectTrackingStop(String(stop.stopId))}
                            key={`${stop.routeId}-${stop.stopId}-${displayIndex}`}
                            className={cn("grid w-full grid-cols-[28px_minmax(0,1fr)_72px] gap-3 text-left", passed && "opacity-55")}
                          >
                            <div className="flex flex-col items-center">
                              <span className={cn(
                                "mt-1 size-3 rounded-full border-2",
                                current ? "border-[#beff50] bg-[#beff50]" : passed ? "border-[#9CA3AF] bg-[#9CA3AF]" : "border-[#144fcc] bg-white",
                              )} />
                              {index < visibleEtaRows.length - 1 ? <span className={cn("mt-1 h-11 w-px", passed ? "bg-[#9CA3AF]/30" : "bg-[#144fcc]/20")} /> : null}
                            </div>
                            <div className="pb-4">
                              <p className={cn("truncate text-sm font-semibold", passed ? "text-[#6B6B6B]" : "text-[#14140f]")}>{stop.stopName}</p>
                              <p className="mt-0.5 text-xs text-[#6B6B6B]">{stop.routeCode || routeCode} · {timeLabel}</p>
                            </div>
                            <p className={cn("pt-0.5 text-right text-sm font-semibold", current ? "text-[#166534]" : passed ? "text-[#6B6B6B]" : "text-[#144fcc]")}>{etaLabel}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl bg-[#FAF8F2] px-4 py-4 text-sm font-medium text-[#6B6B6B]">
                    Chưa có thời gian dự kiến cho tuyến này.
                  </p>
                )}
                {realtimeEtaRows.length > visibleEtaRows.length ? (
                  <button type="button" onClick={() => setShowAllEtaStops((value) => !value)} className="mt-4 w-full rounded-2xl border border-[#E8E2D5] bg-white px-4 py-2 text-sm font-semibold text-[#144fcc] transition hover:bg-[#beff50]/20">
                    {showAllEtaStops ? "Thu gọn thời gian dự kiến" : "Xem tất cả các trạm"}
                  </button>
                ) : null}
              </ExpressiveCard>
            </ScrollReveal>
          </div>

          <aside className="min-w-0 space-y-5">
            <ScrollReveal delay={0.08}>
              <ExpressiveCard variant="filled" className="rounded-[24px] border border-[#E8E2D5] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B6B6B]">Xe sắp tới trạm của bạn</p>
                    <h3 className="mt-2 text-2xl font-semibold leading-tight text-[#14140f]">{routeStatus}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[#6B6B6B]">{routeCode} · {routeTitle}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#beff50]/30 px-3 py-1 text-xs font-semibold text-[#166534]">{trackingModeBadge}</span>
                </div>

                <button type="button" onClick={requestMyLocation} className="mb-4 inline-flex h-10 items-center gap-2 rounded-2xl border border-[#14140f]/10 px-3 text-sm font-semibold text-[#144fcc] hover:bg-[#F8F6EF]">
                  <Crosshair className={cn("size-4", locationLoading && "animate-spin")} />
                  Dùng vị trí của tôi
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <InfoCell label="Trạm đang chọn" value={selectedStop?.name || "Chọn trạm"} />
                  <InfoCell label="Khoảng cách" value={userLocation ? distanceLabel(selectedStopDistance) : "Bấm để tìm trạm gần bạn"} />
                  <InfoCell label="Đi bộ" value={userLocation ? walkingLabel(selectedStopDistance) : "Bấm để tìm trạm gần bạn"} />
                  <InfoCell label="Thời gian dự kiến" value={selectedStopEtaLabel} />
                </div>
              </ExpressiveCard>
            </ScrollReveal>

            <ScrollReveal delay={0.12}>
              <ExpressiveCard variant="filled" className="rounded-[24px] border border-[#E8E2D5] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B6B6B]">Xe trên tuyến</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#14140f]">Thông tin xe</h3>
                  </div>
                  <button onClick={loadJourneyTracking} className="grid size-10 place-items-center rounded-full border border-[#14140f]/10 text-[#6B6B6B] transition hover:bg-[#F8F6EF] hover:text-[#14140f]" aria-label="Làm mới theo dõi tuyến">
                    <RefreshCw className={cn("size-4", journeyLoading && "animate-spin")} />
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedVehicle ? (
                    <motion.div
                      key={selectedVehicle.vehicleId}
                      layout
                      className="relative overflow-hidden rounded-[22px] border border-[#E8E2D5] bg-[#FAF8F2] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(20,20,15,0.07)]"
                    >
                      <span className="absolute right-4 top-4 grid size-14 place-items-center rounded-full bg-[#beff50] text-sm font-black text-[#14140f]">
                        {selectedVehicle.etaMinutes ?? 0} phút
                      </span>
                      <div className="pr-16">
                        <p className="truncate text-base font-semibold text-[#14140f]">{selectedVehicle.plateNumber || "Xe theo lịch tuyến"}</p>
                        <p className="mt-1 text-xs text-[#6B6B6B]">Xe sắp tới · Trạm kế: {selectedVehicle.nextStopName || "đang xác định"}</p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <InfoCell label="Tốc độ" value={`${Math.round(numberValue(selectedVehicle.speedKmh))} km/h`} />
                        <InfoCell label="Tải" value={selectedVehicle.occupancy != null && selectedVehicle.capacity ? `${selectedVehicle.occupancy}/${selectedVehicle.capacity}` : "--"} />
                        <InfoCell label="Biển số" value={selectedVehicle.plateNumber || selectedVehicle.vehicleId || "--"} />
                        <InfoCell label="Tuyến" value={selectedVehicle.routeCode || routeCode} />
                      </div>
                    </motion.div>
                  ) : (
                    <EmptyState
                      icon={<Bus className="size-7" />}
                      title="Chưa có chuyến đang chạy"
                      description="Xem trạm và thời gian dự kiến bên dưới."
                    />
                  )}
                  {collapsedVehicles.length > 0 && (
                    <button type="button" onClick={() => setShowAllVehicles((value) => !value)} className="w-full rounded-2xl border border-[#E8E2D5] bg-white px-4 py-2 text-sm font-semibold text-[#144fcc] transition hover:bg-[#beff50]/20">
                      {showAllVehicles ? "Thu gọn xe trên tuyến" : "Xem thêm xe trên tuyến này"}
                    </button>
                  )}
                  {showAllVehicles && collapsedVehicles.map((vehicle) => (
                    <button
                      key={vehicle.vehicleId}
                      type="button"
                      onClick={() => {
                        setSelectedVehicleId(vehicle.vehicleId);
                        setShowAllVehicles(false);
                      }}
                      className="w-full rounded-[18px] border border-[#E8E2D5] bg-[#FAF8F2] p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
                    >
                      <p className="truncate text-base font-semibold text-[#14140f]">{vehicle.plateNumber || "Xe theo lịch tuyến"}</p>
                      <p className="mt-1 text-xs text-[#6B6B6B]">Xe sắp tới · Trạm kế: {vehicle.nextStopName || "đang xác định"}</p>
                    </button>
                  ))}
                </div>
              </ExpressiveCard>
            </ScrollReveal>


          </aside>
        </div>
      )}

      {!hasTrackingSnapshot && selectedRoute && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 min-w-0">
          {/* Map */}
          <ScrollReveal>
            <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0 h-[400px] lg:h-[500px]">
              <RealMap
                stops={routeStops}
                route={selectedRoute}
                progress={0.3}
                nextStopIndex={0}
                scrollWheelZoom
              />
            </ExpressiveCard>
          </ScrollReveal>

          {/* ETA list */}
          <ScrollReveal delay={0.1}>
            <ExpressiveCard variant="filled" className="p-5 h-full min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">Thời gian dự kiến đến trạm</h3>
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
                  <p className="text-xs font-bold text-on-surface">XE DỰ KIẾN ĐẾN</p>
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
  const [tab, setTab] = useState(() => {
    if (typeof window === "undefined") return "routes";
    const preferred = localStorage.getItem("unibus.myJourneysTab");
    localStorage.removeItem("unibus.myJourneysTab");
    return preferred === "ticket" || preferred === "tracking" || preferred === "routes" ? preferred : "routes";
  });
  const tabs = [
    { id: "routes", label: "Tuyến đã đăng ký", icon: TicketCheck },
    { id: "ticket", label: "Vé đã mua", icon: QrCode },
    { id: "tracking", label: "Theo dõi tuyến", icon: Navigation },
  ];

  const showRoutePicker = () => setTab("routes");
  return (
    <PageTransition className="space-y-5 min-w-0">
      <PageHeader
        title="Vé của tôi"
        icon={<TicketCheck className="size-7" />}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {tab === "tracking" && (
              <ExpressiveButton variant="outlined" className="text-[#14140f]" onClick={showRoutePicker}>
                <ChevronLeft className="size-4" />
                Chọn tuyến khác
              </ExpressiveButton>
            )}
            <ExpressiveButton variant="filled" onClick={() => onNavigate("stu-find")}>
              <RouteIcon className="size-4" />
              Tìm tuyến mới
            </ExpressiveButton>
          </div>
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
                    ? "bg-[#14140f] text-[#beff50] shadow-sm"
                    : "text-on-surface-variant hover:bg-[#F8F6EF] hover:text-[#14140f]",
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
          {tab === "routes" && <MyRoutesScreen ctx={ctx} onNavigate={onNavigate} compact onTrackRoute={() => setTab("tracking")} />}
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
function MyRoutesScreen({ ctx, onNavigate, compact = false, onTrackRoute }: { ctx: Ctx; onNavigate: (id: string) => void; compact?: boolean; onTrackRoute?: () => void }) {
  const [showRegister, setShowRegister] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [working, setWorking] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationDTO[]>([]);
  const [targetCancel, setTargetCancel] = useState<RegistrationDTO | null>(null);
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);
  const [freshPasses, setFreshPasses] = useState<PassesDashboard | null>(null);

  const reg = ctx.registration;
  const activeRegistrations = registrations.length ? registrations : reg ? [reg] : [];

  const registrationStatusLabel = (status?: string) => ({
    APPROVED: "Đã đăng ký",
    PENDING: "Đang chờ",
    CANCELLED: "Đã hủy",
    REJECTED: "Không được duyệt",
  } as Record<string, string>)[String(status || "").toUpperCase()] || "Đã đăng ký";
  const cleanStopLabel = (value?: string | null) => {
    const raw = String(value || "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    const label = displayStopLabel(raw);
    if (label === "Chưa xác định") return label;
    if (/^[a-z0-9\s]+$/.test(raw) && raw === raw.toLowerCase() && raw.length > 12) return "Chưa xác định";
    return label;
  };
  const routeTickets = useMemo(() => freshPasses ? collectMonthlyTicketsFrom(freshPasses, null) : collectMonthlyTickets(ctx), [ctx, freshPasses]);

  const activeMonthlyForRoute = (routeId?: number | string | null, routeName?: string | null, routeCode?: string | null) => {
    const routeKey = routeId == null ? "" : String(routeId);
    const codeKey = String(routeCode || "").trim();
    const nameKey = normalizeRouteMatchText(routeName);
    if (!routeKey && !codeKey && !nameKey) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return routeTickets.find((ticket: any) => {
      const expiryRaw = ticket.expiresOn || ticket.expiresAt;
      const expiry = expiryRaw ? new Date(expiryRaw) : null;
      const stillValid = !expiry || expiry > today;
      const sameRoute = routeKey && String(ticket.routeId) === routeKey;
      const sameCode = codeKey && String(ticket.routeCode || "").trim() === codeKey;
      const ticketName = normalizeRouteMatchText(ticket.routeName || ticket.name);
      const sameName = Boolean(nameKey && ticketName && (ticketName === nameKey || ticketName.includes(nameKey) || nameKey.includes(ticketName)));
      return stillValid && (sameRoute || sameCode || sameName);
    }) || null;
  };
  const targetMonthlyPass = activeMonthlyForRoute(targetCancel?.routeId, targetCancel?.routeName);

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
    studentApi.tickets().then(setFreshPasses).catch(() => setFreshPasses(null));
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
    <PageTransition className={cn("min-w-0", compact ? "space-y-4" : "space-y-6 rounded-[28px] bg-[#FAF8F2] p-4 sm:p-6")}>
      {!compact && (
        <PageHeader
          title="Tuyến của tôi"
          description="Tuyến, vé và theo dõi."
          icon={<TicketCheck className="size-7" />}
          actions={
            <ExpressiveButton variant="filled" onClick={() => onNavigate("stu-find")}>
              <Plus className="size-4" />
              Tìm tuyến mới
            </ExpressiveButton>
          }
        />
      )}

      {activeRegistrations.length === 0 ? (
        <div className="rounded-[24px] border border-[#E8E2D5] bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#111111] text-[#BDFD4F]">
            <RouteIcon className="size-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#111111]">Chưa đăng ký tuyến nào</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6B6B6B]">Chọn tuyến để mua vé.</p>
          <ExpressiveButton variant="filled" className="mt-5" onClick={() => onNavigate("stu-find")}>
            <Plus className="size-4" />
            Tìm tuyến mới
          </ExpressiveButton>
        </div>
      ) : (
        <StaggerGroup className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
          {activeRegistrations.map((item: RegistrationDTO) => {
            const regRoute = ctx.routes.find((route: any) => String(route.id ?? route.routeId) === String(item.routeId));
            const routeName = item.routeName || regRoute?.name || (regRoute as any)?.routeName || "Tuyến đã đăng ký";
            const routeCode = (item as RegistrationDTO & { routeCode?: string }).routeCode
              || (regRoute as any)?.routeCode
              || regRoute?.code
              || routeName.match(/^\s*(?:Tuyến\s*)?([A-Z]?\d{1,3})\b/i)?.[1]
              || "BUS";
            const activeMonthlyPass = item.hasActiveMonthlyPass ? (activeMonthlyForRoute(item.routeId, routeName, routeCode) || item) : activeMonthlyForRoute(item.routeId, routeName, routeCode);
            const monthlyExpiresOn = item.monthlyPassExpiresOn || activeMonthlyPass?.expiresOn || activeMonthlyPass?.expiresAt;
            const expanded = expandedRouteId === item.registrationId;
            const ticketStatus = activeMonthlyPass ? "Đã có vé hợp lệ" : "Cần mua vé";
            const boardingStopLabel = cleanStopLabel(item.boardingStopName);
            const alightingStopLabel = cleanStopLabel(item.alightingStopName);
            return (
              <StaggerItem key={item.registrationId} className="self-start">
                <motion.div
                  whileHover={{ y: -4, scale: 1.006 }}
                  whileTap={{ scale: 0.998 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.7 }}
                  className="flex min-h-[330px] min-w-0 flex-col overflow-hidden rounded-[24px] border border-[#E8E2D5] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow duration-300 ease-out hover:shadow-[0_16px_42px_rgba(20,20,15,0.09)]"
                >
                  <div className="flex min-h-[330px] flex-col space-y-4 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl bg-[#111111] px-3 text-sm font-semibold text-[#BDFD4F]">
                          {routeCode}
                        </span>
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#111111]">{routeName}</h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#DDEBC2] bg-[#F4FFE1] px-2.5 py-1 text-xs font-medium text-[#526D12]">
                              {registrationStatusLabel(item.status)}
                            </span>
                            <span className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium",
                              activeMonthlyPass ? "bg-[#111111] text-[#BDFD4F]" : "bg-[#FFF7E5] text-[#7A4B00]"
                            )}>
                              {ticketStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <RouteStopChip label="Từ" value={boardingStopLabel} />
                      <RouteStopChip label="Đến" value={alightingStopLabel} />
                    </div>

                    <div className="mt-auto grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeMonthlyPass) {
                            onNavigate("stu-my-ticket");
                            return;
                          }
                          localStorage.setItem("unibus.paymentRouteId", String(item.routeId));
                          onNavigate("stu-invoices");
                        }}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#111111] px-4 text-sm font-semibold text-[#BDFD4F] transition-colors hover:bg-[#24241d]"
                      >
                        {activeMonthlyPass ? <QrCode className="size-4" /> : <CreditCard className="size-4" />}
                        {activeMonthlyPass ? "Xem vé / QR" : "Chọn vé / thanh toán"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          saveRouteTrackingContext({
                            ...item,
                            routeCode,
                            routeName,
                          });
                          onNavigate("stu-tracking");
                        }}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#E8E2D5] bg-white px-4 text-sm font-medium text-[#111111] transition-colors hover:bg-[#FAF8F2]"
                      >
                        <Navigation className="size-4" />
                        Theo dõi tuyến
                      </button>
                    </div>

                    <div className="border-t border-[#EEE7DA] pt-3">
                      <button
                        type="button"
                        onClick={() => setExpandedRouteId(expanded ? null : item.registrationId)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs font-medium text-[#6B6B6B] transition-colors hover:bg-[#FAF8F2] hover:text-[#111111]"
                      >
                        {expanded ? "Thu gọn" : "Chi tiết"}
                        <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-xl border border-[#EEE7DA] bg-[#FFFEFA] px-4 py-3 text-sm">
                            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                              <RouteDetailLine label="Ngày đăng ký" value={formatDate(item.registeredAt)} />
                              <RouteDetailLine label="Trạng thái vé" value={ticketStatus} />
                              {activeMonthlyPass && <RouteDetailLine label="Hiệu lực vé" value={`Đến ${formatDate(monthlyExpiresOn)}`} />}
                            </div>
                            {activeMonthlyPass ? (
                              <p className="mt-3 rounded-lg bg-[#F7F4EC] px-3 py-2 text-xs font-medium text-[#6B6256]">
                                Không thể hủy khi vé tháng còn hiệu lực.
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetCancel(item);
                                  setCancelling(true);
                                }}
                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#8A1C16] transition-colors hover:text-[#B3261E]"
                              >
                                <Trash2 className="size-3.5" />
                                Hủy đăng ký
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
            <AlertDialogTitle>{targetMonthlyPass ? "Chưa thể hủy đăng ký" : "Hủy đăng ký tuyến?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {targetMonthlyPass
                ? `Không thể hủy khi vé tháng còn hiệu lực. Bạn có thể hủy sau ngày ${formatDate(targetMonthlyPass.expiresOn || targetMonthlyPass.expiresAt)}.`
                : `Bạn có chắc muốn hủy đăng ký tuyến ${targetCancel?.routeName || reg?.routeName || "này"}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!targetMonthlyPass && (
            <div className="space-y-2">
              <Label>Lý do hủy (không bắt buộc)</Label>
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ví dụ: đổi tuyến khác" />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>{targetMonthlyPass ? "Đã hiểu" : "Giữ lại"}</AlertDialogCancel>
            {!targetMonthlyPass && (
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  doCancel();
                }}
                disabled={working}
              >
                {working ? <RefreshCw className="size-4 animate-spin" /> : null}
                Hủy đăng ký
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}

function RouteDetailLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs">
      <span className="min-w-0 truncate text-[#8A8276]">{label}</span>
      <span className="min-w-0 text-right font-semibold text-[#111111]">{value || "Chưa xác định"}</span>
    </div>
  );
}

function RouteStopChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#EEE7DA] bg-[#FAF8F2] px-4 py-3">
      <p className="text-xs font-medium text-[#8A8276]">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[#111111]">{value}</p>
    </div>
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
          Chọn tuyến và trạm lên/xuống.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div>
          <Label className="text-xs font-bold">Tuyến xe</Label>
          <Select value={routeId} onValueChange={(v) => { setRouteId(v); setBoardingStopId(""); setAlightingStopId(""); }}>
            <SelectTrigger className="mt-1.5 min-w-0 overflow-hidden [&>span]:truncate"><SelectValue placeholder="Chọn tuyến" /></SelectTrigger>
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
  const [freshPasses, setFreshPasses] = useState<PassesDashboard | null>(null);
  const monthlyTickets = useMemo(() => freshPasses ? collectMonthlyTicketsFrom(freshPasses, ctx.activeTicket) : collectMonthlyTickets(ctx), [ctx, freshPasses]);
  const t = monthlyTickets[0] || ctx.activeTicket;
  const [expanded, setExpanded] = useState(false);
  const [singleTickets, setSingleTickets] = useState<SingleTripTicketView[]>([]);
  const [singleTicketNow, setSingleTicketNow] = useState(0);

  useEffect(() => {
    let cancelled = false;
    studentApi.tickets()
      .then((passes) => { if (!cancelled) setFreshPasses(passes); })
      .catch(() => { if (!cancelled) setFreshPasses(null); });
    setSingleTicketNow(Date.now());
    studentApi.singleTripTickets()
      .then((items) => { if (!cancelled) setSingleTickets(items); })
      .catch(() => { if (!cancelled) setSingleTickets([]); });
    return () => { cancelled = true; };
  }, []);

  const ticketStatusLabel = (status?: string | null) => {
    switch (String(status || "").toUpperCase()) {
      case "UNUSED":
      case "ACTIVE":
        return "Chưa sử dụng";
      case "USED":
        return "Đã sử dụng";
      case "EXPIRED":
        return "Hết hạn";
      case "CANCELLED":
      case "CANCELED":
        return "Đã hủy";
      default:
        return "Chưa xác định";
    }
  };

  const visibleSingleTickets = useMemo(() => singleTickets.filter((ticket) => {
    if (String(ticket.status || "").toUpperCase() !== "UNUSED") return false;
    if (!ticket.expiresAt) return true;
    const expiresAt = new Date(ticket.expiresAt).getTime();
    return Number.isFinite(expiresAt) && expiresAt > singleTicketNow;
  }), [singleTicketNow, singleTickets]);
  const stopLabel = displayStopLabel;

  const singleTicketSection = visibleSingleTickets.length > 0 ? (
    <Section title="Vé lượt" description="Vé lượt còn hiệu lực">
      <div className="grid gap-3 md:grid-cols-2">
        {visibleSingleTickets.map((ticket) => {
          const originalFare = Number(ticket.originalFareAmount ?? ticket.finalFareAmount ?? 0);
          const subsidy = Number(ticket.subsidyAmount ?? 0);
          const finalFare = Number(ticket.finalFareAmount ?? Math.max(0, originalFare - subsidy));
          return (
            <ExpressiveCard key={ticket.ticketId} variant="filled" className="flex h-full flex-col p-5 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-on-surface-variant">Vé lượt</p>
                  <h3 className="mt-1 truncate text-base font-black text-on-surface">{ticket.routeName}</h3>
                  <div className="mt-3 grid gap-2 text-xs text-on-surface-variant">
                    <p><span className="font-semibold text-on-surface">Điểm lên dự kiến:</span> {stopLabel(ticket.boardingStopName)}</p>
                    <p><span className="font-semibold text-on-surface">Điểm xuống dự kiến:</span> {stopLabel(ticket.alightingStopName)}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#14140f] px-3 py-1 text-[10px] font-bold text-[#beff50]">{ticketStatusLabel(ticket.status)}</span>
              </div>
              <div className="mt-4 flex items-center gap-4">
                {ticket.qrCode && (
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <QRCodeCanvas value={ticket.qrCode} size={96} level="H" />
                  </div>
                )}
                <div className="min-w-0 text-sm">
                  <p><span className="font-bold">Sinh viên trả:</span> {formatVND(finalFare)}</p>
                  {originalFare > 0 && <p className="text-xs text-on-surface-variant">Giá gốc: {formatVND(originalFare)}</p>}
                  {subsidy > 0 && <p className="text-xs text-on-surface-variant">Trường hỗ trợ: {formatVND(subsidy)}</p>}
                  <p className="text-xs text-on-surface-variant">Hết hạn: {ticket.expiresAt ? formatDateTime(ticket.expiresAt) : "Chưa xác định"}</p>
                </div>
              </div>
            </ExpressiveCard>
          );
        })}
      </div>
    </Section>
  ) : null;

  if (!t) {
    return (
      <PageTransition className="space-y-6 min-w-0">
        {!compact && <PageHeader title="Vé của tôi" icon={<QrCode className="size-7" />} />}
        {singleTicketSection || (
          <EmptyState
            icon={<QrCode className="size-7" />}
            title="Chưa có vé"
            description="Mua vé tháng hoặc vé lượt để sử dụng dịch vụ xe buýt."
            action={<ExpressiveButton variant="filled" onClick={() => onNavigate("stu-invoices")}>
              <CreditCard className="size-4" /> Mua vé
            </ExpressiveButton>}
          />
        )}
      </PageTransition>
    );
  }

  const route = ctx.routes.find((r) => r.id === String(t.routeId));
  const hasActiveMonthlyPass = String(t.status || "").toUpperCase() === "ACTIVE";

  return (
    <PageTransition className="space-y-6 min-w-0">
      {!compact && <PageHeader title="Vé của tôi" icon={<QrCode className="size-7" />} />}

      <ScrollReveal>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative overflow-hidden rounded-[24px] border border-[#E8E2D5] bg-white text-[#111111] shadow-[0_8px_30px_rgba(0,0,0,0.05)] min-w-0"
        >
          <div className="relative p-6 sm:p-8 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7A756B]">Vé tháng đang sử dụng</p>
                <h2 className="mt-1 truncate text-2xl font-semibold text-[#111111] sm:text-3xl">{t.routeName}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold items-center">
                    {t.routeCode || route?.code || "UNIBUS"}
                  </span>
                  <span className={cn(
                    "inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs font-medium",
                    hasActiveMonthlyPass ? "bg-[#111111] text-[#BDFD4F]" : "bg-[#FFF7E5] text-[#7A4B00]"
                  )}>
                    <span className={cn("size-1.5 rounded-full", hasActiveMonthlyPass && "animate-pulse")} style={{ backgroundColor: hasActiveMonthlyPass ? "#beff50" : "#14140f" }} />
                    {hasActiveMonthlyPass ? "Đã có vé hợp lệ" : "Chưa có vé hợp lệ"}
                  </span>
                  <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white text-xs font-bold border border-[#14140f]/10">
                    <Calendar className="size-3.5" />
                    Theo kỳ vé
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
              <div className="rounded-2xl border border-[#EEE7DA] bg-[#FAF8F2] p-3 min-w-0">
                <MapPin className="size-4 mb-1 opacity-70" />
                <p className="text-[10px] font-bold opacity-70 uppercase">Trạm lên</p>
                <p className="font-bold text-sm truncate">{stopLabel(t.boardingStopName)}</p>
              </div>
              <div className="rounded-2xl border border-[#EEE7DA] bg-[#FAF8F2] p-3 min-w-0">
                <MapPin className="size-4 mb-1 opacity-70" />
                <p className="text-[10px] font-bold opacity-70 uppercase">Trạm xuống</p>
                <p className="font-bold text-sm truncate">{stopLabel(t.alightingStopName)}</p>
              </div>
              <div className="rounded-2xl border border-[#EEE7DA] bg-[#FAF8F2] p-3 min-w-0">
                <Calendar className="size-4 mb-1 opacity-70" />
                <p className="text-[10px] font-bold opacity-70 uppercase">Hiệu lực</p>
                <p className="font-bold text-sm truncate">{formatDate(t.validFrom)}</p>
              </div>
              <div className="rounded-2xl border border-[#EEE7DA] bg-[#FAF8F2] p-3 min-w-0">
                <Clock className="size-4 mb-1 opacity-70" />
                <p className="text-[10px] font-bold opacity-70 uppercase">Hết hạn</p>
                <p className="font-bold text-sm truncate">{formatDate(t.expiresAt || t.expiresOn)}</p>
              </div>
            </div>

            {t.finalFareAmount != null && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#14140f]/15 min-w-0">
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                  <div className="bg-[#111111] text-[#BDFD4F] px-4 py-2 rounded-full text-sm font-semibold">
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
                  onClick={() => onNavigate("stu-invoices")}
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

      {monthlyTickets.length > 1 && (
        <Section title="Vé tháng" description={`${monthlyTickets.length} vé tháng đang có hiệu lực`}>
          <div className="grid gap-3 md:grid-cols-2">
            {monthlyTickets.slice(1).map((ticket: any) => (
              <ExpressiveCard key={ticket.ticketId ?? ticket.monthlyPassId ?? ticket.routeId} variant="filled" className="flex h-full flex-col p-5 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-on-surface-variant">Vé tháng</p>
                    <h3 className="mt-1 truncate text-base font-black text-on-surface">{ticket.routeName}</h3>
                    <p className="mt-1 text-xs text-on-surface-variant">Hết hạn: {formatDate(ticket.expiresAt || ticket.expiresOn)}</p>
                  </div>
                  <span className="rounded-full bg-[#14140f] px-3 py-1 text-[10px] font-black text-[#beff50]">{ticket.status || "ACTIVE"}</span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  {ticket.qrCode && (
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <QRCodeCanvas value={ticket.qrCode} size={96} level="H" />
                    </div>
                  )}
                  <div className="min-w-0 text-sm">
                    <p><span className="font-bold">Sinh viên trả:</span> {formatVND(Number(ticket.finalFareAmount ?? ticket.fareAmount ?? 0))}</p>
                    <p className="text-xs text-on-surface-variant">{stopLabel(ticket.boardingStopName)} → {stopLabel(ticket.alightingStopName)}</p>
                  </div>
                </div>
              </ExpressiveCard>
            ))}
          </div>
        </Section>
      )}

      {singleTicketSection}

      <Section title="Hướng dẫn sử dụng">
        <ExpressiveCard variant="filled" className="p-5 space-y-2 text-sm">
          <p className="flex items-start gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />Mã QR được sử dụng để kiểm tra vé khi lên xe.</p>
          <p className="flex items-start gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />Vé tháng có hiệu lực theo kỳ vé hiện tại.</p>
          <p className="flex items-start gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />Có thể đi không giới hạn số chuyến trong tuyến đã đăng ký.</p>        </ExpressiveCard>
      </Section>
    </PageTransition>
  );
}

// =============================================================================
// Screen 8: History — travel history list with stat cards
// =============================================================================
function HistoryScreen({ ctx }: { ctx: Ctx }) {
  const [query, setQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>("");
  const [detailMode, setDetailMode] = useState<"summary" | "feedback" | "lost">("summary");
  const [feedbackItems, setFeedbackItems] = useState<any[]>(ctx.feedback || []);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [lostDescription, setLostDescription] = useState("");
  const [submittingAction, setSubmittingAction] = useState<"feedback" | "lost" | null>(null);
  const totalTrips = ctx.tripsHistory.length;
  // Estimate monthly spend from active ticket fare
  const monthlyFare = ctx.activeTicket?.finalFareAmount ?? ctx.activeTicket?.originalFareAmount ?? 0;
  const thisMonthTrips = ctx.tripsHistory.filter((h: any) => {
    const d = new Date(h.boardedAt || h.serviceDate || "");
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Build month options from data (newest first)
  const monthOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const h of ctx.tripsHistory as any[]) {
      const d = new Date(h.boardedAt || h.serviceDate || "");
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!set.has(key)) {
        set.set(key, new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(d));
      }
    }
    return Array.from(set.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [ctx.tripsHistory]);

  // Filter + group trips by day (newest first)
  const groupedTrips = useMemo(() => {
    const q = normalizeStopText(query);
    const filtered = (ctx.tripsHistory as any[]).filter((h) => {
      const route = ctx.routes.find((r) => r.id === String(h.routeId));
      const hay = [
        h.routeName,
        route?.name,
        h.routeCode,
        route?.code,
        h.boardingStopName,
        h.alightingStopName,
      ]
        .filter(Boolean)
        .map((v) => normalizeStopText(String(v)))
        .join(" ");
      if (q && !hay.includes(q)) return false;
      if (selectedMonth !== "all") {
        const d = new Date(h.boardedAt || h.serviceDate || "");
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
        if (key !== selectedMonth) return false;
      }
      return true;
    });
    const groups = new Map<string, { label: string; items: any[] }>();
    for (const h of filtered) {
      const ref = h.boardedAt || h.serviceDate;
      const key = dayKeyOf(ref);
      if (!groups.has(key)) groups.set(key, { label: dayLabelOf(ref), items: [] });
      groups.get(key)!.items.push(h);
    }
    return Array.from(groups.entries())
      .map(([key, group]) => ({ key, ...group }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [ctx.tripsHistory, ctx.routes, query, selectedMonth]);

  useEffect(() => {
    let cancelled = false;
    feedbackApi.mine()
      .then((rows) => {
        if (!cancelled) setFeedbackItems(rows.map(mapFeedback));
      })
      .catch(() => {
        if (!cancelled) setFeedbackItems(ctx.feedback || []);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx.feedback]);

  const allVisibleTrips = groupedTrips.flatMap((group) => group.items);
  const selectedHistory = selectedHistoryId
    ? allVisibleTrips.find((trip: any) => String(trip.travelHistoryId ?? trip.tripId ?? trip.id) === selectedHistoryId)
    : null;
  const selectedTripId = selectedHistory ? Number(selectedHistory.tripId || selectedHistory.id || 0) : 0;
  const selectedFeedback = selectedTripId
    ? feedbackItems.find((item: any) => Number(item.tripId) === selectedTripId)
    : null;

  useEffect(() => {
    if (!selectedHistoryId) return;
    const handleStudentBack = (event: Event) => {
      event.preventDefault();
      setSelectedHistoryId("");
      setDetailMode("summary");
    };
    window.addEventListener("unibus:student-back", handleStudentBack);
    return () => window.removeEventListener("unibus:student-back", handleStudentBack);
  }, [selectedHistoryId]);

  const openTripDetail = (history: any, mode: "summary" | "feedback" | "lost" = "summary") => {
    setSelectedHistoryId(String(history.travelHistoryId ?? history.tripId ?? history.id));
    setDetailMode(mode);
  };

  const submitTripFeedback = async () => {
    if (!selectedHistory || !selectedTripId) return;
    if (selectedFeedback) {
      toast.info("Bạn đã đánh giá chuyến này");
      return;
    }
    if (!feedbackContent.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }
    setSubmittingAction("feedback");
    try {
      const created = await feedbackApi.create({
        tripId: selectedTripId,
        routeId: selectedHistory.routeId ? Number(selectedHistory.routeId) : undefined,
        rating: feedbackRating,
        category: "SERVICE_QUALITY",
        content: feedbackContent.trim(),
      });
      setFeedbackItems((items) => [mapFeedback(created), ...items]);
      setFeedbackContent("");
      setFeedbackRating(5);
      setDetailMode("summary");
      toast.success("Đã gửi đánh giá chuyến này");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi đánh giá");
    } finally {
      setSubmittingAction(null);
    }
  };

  const submitTripLostItem = async () => {
    if (!selectedTripId) return;
    if (!lostDescription.trim()) {
      toast.error("Vui lòng mô tả vật dụng mất");
      return;
    }
    setSubmittingAction("lost");
    try {
      await experienceApi.createStudentLostItem({ itemDescription: lostDescription.trim(), tripId: selectedTripId });
      setLostDescription("");
      setDetailMode("summary");
      toast.success("Đã báo mất đồ cho chuyến này");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể báo mất đồ");
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lịch sử chuyến đi"
        description="Chọn một chuyến để đánh giá hoặc báo mất đồ."
        icon={<History className="size-7" />}
      />

      {selectedHistory ? (
        <ExpressiveCard variant="elevated" className="overflow-hidden rounded-[28px] border border-[#14140f]/10 bg-white p-0 shadow-[0_18px_48px_rgba(20,20,15,0.10)]">
          <div className="flex flex-col gap-4 border-b border-[#14140f]/10 bg-[#14140f] p-5 text-white sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#BDFD4F] text-sm font-black text-[#14140f]">
                {selectedHistory.routeCode?.slice(0, 2) || "UB"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Chuyến đang chọn</p>
                <h3 className="mt-1 line-clamp-2 text-[19px] font-semibold leading-snug tracking-[-0.025em] text-white sm:text-xl">{selectedHistory.routeName || `Tuyến ${selectedHistory.routeCode || "UniBus"}`}</h3>
                <p className="mt-1 text-sm font-medium text-white/70">
                  {formatDate(selectedHistory.boardedAt || selectedHistory.serviceDate)} · {formatTimeOnly(selectedHistory.boardedAt || selectedHistory.serviceDate) || "—"}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setSelectedHistoryId("")} className="self-start rounded-full px-3 py-1.5 text-xs font-bold text-white/70 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BDFD4F]">
              Đóng
            </button>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1.15fr]">
            <div className="space-y-4 rounded-[24px] bg-[#F8F6EF] p-4">
              <div className="rounded-2xl bg-white p-4 shadow-[0_8px_20px_rgba(20,20,15,0.05)]">
                <div className="flex gap-3">
                  <div className="flex shrink-0 flex-col items-center pt-1">
                    <span className="size-3 rounded-full bg-[#BDFD4F] ring-4 ring-[#BDFD4F]/20" />
                    <span className="my-1 h-10 w-0.5 rounded-full bg-[#14140f]/10" />
                    <span className="size-3 rounded-full bg-[#ff8c5f] ring-4 ring-[#ff8c5f]/20" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#6B6B6B]">Lên xe</p>
                      <p className="mt-0.5 truncate text-sm font-black text-[#14140f]">{displayStopLabel(selectedHistory.boardingStopName, "Trạm lên")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#6B6B6B]">Xuống xe</p>
                      <p className="mt-0.5 truncate text-sm font-black text-[#14140f]">{displayStopLabel(selectedHistory.alightingStopName, "Trạm xuống")}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InfoCell label="Giờ" value={`${formatTimeOnly(selectedHistory.boardedAt || selectedHistory.serviceDate) || "—"}${selectedHistory.alightedAt ? ` → ${formatTimeOnly(selectedHistory.alightedAt)}` : ""}`} />
                <InfoCell label="Đánh giá" value={selectedFeedback ? "Đã gửi" : "Chưa gửi"} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDetailMode("feedback")}
                  disabled={Boolean(selectedFeedback)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#14140f] px-4 text-xs font-bold text-[#BDFD4F] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(20,20,15,0.18)] active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BDFD4F] focus-visible:ring-offset-2"
                >
                  <Star className="size-4" />
                  Đánh giá
                </button>
                <button
                  type="button"
                  onClick={() => setDetailMode("lost")}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-outline-variant bg-white px-4 text-xs font-bold text-on-surface transition-all duration-150 hover:-translate-y-0.5 hover:border-[#14140f]/30 hover:shadow-[0_10px_22px_rgba(20,20,15,0.08)] active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BDFD4F] focus-visible:ring-offset-2"
                >
                  <PackageSearch className="size-4" />
                  Mất đồ
                </button>
              </div>
            </div>
            <div className="rounded-[24px] border border-[#14140f]/10 bg-white p-4 shadow-[0_8px_20px_rgba(20,20,15,0.04)]">
              {detailMode === "lost" ? (
                <div className="space-y-3">
                  <Label className="text-xs font-bold">Vật dụng bị mất</Label>
                  <Textarea value={lostDescription} onChange={(event) => setLostDescription(event.target.value)} rows={4} placeholder="VD: balo đen, ví, tai nghe..." />
                  <ExpressiveButton variant="filled" className="w-full transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]" onClick={submitTripLostItem} disabled={submittingAction === "lost"}>
                    {submittingAction === "lost" ? "Đang gửi..." : "Báo mất đồ"}
                  </ExpressiveButton>
                </div>
              ) : selectedFeedback ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-on-surface">Đánh giá đã gửi</p>
                    <M3StatusPill label={selectedFeedback.status === "resolved" ? "Đã phản hồi" : "Đã gửi"} tone={selectedFeedback.status === "resolved" ? "success" : "neutral"} />
                  </div>
                  <p className="text-sm text-on-surface">{selectedFeedback.content}</p>
                  {selectedFeedback.response ? <p className="rounded-xl bg-surface-container-low px-3 py-2 text-xs text-on-surface">UniBus phản hồi: {selectedFeedback.response}</p> : null}
                </div>
              ) : detailMode === "feedback" ? (
                <div className="space-y-3">
                  <Label className="text-xs font-bold">Điểm đánh giá</Label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFeedbackRating(value)}
                        className={cn("rounded-full p-1 transition-all duration-150 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BDFD4F]", value <= feedbackRating ? "text-[#f59e0b]" : "text-outline")}
                        aria-label={`${value} sao`}
                      >
                        <Star className="size-5 fill-current" />
                      </button>
                    ))}
                  </div>
                  <Textarea value={feedbackContent} onChange={(event) => setFeedbackContent(event.target.value)} rows={4} placeholder="Chuyến đi hôm nay thế nào?" />
                  <ExpressiveButton variant="filled" className="w-full transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]" onClick={submitTripFeedback} disabled={submittingAction === "feedback"}>
                    {submittingAction === "feedback" ? "Đang gửi..." : "Gửi đánh giá"}
                  </ExpressiveButton>
                </div>
              ) : (
                <div className="grid h-full min-h-32 place-items-center text-center text-sm text-on-surface-variant">
                  Chọn đánh giá hoặc báo mất đồ cho chuyến này.
                </div>
              )}
            </div>
          </div>
        </ExpressiveCard>
      ) : null}

      {totalTrips > 0 && (
        <StaggerGroup className="grid grid-cols-1 gap-3 sm:grid-cols-3 min-w-0">
          <StaggerItem>
            <div className="rounded-[22px] border border-[#14140f]/10 bg-white p-4 min-w-0 shadow-[0_10px_24px_rgba(20,20,15,0.05)]">
              <p className="text-2xl font-black tabular-nums text-[#14140f]">{totalTrips}</p>
              <p className="mt-1 text-xs font-bold text-[#6B6B6B]">Tổng chuyến</p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="rounded-[22px] border border-[#14140f]/10 bg-white p-4 min-w-0 shadow-[0_10px_24px_rgba(20,20,15,0.05)]">
              <p className="text-2xl font-black tabular-nums text-[#144fcc]">{thisMonthTrips}</p>
              <p className="mt-1 text-xs font-bold text-[#6B6B6B]">Tháng này</p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="rounded-[22px] border border-[#14140f]/10 bg-white p-4 min-w-0 shadow-[0_10px_24px_rgba(20,20,15,0.05)]">
              <p className="truncate text-2xl font-black tabular-nums text-[#14140f]">{monthlyFare ? formatVND(monthlyFare) : "—"}</p>
              <p className="mt-1 text-xs font-bold text-[#6B6B6B]">Chi phí tháng</p>
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
        <>
          <div className="rounded-[24px] border border-[#14140f]/10 bg-white p-3 shadow-[0_10px_24px_rgba(20,20,15,0.05)] flex flex-col gap-2 sm:flex-row sm:items-center min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tuyến, trạm lên/xuống..."
                className="w-full rounded-2xl bg-[#F8F6EF] py-2.5 pl-9 pr-3 text-sm font-medium text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-[#beff50] min-w-0"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-[#F8F6EF] p-1 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedMonth("all")}
                className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedMonth === "all"
                    ? "bg-[#14140f] text-[#beff50]"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Calendar className="size-3.5" />
                Tất cả
              </button>
              {monthOptions.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedMonth(key)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    selectedMonth === key
                      ? "bg-[#14140f] text-[#beff50]"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Vertical timeline grouped by day */}
          {groupedTrips.length === 0 ? (
            <EmptyState
              icon={<Search className="size-7" />}
              title="Không tìm thấy chuyến"
              description="Thử đổi từ khóa hoặc bộ lọc tháng."
            />
          ) : (
            <div className="space-y-5 min-w-0">
              {groupedTrips.map((group) => (
                <div key={group.key} className="min-w-0 rounded-[22px] border border-[#14140f]/10 bg-white p-3">
                  <div className="mb-3 flex items-center gap-2.5 min-w-0">
                    <span className="size-2.5 shrink-0 rounded-full bg-[#BDFD4F] ring-4 ring-[#BDFD4F]/20" />
                    <h3 className="truncate text-sm font-black uppercase tracking-wide text-[#14140f]">{group.label}</h3>
                    <span className="rounded-full bg-[#F8F6EF] px-2 py-0.5 text-[10px] font-bold text-[#6B6B6B]">
                      {group.items.length} chuyến
                    </span>
                  </div>
                  <div className="relative ml-2 space-y-2.5 border-l-2 border-[#14140f]/10 pl-5 min-w-0">
                    {group.items.map((h: any) => (
                      <div key={h.travelHistoryId ?? h.tripId ?? h.id} className="relative min-w-0">
                        <span className="absolute -left-[27px] top-6 size-3 rounded-full bg-[#BDFD4F] ring-4 ring-white" />
                        <HistoryTimelineCard
                          history={h}
                          routes={ctx.routes}
                          selected={String(h.travelHistoryId ?? h.tripId ?? h.id) === selectedHistoryId}
                          onSelect={() => openTripDetail(h)}
                          onFeedback={() => openTripDetail(h, "feedback")}
                          onLostItem={() => openTripDetail(h, "lost")}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
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
      toast.error("Chọn đủ trạm lên/xuống.");
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
        description="Gợi ý tuyến xe."
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
              Chọn thông tin, nhận gợi ý tuyến.
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
          description="Nhập thông tin rồi nhấn Phân tích."
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
const CHATBOT_SUGGESTIONS: Array<{ message: string; context?: Record<string, unknown> }> = [
  {
    message: "Từ FPT Đà Nẵng đến Đại học Duy Tân 254 Nguyễn Văn Linh, ưu tiên tuyến được trợ giá",
  },
  { message: "So sánh vé lượt và vé tháng sau trợ giá" },
  { message: "Cho biết chuyến gần nhất và các trạm chính" },
  { message: "Hướng dẫn đăng ký tuyến và thanh toán SePay" },
];

function ToolGlyph({ tool, className }: { tool?: string; className?: string }) {
  if (tool?.includes("route")) return <RouteIcon className={className} />;
  if (tool?.includes("student")) return <School className={className} />;
  if (tool?.includes("llm")) return <Sparkles className={className} />;
  if (tool?.includes("fare") || tool?.includes("payment")) return <Wallet className={className} />;
  if (tool?.includes("schedule") || tool?.includes("eta")) return <Clock className={className} />;
  return <Search className={className} />;
}

function isRealLlmResponse(mode?: string) {
  return ["ZAI", "BEDROCK"].includes((mode || "").toUpperCase());
}

function ToolTracePanel({
  traceEvents,
  mode,
  providerStatus,
  streaming,
}: {
  traceEvents?: AiTraceEvent[];
  mode?: string;
  providerStatus?: AiProviderStatus;
  streaming?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const events = traceEvents || [];
  const latestEvent = [...events].reverse().find((event) => event.type === "tool.started" || event.type === "tool.completed");
  const providerDown = streaming && mode === "PROVIDER_UNAVAILABLE";

  if (!streaming || mode === "FAST_REPLY" || (!latestEvent && !providerDown)) return null;

  const done = latestEvent?.type === "tool.completed";
  const label = providerDown
    ? `Provider đang chậm${providerStatus?.errorCode ? ` (${providerStatus.errorCode})` : ""}`
    : done
      ? latestEvent?.detail || latestEvent?.label || "Đã truy xuất dữ liệu"
      : latestEvent?.detail || latestEvent?.label || "Đang truy xuất dữ liệu";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${latestEvent?.type || mode}-${latestEvent?.tool || "provider"}-${latestEvent?.detail || ""}`}
        initial={reducedMotion ? false : { opacity: 0, y: 4, filter: "blur(3px)" }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -3, filter: "blur(3px)" }}
        transition={{ duration: done ? 0.16 : 0.22, ease: "easeOut" }}
        className={cn(
          "mt-2 inline-flex max-w-full items-center gap-2 rounded-full text-xs font-medium text-on-surface-variant",
          !done && !providerDown && !reducedMotion && "ai-tool-thinking"
        )}
      >
        <span className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full",
          done ? "bg-success/10 text-success" : providerDown ? "bg-warning/15 text-warning" : "bg-[#BDFD4F]/20 text-[#4B651F]"
        )}>
          {done ? <CheckCircle2 className="size-3.5" /> : <ToolGlyph tool={latestEvent?.tool} className="size-3.5" />}
        </span>
        <span className="truncate">{label}</span>
      </motion.div>
    </AnimatePresence>
  );
}

function sanitizeAssistantCopy(text: string) {
  return text
    .replace(/\bLý do:\s*/gi, "")
    .replace(/\b(?:Đi qua đúng trạm lên và trạm xuống|Có trạm lên và trạm xuống|Có trợ giá cho sinh viên)\b[,\s]*/gi, "")
    .replace(/\bchuyến gần nhất:\s*chưa có lịch gần nhất\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}
function isLongChatBubble(text: string) {
  const safeText = sanitizeAssistantCopy(text);
  return safeText.length > 92 || safeText.includes("\n");
}
function AssistantText({ text, streaming }: { text: string; streaming?: boolean }) {
  const reducedMotion = useReducedMotion();
  if (!text) {
    return null;
  }
  const safeText = sanitizeAssistantCopy(text);
  if (reducedMotion || !streaming) {
    return <p className="whitespace-pre-wrap">{safeText}</p>;
  }
  return (
    <p className="whitespace-pre-wrap">
      {safeText.split(/(\s+)/).map((part, index) => (
        <motion.span
          key={`${part}-${index}`}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: Math.min(index * 0.008, 0.18), ease: "easeOut" }}
        >
          {part}
        </motion.span>
      ))}
    </p>
  );
}

function AssistantThinkingBubble({ traceEvents }: { traceEvents?: AiTraceEvent[] }) {
  const reducedMotion = useReducedMotion();
  const latestEvent = [...(traceEvents || [])]
    .reverse()
    .find((event) => event.type === "tool.started" || event.type === "tool.completed");
  const label = latestEvent?.detail || latestEvent?.label || "Đang chuẩn bị phản hồi";

  return (
    <div className="inline-flex w-fit max-w-full items-center gap-2.5 rounded-[22px] rounded-tl-lg border border-[#BDFD4F]/30 bg-[#fbfbf7] px-3.5 py-2.5 shadow-[0_12px_30px_rgba(20,20,15,0.06)]">
      <span className="inline-flex shrink-0 items-center gap-1" aria-label="Copilot đang suy nghĩ">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="size-2 rounded-full bg-[#14140f]/35"
            animate={reducedMotion ? { opacity: 0.65 } : { opacity: [0.3, 0.9, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.12, ease: "easeInOut" }}
          />
        ))}
      </span>
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#BDFD4F]/60 text-[#4B651F] ring-1 ring-[#BDFD4F]/80">
        <ToolGlyph tool={latestEvent?.tool} className="size-3.5" />
      </span>
      <span className="min-w-0 max-w-[180px] truncate text-sm font-semibold text-[#6f6b63]">{label}</span>
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
  const stops = route.stops || [];
  const registerAction = route.actions?.find((action) => action.type === "REGISTER_ROUTE");
  const boardingStopId = registerAction?.boardingStopId;
  const alightingStopId = registerAction?.alightingStopId;
  const monthlyFare = route.finalFare ?? route.monthlyFare;
  const departure = route.nextDepartures?.[0];
  const meaningfulReasons = (route.reasons || [])
    .map((reason) => sanitizeAssistantCopy(reason || ""))
    .filter((reason) => reason && !/phù hợp với dữ liệu tuyến hiện tại/i.test(reason))
    .slice(0, 2);
  const primaryReason = meaningfulReasons[0];
  const metrics = [
    departure ? { label: "Gần nhất", value: sanitizeAssistantCopy(departure) } : null,
    route.singleFare != null ? { label: "Vé lượt", value: formatVND(route.singleFare) } : null,
    monthlyFare != null ? { label: "Vé tháng", value: formatVND(monthlyFare) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const viewOnMap = () => {
    window.sessionStorage.setItem("unibus:assistant:route-preview", String(route.routeId));
    window.sessionStorage.setItem("unibus:assistant:route-preview-context", JSON.stringify({
      routeId: route.routeId,
      routeCode: route.routeCode,
      routeName: route.routeName,
      boardingStopId,
      alightingStopId,
    }));
    onNavigate("stu-find");
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.035, 0.1), ease: "easeOut" }}
      className="w-full max-w-[560px] rounded-[22px] border border-[#14140f]/10 bg-[#fffef9] p-3 text-on-surface shadow-[0_4px_10px_rgba(20,20,15,0.03)]"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-[#14140f] text-[#BDFD4F]">
          <Bus className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {(route.routeCode || route.routeId) && (
              <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-[#BDFD4F]/28 px-2 text-[10px] font-extrabold text-[#4B651F] ring-1 ring-[#BDFD4F]/50">
                {route.routeCode || `T-${route.routeId}`}
              </span>
            )}
            {index === 0 && (
              <span className="hidden h-5 shrink-0 items-center rounded-full bg-[#14140f]/6 px-2 text-[10px] font-bold text-on-surface-variant sm:inline-flex">
                Tốt nhất
              </span>
            )}
            <h3 className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 tracking-[-0.01em]">{route.routeName}</h3>
          </div>

          {primaryReason && (
            <p className="mt-1.5 line-clamp-1 text-xs leading-5 text-on-surface-variant">{primaryReason}</p>
          )}

          {!!metrics.length && (
            <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
              {metrics.slice(0, 4).map((metric) => (
                <div key={metric.label} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-surface px-2.5 text-xs ring-1 ring-[#14140f]/7">
                  <span className="text-[10px] font-medium text-on-surface-variant">{metric.label}</span>
                  <span className="font-bold text-on-surface">{metric.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            {route.subsidyAmount != null && route.subsidyAmount > 0 ? (
              <div className="inline-flex min-h-8 min-w-0 items-center gap-2 rounded-full bg-[#BDFD4F]/16 px-2.5 text-xs ring-1 ring-[#BDFD4F]/35">
                <span className="truncate font-medium text-[#5B6E2A]">Được trợ giá</span>
                <span className="font-bold text-on-surface">-{formatVND(route.subsidyAmount)}</span>
              </div>
            ) : <div className="inline-flex min-h-8 min-w-0 items-center gap-2 rounded-full bg-[#14140f]/5 px-2.5 text-xs ring-1 ring-[#14140f]/8"><span className="truncate font-medium text-on-surface-variant">Giá thường</span></div>}

            <button
              type="button"
              onClick={viewOnMap}
              className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#14140f] px-3 text-xs font-semibold text-[#BDFD4F] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#22221a] active:translate-y-0 active:scale-[0.98]"
            >
              Xem tuyến
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
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
  traceEvents?: AiTraceEvent[];
  providerStatus?: AiProviderStatus;
  streaming?: boolean;
  toolActive?: boolean;
};

function ChatbotScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const displayName = ctx.user.name?.split(" ").slice(-1)[0] || "bạn";
  const userInitial = (ctx.user.name || ctx.user.email || "M").trim().slice(0, 1).toUpperCase();
  const welcomeMessage = useMemo<AssistantMessage>(() => ({
      role: "bot",
      text: `Xin chào ${displayName}! Mình là UniBus Copilot. Mình có thể tra cứu tuyến, giá vé, lịch xe, trợ giá và hướng dẫn mua vé SePay.`,
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toolDismissTimers = useRef<Record<string, number>>({});
  const shouldRefocusInput = useRef(false);

  useEffect(() => () => {
    Object.values(toolDismissTimers.current).forEach((timer) => window.clearTimeout(timer));
    toolDismissTimers.current = {};
  }, []);

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

  const send = async (value = input, extraContext: Record<string, unknown> = {}) => {
    if (!value.trim() || loading || !sessionReady) return;
    const userMsg = { role: "user" as const, text: value.trim(), time: new Date().toISOString() };
    const botTime = new Date().toISOString();
    const botDraft: AssistantMessage = {
      role: "bot",
      text: "",
      time: botTime,
      traceEvents: [],
      routeSuggestions: [],
      streaming: true,
      toolActive: false,
    };
    const historySnapshot = [...messages, userMsg];
    const lastRoute = [...messages].reverse().find((message) => message.routeSuggestions?.length)?.routeSuggestions?.[0];
    setMessages((m) => [...m, userMsg, botDraft]);
    setInput("");
    setLoading(true);
    shouldRefocusInput.current = true;
    const payload = {
      message: userMsg.text,
      context: {
        preferences: ["fast", "cheap"],
        ...(lastRoute?.routeId ? { routeId: lastRoute.routeId } : {}),
        ...extraContext,
        conversationHistory: historySnapshot.slice(-8).map((message) => ({
          role: message.role === "bot" ? "assistant" as const : "user" as const,
          content: message.text,
        })),
      },
    };
    const patchBot = (patch: Partial<AssistantMessage> | ((current: AssistantMessage) => Partial<AssistantMessage>)) => {
      setMessages((current) => current.map((message) => {
        if (message.time !== botTime || message.role !== "bot") return message;
        const resolved = typeof patch === "function" ? patch(message) : patch;
        return { ...message, ...resolved };
      }));
    };
    const cancelToolDismiss = () => {
      const timer = toolDismissTimers.current[botTime];
      if (timer) window.clearTimeout(timer);
      delete toolDismissTimers.current[botTime];
    };
    const dismissToolTraceSoon = (delay = 760) => {
      cancelToolDismiss();
      toolDismissTimers.current[botTime] = window.setTimeout(() => {
        patchBot({ toolActive: false });
        delete toolDismissTimers.current[botTime];
      }, delay);
    };
    try {
      await experienceApi.streamAssistantChat(payload, (event) => {
        if (event.type === "tool.started" || event.type === "tool.completed") {
          if (event.type === "tool.started") cancelToolDismiss();
          patchBot((current) => ({
            traceEvents: [...(current.traceEvents || []), ...(event.traceEvents || [])],
            mode: event.mode || current.mode,
            providerStatus: event.providerStatus || current.providerStatus,
            toolActive: true,
          }));
          if (event.type === "tool.completed") dismissToolTraceSoon(920);
          return;
        }
        if (event.type === "answer.delta" && event.delta) {
          patchBot((current) => ({
            text: `${current.text || ""}${current.text ? " " : ""}${event.delta}`,
            mode: event.mode || current.mode,
            sources: event.sources || current.sources,
            routeSuggestions: event.routeSuggestions || current.routeSuggestions,
            providerStatus: event.providerStatus || current.providerStatus,
          }));
          return;
        }
        if (event.type === "route.cards") {
          patchBot({
            routeSuggestions: event.routeSuggestions || [],
            sources: event.sources || [],
            mode: event.mode,
            providerStatus: event.providerStatus,
          });
          return;
        }
        if (event.type === "provider_unavailable") {
          patchBot({
            mode: event.mode || "PROVIDER_UNAVAILABLE",
            providerStatus: event.providerStatus,
          });
          dismissToolTraceSoon(700);
          return;
        }
        if (event.type === "fast_reply" || event.type === "assistant.completed") {
          patchBot({
            text: event.message || undefined,
            mode: event.mode,
            sources: event.sources || [],
            routeSuggestions: event.routeSuggestions || [],
            traceEvents: event.traceEvents || undefined,
            providerStatus: event.providerStatus,
            streaming: event.type !== "assistant.completed",
            toolActive: event.type === "fast_reply" ? false : undefined,
          });
        }
      });
    } catch {
      try {
        const res = await experienceApi.sendAssistantChat(payload);
        patchBot({
          role: "bot",
          text: res.message || "Mình đã phân tích dữ liệu UniBus hiện có cho bạn.",
          time: botTime,
          mode: res.mode,
          sources: res.sources || [],
          routeSuggestions: res.routeSuggestions || [],
          traceEvents: res.traceEvents || [],
          providerStatus: res.providerStatus,
          streaming: false,
          toolActive: false,
        });
      } catch {
        patchBot({
          text: "Xin lỗi, mình không thể trả lời lúc này. Vui lòng thử lại sau.",
          streaming: false,
          toolActive: false,
        });
      }
    } finally {
      patchBot({ streaming: false });
      dismissToolTraceSoon(520);
      setLoading(false);
    }
  };

  const reset = () => {
    Object.values(toolDismissTimers.current).forEach((timer) => window.clearTimeout(timer));
    toolDismissTimers.current = {};
    setMessages([{ ...welcomeMessage, time: new Date().toISOString() }]);
    setInput("");
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
              <p className="truncate text-xs text-on-surface-variant">Smart mode · Tool trace · Tuyến xe và vé tháng</p>
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
                className={cn("flex min-w-0 gap-2 sm:gap-3", m.role === "user" ? "justify-end" : "items-start")}
              >
                {m.role === "bot" && (
                  <span className={cn(
                    "relative mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#BDFD4F] text-[#14140f]",
                    m.toolActive && (m.traceEvents?.length || 0) > 0 && "ai-agent-avatar-glow"
                  )}>
                    <Bot className="size-4" />
                    {isRealLlmResponse(m.mode) && (
                      <span
                        aria-label="Phản hồi từ UniBus Copilot"
                        className="absolute -right-0.5 -top-0.5 flex size-2.5"
                      >
                        <span className="absolute inline-flex size-full rounded-full bg-success/45 ai-model-online-ping" />
                        <span className="relative inline-flex size-2.5 rounded-full border border-surface bg-success" />
                      </span>
                    )}
                  </span>
                )}
                <div className={cn("min-w-0 break-words text-sm leading-relaxed", m.role === "bot" ? "max-w-[min(680px,82%)]" : "max-w-[92%] sm:max-w-[78%]")}>
                  <div
                    className={cn(
                      "px-4 py-3",
                      m.role === "user"
                        ? "bg-[#14140f] text-[#BDFD4F]"
                        : "border border-[#14140f]/10 bg-[#fffefb] text-on-surface",
                      isLongChatBubble(m.text)
                        ? "rounded-[28px]"
                        : "rounded-[999px]"
                    )}
                  >
                    {m.role === "bot"
                      ? m.text
                        ? <AssistantText text={m.text} streaming={m.streaming} />
                        : <AssistantThinkingBubble traceEvents={m.traceEvents} />
                      : <p className="whitespace-pre-wrap">{m.text}</p>}
                    {m.role === "bot" && m.text && (
                      <ToolTracePanel
                        traceEvents={m.traceEvents}
                        mode={m.mode}
                        providerStatus={m.providerStatus}
                        streaming={m.toolActive}
                      />
                    )}
                  </div>
                  {m.role === "bot" && !!m.routeSuggestions?.length && (
                    <div className="mt-2.5 space-y-2 pl-1">
                      <div className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/80">
                        <Sparkles className="size-3.5 text-[#84a91f]" />
                        Tuyến được đề xuất
                      </div>
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
                </div>
                {m.role === "user" && (
                  <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#14140f] text-xs font-bold text-[#BDFD4F]">
                    {userInitial}
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {messages.length <= 1 && (
          <div className="overflow-hidden border-t border-outline-variant bg-surface px-4 py-3 sm:px-5">
            <div className="grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-4">
              {CHATBOT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.message}
                  type="button"
                  onClick={() => send(suggestion.message, suggestion.context)}
                  disabled={loading || !sessionReady}
                  className="min-h-14 min-w-0 rounded-2xl border border-outline-variant bg-surface px-3 py-2.5 text-left text-[11px] font-semibold leading-snug text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50 sm:text-xs"
                >
                  <span className="block line-clamp-2 whitespace-normal">{suggestion.message}</span>
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
            ref={inputRef}
            placeholder={loading ? "Copilot đang phản hồi..." : "Hỏi về tuyến xe, điểm đến, giá vé, lịch chạy..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            readOnly={loading || !sessionReady}
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

function FinanceScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  return (
    <PageTransition className="space-y-8 min-w-0">
      <PaymentScreen ctx={ctx} onNavigate={onNavigate} />
      <InvoicesScreen ctx={ctx} />
    </PageTransition>
  );
}

// =============================================================================
// Screen 11: Payment — buy monthly pass (SePay QR)
// =============================================================================
function PaymentScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const [purchasing, setPurchasing] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationDTO[]>([]);
  const [pendingRegistration, setPendingRegistration] = useState<RegistrationDTO | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [singleBoardingStopId, setSingleBoardingStopId] = useState<string>("");
  const [singleAlightingStopId, setSingleAlightingStopId] = useState<string>("");
  const [ticketKind, setTicketKind] = useState<"MONTHLY" | "SINGLE">("MONTHLY");
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
    ticketType?: string;
  } | null>(null);
  const [paidStatus, setPaidStatus] = useState<"idle" | "checking" | "paid" | "expired">("idle");
  const [copying, setCopying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const paymentPollTokenRef = useRef(0);
  const paymentSettledRef = useRef(false);
  const [paymentRouteDetail, setPaymentRouteDetail] = useState<RouteSuggestionDTO | null>(null);
  const [paymentQuote, setPaymentQuote] = useState<PassesDashboard["monthlyPassQuote"] | null>(null);
  const [journeyPaymentContext, setJourneyPaymentContext] = useState<SePayOrderRequestDTO | null>(null);
  const [journeyQuote, setJourneyQuote] = useState<SePayQuoteDTO | null>(null);

  const journeyLegs = journeyPaymentContext?.legs || [];
  const isJourneyCombo = journeyLegs.length > 1;
  const journeyRouteLabel = journeyLegs.map((leg) => {
    const route = ctx.routes.find((item: any) => Number(item.id ?? item.routeId) === Number(leg.routeId));
    return route?.code ?? route?.routeCode ?? leg.routeId;
  }).join(" → ");
  const passes = ctx.raw.passes?.data;
  const dashboardQuote = passes?.monthlyPassQuote;
  const selectedRegistration = registrations.find((item) => String(item.routeId) === selectedRouteId)
    || (pendingRegistration && String(pendingRegistration.routeId) === selectedRouteId ? pendingRegistration : null)
    || (ctx.registration && (!selectedRouteId || String(ctx.registration.routeId) === selectedRouteId) ? ctx.registration : null);
  const selectedRoute = ctx.routes.find((route: any) => String(route.id ?? route.routeId) === selectedRouteId);
  const compactRouteLabel = (registration?: RegistrationDTO | null) => String(registration?.routeName || "Tuyến đã chọn").split(" — ")[0].trim();
  const selectableRegistrations = useMemo(() => {
    const byRoute = new Map<string, RegistrationDTO>();
    registrations.forEach((item) => {
      const key = String(item.routeId);
      if (!byRoute.has(key)) byRoute.set(key, item);
    });
    return Array.from(byRoute.values());
  }, [registrations]);
  const selectableRouteOptions = ticketKind === "SINGLE"
    ? ctx.routes.map((route: any) => ({ routeId: route.id ?? route.routeId, routeName: route.name ?? route.routeName ?? `Tuyến ${route.code ?? ""}` }))
    : selectableRegistrations;
  const selectedRouteOption = selectableRouteOptions.find((item: any) => String(item.routeId) === selectedRouteId) || selectedRegistration;
  const routeScopedDashboardQuote = dashboardQuote && String(dashboardQuote.routeId) === selectedRouteId ? dashboardQuote : null;
  const activeQuote = paymentQuote && String(paymentQuote.routeId) === selectedRouteId ? paymentQuote : routeScopedDashboardQuote;
  const singleFare = Number(paymentRouteDetail?.singleFare ?? selectedRoute?.singleFare ?? selectedRoute?.fare ?? 0);
  const routeMonthlyFare = Number(paymentRouteDetail?.monthlyFare ?? selectedRoute?.monthlyFare ?? selectedRoute?.monthlyPass ?? 0);
  const monthlyOriginal = Number(activeQuote?.originalFareAmount ?? activeQuote?.baseAmount ?? routeMonthlyFare);
  const monthlySubsidy = Number(activeQuote?.subsidyAmount ?? 0);
  const monthlyCalculatedFinal = Math.max(monthlyOriginal - monthlySubsidy, 0);
  const monthlyFinal = Number(activeQuote?.payableAmount ?? activeQuote?.finalFareAmount ?? (monthlyCalculatedFinal > 0 ? monthlyCalculatedFinal : routeMonthlyFare));
  const singleOriginal = Number(ticketKind === "SINGLE" ? activeQuote?.originalFareAmount ?? activeQuote?.baseAmount ?? singleFare : singleFare);
  const singleSubsidy = Number(ticketKind === "SINGLE" ? activeQuote?.subsidyAmount ?? 0 : 0);
  const singleCalculatedFinal = Math.max(singleOriginal - singleSubsidy, 0);
  const singleFinal = Number(ticketKind === "SINGLE" ? activeQuote?.payableAmount ?? activeQuote?.finalFareAmount ?? (singleCalculatedFinal > 0 ? singleCalculatedFinal : singleFare) : singleFare);
  const ticketLabel = ticketKind === "SINGLE" ? "Vé lượt" : "Vé tháng";
  const canBuySingle = Boolean(selectedRouteId);
  const currentOriginal = isJourneyCombo ? Number(journeyQuote?.originalAmount ?? 0) : ticketKind === "SINGLE" ? singleOriginal : monthlyOriginal;
  const currentSubsidy = isJourneyCombo ? Number(journeyQuote?.subsidyAmount ?? 0) : ticketKind === "SINGLE" ? singleSubsidy : monthlySubsidy;
  const currentFinal = isJourneyCombo ? Number(journeyQuote?.finalAmount ?? 0) : ticketKind === "SINGLE" ? singleFinal : monthlyFinal;
  const currentPriceLabel = currentFinal > 0 ? formatVND(currentFinal) : "Theo giá hệ thống";
  const hasSchoolSubsidy = currentSubsidy > 0;
  const subsidyPercent = currentOriginal > 0 && hasSchoolSubsidy ? Math.round((currentSubsidy / currentOriginal) * 100) : 0;
  const monthlyBasePrice = routeMonthlyFare > 0 ? routeMonthlyFare : monthlyOriginal;
  const singleBasePrice = singleFare > 0 ? singleFare : singleOriginal;
  const paymentRouteStops = useMemo(() => {
    const rawStops = Array.isArray((paymentRouteDetail as any)?.stops)
      ? (paymentRouteDetail as any).stops
      : Array.isArray((selectedRoute as any)?.stops)
        ? (selectedRoute as any).stops
        : [];
    const stops = rawStops
      .map((entry: any, index: number) => {
        const stopId = Number(entry?.stopId ?? entry?.id ?? entry);
        if (!Number.isFinite(stopId)) return null;
        const fallbackStop = ctx.stops.find((stop: any) => Number(stop.id ?? stop.stopId) === stopId);
        const name = entry?.stopName ?? entry?.name ?? fallbackStop?.name ?? fallbackStop?.stopName ?? `Trạm ${index + 1}`;
        const order = Number(entry?.stopOrder ?? entry?.order ?? index);
        return { id: String(stopId), stopId, name, order, direction: Number(entry?.stationDirection ?? 0) };
      })
      .filter(Boolean)
      .sort((left: any, right: any) => left.direction - right.direction || left.order - right.order) as { id: string; stopId: number; name: string; order: number; direction: number }[];
    return stops;
  }, [ctx.stops, paymentRouteDetail, selectedRoute]);
  const hasSelectableRouteStops = new Set(paymentRouteStops.map((stop) => stop.id)).size >= 2;
  const isValidStopPair = useCallback((boardingId: string, alightingId: string) => {
    return paymentRouteStops.some((boarding) => boarding.id === boardingId && paymentRouteStops.some((alighting) => (
      alighting.id === alightingId
      && alighting.direction === boarding.direction
      && alighting.order > boarding.order
    )));
  }, [paymentRouteStops]);
  const firstPublicRouteId = String(ctx.routes[0]?.id ?? ctx.routes[0]?.routeId ?? "");

  const refreshPaymentData = useCallback(async () => {
    await ctx.reload();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await ctx.reload();
  }, [ctx]);

  useEffect(() => {
    const raw = localStorage.getItem("unibus.studentPaymentContext.v1");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SePayOrderRequestDTO;
      if (!(parsed.legs?.length || 0)) return;
      setJourneyPaymentContext(parsed);
      setTicketKind(parsed.ticketPeriod === "day" ? "SINGLE" : "MONTHLY");
      setSelectedRouteId(String(parsed.legs?.[0]?.routeId || ""));
    } catch {
      localStorage.removeItem("unibus.studentPaymentContext.v1");
    }
  }, []);

  useEffect(() => {
    if (!isJourneyCombo || !journeyPaymentContext) {
      setJourneyQuote(null);
      return;
    }
    let cancelled = false;
    studentApi.quoteSePayOrder({
      ...journeyPaymentContext,
      ticketType: ticketKind,
      ticketPeriod: ticketKind === "MONTHLY" ? "month" : "day",
    }).then((quote) => {
      if (!cancelled) setJourneyQuote(quote);
    }).catch(() => {
      if (!cancelled) setJourneyQuote(null);
    });
    return () => { cancelled = true; };
  }, [isJourneyCombo, journeyPaymentContext, ticketKind]);

  useEffect(() => {
    let cancelled = false;
    studentApi.registrations()
      .then((list) => {
        if (cancelled) return;
        setRegistrations(list);
        if (!list.length) setTicketKind("SINGLE");
        const preferred = localStorage.getItem("unibus.paymentRouteId");
        const pendingRaw = localStorage.getItem("unibus.pendingPaymentRegistration");
        let pending: RegistrationDTO | null = null;
        if (pendingRaw) {
          try {
            pending = JSON.parse(pendingRaw) as RegistrationDTO;
          } catch {
            pending = null;
          }
        }
        if (pending && preferred && String(pending.routeId) === preferred && !list.some((item) => String(item.routeId) === preferred)) {
          setPendingRegistration(pending);
        } else {
          setPendingRegistration(null);
          localStorage.removeItem("unibus.pendingPaymentRegistration");
        }
        const firstRoute = preferred || list[0]?.routeId?.toString() || ctx.registration?.routeId?.toString() || firstPublicRouteId;
        setSelectedRouteId(firstRoute);
        if (!pending || !preferred || String(pending.routeId) !== preferred) {
          localStorage.removeItem("unibus.paymentRouteId");
        }
      })
      .catch(() => {
        if (cancelled) return;
        const preferred = localStorage.getItem("unibus.paymentRouteId");
        const pendingRaw = localStorage.getItem("unibus.pendingPaymentRegistration");
        if (preferred && pendingRaw) {
          try {
            const pending = JSON.parse(pendingRaw) as RegistrationDTO;
            if (String(pending.routeId) === preferred) {
              setPendingRegistration(pending);
              setSelectedRouteId(preferred);
              return;
            }
          } catch { /* ignore */ }
        }
        setSelectedRouteId(ctx.registration?.routeId ? String(ctx.registration.routeId) : firstPublicRouteId);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx.registration?.routeId, firstPublicRouteId]);

  useEffect(() => {
    let cancelled = false;
    setPaymentQuote(null);
    if (!selectedRouteId || (ticketKind === "MONTHLY" && !selectedRegistration)) return;
    studentApi.ticketQuote(selectedRouteId, ticketKind)
      .then((quote) => {
        if (!cancelled) setPaymentQuote(quote ?? null);
      })
      .catch(() => {
        if (!cancelled) setPaymentQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRouteId, selectedRegistration, ticketKind]);

  useEffect(() => {
    if (ticketKind !== "SINGLE") return;
    const contextLeg = journeyPaymentContext?.legs?.find((leg) => String(leg.routeId) === selectedRouteId);
    if (contextLeg?.boardingStopId && contextLeg?.alightingStopId) {
      setSingleBoardingStopId(String(contextLeg.boardingStopId));
      setSingleAlightingStopId(String(contextLeg.alightingStopId));
      return;
    }
    const routeStopIds = paymentRouteStops.map((stop) => stop.id);
    const registrationBoarding = selectedRegistration?.boardingStopId == null ? "" : String(selectedRegistration.boardingStopId);
    const registrationAlighting = selectedRegistration?.alightingStopId == null ? "" : String(selectedRegistration.alightingStopId);
    let nextBoarding = routeStopIds.includes(registrationBoarding) ? registrationBoarding : paymentRouteStops[0]?.id ?? registrationBoarding;
    let nextAlighting = routeStopIds.includes(registrationAlighting) ? registrationAlighting : paymentRouteStops[paymentRouteStops.length - 1]?.id ?? registrationAlighting;
    if (hasSelectableRouteStops && !isValidStopPair(nextBoarding, nextAlighting)) {
      const boarding = paymentRouteStops.find((stop) => paymentRouteStops.some((candidate) => candidate.direction === stop.direction && candidate.order > stop.order));
      const alighting = boarding && [...paymentRouteStops].reverse().find((stop) => stop.direction === boarding.direction && stop.order > boarding.order);
      nextBoarding = boarding?.id ?? "";
      nextAlighting = alighting?.id ?? "";
    }
    setSingleBoardingStopId(nextBoarding || "");
    setSingleAlightingStopId(nextAlighting || "");
  }, [hasSelectableRouteStops, isValidStopPair, journeyPaymentContext, paymentRouteStops, selectedRegistration?.boardingStopId, selectedRegistration?.alightingStopId, selectedRouteId, ticketKind]);
  useEffect(() => {
    let cancelled = false;
    setPaymentRouteDetail(null);
    if (!selectedRouteId) return;
    transportApi.route(selectedRouteId)
      .then((route) => {
        if (!cancelled) setPaymentRouteDetail(route);
      })
      .catch(() => {
        if (!cancelled) setPaymentRouteDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRouteId]);

  // Step state: 1 = review, 2 = pay, 3 = done
  const step = !sepayOrder ? 1 : paidStatus === "paid" ? 3 : 2;

  // Countdown timer
  useEffect(() => {
    if (!sepayOrder || paidStatus === "paid" || paidStatus === "expired") return;
    paymentSettledRef.current = false;
    setSecondsLeft(300); // 5 minutes
    const id = setInterval(() => {
      if (paymentSettledRef.current) return;
      setSecondsLeft((s) => {
        if (s == null) return null;
        if (s <= 1) {
          paymentSettledRef.current = true;
          setPaidStatus("expired");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [sepayOrder, paidStatus]);

  const buy = useCallback(async (kind: "MONTHLY" | "SINGLE" = ticketKind) => {
    if (!selectedRouteId) {
      toast.error("Chọn tuyến cần mua vé.");
      return;
    }
    if (kind === "SINGLE" && !canBuySingle) {
      toast.error("Chọn tuyến đã đăng ký.");
      return;
    }
    setPurchasing(true);
    try {
      const stopMetadata = kind === "SINGLE" && hasSelectableRouteStops && isValidStopPair(singleBoardingStopId, singleAlightingStopId)
        ? { boardingStopId: Number(singleBoardingStopId), alightingStopId: Number(singleAlightingStopId) }
        : undefined;
      const order = journeyPaymentContext
        ? await studentApi.createSePayOrder({
            ...journeyPaymentContext,
            ticketType: kind,
            ticketPeriod: kind === "MONTHLY" ? "month" : "day",
          })
        : await studentApi.createSePayOrder(kind, Number(selectedRouteId), stopMetadata);
      if (journeyPaymentContext) localStorage.removeItem("unibus.studentPaymentContext.v1");
      const pollToken = paymentPollTokenRef.current + 1;
      paymentPollTokenRef.current = pollToken;
      paymentSettledRef.current = false;
      setSepayOrder({ ...order, ticketType: kind });
      setPaidStatus("checking");
      toast.success(`Đã tạo QR ${kind === "SINGLE" ? "vé lượt" : "vé tháng"}. Vui lòng quét mã để thanh toán.`);
      // Poll for payment status
      const poll = async () => {
        for (let i = 0; i < 60; i++) {
          try {
            const s = await studentApi.getSePayOrderStatus(order.orderId);
            if (paymentPollTokenRef.current !== pollToken || paymentSettledRef.current) return;
            if (s.paid) {
              paymentSettledRef.current = true;
              setPaidStatus("paid");
              toast.success(`Thanh toán thành công! ${kind === "SINGLE" ? "Vé lượt" : "Vé tháng"} đã được kích hoạt.`);
              await refreshPaymentData();
              setSuccessDialogOpen(true);
              return;
            }
          } catch { /* ignore */ }
          await new Promise((r) => setTimeout(r, 5000));
        }
        if (paymentPollTokenRef.current !== pollToken || paymentSettledRef.current) return;
        paymentSettledRef.current = true;
        setPaidStatus("expired");
      };
      poll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể tạo đơn thanh toán");
    } finally {
      setPurchasing(false);
    }
  }, [canBuySingle, hasSelectableRouteStops, isValidStopPair, journeyPaymentContext, refreshPaymentData, selectedRouteId, singleAlightingStopId, singleBoardingStopId, ticketKind]);

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
    paymentPollTokenRef.current += 1;
    paymentSettledRef.current = false;
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
        title="Mua vé UniBus"
        description="Quét mã VietQR qua SePay."
        icon={<CreditCard className="size-7" />}
      />

      <div className={cn(
        "min-w-0 gap-4",
        sepayOrder
          ? "grid grid-cols-1 justify-items-center"
          : "grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.68fr)]"
      )}>
        {/* Order details */}
        {!sepayOrder && <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-6 h-full min-w-0 overflow-hidden">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TicketCheck className="size-5 text-[#111111]" />
              Đơn thanh toán
            </h3>
            {selectedRouteOption ? (
              <div className="space-y-4 text-sm">
                {isJourneyCombo ? (
                  <div className="rounded-[18px] border border-[#D8CEB8] bg-[#F7F4EC] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#6F6A60]">Hành trình liên tuyến</p>
                    <p className="mt-1 text-sm font-bold text-[#24251F]">{journeyRouteLabel}</p>
                  </div>
                ) : null}
                {selectableRouteOptions.length > 1 && !isJourneyCombo && (
                  <div>
                    <Label className="text-xs font-bold text-[#6F6A60]">Chọn tuyến cần mua vé</Label>
                    <Select value={selectedRouteId} onValueChange={(value) => { setSelectedRouteId(value); setSepayOrder(null); setPaidStatus("idle"); setSecondsLeft(null); }}>
                      <SelectTrigger className="mt-2 h-auto min-h-[64px] rounded-[18px] border border-[#E1D8C8] bg-[#FFFEFA] px-4 py-3 text-left shadow-[0_10px_26px_rgba(20,20,15,0.06)] transition-colors hover:border-[#CFC4AF] focus:ring-2 focus:ring-[#beff50]/60 [&>span]:w-full [&>span]:min-w-0">
                        {selectedRouteOption ? (
                          <div className="flex min-w-0 items-start gap-3 pr-7">
                            <span className="mt-1 size-2.5 shrink-0 rounded-full bg-[#beff50] ring-4 ring-[#14140f]" />
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="truncate text-sm font-bold leading-5 text-[#24251F]">{compactRouteLabel(selectedRouteOption)}</p>
                              <p className="truncate text-xs leading-5 text-[#7A756B]">{displayStopLabel(selectedRouteOption.boardingStopName, "Trạm lên")} → {displayStopLabel(selectedRouteOption.alightingStopName, "Trạm xuống")}</p>
                            </div>
                          </div>
                        ) : (
                          <SelectValue placeholder="Chọn tuyến" />
                        )}
                      </SelectTrigger>
                      <SelectContent className="rounded-[22px] border border-[#E1D8C8] bg-[#FFFEFA] p-2 shadow-[0_18px_46px_rgba(20,20,15,0.14)]">
                        {selectableRouteOptions.map((item: any) => {
                          const selected = String(item.routeId) === selectedRouteId;
                          return (
                            <SelectItem
                              key={item.routeId}
                              value={String(item.routeId)}
                              textValue={compactRouteLabel(item)}
                              className={cn(
                                "my-1 rounded-[18px] py-3 pl-4 pr-10 text-[#24251F] focus:bg-[#F5F0E6] data-[highlighted]:bg-[#F5F0E6] data-[state=checked]:bg-[#F1EBDD]",
                                selected && "border border-[#D8CEB8] bg-[#F1EBDD]"
                              )}
                            >
                              <div className="flex min-w-0 items-start gap-3">
                                <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", selected ? "bg-[#beff50] ring-4 ring-[#14140f]" : "bg-[#D8CEB8]")} />
                                <div className="min-w-0 max-w-[520px]">
                                  <p className="truncate text-sm font-bold leading-5 text-[#24251F]">{compactRouteLabel(item)}</p>
                                  <p className="truncate text-xs leading-5 text-[#7A756B]">{displayStopLabel(item.boardingStopName, "Trạm lên")} → {displayStopLabel(item.alightingStopName, "Trạm xuống")}</p>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[#24251F]">Chọn loại vé</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {([
                      { id: "SINGLE" as const, title: "Vé lượt", desc: "Một lượt theo tuyến và điểm dự kiến", amount: singleBasePrice },
                      { id: "MONTHLY" as const, title: "Vé tháng", desc: "Hiệu lực theo kỳ vé, không khóa theo điểm lên/xuống", amount: monthlyBasePrice },
                    ]).map((item) => {
                      const selected = ticketKind === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => { setPaymentQuote(null); setTicketKind(item.id); setSepayOrder(null); setPaidStatus("idle"); setSecondsLeft(null); }}
                          className={cn(
                            "relative rounded-[18px] border p-4 text-left transition-colors duration-200",
                            selected
                              ? "border-[#1F211B] bg-white shadow-[0_14px_34px_rgba(20,20,15,0.10)] ring-2 ring-[#beff50]/30"
                              : "border-[#E4DFD2] bg-[#FFFEFA] hover:border-[#D3CBB8] hover:bg-white",
                          )}
                        >
                          {selected ? (
                            <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-[#1F211B] text-[#beff50]">
                              <CheckCircle2 className="size-3.5" />
                            </span>
                          ) : null}
                          <p className="pr-8 text-sm font-semibold text-[#1F211B]">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-[#7A756B]">{item.desc}</p>
                          <p className={cn("mt-3 text-xl font-semibold tabular-nums", selected ? "text-[#111111]" : "text-[#34362F]")}>{item.amount ? formatVND(item.amount) : "Chưa có giá"}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Row label="Tuyến" value={compactRouteLabel(selectedRouteOption) || selectedRoute?.name || selectedRoute?.routeName || "Tuyến đã chọn"} icon={<RouteIcon className="size-4" />} />
                <Row label="Hiệu lực" value={ticketKind === "SINGLE" ? "Vé lượt trong ngày" : "Theo kỳ vé"} icon={<Calendar className="size-4" />} />

                <div className="h-px bg-[#E7E0D2] my-2" />
                <div className="space-y-2 rounded-[18px] border border-[#E7E0D2] bg-[#FFFEFA] p-4">
                  <Row label={ticketKind === "SINGLE" ? "Giá vé lượt" : "Giá niêm yết"} value={currentOriginal ? formatVND(currentOriginal) : "Chưa có giá"} muted />
                  <AnimatePresence mode="wait">
                    {hasSchoolSubsidy ? (
                      <motion.div
                        key="subsidy-on"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="rounded-[16px] border border-[#CFEA7A] bg-[#F7FFE7] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#beff50] text-[#1F211B]">
                              <GraduationCap className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#25310E]">Nhà trường hỗ trợ {subsidyPercent > 0 ? `${subsidyPercent}%` : "học phí đi lại"}</p>
                            </div>
                          </div>
                          <motion.p
                            initial={{ scale: 0.96 }}
                            animate={{ scale: [0.96, 1.03, 1] }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="shrink-0 text-base font-semibold tabular-nums text-[#315400]"
                          >
                            -{formatVND(currentSubsidy)}
                          </motion.p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="subsidy-off"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="rounded-[16px] bg-[#F7F4EC] px-3 py-2 text-xs text-[#6F6A5F]"
                      >
                        Chưa có trợ giá.
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Row label="Sinh viên trả" value={currentFinal ? formatVND(currentFinal) : "Chưa có giá"} icon={<Wallet className="size-4" />} />

                </div>

                <motion.div
                  key={`${ticketKind}-${currentFinal}-${currentSubsidy}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="relative mt-2 overflow-hidden rounded-[16px] bg-[#14140f] p-4 text-[#beff50] shadow-[0_16px_36px_rgba(20,20,15,0.16)]"
                >
                  <motion.div
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-20 bg-[#beff50]/10 blur-2xl"
                    animate={{ x: [0, 18, 0] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <p className="relative text-xs font-medium text-[#E5FF9A]">Tổng thanh toán</p>
                  <p className="relative mt-1 text-3xl font-semibold tabular-nums">
                    {currentPriceLabel}
                  </p>
                  {hasSchoolSubsidy && !sepayOrder ? (
                    <p className="relative mt-1 text-xs text-[#D8F58A]">Đã trừ {formatVND(currentSubsidy)} hỗ trợ từ nhà trường.</p>
                  ) : null}
                </motion.div>

                {step === 1 && (
                  <ExpressiveButton
                    variant="filled"
                    className="w-full mt-2"
                    onClick={() => buy(ticketKind)}
                    disabled={purchasing || !selectedRouteId || (ticketKind === "SINGLE" && !isJourneyCombo && (!canBuySingle || (hasSelectableRouteStops && !isValidStopPair(singleBoardingStopId, singleAlightingStopId))))}
                  >
                    {purchasing ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Xác nhận
                  </ExpressiveButton>
                )}
                {step === 3 && (
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <ExpressiveButton
                      variant="filled"
                      className="w-full"
                      onClick={() => {
                        localStorage.setItem("unibus.myJourneysTab", "ticket");
                        onNavigate("stu-my-journeys");
                      }}
                    >
                      Xem vé của tôi
                    </ExpressiveButton>
                    <ExpressiveButton variant="text" className="w-full" onClick={reset}>
                      Mua vé khác
                    </ExpressiveButton>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<TicketCheck className="size-7" />}
                title="Chưa đăng ký tuyến"
                description="Cần đăng ký tuyến trước."
              />
            )}
          </ExpressiveCard>
        </ScrollReveal>}

        {/* QR / status panel */}
        <ScrollReveal delay={0.1}>
          {!sepayOrder ? (
            <ExpressiveCard variant="elevated" className="relative hidden h-[680px] overflow-hidden rounded-[28px] border-[#14140f]/10 bg-[#14140f] p-6 text-[#F8F6EF] lg:block">
              <div className="absolute -right-16 -top-16 size-44 rounded-full bg-[#BDFD4F]/25 blur-2xl" />
              <div className="absolute -bottom-20 left-8 size-52 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                    <CreditCard className="size-3.5 text-[#BDFD4F]" />
                    UniBus Pay
                  </div>
                  <span className="rounded-full bg-[#BDFD4F] px-3 py-1 text-xs font-black text-[#14140f]">SePay</span>
                </div>
                <div className="space-y-4">
                  <div className="grid size-16 place-items-center rounded-[22px] bg-[#BDFD4F] text-[#14140f] shadow-[0_18px_42px_rgba(189,253,79,0.22)]">
                    <QrCode className="size-8" />
                  </div>
                  <div>
                    <p className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.04em]">Thanh toán vé bằng mã VietQR.</p>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-white/62">Chọn vé, xác nhận, quét mã.</p>
                  </div>
                </div>
                <div />
              </div>
            </ExpressiveCard>
          ) : step === 3 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
            >
              <ExpressiveCard variant="elevated" className="p-8 h-full w-full max-w-[680px] flex flex-col items-center justify-center text-center min-w-0"
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
                  {ticketLabel} đã kích hoạt. Xem trong “Vé của tôi”.
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
            <ExpressiveCard variant="elevated" className="p-6 h-full w-full max-w-[680px] min-w-0 overflow-hidden">
              {/* Header with countdown */}
              <div className="flex items-center justify-between mb-4 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <QrCode className="size-5 text-primary" />
                    Quét QR thanh toán {sepayOrder.ticketType === "SINGLE" ? "vé lượt" : "vé tháng"}
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
                  <img src={sepayOrder.qrUrl} alt="SePay QR" className="h-[240px] w-[240px] rounded-xl object-contain" />
                </motion.div>
                <div className="flex items-center gap-2 text-2xl font-black text-[#111111]">
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
                        copying ? "text-[#4D7C0F]" : "text-[#111111] hover:underline"
                      )}
                    >
                      {sepayOrder.accountNo}
                      {copying ? <CheckCircle2 className="size-3.5 text-[#4D7C0F]" /> : <Banknote className="size-3.5 text-[#6B6B6B]" />}
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
              <div className="mt-4 flex min-w-0 items-center gap-2 rounded-xl border border-[#2A2A24] bg-[#111111] p-3 text-sm text-[#BDFD4F] shadow-[0_8px_22px_rgba(17,17,17,0.12)]">
                <RefreshCw className="size-4 shrink-0 animate-spin" />
                <span className="truncate font-semibold">Đang chờ xác nhận thanh toán từ SePay...</span>
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

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-[#4D7C0F]" />
              Thanh toán thành công
            </DialogTitle>
            <DialogDescription>
              {ticketLabel} đã được kích hoạt. Vé và hóa đơn đã cập nhật.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <ExpressiveButton variant="text" onClick={() => setSuccessDialogOpen(false)}>
              Ở lại
            </ExpressiveButton>
            <ExpressiveButton
              variant="filled"
              onClick={() => {
                setSuccessDialogOpen(false);
                localStorage.setItem("unibus.myJourneysTab", "ticket");
                onNavigate("stu-my-journeys");
              }}
            >
              Xem vé của tôi
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <div className="flex items-center justify-between gap-3 min-w-0 overflow-hidden">
      <span className={cn("flex shrink-0 items-center gap-2 text-on-surface-variant", muted && "opacity-60")}>
        {icon}
        {label}
      </span>
      <span className={cn("min-w-0 truncate text-right font-bold", accentClass)}>{value}</span>
    </div>
  );
}

// =============================================================================
// Screen 12: Invoices — list of past payments
// =============================================================================
function InvoicesScreen({ ctx }: { ctx: Ctx }) {
  const [invoices, setInvoices] = useState(ctx.invoices);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setInvoices(ctx.invoices);
    setLoadingInvoices(true);
    studentApi.payments()
      .then((items) => {
        if (!cancelled) setInvoices(items.map(mapInvoice));
      })
      .catch(() => {
        if (!cancelled) setInvoices(ctx.invoices);
      })
      .finally(() => {
        if (!cancelled) setLoadingInvoices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx.invoices]);

  const visibleInvoices = invoices
    .filter((inv: any) => !(isUnpaidStatus(inv.status) || inv.status === "pending"))
    .slice()
    .sort((a: any, b: any) => {
      const left = Date.parse(a.date || "") || 0;
      const right = Date.parse(b.date || "") || 0;
      return right - left;
    });

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Hóa đơn"
        description={loadingInvoices ? "Đang cập nhật giao dịch" : `${visibleInvoices.length} giao dịch`}
        icon={<Receipt className="size-7" />}
      />
      {visibleInvoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-7" />}
          title="Chưa có hóa đơn"
          description="Các giao dịch mua vé sẽ hiển thị tại đây."
        />
      ) : (
        <div className="space-y-3 min-w-0">
          {visibleInvoices.map((inv: any) => {
            const paid = isPaidStatus(inv.status) || inv.status === "paid";
            return (
              <ExpressiveCard key={inv.id} variant="elevated" className="p-4 min-w-0">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F0E8] text-[#111111]">
                      <Receipt className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#111111]">{inv.description}</p>
                      <p className="mt-0.5 text-xs text-[#6B665C]">
                        {inv.code} • {formatDate(inv.date)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-[#111111]">{formatVND(inv.amount)}</p>
                    <span className={cn(
                      "mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                      paid ? "bg-[#ECFDF3] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"
                    )}>
                      {paid ? "Đã thanh toán" : "Có lỗi"}
                    </span>
                  </div>
                </div>
              </ExpressiveCard>
            );
          })}
        </div>
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
  const [items, setItems] = useState<any[]>(ctx.feedback || []);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await feedbackApi.mine();
      setItems(rows.map(mapFeedback));
    } catch {
      setItems(ctx.feedback || []);
    } finally {
      setLoading(false);
    }
  }, [ctx.feedback]);

  useEffect(() => { loadFeedback(); }, [loadFeedback]);

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
    setSubmitting(true);
    try {
      await feedbackApi.create({
        tripId: tripId ? Number(tripId) : undefined,
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
      await loadFeedback();
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
          description="Góp ý và phản hồi."
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
                <Label className="text-xs font-bold">Chuyến đi liên quan (tùy chọn)</Label>
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
                  <SelectTrigger className="mt-1.5 min-w-0 overflow-hidden [&>span]:truncate"><SelectValue placeholder="Chọn tuyến" /></SelectTrigger>
                  <SelectContent>
                    {ctx.routes.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Nội dung</Label>
                <Textarea className="mt-1.5" placeholder="Nhập góp ý của bạn..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
              </div>
              <ExpressiveButton variant="filled" className="w-full" onClick={submit} disabled={submitting}>
                {submitting ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
                Gửi phản hồi
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Section title={`Phản hồi đã gửi (${items.length})`} description="Trạng thái xử lý">
            {loading ? (
              <ExpressiveCard variant="filled" className="p-5 text-sm text-on-surface-variant">Đang tải phản hồi...</ExpressiveCard>
            ) : items.length === 0 ? (
              <EmptyState icon={<MessageSquare className="size-7" />} title="Chưa có phản hồi" description="Góp ý sẽ hiển thị tại đây." />
            ) : (
              <div className="space-y-3">
                {items.map((f: any) => (
                  <ExpressiveCard key={f.id} variant="filled" className="p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                      <p className="text-sm font-bold line-clamp-2">{f.content}</p>
                      <M3StatusPill label={f.status === "resolved" ? "Đã phản hồi" : f.status === "processing" ? "Đang xử lý" : "Đã gửi"} tone={f.status === "resolved" ? "success" : f.status === "processing" ? "warning" : "neutral"} />
                    </div>
                    <p className="text-xs text-on-surface-variant">{f.routeName || f.routeCode || "UniBus"} · {formatDate(f.createdAt)}</p>
                    {f.response && <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-on-surface">UniBus phản hồi: {f.response}</p>}
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
  const [items, setItems] = useState<any[]>(ctx.lostItems || []);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadLostItems = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await experienceApi.studentLostItems();
      setItems(rows.map(mapLostItem));
    } catch {
      setItems(ctx.lostItems || []);
    } finally {
      setLoading(false);
    }
  }, [ctx.lostItems]);

  useEffect(() => { loadLostItems(); }, [loadLostItems]);

  const submit = async () => {
    if (!description.trim()) {
      toast.error("Vui lòng mô tả vật dụng mất");
      return;
    }
    setSubmitting(true);
    try {
      await experienceApi.createStudentLostItem({ itemDescription: description.trim(), tripId: tripId ? Number(tripId) : undefined });
      toast.success("Đã báo mất vật dụng. Chúng tôi sẽ liên hệ khi tìm thấy.");
      setDescription("");
      setTripId("");
      await loadLostItems();
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
      {!compact && <PageHeader title="Đồ thất lạc" description="Báo mất và kết quả xử lý." icon={<PackageSearch className="size-7" />} />}

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
                      <SelectItem key={h.tripId || h.id} value={String(h.tripId || h.id)}>{(h.routeName || "Tuyến xe")} — {formatDate(h.boardedAt || h.serviceDate)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Mô tả vật dụng</Label>
                <Textarea className="mt-1.5" placeholder="VD: Balo đen, ví, ô dù, tai nghe..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>
              <ExpressiveButton variant="filled" className="w-full" onClick={submit} disabled={submitting}>
                {submitting ? <RefreshCw className="size-4 animate-spin" /> : <PackageSearch className="size-4" />}
                Gửi báo mất
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Section title={`Đã báo (${items.length})`} description="Trạng thái xử lý">
            {loading ? (
              <ExpressiveCard variant="filled" className="p-5 text-sm text-on-surface-variant">Đang tải báo mất...</ExpressiveCard>
            ) : items.length === 0 ? (
              <EmptyState icon={<PackageSearch className="size-7" />} title="Chưa báo mất" description="Báo mất sẽ hiển thị tại đây." />
            ) : (
              <div className="space-y-3">
                {items.map((l: any) => (
                  <ExpressiveCard key={l.id} variant="filled" className="p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                      <p className="text-sm font-bold truncate">{l.item || "Vật dụng thất lạc"}</p>
                      <M3StatusPill label={l.status === "returned" ? "Đã trả" : l.status === "found" ? "Đã tìm thấy" : l.status === "closed" ? "Đã đóng" : "Đã báo"} tone={l.status === "returned" ? "success" : l.status === "found" ? "primary" : l.status === "closed" ? "neutral" : "warning"} />
                    </div>
                    <p className="text-xs text-on-surface-variant">{l.routeCode || l.routeName || "Chưa xác định"} · {formatDate(l.createdAt)}</p>
                    {l.description && l.description !== l.item && <p className="text-xs mt-1 line-clamp-2">{l.description}</p>}
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
