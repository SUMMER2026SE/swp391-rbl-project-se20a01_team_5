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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  PlayCircle,
  StopCircle,
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
  ShieldAlert,
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
import { JourneyMap, type JourneyPolyline } from "@/components/m3/journey-map";
import type { BusStop } from "@/lib/types";

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
  transportApi,
  experienceApi,
  type DriverTripView,
  type JourneyTrackingSnapshotDTO,
  type RouteMapPreviewDTO,
  type DriverDashboardView,
  type ExperienceTripCard,
  type ExperienceFeedbackCard,
  type ExperienceDashboardStat,
  type DriverContactView,
  driverDispatchApi,
  type DispatcherContact,
} from "@/lib/api/client";

type DriverModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

const DRIVER_ROUTE_SELECTED_TRIP_KEY = "unibus:driver:selected-route-trip";

export function DriverModule({ activeId, onNavigate }: DriverModuleProps) {
  const proto = useDriverPrototypeData();

  if (proto.loading || !proto.data)
    return <LoadingScreen label="Đang tải dữ liệu tài xế..." />;
  if (proto.error)
    return <ErrorScreen message={proto.error} onRetry={proto.reload} />;

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
    case "drv-active":
    case "drv-active-trip":
      return <DriverActiveTrip ctx={ctx} onNavigate={onNavigate} />;
    case "drv-route":
      return <DriverRoute />;
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
      <p className="mt-5 text-sm font-medium text-on-surface-variant">
        {label}
      </p>
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-error-container">
        <AlertTriangle className="size-7 text-error" />
      </div>
      <p className="mt-4 text-lg font-bold text-on-surface">
        Không tải được dữ liệu
      </p>
      <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">
        {message}
      </p>
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
const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

function vietnamDateParts(date = new Date()) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: VIETNAM_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
}

function vietnamToday(): string {
  const parts = vietnamDateParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function greetingByHour(): string {
  const h = Number(vietnamDateParts().hour);
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

function formatTripDuration(departedAt?: string | null, endedAt?: string | null): string {
  if (!departedAt || !endedAt) return "—";
  const seconds = Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(departedAt).getTime()) / 1000));
  return Number.isFinite(seconds) ? fmtTimer(seconds) : "—";
}

