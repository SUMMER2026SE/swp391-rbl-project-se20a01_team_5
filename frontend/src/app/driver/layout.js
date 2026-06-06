"use client";

import BentoDashboardLayout from '@/components/layout/BentoDashboardLayout';
import { AlertTriangle, Clock, Navigation } from 'lucide-react';

export default function DriverLayout({ children }) {
  const menus = [
    { name: 'Tong quan', href: '/driver', icon: Clock },
    { name: 'Chuyen hien tai', href: '/driver/trips', icon: Navigation },
    { name: 'Dieu phoi vien', href: '/driver/contact', icon: AlertTriangle },
  ];

  return (
    <BentoDashboardLayout menuItems={menus} roleName="Tai xe" profileHref="/driver/profile">
      {children}
    </BentoDashboardLayout>
  );
}
