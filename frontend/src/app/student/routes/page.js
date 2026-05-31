"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Map, Clock, ArrowRight, BusFront, MapPin, Activity, Loader2, Info } from 'lucide-react';
import { routeService } from '@/services/route.service';

export default function StudentRoutesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setIsLoading(true);
        const res = await routeService.getRoutes();
        setRoutes(res.routes);
      } catch (err) {
        setError(err.message || 'Lỗi tải danh sách tuyến xe');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const filteredRoutes = routes.filter(route => 
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Danh sách Tuyến xe</h1>
          <p className="text-brand-text/60 font-medium">Tra cứu lộ trình và thời gian hoạt động của các tuyến UniBus.</p>
        </div>
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
          <input 
            type="text" 
            placeholder="Tìm theo tên tuyến, địa điểm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-black/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Routes Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-brand-text/40">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-bold text-lg">Đang tải tuyến xe...</p>
            </div>
          ) : error ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-brand-danger/60">
              <Info className="w-10 h-10 mb-4" />
              <p className="font-bold text-lg">{error}</p>
            </div>
          ) : (
            filteredRoutes.map((route) => (
              <div key={route.id} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 hover:shadow-md hover:border-brand-primary/30 transition-all group flex flex-col justify-between">
                
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <BusFront className="w-7 h-7 text-brand-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
                        {route.name}
                        {route.status === 'active' ? (
                          <span className="px-2 py-0.5 bg-brand-success/10 text-brand-success text-[10px] font-black uppercase tracking-wider rounded-md">Hoạt động</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-brand-danger/10 text-brand-danger text-[10px] font-black uppercase tracking-wider rounded-md">Bảo trì</span>
                        )}
                      </h2>
                      <p className="text-sm font-bold text-brand-text/60 mt-1">{route.path}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-2">
                    <Clock className="w-5 h-5 text-brand-text/40" />
                    <div>
                      <div className="text-[10px] font-bold text-brand-text/40 uppercase">Hoạt động</div>
                      <div className="text-xs font-bold text-brand-text">{route.time}</div>
                    </div>
                  </div>
                  <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-2">
                    <Activity className="w-5 h-5 text-brand-text/40" />
                    <div>
                      <div className="text-[10px] font-bold text-brand-text/40 uppercase">Tần suất</div>
                      <div className="text-xs font-bold text-brand-text">{route.frequency}</div>
                    </div>
                  </div>
                  <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-2">
                    <MapPin className="w-5 h-5 text-brand-text/40" />
                    <div>
                      <div className="text-[10px] font-bold text-brand-text/40 uppercase">Số Trạm</div>
                      <div className="text-xs font-bold text-brand-text">{route.stops} trạm</div>
                    </div>
                  </div>
                  <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-2">
                    <Map className="w-5 h-5 text-brand-text/40" />
                    <div>
                      <div className="text-[10px] font-bold text-brand-text/40 uppercase">Xe đang chạy</div>
                      <div className="text-xs font-bold text-brand-text">{route.activeBuses} xe</div>
                    </div>
                  </div>
                </div>

                <Link href={`/student/routes/${route.id}`} className="w-full py-4 bg-brand-surface text-brand-text font-bold rounded-2xl hover:bg-brand-primary hover:text-brand-text transition-colors flex items-center justify-center gap-2">
                  Xem Lộ Trình Chi Tiết <ArrowRight className="w-5 h-5" />
                </Link>

              </div>
            ))
          )}

          {!isLoading && !error && filteredRoutes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-brand-text/40">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-bold text-lg">Không tìm thấy tuyến xe nào phù hợp.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
