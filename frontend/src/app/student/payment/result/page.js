"use client";

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function StudentPaymentResultPage() {
  return (
    <Suspense fallback={<PaymentResultShell />}>
      <StudentPaymentResultContent />
    </Suspense>
  );
}

function StudentPaymentResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const txnRef = searchParams.get('txnRef');
  const responseCode = searchParams.get('responseCode');
  const isSuccess = status === 'success' || responseCode === '00';

  return (
    <div className="h-full flex items-center justify-center font-sans p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-black/5 shadow-sm p-8 text-center">
        <div className={`mx-auto mb-6 w-20 h-20 rounded-3xl flex items-center justify-center ${isSuccess ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`}>
          {isSuccess ? <CheckCircle2 className="w-11 h-11" /> : <XCircle className="w-11 h-11" />}
        </div>
        <h1 className="text-3xl font-black text-brand-text mb-3">
          {isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
        </h1>
        <p className="text-brand-text/60 font-medium mb-6">
          {isSuccess
            ? 'Hệ thống đã xác thực chữ ký VNPay, cập nhật hóa đơn và kích hoạt vé tháng.'
            : 'Giao dịch chưa được ghi nhận thành công. Bạn có thể thử thanh toán lại.'}
        </p>

        <div className="rounded-2xl bg-brand-surface p-4 text-left text-sm font-bold text-brand-text/70 mb-6">
          <div className="flex items-center justify-between gap-3">
            <span>Mã giao dịch</span>
            <span className="font-black text-brand-text">{txnRef || 'Không có'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Mã phản hồi</span>
            <span className="font-black text-brand-text">{responseCode || 'Không có'}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <Link
            href="/student/wallet"
            className="flex-1 rounded-2xl bg-brand-text text-white py-3 font-black hover:bg-black transition-colors"
          >
            Xem hóa đơn
          </Link>
          <Link
            href="/student/payment"
            className="flex-1 rounded-2xl bg-brand-surface text-brand-text py-3 font-black hover:bg-brand-text hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> Thanh toán lại
          </Link>
        </div>
      </div>
    </div>
  );
}

function PaymentResultShell() {
  return (
    <div className="h-full flex items-center justify-center font-sans p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-black/5 shadow-sm p-8">
        <div className="flex items-center justify-center gap-3 text-brand-text font-black">
          <Loader2 className="w-5 h-5 animate-spin" />
          Đang tải kết quả thanh toán
        </div>
      </div>
    </div>
  );
}
