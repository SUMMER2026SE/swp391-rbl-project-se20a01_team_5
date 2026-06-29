"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { BusStop, Route } from "@/lib/types";

// Leaflet requires `window` — must be loaded client-side only.
// Use a dynamic import inside an effect to avoid SSR ReferenceError.
let L: typeof import("leaflet") | null = null;
async function loadLeaflet() {
  if (L) return L;
  await import("leaflet/dist/leaflet.css");
  L = await import("leaflet");
  return L;
}

/* =========================================================================
   RealMap — real OpenStreetMap via Leaflet, Grab-style
   - Real streets/roads/tiles (free OSM, no API key)
   - Stop markers as custom divIcons (flat colored circles)
   - Route polyline on real map with glow underlay
   - Animated bus marker interpolating between real lat/lng stops
   - Auto-fit bounds to route
   - Performance: willChange on bus marker, single map instance, memoized
   ========================================================================= */

export interface RealMapProps {
  stops: BusStop[];
  route?: Route;
  progress?: number;
  nextStopIndex?: number;
  className?: string;
  height?: number;
  scrollWheelZoom?: boolean;
}

function makeStopIcon(Lmod: typeof import("leaflet"), color: string, label?: string, isEnd = false) {
  const size = isEnd ? 26 : 20;
  const labelHtml = label
    ? `<div style="position:absolute;top:100%;left:50%;transform:translateX(-50%);white-space:nowrap;background:#fff;color:#374151;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,.12);margin-top:3px;pointer-events:none;">${label}</div>`
    : "";
  const html = `<div style="position:relative;width:${size}px;height:${size}px;">
    <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">
      <span style="width:${size * 0.28}px;height:${size * 0.28}px;border-radius:50%;background:#fff;"></span>
    </div>
    ${labelHtml}
  </div>`;
  return Lmod.divIcon({
    html,
    className: "bus-stop-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function makeBusIcon(Lmod: typeof import("leaflet"), color: string) {
  const size = 38;
  const html = `<div style="position:relative;width:${size}px;height:${size}px;will-change:transform;">
    <div style="position:absolute;inset:-6px;border-radius:50%;background:${color};opacity:0.25;filter:blur(2px);"></div>
    <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6M16 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2V12c0-2.2-1.8-4-4-4H6a4 4 0 0 0-4 4v4c0 .4.1.8.2 1.2C2.5 16.3 3 18 3 18h3M7 18c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm10 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/>
      </svg>
    </div>
  </div>`;
  return Lmod.divIcon({
    html,
    className: "bus-marker-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

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

export const RealMap = React.memo(function RealMap({
  stops,
  route,
  progress = 0.4,
  nextStopIndex = 1,
  className,
  height = 360,
  scrollWheelZoom = true,
}: RealMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const busMarkerRef = React.useRef<any>(null);
  const layersRef = React.useRef<any[]>([]);
  const routeColor = route?.color ?? "#10b981";

  // Init map once (dynamic load Leaflet to avoid SSR window error)
  React.useEffect(() => {
    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    loadLeaflet().then((Lmod) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
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
      mapRef.current._L = Lmod; // stash for later effects
      resizeTimer = setTimeout(() => {
        if (!cancelled && mapRef.current === map && containerRef.current) {
          map.invalidateSize();
        }
      }, 250);
    });
    return () => {
      cancelled = true;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = [];
      }
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (scrollWheelZoom) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [scrollWheelZoom]);

  // Add stop markers + route polyline when stops change
  React.useEffect(() => {
    const map = mapRef.current;
    const Lmod = map?._L as typeof import("leaflet") | undefined;
    if (!map || !Lmod || stops.length === 0) return;

    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    if (stops.length > 1) {
      const latlngs = stops.map((s) => [s.lat, s.lng] as [number, number]);
      const glow = Lmod.polyline(latlngs, { color: routeColor, weight: 10, opacity: 0.15 }).addTo(map);
      const main = Lmod.polyline(latlngs, { color: routeColor, weight: 4, opacity: 0.95 }).addTo(map);
      layersRef.current.push(glow, main);
    }

    stops.forEach((s, i) => {
      const isStart = i === 0;
      const isEnd = i === stops.length - 1;
      const isNext = i === nextStopIndex;
      const color = isStart ? "#16a34a" : isEnd ? "#dc2626" : routeColor;
      const label = isStart || isEnd || isNext ? s.name.split("(")[0].trim() : undefined;
      const marker = Lmod.marker([s.lat, s.lng], {
        icon: makeStopIcon(Lmod, color, label, isStart || isEnd),
        zIndexOffset: isNext ? 500 : 100,
      }).addTo(map);
      layersRef.current.push(marker);
    });

    const busPos = pointAtProgress(stops, progress);
    busMarkerRef.current = Lmod.marker([busPos.lat, busPos.lng], {
      icon: makeBusIcon(Lmod, routeColor),
      zIndexOffset: 1000,
    }).addTo(map);
    layersRef.current.push(busMarkerRef.current);

    if (stops.length > 1) {
      const bounds = Lmod.latLngBounds(stops.map((s) => [s.lat, s.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [stops, routeColor, nextStopIndex, progress]);

  // Animate bus marker when progress changes (lightweight)
  React.useEffect(() => {
    if (!busMarkerRef.current || stops.length === 0) return;
    const pos = pointAtProgress(stops, progress);
    busMarkerRef.current.setLatLng([pos.lat, pos.lng]);
  }, [progress, stops]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden rounded-2xl border border-outline-variant/40", className)}
      style={{ height, zIndex: 0 }}
    />
  );
});
