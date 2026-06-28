"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  BusFront,
  CheckCircle2,
  CircleDot,
  Clock3,
  Coins,
  Crosshair,
  Footprints,
  Info,
  ListChecks,
  Map as MapIcon,
  MapPin,
  RefreshCw,
  Route,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { JourneyMap, type JourneyPolyline } from "@/components/m3/journey-map";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiError,
  studentApi,
  transportApi,
  type CoordinateDTO,
  type JourneyLegDTO,
  type JourneyOptionDTO,
  type JourneyStopDTO,
  type PlaceSuggestionDTO,
  type RouteLookupDTO,
  type RouteMapPreviewDTO,
} from "@/lib/api/client";
import { formatVND } from "@/lib/prototype-data";
import type { BusStop } from "@/lib/types";
import { cn } from "@/lib/utils";

type JourneyPlannerDesktopProps = {
  ctx: {
    reload: () => void | Promise<void>;
  };
  onNavigate: (id: string) => void;
};

type PlaceKind = "origin" | "destination";
type PlannerTab = "lookup" | "planner";
type RouteInfoTab = "stops" | "info";

type StoredPlannerState = {
  origin?: PlaceSuggestionDTO | null;
  destination?: PlaceSuggestionDTO | null;
  originQuery?: string;
  destinationQuery?: string;
  maxBusLegs?: string;
  updatedAt?: string;
};

type AssistantRoutePreviewState = {
  routeId?: number | string;
  routeCode?: string;
  routeName?: string;
  boardingStopId?: number;
  alightingStopId?: number;
};

const DEFAULT_ORIGIN = "Đại học Việt Hàn";
const DEFAULT_DESTINATION = "Bến xe Trung tâm Đà Nẵng";
const CURRENT_LOCATION_LABEL = "Vị trí hiện tại";
const PLANNER_STORAGE_KEY = "unibus.studentJourneyPlanner.v1";
const ASSISTANT_ROUTE_PREVIEW_KEY = "unibus:assistant:route-preview";
const ASSISTANT_ROUTE_PREVIEW_CONTEXT_KEY = "unibus:assistant:route-preview-context";
const LAST_REGISTERED_ROUTE_CONTEXT_KEY = "unibus.lastRegisteredRouteContext";
const STUDENT_INK = "#14140f";
const STUDENT_LIME = "#BDFD4F";
const STUDENT_GREEN = "#087f5b";
const STUDENT_MAP_GREEN = "#6CA82B";
const STUDENT_CORAL = "#EE7D5A";
const MAX_JOURNEY_RESULT_CARDS = 2;
const PREFERRED_TOTAL_WALK_METERS = 1800;

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasCoordinate(value: number | string | null | undefined) {
  return value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value));
}

function coordinate(point: CoordinateDTO) {
  return {
    lat: numeric(point.latitude),
    lng: numeric(point.longitude),
  };
}

function isUsablePlace(place: PlaceSuggestionDTO | null | undefined): place is PlaceSuggestionDTO {
  return Boolean(
    place
      && place.label
      && (place.stopId || (hasCoordinate(place.latitude) && hasCoordinate(place.longitude))),
  );
}

function readPlannerStorage(): StoredPlannerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPlannerState;
    if (!isUsablePlace(parsed.origin) || !isUsablePlace(parsed.destination)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePlannerStorage(state: StoredPlannerState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PLANNER_STORAGE_KEY,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // Planner history is nice-to-have; avoid blocking the route search flow.
  }
}

function readAssistantRoutePreview(): AssistantRoutePreviewState | null {
  if (typeof window === "undefined") return null;
  try {
    const routeId = window.sessionStorage.getItem(ASSISTANT_ROUTE_PREVIEW_KEY);
    const rawContext = window.sessionStorage.getItem(ASSISTANT_ROUTE_PREVIEW_CONTEXT_KEY);
    window.sessionStorage.removeItem(ASSISTANT_ROUTE_PREVIEW_KEY);
    window.sessionStorage.removeItem(ASSISTANT_ROUTE_PREVIEW_CONTEXT_KEY);
    const context = rawContext ? JSON.parse(rawContext) as AssistantRoutePreviewState : {};
    const resolvedRouteId = context.routeId ?? routeId ?? undefined;
    return resolvedRouteId ? { ...context, routeId: resolvedRouteId } : null;
  } catch {
    return null;
  }
}

