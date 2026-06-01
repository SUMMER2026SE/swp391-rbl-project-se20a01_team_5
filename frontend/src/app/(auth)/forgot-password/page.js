"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, ArrowRight, KeyRound, Lock, Send } from 'lucide-react';
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
  const [step, setStep] = useState(1);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsRequestingOtp(true);

    try {
      await authApi.requestPasswordResetOtp(email.trim());
      setMessage('Nếu có tài khoản khớp với thông tin đã nhập, mã xác thực sẽ được gửi.');
      setStep(2);
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
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="hidden lg:flex bg-brand-primary rounded-3xl p-12 shadow-sm flex-col justify-between relative overflow-hidden border border-black/5">
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/30 rounded-full blur-3xl"></div>
          <div>
            <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
              <img
                src="/logo.png"
                alt="UniBus Logo"
                className="h-28 w-auto object-contain mb-6 drop-shadow-sm rounded-3xl"
              />
            </Link>
            <p className="text-lg text-brand-text/80 font-medium">
              Lấy lại quyền truy cập tài khoản nhanh chóng và an toàn qua mã xác thực OTP.
            </p>
          </div>
          <div className="text-sm font-bold text-brand-text/40">
            © 2026 UniBus System
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-black/5 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Đặt lại mật khẩu</h2>
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

          {step === 1 && (
            <form onSubmit={requestOtp} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1">Email của bạn</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-brand-surface/50 border border-black/5 focus:bg-white focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20 outline-none transition-all font-mono text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRequestingOtp}
                className="w-full py-4 mt-2 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60"
              >
                <ArrowRight className="w-5 h-5" /> {isRequestingOtp ? 'Đang xử lý...' : 'Tiếp tục'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); if(otp.length === 6) setStep(3); else setError('Mã OTP phải gồm 6 chữ số'); }} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-12 duration-500 ease-out">
              <div className="p-4 bg-brand-surface/50 rounded-xl mb-2 border border-black/5 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-brand-text/50 uppercase block mb-0.5">Mã đã được gửi đến</span>
                  <span className="text-sm font-mono font-medium">{email}</span>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-brand-secondary hover:text-brand-text transition-colors">
                  Sửa email
                </button>
              </div>

              <InputWithIcon label="Nhập mã xác thực OTP" icon={KeyRound}>
                <input
                  type="text"
                  required
                  minLength={6}
                  maxLength={6}
                  placeholder="000000"
                  className="form-input tracking-[0.4em]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </InputWithIcon>

              <button
                type="submit"
                className="w-full py-4 mt-2 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm"
              >
                Tiếp tục <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={resetPassword} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-12 duration-500 ease-out">
              <div className="text-center mb-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-brand-success/10 text-brand-success text-sm font-bold mb-2">
                  Xác thực thành công
                </span>
                <p className="text-sm font-medium text-brand-text/60">Vui lòng tạo mật khẩu mới cho tài khoản của bạn.</p>
              </div>

              <InputWithIcon label="Mật khẩu mới" icon={Lock}>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Ít nhất 8 ký tự"
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
                  placeholder="Nhập lại mật khẩu mới"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </InputWithIcon>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full py-4 mt-2 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60"
              >
                <ArrowRight className="w-5 h-5" /> {isResetting ? 'Đang xử lý...' : 'Hoàn tất'}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-black/5 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-brand-secondary hover:text-brand-text transition-colors">
              <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
            </Link>
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
      <div className="relative [&_.form-input]:w-full [&_.form-input]:pl-12 [&_.form-input]:pr-4 [&_.form-input]:py-3.5 [&_.form-input]:rounded-xl [&_.form-input]:bg-brand-surface/50 [&_.form-input]:border [&_.form-input]:border-black/5 [&_.form-input]:focus:bg-white [&_.form-input]:focus:border-brand-secondary [&_.form-input]:focus:ring-4 [&_.form-input]:focus:ring-brand-secondary/20 [&_.form-input]:outline-none [&_.form-input]:transition-all [&_.form-input]:font-mono [&_.form-input]:text-sm">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
        {children}
      </div>
    </label>
  );
}
