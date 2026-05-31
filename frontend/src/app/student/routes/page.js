"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Map, Clock, ArrowRight, BusFront, MapPin, Activity, CheckCircle2 } from 'lucide-react';
import { registrationApi, transportApi } from '@/services/api';

export default function StudentRoutesPage() {
  const [stops, setStops] = useState([]);
  const [boardingStopId, setBoardingStopId] = useState('');
  const [alightingStopId, setAlightingStopId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [currentRegistration, setCurrentRegistration] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [submittingRouteId, setSubmittingRouteId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setError('');
      setIsLoading(true);

      try {
        const [stopData, registration] = await Promise.all([
          transportApi.getStops(),
          registrationApi.getCurrent().catch(() => null),
        ]);

        if (!isMounted) return;

        setStops(stopData || []);
        setCurrentRegistration(registration);
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedStops = useMemo(() => ({
    boarding: stops.find((stop) => String(stop.stopId) === boardingStopId),
    alighting: stops.find((stop) => String(stop.stopId) === alightingStopId),
  }), [alightingStopId, boardingStopId, stops]);

  const handleSearch = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

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
      const routeSuggestions = await transportApi.searchRoutes(Number(boardingStopId), Number(alightingStopId));
      setRoutes(routeSuggestions || []);
      if (!routeSuggestions?.length) {
        setNotice('Chưa có tuyến phù hợp cho hai trạm này.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegisterRoute = async (route) => {
    setError('');
    setNotice('');
    setSubmittingRouteId(route.routeId);

    try {
      const registration = await registrationApi.register({
        routeId: route.routeId,
        boardingStopId: Number(boardingStopId),
        alightingStopId: Number(alightingStopId),
        effectiveDate: new Date().toISOString().slice(0, 10),
      });

      setCurrentRegistration(registration);
      setNotice(`Đã đăng ký ${route.routeName} từ ${selectedStops.boarding?.stopName} đến ${selectedStops.alighting?.stopName}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingRouteId(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Tuyến xe & Theo dõi</h1>
          <p className="text-brand-text/60 font-medium">Tra cứu tuyến theo điểm lên/xuống và đăng ký tuyến cố định.</p>
        </div>
      </div>

      {currentRegistration && (
        <div className="bg-brand-success/10 border border-brand-success/20 rounded-3xl p-5 flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-brand-success shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-brand-success">Tuyến đang đăng ký: {currentRegistration.routeName}</p>
            <p className="text-sm font-medium text-brand-success/80 mt-1">
              {currentRegistration.boardingStopName} → {currentRegistration.alightingStopName}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4">
        <div>
          <label className="block text-xs font-bold text-brand-text/50 uppercase mb-2">Điểm lên</label>
          <select
            value={boardingStopId}
            onChange={(event) => setBoardingStopId(event.target.value)}
            className="w-full bg-brand-surface border border-black/5 rounded-2xl py-3.5 px-4 text-sm font-bold focus:outline-none focus:border-brand-primary"
            disabled={isLoading}
          >
            <option value="">Chọn trạm lên</option>
            {stops.map((stop) => (
              <option key={stop.stopId} value={stop.stopId}>{stop.stopName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-brand-text/50 uppercase mb-2">Điểm xuống</label>
          <select
            value={alightingStopId}
            onChange={(event) => setAlightingStopId(event.target.value)}
            className="w-full bg-brand-surface border border-black/5 rounded-2xl py-3.5 px-4 text-sm font-bold focus:outline-none focus:border-brand-primary"
            disabled={isLoading}
          >
            <option value="">Chọn trạm xuống</option>
            {stops.map((stop) => (
              <option key={stop.stopId} value={stop.stopId}>{stop.stopName}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading || isSearching}
          className="md:self-end px-6 py-3.5 bg-brand-text text-white rounded-2xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Search className="w-5 h-5" /> {isSearching ? 'Đang tìm...' : 'Tìm tuyến'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-semibold text-brand-danger">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-2xl text-sm font-semibold text-brand-success">
          {notice}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {isLoading ? (
          <div className="bg-white rounded-3xl p-10 text-center font-bold text-brand-text/50">Đang tải danh sách trạm...</div>
        ) : routes.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {routes.map((route) => (
              <div key={route.routeId} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 hover:shadow-md hover:border-brand-primary/30 transition-all group flex flex-col justify-between">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <BusFront className="w-7 h-7 text-brand-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-brand-text">{route.routeName}</h2>
                      <p className="text-sm font-bold text-brand-text/60 mt-1">
                        {selectedStops.boarding?.stopName} → {selectedStops.alighting?.stopName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-2">
                    <Clock className="w-5 h-5 text-brand-text/40" />
                    <div>
                      <div className="text-[10px] font-bold text-brand-text/40 uppercase">Dự kiến</div>
                      <div className="text-xs font-bold text-brand-text">{route.estimatedMinutes ?? '--'} phút</div>
                    </div>
                  </div>
                  <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-2">
                    <Activity className="w-5 h-5 text-brand-text/40" />
                    <div>
                      <div className="text-[10px] font-bold text-brand-text/40 uppercase">Khoảng cách</div>
                      <div className="text-xs font-bold text-brand-text">{route.distanceKm ?? '--'} km</div>
                    </div>
                  </div>
                  <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-2">
                    <MapPin className="w-5 h-5 text-brand-text/40" />
                    <div>
                      <div className="text-[10px] font-bold text-brand-text/40 uppercase">Số trạm</div>
                      <div className="text-xs font-bold text-brand-text">{route.stops?.length ?? 0} trạm</div>
                    </div>
                  </div>
                  <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-2">
                    <Map className="w-5 h-5 text-brand-text/40" />
                    <div>
                      <div className="text-[10px] font-bold text-brand-text/40 uppercase">Nguồn</div>
                      <div className="text-xs font-bold text-brand-text">Backend</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <Link href={`/student/routes/${route.routeId}`} className="flex-1 py-4 bg-brand-surface text-brand-text font-bold rounded-2xl hover:bg-brand-primary transition-colors flex items-center justify-center gap-2">
                    Xem chi tiết <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRegisterRoute(route)}
                    disabled={submittingRouteId === route.routeId}
                    className="flex-1 py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors disabled:opacity-60"
                  >
                    {submittingRouteId === route.routeId ? 'Đang đăng ký...' : 'Đăng ký tuyến này'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center text-brand-text/50">
            <Search className="w-14 h-14 mx-auto mb-4 opacity-50" />
            <p className="font-bold">Chọn điểm lên/xuống rồi bấm “Tìm tuyến”.</p>
          </div>
        )}
      </div>
    </div>
  );
}
