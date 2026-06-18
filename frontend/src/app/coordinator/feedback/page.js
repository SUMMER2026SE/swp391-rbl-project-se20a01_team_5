"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, BellRing, Send, AlertCircle, ShieldAlert, CheckCircle2, User, Search, Filter, RefreshCw } from 'lucide-react';
import { coordinatorFeedbackApi, coordinatorNotificationApi } from '@/services/api';

export default function CoordinatorFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [notifyTarget, setNotifyTarget] = useState('all_students');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyContent, setNotifyContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const loadFeedbacks = useCallback(() => {
    setIsLoading(true);
    setError('');
    coordinatorFeedbackApi.listAll({ status: statusFilter, page: 0, size: 50 })
      .then((items) => setFeedbacks(items || []))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    const handle = window.setTimeout(loadFeedbacks, 0);
    return () => window.clearTimeout(handle);
  }, [loadFeedbacks]);

  const visibleFeedbacks = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return feedbacks;
    return feedbacks.filter((feedback) => (
      feedback.studentName?.toLowerCase().includes(keyword)
      || feedback.studentCode?.toLowerCase().includes(keyword)
      || feedback.content?.toLowerCase().includes(keyword)
      || feedback.routeName?.toLowerCase().includes(keyword)
    ));
  }, [feedbacks, searchQuery]);

  const handleResolve = async (feedbackId) => {
    setNotice('');
    setError('');
    try {
      const resolved = await coordinatorFeedbackApi.resolve(feedbackId, 'Đã tiếp nhận và xử lý phản hồi.');
      setFeedbacks((items) => items.map((item) => (
        item.feedbackId === feedbackId ? resolved : item
      )));
      setNotice(`Đã đánh dấu phản hồi #${feedbackId} là đã xử lý.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendNotification = async (event) => {
    event.preventDefault();
    setIsSending(true);
    setNotice('');
    setError('');

    try {
      await coordinatorNotificationApi.create({
        target: notifyTarget,
        title: notifyTitle.trim(),
        content: notifyContent.trim(),
      });
      setNotifyTitle('');
      setNotifyContent('');
      setNotice('Đã phát thông báo thành công.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-brand-primary" /> Phản hồi & Thông báo
          </h1>
          <p className="text-brand-text/60 font-medium">Trung tâm xử lý phản hồi sinh viên và phát thông báo hệ thống.</p>
        </div>
        <button
          onClick={loadFeedbacks}
          className="bg-brand-surface border border-black/5 text-brand-text px-6 py-3 rounded-2xl font-bold hover:bg-brand-text hover:text-white transition-colors flex items-center gap-2 shadow-sm w-fit"
        >
          <RefreshCw className="w-5 h-5" /> Tải lại
        </button>
      </div>

      {(error || notice) && (
        <div className={`p-4 rounded-2xl text-sm font-bold ${error ? 'bg-brand-danger/10 border border-brand-danger/20 text-brand-danger' : 'bg-brand-success/10 border border-brand-success/20 text-brand-success'}`}>
          {error || notice}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-hidden pb-6">
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
          <div className="p-6 md:p-8 border-b border-black/5 bg-brand-surface/30 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Hộp thư phản hồi</h2>
              <div className="flex items-center gap-2 text-sm font-bold text-brand-danger bg-brand-danger/10 px-3 py-1 rounded-md">
                {feedbacks.filter((feedback) => feedback.status === 'PENDING').length} chờ xử lý
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm kiếm phản hồi..."
                  className="w-full bg-white border border-black/5 rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="bg-white border border-black/5 rounded-xl py-2 pl-9 pr-4 text-sm font-bold focus:outline-none focus:border-brand-primary"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="RESOLVED">Đã xử lý</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {isLoading ? (
              <div className="py-20 text-center text-brand-text/50 font-bold">Đang tải phản hồi...</div>
            ) : visibleFeedbacks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-brand-surface/40 p-8 text-center text-sm font-bold text-brand-text/50">
                Chưa có dữ liệu phản hồi.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {visibleFeedbacks.map((feedback) => (
                  <div key={feedback.feedbackId} className={`border rounded-2xl p-5 transition-colors ${feedback.status === 'RESOLVED' ? 'border-black/5 bg-brand-surface/30 opacity-80' : feedback.rating <= 2 ? 'border-brand-danger/30 bg-brand-danger/5' : 'border-black/5 bg-white shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${feedback.rating <= 2 ? 'bg-brand-danger text-white' : 'bg-brand-surface text-brand-text'}`}>
                          {feedback.rating <= 2 ? <ShieldAlert className="w-4 h-4" /> : feedback.category === 'OTHER' ? <AlertCircle className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{feedback.studentName || feedback.studentCode}</div>
                          <div className="text-[10px] font-bold text-brand-text/50">
                            {feedback.studentCode} • {feedback.routeName || 'Tuyến chưa xác định'} • {formatDateTime(feedback.createdAt)}
                          </div>
                        </div>
                      </div>
                      {feedback.status === 'PENDING' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-brand-danger text-white">Chờ xử lý</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-brand-success text-white">Đã xử lý</span>
                      )}
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider text-brand-text/50">
                      <span className="rounded-lg bg-brand-surface px-2 py-1">{labelForCategory(feedback.category)}</span>
                      {feedback.rating && <span className="rounded-lg bg-brand-warning/10 px-2 py-1 text-brand-warning">{feedback.rating}/5 sao</span>}
                      {feedback.tripId && <span className="rounded-lg bg-brand-secondary/10 px-2 py-1 text-brand-secondary">Chuyến #{feedback.tripId}</span>}
                    </div>

                    <p className="text-sm font-medium text-brand-text mb-4">{feedback.content}</p>

                    {feedback.status === 'PENDING' ? (
                      <button
                        onClick={() => handleResolve(feedback.feedbackId)}
                        className="w-full py-2 bg-brand-success/10 text-brand-success font-bold text-xs rounded-xl hover:bg-brand-success hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã xử lý
                      </button>
                    ) : feedback.response ? (
                      <div className="rounded-2xl bg-white p-3 text-xs font-medium text-brand-text/60">
                        <span className="font-bold text-brand-text">Phản hồi xử lý: </span>{feedback.response}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-brand-primary/10 rounded-3xl p-6 md:p-8 shadow-sm border border-brand-primary/20 flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 shrink-0">
            <BellRing className="w-6 h-6 text-brand-primary" /> Phát thông báo mới
          </h2>

          <form onSubmit={handleSendNotification} className="flex flex-col gap-6 flex-1">
            <div>
              <label className="block text-sm font-bold text-brand-text/70 mb-2">Gửi đến</label>
              <select
                value={notifyTarget}
                onChange={(event) => setNotifyTarget(event.target.value)}
                className="w-full bg-white border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary transition-all"
              >
                <option value="all_students">Tất cả sinh viên</option>
                <option value="all_drivers">Tất cả tài xế</option>
                <option value="all_conductors">Tất cả phụ xe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-text/70 mb-2">Tiêu đề thông báo</label>
              <input
                type="text"
                required
                value={notifyTitle}
                onChange={(event) => setNotifyTitle(event.target.value)}
                placeholder="VD: Thay đổi lộ trình tuyến 1..."
                className="w-full bg-white border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-bold text-brand-text/70 mb-2">Nội dung chi tiết</label>
              <textarea
                required
                value={notifyContent}
                onChange={(event) => setNotifyContent(event.target.value)}
                placeholder="Nhập nội dung chi tiết thông báo..."
                className="w-full flex-1 min-h-[150px] bg-white border border-transparent rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-primary transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-4 mt-auto bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" /> {isSending ? 'Đang gửi...' : 'Phát thông báo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function labelForCategory(value) {
  const labels = {
    SERVICE_QUALITY: 'Chất lượng dịch vụ',
    LATE_BUS: 'Xe đến trễ',
    DRIVER_ATTITUDE: 'Thái độ tài xế',
    CLEANLINESS: 'Vệ sinh xe',
    OTHER: 'Khác',
  };
  return labels[value] || 'Phản hồi';
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
