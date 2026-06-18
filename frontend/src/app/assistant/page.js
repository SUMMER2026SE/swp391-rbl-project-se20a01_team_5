"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Map, QrCode, RefreshCw, Users } from 'lucide-react';
import { conductorApi } from '@/services/api';

function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function AssistantDashboard() {
  const [serviceDate, setServiceDate] = useState(todayInput());
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const scanReadyTrips = useMemo(() => trips.filter((trip) => trip.tripId), [trips]);
  const currentTrip = useMemo(() => (
    scanReadyTrips.find((trip) => String(trip.tripId) === String(selectedTripId)) || scanReadyTrips[0] || trips[0] || null
  ), [scanReadyTrips, trips, selectedTripId]);

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await conductorApi.listTrips(serviceDate);
      const nextTrips = data || [];
      const scanTrips = nextTrips.filter((trip) => trip.tripId);
      setTrips(nextTrips);
      setSelectedTripId((current) => {
        if (current && scanTrips.some((trip) => String(trip.tripId) === String(current))) {
          return current;
        }
        return scanTrips[0]?.tripId || '';
      });
    } catch (err) {
      setError(err.message);
      setTrips([]);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [serviceDate]);

  useEffect(() => {
    const handle = window.setTimeout(loadTrips, 0);
    return () => window.clearTimeout(handle);
  }, [loadTrips]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!currentTrip?.tripId) {
        setTickets([]);
        return;
      }
      conductorApi.listTickets(currentTrip.tripId)
        .then((items) => setTickets(items || []))
        .catch(() => setTickets([]));
    }, 0);

    return () => window.clearTimeout(handle);
  }, [currentTrip?.tripId]);

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Chuyến phân công</h1>
          <p className="text-brand-text/60 font-medium">Dữ liệu chuyến và vé lấy trực tiếp từ backend.</p>
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

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-brand-text/50 font-bold">Đang tải chuyến phân công...</div>
      ) : !currentTrip ? (
        <div className="flex-1 flex items-center justify-center text-center text-brand-text/50 font-bold">
          Không có chuyến nào được phân công cho ngày này.
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="bg-brand-primary text-brand-text rounded-3xl p-8 shadow-sm border border-black/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">{currentTrip.status}</span>
                    {currentTrip.tripId && <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">TRIP-{currentTrip.tripId}</span>}
                  </div>
                  <h2 className="text-3xl font-black mb-2">{currentTrip.routeName}</h2>
                  <p className="font-medium text-brand-text/80">Biển số: {currentTrip.licensePlate || 'Chưa gán'} • Tài xế: {currentTrip.driverName || 'Chưa gán'}</p>
                </div>
                {scanReadyTrips.length > 1 && (
                  <select
                    value={selectedTripId}
                    onChange={(event) => setSelectedTripId(event.target.value)}
                    className="bg-white/70 border border-white/50 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none"
                  >
                    {scanReadyTrips.map((trip) => (
                      <option key={trip.tripId} value={trip.tripId}>
                        {trip.departureTime?.slice(0, 5)} • {trip.routeName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
                <Metric label="Khởi hành" value={currentTrip.departureTime?.slice(0, 5) || '--:--'} />
                <Metric label="Đã lên xe" value={tickets.filter((ticket) => ticket.lastScannedAt).length} />
                <Metric label="Vé hợp lệ" value={tickets.length} />
                <Metric label="Trạng thái" value={currentTrip.status} success={currentTrip.status === 'RUNNING'} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href={currentTrip?.tripId ? `/assistant/scanner?tripId=${currentTrip.tripId}` : '/assistant/scanner'} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex items-center justify-between hover:border-brand-primary transition-colors">
                <div>
                  <p className="text-sm font-bold text-brand-text/60 uppercase tracking-wider mb-2">Quét vé</p>
                  <div className="text-xl font-black text-brand-text">Mở camera / nhập QR</div>
                </div>
                <QrCode className="w-10 h-10 text-brand-primary" />
              </Link>

              <Link href="/assistant/verify-ticket" className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex items-center justify-between hover:border-brand-primary transition-colors">
                <div>
                  <p className="text-sm font-bold text-brand-text/60 uppercase tracking-wider mb-2">Danh sách vé</p>
                  <div className="text-xl font-black text-brand-text">{tickets.length} vé</div>
                </div>
                <Users className="w-10 h-10 text-brand-secondary" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex flex-col h-[500px]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Map className="w-6 h-6 text-brand-text/60" /> Lộ trình & trạm
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar relative pl-4">
              <div className="absolute left-6 top-4 bottom-4 w-1 bg-brand-surface rounded-full"></div>
              <div className="flex flex-col gap-6 relative">
                {(currentTrip.stops || []).map((stop) => (
                  <div key={stop.routeStopId || stop.stopId} className="flex gap-4 relative">
                    <div className="w-5 h-5 mt-1 rounded-full border-4 border-white shadow-sm bg-brand-surface"></div>
                    <div className="flex-1 rounded-2xl p-4 border bg-brand-surface border-transparent">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-bold">{stop.stopName}</h4>
                        <span className="text-sm font-mono text-brand-text/50">#{stop.stopOrder}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {!currentTrip.stops?.length && (
                  <div className="text-sm font-bold text-brand-text/50 text-center py-10">
                    Tuyến này chưa có trạm dừng.
                  </div>
                )}
              </div>
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
