"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Navigation,
  Receipt,
  RefreshCw,
  Route,
  ShieldCheck,
  Ticket,
  Wallet,
  XCircle,
} from 'lucide-react';
import TicketQrCode from '@/components/tickets/TicketQrCode';
import { getStoredStudentVerificationStatus, registrationApi, ticketingApi } from '@/services/api';

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

export default function PassesPage() {
  const [registration, setRegistration] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('E_WALLET');
  const [transactionCode, setTransactionCode] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const activeMonthlyTicket = useMemo(() => (
    tickets.find((ticket) => ticket.ticketType === 'MONTHLY' && ticket.status === 'ACTIVE')
  ), [tickets]);

  const activeTicketPayment = useMemo(() => {
    if (!activeMonthlyTicket) return null;
    return payments.find((payment) => payment.ticketId === activeMonthlyTicket.ticketId) || null;
  }, [activeMonthlyTicket, payments]);

  const pendingPayments = useMemo(() => (
    payments.filter((payment) => payment.status === 'PENDING')
  ), [payments]);

  const isVerified = verificationStatus === 'VERIFIED' || registration?.status === 'APPROVED';
  const hasApprovedRegistration = registration?.status === 'APPROVED';
  const hasActivePass = Boolean(activeMonthlyTicket);
  const canPurchase = isVerified && hasApprovedRegistration && !hasActivePass && !isPurchasing;
  const monthlyAmount = Number(activeMonthlyTicket?.fareAmount || payments.find((item) => item.status === 'PENDING')?.amount || 0);

  const steps = [
    { label: 'Xác minh', done: isVerified, icon: ShieldCheck },
    { label: 'Chọn tuyến', done: hasApprovedRegistration, icon: Route },
    { label: 'Thanh toán', done: Boolean(activeTicketPayment?.status === 'PAID' || payments.some((item) => item.status === 'PAID')), icon: Wallet },
    { label: 'QR lên xe', done: hasActivePass, icon: Ticket },
  ];

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      setVerificationStatus(getStoredStudentVerificationStatus() || '');
      const [currentRegistration, ticketDashboard] = await Promise.all([
        registrationApi.getCurrent().catch(() => null),
        ticketingApi.dashboard(),
      ]);
      setRegistration(currentRegistration);
      setTickets(ticketDashboard?.tickets || []);
      setPayments(ticketDashboard?.payments || []);
    } catch (err) {
      setError(err.message);
      setTickets([]);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(loadDashboard, 0);
    return () => window.clearTimeout(handle);
  }, [loadDashboard]);

  const purchaseMonthlyPass = async () => {
    setIsPurchasing(true);
    setError('');
    setMessage('');
    try {
      if (paymentMethod === 'E_WALLET') {
        const payment = await ticketingApi.createVnpayPaymentUrl();
        window.location.href = payment.paymentUrl;
        return;
      }

      const ticket = await ticketingApi.purchaseMonthlyPass({
        method: paymentMethod,
        transactionCode: transactionCode.trim() || null,
        notes: paymentNotes.trim() || null,
      });
      setMessage(paymentMethod === 'BANK_TRANSFER' && !transactionCode.trim()
        ? 'Đã tạo hóa đơn chuyển khoản. Hóa đơn đang ở trạng thái chưa thanh toán.'
        : 'Đã ghi nhận thanh toán và kích hoạt vé tháng.');
      setTransactionCode('');
      setPaymentNotes('');
      setTickets((current) => [ticket, ...current.filter((item) => item.ticketId !== ticket.ticketId)]);
      const refreshed = await ticketingApi.dashboard();
      setTickets(refreshed?.tickets || []);
      setPayments(refreshed?.payments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const cancelRegistration = async () => {
    if (!registration?.registrationId || hasActivePass) return;
    setIsCancelling(true);
    setError('');
    setMessage('');
    try {
      await registrationApi.cancel(registration.registrationId, 'Student cancelled from frontend');
      setRegistration(null);
      setMessage('Đã hủy đăng ký tuyến hiện tại.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Vé & Tuyến</h1>
          <p className="text-brand-text/60 font-medium">Xác minh, chọn tuyến, thanh toán vé tháng và nhận QR lên xe.</p>
        </div>
        <button
          onClick={loadDashboard}
          className="self-start lg:self-auto rounded-2xl bg-white border border-black/5 px-5 py-3 font-bold text-sm hover:bg-brand-surface transition-colors flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      <FlowSteps steps={steps} />

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}
      {message && (
        <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-2xl text-sm font-bold text-brand-success">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center gap-3 text-brand-text/50 font-bold">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tải vé, tuyến và hóa đơn...
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
          <div className="flex flex-col gap-6 min-w-0">
            <TicketPanel activeMonthlyTicket={activeMonthlyTicket} activeTicketPayment={activeTicketPayment} />
            <PaymentPanel
              canPurchase={canPurchase}
              hasActivePass={hasActivePass}
              isVerified={isVerified}
              hasApprovedRegistration={hasApprovedRegistration}
              isPurchasing={isPurchasing}
              monthlyAmount={monthlyAmount}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              transactionCode={transactionCode}
              setTransactionCode={setTransactionCode}
              paymentNotes={paymentNotes}
              setPaymentNotes={setPaymentNotes}
              onPurchase={purchaseMonthlyPass}
            />
            <RouteCard
              registration={registration}
              activeMonthlyTicket={activeMonthlyTicket}
              isCancelling={isCancelling}
              onCancel={cancelRegistration}
            />
          </div>

          <Invoices payments={payments} pendingCount={pendingPayments.length} />
        </div>
      )}
    </div>
  );
}

function FlowSteps({ steps }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div key={step.label} className={`rounded-2xl border p-4 flex items-center gap-3 ${step.done ? 'bg-brand-success/10 border-brand-success/20 text-brand-success' : 'bg-white border-black/5 text-brand-text/50'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${step.done ? 'bg-brand-success text-white' : 'bg-brand-surface text-brand-text/50'}`}>
              {step.done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-black uppercase opacity-60">Bước {index + 1}</div>
              <div className="font-black">{step.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TicketPanel({ activeMonthlyTicket, activeTicketPayment }) {
  return (
    <section id="ticket" className="bg-brand-text text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand-primary/20 rounded-full blur-3xl" />
      <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black mb-1">Vé tháng sinh viên</h2>
          <div className="flex items-center gap-2 text-white/70 font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
            {activeMonthlyTicket ? 'Vé tháng đang hoạt động' : 'Chưa có vé tháng'}
          </div>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
          <Ticket className="w-6 h-6 text-white" />
        </div>
      </div>

      {activeMonthlyTicket ? (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <TicketInfo label="Tuyến" value={activeMonthlyTicket.routeName} />
            <TicketInfo label="Hiệu lực" value={`${activeMonthlyTicket.effectiveMonth}/${activeMonthlyTicket.effectiveYear}`} />
            <TicketInfo label="Lên xe" value={activeMonthlyTicket.boardingStopName} />
            <TicketInfo label="Xuống xe" value={activeMonthlyTicket.alightingStopName} />
            <TicketInfo label="Giá vé" value={money.format(Number(activeMonthlyTicket.fareAmount || 0))} />
            <TicketInfo label="Thanh toán" value={activeTicketPayment ? paymentStatusLabels[activeTicketPayment.status] || activeTicketPayment.status : 'Chưa có hóa đơn'} />
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-white/50 font-black uppercase mb-3">QR lên xe</div>
            <TicketQrCode value={activeMonthlyTicket.qrCode} showCode className="w-full" />
          </div>
        </div>
      ) : (
        <div className="relative z-10 bg-white/10 rounded-2xl p-5 border border-white/10">
          <div className="text-sm text-white/50 font-black uppercase tracking-wider mb-1">Trạng thái</div>
          <div className="text-lg font-bold">Hoàn thành các bước bên dưới để nhận QR vé tháng.</div>
        </div>
      )}
    </section>
  );
}

function PaymentPanel({
  canPurchase,
  hasActivePass,
  isVerified,
  hasApprovedRegistration,
  isPurchasing,
  monthlyAmount,
  paymentMethod,
  setPaymentMethod,
  transactionCode,
  setTransactionCode,
  paymentNotes,
  setPaymentNotes,
  onPurchase,
}) {
  const disabledReason = hasActivePass
    ? 'Bạn đã có vé tháng đang hoạt động.'
    : !isVerified
      ? 'Tài khoản sinh viên cần được xác minh.'
      : !hasApprovedRegistration
        ? 'Bạn cần có tuyến đã được duyệt.'
        : '';

  return (
    <section id="payment" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-black flex items-center gap-2"><CreditCard className="w-6 h-6 text-brand-primary" /> Thanh toán vé tháng</h3>
          <p className="text-sm font-medium text-brand-text/60 mt-1">Chọn phương thức thanh toán để kích hoạt vé tháng và QR lên xe.</p>
        </div>
        <div className="rounded-2xl bg-brand-surface px-5 py-3 text-right">
          <div className="text-xs font-black uppercase text-brand-text/40">Số tiền</div>
          <div className="font-black text-brand-text">{monthlyAmount > 0 ? money.format(monthlyAmount) : 'Theo giá tuyến'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          disabled={hasActivePass}
          className="bg-brand-surface border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-brand-text focus:outline-none focus:border-brand-primary disabled:opacity-50"
        >
          <option value="E_WALLET">Ví điện tử</option>
          <option value="BANK_TRANSFER">Chuyển khoản</option>
          <option value="CARD">Thẻ</option>
          <option value="CASH">Tiền mặt</option>
        </select>

        <button
          type="button"
          onClick={onPurchase}
          disabled={!canPurchase}
          className="rounded-2xl bg-brand-text text-white px-5 py-3 font-black hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPurchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
          {paymentMethod === 'E_WALLET' ? 'Thanh toán qua VNPay' : 'Thanh toán vé tháng'}
        </button>
      </div>

      {paymentMethod === 'BANK_TRANSFER' && !hasActivePass && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={transactionCode}
            onChange={(event) => setTransactionCode(event.target.value)}
            placeholder="Mã giao dịch chuyển khoản"
            className="bg-brand-surface border border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-primary"
          />
          <input
            value={paymentNotes}
            onChange={(event) => setPaymentNotes(event.target.value)}
            placeholder="Ghi chú ngân hàng"
            className="bg-brand-surface border border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-primary"
          />
        </div>
      )}

      {disabledReason && (
        <div className="mt-4 rounded-2xl bg-brand-warning/10 border border-brand-warning/20 px-4 py-3 text-sm font-bold text-brand-warning">
          {disabledReason}
        </div>
      )}
    </section>
  );
}

function RouteCard({ registration, activeMonthlyTicket, isCancelling, onCancel }) {
  return (
    <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-black flex items-center gap-2"><MapPin className="w-6 h-6 text-brand-secondary" /> Tuyến mặc định</h3>
        {activeMonthlyTicket && <span className="rounded-xl bg-brand-success/10 px-3 py-2 text-xs font-black text-brand-success">Đã khóa theo vé</span>}
      </div>

      {registration ? (
        <div className="border border-black/5 rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <h4 className="font-black text-lg text-brand-text">{registration.routeName}</h4>
            <p className="text-sm font-medium text-brand-text/60 mt-1">{registration.boardingStopName} → {registration.alightingStopName}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <Info label="Hiệu lực" value={registration.effectiveDate || 'Chưa đặt'} icon={Calendar} />
            <Info label="Trạng thái" value={registration.status} icon={Ticket} />
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <Link
              href={`/student/routes/${registration.routeId}?boardingStopId=${registration.boardingStopId}&alightingStopId=${registration.alightingStopId}`}
              className="flex-1 py-3.5 bg-brand-text text-white font-extrabold text-sm rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Navigation className="w-5 h-5" /> Theo dõi xe & ETA
            </Link>
            <Link href="/student/routes" className={`flex-1 py-3.5 font-bold text-sm rounded-xl transition-colors text-center ${activeMonthlyTicket ? 'bg-brand-surface text-brand-text/40 pointer-events-none' : 'bg-brand-surface hover:bg-black/5'}`}>
              Đổi tuyến
            </Link>
            <button
              onClick={onCancel}
              disabled={isCancelling || Boolean(activeMonthlyTicket)}
              className="flex-1 py-3.5 bg-brand-danger/10 text-brand-danger font-bold text-sm rounded-xl hover:bg-brand-danger hover:text-white transition-colors disabled:opacity-50"
            >
              {isCancelling ? 'Đang hủy...' : 'Hủy tuyến'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-brand-text/50 font-bold">
          Bạn chưa có đăng ký tuyến hiện tại.
          <div className="mt-4">
            <Link href="/student/routes" className="inline-flex px-5 py-3 rounded-xl bg-brand-text text-white hover:bg-black transition-colors">
              Tìm và đăng ký tuyến
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function Invoices({ payments, pendingCount }) {
  return (
    <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col min-h-[420px]">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-black flex items-center gap-2"><Receipt className="w-6 h-6 text-brand-text/60" /> Hóa đơn thanh toán</h3>
        {pendingCount > 0 && <span className="rounded-xl bg-brand-warning/10 px-3 py-2 text-xs font-black text-brand-warning">{pendingCount} chưa thanh toán</span>}
      </div>
      {payments.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center text-brand-text/50">
          <XCircle className="w-16 h-16 mb-4 opacity-40" />
          <p className="font-bold">Chưa có hóa đơn thanh toán.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
          {payments.map((payment) => <InvoiceItem key={payment.paymentId} payment={payment} />)}
        </div>
      )}
    </section>
  );
}

function InvoiceItem({ payment }) {
  const status = paymentStatusLabels[payment.status] || payment.status;
  const method = paymentMethodLabels[payment.method] || payment.method;
  const isPaid = payment.status === 'PAID';
  const isFailed = payment.status === 'FAILED';

  return (
    <div className="rounded-2xl border border-black/5 bg-brand-surface/40 p-4 flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <div className="font-black">{payment.invoiceNumber || `PAY-${payment.paymentId}`}</div>
          <div className="text-xs font-bold text-brand-text/50 mt-1">{method} • {payment.transactionCode || 'Chưa có mã giao dịch'}</div>
        </div>
        <span className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${isPaid ? 'bg-brand-success/10 text-brand-success' : isFailed ? 'bg-brand-danger/10 text-brand-danger' : 'bg-brand-warning/10 text-brand-warning'}`}>
          {status}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <Info label="Số tiền" value={money.format(Number(payment.amount || 0))} icon={CreditCard} />
        <Info label="Ngày tạo" value={formatDateTime(payment.createdAt)} icon={Calendar} />
      </div>
    </div>
  );
}

function TicketInfo({ label, value }) {
  return (
    <div>
      <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="font-bold break-words">{value || 'Chưa có'}</div>
    </div>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div className="bg-brand-surface rounded-2xl p-4">
      <div className="text-xs font-black text-brand-text/40 uppercase flex items-center gap-1"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="font-bold text-brand-text mt-1 break-words">{value || 'Chưa có'}</div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}
