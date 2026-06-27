"use client";

import { useEffect, useState } from 'react';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { notificationApi } from '@/services/api';

export default function NotificationsPanel({ subtitle = 'Theo dõi thông báo mới từ hệ thống.' }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = () => {
    setIsLoading(true);
    setError('');
    notificationApi.listMine({ page: 0, size: 50 })
      .then((items) => setNotifications(items || []))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const handle = window.setTimeout(loadNotifications, 0);
    return () => window.clearTimeout(handle);
  }, []);

  const markRead = async (notification) => {
    if (!notification || notification.read) return;
    setNotifications((items) => items.map((item) => (
      item.notificationId === notification.notificationId ? { ...item, read: true } : item
    )));
    try {
      await notificationApi.markRead(notification.notificationId);
    } catch (err) {
      setError(err.message);
      loadNotifications();
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((notification) => !notification.read);
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    await Promise.allSettled(unread.map((notification) => notificationApi.markRead(notification.notificationId)));
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-brand-primary" /> Thông báo
          </h1>
          <p className="text-brand-text/60 font-medium">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllRead}
            className="bg-white border border-black/5 text-brand-text px-5 py-3 rounded-2xl font-bold hover:bg-brand-text hover:text-white transition-colors flex items-center gap-2 shadow-sm"
          >
            <CheckCheck className="w-5 h-5" /> Đã đọc
          </button>
          <button
            onClick={loadNotifications}
            className="bg-brand-surface border border-black/5 text-brand-text px-5 py-3 rounded-2xl font-bold hover:bg-brand-text hover:text-white transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-5 h-5" /> Tải lại
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
          {isLoading ? (
            <div className="py-20 text-center text-brand-text/50 font-bold">Đang tải thông báo...</div>
          ) : notifications.length ? (
            <div className="flex flex-col gap-4">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.notificationId}
                  notification={notification}
                  onMarkRead={markRead}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-brand-text/50 font-bold">Chưa có thông báo.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification, onMarkRead }) {
  const display = formatNotification(notification);

  return (
    <button
      type="button"
      onClick={() => onMarkRead(notification)}
      className={`text-left border rounded-2xl p-5 transition-colors ${notification.read ? 'border-black/5 bg-white' : 'border-brand-primary/30 bg-brand-primary/10'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {!notification.read && <span className="w-2.5 h-2.5 rounded-full bg-brand-danger"></span>}
            <h2 className="font-bold text-lg text-brand-text">{display.title}</h2>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm font-medium text-brand-text/70">{display.content}</p>
        </div>
        <span className="shrink-0 text-xs font-bold text-brand-text/40">{formatDateTime(notification.createdAt)}</span>
      </div>
    </button>
  );
}

function formatNotification(notification) {
  const title = notification.title === 'Bao cao mat do moi'
    ? 'Báo cáo mất đồ mới'
    : notification.title;
  const content = (notification.content || '')
    .replace('Sinh vien vua bao mat do tren ', 'Sinh viên vừa báo mất đồ trên ')
    .replaceAll('(chuyen #', '(chuyến #')
    .replaceAll('Vat pham:', 'Vật phẩm:')
    .replaceAll('Noi dung:', 'Nội dung:');

  return { title, content };
}

function formatDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}
