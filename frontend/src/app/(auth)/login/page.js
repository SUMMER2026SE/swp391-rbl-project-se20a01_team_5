"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, User, Bus, Loader2 } from 'lucide-react';
import GoogleLoginModal from '@/components/modals/GoogleLoginModal';
import { authService } from '@/services/auth.service';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleSelectAccount = async (account) => {
    setShowGoogleModal(false);
    await performLogin(() => authService.googleLogin(account.email)); // In mock mode, we pass email as fake token
  };

  const performLogin = async (loginPromise) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await loginPromise();
      const { access_token, user } = response;
      const role = user.role;

      sessionStorage.setItem('access_token', access_token);
      sessionStorage.setItem('user_role', role);
      
      if (localStorage.getItem('remember_device') === 'true') {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user_role', role);
      }
      
      if (role === 'STUDENT') {
        window.location.href = '/student';
      } else {
        window.location.href = `/${role.toLowerCase()}`;
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear session if user navigates back to login page
  useEffect(() => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user_role');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    await performLogin(() => authService.login(username, password));
  };

  const handleSocialLogin = async () => {
    // Fake Facebook login using Google login mock under the hood for now
    await performLogin(() => authService.googleLogin('facebook_fake_token'));
  };

  return (
    <div className="min-h-screen bg-brand-surface font-sans text-brand-text flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Branding Bento Block */}
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

        {/* Login Form Bento Block */}
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
              <label className="block text-sm font-semibold mb-2 ml-1">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
                <input 
                  type="text" 
                  required
                  placeholder="Nhập tên đăng nhập"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-brand-surface/50 border border-black/5 focus:bg-white focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/20 outline-none transition-all font-mono text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
              disabled={isLoading}
              className="w-full py-4 mt-2 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-black/5"></div>
            <span className="text-brand-text/40 text-xs font-semibold uppercase tracking-wider">Hoặc đăng nhập qua</span>
            <div className="flex-1 h-px bg-black/5"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button disabled={isLoading} onClick={(e) => { e.preventDefault(); setShowGoogleModal(true); }} className="py-3 rounded-xl bg-brand-surface/50 border border-black/5 font-semibold text-sm hover:bg-black/5 transition-colors disabled:opacity-50">
              Google
            </button>
            <button disabled={isLoading} onClick={handleSocialLogin} className="py-3 rounded-xl bg-brand-surface/50 border border-black/5 font-semibold text-sm hover:bg-black/5 transition-colors disabled:opacity-50">
              Facebook
            </button>
          </div>
          
          <p className="text-center text-sm font-medium text-brand-text/60">
            Chưa có tài khoản? <Link href="/register" className="text-brand-secondary hover:text-brand-text font-bold ml-1 transition-colors">Đăng ký ngay</Link>
          </p>

        </div>

      </div>
      
      <GoogleLoginModal 
        isOpen={showGoogleModal} 
        onClose={() => setShowGoogleModal(false)}
        onSelectAccount={handleSelectAccount}
      />
    </div>
  );
}