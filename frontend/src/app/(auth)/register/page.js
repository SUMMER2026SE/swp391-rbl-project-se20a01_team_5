"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, UserPlus, User, Mail, CreditCard } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    // Giả lập backend đăng ký thành công
    alert('Đăng ký tài khoản sinh viên thành công!');
    
    // Đăng nhập tự động sau khi đăng ký
    localStorage.setItem('access_token', 'mock_student_token');
    localStorage.setItem('user_role', 'STUDENT');
    router.push('/student');
  };

  const handleSocialRegister = () => {
    // Mặc định giả lập đăng nhập/đăng ký Google thành công cho Sinh viên
    localStorage.setItem('access_token', 'mock_social_token');
    localStorage.setItem('user_role', 'STUDENT'); 
    router.push('/student');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Branding Bento Block */}
        <div className="hidden lg:flex bg-brand-text rounded-3xl p-12 shadow-sm flex-col justify-between relative overflow-hidden border border-black/5 text-white">
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/10">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Mở khóa đặc quyền!</h1>
            <p className="text-lg text-white/70 font-medium leading-relaxed">
              Tạo tài khoản UniBus miễn phí để mua vé tháng, nhận thông báo trễ chuyến và theo dõi xe bus theo thời gian thực.
            </p>
          </div>
          <div className="text-sm font-bold text-white/30 relative z-10">
            Dành cho toàn bộ sinh viên tại Đà Nẵng
          </div>
        </div>

        {/* Register Form Bento Block */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-black/5 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Tạo tài khoản mới</h2>
            <p className="text-brand-text/60 mt-2 text-sm">Điền thông tin sinh viên của bạn để đăng ký</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-sm font-semibold text-brand-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text/60 mb-2 ml-1 uppercase">Họ và Tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                  <input 
                    type="text" 
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-surface border border-black/5 focus:bg-white focus:border-brand-text focus:ring-2 focus:ring-brand-text/20 outline-none transition-all font-medium text-sm"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-brand-text/60 mb-2 ml-1 uppercase">Mã Sinh Viên</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                  <input 
                    type="text" 
                    required
                    placeholder="1022..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-surface border border-black/5 focus:bg-white focus:border-brand-text focus:ring-2 focus:ring-brand-text/20 outline-none transition-all font-mono text-sm"
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text/60 mb-2 ml-1 uppercase">Email (Cá nhân hoặc trường)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                <input 
                  type="email" 
                  required
                  placeholder="nguyenvana@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-surface border border-black/5 focus:bg-white focus:border-brand-text focus:ring-2 focus:ring-brand-text/20 outline-none transition-all font-mono text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text/60 mb-2 ml-1 uppercase">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-surface border border-black/5 focus:bg-white focus:border-brand-text focus:ring-2 focus:ring-brand-text/20 outline-none transition-all font-mono text-sm"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text/60 mb-2 ml-1 uppercase">Xác nhận MK</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-surface border border-black/5 focus:bg-white focus:border-brand-text focus:ring-2 focus:ring-brand-text/20 outline-none transition-all font-mono text-sm"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 mt-4 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm"
            >
              <UserPlus className="w-5 h-5" /> Hoàn tất Đăng ký
            </button>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-black/5"></div>
            <span className="text-brand-text/40 text-xs font-bold uppercase tracking-wider">Hoặc đăng ký siêu tốc</span>
            <div className="flex-1 h-px bg-black/5"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={handleSocialRegister} className="py-3 rounded-xl bg-brand-surface border border-black/5 font-bold text-sm hover:bg-black/5 transition-colors">
              Google
            </button>
            <button onClick={handleSocialRegister} className="py-3 rounded-xl bg-brand-surface border border-black/5 font-bold text-sm hover:bg-black/5 transition-colors">
              Facebook
            </button>
          </div>
          
          <p className="text-center text-sm font-medium text-brand-text/60">
            Đã có tài khoản? <Link href="/login" className="text-brand-secondary hover:text-brand-text font-bold ml-1 transition-colors">Đăng nhập ngay</Link>
          </p>

        </div>

      </div>
    </div>
  );
}