function placePoint(place: PlaceSuggestionDTO | null) {
  if (!place) return null;
  if (place.stopId) {
    return { stopId: place.stopId, label: place.label };
  }
  return {
    placeId: place.id,
    label: place.label,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function timeLabel(value?: string) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 5);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function moneyLabel(value?: number | string) {
  const amount = numeric(value);
  return amount > 0 ? formatVND(amount) : "Theo tuyến";
}

function routeCode(route?: Pick<RouteLookupDTO, "routeCode" | "routeId"> | RouteMapPreviewDTO | null) {
  if (!route) return "--";
  return route.routeCode || String(route.routeId).padStart(2, "0");
}

function routeTitle(route?: Pick<RouteLookupDTO, "routeCode" | "routeId"> | RouteMapPreviewDTO | null) {
  return `Tuyến số ${routeCode(route)}`;
}

function operationLabel(firstTrip?: string, lastTrip?: string) {
  if (!firstTrip && !lastTrip) return "Đang cập nhật";
  return `${firstTrip || "--:--"} - ${lastTrip || "--:--"}`;
}

function durationLabel(minutes: number | string | null | undefined) {
  const total = Math.max(1, Math.round(numeric(minutes)));
  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;
  if (!hours) return `${total} phút`;
  if (!remainingMinutes) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
}

function optionBusLegs(option: JourneyOptionDTO | null) {
  return option?.legs.filter((leg) => leg.mode === "BUS") ?? [];
}

function optionBadges(option: JourneyOptionDTO) {
  if (option.routeBadges?.length) return option.routeBadges;
  return option.legs
    .filter((leg) => leg.mode === "BUS")
    .map((leg) => ({
      routeId: Number(leg.routeId),
      routeCode: leg.routeCode,
      routeName: leg.routeName || "",
      colorHex: leg.colorHex,
    }));
}

function resultWindow(option: JourneyOptionDTO) {
  const busLegs = optionBusLegs(option);
  const timedLegs = option.legs.filter((leg) => leg.nextDepartureAt || leg.estimatedArrivalAt);
  const firstTimedLeg = timedLegs[0];
  const lastTimedLeg = timedLegs[timedLegs.length - 1];
  return {
    departure: timeLabel(firstTimedLeg?.nextDepartureAt || busLegs[0]?.nextDepartureAt),
    arrival: timeLabel(lastTimedLeg?.estimatedArrivalAt || busLegs[busLegs.length - 1]?.estimatedArrivalAt),
  };
}

function normalizeJourneyResults(options: JourneyOptionDTO[]) {
  const sorted = [...options]
    .sort((left, right) => {
      const byScore = journeyResultScore(left) - journeyResultScore(right);
      if (byScore) return byScore;
      const byMinutes = numeric(left.summary.totalMinutes) - numeric(right.summary.totalMinutes);
      if (byMinutes) return byMinutes;
      const byTransfers = numeric(left.summary.transferCount) - numeric(right.summary.transferCount);
      if (byTransfers) return byTransfers;
      return numeric(left.summary.walkMeters) - numeric(right.summary.walkMeters);
    });
  const bestByRouteSequence = new globalThis.Map<string, JourneyOptionDTO>();
  sorted.forEach((option) => {
    const signature = journeyResultSignature(option);
    if (!bestByRouteSequence.has(signature)) bestByRouteSequence.set(signature, option);
  });
  const distinct = Array.from(bestByRouteSequence.values());
  const direct = distinct
    .filter((option) => !numeric(option.summary.transferCount))
    .slice(0, MAX_JOURNEY_RESULT_CARDS);
  if (direct.length >= MAX_JOURNEY_RESULT_CARDS) return direct;
  if (direct.length) {
    const bestDirect = direct[0];
    const strongTransfer = distinct.find((option) => (
      numeric(option.summary.transferCount) > 0
      && journeyResultScore(option) + 18 < journeyResultScore(bestDirect)
    ));
    return strongTransfer ? [...direct, strongTransfer].slice(0, MAX_JOURNEY_RESULT_CARDS) : direct;
  }
  return distinct.slice(0, MAX_JOURNEY_RESULT_CARDS);
}

function journeyResultScore(option: JourneyOptionDTO) {
  const walkMeters = numeric(option.summary.walkMeters);
  const longWalkPenalty = Math.max(0, walkMeters - PREFERRED_TOTAL_WALK_METERS) / 80;
  const aliasRoutePenalty = option.legs
    .filter((leg) => leg.mode === "BUS" && isAliasRouteCode(leg.routeCode))
    .length * 10;
  const confidencePenalty = option.summary.confidence === "LOW"
    ? 12
    : option.summary.confidence === "MEDIUM"
      ? 4
      : 0;
  return numeric(option.summary.totalMinutes)
    + numeric(option.summary.transferCount) * 12
    + numeric(option.summary.walkMinutes) * 0.75
    + longWalkPenalty
    + aliasRoutePenalty
    + confidencePenalty;
}

function journeyResultSignature(option: JourneyOptionDTO) {
  const routeSequence = option.legs
    .filter((leg) => leg.mode === "BUS")
    .map((leg) => {
      const direction = leg.stops?.find((stop) => stop.stationDirection !== undefined)?.stationDirection ?? "x";
      return `${canonicalRouteCode(leg.routeCode, leg.routeId)}:${direction}`;
    })
    .join(">");
  return routeSequence || option.optionId;
}

function canonicalRouteCode(routeCode?: string, routeId?: number | string | null) {
  const normalized = String(routeCode || "").trim().toUpperCase();
  if (!normalized) return String(routeId || "BUS");
  return isAliasRouteCode(normalized) ? normalized.slice(1) : normalized;
}

function isAliasRouteCode(routeCode?: string | null) {
  return /^R\d+[A-Z]?$/.test(String(routeCode || "").trim().toUpperCase());
}

function emptyJourneyMessage(rawCount: number) {
  return rawCount > 0
    ? "Các phương án hiện tại chưa đủ dữ liệu trạm phù hợp. Hãy thử chọn điểm đến cụ thể hơn."
    : "Chưa có hành trình phù hợp cho hai địa điểm này.";
}

function stopsFromJourney(option: JourneyOptionDTO | null): BusStop[] {
  if (!option) return [];
  const busLegs = optionBusLegs(option);
  const rawStops = option.stops?.length ? option.stops : busLegs.flatMap((leg) => leg.stops || []);
  const unique = new globalThis.Map<number, JourneyStopDTO>();
  rawStops.forEach((stop) => unique.set(stop.stopId, stop));
  return Array.from(unique.values())
    .filter((stop) => numeric(stop.latitude) && numeric(stop.longitude))
    .map((stop) => ({
      id: String(stop.stopId),
      name: stop.stopName,
      address: stop.address || "Đà Nẵng",
      code: String(stop.stopOrder ?? ""),
      lat: numeric(stop.latitude),
      lng: numeric(stop.longitude),
      hasShelter: false,
      routes: option.routeBadges?.map((badge) => String(badge.routeId)) || [],
    }));
}

function stopsFromRoute(preview: RouteMapPreviewDTO | null): BusStop[] {
  return (preview?.stops || [])
    .filter((stop) => numeric(stop.latitude) && numeric(stop.longitude))
    .map((stop) => ({
      id: String(stop.stopId),
      name: stop.stopName,
      address: stop.address || "Đà Nẵng",
      code: String(stop.stopOrder ?? ""),
      lat: numeric(stop.latitude),
      lng: numeric(stop.longitude),
      hasShelter: false,
      routes: [String(preview?.routeId ?? "")],
    }));
}

function polylinesFromJourney(option: JourneyOptionDTO | null): JourneyPolyline[] {
  if (!option) return [];
  return (option.polylines || [])
    .map((line) => {
      const leg = option.legs.find((item) => item.legId === line.legId);
      return {
        id: line.legId,
        label: line.mode === "WALK" ? "Đi bộ" : `Tuyến ${leg?.routeCode || ""}`.trim(),
        color: line.colorHex || (line.mode === "WALK" ? "#64748b" : STUDENT_MAP_GREEN),
        dashed: line.mode === "WALK",
        points: (line.points || []).map(coordinate).filter((point) => point.lat && point.lng),
      };
    })
    .filter((line) => line.points.length >= 2);
}

function routeDirectionColor(preview: RouteMapPreviewDTO | null) {
  if (!preview) return STUDENT_MAP_GREEN;
  const directions = preview.directions || [];
  const activeIndex = directions.findIndex((item) => item.direction === preview.direction);
  return activeIndex === 1 || preview.direction === 1
    ? STUDENT_CORAL
    : STUDENT_MAP_GREEN;
}

function polylinesFromRoute(preview: RouteMapPreviewDTO | null): JourneyPolyline[] {
  const color = routeDirectionColor(preview);
  return (preview?.polylines || [])
    .map((line) => ({
      id: line.legId,
      label: routeTitle(preview),
      color,
      dashed: false,
      points: (line.points || []).map(coordinate).filter((point) => point.lat && point.lng),
    }))
    .filter((line) => line.points.length >= 2);
}

function SuggestionMenu({
  kind,
  items,
  onPick,
}: {
  kind: PlaceKind;
  items: PlaceSuggestionDTO[];
  onPick: (place: PlaceSuggestionDTO) => void;
}) {
  if (!items.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="absolute inset-x-0 top-[calc(100%+6px)] z-[1400] overflow-hidden rounded-lg border border-outline-variant bg-surface"
    >
      {items.map((place) => (
        <button
          key={place.id}
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            onPick(place);
          }}
          className="flex min-h-14 w-full cursor-pointer items-center gap-3 border-b border-outline-variant/70 px-3.5 py-2.5 text-left transition-colors last:border-b-0 hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          {kind === "origin" ? (
            <CircleDot className="size-4 shrink-0 text-[#087f5b]" />
          ) : (
            <MapPin className="size-4 shrink-0 text-error" />
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-on-surface">{place.label}</span>
            <span className="block truncate text-xs text-on-surface-variant">
              {place.address || "Đà Nẵng"}
            </span>
          </span>
        </button>
      ))}
    </motion.div>
  );
}

