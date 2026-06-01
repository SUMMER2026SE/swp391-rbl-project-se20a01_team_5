"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileImage,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from 'lucide-react';
import { adminVerificationApi } from '@/services/api';

const filters = [
  { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { value: 'RESUBMISSION_REQUIRED', label: 'Cần nộp lại' },
  { value: 'REJECTED', label: 'Đã từ chối' },
  { value: 'VERIFIED', label: 'Đã xác minh' },
  { value: 'ALL', label: 'Tất cả' },
];

const statusCopy = {
  NOT_SUBMITTED: { label: 'Chưa gửi', tone: 'bg-brand-surface text-brand-text' },
  PENDING_REVIEW: { label: 'Chờ duyệt', tone: 'bg-brand-secondary/10 text-brand-text' },
  VERIFIED: { label: 'Đã xác minh', tone: 'bg-brand-success/10 text-brand-success' },
  REJECTED: { label: 'Đã từ chối', tone: 'bg-brand-danger/10 text-brand-danger' },
  RESUBMISSION_REQUIRED: { label: 'Cần nộp lại', tone: 'bg-brand-warning/10 text-brand-warning' },
};

export default function AdminStudentVerificationsPage() {
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [cardImageUrl, setCardImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => (
      item.fullName?.toLowerCase().includes(keyword)
      || item.email?.toLowerCase().includes(keyword)
      || item.studentCode?.toLowerCase().includes(keyword)
      || item.university?.toLowerCase().includes(keyword)
    ));
  }, [items, searchTerm]);

  const loadVerifications = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminVerificationApi.list(status);
      setItems(data || []);
      setSelected((current) => {
        if (!current) return data?.[0] || null;
        return data?.find((item) => item.verificationId === current.verificationId) || data?.[0] || null;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const handle = window.setTimeout(loadVerifications, 0);
    return () => window.clearTimeout(handle);
  }, [loadVerifications]);

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;
    const handle = window.setTimeout(() => {
      if (!selected?.verificationId || !selected?.cardImageUrl) {
        setCardImageUrl('');
        return;
      }

      adminVerificationApi.getCardImageBlob(selected.verificationId)
        .then((blob) => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setCardImageUrl(objectUrl);
        })
        .catch(() => {
          if (!cancelled) {
            setCardImageUrl('');
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selected]);

  const handleReview = async (action) => {
    if (!selected) return;

    setIsReviewing(true);
    setError('');
    setNotice('');
    try {
      if (action === 'approve') {
        await adminVerificationApi.approve(selected.verificationId);
        setNotice(`Đã xác minh ${selected.fullName}.`);
      } else if (action === 'reject') {
        await adminVerificationApi.reject(selected.verificationId, reviewReason.trim());
        setNotice(`Đã từ chối hồ sơ của ${selected.fullName}.`);
      } else {
        await adminVerificationApi.requestResubmission(selected.verificationId, reviewReason.trim());
        setNotice(`Đã yêu cầu ${selected.fullName} nộp lại hồ sơ.`);
      }
      setReviewReason('');
      await loadVerifications();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsReviewing(false);
    }
  };

  const pendingCount = items.filter((item) => item.status === 'PENDING_REVIEW').length;

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <BadgeCheck className="w-8 h-8 text-brand-primary" /> Xác minh sinh viên
          </h1>
          <p className="text-brand-text/60 font-medium">Kiểm tra hồ sơ xác minh trước khi sinh viên mua vé hoặc đăng ký tuyến.</p>
        </div>
        <button
          type="button"
          onClick={loadVerifications}
          className="px-5 py-3 rounded-2xl bg-white border border-black/5 font-bold text-sm hover:bg-brand-surface transition-colors flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl border border-brand-success/20 bg-brand-success/10 p-4 text-sm font-bold text-brand-success">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(420px,0.9fr)_1.1fr] gap-6 min-h-0 flex-1">
        <section className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden min-h-0">
          <div className="p-5 md:p-6 border-b border-black/5 bg-brand-surface/30 flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatus(filter.value)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-black transition-colors ${status === filter.value ? 'bg-brand-text text-white' : 'bg-white text-brand-text/60 hover:text-brand-text'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, email, mã sinh viên..."
                className="w-full bg-white border border-black/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-brand-primary shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-sm font-bold text-brand-text/50">
                Đang tải hồ sơ...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-center text-sm font-bold text-brand-text/50">
                Không có hồ sơ phù hợp.
              </div>
            ) : (
              filteredItems.map((item) => {
                const active = selected?.verificationId === item.verificationId;
                const statusInfo = statusCopy[item.status] || statusCopy.NOT_SUBMITTED;
                return (
                  <button
                    key={item.verificationId}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`w-full text-left p-4 rounded-2xl border transition-colors mb-2 ${active ? 'border-brand-text bg-brand-text text-white' : 'border-transparent hover:bg-brand-surface'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-black truncate">{item.fullName}</div>
                        <div className={`text-xs font-bold truncate ${active ? 'text-white/60' : 'text-brand-text/50'}`}>
                          {item.email}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black ${active ? 'bg-white/10 text-white' : statusInfo.tone}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className={`mt-3 grid grid-cols-2 gap-2 text-xs font-bold ${active ? 'text-white/70' : 'text-brand-text/60'}`}>
                      <span className="truncate">{item.studentCode}</span>
                      <span className="truncate text-right">{item.university}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-black/5 bg-white text-xs font-bold text-brand-text/50 flex justify-between">
            <span>{filteredItems.length} hồ sơ hiển thị</span>
            <span>{pendingCount} đang chờ duyệt</span>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-y-auto custom-scrollbar p-6 md:p-8 min-h-0">
          {!selected ? (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center text-brand-text/50">
              <Clock className="w-10 h-10 mb-3" />
              <div className="font-black">Chọn một hồ sơ để xem chi tiết.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase text-brand-text/40 mb-2">Hồ sơ #{selected.verificationId}</div>
                  <h2 className="text-2xl font-black text-brand-text">{selected.fullName}</h2>
                  <p className="text-sm font-bold text-brand-text/50">{selected.email}</p>
                </div>
                <StatusPill status={selected.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info label="Trường học" value={selected.university} />
                <Info label="Mã sinh viên" value={selected.studentCode} mono />
                <Info label="Ngày gửi" value={formatDateTime(selected.submittedAt)} />
                <Info label="Ngày duyệt" value={formatDateTime(selected.reviewedAt) || 'Chưa duyệt'} />
              </div>

              <div className="rounded-3xl bg-brand-surface/50 border border-black/5 p-5">
                <div className="flex items-center gap-2 text-sm font-black mb-4">
                  <FileImage className="w-5 h-5 text-brand-primary" /> Ảnh thẻ sinh viên
                </div>
                {cardImageUrl ? (
                  <img
                    src={cardImageUrl}
                    alt="Ảnh thẻ sinh viên"
                    className="max-h-[360px] w-full object-contain rounded-2xl bg-white border border-black/5"
                  />
                ) : (
                  <div className="h-48 rounded-2xl bg-white border border-black/5 flex items-center justify-center text-sm font-bold text-brand-text/40">
                    Hồ sơ này chưa có ảnh hoặc ảnh không còn trong storage backend.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-black/5 p-5">
                <div className="text-sm font-black mb-3">Kết quả OCR hỗ trợ</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <Info label="Tên OCR" value={selected.ocrFullName || '--'} />
                  <Info label="Mã OCR" value={selected.ocrStudentCode || '--'} mono />
                  <Info label="Trường OCR" value={selected.ocrUniversity || '--'} />
                </div>
                {selected.ocrRawText && (
                  <div className="mt-4 rounded-2xl bg-brand-surface/60 p-4 text-sm font-medium text-brand-text/70">
                    {selected.ocrRawText}
                  </div>
                )}
              </div>

              {selected.rejectionReason && (
                <div className="rounded-2xl bg-brand-danger/10 border border-brand-danger/20 p-4 text-sm font-bold text-brand-danger">
                  {selected.rejectionReason}
                </div>
              )}

              {selected.status === 'PENDING_REVIEW' && (
                <div className="rounded-3xl bg-brand-surface/40 border border-black/5 p-5 flex flex-col gap-4">
                  <label className="block">
                    <span className="block text-xs font-black uppercase text-brand-text/50 mb-2">Ghi chú duyệt</span>
                    <textarea
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      rows={3}
                      className="w-full rounded-2xl bg-white border border-black/5 p-4 text-sm font-bold outline-none focus:border-brand-primary transition-colors"
                      placeholder="Nhập lý do khi từ chối hoặc yêu cầu nộp lại..."
                    />
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      disabled={isReviewing}
                      onClick={() => handleReview('approve')}
                      className="py-3 rounded-2xl bg-brand-success text-white font-black hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Xác nhận
                    </button>
                    <button
                      type="button"
                      disabled={isReviewing}
                      onClick={() => handleReview('resubmit')}
                      className="py-3 rounded-2xl bg-brand-warning text-white font-black hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" /> Nộp lại
                    </button>
                    <button
                      type="button"
                      disabled={isReviewing}
                      onClick={() => handleReview('reject')}
                      className="py-3 rounded-2xl bg-brand-danger text-white font-black hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" /> Từ chối
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const statusInfo = statusCopy[status] || statusCopy.NOT_SUBMITTED;
  return (
    <span className={`inline-flex px-4 py-2 rounded-xl text-xs font-black uppercase ${statusInfo.tone}`}>
      {statusInfo.label}
    </span>
  );
}

function Info({ label, value, mono = false }) {
  return (
    <div className="rounded-2xl bg-brand-surface/50 border border-black/5 p-4">
      <div className="text-[11px] font-black uppercase text-brand-text/40 mb-1">{label}</div>
      <div className={`text-sm font-bold text-brand-text break-words ${mono ? 'font-mono' : ''}`}>{value || '--'}</div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
