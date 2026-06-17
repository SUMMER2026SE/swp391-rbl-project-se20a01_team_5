"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, Navigation, Phone, Clock, Play, Square, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { driverTripApi } from '@/services/api';

function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  return trip?.tripId || trip?.scheduleId;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [serviceDate] = useState(toDateInputValue());
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await driverTripApi.list(serviceDate);
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      setTrips([]);
      setError(err.message || 'Không tải được lịch chạy.');
    } finally {
      setIsLoading(false);
    }
  }, [serviceDate]);

  useEffect(() => {
    const handle = window.setTimeout(loadTrips, 0);
    return () => window.clearTimeout(handle);
  }, [loadTrips]);

  const currentTrip = useMemo(() => {
    return trips.find((trip) => trip.status === 'RUNNING')
      || trips.find((trip) => trip.status === 'NOT_STARTED' || trip.status === 'NOT_CREATED')
      || trips.find((trip) => trip.status !== 'COMPLETED')
      || trips[0]
      || null;
  }, [trips]);

  const upcomingTrips = useMemo(() => {
    return trips
      .filter((trip) => tripKey(trip) !== tripKey(currentTrip))
      .filter((trip) => trip.status !== 'COMPLETED')
      .slice(0, 2);
  }, [trips, currentTrip]);

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Xin chào bác tài!</h1>
          <p className="text-brand-text/60 font-medium">
            Theo dõi chuyến được phân công hôm nay từ dữ liệu backend.
          </p>
        </div>
        <button
          onClick={loadTrips}
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Navigation className="w-6 h-6 text-brand-primary" /> Chuyến xe hiện tại
            </h2>
            <div className="px-3 py-1 bg-brand-surface text-brand-text font-bold text-xs rounded-full uppercase tracking-widest border border-black/5">
              {statusLabel(currentTrip?.status)}
            </div>
          </div>

          <div
            onClick={() => router.push('/driver/trips')}
            className="w-full flex-1 min-h-[300px] bg-brand-surface rounded-2xl border border-black/5 flex items-center justify-center mb-6 relative overflow-hidden group cursor-pointer hover:border-brand-primary transition-colors"
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
                  {currentTrip.departureTime?.slice(0, 5) || '--:--'} • {currentTrip.licensePlate || 'Chưa gán xe'}
                </p>
                <p className="text-xs text-brand-text/40 mt-2">Nhấn vào để xem lộ trình chi tiết</p>
              </div>
            ) : (
              <div className="text-center relative z-10">
                <MapPin className="w-10 h-10 text-brand-text/30 mx-auto mb-2 group-hover:text-brand-primary group-hover:scale-110 transition-all" />
                <p className="font-bold text-brand-text/60">Không có chuyến được phân công hôm nay</p>
                <p className="text-xs text-brand-text/40 mt-1">Kiểm tra lại ngày chạy hoặc tài khoản tài xế</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {currentTrip?.status === 'RUNNING' ? (
              <>
                <button
                  onClick={() => router.push('/driver/trips')}
                  className="col-span-2 md:col-span-1 py-4 rounded-2xl bg-brand-danger/10 text-brand-danger font-bold hover:bg-brand-danger hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Square className="w-5 h-5" /> Kết thúc chuyến
                </button>
                <div className="col-span-2 md:col-span-1 py-4 rounded-2xl bg-brand-success/10 text-brand-success font-bold flex items-center justify-center gap-2 border border-brand-success/20">
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-success"></span>
                  </span>
                  Đang chạy
                </div>
              </>
            ) : (
              <button
                onClick={() => router.push('/driver/trips')}
                disabled={!currentTrip}
                className="col-span-2 py-4 rounded-2xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                <Play className="w-5 h-5" /> Mở lịch chạy
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-brand-primary text-brand-text rounded-3xl p-6 shadow-sm flex flex-col border border-black/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Lịch chạy tiếp theo
            </h3>

            <div className="space-y-3">
              {upcomingTrips.length > 0 ? upcomingTrips.map((trip) => (
                <div key={tripKey(trip)} className="bg-white/60 p-4 rounded-2xl border border-white">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-bold">{trip.departureTime?.slice(0, 5) || '--:--'}</div>
                    <div className="text-[10px] font-bold bg-white px-2 py-1 rounded text-brand-text/60 uppercase">
                      {statusLabel(trip.status)}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-brand-text/80">{trip.routeName}</div>
                </div>
              )) : (
                <div className="bg-white/60 p-4 rounded-2xl border border-white text-sm font-bold text-brand-text/60">
                  Chưa có lịch tiếp theo từ backend
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/driver/trips')}
              className="mt-4 text-xs font-bold text-center w-full py-2 bg-white/20 rounded-xl hover:bg-white/40 transition-colors"
            >
              Xem toàn bộ lịch
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-warning" /> Hỗ trợ khẩn cấp
            </h3>
            <p className="text-xs text-brand-text/60 mb-6">
              Liên hệ bộ phận điều phối nếu xe gặp sự cố, kẹt xe hoặc thay đổi lộ trình.
            </p>

            <div className="space-y-3">
              <button className="w-full py-3 rounded-xl bg-brand-surface text-brand-text font-bold hover:bg-brand-text hover:text-white transition-all text-sm flex justify-center items-center gap-2 border border-black/5 hover:border-brand-text">
                <Phone className="w-4 h-4" /> Gọi điều phối viên
              </button>
              <button className="w-full py-3 rounded-xl bg-brand-danger/10 text-brand-danger font-bold hover:bg-brand-danger hover:text-white transition-all text-sm flex justify-center items-center gap-2 border border-brand-danger/20">
                <AlertTriangle className="w-4 h-4" /> Báo cáo sự cố
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
