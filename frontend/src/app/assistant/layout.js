"use client";

import BentoDashboardLayout from '@/components/layout/BentoDashboardLayout';
import { AlertTriangle, Bell, MapPin, Phone, QrCode, ShieldCheck } from 'lucide-react';

export default function AssistantLayout({ children }) {
  const menus = [
    { name: 'Chuyến phân công', href: '/assistant', icon: MapPin },
    { name: 'Quét vé QR', href: '/assistant/scanner', icon: QrCode },
    { name: 'Kiểm tra vé', href: '/assistant/verify-ticket', icon: ShieldCheck },
    { name: 'Hỗ trợ hành khách', href: '/assistant/support', icon: AlertTriangle },
    { name: 'Thông báo', href: '/assistant/notifications', icon: Bell },
    { name: 'Liên lạc nội bộ', href: '/assistant/contact', icon: Phone },
  ];

  return (
    <BentoDashboardLayout menuItems={menus} roleName="Phụ xe" profileHref="/assistant/profile">
      {children}
    </BentoDashboardLayout>
  );
}
