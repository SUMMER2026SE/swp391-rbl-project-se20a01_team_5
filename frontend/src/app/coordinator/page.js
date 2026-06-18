"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BusFront, Map, AlertTriangle, Users, Navigation, Radio, RefreshCw, Search } from 'lucide-react';
import { fleetApi } from '@/services/api';

function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function positionFor(vehicle, bounds) {
  if (vehicle.latitude == null || vehicle.longitude == null || !bounds) {
    return null;
  }
  const lngSpan = bounds.maxLng - bounds.minLng || 0.01;
  const latSpan = bounds.maxLat - bounds.minLat || 0.01;
  return {
    x: 8 + ((vehicle.longitude - bounds.minLng) / lngSpan) * 84,
    y: 92 - ((vehicle.latitude - bounds.minLat) / latSpan) * 84,
  };
}

export default function CoordinatorDashboard() {
  const [serviceDate, setServiceDate] = useState(todayInput());
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFleet = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fleetApi.live(serviceDate);
      setVehicles(data || []);
    } catch (err) {
      setError(err.message);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, [serviceDate]);

  useEffect(() => {
    const handle = window.setTimeout(loadFleet, 0);
    const interval = window.setInterval(loadFleet, 15000);
    return () => {
      window.clearTimeout(handle);
      window.clearInterval(interval);
    };
  }, [loadFleet]);

  const visibleVehicles = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return vehicles;
    return vehicles.filter((vehicle) => (
      vehicle.licensePlate?.toLowerCase().includes(keyword)
      || vehicle.routeName?.toLowerCase().includes(keyword)
      || vehicle.driverName?.toLowerCase().includes(keyword)
    ));
  }, [vehicles, searchTerm]);

  const vehiclesWithLocation = visibleVehicles.filter((vehicle) => vehicle.latitude != null && vehicle.longitude != null);
  const runningCount = vehicles.filter((vehicle) => vehicle.status === 'RUNNING').length;
  const bounds = useMemo(() => {
    if (!vehiclesWithLocation.length) return null;
    const lats = vehiclesWithLocation.map((vehicle) => vehicle.latitude);
    const lngs = vehiclesWithLocation.map((vehicle) => vehicle.longitude);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [vehiclesWithLocation]);

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <Radio className="w-8 h-8 text-brand-danger animate-pulse" /> Giám sát trực tuyến
          </h1>
          <p className="text-brand-text/60 font-medium">Theo dõi vị trí GPS thật do tài xế gửi từ trình duyệt.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:w-2/3 shrink-0">
          <Stat label="Xe đang chạy" value={`${runningCount} / ${vehicles.length}`} />
          <Stat label="Có GPS live" value={vehiclesWithLocation.length} tone="success" />
          <Stat label="Chưa gửi GPS" value={vehicles.length - vehiclesWithLocation.length} tone="warning" />
          <div className="bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] rounded-[1.5rem] p-4 shadow-[var(--md-sys-elevation-1)] flex flex-col justify-center">
            <div className="text-sm font-bold text-white/50 uppercase mb-1">Ngày vận hành</div>
            <input
              type="date"
              value={serviceDate}
              onChange={(event) => setServiceDate(event.target.value)}
              className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 overflow-hidden pb-6">
        <div className="xl:col-span-3 m3-surface rounded-[2rem] relative overflow-hidden flex flex-col">
          <div className="absolute top-6 left-6 z-20 flex gap-2 flex-wrap">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm font-bold text-sm flex items-center gap-2 border border-black/5">
              <span className="w-3 h-3 rounded-full bg-brand-success"></span> Đang chạy
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm font-bold text-sm flex items-center gap-2 border border-black/5">
              <span className="w-3 h-3 rounded-full bg-brand-text/40"></span> Chưa có GPS
            </div>
          </div>

          <button onClick={loadFleet} className="absolute top-6 right-6 z-20 bg-white p-3 rounded-xl shadow-sm border border-black/5 hover:bg-brand-surface transition-colors">
            <RefreshCw className="w-5 h-5 text-brand-text" />
          </button>

          <div className="flex-1 relative m3-map-surface overflow-hidden">
            <div className="absolute inset-0 opacity-20"></div>

            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center text-center text-sm font-bold text-brand-text/50">
                Đang tải đội xe...
              </div>
            )}
            {!isLoading && !vehiclesWithLocation.length && (
              <div className="absolute inset-0 z-10 flex items-center justify-center text-center text-sm font-bold text-brand-text/50 px-8">
                Chưa có vị trí GPS live. Tài xế cần bắt đầu chuyến và cho phép trình duyệt gửi vị trí.
              </div>
            )}
            {vehiclesWithLocation.map((bus) => {
              const pos = positionFor(bus, bounds);
              if (!pos) return null;
              return (
                <div key={bus.tripId} className="absolute z-10 w-12 h-12 -ml-6 -mt-6 flex flex-col items-center transition-all duration-700" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 ${bus.status === 'RUNNING' ? 'bg-brand-primary border-brand-text text-brand-text' : 'bg-brand-text border-white text-white opacity-80'}`}>
                    <BusFront className="w-5 h-5" />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-black mt-1 shadow-sm whitespace-nowrap">
                    {bus.licensePlate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="m3-surface rounded-[2rem] p-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Navigation className="w-5 h-5 text-brand-primary" /> Đội xe live
            </h2>
          </div>

          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm biển số, tài xế..."
              className="m3-focus-ring w-full bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-full py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
            {visibleVehicles.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 bg-brand-surface/40 p-6 text-center text-sm font-bold text-brand-text/50">
                Không có chuyến xe cho bộ lọc hiện tại.
              </div>
            )}
            {visibleVehicles.map((bus) => (
              <div key={bus.tripId} className={`p-4 rounded-[1.5rem] border ${bus.status === 'RUNNING' ? 'bg-brand-success/5 border-brand-success/30' : 'bg-[var(--md-sys-color-surface-container-lowest)] border-[var(--md-sys-color-outline-variant)] hover:border-brand-primary/50'} transition-colors`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-black text-brand-text">{bus.licensePlate || 'Chưa gán xe'}</div>
                  <div className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-brand-surface text-brand-text/60">
                    {bus.status}
                  </div>
                </div>
                <div className="text-xs font-bold text-brand-text/60 mb-1 flex items-center gap-1">
                  <Map className="w-3.5 h-3.5" /> {bus.routeName}
                </div>
                <div className="text-xs font-medium text-brand-text/60 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> TX: {bus.driverName || 'Chưa gán'}
                </div>
                {bus.locationUpdatedAt ? (
                  <div className="mt-3 text-xs font-bold text-brand-success bg-brand-success/10 p-2 rounded-lg">
                    GPS: {formatTime(bus.locationUpdatedAt)} • {bus.speedKmh == null ? '--' : `${Math.round(bus.speedKmh)} km/h`}
                  </div>
                ) : (
                  <div className="mt-3 text-xs font-bold text-brand-warning bg-brand-warning/10 p-2 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Tài xế chưa gửi GPS.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'neutral' }) {
  const toneClass = tone === 'success'
    ? 'text-brand-success'
    : tone === 'warning'
      ? 'text-brand-warning'
      : 'text-brand-primary';
  return (
    <div className="m3-surface rounded-[1.5rem] p-4 flex flex-col justify-center">
      <div className="text-sm font-bold text-brand-text/50 uppercase mb-1">{label}</div>
      <div className={`text-2xl font-black ${toneClass}`}>{value}</div>
    </div>
  );
}

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}
