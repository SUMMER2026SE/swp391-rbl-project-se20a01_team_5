"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { BusStop } from "@/lib/types";

let leafletModule: typeof import("leaflet") | null = null;

async function loadLeaflet() {
  if (leafletModule) return leafletModule;
  await import("leaflet/dist/leaflet.css");
  leafletModule = await import("leaflet");
  return leafletModule;
}

export interface JourneyBus {
  id: string;
  routeCode: string;
  routeColor: string;
  plate: string;
  lat: number;
  lng: number;
  progress?: number;
  etaMinutes?: number;
  occupancy?: number;
  capacity?: number;
  driverName?: string;
}

export interface JourneyWalkSegment {
  fromIdx: number;
  toIdx: number;
  distanceM?: number;
  durationMin?: number;
}

export interface JourneyExtraMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  tone?: "user" | "nearest" | "selected" | "boarding" | "destination" | "current";
}

export interface JourneyPolyline {
  id: string;
  points: Array<{ lat: number; lng: number }>;
  color?: string;
  dashed?: boolean;
  label?: string;
}

export interface JourneyMapProps {
  stops: BusStop[];
  routeColor?: string;
  progress?: number;
  nextStopIndex?: number;
  buses?: JourneyBus[];
  walkSegments?: JourneyWalkSegment[];
  extraMarkers?: JourneyExtraMarker[];
  polylines?: JourneyPolyline[];
  /** Kept for existing callers. New journey screens should use `polylines`. */
  walkPolylines?: JourneyPolyline[];
  onSelectStop?: (stopId: string) => void;
  onSelectBus?: (busId: string) => void;
  height?: number | string;
  className?: string;
  fitOnStopsChange?: boolean;
  animateCamera?: boolean;
  arrivalOverlay?: React.ReactNode;
  compact?: boolean;
  allowFallbackPolyline?: boolean;
  scrollWheelZoom?: boolean;
}

const STYLE_ID = "unibus-journey-map-styles-v2";

