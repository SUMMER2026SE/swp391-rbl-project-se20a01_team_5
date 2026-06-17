"use client";

import BentoDashboardLayout from '@/components/layout/BentoDashboardLayout';
import { MapPin, QrCode, ShieldCheck } from 'lucide-react';

export default function AssistantLayout({ children }) {
  const menus = [
    { name: 'Chuyến phân công', href: '/assistant', icon: MapPin },
    { name: 'Quét vé QR', href: '/assistant/scanner', icon: QrCode },
    { name: 'Kiểm tra vé', href: '/assistant/verify-ticket', icon: ShieldCheck },
  ];

  return (
    <BentoDashboardLayout menuItems={menus} roleName="Phụ xe" profileHref="/assistant/profile">
      {children}
    </BentoDashboardLayout>
  );
}
