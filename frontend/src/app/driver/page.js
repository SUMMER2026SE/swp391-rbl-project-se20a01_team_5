"use client";

import { useState } from 'react';
import { MapPin, Navigation, Phone, Clock, Play, Square, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DriverDashboard() {
  const router = useRouter();
  const [tripStatus, setTripStatus] = useState('IDLE');

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Xin chào Bác tài!</h1>
        <p className="text-brand-text/60 font-medium">Chúc bạn một ngày làm việc an toàn và thuận lợi.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        
        {/* Main Bento: Current Trip & Route Map */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Navigation className="w-6 h-6 text-brand-primary" /> Chuyến xe hiện tại
            </h2>
            <div className="px-3 py-1 bg-brand-surface text-brand-text font-bold text-xs rounded-full uppercase tracking-widest border border-black/5">
              Tuyến số 1 (BK - KTX)
            </div>
          </div>

          <div 
            onClick={() => router.push('/driver/trips')}
            className="w-full flex-1 min-h-[300px] bg-brand-surface rounded-2xl border border-black/5 flex items-center justify-center mb-6 relative overflow-hidden group cursor-pointer hover:border-brand-primary transition-colors"
          >
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="text-center relative z-10">
              <MapPin className="w-10 h-10 text-brand-text/30 mx-auto mb-2 group-hover:text-brand-primary group-hover:scale-110 transition-all" />
              <p className="font-bold text-brand-text/60">Nhấn vào để xem Lộ trình chi tiết</p>
              <p className="text-xs text-brand-text/40 mt-1">12 trạm dừng • 8.5 km</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {tripStatus === 'IDLE' ? (
              <button 
                onClick={() => setTripStatus('RUNNING')}
                className="col-span-2 py-4 rounded-2xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-5 h-5" /> Bắt đầu chuyến xe
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setTripStatus('IDLE')}
                  className="col-span-2 md:col-span-1 py-4 rounded-2xl bg-brand-danger/10 text-brand-danger font-bold hover:bg-brand-danger hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Square className="w-5 h-5" /> Kết thúc chuyến
                </button>
                <div className="col-span-2 md:col-span-1 py-4 rounded-2xl bg-brand-success/10 text-brand-success font-bold flex items-center justify-center gap-2 border border-brand-success/20">
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-success"></span>
                  </span>
                  Đang chạy (35 km/h)
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column Bento Blocks */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-brand-primary text-brand-text rounded-3xl p-6 shadow-sm flex flex-col border border-black/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Lịch chạy tiếp theo
            </h3>
            
            <div className="space-y-3">
              <div className="bg-white/60 p-4 rounded-2xl border border-white">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-bold">14:00 - 15:30</div>
                  <div className="text-[10px] font-bold bg-white px-2 py-1 rounded text-brand-text/60 uppercase">Sắp tới</div>
                </div>
                <div className="text-xs font-medium text-brand-text/80">Tuyến 2 (Ngô Sĩ Liên - KTX)</div>
              </div>
              
              <div className="bg-white/30 p-4 rounded-2xl">
                <div className="text-sm font-bold mb-1">16:00 - 17:30</div>
                <div className="text-xs font-medium text-brand-text/70">Tuyến 1 (KTX - Bách Khoa)</div>
              </div>
            </div>
            
            <button className="mt-4 text-xs font-bold text-center w-full py-2 bg-white/20 rounded-xl hover:bg-white/40 transition-colors">
              Xem toàn bộ lịch
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-warning" /> Hỗ trợ khẩn cấp
            </h3>
            <p className="text-xs text-brand-text/60 mb-6">Liên hệ bộ phận điều phối nếu xe gặp sự cố, kẹt xe hoặc thay đổi lộ trình.</p>
            
            <div className="space-y-3">
              <button className="w-full py-3 rounded-xl bg-brand-surface text-brand-text font-bold hover:bg-brand-text hover:text-white transition-all text-sm flex justify-center items-center gap-2 border border-black/5 hover:border-brand-text">
                <Phone className="w-4 h-4" /> Gọi Điều phối viên
              </button>
              <button className="w-full py-3 rounded-xl bg-brand-danger/10 text-brand-danger font-bold hover:bg-brand-danger hover:text-white transition-all text-sm flex justify-center items-center gap-2 border border-brand-danger/20">
                <AlertTriangle className="w-4 h-4" /> Báo cáo sự cố
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