function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .unibus-journey-map .leaflet-control-zoom {
      overflow: hidden;
      border: 1px solid rgba(20, 20, 15, .12) !important;
      border-radius: 10px !important;
      box-shadow: none !important;
    }
    .unibus-journey-map .leaflet-control-zoom a {
      display: grid;
      width: 38px !important;
      height: 38px !important;
      place-items: center;
      border: 0 !important;
      border-bottom: 1px solid rgba(20, 20, 15, .08) !important;
      background: rgba(255, 255, 255, .96) !important;
      color: #14140f !important;
      font: 500 21px/1 system-ui, sans-serif !important;
    }
    .unibus-journey-map .leaflet-control-zoom a:last-child {
      border-bottom: 0 !important;
    }
    .unibus-journey-map .leaflet-control-attribution {
      padding: 2px 6px !important;
      background: rgba(255, 255, 255, .84) !important;
      font-size: 9px !important;
    }
    .unibus-journey-map .leaflet-popup-content-wrapper {
      border: 1px solid rgba(20, 20, 15, .1);
      border-radius: 10px;
      background: #fff;
      color: #14140f;
      box-shadow: none;
    }
    .unibus-journey-map .leaflet-popup-content {
      margin: 12px 14px;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.35;
    }
    .unibus-journey-map .leaflet-popup-tip {
      background: #fff;
    }
    .unibus-journey-map .leaflet-container {
      background: #e8efec;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      outline: none;
      pointer-events: auto;
      touch-action: pan-x pan-y pinch-zoom;
    }
    .unibus-journey-map .leaflet-control-container,
    .unibus-journey-map .leaflet-control,
    .unibus-journey-map .leaflet-control a {
      pointer-events: auto;
    }
    .unibus-map-popup {
      min-width: 176px;
      max-width: 260px;
      color: #14140f;
    }
    .unibus-map-popup__eyebrow {
      color: #66706b;
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0;
    }
    .unibus-map-popup__title {
      margin-top: 4px;
      color: #14140f;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.3;
    }
    .unibus-map-popup__meta {
      margin-top: 4px;
      color: #66706b;
      font-size: 11px;
      font-weight: 450;
      line-height: 1.35;
    }
    .unibus-map-popup__row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .unibus-map-popup__badge {
      border-radius: 6px;
      padding: 3px 7px;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      line-height: 1.2;
    }
    .unibus-map-marker {
      background: transparent !important;
      border: 0 !important;
    }
    @media (prefers-reduced-motion: reduce) {
      .unibus-journey-map * {
        scroll-behavior: auto !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function endpointIcon(
  L: typeof import("leaflet"),
  tone: "origin" | "destination",
) {
  const color = tone === "origin" ? "#16803c" : "#dc3f36";
  const glyph = tone === "origin"
    ? `<span style="width:8px;height:8px;border-radius:50%;background:#fff"></span>`
    : `<span style="width:8px;height:8px;border-radius:2px;background:#fff"></span>`;
  return L.divIcon({
    className: "unibus-map-marker",
    html: `
      <div style="display:grid;width:30px;height:30px;place-items:center;border-radius:50%;background:${color};border:3px solid #fff">
        ${glyph}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function stopIcon(L: typeof import("leaflet"), color: string, highlighted: boolean) {
  const size = highlighted ? 16 : 12;
  return L.divIcon({
    className: "unibus-map-marker",
    html: `
      <div style="display:grid;width:${size}px;height:${size}px;place-items:center;border-radius:50%;background:#fff;border:${highlighted ? 4 : 3}px solid ${color}">
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function extraMarkerIcon(
  L: typeof import("leaflet"),
  tone: JourneyExtraMarker["tone"],
) {
  const palette = {
    user: { color: "#14140f", halo: "#BDFD4F" },
    nearest: { color: "#166534", halo: "#DCFCE7" },
    selected: { color: "#14140f", halo: "#F8F6EF" },
    boarding: { color: "#16803c", halo: "#BDFD4F" },
    destination: { color: "#dc3f36", halo: "#fff" },
    current: { color: "#087f5b", halo: "#BDFD4F" },
  } as const;
  const { color, halo } = palette[tone || "current"];
  return L.divIcon({
    className: "unibus-map-marker",
    html: `
      <div style="display:grid;width:30px;height:30px;place-items:center;border-radius:50%;background:${halo};border:3px solid #fff">
        <span style="width:7px;height:7px;border-radius:50%;background:${color}"></span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function vehicleIcon(
  L: typeof import("leaflet"),
  color: string,
  routeCode: string,
) {
  return L.divIcon({
    className: "unibus-map-marker",
    html: `
      <div style="position:relative;display:grid;width:42px;height:42px;place-items:center;border-radius:999px;background:#fff;border:3px solid ${color};box-shadow:0 8px 20px rgba(20,20,15,.28)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="display:block;color:${color}">
          <path d="M6.5 17.5h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path d="M7.5 19.5h.01M16.5 19.5h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          <path d="M6 7.5C6 5.57 7.57 4 9.5 4h5C16.43 4 18 5.57 18 7.5v8.25c0 .69-.56 1.25-1.25 1.25h-9.5C6.56 17 6 16.44 6 15.75V7.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          <path d="M8 9h8M8 13h2M14 13h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span style="position:absolute;right:-6px;bottom:-4px;min-width:22px;height:18px;border-radius:999px;background:${color};border:2px solid #fff;color:#fff;display:flex;align-items:center;justify-content:center;padding:0 5px;font:800 9px/1 system-ui,sans-serif">${escapeHtml(routeCode)}</span>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function validPoint(point: { lat: number; lng: number }) {
  return Number.isFinite(point.lat)
    && Number.isFinite(point.lng)
    && Math.abs(point.lat) <= 90
    && Math.abs(point.lng) <= 180;
}

export const JourneyMap = React.memo(function JourneyMap({
  stops,
  routeColor = "#144fcc",
  nextStopIndex = -1,
  buses = [],
  walkSegments = [],
  extraMarkers = [],
  polylines = [],
  walkPolylines = [],
  onSelectStop,
  onSelectBus,
  height = 480,
  className,
  fitOnStopsChange = true,
  animateCamera = true,
  arrivalOverlay,
  allowFallbackPolyline = true,
  scrollWheelZoom = true,
}: JourneyMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const routeLayerRef = React.useRef<any>(null);
  const vehicleLayerRef = React.useRef<any>(null);
  const lastGeometryKeyRef = React.useRef("");
  const fitFrameRef = React.useRef(0);
  const [mapReadyToken, setMapReadyToken] = React.useState(0);

  const effectivePolylines = polylines.length ? polylines : walkPolylines;

  React.useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let resizeFrame = 0;
    let lastWidth = 0;
    let lastHeight = 0;

    loadLeaflet().then((L) => {
      if (disposed || !containerRef.current || mapRef.current) return;
      ensureStyles();

      const map = L.map(containerRef.current, {
        center: [16.0544, 108.2022],
        zoom: 12,
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        dragging: true,
        zoomSnap: 0.5,
        wheelPxPerZoomLevel: 90,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 9,
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
        crossOrigin: true,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      vehicleLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      resizeObserver = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect;
        if (!rect) return;
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        if (Math.abs(width - lastWidth) < 4 && Math.abs(height - lastHeight) < 4) return;
        lastWidth = width;
        lastHeight = height;
        if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
          resizeFrame = 0;
          if (!disposed) map.invalidateSize({ pan: false, debounceMoveend: true });
        });
      });
      resizeObserver.observe(containerRef.current);

      window.requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
        setMapReadyToken((value) => value + 1);
      });
    });

    return () => {
      disposed = true;
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      if (fitFrameRef.current) window.cancelAnimationFrame(fitFrameRef.current);
      resizeObserver?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      routeLayerRef.current = null;
      vehicleLayerRef.current = null;
      lastGeometryKeyRef.current = "";
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    const L = leafletModule;
    if (!map || !routeLayer || !L || mapReadyToken === 0) return;

    routeLayer.clearLayers();

    const cleanStops = stops.filter((stop) => validPoint(stop));
    const cleanPolylines = effectivePolylines
      .map((line) => ({ ...line, points: line.points.filter(validPoint) }))
      .filter((line) => line.points.length >= 2);

    const fallbackPolyline: JourneyPolyline[] = allowFallbackPolyline && cleanStops.length >= 2
      ? [{
          id: "stops-fallback",
          points: cleanStops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
          color: routeColor,
          dashed: false,
        }]
      : [];
    const linesToDraw = cleanPolylines.length ? cleanPolylines : fallbackPolyline;

    linesToDraw.forEach((line) => {
      const color = line.color || routeColor;
      const latLngs = line.points.map((point) => [point.lat, point.lng] as [number, number]);
      if (!line.dashed) {
        L.polyline(latLngs, {
          color: "#ffffff",
          weight: 9,
          opacity: 0.92,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(routeLayer);
      }
      const routeLine = L.polyline(latLngs, {
        color,
        weight: line.dashed ? 4 : 5,
        opacity: line.dashed ? 0.72 : 1,
        dashArray: line.dashed ? "6 8" : undefined,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeLayer);
      if (line.label) {
        routeLine.bindTooltip(escapeHtml(line.label), {
          sticky: true,
          direction: "top",
        });
      }
    });

    walkSegments.forEach((segment) => {
      const from = cleanStops[segment.fromIdx];
      const to = cleanStops[segment.toIdx];
      if (!from || !to) return;
      L.polyline(
        [[from.lat, from.lng], [to.lat, to.lng]],
        { color: "#64748b", weight: 4, opacity: 0.75, dashArray: "6 8", lineCap: "round" },
      ).addTo(routeLayer);
    });

    cleanStops.forEach((stop, index) => {
      const isOrigin = index === 0;
      const isDestination = index === cleanStops.length - 1;
      const marker = L.marker([stop.lat, stop.lng], {
        icon: isOrigin
          ? endpointIcon(L, "origin")
          : isDestination
            ? endpointIcon(L, "destination")
            : stopIcon(L, routeColor, index === nextStopIndex),
        zIndexOffset: isOrigin || isDestination ? 500 : index === nextStopIndex ? 350 : 100,
        keyboard: true,
        title: stop.name,
      }).addTo(routeLayer);
      marker.bindPopup(`
        <div class="unibus-map-popup">
          <div class="unibus-map-popup__eyebrow">${isOrigin ? "Điểm lên xe" : isDestination ? "Điểm xuống xe" : "Trạm dừng"}</div>
          <div class="unibus-map-popup__title">${escapeHtml(stop.name)}</div>
          <div class="unibus-map-popup__meta">${escapeHtml(stop.address || stop.code || "Đà Nẵng")}</div>
        </div>
      `);
      marker.on("click", () => onSelectStop?.(stop.id));
    });

    extraMarkers.filter(validPoint).forEach((markerInfo) => {
      const marker = L.marker([markerInfo.lat, markerInfo.lng], {
        icon: extraMarkerIcon(L, markerInfo.tone),
        zIndexOffset: 600,
        title: markerInfo.label,
      }).addTo(routeLayer);
      marker.bindPopup(`
        <div class="unibus-map-popup">
          <div class="unibus-map-popup__title">${escapeHtml(markerInfo.label)}</div>
        </div>
      `);
    });

    const allPoints = [
      ...linesToDraw.flatMap((line) => line.points),
      ...cleanStops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
      ...extraMarkers.filter(validPoint),
    ];
    const geometryPoints = [
      ...linesToDraw.flatMap((line) => line.points),
      ...cleanStops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
    ];
    const geometryKey = geometryPoints
      .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
      .join("|");

    if (fitOnStopsChange && !allPoints.length && lastGeometryKeyRef.current) {
      lastGeometryKeyRef.current = "";
      if (fitFrameRef.current) window.cancelAnimationFrame(fitFrameRef.current);
      fitFrameRef.current = window.requestAnimationFrame(() => {
        if (mapRef.current !== map) return;
        map.stop();
        map.invalidateSize({ pan: false });
        map.setView([16.0544, 108.2022], 12, {
          animate: animateCamera && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          duration: 0.35,
        });
      });
      return;
    }

    if (fitOnStopsChange && allPoints.length && geometryKey !== lastGeometryKeyRef.current) {
      lastGeometryKeyRef.current = geometryKey;
      const bounds = L.latLngBounds(allPoints.map((point) => [point.lat, point.lng]));
      if (fitFrameRef.current) window.cancelAnimationFrame(fitFrameRef.current);
      fitFrameRef.current = window.requestAnimationFrame(() => {
        if (mapRef.current !== map) return;
        map.stop();
        map.invalidateSize({ pan: false });
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            paddingTopLeft: [44, 44],
            paddingBottomRight: [44, 44],
            maxZoom: 15.5,
            animate: animateCamera && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            duration: 0.55,
          });
        }
      });
    }
  }, [
    animateCamera,
    allowFallbackPolyline,
    effectivePolylines,
    extraMarkers,
    fitOnStopsChange,
    mapReadyToken,
    nextStopIndex,
    onSelectStop,
    routeColor,
    stops,
    walkSegments,
  ]);

  React.useEffect(() => {
    const vehicleLayer = vehicleLayerRef.current;
    const L = leafletModule;
    if (!vehicleLayer || !L || mapReadyToken === 0) return;

    vehicleLayer.clearLayers();
    buses.filter(validPoint).forEach((bus) => {
      const color = bus.routeColor || routeColor;
      const marker = L.marker([bus.lat, bus.lng], {
        icon: vehicleIcon(L, color, bus.routeCode),
        zIndexOffset: 700,
        keyboard: true,
        title: `Xe ${bus.routeCode}`,
      }).addTo(vehicleLayer);
      marker.bindPopup(`
        <div class="unibus-map-popup">
          <div class="unibus-map-popup__row">
            <span class="unibus-map-popup__badge" style="background:${color}">${escapeHtml(bus.routeCode)}</span>
            <span class="unibus-map-popup__title" style="margin-top:0;font-size:12px">${escapeHtml(bus.plate)}</span>
          </div>
          ${bus.etaMinutes != null ? `<div class="unibus-map-popup__meta">Đến trạm sau ${Math.max(0, bus.etaMinutes)} phút</div>` : ""}
        </div>
      `);
      marker.on("click", () => onSelectBus?.(bus.id));
    });
  }, [buses, mapReadyToken, onSelectBus, routeColor]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || mapReadyToken === 0) return;
    if (scrollWheelZoom) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [mapReadyToken, scrollWheelZoom]);

  return (
    <div
      ref={containerRef}
      className={cn("unibus-journey-map relative w-full overflow-hidden bg-[#e8efec]", className)}
      style={{ height }}
      role="application"
      aria-label="Bản đồ hành trình xe buýt"
    >
      {arrivalOverlay ? (
        <div className="pointer-events-none absolute bottom-4 left-4 z-[500] max-w-[280px]">
          {arrivalOverlay}
        </div>
      ) : null}
    </div>
  );
});

