"use client";

import { useState } from 'react';
import { BellRing, CreditCard, Save, Send, Settings, ShieldAlert, Users } from 'lucide-react';
import { notificationApi } from '@/services/api';

export default function AdminSettingsPage() {
  const [ticketPrices, setTicketPrices] = useState({
    singleTicket: '',
    monthlyPass: '',
    discountStudent: '0',
  });

  const [notification, setNotification] = useState({
    target: 'all',
    title: '',
    content: '',
  });

  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notice, setNotice] = useState('');

  const handleSavePricing = (event) => {
    event.preventDefault();
    setIsSavingPricing(true);
    setIsSavingPricing(false);
    setNotice('Cập nhật bảng giá chưa được kết nối với backend.');
  };

  const handleSendNotification = async (event) => {
    event.preventDefault();
    setIsSendingNotif(true);
    setNotice('');
    try {
      await notificationApi.create({
        target: notification.target,
        title: notification.title,
        content: notification.content,
      });
      setNotification({ target: 'all', title: '', content: '' });
      setNotice('Đã phát thông báo hệ thống thành công.');
    } catch (err) {
      setNotice(err.message || 'Không thể phát thông báo hệ thống.');
    } finally {
      setIsSendingNotif(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-brand-primary" /> Cấu hình Hệ thống
          </h1>
          <p className="text-brand-text/60 font-medium">Thiết lập các thông số cốt lõi và phát thông báo khẩn cấp.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-hidden pb-6">
        {notice && (
          <div className="xl:col-span-2 rounded-2xl border border-brand-secondary/20 bg-brand-secondary/10 p-4 text-sm font-bold text-brand-text">
            {notice}
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col overflow-y-auto custom-scrollbar">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-primary" /> Điều chỉnh Bảng giá vé
          </h2>
          <p className="text-sm font-medium text-brand-text/60 mb-8">
            Các thay đổi tại đây sẽ có hiệu lực khi sinh viên thực hiện giao dịch mua vé trên hệ thống.
          </p>

          <form onSubmit={handleSavePricing} className="flex flex-col gap-6 flex-1">
            <PriceField accent="bg-brand-text" label="Giá vé 1 lượt (VND)" suffix="VND / lượt">
              <input
                type="number"
                required
                value={ticketPrices.singleTicket}
                onChange={(event) => setTicketPrices({ ...ticketPrices, singleTicket: event.target.value })}
                className="flex-1 bg-white border border-black/10 rounded-xl p-3 text-lg font-black focus:outline-none focus:border-brand-primary transition-all"
              />
            </PriceField>

            <PriceField accent="bg-brand-primary" label="Giá vé tháng (VND)" suffix="VND / 30 ngày">
              <input
                type="number"
                required
                value={ticketPrices.monthlyPass}
                onChange={(event) => setTicketPrices({ ...ticketPrices, monthlyPass: event.target.value })}
                className="flex-1 bg-white border border-black/10 rounded-xl p-3 text-lg font-black focus:outline-none focus:border-brand-primary transition-all"
              />
            </PriceField>

            <div className="p-5 border border-black/5 bg-brand-surface/30 rounded-2xl">
              <label className="block text-sm font-bold text-brand-text mb-2">Chính sách giảm giá HSSV (%)</label>
              <select
                value={ticketPrices.discountStudent}
                onChange={(event) => setTicketPrices({ ...ticketPrices, discountStudent: event.target.value })}
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
              <Save className="w-5 h-5" /> {isSavingPricing ? 'Đang áp dụng...' : 'Áp dụng bảng giá mới'}
            </button>
          </form>
        </div>

        <div className="bg-brand-danger/5 rounded-3xl p-6 md:p-8 shadow-sm border border-brand-danger/20 flex flex-col">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-brand-danger">
            <ShieldAlert className="w-6 h-6" /> Phát thông báo toàn hệ thống
          </h2>
          <p className="text-sm font-medium text-brand-danger/70 mb-6">
            Dùng để thông báo lịch nghỉ, bảo trì server hoặc sự kiện khẩn cấp tới người dùng.
          </p>

          <form onSubmit={handleSendNotification} className="flex flex-col gap-6 flex-1">
            <div>
              <label className="block text-sm font-bold text-brand-danger/80 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Đối tượng nhận
              </label>
              <select
                value={notification.target}
                onChange={(event) => setNotification({ ...notification, target: event.target.value })}
                className="w-full bg-white border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-danger transition-all text-brand-text"
              >
                <option value="all">Tất cả người dùng</option>
                <option value="all_students">Tất cả sinh viên</option>
                <option value="all_staffs">Khối vận hành: tài xế, phụ xe, điều phối</option>
                <option value="all_drivers">Chỉ tài xế</option>
                <option value="all_conductors">Chỉ phụ xe</option>
                <option value="all_dispatchers">Chỉ điều phối</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-danger/80 mb-2">Tiêu đề</label>
              <input
                type="text"
                required
                maxLength={120}
                value={notification.title}
                onChange={(event) => setNotification({ ...notification, title: event.target.value })}
                placeholder="VD: Lịch nghỉ lễ 30/4 và 1/5"
                className="w-full bg-white border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-danger transition-all text-brand-text"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-bold text-brand-danger/80 mb-2">Nội dung chi tiết</label>
              <textarea
                required
                maxLength={2000}
                value={notification.content}
                onChange={(event) => setNotification({ ...notification, content: event.target.value })}
                placeholder="Hệ thống xe bus sẽ tạm dừng hoạt động từ ngày..."
                className="w-full flex-1 min-h-[150px] bg-white border border-transparent rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-danger transition-all resize-none text-brand-text"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingNotif}
              className="w-full py-4 mt-auto bg-brand-danger text-white font-bold rounded-2xl hover:bg-brand-danger/80 transition-colors flex justify-center items-center gap-2 shadow-xl shadow-brand-danger/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" /> {isSendingNotif ? 'Đang phát thông báo...' : 'Phát thông báo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PriceField({ accent, label, suffix, children }) {
  return (
    <div className="p-5 border border-black/5 bg-brand-surface/30 rounded-2xl relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-2 h-full ${accent}`} />
      <label className="block text-sm font-bold text-brand-text mb-2">{label}</label>
      <div className="flex items-center gap-3">
        {children}
        <span className="font-bold text-brand-text/50 whitespace-nowrap">{suffix}</span>
      </div>
    </div>
  );
}
