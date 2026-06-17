"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CreditCard, History, Loader2, Receipt, RefreshCw, Wallet } from 'lucide-react';
import { ticketingApi } from '@/services/api';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const paymentMethodLabels = {
  E_WALLET: 'Ví điện tử',
  BANK_TRANSFER: 'Chuyển khoản',
  CARD: 'Thẻ',
  CASH: 'Tiền mặt',
};

const paymentStatusLabels = {
  PAID: 'Đã thanh toán',
  PENDING: 'Chưa thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

export default function StudentWalletPage() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const paidTotal = useMemo(() => payments
    .filter((payment) => payment.status === 'PAID')
    .reduce((total, payment) => total + Number(payment.amount || 0), 0), [payments]);

  const pendingTotal = useMemo(() => payments
    .filter((payment) => payment.status === 'PENDING')
    .reduce((total, payment) => total + Number(payment.amount || 0), 0), [payments]);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ticketingApi.payments();
      setPayments(data || []);
    } catch (err) {
      setError(err.message);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(loadPayments, 0);
    return () => window.clearTimeout(handle);
  }, [loadPayments]);

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Ví cá nhân</h1>
          <p className="text-brand-text/60 font-medium">Theo dõi thanh toán phí dịch vụ, hóa đơn và trạng thái giao dịch.</p>
        </div>
        <button
          onClick={loadPayments}
          className="px-4 py-3 bg-white border border-black/5 rounded-2xl text-brand-text hover:bg-brand-surface transition-colors shadow-sm flex justify-center"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 text-brand-text">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-sm font-bold uppercase tracking-wider mb-1 text-brand-text/50">Đã thanh toán</div>
                <div className="text-4xl font-black">{money.format(paidTotal)}</div>
              </div>
              <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center border border-brand-primary/20">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-brand-warning/10 border border-brand-warning/20 text-brand-warning text-sm font-bold flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              Ví đang dùng để ghi nhận thanh toán vé tháng. Chuyển khoản không có mã giao dịch sẽ nằm ở trạng thái chưa thanh toán.
            </div>
          </section>

          <section className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-text/60" /> Tổng quan hóa đơn
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <SummaryRow label="Đã thanh toán" value={money.format(paidTotal)} />
              <SummaryRow label="Chưa thanh toán" value={money.format(pendingTotal)} />
              <SummaryRow label="Số hóa đơn" value={`${payments.length}`} />
            </div>
          </section>
        </div>

        <section className="xl:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <History className="w-6 h-6 text-brand-text/60" /> Lịch sử hóa đơn
          </h3>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-brand-text/50 font-bold">
              <Loader2 className="w-5 h-5 animate-spin" /> Đang tải thanh toán...
            </div>
          ) : payments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-brand-text/50">
              <Wallet className="w-16 h-16 mb-4 opacity-40" />
              <p className="font-bold">Chưa có giao dịch vé.</p>
              <Link href="/student/passes" className="mt-6 px-5 py-3 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors">
                Mua vé tháng
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {payments.map((payment) => (
                <PaymentItem key={payment.paymentId} payment={payment} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PaymentItem({ payment }) {
  const status = paymentStatusLabels[payment.status] || payment.status;
  const method = paymentMethodLabels[payment.method] || payment.method;
  const isPaid = payment.status === 'PAID';

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface/40 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-text flex items-center justify-center">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <div className="font-black">{payment.invoiceNumber || `PAY-${payment.paymentId}`}</div>
          <div className="text-xs font-bold text-brand-text/50 mt-1">
            {method} • {payment.transactionCode || 'Chưa có mã giao dịch'}
          </div>
        </div>
      </div>
      <div className="flex flex-col md:items-end gap-1">
        <div className="font-black text-brand-text">{money.format(Number(payment.amount || 0))}</div>
        <span className={`rounded-lg px-2 py-1 text-xs font-black ${isPaid ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-warning/10 text-brand-warning'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-brand-surface p-4">
      <span className="text-sm font-bold text-brand-text/60">{label}</span>
      <span className="font-black text-brand-text">{value}</span>
    </div>
  );
}
