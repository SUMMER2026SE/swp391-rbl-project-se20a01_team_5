"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Package, RefreshCw, Send } from 'lucide-react';
import { lostItemApi, travelApi } from '@/services/api';
import { recentTripMocks } from '@/services/mockTrips';

export default function StudentLostItemsPage() {
  const [trips, setTrips] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({
    tripId: '',
    itemDescription: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const selectedTrip = useMemo(
    () => trips.find((trip) => String(trip.tripId) === String(form.tripId)),
    [trips, form.tripId],
  );

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError('');
    Promise.all([
      travelApi.getHistory({ page: 0, size: 20 }).catch(() => recentTripMocks),
      lostItemApi.listMine({ page: 0, size: 20 }),
    ])
      .then(([tripItems, reportItems]) => {
        const normalizedTrips = tripItems?.length ? tripItems : recentTripMocks;
        setTrips(normalizedTrips);
        setReports(reportItems || []);
        setForm((current) => ({
          ...current,
          tripId: current.tripId || normalizedTrips[0]?.tripId || '',
        }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(handle);
  }, [loadData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');

    try {
      const submitted = await lostItemApi.submit({
        tripId: form.tripId ? Number(form.tripId) : null,
        itemDescription: form.itemDescription.trim(),
        notes: form.notes.trim(),
      });
      setReports((items) => [submitted, ...items]);
      setForm((current) => ({ ...current, itemDescription: '', notes: '' }));
      setNotice('Đã gửi báo cáo mất đồ. Nhà xe sẽ tiếp nhận và cập nhật trạng thái.');
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
            <Package className="w-8 h-8 text-brand-primary" /> Báo mất đồ
          </h1>
          <p className="text-brand-text/60 font-medium">Tạo báo cáo vật phẩm thất lạc theo chuyến xe để nhà xe hỗ trợ tìm kiếm.</p>
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
          <h2 className="text-xl font-bold">Tạo báo cáo mới</h2>

          <label className="block">
            <span className="block text-sm font-bold text-brand-text/70 mb-2">Chuyến xe</span>
            <select
              value={form.tripId}
              onChange={(event) => setForm({ ...form, tripId: event.target.value })}
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
              {selectedTrip.driverName && <div className="mt-1">Tài xế: {selectedTrip.driverName}</div>}
            </div>
          )}

          <label className="block">
            <span className="block text-sm font-bold text-brand-text/70 mb-2">Mô tả vật phẩm</span>
            <input
              required
              maxLength={500}
              value={form.itemDescription}
              onChange={(event) => setForm({ ...form, itemDescription: event.target.value })}
              placeholder="VD: Ví màu đen, bình nước xanh, tai nghe..."
              className="w-full bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary"
            />
          </label>

          <label className="flex-1 flex flex-col">
            <span className="block text-sm font-bold text-brand-text/70 mb-2">Thời gian / vị trí / ghi chú</span>
            <textarea
              value={form.notes}
              maxLength={500}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="VD: Tôi để quên ở hàng ghế giữa sau khi xuống xe khoảng 17:30..."
              className="w-full flex-1 min-h-40 bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-primary resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !form.itemDescription.trim() || !form.tripId}
            className="w-full py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" /> {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </form>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 overflow-y-auto custom-scrollbar">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-primary" /> Báo cáo đã gửi
          </h2>
          {isLoading ? (
            <div className="py-20 text-center text-brand-text/50 font-bold">Đang tải dữ liệu...</div>
          ) : reports.length ? (
            <div className="flex flex-col gap-4">
              {reports.map((report) => (
                <div key={report.lostItemReportId} className="border border-black/5 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-brand-text">{report.itemDescription}</div>
                      <div className="text-xs font-bold text-brand-text/40 mt-1">
                        Chuyến #{report.tripId || 'N/A'} • {report.routeName || 'Tuyến chưa xác định'} • {formatDateTime(report.reportedAt)}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-brand-warning/10 text-brand-warning">
                      {labelForStatus(report.status)}
                    </span>
                  </div>
                  {report.notes && (
                    <p className="mt-3 text-sm font-medium text-brand-text/70">{report.notes}</p>
                  )}
                  {report.assistedByName && (
                    <div className="mt-3 rounded-2xl bg-brand-surface p-4 text-sm font-medium text-brand-text/70">
                      Người hỗ trợ: <span className="font-bold text-brand-text">{report.assistedByName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-brand-text/50 font-bold">Bạn chưa gửi báo cáo mất đồ nào.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function labelForStatus(status) {
  const labels = {
    REPORTED: 'Đã báo cáo',
    SEARCHING: 'Đang tìm',
    FOUND: 'Đã tìm thấy',
    NOT_FOUND: 'Không tìm thấy',
  };
  return labels[status] || status || 'Đã báo cáo';
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
