"use client";

import { MapPin, Navigation, Clock, Ticket, AlertCircle, QrCode } from 'lucide-react';

export default function StudentDashboard() {
  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Xin chào, Nguyễn Văn A!</h1>
        <p className="text-brand-text/60 font-medium">Chuẩn bị sẵn thẻ hoặc vé QR để lên xe nhé.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        
        {/* Left Column: QR Code & Ticket Status */}
        <div className="flex flex-col gap-6 xl:col-span-1">
          
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-primary/40 to-transparent"></div>
            
            <div className="w-16 h-16 rounded-full bg-brand-primary flex items-center justify-center text-2xl font-bold text-brand-text border-4 border-white shadow-sm z-10 mb-4 mt-6">
              A
            </div>
            
            <h2 className="text-xl font-bold mb-1 relative z-10">Nguyễn Văn A</h2>
            <p className="text-brand-text/50 font-mono text-sm mb-6 relative z-10">SV_12345</p>
            
            <div className="bg-brand-surface p-4 rounded-3xl border border-black/5 mb-6 w-full flex justify-center relative z-10">
              <div className="w-48 h-48 bg-white rounded-xl p-2 shadow-sm border border-black/5 flex items-center justify-center relative">
                <QrCode className="w-full h-full text-brand-text" strokeWidth={1} />
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-secondary/50 blur-[2px] rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
              </div>
            </div>
            
            <p className="text-xs font-bold text-brand-text/40 uppercase tracking-widest relative z-10">Đưa mã này cho phụ xe</p>
          </div>

          <div className="bg-brand-success/10 rounded-3xl p-6 border border-brand-success/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Ticket className="w-6 h-6 text-brand-success" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-success">Vé tháng hợp lệ</p>
                <p className="text-xs font-medium text-brand-success/70 mt-0.5">Còn 15 ngày</p>
              </div>
            </div>
            <button className="text-xs font-bold text-brand-success hover:underline">Gia hạn</button>
          </div>
        </div>

        {/* Right Column: Upcoming & Alerts */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          <div className="bg-brand-primary rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
            
            <div className="flex flex-wrap items-center justify-between mb-8 relative z-10 gap-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="w-7 h-7" /> Xe buýt sắp đến
              </h3>
              <div className="px-4 py-2 bg-white/30 text-brand-text font-bold text-xs rounded-xl uppercase tracking-widest backdrop-blur-sm shadow-sm border border-white/20">
                Trạm: KTX Bách Khoa
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 border border-white/50">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-brand-surface rounded-[24px] flex items-center justify-center border border-black/5">
                  <span className="text-3xl font-black text-brand-text">01</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-brand-text">Tuyến 1 (KTX - Bách Khoa)</h4>
                  <p className="text-sm font-medium text-brand-text/60 flex items-center gap-1.5 mt-2">
                    <MapPin className="w-4 h-4 text-brand-secondary" /> Đang ở: Ngã ba Huế
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:items-end bg-brand-surface/50 md:bg-transparent p-4 md:p-0 rounded-2xl">
                <div className="text-4xl font-black text-brand-secondary mb-1">5 <span className="text-xl font-bold">phút</span></div>
                <div className="text-xs font-bold text-brand-text/40 uppercase tracking-widest">Thời gian dự kiến</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
              <h3 className="font-bold mb-5 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-brand-warning" /> Thông báo mới
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-brand-surface rounded-2xl border border-black/5">
                  <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-brand-warning shrink-0"></div>
                  <div>
                    <p className="text-sm font-bold text-brand-text mb-1">Đổi lộ trình Tuyến 2</p>
                    <p className="text-xs font-medium text-brand-text/60 leading-relaxed">Hôm nay đường Nguyễn Lương Bằng kẹt xe, tuyến 2 tạm rẽ qua đường song song.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 hover:bg-brand-surface rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-black/5">
                  <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-black/10 shrink-0"></div>
                  <div>
                    <p className="text-sm font-bold text-brand-text mb-1">Cập nhật ứng dụng</p>
                    <p className="text-xs font-medium text-brand-text/60 leading-relaxed">Phiên bản mới giúp quét QR nhanh hơn 30%.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col">
              <h3 className="font-bold mb-5 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-brand-secondary" /> Lộ trình thường đi
              </h3>
              
              <div className="flex-1 flex flex-col justify-center gap-4">
                <button className="w-full p-4 bg-brand-surface rounded-2xl border border-black/5 hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-left flex items-center justify-between group">
                  <div>
                    <div className="font-bold text-sm mb-1">KTX Bách Khoa</div>
                    <div className="text-xs font-medium text-brand-text/50">Đến: Trường ĐH Bách Khoa</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-5 h-5 text-brand-primary" />
                  </div>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
