"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Flag, History, Loader2, MapPin, Navigation, Phone, Play, RefreshCw, Square, Users } from 'lucide-react';
import { driverTripApi } from '@/services/api';

function statusLabel(status) {
  const labels = {
    RUNNING: 'Đang chạy',
    NOT_STARTED: 'Chưa bắt đầu',
    NOT_CREATED: 'Chưa tạo chuyến',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return labels[status] || status || 'Chưa có tuyến';
}

function tripKey(trip) {
  return trip?.tripId || `${trip?.scheduleId}-${trip?.serviceDate}`;
}

function formatDate(value) {
  if (!value) return '--/--';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function formatTime(value) {
  return value?.slice(0, 5) || '--:--';
}

function mergeTrips(overview) {
  const rows = [
    overview?.nearestTrip,
    ...(overview?.upcomingTrips || []),
    ...(overview?.historyTrips || []),
  ].filter(Boolean);
  const seen = new Set();
  return rows.filter((trip) => {
    const key = tripKey(trip);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function DriverTripPage() {
  const [overview, setOverview] = useState({ nearestTrip: null, upcomingTrips: [], historyTrips: [] });
  const [selectedTripKey, setSelectedTripKey] = useState(null);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [locationNotice, setLocationNotice] = useState('');

  const trips = useMemo(() => mergeTrips(overview), [overview]);

  const currentTrip = useMemo(() => {
    if (!trips.length) return null;
    return trips.find((trip) => String(tripKey(trip)) === String(selectedTripKey))
      || overview.nearestTrip
      || trips[0];
  }, [trips, selectedTripKey, overview.nearestTrip]);

  const routeStations = currentTrip?.stops || [];
  const currentStation = routeStations[currentStationIndex];
  const isTripFinished = currentTrip?.status === 'COMPLETED' || currentStationIndex >= routeStations.length;

  const tripProgress = useMemo(() => {
    if (!routeStations.length) return currentTrip?.status === 'COMPLETED' ? 100 : 0;
    return Math.min(100, Math.round((currentStationIndex / routeStations.length) * 100));
  }, [currentStationIndex, routeStations.length, currentTrip?.status]);

  const loadOverview = useCallback(async ({ keepSelection = false } = {}) => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await driverTripApi.overview();
      const normalized = {
        nearestTrip: data?.nearestTrip || null,
        upcomingTrips: Array.isArray(data?.upcomingTrips) ? data.upcomingTrips : [],
        historyTrips: Array.isArray(data?.historyTrips) ? data.historyTrips : [],
      };
      setOverview(normalized);
      if (!keepSelection) {
        setSelectedTripKey(normalized.nearestTrip ? tripKey(normalized.nearestTrip) : null);
      }
      setCurrentStationIndex(0);
    } catch (err) {
      setError(err.message || 'Không tải được lịch chạy.');
      setOverview({ nearestTrip: null, upcomingTrips: [], historyTrips: [] });
      setSelectedTripKey(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => loadOverview(), 0);
    return () => window.clearTimeout(handle);
  }, [loadOverview]);

  useEffect(() => {
    if (currentTrip?.status !== 'RUNNING' || !currentTrip.tripId) {
      const handle = window.setTimeout(() => setLocationNotice(''), 0);
      return () => window.clearTimeout(handle);
    }

    if (!('geolocation' in navigator)) {
      const handle = window.setTimeout(() => setLocationNotice('Trình duyệt không hỗ trợ gửi vị trí GPS.'), 0);
      return () => window.clearTimeout(handle);
    }

    const noticeHandle = window.setTimeout(() => setLocationNotice('Đang xin quyền vị trí để gửi live GPS...'), 0);
    let lastSentAt = 0;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSentAt < 8000) return;
        lastSentAt = now;
        driverTripApi.updateLocation(currentTrip.tripId, {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          speedKmh: position.coords.speed == null ? null : Math.max(0, position.coords.speed * 3.6),
        })
          .then(() => setLocationNotice('Đang gửi vị trí live GPS cho điều phối.'))
          .catch((err) => setLocationNotice(err.message || 'Không gửi được vị trí GPS.'));
      },
      (geoError) => {
        setLocationNotice(geoError.code === geoError.PERMISSION_DENIED
          ? 'Bạn đã từ chối quyền vị trí. Điều phối sẽ chưa thấy GPS live.'
          : 'Không lấy được vị trí GPS từ trình duyệt.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
    );

    return () => {
      window.clearTimeout(noticeHandle);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [currentTrip?.status, currentTrip?.tripId]);

  const mutateTrip = async (action) => {
    if (!currentTrip?.tripId) return;
    setIsMutating(true);
    setError('');
    setMessage('');
    try {
      await (action === 'start'
        ? driverTripApi.start(currentTrip.tripId)
        : driverTripApi.end(currentTrip.tripId));
      await loadOverview();
      setMessage(action === 'start' ? 'Đã bắt đầu chuyến.' : 'Đã kết thúc chuyến. Hệ thống đã chuyển sang chuyến được phân công gần nhất.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsMutating(false);
    }
  };

  const handleArrive = () => {
    if (!isTripFinished) {
      setCurrentStationIndex((current) => current + 1);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Chuyến đi được phân công</h1>
          <p className="text-brand-text/60 font-medium">
            {currentTrip
              ? `${currentTrip.routeName} • ${formatDate(currentTrip.serviceDate)} • ${currentTrip.licensePlate || 'Chưa gán xe'}`
              : 'Hiển thị chuyến gần nhất và lịch sử từ backend'}
          </p>
        </div>
        <button
          onClick={() => loadOverview()}
          className="px-4 py-3 bg-white border border-black/5 rounded-2xl text-brand-text hover:bg-brand-surface transition-colors shadow-sm flex justify-center items-center gap-2 font-bold text-sm"
        >
          <RefreshCw className="w-5 h-5" /> Làm mới
        </button>
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
      {locationNotice && (
        <div className="p-4 bg-brand-secondary/10 border border-brand-secondary/20 rounded-2xl text-sm font-bold text-brand-text">
          {locationNotice}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center gap-3 text-brand-text/50 font-bold">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tải lịch chạy...
        </div>
      ) : !currentTrip ? (
        <div className="flex-1 flex items-center justify-center text-center text-brand-text/50 font-bold">
          Chưa có chuyến nào được phân công cho tài xế này.
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 relative z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-brand-primary" /> Lộ trình di chuyển
              </h2>
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                {trips.length > 1 && (
                  <select
                    value={tripKey(currentTrip)}
                    onChange={(event) => {
                      setSelectedTripKey(event.target.value);
                      setCurrentStationIndex(0);
                    }}
                    className="bg-brand-surface border border-black/5 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-brand-primary"
                  >
                    {trips.map((trip) => (
                      <option key={tripKey(trip)} value={tripKey(trip)}>
                        {formatDate(trip.serviceDate)} • {formatTime(trip.departureTime)} • {trip.routeName} • {statusLabel(trip.status)}
                      </option>
                    ))}
                  </select>
                )}
                <div className="text-right">
                  <div className="text-xs font-bold text-brand-text/40 uppercase">Tiến độ</div>
                  <div className="font-black">{tripProgress}%</div>
                </div>
              </div>
            </div>

            <div className="flex-1 relative z-10 pl-4 md:pl-10">
              <div className="absolute left-[29px] md:left-[53px] top-4 bottom-8 w-1 bg-black/5 rounded-full z-0"></div>

              {routeStations.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/10 bg-brand-surface/40 p-8 text-center text-sm font-bold text-brand-text/50">
                  Tuyến này chưa có danh sách trạm.
                </div>
              )}

              {routeStations.map((station, index) => {
                const isPassed = index < currentStationIndex || currentTrip.status === 'COMPLETED';
                const isCurrent = index === currentStationIndex && currentTrip.status === 'RUNNING';
                const isFuture = !isPassed && !isCurrent;

                return (
                  <div key={station.routeStopId || station.stopId} className="relative z-10 flex items-start gap-6 mb-8 last:mb-0 group">
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-4 transition-colors relative mt-1
                      ${isPassed ? 'bg-brand-success border-white shadow-md' : ''}
                      ${isCurrent ? 'bg-brand-primary border-brand-primary/30 shadow-lg animate-pulse' : ''}
                      ${isFuture ? 'bg-brand-surface border-white' : ''}
                    `}>
                      {isPassed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      {isCurrent && <Navigation className="w-3 h-3 text-white fill-white" />}
                    </div>

                    <div className={`
                      flex-1 p-4 rounded-2xl border transition-all
                      ${isPassed ? 'bg-brand-surface border-black/5 opacity-70' : ''}
                      ${isCurrent ? 'bg-brand-primary/10 border-brand-primary/20 shadow-sm' : ''}
                      ${isFuture ? 'bg-white border-transparent hover:border-black/5' : ''}
                    `}>
                      <div className="flex justify-between items-center mb-1 gap-4">
                        <h3 className={`font-bold text-lg ${isCurrent ? 'text-brand-primary' : 'text-brand-text'}`}>
                          {station.stopName}
                        </h3>
                        <span className="font-mono text-sm font-bold text-brand-text/50">#{station.stopOrder}</span>
                      </div>
                      {isCurrent && <p className="text-sm font-medium text-brand-text/70">Đang tiến đến trạm này...</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-brand-primary rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col justify-center text-center relative overflow-hidden">
              <div className="px-4 py-2 bg-white/40 text-brand-text rounded-xl font-bold border border-white/50 flex items-center justify-center gap-2 mb-6 relative z-10">
                <span className={`w-3 h-3 rounded-full ${currentTrip.status === 'RUNNING' ? 'bg-brand-success animate-pulse' : currentTrip.status === 'COMPLETED' ? 'bg-brand-text/50' : 'bg-brand-warning'}`}></span>
                {statusLabel(currentTrip.status)}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-text/50 mb-2 relative z-10">
                Trạm tiếp theo
              </h3>
              <div className="text-3xl font-black text-brand-text mb-8 relative z-10">
                {currentStation ? currentStation.stopName : 'Đã hoàn thành'}
              </div>

              <div className="flex flex-col gap-3">
                {currentTrip.status !== 'RUNNING' && currentTrip.status !== 'COMPLETED' && (
                  <button
                    onClick={() => mutateTrip('start')}
                    disabled={isMutating || !currentTrip.tripId}
                    className="w-full py-5 rounded-2xl bg-white text-brand-text font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-60"
                  >
                    <Play className="w-6 h-6 text-brand-primary fill-brand-primary" /> Bắt đầu chuyến
                  </button>
                )}

                {currentTrip.status === 'RUNNING' && !isTripFinished && (
                  <button
                    onClick={handleArrive}
                    className="w-full py-5 rounded-2xl bg-white text-brand-text font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
                  >
                    <Flag className="w-6 h-6 text-brand-primary fill-brand-primary" /> Đã đến trạm
                  </button>
                )}

                {currentTrip.status === 'RUNNING' && (
                  <button
                    onClick={() => mutateTrip('end')}
                    disabled={isMutating}
                    className="w-full py-5 rounded-2xl bg-brand-text text-white font-black text-lg hover:bg-black transition-colors flex items-center justify-center gap-3 shadow-sm disabled:opacity-60"
                  >
                    <Square className="w-6 h-6" /> Kết thúc chuyến
                  </button>
                )}

                {currentTrip.status === 'COMPLETED' && (
                  <button className="w-full py-5 rounded-2xl bg-brand-success text-white font-black text-lg flex items-center justify-center gap-3 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" /> Hoàn thành chuyến xe
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                <Stat label="Ngày chạy" value={formatDate(currentTrip.serviceDate)} />
                <Stat label="Giờ xuất bến" value={formatTime(currentTrip.departureTime)} />
                <Stat label="Mã xe" value={currentTrip.licensePlate || 'Chưa gán'} />
                <Stat label="Mã chuyến" value={currentTrip.tripId || 'Chưa tạo'} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-brand-secondary" /> Lịch sử chuyến đi
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {overview.historyTrips.length > 0 ? overview.historyTrips.map((trip) => (
                  <button
                    key={tripKey(trip)}
                    onClick={() => {
                      setSelectedTripKey(tripKey(trip));
                      setCurrentStationIndex(0);
                    }}
                    className="w-full text-left p-4 bg-brand-surface rounded-2xl border border-black/5 hover:border-brand-primary transition-colors"
                  >
                    <div className="text-sm font-black">{formatDate(trip.serviceDate)} • {formatTime(trip.departureTime)}</div>
                    <div className="text-xs font-bold text-brand-text/70 mt-1">{trip.routeName}</div>
                    <div className="text-[11px] font-bold text-brand-text/40 mt-1 uppercase">{statusLabel(trip.status)}</div>
                  </button>
                )) : (
                  <div className="rounded-2xl border border-dashed border-black/10 p-4 text-sm text-center font-bold text-brand-text/50">
                    Chưa có lịch sử chuyến đi.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-secondary" /> Phụ xe chuyến này
              </h3>

              <div className="flex items-center justify-between p-4 bg-brand-surface rounded-2xl border border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-secondary/20 rounded-full flex items-center justify-center text-brand-secondary font-bold">
                    {initials(currentTrip.conductorName || 'PX')}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{currentTrip.conductorName || 'Chưa gán phụ xe'}</div>
                    <div className="text-xs font-medium text-brand-text/60">SĐT: {currentTrip.conductorPhone || 'Chưa có'}</div>
                  </div>
                </div>
                {currentTrip.conductorPhone && (
                  <a href={`tel:${currentTrip.conductorPhone.replaceAll(' ', '')}`} className="p-3 bg-brand-primary rounded-xl text-brand-text hover:bg-black hover:text-white transition-colors shadow-sm">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
      <div className="text-xs font-bold text-brand-text/50 uppercase mb-1">{label}</div>
      <div className="text-xl font-black break-words">{value}</div>
    </div>
  );
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase();
}