function useElapsed(departedAt?: string | null): number {
  const calculate = useCallback(() => {
    if (!departedAt) return 0;
    const startedAt = new Date(departedAt).getTime();
    return Number.isFinite(startedAt) ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0;
  }, [departedAt]);
  const [sec, setSec] = useState(calculate);
  useEffect(() => {
    setSec(calculate());
    if (!departedAt) return;
    const id = window.setInterval(() => setSec(calculate()), 1000);
    return () => window.clearInterval(id);
  }, [calculate, departedAt]);
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

function numericValue(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRouteText(value: string | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\u0111/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function selectedDriverDirection(trip: DriverTripView | null): number | null {
  const stops = trip?.stops || [];
  const directions = Array.from(
    new Set(stops.map((stop) => stop.stationDirection ?? 0)),
  );
  if (!directions.length) return null;
  const routeStart = normalizeRouteText(
    trip?.routeName?.split(/[\-\u2013\u2014]/)[0],
  );
  if (routeStart) {
    const matched = directions.find((direction) => {
      const firstStop = stops
        .filter((stop) => (stop.stationDirection ?? 0) === direction)
        .sort(
          (left, right) => (left.stopOrder ?? 0) - (right.stopOrder ?? 0),
        )[0];
      return (
        normalizeRouteText(firstStop?.stopName).includes(routeStart) ||
        routeStart.includes(normalizeRouteText(firstStop?.stopName))
      );
    });
    if (matched != null) return matched;
  }
  return directions[0];
}

function stopsForSelectedDriverDirection(trip: DriverTripView | null) {
  const direction = selectedDriverDirection(trip);
  return (trip?.stops || [])
    .filter(
      (stop) => direction == null || (stop.stationDirection ?? 0) === direction,
    )
    .sort((left, right) => (left.stopOrder ?? 0) - (right.stopOrder ?? 0));
}

function parseDriverPathPoints(pathPoints: string | undefined) {
  if (!pathPoints) return [];
  return pathPoints
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [lngRaw, latRaw] = pair.split(",");
      const lat = numericValue(latRaw);
      const lng = numericValue(lngRaw);
      return lat != null && lng != null ? { lat, lng } : null;
    })
    .filter(Boolean) as Array<{ lat: number; lng: number }>;
}

function driverTripStopsForMap(trip: DriverTripView | null): BusStop[] {
  return stopsForSelectedDriverDirection(trip)
    .map((stop) => {
      const lat = numericValue(stop.latitude);
      const lng = numericValue(stop.longitude);
      if (lat == null || lng == null) return null;
      return {
        id: String(stop.stopId),
        name: stop.stopName,
        code: String(stop.stopOrder ?? ""),
        address: "",
        lat,
        lng,
        routes: trip?.routeId ? [String(trip.routeId)] : [],
        hasShelter: false,
      } satisfies BusStop;
    })
    .filter(Boolean) as BusStop[];
}

function driverPreviewStopsForMap(
  preview: RouteMapPreviewDTO | null,
): BusStop[] {
  return (preview?.stops || [])
    .map((stop) => {
      const lat = numericValue(stop.latitude);
      const lng = numericValue(stop.longitude);
      if (lat == null || lng == null) return null;
      return {
        id: String(stop.stopId),
        name: stop.stopName,
        code: String(stop.stopOrder ?? ""),
        address: stop.address || "",
        lat,
        lng,
        routes: preview?.routeId ? [String(preview.routeId)] : [],
        hasShelter: false,
      } satisfies BusStop;
    })
    .filter(Boolean) as BusStop[];
}

function driverPreviewPolylines(
  preview: RouteMapPreviewDTO | null,
): JourneyPolyline[] {
  return (preview?.polylines || [])
    .map((line) => ({
      id: line.legId,
      color: line.colorHex || "#6CA82B",
      label: preview?.routeName || "Lộ trình",
      points: (line.points || [])
        .map((point) => ({
          lat: numericValue(point.latitude) ?? 0,
          lng: numericValue(point.longitude) ?? 0,
        }))
        .filter((point) => point.lat && point.lng),
    }))
    .filter((line) => line.points.length >= 2);
}


function driverTrackingStopsForMap(
  snapshot: JourneyTrackingSnapshotDTO | null,
): BusStop[] {
  return (snapshot?.stops || [])
    .map((stop) => {
      const lat = numericValue(stop.latitude);
      const lng = numericValue(stop.longitude);
      if (lat == null || lng == null) return null;
      return {
        id: String(stop.stopId),
        name: stop.stopName,
        code: String(stop.stopOrder ?? stop.stopId),
        address: stop.address || "",
        lat,
        lng,
        routes: snapshot?.routeCode ? [snapshot.routeCode] : [],
        hasShelter: false,
      } satisfies BusStop;
    })
    .filter(Boolean) as BusStop[];
}

function driverTrackingPolylines(
  snapshot: JourneyTrackingSnapshotDTO | null,
): JourneyPolyline[] {
  return (snapshot?.polylines || [])
    .map((line) => ({
      id: line.legId,
      color: line.colorHex || "#6CA82B",
      label: snapshot?.routeName || "Lộ trình",
      points: (line.points || [])
        .map((point) => ({
          lat: numericValue(point.latitude) ?? 0,
          lng: numericValue(point.longitude) ?? 0,
        }))
        .filter((point) => point.lat && point.lng),
    }))
    .filter((line) => line.points.length >= 2);
}

function driverTrackingTimelineStops(snapshot: JourneyTrackingSnapshotDTO | null) {
  return (snapshot?.stops || []).map((stop, index) => ({
    routeStopId: stop.stopId,
    stopId: stop.stopId,
    stopName: stop.stopName,
    stopOrder: stop.stopOrder ?? index,
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));
}

function driverTripPolyline(trip: DriverTripView | null): JourneyPolyline[] {
  const selectedStops = stopsForSelectedDriverDirection(trip);
  const points: Array<{ lat: number; lng: number }> = [];
  selectedStops.forEach((stop, index) => {
    if (index > 0) points.push(...parseDriverPathPoints(stop.pathPoints));
    const lat = numericValue(stop.latitude);
    const lng = numericValue(stop.longitude);
    if (lat != null && lng != null) points.push({ lat, lng });
  });
  const fallbackPoints = driverTripStopsForMap(trip).map((stop) => ({
    lat: stop.lat,
    lng: stop.lng,
  }));
  const linePoints = points.length >= 2 ? points : fallbackPoints;
  return linePoints.length >= 2
    ? [
        {
          id: `driver-route-${trip?.tripId ?? trip?.scheduleId ?? "selected"}`,
          color: "#6CA82B",
          label: "Lộ trình",
          points: linePoints,
        },
      ]
    : [];
}

function currentStopIndexForVehicle(
  stops: Array<{ stopId?: number; stopOrder?: number }>,
  vehicle?: { nextStopId?: number } | null,
): number {
  if (!stops.length || !vehicle?.nextStopId) return -1;
  const index = stops.findIndex(
    (stop) => Number(stop.stopId) === Number(vehicle.nextStopId),
  );
  return index >= 0 ? index : -1;
}

function syncedVehicleForTrip(
  snapshot: JourneyTrackingSnapshotDTO | null,
  trip: DriverTripView | null,
) {
  const vehicles = snapshot?.vehicles || [];
  return (
    vehicles.find((vehicle) => Number(vehicle.tripId) === Number(trip?.tripId)) ||
    vehicles.find((vehicle) => vehicle.vehicleId === `trip:${trip?.tripId}`) ||
    null
  );
}

function driverTripLabel(trip: DriverTripView): string {
  return [
    trip.routeName,
    trip.departureTime || "Chưa có giờ",
    formatDate(trip.serviceDate),
    trip.licensePlate || "Chưa gán xe",
  ]
    .filter(Boolean)
    .join(" · ");
}

function driverTripKey(trip: DriverTripView): string {
  return trip.tripId
    ? `trip:${trip.tripId}`
    : `schedule:${trip.scheduleId ?? `${trip.routeId}-${trip.serviceDate ?? "date"}-${trip.departureTime ?? "time"}`}`;
}

function driverTripScheduledAt(trip: DriverTripView | null): number | null {
  const serviceDate = trip?.serviceDate || (trip as DriverTripView & { date?: string })?.date;
  const departureTime = trip?.departureTime || (trip as DriverTripView & { departTime?: string })?.departTime;
  if (!serviceDate || !departureTime) return null;
  const timestamp = new Date(`${serviceDate}T${departureTime}+07:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isActiveDriverTrip(trip: DriverTripView | null): boolean {
  return String(trip?.status || "").toUpperCase() === "RUNNING" && Boolean(trip?.departedAt) && !trip?.endedAt;
}

function driverTripScheduleLabel(trip: DriverTripView): string {
  const serviceDate = trip.serviceDate || (trip as DriverTripView & { date?: string }).date;
  const departureTime = trip.departureTime || (trip as DriverTripView & { departTime?: string }).departTime;
  return `${formatDate(serviceDate)} · ${String(departureTime || "Chưa có giờ").slice(0, 5)}`;
}


function driverTripStatusRank(trip: DriverTripView): number {
  const status = String(trip.status || "").toUpperCase();
  if (isActiveDriverTrip(trip)) return 0;
  if (status === "COMPLETED") return 3;
  if (status === "CANCELLED") return 4;
  return 1;
}

function sortDriverTrips(trips: DriverTripView[]): DriverTripView[] {
  return [...trips].sort((left, right) => {
    const rankDelta = driverTripStatusRank(left) - driverTripStatusRank(right);
    if (rankDelta) return rankDelta;
    return (driverTripScheduledAt(left) ?? Number.MAX_SAFE_INTEGER) - (driverTripScheduledAt(right) ?? Number.MAX_SAFE_INTEGER);
  });
}

function canStartDriverTrip(trip: DriverTripView | null): boolean {
  if (!trip?.tripId || String(trip.status || "").toUpperCase() !== "NOT_STARTED") return false;
  if (!trip.serviceDate || !trip.departureTime) return false;
  const scheduledAt = driverTripScheduledAt(trip);
  if (scheduledAt == null) return false;
  const differenceMinutes = (Date.now() - scheduledAt) / 60_000;
  return differenceMinutes >= -30 && differenceMinutes <= 60;
}
function driverTripStartLabel(trip: DriverTripView | null): string {
  if (!trip?.tripId) return "CHƯA TẠO CHUYẾN";
  if (String(trip.status || "").toUpperCase() !== "NOT_STARTED") return "CHƯA THỂ BẮT ĐẦU";
  if (!trip.serviceDate || !trip.departureTime) return "THIẾU LỊCH KHỞI HÀNH";
  const scheduledAt = driverTripScheduledAt(trip);
  if (scheduledAt == null) return "LỊCH KHỞI HÀNH KHÔNG HỢP LỆ";
  const differenceMinutes = (Date.now() - scheduledAt) / 60_000;
  if (differenceMinutes < -30) return `CÓ THỂ BẮT ĐẦU LÚC ${trip.departureTime.slice(0, 5)}`;
  if (differenceMinutes > 60) return "ĐÃ QUÁ GIỜ BẮT ĐẦU";
  return "SẴN SÀNG BẮT ĐẦU";
}
function isDriverTripExpired(trip: DriverTripView, now: number): boolean {
  const status = String(trip.status || "").toUpperCase();
  if (["RUNNING", "COMPLETED", "CANCELLED"].includes(status)) return false;
  if (!trip.serviceDate || !trip.departureTime) return false;
  const scheduledAt = driverTripScheduledAt(trip);
  return scheduledAt != null && now > scheduledAt + 60 * 60_000;
}

// =============================================================================
// Sub-components
// =============================================================================
function HorizontalTimeline({
  stops,
  currentIndex,
}: {
  stops: any[];
  currentIndex?: number;
}) {
  if (!stops.length) return null;
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-1 min-w-max">
        {stops.map((s, i) => {
          const isPassed = currentIndex != null && i < currentIndex;
          const isCurrent = currentIndex === i;
          return (
            <React.Fragment
              key={`${s.routeStopId ?? s.stopId ?? "stop"}-${s.stopOrder ?? i}-${i}`}
            >
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={cn(
                    "size-3 rounded-full border-2",
                    isPassed && "bg-primary border-primary",
                    isCurrent && "bg-[#beff50] border-[#14140f] animate-pulse",
                    !isPassed && !isCurrent && "bg-surface border-outline",
                  )}
                />
                <p
                  className={cn(
                    "text-[10px] font-bold max-w-[80px] truncate",
                    isCurrent && "text-primary",
                  )}
                >
                  {s.stopName}
                </p>
              </div>
              {i < stops.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8",
                    isPassed ? "bg-primary" : "bg-outline-variant",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
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
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-outline-variant" />
      {stops.map((s, i) => {
        const isPassed = currentIndex != null && i < currentIndex;
        const isCurrent = currentIndex === i;
        return (
          <div
            key={`${s.routeStopId ?? s.stopId ?? "stop"}-${s.stopOrder ?? i}-${i}`}
            className={cn(
              "relative flex items-start gap-3 py-2 pl-0",
              isCurrent && "bg-primary-container/30 -mx-2 px-2 rounded-lg",
            )}
          >
            <div
              className={cn(
                "relative z-10 size-3.5 rounded-full border-2 mt-1 shrink-0",
                isPassed && "bg-primary border-primary",
                isCurrent && "bg-[#beff50] border-[#14140f] animate-pulse",
                !isPassed && !isCurrent && "bg-surface border-outline",
              )}
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  isCurrent && "text-on-surface font-bold",
                )}
              >
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
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill="none"
                  stroke="#beff50"
                  strokeWidth="2"
                >
                  <animate
                    attributeName="r"
                    from="7"
                    to="14"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="1"
                    to="0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
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
function DriverDashboard({
  ctx,
  onNavigate,
}: {
  ctx: Ctx;
  onNavigate: (id: string) => void;
}) {
  const firstName = (ctx.user.name || "bạn").split(" ").slice(-1)[0];
  const [renderedAt] = useState(() => Date.now());
  const activeTrip = ctx.trips.find((trip: any) => isActiveDriverTrip(trip)) ?? null;
  const upcomingTrips = sortDriverTrips(ctx.trips
    .filter((trip: any) => !isDriverTripExpired(trip, renderedAt) && !["RUNNING", "COMPLETED", "CANCELLED"].includes(String(trip.status || "").toUpperCase())))
    .slice(0, 3);
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
            className="relative overflow-hidden rounded-[32px] border border-[#DDEFD0] p-6 shadow-[0_16px_45px_rgba(20,20,15,0.06)] sm:p-8"
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
              <p className="text-sm font-semibold text-[#14140f]/70">
                Mở Chuyến hiện tại để xem bản đồ và vị trí xe theo thời gian thực.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <ExpressiveButton
                  variant="filled"
                  onClick={() => onNavigate("drv-active-trip")}
                  className="h-11 justify-center rounded-2xl bg-[#14140f] text-[#beff50]"
                >
                  Quản lý chuyến <ArrowRight className="size-4" />
                </ExpressiveButton>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      ) : (
        <ScrollReveal>
          <ExpressiveCard
            variant="elevated"
            className="p-6 text-center min-w-0"
          >
            <Coffee className="size-10 mx-auto text-on-surface-variant" />
            <p className="mt-3 text-base font-bold">
              Bạn chưa có chuyến nào đang chạy
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              Xem lịch trình hôm nay để bắt đầu chuyến.
            </p>
            <ExpressiveButton
              variant="filled"
              className="mt-4"
              onClick={() => onNavigate("drv-schedule")}
            >
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
        <Section
          title="Chuyến sắp tới"
          actions={
            <button
              onClick={() => onNavigate("drv-schedule")}
              className="text-xs font-bold text-primary"
            >
              Xem tất cả
            </button>
          }
        >
          {upcomingTrips.length === 0 ? (
            <EmptyState
              icon={<Calendar className="size-7" />}
              title="Chưa có chuyến sắp tới"
              description="Lịch phân công mới sẽ hiển thị tại đây."
            />
          ) : (
            <div className="space-y-2">
              {upcomingTrips.map((t: any, index: number) => {
                const sp = tripStatusPill(t.status);
                return (
                  <ExpressiveCard
                    key={t.tripId ?? t.scheduleId ?? `${t.routeId ?? "route"}-${t.serviceDate ?? t.date ?? "date"}-${t.departureTime ?? t.departTime ?? index}`}
                    variant="elevated"
                    className="p-4 min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 shrink-0 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                        <Bus className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{t.routeName}</p>
                        <p className="text-xs text-on-surface-variant">
                          {driverTripScheduleLabel(t)} • {t.licensePlate || "Chưa gán xe"}
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
  const [filterDate, setFilterDate] = useState(
    vietnamToday(),
  );
  const [trips, setTrips] = useState<DriverTripView[] | null>(null);
  const [expandedTripKey, setExpandedTripKey] = useState<string | null>(null);
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

  useEffect(() => {
    load();
  }, [load]);

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
            className="h-9 w-[140px] rounded-full border-[#D8D2C4] bg-white px-3 text-sm font-semibold shadow-sm"
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
          {sortDriverTrips(trips).map((trip) => {
            const statusPill = tripStatusPill(trip.status);
            const status = String(trip.status || "").toUpperCase();
            const isRunning = isActiveDriverTrip(trip);
            const isDone = status === "COMPLETED";
            const tripKey = driverTripKey(trip);
            const isExpanded = expandedTripKey === tripKey;
            return (
              <StaggerItem key={tripKey}>
                <div className="relative flex gap-4">
                  <div className="relative z-10 hidden w-16 shrink-0 pt-4 text-center sm:block">
                    <div className={cn(
                      "mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl border-4 border-white shadow-sm",
                      isRunning ? "bg-[#B8F5CC] text-[#14532d]" : isDone ? "bg-[#ECECEC] text-[#4B5563]" : "bg-[#FFF0CF] text-[#92400e]",
                    )}>
                      <Bus className="size-5" />
                    </div>
                    <p className="text-xs font-black text-[#14140f]">{String(trip.departureTime || "--:--").slice(0, 5)}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-[#6B6B6B]">{formatDate(trip.serviceDate)}</p>
                  </div>
                  <ExpressiveCard
                    variant="elevated"
                    className={cn(
                      "flex-1 overflow-hidden rounded-[28px] border bg-white p-0 shadow-[0_8px_26px_rgba(20,20,15,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(20,20,15,0.08)]",
                      isRunning ? "border-[#B8F5CC]" : isDone ? "border-[#E6E2D8]" : "border-[#F1DFC0]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedTripKey(isExpanded ? null : tripKey)}
                      className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
                      aria-expanded={isExpanded}
                    >
                      <div className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl sm:hidden",
                        isRunning ? "bg-[#B8F5CC] text-[#14532d]" : isDone ? "bg-[#ECECEC] text-[#4B5563]" : "bg-[#FFF0CF] text-[#92400e]",
                      )}>
                        <Bus className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                          <h3 className="min-w-0 truncate text-base font-black text-[#14140f] sm:text-lg">{trip.routeName}</h3>
                          <M3StatusPill label={statusPill.label} tone={statusPill.tone} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#6B6B6B]">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F2] px-3 py-1 sm:hidden">
                            <Clock className="size-3.5" /> {driverTripScheduleLabel(trip)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F2] px-3 py-1">
                            <MapPin className="size-3.5" /> {trip.stops?.length || 0} trạm
                          </span>
                          {trip.licensePlate && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F2] px-3 py-1">
                              <Bus className="size-3.5" /> {trip.licensePlate}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E8E2D5] bg-[#FAF8F2] text-[#14140f] transition",
                        isExpanded && "bg-[#14140f] text-[#BDFD4F]",
                      )}>
                        <ChevronRight className={cn("size-5 transition-transform", isExpanded && "rotate-90")} />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="grid gap-3 border-t border-[#EEE8DA] bg-[#FFFCF6] px-4 pb-4 pt-3 text-xs sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                              <p className="font-bold uppercase tracking-[0.08em] text-[#6B6B6B]">Biển số</p>
                              <p className="mt-1 truncate font-black text-[#14140f]">{trip.licensePlate || "--"}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                              <p className="font-bold uppercase tracking-[0.08em] text-[#6B6B6B]">Phụ xe</p>
                              <p className="mt-1 truncate font-black text-[#14140f]">{trip.conductorName || "--"}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                              <p className="font-bold uppercase tracking-[0.08em] text-[#6B6B6B]">Điện thoại</p>
                              <p className="mt-1 truncate font-black text-[#14140f]">{trip.conductorPhone || "--"}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                              <p className="font-bold uppercase tracking-[0.08em] text-[#6B6B6B]">Số trạm</p>
                              <p className="mt-1 font-black text-[#14140f]">{trip.stops?.length || 0}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </ExpressiveCard>
                </div>
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
function DriverActiveTrip({
  ctx,
  onNavigate,
}: {
  ctx: Ctx;
  onNavigate: (id: string) => void;
}) {
  const [trips, setTrips] = useState<DriverTripView[] | null>(null);
  const [renderedAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  const [ending, setEnding] = useState<number | null>(null);
  const [trackingSnapshot, setTrackingSnapshot] =
    useState<JourneyTrackingSnapshotDTO | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await operationsApi.driverTrips();
      setTrips(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không tải được chuyến",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runningTrip = trips?.find(isActiveDriverTrip) ?? null;
  const sortedTrips = useMemo(() => sortDriverTrips(trips ?? []), [trips]);
  const startableTrips = useMemo(() => {
    return sortedTrips.filter((trip) => {
      const status = trip.status?.toUpperCase();
      return trip.tripId != null && (
        status !== "RUNNING" && status !== "COMPLETED" && status !== "CANCELLED" &&
        !isDriverTripExpired(trip, renderedAt)
      );
    });
  }, [renderedAt, sortedTrips]);
  const nextTrip = runningTrip
    ?? startableTrips.find((trip) => canStartDriverTrip(trip))
    ?? startableTrips.find((trip) => {
      if (!trip.serviceDate || !trip.departureTime) return false;
      return (driverTripScheduledAt(trip) ?? 0) > renderedAt;
    })
    ?? startableTrips[0]
    ?? null;
  const elapsed = useElapsed(runningTrip?.departedAt);
  const activeVehicle = syncedVehicleForTrip(trackingSnapshot, runningTrip);
  const activeStops = stopsForSelectedDriverDirection(runningTrip);
  const activeCurrentIndex = currentStopIndexForVehicle(
    activeStops,
    activeVehicle,
  );
  const activeRemainingStops = activeVehicle && activeCurrentIndex >= 0
    ? Math.max(0, activeStops.length - activeCurrentIndex - 1)
    : null;
  const activeAtLastStop =
    !!activeVehicle &&
    activeStops.length > 0 &&
    activeCurrentIndex >= activeStops.length - 1;
  const activeMapStops = driverTrackingStopsForMap(trackingSnapshot);
  const activeMapPolylines = driverTrackingPolylines(trackingSnapshot);
  const activeBusLat = numericValue(activeVehicle?.latitude);
  const activeBusLng = numericValue(activeVehicle?.longitude);
  const activeMapBuses = activeVehicle && activeBusLat != null && activeBusLng != null
    ? [{
        id: activeVehicle.vehicleId,
        plate: activeVehicle.plateNumber || runningTrip?.licensePlate || "Xe đang chạy",
        routeCode: activeVehicle.routeCode || trackingSnapshot?.routeCode || "BUS",
        routeColor: activeMapPolylines[0]?.color || "#144fcc",
        lat: activeBusLat,
        lng: activeBusLng,
        etaMinutes: activeVehicle.etaMinutes,
        driverName: activeVehicle.driverName,
      }]
    : [];
  const compactStopStart = activeCurrentIndex >= 0 ? Math.max(0, activeCurrentIndex - 1) : 0;
  const compactStops = activeStops.slice(compactStopStart, compactStopStart + 5);

  useEffect(() => {
    if (!runningTrip?.routeId) {
      setTrackingSnapshot(null);
      return;
    }
    let cancelled = false;
    const refreshTracking = async () => {
      try {
        const snapshot = await operationsApi.driverTripTracking(
          runningTrip.tripId,
        );
        if (!cancelled) setTrackingSnapshot(snapshot);
      } catch {
        if (!cancelled) setTrackingSnapshot(null);
      }
    };
    refreshTracking();
    const timer = window.setInterval(refreshTracking, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [runningTrip?.routeId, runningTrip?.tripId]);

  const startTrip = async (tripId: number) => {
    if (starting || ending) return;
    if (typeof window !== "undefined" && !window.confirm("Bắt đầu chuyến này?"))
      return;
    setStarting(tripId);
    try {
      await operationsApi.startTrip(tripId);
      toast.success("Đã bắt đầu chuyến");
      await load();
      await ctx.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể bắt đầu chuyến",
      );
    } finally {
      setStarting(null);
    }
  };

  const endTrip = async (tripId: number) => {
    if (starting || ending) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Kết thúc chuyến này? Hành động này sẽ đóng chuyến đang chạy.",
      )
    )
      return;
    setEnding(tripId);
    try {
      await operationsApi.endTrip(tripId);
      toast.success("Đã kết thúc chuyến");
      await load();
      await ctx.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể kết thúc chuyến",
      );
    } finally {
      setEnding(null);
    }
  };

  if (loading) return <LoadingScreen label="Đang tải chuyến..." />;
  if (!trips || trips.length === 0) {
    return (
      <PageTransition>
        <PageHeader
        title="Chuyến hiện tại"
          icon={<PlayCircle className="size-7" />}
        />
        <EmptyState
          icon={<PlayCircle className="size-7" />}
          title="Không có chuyến"
          description="Hôm nay bạn không có chuyến nào để chạy."
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title={runningTrip ? "Chuyến đang chạy" : "Chuyến sắp tới"}
        icon={<PlayCircle className="size-7" />}
      />

      {nextTrip ? (
        <ScrollReveal>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative overflow-hidden rounded-[32px] border border-[#DDEFD0] p-0 shadow-[0_16px_45px_rgba(20,20,15,0.06)]"
            style={{
              backgroundColor: runningTrip ? "#F1F8E8" : "#FAF8F2",
              color: "#14140f",
            }}
          >
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#beff50]/40 blur-3xl pointer-events-none" />
            <div className={cn("h-1.5", runningTrip ? "bg-[#22c55e]" : "bg-[#F8C26A]")} />
            <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
              <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex h-8 px-3 rounded-full bg-[#14140f] text-white text-xs font-black items-center gap-2">
                  {runningTrip ? (
                    <motion.span
                      className="size-1.5 rounded-full bg-[#beff50]"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  ) : (
                    <PlayCircle className="size-3.5" />
                  )}
                  {activeAtLastStop
                    ? "CHỜ KẾT THÚC CHUYẾN"
                    : runningTrip
                      ? "ĐANG CHẠY"
                      : driverTripStartLabel(nextTrip)}
                </span>
                <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f]/10 text-xs font-bold items-center">
                  {nextTrip.licensePlate || "Chưa gán xe"}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black mb-2 truncate text-[#14140f]">
                {nextTrip.routeName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-sm">
                <div>
                  <p className="text-[#14140f]/70 font-bold text-xs uppercase">
                    Khởi hành
                  </p>
                  <p className="font-black">
                    {driverTripScheduleLabel(nextTrip)}
                  </p>
                </div>
                <div>
                  <p className="text-[#14140f]/70 font-bold text-xs uppercase">
                    Phụ xe
                  </p>
                  <p className="font-black truncate">
                    {nextTrip.conductorName || "Chưa gán"}
                  </p>
                </div>
                <div>
                  <p className="text-[#14140f]/70 font-bold text-xs uppercase">
                    Thời gian chạy
                  </p>
                  <p className="font-black tabular-nums">
                    {runningTrip ? fmtTimer(elapsed) : "00:00:00"}
                  </p>
                </div>
              </div>

              {runningTrip ? (
                <div className="space-y-4">
                  <div id="driver-trip-map" className="h-[480px] scroll-mt-4 overflow-hidden rounded-[24px] border border-[#E8E2D5] bg-[#F8F6EF] shadow-sm">
                    {activeMapStops.length >= 2 ? (
                      <JourneyMap
                        stops={activeMapStops}
                        polylines={activeMapPolylines}
                        buses={activeMapBuses}
                        allowFallbackPolyline={false}
                        nextStopIndex={activeCurrentIndex >= 0 ? activeCurrentIndex : undefined}
                        routeColor={activeMapPolylines[0]?.color || "#144fcc"}
                        className="h-full"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-[#6B6B6B]">
                        Chưa có dữ liệu bản đồ cho chuyến này.
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2 text-xs font-bold text-[#14140f]/75 sm:grid-cols-4">
                    <span className="rounded-2xl bg-white/60 px-3 py-2">
                      Trạm kế: {activeVehicle?.nextStopName || "?"}
                    </span>
                    <span className="rounded-2xl bg-white/60 px-3 py-2">
                      ETA: {activeVehicle?.etaMinutes != null ? `${activeVehicle.etaMinutes} phút` : "—"}
                    </span>
                    <span className="rounded-2xl bg-white/60 px-3 py-2">
                      Còn lại: {activeRemainingStops != null ? `${activeRemainingStops} trạm` : "—"}
                    </span>
                    <span className="rounded-2xl bg-white/60 px-3 py-2">
                      Tốc độ: {activeVehicle?.speedKmh != null ? `${Math.round(numericValue(activeVehicle.speedKmh) || 0)} km/h` : "—"}
                    </span>
                  </div>
                  {compactStops.length > 0 && (
                    <div className="rounded-[24px] border border-[#E8E2D5] bg-white/75 p-4 shadow-sm">
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.1em] text-[#6B6B6B]">Các trạm gần nhất</p>
                      <div className="space-y-2">
                        {compactStops.map((stop, index) => {
                          const realIndex = compactStopStart + index;
                          const passed = activeCurrentIndex >= 0 && realIndex < activeCurrentIndex;
                          const current = activeCurrentIndex >= 0 && realIndex === activeCurrentIndex;
                          return (
                            <div key={`${stop.stopId}-${stop.stopOrder ?? realIndex}`} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2">
                              <span className={cn("size-2.5 rounded-full", current ? "bg-[#144fcc]" : passed ? "bg-[#9CA3AF]" : "bg-[#beff50]")} />
                              <p className={cn("min-w-0 flex-1 truncate text-sm font-semibold", passed && "text-[#6B6B6B]")}>{stop.stopName}</p>
                              <span className="text-xs font-bold text-[#6B6B6B]">{current ? "Sắp tới" : passed ? "Đã qua" : "Tiếp theo"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : stopsForSelectedDriverDirection(nextTrip).length > 0 ? (
                <div className="rounded-[24px] border border-[#E8E2D5] bg-white/75 p-4 text-sm font-semibold text-[#6B6B6B] shadow-sm">
                  Chuyến chưa bắt đầu. Bản đồ và vị trí xe sẽ xuất hiện sau khi tài xế bấm bắt đầu chuyến.
                </div>
              ) : null}
              </div>

              <div className="flex flex-col gap-2 rounded-[24px] bg-white/80 p-4 shadow-sm lg:sticky lg:top-4">
                {runningTrip ? (
                  <ExpressiveButton
                    variant="filled"
                    className="h-11 justify-center rounded-2xl bg-[#14140f] text-[#beff50]"
                    onClick={() => endTrip(runningTrip.tripId)}
                    disabled={ending === runningTrip.tripId}
                  >
                    {ending === runningTrip.tripId ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <StopCircle className="size-4" />
                    )}
                    Kết thúc chuyến
                  </ExpressiveButton>
                ) : (
                  <ExpressiveButton
                    variant="filled"
                    className="h-11 justify-center rounded-2xl bg-[#14140f] text-white"
                    onClick={() => startTrip(nextTrip.tripId)}
                    disabled={starting === nextTrip.tripId || !canStartDriverTrip(nextTrip)}
                  >
                    <PlayCircle className="size-4" />
                    Bắt đầu chuyến
                  </ExpressiveButton>
                )}
                <ExpressiveButton
                  variant="outlined"
                  className="h-11 justify-center rounded-2xl border-[#14140f] text-[#14140f]"
                  onClick={() => onNavigate("drv-contact")}
                >
                  <Phone className="size-4" />
                  Liên hệ điều phối
                </ExpressiveButton>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      ) : (
        <EmptyState
          icon={<CheckCircle2 className="size-7" />}
          title="Đã hoàn thành tất cả chuyến"
          description="Không còn chuyến nào có thể bắt đầu."
        />
      )}

      <Section title="Danh sách chuyến được phân công">
        <div className="space-y-4">
          {sortedTrips.filter((trip) => {
            const status = String(trip.status || "").toUpperCase();
            return status !== "RUNNING" && status !== "COMPLETED" && status !== "CANCELLED"
              && !isDriverTripExpired(trip, renderedAt)
              && (!nextTrip || driverTripKey(trip) !== driverTripKey(nextTrip));
          }).map((trip, index) => {
            const status = trip.status?.toUpperCase();
            const statusPill = tripStatusPill(trip.status);
            const isRunning = status === "RUNNING";
            const isDone = status === "COMPLETED";
            const canStart = canStartDriverTrip(trip);
            return (
              <ExpressiveCard
                key={
                  trip.tripId ??
                  `${trip.scheduleId ?? trip.routeId}-${trip.serviceDate ?? "date"}-${trip.departureTime ?? index}`
                }
                variant="elevated"
                className={cn(
                  "overflow-hidden rounded-[28px] border bg-white p-0 shadow-[0_10px_30px_rgba(20,20,15,0.04)]",
                  isRunning ? "border-[#B8F5CC]" : "border-[#E8E2D5]",
                )}
              >
                <div className={cn("h-1.5", isRunning ? "bg-[#22c55e]" : isDone ? "bg-[#9CA3AF]" : "bg-[#F8C26A]")} />
                <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={cn(
                          "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                          isRunning ? "bg-[#B8F5CC] text-[#14532d]" : isDone ? "bg-[#ECECEC] text-[#4B5563]" : "bg-[#FFF0CF] text-[#92400e]",
                        )}>
                          <Bus className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-black text-[#14140f]">{trip.routeName}</p>
                          <p className="text-xs font-semibold text-[#6B6B6B]">
                            {driverTripScheduleLabel(trip)} · {trip.licensePlate || "Chưa gán xe"}
                          </p>
                        </div>
                      </div>
                      <M3StatusPill label={statusPill.label} tone={statusPill.tone} />
                    </div>
                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                      <div className="rounded-2xl bg-[#FAF8F2] px-3 py-2"><span className="font-bold text-[#6B6B6B]">Phụ xe</span><p className="truncate font-black text-[#14140f]">{trip.conductorName || "--"}</p></div>
                      <div className="rounded-2xl bg-[#FAF8F2] px-3 py-2"><span className="font-bold text-[#6B6B6B]">Điện thoại</span><p className="truncate font-black text-[#14140f]">{trip.conductorPhone || "--"}</p></div>
                      <div className="rounded-2xl bg-[#FAF8F2] px-3 py-2"><span className="font-bold text-[#6B6B6B]">Số trạm</span><p className="font-black text-[#14140f]">{trip.stops?.length || 0}</p></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {canStart && (
                      <ExpressiveButton
                        variant="filled"
                        size="sm"
                        className="h-10 justify-center rounded-2xl bg-[#14140f] text-white"
                        onClick={() => startTrip(trip.tripId)}
                        disabled={starting === trip.tripId || !!runningTrip}
                      >
                        <PlayCircle className="size-4" />
                        Bắt đầu
                      </ExpressiveButton>
                    )}
                    {status === "RUNNING" && (
                      <ExpressiveButton
                        variant="filled"
                        size="sm"
                        className="h-10 justify-center rounded-2xl bg-error text-on-error"
                        onClick={() => endTrip(trip.tripId)}
                        disabled={ending === trip.tripId}
                      >
                        {ending === trip.tripId ? <RefreshCw className="size-4 animate-spin" /> : <StopCircle className="size-4" />}
                        Kết thúc
                      </ExpressiveButton>
                    )}
                  </div>
                </div>
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
function DriverRoute() {
  const [selectedTripKey, setSelectedTripKey] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.sessionStorage.getItem(DRIVER_ROUTE_SELECTED_TRIP_KEY) || "",
  );
  const [trips, setTrips] = useState<DriverTripView[]>([]);
  const [trip, setTrip] = useState<DriverTripView | null>(null);
  const [routePreview, setRoutePreview] = useState<RouteMapPreviewDTO | null>(
    null,
  );
  const [trackingSnapshot, setTrackingSnapshot] =
    useState<JourneyTrackingSnapshotDTO | null>(null);
  const [showAllRouteStops, setShowAllRouteStops] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await operationsApi.driverTrips();
      setTrips(data);
      const runningTrips = data.filter(
        (item) => item.status?.toUpperCase() === "RUNNING",
      );
      const storedRunningTrip = runningTrips.find(
        (item) => driverTripKey(item) === selectedTripKey,
      );
      const nextKey =
        storedRunningTrip ||
        runningTrips[0] ||
        null;
      const resolvedKey =
        typeof nextKey === "string"
          ? nextKey
          : nextKey
            ? driverTripKey(nextKey)
            : "";
      if (resolvedKey !== selectedTripKey)
        setSelectedTripKey(resolvedKey);
      const selectedTrip =
        runningTrips.find((item) => driverTripKey(item) === resolvedKey) || null;
      setTrip(selectedTrip);
      if (!selectedTrip?.routeId) {
        setRoutePreview(null);
        setTrackingSnapshot(null);
      } else {
        try {
          setRoutePreview(
            await transportApi.routePreview(
              selectedTrip.routeId,
              selectedDriverDirection(selectedTrip) ?? undefined,
            ),
          );
        } catch {
          setRoutePreview(null);
        }
        try {
          setTrackingSnapshot(
            await operationsApi.driverTripTracking(selectedTrip.tripId),
          );
        } catch {
          setTrackingSnapshot(null);
        }
      }
    } catch {
      setTrips([]);
      setTrip(null);
      setRoutePreview(null);
      setTrackingSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [selectedTripKey]);

  const runningTrips = useMemo(
    () => trips.filter((item) => item.status?.toUpperCase() === "RUNNING"),
    [trips],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!trip?.routeId) return;
    let cancelled = false;
    const refreshTracking = async () => {
      try {
        const snapshot = await operationsApi.driverTripTracking(trip.tripId);
        if (!cancelled) setTrackingSnapshot(snapshot);
      } catch {
        if (!cancelled) setTrackingSnapshot(null);
      }
    };
    refreshTracking();
    const timer = window.setInterval(refreshTracking, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [trip?.routeId, trip?.tripId]);

  const mapStops = useMemo(() => {
    const trackingStops = driverTrackingStopsForMap(trackingSnapshot);
    if (trackingStops.length) return trackingStops;
    const previewStops = driverPreviewStopsForMap(routePreview);
    return previewStops.length ? previewStops : driverTripStopsForMap(trip);
  }, [routePreview, trackingSnapshot, trip]);
  const mapPolylines = useMemo(() => {
    const trackingPolylines = driverTrackingPolylines(trackingSnapshot);
    if (trackingPolylines.length) return trackingPolylines;
    const previewPolylines = driverPreviewPolylines(routePreview);
    return previewPolylines.length
      ? previewPolylines
      : driverTripPolyline(trip);
  }, [routePreview, trackingSnapshot, trip]);
  const driverRouteColor = mapPolylines[0]?.color || "#144fcc";
  const syncedVehicle = syncedVehicleForTrip(trackingSnapshot, trip);
  const trackingTimelineStops = driverTrackingTimelineStops(trackingSnapshot);
  const routeTimelineStops = trackingTimelineStops.length ? trackingTimelineStops : stopsForSelectedDriverDirection(trip);
  const routeCurrentIndex = currentStopIndexForVehicle(
    routeTimelineStops.length
      ? routeTimelineStops
      : mapStops.map((stop) => ({ stopId: Number(stop.id) })),
    syncedVehicle,
  );
  const routeRemainingStops = Math.max(
    0,
    routeTimelineStops.length - routeCurrentIndex - 1,
  );
  const routeAtLastStop =
    !!syncedVehicle &&
    routeTimelineStops.length > 0 &&
    routeCurrentIndex >= routeTimelineStops.length - 1;
  const routeStopWindowStart = showAllRouteStops
    ? 0
    : Math.max(
        0,
        Math.min(
          routeCurrentIndex - 2,
          Math.max(0, routeTimelineStops.length - 5),
        ),
      );
  const visibleRouteStops = showAllRouteStops
    ? routeTimelineStops
    : routeTimelineStops.slice(routeStopWindowStart, routeStopWindowStart + 5);
  const driverBusLat = numericValue(syncedVehicle?.latitude);
  const driverBusLng = numericValue(syncedVehicle?.longitude);
  const driverBuses =
    syncedVehicle && driverBusLat && driverBusLng
      ? [
          {
            id: syncedVehicle.vehicleId,
            plate:
              syncedVehicle.plateNumber || trip?.licensePlate || "Xe đang chạy",
            routeCode:
              syncedVehicle.routeCode || trackingSnapshot?.routeCode || "BUS",
            routeColor: driverRouteColor,
            lat: driverBusLat,
            lng: driverBusLng,
            etaMinutes: syncedVehicle.etaMinutes,
            driverName: syncedVehicle.driverName,
          },
        ]
      : [];

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lộ trình chuyến"
        description="Chi tiết các trạm dừng trên tuyến."
        icon={<RouteIcon className="size-7" />}
        actions={
          <Select
            value={selectedTripKey}
            onValueChange={(value) => {
              setSelectedTripKey(value);
              if (typeof window !== "undefined")
                window.sessionStorage.setItem(
                  DRIVER_ROUTE_SELECTED_TRIP_KEY,
                  value,
                );
            }}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Chọn chuyến" />
            </SelectTrigger>
            <SelectContent>
              {runningTrips.map((item) => (
                <SelectItem
                  key={driverTripKey(item)}
                  value={driverTripKey(item)}
                >
                  {driverTripLabel(item)}
                </SelectItem>
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
        <div className="grid grid-cols-1 gap-5 min-w-0 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
          <ScrollReveal>
            <ExpressiveCard
              variant="elevated"
              className="overflow-hidden min-w-0 rounded-[28px] border border-[#E8E2D5] bg-white p-0 shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E2D5] px-5 py-4">
                <div>
                  <h3 className="text-base font-black text-[#14140f]">
                    Bản đồ lộ trình
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    Theo dõi xe và các trạm trên tuyến.
                  </p>
                </div>
                {syncedVehicle && (
                  <span className="rounded-full bg-[#beff50] px-3 py-1 text-xs font-black text-[#14140f]">
                    {Math.round(numericValue(syncedVehicle.speedKmh) || 0)} km/h
                  </span>
                )}
              </div>
              <div className="relative h-[560px] bg-[#F8F6EF] lg:h-[680px]">
                {mapStops.length >= 2 ? (
                  <JourneyMap
                    stops={mapStops}
                    polylines={mapPolylines}
                    buses={driverBuses}
                    allowFallbackPolyline={false}
                    nextStopIndex={routeCurrentIndex}
                    routeColor={driverRouteColor}
                    height="100%"
                    fitOnStopsChange
                    animateCamera={false}
                    scrollWheelZoom
                  />
                ) : (
                  <RouteMapSVG currentIndex={0} />
                )}
              </div>
              {syncedVehicle && (
                <div className="grid gap-3 bg-[#FAF8F2] p-4 sm:grid-cols-4">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs text-[#6B6B6B]">Biển số</p>
                    <p className="font-black text-[#14140f]">
                      {syncedVehicle.plateNumber || trip.licensePlate || "--"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs text-[#6B6B6B]">Tài xế</p>
                    <p className="truncate font-black text-[#14140f]">
                      {syncedVehicle.driverName || trip.driverName || "--"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs text-[#6B6B6B]">Trạm kế</p>
                    <p className="truncate font-black text-[#14140f]">
                      {syncedVehicle.nextStopName || "Đang xác định"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs text-[#6B6B6B]">Khoảng cách</p>
                    <p className="font-black text-[#14140f]">
                      {syncedVehicle.distanceMeters != null
                        ? `${syncedVehicle.distanceMeters} m`
                        : "--"}
                    </p>
                  </div>
                </div>
              )}
            </ExpressiveCard>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <ExpressiveCard
              variant="filled"
              className="rounded-[24px] border border-[#E8E2D5] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B6B6B]">
                    Lộ trình tuyến
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-[#14140f]">
                    Các điểm sắp tới
                  </h3>
                </div>
              </div>
              {syncedVehicle && (
                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#FAF8F2] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6B6B]">
                      Trạm kế
                    </p>
                    <p className="truncate text-sm font-black text-[#14140f]">
                      {routeAtLastStop
                        ? "Điểm cuối"
                        : syncedVehicle.nextStopName || "Đang xác định"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FAF8F2] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6B6B]">
                      ETA
                    </p>
                    <p className="text-sm font-black text-[#14140f]">
                      {routeAtLastStop
                        ? "Đã đến"
                        : syncedVehicle.etaMinutes != null
                          ? `${syncedVehicle.etaMinutes} phút`
                          : "--"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FAF8F2] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6B6B]">
                      Còn lại
                    </p>
                    <p className="text-sm font-black text-[#14140f]">
                      {routeRemainingStops} trạm
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FAF8F2] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6B6B]">
                      Tốc độ
                    </p>
                    <p className="text-sm font-black text-[#14140f]">
                      {Math.round(numericValue(syncedVehicle.speedKmh) || 0)}{" "}
                      km/h
                    </p>
                  </div>
                </div>
              )}
              {visibleRouteStops.length ? (
                <div className="max-h-[620px] overflow-y-auto pr-1 scrollbar-soft">
                  <div className="space-y-0">
                    {visibleRouteStops.map((stop, index) => {
                      const realIndex = showAllRouteStops
                        ? index
                        : routeStopWindowStart + index;
                      const passed = realIndex < routeCurrentIndex;
                      const current = realIndex === routeCurrentIndex;
                      const minutes = Math.max(
                        0,
                        (realIndex - routeCurrentIndex) * 3,
                      );
                      const timeLabel = passed
                        ? "Đã đi qua"
                        : current
                          ? "Sắp tới"
                          : `${minutes} phút`;
                      const etaLabel = passed
                        ? "Đã qua"
                        : current
                          ? "Hiện tại"
                          : `${minutes} phút`;
                      return (
                        <div
                          key={`${stop.routeStopId ?? stop.stopId ?? "stop"}-${stop.stopOrder ?? realIndex}-${realIndex}`}
                          className={cn(
                            "grid w-full grid-cols-[28px_minmax(0,1fr)_72px] gap-3 text-left",
                            passed && "opacity-55",
                          )}
                        >
                          <div className="flex flex-col items-center">
                            <span
                              className={cn(
                                "mt-1 size-3 rounded-full border-2",
                                current
                                  ? "border-[#beff50] bg-[#beff50]"
                                  : passed
                                    ? "border-[#9CA3AF] bg-[#9CA3AF]"
                                    : "border-[#144fcc] bg-white",
                              )}
                            />
                            {index < visibleRouteStops.length - 1 ? (
                              <span
                                className={cn(
                                  "mt-1 h-11 w-px",
                                  passed
                                    ? "bg-[#9CA3AF]/30"
                                    : "bg-[#144fcc]/20",
                                )}
                              />
                            ) : null}
                          </div>
                          <div className="pb-4">
                            <p
                              className={cn(
                                "truncate text-sm font-semibold",
                                passed ? "text-[#6B6B6B]" : "text-[#14140f]",
                              )}
                            >
                              {stop.stopName}
                            </p>
                            <p className="mt-0.5 text-xs text-[#6B6B6B]">
                              {trackingSnapshot?.routeCode || "BUS"} ·{" "}
                              {timeLabel}
                            </p>
                          </div>
                          <p
                            className={cn(
                              "pt-0.5 text-right text-sm font-semibold",
                              current
                                ? "text-[#166534]"
                                : passed
                                  ? "text-[#6B6B6B]"
                                  : "text-[#144fcc]",
                            )}
                          >
                            {etaLabel}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="rounded-2xl bg-[#FAF8F2] px-4 py-4 text-sm font-medium text-[#6B6B6B]">
                  Chưa có danh sách trạm cho tuyến này.
                </p>
              )}
              {routeTimelineStops.length > visibleRouteStops.length ? (
                <button
                  type="button"
                  onClick={() => setShowAllRouteStops((value) => !value)}
                  className="mt-4 w-full rounded-2xl border border-[#E8E2D5] bg-white px-4 py-2 text-sm font-semibold text-[#144fcc] transition hover:bg-[#beff50]/20"
                >
                  {showAllRouteStops
                    ? "Thu gọn danh sách trạm"
                    : "Xem tất cả các trạm"}
                </button>
              ) : null}
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
  const initialHistoryTrips = useMemo(() => ctx.trips.filter(
    (trip: any) => ["COMPLETED", "CANCELLED"].includes(String(trip.status || "").toUpperCase()),
  ) as DriverTripView[], [ctx.trips]);
  const [historyTrips, setHistoryTrips] = useState<DriverTripView[]>(initialHistoryTrips);
  const [historyLoading, setHistoryLoading] = useState(!initialHistoryTrips.length);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const overview = await operationsApi.driverTripOverview();
      setHistoryTrips(overview.historyTrips || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được lịch sử chuyến");
      setHistoryTrips(initialHistoryTrips);
    } finally {
      setHistoryLoading(false);
    }
  }, [initialHistoryTrips]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
          {historyLoading ? (
            <LoadingScreen label="Đang tải lịch sử chuyến..." />
          ) : historyTrips.length === 0 ? (
            <EmptyState
              icon={<History className="size-7" />}
              title="Chưa có chuyến hoàn thành"
              description="Lịch sử các chuyến đã chạy sẽ hiển thị tại đây."
            />
          ) : (
            <div className="relative space-y-3 pl-6 before:absolute before:bottom-4 before:left-[9px] before:top-4 before:w-px before:bg-outline-variant">
              {historyTrips.map((trip, index) => {
                const status = trip.status?.toUpperCase();
                const statusPill = tripStatusPill(trip.status);
                const isCancelled = status === "CANCELLED";
                return (
                  <ExpressiveCard
                    key={driverTripKey(trip) || `${trip.routeId}-${trip.serviceDate}-${index}`}
                    variant="outlined"
                    className={cn(
                      "relative rounded-[22px] border bg-white p-4 shadow-none before:absolute before:-left-[23px] before:top-6 before:size-3 before:rounded-full before:ring-4 before:ring-surface",
                      isCancelled ? "before:bg-error" : "before:bg-[#22c55e]",
                      isCancelled ? "border-[#FFD6D6]" : "border-[#B8F5CC]",
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className={cn(
                          "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                          isCancelled ? "bg-error-container text-error" : "bg-[#B8F5CC] text-[#14532d]",
                        )}>
                          {isCancelled ? <XCircle className="size-5" /> : <CheckCircle2 className="size-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <p className="text-base font-black text-[#14140f]">{trip.routeName}</p>
                            <M3StatusPill label={statusPill.label} tone={statusPill.tone} />
                          </div>
                          <p className="text-sm font-semibold text-[#6B6B6B]">
                            {driverTripScheduleLabel(trip)} · {trip.licensePlate || "Chưa gán xe"}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl bg-[#FAF8F2] px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B6B6B]">Bắt đầu thực tế</p>
                          <p className="mt-1 font-black text-[#14140f]">{trip.departedAt ? formatDateTime(trip.departedAt) : "—"}</p>
                        </div>
                        <div className="rounded-2xl bg-[#FAF8F2] px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B6B6B]">Kết thúc thực tế</p>
                          <p className="mt-1 font-black text-[#14140f]">{trip.endedAt ? formatDateTime(trip.endedAt) : "—"}</p>
                        </div>
                        <div className="rounded-2xl bg-[#FAF8F2] px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B6B6B]">Tổng thời gian</p>
                          <p className="mt-1 font-black tabular-nums text-[#14140f]">{formatTripDuration(trip.departedAt, trip.endedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </ExpressiveCard>
                );
              })}
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
                <ExpressiveCard
                  key={f.id}
                  variant="elevated"
                  className="p-4 min-w-0"
                >
                  <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">
                        {f.studentName}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {formatDate(f.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3",
                            i < (f.rating || 0)
                              ? "fill-amber-400 text-amber-400"
                              : "text-outline",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {f.content || f.comment}
                  </p>
                </ExpressiveCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

function DriverContact() {
  const [contact, setContact] = useState<DispatcherContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [chatText, setChatText] = useState("");

  // Incident Form State
  const [incidentType, setIncidentType] = useState("OTHER");
  const [description, setDescription] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const loadContact = useCallback(async () => {
    try {
      const data = await driverDispatchApi.contact();
      setContact(data);
    } catch (err: any) {
      console.error("Lỗi lấy thông tin liên hệ điều phối:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContact();
    }, 0);
    const interval = setInterval(() => {
      if (!document.hidden) void loadContact();
    }, 4000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadContact]);

  const handleSendMessage = async () => {
    if (!chatText.trim() || !contact || sending) return;
    try {
      setSending(true);
      await driverDispatchApi.sendMessage({
        tripId: contact.activeTripId || undefined,
        content: chatText.trim(),
      });
      setChatText("");
      await loadContact();
    } catch (err: any) {
      toast.error(err.message || "Không gửi được tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !contact || reporting) return;
    if (!contact.activeTripId) {
      toast.error("Bạn cần có chuyến xe đang chạy để gửi báo cáo sự cố SOS!");
      return;
    }
    try {
      setReporting(true);
      await driverDispatchApi.reportIncident({
        tripId: contact.activeTripId,
        incidentType,
        description: description.trim(),
      });
      toast.success("Đã gửi báo cáo sự cố khẩn cấp SOS!");
      setDescription("");
      await loadContact();
    } catch (err: any) {
      toast.error(err.message || "Gửi báo cáo thất bại");
    } finally {
      setReporting(false);
    }
  };

  const displayMessages = useMemo(() => {
    if (!contact || !contact.messages) return [];
    return contact.messages
      .filter((message) => !message.content.startsWith("[SOS]"))
      .sort((left, right) => {
        const leftTime = left.sentAt ? new Date(left.sentAt).getTime() : 0;
        const rightTime = right.sentAt ? new Date(right.sentAt).getTime() : 0;
        if (leftTime !== rightTime) return leftTime - rightTime;
        return left.messageId - right.messageId;
      });
  }, [contact]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "end" });
  }, [displayMessages.length]);

  if (loading && !contact) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <RefreshCw className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="rounded-[28px] bg-surface-container p-6 text-center text-on-surface-variant">
        Không tìm thấy thông tin điều phối chính cho ca chạy này.
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Liên hệ điều phối"
        icon={<Phone className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0 items-start">
        {/* Khung chat */}
        <ExpressiveCard
          variant="elevated"
          className="flex h-[560px] flex-col overflow-hidden rounded-[32px] border border-[#E8E2D5] bg-white p-0 shadow-[0_16px_45px_rgba(20,20,15,0.06)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#E8E2D5] bg-gradient-to-r from-[#FAF8F2] to-white p-4 sm:p-5 shrink-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#144fcc] text-white shadow-[0_10px_24px_rgba(20,79,204,0.18)]">
                <MessageSquare className="size-5" />
                <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-white bg-[#22c55e]" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-[#14140f]">
                  {contact.dispatcherName}
                </h3>
                <p className="truncate text-xs font-semibold text-[#6B6B6B]">
                  {contact.department || "Ban Điều Phối"} · Đang trực
                </p>
              </div>
            </div>
            {contact.phoneNumber && (
              <a
                href={`tel:${contact.phoneNumber}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#beff50] px-3.5 py-2 text-xs font-black text-[#14140f] shadow-sm transition hover:brightness-95"
              >
                <Phone className="size-3.5" /> {contact.phoneNumber}
              </a>
            )}
          </div>
          <div className="flex-1 overflow-y-auto bg-[#FAF8F2] p-4 sm:p-5 space-y-4 scrollbar-soft">
            {displayMessages.length === 0 ? (
              <div className="mt-12 flex flex-col items-center justify-center text-center text-[#6B6B6B]">
                <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <MessageSquare className="size-6 text-[#144fcc]" />
                </div>
                <p className="text-sm font-black text-[#14140f]">
                  Chưa có tin nhắn
                </p>
                <p className="mt-1 max-w-xs text-xs font-medium">
                  Gửi tin nhắn đầu tiên cho điều phối viên khi cần hỗ trợ.
                </p>
              </div>
            ) : (
              displayMessages.map((m) => {
                const isMe = m.senderName !== contact.dispatcherName;
                const sentTime = m.sentAt
                  ? new Date(m.sentAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <div
                    key={m.messageId}
                    className={cn(
                      "flex w-full",
                      isMe ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[82%] space-y-1",
                        isMe && "text-right",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-[22px] px-4 py-3 text-sm shadow-sm",
                          isMe
                            ? "rounded-tr-md bg-[#beff50] text-[#14140f] font-semibold"
                            : "rounded-tl-md bg-white text-[#14140f] border border-[#E8E2D5]",
                        )}
                      >
                        <p className="break-words leading-relaxed">
                          {m.content}
                        </p>
                      </div>
                      <p className="px-1 text-[11px] font-semibold text-[#6B6B6B]">
                        {isMe ? "Bạn" : contact.dispatcherName}
                        {sentTime ? ` · ${sentTime}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-[#E8E2D5] bg-white p-3 sm:p-4 shrink-0">
            <div className="flex items-center gap-2 rounded-full border border-[#E8E2D5] bg-[#FAF8F2] p-1.5 shadow-inner">
              <Input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Nhập tin nhắn cho điều phối..."
                disabled={sending}
                className="h-10 flex-1 rounded-full border-none bg-transparent px-4 shadow-none focus-visible:ring-0"
              />
              <ExpressiveButton
                variant="filled"
                size="icon"
                onClick={handleSendMessage}
                disabled={sending || !chatText.trim()}
                className="size-10 rounded-full bg-[#144fcc] text-white hover:bg-[#103ea3]"
              >
                {sending ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </ExpressiveButton>
            </div>
          </div>
        </ExpressiveCard>

        {/* Khung SOS */}
        <ExpressiveCard
          variant="elevated"
          className="h-[560px] overflow-hidden rounded-[32px] border border-[#FFD6D6] bg-white p-0 shadow-[0_16px_45px_rgba(180,35,24,0.08)]"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF3F0] via-white to-[#FFF9EF] p-4 sm:p-5">
            <div className="absolute -right-10 -top-10 size-36 rounded-full bg-error/10 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-error text-white shadow-[0_10px_25px_rgba(186,26,26,0.25)]">
                <ShieldAlert className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-error">
                  SOS khẩn cấp
                </p>
                <h3 className="mt-1 text-xl font-black text-[#14140f]">
                  Báo cáo sự cố
                </h3>
                <p className="mt-1 text-sm font-medium text-[#6B6B6B]">
                  Gửi nhanh tình huống hiện tại tới điều phối viên đang phụ
                  trách.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleReportIncident}
            className="flex h-[calc(100%-116px)] flex-col justify-between gap-4 overflow-y-auto p-4 sm:p-5 scrollbar-soft"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["OTHER", "Nội bộ / Khác"],
                ["TECHNICAL", "Sự cố kỹ thuật"],
                ["OVERCROWDED", "Xe quá tải"],
                ["EMERGENCY", "Khẩn cấp / Tai nạn"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIncidentType(value)}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-2xl border px-4 text-center text-sm font-bold transition",
                    incidentType === value
                      ? "border-error bg-error text-white shadow-[0_10px_24px_rgba(186,26,26,0.18)]"
                      : "border-[#E8E2D5] bg-[#FAF8F2] text-[#14140f] hover:border-error/50 hover:bg-[#FFF3F0]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.12em] text-[#6B6B6B]">
                Mô tả chi tiết
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ví dụ: xe hỏng điều hòa, kẹt xe nghiêm trọng, hành khách cần hỗ trợ..."
                required
                rows={4}
                className="w-full rounded-[24px] border-[#E8E2D5] bg-[#FAF8F2] px-4 py-3 text-sm shadow-inner focus-visible:ring-error/30"
              />
            </div>

            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold",
                contact.activeTripId
                  ? "bg-[#F1F8E8] text-[#166534]"
                  : "bg-[#FFF3F0] text-error",
              )}
            >
              {contact.activeTripId
                ? "Sự cố sẽ được gắn với chuyến xe đang chạy của bạn."
                : "Bạn chưa có chuyến đang chạy, SOS chỉ gửi được khi đã bắt đầu chuyến."}
            </div>

            <ExpressiveButton
              type="submit"
              variant="error"
              disabled={
                reporting || !description.trim() || !contact.activeTripId
              }
              className="h-12 w-full justify-center gap-2 rounded-2xl text-sm font-black shadow-[0_12px_28px_rgba(186,26,26,0.22)] disabled:shadow-none"
            >
              {reporting ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <AlertTriangle className="size-4" />
              )}
              {reporting ? "Đang gửi báo cáo..." : "Gửi báo cáo khẩn cấp"}
            </ExpressiveButton>
          </form>
        </ExpressiveCard>
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
