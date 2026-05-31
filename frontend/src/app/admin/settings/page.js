"use client";

import { useState } from 'react';
import { Settings, CreditCard, BellRing, Save, Send, ShieldAlert, Users } from 'lucide-react';

export default function AdminSettingsPage() {
  const [ticketPrices, setTicketPrices] = useState({
    singleTicket: '',
    monthlyPass: '',
    discountStudent: '0'
  });

  const [notification, setNotification] = useState({
    target: 'all',
    title: '',
    content: ''
  });

  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notice, setNotice] = useState('');

  const handleSavePricing = (e) => {
    e.preventDefault();
    setIsSavingPricing(true);
    setIsSavingPricing(false);
    setNotice('Chức năng cập nhật bảng giá chưa được kết nối với backend.');
  };

  const handleSendNotification = (e) => {
    e.preventDefault();
    setIsSendingNotif(true);
    setIsSendingNotif(false);
    setNotification({ target: 'all', title: '', content: '' });
    setNotice('Chức năng phát thông báo hệ thống chưa được kết nối với backend.');
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-brand-primary" /> Cấu hình Hệ thống
          </h1>
          <p className="text-brand-text/60 font-medium">Thiết lập các thông số cốt lõi và phát đi thông báo khẩn cấp.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-hidden pb-6">
        {notice && (
          <div className="xl:col-span-2 rounded-2xl border border-brand-secondary/20 bg-brand-secondary/10 p-4 text-sm font-bold text-brand-text">
            {notice}
          </div>
        )}

        {/* Column 1: Pricing Config */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col overflow-y-auto custom-scrollbar">

          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-primary" /> Điều chỉnh Bảng giá vé
          </h2>
          <p className="text-sm font-medium text-brand-text/60 mb-8">
            Những thay đổi tại đây sẽ lập tức có hiệu lực khi Sinh viên thực hiện giao dịch mua vé trên hệ thống.
          </p>

          <form onSubmit={handleSavePricing} className="flex flex-col gap-6 flex-1">

            <div className="p-5 border border-black/5 bg-brand-surface/30 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-brand-text"></div>
              <label className="block text-sm font-bold text-brand-text mb-2">Giá vé 1 lượt (VNĐ)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  required
                  value={ticketPrices.singleTicket}
                  onChange={(e) => setTicketPrices({...ticketPrices, singleTicket: e.target.value})}
                  className="flex-1 bg-white border border-black/10 rounded-xl p-3 text-lg font-black focus:outline-none focus:border-brand-primary transition-all"
                />
                <span className="font-bold text-brand-text/50">₫ / lượt</span>
              </div>
            </div>

            <div className="p-5 border border-black/5 bg-brand-surface/30 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary"></div>
              <label className="block text-sm font-bold text-brand-text mb-2">Giá vé Tháng (VNĐ)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  required
                  value={ticketPrices.monthlyPass}
                  onChange={(e) => setTicketPrices({...ticketPrices, monthlyPass: e.target.value})}
                  className="flex-1 bg-white border border-black/10 rounded-xl p-3 text-lg font-black focus:outline-none focus:border-brand-primary transition-all"
                />
                <span className="font-bold text-brand-text/50">₫ / 30 ngày</span>
              </div>
            </div>

            <div className="p-5 border border-black/5 bg-brand-surface/30 rounded-2xl">
              <label className="block text-sm font-bold text-brand-text mb-2">Chính sách giảm giá HSSV (%)</label>
              <select
                value={ticketPrices.discountStudent}
                onChange={(e) => setTicketPrices({...ticketPrices, discountStudent: e.target.value})}
                className="w-full bg-white border border-black/10 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-brand-primary transition-all appearance-none"
              >
                <option value="0">Không giảm giá (0%)</option>
                <option value="10">Giảm 10%</option>
                <option value="20">Giảm 20%</option>
                <option value="50">Trợ giá 50%</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSavingPricing}
              className="w-full mt-auto py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" /> {isSavingPricing ? 'Đang áp dụng...' : 'Áp dụng Bảng giá mới'}
            </button>
          </form>

        </div>

        {/* Column 2: System Notifications */}
        <div className="bg-brand-danger/5 rounded-3xl p-6 md:p-8 shadow-sm border border-brand-danger/20 flex flex-col">

          <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-brand-danger">
            <ShieldAlert className="w-6 h-6" /> Phát Thông báo Toàn Hệ thống
          </h2>
          <p className="text-sm font-medium text-brand-danger/70 mb-6">
            Dùng để thông báo lịch nghỉ Tết, bảo trì server, hoặc các sự kiện khẩn cấp tới tất cả App của người dùng.
          </p>

          <form onSubmit={handleSendNotification} className="flex flex-col gap-6 flex-1">

            <div>
              <label className="block text-sm font-bold text-brand-danger/80 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Đối tượng nhận Broadcast
              </label>
              <select
                value={notification.target}
                onChange={(e) => setNotification({...notification, target: e.target.value})}
                className="w-full bg-white border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-danger transition-all text-brand-text"
              >
                <option value="all">Toàn bộ 100% người dùng (App SV + Tài xế + Điều phối)</option>
                <option value="all_students">Chỉ toàn bộ Sinh viên</option>
                <option value="all_staffs">Chỉ khối Vận hành (Tài xế, Phụ xe, Điều phối)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-danger/80 mb-2">Tiêu đề (Header)</label>
              <input
                type="text"
                required
                value={notification.title}
                onChange={(e) => setNotification({...notification, title: e.target.value})}
                placeholder="VD: Lịch nghỉ lễ 30/4 và 1/5..."
                className="w-full bg-white border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-danger transition-all text-brand-text"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-bold text-brand-danger/80 mb-2">Nội dung chi tiết</label>
              <textarea
                required
                value={notification.content}
                onChange={(e) => setNotification({...notification, content: e.target.value})}
                placeholder="Hệ thống xe bus sẽ tạm dừng hoạt động từ ngày..."
                className="w-full flex-1 min-h-[150px] bg-white border border-transparent rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-danger transition-all resize-none text-brand-text"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSendingNotif}
              className="w-full py-4 mt-auto bg-brand-danger text-white font-bold rounded-2xl hover:bg-brand-danger/80 transition-colors flex justify-center items-center gap-2 shadow-xl shadow-brand-danger/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" /> {isSendingNotif ? 'Đang phát sóng...' : 'Bắn Thông Báo Khẩn (Broadcast)'}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
