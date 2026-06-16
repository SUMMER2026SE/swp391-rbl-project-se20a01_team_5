"use client";

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, PieChart, TrendingUp, Users, Wallet } from 'lucide-react';
import { adminSystemService } from '@/services/adminSystem.service';

const roleLabels = {
  STUDENT: 'Sinh viên',
  DRIVER: 'Tài xế',
  CONDUCTOR: 'Phụ xe',
  DISPATCHER: 'Điều phối',
  ADMIN: 'Quản trị'
};

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminSystemService.getDashboard()
      .then(setDashboard)
      .catch((err) => setError(err.message || 'Không tải được dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  const maxRevenue = useMemo(() => {
    const values = dashboard?.revenueLast7Days?.map((item) => Number(item.amount)) ?? [];
    return Math.max(...values, 1);
  }, [dashboard]);

  const schoolTotal = useMemo(() => {
    return dashboard?.studentsBySchool?.reduce((sum, item) => sum + Number(item.total), 0) || 0;
  }, [dashboard]);

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
          <PieChart className="w-8 h-8 text-brand-primary" /> Tổng quan hệ thống
        </h1>
        <p className="text-brand-text/60 font-medium">Dashboard thống kê doanh thu, người dùng, chuyến xe và tình trạng xử lý theo thời gian.</p>
      </div>

      {error && <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">{error}</div>}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 shrink-0">
          <Kpi icon={Wallet} label="Doanh thu hôm nay" value={loading ? '...' : formatMoney(dashboard?.todayRevenue)} tone="success" />
          <Kpi icon={Users} label="Tổng sinh viên" value={loading ? '...' : dashboard?.studentCount ?? 0} tone="primary" />
          <Kpi icon={Users} label="Tổng tài xế" value={loading ? '...' : dashboard?.driverCount ?? 0} tone="secondary" />
          <Kpi icon={Activity} label="Chuyến hôm nay" value={loading ? '...' : dashboard?.todayTripCount ?? 0} dark />
          <Kpi icon={AlertTriangle} label="Case đang chờ" value={loading ? '...' : dashboard?.pendingCaseCount ?? 0} tone="danger" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col min-h-[360px]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-brand-primary" /> Doanh thu 7 ngày qua</h2>
                <p className="text-sm font-bold text-brand-text/50 mt-1">Đơn vị: VNĐ</p>
              </div>
            </div>
            <div className="flex-1 min-h-[250px] flex items-end justify-between gap-2 md:gap-4 pt-4 border-b-2 border-black/5 pb-2 relative">
              {loading && <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-brand-text/40">Đang tải doanh thu...</div>}
              {!loading && dashboard?.revenueLast7Days?.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-brand-text/40">Chưa có dữ liệu doanh thu.</div>}
              {dashboard?.revenueLast7Days?.map((data) => {
                const height = Math.max((Number(data.amount) / maxRevenue) * 100, Number(data.amount) > 0 ? 8 : 2);
                return (
                  <div key={data.day} className="flex-1 flex flex-col items-center gap-3 group relative z-10">
                    <div className="absolute -top-12 bg-black text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{formatMoney(data.amount)}</div>
                    <div className="w-full bg-brand-surface rounded-t-xl overflow-hidden flex items-end h-[200px]">
                      <div className="w-full bg-brand-primary transition-all duration-700 group-hover:bg-brand-text rounded-t-xl" style={{ height: `${height}%` }} />
                    </div>
                    <span className="text-sm font-bold text-brand-text/60">{new Date(data.day).toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
            <h2 className="text-xl font-bold mb-6">Cơ cấu người dùng</h2>
            <div className="grid gap-3 mb-8">
              {dashboard?.userRoleCounts?.map((item) => (
                <div key={item.role} className="flex items-center justify-between p-3 bg-brand-surface rounded-xl">
                  <span className="font-bold text-sm">{roleLabels[item.role] || item.role}</span>
                  <span className="font-black">{item.total}</span>
                </div>
              ))}
              {!loading && dashboard?.userRoleCounts?.length === 0 && <div className="text-sm font-bold text-brand-text/40">Chưa có dữ liệu người dùng.</div>}
            </div>

            <h2 className="text-xl font-bold mb-4">Sinh viên theo trường</h2>
            <div className="grid gap-3">
              {dashboard?.studentsBySchool?.map((item) => {
                const width = schoolTotal ? Math.max((Number(item.total) / schoolTotal) * 100, 5) : 0;
                return (
                  <div key={item.school} className="p-3 bg-brand-surface rounded-xl">
                    <div className="flex justify-between text-sm font-bold mb-2"><span>{item.school}</span><span>{item.total}</span></div>
                    <div className="h-2 rounded-full bg-white overflow-hidden"><div className="h-full bg-brand-primary" style={{ width: `${width}%` }} /></div>
                  </div>
                );
              })}
              {!loading && dashboard?.studentsBySchool?.length === 0 && <div className="text-sm font-bold text-brand-text/40">Chưa có dữ liệu trường.</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone = 'primary', dark = false }) {
  const toneClasses = {
    primary: 'bg-brand-primary/20 text-brand-primary',
    secondary: 'bg-brand-secondary/20 text-brand-text',
    success: 'bg-brand-success/20 text-brand-success',
    danger: 'bg-brand-danger/15 text-brand-danger'
  };
  return (
    <div className={`${dark ? 'bg-brand-text text-white' : 'bg-white text-brand-text'} rounded-3xl p-6 shadow-sm border border-black/5 relative overflow-hidden`}>
      <div className={`w-12 h-12 ${dark ? 'bg-white/10 text-brand-primary' : toneClasses[tone]} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className={`text-sm font-bold uppercase mb-1 ${dark ? 'text-white/50' : 'text-brand-text/50'}`}>{label}</div>
      <div className={`text-3xl font-black ${dark ? 'text-white' : 'text-brand-text'}`}>{value}</div>
    </div>
  );
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
}
