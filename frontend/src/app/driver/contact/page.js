"use client";

import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, MessageSquare, PhoneCall, Send, ShieldAlert, Wrench } from 'lucide-react';
import { driverApi } from '@/services/api';

const fallbackContact = {
  dispatcher: { name: 'Lê Điều Phối', role: 'DISPATCHER', phone: '0909988776', status: 'ONLINE' },
  contacts: [
    { name: 'Lê Điều Phối', role: 'DISPATCHER', phone: '0909988776', status: 'ONLINE' },
    { name: 'Trần Phụ Xe', role: 'CONDUCTOR', phone: '0901234567', status: 'ON_TRIP' },
  ],
  sosTypes: ['TECHNICAL', 'TRAFFIC_JAM', 'MEDICAL_EMERGENCY'],
};

export default function CoordinatorContactPage() {
  const [contactPage, setContactPage] = useState(fallbackContact);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let mounted = true;

    driverApi.getContact()
      .then((data) => {
        if (!mounted || !data) return;
        setContactPage(data);
        setNotice('');
      })
      .catch(() => {
        if (!mounted) return;
        setContactPage(fallbackContact);
        setNotice('Đang dùng dữ liệu mẫu vì backend chưa sẵn sàng hoặc chưa đăng nhập tài khoản DRIVER.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const dispatcher = contactPage.dispatcher || fallbackContact.dispatcher;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    const optimisticMessage = {
      id: Date.now(),
      sender: 'driver',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setNewMessage('');

    try {
      const result = await driverApi.sendMessage(text);
      setNotice(result?.message || 'Đã gửi tin nhắn đến điều phối.');
    } catch (error) {
      setNotice(error.message || 'Tin nhắn chỉ hiển thị trên UI vì backend chưa sẵn sàng.');
    }
  };

  const handleSOS = async (type) => {
    try {
      const result = await driverApi.reportIncident(type);
      setNotice(result?.message || `Đã gửi SOS: ${type}`);
    } catch (error) {
      setNotice(error.message || `SOS "${type}" chỉ hiển thị trên UI vì backend chưa sẵn sàng.`);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Điều phối viên</h1>
        <p className="text-brand-text/60 font-medium">Kết nối trực tiếp với trung tâm để xử lý tình huống phát sinh.</p>
      </div>

      {notice && (
        <div className="rounded-2xl border border-brand-secondary/20 bg-brand-secondary/10 p-4 text-sm font-bold text-brand-text">
          {notice}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl"></div>

            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 bg-brand-surface rounded-[24px] border border-black/5 flex items-center justify-center shadow-sm">
                <span className="text-3xl font-black text-brand-primary">{initials(dispatcher.name)}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-brand-text">{dispatcher.name}</h2>
                <p className="text-sm font-medium text-brand-text/60 mb-2">SĐT: {dispatcher.phone}</p>
                <div className="inline-flex px-3 py-1 bg-brand-success/10 text-brand-success font-bold text-xs rounded-full items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
                  {dispatcher.status || 'ONLINE'}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4 relative z-10">
              <a href={`tel:${dispatcher.phone}`} className="flex-1 py-4 bg-brand-primary rounded-2xl font-bold text-brand-text hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                <PhoneCall className="w-5 h-5" /> Gọi điện thoại
              </a>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1 flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-brand-danger" /> Báo cáo sự cố SOS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <SosButton icon={Wrench} label="Hỏng xe / Nổ lốp" onClick={() => handleSOS('TECHNICAL')} />
              <SosButton icon={AlertCircle} label="Kẹt xe nghiêm trọng" onClick={() => handleSOS('TRAFFIC_JAM')} />
              <button
                onClick={() => handleSOS('MEDICAL_EMERGENCY')}
                className="md:col-span-2 bg-brand-danger/10 border border-brand-danger/20 hover:bg-brand-danger hover:text-white p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-colors group text-brand-danger"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-6 h-6 text-brand-danger" />
                </div>
                <span className="font-bold text-sm">Tai nạn / Cấp cứu y tế</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden h-[600px] lg:h-auto">
          <div className="p-6 border-b border-black/5 bg-brand-surface/50 flex items-center justify-between shrink-0">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-secondary" /> Chat nội bộ
            </h3>
            <span className="text-xs font-bold text-brand-text/50 uppercase tracking-widest">Kênh ưu tiên</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
            <div className="text-center text-xs font-bold text-brand-text/30 mb-2">Hôm nay</div>
            {messages.length === 0 && (
              <div className="flex flex-1 items-center justify-center text-center text-sm font-bold text-brand-text/40">
                Chưa có tin nhắn.
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'driver' ? 'items-end' : 'items-start'}`}>
                <div className={`
                  max-w-[80%] p-4 rounded-2xl text-sm font-medium
                  ${msg.sender === 'driver'
                    ? 'bg-brand-text text-white rounded-tr-none'
                    : 'bg-brand-surface text-brand-text rounded-tl-none'}
                `}>
                  {msg.text}
                </div>
                <div className="text-[10px] font-bold text-brand-text/40 mt-1 mx-1">
                  {msg.time}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 bg-white shrink-0 flex gap-3">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-brand-surface border border-black/5 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-2xl bg-brand-primary text-brand-text flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SosButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-brand-surface border border-black/5 hover:border-brand-warning hover:bg-brand-warning/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-colors group"
    >
      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-brand-warning" />
      </div>
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase() || '--';
}
