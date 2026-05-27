"use client";

import BentoDashboardLayout from '@/components/layout/BentoDashboardLayout';
import { MapPin, QrCode, ShieldCheck, AlertTriangle, Phone } from 'lucide-react';

export default function AssistantLayout({ children }) {
  const menus = [
    { name: 'Chuyến phân công', href: '/assistant', icon: MapPin },
    { name: 'Quét vé QR', href: '/assistant/scanner', icon: QrCode },
    { name: 'Kiểm tra vé', href: '/assistant/verify-ticket', icon: ShieldCheck },
    { name: 'Hỗ trợ hành khách', href: '/assistant/support', icon: AlertTriangle },
    { name: 'Liên lạc nội bộ', href: '/assistant/contact', icon: Phone },
  ];

  return (
    <BentoDashboardLayout menuItems={menus} roleName="Phụ xe" profileHref="/assistant/profile">
      {children}
    </BentoDashboardLayout>
  );
}
