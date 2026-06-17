"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, Loader2, MessageSquare, PhoneCall, RefreshCw, Send, ShieldAlert, Wrench } from 'lucide-react';
import { driverDispatchApi } from '@/services/api';

const SOS_OPTIONS = [
  {
    label: 'Hỏng xe / Nổ lốp',
    type: 'TECHNICAL',
    description: 'Tài xế báo hỏng xe hoặc nổ lốp, cần điều phối hỗ trợ.',
    icon: Wrench,
    className: 'hover:border-brand-warning hover:bg-brand-warning/10',
    iconClass: 'text-brand-warning',
  },
  {
    label: 'Kẹt xe nghiêm trọng',
    type: 'OTHER',
    description: 'Tài xế báo kẹt xe nghiêm trọng, có thể ảnh hưởng lịch trình.',
    icon: AlertCircle,
    className: 'hover:border-brand-secondary hover:bg-brand-secondary/10',
    iconClass: 'text-brand-secondary',
  },
  {
    label: 'Tai nạn / Cấp cứu y tế',
    type: 'EMERGENCY',
    description: 'Tài xế báo tai nạn hoặc tình huống y tế khẩn cấp.',
    icon: ShieldAlert,
    className: 'md:col-span-2 bg-brand-danger/10 border-brand-danger/20 hover:bg-brand-danger hover:text-white text-brand-danger',
    iconClass: 'text-brand-danger',
  },
];

function initials(name) {
  return (name || '--')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '--';
}

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function DriverContactPage() {
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeIncident, setActiveIncident] = useState('');

  const loadContact = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await driverDispatchApi.contact();
      setContact(data);
      setMessages([...(data?.messages || [])].reverse());
    } catch (err) {
      setError(err.message || 'Không tải được thông tin điều phối viên.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(loadContact, 0);
    return () => window.clearTimeout(handle);
  }, [loadContact]);

  const activeTripId = contact?.activeTripId || null;
  const dispatcherName = contact?.dispatcherName || 'Chưa có điều phối viên';
  const dispatcherPhone = contact?.phoneNumber || '';

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.sentAt || 0) - new Date(b.sentAt || 0));
  }, [messages]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    setNotice('');
    setError('');
    try {
      const created = await driverDispatchApi.sendMessage({
        tripId: activeTripId,
        content: newMessage.trim(),
      });
      setMessages((items) => [...items, created]);
      setNewMessage('');
      setNotice('Đã gửi tin nhắn cho điều phối viên.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSOS = async (option) => {
    setActiveIncident(option.type);
    setNotice('');
    setError('');
    try {
      const created = await driverDispatchApi.reportIncident({
        tripId: activeTripId,
        incidentType: option.type,
        description: option.description,
      });
      setMessages((items) => [...items, created]);
      setNotice(`Đã gửi SOS "${option.label}" cho điều phối viên.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActiveIncident('');
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Điều phối viên</h1>
          <p className="text-brand-text/60 font-medium">
            Kết nối trực tiếp với trung tâm để xử lý các tình huống phát sinh.
          </p>
        </div>
        <button
          onClick={loadContact}
          className="px-4 py-3 bg-white border border-black/5 rounded-2xl text-brand-text hover:bg-brand-surface transition-colors shadow-sm flex items-center gap-2 font-bold text-sm"
        >
          <RefreshCw className="w-5 h-5" /> Làm mới
        </button>
      </div>

      {(error || notice) && (
        <div className={`p-4 rounded-2xl text-sm font-bold ${error ? 'bg-brand-danger/10 border border-brand-danger/20 text-brand-danger' : 'bg-brand-success/10 border border-brand-success/20 text-brand-success'}`}>
          {error || notice}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl"></div>

            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 bg-brand-surface rounded-[24px] border border-black/5 flex items-center justify-center shadow-sm">
                {isLoading ? (
                  <Loader2 className="w-7 h-7 animate-spin text-brand-primary" />
                ) : (
                  <span className="text-2xl font-black text-brand-primary">{initials(dispatcherName)}</span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-brand-text">{dispatcherName}</h2>
                <p className="text-sm font-medium text-brand-text/60 mb-2">
                  {contact?.department || (contact?.dispatcherUserId ? 'Trung tâm điều phối' : 'Chưa có dữ liệu từ backend')}
                </p>
                <div className="inline-flex px-3 py-1 bg-brand-success/10 text-brand-success font-bold text-xs rounded-full items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
                  Đang trực ban
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4 relative z-10">
              <a
                href={dispatcherPhone ? `tel:${dispatcherPhone.replaceAll(' ', '')}` : undefined}
                className={`flex-1 py-4 rounded-2xl font-bold text-brand-text transition-all flex items-center justify-center gap-2 shadow-sm ${dispatcherPhone ? 'bg-brand-primary hover:bg-black hover:text-white' : 'bg-brand-surface opacity-60 pointer-events-none'}`}
              >
                <PhoneCall className="w-5 h-5" /> Gọi điện thoại
              </a>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1 flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-brand-danger" /> Báo cáo sự cố (SOS)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {SOS_OPTIONS.map((option) => {
                const Icon = option.icon;
                const busy = activeIncident === option.type;
                return (
                  <button
                    key={option.type}
                    onClick={() => handleSOS(option)}
                    disabled={busy || isLoading || !contact?.dispatcherUserId}
                    className={`bg-brand-surface border border-black/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-colors group disabled:opacity-60 disabled:cursor-not-allowed ${option.className}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <Icon className={`w-6 h-6 ${option.iconClass}`} />}
                    </div>
                    <span className="font-bold text-sm">{option.label}</span>
                  </button>
                );
              })}
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
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-sm font-bold text-brand-text/40">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải chat...
              </div>
            ) : sortedMessages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-center text-sm font-bold text-brand-text/40">
                Chưa có lịch sử chat từ backend.
              </div>
            ) : (
              sortedMessages.map((msg) => {
                const fromDriver = msg.senderUserId !== contact?.dispatcherUserId;
                return (
                  <div key={msg.messageId} className={`flex flex-col ${fromDriver ? 'items-end' : 'items-start'}`}>
                    <div className={`
                      max-w-[80%] p-4 rounded-2xl text-sm font-medium
                      ${fromDriver
                        ? 'bg-brand-text text-white rounded-tr-none'
                        : 'bg-brand-surface text-brand-text rounded-tl-none'}
                    `}>
                      {msg.content}
                    </div>
                    <div className="text-[10px] font-bold text-brand-text/40 mt-1 mx-1">
                      {formatTime(msg.sentAt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 bg-white shrink-0 flex gap-3">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              className="flex-1 bg-brand-surface border border-black/5 rounded-2xl px-4 focus:outline-none focus:border-brand-primary text-sm"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending || !contact?.dispatcherUserId}
              className="w-12 h-12 rounded-2xl bg-brand-primary text-brand-text flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
