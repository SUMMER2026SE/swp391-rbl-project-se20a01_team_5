"use client";

// =============================================================================
// Student Module — UniBus (M3 Expressive + GSAP-style motion rebuild)
// 12 role-specific screens driven by `activeId`:
//   stu-dashboard, stu-stops, stu-find, stu-tracking, stu-my-routes,
//   stu-history, stu-ai, stu-chatbot, stu-payment, stu-invoices,
//   stu-feedback, stu-lost
// Shared screens (profile, notifications, support, settings, university) are
// handled by common-screens.tsx — NOT here.
// University linkage: student = users[0] (Nguyễn Minh Anh, Duy Tân, VERIFIED,
// google). Subsidised monthly passes via calcSubsidy(monthlyPass, "uni1").
// =============================================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Bus as BusIcon,
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
} from "lucide-react";

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
import { toast } from "sonner";

// M3 Expressive primitives
import {
  ExpressiveButton,
  ExpressiveCard,
  Chip,
  SegmentedButton,
  StatusPill,
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

// Mock data + helpers
import {
  users,
  busStops,
  routes,
  buses,
  trips,
  bookings,
  invoices,
  notifications,
  feedbackList,
  lostItems,
  aiSuggestions,
  chatbotSeed,
  formatVND,
  routeById,
  stopById,
  busById,
  userById,
  universityById,
  routeUniversities,
  calcSubsidy,
  subsidyPolicies,
} from "@/lib/mock-data";
import type {
  BusStop,
  Route,
  Bus,
  Invoice,
  Feedback,
  LostItem,
  ChatMessage,
} from "@/lib/types";

// =============================================================================
// Context constants
// =============================================================================

const CURRENT_STUDENT = users[0]; // Nguyễn Minh Anh
const STUDENT_NAME = CURRENT_STUDENT.name;
const STUDENT_UNIVERSITY_ID = CURRENT_STUDENT.universityId ?? "uni1";
const STUDENT_UNIVERSITY = universityById(STUDENT_UNIVERSITY_ID);
const VERIFIED_BADGE = CURRENT_STUDENT.verificationStatus === "VERIFIED";

// Routes that serve the student's university (highlighted across the module)
const UNI_ROUTE_IDS = routeUniversities
  .filter((ru) => ru.universityId === STUDENT_UNIVERSITY_ID && ru.status === "active")
  .map((ru) => ru.routeId);

// =============================================================================
// Shared sub-components (M3 Expressive)
// =============================================================================

function RouteCodeBadge({
  route,
  className,
}: {
  route: Route;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-bold text-white elev-1",
        className
      )}
      style={{ backgroundColor: route.color }}
    >
      <BusIcon className="size-3.5" />
      {route.code}
    </span>
  );
}

function UniRouteChip() {
  if (!STUDENT_UNIVERSITY) return null;
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-semibold">
      <School className="size-3" />
      Dành cho {STUDENT_UNIVERSITY.shortName}
    </span>
  );
}

function M3StarRating({
  value,
  onChange,
  size = 24,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = (hover ?? value) >= i;
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(i)}
            onMouseEnter={() => !readOnly && setHover(i)}
            onMouseLeave={() => !readOnly && setHover(null)}
            className={cn(
              "state-layer rounded-md transition-transform",
              !readOnly && "hover:scale-110 cursor-pointer",
              readOnly && "cursor-default"
            )}
            aria-label={`${i} sao`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                filled ? "text-amber-400" : "text-on-surface-variant/30"
              )}
              fill={filled ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}

