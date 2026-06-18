"use client";

import { QRCodeSVG } from 'qrcode.react';

export default function TicketQrCode({ value, title = 'Monthly pass QR code', showCode = false, className = '' }) {
  const qrValue = value || 'UNIBUS-MONTHLY-PASS';

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="aspect-square w-full rounded-2xl bg-white p-4 shadow-sm flex items-center justify-center">
        <QRCodeSVG
          value={qrValue}
          title={title}
          level="M"
          includeMargin
          bgColor="#FFFFFF"
          fgColor="#0B1220"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {showCode && (
        <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 font-mono text-xs text-white break-all">
          {qrValue}
        </div>
      )}
    </div>
  );
}
