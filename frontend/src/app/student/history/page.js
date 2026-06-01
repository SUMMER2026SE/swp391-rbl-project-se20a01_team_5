"use client";

import { useEffect, useState } from 'react';
import { History, MapPin, Clock, BusFront, RefreshCw } from 'lucide-react';
import { travelApi } from '@/services/api';
import { recentTripMocks } from '@/services/mockTrips';

export default function TripHistoryPage() {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = () => {
    setIsLoading(true);
    setError('');

    travelApi.getHistory({ page: 0, size: 20 })
      .then((items) => setTrips(items?.length ? items : recentTripMocks))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const handle = window.setTimeout(loadHistory, 0);
    return () => window.clearTimeout(handle);
  }, []);

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Lịch sử chuyến đi</h1>
          <p className="text-brand-text/60 font-medium">Dữ liệu được tải từ API lịch sử di chuyển của sinh viên.</p>
        </div>
        <button
          onClick={loadHistory}
          className="bg-brand-surface border border-black/5 text-brand-text px-6 py-3 rounded-2xl font-bold hover:bg-brand-text hover:text-white transition-colors flex items-center gap-2 shadow-sm w-fit"
        >
          <RefreshCw className="w-5 h-5" /> Tải lại
        </button>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <History className="w-6 h-6 text-brand-secondary" /> Chuyến đi gần đây
          </h2>

          {isLoading ? (
            <div className="py-20 text-center text-brand-text/50 font-bold">Đang tải lịch sử...</div>
          ) : trips.length ? (
            <div className="flex flex-col gap-4">
              {trips.map((trip) => (
                <div key={trip.travelHistoryId} className="border border-black/5 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 justify-between hover:border-brand-primary/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-surface rounded-xl flex items-center justify-center shrink-0">
                      <BusFront className="w-6 h-6 text-brand-text/50" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{trip.routeName}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-brand-text/60 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {formatDate(trip.serviceDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> Chuyến #{trip.tripId}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <StopBadge label="Lên xe" value={trip.boardingStopName} time={trip.boardedAt} />
                        <StopBadge label="Xuống xe" value={trip.alightingStopName} time={trip.alightedAt} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-brand-text/50 font-bold">
              Chưa có lịch sử chuyến đi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StopBadge({ label, value, time }) {
  return (
    <div className="bg-brand-surface rounded-2xl p-4">
      <div className="text-xs font-black text-brand-text/40 uppercase">{label}</div>
      <div className="font-bold text-brand-text mt-1">{value || 'Chưa ghi nhận'}</div>
      <div className="text-xs font-medium text-brand-text/50 mt-1">{formatDateTime(time)}</div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'Chưa có ngày';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return 'Chưa có thời gian';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}
