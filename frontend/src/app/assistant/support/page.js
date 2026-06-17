"use client";

import { useState } from 'react';
import { AlertTriangle, Package, Users, ShieldAlert, MessageSquare, Send, User, Camera } from 'lucide-react';

export default function PassengerSupportPage() {
  const [incidentType, setIncidentType] = useState('other');
  const [notice, setNotice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setNotice('Báo cáo sự cố đang được giữ ngoài luồng demo Iter1.');
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Hỗ trợ Hành khách</h1>
        <p className="text-brand-text/60 font-medium">Ghi nhận sự cố và hỗ trợ khẩn cấp trên chuyến xe.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">

        {/* Column 1: Quick Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-brand-primary" /> Loại sự cố thường gặp
            </h3>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => setIncidentType('lost_item')}
                className={`p-4 rounded-2xl border-2 text-left flex items-start gap-4 transition-all ${incidentType === 'lost_item' ? 'border-brand-primary bg-brand-primary/5 shadow-sm' : 'border-black/5 bg-brand-surface hover:border-brand-primary/50'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${incidentType === 'lost_item' ? 'bg-brand-primary text-brand-text' : 'bg-white text-brand-text/40'}`}>
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-brand-text">Báo mất đồ</div>
                  <div className="text-xs font-medium text-brand-text/60 mt-1">Ghi nhận tài sản thất lạc trên xe</div>
                </div>
              </button>

              <button
                onClick={() => setIncidentType('overload')}
                className={`p-4 rounded-2xl border-2 text-left flex items-start gap-4 transition-all ${incidentType === 'overload' ? 'border-brand-secondary bg-brand-secondary/5 shadow-sm' : 'border-black/5 bg-brand-surface hover:border-brand-secondary/50'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${incidentType === 'overload' ? 'bg-brand-secondary text-brand-text' : 'bg-white text-brand-text/40'}`}>
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-brand-text">Báo cáo quá tải</div>
                  <div className="text-xs font-medium text-brand-text/60 mt-1">Xe đã đầy, xin phép bỏ trạm</div>
                </div>
              </button>

              <button
                onClick={() => setIncidentType('emergency')}
                className={`p-4 rounded-2xl border-2 text-left flex items-start gap-4 transition-all ${incidentType === 'emergency' ? 'border-brand-danger bg-brand-danger/5 shadow-sm' : 'border-black/5 bg-brand-surface hover:border-brand-danger/50'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${incidentType === 'emergency' ? 'bg-brand-danger text-white' : 'bg-white text-brand-text/40'}`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-brand-text">Sự cố khẩn cấp</div>
                  <div className="text-xs font-medium text-brand-text/60 mt-1">Cấp cứu y tế, an ninh, xe hỏng</div>
                </div>
              </button>

              <button
                onClick={() => setIncidentType('other')}
                className={`p-4 rounded-2xl border-2 text-left flex items-start gap-4 transition-all ${incidentType === 'other' ? 'border-brand-secondary bg-brand-secondary/5 shadow-sm' : 'border-black/5 bg-brand-surface hover:border-brand-secondary/50'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${incidentType === 'other' ? 'bg-brand-secondary text-brand-text' : 'bg-white text-brand-text/40'}`}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-brand-text">Khác</div>
                  <div className="text-xs font-medium text-brand-text/60 mt-1">Các ý kiến, phản hồi khác</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Column 2 & 3: Report Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1 flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Send className="w-6 h-6 text-brand-text/60" /> Chi tiết Báo cáo
            </h3>

            {notice && (
              <div className="mb-4 rounded-2xl border border-brand-secondary/20 bg-brand-secondary/10 p-4 text-sm font-bold text-brand-text">
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="space-y-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" /> Tên hành khách (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên nếu có"
                      className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Vị trí ghế / Khu vực
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Hàng ghế cuối, Cửa lên xuống..."
                      className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Mô tả chi tiết sự cố
                  </label>
                  <textarea
                    required
                    rows="6"
                    placeholder="Hãy mô tả chi tiết những gì đã xảy ra..."
                    className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-primary focus:bg-white transition-all resize-none custom-scrollbar"
                  ></textarea>
                </div>

                {/* Picture evidence UI kept until camera/upload backend is available. */}
                <div>
                  <label className="block text-sm font-bold text-brand-text/70 mb-2">Đính kèm hình ảnh (Nếu có)</label>
                  <div className="w-full h-32 border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-center justify-center text-brand-text/40 hover:bg-black/5 hover:border-brand-primary transition-all cursor-pointer">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-sm font-bold">Chạm để chụp ảnh</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-black/5 flex justify-end gap-4">
                <button type="button" className="px-6 py-4 rounded-xl font-bold text-brand-text/60 hover:bg-black/5 transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="px-8 py-4 bg-brand-text text-white rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors shadow-md">
                  <Send className="w-5 h-5" /> Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
