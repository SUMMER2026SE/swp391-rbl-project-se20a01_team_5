"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, RefreshCw, Send, Star, UserRound } from 'lucide-react';
import { driverRatingApi, travelApi } from '@/services/api';
import { recentTripMocks } from '@/services/mockTrips';

export default function StudentFeedbackPage() {
  const [trips, setTrips] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({
    tripId: '',
    driverId: '',
    rating: 5,
    comment: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const selectedTrip = useMemo(
    () => trips.find((trip) => String(trip.tripId) === String(form.tripId)),
    [trips, form.tripId],
  );

  const loadDriverRatings = useCallback(async (driverId) => {
    if (!driverId) {
      setRatings([]);
      setSummary(null);
      return;
    }

    const [ratingItems, ratingSummary] = await Promise.all([
      driverRatingApi.listByDriver(driverId, { page: 0, size: 20 }),
      driverRatingApi.summarize(driverId),
    ]);
    setRatings(ratingItems || []);
    setSummary(ratingSummary || null);
  }, []);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError('');

    travelApi.getHistory({ page: 0, size: 20 })
      .catch(() => recentTripMocks)
      .then(async (tripItems) => {
        const normalizedTrips = tripItems?.length ? tripItems : recentTripMocks;
        setTrips(normalizedTrips);

        const params = new URLSearchParams(window.location.search);
        const tripId = params.get('tripId');
        const firstTrip = normalizedTrips.find((trip) => trip.driverId) || normalizedTrips[0];
        const selected = normalizedTrips.find((trip) => String(trip.tripId) === String(tripId)) || firstTrip;

        setForm((current) => ({
          ...current,
          tripId: selected?.tripId || '',
          driverId: selected?.driverId || '',
        }));
        await loadDriverRatings(selected?.driverId);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [loadDriverRatings]);

  useEffect(() => {
    const handle = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(handle);
  }, [loadData]);

  const handleTripChange = async (tripId) => {
    const trip = trips.find((item) => String(item.tripId) === String(tripId));
    setForm((current) => ({
      ...current,
      tripId,
      driverId: trip?.driverId || '',
    }));
    setError('');
    setNotice('');

    try {
      await loadDriverRatings(trip?.driverId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');

    if (!form.driverId) {
      setError('Chuyến này chưa có thông tin tài xế để đánh giá.');
      setIsSubmitting(false);
      return;
    }

    try {
      const submitted = await driverRatingApi.submit({
        driverId: Number(form.driverId),
        tripId: Number(form.tripId),
        rating: Number(form.rating),
        comment: form.comment.trim(),
      });
      setRatings((items) => [submitted, ...items]);
      setForm((current) => ({ ...current, comment: '', rating: 5 }));
      setNotice('Đã gửi đánh giá tài xế.');
      await loadDriverRatings(form.driverId);
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
            <MessageSquare className="w-8 h-8 text-brand-primary" /> Đánh giá tài xế
          </h1>
          <p className="text-brand-text/60 font-medium">Gửi đánh giá sau chuyến đi để giúp nhà trường cải thiện chất lượng vận hành.</p>
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
          <h2 className="text-xl font-bold">Tạo đánh giá mới</h2>

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
              <div className="mt-3 flex items-center gap-2 font-bold text-brand-text">
                <UserRound className="w-4 h-4" /> Tài xế: {selectedTrip.driverName || 'Chưa có thông tin'}
              </div>
            </div>
          )}

          <div>
            <span className="block text-sm font-bold text-brand-text/70 mb-2">Số sao</span>
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
            <span className="block text-sm font-bold text-brand-text/70 mb-2">Nhận xét</span>
            <textarea
              value={form.comment}
              onChange={(event) => setForm({ ...form, comment: event.target.value })}
              placeholder="Nhập nhận xét về tài xế..."
              className="w-full flex-1 min-h-40 bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-primary resize-none"
              maxLength={1000}
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !form.tripId || !form.driverId}
            className="w-full py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" /> {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 overflow-y-auto custom-scrollbar">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold">Đánh giá của tài xế này</h2>
              {selectedTrip?.driverName && (
                <div className="text-sm font-bold text-brand-text/50 mt-1">{selectedTrip.driverName}</div>
              )}
            </div>
            {summary && (
              <div className="rounded-2xl bg-brand-warning/10 px-4 py-3 text-right">
                <div className="text-lg font-black text-brand-warning">{Number(summary.averageRating || 0).toFixed(2)}/5</div>
                <div className="text-xs font-bold text-brand-text/50">{summary.totalReviews || 0} đánh giá</div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-brand-text/50 font-bold">Đang tải dữ liệu...</div>
          ) : ratings.length ? (
            <div className="flex flex-col gap-4">
              {ratings.map((rating) => (
                <div key={rating.driverRatingId} className="border border-black/5 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-brand-text">{rating.studentName || rating.studentCode}</div>
                      <div className="text-xs font-bold text-brand-text/40 mt-1">
                        Chuyến #{rating.tripId || 'N/A'} • {formatDateTime(rating.createdAt)}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-brand-warning/10 text-brand-warning">
                      {rating.rating}/5 sao
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="mt-3 text-sm font-medium text-brand-text/70">{rating.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-brand-text/50 font-bold">Chưa có đánh giá nào cho tài xế này.</div>
          )}
        </div>
      </div>
    </div>
  );
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
