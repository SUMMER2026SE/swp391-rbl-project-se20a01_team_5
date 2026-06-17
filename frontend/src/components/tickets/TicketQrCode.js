"use client";

import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function TicketQrCode({
  value,
  compact = false,
  showCode = false,
  className = '',
  title = 'Mã QR vé tháng UniBus',
}) {
  const maxWidth = compact ? 'max-w-36' : 'max-w-56';

  return (
    <div className={`rounded-2xl bg-white border border-black/5 shadow-sm p-3 ${className}`}>
      {value ? (
        <div className="flex flex-col items-center gap-3">
          <div className={`w-full ${maxWidth} aspect-square rounded-xl bg-white p-2`}>
            <QRCodeSVG
              value={value}
              title={title}
              level="M"
              includeMargin
              bgColor="#FFFFFF"
              fgColor="#0B1220"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          {showCode && (
            <div className="w-full rounded-xl bg-brand-surface px-3 py-2 text-center font-mono text-[11px] font-black text-brand-text break-all">
              {value}
            </div>
          )}
        </div>
      ) : (
        <div className={`${compact ? 'min-h-32' : 'min-h-48'} flex flex-col items-center justify-center text-center text-brand-text/50`}>
          <QrCode className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} mb-3`} strokeWidth={1.8} />
          <p className="text-sm font-black text-brand-text">Chưa có mã QR</p>
          <p className="mt-1 max-w-40 text-xs font-bold leading-relaxed">Thanh toán vé tháng để hệ thống cấp QR.</p>
        </div>
      )}
    </div>
  );
}