function VerticalTimeline({
  stops,
  currentIndex,
}: {
  stops: BusStop[];
  currentIndex: number;
}) {
  return (
    <ol className="relative ml-1">
      {stops.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < stops.length - 1 && (
              <span
                className={cn(
                  "absolute left-[7px] top-4 bottom-0 w-0.5 rounded-full",
                  done ? "bg-primary/60" : "bg-outline-variant"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-full ring-2 ring-surface-container-lowest",
                done && "bg-primary",
                active && "bg-primary ring-4 ring-[#beff50]/30",
                !done && !active && "bg-on-surface-variant/30"
              )}
            >
              {active && (
                <motion.span
                  className="size-1.5 rounded-full bg-white"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  done || active
                    ? "text-on-surface"
                    : "text-on-surface-variant"
                )}
              >
                {s.name}
              </p>
              <p className="text-xs text-on-surface-variant">{s.code}</p>
              {active && (
                <Badge className="mt-1 h-5 bg-primary-container text-on-primary-container hover:bg-primary-container text-[10px]">
                  Đang đến
                </Badge>
              )}
              {done && (
                <Badge className="mt-1 h-5 bg-success-container text-on-surface hover:bg-success-container text-[10px]">
                  Đã qua
                </Badge>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function MethodPill({ method }: { method: Invoice["method"] }) {
  const labels = {
    momo: "MoMo",
    vnpay: "VNPay",
    cash: "Tiền mặt",
  } as const;
  return (
    <StatusPill label={labels[method]} tone="tertiary" />
  );
}

function InvoiceStatusPill({ status }: { status: Invoice["status"] }) {
  const map = {
    paid: { label: "Đã thanh toán", tone: "success" as const },
    pending: { label: "Chờ thanh toán", tone: "warning" as const },
    refunded: { label: "Đã hoàn", tone: "neutral" as const },
  };
  const m = map[status];
  return <StatusPill label={m.label} tone={m.tone} />;
}

/** M3 map canvas — thin wrapper around the new flat BusMap component */
function M3MapCanvas({
  stops,
  route,
  busPosition,
  height = "h-80",
  showBus = true,
  className,
}: {
  stops: BusStop[];
  route?: Route;
  busPosition?: { x: number; y: number } | null;
  height?: string;
  showBus?: boolean;
  className?: string;
}) {
  // Convert the legacy {x,y} (0..100) into a 0..1 progress along stops
  // The parent already interpolates; but for the new map we derive progress
  // from nextStopIndex-like info passed via route. Simpler: re-derive from busPosition.
  const { pts } = useMapProjection(stops);
  let progress = 0.4;
  let nextStopIndex = 1;
  if (busPosition && pts.length > 1) {
    // find closest segment
    let minD = Infinity;
    let bestIdx = 0;
    let bestT = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const segLen2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((busPosition.x - a.x) * dx + (busPosition.y - a.y) * dy) / segLen2));
      const px = a.x + dx * t;
      const py = a.y + dy * t;
      const d = (busPosition.x - px) ** 2 + (busPosition.y - py) ** 2;
      if (d < minD) { minD = d; bestIdx = i; bestT = t; }
    }
    progress = (bestIdx + bestT) / (pts.length - 1);
    nextStopIndex = Math.min(bestIdx + 1, pts.length - 1);
  }
  // Map height string to px
  const heightMap: Record<string, number> = {
    "h-80": 320,
    "h-96": 384,
    "h-[420px]": 420,
    "h-[480px]": 480,
  };
  const px = heightMap[height] ?? 360;
  return (
    <BusMap
      stops={stops}
      route={route}
      progress={progress}
      nextStopIndex={nextStopIndex}
      height={px}
      showBus={showBus}
      className={className}
    />
  );
}

// Local projection helper (matches BusMap internal)
function useMapProjection(stops: BusStop[]) {
  return useMemo(() => {
    if (stops.length === 0) return { project: () => ({ x: 50, y: 50 }), pts: [] as { x: number; y: number }[] };
    const PAD = 12;
    const lats = stops.map((s) => s.lat);
    const lngs = stops.map((s) => s.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const dLat = maxLat - minLat || 1;
    const dLng = maxLng - minLng || 1;
    const project = (lat: number, lng: number) => ({
      x: PAD + ((lng - minLng) / dLng) * (100 - 2 * PAD),
      y: (100 - PAD) - ((lat - minLat) / dLat) * (100 - 2 * PAD),
    });
    const pts = stops.map((s) => project(s.lat, s.lng));
    return { project, pts };
  }, [stops]);
}
function M3MapCanvas_LEGACY_REMOVED() {
  return null;
}

// =============================================================================
// Screen 1 — stu-dashboard
// =============================================================================

function DashboardScreen({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const firstName = STUDENT_NAME.split(" ").slice(-1)[0];

  // QR expand animation state
  const [qrExpanded, setQrExpanded] = useState(false);

  const activeMonthly = bookings.filter(
    (b) =>
      b.studentId === CURRENT_STUDENT.id &&
      b.status === "active" &&
      b.type === "monthly"
  );
  const tripsThisMonth = trips.filter((t) => t.status === "completed").length + 6;

  const nextTrip = trips.find((t) => t.status === "running") ?? trips[0];
  const nextRoute = nextTrip ? routeById(nextTrip.routeId) : routes[0];
  const nextBus = nextTrip ? busById(nextTrip.busId) : buses[0];
  const nextDriver = nextTrip ? userById(nextTrip.driverId) : users[1];

  const quickActions = [
    { id: "stu-find", label: "Tìm tuyến xe", icon: RouteIcon, accent: "primary" as const },
    { id: "stu-tracking", label: "Theo dõi xe", icon: Navigation, accent: "tertiary" as const },
    { id: "stu-payment", label: "Mua vé tháng", icon: CreditCard, accent: "secondary" as const },
    { id: "stu-ai", label: "AI gợi ý", icon: Sparkles, accent: "primary" as const },
  ];

  const myRoutes = activeMonthly
    .map((b) => routeById(b.routeId))
    .filter((r): r is Route => Boolean(r));

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
          {STUDENT_UNIVERSITY && (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#beff50] text-[#14140f] text-xs font-bold shrink-0">
              <School className="size-3.5" />
              {STUDENT_UNIVERSITY.shortName}
            </span>
          )}
          {VERIFIED_BADGE && (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold shrink-0">
              <BadgeCheck className="size-3.5" />
              Đã xác thực
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#144fcc] text-white text-xs font-bold shrink-0">
            <ShieldCheck className="size-3.5" />
            {CURRENT_STUDENT.authProvider === "google" ? "Google" : "Email"}
          </span>
        </div>
      </motion.div>

      {/* Upcoming trip HERO — perk-style: bold lime card, dark text, no pale aurora */}
      {nextRoute && nextBus && (
        <ScrollReveal>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative overflow-hidden rounded-3xl p-5 sm:p-7 elev-2"
            style={{ backgroundColor: "#beff50", color: "#14140f" }}
          >
            {/* decorative dark blob */}
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" style={{ willChange: "transform" }} />
            <div className="absolute -bottom-16 -left-8 size-40 rounded-full bg-[#144fcc]/10 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center gap-5">
              {/* Left: trip info */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#14140f] text-white text-[11px] font-bold">
                    {nextRoute.code}
                  </span>
                  <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-[#14140f]/10 text-[11px] font-bold">
                    <motion.span
                      className="size-1.5 rounded-full bg-[#14140f]"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    Sắp khởi hành
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-balance leading-tight">
                  Chuyến sắp tới
                </h3>
                <p className="text-sm sm:text-base font-medium opacity-80 truncate">
                  {nextRoute.from} → {nextRoute.to}
                </p>
                <div className="flex items-center gap-3 sm:gap-4 pt-1 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase opacity-60">Khởi hành</p>
                    <p className="text-lg sm:text-xl font-bold tabular-nums">{nextTrip?.departTime}</p>
                  </div>
                  <div className="w-px h-8 bg-[#14140f]/20 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase opacity-60">Còn</p>
                    <p className="text-lg sm:text-xl font-bold tabular-nums">{nextBus.etaMin} phút</p>
                  </div>
                  <div className="w-px h-8 bg-[#14140f]/20 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase opacity-60">Biển số</p>
                    <p className="text-sm font-bold">{nextBus.plate}</p>
                  </div>
                </div>
              </div>

              {/* Right: QR visual + actions — click to expand QR overlay */}
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
                    Theo dõi chuyến
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

      {/* Stat cards — perk-style: dark cards with lime/coral/sky/purple accents */}
      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StaggerItem>
          <motion.div
            whileHover={{ y: -1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-2xl bg-[#14140f] text-white p-4 sm:p-5 elev-2 h-full"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#beff50] text-[#14140f] mb-3">
              <RouteIcon className="size-5" />
            </div>
            <p className="text-[11px] font-medium text-white/60 uppercase tracking-wide">Tuyến đã đăng ký</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">
              <Counter to={activeMonthly.length} />
            </p>
            <p className="text-[11px] text-[#beff50] font-medium mt-1">Đang hoạt động</p>
          </motion.div>
        </StaggerItem>
        <StaggerItem>
          <motion.div
            whileHover={{ y: -1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-2xl bg-[#ff8c5f] text-[#14140f] p-4 sm:p-5 elev-2 h-full"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#14140f] text-[#ff8c5f] mb-3">
              <BusIcon className="size-5" />
            </div>
            <p className="text-[11px] font-medium opacity-70 uppercase tracking-wide">Chuyến tháng này</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">
              <Counter to={tripsThisMonth} />
            </p>
            <p className="text-[11px] font-bold mt-1">+2 so với tháng trước ↑</p>
          </motion.div>
        </StaggerItem>
        <StaggerItem>
          <motion.div
            whileHover={{ y: -1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-2xl bg-[#144fcc] text-white p-4 sm:p-5 elev-2 h-full"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#beff50] text-[#14140f] mb-3">
              <CreditCard className="size-5" />
            </div>
            <p className="text-[11px] font-medium text-white/60 uppercase tracking-wide">Chi phí tháng</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">
              <Counter to={126000} format={(n) => formatVND(n)} />
            </p>
            <p className="text-[11px] text-[#beff50] font-medium mt-1">Trợ giá 30% ↓</p>
          </motion.div>
        </StaggerItem>
        <StaggerItem>
          <motion.div
            whileHover={{ y: -1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-2xl bg-[#c8a0ff] text-[#14140f] p-4 sm:p-5 elev-2 h-full"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#14140f] text-[#c8a0ff] mb-3">
              <Sparkles className="size-5" />
            </div>
            <p className="text-[11px] font-medium opacity-70 uppercase tracking-wide">Điểm tích lũy</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">
              <Counter to={320} />
            </p>
            <p className="text-[11px] font-bold mt-1">Đổi quà khi đạt 500</p>
          </motion.div>
        </StaggerItem>
      </StaggerGroup>

      {/* My routes + Quick actions */}
      <div className="grid lg:grid-cols-2 gap-6 min-w-0">
        <ScrollReveal>
          <Section title="Tuyến của tôi" description="Đang sử dụng tháng này">
            <ExpressiveCard variant="filled" className="p-2">
              {myRoutes.length === 0 ? (
                <div className="p-6 text-center text-sm text-on-surface-variant">
                  Chưa có tuyến nào. <button className="text-[#144fcc] font-bold underline" onClick={() => onNavigate("stu-find")}>Đăng ký ngay</button>
                </div>
              ) : (
                myRoutes.map((r) => (
                  <div
                    key={r.id}
                    className="state-layer flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                    onClick={() => onNavigate("stu-my-ticket")}
                  >
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: r.color, color: "#14140f" }}
                    >
                      <BusIcon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{r.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{r.from} → {r.to}</p>
                    </div>
                    <ChevronRight className="size-4 text-on-surface-variant" />
                  </div>
                ))
              )}
            </ExpressiveCard>
          </Section>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Section title="Truy cập nhanh" description="Lối tắt các tác vụ phổ biến">
            <div className="grid grid-cols-2 gap-2 sm:gap-4 items-stretch">
              {[
                { id: "stu-find", label: "Tìm tuyến xe", icon: RouteIcon, bg: "#144fcc", fg: "#fff", iconBg: "#beff50", iconFg: "#14140f" },
                { id: "stu-tracking", label: "Theo dõi xe", icon: Navigation, bg: "#ff8c5f", fg: "#14140f", iconBg: "#14140f", iconFg: "#ff8c5f" },
                { id: "stu-payment", label: "Mua vé tháng", icon: CreditCard, bg: "#14140f", fg: "#fff", iconBg: "#beff50", iconFg: "#14140f" },
                { id: "stu-ai", label: "AI gợi ý", icon: Sparkles, bg: "#c8a0ff", fg: "#14140f", iconBg: "#14140f", iconFg: "#c8a0ff" },
              ].map((qa) => (
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
              onClick={() => onNavigate("stu-notifications")}
              className="state-layer inline-flex items-center gap-1 h-8 px-3 rounded-full text-sm font-bold text-[#14140f] hover:bg-[#14140f]/8"
            >
              Xem tất cả
              <ArrowRight className="size-4" />
            </button>
          }
        >
          <ExpressiveCard variant="filled" className="p-2 max-h-72 overflow-y-auto scrollbar-soft">
            {notifications.map((n) => {
              const Icon = n.type === "success" ? CheckCircle2 : n.type === "warning" ? AlertTriangle : n.type === "danger" ? XCircle : Info;
              const iconColor =
                n.type === "success" ? "#16a34a" :
                n.type === "warning" ? "#f59e0b" :
                n.type === "danger" ? "#dc2626" : "#144fcc";
              return (
                <div key={n.id} className="state-layer flex items-start gap-3 p-3 rounded-xl">
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
                    <p className="text-[10px] text-on-surface-variant/70 mt-1">{n.createdAt}</p>
                  </div>
                </div>
              );
            })}
          </ExpressiveCard>
        </Section>
      </ScrollReveal>

      {/* QR expand overlay — framer-motion animation */}
      <AnimatePresence>
        {qrExpanded && (
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
              className="relative bg-[#14140f] text-white rounded-3xl p-5 sm:p-8 max-w-sm w-full"
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
                  <div className="grid gap-0" style={{ gridTemplateColumns: "repeat(21, 1fr)", width: "170px", height: "170px" }}>
                    {(() => {
                      const seed = (CURRENT_STUDENT.id + (nextRoute?.id ?? "")).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
                      const size = 21;
                      const cells: boolean[] = [];
                      for (let y = 0; y < size; y++) {
                        for (let x = 0; x < size; x++) {
                          const inFinder = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
                          if (inFinder(0, 0) || inFinder(size - 7, 0) || inFinder(0, size - 7)) {
                            const fx = inFinder(0, 0) ? x : inFinder(size - 7, 0) ? x - (size - 7) : x;
                            const fy = inFinder(0, 0) || inFinder(size - 7, 0) ? y : y - (size - 7);
                            const border = fx === 0 || fx === 6 || fy === 0 || fy === 6;
                            const center = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
                            cells.push(border || center);
                          } else {
                            cells.push(((seed * (x + 1) * (y + 1)) % 3) === 0);
                          }
                        }
                      }
                      return cells.map((on, i) => <div key={i} style={{ backgroundColor: on ? "#14140f" : "transparent" }} />);
                    })()}
                  </div>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Mã vé</span>
                  <span className="font-bold tabular-nums">UB-{CURRENT_STUDENT.studentId}-{nextRoute?.code}-2025</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Tuyến</span>
                  <span className="font-bold">{nextRoute?.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Hiệu lực</span>
                  <span className="font-bold text-[#beff50]">Đến 31/07/2025</span>
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

// =============================================================================
// Screen 2 — stu-stops (Trạm dừng)
// =============================================================================

function StopsScreen() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<BusStop | null>(null);

  const filtered = busStops.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase()) ||
      s.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <PageTransition className="space-y-5">
      <PageHeader
        title="Trạm dừng"
        description="Tra cứu trạm dừng trên toàn tuyến UniBus."
        icon={<MapPin className="size-6 sm:size-7" />}
      />

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#144fcc] pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm trạm theo tên, mã, địa chỉ…"
          className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-[#14140f]/15 text-sm font-semibold text-[#14140f] placeholder:text-[#14140f]/40 placeholder:font-normal focus:border-[#144fcc] focus:outline-none transition-colors"
        />
      </div>

      {/* Stats bar — 3 bold mini-cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl bg-[#14140f] text-[#beff50] p-3 sm:p-4 text-center min-w-0">
          <p className="text-xl sm:text-2xl font-bold tabular-nums">{busStops.length}</p>
          <p className="text-[10px] sm:text-xs font-bold opacity-70 uppercase">Tổng trạm</p>
        </div>
        <div className="rounded-2xl bg-[#144fcc] text-white p-3 sm:p-4 text-center min-w-0">
          <p className="text-xl sm:text-2xl font-bold tabular-nums">{routes.filter(r => r.active).length}</p>
          <p className="text-[10px] sm:text-xs font-bold opacity-70 uppercase">Tuyến</p>
        </div>
        <div className="rounded-2xl bg-[#ff8c5f] text-[#14140f] p-3 sm:p-4 text-center min-w-0">
          <p className="text-xl sm:text-2xl font-bold tabular-nums">{busStops.filter(s => s.hasShelter).length}</p>
          <p className="text-[10px] sm:text-xs font-bold opacity-70 uppercase">Mái che</p>
        </div>
      </div>

      {/* List of stops — clean list, not grid (better mobile) */}
      <div className="space-y-2 min-w-0">
        {filtered.map((s, i) => {
          const stopRoutes = s.routes
            .map((rid) => routeById(rid))
            .filter((r): r is Route => Boolean(r));
          const isUni = s.routes.some((rid) => UNI_ROUTE_IDS.includes(rid));
          const palette = ["#14140f", "#144fcc", "#ff8c5f", "#c8a0ff"];
          const accent = palette[i % palette.length];
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="state-layer w-full text-left rounded-2xl bg-white border-2 border-[#14140f]/10 hover:border-[#144fcc] p-4 transition-colors min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Number badge */}
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                  style={{ backgroundColor: accent, color: accent === "#14140f" ? "#beff50" : "#fff" }}
                >
                  {s.code.substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#14140f] truncate">{s.name}</p>
                    {s.hasShelter && (
                      <ShieldCheck className="size-3.5 text-[#16a34a] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#14140f]/50 truncate">{s.address}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex gap-1">
                    {stopRoutes.slice(0, 2).map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center h-5 px-2 rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: r.color }}
                      >
                        {r.code}
                      </span>
                    ))}
                    {stopRoutes.length > 2 && (
                      <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-[#14140f]/10 text-[#14140f] text-[9px] font-bold">
                        +{stopRoutes.length - 2}
                      </span>
                    )}
                  </div>
                  {isUni && (
                    <span className="text-[9px] font-bold text-[#ff8c5f]">Trường bạn</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={<MapPin className="size-6" />}
          title="Không tìm thấy trạm"
          description="Thử từ khoá khác."
        />
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-3xl max-w-md bg-white border-2 border-[#14140f]/10 p-0 overflow-hidden">
          {selected && (
            <>
              <div className="bg-[#14140f] px-6 pt-6 pb-5 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 size-28 rounded-full bg-[#beff50]/20 blur-2xl pointer-events-none" />
                <DialogHeader className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#beff50] text-[#14140f] shrink-0">
                      <MapPin className="size-5" />
                    </div>
                    <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#beff50] text-[#14140f] text-[11px] font-bold">
                      {selected.code}
                    </span>
                    {selected.hasShelter && (
                      <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-[#16a34a] text-white text-[11px] font-bold">
                        <ShieldCheck className="size-3" /> Mái che
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-white leading-tight min-w-0 break-words">
                    {selected.name}
                  </DialogTitle>
                  <DialogDescription className="text-white/70 text-sm min-w-0 break-words">
                    {selected.address}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-bold text-[#144fcc] uppercase tracking-wide mb-3">Lượt xe tiếp theo</p>
                  <div className="space-y-2">
                    {selected.routes.map((rid, idx) => {
                      const r = routeById(rid);
                      if (!r) return null;
                      const eta = [6, 12, 18][idx % 3];
                      const times = ["07:15", "07:30", "07:45"];
                      return (
                        <div key={rid} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#14140f]/5 border-2 border-transparent hover:border-[#144fcc] transition-colors min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: r.color }}>
                              {r.code}
                            </span>
                            <span className="text-sm text-[#14140f] truncate">{r.from} → {r.to}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-[#144fcc] tabular-nums">{times[idx % 3]}</p>
                            <p className="text-[10px] text-[#14140f]/60">cách {eta} phút</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter className="px-6 pb-6">
                <button onClick={() => setSelected(null)} className="state-layer h-10 px-5 rounded-full text-sm font-bold text-[#144fcc] hover:bg-[#144fcc]/8">Đóng</button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// =============================================================================
// Screen 3 — stu-find (Tìm tuyến xe phù hợp)
// =============================================================================

function FindRoutesScreen({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const [fromStop, setFromStop] = useState<string>("");
  const [toStop, setToStop] = useState<string>("");
  const [time, setTime] = useState<string>("");

  // Sort: routes that serve student's university come first
  const rankedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      const aUni = UNI_ROUTE_IDS.includes(a.id) ? 0 : 1;
      const bUni = UNI_ROUTE_IDS.includes(b.id) ? 0 : 1;
      return aUni - bUni;
    });
  }, []);

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Tìm tuyến xe phù hợp"
        description="Tuyến được gắn với trường của bạn được ưu tiên hiển thị đầu tiên."
        icon={<RouteIcon className="size-7" />}
      />

      {/* Search form — bold dark hero */}
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-[#14140f]">
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-[#beff50]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-6 size-32 rounded-full bg-[#ff8c5f]/15 blur-3xl pointer-events-none" />
          <div className="relative grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
            <div className="space-y-2 min-w-0">
              <Label className="text-xs font-bold text-[#beff50] uppercase tracking-wide">Từ trạm</Label>
              <Select value={fromStop} onValueChange={setFromStop}>
                <SelectTrigger className="h-12 rounded-xl bg-white border-2 border-[#beff50]/30 text-[#14140f] font-semibold">
                  <SelectValue placeholder="Chọn trạm đi" />
                </SelectTrigger>
                <SelectContent>
                  {busStops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-0">
              <Label className="text-xs font-bold text-[#beff50] uppercase tracking-wide">Đến trạm</Label>
              <Select value={toStop} onValueChange={setToStop}>
                <SelectTrigger className="h-12 rounded-xl bg-white border-2 border-[#beff50]/30 text-[#14140f] font-semibold">
                  <SelectValue placeholder="Chọn trạm đến" />
                </SelectTrigger>
                <SelectContent>
                  {busStops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-0">
              <Label className="text-xs font-bold text-[#beff50] uppercase tracking-wide">Giờ đi</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-12 rounded-xl bg-white border-2 border-[#beff50]/30 text-[#14140f] font-semibold"
              />
            </div>
            <Magnetic>
              <ExpressiveButton variant="filled" size="lg" className="w-full sm:w-auto bg-[#beff50] text-[#14140f] hover:bg-[#beff50]/90 h-12">
                <Search className="size-4" />
                Tìm tuyến
              </ExpressiveButton>
            </Magnetic>
          </div>
        </div>
      </ScrollReveal>

      {/* Results — bold color blocks (alternating dark/blue/coral) */}
      <StaggerGroup className="space-y-4">
        {rankedRoutes.map((r, idx) => {
          const isUni = UNI_ROUTE_IDS.includes(r.id);
          const stops = r.stops.map((sid) => stopById(sid)).filter((s): s is BusStop => Boolean(s));
          // Alternating bold color blocks: dark, blue, coral, dark, ...
          const palettes = [
            { bg: "#14140f", fg: "#ffffff", accent: "#beff50", chipBg: "#beff50", chipFg: "#14140f" },
            { bg: "#144fcc", fg: "#ffffff", accent: "#beff50", chipBg: "#beff50", chipFg: "#14140f" },
            { bg: "#ff8c5f", fg: "#14140f", accent: "#14140f", chipBg: "#14140f", chipFg: "#beff50" },
          ];
          const pal = palettes[idx % palettes.length];
          return (
            <StaggerItem key={r.id}>
              <div
                className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
                style={{ backgroundColor: pal.bg, color: pal.fg }}
              >
                {/* Decorative blobs */}
                {idx % 3 === 0 && (
                  <div className="absolute -top-8 -right-8 size-32 rounded-full bg-[#beff50]/15 blur-2xl pointer-events-none" />
                )}
                {idx % 3 === 1 && (
                  <div className="absolute -bottom-10 -left-6 size-32 rounded-full bg-[#beff50]/20 blur-2xl pointer-events-none" />
                )}
                {idx % 3 === 2 && (
                  <div className="absolute -top-6 -right-12 size-36 rounded-full bg-[#14140f]/15 blur-2xl pointer-events-none" />
                )}

                <div className="relative flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Bold route badge chip */}
                    <span
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-bold shrink-0"
                      style={{ backgroundColor: pal.chipBg, color: pal.chipFg }}
                    >
                      <BusIcon className="size-4" />
                      {r.code}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-bold truncate" style={{ color: pal.fg }}>{r.name}</p>
                      <p className="text-xs flex items-center gap-1.5 opacity-80 min-w-0">
                        <span className="truncate">{r.from}</span>
                        <ArrowLeftRight className="size-3 shrink-0" />
                        <span className="truncate">{r.to}</span>
                      </p>
                    </div>
                  </div>
                  {isUni && (
                    <span
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: idx % 3 === 2 ? "#ffffff" : "#ff8c5f",
                        color: idx % 3 === 2 ? "#14140f" : "#14140f",
                      }}
                    >
                      <School className="size-3.5" />
                      Dành cho {STUDENT_UNIVERSITY?.shortName}
                    </span>
                  )}
                </div>

                <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: "Thời gian", value: `${r.durationMin} phút`, icon: Clock },
                    { label: "Quãng đường", value: `${r.distanceKm} km`, icon: MapPin },
                    { label: "Tần suất", value: `${r.frequencyMin} phút`, icon: RefreshCw },
                    { label: "Giá vé", value: formatVND(r.fare), icon: TicketCheck },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl p-3 min-w-0"
                      style={{ backgroundColor: idx % 3 === 2 ? "rgba(20,20,15,0.10)" : "rgba(255,255,255,0.12)" }}
                    >
                      <m.icon className="size-4 mb-1" style={{ color: pal.accent }} />
                      <p className="text-[10px] opacity-70 truncate">{m.label}</p>
                      <p className="text-sm font-bold truncate" style={{ color: pal.fg }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Stops timeline — dark strip with bold dots */}
                <div
                  className="relative rounded-xl p-4 mb-4 min-w-0"
                  style={{ backgroundColor: idx % 3 === 2 ? "#14140f" : idx % 3 === 1 ? "#0d3a99" : "#1f1f17" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: pal.accent }}>
                    Trạm dừng
                  </p>
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-soft pb-1">
                    {stops.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-1 shrink-0">
                        <div className="flex flex-col items-center gap-1 min-w-16">
                          <span
                            className="size-3 rounded-full"
                            style={{ backgroundColor: pal.accent }}
                          />
                          <span className="text-[10px] text-white/80 text-center max-w-16 truncate">
                            {s.name}
                          </span>
                        </div>
                        {i < stops.length - 1 && (
                          <div className="h-0.5 w-6" style={{ backgroundColor: pal.accent, opacity: 0.5 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs opacity-80 min-w-0">
                    <span className="truncate">Hoạt động: {r.firstTrip} – {r.lastTrip}</span>
                    {!r.active && (
                      <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-[#f59e0b] text-[#14140f] text-[11px] font-bold shrink-0">
                        <span className="size-1.5 rounded-full bg-[#14140f]" />
                        Tạm dừng
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onNavigate("stu-tracking")}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-bold border-2 transition-all"
                      style={{ borderColor: pal.accent, color: pal.accent }}
                    >
                      <Navigation className="size-4" />
                      Theo dõi
                    </button>
                    <button
                      onClick={() => {
                        toast.success(`Đã đăng ký tuyến ${r.code}`, {
                          description: isUni
                            ? "Vé tháng có trợ giá từ Duy Tân (30%)."
                            : "Vé tháng đã được kích hoạt.",
                        });
                        onNavigate("stu-my-ticket");
                      }}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold transition-all hover:opacity-90"
                      style={{ backgroundColor: pal.accent, color: pal.bg }}
                    >
                      Đăng ký tuyến
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </PageTransition>
  );
}

// =============================================================================
// Screen 4 — stu-tracking (Theo dõi xe) — HERO
// =============================================================================

function TrackingScreen() {
  // Pick the running bus on r1
  const selectedBus = buses.find((b) => b.status === "active" && b.routeId === "r1") ?? buses[0];
  const route = selectedBus.routeId ? routeById(selectedBus.routeId) : routes[0];
  const stops = route ? route.stops.map((sid) => stopById(sid)).filter((s): s is BusStop => Boolean(s)) : [];
  const driver = selectedBus.driverId ? userById(selectedBus.driverId) : users[1];
  const assistant = selectedBus.assistantId ? userById(selectedBus.assistantId) : null;

  // Animate bus progress smoothly along the whole route (0..1)
  const [progress, setProgress] = useState(0.35);
  const [lastUpdate, setLastUpdate] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 0.98 ? 0.05 : p + 0.012));
      setLastUpdate(new Date());
    }, 900);
    return () => clearInterval(interval);
  }, []);

  // Derive current/next stop index from progress
  const segFloat = progress * Math.max(stops.length - 1, 1);
  const currentStopIndex = Math.min(Math.floor(segFloat), stops.length - 1);
  const nextStopIndex = Math.min(currentStopIndex + 1, stops.length - 1);
  const nextStop = stops[nextStopIndex];
  const occupancyPct = Math.round((selectedBus.occupancy / selectedBus.capacity) * 100);
  const occTone = occupancyPct > 80 ? "error" : occupancyPct > 60 ? "warning" : "success";
  const routeColor = route?.color ?? "var(--m3-primary)";

  const amenities = [
    { label: "Wifi", icon: Wifi, available: true },
    { label: "Máy lạnh", icon: Snowflake, available: true },
    { label: "Cổng sạc", icon: Plug, available: true },
    { label: "Nước uống", icon: Coffee, available: false },
  ];

  return (
    <PageTransition className="space-y-3 sm:space-y-4">
      {/* === Hero ETA card (compact, no overlap) — Fitts big number + Proximity === */}
      <ScrollReveal>
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 elev-1"
          style={{ backgroundColor: routeColor, color: "#14140f" }}
        >
          {/* subtle decorative blobs — GPU-friendly, willChange */}
          <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/15 blur-2xl pointer-events-none" style={{ willChange: "transform" }} />

          <div className="relative flex items-center gap-4">
            {/* Left: LIVE pulse + route/plate */}
            <div className="flex flex-col items-center justify-center shrink-0 gap-1.5">
              <div className="flex items-center gap-1.5">
                <motion.span
                  className="size-2 rounded-full bg-error"
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <span className="text-[10px] font-bold tracking-wide text-on-surface">LIVE</span>
              </div>
              <div className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-white/30 backdrop-blur text-[11px] font-bold text-on-surface">
                {route?.code}
              </div>
              <p className="text-xs font-bold opacity-90">{selectedBus.plate}</p>
            </div>

            {/* Middle: ETA big number */}
            <div className="flex-1 min-w-0 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">Đến trạm</p>
              <p className="text-xs font-medium opacity-90 truncate">{nextStop?.name ?? "Điểm đến"}</p>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <motion.span
                  key={selectedBus.etaMin}
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 340, damping: 20 }}
                  className="text-5xl sm:text-6xl font-bold leading-none tracking-tight tabular-nums"
                >
                  {selectedBus.etaMin}
                </motion.span>
                <span className="text-sm font-semibold opacity-70">phút</span>
              </div>
            </div>

            {/* Right: speed + progress */}
            <div className="flex flex-col items-center justify-center shrink-0 gap-1.5">
              <div className="flex items-center gap-1 text-xs font-medium text-on-surface">
                <Gauge className="size-3.5" />
                <span className="font-bold">{selectedBus.speed}</span>
                <span className="opacity-60 text-[10px]">km/h</span>
              </div>
              <div className="text-[10px] font-medium opacity-70">Trạm {currentStopIndex + 1}/{stops.length}</div>
              {/* Goal-Gradient: circular progress ring */}
              <div className="relative size-12">
                <svg className="size-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(20,20,15,0.15)" strokeWidth="3" />
                  <motion.circle
                    cx="18" cy="18" r="15" fill="none" stroke="#14140f" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="94.2"
                    initial={{ strokeDashoffset: 94.2 }}
                    animate={{ strokeDashoffset: 94.2 - (progress * 94.2) }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-on-surface">
                  {Math.round(progress * 100)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </ScrollReveal>

      {/* === Real map (Grab-style — prominent, no overlap) === */}
      <ScrollReveal delay={0.05}>
        <div className="relative">
          <RealMap
            stops={stops}
            route={route}
            progress={progress}
            nextStopIndex={nextStopIndex}
            height={typeof window !== "undefined" && window.innerWidth < 640 ? 340 : 420}
          />
          {/* Last-update badge floating on map */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/95 elev-1 text-[10px] font-medium text-gray-600 backdrop-blur">
            <motion.span
              className="size-1.5 rounded-full bg-success"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            {lastUpdate.toLocaleTimeString("vi-VN")}
          </div>
        </div>
      </ScrollReveal>

      {/* === Bus + crew info — Law of Common Region (one card, chunked grid) === */}
      <ScrollReveal delay={0.1}>
        <ExpressiveCard variant="filled" className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <InfoCell label="Tài xế" value={driver?.name ?? "—"} icon={<BusIcon className="size-3.5" />} />
            <InfoCell label="Phụ xe" value={assistant?.name ?? "—"} icon={<Users className="size-3.5" />} />
            <InfoCell label="Tốc độ" value={`${selectedBus.speed} km/h`} icon={<Gauge className="size-3.5" />} />
            <InfoCell label="Hành khách" value={`${selectedBus.occupancy}/${selectedBus.capacity}`} icon={<Users className="size-3.5" />} />
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* === Occupancy + amenities — two regions side by side on desktop === */}
      <ScrollReveal delay={0.15}>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          <ExpressiveCard variant="filled" className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-on-surface-variant uppercase mb-3">Mức độ đầy</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-on-surface-variant">Đang chở</span>
                  <span className={cn(
                    "font-bold",
                    occTone === "error" && "text-error",
                    occTone === "warning" && "text-warning",
                    occTone === "success" && "text-success"
                  )}>{occupancyPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      occTone === "error" && "bg-error",
                      occTone === "warning" && "bg-warning",
                      occTone === "success" && "bg-success"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancyPct}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
                <p className={cn(
                  "text-[11px] mt-2 font-medium",
                  occTone === "error" && "text-error",
                  occTone === "warning" && "text-warning",
                  occTone === "success" && "text-success"
                )}>
                  {occupancyPct > 80 ? "Xe khá đông" : occupancyPct > 60 ? "Còn vài chỗ" : "Còn nhiều chỗ"}
                </p>
              </div>
            </div>
          </ExpressiveCard>
          <ExpressiveCard variant="filled" className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-on-surface-variant uppercase mb-3">Tiện ích</p>
            <div className="grid grid-cols-4 gap-2">
              {amenities.map((a) => (
                <div
                  key={a.label}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2.5 rounded-xl min-h-14 justify-center",
                    a.available ? "bg-success-container text-on-surface" : "bg-surface-container-highest text-on-surface-variant/40"
                  )}
                >
                  <a.icon className="size-4" />
                  <span className="text-[10px] font-medium">{a.label}</span>
                </div>
              ))}
            </div>
          </ExpressiveCard>
        </div>
      </ScrollReveal>

      {/* === Route stops timeline (collapsible-ish, clean) === */}
      <ScrollReveal delay={0.2}>
        <ExpressiveCard variant="filled" className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-on-surface">Lộ trình chuyến đi</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{route?.from} → {route?.to} · {route?.distanceKm} km · {route?.durationMin} phút</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-on-surface-variant uppercase">Còn</p>
              <p className="text-sm font-bold text-primary">{stops.length - currentStopIndex - 1} trạm</p>
            </div>
          </div>
          <VerticalTimeline stops={stops} currentIndex={currentStopIndex} />
        </ExpressiveCard>
      </ScrollReveal>

      {/* === Actions — Serial Position (last = memorable), Fitts (big touch targets) === */}
      <ScrollReveal delay={0.25}>
        <div className="grid grid-cols-2 gap-3">
          <ExpressiveButton variant="tonal" size="lg" className="h-14">
            <PhoneCall className="size-5" />
            Gọi tài xế
          </ExpressiveButton>
          <ExpressiveButton variant="filled" size="lg" className="h-14">
            <Navigation className="size-5" />
            Chỉ đường ra trạm
          </ExpressiveButton>
        </div>
      </ScrollReveal>
    </PageTransition>
  );
}

/* Small info cell for the crew/grid — Law of Common Region */
function InfoCell({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-container-high p-3 min-h-16 flex flex-col justify-center">
      <p className="text-[10px] text-on-surface-variant uppercase flex items-center gap-1">{icon}{label}</p>
      <p className="text-sm font-semibold text-on-surface truncate mt-0.5">{value}</p>
    </div>
  );
}

// =============================================================================
// Screen 5 — stu-my-routes (Tuyến đã đăng ký)
// =============================================================================

function MyRoutesScreen({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const [tab, setTab] = useState<"active" | "history">("active");
  const [cancelTarget, setCancelTarget] = useState<Route | null>(null);
  const [changeTarget, setChangeTarget] = useState<Route | null>(null);
  const [changeTo, setChangeTo] = useState<string>("");

  const activeMonthly = bookings.filter(
    (b) => b.studentId === CURRENT_STUDENT.id && b.status === "active" && b.type === "monthly"
  );
  const historyBookings = bookings.filter(
    (b) => b.studentId === CURRENT_STUDENT.id && (b.status !== "active" || b.type === "single")
  );

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Tuyến của tôi"
        description="Quản lý vé tháng và lịch sử đăng ký tuyến."
        icon={<TicketCheck className="size-7" />}
        actions={
          <ExpressiveButton variant="tonal" size="sm" onClick={() => onNavigate("stu-find")}>
            <Plus className="size-4" />
            Đăng ký tuyến mới
          </ExpressiveButton>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "history")}>
        <TabsList className="rounded-full bg-surface-container-low border border-outline-variant">
          <TabsTrigger value="active" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">
            Đang hoạt động ({activeMonthly.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeMonthly.length === 0 ? (
            <EmptyState
              icon={<TicketCheck className="size-7" />}
              title="Chưa có vé tháng"
              description="Đăng ký vé tháng để di chuyển không giới hạn trong 30 ngày."
              action={
                <ExpressiveButton variant="filled" onClick={() => onNavigate("stu-find")}>
                  <Plus className="size-4" />
                  Đăng ký tuyến
                </ExpressiveButton>
              }
            />
          ) : (
            <StaggerGroup className="space-y-4">
              {activeMonthly.map((b) => {
                const r = routeById(b.routeId);
                if (!r) return null;
                const isUni = UNI_ROUTE_IDS.includes(r.id);
                const subsidy = calcSubsidy(r.monthlyPass, STUDENT_UNIVERSITY_ID);
                const daysLeft = 18; // mock
                const pct = Math.round((daysLeft / 30) * 100);
                return (
                  <StaggerItem key={b.id}>
                    <ExpressiveCard variant="elevated" className="overflow-hidden p-0">
                      {/* Gradient header */}
                      <div
                        className="p-6 text-white relative"
                        style={{
                          background: `linear-gradient(135deg, ${r.color}, ${r.color}cc 60%, ${r.color}88)`,
                        }}
                      >
                        <div className="absolute inset-0 grid-texture opacity-20" />
                        <div className="relative flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <BusIcon className="size-4" />
                              <span className="text-sm font-bold">{r.code}</span>
                            </div>
                            <h3 className="text-xl font-bold">{r.name}</h3>
                            <p className="text-sm opacity-90 mt-0.5">{r.from} → {r.to}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs opacity-80">Còn</p>
                            <p className="text-3xl font-bold">{daysLeft}</p>
                            <p className="text-xs opacity-80">ngày</p>
                          </div>
                        </div>
                      </div>
                      {/* Body */}
                      <div className="p-5 sm:p-6 space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-on-surface-variant">Hiệu lực vé tháng</span>
                            <span className="font-semibold text-on-surface">{daysLeft}/30 ngày</span>
                          </div>
                          <M3Progress value={pct} />
                        </div>

                        {isUni && subsidy.subsidy > 0 && (
                          <div className="flex items-start gap-3 rounded-xl bg-success-container p-3">
                            <School className="size-5 text-on-surface shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <p className="font-semibold text-on-surface">
                                Trợ giá từ {STUDENT_UNIVERSITY?.shortName} ({subsidy.policy?.type === "percent" ? `${subsidy.policy.value}%` : formatVND(subsidy.policy?.value ?? 0)})
                              </p>
                              <p className="text-on-surface-variant mt-0.5">
                                Bạn đã tiết kiệm {formatVND(subsidy.subsidy)} mỗi tháng.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <p className="text-[10px] text-on-surface-variant">Mã vé</p>
                            <p className="text-sm font-semibold text-on-surface">{b.id.toUpperCase()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-on-surface-variant">Loại vé</p>
                            <p className="text-sm font-semibold text-on-surface">Vé tháng</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-on-surface-variant">Đăng ký</p>
                            <p className="text-sm font-semibold text-on-surface">{b.createdAt}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-on-surface-variant">Trạng thái</p>
                            <StatusPill label="Đang dùng" tone="success" />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-outline-variant">
                          <ExpressiveButton
                            variant="outlined"
                            size="sm"
                            onClick={() => {
                              setChangeTarget(r);
                              setChangeTo("");
                            }}
                          >
                            <RefreshCw className="size-4" />
                            Đổi tuyến
                          </ExpressiveButton>
                          <ExpressiveButton
                            variant="error"
                            size="sm"
                            onClick={() => setCancelTarget(r)}
                          >
                            <Trash2 className="size-4" />
                            Hủy tuyến
                          </ExpressiveButton>
                        </div>
                      </div>
                    </ExpressiveCard>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3 mt-4">
          {historyBookings.length === 0 ? (
            <EmptyState
              icon={<History className="size-7" />}
              title="Chưa có lịch sử"
              description="Lịch sử đăng ký và sử dụng vé sẽ hiển thị tại đây."
            />
          ) : (
            <ExpressiveCard variant="filled" className="p-2">
              {historyBookings.map((b) => {
                const r = routeById(b.routeId);
                return (
                  <div key={b.id} className="state-layer flex items-center gap-3 p-3 rounded-xl">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: r?.color ?? "var(--m3-primary)" }}
                    >
                      <BusIcon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{r?.name ?? "—"}</p>
                      <p className="text-xs text-on-surface-variant">{b.date} · {b.type === "monthly" ? "Vé tháng" : "Vé lượt"} · {formatVND(b.fare)}</p>
                    </div>
                    <StatusPill
                      label={b.status === "completed" ? "Hoàn thành" : b.status === "cancelled" ? "Đã hủy" : "Hoạt động"}
                      tone={b.status === "completed" ? "success" : b.status === "cancelled" ? "error" : "primary"}
                    />
                  </div>
                );
              })}
            </ExpressiveCard>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy vé tháng tuyến {cancelTarget?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Vé tháng sẽ bị vô hiệu hoá ngay lập tức. Bạn có thể nhận hoàn tiền tương ứng số ngày còn lại (trừ phí xử lý 5.000đ). Hành động không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Giữ vé</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-error text-on-error hover:bg-error"
              onClick={() => {
                toast.success(`Đã hủy vé tháng tuyến ${cancelTarget?.code}`, {
                  description: "Hoàn tiền sẽ được chuyển trong 3-5 ngày làm việc.",
                });
                setCancelTarget(null);
              }}
            >
              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change route dialog */}
      <Dialog open={!!changeTarget} onOpenChange={(o) => !o && setChangeTarget(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi sang tuyến khác</DialogTitle>
            <DialogDescription>
              Vé tháng hiện tại của tuyến {changeTarget?.code} sẽ được chuyển sang tuyến mới. Số ngày còn lại được giữ nguyên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-on-surface-variant">Chọn tuyến mới</Label>
            <Select value={changeTo} onValueChange={setChangeTo}>
              <SelectTrigger className="h-12 rounded-xl bg-surface-container-low border-2 border-outline-variant">
                <SelectValue placeholder="Chọn tuyến muốn đổi sang" />
              </SelectTrigger>
              <SelectContent>
                {routes.filter((r) => r.id !== changeTarget?.id && r.active).map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {changeTo && (() => {
              const r = routeById(changeTo)!;
              return (
                <div className="rounded-xl bg-surface-container-low p-3 text-xs">
                  <p className="font-semibold text-on-surface">{r.name}</p>
                  <p className="text-on-surface-variant mt-0.5">{r.from} → {r.to}</p>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setChangeTarget(null)}>Hủy</ExpressiveButton>
            <ExpressiveButton
              variant="filled"
              disabled={!changeTo}
              onClick={() => {
                toast.success("Đổi tuyến thành công", {
                  description: `Vé tháng đã chuyển sang ${routeById(changeTo)?.code}.`,
                });
                setChangeTarget(null);
              }}
            >
              <RefreshCw className="size-4" />
              Xác nhận đổi
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// =============================================================================
// Screen 5b — stu-my-ticket (Vé của tôi — QR vé)
// =============================================================================

function MyTicketScreen({ onNavigate }: { onNavigate: (id: string) => void }) {
  const activeMonthly = bookings.find((b) => b.studentId === CURRENT_STUDENT.id && b.status === "active" && b.type === "monthly");
  const route = activeMonthly ? routeById(activeMonthly.routeId) : routes[0];
  const [ticketType, setTicketType] = useState<"monthly" | "single">("monthly");
  const [refreshKey, setRefreshKey] = useState(0);

  // Generate a fake QR pattern (deterministic from student ID + route)
  const qrPattern = React.useMemo(() => {
    const seed = (CURRENT_STUDENT.id + (route?.id ?? "")).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const size = 21;
    const cells: boolean[][] = [];
    for (let y = 0; y < size; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < size; x++) {
        // Finder patterns (corners)
        const inFinder = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
        if (inFinder(0, 0) || inFinder(size - 7, 0) || inFinder(0, size - 7)) {
          const fx = inFinder(0, 0) ? x : inFinder(size - 7, 0) ? x - (size - 7) : x;
          const fy = inFinder(0, 0) || inFinder(size - 7, 0) ? y : y - (size - 7);
          const border = fx === 0 || fx === 6 || fy === 0 || fy === 6;
          const center = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
          row.push(border || center);
        } else {
          row.push(((seed * (x + 1) * (y + 1)) % 3) === 0);
        }
      }
      cells.push(row);
    }
    return cells;
  }, [route?.id]);

  const ticketId = `UB-${CURRENT_STUDENT.studentId ?? "SE20A01"}-${route?.code ?? "DN-01"}-${new Date().getFullYear()}`;
  const validUntil = "31/07/2025";

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Vé của tôi"
        description="Quét mã QR tại trạm để lên xe."
        icon={<QrCode className="size-6 sm:size-7" />}
      />

      {/* Ticket type toggle */}
      <div className="inline-flex rounded-full bg-surface-container-high p-1 border border-outline-variant/40">
        {(["monthly", "single"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTicketType(t)}
            className={cn(
              "relative h-9 px-5 rounded-full text-sm font-bold transition-colors",
              ticketType === t ? "text-[#beff50]" : "text-on-surface-variant"
            )}
          >
            {ticketType === t && (
              <motion.div
                layoutId="ticket-tab"
                className="absolute inset-0 rounded-full bg-[#14140f]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{t === "monthly" ? "Vé tháng" : "Vé lượt"}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* QR ticket card — bold dark */}
        <ScrollReveal>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative overflow-hidden rounded-3xl bg-[#14140f] text-white p-6 sm:p-8 min-w-0"
          >
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#beff50]/10 blur-3xl pointer-events-none" />

            {/* Ticket header */}
            <div className="relative flex items-center justify-between mb-6 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#beff50] text-[#14140f] shrink-0">
                  <BusIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">UniBus</p>
                  <p className="text-[10px] text-white/60 truncate">{ticketType === "monthly" ? "Vé tháng" : "Vé lượt"}</p>
                </div>
              </div>
              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#beff50] text-[#14140f] text-[10px] font-bold shrink-0">
                {route?.code}
              </span>
            </div>

            {/* QR code — generated pattern */}
            <div className="relative flex justify-center mb-6">
              <div className="bg-white rounded-2xl p-4 sm:p-6">
                <div
                  key={refreshKey}
                  className="grid gap-0"
                  style={{ gridTemplateColumns: `repeat(21, 1fr)`, width: "200px", height: "200px" }}
                >
                  {qrPattern.flat().map((on, i) => (
                    <div key={i} style={{ backgroundColor: on ? "#14140f" : "transparent" }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Ticket info */}
            <div className="relative space-y-3">
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-white/60">Mã vé</span>
                <span className="font-bold tabular-nums truncate ml-2">{ticketId}</span>
              </div>
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-white/60">Sinh viên</span>
                <span className="font-bold truncate ml-2">{CURRENT_STUDENT.name}</span>
              </div>
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-white/60">MSSV</span>
                <span className="font-bold tabular-nums">{CURRENT_STUDENT.studentId}</span>
              </div>
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-white/60">Tuyến</span>
                <span className="font-bold truncate ml-2">{route?.name}</span>
              </div>
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-white/60">Hiệu lực</span>
                <span className="font-bold text-[#beff50]">Đến {validUntil}</span>
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="state-layer relative w-full mt-6 h-10 rounded-full bg-white/10 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw className="size-4" />
              Làm mới mã
            </button>
          </motion.div>
        </ScrollReveal>

        {/* Side info */}
        <div className="space-y-4 min-w-0">
          {/* Status card — bold lime */}
          <ScrollReveal delay={0.05}>
            <div className="rounded-2xl bg-[#beff50] text-[#14140f] p-5 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="size-5" />
                <p className="text-sm font-bold">Vé đang hoạt động</p>
              </div>
              <p className="text-xs font-medium opacity-70">
                {ticketType === "monthly"
                  ? `Vé tháng ${route?.code} còn hiệu lực đến ${validUntil}. Đưa mã QR cho phụ xe quét khi lên xe.`
                  : "Vé lượt còn 3 lượt chưa sử dụng. Đưa mã QR cho phụ xe khi lên xe."}
              </p>
            </div>
          </ScrollReveal>

          {/* How to use — steps */}
          <ScrollReveal delay={0.1}>
            <div className="rounded-2xl bg-surface-container-low border border-outline-variant/40 p-5 min-w-0">
              <p className="text-sm font-bold text-on-surface mb-4">Cách sử dụng vé</p>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Mở màn hình này khi lên xe", icon: QrCode },
                  { step: "2", text: "Đưa mã QR cho phụ xe quét", icon: ScanLine },
                  { step: "3", text: "Chờ xác nhận — lên xe!", icon: CheckCircle2 },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#14140f] text-[#beff50] text-xs font-bold shrink-0">
                      {s.step}
                    </div>
                    <s.icon className="size-4 text-on-surface-variant shrink-0" />
                    <p className="text-sm text-on-surface truncate">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Quick actions */}
          <ScrollReveal delay={0.15}>
            <div className="grid grid-cols-2 gap-3 min-w-0">
              <button
                onClick={() => onNavigate("stu-payment")}
                className="state-layer rounded-2xl bg-[#144fcc] text-white p-4 text-left min-w-0"
              >
                <CreditCard className="size-5 mb-2" />
                <p className="text-sm font-bold truncate">Mua thêm vé</p>
              </button>
              <button
                onClick={() => onNavigate("stu-history")}
                className="state-layer rounded-2xl bg-[#ff8c5f] text-[#14140f] p-4 text-left min-w-0"
              >
                <History className="size-5 mb-2" />
                <p className="text-sm font-bold truncate">Lịch sử chuyến</p>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </PageTransition>
  );
}

// =============================================================================
// Screen 6 — stu-history (Lịch sử chuyến)
// =============================================================================

function HistoryScreen() {
  const [routeFilter, setRouteFilter] = useState<string>("all");

  const studentTrips = trips.filter((t) => t.status === "completed");
  const totalTrips = studentTrips.length + 8;
  const totalSpent = studentTrips.reduce((sum, t) => sum + t.revenue, 0) + 95000;
  const thisMonth = studentTrips.length;

  const filteredTrips = routeFilter === "all"
    ? studentTrips
    : studentTrips.filter((t) => t.routeId === routeFilter);

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Lịch sử chuyến"
        description="Tổng hợp các chuyến đi đã hoàn thành."
        icon={<History className="size-7" />}
      />

      <StaggerGroup className="grid sm:grid-cols-3 gap-4">
        <StaggerItem>
          <StatCard
            label="Tổng số chuyến"
            value={<Counter to={totalTrips} />}
            icon={<BusIcon className="size-6" />}
            hint="Từ 08/2024"
            trend="up"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tổng chi tiêu"
            value={<Counter to={totalSpent} format={(n) => formatVND(n)} />}
            icon={<Wallet className="size-6" />}
            hint="Tất cả tuyến"
            trend="up"
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tháng này"
            value={<Counter to={thisMonth} />}
            icon={<Calendar className="size-6" />}
            hint="Chuyến hoàn thành"
            trend="flat"
            accent="secondary"
          />
        </StaggerItem>
      </StaggerGroup>

      <ScrollReveal>
        <Section
          title="Chi tiết chuyến"
          actions={
            <div className="flex items-center gap-2">
              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger className="h-9 w-40 rounded-full bg-white border-2 border-[#14140f] text-xs font-semibold text-[#14140f]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tuyến</SelectItem>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ExpressiveButton variant="outlined" size="sm" onClick={() => toast.success("Đã xuất CSV", { description: "File lich-su-chuyen.csv đã sẵn sàng." })} className="border-[#144fcc] text-[#144fcc] hover:bg-[#144fcc]/10">
                <Download className="size-4" />
                <span className="hidden sm:inline">Xuất file</span>
              </ExpressiveButton>
            </div>
          }
        >
          <div className="rounded-2xl overflow-hidden border-2 border-[#14140f]/10 bg-white min-w-0">
            <div className="max-h-[460px] overflow-y-auto scrollbar-soft">
              <Table>
                {/* Dark header row */}
                <TableHeader className="sticky top-0 bg-[#14140f] z-10">
                  <TableRow className="border-[#14140f] hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-[#beff50] uppercase tracking-wide">Ngày</TableHead>
                    <TableHead className="text-xs font-bold text-[#beff50] uppercase tracking-wide">Tuyến</TableHead>
                    <TableHead className="text-xs font-bold text-[#beff50] uppercase tracking-wide hidden sm:table-cell">Giờ</TableHead>
                    <TableHead className="text-xs font-bold text-[#beff50] uppercase tracking-wide text-right">Giá vé</TableHead>
                    <TableHead className="text-xs font-bold text-[#beff50] uppercase tracking-wide text-right">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-[#14140f]/60 py-12">
                        Không có chuyến nào phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrips.map((t, idx) => {
                      const r = routeById(t.routeId);
                      // Alternating row tints — white / very-light-blue
                      const rowBg = idx % 2 === 0 ? "bg-white" : "bg-[#144fcc]/5";
                      return (
                        <TableRow key={t.id} className={`border-[#14140f]/10 ${rowBg} hover:bg-[#beff50]/20`}>
                          <TableCell className="text-xs font-semibold text-[#14140f] tabular-nums">{t.date}</TableCell>
                          <TableCell className="min-w-0">
                            {r && <RouteCodeBadge route={r} />}
                          </TableCell>
                          <TableCell className="text-xs text-[#14140f]/70 hidden sm:table-cell tabular-nums">
                            {t.departTime} – {t.arriveTime}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-[#144fcc] text-right tabular-nums">{formatVND(t.revenue)}</TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-[#16a34a] text-white text-[11px] font-bold">
                              <CheckCircle2 className="size-3" />
                              Hoàn thành
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Section>
      </ScrollReveal>
    </PageTransition>
  );
}

// =============================================================================
// Screen 7 — stu-ai (AI gợi ý tuyến)
// =============================================================================

function AIScreen({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const [freeTime, setFreeTime] = useState("07:00");
  const [destination, setDestination] = useState("");
  const [prefs, setPrefs] = useState<string[]>(["fast", "cheap"]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<typeof aiSuggestions | null>(null);

  const togglePref = (p: string) =>
    setPrefs((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const analyze = () => {
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      setResults([...aiSuggestions].sort((a, b) => b.confidence - a.confidence));
      setLoading(false);
    }, 1600);
  };

  const prefOptions = [
    { id: "fast", label: "Nhanh nhất" },
    { id: "cheap", label: "Rẻ nhất" },
    { id: "comfort", label: "Tiện nghi" },
    { id: "fewer-stops", label: "Ít trạm" },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="AI gợi ý tuyến"
        description="Để AI đề xuất tuyến xe phù hợp nhất."
        icon={<Sparkles className="size-6 sm:size-7" />}
      />

      {/* Hero — bold purple card */}
      <ScrollReveal>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
          style={{ backgroundColor: "#c8a0ff", color: "#14140f" }}
        >
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-8 size-40 rounded-full bg-[#beff50]/20 blur-3xl pointer-events-none" />

          <div className="relative space-y-4">
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
              Dựa trên lịch học, vị trí và sở thích — UniBus AI đề xuất 3 tuyến tối ưu.
            </p>
          </div>

          <div className="relative mt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold opacity-70 uppercase tracking-wide">Giờ rảnh</Label>
                <Input
                  type="time"
                  value={freeTime}
                  onChange={(e) => setFreeTime(e.target.value)}
                  className="h-12 rounded-xl bg-white border-2 border-[#14140f]/20 text-[#14140f] font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold opacity-70 uppercase tracking-wide">Điểm đến</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-2 border-[#14140f]/20 text-[#14140f] font-bold">
                    <SelectValue placeholder="Chọn điểm đến" />
                  </SelectTrigger>
                  <SelectContent>
                    {busStops.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold opacity-70 uppercase tracking-wide">Sở thích</Label>
              <div className="flex flex-wrap gap-2">
                {prefOptions.map((p) => {
                  const selected = prefs.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePref(p.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold border-2 transition-all",
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-44" />
          ))}
        </div>
      )}

      {/* Results — bold ranked cards */}
      {results && !loading && (
        <StaggerGroup className="space-y-4">
          <p className="text-sm font-medium text-on-surface-variant">
            Tìm thấy <span className="font-bold text-[#14140f]">{results.length}</span> tuyến phù hợp:
          </p>
          {results.map((s, idx) => {
            const r = routes.find((rt) => rt.code === s.routeCode);
            const isUni = r ? UNI_ROUTE_IDS.includes(r.id) : false;
            const rankColors = [
              { bg: "#14140f", fg: "#beff50", label: "#1 TỐT NHẤT" },
              { bg: "#144fcc", fg: "#fff", label: "#2 PHÙ HỢP" },
              { bg: "#ff8c5f", fg: "#14140f", label: "#3 THAM KHẢO" },
            ];
            const rank = rankColors[idx] ?? { bg: "#14140f", fg: "#beff50", label: `#${idx + 1}` };
            return (
              <StaggerItem key={s.id}>
                <motion.div
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="rounded-2xl p-5 sm:p-6 elev-2 min-w-0"
                  style={{ backgroundColor: rank.bg, color: rank.fg }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex items-center h-7 px-3 rounded-full bg-white/20 text-xs font-bold shrink-0">
                        {rank.label}
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-bold truncate">{s.routeName}</p>
                        <p className="text-xs opacity-70">{s.departTime} → {s.eta}</p>
                      </div>
                    </div>
                    {isUni && (
                      <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#beff50] text-[#14140f] text-[10px] font-bold shrink-0">
                        TRƯỜNG BẠN
                      </span>
                    )}
                  </div>

                  <p className="text-sm opacity-80 bg-white/10 rounded-xl p-3 mb-4">
                    {s.reason}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="opacity-70">Độ tin cậy</span>
                        <span className="font-bold">{s.confidence}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: rank.fg }}
                          initial={{ width: 0 }}
                          animate={{ width: `${s.confidence}%` }}
                          transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 mb-1.5">Điểm phù hợp</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn("size-4", star <= s.matchScore ? "fill-current" : "opacity-25")}
                          />
                        ))}
                        <span className="ml-2 text-xs font-bold">{s.matchScore}/5</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/15">
                    <p className="text-sm">
                      <span className="opacity-70">Giá vé: </span>
                      <span className="font-bold text-lg">{formatVND(s.fare)}</span>
                    </p>
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      onClick={() => {
                        toast.success(`Đã đăng ký tuyến ${s.routeCode}`);
                        onNavigate("stu-my-ticket");
                      }}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#beff50] text-[#14140f] text-sm font-bold"
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
// Screen 8 — stu-chatbot (Chatbot tra cứu)
// =============================================================================

type ChatMsg = ChatMessage & { id: string };

function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMsg[]>(
    chatbotSeed.map((m, i) => ({ ...m, id: `seed-${i}` }))
  );
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const messageSeq = useRef(chatbotSeed.length);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const quickReplies = [
    "Tìm tuyến đi FPT",
    "Giá vé DN-02?",
    "Tôi quên đồ trên xe",
    "Lịch chạy DN-01",
  ];

  const botReply = (text: string): string => {
    const t = text.toLowerCase();
    if (t.includes("fpt")) return "Tuyến DN-01 (KTX — FPT) và DN-02 (An Sương — FPT) đều đi qua cổng chính ĐH FPT. DN-01 chạy mỗi 15 phút, DN-02 mỗi 20 phút.";
    if (t.includes("giá") || t.includes("vé")) return "Giá vé lượt: DN-01 5.000đ, DN-02 7.000đ, DN-03 6.000đ. Vé tháng từ 180.000đ — sinh viên Duy Tân được trợ giá 30%.";
    if (t.includes("su-02") || t.includes("su 02")) return "Tuyến DN-02 (An Sương — FPT): khoảng cách 14.2km, 45 phút, tần suất 20 phút. Giờ chạy 05:30 – 20:00.";
    if (t.includes("quên") || t.includes("mất đồ")) return "Bạn vào mục \"Báo mất đồ\" để gửi thông tin. UniBus sẽ thông báo ngay khi phụ xe tìm thấy đồ. Mọi đồ tìm được được giữ tại trụ sở 7 ngày.";
    if (t.includes("chào") || t.includes("hi") || t.includes("hello")) return "Xin chào! Mình có thể giúp bạn tìm tuyến, xem giá vé, kiểm tra giờ chạy và hướng dẫn báo mất đồ.";
    if (t.includes("lịch") || t.includes("giờ chạy")) return "DN-01: 06:00 – 20:30 · DN-02: 05:30 – 20:00 · DN-03: 05:00 – 21:00. Bạn có thể xem chi tiết ở mục Theo dõi xe.";
    return "Mình chưa hiểu câu hỏi của bạn. Thử nhấn vào các gợi ý bên dưới hoặc hỏi về: tuyến xe, giá vé, giờ chạy, mất đồ.";
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMsg = { id: `u-${messageSeq.current++}`, role: "user", text: trimmed, time: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const botMsg: ChatMsg = {
        id: `b-${messageSeq.current++}`,
        role: "bot",
        text: botReply(trimmed),
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 900);
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Chatbot tra cứu"
        description="Hỏi đáp nhanh về tuyến xe, giá vé, giờ chạy và hỗ trợ."
        icon={<Bot className="size-7" />}
      />

      <ExpressiveCard variant="filled" className="p-0 overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 p-4 bg-primary-container text-on-primary-container">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-on-primary">
            <Bot className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">UniBus Bot</p>
            <p className="text-xs opacity-80 flex items-center gap-1">
              <span className="size-2 rounded-full bg-success" /> Trực tuyến
            </p>
          </div>
          <StatusPill label="AI" tone="primary" />
        </div>

        {/* Messages */}
        <div
          className="p-4 space-y-3 overflow-y-auto scrollbar-soft bg-surface-container-lowest"
          style={{ height: "60vh" }}
        >
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className={cn(
                "flex items-end gap-2",
                m.role === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  m.role === "bot"
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-primary text-on-primary"
                )}
              >
                {m.role === "bot" ? <Bot className="size-4" /> : CURRENT_STUDENT.avatar}
              </div>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5",
                  m.role === "bot"
                    ? "bg-secondary-container text-on-secondary-container rounded-bl-md"
                    : "bg-primary text-on-primary rounded-br-md"
                )}
              >
                <p className="text-sm">{m.text}</p>
                <p className={cn(
                  "text-[10px] mt-1",
                  m.role === "bot" ? "text-on-secondary-container/70" : "text-on-primary/70"
                )}>
                  {m.time}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex items-end gap-2"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                  <Bot className="size-4" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-secondary-container text-on-secondary-container px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-2 rounded-full bg-on-secondary-container"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={endRef} />
        </div>

        {/* Quick replies */}
        <div className="px-4 pt-3 flex flex-wrap gap-2 border-t border-outline-variant bg-surface-container-lowest">
          {quickReplies.map((q) => (
            <Chip key={q} variant="suggestion" onClick={() => send(q)}>
              {q}
            </Chip>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 flex items-center gap-2 bg-surface-container-lowest">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Nhập câu hỏi của bạn…"
            className="flex-1 h-12 px-4 rounded-full bg-surface-container-low border-2 border-outline-variant text-sm text-on-surface placeholder:text-on-surface-variant focus:border-[#14140f] focus:outline-none"
          />
          <ExpressiveButton
            variant="filled"
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim()}
            aria-label="Gửi"
          >
            <Send className="size-5" />
          </ExpressiveButton>
        </div>
      </ExpressiveCard>
    </PageTransition>
  );
}

// =============================================================================
// Screen 9 — stu-payment (Thanh toán & vé) — WITH SUBSIDY
// =============================================================================

function PaymentScreen() {
  const [tab, setTab] = useState<"single" | "monthly">("monthly");
  const [routeId, setRouteId] = useState<string>("r1");
  const [quantity, setQuantity] = useState(1);
  const [month, setMonth] = useState<string>("07/2025");
  const [method, setMethod] = useState<"momo" | "vnpay" | "cash">("momo");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [transactionCode, setTransactionCode] = useState("TXN-10240000");
  const transactionSeq = useRef(10240001);

  const route = routeById(routeId);
  const isUni = route ? UNI_ROUTE_IDS.includes(route.id) : false;

  const unitPrice = tab === "single" ? (route?.fare ?? 0) : (route?.monthlyPass ?? 0);
  const subsidy = tab === "monthly"
    ? calcSubsidy(route?.monthlyPass ?? 0, STUDENT_UNIVERSITY_ID)
    : { original: unitPrice, subsidy: 0, final: unitPrice };

  const totalOriginal = unitPrice * (tab === "single" ? quantity : 1);
  const totalSubsidy = subsidy.subsidy * (tab === "single" ? quantity : 1);
  const totalFinal = totalOriginal - totalSubsidy;

  const methods = [
    { id: "momo" as const, label: "MoMo", desc: "Ví điện tử", icon: Wallet, bg: "#ff8c5f", fg: "#14140f" },
    { id: "vnpay" as const, label: "VNPay QR", desc: "Quét mã QR", icon: QrCode, bg: "#144fcc", fg: "#fff" },
    { id: "cash" as const, label: "Tiền mặt", desc: "Tại trạm", icon: Banknote, bg: "#14140f", fg: "#beff50" },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Thanh toán & vé"
        description="Mua vé lượt hoặc đăng ký vé tháng với trợ giá từ trường."
        icon={<CreditCard className="size-6 sm:size-7" />}
      />

      {/* Subsidy hero — bold coral */}
      <ScrollReveal>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
          style={{ backgroundColor: "#ff8c5f", color: "#14140f" }}
        >
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-8 size-40 rounded-full bg-[#beff50]/20 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-4 min-w-0">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-[#14140f] text-[#ff8c5f] shrink-0">
              <Gift className="size-6 sm:size-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold opacity-70 uppercase tracking-wide">Trợ giá từ {STUDENT_UNIVERSITY?.shortName ?? "trường"}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums">
                Giảm {STUDENT_UNIVERSITY ? formatVND(calcSubsidy(180000, STUDENT_UNIVERSITY_ID).subsidy) : "54.000 đ"}
              </p>
              <p className="text-xs opacity-75 mt-1 truncate">
                {STUDENT_UNIVERSITY ? `30% vé tháng · Hiệu lực đến ${subsidyPolicies.find(p => p.universityId === STUDENT_UNIVERSITY_ID && p.status === "active")?.activeUntil ?? "31/12/2025"}` : "Đăng ký vé tháng để hưởng trợ giá"}
              </p>
            </div>
          </div>
        </motion.div>
      </ScrollReveal>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Order builder */}
        <div className="space-y-6 min-w-0">
          {/* Tab switcher — bold dark selected */}
          <div className="inline-flex rounded-full bg-surface-container-high p-1 border border-outline-variant/40">
            {(["single", "monthly"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative h-9 px-5 rounded-full text-sm font-bold transition-colors",
                  tab === t ? "text-[#beff50]" : "text-on-surface-variant"
                )}
              >
                {tab === t && (
                  <motion.div
                    layoutId="payment-tab"
                    className="absolute inset-0 rounded-full bg-[#14140f]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{t === "single" ? "Vé lượt" : "Vé tháng"}</span>
              </button>
            ))}
          </div>

          {/* Form card */}
          <div className="rounded-2xl bg-surface-container-low border border-outline-variant/40 p-5 space-y-4 min-w-0">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Chọn tuyến</Label>
              <Select value={routeId} onValueChange={setRouteId}>
                <SelectTrigger className="h-12 rounded-xl bg-surface-container-lowest border-2 border-outline-variant font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {routes.filter((r) => r.active).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.code} — {r.name} ({formatVND(r.fare)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tab === "single" ? (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Số lượng</Label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="state-layer size-11 rounded-xl bg-[#14140f] text-[#beff50] text-lg font-bold flex items-center justify-center shrink-0"
                  >
                    –
                  </button>
                  <div className="flex-1 h-11 flex items-center justify-center rounded-xl bg-surface-container-lowest border-2 border-outline-variant text-base font-bold tabular-nums min-w-0">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    className="state-layer size-11 rounded-xl bg-[#14140f] text-[#beff50] text-lg font-bold flex items-center justify-center shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Tháng áp dụng</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="h-12 rounded-xl bg-surface-container-lowest border-2 border-outline-variant font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="07/2025">Tháng 07/2025</SelectItem>
                    <SelectItem value="08/2025">Tháng 08/2025</SelectItem>
                    <SelectItem value="09/2025">Tháng 09/2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subsidy breakdown — bold dark card */}
            {route && isUni && subsidy.subsidy > 0 && tab === "monthly" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-[#14140f] text-white p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <School className="size-4 text-[#beff50]" />
                  <p className="text-sm font-bold">Trợ giá {STUDENT_UNIVERSITY?.shortName}</p>
                  <span className="ml-auto inline-flex items-center h-6 px-2.5 rounded-full bg-[#beff50] text-[#14140f] text-[10px] font-bold">
                    {subsidy.policy?.type === "percent" ? `${subsidy.policy.value}%` : formatVND(subsidy.policy?.value ?? 0)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-white/10 p-2">
                    <p className="text-white/60">Giá gốc</p>
                    <p className="font-bold line-through opacity-70 tabular-nums">{formatVND(subsidy.original)}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-2">
                    <p className="text-white/60">Trợ giá</p>
                    <p className="font-bold text-[#beff50] tabular-nums">−{formatVND(subsidy.subsidy)}</p>
                  </div>
                  <div className="rounded-lg bg-[#beff50] text-[#14140f] p-2">
                    <p className="opacity-70">Thanh toán</p>
                    <p className="font-bold tabular-nums">{formatVND(subsidy.final)}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Payment methods — bold color cards */}
          <Section title="Phương thức thanh toán">
            <div className="grid sm:grid-cols-3 gap-3">
              {methods.map((m) => {
                const selected = method === m.id;
                return (
                  <motion.button
                    key={m.id}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onClick={() => setMethod(m.id)}
                    className="rounded-2xl p-4 text-left min-w-0 border-2 transition-colors"
                    style={{
                      backgroundColor: selected ? m.bg : "var(--m3-surface-container-low)",
                      color: selected ? m.fg : "var(--m3-on-surface)",
                      borderColor: selected ? m.bg : "var(--m3-outline-variant)",
                    }}
                  >
                    <div
                      className="flex size-10 items-center justify-center rounded-xl mb-2 shrink-0"
                      style={{
                        backgroundColor: selected ? m.fg : m.bg,
                        color: selected ? m.bg : m.fg,
                      }}
                    >
                      <m.icon className="size-5" />
                    </div>
                    <p className="text-sm font-bold truncate">{m.label}</p>
                    <p className="text-xs opacity-60 mt-0.5 truncate">{m.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Sticky order summary — bold dark card */}
        <div className="lg:sticky lg:top-6 self-start min-w-0">
          <div className="rounded-2xl bg-[#14140f] text-white p-5 space-y-4 min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-[#beff50]">Tóm tắt đơn hàng</p>
            {route && (
              <div className="flex items-center gap-2 pb-3 border-b border-white/15 min-w-0">
                <RouteCodeBadge route={route} />
                <span className="text-xs text-white/70 truncate">{tab === "single" ? "Vé lượt" : `Vé tháng ${month}`}</span>
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between min-w-0">
                <span className="text-white/70">Đơn giá</span>
                <span className="font-medium tabular-nums">{formatVND(unitPrice)}</span>
              </div>
              {tab === "single" && (
                <div className="flex justify-between min-w-0">
                  <span className="text-white/70">Số lượng</span>
                  <span className="font-medium tabular-nums">{quantity}</span>
                </div>
              )}
              <div className="flex justify-between min-w-0">
                <span className="text-white/70">Tạm tính</span>
                <span className="font-medium tabular-nums">{formatVND(totalOriginal)}</span>
              </div>
              {totalSubsidy > 0 && (
                <div className="flex justify-between min-w-0">
                  <span className="text-white/70 flex items-center gap-1">
                    <School className="size-3.5" />
                    Trợ giá
                  </span>
                  <span className="font-medium text-[#beff50] tabular-nums">−{formatVND(totalSubsidy)}</span>
                </div>
              )}
              <div className="border-t border-white/15 pt-2 mt-2 flex justify-between items-baseline min-w-0">
                <span className="font-bold">Tổng cộng</span>
                <span className="text-2xl font-bold text-[#beff50] tabular-nums">{formatVND(totalFinal)}</span>
              </div>
            </div>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="w-full h-12 rounded-full bg-[#beff50] text-[#14140f] text-base font-bold flex items-center justify-center gap-2"
              onClick={() => {
                toast.success("Thanh toán thành công", {
                  description: `${tab === "single" ? "Vé lượt" : "Vé tháng"} ${route?.code} đã được kích hoạt.`,
                });
                setTransactionCode(`TXN-${transactionSeq.current++}`);
                setReceiptOpen(true);
              }}
            >
              <CreditCard className="size-4" />
              Thanh toán {formatVND(totalFinal)}
            </motion.button>
            <p className="text-[10px] text-white/50 text-center">
              Bằng việc thanh toán, bạn đồng ý với Điều khoản sử dụng.
            </p>
          </div>
        </div>
      </div>

      {/* Receipt dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#beff50] text-[#14140f]">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Thanh toán thành công</DialogTitle>
                <DialogDescription>Mã: {transactionCode}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-3">
            {route && (
              <div className="rounded-xl bg-surface-container-low p-4 flex items-center gap-3 min-w-0">
                <RouteCodeBadge route={route} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{route.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {tab === "single" ? `${quantity} vé lượt` : `Vé tháng ${month}`}
                  </p>
                </div>
              </div>
            )}
            <div className="rounded-xl bg-[#14140f] text-white p-4 space-y-2 text-sm min-w-0">
              <div className="flex justify-between">
                <span className="text-white/70">Tạm tính</span>
                <span className="font-medium tabular-nums">{formatVND(totalOriginal)}</span>
              </div>
              {totalSubsidy > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/70 flex items-center gap-1">
                    <School className="size-3.5" /> Trợ giá
                  </span>
                  <span className="font-medium text-[#beff50] tabular-nums">−{formatVND(totalSubsidy)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/70">Phương thức</span>
                <span className="font-medium">{methods.find((m) => m.id === method)?.label}</span>
              </div>
              <div className="border-t border-white/15 pt-2 mt-2 flex justify-between items-baseline">
                <span className="font-bold">Đã thanh toán</span>
                <span className="text-xl font-bold text-[#beff50] tabular-nums">{formatVND(totalFinal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setReceiptOpen(false)}>Đóng</ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={() => toast.success("Đã tải biên lai PDF")}>
              <Download className="size-4" />
              Tải biên lai
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// =============================================================================
// Screen 10 — stu-invoices (Hóa đơn)
// =============================================================================

function InvoicesScreen() {
  const [tab, setTab] = useState<"all" | "paid" | "pending">("all");
  const [selected, setSelected] = useState<Invoice | null>(null);

  const studentInvoices = invoices.filter((i) => i.studentId === CURRENT_STUDENT.id);
  const filtered = studentInvoices.filter((i) => tab === "all" || i.status === tab);
  const totalPaid = studentInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = studentInvoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);

  // Subsidy calc on the selected invoice (if it's a monthly pass)
  const selectedRoute = useMemo(() => {
    if (!selected) return null;
    const m = selected.description.match(/SU-\d+/);
    return m ? routes.find((r) => r.code === m[0]) : null;
  }, [selected]);
  const selectedSubsidy = selectedRoute && selected?.description.includes("tháng")
    ? calcSubsidy(selectedRoute.monthlyPass, STUDENT_UNIVERSITY_ID)
    : null;

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Hóa đơn"
        description="Lịch sử thanh toán và biên lai vé xe."
        icon={<Receipt className="size-7" />}
      />

      <StaggerGroup className="grid sm:grid-cols-2 gap-4">
        <StaggerItem>
          <StatCard
            label="Đã thanh toán"
            value={<Counter to={totalPaid} format={(n) => formatVND(n)} />}
            icon={<CheckCircle2 className="size-6" />}
            hint={`${studentInvoices.filter((i) => i.status === "paid").length} giao dịch`}
            trend="up"
            accent="success"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Chờ thanh toán"
            value={<Counter to={totalPending} format={(n) => formatVND(n)} />}
            icon={<Clock className="size-6" />}
            hint={`${studentInvoices.filter((i) => i.status === "pending").length} hóa đơn`}
            trend="flat"
            accent="error"
          />
        </StaggerItem>
      </StaggerGroup>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "paid" | "pending")}>
        <TabsList className="rounded-full bg-surface-container-low border border-outline-variant">
          <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">Tất cả</TabsTrigger>
          <TabsTrigger value="paid" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">Đã thanh toán</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">Chờ thanh toán</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <ExpressiveCard variant="filled" className="p-0 overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto scrollbar-soft">
              <Table>
                <TableHeader className="sticky top-0 bg-surface-container-high z-10">
                  <TableRow className="border-outline-variant hover:bg-transparent">
                    <TableHead className="text-xs">Mã hóa đơn</TableHead>
                    <TableHead className="text-xs">Nội dung</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Phương thức</TableHead>
                    <TableHead className="text-xs text-right">Số tiền</TableHead>
                    <TableHead className="text-xs text-right">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-on-surface-variant py-12">
                        Không có hóa đơn nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((inv) => (
                      <TableRow
                        key={inv.id}
                        className="border-outline-variant cursor-pointer state-layer"
                        onClick={() => setSelected(inv)}
                      >
                        <TableCell className="text-xs font-mono text-on-surface">{inv.code}</TableCell>
                        <TableCell className="text-xs text-on-surface-variant max-w-xs truncate">{inv.description}</TableCell>
                        <TableCell className="hidden sm:table-cell"><MethodPill method={inv.method} /></TableCell>
                        <TableCell className="text-xs font-semibold text-on-surface text-right">{formatVND(inv.amount)}</TableCell>
                        <TableCell className="text-right"><InvoiceStatusPill status={inv.status} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ExpressiveCard>
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết hóa đơn</DialogTitle>
                <DialogDescription className="font-mono">{selected.code}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs text-on-surface-variant">Nội dung</p>
                  <p className="text-sm font-semibold text-on-surface">{selected.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-[10px] text-on-surface-variant">Ngày phát hành</p>
                    <p className="text-sm font-semibold text-on-surface">{selected.date}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-[10px] text-on-surface-variant">Phương thức</p>
                    <MethodPill method={selected.method} />
                  </div>
                </div>
                <div className="rounded-xl border border-outline-variant p-4 space-y-2 text-sm">
                  {selectedSubsidy && selectedSubsidy.subsidy > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Giá gốc</span>
                        <span className="text-on-surface line-through">{formatVND(selectedSubsidy.original)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <School className="size-3.5" /> Trợ giá {STUDENT_UNIVERSITY?.shortName}
                        </span>
                        <span className="text-success">−{formatVND(selectedSubsidy.subsidy)}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-outline-variant pt-2 mt-2 flex justify-between items-baseline">
                    <span className="text-on-surface font-semibold">Tổng cộng</span>
                    <span className="text-xl font-bold text-primary">{formatVND(selected.amount)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <InvoiceStatusPill status={selected.status} />
                  {selected.status === "pending" && (
                    <ExpressiveButton variant="filled" size="sm" onClick={() => toast.success("Đã chuyển đến trang thanh toán")}>
                      Thanh toán ngay
                      <ArrowRight className="size-4" />
                    </ExpressiveButton>
                  )}
                </div>
              </div>
              <DialogFooter>
                <ExpressiveButton variant="text" onClick={() => toast.success("Đã tải hóa đơn PDF")}>
                  <Download className="size-4" />
                  Tải hóa đơn
                </ExpressiveButton>
                <ExpressiveButton variant="tonal" onClick={() => setSelected(null)}>Đóng</ExpressiveButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// =============================================================================
// Screen 11 — stu-feedback (Phản hồi & đánh giá)
// =============================================================================

function FeedbackScreen() {
  const [tab, setTab] = useState<"new" | "history">("new");
  const [trip, setTrip] = useState<string>("");
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [content, setContent] = useState("");

  const myFeedback = feedbackList.filter((f) => f.studentName === STUDENT_NAME);

  const categories = [
    { id: "service", label: "Phục vụ" },
    { id: "driver", label: "Tài xế" },
    { id: "vehicle", label: "Phương tiện" },
    { id: "punctuality", label: "Đúng giờ" },
    { id: "other", label: "Khác" },
  ];

  const ratingLabels = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Rất tốt"];

  const submit = () => {
    if (!trip || !category || rating === 0 || !content.trim()) {
      toast.error("Vui lòng điền đủ thông tin", { description: "Cần chọn chuyến, danh mục, đánh giá sao và nội dung." });
      return;
    }
    toast.success("Đã gửi phản hồi", { description: "Cảm ơn bạn! UniBus sẽ phản hồi trong 24h." });
    setTrip(""); setRating(0); setCategory(""); setContent("");
    setTab("history");
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Phản hồi & đánh giá"
        description="Góp ý giúp UniBus cải thiện chất lượng phục vụ."
        icon={<Star className="size-7" />}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "new" | "history")}>
        <TabsList className="rounded-full bg-surface-container-low border border-outline-variant">
          <TabsTrigger value="new" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">
            Gửi phản hồi
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">
            Lịch sử ({myFeedback.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
            <ExpressiveCard variant="filled" className="p-5 sm:p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-on-surface-variant">Chọn chuyến đi</Label>
                <Select value={trip} onValueChange={setTrip}>
                  <SelectTrigger className="h-12 rounded-xl bg-surface-container-low border-2 border-outline-variant">
                    <SelectValue placeholder="Chọn chuyến muốn đánh giá" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((t) => {
                      const r = routeById(t.routeId);
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          {r?.code} · {t.date} · {t.departTime}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-on-surface-variant">Đánh giá sao</Label>
                <div className="flex items-center gap-4">
                  <M3StarRating value={rating} onChange={setRating} size={32} />
                  <span className="text-sm font-medium text-on-surface-variant">
                    {ratingLabels[rating] || "Chọn số sao"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-on-surface-variant">Danh mục</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Chip
                      key={c.id}
                      variant={category === c.id ? "filter-selected" : "filter"}
                      onClick={() => setCategory(c.id)}
                    >
                      {category === c.id && <CheckCircle2 className="size-3.5" />}
                      {c.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-on-surface-variant">Nội dung phản hồi</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Mô tả chi tiết trải nghiệm của bạn…"
                  className="rounded-xl bg-surface-container-low border-2 border-outline-variant resize-none"
                />
                <p className="text-[10px] text-on-surface-variant text-right">{content.length}/500</p>
              </div>

              <Magnetic>
                <ExpressiveButton variant="filled" size="lg" onClick={submit}>
                  <Send className="size-4" />
                  Gửi phản hồi
                </ExpressiveButton>
              </Magnetic>
            </ExpressiveCard>

            <ExpressiveCard variant="outlined" className="p-5 space-y-3">
              <p className="text-xs font-semibold text-on-surface-variant uppercase">Mẹo viết phản hồi hữu ích</p>
              <ul className="space-y-3 text-sm text-on-surface-variant">
                <li className="flex gap-2">
                  <Dot className="size-5 text-primary shrink-0 -ml-1" />
                  Mô tả sự việc cụ thể (thời gian, địa điểm).
                </li>
                <li className="flex gap-2">
                  <Dot className="size-5 text-primary shrink-0 -ml-1" />
                  Tập trung vào trải nghiệm, tránh lời công kích cá nhân.
                </li>
                <li className="flex gap-2">
                  <Dot className="size-5 text-primary shrink-0 -ml-1" />
                  Gợi ý giải pháp nếu có — giúp chúng tôi cải thiện.
                </li>
                <li className="flex gap-2">
                  <Dot className="size-5 text-primary shrink-0 -ml-1" />
                  Phản hồi của bạn được ẩn danh khi xử lý.
                </li>
              </ul>
            </ExpressiveCard>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {myFeedback.length === 0 ? (
            <EmptyState
              icon={<Star className="size-7" />}
              title="Chưa có phản hồi"
              description="Các phản hồi bạn đã gửi sẽ hiển thị tại đây."
              action={<ExpressiveButton variant="tonal" onClick={() => setTab("new")}>Gửi phản hồi đầu tiên</ExpressiveButton>}
            />
          ) : (
            <StaggerGroup className="space-y-3">
              {myFeedback.map((f) => {
                const r = routes.find((rt) => rt.code === f.routeCode);
                const cat = categories.find((c) => c.id === f.category);
                return (
                  <StaggerItem key={f.id}>
                    <ExpressiveCard variant="filled" className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {r && <RouteCodeBadge route={r} />}
                          <StatusPill label={cat?.label ?? f.category} tone="tertiary" />
                        </div>
                        <StatusPill
                          label={f.status === "resolved" ? "Đã xử lý" : f.status === "processing" ? "Đang xử lý" : "Mới"}
                          tone={f.status === "resolved" ? "success" : f.status === "processing" ? "warning" : "neutral"}
                        />
                      </div>
                      <p className="text-sm text-on-surface">{f.content}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant">
                        <M3StarRating value={f.rating} readOnly size={16} />
                        <span className="text-xs text-on-surface-variant">{f.createdAt}</span>
                      </div>
                    </ExpressiveCard>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

// =============================================================================
// Screen 12 — stu-lost (Báo mất đồ)
// =============================================================================

function LostItemsScreen() {
  const [form, setForm] = useState({
    routeCode: "",
    tripDate: "",
    item: "",
    description: "",
  });
  const [reports, setReports] = useState<LostItem[]>(
    lostItems.filter((li) => li.studentName === STUDENT_NAME)
  );
  const lostItemSeq = useRef(reports.length + 1);

  const submit = () => {
    if (!form.routeCode || !form.tripDate || !form.item.trim()) {
      toast.error("Vui lòng điền đủ thông tin", { description: "Cần chọn tuyến, ngày đi và tên đồ vật." });
      return;
    }
    const newItem: LostItem = {
      id: `li-${lostItemSeq.current++}`,
      studentName: STUDENT_NAME,
      routeCode: form.routeCode,
      tripDate: form.tripDate,
      item: form.item,
      description: form.description,
      status: "reported",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setReports((prev) => [newItem, ...prev]);
    toast.success("Đã gửi báo mất đồ", { description: "Phụ xe sẽ kiểm tra và liên hệ bạn khi tìm thấy." });
    setForm({ routeCode: "", tripDate: "", item: "", description: "" });
  };

  const steps = [
    { id: "reported", label: "Đã báo" },
    { id: "found", label: "Đã tìm thấy" },
    { id: "returned", label: "Đã trả" },
    { id: "closed", label: "Đóng" },
  ];

  const stepIndex = (status: LostItem["status"]) =>
    steps.findIndex((s) => s.id === status);

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Báo mất đồ"
        description="Gửi thông tin đồ vật bỏ quên trên xe và theo dõi tiến trình."
        icon={<PackageSearch className="size-7" />}
      />

      <div className="grid lg:grid-cols-[1fr_1.6fr] gap-6">
        {/* Form sidebar */}
        <ExpressiveCard variant="filled" className="p-5 sm:p-6 space-y-4 lg:sticky lg:top-6 self-start">
          <p className="text-sm font-semibold text-on-surface uppercase flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            Tạo báo mới
          </p>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-on-surface-variant">Tuyến xe</Label>
            <Select value={form.routeCode} onValueChange={(v) => setForm({ ...form, routeCode: v })}>
              <SelectTrigger className="h-12 rounded-xl bg-surface-container-low border-2 border-outline-variant">
                <SelectValue placeholder="Chọn tuyến" />
              </SelectTrigger>
              <SelectContent>
                {routes.map((r) => (
                  <SelectItem key={r.id} value={r.code}>{r.code} — {r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-on-surface-variant">Ngày đi xe</Label>
            <Input
              type="date"
              value={form.tripDate}
              onChange={(e) => setForm({ ...form, tripDate: e.target.value })}
              className="h-12 rounded-xl bg-surface-container-low border-2 border-outline-variant"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-on-surface-variant">Tên đồ vật</Label>
            <Input
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              placeholder="VD: Balo đen, thẻ sinh viên…"
              className="h-12 rounded-xl bg-surface-container-low border-2 border-outline-variant"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-on-surface-variant">Mô tả chi tiết</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Đặc điểm nhận dạng, vị trí để quên…"
              className="rounded-xl bg-surface-container-low border-2 border-outline-variant resize-none"
            />
          </div>
          <Magnetic>
            <ExpressiveButton variant="filled" size="md" className="w-full" onClick={submit}>
              <Send className="size-4" />
              Gửi báo mất đồ
            </ExpressiveButton>
          </Magnetic>
        </ExpressiveCard>

        {/* Reports list */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-7" />}
              title="Chưa có báo mất đồ"
              description="Các báo mất đồ bạn gửi sẽ hiển thị tại đây."
            />
          ) : (
            <StaggerGroup className="space-y-4">
              {reports.map((li) => {
                const r = routes.find((rt) => rt.code === li.routeCode);
                const currentStep = stepIndex(li.status);
                return (
                  <StaggerItem key={li.id}>
                    <ExpressiveCard variant="filled" className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning-container text-on-surface">
                            <PackageSearch className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">{li.item}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {r && <RouteCodeBadge route={r} />}
                              <span className="text-xs text-on-surface-variant">{li.tripDate}</span>
                            </div>
                          </div>
                        </div>
                        <StatusPill
                          label={li.status === "reported" ? "Đã báo" : li.status === "found" ? "Đã tìm thấy" : li.status === "returned" ? "Đã trả" : "Đã đóng"}
                          tone={li.status === "returned" || li.status === "closed" ? "success" : li.status === "found" ? "primary" : "warning"}
                        />
                      </div>

                      {li.description && (
                        <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-xl p-3">
                          {li.description}
                        </p>
                      )}

                      {/* Status stepper */}
                      <div>
                        <div className="flex items-center">
                          {steps.map((s, i) => {
                            const done = i <= currentStep;
                            const active = i === currentStep;
                            return (
                              <div key={s.id} className="flex-1 flex flex-col items-center relative">
                                {i < steps.length - 1 && (
                                  <div
                                    className={cn(
                                      "absolute top-3 left-1/2 w-full h-0.5",
                                      i < currentStep ? "bg-success" : "bg-outline-variant"
                                    )}
                                  />
                                )}
                                <div
                                  className={cn(
                                    "relative z-10 flex size-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-surface-container-lowest",
                                    done ? "bg-success text-white" : "bg-surface-container-highest text-on-surface-variant",
                                    active && "ring-4 ring-success/25"
                                  )}
                                >
                                  {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
                                </div>
                                <p className={cn(
                                  "text-[10px] mt-1.5 text-center",
                                  done ? "text-on-surface font-medium" : "text-on-surface-variant"
                                )}>
                                  {s.label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant">
                        <span>Báo ngày {li.createdAt}</span>
                        <ExpressiveButton variant="text" size="sm" onClick={() => toast.info("Liên hệ phụ xe", { description: "Đang kết nối tới phụ xe tuyến " + li.routeCode })}>
                          <Phone className="size-3.5" />
                          Liên hệ
                        </ExpressiveButton>
                      </div>
                    </ExpressiveCard>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

// =============================================================================
// Default fallback
// =============================================================================

function FallbackScreen({ activeId }: { activeId: string }) {
  return (
    <EmptyState
      icon={<CircleDot className="size-7" />}
      title="Màn hình đang phát triển"
      description={`Màn hình "${activeId}" sẽ được bổ sung sau.`}
    />
  );
}

// =============================================================================
// Main entry — StudentModule
// =============================================================================

export function StudentModule({
  activeId,
  onNavigate,
}: {
  activeId: string;
  onNavigate: (id: string) => void;
}) {
  switch (activeId) {
    case "stu-dashboard":
      return <DashboardScreen onNavigate={onNavigate} />;
    case "stu-stops":
      return <StopsScreen />;
    case "stu-find":
      return <FindRoutesScreen onNavigate={onNavigate} />;
    case "stu-tracking":
      return <TrackingScreen />;
    case "stu-my-routes":
      return <MyRoutesScreen onNavigate={onNavigate} />;
    case "stu-my-ticket":
      return <MyTicketScreen onNavigate={onNavigate} />;
    case "stu-history":
      return <HistoryScreen />;
    case "stu-ai":
      return <AIScreen onNavigate={onNavigate} />;
    case "stu-chatbot":
      return <ChatbotScreen />;
    case "stu-payment":
      return <PaymentScreen />;
    case "stu-invoices":
      return <InvoicesScreen />;
    case "stu-feedback":
      return <FeedbackScreen />;
    case "stu-lost":
      return <LostItemsScreen />;
    default:
      return <FallbackScreen activeId={activeId} />;
  }
}

export default StudentModule;
