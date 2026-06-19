"use client";

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Star, RefreshCw } from 'lucide-react';
import { feedbackApi, travelApi } from '@/services/api';

const categories = [
  { value: 'SERVICE_QUALITY', label: 'Chất lượng dịch vụ' },
  { value: 'LATE_BUS', label: 'Xe đến trễ' },
  { value: 'DRIVER_ATTITUDE', label: 'Thái độ tài xế' },
  { value: 'CLEANLINESS', label: 'Vệ sinh xe' },
  { value: 'OTHER', label: 'Khác' },
];

export default function StudentFeedbackPage() {
  const [trips, setTrips] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [form, setForm] = useState({
    tripId: '',
    routeId: '',
    rating: 5,
    category: 'SERVICE_QUALITY',
    content: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const selectedTrip = useMemo(
    () => trips.find((trip) => String(trip.tripId) === String(form.tripId)),
    [trips, form.tripId],
  );

  const loadData = () => {
    setIsLoading(true);
    setError('');
    Promise.all([
      travelApi.getHistory({ page: 0, size: 20 }).catch(() => []),
      feedbackApi.listMine({ page: 0, size: 20 }),
    ])
      .then(([tripItems, feedbackItems]) => {
        const normalizedTrips = tripItems || [];
        setTrips(normalizedTrips);
        setFeedbacks(feedbackItems || []);

        const params = new URLSearchParams(window.location.search);
        const tripId = params.get('tripId');
        const routeId = params.get('routeId');
        const firstTrip = normalizedTrips[0];
        setForm((current) => ({
          ...current,
          tripId: tripId || current.tripId || firstTrip?.tripId || '',
          routeId: routeId || current.routeId || firstTrip?.routeId || '',
        }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const handle = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(handle);
  }, []);

  const handleTripChange = (tripId) => {
    const trip = trips.find((item) => String(item.tripId) === String(tripId));
    setForm((current) => ({
      ...current,
      tripId,
      routeId: trip?.routeId || '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');

    try {
      const submitted = await feedbackApi.submit({
        tripId: form.tripId ? Number(form.tripId) : null,
        routeId: form.routeId ? Number(form.routeId) : null,
        rating: Number(form.rating),
        category: form.category,
        content: form.content.trim(),
      });
      setFeedbacks((items) => [submitted, ...items]);
      setForm((current) => ({ ...current, content: '', rating: 5 }));
      setNotice('Đã gửi phản hồi. Điều phối viên sẽ tiếp nhận và xử lý.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-brand-primary" /> Phản hồi chuyến xe
          </h1>
          <p className="text-brand-text/60 font-medium">Gửi góp ý về chuyến xe đã đi để đội điều phối cải thiện dịch vụ.</p>
        </div>
        <button
          onClick={loadData}
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

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6 overflow-hidden pb-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
          <h2 className="text-xl font-bold">Tạo phản hồi mới</h2>

          <label className="block">
            <span className="block text-sm font-bold text-brand-text/70 mb-2">Chuyến xe</span>
            <select
              value={form.tripId}
              onChange={(event) => handleTripChange(event.target.value)}
              className="w-full bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary"
            >
              {trips.map((trip) => (
                <option key={`${trip.travelHistoryId || trip.tripId}-${trip.tripId}`} value={trip.tripId}>
                  #{trip.tripId} - {trip.routeName || 'Tuyến xe'} - {formatDate(trip.serviceDate)}
                </option>
              ))}
              {!trips.length && <option value="">Chưa có lịch sử chuyến đi</option>}
            </select>
          </label>

          {selectedTrip && (
            <div className="rounded-2xl bg-brand-surface p-4 text-sm font-medium text-brand-text/70">
              <div className="font-bold text-brand-text">{selectedTrip.routeName}</div>
              <div className="mt-1">Lên xe: {selectedTrip.boardingStopName || 'Chưa ghi nhận'}</div>
              <div>Xuống xe: {selectedTrip.alightingStopName || 'Chưa ghi nhận'}</div>
            </div>
          )}

          <label className="block">
            <span className="block text-sm font-bold text-brand-text/70 mb-2">Loại phản hồi</span>
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              className="w-full bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </label>

          <div>
            <span className="block text-sm font-bold text-brand-text/70 mb-2">Đánh giá</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setForm({ ...form, rating })}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${rating <= form.rating ? 'bg-brand-warning text-white' : 'bg-brand-surface text-brand-text/30'}`}
                  aria-label={`${rating} sao`}
                >
                  <Star className="w-5 h-5" fill="currentColor" />
                </button>
              ))}
            </div>
          </div>

          <label className="flex-1 flex flex-col">
            <span className="block text-sm font-bold text-brand-text/70 mb-2">Nội dung</span>
            <textarea
              required
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              placeholder="Nhập phản hồi của bạn..."
              className="w-full flex-1 min-h-40 bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-primary resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !form.content.trim()}
            className="w-full py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" /> {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
          </button>
        </form>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 overflow-y-auto custom-scrollbar">
          <h2 className="text-xl font-bold mb-5">Phản hồi đã gửi</h2>
          {isLoading ? (
            <div className="py-20 text-center text-brand-text/50 font-bold">Đang tải dữ liệu...</div>
          ) : feedbacks.length ? (
            <div className="flex flex-col gap-4">
              {feedbacks.map((feedback) => (
                <div key={feedback.feedbackId} className="border border-black/5 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-brand-text">{labelForCategory(feedback.category)}</div>
                      <div className="text-xs font-bold text-brand-text/40 mt-1">
                        Chuyến #{feedback.tripId || 'N/A'} • {feedback.routeName || 'Tuyến chưa xác định'} • {formatDateTime(feedback.createdAt)}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-xs font-black ${feedback.status === 'RESOLVED' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-warning/10 text-brand-warning'}`}>
                      {feedback.status === 'RESOLVED' ? 'Đã xử lý' : 'Chờ xử lý'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-brand-text/70">{feedback.content}</p>
                  {feedback.response && (
                    <div className="mt-3 rounded-2xl bg-brand-surface p-4 text-sm font-medium text-brand-text/70">
                      <span className="font-bold text-brand-text">Phản hồi từ điều phối: </span>{feedback.response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-brand-text/50 font-bold">Bạn chưa gửi phản hồi nào.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function labelForCategory(value) {
  return categories.find((category) => category.value === value)?.label || 'Phản hồi';
}

function formatDate(value) {
  if (!value) return 'Chưa có ngày';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
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
