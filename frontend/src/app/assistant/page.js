"use client";

import { AlertCircle, Clock, Map, MapPin, Users } from 'lucide-react';
import { currentTripMock } from '@/services/mockTrips';

export default function AssistantDashboard() {
  const currentStopIndex = currentTripMock.stops.findIndex((stop) => stop.status === 'current');

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Chuyến phân công</h1>
        <p className="text-brand-text/60 font-medium">Theo dõi lịch trình và tình trạng chuyến xe hiện tại.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="bg-brand-primary text-brand-text rounded-3xl p-8 shadow-sm border border-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="flex items-start justify-between relative z-10 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">{currentTripMock.status}</span>
                  <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">{currentTripMock.tripId}</span>
                </div>
                <h2 className="text-3xl font-black mb-2">{currentTripMock.routeName}</h2>
                <p className="font-medium text-brand-text/80">Biển số: {currentTripMock.licensePlate} • Tài xế: {currentTripMock.driverName}</p>
              </div>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <MapPin className="w-8 h-8" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
              <Metric label="Khởi hành" value={currentTripMock.departedAt} />
              <Metric label="Dự kiến tới" value={currentTripMock.estimatedArrivalAt} />
              <Metric label="Tốc độ TB" value={`${currentTripMock.averageSpeed} km/h`} />
              <Metric label="Trạng thái" value="Ổn định" success />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-brand-text/60 uppercase tracking-wider mb-2">Sĩ số hiện tại</p>
                <div className="text-4xl font-black text-brand-text">{currentTripMock.passengerCount} <span className="text-xl font-bold text-brand-text/40">/ {currentTripMock.capacity}</span></div>
              </div>
              <div className="w-16 h-16 bg-brand-surface rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-brand-text" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-brand-text/60 uppercase tracking-wider mb-2">Cảnh báo chuyến</p>
                <div className="text-xl font-bold text-brand-success">{currentTripMock.alerts}</div>
              </div>
              <div className="w-16 h-16 bg-brand-success/20 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-brand-success" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex flex-col h-[500px]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Map className="w-6 h-6 text-brand-text/60" /> Lộ trình & Các trạm
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative pl-4">
            <div className="absolute left-6 top-4 bottom-4 w-1 bg-brand-surface rounded-full"></div>

            <div className="flex flex-col gap-6 relative">
              {currentTripMock.stops.map((stop, index) => {
                const isCurrent = index === currentStopIndex;
                const isPassed = index < currentStopIndex;
                return (
                  <div key={stop.id} className="flex gap-4 relative">
                    <div className={`w-5 h-5 mt-1 rounded-full border-4 border-white shadow-sm ${isCurrent ? 'bg-brand-primary animate-pulse' : isPassed ? 'bg-brand-success' : 'bg-brand-surface'}`}></div>
                    <div className={`flex-1 rounded-2xl p-4 border ${isCurrent ? 'bg-brand-primary/10 border-brand-primary/20' : 'bg-brand-surface border-transparent'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-bold">{stop.name}</h4>
                        <span className="text-sm font-mono text-brand-text/50">{stop.time}</span>
                      </div>
                      {isCurrent && (
                        <p className="text-sm font-medium text-brand-text/60 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Đang phục vụ trạm này
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
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
