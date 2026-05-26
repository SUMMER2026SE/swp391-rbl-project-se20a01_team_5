"use client";

import BentoDashboardLayout from '@/components/layout/BentoDashboardLayout';
import { LayoutDashboard, Map, Ticket, History, Bot } from 'lucide-react';

export default function StudentLayout({ children }) {
  const menus = [
    { name: 'Tổng quan', href: '/student', icon: LayoutDashboard },
    { name: 'Tuyến xe & Theo dõi', href: '/student/routes', icon: Map },
    { name: 'Vé & Thanh toán', href: '/student/passes', icon: Ticket },
    { name: 'Lịch sử chuyến đi', href: '/student/history', icon: History },
    { name: 'AI Trợ lý', href: '/student/ai-assistant', icon: Bot },
  ];

  return (
    <BentoDashboardLayout menuItems={menus} roleName="Sinh viên" profileHref="/student/profile">
      {children}
    </BentoDashboardLayout>
  );
}
