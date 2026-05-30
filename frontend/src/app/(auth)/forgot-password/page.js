"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Search, ArrowLeft, Lock } from 'lucide-react';
import { authApi } from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResetDone, setIsResetDone] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setIsLoading(true);
    try {
      await authApi.requestPasswordResetOtp(email);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      setIsResetDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Branding Bento Block */}
        <div className="hidden lg:flex bg-brand-primary rounded-3xl p-12 shadow-sm flex-col justify-between relative overflow-hidden border border-black/5">
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/30 rounded-full blur-3xl"></div>
          <div>
            <img 
              src="/logo.png" 
              alt="UniBus Logo" 
              className="h-24 w-auto object-contain mb-6 drop-shadow-sm" 
            />
            <p className="text-lg text-brand-text/80 font-medium">
              Không thể đăng nhập? Đừng lo lắng, chúng tôi sẽ giúp bạn khôi phục lại quyền truy cập hệ thống ngay bây giờ.
            </p>
          </div>
          <div className="text-sm font-bold text-brand-text/40">
            © 2026 UniBus System
          </div>
        </div>

        {/* Forgot Password Form Bento Block */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-black/5 flex flex-col justify-center">
          
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Tìm tài khoản</h2>
            <p className="text-brand-text/60 font-medium text-sm">
              Nhập email tài khoản để nhận OTP khôi phục mật khẩu.
            </p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-sm font-semibold text-brand-danger">
              {error}
            </div>
          )}

          {!isSubmitted ? (
            <form onSubmit={handleSearch} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
                  <input 
                    type="email" 
                    required
                    placeholder="student.test@example.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-brand-surface/50 border border-black/5 focus:bg-white focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20 outline-none transition-all font-mono text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 mt-2 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60"
              >
                <Search className="w-5 h-5" /> {isLoading ? 'Đang gửi OTP...' : 'Gửi OTP'}
              </button>
            </form>
          ) : isResetDone ? (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <div className="w-16 h-16 bg-brand-success/20 text-brand-success rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Đã đổi mật khẩu!</h3>
              <p className="text-brand-text/70 text-sm mb-6">
                Mật khẩu của <strong>{email}</strong> đã được cập nhật. Bạn có thể đăng nhập lại bằng mật khẩu mới.
              </p>
              <Link href="/login" className="px-6 py-2 bg-brand-text text-white rounded-xl font-bold text-sm hover:bg-black transition-colors">
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-5">
              <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-xl text-sm font-semibold text-brand-success">
                OTP đã được gửi/log cho <strong>{email}</strong>. Trong môi trường dev, hãy xem console backend.
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1">OTP</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 chữ số"
                  className="w-full px-4 py-3.5 rounded-xl bg-brand-surface/50 border border-black/5 focus:bg-white focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20 outline-none transition-all font-mono text-sm"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-brand-surface/50 border border-black/5 focus:bg-white focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20 outline-none transition-all font-mono text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60"
              >
                {isLoading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-black/5 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-brand-secondary hover:text-brand-text transition-colors">
              <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
