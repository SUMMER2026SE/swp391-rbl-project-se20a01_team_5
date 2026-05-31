"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, Mail } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { authApi, clearAuthSession, getDefaultRouteForRole, setAuthSession } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    clearAuthSession();
  }, []);

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

  const handleGoogleCredential = useCallback(async (idToken) => {
    setError('');
    setIsGoogleSubmitting(true);
    try {
      const tokenPair = await authApi.googleLogin({ idToken, device: 'web' });
      redirectAfterLogin(tokenPair);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGoogleSubmitting(false);
    }
  }, [redirectAfterLogin]);

  return (
    <div className="min-h-screen bg-brand-surface font-sans text-brand-text flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="hidden lg:flex bg-brand-primary rounded-3xl p-12 shadow-sm flex-col justify-between relative overflow-hidden border border-black/5">
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/30 rounded-full blur-3xl"></div>
          <div>
            <img
              src="/logo.png"
              alt="UniBus Logo"
              className="h-16 w-auto object-contain mb-6 drop-shadow-sm rounded-3xl"
            />
            <p className="text-lg text-brand-text/80 font-medium">
              Đăng nhập để quản lý lịch trình, theo dõi chuyến xe và mua vé tháng dễ dàng hơn.
            </p>
          </div>
          <div className="text-sm font-bold text-brand-text/40">
            © 2026 UniBus System
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-black/5 flex flex-col justify-center">
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
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-brand-surface/50 border border-black/5 focus:bg-white focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20 outline-none transition-all font-mono text-sm"
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
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-brand-surface/50 border border-black/5 focus:bg-white focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20 outline-none transition-all font-mono text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full py-4 mt-2 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" /> {isSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-black/5"></div>
            <span className="text-brand-text/40 text-xs font-semibold uppercase tracking-wider">Hoặc đăng nhập qua</span>
            <div className="flex-1 h-px bg-black/5"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <GoogleSignInButton
              text="signin_with"
              onCredential={handleGoogleCredential}
              onError={setError}
            />
            <button
              type="button"
              onClick={() => setError('Facebook login chưa được triển khai trong backend.')}
              className="py-3 rounded-xl bg-brand-surface/50 border border-black/5 font-semibold text-sm hover:bg-black/5 transition-colors"
            >
              Facebook
            </button>
          </div>

          <p className="text-center text-sm font-medium text-brand-text/60">
            Chưa có tài khoản? <Link href="/register" className="text-brand-secondary hover:text-brand-text font-bold ml-1 transition-colors">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
