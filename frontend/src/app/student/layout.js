"use client";

import BentoDashboardLayout from '@/components/layout/BentoDashboardLayout';
import { LayoutDashboard, Map, Ticket, History, Bot, Wallet, BadgeCheck, Bell, MessageSquare } from 'lucide-react';

export default function StudentLayout({ children }) {
  const menus = [
    { name: 'Tổng quan', href: '/student', icon: LayoutDashboard },
    { name: 'Xác minh sinh viên', href: '/student/verify', icon: BadgeCheck },
    { name: 'Tuyến xe & Theo dõi', href: '/student/routes', icon: Map },
    { name: 'Ví cá nhân', href: '/student/wallet', icon: Wallet },
    { name: 'Vé & Thanh toán', href: '/student/passes', icon: Ticket },
    { name: 'Lịch sử chuyến đi', href: '/student/history', icon: History },
    { name: 'Thông báo', href: '/student/notifications', icon: Bell },
    { name: 'Phản hồi chuyến xe', href: '/student/feedback', icon: MessageSquare },
    { name: 'AI Trợ lý', href: '/student/ai-assistant', icon: Bot },
  ];

  return (
    <BentoDashboardLayout menuItems={menus} roleName="Sinh viên" profileHref="/student/profile">
      {children}
    </BentoDashboardLayout>
  );
}
