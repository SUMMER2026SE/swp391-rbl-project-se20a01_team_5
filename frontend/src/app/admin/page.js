"use client";

import { PieChart, Users, Wallet, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  const revenueData = [];

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
          <PieChart className="w-8 h-8 text-brand-primary" /> Tổng quan Hệ thống
        </h1>
        <p className="text-brand-text/60 font-medium">Báo cáo thống kê, doanh thu và tình trạng hoạt động toàn hệ thống UniBus.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6 flex flex-col gap-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0">

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 relative overflow-hidden group hover:border-brand-primary/50 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-success/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 bg-brand-success/20 text-brand-success rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-brand-text/40 bg-brand-surface px-2 py-1 rounded-lg">
                API
              </div>
            </div>
            <div className="text-sm font-bold text-brand-text/50 uppercase mb-1 relative z-10">Doanh thu hôm nay</div>
            <div className="text-3xl font-black text-brand-text relative z-10">--</div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 relative overflow-hidden group hover:border-brand-primary/50 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-primary/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 bg-brand-primary/20 text-brand-primary rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-brand-text/40 bg-brand-surface px-2 py-1 rounded-lg">
                API
              </div>
            </div>
            <div className="text-sm font-bold text-brand-text/50 uppercase mb-1 relative z-10">Tổng Sinh viên</div>
            <div className="text-3xl font-black text-brand-text relative z-10">--</div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 relative overflow-hidden group hover:border-brand-primary/50 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-secondary/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 bg-brand-secondary/20 text-brand-text rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="text-sm font-bold text-brand-text/50 uppercase mb-1 relative z-10">Tổng Tài xế</div>
            <div className="text-3xl font-black text-brand-text relative z-10">--</div>
          </div>

          <div className="bg-brand-text rounded-3xl p-6 shadow-lg border border-black/5 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 text-brand-primary rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="text-sm font-bold text-white/50 uppercase mb-1 relative z-10">Lượt chạy hôm nay</div>
            <div className="text-3xl font-black text-white relative z-10">-- <span className="text-sm font-bold text-white/40">chuyến</span></div>
          </div>

        </div>

        <div className="flex flex-col xl:flex-row gap-6 shrink-0">

          {/* Main Chart: Revenue */}
          <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-primary" /> Doanh thu 7 ngày qua
                </h2>
                <p className="text-sm font-bold text-brand-text/50 mt-1">Đơn vị: VNĐ</p>
              </div>
              <select className="bg-brand-surface border-transparent rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:border-brand-primary cursor-pointer">
                <option>Tuần này</option>
                <option>Tuần trước</option>
                <option>Tháng này</option>
              </select>
            </div>

            {/* CSS Bar Chart Simulation */}
            <div className="flex-1 min-h-[250px] flex items-end justify-between gap-2 md:gap-4 pt-4 border-b-2 border-black/5 pb-2 relative">
              {/* Y-Axis lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
                <div className="border-t border-black/5 w-full h-0"></div>
                <div className="border-t border-black/5 w-full h-0"></div>
                <div className="border-t border-black/5 w-full h-0"></div>
                <div className="border-t border-black/5 w-full h-0"></div>
              </div>

              {revenueData.length === 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center text-center text-sm font-bold text-brand-text/40">
                  Chưa có dữ liệu doanh thu từ backend.
                </div>
              )}
              {revenueData.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group relative z-10">
                  {/* Tooltip */}
                  <div className="absolute -top-12 bg-black text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {data.amount.toLocaleString()} ₫
                  </div>
                  {/* Bar */}
                  <div className="w-full bg-brand-surface rounded-t-xl overflow-hidden flex items-end h-[200px]">
                    <div
                      className="w-full bg-brand-primary transition-all duration-1000 ease-out group-hover:bg-brand-text rounded-t-xl"
                      style={{ height: data.height }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-brand-text/60 group-hover:text-brand-text transition-colors">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Distribution Pie/Donut (CSS based) */}
          <div className="xl:w-1/3 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
            <h2 className="text-xl font-bold mb-8">Cơ cấu Sinh viên theo Trường</h2>

            <div className="flex-1 flex flex-col items-center justify-center">
              {/* CSS Donut Chart */}
              <div className="relative w-48 h-48 rounded-full mb-8" style={{ background: 'conic-gradient(#C6ED2C 0% 45%, #EBEFE8 45% 75%, #000000 75% 100%)' }}>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col shadow-inner">
                  <span className="text-xs font-bold text-brand-text/50 uppercase">Tổng SV</span>
                  <span className="text-2xl font-black">--</span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 bg-brand-surface rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-brand-primary"></span>
                    <span className="font-bold text-sm">Chưa có dữ liệu</span>
                  </div>
                  <span className="font-black">--</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-surface rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-brand-surface border border-black/20"></span>
                    <span className="font-bold text-sm">Chưa có dữ liệu</span>
                  </div>
                  <span className="font-black">--</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-surface rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-black"></span>
                    <span className="font-bold text-sm">Chưa có dữ liệu</span>
                  </div>
                  <span className="font-black">--</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
