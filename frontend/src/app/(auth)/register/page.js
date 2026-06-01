"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, UserPlus, User, Mail, ArrowRight } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { authApi, getAuthSession, getDefaultRouteForRole, setAuthSession } from '@/services/api';
import OtpInput from '@/components/auth/OtpInput';

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  otp: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      router.replace(getDefaultRouteForRole(session.role, session.studentVerificationStatus));
    }
  }, [router]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const redirectAfterLogin = useCallback((tokenPair) => {
    setAuthSession(tokenPair);
    router.push(getDefaultRouteForRole(tokenPair.role, tokenPair.studentVerificationStatus));
  }, [router]);

  const validatePassword = () => {
    if (formData.password.length < 8) {
      setError('Mật khẩu cần ít nhất 8 ký tự.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return false;
    }
    return true;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validatePassword()) return;

    setIsRequestingOtp(true);
    try {
      await authApi.requestRegistrationOtp(formData.email.trim());
      setStep(2);
      setMessage('Mã OTP đã được gửi tới email.');
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

    if (!validatePassword()) return;
    if (!formData.otp.trim()) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
      });

      const tokenPair = await authApi.login({
        email: formData.email.trim(),
        password: formData.password,
        device: 'web',
      });
      redirectAfterLogin(tokenPair);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = useCallback(async (googleCredential) => {
    setError('');
    setMessage('');
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
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="hidden lg:flex bg-brand-text rounded-3xl p-12 shadow-sm flex-col justify-between relative overflow-hidden border border-black/5 text-white">
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/10">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Mở khóa đặc quyền!</h1>
            <p className="text-lg text-white/70 font-medium leading-relaxed">
              Tạo tài khoản UniBus miễn phí, xác thực email bằng OTP rồi gửi hồ sơ sinh viên để dùng đầy đủ tính năng.
            </p>
          </div>
          <div className="text-sm font-bold text-white/30 relative z-10">
            © 2026 UniBus System
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-black/5 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Tạo tài khoản mới</h2>
            <p className="text-brand-text/60 mt-2 text-sm">Tài khoản được tạo sau khi xác thực OTP email</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-sm font-semibold text-brand-danger">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-brand-success/10 border border-brand-success/20 rounded-xl text-sm font-semibold text-brand-success">
              {message}
            </div>
          )}

          <div className="overflow-hidden w-full px-1 -mx-1">
            <div 
              className="flex items-start transition-transform duration-300 ease-in-out"
              style={{ width: '200%', transform: `translateX(${step === 1 ? '0%' : '-50%'})` }}
            >
              {/* --- BƯỚC 1 --- */}
              <div className="w-1/2 flex-shrink-0 px-1">
                <form onSubmit={handleRequestOtp} className="space-y-4 mb-8">
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
                        onChange={(e) => updateField('fullName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-text/60 mb-2 ml-1 uppercase">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-surface border border-black/5 focus:bg-white focus:border-brand-text focus:ring-2 focus:ring-brand-text/20 outline-none transition-all font-medium text-sm"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PasswordField
                      label="Mật khẩu"
                      value={formData.password}
                      onChange={(value) => updateField('password', value)}
                    />
                    <PasswordField
                      label="Xác nhận mật khẩu"
                      value={formData.confirmPassword}
                      onChange={(value) => updateField('confirmPassword', value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRequestingOtp || isGoogleSubmitting}
                    className="w-full py-4 mt-4 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-5 h-5" />
                    {isRequestingOtp ? 'Đang xử lý...' : 'Tiếp tục'}
                  </button>
                </form>
              </div>

              {/* --- BƯỚC 2 --- */}
              <div className="w-1/2 flex-shrink-0 px-1">
                <form onSubmit={handleRegister} className="space-y-4 mb-8">
                  <div className="p-4 bg-brand-surface/50 rounded-xl mb-2 border border-black/5 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-brand-text/50 uppercase block mb-0.5">Email nhận mã</span>
                      <span className="text-sm font-medium">{formData.email}</span>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-brand-secondary hover:text-brand-text transition-colors">
                      Thay đổi
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-text/60 mb-3 ml-1 uppercase text-center">Nhập mã gồm 6 chữ số</label>
                    <OtpInput value={formData.otp} onChange={(val) => { updateField('otp', val); if(val.length === 6) { document.getElementById('btn-register-submit')?.click(); } }} />
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={isRequestingOtp}
                        className="text-xs font-bold text-brand-secondary hover:text-brand-text transition-colors"
                      >
                        {isRequestingOtp ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-register-submit"
                    type="submit"
                    disabled={isSubmitting || isGoogleSubmitting}
                    className="w-full py-4 mt-4 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-5 h-5" />
                    {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-black/5"></div>
            <span className="text-brand-text/40 text-xs font-bold uppercase tracking-wider">Hoặc đăng ký nhanh qua</span>
            <div className="flex-1 h-px bg-black/5"></div>
          </div>

          <div className="flex justify-center mb-8">
            <GoogleSignInButton
              text="signup_with"
              onCredential={handleGoogleCredential}
              onError={setError}
              disabled={isSubmitting || isRequestingOtp || isGoogleSubmitting}
            />
          </div>

          <p className="text-center text-sm font-medium text-brand-text/60">
            Đã có tài khoản? <Link href="/login" className="text-brand-secondary hover:text-brand-text font-bold ml-1 transition-colors">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-xs font-bold text-brand-text/60 mb-2 ml-1 uppercase">{label}</label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
        <input
          type="password"
          required
          minLength={8}
          placeholder="••••••••"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-surface border border-black/5 focus:bg-white focus:border-brand-text focus:ring-2 focus:ring-brand-text/20 outline-none transition-all font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
