"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle2, Loader2, QrCode, RefreshCw, Repeat2, Search, XCircle } from 'lucide-react';
import { conductorApi } from '@/services/api';

function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function tripLabel(trip) {
  if (!trip) return 'Chọn chuyến';
  const time = trip.departureTime?.slice(0, 5) || '--:--';
  return `${time} • TRIP-${trip.tripId} • ${trip.routeName} • ${trip.status}`;
}

export default function ScannerPage() {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const lastAutoScanRef = useRef({ code: '', at: 0 });
  const [queryTripId] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('tripId') || '';
  });
  const [serviceDate, setServiceDate] = useState(todayInput());
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState(queryTripId);
  const [qrCode, setQrCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('Chọn chuyến rồi bật camera để quét QR.');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const scanReadyTrips = useMemo(() => trips.filter((trip) => trip.tripId), [trips]);
  const selectedTrip = useMemo(
    () => scanReadyTrips.find((trip) => String(trip.tripId) === String(tripId)) || null,
    [scanReadyTrips, tripId],
  );

  const disposeScanner = useCallback(() => {
    scannerRef.current?.stop();
    scannerRef.current?.destroy();
    scannerRef.current = null;
  }, []);

  const stopCamera = useCallback(() => {
    disposeScanner();
    setCameraActive(false);
  }, [disposeScanner]);

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await conductorApi.listTrips(serviceDate);
      const nextTrips = data || [];
      const scanTrips = nextTrips.filter((trip) => trip.tripId);
      setTrips(nextTrips);
      setCameraStatus(scanTrips.length ? 'Sẵn sàng bật camera hoặc nhập mã QR thủ công.' : 'Chọn chuyến rồi bật camera để quét QR.');
      setTripId((current) => {
        if (current && scanTrips.some((trip) => String(trip.tripId) === String(current))) {
          return current;
        }
        if (queryTripId && scanTrips.some((trip) => String(trip.tripId) === String(queryTripId))) {
          return queryTripId;
        }
        return scanTrips[0]?.tripId || '';
      });
    } catch (err) {
      setError(err.message);
      setTrips([]);
      setTripId('');
      setCameraStatus('Không tải được chuyến. Hãy thử tải lại hoặc nhập mã sau khi có chuyến.');
    } finally {
      setIsLoading(false);
    }
  }, [queryTripId, serviceDate]);

  useEffect(() => {
    const handle = window.setTimeout(loadTrips, 0);
    return () => window.clearTimeout(handle);
  }, [loadTrips]);

  useEffect(() => () => disposeScanner(), [disposeScanner]);

  const scanTicket = useCallback(async (rawCode, { auto = false } = {}) => {
    const normalizedCode = rawCode.trim();
    if (!tripId || !normalizedCode || isScanning) return;
    setIsScanning(true);
    setError('');
    setScanResult(null);
    if (auto) {
      setCameraStatus('Đang kiểm tra mã QR...');
    }
    try {
      const result = await conductorApi.scanTicket({ tripId: Number(tripId), qrCode: normalizedCode });
      setScanResult(result);
      if (result?.valid) {
        setQrCode('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScanning(false);
      if (auto) {
        setCameraStatus('Đưa mã QR tiếp theo vào khung quét.');
      }
    }
  }, [isScanning, tripId]);

  const startCamera = useCallback(async (preferredFacing = cameraFacing) => {
    if (!tripId || !videoRef.current || scannerRef.current) return;
    setError('');
    setCameraStatus('Đang mở camera...');
    try {
      const { default: QrScanner } = await import('qr-scanner');
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          const code = (result?.data || result || '').trim();
          const now = Date.now();
          if (!code || (lastAutoScanRef.current.code === code && now - lastAutoScanRef.current.at <= 3500)) {
            return;
          }
          lastAutoScanRef.current = { code, at: now };
          setQrCode(code);
          scanTicket(code, { auto: true });
        },
        {
          preferredCamera: preferredFacing,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        },
      );
      scannerRef.current = scanner;
      await scanner.start();
      setCameraActive(true);
      setCameraStatus('Đưa mã QR vào khung quét hoặc nhập mã thủ công.');
    } catch {
      scannerRef.current?.destroy();
      scannerRef.current = null;
      setCameraActive(false);
      setCameraStatus('Không mở được camera. Hãy nhập mã QR thủ công.');
    }
  }, [cameraFacing, scanTicket, tripId]);

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    const shouldRestart = Boolean(scannerRef.current);
    stopCamera();
    if (shouldRestart) {
      window.setTimeout(() => startCamera(nextFacing), 150);
    }
  };

  const handleTripChange = (value) => {
    stopCamera();
    setTripId(value);
    setScanResult(null);
    setError('');
    setCameraStatus(value ? 'Sẵn sàng bật camera hoặc nhập mã QR thủ công.' : 'Chọn chuyến rồi bật camera để quét QR.');
  };

  const handleScan = async (event) => {
    event.preventDefault();
    scanTicket(qrCode);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-1 font-sans">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-brand-text md:text-3xl">Quét vé QR</h1>
            <p className="text-sm font-medium text-brand-text/60 md:text-base">Chọn chuyến được phân công trước khi quét vé.</p>
          </div>
          <button
            type="button"
            onClick={loadTrips}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white px-4 py-3 font-bold transition-colors hover:bg-brand-surface"
          >
            <RefreshCw className="h-5 w-5" /> Tải chuyến
          </button>
        </div>

        <section className="m3-surface rounded-[2rem] p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[14rem_1fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-brand-text/70">Ngày chạy</span>
              <input
                type="date"
                value={serviceDate}
                onChange={(event) => {
                  stopCamera();
                  setServiceDate(event.target.value);
                }}
                className="m3-focus-ring min-h-14 w-full rounded-[var(--md-sys-shape-corner-large)] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] px-4 py-3 text-base font-bold outline-none transition-colors focus:border-[var(--md-sys-color-primary)] focus:bg-[var(--md-sys-color-surface-container-lowest)]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-brand-text/70">Chuyến xe</span>
              <select
                value={tripId}
                onChange={(event) => handleTripChange(event.target.value)}
                disabled={isLoading || !scanReadyTrips.length}
                className="m3-focus-ring min-h-14 w-full rounded-[var(--md-sys-shape-corner-large)] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] px-4 py-3 text-base font-bold outline-none transition-colors focus:border-[var(--md-sys-color-primary)] focus:bg-[var(--md-sys-color-surface-container-lowest)] disabled:opacity-60"
              >
                <option value="">{isLoading ? 'Đang tải chuyến...' : 'Chọn chuyến để quét vé'}</option>
                {scanReadyTrips.map((trip) => (
                  <option key={trip.tripId} value={trip.tripId}>
                    {tripLabel(trip)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!isLoading && !scanReadyTrips.length && (
            <div className="mt-4 rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">
              Chưa có chuyến được phân công cho ngày này. Vui lòng kiểm tra lịch phân công hoặc tải lại sau khi điều phối tạo chuyến.
            </div>
          )}

          {selectedTrip && (
            <div className="mt-4 flex flex-col gap-2 rounded-[1.5rem] bg-[var(--md-sys-color-primary-container)] p-4 text-sm font-bold text-[var(--md-sys-color-on-primary-container)] md:flex-row md:items-center md:justify-between">
              <span>{selectedTrip.routeName}</span>
              <span className="font-mono text-brand-text">TRIP-{selectedTrip.tripId} • {selectedTrip.status}</span>
            </div>
          )}
        </section>

        {(error || scanResult) && (
          <div className={`rounded-2xl border p-4 text-sm font-bold ${error || scanResult?.valid === false ? 'border-brand-danger/20 bg-brand-danger/10 text-brand-danger' : 'border-brand-success/20 bg-brand-success/10 text-brand-success'}`}>
            {error || scanResult?.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <section className="overflow-hidden rounded-[2rem] border border-[var(--md-sys-color-outline-variant)] bg-black shadow-[var(--md-sys-elevation-2)]">
            <div className="relative aspect-[3/4] w-full md:aspect-video xl:max-h-[34rem]">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black text-center text-white">
                  <QrCode className="h-16 w-16 text-white/70" />
                  <div className="max-w-xs px-6">
                    <p className="text-lg font-black">Camera chưa bật</p>
                    <p className="mt-2 text-sm font-medium text-white/65">{cameraStatus}</p>
                  </div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-56 w-56 sm:h-72 sm:w-72">
                  <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-white/85" />
                  <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-white/85" />
                  <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-white/85" />
                  <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-white/85" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/60 px-4 py-3 text-center text-sm font-bold text-white/85 backdrop-blur-md">
                {cameraStatus}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 bg-[var(--md-sys-color-surface-container-lowest)] p-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={startCamera}
                disabled={!tripId || cameraActive}
                className="m3-state-layer flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--md-sys-color-primary)] px-4 py-3 font-black text-[var(--md-sys-color-on-primary)] transition-colors disabled:opacity-50"
              >
                <Camera className="h-5 w-5" /> Bật camera
              </button>
              <button
                type="button"
                onClick={stopCamera}
                disabled={!cameraActive}
                className="m3-state-layer flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-secondary-container)] px-4 py-3 font-bold text-[var(--md-sys-color-on-secondary-container)] transition-colors disabled:opacity-50"
              >
                <CameraOff className="h-5 w-5" /> Tắt camera
              </button>
              <button
                type="button"
                onClick={toggleCameraFacing}
                disabled={!tripId}
                className="m3-state-layer flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-secondary-container)] px-4 py-3 font-bold text-[var(--md-sys-color-on-secondary-container)] transition-colors disabled:opacity-50"
              >
                <Repeat2 className="h-5 w-5" /> Đổi camera
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <form onSubmit={handleScan} className="m3-surface rounded-[2rem] p-5 md:p-6">
              <h3 className="mb-5 flex items-center gap-2 text-xl font-bold">
                <QrCode className="h-5 w-5 text-brand-text/60" /> Nhập mã thủ công
              </h3>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-brand-text/70">Mã QR vé</span>
                <input
                  type="text"
                  value={qrCode}
                  onChange={(event) => setQrCode(event.target.value)}
                  placeholder="Dán hoặc nhập mã QR"
                  className="m3-focus-ring min-h-14 w-full rounded-[var(--md-sys-shape-corner-large)] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] p-4 font-mono text-base font-bold outline-none transition-colors focus:border-[var(--md-sys-color-primary)] focus:bg-[var(--md-sys-color-surface-container-lowest)]"
                />
              </label>

              <button
                type="submit"
                disabled={isScanning || !tripId || !qrCode.trim()}
                className="m3-state-layer mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--md-sys-color-primary)] px-4 py-4 font-black text-[var(--md-sys-color-on-primary)] transition-colors disabled:opacity-60"
              >
                {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                Kiểm tra vé
              </button>
            </form>

            {scanResult?.ticket && (
              <div className="m3-surface rounded-[2rem] p-5 md:p-6">
                <div className="mb-4 flex items-center gap-3">
                  {scanResult.valid ? <CheckCircle2 className="h-6 w-6 text-brand-success" /> : <XCircle className="h-6 w-6 text-brand-danger" />}
                  <h3 className="font-black">Kết quả vé</h3>
                </div>
                <div className="space-y-3 text-sm font-bold">
                  <Info label="Sinh viên" value={scanResult.ticket.studentName} />
                  <Info label="MSSV" value={scanResult.ticket.studentCode} />
                  <Info label="Tuyến" value={scanResult.ticket.routeName} />
                  <Info label="Trạng thái" value={scanResult.ticket.status} />
                  <Info label="Lần quét gần nhất" value={formatDateTime(scanResult.ticket.lastScannedAt)} />
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-brand-surface p-3">
      <div className="text-[10px] font-black uppercase text-brand-text/40">{label}</div>
      <div className="break-words text-brand-text">{value || '--'}</div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}
