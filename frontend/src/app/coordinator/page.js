"use client";

import { useState, useEffect } from 'react';
import { Activity, BusFront, Map, AlertTriangle, Users, Navigation, Radio, Maximize, Search } from 'lucide-react';

const FLEET_DATA = [
  { id: '43B-123.45', route: 'Tuyến 1', driver: 'Nguyễn Văn Tài', status: 'moving', speed: '45 km/h', location: 'Ngã ba Huế', x: 30, y: 40 },
  { id: '43B-888.99', route: 'Tuyến 2', driver: 'Trần Văn B', status: 'stopped', speed: '0 km/h', location: 'KTX Bách Khoa', x: 70, y: 20 },
  { id: '43B-555.22', route: 'Tuyến 1', driver: 'Lê Hoàng C', status: 'warning', speed: '15 km/h', location: 'Cầu Rồng', x: 50, y: 70 },
];

export default function CoordinatorDashboard() {
  // Simple animation hook to make the map feel alive
  const [pulse, setPulse] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      
      {/* Header & Quick Stats */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <Radio className="w-8 h-8 text-brand-danger animate-pulse" /> Giám sát Trực tuyến
          </h1>
          <p className="text-brand-text/60 font-medium">Trung tâm kiểm soát vị trí và trạng thái toàn bộ đội xe UniBus.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:w-2/3 shrink-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 flex flex-col justify-center">
            <div className="text-sm font-bold text-brand-text/50 uppercase mb-1">Xe đang chạy</div>
            <div className="text-2xl font-black text-brand-primary">24 <span className="text-sm font-bold text-brand-text/40">/ 30</span></div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 flex flex-col justify-center">
            <div className="text-sm font-bold text-brand-text/50 uppercase mb-1">Tài xế trực ban</div>
            <div className="text-2xl font-black text-brand-success">26 <span className="text-sm font-bold text-brand-text/40">người</span></div>
          </div>
          <div className="bg-brand-danger/10 rounded-2xl p-4 border border-brand-danger/20 flex flex-col justify-center">
            <div className="text-sm font-bold text-brand-danger uppercase mb-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Cảnh báo / Trễ</div>
            <div className="text-2xl font-black text-brand-danger">1 <span className="text-sm font-bold text-brand-danger/50">xe</span></div>
          </div>
          <div className="bg-brand-text text-white rounded-2xl p-4 shadow-sm flex flex-col justify-center">
            <div className="text-sm font-bold text-white/50 uppercase mb-1">Tổng khách (Đã quẹt)</div>
            <div className="text-2xl font-black text-white">1,420</div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 overflow-hidden pb-6">
        
        {/* Main Map Area (Spans 3 cols) */}
        <div className="xl:col-span-3 bg-brand-surface/30 rounded-3xl shadow-sm border border-black/5 relative overflow-hidden flex flex-col">
          
          <div className="absolute top-6 left-6 z-20 flex gap-2">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm font-bold text-sm flex items-center gap-2 border border-black/5">
              <span className="w-3 h-3 rounded-full bg-brand-success"></span> Bình thường
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm font-bold text-sm flex items-center gap-2 border border-black/5">
              <span className="w-3 h-3 rounded-full bg-brand-danger"></span> Cảnh báo SOS / Tắc đường
            </div>
          </div>

          <button className="absolute top-6 right-6 z-20 bg-white p-3 rounded-xl shadow-sm border border-black/5 hover:bg-brand-surface transition-colors">
            <Maximize className="w-5 h-5 text-brand-text" />
          </button>

          {/* Macro Mock Map */}
          <div className="flex-1 relative bg-[#EBEFE8] overflow-hidden">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20" 
                 style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
            </div>
            
            {/* Major Routes Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <path d="M 10% 20% Q 40% 10% 80% 30% T 90% 80%" fill="none" stroke="#2F3627" strokeWidth="20" strokeLinecap="round" className="opacity-10" />
              <path d="M 20% 80% Q 50% 90% 60% 50% T 90% 20%" fill="none" stroke="#2F3627" strokeWidth="16" strokeLinecap="round" className="opacity-10" />
              <path d="M 10% 20% Q 40% 10% 80% 30% T 90% 80%" fill="none" stroke="#C6ED2C" strokeWidth="4" strokeLinecap="round" className="opacity-60" />
              <path d="M 20% 80% Q 50% 90% 60% 50% T 90% 20%" fill="none" stroke="#C6ED2C" strokeWidth="4" strokeLinecap="round" className="opacity-60" />
            </svg>

            {/* Render Fleet Markers */}
            {FLEET_DATA.map((bus) => (
              <div 
                key={bus.id}
                className="absolute z-10 w-12 h-12 -ml-6 -mt-6 flex flex-col items-center transition-all duration-1000"
                style={{ left: `${bus.x}%`, top: `${bus.y}%` }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 ${
                  bus.status === 'warning' ? 'bg-brand-danger border-white text-white animate-bounce' : 
                  bus.status === 'stopped' ? 'bg-brand-text border-white text-white opacity-80' : 
                  'bg-brand-primary border-brand-text text-brand-text'
                }`}>
                  <BusFront className="w-5 h-5" />
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-black mt-1 shadow-sm whitespace-nowrap">
                  {bus.id}
                </div>
              </div>
            ))}

            {/* Radar Sweep Effect */}
            <div className={`absolute top-1/2 left-1/2 w-[800px] h-[800px] -ml-[400px] -mt-[400px] rounded-full border border-brand-primary/20 bg-brand-primary/5 transition-transform duration-1000 ${pulse ? 'scale-105 opacity-50' : 'scale-95 opacity-100'} pointer-events-none`}></div>
          </div>
        </div>

        {/* Sidebar: Fleet List */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Navigation className="w-5 h-5 text-brand-primary" /> Đội xe (Live)
            </h2>
          </div>

          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
            <input 
              type="text" 
              placeholder="Tìm biển số, tài xế..." 
              className="w-full bg-brand-surface border border-black/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
            {FLEET_DATA.map((bus) => (
              <div key={bus.id} className={`p-4 rounded-2xl border ${bus.status === 'warning' ? 'bg-brand-danger/5 border-brand-danger/30' : 'bg-white border-black/5 hover:border-brand-primary/50'} transition-colors cursor-pointer group`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-black text-brand-text">{bus.id}</div>
                  <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                    bus.status === 'warning' ? 'bg-brand-danger text-white' : 
                    bus.status === 'stopped' ? 'bg-brand-surface text-brand-text/60' : 
                    'bg-brand-success/10 text-brand-success'
                  }`}>
                    {bus.speed}
                  </div>
                </div>
                <div className="text-xs font-bold text-brand-text/60 mb-1 flex items-center gap-1">
                  <Map className="w-3.5 h-3.5" /> {bus.route} - {bus.location}
                </div>
                <div className="text-xs font-medium text-brand-text/60 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> TX: {bus.driver}
                </div>
                
                {bus.status === 'warning' && (
                  <div className="mt-3 text-xs font-bold text-brand-danger bg-white p-2 rounded-lg border border-brand-danger/20 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Phát hiện kẹt xe nghiêm trọng tại Cầu Rồng.
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
