"use client";

import BentoDashboardLayout from '@/components/layout/BentoDashboardLayout';
import { AlertTriangle, BadgeCheck, PieChart, Settings, Users } from 'lucide-react';

export default function AdminLayout({ children }) {
  const menus = [
    { name: 'Tổng quan hệ thống', href: '/admin', icon: PieChart },
    { name: 'Quản lý tài khoản', href: '/admin/users', icon: Users },
    { name: 'Xác minh sinh viên', href: '/admin/student-verifications', icon: BadgeCheck },
    { name: 'Khiếu nại & Vi phạm', href: '/admin/reports', icon: AlertTriangle },
    { name: 'Cấu hình & Thông báo', href: '/admin/settings', icon: Settings },
  ];

  return (
    <BentoDashboardLayout menuItems={menus} roleName="Quản trị viên" profileHref="/admin/profile">
      {children}
    </BentoDashboardLayout>
  );
}
