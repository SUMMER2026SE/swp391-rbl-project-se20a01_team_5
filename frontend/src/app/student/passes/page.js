"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Ticket, MapPin, Receipt, XCircle, RefreshCw, Calendar, AlertCircle, Navigation, CreditCard, Loader2 } from 'lucide-react';
import { registrationApi, ticketingApi } from '@/services/api';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function PassesPage() {
  const [registration, setRegistration] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('E_WALLET');
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const activeMonthlyTicket = useMemo(() => (
    tickets.find((ticket) => ticket.ticketType === 'MONTHLY' && ticket.status === 'ACTIVE')
  ), [tickets]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
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
      const ticket = await ticketingApi.purchaseMonthlyPass(paymentMethod);
      setMessage('Đã ghi nhận thanh toán và kích hoạt vé tháng.');
      setTickets((current) => {
        const withoutDuplicate = current.filter((item) => item.ticketId !== ticket.ticketId);
        return [ticket, ...withoutDuplicate];
      });
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
    if (!registration?.registrationId) return;
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
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Vé & đăng ký tuyến</h1>
        <p className="text-brand-text/60 font-medium">Mua vé tháng, xem hóa đơn và quản lý tuyến đã đăng ký.</p>
      </div>

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
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tải vé và đăng ký tuyến...
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
          <div className="flex flex-col gap-6">
            <div className="bg-brand-text text-white rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand-primary/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold mb-1">Vé tháng sinh viên</h2>
                  <div className="flex items-center gap-2 text-white/70 font-bold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {activeMonthlyTicket ? 'Vé tháng đang hoạt động' : 'Chưa có vé tháng active'}
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="relative z-10 bg-white/10 rounded-2xl p-5 border border-white/10">
                {activeMonthlyTicket ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TicketInfo label="Tuyến" value={activeMonthlyTicket.routeName} />
                    <TicketInfo label="Hiệu lực" value={`${activeMonthlyTicket.effectiveMonth}/${activeMonthlyTicket.effectiveYear}`} />
                    <TicketInfo label="Lên xe" value={activeMonthlyTicket.boardingStopName} />
                    <TicketInfo label="Xuống xe" value={activeMonthlyTicket.alightingStopName} />
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-white/50 font-bold uppercase tracking-wider mb-1">Trạng thái</div>
                    <div className="text-lg font-bold">Đăng ký tuyến được duyệt là điều kiện để mua vé tháng.</div>
                    <div className="mt-5 flex flex-col md:flex-row gap-3">
                      <select
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                        className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none"
                      >
                        <option value="E_WALLET">Ví điện tử</option>
                        <option value="BANK_TRANSFER">Chuyển khoản</option>
                        <option value="CARD">Thẻ</option>
                        <option value="CASH">Tiền mặt</option>
                      </select>
                      <button
                        onClick={purchaseMonthlyPass}
                        disabled={isPurchasing || registration?.status !== 'APPROVED'}
                        className="px-5 py-3 rounded-xl bg-brand-primary text-brand-text font-black hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isPurchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                        Mua vé tháng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-brand-secondary" /> Tuyến đã đăng ký
                </h3>
                <button
                  onClick={loadDashboard}
                  className="p-3 rounded-2xl bg-brand-surface hover:bg-brand-text hover:text-white transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {registration ? (
                <div className="border border-black/5 rounded-2xl p-5 flex flex-col gap-4">
                  <div>
                    <h4 className="font-bold text-lg">{registration.routeName}</h4>
                    <p className="text-sm font-medium text-brand-text/60 mt-1">
                      {registration.boardingStopName} → {registration.alightingStopName}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <Info label="Hiệu lực" value={registration.effectiveDate || 'Chưa đặt'} icon={Calendar} />
                    <Info label="Trạng thái" value={registration.status} icon={Ticket} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/student/routes/${registration.routeId}?boardingStopId=${registration.boardingStopId}&alightingStopId=${registration.alightingStopId}`}
                      className="w-full py-3.5 bg-brand-text text-white font-extrabold text-sm rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Navigation className="w-5 h-5" /> Theo dõi xe & ETA
                    </Link>
                    <div className="flex flex-col md:flex-row gap-3">
                      <Link href="/student/routes" className="flex-1 py-3 bg-brand-surface font-bold text-sm rounded-xl hover:bg-black/5 transition-colors text-center">
                        Đổi tuyến
                      </Link>
                      <button
                        onClick={cancelRegistration}
                        disabled={isCancelling}
                        className="flex-1 py-3 bg-brand-danger/10 text-brand-danger font-bold text-sm rounded-xl hover:bg-brand-danger hover:text-white transition-colors disabled:opacity-60"
                      >
                        {isCancelling ? 'Đang hủy...' : 'Hủy đăng ký'}
                      </button>
                    </div>
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
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-brand-text/60" /> Lịch sử hóa đơn
              </h3>
              {payments.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center text-brand-text/50">
                  <XCircle className="w-16 h-16 mb-4 opacity-40" />
                  <p className="font-bold">Chưa có hóa đơn thanh toán.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {payments.map((payment) => (
                    <div key={payment.paymentId} className="rounded-2xl border border-black/5 bg-brand-surface/40 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="font-black">{payment.invoiceNumber || `PAY-${payment.paymentId}`}</div>
                        <div className="text-xs font-bold text-brand-text/50 mt-1">{payment.method} • {payment.status}</div>
                      </div>
                      <div className="font-black text-brand-text">{money.format(Number(payment.amount || 0))}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
      <div className="text-xs font-black text-brand-text/40 uppercase flex items-center gap-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="font-bold text-brand-text mt-1">{value}</div>
    </div>
  );
}
