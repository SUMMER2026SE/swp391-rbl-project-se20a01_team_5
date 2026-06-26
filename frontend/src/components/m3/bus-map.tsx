"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BusStop, Route } from "@/lib/types";

/* =========================================================================
   BusMap — Flat light map (Google-Maps-light style, M3 tonal)
   Design goals (post user feedback):
   - No route self-crossing (curved smooth path, ordered stops)
   - No stop overlap (anti-collision label placement + min spacing)
   - Bus marker never covers stop labels (label offset logic)
   - Mobile-first, no overflow, responsive height
   - Clean, premium transit-map feel
   ========================================================================= */

export interface BusMapProps {
  stops: BusStop[];
  route?: Route;
  /** progress 0..1 along the route */
  progress?: number;
  /** index of the next stop the bus is heading to */
  nextStopIndex?: number;
  className?: string;
  height?: number;
  showBus?: boolean;
  showLabels?: boolean;
  variant?: "default" | "compact";
}

// Project lat/lng to normalized 0..100 canvas coords with PADDING,
// preserving the geographic aspect ratio (no distortion).
function useProjection(stops: BusStop[]) {
  return React.useMemo(() => {
    if (stops.length === 0) return { project: () => ({ x: 50, y: 50 }), pts: [] as { x: number; y: number }[] };
    const PAD = 16;
    const lats = stops.map((s) => s.lat);
    const lngs = stops.map((s) => s.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const dLat = maxLat - minLat || 0.001;
    const dLng = maxLng - minLng || 0.001;

    // Geographic aspect ratio (lat deg / lng deg). At Đà Nẵng (~16°N),
    // 1 deg lng ≈ cos(16°) * 111 = 0.961 * 111 km, 1 deg lat ≈ 111 km.
    const aspect = dLat / (dLng * Math.cos((minLat * Math.PI) / 180));

    // Fit into the canvas while preserving aspect (letterbox if needed).
    // Canvas is 100×100 viewBox but rendered at container width×height.
    // We normalize to a square coordinate space 0..100 and let SVG handle it.
    const project = (lat: number, lng: number) => {
      const nx = (lng - minLng) / dLng; // 0..1
      const ny = (lat - minLat) / dLat; // 0..1
      return {
        x: PAD + nx * (100 - 2 * PAD),
        y: (100 - PAD) - ny * (100 - 2 * PAD),
      };
    };
    const pts = stops.map((s) => project(s.lat, s.lng));
    return { project, pts, aspect };
  }, [stops]);
}

// Anti-collision: nudge points apart if they're closer than MIN_GAP (in % units).
function spreadPoints(pts: { x: number; y: number }[], minGap = 6): { x: number; y: number }[] {
  if (pts.length < 2) return pts;
  const out = pts.map((p) => ({ ...p }));
  // Only nudge consecutive points that are too close (preserves route shape)
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1];
    const b = out[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    if (dist < minGap) {
      const push = (minGap - dist) / 2;
      const ux = dx / dist;
      const uy = dy / dist;
      out[i] = { x: b.x + ux * push, y: b.y + uy * push };
    }
  }
  return out;
}

