"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, Mail } from 'lucide-react';
import { authApi, clearAuthSession, getDefaultRouteForRole, setAuthSession } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    clearAuthSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      const tokenPair = await authApi.login({ email, password, device: 'web' });
      setAuthSession(tokenPair);
      router.push(getDefaultRouteForRole(tokenPair.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setError('');
    setNotice(`${provider} login UI đang được giữ lại, nhưng backend OAuth chưa được triển khai.`);
  };

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
              Đăng nhập để quản lý lịch trình, theo dõi chuyến xe và sử dụng các dịch vụ UniBus.
            </p>
          </div>
          <div className="text-sm font-bold text-brand-text/40">
            © 2026 UniBus System
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-black/5 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Đăng nhập</h2>
            <p className="text-brand-text/60 mt-2 text-sm">Sử dụng tài khoản đã được tạo trong hệ thống backend.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-sm font-semibold text-brand-danger">
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-6 p-4 bg-brand-secondary/10 border border-brand-secondary/20 rounded-xl text-sm font-semibold text-brand-text">
              {notice}
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
              disabled={isSubmitting}
              className="w-full py-4 mt-2 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" /> {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-5">
            <div className="h-px flex-1 bg-black/10"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-text/40">Hoặc tiếp tục với</span>
            <div className="h-px flex-1 bg-black/10"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() => handleSocialLogin('Google')}
              className="py-3 rounded-xl border border-black/10 bg-white text-sm font-bold text-brand-text hover:bg-brand-surface transition-colors flex items-center justify-center gap-2"
            >
              <span className="font-black text-red-500">G</span>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('Facebook')}
              className="py-3 rounded-xl border border-black/10 bg-white text-sm font-bold text-brand-text hover:bg-brand-surface transition-colors flex items-center justify-center gap-2"
            >
              <span className="font-black text-blue-600">f</span>
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
