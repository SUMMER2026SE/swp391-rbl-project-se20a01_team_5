"use client";

import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, MapPin, BusFront, Navigation, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { transportApi } from '@/services/api';

export default function RouteTrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const routeId = Number(params.id);
  const boardingStopId = Number(searchParams.get('boardingStopId'));
  const alightingStopId = Number(searchParams.get('alightingStopId'));
  const [routeData, setRouteData] = useState(null);
  const [etas, setEtas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        const stored = sessionStorage.getItem(`selected_route_${routeId}`);
        if (stored && !cancelled) {
          setRouteData(JSON.parse(stored));
        }

        if (boardingStopId) {
          const etaList = await transportApi.getEta(routeId, boardingStopId);
          if (!cancelled) setEtas(etaList || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [routeId, boardingStopId]);

  const selectedStopIds = new Set([boardingStopId, alightingStopId].filter(Boolean));

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex items-center gap-4">
        <Link href="/student/routes" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 hover:bg-brand-surface transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-brand-text" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-1">
            {routeData?.routeName || `Tuyến ${routeId}`}
          </h1>
          <p className="text-brand-text/60 font-medium">ETA được truy vấn trực tiếp từ backend.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="xl:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Navigation className="w-6 h-6 text-brand-secondary" /> Lộ trình trạm dừng
          </h2>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-sm font-bold text-brand-text/50">
              Đang tải dữ liệu tuyến...
            </div>
          ) : routeData?.stops?.length ? (
            <div className="flex flex-col gap-4">
              {routeData.stops.map((stop) => {
                const eta = etas.find((item) => item.stopId === stop.stopId);
                const isSelected = selectedStopIds.has(stop.stopId);

                return (
                  <div key={`${stop.stopId}-${stop.stopOrder}`} className={`border rounded-2xl p-5 flex items-start gap-4 ${isSelected ? 'border-brand-primary bg-brand-primary/5' : 'border-black/5'}`}>
                    <div className="w-12 h-12 rounded-2xl bg-brand-surface flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-brand-text/50" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-bold text-lg">{stop.stopName}</h3>
                        <span className="text-xs font-black text-brand-text/40 uppercase">#{stop.stopOrder}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-brand-text/60">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Sau trạm trước: {stop.minutesFromPreviousStop ?? 0} phút
                        </span>
                        {eta && (
                          <span className="px-3 py-1 bg-brand-success/10 text-brand-success rounded-lg font-bold">
                            ETA: {formatDateTime(eta.estimatedArrivalAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-brand-text/50">
              <BusFront className="w-16 h-16 mb-4 opacity-40" />
              <p className="font-bold">Chưa có dữ liệu chi tiết tuyến trong phiên hiện tại.</p>
              <p className="text-sm mt-1">Hãy tìm tuyến lại từ màn danh sách để xem đầy đủ các trạm.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-brand-primary" /> ETA tại điểm lên
          </h2>

          {!boardingStopId ? (
            <div className="text-sm font-bold text-brand-text/50">
              Chưa có điểm lên. Hãy chọn điểm lên/xuống từ màn tìm tuyến.
            </div>
          ) : etas.length ? (
            <div className="flex flex-col gap-3">
              {etas.map((eta) => (
                <div key={eta.tripId} className="p-4 bg-brand-surface rounded-2xl border border-black/5">
                  <div className="font-bold">Chuyến #{eta.tripId}</div>
                  <div className="text-sm text-brand-text/60 mt-1">Xe #{eta.busId}</div>
                  <div className="text-sm font-bold text-brand-success mt-2">
                    Dự kiến: {formatDateTime(eta.estimatedArrivalAt)}
                  </div>
                  {eta.actualArrivalAt && (
                    <div className="text-xs font-bold text-brand-text/50 mt-1">
                      Thực tế: {formatDateTime(eta.actualArrivalAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm font-bold text-brand-text/50">
              Backend chưa có chuyến đang chạy hoặc ETA cho trạm này.
            </div>
          )}
        </div>
      </div>
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
  }).format(new Date(value));
}
