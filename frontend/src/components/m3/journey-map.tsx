"use client";

// =============================================================================
// JourneyMap — UniBus UX Refactor
// ----------------------------------------------------------------------------
// Bản đồ tương tác kiểu "Google Maps / Citymapper" dựa trên Leaflet + OSM.
// Giữ ngôn ngữ thiết kế UniBus (màu lime #beff50, dark #14140f, blue #144fcc,
// coral #ff8c5f) — KHÔNG thay đổi DESIGN.md.
//
// Tính năng (theo newprompt.md):
//   - Animated route drawing (vẽ polyline theo animation stroke-dashoffset)
//   - Moving bus icons (interpolation mượt giữa các trạm)
//   - Animated walking path (đường nét đứt, animation dashes)
//   - Arrival countdown overlay (text overlay trên map)
//   - Interactive bus stops (click → popup với thông tin trạm)
//   - Interactive buses (click → popup với thông tin xe + ETA)
//   - Camera animation khi chọn route khác (map.flyTo / fitBounds với animation)
//
// Performance: memo + will-change, chỉ cập nhật bus marker khi progress đổi.
// SSR-safe: load Leaflet động trong useEffect.
// =============================================================================

import * as React from "react";
import { cn } from "@/lib/utils";
import type { BusStop } from "@/lib/types";

let L: typeof import("leaflet") | null = null;
async function loadLeaflet() {
  if (L) return L;
  await import("leaflet/dist/leaflet.css");
  L = await import("leaflet");
  return L;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JourneyBus {
  id: string;
  routeCode: string;
  routeColor: string;
  plate: string;
  lat: number;
  lng: number;
  /** Tiến độ 0..1 trên tuyến. */
  progress?: number;
  etaMinutes?: number;
  occupancy?: number;
  capacity?: number;
  driverName?: string;
}

export interface JourneyWalkSegment {
  /** Index trong mảng stops: điểm bắt đầu walk. */
  fromIdx: number;
  /** Index trong mảng stops: điểm kết thúc walk. */
  toIdx: number;
  /** Khoảng cách đi bộ (m). */
  distanceM?: number;
  /** Thời gian đi bộ (phút). */
  durationMin?: number;
}

export interface JourneyExtraMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  tone?: "current" | "destination";
}

export interface JourneyPolyline {
  id: string;
  points: Array<{ lat: number; lng: number }>;
  color?: string;
  dashed?: boolean;
  label?: string;
}

