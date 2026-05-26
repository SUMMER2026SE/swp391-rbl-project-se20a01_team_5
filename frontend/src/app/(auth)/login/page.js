"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, User, Bus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Clear session if user navigates back to login page
  useEffect(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    // Giả lập backend kiểm tra Role dựa trên tên đăng nhập
    let computedRole = 'STUDENT'; // Mặc định là sinh viên
    const lowerUser = username.toLowerCase();
    
    if (lowerUser.includes('admin')) {
      computedRole = 'ADMIN';
    } else if (lowerUser.includes('phuxe')) {
      computedRole = 'ASSISTANT';
    } else if (lowerUser.includes('taixe')) {
      computedRole = 'DRIVER';
    } else if (lowerUser.includes('dieuphoi')) {
      computedRole = 'COORDINATOR';
    }

    localStorage.setItem('access_token', `mock_${computedRole.toLowerCase()}_token`);
    localStorage.setItem('user_role', computedRole);
    router.push(`/${computedRole.toLowerCase()}`);
  };

  const handleSocialLogin = () => {
    // Giả lập backend chặn Admin/Điều phối dùng Google
    const lowerUser = username.toLowerCase();
    if (lowerUser.includes('admin') || lowerUser.includes('dieuphoi')) {
      setError('Lỗi bảo mật: Tài khoản cấp Quản lý không được phép đăng nhập qua mạng xã hội. Vui lòng đăng nhập bằng mật khẩu nội bộ!');
      return;
    }

    setError('');
    // Mặc định giả lập đăng nhập Google thành công cho Sinh viên
    localStorage.setItem('access_token', 'mock_social_token');
    localStorage.setItem('user_role', 'STUDENT'); 
    router.push('/student');
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
          />  <p className="text-lg text-brand-text/80 font-medium">
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
              <label className="block text-sm font-semibold mb-2 ml-1">Mật khẩu</label>
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
              className="w-full py-4 mt-2 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm"
            >
              <LogIn className="w-5 h-5" /> Đăng Nhập
            </button>
          </form>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-black/5"></div>
            <span className="text-brand-text/40 text-xs font-semibold uppercase tracking-wider">Hoặc đăng nhập qua</span>
            <div className="flex-1 h-px bg-black/5"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={handleSocialLogin} className="py-3 rounded-xl bg-brand-surface/50 border border-black/5 font-semibold text-sm hover:bg-black/5 transition-colors">
              Google
            </button>
            <button onClick={handleSocialLogin} className="py-3 rounded-xl bg-brand-surface/50 border border-black/5 font-semibold text-sm hover:bg-black/5 transition-colors">
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