function SearchField({
  kind,
  label,
  value,
  selected,
  focused,
  suggestions,
  gpsLoading,
  onValueChange,
  onFocus,
  onBlur,
  onPick,
  onGps,
  onSubmit,
}: {
  kind: PlaceKind;
  label: string;
  value: string;
  selected: boolean;
  focused: boolean;
  suggestions: PlaceSuggestionDTO[];
  gpsLoading?: boolean;
  onValueChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onPick: (place: PlaceSuggestionDTO) => void;
  onGps?: () => void;
  onSubmit: () => void;
}) {
  return (
    <label className="relative block">
      <span className="mb-1.5 block text-xs font-bold uppercase text-on-surface-variant">{label}</span>
      <span className="relative block">
        {kind === "origin" ? (
          <CircleDot className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-[#087f5b]" />
        ) : (
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-error" />
        )}
        <Input
          value={value}
          autoComplete="off"
          aria-invalid={!selected && value.length > 0}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
          }}
          className={cn(
            "h-12 rounded-lg border-outline-variant bg-surface pl-10 text-sm font-semibold shadow-none focus-visible:ring-primary",
            onGps ? "pr-12" : "pr-3",
          )}
          placeholder={kind === "origin" ? "Chọn điểm xuất phát" : "Chọn điểm kết thúc"}
        />
        {onGps ? (
          <button
            type="button"
            onClick={onGps}
            disabled={gpsLoading}
            title="Dùng vị trí hiện tại"
            aria-label="Dùng vị trí hiện tại"
            className="absolute right-1 top-1 grid size-10 cursor-pointer place-items-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-wait disabled:opacity-60"
          >
            {gpsLoading ? <RefreshCw className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
          </button>
        ) : null}
      </span>
      <AnimatePresence>
        {focused ? <SuggestionMenu kind={kind} items={suggestions} onPick={onPick} /> : null}
      </AnimatePresence>
    </label>
  );
}

