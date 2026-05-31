"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Map, Clock, ArrowRight, BusFront, MapPin, Activity, CheckCircle2 } from 'lucide-react';
import { registrationApi, transportApi } from '@/services/api';

export default function StudentRoutesPage() {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [currentRegistration, setCurrentRegistration] = useState(null);
  const [boardingStopId, setBoardingStopId] = useState('');
  const [alightingStopId, setAlightingStopId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingStops, setIsLoadingStops] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [registeringRouteId, setRegisteringRouteId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      transportApi.getStops(),
      registrationApi.getCurrent().catch(() => null),
    ])
      .then(([stopList, registration]) => {
        if (cancelled) return;
        setStops(stopList || []);
        setCurrentRegistration(registration);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStops(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRoutes = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return routes;

    return routes.filter((route) => {
      const stopNames = route.stops?.map((stop) => stop.stopName).join(' ') || '';
      return `${route.routeName} ${stopNames}`.toLowerCase().includes(keyword);
    });
  }, [routes, searchTerm]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!boardingStopId || !alightingStopId) {
      setError('Vui lòng chọn điểm lên và điểm xuống.');
      return;
    }

    if (boardingStopId === alightingStopId) {
      setError('Điểm lên và điểm xuống phải khác nhau.');
      return;
    }

    setIsSearching(true);
    try {
      const results = await transportApi.searchRoutes(Number(boardingStopId), Number(alightingStopId));
      setRoutes(results || []);
      setMessage(results?.length ? `Tìm thấy ${results.length} tuyến phù hợp.` : 'Không có tuyến phù hợp với hai trạm đã chọn.');
    } catch (err) {
      setError(err.message);
      setRoutes([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegister = async (route) => {
    setError('');
    setMessage('');
    setRegisteringRouteId(route.routeId);

    const payload = {
      routeId: route.routeId,
      boardingStopId: Number(boardingStopId),
      alightingStopId: Number(alightingStopId),
      effectiveDate: new Date().toISOString().slice(0, 10),
    };

    try {
      const registration = currentRegistration?.registrationId
        ? await registrationApi.change(currentRegistration.registrationId, payload)
        : await registrationApi.register(payload);

      setCurrentRegistration(registration);
      setMessage(`Đã đăng ký ${registration.routeName}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegisteringRouteId(null);
    }
  };

  const rememberRoute = (route) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(`selected_route_${route.routeId}`, JSON.stringify({
      ...route,
      boardingStopId: Number(boardingStopId),
      alightingStopId: Number(alightingStopId),
    }));
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Tìm tuyến xe</h1>
          <p className="text-brand-text/60 font-medium">Chọn điểm lên/xuống để tra cứu tuyến từ backend.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-2xl text-sm font-bold text-brand-success">
          {message}
        </div>
      )}

      <form onSubmit={handleSearch} className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
        <StopSelect label="Điểm lên" value={boardingStopId} onChange={setBoardingStopId} stops={stops} disabled={isLoadingStops} />
        <StopSelect label="Điểm xuống" value={alightingStopId} onChange={setAlightingStopId} stops={stops} disabled={isLoadingStops} />
        <label className="block">
          <span className="block text-xs font-black text-brand-text/40 uppercase mb-2">Lọc kết quả</span>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
            <input
              type="text"
              placeholder="Tên tuyến hoặc trạm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-surface border border-black/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={isLoadingStops || isSearching}
          className="py-3.5 px-6 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors disabled:opacity-60"
        >
          {isSearching ? 'Đang tìm...' : 'Tìm tuyến'}
        </button>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredRoutes.map((route) => {
            const isCurrent = currentRegistration?.routeId === route.routeId;
            const firstStop = route.stops?.[0]?.stopName;
            const lastStop = route.stops?.[route.stops.length - 1]?.stopName;

            return (
              <div key={route.routeId} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 hover:shadow-md hover:border-brand-primary/30 transition-all group flex flex-col justify-between">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <BusFront className="w-7 h-7 text-brand-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
                        {route.routeName}
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-brand-success/10 text-brand-success text-[10px] font-black uppercase tracking-wider rounded-md">Đã đăng ký</span>
                        )}
                      </h2>
                      <p className="text-sm font-bold text-brand-text/60 mt-1">
                        {[firstStop, lastStop].filter(Boolean).join(' → ') || 'Chưa có dữ liệu trạm'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <Metric icon={Clock} label="Thời gian" value={route.estimatedMinutes ? `${route.estimatedMinutes} phút` : 'Chưa có'} />
                  <Metric icon={Activity} label="Quãng đường" value={route.distanceKm ? `${route.distanceKm} km` : 'Chưa có'} />
                  <Metric icon={MapPin} label="Số trạm" value={`${route.stops?.length || 0} trạm`} />
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <Link
                    href={`/student/routes/${route.routeId}?boardingStopId=${boardingStopId}&alightingStopId=${alightingStopId}`}
                    onClick={() => rememberRoute(route)}
                    className="flex-1 py-4 bg-brand-surface text-brand-text font-bold rounded-2xl hover:bg-brand-primary transition-colors flex items-center justify-center gap-2"
                  >
                    Xem chi tiết <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRegister(route)}
                    disabled={registeringRouteId === route.routeId}
                    className="flex-1 py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {registeringRouteId === route.routeId ? 'Đang lưu...' : isCurrent ? 'Cập nhật tuyến' : 'Đăng ký tuyến'}
                  </button>
                </div>
              </div>
            );
          })}

          {!filteredRoutes.length && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-brand-text/40 bg-white rounded-3xl border border-black/5">
              <Map className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-bold text-lg">Chưa có kết quả tuyến xe.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StopSelect({ label, value, onChange, stops, disabled }) {
  return (
    <label className="block">
      <span className="block text-xs font-black text-brand-text/40 uppercase mb-2">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-brand-surface border border-black/5 rounded-2xl py-3.5 px-4 text-sm font-bold focus:outline-none focus:border-brand-primary transition-all"
      >
        <option value="">{disabled ? 'Đang tải trạm...' : 'Chọn trạm'}</option>
        {stops.map((stop) => (
          <option key={stop.stopId} value={stop.stopId}>
            {stop.stopName}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-2">
      <Icon className="w-5 h-5 text-brand-text/40" />
      <div>
        <div className="text-[10px] font-bold text-brand-text/40 uppercase">{label}</div>
        <div className="text-xs font-bold text-brand-text">{value}</div>
      </div>
    </div>
  );
}
