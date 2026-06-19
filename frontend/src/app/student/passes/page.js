"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BadgeCheck,
  BusFront,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Navigation,
  Receipt,
  RefreshCw,
  Route as RouteIcon,
  School,
  Ticket,
  XCircle,
} from 'lucide-react';
import { registrationApi, studentApi, studentVerificationApi, ticketingApi } from '@/services/api';
import TicketQrCode from '@/components/tickets/TicketQrCode';
import { motion } from 'framer-motion';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function PassesPage() {
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [monthlyPassQuote, setMonthlyPassQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const activeMonthlyTicket = useMemo(() => (
    tickets.find((ticket) => ticket.ticketType === 'MONTHLY' && ticket.status === 'ACTIVE')
  ), [tickets]);

  const isVerified = profile?.studentVerificationStatus === 'VERIFIED' || verification?.status === 'VERIFIED';
  const hasApprovedRegistration = registration?.status === 'APPROVED';
  const hasActivePass = Boolean(activeMonthlyTicket);
  const canPurchase = isVerified && hasApprovedRegistration && !hasActivePass && !isPurchasing;
  const originalFareAmount = Number(
    monthlyPassQuote?.originalFareAmount
      ?? monthlyPassQuote?.baseAmount
      ?? activeMonthlyTicket?.originalFareAmount
      ?? activeMonthlyTicket?.fareAmount
      ?? 0
  );
  const subsidyAmount = Number(monthlyPassQuote?.subsidyAmount ?? activeMonthlyTicket?.subsidyAmount ?? 0);
  const finalFareAmount = Number(
    monthlyPassQuote?.finalFareAmount
      ?? monthlyPassQuote?.payableAmount
      ?? activeMonthlyTicket?.finalFareAmount
      ?? activeMonthlyTicket?.fareAmount
      ?? 0
  );
  const subsidyStatus = monthlyPassQuote?.subsidyStatus ?? activeMonthlyTicket?.subsidyStatus;

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const [profileData, verificationData, currentRegistration, ticketDashboard] = await Promise.all([
        studentApi.getProfile().catch(() => null),
        studentVerificationApi.getCurrent().catch(() => null),
        registrationApi.getCurrent().catch(() => null),
        ticketingApi.dashboard(),
      ]);
      setProfile(profileData);
      setVerification(verificationData);
      setRegistration(currentRegistration);
      setTickets(ticketDashboard?.tickets || []);
      setPayments(ticketDashboard?.payments || []);
      setMonthlyPassQuote(ticketDashboard?.monthlyPassQuote || null);
    } catch (err) {
      setError(err.message);
      setTickets([]);
      setPayments([]);
      setMonthlyPassQuote(null);
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
      await ticketingApi.purchaseMonthlyPass('BANK_TRANSFER');
      setMessage('Đã thanh toán vé tháng và tạo hóa đơn.');
      const refreshed = await ticketingApi.dashboard();
      setTickets(refreshed?.tickets || []);
      setPayments(refreshed?.payments || []);
      setMonthlyPassQuote(refreshed?.monthlyPassQuote || null);
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
      await registrationApi.cancel(registration.registrationId, 'Student cancelled from ticket hub');
      setRegistration(null);
      setMessage('Đã hủy tuyến mặc định hiện tại.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const flowSteps = [
    {
      label: 'Xác minh',
      description: isVerified ? 'Đã duyệt hồ sơ' : 'Cần xác minh sinh viên',
      href: '/student/verify',
      done: isVerified,
      active: !isVerified,
      icon: BadgeCheck,
    },
    {
      label: 'Chọn tuyến',
      description: hasApprovedRegistration ? 'Đã có tuyến mặc định' : 'Chọn tuyến và trạm mặc định',
      href: '/student/routes',
      done: hasApprovedRegistration,
      active: isVerified && !hasApprovedRegistration,
      icon: RouteIcon,
    },
    {
      label: 'Thanh toán',
      description: hasActivePass ? 'Đã ghi nhận thanh toán' : 'Mua vé tháng cho tuyến',
      href: '#payment',
      done: hasActivePass,
      active: isVerified && hasApprovedRegistration && !hasActivePass,
      icon: CreditCard,
    },
    {
      label: 'QR lên xe',
      description: activeMonthlyTicket?.qrCode ? 'QR đã sẵn sàng' : 'QR sinh ra sau thanh toán',
      href: '#ticket',
      done: Boolean(activeMonthlyTicket?.qrCode),
      active: hasActivePass && !activeMonthlyTicket?.qrCode,
      icon: Ticket,
    },
  ];

  // Khai báo variants cho animation GSAP style
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="h-full flex flex-col gap-6 font-sans relative">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)] mb-2">Vé & Tuyến</h1>
          <p className="text-[var(--md-sys-color-on-surface-variant)] font-medium">
            Chọn tuyến mặc định, thanh toán vé tháng, nhận QR và hóa đơn trên cùng một luồng.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          className="min-h-12 px-4 py-3 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] font-bold text-sm text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors flex items-center justify-center gap-2"
          aria-label="Làm mới dữ liệu vé và tuyến"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="p-4 bg-[var(--unibus-danger-container)] border border-[var(--unibus-danger)] rounded-2xl text-sm font-bold text-[var(--unibus-danger)]" role="alert">
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div variants={itemVariants} className="p-4 bg-[var(--unibus-success-container)] border border-[var(--unibus-success)] rounded-2xl text-sm font-bold text-[var(--unibus-success)]" role="status">
          {message}
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center gap-3 text-[var(--md-sys-color-on-surface-variant)] font-bold">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tải vé, tuyến và hóa đơn...
        </div>
      ) : (
        <motion.div variants={itemVariants} className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
          <FlowSteps steps={flowSteps} />

          <div className="mt-6 grid grid-cols-1 2xl:grid-cols-[1.05fr_.95fr] gap-6">
            <section id="ticket" className="bg-[var(--md-sys-color-on-surface)] text-[var(--md-sys-color-surface)] rounded-3xl p-6 md:p-8 border border-[var(--md-sys-color-outline-variant)] overflow-hidden relative">
              {hasActivePass ? (
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-success/15 text-brand-success px-3 py-1 text-xs font-black uppercase mb-5">
                      <CheckCircle2 className="w-4 h-4" /> Vé tháng đang hoạt động
                    </div>
                    <h2 className="text-3xl font-extrabold leading-tight">{activeMonthlyTicket.routeName}</h2>
                    <p className="mt-3 text-white/70 font-bold leading-relaxed">
                      QR này dùng để lên xe trên tuyến đã mua. Điểm lên/xuống bên dưới là trạm mặc định để theo dõi và điều phối, không phải khóa cứng vé.
                    </p>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TicketInfo label="Hiệu lực" value={`${activeMonthlyTicket.effectiveMonth}/${activeMonthlyTicket.effectiveYear}`} />
                      <TicketInfo label="Giá gốc" value={money.format(Number(activeMonthlyTicket.originalFareAmount ?? activeMonthlyTicket.fareAmount ?? 0))} />
                      <TicketInfo label="Trợ giá" value={formatSubsidyAmount(activeMonthlyTicket.subsidyAmount, activeMonthlyTicket.subsidyStatus)} />
                      <TicketInfo label="Thanh toán" value={money.format(Number(activeMonthlyTicket.finalFareAmount ?? activeMonthlyTicket.fareAmount ?? 0))} />
                      <TicketInfo label="Lên mặc định" value={activeMonthlyTicket.boardingStopName} />
                      <TicketInfo label="Xuống mặc định" value={activeMonthlyTicket.alightingStopName} />
                    </div>
                  </div>
                  <div className="w-full lg:w-72">
                    {activeMonthlyTicket.qrCode ? (
                      <TicketQrCode value={activeMonthlyTicket.qrCode} showCode className="w-full" />
                    ) : (
                      <MissingQrState onReload={loadDashboard} />
                    )}
                  </div>
                </div>
              ) : (
                <EmptyTicketState
                  isVerified={isVerified}
                  hasApprovedRegistration={hasApprovedRegistration}
                  canPurchase={canPurchase}
                  isPurchasing={isPurchasing}
                  onPurchase={purchaseMonthlyPass}
                />
              )}
            </section>

            <div className="flex flex-col gap-6">
              <RouteCard
                registration={registration}
                activeMonthlyTicket={activeMonthlyTicket}
                isCancelling={isCancelling}
                onCancel={cancelRegistration}
              />

              <section id="payment" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-brand-secondary" /> Thanh toán vé tháng
                    </h2>
                    <p className="mt-1 text-sm font-medium text-brand-text/50">Ghi nhận thanh toán nội bộ và xuất hóa đơn thật trong hệ thống.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <AmountRow label="Giá gốc" value={monthlyPassQuote ? money.format(originalFareAmount) : 'Chưa có tuyến'} />
                  <AmountRow label="Trợ giá trường" value={formatSubsidyAmount(subsidyAmount, subsidyStatus)} muted />
                  <AmountRow label="Sinh viên thanh toán" value={monthlyPassQuote ? money.format(finalFareAmount) : 'Chưa có'} strong />
                </div>

                <div className="mt-5 rounded-2xl bg-brand-surface border border-black/5 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-brand-text/40 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-brand-text/60 leading-relaxed">
                    Phương thức hiện tại là Chuyển khoản / xác nhận hệ thống. Nếu có trợ giá, số tiền được tự động trừ trước khi thanh toán.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={purchaseMonthlyPass}
                  disabled={!canPurchase}
                  className="mt-5 w-full min-h-12 py-4 rounded-2xl bg-brand-text text-white font-black hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPurchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : hasActivePass ? <CheckCircle2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  {hasActivePass ? 'Đã có vé tháng đang hoạt động' : isPurchasing ? 'Đang ghi nhận thanh toán...' : 'Thanh toán vé tháng'}
                </button>
                {!canPurchase && !hasActivePass && (
                  <p className="mt-3 text-xs font-bold text-brand-text/45 text-center">
                    {!isVerified ? 'Bạn cần xác minh sinh viên trước.' : !hasApprovedRegistration ? 'Bạn cần chọn tuyến mặc định trước.' : 'Không thể thanh toán lúc này.'}
                  </p>
                )}
              </section>

              <SchoolContext profile={profile} monthlyPassQuote={monthlyPassQuote} />
            </div>
          </div>

          <Invoices payments={payments} />
        </div>
      )}
    </div>
  );
}

