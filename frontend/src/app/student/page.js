"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Navigation, Clock, Ticket, UserCircle, History } from 'lucide-react';
import { registrationApi, studentApi, ticketingApi, toApiAssetUrl, travelApi } from '@/services/api';
import TicketQrCode from '@/components/tickets/TicketQrCode';
import { FilledButton, TonalButton, MaterialCard } from '@/components/ui/material';
import { motion } from 'framer-motion';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [activeMonthlyTicket, setActiveMonthlyTicket] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      studentApi.getProfile(),
      registrationApi.getCurrent().catch(() => null),
      ticketingApi.dashboard().catch(() => null),
      travelApi.getHistory({ page: 0, size: 3 }).catch(() => []),
    ])
      .then(([profileData, currentRegistration, ticketDashboard, trips]) => {
        if (cancelled) return;
        setProfile(profileData);
        setRegistration(currentRegistration);
        setActiveMonthlyTicket((ticketDashboard?.tickets || []).find((ticket) => ticket.ticketType === 'MONTHLY' && ticket.status === 'ACTIVE') || null);
        setRecentTrips(trips || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasApprovedRegistration = registration?.status === 'APPROVED';
  const ticketAction = activeMonthlyTicket && !activeMonthlyTicket.qrCode
    ? {
        href: '/student/passes',
        label: 'Kiểm tra vé',
        title: 'Thiếu mã QR vé tháng',
        description: 'Vé tháng đang hoạt động nhưng chưa có mã QR. Vào Hub Vé & Tuyến để làm mới dữ liệu.',
      }
    : activeMonthlyTicket
      ? null
      : hasApprovedRegistration
        ? {
            href: '/student/passes',
            label: 'Thanh toán vé tháng',
            title: 'Chưa mua vé tháng',
            description: 'Tuyến mặc định đã sẵn sàng. Thanh toán để nhận QR lên xe.',
          }
        : {
            href: '/student/routes',
            label: 'Chọn tuyến',
            title: 'Chưa có tuyến mặc định',
            description: 'Chọn tuyến và điểm lên/xuống mặc định trước khi mua vé tháng.',
          };

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
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="h-full flex flex-col gap-6 font-sans">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)] mb-2">
          Xin chào, {profile?.fullName || 'sinh viên'}!
        </h1>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="p-4 bg-[var(--unibus-danger-container)] border border-[var(--unibus-danger)] rounded-2xl text-sm font-bold text-[var(--unibus-danger)]">
          {error}
        </motion.div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <motion.div variants={itemVariants} className="flex flex-col gap-6 xl:col-span-1">
          <MaterialCard elevated={false} className="p-8 flex flex-col items-center text-center bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]">
            <div className="w-24 h-24 rounded-full bg-[var(--md-sys-color-primary)] flex items-center justify-center text-2xl font-bold text-[var(--md-sys-color-on-primary)] border-4 border-[var(--md-sys-color-surface-container-lowest)] shadow-none z-10 mb-4 overflow-hidden">
              {profile?.avatarUrl && !avatarError ? (
                <img 
                  src={toApiAssetUrl(profile.avatarUrl)} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <UserCircle className="w-14 h-14 text-[var(--md-sys-color-on-primary)]" />
              )}
            </div>

            <h2 className="text-xl font-bold mb-1 relative z-10 text-[var(--md-sys-color-on-surface)]">{profile?.fullName || 'Chưa có tên'}</h2>
            <p className="text-[var(--md-sys-color-on-surface-variant)] font-mono text-sm mb-6 relative z-10">{profile?.studentCode || 'Chưa có mã sinh viên'}</p>

            <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] mb-6 w-full flex justify-center relative z-10">
              {activeMonthlyTicket?.qrCode ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <TicketQrCode value={activeMonthlyTicket.qrCode} compact className="w-full max-w-56" />
                  <p className="text-xs font-bold text-brand-text/50 leading-relaxed">
                    Vé tháng {activeMonthlyTicket.effectiveMonth}/{activeMonthlyTicket.effectiveYear} - {activeMonthlyTicket.routeName}
                  </p>
                </div>
              ) : (
                <div className="w-full min-h-48 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] p-5 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center mb-4">
                    <Ticket className="w-6 h-6 text-brand-text" />
                  </div>
                  <p className="text-sm font-black text-brand-text">{ticketAction.title}</p>
                  <p className="mt-2 text-xs font-bold text-brand-text/50 leading-relaxed max-w-56">{ticketAction.description}</p>
                  <FilledButton href={ticketAction.href} className="mt-4">
                    {ticketAction.label}
                  </FilledButton>
                </div>
              )}
            </div>
          </MaterialCard>

          <MaterialCard elevated={false} className="p-6 flex items-center justify-between bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--md-sys-color-surface-container-low)] rounded-full flex items-center justify-center shadow-none">
                <Ticket className="w-6 h-6 text-[var(--md-sys-color-on-surface)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Vé tháng</p>
                <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  {activeMonthlyTicket ? `${activeMonthlyTicket.effectiveMonth}/${activeMonthlyTicket.effectiveYear} đang hoạt động` : 'Chưa có vé tháng đang hoạt động'}
                </p>
              </div>
            </div>
            <Link href="/student/passes" className="text-xs font-bold text-[var(--md-sys-color-primary)] hover:underline">Chi tiết</Link>
          </MaterialCard>
        </motion.div>

        <motion.div variants={itemVariants} className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] rounded-2xl p-6 md:p-8 border border-[var(--md-sys-color-outline-variant)] relative overflow-hidden flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between mb-8 relative z-10 gap-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Navigation className="w-7 h-7" /> Tuyến đã đăng ký
              </h3>
              <TonalButton href="/student/routes">
                Tìm tuyến
              </TonalButton>
            </div>

            {registration ? (
              <div className="p-6 border border-[var(--md-sys-color-outline-variant)] rounded-2xl bg-[var(--md-sys-color-surface-container-low)]">
                <h4 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">{registration.routeName}</h4>
                <p className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 mt-2">
                  <MapPin className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  Trạm mặc định: {registration.boardingStopName} → {registration.alightingStopName}
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="text-xs font-black text-[var(--unibus-success)] uppercase">{registration.status}</div>
                  <FilledButton 
                    href={`/student/routes/${registration.routeId}?boardingStopId=${registration.boardingStopId}&alightingStopId=${registration.alightingStopId}`}
                    className="w-full mt-2"
                  >
                    <Navigation className="w-4 h-4 mr-2" /> Theo dõi xe & ETA
                  </FilledButton>
                </div>
              </div>
            ) : (
              <div className="p-6 border border-[var(--md-sys-color-outline-variant)] rounded-2xl bg-[var(--md-sys-color-surface-container-low)]">
                <h4 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">Chưa đăng ký tuyến</h4>
                <p className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mt-2">Chọn tuyến và điểm lên/xuống mặc định để mua vé tháng.</p>
              </div>
            )}
          </div>

          <MaterialCard elevated={false} className="p-6 flex-1 bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]">
            <h3 className="font-bold mb-5 flex items-center gap-2">
              <History className="w-5 h-5 text-[var(--md-sys-color-primary)]" /> Chuyến đi gần đây
            </h3>

            {recentTrips.length ? (
              <div className="space-y-3">
                {recentTrips.map((trip) => (
                  <div key={trip.travelHistoryId} className="p-4 bg-[var(--md-sys-color-surface-container-low)] rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                    <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-1">{trip.routeName}</p>
                    <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] leading-relaxed flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDate(trip.serviceDate)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-32 text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]">
                Chưa có lịch sử chuyến đi.
              </div>
            )}
          </MaterialCard>
        </motion.div>
      </div>
    </motion.div>
  );
}

