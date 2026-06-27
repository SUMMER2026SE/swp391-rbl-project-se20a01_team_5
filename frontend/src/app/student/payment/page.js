"use client";

import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, Loader2, Receipt, ShieldCheck } from 'lucide-react';
import { ticketingApi } from '@/services/api';

export default function StudentPaymentPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const startVnpayPayment = async () => {
    setIsCreating(true);
    setError('');
    try {
      const payment = await ticketingApi.createVnpayPaymentUrl();
      window.location.href = payment.paymentUrl;
    } catch (err) {
      setError(err.message);
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Thanh toán VNPay</h1>
        <p className="text-brand-text/60 font-medium">Thanh toán phí dịch vụ xe đưa đón bằng cổng VNPay Sandbox.</p>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center mb-6">
            <CreditCard className="w-7 h-7 text-brand-text" />
          </div>
          <h2 className="text-xl font-black text-brand-text mb-2">Tạo giao dịch thanh toán</h2>
          <p className="text-sm font-medium text-brand-text/60 mb-6">
            Hệ thống sẽ tự động dùng giá vé tháng của tuyến sinh viên đã được duyệt.
          </p>

          <button
            onClick={startVnpayPayment}
            disabled={isCreating}
            className="w-full rounded-2xl bg-brand-text text-white py-4 font-black hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            Thanh toán qua VNPay
          </button>
        </section>

        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
          <h2 className="text-xl font-black text-brand-text mb-4 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-secondary" /> Thông tin test Sandbox
          </h2>
          <div className="space-y-3 text-sm font-bold text-brand-text/70">
            <p>Ngân hàng: NCB</p>
            <p>Số thẻ: 9704198526191432198</p>
            <p>Ngày phát hành: 07/15</p>
            <p>CVV: 123</p>
            <p>OTP: 123456</p>
          </div>
          <Link
            href="/student/wallet"
            className="mt-8 inline-flex rounded-2xl bg-brand-surface px-5 py-3 font-bold text-brand-text hover:bg-brand-text hover:text-white transition-colors"
          >
            Xem hóa đơn
          </Link>
        </section>
      </div>
    </div>
  );
}
