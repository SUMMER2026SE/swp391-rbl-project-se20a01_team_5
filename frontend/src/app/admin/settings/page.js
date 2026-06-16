"use client";

import { useEffect, useState } from 'react';
import { BellRing, CreditCard, Save, Send, Settings, ShieldAlert, Users } from 'lucide-react';
import { adminSystemService } from '@/services/adminSystem.service';

const fareTypeLabels = {
  SINGLE: 'Vé lượt',
  MONTHLY: 'Vé tháng'
};

export default function AdminSettingsPage() {
  const [routes, setRoutes] = useState([]);
  const [fares, setFares] = useState([]);
  const [fareForm, setFareForm] = useState({
    routeId: '',
    fareType: 'SINGLE',
    amount: '',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveUntil: '',
    notes: ''
  });
  const [notification, setNotification] = useState({
    target: 'all',
    title: '',
    content: ''
  });
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadSettings = async () => {
    try {
      const [routeData, fareData] = await Promise.all([
        adminSystemService.getPricingRoutes(),
        adminSystemService.getFares()
      ]);
      setRoutes(routeData);
      setFares(fareData);
    } catch (err) {
      setError(err.message || 'Không tải được cấu hình hệ thống.');
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      adminSystemService.getPricingRoutes(),
      adminSystemService.getFares()
    ])
      .then(([routeData, fareData]) => {
        if (!active) return;
        setRoutes(routeData);
        setFares(fareData);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Không tải được cấu hình hệ thống.');
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSavePricing = async (event) => {
    event.preventDefault();
    setIsSavingPricing(true);
    setNotice('');
    setError('');
    try {
      const updated = await adminSystemService.updateFare({
        routeId: fareForm.routeId ? Number(fareForm.routeId) : null,
        fareType: fareForm.fareType,
        amount: Number(fareForm.amount),
        effectiveFrom: fareForm.effectiveFrom || null,
        effectiveUntil: fareForm.effectiveUntil || null,
        notes: fareForm.notes
      });
      setFares(updated);
      setNotice(fareForm.routeId ? 'Đã cập nhật giá vé cho tuyến đã chọn.' : 'Đã cập nhật giá vé cho toàn bộ tuyến đang hoạt động.');
      setFareForm((current) => ({ ...current, amount: '', notes: '' }));
    } catch (err) {
      setError(err.message || 'Không cập nhật được bảng giá.');
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleSendNotification = async (event) => {
    event.preventDefault();
    setIsSendingNotif(true);
    setNotice('');
    setError('');
    try {
      const result = await adminSystemService.sendNotification(notification);
      setNotification({ target: 'all', title: '', content: '' });
      setNotice(`Đã gửi thông báo tới ${result?.createdMessages ?? 0} người dùng.`);
    } catch (err) {
      setError(err.message || 'Không gửi được thông báo hệ thống.');
    } finally {
      setIsSendingNotif(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-brand-primary" /> Cấu hình hệ thống
          </h1>
          <p className="text-brand-text/60 font-medium">Điều chỉnh giá vé và gửi thông báo toàn hệ thống.</p>
        </div>
      </div>

      {notice && <div className="rounded-2xl border border-brand-success/20 bg-brand-success/10 p-4 text-sm font-bold text-brand-text">{notice}</div>}
      {error && <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">{error}</div>}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-hidden pb-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col overflow-y-auto custom-scrollbar">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-primary" /> Điều chỉnh bảng giá vé
          </h2>
          <p className="text-sm font-medium text-brand-text/60 mb-6">Có thể áp dụng giá cho một tuyến cụ thể hoặc toàn bộ tuyến đang hoạt động.</p>

          <form onSubmit={handleSavePricing} className="flex flex-col gap-5">
            <label className="grid gap-2 text-sm font-bold text-brand-text/70">
              Tuyến áp dụng
              <select value={fareForm.routeId} onChange={(event) => setFareForm({ ...fareForm, routeId: event.target.value })} className="bg-brand-surface rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="">Tất cả tuyến đang hoạt động</option>
                {routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
              </select>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="grid gap-2 text-sm font-bold text-brand-text/70">
                Loại vé
                <select value={fareForm.fareType} onChange={(event) => setFareForm({ ...fareForm, fareType: event.target.value })} className="bg-brand-surface rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                  <option value="SINGLE">Vé lượt</option>
                  <option value="MONTHLY">Vé tháng</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-brand-text/70">
                Giá vé (VNĐ)
                <input type="number" min="0" required value={fareForm.amount} onChange={(event) => setFareForm({ ...fareForm, amount: event.target.value })} className="bg-brand-surface rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="grid gap-2 text-sm font-bold text-brand-text/70">
                Hiệu lực từ
                <input type="date" value={fareForm.effectiveFrom} onChange={(event) => setFareForm({ ...fareForm, effectiveFrom: event.target.value })} className="bg-brand-surface rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-brand-text/70">
                Hiệu lực đến
                <input type="date" value={fareForm.effectiveUntil} onChange={(event) => setFareForm({ ...fareForm, effectiveUntil: event.target.value })} className="bg-brand-surface rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold text-brand-text/70">
              Ghi chú
              <textarea value={fareForm.notes} onChange={(event) => setFareForm({ ...fareForm, notes: event.target.value })} className="min-h-24 bg-brand-surface rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
            </label>

            <button type="submit" disabled={isSavingPricing} className="w-full py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 disabled:opacity-70">
              <Save className="w-5 h-5" /> {isSavingPricing ? 'Đang áp dụng...' : 'Áp dụng bảng giá mới'}
            </button>
          </form>

          <div className="mt-8">
            <h3 className="font-black mb-3">Giá đang hiệu lực</h3>
            <div className="grid gap-3">
              {fares.length === 0 && <div className="rounded-2xl border border-dashed border-black/10 p-5 text-sm font-bold text-brand-text/40 text-center">Chưa có dữ liệu giá vé.</div>}
              {fares.slice(0, 8).map((fare) => (
                <div key={fare.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-brand-surface">
                  <div>
                    <div className="font-bold text-brand-text">{fare.routeName}</div>
                    <div className="text-xs font-bold text-brand-text/50">{fareTypeLabels[fare.fareType] || fare.fareType} - từ {new Date(fare.effectiveFrom).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div className="font-black whitespace-nowrap">{Number(fare.amount).toLocaleString('vi-VN')} đ</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-brand-danger/5 rounded-3xl p-6 md:p-8 shadow-sm border border-brand-danger/20 flex flex-col overflow-y-auto custom-scrollbar">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-brand-danger">
            <ShieldAlert className="w-6 h-6" /> Phát thông báo toàn hệ thống
          </h2>
          <p className="text-sm font-medium text-brand-danger/70 mb-6">Dùng cho bảo trì, thay đổi chính sách, lịch nghỉ hoặc thông báo quan trọng.</p>

          <form onSubmit={handleSendNotification} className="flex flex-col gap-6 flex-1">
            <label className="grid gap-2 text-sm font-bold text-brand-danger/80">
              <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Đối tượng nhận</span>
              <select value={notification.target} onChange={(event) => setNotification({ ...notification, target: event.target.value })} className="w-full bg-white border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-danger text-brand-text">
                <option value="all">Toàn bộ người dùng</option>
                <option value="all_students">Chỉ sinh viên</option>
                <option value="all_staffs">Khối vận hành và quản trị</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-brand-danger/80">
              <span className="flex items-center gap-2"><BellRing className="w-4 h-4" /> Tiêu đề</span>
              <input type="text" required value={notification.title} onChange={(event) => setNotification({ ...notification, title: event.target.value })} placeholder="VD: Bảo trì hệ thống tối nay" className="w-full bg-white border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-danger text-brand-text" />
            </label>

            <label className="grid gap-2 text-sm font-bold text-brand-danger/80 flex-1">
              Nội dung chi tiết
              <textarea required value={notification.content} onChange={(event) => setNotification({ ...notification, content: event.target.value })} placeholder="Nhập nội dung thông báo..." className="w-full flex-1 min-h-[180px] bg-white border border-transparent rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-danger resize-none text-brand-text" />
            </label>

            <button type="submit" disabled={isSendingNotif} className="w-full py-4 mt-auto bg-brand-danger text-white font-bold rounded-2xl hover:bg-brand-danger/80 transition-colors flex justify-center items-center gap-2 disabled:opacity-70">
              <Send className="w-5 h-5" /> {isSendingNotif ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