function formatDate(value) {
  if (!value) return 'Chưa có ngày';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function DashboardSkeleton() {
  return (
    <div className="h-full flex flex-col gap-6 font-sans relative animate-pulse">
      <div>
        <div className="h-9 w-64 bg-brand-surface rounded-xl mb-3"></div>
        <div className="h-5 w-80 bg-brand-surface rounded-lg"></div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6 xl:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-brand-surface mb-4 mt-6"></div>
            <div className="h-6 w-32 bg-brand-surface rounded-lg mb-2"></div>
            <div className="h-4 w-24 bg-brand-surface rounded-lg mb-6"></div>
            <div className="bg-brand-surface p-4 rounded-3xl border border-black/5 mb-6 w-full flex justify-center">
              <div className="w-48 h-48 bg-white/50 rounded-xl"></div>
            </div>
            <div className="h-3 w-40 bg-brand-surface rounded-md"></div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-surface rounded-2xl"></div>
              <div>
                <div className="h-4 w-16 bg-brand-surface rounded-md mb-1.5"></div>
                <div className="h-3 w-20 bg-brand-surface rounded-md"></div>
              </div>
            </div>
            <div className="h-3 w-12 bg-brand-surface rounded-md"></div>
          </div>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-brand-surface rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
              <div className="h-8 w-48 bg-black/5 rounded-xl"></div>
              <div className="h-8 w-24 bg-black/5 rounded-xl"></div>
            </div>
            <div className="bg-white/50 rounded-3xl p-6 shadow-sm border border-white/50">
              <div className="h-6 w-40 bg-black/5 rounded-lg mb-3"></div>
              <div className="h-4 w-56 bg-black/5 rounded-md mb-4"></div>
              <div className="h-3 w-20 bg-black/5 rounded-md"></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex-1">
            <div className="h-5 w-40 bg-brand-surface rounded-lg mb-6"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-brand-surface rounded-2xl border border-black/5">
                  <div className="h-4 w-48 bg-black/5 rounded-md mb-2"></div>
                  <div className="h-3 w-24 bg-black/5 rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
