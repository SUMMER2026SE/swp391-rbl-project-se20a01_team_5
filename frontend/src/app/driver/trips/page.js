"use client";

import { useState } from 'react';
import { MapPin, Navigation, Phone, CheckCircle2, Users, Flag } from 'lucide-react';

const ROUTE_STATIONS = [
  { id: 1, name: "KTX Bách Khoa", time: "14:00" },
  { id: 2, name: "Ngô Sĩ Liên", time: "14:05" },
  { id: 3, name: "Ngã ba Huế", time: "14:15" },
  { id: 4, name: "Nguyễn Lương Bằng", time: "14:25" },
  { id: 5, name: "Trường ĐH Bách Khoa", time: "14:30" },
];

export default function DriverTripPage() {
  const [currentStationIndex, setCurrentStationIndex] = useState(1);

  const currentStation = ROUTE_STATIONS[currentStationIndex];
  
  const handleArrive = () => {
    if (currentStationIndex < ROUTE_STATIONS.length) {
      setCurrentStationIndex(prev => prev + 1);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Chuyến đi hiện tại</h1>
          <p className="text-brand-text/60 font-medium">Tuyến 1 • Biển số: 43B-123.45</p>
        </div>
        <div className="px-4 py-2 bg-brand-success/10 text-brand-success rounded-xl font-bold border border-brand-success/20 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-success"></span>
          </span>
          Đang chạy ổn định
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        
        {/* Left Column: Timeline Map Bento */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="text-xl font-bold flex items-center gap-2 mb-8 relative z-10">
            <MapPin className="w-6 h-6 text-brand-primary" /> Lộ trình di chuyển
          </h2>

          <div className="flex-1 relative z-10 pl-4 md:pl-10">
            {/* Vertical Timeline Line */}
            <div className="absolute left-[29px] md:left-[53px] top-4 bottom-8 w-1 bg-black/5 rounded-full z-0"></div>

            {ROUTE_STATIONS.map((station, index) => {
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
                    ${isPassed ? 'bg-brand-surface border-black/5 opacity-50' : ''}
                    ${isCurrent ? 'bg-brand-primary/10 border-brand-primary/20 shadow-sm' : ''}
                    ${isFuture ? 'bg-white border-transparent hover:border-black/5' : ''}
                  `}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`font-bold text-lg ${isCurrent ? 'text-brand-primary' : 'text-brand-text'}`}>
                        {station.name}
                      </h3>
                      <span className="font-mono text-sm font-bold text-brand-text/50">{station.time}</span>
                    </div>
                    {isCurrent && (
                      <p className="text-sm font-medium text-brand-text/70">Đang tiến đến trạm này...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Controls & Contact */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-brand-primary rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col justify-center text-center relative overflow-hidden">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-text/50 mb-2 relative z-10">
              Trạm tiếp theo
            </h3>
            <div className="text-3xl font-black text-brand-text mb-8 relative z-10">
              {currentStation ? currentStation.name : 'Đã kết thúc'}
            </div>

            {currentStationIndex < ROUTE_STATIONS.length ? (
              <button 
                onClick={handleArrive}
                className="w-full py-5 rounded-2xl bg-white text-brand-text font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <Flag className="w-6 h-6 text-brand-primary fill-brand-primary" /> Đã đến Trạm!
              </button>
            ) : (
              <button 
                className="w-full py-5 rounded-2xl bg-brand-success text-white font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <CheckCircle2 className="w-6 h-6" /> Hoàn thành chuyến xe
              </button>
            )}
            
            <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
              <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
                <div className="text-xs font-bold text-brand-text/50 uppercase mb-1">Tốc độ</div>
                <div className="text-2xl font-black">42 <span className="text-sm font-bold">km/h</span></div>
              </div>
              <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
                <div className="text-xs font-bold text-brand-text/50 uppercase mb-1">Khách trên xe</div>
                <div className="text-2xl font-black">28 <span className="text-sm font-bold">/45</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-secondary" /> Phụ xe chuyến này
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-brand-surface rounded-2xl border border-black/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-secondary/20 rounded-full flex items-center justify-center text-brand-secondary font-bold">
                  B
                </div>
                <div>
                  <div className="font-bold text-sm">Trần Văn Bình</div>
                  <div className="text-xs font-medium text-brand-text/60">SĐT: 0901234567</div>
                </div>
              </div>
              <button className="p-3 bg-brand-primary rounded-xl text-brand-text hover:bg-black hover:text-white transition-colors shadow-sm">
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
