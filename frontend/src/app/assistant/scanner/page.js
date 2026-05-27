"use client";

import { useState } from 'react';
import { Camera, Zap, ZapOff, CheckCircle2, XCircle, Search } from 'lucide-react';

export default function ScannerPage() {
  const [flashOn, setFlashOn] = useState(false);
  const [scanResult, setScanResult] = useState(null); // null, 'success', 'error'

  const mockScanSuccess = () => {
    setScanResult('success');
    setTimeout(() => setScanResult(null), 3000);
  };

  const mockScanError = () => {
    setScanResult('error');
    setTimeout(() => setScanResult(null), 3000);
  };

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
          
          {/* Mock Camera Feed Background */}
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center"></div>

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
            Mô phỏng Camera. Hãy dùng các nút bên dưới.
          </div>

          {/* Scan Results Overlay */}
          {scanResult === 'success' && (
            <div className="absolute inset-0 bg-brand-success/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-200">
              <CheckCircle2 className="w-24 h-24 mb-4" />
              <h2 className="text-3xl font-black mb-2">HỢP LỆ</h2>
              <p className="text-lg font-medium opacity-90">Nguyễn Văn A - 102220001</p>
              <p className="font-bold mt-2 bg-white/20 px-4 py-2 rounded-xl">Vé Tháng - Tuyến 01</p>
            </div>
          )}

          {scanResult === 'error' && (
            <div className="absolute inset-0 bg-brand-danger/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-200">
              <XCircle className="w-24 h-24 mb-4" />
              <h2 className="text-3xl font-black mb-2">KHÔNG HỢP LỆ</h2>
              <p className="text-lg font-medium opacity-90">Vé đã hết hạn hoặc sai tuyến!</p>
            </div>
          )}
        </div>

        {/* Action Panel for Testing */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 h-full flex flex-col">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-text/60" /> Test Môi trường
            </h3>
            
            <p className="text-sm font-medium text-brand-text/60 mb-6">
              Trên thiết bị thực tế, máy ảnh sẽ quét tự động. Để demo, hãy bấm các nút giả lập dưới đây:
            </p>

            <div className="flex flex-col gap-3 flex-1 justify-center">
              <button 
                onClick={mockScanSuccess}
                className="w-full py-4 bg-brand-success/10 text-brand-success hover:bg-brand-success hover:text-white border border-brand-success/20 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-6 h-6" /> Giả lập Quét Đúng
              </button>
              
              <button 
                onClick={mockScanError}
                className="w-full py-4 bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white border border-brand-danger/20 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-6 h-6" /> Giả lập Quét Sai
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-black/5">
              <p className="text-sm font-bold text-brand-text mb-3">Nhập mã vé thủ công</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nhập mã vé (VD: TKT-123)" 
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
