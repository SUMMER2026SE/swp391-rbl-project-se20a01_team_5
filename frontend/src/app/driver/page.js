"use client";

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, MapPin, Navigation, Phone, Play, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { driverApi } from '@/services/api';
import { currentTripMock } from '@/services/mockTrips';

const fallbackDashboard = {
  currentTrip: currentTripMock,
  nextSchedules: [
    { id: 'mock-1', timeRange: '09:00 - 09:45', routeName: 'ITER1 - City Connector', status: 'UPCOMING' },
    { id: 'mock-2', timeRange: '14:00 - 14:45', routeName: 'ITER1 - Campus Loop', status: 'UPCOMING' },
  ],
  tripStatus: 'IN_PROGRESS',
};

export default function DriverDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let mounted = true;

    driverApi.getDashboard()
      .then((data) => {
        if (mounted && data) {
          setDashboard(data);
          setNotice('');
        }
      })
      .catch(() => {
        if (mounted) {
          setDashboard(fallbackDashboard);
          setNotice('Dang dung du lieu mau vi backend chua san sang hoac chua dang nhap tai khoan DRIVER.');
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const trip = dashboard.currentTrip;
  const isRunning = ['IN_PROGRESS', 'STARTED', 'DANG_CHAY'].includes(dashboard.tripStatus);
  const firstStops = useMemo(() => trip?.stops?.slice(0, 3) ?? [], [trip]);

  const handleTripAction = async () => {
    if (!trip?.tripId) return;
    try {
      const result = isRunning ? await driverApi.endTrip(trip.tripId) : await driverApi.startTrip(trip.tripId);
      if (result?.trip) {
        setDashboard((current) => ({
          ...current,
          currentTrip: result.trip,
          tripStatus: result.status === 'COMPLETED' ? 'COMPLETED' : result.trip.status,
        }));
      }
      setNotice(result?.message || 'Da cap nhat trang thai chuyen.');
    } catch (error) {
      setNotice(error.message || 'Khong the cap nhat chuyen xe.');
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Bang dieu khien tai xe</h1>
          <p className="text-brand-text/60 font-medium">Theo doi chuyen hien tai, lich tiep theo va lien he dieu phoi.</p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-white border border-black/5 text-sm font-bold text-brand-text shadow-sm">
          {isLoading ? 'Dang tai...' : statusText(dashboard.tripStatus)}
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl border border-brand-secondary/20 bg-brand-secondary/10 p-4 text-sm font-bold text-brand-text">
          {notice}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Navigation className="w-6 h-6 text-brand-primary" /> Chuyen xe hien tai
            </h2>
            <div className="px-3 py-1 bg-brand-surface text-brand-text font-bold text-xs rounded-full uppercase tracking-widest border border-black/5">
              {trip?.routeName || 'Chua co tuyen'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/driver/trips')}
            className="w-full flex-1 min-h-[300px] bg-brand-surface rounded-2xl border border-black/5 flex items-center justify-center mb-6 relative overflow-hidden group cursor-pointer hover:border-brand-primary transition-colors text-left"
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="relative z-10 w-full max-w-2xl px-6">
              <div className="flex items-center gap-4 mb-5">
                <MapPin className="w-10 h-10 text-brand-primary group-hover:scale-110 transition-all" />
                <div>
                  <p className="font-black text-2xl text-brand-text">{trip?.licensePlate || '--'}</p>
                  <p className="text-sm font-bold text-brand-text/50">{trip?.departedAt || '--'} - {trip?.estimatedArrivalAt || '--'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {firstStops.map((stop) => (
                  <div key={stop.id} className="rounded-2xl bg-white/70 border border-white p-4">
                    <div className="text-xs font-bold text-brand-text/40 uppercase">{stop.time}</div>
                    <div className="font-bold text-sm text-brand-text">{stop.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Metric label="Toc do" value={trip?.averageSpeed ?? '--'} suffix="km/h" />
            <Metric label="Khach" value={trip?.passengerCount ?? '--'} suffix={`/${trip?.capacity ?? '--'}`} />
            <Metric label="An toan" value={trip?.safetyScore ?? '--'} suffix="/100" />
            <Metric label="Canh bao" value={trip?.alerts || '--'} />
          </div>

          <button
            type="button"
            onClick={handleTripAction}
            disabled={!trip?.tripId}
            className={`w-full py-4 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 ${
              isRunning
                ? 'bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white'
                : 'bg-brand-text text-white hover:bg-black'
            }`}
          >
            {isRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isRunning ? 'Ket thuc chuyen' : 'Bat dau chuyen xe'}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-brand-primary text-brand-text rounded-3xl p-6 shadow-sm flex flex-col border border-black/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Lich chay tiep theo
            </h3>

            <div className="space-y-3">
              {(dashboard.nextSchedules || []).map((schedule) => (
                <div key={schedule.id} className="bg-white/60 p-4 rounded-2xl border border-white">
                  <div className="flex justify-between items-start mb-1 gap-3">
                    <div className="text-sm font-bold">{schedule.timeRange}</div>
                    <div className="text-[10px] font-bold bg-white px-2 py-1 rounded text-brand-text/60 uppercase">{schedule.status}</div>
                  </div>
                  <div className="text-xs font-medium text-brand-text/80">{schedule.routeName}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-warning" /> Ho tro khan cap
            </h3>
            <p className="text-xs text-brand-text/60 mb-6">Lien he dieu phoi khi xe gap su co, ket xe hoac thay doi lo trinh.</p>

            <div className="space-y-3">
              <a href={`tel:${trip?.dispatcherPhone || '0909988776'}`} className="w-full py-3 rounded-xl bg-brand-surface text-brand-text font-bold hover:bg-brand-text hover:text-white transition-all text-sm flex justify-center items-center gap-2 border border-black/5 hover:border-brand-text">
                <Phone className="w-4 h-4" /> Goi dieu phoi
              </a>
              <button
                type="button"
                onClick={() => router.push('/driver/contact')}
                className="w-full py-3 rounded-xl bg-brand-danger/10 text-brand-danger font-bold hover:bg-brand-danger hover:text-white transition-all text-sm flex justify-center items-center gap-2 border border-brand-danger/20"
              >
                <AlertTriangle className="w-4 h-4" /> Bao cao su co
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, suffix = '' }) {
  return (
    <div className="rounded-2xl bg-brand-surface border border-black/5 p-4">
      <div className="text-xs font-bold text-brand-text/40 uppercase mb-1">{label}</div>
      <div className="text-xl font-black text-brand-text">{value} <span className="text-xs font-bold">{suffix}</span></div>
    </div>
  );
}

function statusText(status) {
  const labels = {
    IN_PROGRESS: 'Dang chay',
    STARTED: 'Dang chay',
    COMPLETED: 'Hoan thanh',
    UPCOMING: 'Sap toi',
    IDLE: 'San sang',
  };
  return labels[status] || status || 'San sang';
}
