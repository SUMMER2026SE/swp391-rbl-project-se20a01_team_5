"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, BusFront, ShieldCheck, Navigation, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { routeDetailService } from '@/services/routeDetail.service';

export default function RouteTrackingPage() {
  const params = useParams();
  const routeId = params.id;
  
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Animation state for the bus on the mock map
  const [busPosition, setBusPosition] = useState(30); // percentage

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const data = await routeDetailService.getRouteDetail(routeId);
        setRouteData(data);
      } catch (err) {
        setError(err.message || 'Lỗi tải thông tin chi tiết tuyến xe');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();

    // Simulate bus moving slowly
    const interval = setInterval(() => {
      setBusPosition(prev => {
        if (prev >= 60) return 30; // loop back for demo
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [routeId]);

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/student/routes" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 hover:bg-brand-surface transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-brand-text" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-1">Tuyến {routeId}</h1>
          <p className="text-brand-text/60 font-medium">Theo dõi vị trí xe thời gian thực.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-hidden pb-6">
        
        {/* Column 1: Map Tracking (Spans 2 cols) */}
        <div className="xl:col-span-2 bg-brand-surface/30 rounded-3xl shadow-sm border border-black/5 relative overflow-hidden flex flex-col">
          
          {/* Map Overlay Badges */}
          {routeData && (
            <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
              <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-sm border border-black/5 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-brand-success animate-pulse"></span>
                <span className="font-bold text-sm">Đang hoạt động (Biển số: {routeData.busPlate})</span>
              </div>
            </div>
          )}
          
          {routeData && (
            <div className="absolute top-6 right-6 z-20">
              <div className="bg-brand-text text-white px-5 py-3 rounded-2xl shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase text-white/70">Tốc độ</span>
                <span className="font-black text-lg">{routeData.speed}</span>
              </div>
            </div>
          )}

          {/* Mock Map Background (CSS Grid/Lines) */}
          <div className="flex-1 relative bg-[#EBEFE8]">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20" 
                 style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
            
            {/* Mock Route Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <path 
                d="M 100 100 Q 300 150 400 300 T 800 400" 
                fill="none" 
                stroke="#2F3627" 
                strokeWidth="12" 
                strokeLinecap="round" 
                className="opacity-20"
              />
              <path 
                d="M 100 100 Q 300 150 400 300 T 800 400" 
                fill="none" 
                stroke="#C6ED2C" 
                strokeWidth="6" 
                strokeLinecap="round" 
              />
              {/* Bus Stops Dots */}
              <circle cx="100" cy="100" r="10" fill="white" stroke="#2F3627" strokeWidth="4" />
              <circle cx="280" cy="170" r="10" fill="white" stroke="#2F3627" strokeWidth="4" />
              <circle cx="400" cy="300" r="10" fill="white" stroke="#2F3627" strokeWidth="4" />
              <circle cx="620" cy="350" r="10" fill="white" stroke="#2F3627" strokeWidth="4" />
              <circle cx="800" cy="400" r="10" fill="white" stroke="#2F3627" strokeWidth="4" />
            </svg>

            {/* Moving Bus Marker */}
            <div 
              className="absolute z-10 w-16 h-16 -ml-8 -mt-8 flex flex-col items-center transition-all duration-1000 ease-linear"
              style={{ 
                left: `${busPosition}%`, 
                top: `${20 + (busPosition * 0.5)}%`, // Mocking a curve movement loosely
              }}
            >
              <div className="bg-brand-text text-white px-3 py-1 rounded-full text-xs font-bold mb-1 shadow-md whitespace-nowrap animate-bounce">
                Tuyến {routeId}
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-brand-primary">
                <BusFront className="w-6 h-6 text-brand-text" />
              </div>
            </div>

            {/* Simulated Geographic Labels */}
            <div className="absolute top-[120px] left-[120px] font-bold text-black/30 text-sm">Khu vực Hòa Khánh</div>
            <div className="absolute bottom-[200px] right-[200px] font-bold text-black/30 text-sm">Trung tâm Thành phố</div>

          </div>
        </div>

        {/* Column 2: Timeline & Stops Info */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col overflow-hidden">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 shrink-0">
            <Navigation className="w-6 h-6 text-brand-secondary" /> Lộ trình trạm dừng
          </h2>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
            
            {/* Timeline Line */}
            <div className="absolute left-6 top-6 bottom-6 w-1 bg-brand-surface rounded-full"></div>

            <div className="flex flex-col gap-6 relative z-10">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-brand-text/40">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="font-bold text-lg">Đang tải trạm dừng...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-brand-danger/60">
                  <Info className="w-10 h-10 mb-4" />
                  <p className="font-bold text-lg">{error}</p>
                </div>
              ) : (
                routeData?.stops.map((stop, index) => (
                  <div key={stop.id} className="flex gap-6 items-start">
                    
                    {/* Timeline Node */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border-2 ${
                      stop.passed ? 'bg-brand-success/10 border-brand-success text-brand-success' : 
                      stop.isCurrent ? 'bg-brand-primary border-brand-primary text-brand-text animate-pulse' : 
                      'bg-white border-brand-surface text-brand-text/30'
                    }`}>
                      {stop.passed ? <ShieldCheck className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                    </div>

                    {/* Stop Details */}
                    <div className={`flex-1 pt-1 ${stop.passed ? 'opacity-60' : 'opacity-100'}`}>
                      <h3 className={`font-bold ${stop.isCurrent ? 'text-lg text-brand-primary' : 'text-base text-brand-text'}`}>
                        {stop.name}
                      </h3>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-brand-text/50">
                          <Clock className="w-3.5 h-3.5" /> 
                          {stop.passed ? `Đã qua lúc ${stop.time}` : `Dự kiến: ${stop.time}`}
                        </div>
                        
                        {stop.isCurrent && (
                          <div className="flex items-center gap-1 text-xs font-black text-brand-danger bg-brand-danger/10 px-2 py-1 rounded-md">
                            Xe sắp đến ({stop.eta})
                          </div>
                        )}
                      </div>
                      
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
          
          <div className="pt-6 mt-4 border-t border-black/5 shrink-0">
            <button className="w-full py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors shadow-sm">
              Đăng ký nhận thông báo trạm này
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