function FlowSteps({ steps }) {
  return (
    <section className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-black/5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {steps.map((step, index) => (
          <FlowStep key={step.label} step={step} index={index} />
        ))}
      </div>
    </section>
  );
}

function FlowStep({ step, index }) {
  const Icon = step.icon;

  return (
    <Link
      href={step.href}
      className={`min-h-24 rounded-2xl border p-4 flex items-start gap-3 transition-colors ${
        step.done
          ? 'bg-brand-success/10 border-brand-success/20'
          : step.active
            ? 'bg-brand-primary/20 border-brand-primary/40'
            : 'bg-brand-surface border-black/5'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        step.done ? 'bg-brand-success text-white' : step.active ? 'bg-brand-text text-white' : 'bg-white text-brand-text/40'
      }`}>
        {step.done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
      </div>
      <div>
        <div className="text-[10px] font-black uppercase text-brand-text/35 mb-1">Bước {index + 1}</div>
        <div className="text-sm font-black text-brand-text">{step.label}</div>
        <div className="mt-1 text-xs font-bold text-brand-text/50 leading-relaxed">{step.description}</div>
      </div>
    </Link>
  );
}

function EmptyTicketState({ isVerified, hasApprovedRegistration, canPurchase, isPurchasing, onPurchase }) {
  const next = !isVerified
    ? {
        icon: BadgeCheck,
        title: 'Cần xác minh sinh viên',
        description: 'Sau khi hồ sơ được duyệt, bạn mới có thể chọn tuyến và mua vé tháng.',
        href: '/student/verify',
        label: 'Xác minh sinh viên',
      }
    : !hasApprovedRegistration
      ? {
          icon: RouteIcon,
          title: 'Chưa chọn tuyến mặc định',
          description: 'Chọn tuyến và trạm lên/xuống mặc định để hệ thống tính vé tháng.',
          href: '/student/routes',
          label: 'Chọn tuyến',
        }
      : null;

  if (next) {
    const Icon = next.icon;
    return (
      <div className="relative z-10 min-h-[420px] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/10 flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-brand-primary" />
        </div>
        <h2 className="text-3xl font-extrabold">{next.title}</h2>
        <p className="mt-3 max-w-lg text-white/65 font-bold leading-relaxed">{next.description}</p>
        <Link href={next.href} className="mt-6 min-h-12 px-6 py-3 rounded-2xl bg-brand-primary text-brand-text font-black hover:bg-white transition-colors inline-flex items-center justify-center gap-2">
          <Navigation className="w-5 h-5" /> {next.label}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-[420px] grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/20 text-brand-primary px-3 py-1 text-xs font-black uppercase mb-5">
          <CreditCard className="w-4 h-4" /> Sẵn sàng thanh toán
        </div>
        <h2 className="text-3xl font-extrabold leading-tight">Mua vé tháng cho tuyến đã đăng ký</h2>
        <p className="mt-3 text-white/70 font-bold leading-relaxed max-w-xl">
          Sau khi thanh toán, vé tháng và mã QR sẽ sẵn sàng để sử dụng khi lên xe.
        </p>
        <button
          type="button"
          onClick={onPurchase}
          disabled={!canPurchase}
          className="mt-6 min-h-12 px-6 py-3 rounded-2xl bg-brand-primary text-brand-text font-black hover:bg-white transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPurchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
          {isPurchasing ? 'Đang thanh toán...' : 'Thanh toán vé tháng'}
        </button>
      </div>
      <div className="w-full lg:w-72 rounded-2xl bg-white/10 border border-white/10 p-5 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/20">
          <Ticket className="h-7 w-7 text-brand-primary" />
        </div>
        <p className="text-sm font-black text-white">QR sẽ xuất hiện sau thanh toán</p>
        <p className="mt-2 text-xs font-bold leading-relaxed text-white/60">
          Mã QR được cấp cùng vé tháng của bạn.
        </p>
      </div>
    </div>
  );
}

function MissingQrState({ onReload }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-center text-brand-text shadow-sm border border-black/5">
      <AlertCircle className="mx-auto mb-3 h-9 w-9 text-brand-warning" />
      <p className="text-sm font-black">Thiếu mã QR vé tháng</p>
      <p className="mt-2 text-xs font-bold leading-relaxed text-brand-text/55">
        Vé đang hoạt động nhưng chưa có mã QR. Vui lòng làm mới dữ liệu trước khi lên xe.
      </p>
      <button
        type="button"
        onClick={onReload}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-text px-4 py-2 text-xs font-black text-white hover:bg-black transition-colors"
      >
        <RefreshCw className="h-4 w-4" /> Làm mới
      </button>
    </div>
  );
}

function RouteCard({ registration, activeMonthlyTicket, isCancelling, onCancel }) {
  const hasActivePass = Boolean(activeMonthlyTicket);

  return (
    <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
        <BusFront className="w-6 h-6 text-brand-secondary" /> Tuyến mặc định
      </h2>

      {registration ? (
        <div>
          <div className="rounded-2xl bg-brand-surface border border-black/5 p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase text-brand-text/35 mb-1">Tuyến đã đăng ký</div>
                <h3 className="text-lg font-black text-brand-text">{registration.routeName}</h3>
                <p className="mt-2 text-sm font-bold text-brand-text/60 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-secondary" />
                  {registration.boardingStopName} → {registration.alightingStopName}
                </p>
              </div>
              <span className="self-start rounded-xl bg-brand-success/10 text-brand-success px-3 py-1 text-xs font-black uppercase">
                {registration.status}
              </span>
            </div>
            <div className="mt-4 rounded-xl bg-white p-3 text-xs font-bold text-brand-text/55 leading-relaxed">
              Vé tháng hợp lệ theo tuyến. Hai trạm này là mặc định để xem ETA, thống kê nhu cầu và điều phối.
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href={`/student/routes/${registration.routeId}?boardingStopId=${registration.boardingStopId}&alightingStopId=${registration.alightingStopId}`}
              className="min-h-12 py-3 rounded-2xl bg-brand-text text-white font-black text-sm hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" /> Theo dõi tuyến
            </Link>
            {hasActivePass ? (
              <div className="min-h-12 py-3 rounded-2xl bg-brand-surface text-brand-text/45 font-black text-sm flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" /> Khóa đổi tuyến
              </div>
            ) : (
              <Link href="/student/routes" className="min-h-12 py-3 rounded-2xl bg-brand-surface text-brand-text font-black text-sm hover:bg-black/5 transition-colors flex items-center justify-center gap-2">
                <RouteIcon className="w-5 h-5" /> Đổi tuyến
              </Link>
            )}
          </div>

          {!hasActivePass && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="mt-3 w-full min-h-12 py-3 rounded-2xl bg-brand-danger/10 text-brand-danger font-black text-sm hover:bg-brand-danger hover:text-white transition-colors disabled:opacity-50"
            >
              {isCancelling ? 'Đang hủy...' : 'Hủy tuyến mặc định'}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-brand-text/50 font-bold">
          <RouteIcon className="w-14 h-14 mx-auto mb-4 opacity-40" />
          <p>Chưa có tuyến mặc định.</p>
          <Link href="/student/routes" className="mt-4 inline-flex min-h-12 px-5 py-3 rounded-2xl bg-brand-text text-white font-black hover:bg-black transition-colors">
          <Invoices payments={payments} />
        </motion.div>
      )}
    </motion.div>
  );
}

function SchoolContext({ profile, monthlyPassQuote }) {
  const status = monthlyPassQuote?.subsidyStatus || 'NOT_CONFIGURED';

  return (
    <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
        <School className="w-6 h-6 text-brand-text/50" /> Trường & trợ giá
      </h2>
      <div className="rounded-2xl bg-brand-surface border border-black/5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase text-brand-text/35 mb-1">Trường hiện tại</div>
            <div className="font-black text-brand-text">{profile?.university || 'Chưa có dữ liệu trường'}</div>
          </div>
          <span className={`self-start rounded-xl px-3 py-1 text-xs font-black uppercase ${status === 'APPLIED' ? 'bg-brand-success/10 text-brand-success' : 'bg-white text-brand-text/45'}`}>
            {subsidyStatusLabel(status)}
          </span>
        </div>
        <p className="mt-3 text-sm font-bold text-brand-text/55 leading-relaxed">
          Trường dùng để lọc tuyến được phép đăng ký và tính trợ giá vé tháng. Campus, roster và import từ trường sẽ nối vào cùng nền dữ liệu này ở giai đoạn sau.
        </p>
      </div>
    </section>
  );
}

function Invoices({ payments }) {
  return (
    <section className="mt-6 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Receipt className="w-6 h-6 text-brand-text/60" /> Hóa đơn gần đây
      </h2>
      {payments.length === 0 ? (
        <div className="py-14 flex flex-col items-center justify-center text-center text-brand-text/50 bg-brand-surface rounded-2xl">
          <XCircle className="w-14 h-14 mb-4 opacity-40" />
          <p className="font-bold">Chưa có hóa đơn thanh toán.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {payments.map((payment) => {
            const originalAmount = Number(payment.originalAmount ?? payment.amount ?? 0);
            const subsidyAmount = Number(payment.subsidyAmount ?? 0);
            const finalAmount = Number(payment.finalAmount ?? payment.amount ?? 0);

            return (
              <div key={payment.paymentId} className="rounded-2xl border border-black/5 bg-brand-surface/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="font-black text-brand-text">{payment.invoiceNumber || `PAY-${payment.paymentId}`}</div>
                    <div className="text-xs font-bold text-brand-text/50 mt-1">
                      {labelPaymentMethod(payment.method)} - {payment.status} - {formatDate(payment.createdAt)}
                    </div>
                  </div>
                  <div className="font-black text-brand-text">{money.format(finalAmount)}</div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <InvoiceAmount label="Giá gốc" value={money.format(originalAmount)} />
                  <InvoiceAmount label="Trợ giá" value={subsidyAmount > 0 ? `-${money.format(subsidyAmount)}` : '0 ₫'} muted />
                  <InvoiceAmount label="Thanh toán" value={money.format(finalAmount)} strong />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TicketInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
      <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="font-bold break-words">{value || 'Chưa có'}</div>
    </div>
  );
}

function AmountRow({ label, value, strong = false, muted = false }) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ${strong ? 'bg-brand-text text-white' : 'bg-brand-surface text-brand-text'}`}>
      <span className={`text-sm font-bold ${muted ? 'opacity-55' : 'opacity-80'}`}>{label}</span>
      <span className="font-black text-right">{value}</span>
    </div>
  );
}

function InvoiceAmount({ label, value, strong = false, muted = false }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${strong ? 'bg-brand-text text-white' : 'bg-white text-brand-text'}`}>
      <div className={`text-[10px] font-black uppercase ${muted ? 'opacity-45' : 'opacity-55'}`}>{label}</div>
      <div className="mt-1 text-sm font-black">{value}</div>
    </div>
  );
}

function formatSubsidyAmount(amount, status) {
  const numericAmount = Number(amount || 0);
  if (numericAmount > 0) return money.format(numericAmount);
  return subsidyStatusLabel(status);
}

function subsidyStatusLabel(status) {
  const labels = {
    APPLIED: 'Đang áp dụng',
    NOT_VERIFIED: 'Chưa xác minh',
    NO_UNIVERSITY: 'Chưa liên kết trường',
    ROUTE_NOT_LINKED: 'Tuyến chưa liên kết',
    NO_ACTIVE_POLICY: 'Chưa có chính sách',
    NOT_CONFIGURED: 'Chưa cấu hình',
  };
  return labels[status] || 'Chưa cấu hình';
}

function labelPaymentMethod(value) {
  const labels = {
    BANK_TRANSFER: 'Chuyển khoản / xác nhận hệ thống',
  };
  return labels[value] || 'Xác nhận hệ thống';
}

function formatDate(value) {
  if (!value) return 'Chưa có ngày';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}
