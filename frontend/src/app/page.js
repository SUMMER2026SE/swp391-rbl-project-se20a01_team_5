"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Map, Smartphone, Wallet, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { getAuthSession, getDefaultRouteForRole } from '@/services/api';

export default function Home() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      router.replace(getDefaultRouteForRole(session.role, session.studentVerificationStatus));
      return;
    }

    const handle = window.setTimeout(() => setIsCheckingSession(false), 0);
    return () => window.clearTimeout(handle);
  }, [router]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-brand-surface"></div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface font-sans text-brand-text overflow-x-hidden selection:bg-brand-secondary selection:text-white">

      {/* 1. Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-brand-surface/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-28 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
              <img
                src="/logo.png"
                alt="UniBus Logo"
                className="h-32 w-auto object-contain rounded-xl scale-110 origin-left"
              />
            </Link>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/login" className="px-5 py-2.5 rounded-full font-semibold text-brand-text hover:bg-black/5 transition-colors text-sm">
              Đăng nhập
            </Link>
            <Link href="/register" className="px-5 py-2.5 rounded-full font-bold bg-brand-text text-white hover:bg-black transition-colors shadow-sm text-sm flex items-center gap-2">
              Đăng ký <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-28">

        {/* 2. Hero Section */}
        <section className="relative max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-32 flex flex-col items-center text-center">
          {/* Decorative Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-brand-primary/30 rounded-full blur-[100px] -z-10"></div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-[1.1]">
            Xe buýt thông minh, <br className="hidden md:block" /> dành riêng cho sinh viên.
          </h1>

          <p className="text-lg md:text-xl text-brand-text/60 max-w-2xl mb-10 font-medium">
            Hệ thống xe buýt thông minh dành cho sinh viên Đà Nẵng. Theo dõi lộ trình trực tiếp, thanh toán tiện lợi.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/register" className="px-8 py-4 rounded-full font-bold bg-brand-primary text-brand-text hover:brightness-95 transition-all shadow-sm text-lg flex items-center gap-2 w-full sm:w-auto justify-center hover:scale-105 active:scale-95">
              Bắt đầu ngay <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="px-8 py-4 rounded-full font-bold bg-white text-brand-text hover:bg-black/5 transition-all shadow-sm border border-black/5 text-lg flex items-center gap-2 w-full sm:w-auto justify-center hover:scale-105 active:scale-95">
              <Play className="w-5 h-5 fill-current" /> Xem tính năng
            </Link>
          </div>
        </section>

        {/* 3. Core Features (Bento Grid) */}
        <section id="features" className="max-w-7xl mx-auto px-4 md:px-8 pb-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Mọi tiện ích trong một chạm</h2>
            <p className="text-brand-text/60 font-medium max-w-2xl mx-auto">Thiết kế tối giản, chức năng, mang lại trải nghiệm đi lại tuyệt vời nhất cho sinh viên.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">

            {/* Feature 1: QR & Mobile Ticket (Large Box) */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-black/5 hover:shadow-md transition-shadow flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-secondary/10 rounded-full blur-3xl group-hover:bg-brand-secondary/20 transition-colors duration-500"></div>
              <div className="w-14 h-14 rounded-2xl bg-brand-secondary/20 flex items-center justify-center mb-8">
                <Smartphone className="w-7 h-7 text-brand-secondary" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3">Vé điện tử & Mã QR</h3>
                <p className="text-brand-text/70 leading-relaxed max-w-md">
                 Lên xe chỉ với 1 lần chạm màn hình điện thoại. Mã QR động thay đổi liên tục đảm bảo tính bảo mật và check-in siêu nhanh.
                </p>
              </div>
            </div>

            {/* Feature 2: E-Wallet */}
            <div className="bg-brand-primary rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="w-14 h-14 rounded-2xl bg-white/40 flex items-center justify-center mb-8 shadow-sm">
                <Wallet className="w-7 h-7 text-brand-text" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Ví điện tử</h3>
                <p className="text-brand-text/80 leading-relaxed">
                  Nạp tiền, mua vé tháng dễ dàng. Quản lý số dư và lịch sử giao dịch rõ ràng ngay trên ứng dụng.
                </p>
              </div>
            </div>

            {/* Feature 3: Live Tracking */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-black/5 hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div className="w-14 h-14 rounded-2xl bg-brand-text text-white flex items-center justify-center mb-8">
                <Map className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Theo dõi trực tiếp</h3>
                <p className="text-brand-text/70 leading-relaxed">
                  Biết chính xác xe buýt đang ở đâu trên bản đồ (Live Tracking), dự kiến thời gian đến trạm. Không bao giờ sợ trễ chuyến học.
                </p>
              </div>
            </div>

            {/* Feature 4: Safety (Wide Box) */}
            <div className="lg:col-span-2 bg-brand-text rounded-[2rem] p-8 md:p-12 shadow-sm hover:shadow-lg transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group">
              <div className="flex-1">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-8">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Bảo vệ toàn diện</h3>
                <p className="text-white/60 leading-relaxed max-w-md">
                  Kiểm soát thông tin tài xế, phụ xe và hành khách minh bạch. Lịch sử di chuyển lưu trữ đầy đủ, mang lại sự an tâm tuyệt đối cho bạn và gia đình.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2 bg-brand-success/20 text-brand-success px-5 py-3 rounded-2xl font-bold text-sm border border-brand-success/20">
                <CheckCircle2 className="w-5 h-5" /> 100% An Toàn
              </div>
            </div>

          </div>
        </section>

        {/* 4. Benefits Section */}
        <section className="bg-white border-y border-black/5 py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div>
                <div className="text-4xl font-extrabold text-brand-text mb-4 tracking-tight">Rẻ hơn.</div>
                <h4 className="text-xl font-bold mb-2">Chi phí hợp lý cho sinh viên</h4>
                <p className="text-brand-text/60">Các gói vé tháng trợ giá giúp bạn tiết kiệm tối đa chi phí đi lại hàng tháng.</p>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-brand-text mb-4 tracking-tight">Rộng hơn.</div>
                <h4 className="text-xl font-bold mb-2">Mạng lưới bao phủ</h4>
                <p className="text-brand-text/60">Tuyến đường chạy qua hầu hết các điểm nóng khu trọ và khuôn viên trường.</p>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-brand-text mb-4 tracking-tight">Nhanh hơn.</div>
                <h4 className="text-xl font-bold mb-2">Lên xe 1 chạm</h4>
                <p className="text-brand-text/60">Công nghệ quét mã vạch tốc độ cao giảm thiểu thời gian chờ đợi ở cửa xe.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Call to Action */}
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-32 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Sẵn sàng trải nghiệm chuyến xe thông minh? <br />Bắt đầu cùng UniBus.</h2>
          <p className="text-lg text-brand-text/60 mb-10 font-medium">Tham gia trải nghiệm ngay hôm nay để khám phá các tiện ích di chuyển dành riêng cho sinh viên.</p>
          <Link href="/register" className="inline-flex px-10 py-5 rounded-full font-bold bg-brand-text text-white hover:bg-black transition-transform shadow-xl text-lg items-center gap-3 hover:scale-105 active:scale-95">
            Trải nghiệm hệ thống ngay <ArrowRight className="w-6 h-6" />
          </Link>
        </section>

      </main>

      {/* 6. Footer */}
      <footer className="bg-white border-t border-black/5 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="UniBus Logo" className="h-14 w-auto object-contain grayscale opacity-50" />
            <span className="font-bold text-brand-text/50">© 2026 UniBus System</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold text-brand-text/50">
            <Link href="#" className="hover:text-brand-text transition-colors">Về chúng tôi</Link>
            <Link href="#" className="hover:text-brand-text transition-colors">Điều khoản</Link>
            <Link href="#" className="hover:text-brand-text transition-colors">Bảo mật</Link>
            <Link href="#" className="hover:text-brand-text transition-colors">Hỗ trợ</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
