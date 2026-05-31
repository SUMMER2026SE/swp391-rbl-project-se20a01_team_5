"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, UserPlus, User, Mail, CreditCard, Building2, KeyRound } from 'lucide-react';
import { authApi, getDefaultRouteForRole, setAuthSession } from '@/services/api';

const initialForm = {
  fullName: '',
  studentCode: '',
  email: '',
  university: '',
  faculty: '',
  academicYear: '',
  dateOfBirth: '',
  otp: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSocialRegister = (provider) => {
    setError('');
    setMessage(`${provider} register UI đang được giữ lại, nhưng backend OAuth chưa được triển khai.`);
  };

  const handleRequestOtp = async () => {
    setError('');
    setMessage('');

    if (!formData.email.trim()) {
      setError('Vui lòng nhập email trước khi lấy mã OTP.');
      return;
    }

    setIsRequestingOtp(true);
    try {
      await authApi.requestRegistrationOtp(formData.email.trim());
      setMessage('OTP đã được tạo. Nếu backend đang bật OTP_LOG_CODE, hãy xem mã trong log backend.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        studentCode: formData.studentCode.trim(),
        university: formData.university.trim(),
        faculty: formData.faculty.trim() || null,
        academicYear: formData.academicYear ? Number(formData.academicYear) : null,
        dateOfBirth: formData.dateOfBirth || null,
      });

      const tokenPair = await authApi.login({
        email: formData.email.trim(),
        password: formData.password,
        device: 'web',
      });
      setAuthSession(tokenPair);
      router.push(getDefaultRouteForRole(tokenPair.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="hidden lg:flex bg-brand-text rounded-3xl p-12 shadow-sm flex-col justify-between relative overflow-hidden border border-black/5 text-white">
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/10">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Tạo tài khoản sinh viên</h1>
            <p className="text-lg text-white/70 font-medium leading-relaxed">
              Đăng ký bằng email, mã sinh viên và OTP được cấp từ backend UniBus.
            </p>
          </div>
          <div className="text-sm font-bold text-white/30 relative z-10">
            Dành cho sinh viên sử dụng UniBus
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-black/5 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Tạo tài khoản mới</h2>
            <p className="text-brand-text/60 mt-2 text-sm">Điền đúng thông tin sinh viên để backend xác thực.</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-sm font-semibold text-brand-danger">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 bg-brand-success/10 border border-brand-success/20 rounded-xl text-sm font-semibold text-brand-success">
              {message}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Họ và tên" icon={User}>
                <input
                  type="text"
                  required
                  className="field-input"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                />
              </Field>

              <Field label="Mã sinh viên" icon={CreditCard}>
                <input
                  type="text"
                  required
                  className="field-input font-mono"
                  value={formData.studentCode}
                  onChange={(e) => updateField('studentCode', e.target.value)}
                />
              </Field>
            </div>

            <Field label="Email" icon={Mail}>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  className="field-input font-mono"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isRequestingOtp}
                  className="px-4 rounded-xl bg-brand-secondary/10 text-brand-secondary font-bold text-sm hover:bg-brand-secondary hover:text-brand-text transition-colors disabled:opacity-60"
                >
                  {isRequestingOtp ? 'Đang gửi' : 'Lấy OTP'}
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Trường" icon={Building2}>
                <input
                  type="text"
                  required
                  className="field-input"
                  value={formData.university}
                  onChange={(e) => updateField('university', e.target.value)}
                />
              </Field>

              <Field label="Khoa" icon={Building2}>
                <input
                  type="text"
                  className="field-input"
                  value={formData.faculty}
                  onChange={(e) => updateField('faculty', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Năm học" icon={CreditCard}>
                <input
                  type="number"
                  min="1"
                  className="field-input"
                  value={formData.academicYear}
                  onChange={(e) => updateField('academicYear', e.target.value)}
                />
              </Field>

              <Field label="Ngày sinh" icon={User}>
                <input
                  type="date"
                  className="field-input"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                />
              </Field>

              <Field label="OTP" icon={KeyRound}>
                <input
                  type="text"
                  required
                  minLength={6}
                  maxLength={6}
                  className="field-input font-mono"
                  value={formData.otp}
                  onChange={(e) => updateField('otp', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Mật khẩu" icon={Lock}>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="field-input font-mono"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                />
              </Field>

              <Field label="Xác nhận mật khẩu" icon={Lock}>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="field-input font-mono"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 mt-4 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5" /> {isSubmitting ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-black/10"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-text/40">Hoặc tiếp tục với</span>
            <div className="h-px flex-1 bg-black/10"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialRegister('Google')}
              className="py-3 rounded-xl border border-black/10 bg-white text-sm font-bold text-brand-text hover:bg-brand-surface transition-colors flex items-center justify-center gap-2"
            >
              <span className="font-black text-red-500">G</span>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialRegister('Facebook')}
              className="py-3 rounded-xl border border-black/10 bg-white text-sm font-bold text-brand-text hover:bg-brand-surface transition-colors flex items-center justify-center gap-2"
            >
              <span className="font-black text-blue-600">f</span>
              Facebook
            </button>
          </div>

          <p className="text-center text-sm font-medium text-brand-text/60 mt-6">
            Đã có tài khoản? <Link href="/login" className="text-brand-secondary hover:text-brand-text font-bold ml-1 transition-colors">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-brand-text/60 mb-2 ml-1 uppercase">{label}</span>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
        <div className="[&_.field-input]:w-full [&_.field-input]:pl-10 [&_.field-input]:pr-4 [&_.field-input]:py-3 [&_.field-input]:rounded-xl [&_.field-input]:bg-brand-surface [&_.field-input]:border [&_.field-input]:border-black/5 [&_.field-input]:focus:bg-white [&_.field-input]:focus:border-brand-text [&_.field-input]:focus:ring-2 [&_.field-input]:focus:ring-brand-text/20 [&_.field-input]:outline-none [&_.field-input]:transition-all [&_.field-input]:font-medium [&_.field-input]:text-sm">
          {children}
        </div>
      </div>
    </label>
  );
}
