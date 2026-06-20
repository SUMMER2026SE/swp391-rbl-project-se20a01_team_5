"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, History, Loader2, MapPin, Navigation, Phone, Play, RefreshCw, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

export default function DriverDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState({ nearestTrip: null, upcomingTrips: [], historyTrips: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await driverTripApi.overview();
      setOverview({
        nearestTrip: data?.nearestTrip || null,
        upcomingTrips: Array.isArray(data?.upcomingTrips) ? data.upcomingTrips : [],
        historyTrips: Array.isArray(data?.historyTrips) ? data.historyTrips : [],
      });
    } catch (err) {
      setOverview({ nearestTrip: null, upcomingTrips: [], historyTrips: [] });
      setError(err.message || 'Không tải được lịch chạy.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(loadOverview, 0);
    return () => window.clearTimeout(handle);
  }, [loadOverview]);

  const currentTrip = overview.nearestTrip;
  const upcomingTrips = overview.upcomingTrips;
  const historyTrips = overview.historyTrips;

  const primaryButton = useMemo(() => {
    if (currentTrip?.status === 'RUNNING') {
      return { icon: Square, label: 'Kết thúc chuyến', danger: true };
    }
    return { icon: Play, label: 'Mở chuyến được phân công', danger: false };
  }, [currentTrip?.status]);

  const PrimaryIcon = primaryButton.icon;

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Xin chào bác tài!</h1>
          <p className="text-brand-text/60 font-medium">
            Theo dõi chuyến được phân công gần nhất và lịch sử chuyến đi từ backend.
          </p>
        </div>
        <button
          onClick={loadOverview}
          className="px-4 py-3 bg-white border border-black/5 rounded-2xl text-brand-text hover:bg-brand-surface transition-colors shadow-sm flex items-center gap-2 font-bold text-sm"
        >
          <RefreshCw className="w-5 h-5" /> Làm mới
        </button>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6 items-start">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col self-start">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Navigation className="w-6 h-6 text-brand-primary" /> Chuyến được phân công gần nhất
            </h2>
            <div className="px-3 py-1 bg-brand-surface text-brand-text font-bold text-xs rounded-full uppercase tracking-widest border border-black/5">
              {statusLabel(currentTrip?.status)}
            </div>
          </div>

          <div
            onClick={() => router.push('/driver/trips')}
            className="w-full h-[340px] md:h-[400px] max-h-[45vh] bg-brand-surface rounded-2xl border border-black/5 flex items-center justify-center mb-6 relative overflow-hidden group cursor-pointer hover:border-brand-primary transition-colors"
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            {isLoading ? (
              <div className="text-center relative z-10 text-brand-text/60 font-bold">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                Đang tải lịch chạy...
              </div>
            ) : currentTrip ? (
              <div className="text-center relative z-10 max-w-md px-4">
                <MapPin className="w-10 h-10 text-brand-primary mx-auto mb-3 group-hover:scale-110 transition-all" />
                <h3 className="text-2xl font-black text-brand-text mb-2">{currentTrip.routeName}</h3>
                <p className="font-bold text-brand-text/70">
                  {formatDate(currentTrip.serviceDate)} • {formatTime(currentTrip.departureTime)} • {currentTrip.licensePlate || 'Chưa gán xe'}
                </p>
                <p className="text-xs text-brand-text/40 mt-2">Nhấn vào để xem lộ trình chi tiết</p>
              </div>
            ) : (
              <div className="text-center relative z-10">
                <MapPin className="w-10 h-10 text-brand-text/30 mx-auto mb-2 group-hover:text-brand-primary group-hover:scale-110 transition-all" />
                <p className="font-bold text-brand-text/60">Chưa có chuyến được phân công từ backend</p>
                <p className="text-xs text-brand-text/40 mt-1">Kiểm tra tài khoản tài xế hoặc lịch điều phối</p>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/driver/trips')}
            disabled={!currentTrip}
            className={`w-full py-4 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 ${
              primaryButton.danger
                ? 'bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white'
                : 'bg-brand-text text-white hover:bg-black'
            }`}
          >
            <PrimaryIcon className="w-5 h-5" /> {primaryButton.label}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-brand-primary text-brand-text rounded-3xl p-6 shadow-sm flex flex-col border border-black/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CalendarClock className="w-5 h-5" /> Lịch chạy tiếp theo
            </h3>

            <div className="space-y-3">
              {upcomingTrips.length > 0 ? upcomingTrips.map((trip) => (
                <TripMiniCard key={tripKey(trip)} trip={trip} />
              )) : (
                <div className="bg-white/60 p-4 rounded-2xl border border-white text-sm font-bold text-brand-text/60">
                  Chưa có lịch tiếp theo từ backend
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-secondary" /> Lịch sử chuyến đi
            </h3>
            <div className="space-y-3">
              {historyTrips.length > 0 ? historyTrips.slice(0, 4).map((trip) => (
                <TripMiniCard key={tripKey(trip)} trip={trip} compact />
              )) : (
                <div className="p-4 rounded-2xl border border-dashed border-black/10 text-sm font-bold text-brand-text/50 text-center">
                  Chưa có lịch sử chuyến đi.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-warning" /> Hỗ trợ khẩn cấp
            </h3>
            <p className="text-xs text-brand-text/60 mb-6">
              Liên hệ bộ phận điều phối nếu xe gặp sự cố, kẹt xe hoặc thay đổi lộ trình.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/driver/contact')}
                className="w-full py-3 rounded-xl bg-brand-surface text-brand-text font-bold hover:bg-brand-text hover:text-white transition-all text-sm flex justify-center items-center gap-2 border border-black/5 hover:border-brand-text"
              >
                <Phone className="w-4 h-4" /> Gọi điều phối viên
              </button>
              <button
                onClick={() => router.push('/driver/contact')}
                className="w-full py-3 rounded-xl bg-brand-danger/10 text-brand-danger font-bold hover:bg-brand-danger hover:text-white transition-all text-sm flex justify-center items-center gap-2 border border-brand-danger/20"
              >
                <AlertTriangle className="w-4 h-4" /> Báo cáo sự cố
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TripMiniCard({ trip, compact = false }) {
  return (
    <div className="bg-white/70 p-4 rounded-2xl border border-white">
      <div className="flex justify-between items-start gap-3 mb-1">
        <div className="text-sm font-black">{formatDate(trip.serviceDate)} • {formatTime(trip.departureTime)}</div>
        <div className="text-[10px] font-bold bg-white px-2 py-1 rounded text-brand-text/60 uppercase">
          {statusLabel(trip.status)}
        </div>
      </div>
      <div className="text-xs font-bold text-brand-text/80">{trip.routeName}</div>
      {!compact && (
        <div className="text-xs font-medium text-brand-text/50 mt-1">{trip.licensePlate || 'Chưa gán xe'}</div>
      )}
    </div>
  );
}