export interface JourneyMapProps {
  /** Danh sách trạm theo thứ tự hành trình (đã được slice). */
  stops: BusStop[];
  /** Tuyến (cho color + code). */
  routeColor?: string;
  /** Tiến độ của xe hiện tại 0..1. */
  progress?: number;
  /** Index trạm kế tiếp (highlight). */
  nextStopIndex?: number;
  /** Danh sách xe chạy trên tuyến. */
  buses?: JourneyBus[];
  /** Các đoạn đi bộ (transfer giữa 2 tuyến / từ vị trí hiện tại đến trạm). */
  walkSegments?: JourneyWalkSegment[];
  /** Marker ngoài stop list: vị trí hiện tại, điểm đến ngoài trạm. */
  extraMarkers?: JourneyExtraMarker[];
  /** Polyline tùy biến: đi bộ từ GPS đến trạm, trạm xuống đến điểm đến. */
  walkPolylines?: JourneyPolyline[];
  /** Callback khi click vào trạm. */
  onSelectStop?: (stopId: string) => void;
  /** Callback khi click vào xe. */
  onSelectBus?: (busId: string) => void;
  /** Chiều cao. */
  height?: number | string;
  /** Custom className. */
  className?: string;
  /** Khi true: fit bounds khi stops thay đổi (mặc định). */
  fitOnStopsChange?: boolean;
  /** Khi true: dùng camera animation (flyTo) thay vì fitBounds tức thì. */
  animateCamera?: boolean;
  /** Card overlay ETA (text) — hiển thị góc trên-phải. */
  arrivalOverlay?: React.ReactNode;
  /** Bật/tắt chế độ "compact" (mobile). */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Icon factories
// ---------------------------------------------------------------------------

function makeStopIcon(
  Lmod: typeof import("leaflet"),
  color: string,
  label: string,
  variant: "start" | "end" | "next" | "normal",
) {
  const sizeMap = { start: 28, end: 28, next: 24, normal: 18 };
  const size = sizeMap[variant];
  const ring =
    variant === "next"
      ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};opacity:0.5;animation:unibus-ping 1.6s ease-out infinite;"></div>`
      : "";
  const innerDot =
    variant === "start" || variant === "end"
      ? `<span style="width:8px;height:8px;border-radius:50%;background:#fff;"></span>`
      : variant === "next"
        ? `<span style="width:6px;height:6px;border-radius:50%;background:${color};"></span>`
        : `<span style="width:5px;height:5px;border-radius:50%;background:#fff;"></span>`;
  const labelHtml = label
    ? `<div style="position:absolute;top:100%;left:50%;transform:translateX(-50%);white-space:nowrap;background:#fff;color:#14140f;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;border:1.5px solid #14140f;box-shadow:0 2px 6px rgba(0,0,0,.15);margin-top:4px;pointer-events:none;max-width:180px;overflow:hidden;text-overflow:ellipsis;">${label}</div>`
    : "";
  const html = `<div style="position:relative;width:${size}px;height:${size}px;cursor:pointer;">
    ${ring}
    <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;transition:transform .15s;">
      ${innerDot}
    </div>
    ${labelHtml}
  </div>`;
  return Lmod.divIcon({
    html,
    className: "journey-stop-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function makeBusIcon(
  Lmod: typeof import("leaflet"),
  color: string,
  routeCode: string,
  isActive: boolean,
) {
  const size = 42;
  const glow = isActive
    ? `<div style="position:absolute;inset:-8px;border-radius:50%;background:${color};opacity:0.35;filter:blur(3px);animation:unibus-pulse 1.4s ease-in-out infinite;"></div>`
    : `<div style="position:absolute;inset:-4px;border-radius:50%;background:${color};opacity:0.22;filter:blur(2px);"></div>`;
  const html = `<div style="position:relative;width:${size}px;height:${size}px;will-change:transform;cursor:pointer;">
    ${glow}
    <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6M16 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2V12c0-2.2-1.8-4-4-4H6a4 4 0 0 0-4 4v4c0 .4.1.8.2 1.2C2.5 16.3 3 18 3 18h3M7 18c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm10 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/>
      </svg>
    </div>
    <div style="position:absolute;top:-2px;left:50%;transform:translateX(-50%);background:#14140f;color:#beff50;font-size:9px;font-weight:800;padding:1px 6px;border-radius:4px;border:1.5px solid #beff50;white-space:nowrap;">${routeCode}</div>
  </div>`;
  return Lmod.divIcon({
    html,
    className: "journey-bus-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function pointAtProgress(stops: BusStop[], progress: number): { lat: number; lng: number } {
  if (stops.length === 0) return { lat: 16.07, lng: 108.15 };
  if (stops.length === 1) return { lat: stops[0].lat, lng: stops[0].lng };
  const clamped = Math.max(0, Math.min(1, progress));
  const totalSegs = stops.length - 1;
  const exact = clamped * totalSegs;
  const idx = Math.min(Math.floor(exact), totalSegs - 1);
  const t = exact - idx;
  return {
    lat: stops[idx].lat + (stops[idx + 1].lat - stops[idx].lat) * t,
    lng: stops[idx].lng + (stops[idx + 1].lng - stops[idx].lng) * t,
  };
}

// ---------------------------------------------------------------------------
// CSS keyframes — inject once on module load
// ---------------------------------------------------------------------------

const STYLE_ID = "unibus-journey-map-styles";
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes unibus-ping {
  0% { transform: scale(1); opacity: 0.5; }
  70%, 100% { transform: scale(1.8); opacity: 0; }
}
@keyframes unibus-pulse {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}
@keyframes unibus-route-draw {
  from { stroke-dashoffset: 100%; }
  to { stroke-dashoffset: 0; }
}
.journey-route-line {
  stroke-dasharray: 100%;
  stroke-dashoffset: 100%;
  animation: unibus-route-draw 1.4s ease-out forwards;
}
.journey-walk-line {
  stroke-dasharray: 8 6;
  animation: unibus-walk-march 0.9s linear infinite;
}
@keyframes unibus-walk-march {
  to { stroke-dashoffset: -14; }
}
.journey-stop-pin:hover > div > div:first-child,
.journey-bus-pin:hover > div > div:nth-child(2) {
  transform: scale(1.1);
}
.leaflet-popup-content-wrapper {
  border-radius: 16px !important;
  background: #14140f !important;
  color: #fff !important;
  border: 1.5px solid #beff50 !important;
  box-shadow: 0 8px 24px rgba(0,0,0,.25) !important;
}
.leaflet-popup-content {
  margin: 12px 16px !important;
  font-family: inherit !important;
  font-size: 13px !important;
}
.leaflet-popup-tip {
  background: #14140f !important;
}
.leaflet-container {
  font-family: inherit !important;
  background: #e8e9eb !important;
}
`;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = css;
  document.head.appendChild(el);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const JourneyMap = React.memo(function JourneyMap({
  stops,
  routeColor = "#144fcc",
  progress = 0.3,
  nextStopIndex = 1,
  buses = [],
  walkSegments = [],
  extraMarkers = [],
  walkPolylines = [],
  onSelectStop,
  onSelectBus,
  height = 480,
  className,
  fitOnStopsChange = true,
  animateCamera = true,
  arrivalOverlay,
  compact = false,
}: JourneyMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const layersRef = React.useRef<any[]>([]);
  const busMarkersRef = React.useRef<Map<string, any>>(new Map());
  const animationFrameRef = React.useRef<number | null>(null);

  // ---- Init map once ----
  React.useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((Lmod) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      ensureStyles();
      const map = Lmod.map(containerRef.current, {
        center: [16.07, 108.14],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        preferCanvas: true,
      });
      Lmod.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        crossOrigin: true,
      }).addTo(map);
      Lmod.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
      mapRef.current._L = Lmod;
      setTimeout(() => map.invalidateSize(), 200);
    });
    return () => {
      cancelled = true;
      const animFrame = animationFrameRef.current;
      if (animFrame) cancelAnimationFrame(animFrame);
      const map = mapRef.current;
      const busMarkers = busMarkersRef.current;
      if (map) {
        map.remove();
        mapRef.current = null;
        layersRef.current = [];
        busMarkers.clear();
      }
    };
  }, []);

  // ---- Render stops + route + walking segments when stops change ----
  React.useEffect(() => {
    const map = mapRef.current;
    const Lmod = map?._L as typeof import("leaflet") | undefined;
    if (!map || !Lmod || stops.length === 0) return;

    // Clear old layers
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];
    busMarkersRef.current.clear();

    // Route polyline (with glow underlay)
    if (stops.length > 1) {
      const latlngs = stops.map((s) => [s.lat, s.lng] as [number, number]);
      const glow = Lmod.polyline(latlngs, {
        color: routeColor,
        weight: 12,
        opacity: 0.15,
        lineCap: "round",
      }).addTo(map);
      const main = Lmod.polyline(latlngs, {
        color: routeColor,
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        className: "journey-route-line",
      }).addTo(map);
      layersRef.current.push(glow, main);
    }

    // Walking segments (dashed animated)
    (walkSegments || []).forEach((w) => {
      if (w.fromIdx == null || w.toIdx == null) return;
      const a = stops[w.fromIdx];
      const b = stops[w.toIdx];
      if (!a || !b) return;
      const walkLine = Lmod.polyline(
        [
          [a.lat, a.lng],
          [b.lat, b.lng],
        ],
        {
          color: "#14140f",
          weight: 3,
          opacity: 0.7,
          dashArray: "8 6",
          className: "journey-walk-line",
          lineCap: "round",
        },
      ).addTo(map);
      layersRef.current.push(walkLine);
    });

    walkPolylines.forEach((line) => {
      if (!line.points || line.points.length < 2) return;
      const walkLine = Lmod.polyline(
        line.points.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: line.color || "#14140f",
          weight: 3,
          opacity: 0.75,
          dashArray: line.dashed === false ? undefined : "8 6",
          className: "journey-walk-line",
          lineCap: "round",
        },
      ).addTo(map);
      if (line.label) {
        walkLine.bindPopup(`<div style="font-size:13px;font-weight:800;color:#fff;">${line.label}</div>`);
      }
      layersRef.current.push(walkLine);
    });

    // Stop markers
    stops.forEach((s, i) => {
      const isStart = i === 0;
      const isEnd = i === stops.length - 1;
      const isNext = i === nextStopIndex;
      const color = isStart ? "#16a34a" : isEnd ? "#dc2626" : routeColor;
      const variant: "start" | "end" | "next" | "normal" = isStart
        ? "start"
        : isEnd
          ? "end"
          : isNext
            ? "next"
            : "normal";
      const label = isStart || isEnd || isNext ? s.name : "";
      const marker = Lmod.marker([s.lat, s.lng], {
        icon: makeStopIcon(Lmod, color, label, variant),
        zIndexOffset: isStart || isEnd ? 600 : isNext ? 500 : 100,
      }).addTo(map);
      marker.bindPopup(
        `<div style="min-width:180px;">
          <div style="font-size:11px;font-weight:700;color:#beff50;text-transform:uppercase;letter-spacing:.04em;">${isStart ? "Điểm lên" : isEnd ? "Điểm xuống" : "Trạm dừng"}</div>
          <div style="font-size:15px;font-weight:800;margin-top:2px;color:#fff;">${s.name}</div>
          <div style="font-size:11px;color:#fff/80;margin-top:4px;opacity:.75;">${s.address || "— · " + s.code}</div>
          <div style="font-size:11px;color:#fff;opacity:.6;margin-top:6px;">${s.routes?.length ?? 0} tuyến đi qua</div>
        </div>`,
      );
      marker.on("click", () => onSelectStop?.(s.id));
      layersRef.current.push(marker);
    });

    extraMarkers.forEach((markerInfo) => {
      if (typeof markerInfo.lat !== "number" || typeof markerInfo.lng !== "number") return;
      const isCurrent = markerInfo.tone === "current";
      const color = isCurrent ? "#144fcc" : "#ff8c5f";
      const marker = Lmod.marker([markerInfo.lat, markerInfo.lng], {
        icon: Lmod.divIcon({
          className: "",
          html: `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.25);">
              ${isCurrent ? '<div style="position:absolute;inset:-7px;border-radius:50%;background:#144fcc33;animation:unibus-ping 1.8s ease-out infinite;"></div>' : ""}
              <span style="position:relative;width:8px;height:8px;border-radius:50%;background:#fff;"></span>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        zIndexOffset: isCurrent ? 900 : 850,
      }).addTo(map);
      marker.bindPopup(
        `<div style="min-width:150px;">
          <div style="font-size:11px;font-weight:700;color:#beff50;text-transform:uppercase;letter-spacing:.04em;">${isCurrent ? "Vị trí của bạn" : "Điểm đến"}</div>
          <div style="font-size:14px;font-weight:800;margin-top:2px;color:#fff;">${markerInfo.label}</div>
        </div>`,
      );
      layersRef.current.push(marker);
    });

    // Bus markers
    (buses || []).forEach((bus) => {
      if (typeof bus.lat !== "number" || typeof bus.lng !== "number") return;
      const marker = Lmod.marker([bus.lat, bus.lng], {
        icon: makeBusIcon(Lmod, bus.routeColor || routeColor, bus.routeCode, true),
        zIndexOffset: 1000,
      }).addTo(map);
      const occ =
        bus.occupancy != null && bus.capacity
          ? `${bus.occupancy}/${bus.capacity}`
          : "—";
      marker.bindPopup(
        `<div style="min-width:200px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="background:${bus.routeColor || routeColor};color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;">${bus.routeCode}</span>
            <span style="font-size:11px;color:#beff50;font-weight:700;">ĐANG CHẠY</span>
          </div>
          <div style="font-size:14px;font-weight:800;margin-top:6px;color:#fff;">Biển số ${bus.plate}</div>
          <div style="font-size:11px;color:#fff;opacity:.8;margin-top:4px;">Mật độ: ${occ}</div>
          ${bus.etaMinutes != null ? `<div style="font-size:13px;font-weight:800;color:#beff50;margin-top:6px;">Đến trạm: ${bus.etaMinutes} phút</div>` : ""}
          ${bus.driverName ? `<div style="font-size:11px;color:#fff;opacity:.7;margin-top:4px;">Tài xế: ${bus.driverName}</div>` : ""}
        </div>`,
      );
      marker.on("click", () => onSelectBus?.(bus.id));
      busMarkersRef.current.set(bus.id, marker);
      layersRef.current.push(marker);
    });

    // Fit bounds
    if (stops.length > 1 && fitOnStopsChange) {
      const bounds = Lmod.latLngBounds([
        ...stops.map((s) => [s.lat, s.lng] as [number, number]),
        ...extraMarkers.map((m) => [m.lat, m.lng] as [number, number]),
        ...walkPolylines.flatMap((line) => line.points.map((p) => [p.lat, p.lng] as [number, number])),
      ]);
      if (animateCamera) {
        // Đệm padding để camera "bay" mượt
        map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 1.2 });
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [stops, routeColor, nextStopIndex, buses, walkSegments, extraMarkers, walkPolylines, fitOnStopsChange, animateCamera, onSelectStop, onSelectBus]);

  // ---- Animate bus markers (smooth interpolation) ----
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || stops.length === 0 || buses.length === 0) return;
    const busMarkers = busMarkersRef.current;

    let raf = 0;
    const start = performance.now();
    const durationMs = 1500; // 1.5s smooth glide

    const tick = (nowTs: number) => {
      const t = Math.min(1, (nowTs - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      buses.forEach((bus) => {
        const marker = busMarkers.get(bus.id);
        if (!marker) return;
        const p = bus.progress ?? progress;
        const target = pointAtProgress(stops, p);
        // Lấy vị trí hiện tại của marker
        const cur = marker.getLatLng();
        const lat = cur.lat + (target.lat - cur.lat) * eased * 0.3;
        const lng = cur.lng + (target.lng - cur.lng) * eased * 0.3;
        marker.setLatLng([lat, lng]);
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress, stops, buses]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border-2 border-[#14140f]/15 bg-[#e8e9eb]",
        className,
      )}
      style={{ height, zIndex: 0 }}
      role="application"
      aria-label="Bản đồ hành trình UniBus"
    >
      {/* LIVE badge */}
      <div className="absolute top-3 left-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-[#14140f] px-3 py-1.5 text-[10px] font-bold text-[#beff50] shadow-lg">
        <span className="size-1.5 rounded-full bg-[#beff50] animate-pulse" />
        LIVE
      </div>
      {/* Arrival countdown overlay (top-right) */}
      {arrivalOverlay && (
        <div className="absolute top-3 right-3 z-[500] max-w-[260px]">{arrivalOverlay}</div>
      )}
      {/* Legend (bottom-left) */}
      {!compact && (
        <div className="absolute bottom-3 left-3 z-[500] flex flex-col gap-1 rounded-2xl bg-white/95 px-3 py-2 text-[10px] font-semibold text-[#14140f] shadow-md backdrop-blur">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#16a34a]" /> Điểm lên
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#dc2626]" /> Điểm xuống
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: routeColor }} /> Trạm dừng
          </span>
        </div>
      )}
    </div>
  );
});
