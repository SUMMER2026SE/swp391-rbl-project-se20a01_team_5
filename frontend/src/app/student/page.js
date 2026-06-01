"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Navigation, Clock, Ticket, QrCode, UserCircle, History } from 'lucide-react';
import { registrationApi, studentApi, toApiAssetUrl, travelApi } from '@/services/api';
import { recentTripMocks } from '@/services/mockTrips';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      studentApi.getProfile(),
      registrationApi.getCurrent().catch(() => null),
      travelApi.getHistory({ page: 0, size: 3 }).catch(() => recentTripMocks),
    ])
      .then(([profileData, currentRegistration, trips]) => {
        if (cancelled) return;
        setProfile(profileData);
        setRegistration(currentRegistration);
        setRecentTrips(trips?.length ? trips : recentTripMocks);
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

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-text mb-1">
          Xin chào, {profile?.fullName || 'sinh viên'}!
        </h1>
        <p className="text-brand-text/60 text-sm">Chào mừng trở lại bảng điều khiển của bạn.</p>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="flex-1 flex flex-col xl:grid xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6 order-2 xl:order-1 xl:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-black/[0.08] flex flex-col relative overflow-hidden">
            <h3 className="text-xs font-bold mb-5 text-brand-text/40 uppercase tracking-widest">Hồ sơ sinh viên</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-surface flex items-center justify-center text-xl font-bold text-brand-text border border-black/[0.08] overflow-hidden shrink-0">
                {profile?.avatarUrl ? (
                  <img src={toApiAssetUrl(profile.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-8 h-8 text-brand-text/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-brand-text truncate">{profile?.fullName || 'Chưa có tên'}</h2>
                <p className="text-brand-text/50 font-mono text-sm truncate mt-0.5">{profile?.studentCode || 'Chưa có mã sinh viên'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-brand-surface rounded-xl border border-black/[0.08]">
              <div className="flex items-center gap-3">
                <QrCode className="w-4 h-4 text-brand-text/60" />
                <span className="text-sm font-medium text-brand-text">Mã QR Điểm danh</span>
              </div>
              <button className="px-3 py-1.5 bg-white border border-black/[0.08] rounded-lg text-xs font-semibold text-brand-text hover:bg-black/5 transition-colors shadow-sm">
                Hiển thị
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-black/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-surface rounded-xl flex items-center justify-center border border-black/[0.08]">
                <Ticket className="w-4 h-4 text-brand-text/60" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-text">Vé tháng</p>
                <p className="text-xs text-brand-text/50 mt-0.5">Chưa có dữ liệu</p>
              </div>
            </div>
            <Link href="/student/passes" className="text-xs font-semibold text-brand-text/60 hover:text-brand-text transition-colors">Chi tiết</Link>
          </div>
        </div>

        <div className="flex flex-col gap-6 order-1 xl:order-2 xl:col-span-2">
          <div className="bg-white rounded-2xl p-6 border border-black/[0.08] flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <h3 className="text-base font-semibold flex items-center gap-2 text-brand-text">
                <Navigation className="w-5 h-5 text-brand-secondary" /> Tuyến đã đăng ký
              </h3>
              <Link href="/student/routes" className="px-3 py-1.5 bg-brand-surface hover:bg-black/5 text-brand-text font-semibold text-xs rounded-lg transition-colors border border-black/[0.08]">
                Tìm tuyến khác
              </Link>
            </div>

            {registration ? (
              <div className="border border-black/[0.08] rounded-xl p-5 bg-brand-surface/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-lg font-semibold text-brand-text mb-1 truncate">{registration.routeName}</h4>
                    <p className="text-sm text-brand-text/60 flex items-center gap-1.5 truncate">
                      <MapPin className="w-4 h-4 text-brand-secondary shrink-0" />
                      <span className="truncate">{registration.boardingStopName} → {registration.alightingStopName}</span>
                    </p>
                  </div>
                  <div className="text-xs font-bold px-2.5 py-1 bg-brand-success/10 text-brand-success rounded-md uppercase tracking-wide shrink-0 border border-brand-success/20">
                    {registration.status}
                  </div>
                </div>
                <div className="mt-5">
                  <Link 
                    href={`/student/routes/${registration.routeId}?boardingStopId=${registration.boardingStopId}&alightingStopId=${registration.alightingStopId}`}
                    className="w-full py-2.5 bg-brand-text text-white font-semibold text-sm rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Navigation className="w-4 h-4" /> Theo dõi xe & ETA
                  </Link>
                </div>
              </div>
            ) : (
              <div className="border border-black/[0.08] rounded-xl p-6 bg-brand-surface/50 text-center flex flex-col items-center justify-center h-40">
                <Navigation className="w-8 h-8 text-brand-text/20 mb-3" />
                <p className="text-brand-text/60 text-sm mb-4 font-medium">Bạn chưa đăng ký tuyến xe nào.</p>
                <Link href="/student/routes" className="inline-flex items-center justify-center px-4 py-2 bg-white border border-black/[0.08] shadow-sm text-brand-text text-sm font-semibold rounded-lg hover:bg-black/5 transition-colors">
                  Đăng ký tuyến
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-black/[0.08] flex-1">
            <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-brand-text">
              <History className="w-5 h-5 text-brand-secondary" /> Chuyến đi gần đây
            </h3>

            {recentTrips.length ? (
              <div className="flex flex-col divide-y divide-black/5">
                {recentTrips.map((trip) => (
                  <div key={trip.travelHistoryId} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-text mb-0.5 truncate">{trip.routeName}</p>
                      <p className="text-xs text-brand-text/50 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{trip.boardingStopName || 'N/A'} → {trip.alightingStopName || 'N/A'}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-brand-text">{formatDate(trip.serviceDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <History className="w-8 h-8 text-brand-text/20 mb-3" />
                <p className="text-brand-text/50 text-sm font-medium">Chưa có lịch sử chuyến đi.</p>
              </div>
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
        <div className="h-8 w-64 bg-brand-surface rounded-xl mb-2"></div>
        <div className="h-5 w-80 bg-brand-surface rounded-lg"></div>
      </div>

      <div className="flex-1 flex flex-col xl:grid xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6 order-2 xl:order-1 xl:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-black/[0.08]">
            <div className="h-4 w-32 bg-brand-surface rounded-md mb-6"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-surface shrink-0"></div>
              <div className="flex-1">
                <div className="h-5 w-40 bg-brand-surface rounded-lg mb-2"></div>
                <div className="h-4 w-24 bg-brand-surface rounded-md"></div>
              </div>
            </div>
            <div className="h-12 w-full bg-brand-surface rounded-xl"></div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-black/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-surface rounded-xl"></div>
              <div>
                <div className="h-4 w-16 bg-brand-surface rounded-md mb-1.5"></div>
                <div className="h-3 w-20 bg-brand-surface rounded-md"></div>
              </div>
            </div>
            <div className="h-4 w-12 bg-brand-surface rounded-md"></div>
          </div>
        </div>

        <div className="flex flex-col gap-6 order-1 xl:order-2 xl:col-span-2">
          <div className="bg-white rounded-2xl p-6 border border-black/[0.08]">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div className="h-6 w-48 bg-brand-surface rounded-lg"></div>
              <div className="h-8 w-24 bg-brand-surface rounded-lg"></div>
            </div>
            <div className="rounded-xl p-5 bg-brand-surface/50 border border-black/[0.08]">
              <div className="h-6 w-40 bg-brand-surface rounded-lg mb-3"></div>
              <div className="h-4 w-56 bg-brand-surface rounded-md mb-5"></div>
              <div className="h-10 w-full bg-brand-surface rounded-lg"></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-black/[0.08] flex-1">
            <div className="h-5 w-40 bg-brand-surface rounded-lg mb-6"></div>
            <div className="flex flex-col divide-y divide-black/5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-brand-surface rounded-md mb-2"></div>
                    <div className="h-3 w-32 bg-brand-surface rounded-md"></div>
                  </div>
                  <div className="h-4 w-24 bg-brand-surface rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
