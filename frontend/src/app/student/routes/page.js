"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Map, Clock, ArrowRight, BusFront, MapPin, Activity, CheckCircle2, Lock, Ticket, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import { registrationApi, ticketingApi, transportApi } from '@/services/api';

export default function StudentRoutesPage() {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentRegistration, setCurrentRegistration] = useState(null);
  const [activeMonthlyTicket, setActiveMonthlyTicket] = useState(null);
  const [boardingStopId, setBoardingStopId] = useState('');
  const [alightingStopId, setAlightingStopId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingStops, setIsLoadingStops] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [registeringRouteId, setRegisteringRouteId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      transportApi.getStops(),
      registrationApi.getCurrent().catch(() => null),
      ticketingApi.dashboard().catch(() => null),
    ])
      .then(([stopList, registration, ticketDashboard]) => {
        if (cancelled) return;
        setStops(getMeaningfulStops(stopList || []));
        setCurrentRegistration(registration);
        setActiveMonthlyTicket((ticketDashboard?.tickets || []).find((ticket) => ticket.ticketType === 'MONTHLY' && ticket.status === 'ACTIVE') || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStops(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRoutes = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return routes;

    return routes.filter((route) => {
      const stopNames = route.stops?.map((stop) => stop.stopName).join(' ') || '';
      return `${route.routeName} ${stopNames}`.toLowerCase().includes(keyword);
    });
  }, [routes, searchTerm]);

  const hasAvailableStops = stops.length > 0;

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!hasAvailableStops) {
      setError('Trường của bạn chưa có tuyến được cấu hình. Vui lòng liên hệ điều phối viên hoặc admin để liên kết tuyến với trường.');
      setRoutes([]);
      setHasSearched(false);
      return;
    }

    if (!boardingStopId || !alightingStopId) {
      setError('Vui lòng chọn điểm lên mặc định và điểm xuống mặc định.');
      return;
    }

    if (boardingStopId === alightingStopId) {
      setError('Điểm lên mặc định và điểm xuống mặc định phải khác nhau.');
      return;
    }

    setIsSearching(true);
    try {
      const results = await transportApi.searchRoutes(Number(boardingStopId), Number(alightingStopId));
      setRoutes(results || []);
      setHasSearched(true);
      setMessage(results?.length ? `Tìm thấy ${results.length} tuyến phù hợp.` : 'Không có tuyến phù hợp với hai trạm đã chọn.');
    } catch (err) {
      setError(err.message);
      setRoutes([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegister = async (route) => {
    setError('');
    setMessage('');
    setRegisteringRouteId(route.routeId);

    if (activeMonthlyTicket && activeMonthlyTicket.routeId !== route.routeId) {
      setError(`Bạn đang có vé tháng đang hoạt động cho ${activeMonthlyTicket.routeName}. Có thể đổi tuyến sau khi hết kỳ vé hiện tại.`);
      setRegisteringRouteId(null);
      return;
    }

    const payload = {
      routeId: route.routeId,
      boardingStopId: Number(boardingStopId),
      alightingStopId: Number(alightingStopId),
      effectiveDate: new Date().toISOString().slice(0, 10),
    };

    try {
      const registration = currentRegistration?.registrationId
        ? await registrationApi.change(currentRegistration.registrationId, payload)
        : await registrationApi.register(payload);

      setCurrentRegistration(registration);
      setMessage(`Đã lưu ${registration.routeName} làm tuyến mặc định. Vé tháng vẫn hợp lệ theo toàn tuyến.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegisteringRouteId(null);
    }
  };

  const rememberRoute = (route) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(`selected_route_${route.routeId}`, JSON.stringify({
      ...route,
      boardingStopId: Number(boardingStopId),
      alightingStopId: Number(alightingStopId),
    }));
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Tìm tuyến xe</h1>
          <p className="text-brand-text/60 font-medium">
            Chọn tuyến và trạm lên/xuống mặc định để theo dõi ETA. Vé tháng được kiểm tra theo tuyến, không khóa cứng theo hai trạm này.
          </p>
        </div>
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

      {activeMonthlyTicket && (
        <div className="p-4 bg-brand-primary/20 border border-brand-primary/30 rounded-2xl text-sm font-bold text-brand-text flex items-start gap-3">
          <Ticket className="w-5 h-5 shrink-0 mt-0.5" />
          Bạn đang có vé tháng đang hoạt động cho {activeMonthlyTicket.routeName}. Trong kỳ vé hiện tại, hệ thống chỉ cho cập nhật trạm mặc định trên cùng tuyến.
        </div>
      )}

      {!isLoadingStops && !hasAvailableStops && (
        <div className="p-5 bg-white border border-black/5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center shrink-0">
            <Map className="w-7 h-7 text-brand-primary" />
          </div>
          <div>
            <h2 className="font-black text-brand-text">Trường chưa có tuyến được cấu hình</h2>
            <p className="mt-1 text-sm font-bold text-brand-text/55 leading-relaxed">
              Tài khoản của bạn đã bị giới hạn theo trường liên kết. Khi admin gắn tuyến vào trường/campus, danh sách trạm và tuyến sẽ hiện ở đây.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
        <StopSelect
          id="boarding-stop"
          label="Điểm lên mặc định"
          value={boardingStopId}
          onChange={setBoardingStopId}
          stops={stops}
          disabled={isLoadingStops || !hasAvailableStops}
          disabledText={isLoadingStops ? 'Đang tải trạm...' : 'Chưa có trạm được cấu hình'}
        />
        <StopSelect
          id="alighting-stop"
          label="Điểm xuống mặc định"
          value={alightingStopId}
          onChange={setAlightingStopId}
          stops={stops}
          disabled={isLoadingStops || !hasAvailableStops}
          disabledText={isLoadingStops ? 'Đang tải trạm...' : 'Chưa có trạm được cấu hình'}
        />
        <label className="block">
          <span className="block text-xs font-black text-brand-text/40 uppercase mb-2">Lọc kết quả</span>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
            <input
              type="text"
              placeholder="Tên tuyến hoặc trạm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-surface border border-black/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={isLoadingStops || isSearching || !hasAvailableStops}
          className="py-3.5 px-6 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors disabled:opacity-60"
        >
          {isSearching ? 'Đang tìm...' : 'Tìm tuyến'}
        </button>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {!hasSearched && filteredRoutes.length > 0 && (
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-secondary" /> Tuyến xe phù hợp
          </h2>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredRoutes.map((route) => {
            const isCurrent = currentRegistration?.routeId === route.routeId;
            const lockedByActivePass = activeMonthlyTicket && activeMonthlyTicket.routeId !== route.routeId;
            const sameAsActivePass = activeMonthlyTicket?.routeId === route.routeId;
            const firstStop = route.stops?.[0]?.stopName;
            const lastStop = route.stops?.[route.stops.length - 1]?.stopName;

            return (
              <div key={route.routeId} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 hover:border-brand-primary/30 transition-colors flex flex-col justify-between">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center shrink-0">
                      <BusFront className="w-7 h-7 text-brand-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
                        {route.routeName}
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-brand-success/10 text-brand-success text-[10px] font-black uppercase tracking-wider rounded-md">Tuyến mặc định</span>
                        )}
                        {sameAsActivePass && (
                          <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-text text-[10px] font-black uppercase tracking-wider rounded-md">Vé đang hoạt động</span>
                        )}
                      </h2>
                      <p className="text-sm font-bold text-brand-text/60 mt-1">
                        {[firstStop, lastStop].filter(Boolean).join(' → ') || 'Chưa có dữ liệu trạm'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <Metric icon={Clock} label="Thời gian" value={route.estimatedMinutes ? `${route.estimatedMinutes} phút` : 'Chưa có'} />
                  <Metric icon={Activity} label="Quãng đường" value={route.distanceKm ? `${route.distanceKm} km` : 'Chưa có'} />
                  <Metric icon={MapPin} label="Số trạm" value={`${route.stops?.length || 0} trạm`} />
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <Link
                    href={`/student/routes/${route.routeId}?boardingStopId=${boardingStopId}&alightingStopId=${alightingStopId}`}
                    onClick={() => rememberRoute(route)}
                    className="flex-1 py-4 bg-brand-surface text-brand-text font-bold rounded-2xl hover:bg-brand-primary transition-colors flex items-center justify-center gap-2"
                  >
                    Xem chi tiết <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRegister(route)}
                    disabled={registeringRouteId === route.routeId || lockedByActivePass}
                    className="flex-1 py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {lockedByActivePass ? <Lock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    {lockedByActivePass
                      ? 'Khóa trong kỳ vé'
                      : registeringRouteId === route.routeId
                        ? 'Đang lưu...'
                        : isCurrent
                          ? 'Cập nhật trạm mặc định'
                          : 'Chọn làm tuyến mặc định'}
                  </button>
                </div>
                {lockedByActivePass && (
                  <p className="mt-3 text-xs font-bold text-brand-text/45">
                    Bạn có thể đổi sang tuyến này sau khi vé tháng hiện tại hết hiệu lực.
                  </p>
                )}
              </div>
            );
          })}

          {!filteredRoutes.length && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-brand-text/40 bg-white rounded-3xl border border-black/5">
              {isLoadingStops ? (
                <Loader2 className="w-16 h-16 mb-4 opacity-50 animate-spin" />
              ) : (
                <Map className="w-16 h-16 mb-4 opacity-50" />
              )}
              <p className="font-bold text-lg">
                {isLoadingStops
                  ? 'Đang tải trạm và tuyến được phép.'
                  : !hasAvailableStops
                  ? 'Trường chưa có tuyến được cấu hình.'
                  : hasSearched
                    ? 'Không tìm thấy tuyến phù hợp.'
                    : 'Chưa chọn trạm mặc định.'}
              </p>
              {isLoadingStops && (
                <p className="text-sm font-medium mt-2">Hệ thống đang kiểm tra tuyến đã liên kết với trường của bạn.</p>
              )}
              {!isLoadingStops && !hasSearched && hasAvailableStops && (
                <p className="text-sm font-medium mt-2">Chọn điểm lên/xuống mặc định để tìm tuyến thật từ hệ thống.</p>
              )}
              {!isLoadingStops && !hasAvailableStops && (
                <p className="text-sm font-medium mt-2 max-w-md text-center">
                  Hệ thống chỉ hiển thị tuyến đã liên kết với trường của sinh viên để tránh đăng ký sai phạm vi trợ giá.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StopSelect({ id, label, value, onChange, stops, disabled, disabledText = 'Đang tải trạm...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  const selectedStop = stops.find((stop) => String(stop.stopId) === String(value));

  const filteredStops = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return stops;

    return stops.filter((stop) => {
      return `${stop.stopName} ${stop.address || ''}`.toLowerCase().includes(keyword);
    });
  }, [query, stops]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const handleSelect = (stopId) => {
    onChange(String(stopId));
    setIsOpen(false);
    setQuery('');
  };

  const clearSelection = (event) => {
    event.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-black text-brand-text/40 uppercase mb-2" htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((open) => !open)}
        className="w-full min-h-12 bg-brand-surface border border-black/5 rounded-2xl py-3.5 pl-4 pr-12 text-left text-sm font-bold text-brand-text focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed relative"
      >
        <span className={selectedStop ? 'block truncate' : 'block truncate text-brand-text/70'}>
          {disabled ? disabledText : selectedStop?.stopName || 'Chọn trạm mặc định'}
        </span>
        <ChevronDown className={`absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {selectedStop && !disabled ? (
        <button
          type="button"
          aria-label="Xóa trạm đã chọn"
          onClick={clearSelection}
          className="absolute right-9 top-[2.15rem] z-10 rounded-full p-1 text-brand-text/40 hover:bg-black/5 hover:text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-black/5 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text/35" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tên trạm..."
                className="w-full rounded-xl bg-brand-surface py-2.5 pl-9 pr-3 text-sm font-semibold text-brand-text outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>

          <div role="listbox" className="max-h-72 overflow-y-auto custom-scrollbar py-1">
            {filteredStops.map((stop) => {
              const isSelected = String(stop.stopId) === String(value);

              return (
                <button
                  key={stop.stopId}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(stop.stopId)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-brand-primary/30 focus:bg-brand-primary/30 focus:outline-none ${isSelected ? 'bg-brand-secondary/15' : 'bg-white'}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-bold text-brand-text">{stop.stopName}</span>
                    {isSelected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-success" />}
                  </span>
                </button>
              );
            })}

            {!filteredStops.length && (
              <div className="px-4 py-6 text-center text-sm font-bold text-brand-text/45">
                Không tìm thấy trạm phù hợp.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getMeaningfulStops(stops) {
  const blockedNames = new Set(['dai hoc', 'ql1a', 'quoc te', 'sa']);

  return stops.filter((stop) => {
    const normalizedName = normalizeStopName(stop.stopName);
    if (!normalizedName) return false;
    if (blockedNames.has(normalizedName)) return false;
    if (normalizedName.length <= 2) return false;
    return true;
  });
}

function normalizeStopName(value = '') {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-2">
      <Icon className="w-5 h-5 text-brand-text/40" />
      <div>
        <div className="text-[10px] font-bold text-brand-text/40 uppercase">{label}</div>
        <div className="text-xs font-bold text-brand-text">{value}</div>
      </div>
    </div>
  );
}
