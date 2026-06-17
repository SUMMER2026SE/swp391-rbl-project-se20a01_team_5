"use client";

import BentoDashboardLayout from '@/components/layout/BentoDashboardLayout';
import { Activity, CalendarDays, MessageSquare } from 'lucide-react';

export default function CoordinatorLayout({ children }) {
  const menus = [
    { name: 'Giám sát trực tuyến', href: '/coordinator', icon: Activity },
    { name: 'Lịch trình & Phân công', href: '/coordinator/schedules', icon: CalendarDays },
    { name: 'Phản hồi & Thông báo', href: '/coordinator/feedback', icon: MessageSquare },
  ];

  return (
    <BentoDashboardLayout menuItems={menus} roleName="Điều phối viên" profileHref="/coordinator/profile">
      {children}
    </BentoDashboardLayout>
  );
}
