"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Navigation, Clock, Ticket, UserCircle, History } from 'lucide-react';
import { registrationApi, studentApi, ticketingApi, toApiAssetUrl, travelApi } from '@/services/api';
import TicketQrCode from '@/components/tickets/TicketQrCode';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [activeMonthlyTicket, setActiveMonthlyTicket] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">
          Xin chào, {profile?.fullName || 'sinh viên'}!
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6 xl:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-brand-primary/30"></div>

            <div className="w-24 h-24 rounded-full bg-brand-primary flex items-center justify-center text-2xl font-bold text-brand-text border-4 border-white shadow-sm z-10 mb-4 mt-6 overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={toApiAssetUrl(profile.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-14 h-14 text-brand-text/50" />
              )}
            </div>

            <h2 className="text-xl font-bold mb-1 relative z-10">{profile?.fullName || 'Chưa có tên'}</h2>
            <p className="text-brand-text/50 font-mono text-sm mb-6 relative z-10">{profile?.studentCode || 'Chưa có mã sinh viên'}</p>

            <div className="bg-brand-surface p-4 rounded-3xl border border-black/5 mb-6 w-full flex justify-center relative z-10">
              {activeMonthlyTicket?.qrCode ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <TicketQrCode value={activeMonthlyTicket.qrCode} compact className="w-full max-w-56" />
                  <p className="text-xs font-bold text-brand-text/50 leading-relaxed">
                    Vé tháng {activeMonthlyTicket.effectiveMonth}/{activeMonthlyTicket.effectiveYear} - {activeMonthlyTicket.routeName}
                  </p>
                </div>
              ) : (
                <div className="w-full min-h-48 rounded-2xl bg-white border border-black/5 p-5 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center mb-4">
                    <Ticket className="w-6 h-6 text-brand-text" />
                  </div>
                  <p className="text-sm font-black text-brand-text">{ticketAction.title}</p>
                  <p className="mt-2 text-xs font-bold text-brand-text/50 leading-relaxed max-w-56">{ticketAction.description}</p>
                  <Link href={ticketAction.href} className="mt-4 px-4 py-2.5 rounded-xl bg-brand-text text-white text-xs font-black hover:bg-black transition-colors">
                    {ticketAction.label}
                  </Link>
                </div>
              )}
            </div>

          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-surface rounded-2xl flex items-center justify-center shadow-sm">
                <Ticket className="w-6 h-6 text-brand-text/50" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-text">Vé tháng</p>
                <p className="text-xs font-medium text-brand-text/50 mt-0.5">
                  {activeMonthlyTicket ? `${activeMonthlyTicket.effectiveMonth}/${activeMonthlyTicket.effectiveYear} đang hoạt động` : 'Chưa có vé tháng đang hoạt động'}
                </p>
              </div>
            </div>
            <Link href="/student/passes" className="text-xs font-bold text-brand-secondary hover:underline">Chi tiết</Link>
          </div>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-brand-primary rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between mb-8 relative z-10 gap-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Navigation className="w-7 h-7" /> Tuyến đã đăng ký
              </h3>
              <Link href="/student/routes" className="px-4 py-2 bg-white/30 text-brand-text font-bold text-xs rounded-xl uppercase tracking-widest backdrop-blur-sm shadow-sm border border-white/20">
                Tìm tuyến
              </Link>
            </div>

            {registration ? (
              <div className="bg-white rounded-3xl p-6 shadow-sm relative z-10 border border-white/50">
                <h4 className="text-xl font-bold text-brand-text">{registration.routeName}</h4>
                <p className="text-sm font-medium text-brand-text/60 flex items-center gap-1.5 mt-2">
                  <MapPin className="w-4 h-4 text-brand-secondary" />
                  Trạm mặc định: {registration.boardingStopName} → {registration.alightingStopName}
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="text-xs font-black text-brand-success uppercase">{registration.status}</div>
                  <Link 
                    href={`/student/routes/${registration.routeId}?boardingStopId=${registration.boardingStopId}&alightingStopId=${registration.alightingStopId}`}
                    className="w-full py-3.5 bg-brand-text text-white font-extrabold text-sm rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Navigation className="w-4 h-4" /> Theo dõi xe & ETA
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-sm relative z-10 border border-white/50">
                <h4 className="text-xl font-bold text-brand-text">Chưa đăng ký tuyến</h4>
                <p className="text-sm font-medium text-brand-text/60 mt-2">Chọn tuyến và điểm lên/xuống mặc định để mua vé tháng.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex-1">
            <h3 className="font-bold mb-5 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-secondary" /> Chuyến đi gần đây
            </h3>

            {recentTrips.length ? (
              <div className="space-y-3">
                {recentTrips.map((trip) => (
                  <div key={trip.travelHistoryId} className="p-4 bg-brand-surface rounded-2xl border border-black/5">
                    <p className="text-sm font-bold text-brand-text mb-1">{trip.routeName}</p>
                    <p className="text-xs font-medium text-brand-text/60 leading-relaxed flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDate(trip.serviceDate)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-brand-text/50 font-bold">Chưa có lịch sử chuyến đi.</div>
            )}
          </div>
        </div>
      </div>
    </div>
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
