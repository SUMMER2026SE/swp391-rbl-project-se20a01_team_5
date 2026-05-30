import Link from 'next/link';
import { ArrowRight, ShieldCheck, Map } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-fr">
        
        {/* Main Hero Block (Spans 2 columns) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-black/5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div>
            <img 
              src="/logo.png" 
              alt="UniBus Logo" 
              className="h-16 w-auto object-contain mb-6 drop-shadow-md" 
            />
            <p className="text-lg text-brand-text/70 max-w-md">
              Hệ thống kết nối xe đưa đón sinh viên thông minh, an toàn và tiện lợi nhất tại Đà Nẵng.
            </p>
          </div>
        </div>

        {/* Action Block 1: Login */}
        <Link href="/login" className="bg-brand-primary rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <ArrowRight className="w-6 h-6 text-brand-text" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Đăng Nhập</h2>
            <p className="text-brand-text/70 text-sm">Vào hệ thống</p>
          </div>
        </Link>

        {/* Feature Block 1 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-secondary/20 flex items-center justify-center shrink-0">
            <Map className="w-6 h-6 text-brand-secondary" />
          </div>
          <div>
            <h3 className="font-bold">Theo dõi lộ trình</h3>
            <p className="text-xs text-brand-text/60">Cập nhật vị trí xe theo thời gian thực</p>
          </div>
        </div>

        {/* Feature Block 2 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-success/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-brand-success" />
          </div>
          <div>
            <h3 className="font-bold">An toàn tuyệt đối</h3>
            <p className="text-xs text-brand-text/60">Kiểm soát hành khách và tài xế</p>
          </div>
        </div>

        {/* Action Block 2: Register */}
        <Link href="/register" className="bg-brand-text text-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center items-center text-center group">
          <h2 className="text-2xl font-bold mb-2">Tạo tài khoản mới</h2>
          <p className="text-white/60 text-sm mb-6">Dành cho toàn bộ sinh viên Đà Nẵng</p>
          <div className="px-6 py-3 bg-white/10 rounded-full font-medium group-hover:bg-white/20 transition-colors">
            Đăng ký ngay
          </div>
        </Link>

      </div>
    </div>
  );
}
