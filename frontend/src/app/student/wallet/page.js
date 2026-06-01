"use client";

import Link from 'next/link';
import { Wallet, CreditCard, History, AlertCircle } from 'lucide-react';

export default function StudentWalletPage() {
  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Ví cá nhân</h1>
        <p className="text-brand-text/60 font-medium">Màn này đã bỏ dữ liệu mẫu và chờ backend ví/thanh toán.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 text-brand-text">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-sm font-bold uppercase tracking-wider mb-1 text-brand-text/50">Số dư khả dụng</div>
                <div className="text-4xl font-black">Chưa có dữ liệu</div>
              </div>
              <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center border border-brand-primary/20">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-brand-warning/10 border border-brand-warning/20 text-brand-warning text-sm font-bold flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              Backend hiện chưa cung cấp endpoint ví, nạp tiền hoặc rút tiền.
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex-1">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-text/60" /> Nguồn tiền liên kết
            </h3>
            <EmptyText text="Chưa có API phương thức thanh toán." />
          </div>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1 flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <History className="w-6 h-6 text-brand-text/60" /> Lịch sử giao dịch
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center text-brand-text/50">
              <Wallet className="w-16 h-16 mb-4 opacity-40" />
              <p className="font-bold">Không hiển thị giao dịch mẫu.</p>
              <p className="text-sm mt-1">Khi backend có API ví, màn này sẽ nối trực tiếp.</p>
              <Link href="/student/passes" className="mt-6 px-5 py-3 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors">
                Xem đăng ký tuyến
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <div className="py-12 flex items-center justify-center text-center text-brand-text/50 font-bold">
      {text}
    </div>
  );
}
