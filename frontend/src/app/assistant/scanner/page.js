"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, QrCode, RefreshCw, Search, XCircle } from 'lucide-react';
import { conductorApi } from '@/services/api';

function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function ScannerPage() {
  const videoRef = useRef(null);
  const lastAutoScanRef = useRef({ code: '', at: 0 });
  const [serviceDate, setServiceDate] = useState(todayInput());
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await conductorApi.listTrips(serviceDate);
      setTrips(data || []);
      setTripId((current) => current || data?.find((trip) => trip.tripId)?.tripId || '');
    } catch (err) {
      setError(err.message);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, [serviceDate]);

  useEffect(() => {
    const handle = window.setTimeout(loadTrips, 0);
    return () => window.clearTimeout(handle);
  }, [loadTrips]);

  useEffect(() => {
    let stream;
    let statusHandle;
    let isCancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      statusHandle = window.setTimeout(() => setCameraStatus('Trình duyệt không hỗ trợ camera. Hãy nhập mã QR thủ công.'), 0);
      return () => window.clearTimeout(statusHandle);
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((mediaStream) => {
        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setCameraStatus('Đưa mã QR vào khung quét hoặc nhập mã thủ công.');
      })
      .catch(() => setCameraStatus('Không mở được camera. Hãy nhập mã QR thủ công.'));

    return () => {
      isCancelled = true;
      window.clearTimeout(statusHandle);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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

  useEffect(() => {
    if (!tripId) return undefined;
    if (!('BarcodeDetector' in window)) {
      const handle = window.setTimeout(() => {
        setCameraStatus('Trình duyệt chưa hỗ trợ tự quét QR. Hãy nhập mã QR thủ công.');
      }, 0);
      return () => window.clearTimeout(handle);
    }

    let isActive = true;
    let frameId;
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

    const scanFrame = async () => {
      const video = videoRef.current;
      if (isActive && video?.readyState >= 2 && !isScanning) {
        try {
          const [barcode] = await detector.detect(video);
          const code = barcode?.rawValue?.trim();
          const now = Date.now();
          if (code && (lastAutoScanRef.current.code !== code || now - lastAutoScanRef.current.at > 3500)) {
            lastAutoScanRef.current = { code, at: now };
            setQrCode(code);
            scanTicket(code, { auto: true });
          }
        } catch {
          // Keep manual input available if native detection fails on a frame.
        }
      }
      if (isActive) {
        frameId = window.requestAnimationFrame(scanFrame);
      }
    };

    frameId = window.requestAnimationFrame(scanFrame);
    return () => {
      isActive = false;
      window.cancelAnimationFrame(frameId);
    };
  }, [isScanning, scanTicket, tripId]);

  const handleScan = async (event) => {
    event.preventDefault();
    scanTicket(qrCode);
  };

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Quét vé QR</h1>
          <p className="text-brand-text/60 font-medium">Kiểm tra mã vé thật và ghi nhận sinh viên lên xe.</p>
        </div>
        <button onClick={loadTrips} className="px-4 py-3 bg-white border border-black/5 rounded-2xl hover:bg-brand-surface flex items-center gap-2 font-bold">
          <RefreshCw className="w-5 h-5" /> Tải chuyến
        </button>
      </div>

      {(error || scanResult) && (
        <div className={`mb-4 p-4 rounded-2xl text-sm font-bold border ${error || scanResult?.valid === false ? 'bg-brand-danger/10 border-brand-danger/20 text-brand-danger' : 'bg-brand-success/10 border-brand-success/20 text-brand-success'}`}>
          {error || scanResult?.message}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full min-h-0">
        <div className="flex-1 bg-black rounded-3xl relative overflow-hidden flex items-center justify-center shadow-lg">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-lg"></div>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 font-medium text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-md text-center">
            {cameraStatus}
          </div>
        </div>

        <div className="w-full lg:w-96 flex flex-col gap-6">
          <form onSubmit={handleScan} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-5">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <QrCode className="w-5 h-5 text-brand-text/60" /> Kiểm tra mã vé
            </h3>

            <label className="block">
              <span className="block text-sm font-bold text-brand-text/70 mb-2">Chuyến xe</span>
              <select
                value={tripId}
                onChange={(event) => setTripId(event.target.value)}
                disabled={isLoading}
                className="w-full bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary"
              >
                <option value="">Chọn chuyến</option>
                {trips.filter((trip) => trip.tripId).map((trip) => (
                  <option key={trip.tripId} value={trip.tripId}>
                    TRIP-{trip.tripId} • {trip.routeName} • {trip.status}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-brand-text/70 mb-2">Mã QR vé</span>
              <input
                type="text"
                value={qrCode}
                onChange={(event) => setQrCode(event.target.value)}
                placeholder="Dán hoặc nhập mã QR"
                className="w-full bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-mono font-bold focus:outline-none focus:border-brand-primary"
              />
            </label>

            <button
              type="submit"
              disabled={isScanning || !tripId || !qrCode.trim()}
              className="w-full py-4 rounded-2xl bg-brand-text text-white font-black hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Kiểm tra vé
            </button>
          </form>

          {scanResult?.ticket && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
              <div className="flex items-center gap-3 mb-4">
                {scanResult.valid ? <CheckCircle2 className="w-6 h-6 text-brand-success" /> : <XCircle className="w-6 h-6 text-brand-danger" />}
                <h3 className="font-black">Kết quả vé</h3>
              </div>
              <div className="space-y-3 text-sm font-bold">
                <Info label="Sinh viên" value={scanResult.ticket.studentName} />
                <Info label="MSSV" value={scanResult.ticket.studentCode} />
                <Info label="Tuyến" value={scanResult.ticket.routeName} />
                <Info label="Trạng thái" value={scanResult.ticket.status} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-brand-surface p-3">
      <div className="text-[10px] uppercase text-brand-text/40 font-black">{label}</div>
      <div className="text-brand-text break-words">{value || '--'}</div>
    </div>
  );
}
