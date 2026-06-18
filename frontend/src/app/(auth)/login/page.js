"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, Mail } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { MaterialCard } from '@/components/ui/material';
import { authApi, getAuthSession, getDefaultRouteForRole, setAuthSession } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      router.replace(getDefaultRouteForRole(session.role, session.studentVerificationStatus));
    }
  }, [router]);

  const redirectAfterLogin = useCallback((tokenPair) => {
    setAuthSession(tokenPair);
    router.push(getDefaultRouteForRole(tokenPair.role, tokenPair.studentVerificationStatus));
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const tokenPair = await authApi.login({ email, password, device: 'web' });
      redirectAfterLogin(tokenPair);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = useCallback(async (googleCredential) => {
    setError('');
    setIsGoogleSubmitting(true);
    try {
      const tokenPair = await authApi.googleLogin({ ...googleCredential, device: 'web' });
      redirectAfterLogin(tokenPair);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGoogleSubmitting(false);
    }
  }, [redirectAfterLogin]);

  return (
    <div className="min-h-screen m3-app-bg font-sans text-brand-text flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="hidden lg:flex bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-[2rem] p-12 shadow-[var(--md-sys-elevation-2)] flex-col justify-between relative overflow-hidden border border-[var(--md-sys-color-outline-variant)]">
          {/* Decorative Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          
          {/* Decorative Blobs */}
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/40 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/40 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10">
            <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95 mb-10">
              <div className="bg-white/55 backdrop-blur-md p-4 rounded-[1.75rem] shadow-[var(--md-sys-elevation-1)] border border-white/60">
                <img
                  src="/logo.png"
                  alt="UniBus Logo"
                  className="h-20 w-auto object-contain drop-shadow-sm"
                />
              </div>
            </Link>
            
            <h1 className="text-4xl font-black mb-6 tracking-tight leading-[1.1] text-brand-text">
              Chào mừng<br/>trở lại!
            </h1>
            <p className="text-lg text-brand-text/70 font-medium leading-relaxed max-w-sm">
              Đăng nhập ngay để quản lý lịch trình, theo dõi chuyến xe theo thời gian thực và mua vé tháng dễ dàng hơn bao giờ hết.
            </p>
          </div>

          <div className="relative z-10 text-sm font-bold text-brand-text/40">
            © 2026 UniBus System
          </div>
        </div>

        <MaterialCard className="rounded-[2rem] p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Đăng Nhập</h2>
            <p className="text-brand-text/60 mt-2 text-sm">Điền thông tin tài khoản của bạn để truy cập</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-sm font-semibold text-brand-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 mb-8">
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
                <input
                  type="email"
                  required
                  tabIndex={1}
                  placeholder="name@example.com"
                className="m3-focus-ring w-full min-h-14 pl-12 pr-4 py-3.5 rounded-[var(--md-sys-shape-corner-large)] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] focus:bg-[var(--md-sys-color-surface-container-lowest)] focus:border-[var(--md-sys-color-primary)] outline-none transition-all font-medium text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold ml-1">Mật khẩu</label>
                <Link
                  href="/forgot-password"
                  tabIndex={4}
                  className="text-sm font-bold text-brand-secondary hover:text-brand-text transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
                <input
                  type="password"
                  required
                  tabIndex={2}
                  className="m3-focus-ring w-full min-h-14 pl-12 pr-4 py-3.5 rounded-[var(--md-sys-shape-corner-large)] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] focus:bg-[var(--md-sys-color-surface-container-lowest)] focus:border-[var(--md-sys-color-primary)] outline-none transition-all font-mono text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              tabIndex={3}
              disabled={isSubmitting || isGoogleSubmitting}
              className="m3-state-layer m3-focus-ring w-full min-h-14 py-4 mt-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-black transition-colors flex justify-center items-center gap-2 shadow-[var(--md-sys-elevation-1)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" /> {isSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-black/5"></div>
            <span className="text-brand-text/40 text-xs font-semibold uppercase tracking-wider">Hoặc đăng nhập qua</span>
            <div className="flex-1 h-px bg-black/5"></div>
          </div>

          <div className="flex justify-center mb-8">
            <GoogleSignInButton
              text="signin_with"
              onCredential={handleGoogleCredential}
              onError={setError}
              disabled={isSubmitting || isGoogleSubmitting}
            />
          </div>

          <p className="text-center text-sm font-medium text-brand-text/60">
            Chưa có tài khoản? <Link href="/register" className="text-brand-secondary hover:text-brand-text font-bold ml-1 transition-colors">Đăng ký ngay</Link>
          </p>
        </MaterialCard>
      </div>
    </div>
  );
}
