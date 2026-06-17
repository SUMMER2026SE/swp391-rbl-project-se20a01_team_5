"use client";

import BentoDashboardLayout from '@/components/layout/BentoDashboardLayout';
import { Clock, Navigation, AlertTriangle } from 'lucide-react';

export default function DriverLayout({ children }) {
  const menus = [
    { name: 'Tổng quan', href: '/driver', icon: Clock },
    { name: 'Chuyến hiện tại', href: '/driver/trips', icon: Navigation },
    { name: 'Điều phối viên', href: '/driver/contact', icon: AlertTriangle },
  ];

  return (
    <BentoDashboardLayout menuItems={menus} roleName="Tài xế" profileHref="/driver/profile">
      {children}
    </BentoDashboardLayout>
  );
}
