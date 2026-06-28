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
      font-family: inherit;
    }
    .unibus-journey-map .leaflet-popup-tip {
      background: #fff;
    }
    .unibus-journey-map .leaflet-container {
      background: #e8efec;
      font-family: inherit;
      outline: none;
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
  const color = tone === "current" ? "#144fcc" : "#dc3f36";
  return L.divIcon({
    className: "unibus-map-marker",
    html: `
      <div style="display:grid;width:26px;height:26px;place-items:center;border-radius:50%;background:#fff;border:3px solid ${color}">
        <span style="width:7px;height:7px;border-radius:50%;background:${color}"></span>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
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
      <div style="display:flex;min-width:36px;height:30px;align-items:center;justify-content:center;border-radius:8px;background:#fff;border:2px solid ${color};padding:0 7px;color:${color};font:800 11px/1 system-ui,sans-serif">
        ${escapeHtml(routeCode)}
      </div>
    `,
    iconSize: [42, 30],
    iconAnchor: [21, 15],
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
}: JourneyMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const routeLayerRef = React.useRef<any>(null);
  const vehicleLayerRef = React.useRef<any>(null);
  const lastGeometryKeyRef = React.useRef("");
  const [mapReadyToken, setMapReadyToken] = React.useState(0);

  const effectivePolylines = polylines.length ? polylines : walkPolylines;

  React.useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    loadLeaflet().then((L) => {
      if (disposed || !containerRef.current || mapRef.current) return;
      ensureStyles();

      const map = L.map(containerRef.current, {
        center: [16.0544, 108.2022],
        zoom: 12,
        zoomControl: false,
        scrollWheelZoom: true,
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

      resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));
      });
      resizeObserver.observe(containerRef.current);

      window.requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
        setMapReadyToken((value) => value + 1);
      });
    });

    return () => {
      disposed = true;
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

    const fallbackPolyline: JourneyPolyline[] = cleanStops.length >= 2
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
        <div style="min-width:170px">
          <div style="font-size:11px;font-weight:700;color:#66706b">${isOrigin ? "Điểm lên xe" : isDestination ? "Điểm xuống xe" : "Trạm dừng"}</div>
          <div style="margin-top:3px;font-size:14px;font-weight:800">${escapeHtml(stop.name)}</div>
          <div style="margin-top:3px;font-size:11px;color:#66706b">${escapeHtml(stop.address || stop.code || "Đà Nẵng")}</div>
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
        <div style="font-size:14px;font-weight:800">${escapeHtml(markerInfo.label)}</div>
      `);
    });

    const allPoints = [
      ...linesToDraw.flatMap((line) => line.points),
      ...cleanStops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
      ...extraMarkers.filter(validPoint),
    ];
    const geometryKey = allPoints
      .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
      .join("|");

    if (fitOnStopsChange && !allPoints.length && lastGeometryKeyRef.current) {
      lastGeometryKeyRef.current = "";
      window.requestAnimationFrame(() => {
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
      window.requestAnimationFrame(() => {
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
        <div style="min-width:180px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="border-radius:5px;background:${color};padding:3px 7px;color:#fff;font-size:11px;font-weight:800">${escapeHtml(bus.routeCode)}</span>
            <span style="font-size:12px;font-weight:700">${escapeHtml(bus.plate)}</span>
          </div>
          ${bus.etaMinutes != null ? `<div style="margin-top:8px;font-size:12px;color:#66706b">Đến trạm sau ${Math.max(0, bus.etaMinutes)} phút</div>` : ""}
        </div>
      `);
      marker.on("click", () => onSelectBus?.(bus.id));
    });
  }, [buses, mapReadyToken, onSelectBus, routeColor]);

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
