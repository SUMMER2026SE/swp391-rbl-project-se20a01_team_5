"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, Map, MapPin, QrCode, RefreshCw, Users, XCircle } from 'lucide-react';
import { assistantTicketApi } from '@/services/api';

const STATUS_LABELS = {
  RUNNING: 'Đang vận hành',
  NOT_STARTED: 'Chưa khởi hành',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export default function AssistantDashboard() {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await assistantTicketApi.dashboard();
      setTrips(data?.trips || []);
    } catch (err) {
      setError(err.message);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(loadDashboard, 0);
    return () => window.clearTimeout(handle);
  }, [loadDashboard]);

  const currentTrip = useMemo(() => (
    trips.find((trip) => trip.status === 'RUNNING') || trips[0] || null
  ), [trips]);

  const runningTrips = useMemo(() => trips.filter((trip) => trip.status === 'RUNNING'), [trips]);

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Chuyến phân công</h1>
          <p className="text-brand-text/60 font-medium">Theo dõi lịch trình và tình trạng chuyến xe hiện tại.</p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          className="px-5 py-3 rounded-2xl bg-white border border-black/5 font-bold text-sm hover:bg-brand-surface transition-colors flex items-center gap-2 shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Tải chuyến
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger flex items-center gap-2">
          <XCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {isLoading && !currentTrip ? (
        <div className="flex-1 bg-white rounded-3xl border border-black/5 shadow-sm flex items-center justify-center text-brand-text/60 font-bold">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải chuyến phân công...
        </div>
      ) : !currentTrip ? (
        <div className="flex-1 bg-white rounded-3xl border border-black/5 shadow-sm flex flex-col items-center justify-center text-center p-8">
          <AlertCircle className="w-12 h-12 text-brand-warning mb-4" />
          <h2 className="text-2xl font-black text-brand-text mb-2">Chưa có chuyến hôm nay</h2>
          <p className="text-brand-text/60 font-medium max-w-md">Khi admin hoặc điều phối phân công chuyến cho phụ xe, chuyến đó sẽ xuất hiện ở đây và dùng chung với màn quét vé.</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="bg-brand-primary text-brand-text rounded-3xl p-8 shadow-sm border border-black/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="flex items-start justify-between relative z-10 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">{STATUS_LABELS[currentTrip.status] || currentTrip.status}</span>
                    <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">TRIP-{currentTrip.tripId}</span>
                  </div>
                  <h2 className="text-3xl font-black mb-2">{currentTrip.routeName}</h2>
                  <p className="font-medium text-brand-text/80">Biển số: {currentTrip.licensePlate || 'N/A'} • Ngày chạy: {formatDate(currentTrip.serviceDate)}</p>
                </div>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <MapPin className="w-8 h-8" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
                <Metric label="Khởi hành" value={formatTime(currentTrip.departureTime)} />
                <Metric label="Mã chuyến" value={`TRIP-${currentTrip.tripId}`} />
                <Metric label="Chuyến hôm nay" value={trips.length} />
                <Metric label="Trạng thái" value={STATUS_LABELS[currentTrip.status] || currentTrip.status} success={currentTrip.status === 'RUNNING'} />
              </div>

              <div className="relative z-10 mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/assistant/scanner?tripId=${currentTrip.tripId}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-text px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-black transition-colors"
                >
                  <QrCode className="w-4 h-4" /> Quét vé chuyến này
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-text/60 uppercase tracking-wider mb-2">Chuyến hôm nay</p>
                  <div className="text-4xl font-black text-brand-text">{trips.length}</div>
                </div>
                <div className="w-16 h-16 bg-brand-surface rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-brand-text" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-text/60 uppercase tracking-wider mb-2">Đang chạy</p>
                  <div className="text-4xl font-black text-brand-success">{runningTrips.length}</div>
                </div>
                <div className="w-16 h-16 bg-brand-success/20 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-brand-success" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex flex-col h-[500px]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Map className="w-6 h-6 text-brand-text/60" /> Các chuyến được phân công
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
              {trips.map((trip) => (
                <Link
                  key={trip.tripId}
                  href={`/assistant/scanner?tripId=${trip.tripId}`}
                  className={`rounded-2xl p-4 border transition-colors ${trip.tripId === currentTrip.tripId ? 'bg-brand-primary/10 border-brand-primary/20' : 'bg-brand-surface border-transparent hover:border-brand-primary/30'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold text-brand-text">{trip.routeName}</h4>
                    <span className="text-xs font-black text-brand-text/50">TRIP-{trip.tripId}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm font-medium text-brand-text/60">
                    <span>{trip.licensePlate || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {STATUS_LABELS[trip.status] || trip.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, success = false }) {
  return (
    <div className="bg-white/40 p-4 rounded-2xl backdrop-blur-sm">
      <div className="text-sm font-bold text-brand-text/60 mb-1">{label}</div>
      <div className={`font-black text-xl ${success ? 'text-brand-success' : ''}`}>{value}</div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'Hôm nay';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatTime(value) {
  if (!value) return '--:--';
  if (typeof value === 'string' && value.length >= 5) return value.slice(0, 5);
  return value;
}
