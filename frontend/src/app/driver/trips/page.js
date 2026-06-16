"use client";

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Flag, MapPin, Navigation, Phone, Users } from 'lucide-react';
import { driverApi } from '@/services/api';
import { currentTripMock } from '@/services/mockTrips';

export default function DriverTripPage() {
  const [trip, setTrip] = useState(currentTripMock);
  const [notice, setNotice] = useState('');
  const [currentStationIndex, setCurrentStationIndex] = useState(() => getCurrentStopIndex(currentTripMock.stops));

  useEffect(() => {
    let mounted = true;

    driverApi.getCurrentTrip()
      .then((data) => {
        if (!mounted || !data) return;
        setTrip(data);
        setCurrentStationIndex(getCurrentStopIndex(data.stops));
        setNotice('');
      })
      .catch(() => {
        if (!mounted) return;
        setTrip(currentTripMock);
        setCurrentStationIndex(getCurrentStopIndex(currentTripMock.stops));
        setNotice('Đang dùng dữ liệu mẫu vì backend chưa sẵn sàng hoặc chưa đăng nhập tài khoản DRIVER.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const routeStations = trip?.stops || [];
  const currentStation = routeStations[currentStationIndex];
  const isTripFinished = currentStationIndex >= routeStations.length;

  const tripProgress = useMemo(() => {
    if (!routeStations.length) return 0;
    return Math.min(100, Math.round((currentStationIndex / routeStations.length) * 100));
  }, [currentStationIndex, routeStations.length]);

  const handleArrive = () => {
    if (!isTripFinished) {
      setCurrentStationIndex((current) => current + 1);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Chuyến đi hiện tại</h1>
          <p className="text-brand-text/60 font-medium">{trip?.routeName || '--'} - Biển số: {trip?.licensePlate || '--'}</p>
        </div>
        <div className="px-4 py-2 bg-brand-success/10 text-brand-success rounded-xl font-bold border border-brand-success/20 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-success"></span>
          </span>
          {statusText(trip?.status)}
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl border border-brand-secondary/20 bg-brand-secondary/10 p-4 text-sm font-bold text-brand-text">
          {notice}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-start justify-between gap-4 mb-8 relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-brand-primary" /> Lộ trình di chuyển
            </h2>
            <div className="text-right">
              <div className="text-xs font-bold text-brand-text/40 uppercase">Tiến độ</div>
              <div className="font-black">{tripProgress}%</div>
            </div>
          </div>

          <div className="flex-1 relative z-10 pl-4 md:pl-10">
            <div className="absolute left-[29px] md:left-[53px] top-4 bottom-8 w-1 bg-black/5 rounded-full z-0"></div>

            {routeStations.map((station, index) => {
              const isPassed = index < currentStationIndex;
              const isCurrent = index === currentStationIndex;
              const isFuture = index > currentStationIndex;

              return (
                <div key={station.id} className="relative z-10 flex items-start gap-6 mb-8 last:mb-0 group">
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
                    ${isPassed ? 'bg-brand-surface border-black/5 opacity-60' : ''}
                    ${isCurrent ? 'bg-brand-primary/10 border-brand-primary/20 shadow-sm' : ''}
                    ${isFuture ? 'bg-white border-transparent hover:border-black/5' : ''}
                  `}>
                    <div className="flex justify-between items-center mb-1 gap-4">
                      <h3 className={`font-bold text-lg ${isCurrent ? 'text-brand-primary' : 'text-brand-text'}`}>
                        {station.name}
                      </h3>
                      <span className="font-mono text-sm font-bold text-brand-text/50">{station.time}</span>
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
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-text/50 mb-2 relative z-10">
              Trạm tiếp theo
            </h3>
            <div className="text-3xl font-black text-brand-text mb-8 relative z-10">
              {currentStation ? currentStation.name : 'Đã hoàn thành'}
            </div>

            {!isTripFinished ? (
              <button
                onClick={handleArrive}
                className="w-full py-5 rounded-2xl bg-white text-brand-text font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <Flag className="w-6 h-6 text-brand-primary fill-brand-primary" /> Đã đến trạm
              </button>
            ) : (
              <button className="w-full py-5 rounded-2xl bg-brand-success text-white font-black text-lg flex items-center justify-center gap-3 shadow-sm">
                <CheckCircle2 className="w-6 h-6" /> Hoàn thành chuyến xe
              </button>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
              <Stat label="Tốc độ" value={`${trip?.averageSpeed ?? '--'}`} suffix="km/h" />
              <Stat label="Khách trên xe" value={`${trip?.passengerCount ?? '--'}`} suffix={`/${trip?.capacity ?? '--'}`} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-secondary" /> Phụ xe chuyến này
            </h3>

            <div className="flex items-center justify-between p-4 bg-brand-surface rounded-2xl border border-black/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-secondary/20 rounded-full flex items-center justify-center text-brand-secondary font-bold">
                  {initials(trip?.conductorName || '--')}
                </div>
                <div>
                  <div className="font-bold text-sm">{trip?.conductorName || '--'}</div>
                  <div className="text-xs font-medium text-brand-text/60">SĐT: {trip?.conductorPhone || '--'}</div>
                </div>
              </div>
              <a href={`tel:${(trip?.conductorPhone || '').replaceAll(' ', '')}`} className="p-3 bg-brand-primary rounded-xl text-brand-text hover:bg-black hover:text-white transition-colors shadow-sm">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
      <div className="text-xs font-bold text-brand-text/50 uppercase mb-1">{label}</div>
      <div className="text-2xl font-black">{value} <span className="text-sm font-bold">{suffix}</span></div>
    </div>
  );
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase();
}

function getCurrentStopIndex(stops = []) {
  const currentIndex = stops.findIndex((station) => station.status === 'current');
  return currentIndex >= 0 ? currentIndex : 0;
}

function statusText(status) {
  const labels = {
    IN_PROGRESS: 'Đang vận hành',
    STARTED: 'Đang vận hành',
    COMPLETED: 'Hoàn thành',
  };
  return labels[status] || status || 'Sẵn sàng';
}
