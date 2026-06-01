"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, KeyRound, Lock, Send } from 'lucide-react';
import { authApi } from '@/services/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsRequestingOtp(true);

    try {
      await authApi.requestPasswordResetOtp(email.trim());
      setMessage('Nếu email tồn tại trong hệ thống, OTP đã được tạo. Hãy xem log backend khi OTP_LOG_CODE=true.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsResetting(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setMessage('Đổi mật khẩu thành công. Đang chuyển về trang đăng nhập...');
      setTimeout(() => router.push('/login'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[0.9fr_1fr] gap-4 md:gap-6">
        <div className="hidden lg:flex bg-brand-primary rounded-3xl p-12 shadow-sm flex-col justify-between relative overflow-hidden border border-black/5">
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/30 rounded-full blur-3xl"></div>
          <div>
            <img
              src="/logo.png"
              alt="UniBus Logo"
              className="h-16 w-auto object-contain mb-6 drop-shadow-sm rounded-3xl"
            />
            <p className="text-lg text-brand-text/80 font-medium">
              Khôi phục mật khẩu bằng OTP được cấp trực tiếp từ backend UniBus.
            </p>
          </div>
          <div className="text-sm font-bold text-brand-text/40">
            © 2026 UniBus System
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-black/5 flex items-center">
          <div className="w-full max-w-md mx-auto">
          <div className="mb-7">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">Đặt lại mật khẩu</h2>
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

          <form onSubmit={requestOtp} className="mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-brand-surface/50 border border-black/5 focus:bg-white focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20 outline-none transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRequestingOtp}
                className="w-full h-14 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" /> {isRequestingOtp ? 'Đang gửi...' : 'Gửi OTP'}
              </button>
            </div>
          </form>

          <form onSubmit={resetPassword} className="flex flex-col gap-4">
            <InputWithIcon label="OTP" icon={KeyRound}>
              <input
                type="text"
                required
                minLength={6}
                maxLength={6}
                inputMode="numeric"
                placeholder="Nhập mã OTP"
                className="form-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </InputWithIcon>

            <InputWithIcon label="Mật khẩu mới" icon={Lock}>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Tối thiểu 8 ký tự"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </InputWithIcon>

            <InputWithIcon label="Xác nhận mật khẩu mới" icon={Lock}>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Nhập lại mật khẩu"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </InputWithIcon>

            <button
              type="submit"
              disabled={isResetting}
              className="w-full h-14 mt-2 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Lock className="w-5 h-5" /> {isResetting ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-black/5 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-brand-secondary hover:text-brand-text transition-colors">
              <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
            </Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputWithIcon({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-2 ml-1">{label}</span>
      <div className="relative [&_.form-input]:w-full [&_.form-input]:h-14 [&_.form-input]:pl-12 [&_.form-input]:pr-4 [&_.form-input]:rounded-xl [&_.form-input]:bg-brand-surface/50 [&_.form-input]:border [&_.form-input]:border-black/5 [&_.form-input]:focus:bg-white [&_.form-input]:focus:border-brand-secondary [&_.form-input]:focus:ring-4 [&_.form-input]:focus:ring-brand-secondary/20 [&_.form-input]:outline-none [&_.form-input]:transition-all [&_.form-input]:text-sm">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
        {children}
      </div>
    </label>
  );
}