function TopTabs({
  active,
  onChange,
}: {
  active: PlannerTab;
  onChange: (tab: PlannerTab) => void;
}) {
  const tabs: { id: PlannerTab; label: string; icon: React.ElementType }[] = [
    { id: "lookup", label: "Tra cứu", icon: Search },
    { id: "planner", label: "Tìm đường", icon: MapIcon },
  ];
  return (
    <div className="grid grid-cols-2 border-b border-outline-variant bg-surface">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex h-14 cursor-pointer items-center justify-center gap-2 text-sm font-bold uppercase transition-colors focus-visible:bg-surface-container-low focus-visible:outline-none",
              selected ? "text-on-surface" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
            )}
          >
            <Icon className={cn("size-5", selected && "text-on-surface")} />
            {tab.label}
            {selected ? (
              <motion.span
                layoutId="student-planner-tab"
                className="absolute inset-x-8 bottom-0 h-1 rounded-t-full"
                style={{ backgroundColor: STUDENT_LIME }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function RouteLookupCard({
  route,
  selected,
  onSelect,
}: {
  route: RouteLookupDTO;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "state-layer relative w-full cursor-pointer overflow-hidden rounded-[22px] border bg-surface px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-surface/20",
        selected
          ? "border-on-surface/50 bg-surface-container-low"
          : "border-outline-variant/75 hover:border-outline hover:bg-surface-container-low",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full border border-on-surface/10 text-on-surface"
          style={{ backgroundColor: STUDENT_LIME }}
        >
          <Bus className="block size-[22px]" strokeWidth={2.3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center justify-between gap-3">
            <span className="truncate text-sm font-bold text-on-surface">{routeTitle(route)}</span>
            <span className="shrink-0 text-xs font-semibold text-on-surface">{moneyLabel(route.singleFare)}</span>
          </span>
          <span className="mt-1 block line-clamp-2 text-sm leading-5 text-on-surface">
            {route.routeName}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {operationLabel(route.firstTrip, route.lastTrip)}
            </span>
            <span>{route.stopCount || 0} trạm</span>
          </span>
        </span>
      </div>
    </motion.button>
  );
}

function directionLabel(index: number, direction: number) {
  if (index === 0) return "Chiều đi";
  if (index === 1) return "Chiều về";
  return `Chiều ${direction + 1}`;
}

function directionAccentColor(index: number) {
  return index === 1 ? STUDENT_CORAL : STUDENT_LIME;
}

function RouteDetailPanel({
  preview,
  infoTab,
  registering,
  actionError,
  onInfoTabChange,
  onBack,
  onDirectionChange,
  onRegister,
}: {
  preview: RouteMapPreviewDTO;
  infoTab: RouteInfoTab;
  registering: boolean;
  actionError: string;
  onInfoTabChange: (tab: RouteInfoTab) => void;
  onBack: () => void;
  onDirectionChange: (direction: number) => void;
  onRegister: () => void;
}) {
  const directions = preview.directions?.length
    ? preview.directions
    : [{ direction: preview.direction, stopCount: preview.stops?.length || 0 }];
  const activeDirectionIndex = directions.findIndex((item) => item.direction === preview.direction);
  const activeColor = directionAccentColor(activeDirectionIndex);
  const canRegister = (preview.stops?.length || 0) >= 2;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-outline-variant px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-md px-1 text-sm font-bold text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="size-4" />
          Danh sách tuyến
        </button>
        <h2 className="text-lg font-bold text-on-surface">{routeTitle(preview)}</h2>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-on-surface-variant">
          {preview.routeName}
        </p>
      </div>

      <div className="border-b border-outline-variant p-4">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-low p-1">
          {directions.map((item, index) => {
            const selected = item.direction === preview.direction;
            const selectedColor = directionAccentColor(index);
            return (
              <button
                key={item.direction}
                type="button"
                onClick={() => onDirectionChange(item.direction)}
                className={cn(
                  "h-10 cursor-pointer rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selected ? "" : "text-on-surface-variant hover:bg-surface",
                )}
                style={selected ? {
                  backgroundColor: selectedColor,
                  color: STUDENT_INK,
                } : undefined}
              >
                {directionLabel(index, item.direction)}
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-surface-container-low p-1">
          {([
            { id: "stops", label: "Trạm dừng", icon: ListChecks },
            { id: "info", label: "Thông tin", icon: Info },
          ] as { id: RouteInfoTab; label: string; icon: React.ElementType }[]).map((tab) => {
            const Icon = tab.icon;
            const selected = infoTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onInfoTabChange(tab.id)}
                className={cn(
                  "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selected ? "bg-surface text-on-surface" : "text-on-surface-variant hover:bg-surface/70",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-soft">
        {infoTab === "stops" ? (
          <div className="space-y-0">
            {(preview.stops || []).map((stop, index, array) => (
              <div key={`${stop.stopId}-${index}`} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "mt-1 size-3 rounded-full border-2 bg-surface",
                      index === 0 || index === array.length - 1 ? "" : "border-outline",
                    )}
                    style={index === 0 || index === array.length - 1 ? { borderColor: activeColor } : undefined}
                  />
                  {index < array.length - 1 ? <span className="mt-1 h-9 w-px bg-outline-variant" /> : null}
                </div>
                <div className={cn("pb-4", index === array.length - 1 && "pb-0")}>
                  <div className="flex items-baseline gap-2">
                    <span className="w-11 shrink-0 text-xs font-bold tabular-nums text-on-surface-variant">
                      {stop.etaMinutes != null ? `${stop.etaMinutes}'` : "--"}
                    </span>
                    <p className="min-w-0 text-sm font-medium leading-5 text-on-surface">{stop.stopName}</p>
                  </div>
                  {stop.address ? (
                    <p className="ml-13 mt-0.5 line-clamp-1 text-xs text-on-surface-variant">{stop.address}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <InfoMetric label="Thời gian hoạt động" value={operationLabel(preview.firstTrip, preview.lastTrip)} icon={Clock3} />
            <InfoMetric label="Tần suất" value={preview.frequencyMin ? `${preview.frequencyMin} phút/chuyến` : "Đang cập nhật"} icon={RefreshCw} />
            <InfoMetric label="Giá vé lượt" value={moneyLabel(preview.singleFare)} icon={Coins} />
            <InfoMetric label="Quãng đường" value={preview.distanceKm ? `${numeric(preview.distanceKm).toFixed(1)} km` : "Đang cập nhật"} icon={Route} />
            <InfoMetric label="Số trạm" value={`${preview.stops?.length || 0} trạm`} icon={MapPin} />
          </div>
        )}
      </div>

      <div className="border-t border-outline-variant bg-surface px-4 py-3">
        {actionError ? <p role="alert" className="mb-2 text-xs font-semibold text-error">{actionError}</p> : null}
        <button
          type="button"
          onClick={onRegister}
          disabled={registering || !canRegister}
          className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-[opacity,transform] hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
          style={{ backgroundColor: STUDENT_INK, color: STUDENT_LIME }}
        >
          {registering ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Đăng ký tuyến
        </button>
      </div>
    </div>
  );
}

function InfoMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface px-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-container text-on-primary-container">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase text-on-surface-variant">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-medium text-on-surface">{value}</span>
      </span>
    </div>
  );
}

function MaxLegsControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor="student-max-bus-legs" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface">
        <Route className="size-4 text-on-surface-variant" />
        Số tuyến tối đa
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="student-max-bus-legs"
          className="h-10 w-32 rounded-lg border-outline-variant bg-surface text-sm font-medium shadow-none focus:ring-primary"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[1600] rounded-lg border-outline-variant bg-surface shadow-none">
          <SelectItem value="1">1 tuyến</SelectItem>
          <SelectItem value="2">2 tuyến</SelectItem>
          <SelectItem value="3">3 tuyến</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function legTitle(leg: JourneyLegDTO) {
  if (leg.mode === "BUS") return `Tuyến ${leg.routeCode || "bus"}`;
  return `Đi bộ ${Math.max(1, leg.durationMinutes || 0)} phút`;
}

function legSubtitle(leg: JourneyLegDTO) {
  if (leg.mode === "BUS") {
    const count = leg.stopCount || leg.stops?.length || 0;
    return `${count} trạm · ${leg.fromStopName || "điểm lên"} → ${leg.toStopName || "điểm xuống"}`;
  }
  const distance = leg.distanceKm ? `${numeric(leg.distanceKm).toFixed(1)} km` : "Đoạn đi bộ";
  return `${distance} · ${leg.fromStopName || "Điểm đi"} → ${leg.toStopName || "điểm đến"}`;
}

function RouteSequence({ option, compact = false }: { option: JourneyOptionDTO; compact?: boolean }) {
  return (
    <div className={cn("grid", compact ? "gap-1.5" : "gap-2")}>
      {option.legs.map((leg) => (
        <div
          key={leg.legId}
          className={cn(
            "flex min-w-0 items-start gap-2",
            !compact && "rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5",
          )}
        >
          {leg.mode === "BUS" ? (
            <span
              className="mt-0.5 inline-flex h-6 min-w-9 shrink-0 items-center justify-center rounded-full px-2 text-[11px] font-bold text-white"
              style={{ backgroundColor: leg.colorHex || STUDENT_GREEN }}
            >
              {leg.routeCode || "BUS"}
            </span>
          ) : (
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-outline-variant bg-surface">
              <Footprints className="size-3.5 text-on-surface-variant" />
            </span>
          )}
          <span className="min-w-0">
            <span className={cn("block font-bold text-on-surface", compact ? "text-xs" : "text-sm")}>
              {legTitle(leg)}
            </span>
            <span className={cn("block text-on-surface-variant", compact ? "text-[11px]" : "text-xs")}>
              {legSubtitle(leg)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function LegStopsPreview({ leg }: { leg: JourneyLegDTO }) {
  const stops = leg.stops || [];
  if (!stops.length) return null;

  return (
    <div className="mt-3 border-t border-outline-variant/70 pt-3">
      <div className="space-y-0">
        {stops.map((stop, index, array) => (
          <div key={`${leg.legId}-${stop.stopId}-${index}`} className="grid grid-cols-[22px_minmax(0,1fr)] gap-2">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 size-2.5 rounded-full border bg-surface",
                  index === 0 || index === array.length - 1 ? "border-on-surface" : "border-outline",
                )}
              />
              {index < array.length - 1 ? <span className="mt-1 h-5 w-px bg-outline-variant" /> : null}
            </div>
            <p className="min-w-0 pb-2 text-xs leading-5 text-on-surface-variant">
              <span className="font-medium text-on-surface">{stop.stopName}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneyResultCard({
  option,
  index,
  selected,
  onSelect,
  onDetails,
}: {
  option: JourneyOptionDTO;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDetails: () => void;
}) {
  const badges = optionBadges(option);
  const window = resultWindow(option);
  const walkMinutes = Math.max(1, Math.round(numeric(option.summary.walkMinutes)));
  const waitMinutes = Math.max(0, Math.round(numeric(option.summary.waitMinutes)));
  const waitText = waitMinutes <= 1 ? "Xe sắp tới" : `Chờ ${waitMinutes} phút`;
  const transferText = option.summary.transferCount
    ? `${option.summary.transferCount} lần chuyển`
    : "Đi thẳng";
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.035, 0.14), ease: "easeOut" }}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-selected={selected}
      className={cn(
        "state-layer relative w-full cursor-pointer overflow-hidden rounded-xl border bg-surface px-4 py-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-surface/20",
        selected
          ? "border-on-surface/20 bg-surface-container-low"
          : "border-outline-variant/70 hover:border-outline/70 hover:bg-surface-container-low",
      )}
    >
      {selected ? (
        <motion.span
          layoutId="selected-journey-accent"
          className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-on-surface/15"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 scrollbar-soft">
            <BusFront className="size-4 shrink-0 text-on-surface-variant" />
            {badges.map((badge, badgeIndex) => (
              <React.Fragment key={`${option.optionId}-${badge.routeId}`}>
                <span
                  className="inline-flex h-7 min-w-11 shrink-0 items-center justify-center rounded-full px-3 text-xs font-bold text-white"
                  style={{ backgroundColor: badge.colorHex || STUDENT_GREEN }}
                >
                  {badge.routeCode || badge.routeId}
                </span>
                {badgeIndex < badges.length - 1 ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-on-surface-variant">
                    <ArrowRight className="size-3" />
                    Chuyển
                  </span>
                ) : null}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock3 className="size-3.5 shrink-0" />
              {window.departure} - {window.arrival}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Route className="size-3.5 shrink-0" />
              {transferText}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Footprints className="size-3.5 shrink-0" />
              Đi bộ {walkMinutes} phút
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="size-3.5 shrink-0" />
              {waitText}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 text-right">
          <div>
            <p className="text-[11px] font-semibold leading-none text-on-surface-variant">Tổng</p>
            <p className="mt-1 whitespace-nowrap text-lg font-bold tabular-nums leading-none text-on-surface">
              {durationLabel(option.summary.totalMinutes)}
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDetails();
            }}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#14140f] px-3 text-xs font-bold text-[#BDFD4F] transition-colors hover:bg-[#14140f]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Xem chi tiết
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function JourneyPlanDetailPanel({
  option,
  registering,
  onBack,
  onRegister,
}: {
  option: JourneyOptionDTO;
  registering: boolean;
  onBack: () => void;
  onRegister: () => void;
}) {
  const busLegs = optionBusLegs(option);
  const window = resultWindow(option);
  const action = option.primaryAction;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-outline-variant px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-md px-1 text-sm font-bold text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="size-4" />
          Kết quả tìm đường
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tabular-nums text-on-surface">
              {window.departure} - {window.arrival}
            </h2>
            <p className="mt-1 text-sm font-medium text-on-surface-variant">
              {option.summary.transferCount
                ? `${option.summary.transferCount} lần chuyển tuyến`
                : "Đi thẳng, không chuyển tuyến"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold tabular-nums text-on-surface">{option.summary.totalMinutes} phút</p>
            <p className="mt-0.5 text-sm font-semibold text-on-surface">{moneyLabel(option.summary.singleFare)}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-soft">
        <div className="grid grid-cols-3 gap-2">
          <InfoPill label="Đi bộ" value={`${Math.max(1, Math.round(numeric(option.summary.walkMinutes)))} phút`} />
          <InfoPill label="Chờ xe" value={`${option.summary.waitMinutes || 0} phút`} />
          <InfoPill label="Bus" value={`${busLegs.length} tuyến`} />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase text-on-surface-variant">Các bước di chuyển</p>
          <RouteSequence option={option} />
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold uppercase text-on-surface-variant">Điểm lên/xuống</p>
          {busLegs.map((leg) => (
            <div key={`${option.optionId}-${leg.legId}`} className="rounded-lg border border-outline-variant bg-surface px-3 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-7 min-w-10 items-center justify-center rounded-full px-2 text-xs font-bold text-white"
                  style={{ backgroundColor: leg.colorHex || STUDENT_GREEN }}
                >
                  {leg.routeCode || "BUS"}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-on-surface">
                  {leg.routeName || `Tuyến ${leg.routeCode}`}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                Lên tại <strong className="text-on-surface">{leg.fromStopName || "trạm đầu"}</strong>, xuống tại{" "}
                <strong className="text-on-surface">{leg.toStopName || "trạm cuối"}</strong>.
              </p>
              <LegStopsPreview leg={leg} />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-outline-variant bg-surface px-4 py-3">
        {!action?.enabled && action?.reason ? (
          <p className="mb-2 text-xs font-semibold text-error">{action.reason}</p>
        ) : null}
        <button
          type="button"
          onClick={onRegister}
          disabled={registering || !action?.enabled}
          className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-[opacity,transform] hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
          style={{ backgroundColor: STUDENT_INK, color: STUDENT_LIME }}
        >
          {registering ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Đăng ký
        </button>
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase text-on-surface-variant">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  );
}

export function JourneyPlannerDesktop({ ctx, onNavigate }: JourneyPlannerDesktopProps) {
  const [activeTab, setActiveTab] = useState<PlannerTab>("lookup");
  const [routeQuery, setRouteQuery] = useState("");
  const [routes, setRoutes] = useState<RouteLookupDTO[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<RouteLookupDTO | null>(null);
  const [routeDirection, setRouteDirection] = useState<number | undefined>(undefined);
  const [routePreview, setRoutePreview] = useState<RouteMapPreviewDTO | null>(null);
  const [routePreviewLoading, setRoutePreviewLoading] = useState(false);
  const [routeInfoTab, setRouteInfoTab] = useState<RouteInfoTab>("stops");
  const [routeRegistering, setRouteRegistering] = useState(false);
  const [routeActionError, setRouteActionError] = useState("");
  const [assistantPreview, setAssistantPreview] = useState<AssistantRoutePreviewState | null>(() => readAssistantRoutePreview());

  const [originQuery, setOriginQuery] = useState(DEFAULT_ORIGIN);
  const [destinationQuery, setDestinationQuery] = useState(DEFAULT_DESTINATION);
  const [origin, setOrigin] = useState<PlaceSuggestionDTO | null>(null);
  const [destination, setDestination] = useState<PlaceSuggestionDTO | null>(null);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestionDTO[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestionDTO[]>([]);
  const [focusedField, setFocusedField] = useState<PlaceKind | null>(null);
  const [maxBusLegs, setMaxBusLegs] = useState("2");
  const [journeys, setJourneys] = useState<JourneyOptionDTO[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [showJourneyDetail, setShowJourneyDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  const selectedJourney = journeys.find((item) => item.optionId === selectedId) || journeys[0] || null;

  useEffect(() => {
    let cancelled = false;
    setRoutesLoading(true);
    transportApi.routes()
      .then((items) => {
        if (cancelled) return;
        setRoutes(items);
        setRoutesError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setRoutes([]);
        setRoutesError(error instanceof Error ? error.message : "Không thể tải danh sách tuyến.");
      })
      .finally(() => {
        if (!cancelled) setRoutesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!assistantPreview || routesLoading) return;
    const requestedRouteId = assistantPreview.routeId == null ? "" : String(assistantPreview.routeId);
    const requestedRouteCode = (assistantPreview.routeCode || "").trim().toLowerCase();
    const match = routes.find((route) => (
      String(route.routeId) === requestedRouteId
      || (!!requestedRouteCode && (route.routeCode || "").trim().toLowerCase() === requestedRouteCode)
    ));

    if (!match) {
      if (routes.length) {
        toast.error("Không tìm thấy tuyến từ gợi ý AI trong danh sách hiện tại.");
        setAssistantPreview(null);
      }
      return;
    }

    setActiveTab("lookup");
    setSelectedRoute(match);
    setRouteDirection(match.directions?.[0] ?? 0);
    setRoutePreview(null);
    setRouteActionError("");
    setRouteQuery(match.routeCode || match.routeName);
    setShowJourneyDetail(false);
    setAssistantPreview(null);
  }, [assistantPreview, routes, routesLoading]);

  useEffect(() => {
    if (!selectedRoute) {
      setRoutePreview(null);
      return;
    }
    let cancelled = false;
    setRouteActionError("");
    setRoutePreviewLoading(true);
    transportApi.routePreview(selectedRoute.routeId, routeDirection)
      .then((preview) => {
        if (cancelled) return;
        setRoutePreview(preview);
        setRouteDirection(preview.direction);
        setRouteInfoTab("stops");
      })
      .catch((error) => {
        if (cancelled) return;
        setRoutePreview(null);
        setRoutesError(error instanceof Error ? error.message : "Không thể tải chi tiết tuyến.");
      })
      .finally(() => {
        if (!cancelled) setRoutePreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [routeDirection, selectedRoute]);

  const loadSuggestions = useCallback(async (kind: PlaceKind, query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed === CURRENT_LOCATION_LABEL) {
      if (kind === "origin") setOriginSuggestions([]);
      else setDestinationSuggestions([]);
      return;
    }
    try {
      const places = await transportApi.searchPlaces(trimmed, undefined, undefined, 7);
      if (kind === "origin") setOriginSuggestions(places);
      else setDestinationSuggestions(places);
    } catch {
      if (kind === "origin") setOriginSuggestions([]);
      else setDestinationSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSuggestions("origin", originQuery), 220);
    return () => window.clearTimeout(timer);
  }, [loadSuggestions, originQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSuggestions("destination", destinationQuery), 220);
    return () => window.clearTimeout(timer);
  }, [destinationQuery, loadSuggestions]);

  const runJourneySearch = useCallback(async (
    nextOrigin: PlaceSuggestionDTO | null,
    nextDestination: PlaceSuggestionDTO | null,
    nextMaxBusLegs = maxBusLegs,
  ) => {
    const originPayload = placePoint(nextOrigin);
    const destinationPayload = placePoint(nextDestination);
    if (!originPayload || !destinationPayload) {
      setInlineError("Hãy chọn điểm đi và điểm đến trong danh sách gợi ý.");
      return;
    }

    setLoading(true);
    setShowJourneyDetail(false);
    setInlineError("");
    try {
      const result = await transportApi.searchJourneys({
        origin: originPayload,
        destination: destinationPayload,
        maxBusLegs: Math.max(1, Number(nextMaxBusLegs) || 2),
      });
      const normalized = normalizeJourneyResults(result);
      setJourneys(normalized);
      setSelectedId(normalized[0]?.optionId || "");
      if (!normalized.length) {
        setInlineError(emptyJourneyMessage(result.length));
      }
    } catch (error) {
      setJourneys([]);
      setSelectedId("");
      setInlineError(error instanceof Error ? error.message : "Không thể tìm hành trình.");
    } finally {
      setLoading(false);
    }
  }, [maxBusLegs]);

  useEffect(() => {
    let cancelled = false;

    const loadInitialPlaces = async () => {
      const stored = readPlannerStorage();
      const storedOrigin = stored?.origin && isUsablePlace(stored.origin) ? stored.origin : null;
      const storedDestination = stored?.destination && isUsablePlace(stored.destination) ? stored.destination : null;
      const storedMax = stored?.maxBusLegs && ["1", "2", "3"].includes(stored.maxBusLegs)
        ? stored.maxBusLegs
        : "2";

      if (storedOrigin && storedDestination) {
        setOrigin(storedOrigin);
        setDestination(storedDestination);
        setOriginQuery(stored?.originQuery || storedOrigin.label);
        setDestinationQuery(stored?.destinationQuery || storedDestination.label);
        setMaxBusLegs(storedMax);
        try {
          const result = await transportApi.searchJourneys({
            origin: placePoint(storedOrigin)!,
            destination: placePoint(storedDestination)!,
            maxBusLegs: Number(storedMax),
          });
          if (cancelled) return;
          const normalized = normalizeJourneyResults(result);
          setJourneys(normalized);
          setSelectedId(normalized[0]?.optionId || "");
          if (!normalized.length) setInlineError(emptyJourneyMessage(result.length));
        } catch {
          if (!cancelled) setInlineError("Không thể tải lại lộ trình đã lưu.");
        } finally {
          if (!cancelled) setStorageReady(true);
        }
        return;
      }

      try {
        const [originItems, destinationItems] = await Promise.all([
          transportApi.searchPlaces(DEFAULT_ORIGIN, undefined, undefined, 3),
          transportApi.searchPlaces(DEFAULT_DESTINATION, undefined, undefined, 3),
        ]);
        if (cancelled) return;
        const nextOrigin = originItems.find(isUsablePlace) || originItems[0] || null;
        const nextDestination = destinationItems.find(isUsablePlace) || destinationItems[0] || null;
        setOrigin(nextOrigin);
        setDestination(nextDestination);
        if (nextOrigin) setOriginQuery(nextOrigin.label);
        if (nextDestination) setDestinationQuery(nextDestination.label);
        if (nextOrigin && nextDestination) {
          const result = await transportApi.searchJourneys({
            origin: placePoint(nextOrigin)!,
            destination: placePoint(nextDestination)!,
            maxBusLegs: 2,
          });
          if (cancelled) return;
          const normalized = normalizeJourneyResults(result);
          setJourneys(normalized);
          setSelectedId(normalized[0]?.optionId || "");
          if (!normalized.length) setInlineError(emptyJourneyMessage(result.length));
        }
      } catch {
        if (!cancelled) setInlineError("Không thể tải dữ liệu địa điểm ban đầu.");
      } finally {
        if (!cancelled) setStorageReady(true);
      }
    };

    void loadInitialPlaces();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageReady || !origin || !destination) return;
    writePlannerStorage({
      origin,
      destination,
      originQuery,
      destinationQuery,
      maxBusLegs,
    });
  }, [destination, destinationQuery, maxBusLegs, origin, originQuery, storageReady]);

  const pickPlace = (kind: PlaceKind, place: PlaceSuggestionDTO) => {
    if (kind === "origin") {
      setOrigin(place);
      setOriginQuery(place.label);
      setOriginSuggestions([]);
    } else {
      setDestination(place);
      setDestinationQuery(place.label);
      setDestinationSuggestions([]);
    }
    setFocusedField(null);
    setInlineError("");
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      setInlineError("Trình duyệt này không hỗ trợ định vị.");
      return;
    }
    setGpsLoading(true);
    setInlineError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const place: PlaceSuggestionDTO = {
          id: "gps:current",
          type: "ADDRESS",
          label: CURRENT_LOCATION_LABEL,
          address: "Tọa độ GPS của trình duyệt",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setOrigin(place);
        setOriginQuery(CURRENT_LOCATION_LABEL);
        setOriginSuggestions([]);
        setShowJourneyDetail(false);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setInlineError("Không thể lấy vị trí. Hãy kiểm tra quyền GPS của trình duyệt.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const registerSelected = async () => {
    const journey = selectedJourney;
    const action = journey?.primaryAction;
    if (!journey || !action?.enabled || !action.routeId || !action.boardingStopId || !action.alightingStopId) {
      setInlineError(action?.reason || "Hành trình này chưa đủ điều kiện đăng ký.");
      return;
    }
    setRegistering(true);
    setInlineError("");
    try {
      await studentApi.registerRoute({
        routeId: action.routeId,
        boardingStopId: action.boardingStopId,
        alightingStopId: action.alightingStopId,
      });
      localStorage.setItem("unibus.paymentRouteId", String(action.routeId));
      localStorage.setItem(LAST_REGISTERED_ROUTE_CONTEXT_KEY, JSON.stringify({
        source: "journey-planner",
        routeId: action.routeId,
        boardingStopId: action.boardingStopId,
        alightingStopId: action.alightingStopId,
        journeyOptionId: journey.optionId,
        savedAt: new Date().toISOString(),
      }));
      await ctx.reload();
      toast.success("Đăng ký tuyến thành công.");
      onNavigate("stu-invoices");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        localStorage.setItem("unibus.paymentRouteId", String(action.routeId));
        localStorage.setItem(LAST_REGISTERED_ROUTE_CONTEXT_KEY, JSON.stringify({
          source: "journey-planner",
          routeId: action.routeId,
          boardingStopId: action.boardingStopId,
          alightingStopId: action.alightingStopId,
          journeyOptionId: journey.optionId,
          savedAt: new Date().toISOString(),
        }));
        onNavigate("stu-invoices");
        return;
      }
      setInlineError(error instanceof Error ? error.message : "Không thể đăng ký tuyến.");
    } finally {
      setRegistering(false);
    }
  };

  const registerRoutePreview = async () => {
    if (!routePreview) return;
    const stops = routePreview.stops || [];
    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];
    if (!firstStop || !lastStop || firstStop.stopId === lastStop.stopId) {
      setRouteActionError("Tuyến này chưa đủ dữ liệu trạm để đăng ký nhanh.");
      return;
    }

    setRouteRegistering(true);
    setRouteActionError("");
    try {
      await studentApi.registerRoute({
        routeId: routePreview.routeId,
        boardingStopId: firstStop.stopId,
        alightingStopId: lastStop.stopId,
      });
      localStorage.setItem("unibus.paymentRouteId", String(routePreview.routeId));
      localStorage.setItem(LAST_REGISTERED_ROUTE_CONTEXT_KEY, JSON.stringify({
        source: "route-lookup",
        routeId: routePreview.routeId,
        boardingStopId: firstStop.stopId,
        alightingStopId: lastStop.stopId,
        direction: routePreview.direction,
        savedAt: new Date().toISOString(),
      }));
      await ctx.reload();
      toast.success("Đăng ký tuyến thành công.");
      onNavigate("stu-invoices");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        localStorage.setItem("unibus.paymentRouteId", String(routePreview.routeId));
        localStorage.setItem(LAST_REGISTERED_ROUTE_CONTEXT_KEY, JSON.stringify({
          source: "route-lookup",
          routeId: routePreview.routeId,
          boardingStopId: firstStop.stopId,
          alightingStopId: lastStop.stopId,
          direction: routePreview.direction,
          savedAt: new Date().toISOString(),
        }));
        onNavigate("stu-invoices");
        return;
      }
      setRouteActionError(error instanceof Error ? error.message : "Không thể đăng ký tuyến.");
    } finally {
      setRouteRegistering(false);
    }
  };

  const filteredRoutes = useMemo(() => {
    const query = routeQuery.trim().toLowerCase();
    if (!query) return routes;
    return routes.filter((route) => (
      route.routeName.toLowerCase().includes(query)
      || (route.routeCode || "").toLowerCase().includes(query)
      || String(route.routeId).includes(query)
    ));
  }, [routeQuery, routes]);

  const mapStops = activeTab === "lookup" ? stopsFromRoute(routePreview) : stopsFromJourney(selectedJourney);
  const mapPolylines = activeTab === "lookup" ? polylinesFromRoute(routePreview) : polylinesFromJourney(selectedJourney);
  const mapColor = activeTab === "lookup"
    ? routeDirectionColor(routePreview)
    : selectedJourney?.routeBadges?.[0]?.colorHex || STUDENT_GREEN;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="min-w-0"
    >
      <div className="grid h-[calc(100dvh-128px)] min-h-[520px] min-w-0 grid-cols-1 overflow-hidden rounded-xl border border-outline-variant bg-surface xl:grid-cols-[460px_minmax(0,1fr)]">
        <aside className="relative z-[1000] flex min-h-0 flex-col border-r border-outline-variant bg-surface">
          <TopTabs
            active={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setShowJourneyDetail(false);
            }}
          />

          <AnimatePresence mode="wait">
            {activeTab === "lookup" ? (
              <motion.div
                key="lookup"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex min-h-0 flex-1 flex-col"
              >
                {selectedRoute && routePreview ? (
                  <RouteDetailPanel
                    preview={routePreview}
                    infoTab={routeInfoTab}
                    registering={routeRegistering}
                    actionError={routeActionError}
                    onInfoTabChange={setRouteInfoTab}
                    onBack={() => {
                      setSelectedRoute(null);
                      setRoutePreview(null);
                      setRouteDirection(undefined);
                      setRouteActionError("");
                    }}
                    onDirectionChange={setRouteDirection}
                    onRegister={() => void registerRoutePreview()}
                  />
                ) : (
                  <>
                    <div className="border-b border-outline-variant p-4">
                      <label className="relative block">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                        <Input
                          value={routeQuery}
                          onChange={(event) => setRouteQuery(event.target.value)}
                          className="h-12 rounded-lg border-outline-variant bg-surface-container-low pl-10 text-sm font-semibold shadow-none focus-visible:ring-primary"
                          placeholder="Tìm tuyến xe"
                        />
                      </label>
                      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                        <span>{routesLoading ? "Đang tải tuyến..." : `${filteredRoutes.length} tuyến hoạt động`}</span>
                        {routesError ? <span className="text-error">{routesError}</span> : null}
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 scrollbar-soft">
                      {routesLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <div key={index} className="h-28 animate-pulse rounded-lg bg-surface-container" />
                        ))
                      ) : filteredRoutes.length ? (
                        filteredRoutes.map((route) => (
                          <RouteLookupCard
                            key={route.routeId}
                            route={route}
                            selected={selectedRoute?.routeId === route.routeId}
                            onSelect={() => {
                              setSelectedRoute(route);
                              setRouteDirection(route.directions?.[0] ?? 0);
                              setRoutePreview(null);
                              setRouteActionError("");
                              setActiveTab("lookup");
                            }}
                          />
                        ))
                      ) : (
                        <div className="grid h-full min-h-72 place-items-center px-6 text-center">
                          <div>
                            <Route className="mx-auto size-8 text-outline" />
                            <p className="mt-3 text-sm font-bold text-on-surface">Không có tuyến phù hợp</p>
                            <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                              Thử tìm theo mã tuyến hoặc tên điểm đầu cuối.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ) : showJourneyDetail && selectedJourney ? (
              <motion.div
                key="planner-detail"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <JourneyPlanDetailPanel
                  option={selectedJourney}
                  registering={registering}
                  onBack={() => setShowJourneyDetail(false)}
                  onRegister={() => void registerSelected()}
                />
              </motion.div>
            ) : (
              <motion.div
                key="planner"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="relative z-[1200] border-b border-outline-variant p-4">
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                    <div className="grid gap-3">
                      <SearchField
                        kind="origin"
                        label="Điểm xuất phát"
                        value={originQuery}
                        selected={Boolean(origin)}
                        focused={focusedField === "origin"}
                        suggestions={originSuggestions}
                        gpsLoading={gpsLoading}
                        onValueChange={(value) => {
                          setOriginQuery(value);
                          setOrigin(null);
                          setShowJourneyDetail(false);
                        }}
                        onFocus={() => setFocusedField("origin")}
                        onBlur={() => window.setTimeout(
                          () => setFocusedField((current) => current === "origin" ? null : current),
                          120,
                        )}
                        onPick={(place) => pickPlace("origin", place)}
                        onGps={useGps}
                        onSubmit={() => void runJourneySearch(origin, destination)}
                      />
                      <SearchField
                        kind="destination"
                        label="Điểm kết thúc"
                        value={destinationQuery}
                        selected={Boolean(destination)}
                        focused={focusedField === "destination"}
                        suggestions={destinationSuggestions}
                        onValueChange={(value) => {
                          setDestinationQuery(value);
                          setDestination(null);
                          setShowJourneyDetail(false);
                        }}
                        onFocus={() => setFocusedField("destination")}
                        onBlur={() => window.setTimeout(
                          () => setFocusedField((current) => current === "destination" ? null : current),
                          120,
                        )}
                        onPick={(place) => pickPlace("destination", place)}
                        onSubmit={() => void runJourneySearch(origin, destination)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <MaxLegsControl
                      value={maxBusLegs}
                      onChange={(value) => {
                        setMaxBusLegs(value);
                        setShowJourneyDetail(false);
                        if (origin && destination) void runJourneySearch(origin, destination, value);
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void runJourneySearch(origin, destination)}
                    disabled={loading}
                    className="mt-4 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-[opacity,transform] hover:opacity-90 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
                    style={{ backgroundColor: STUDENT_INK, color: STUDENT_LIME }}
                  >
                    {loading ? <RefreshCw className="size-4 animate-spin" /> : <Search className="size-4" />}
                    Tìm tuyến
                  </button>
                  {inlineError ? (
                    <p role="alert" className="mt-2 text-xs font-semibold text-error">{inlineError}</p>
                  ) : null}
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 scrollbar-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-on-surface">Kết quả tìm đường</h2>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        {loading ? "Đang tìm..." : `${journeys.length} hành trình tốt nhất`}
                      </p>
                    </div>
                    <BusFront className="size-5 text-on-surface-variant" />
                  </div>

                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-24 animate-pulse rounded-lg bg-surface-container" />
                    ))
                  ) : journeys.length ? (
                    journeys.map((option, index) => (
                      <JourneyResultCard
                        key={option.optionId}
                        option={option}
                        index={index}
                        selected={selectedJourney?.optionId === option.optionId}
                        onSelect={() => {
                          setSelectedId(option.optionId);
                          setShowJourneyDetail(false);
                        }}
                        onDetails={() => {
                          setSelectedId(option.optionId);
                          setShowJourneyDetail(true);
                        }}
                      />
                    ))
                  ) : (
                    <div className="grid h-full min-h-72 place-items-center px-6 text-center">
                      <div>
                        <Route className="mx-auto size-8 text-outline" />
                        <p className="mt-3 text-sm font-bold text-on-surface">Chưa có lộ trình</p>
                        <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                          Chọn địa điểm từ gợi ý rồi bấm Tìm tuyến.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        <section className="grid min-h-0 min-w-0 bg-surface-container">
          <div className="relative min-h-0">
            <JourneyMap
              stops={mapStops}
              routeColor={mapColor}
              buses={[]}
              polylines={mapPolylines}
              height="100%"
              animateCamera
              allowFallbackPolyline={false}
            />
            {routePreviewLoading ? (
              <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface">
                Đang dựng tuyến...
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
