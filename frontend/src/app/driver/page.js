"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BusFront, Clock, MapPin, Navigation, Play, RefreshCw } from 'lucide-react';
import { driverTripApi } from '@/services/api';

function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function DriverDashboard() {
  const [serviceDate, setServiceDate] = useState(todayInput());
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await driverTripApi.list(serviceDate);
      setTrips(data || []);
    } catch (err) {
      setError(err.message);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, [serviceDate]);

  useEffect(() => {
    const handle = window.setTimeout(loadTrips, 0);
    return () => window.clearTimeout(handle);
  }, [loadTrips]);

  const runningTrip = useMemo(() => trips.find((trip) => trip.status === 'RUNNING') || null, [trips]);
  const nextTrip = useMemo(() => runningTrip || trips.find((trip) => trip.status !== 'COMPLETED') || trips[0] || null, [runningTrip, trips]);

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Xin chào Bác tài!</h1>
          <p className="text-brand-text/60 font-medium">Lịch chạy lấy trực tiếp từ hệ thống điều phối.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={serviceDate}
            onChange={(event) => setServiceDate(event.target.value)}
            className="bg-white border border-black/5 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-brand-primary shadow-sm"
          />
          <button onClick={loadTrips} className="px-4 py-3 bg-white border border-black/5 rounded-2xl hover:bg-brand-surface">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
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
              {nextTrip?.status || 'Không có chuyến'}
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 min-h-[300px] bg-brand-surface rounded-2xl flex items-center justify-center text-brand-text/50 font-bold">
              Đang tải lịch chạy...
            </div>
          ) : nextTrip ? (
            <Link href="/driver/trips" className="w-full flex-1 min-h-[300px] bg-brand-surface rounded-2xl border border-black/5 flex items-center justify-center mb-6 relative overflow-hidden group cursor-pointer hover:border-brand-primary transition-colors">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="text-center relative z-10 px-6">
                <MapPin className="w-10 h-10 text-brand-primary mx-auto mb-3 group-hover:scale-110 transition-all" />
                <p className="font-black text-2xl text-brand-text">{nextTrip.routeName}</p>
                <p className="text-sm text-brand-text/60 mt-2">{nextTrip.licensePlate || 'Chưa gán xe'} • {nextTrip.departureTime?.slice(0, 5) || '--:--'}</p>
              </div>
            </Link>
          ) : (
            <div className="flex-1 min-h-[300px] bg-brand-surface rounded-2xl flex items-center justify-center text-center text-brand-text/50 font-bold">
              Không có chuyến nào được phân công cho ngày này.
            </div>
          )}

          <Link href="/driver/trips" className="py-4 rounded-2xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm">
            <Play className="w-5 h-5" /> Mở lịch chạy
          </Link>
        </div>

        <div className="bg-brand-primary text-brand-text rounded-3xl p-6 shadow-sm flex flex-col border border-black/5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Lịch chạy hôm nay
          </h3>

          <div className="space-y-3">
            {trips.map((trip) => (
              <Link key={trip.tripId || trip.scheduleId} href="/driver/trips" className="block bg-white/60 p-4 rounded-2xl border border-white hover:bg-white transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-bold">{trip.departureTime?.slice(0, 5) || '--:--'}</div>
                  <div className="text-[10px] font-bold bg-white px-2 py-1 rounded text-brand-text/60 uppercase">{trip.status}</div>
                </div>
                <div className="text-xs font-medium text-brand-text/80 flex items-center gap-1">
                  <BusFront className="w-3.5 h-3.5" /> {trip.routeName}
                </div>
              </Link>
            ))}
            {!isLoading && trips.length === 0 && (
              <div className="bg-white/40 p-4 rounded-2xl text-sm font-bold text-brand-text/60">
                Không có lịch chạy.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
