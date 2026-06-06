"use client";

import { useState } from 'react';
import { Camera, Zap, ZapOff, Search } from 'lucide-react';

export default function ScannerPage() {
  const [flashOn, setFlashOn] = useState(false);

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Quét mã QR</h1>
          <p className="text-brand-text/60 font-medium">Đưa mã QR vé của sinh viên vào khung hình để kiểm tra.</p>
        </div>

        <button
          onClick={() => setFlashOn(!flashOn)}
          className={`p-4 rounded-2xl transition-all shadow-sm ${flashOn ? 'bg-brand-primary text-brand-text' : 'bg-white text-brand-text/60 border border-black/5 hover:bg-black/5'}`}
        >
          {flashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full min-h-0">

        {/* Camera Viewfinder */}
        <div className="flex-1 bg-black rounded-3xl relative overflow-hidden flex items-center justify-center shadow-lg group">

          <div className="absolute inset-0 bg-black"></div>

          {/* Scanner Overlay UI */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Viewfinder Frame */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-lg"></div>

              {/* Scanning Laser Line */}
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(251,192,45,0.8)] animate-pulse"></div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 font-medium text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
            Camera scanner chưa được kết nối với backend/device API.
          </div>
        </div>

        {/* Action Panel */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 h-full flex flex-col">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-text/60" /> Kiểm tra mã vé
            </h3>

            <p className="text-sm font-medium text-brand-text/60 mb-6">
              Trên thiết bị thực tế, máy ảnh sẽ quét tự động sau khi tích hợp device API.
            </p>

            <div className="mt-8 pt-6 border-t border-black/5">
              <p className="text-sm font-bold text-brand-text mb-3">Nhập mã vé thủ công</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã vé"
                  className="flex-1 bg-brand-surface border border-transparent rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
                <button className="px-4 py-3 bg-black text-white rounded-xl hover:bg-black/80 transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