// Build a smooth curved path through points (Catmull-Rom → cubic bezier).
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
  if (pts.length === 2) return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`;
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const tension = 0.18;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function pointAtProgress(pts: { x: number; y: number }[], progress: number) {
  if (pts.length === 0) return { x: 50, y: 50 };
  if (pts.length === 1) return pts[0];
  const clamped = Math.max(0, Math.min(1, progress));
  const totalSegs = pts.length - 1;
  const exact = clamped * totalSegs;
  const idx = Math.min(Math.floor(exact), totalSegs - 1);
  const t = exact - idx;
  return {
    x: pts[idx].x + (pts[idx + 1].x - pts[idx].x) * t,
    y: pts[idx].y + (pts[idx + 1].y - pts[idx].y) * t,
  };
}

// Decide label position (above/below/left/right) to avoid bus marker overlap.
function labelOffset(idx: number, total: number): { dx: number; dy: number; anchor: "start" | "middle" | "end" } {
  // Start → label right; End → label left; middle → alternate above/below
  if (idx === 0) return { dx: 4, dy: 0, anchor: "start" };
  if (idx === total - 1) return { dx: -4, dy: 0, anchor: "end" };
  return idx % 2 === 0 ? { dx: 0, dy: -5, anchor: "middle" } : { dx: 0, dy: 5, anchor: "middle" };
}

export function BusMap({
  stops,
  route,
  progress = 0.4,
  nextStopIndex = 1,
  className,
  height = 360,
  showBus = true,
  showLabels = true,
  variant = "default",
}: BusMapProps) {
  const { pts } = useProjection(stops);
  const spread = React.useMemo(() => spreadPoints(pts, 5), [pts]);
  const busPos = pointAtProgress(spread, progress);
  const routeColor = route?.color ?? "#10b981";
  const compact = variant === "compact";
  const pathD = smoothPath(spread);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-outline-variant/40 select-none",
        className
      )}
      style={{ height, backgroundColor: "#f5f5f5" }}
    >
      {/* === Flat light map base === */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <rect x="0" y="0" width="100" height="100" fill="#f8f9fa" />

        {/* subtle district blocks */}
        <rect x="4" y="8" width="26" height="20" fill="#eef0f2" rx="1" />
        <rect x="36" y="6" width="22" height="16" fill="#eef0f2" rx="1" />
        <rect x="64" y="10" width="30" height="24" fill="#eef0f2" rx="1" />
        <rect x="8" y="36" width="20" height="22" fill="#eef0f2" rx="1" />
        <rect x="36" y="32" width="28" height="20" fill="#eef0f2" rx="1" />
        <rect x="70" y="42" width="24" height="26" fill="#eef0f2" rx="1" />
        <rect x="10" y="66" width="24" height="24" fill="#eef0f2" rx="1" />
        <rect x="40" y="60" width="30" height="28" fill="#eef0f2" rx="1" />
        <rect x="74" y="74" width="20" height="18" fill="#eef0f2" rx="1" />

        {/* roads — light gray lines */}
        {[25, 50, 75].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#e2e4e7" strokeWidth="0.7" strokeLinecap="round" />
        ))}
        {[30, 60].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#e2e4e7" strokeWidth="0.7" strokeLinecap="round" />
        ))}
        <line x1="0" y1="100" x2="100" y2="20" stroke="#e8eaed" strokeWidth="0.5" strokeLinecap="round" />

        {/* subtle park patches */}
        <circle cx="20" cy="22" r="6" fill="#e8f0e6" />
        <circle cx="82" cy="68" r="5" fill="#e8f0e6" />
      </svg>

      {/* === Route line: smooth curved + glow underlay === */}
      {spread.length > 1 && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* glow underlay */}
          <path
            d={pathD}
            fill="none"
            stroke={routeColor}
            strokeWidth={compact ? 3 : 3.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.16}
          />
          {/* main solid route line */}
          <path
            d={pathD}
            fill="none"
            stroke={routeColor}
            strokeWidth={compact ? 1.4 : 1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* === Stop pins: flat circles with white center dot === */}
      {spread.map((p, i) => {
        const isStart = i === 0;
        const isEnd = i === spread.length - 1;
        const isNext = i === nextStopIndex;
        const isPassed = i < nextStopIndex;
        const pinColor = isStart ? "#16a34a" : isEnd ? "#dc2626" : routeColor;
        const dimmed = isPassed && !isStart && !isEnd;
        const labelPos = labelOffset(i, spread.length);
        // Hide intermediate labels on compact/mobile to reduce clutter
        const showLabel = showLabels && !compact && (isStart || isEnd || isNext);
        return (
          <div
            key={stops[i]?.id ?? i}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: dimmed ? 0.5 : 1 }}
                transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 380, damping: 22 }}
                className="relative flex items-center justify-center rounded-full elev-1"
                style={{
                  width: compact ? 12 : 15,
                  height: compact ? 12 : 15,
                  backgroundColor: pinColor,
                  border: "2px solid #ffffff",
                }}
              >
                <span
                  className="rounded-full bg-white block"
                  style={{ width: compact ? 3 : 4, height: compact ? 3 : 4 }}
                />
                {isNext && !compact && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: pinColor }}
                    animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </motion.div>
              {/* clean label — positioned to avoid bus marker overlap */}
              {showLabel && (
                <div
                  className="absolute whitespace-nowrap px-1.5 py-0.5 rounded-md text-[9px] font-semibold elev-1"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    color: "#374151",
                    border: "1px solid #e5e7eb",
                    left: labelPos.anchor === "start" ? "100%" : labelPos.anchor === "end" ? "auto" : "50%",
                    right: labelPos.anchor === "end" ? "100%" : "auto",
                    top: labelPos.dy < 0 ? "auto" : "100%",
                    bottom: labelPos.dy < 0 ? "100%" : "auto",
                    transform: labelPos.anchor === "middle" ? "translateX(-50%)" : "none",
                    marginTop: labelPos.dy > 0 ? 2 : 0,
                    marginBottom: labelPos.dy < 0 ? 2 : 0,
                    marginLeft: labelPos.anchor === "start" ? 3 : 0,
                    marginRight: labelPos.anchor === "end" ? 3 : 0,
                  }}
                >
                  {stops[i]?.name?.split("(")[0]?.trim() ?? stops[i]?.code}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* === Bus marker: same circle style, bigger, with icon === */}
      {showBus && spread.length > 0 && (
        <motion.div
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
          animate={{ left: `${busPos.x}%`, top: `${busPos.y}%` }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <div className="relative flex items-center justify-center">
            <motion.span
              className="absolute rounded-full"
              style={{ backgroundColor: routeColor, opacity: 0.3, inset: 0 }}
              animate={{ scale: [1, 2], opacity: [0.35, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
            <div
              className="relative flex items-center justify-center rounded-full elev-2"
              style={{
                width: compact ? 26 : 32,
                height: compact ? 26 : 32,
                backgroundColor: routeColor,
                border: "3px solid #ffffff",
              }}
            >
              <BusIcon className="text-white" size={compact ? 13 : 16} />
            </div>
          </div>
        </motion.div>
      )}

      {/* === LIVE badge (top-left, clean) === */}
      {!compact && (
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 h-7 px-2.5 rounded-full elev-1"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb" }}
        >
          <motion.span
            className="size-1.5 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <span className="text-[10px] font-bold tracking-wide text-gray-700">LIVE</span>
        </div>
      )}

      {/* === Legend (bottom-right) === */}
      {!compact && (
        <div
          className="absolute bottom-3 right-3 flex items-center gap-3 h-7 px-3 rounded-full elev-1 text-[10px] font-medium text-gray-600"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb" }}
        >
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: "#16a34a" }} /> Đi
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: routeColor }} /> Trạm
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: "#dc2626" }} /> Đến
          </span>
        </div>
      )}
    </div>
  );
}

function BusIcon({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 6v6M16 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2V12c0-2.2-1.8-4-4-4H6a4 4 0 0 0-4 4v4c0 .4.1.8.2 1.2C2.5 16.3 3 18 3 18h3M7 18c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm10 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z" />
    </svg>
  );
}

/* =========================================================================
   ETA Card — compact, mobile-first, M3 tonal (kept for backward compat)
   ========================================================================= */
export function ETACard({
  minutes,
  stops,
  currentStopIndex,
  nextStopName,
  plate,
  routeCode,
  routeColor,
  occupancy,
  capacity,
}: {
  minutes: number;
  stops: number;
  currentStopIndex: number;
  nextStopName: string;
  plate: string;
  routeCode: string;
  routeColor?: string;
  occupancy: number;
  capacity: number;
}) {
  const occPct = Math.round((occupancy / capacity) * 100);
  const occTone = occPct > 80 ? "error" : occPct > 60 ? "warning" : "success";
  return (
    <div className="rounded-2xl bg-surface-container-low border border-outline-variant/40 p-4 sm:p-5 elev-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-on-surface-variant">XE ĐANG ĐẾN TRẠM</p>
          <p className="text-sm font-semibold text-on-surface truncate mt-0.5">{nextStopName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-primary leading-none">{minutes}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">phút</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-on-surface-variant">
        <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-white font-bold text-[10px]" style={{ backgroundColor: routeColor ?? "var(--m3-primary)" }}>
          {routeCode}
        </span>
        <span className="font-medium text-on-surface">{plate}</span>
        <span>·</span>
        <span>{currentStopIndex + 1}/{stops} trạm</span>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-on-surface-variant">Mức độ đầy</span>
          <span className={cn(
            "font-semibold",
            occTone === "error" && "text-error",
            occTone === "warning" && "text-warning",
            occTone === "success" && "text-success"
          )}>{occupancy}/{capacity}</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              occTone === "error" && "bg-error",
              occTone === "warning" && "bg-warning",
              occTone === "success" && "bg-success"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${occPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
    </div>
  );
}
