"use client";

import { useEffect, useState, useCallback } from 'react';
import { Phone, MessageSquare, PhoneCall, AlertCircle, RefreshCw } from 'lucide-react';
import { conductorApi } from '@/services/api';

export default function AssistantContactPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadContactInfo = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await conductorApi.contact();
      setData(response || null);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(loadContactInfo, 0);
    return () => window.clearTimeout(handle);
  }, [loadContactInfo]);

  const handleSendMessage = async (recipientType, tripId) => {
    const content = window.prompt(`Nhập tin nhắn gửi đến ${recipientType}:`);
    if (!content || !content.trim()) return;

    try {
      await conductorApi.sendMessage({
        tripId,
        recipientType,
        content: content.trim()
      });
      alert('Đã gửi tin nhắn thành công.');
    } catch (err) {
      alert(`Lỗi khi gửi: ${err.message}`);
    }
  };

  const contacts = data?.contacts?.map(c => ({
    isUrgent: c.role === 'DISPATCHER',
    role: c.role === 'DISPATCHER' ? 'Điều phối viên' : (c.role === 'DRIVER' ? 'Tài xế' : c.role),
    rawRole: c.role,
    name: c.name,
    phone: c.phoneNumber,
    status: 'Đang hoạt động',
    tripId: data.activeTripId
  })) || [];

  if (data?.driverName && !contacts.some(c => c.rawRole === 'DRIVER')) {
    contacts.unshift({
      isUrgent: false,
      role: 'Tài xế',
      rawRole: 'DRIVER',
      name: data.driverName,
      phone: data.driverPhone,
      status: 'Đang chạy chuyến',
      tripId: data.activeTripId
    });
  }

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Liên lạc Nội bộ</h1>
          <p className="text-brand-text/60 font-medium">Kết nối trực tiếp với tài xế và điều phối viên trung tâm.</p>
        </div>
        <button onClick={loadContactInfo} className="px-4 py-3 bg-white border border-black/5 rounded-2xl hover:bg-brand-surface flex items-center gap-2 font-bold shadow-sm">
          <RefreshCw className="w-5 h-5" /> Tải lại
        </button>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-brand-text/50 font-bold">Đang tải danh bạ...</div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
          {contacts.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-black/10 bg-white p-8 text-center text-sm font-bold text-brand-text/50">
              Chưa có danh bạ nội bộ từ backend.
            </div>
          )}

          {contacts.map((contact, idx) => (
            <div key={idx} className={`bg-white rounded-3xl p-6 md:p-8 shadow-sm border flex flex-col h-fit ${contact.isUrgent ? 'border-brand-danger shadow-brand-danger/10' : 'border-black/5'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${contact.isUrgent ? 'bg-brand-danger text-white' : 'bg-brand-surface text-brand-text'}`}>
                  {contact.isUrgent ? <AlertCircle className="w-7 h-7" /> : <PhoneCall className="w-7 h-7" />}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-text/40 mb-1">{contact.role}</div>
                  <div className="text-xl font-bold text-brand-text">{contact.name}</div>
                </div>
              </div>

              <div className="bg-brand-surface/50 rounded-2xl p-4 mb-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-text/60">Số điện thoại:</span>
                  <span className="font-black font-mono">{contact.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-text/60">Trạng thái:</span>
                  <span className={`text-sm font-bold ${contact.isUrgent ? 'text-brand-danger' : 'text-brand-success'}`}>
                    {contact.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 mt-auto">
                <a href={`tel:${contact.phone}`} className={`flex-1 py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-sm ${contact.isUrgent ? 'bg-brand-danger text-white hover:bg-red-700' : 'bg-black text-white hover:bg-black/80'}`}>
                  <Phone className="w-5 h-5" /> Gọi điện
                </a>
                <button onClick={() => handleSendMessage(contact.rawRole, contact.tripId)} className="flex-1 py-4 bg-brand-surface border border-transparent rounded-xl font-bold text-brand-text flex justify-center items-center gap-2 hover:bg-white hover:border-brand-primary transition-all">
                  <MessageSquare className="w-5 h-5" /> Nhắn tin
                </button>
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
