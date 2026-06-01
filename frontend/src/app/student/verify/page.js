"use client";

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Clock, Upload, XCircle, CheckCircle2, RefreshCw, AlertCircle, Search } from 'lucide-react';
import { studentVerificationApi } from '@/services/api';

const statusCopy = {
  NOT_SUBMITTED: {
    label: 'Chưa gửi hồ sơ',
    tone: 'bg-brand-surface text-brand-text border-black/5',
    icon: Upload,
  },
  PENDING_REVIEW: {
    label: 'Đang chờ duyệt',
    tone: 'bg-brand-secondary/10 text-brand-text border-brand-secondary/20',
    icon: Clock,
  },
  VERIFIED: {
    label: 'Đã xác minh',
    tone: 'bg-brand-success/10 text-brand-success border-brand-success/20',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Bị từ chối',
    tone: 'bg-brand-danger/10 text-brand-danger border-brand-danger/20',
    icon: XCircle,
  },
  RESUBMISSION_REQUIRED: {
    label: 'Cần nộp lại',
    tone: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
    icon: AlertCircle,
  },
};

export default function StudentVerifyPage() {
  const [verification, setVerification] = useState(null);
  const [formData, setFormData] = useState({ university: '', studentCode: '' });
  const [universities, setUniversities] = useState([]);
  const [universitySearch, setUniversitySearch] = useState('');
  const [isUniversityListOpen, setIsUniversityListOpen] = useState(false);
  const [cardImage, setCardImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const currentStatus = verification?.status || 'NOT_SUBMITTED';
  const status = statusCopy[currentStatus] || statusCopy.NOT_SUBMITTED;
  const StatusIcon = status.icon;
  const canSubmit = ['NOT_SUBMITTED', 'REJECTED', 'RESUBMISSION_REQUIRED'].includes(currentStatus);

  const previewName = useMemo(() => {
    if (cardImage?.name) return cardImage.name;
    if (verification?.cardImageUrl) return verification.cardImageUrl.split('/').pop();
    return 'Chưa chọn ảnh thẻ sinh viên';
  }, [cardImage, verification]);

  const filteredUniversities = useMemo(() => {
    const keyword = normalize(universitySearch);
    if (!keyword) return universities;
    return universities.filter((university) => normalize(university).includes(keyword));
  }, [universities, universitySearch]);

  const loadVerification = async () => {
    setIsLoading(true);
    setError('');
    try {
      const current = await studentVerificationApi.getCurrent();
      const universityList = await studentVerificationApi.listDaNangUniversities();
      setVerification(current);
      setUniversities(universityList || []);
      setFormData({
        university: current?.university || '',
        studentCode: current?.studentCode || '',
      });
      setUniversitySearch(current?.university || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handle = window.setTimeout(loadVerification, 0);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleCardImageChange = (file) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCardImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!cardImage) {
      setError('Vui lòng tải ảnh thẻ sinh viên trước khi gửi hồ sơ.');
      return;
    }
    if (!formData.university) {
      setError('Vui lòng chọn trường từ danh sách Đà Nẵng.');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitted = await studentVerificationApi.submit({
        university: formData.university.trim(),
        studentCode: formData.studentCode.trim(),
        cardImage,
      });
      setVerification(submitted);
      setMessage('Hồ sơ đã được gửi. Admin sẽ duyệt trước khi bạn mua vé hoặc đăng ký tuyến.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm font-bold text-brand-text/50">Đang tải trạng thái xác minh...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <BadgeCheck className="w-8 h-8 text-brand-primary" /> Xác minh sinh viên
          </h1>
          <p className="text-brand-text/60 font-medium">Gửi hồ sơ sinh viên để mở khóa mua vé và đăng ký tuyến.</p>
        </div>
        <button
          type="button"
          onClick={loadVerification}
          className="px-4 py-3 rounded-2xl bg-white border border-black/5 font-bold text-sm hover:bg-brand-surface transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-2xl text-sm font-bold text-brand-success">
          {message}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className={`rounded-3xl p-6 border shadow-sm ${status.tone}`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center border border-black/5">
                <StatusIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider opacity-60">Trạng thái</div>
                <div className="text-2xl font-black">{status.label}</div>
              </div>
            </div>
            {verification?.rejectionReason && (
              <div className="mt-5 bg-white/70 rounded-2xl p-4 text-sm font-bold">
                {verification.rejectionReason}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Quy trình</h2>
            <div className="space-y-3 text-sm font-medium text-brand-text/70">
              <Step done label="Tạo tài khoản và xác thực email" />
              <Step done={currentStatus !== 'NOT_SUBMITTED'} label="Gửi trường, mã sinh viên và ảnh thẻ" />
              <Step done={currentStatus === 'VERIFIED'} label="Hồ sơ được xác nhận" />
              <Step done={currentStatus === 'VERIFIED'} label="Mở khóa mua vé và đăng ký tuyến" />
            </div>
          </div>
        </div>

        {canSubmit ? (
        <form onSubmit={handleSubmit} className="xl:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Hồ sơ xác minh</h2>
            <p className="text-sm font-medium text-brand-text/60">
              Chọn đúng trường, nhập mã sinh viên và tải ảnh thẻ rõ nét để gửi hồ sơ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Trường học">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40 pointer-events-none" />
                <input
                  type="text"
                  required
                  disabled={!canSubmit}
                  value={universitySearch}
                  onFocus={() => setIsUniversityListOpen(true)}
                  onChange={(e) => {
                    setUniversitySearch(e.target.value);
                    setFormData({ ...formData, university: '' });
                    setIsUniversityListOpen(true);
                  }}
                  className="field-input !pl-12"
                  placeholder="Tìm trường tại Đà Nẵng"
                  autoComplete="off"
                />
                {canSubmit && isUniversityListOpen && (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-black/5 bg-white shadow-xl">
                    {filteredUniversities.map((university) => (
                      <button
                        type="button"
                        key={university}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setFormData({ ...formData, university });
                          setUniversitySearch(university);
                          setIsUniversityListOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-brand-text hover:bg-brand-surface"
                      >
                        {university}
                      </button>
                    ))}
                    {!filteredUniversities.length && (
                      <div className="px-4 py-5 text-sm font-bold text-brand-text/50">
                        Không tìm thấy trường trong danh sách Đà Nẵng.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs font-bold text-brand-text/40">
                Chọn từ danh sách để tránh lỗi validate hồ sơ.
              </p>
            </Field>
            <Field label="Mã sinh viên">
              <input
                type="text"
                required
                disabled={!canSubmit}
                value={formData.studentCode}
                onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                className="field-input font-mono"
                placeholder="Mã sinh viên"
              />
            </Field>
          </div>

          <div>
            <label className="block text-xs font-black text-brand-text/50 uppercase mb-2">Ảnh thẻ sinh viên</label>
            <label className={`min-h-[260px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center p-6 transition-colors ${canSubmit ? 'cursor-pointer border-black/10 hover:border-brand-primary bg-brand-surface/40' : 'border-black/5 bg-brand-surface/20 opacity-70'}`}>
              {previewUrl ? (
                <img src={previewUrl} alt="Student card preview" className="max-h-56 rounded-2xl object-contain border border-black/5 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 border border-black/5">
                  <Upload className="w-8 h-8 text-brand-text/40" />
                </div>
              )}
              <div className="mt-4 font-bold text-brand-text">{previewName}</div>
              <div className="text-xs font-medium text-brand-text/50 mt-1">PNG, JPG hoặc ảnh chụp rõ mặt trước thẻ</div>
              <input
                type="file"
                accept="image/*"
                disabled={!canSubmit}
                className="hidden"
                onChange={(e) => handleCardImageChange(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full py-4 rounded-2xl bg-brand-text text-white font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ xác minh'}
          </button>
        </form>
        ) : (
          <ReviewStatusPanel verification={verification} currentStatus={currentStatus} />
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-black text-brand-text/50 uppercase mb-2">{label}</span>
      <div className="[&_.field-input]:w-full [&_.field-input]:rounded-2xl [&_.field-input]:bg-brand-surface [&_.field-input]:border [&_.field-input]:border-black/5 [&_.field-input]:px-4 [&_.field-input]:py-4 [&_.field-input]:text-sm [&_.field-input]:font-bold [&_.field-input]:outline-none [&_.field-input]:focus:bg-white [&_.field-input]:focus:border-brand-primary [&_.field-input]:transition-all [&_.field-input]:disabled:opacity-60">
        {children}
      </div>
    </label>
  );
}

function Step({ done, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${done ? 'bg-brand-success border-brand-success text-white' : 'bg-brand-surface border-black/10 text-brand-text/30'}`}>
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <span>{label}</span>
    </div>
  );
}

function ReviewStatusPanel({ verification, currentStatus }) {
  const isVerified = currentStatus === 'VERIFIED';

  return (
    <div className="xl:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col justify-center">
      <div className="max-w-xl mx-auto text-center">
        <div className={`mx-auto mb-6 w-20 h-20 rounded-3xl flex items-center justify-center border ${isVerified ? 'bg-brand-success/10 border-brand-success/20 text-brand-success' : 'bg-brand-secondary/10 border-brand-secondary/20 text-brand-text'}`}>
          {isVerified ? <BadgeCheck className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
        </div>
        <h2 className="text-3xl font-black text-brand-text mb-3">
          {isVerified ? 'Hồ sơ đã được xác minh' : 'Đã nhận hồ sơ xác minh'}
        </h2>
        <p className="text-brand-text/60 font-medium leading-relaxed mb-6">
          {isVerified
            ? 'Tài khoản sinh viên của bạn đã được mở khóa để mua vé và đăng ký tuyến.'
            : 'Hồ sơ của bạn đã được gửi thành công và đang chờ admin kiểm tra. UniBus sẽ cập nhật trạng thái sau khi xét duyệt.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <SummaryItem label="Trường học" value={verification?.university} />
          <SummaryItem label="Mã sinh viên" value={verification?.studentCode} />
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-brand-surface/70 border border-black/5 p-4">
      <div className="text-[11px] font-black uppercase text-brand-text/40 mb-1">{label}</div>
      <div className="font-bold text-brand-text">{value || '--'}</div>
    </div>
  );
}

function normalize(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
