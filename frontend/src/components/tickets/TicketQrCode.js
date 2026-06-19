"use client";

import { QRCodeSVG } from 'qrcode.react';

export default function TicketQrCode({
  value,
  compact = false,
  showCode = false,
  className = '',
  title = 'Mã QR vé tháng UniBus',
}) {
  if (!value) return null;

  const maxWidth = compact ? 'max-w-36' : 'max-w-56';

  return (
    <div className={`rounded-2xl bg-white border border-black/5 shadow-sm p-3 ${className}`}>
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
    </div>
  );
}
