"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Camera, CheckCircle2, Loader2, RefreshCw, Search, Ticket, XCircle, Zap, ZapOff } from 'lucide-react';
import { assistantTicketApi } from '@/services/api';

export default function ScannerPage() {
  const searchParams = useSearchParams();
  const requestedTripId = searchParams.get('tripId');
  const [flashOn, setFlashOn] = useState(false);
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const runningTrips = useMemo(() => (
    trips.filter((trip) => trip.status === 'RUNNING')
  ), [trips]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await assistantTicketApi.dashboard();
      const nextTrips = data?.trips || [];
      setTrips(nextTrips);
      setSelectedTripId((current) => {
        if (requestedTripId && nextTrips.some((trip) => String(trip.tripId) === String(requestedTripId))) return String(requestedTripId);
        if (current && nextTrips.some((trip) => String(trip.tripId) === String(current))) return current;
        const preferred = nextTrips.find((trip) => trip.status === 'RUNNING') || nextTrips[0];
        return preferred?.tripId ? String(preferred.tripId) : '';
      });
    } catch (err) {
      setError(err.message);
      setTrips([]);
      setSelectedTripId('');
    } finally {
      setIsLoading(false);
    }
  }, [requestedTripId]);

  useEffect(() => {
    const handle = window.setTimeout(loadDashboard, 0);
    return () => window.clearTimeout(handle);
  }, [loadDashboard]);

  const scanTicket = async () => {
    if (!selectedTripId || !qrCode.trim()) return;
    setIsScanning(true);
    setError('');
    setScanResult(null);
    try {
      const result = await assistantTicketApi.scan({
        tripId: Number(selectedTripId),
        qrCode: qrCode.trim(),
      });
      setScanResult(result);
      setQrCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Quét vé QR</h1>
          <p className="text-brand-text/60 font-medium">Kiểm tra mã vé thật và ghi nhận sinh viên lên xe.</p>
        </div>
        <button
          onClick={loadDashboard}
          className="px-5 py-3 rounded-2xl bg-white border border-black/5 font-bold text-sm hover:bg-brand-surface transition-colors flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Tải chuyến
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger flex items-center gap-2">
          <XCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {scanResult && (
        <div className="rounded-2xl border border-brand-success/20 bg-brand-success/10 p-4 text-sm font-bold text-brand-success flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 mt-0.5" />
          <div>
            <div>{scanResult.message}</div>
            <div className="mt-1 text-brand-text/70 font-medium">
              {scanResult.studentName} • {scanResult.studentCode} • {scanResult.routeName}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 min-h-0">
        <div className="bg-black rounded-3xl relative overflow-hidden flex items-center justify-center shadow-lg min-h-[420px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.12),_rgba(0,0,0,0.95))]" />
          <button
            type="button"
            onClick={() => setFlashOn((current) => !current)}
            className={`absolute top-5 right-5 z-10 p-4 rounded-2xl transition-all shadow-sm ${flashOn ? 'bg-brand-primary text-brand-text' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'}`}
          >
            {flashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
          </button>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white/80 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white/80 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white/80 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white/80 rounded-br-lg" />
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(251,192,45,0.8)] animate-pulse" />
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white font-bold text-sm bg-black/50 px-5 py-3 rounded-full backdrop-blur-md text-center max-w-[80%]">
            Trình duyệt chưa hỗ trợ tự quét QR. Hãy nhập mã QR thủ công ở khung bên phải.
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <Camera className="w-6 h-6 text-brand-text/60" /> Kiểm tra mã vé
            </h3>
            <p className="text-sm font-medium text-brand-text/60">Chọn chuyến xe đang chạy rồi nhập mã QR trên vé tháng của sinh viên.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <label className="block">
              <span className="block text-sm font-black text-brand-text/70 mb-2">Chuyến xe</span>
              <select
                value={selectedTripId}
                onChange={(event) => setSelectedTripId(event.target.value)}
                disabled={isLoading || trips.length === 0}
                className="w-full bg-brand-surface border border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-primary disabled:opacity-60"
              >
                <option value="">Chọn chuyến</option>
                {trips.map((trip) => (
                  <option key={trip.tripId} value={trip.tripId}>
                    TRIP-{trip.tripId} • {trip.routeName} • {trip.status}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-black text-brand-text/70 mb-2">Mã QR vé tháng</span>
              <input
                value={qrCode}
                onChange={(event) => setQrCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') scanTicket();
                }}
                placeholder="UB-MONTHLY-..."
                className="w-full bg-brand-surface border border-transparent rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-primary"
              />
            </label>

            <button
              type="button"
              onClick={scanTicket}
              disabled={isLoading || isScanning || !selectedTripId || !qrCode.trim()}
              className="w-full rounded-2xl bg-brand-text text-white py-4 font-black hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Kiểm tra vé
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Stat label="Chuyến hôm nay" value={trips.length} icon={Ticket} />
            <Stat label="Đang chạy" value={runningTrips.length} icon={CheckCircle2} />
          </div>

          {trips.length === 0 && !isLoading && (
            <div className="rounded-2xl bg-brand-warning/10 border border-brand-warning/20 p-4 text-sm font-bold text-brand-warning flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              Không có chuyến nào được phân công cho phụ xe hôm nay.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-brand-surface p-4 flex items-center justify-between">
      <div>
        <div className="text-2xl font-black text-brand-text">{value}</div>
        <div className="text-xs font-black uppercase text-brand-text/40 mt-1">{label}</div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
        <Icon className="w-5 h-5 text-brand-text/50" />
      </div>
    </div>
  );
}
