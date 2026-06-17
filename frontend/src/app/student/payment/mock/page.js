"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { ticketingApi } from '@/services/api';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function MockVnpayPaymentPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const txnRef = searchParams.get('txnRef');
  const amount = searchParams.get('amount');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const formattedAmount = useMemo(() => {
    const value = Number(amount || 0);
    return value > 0 ? money.format(value) : 'Chưa có';
  }, [amount]);

  const finishPayment = async (status) => {
    if (!paymentId) {
      setError('Không tìm thấy mã thanh toán demo.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (status === 'success') {
        await ticketingApi.completeMockVnpayPayment(paymentId);
      } else {
        await ticketingApi.failMockVnpayPayment(paymentId);
      }
      const responseCode = status === 'success' ? '00' : '99';
      window.location.href = `/student/payment/result?status=${status}&paymentId=${paymentId}&txnRef=${txnRef || ''}&responseCode=${responseCode}`;
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center font-sans p-6">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-black/5 shadow-sm p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-brand-primary/20 px-4 py-2 text-sm font-black text-brand-text mb-4">
              <ShieldCheck className="w-4 h-4" /> VNPay Demo Mode
            </div>
            <h1 className="text-3xl font-black text-brand-text mb-2">Giả lập thanh toán VNPay</h1>
            <p className="text-brand-text/60 font-medium max-w-xl">
              Dùng màn hình này để demo luồng callback VNPay khi chưa có merchant sandbox credentials.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-brand-surface flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-brand-text" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Info label="Mã thanh toán" value={paymentId || 'Chưa có'} />
          <Info label="Mã giao dịch" value={txnRef || 'Chưa có'} />
          <Info label="Số tiền" value={formattedAmount} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => finishPayment('success')}
            disabled={isSubmitting}
            className="rounded-2xl bg-brand-success text-white py-4 font-black hover:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Thanh toán thành công
          </button>
          <button
            onClick={() => finishPayment('failed')}
            disabled={isSubmitting}
            className="rounded-2xl bg-brand-danger text-white py-4 font-black hover:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
            Thanh toán thất bại
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <Link href="/student/payment" className="rounded-2xl bg-brand-surface px-5 py-3 font-bold text-brand-text hover:bg-brand-text hover:text-white transition-colors">
            Quay lại thanh toán
          </Link>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-brand-surface p-4">
      <div className="text-xs font-black uppercase text-brand-text/40 mb-1">{label}</div>
      <div className="font-black text-brand-text break-words">{value}</div>
    </div>
  );
}
