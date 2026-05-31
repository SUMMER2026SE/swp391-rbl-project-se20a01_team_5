"use client";

import { useState, useEffect } from 'react';
import { MapPin, Route, Plus, Edit2, Trash2, Search, ArrowRight, Save, X, Loader2 } from 'lucide-react';
import { coordinatorRoutesService } from '@/services/coordinatorRoutes.service';

export default function CoordinatorRoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [stops, setStops] = useState([]);
  
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentStop, setCurrentStop] = useState(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const data = await coordinatorRoutesService.getRoutes();
        setRoutes(data);
        if (data.length > 0) {
          setActiveRoute(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingRoutes(false);
      }
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    const fetchStops = async () => {
      if (!activeRoute) return;
      setIsLoadingStops(true);
      try {
        const data = await coordinatorRoutesService.getRouteStops(activeRoute);
        setStops(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingStops(false);
      }
    };
    fetchStops();
  }, [activeRoute]);

  const openModal = (mode, stop = null) => {
    setModalMode(mode);
    setCurrentStop(stop || { name: '', timeFromStart: '', type: 'Trạm dừng' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStop(null);
  };

  const handleSaveStop = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalMode === 'add') {
        const res = await coordinatorRoutesService.addStop(activeRoute, currentStop);
        setStops([...stops, res.data]);
        alert('Đã thêm trạm dừng mới!');
      } else {
        const res = await coordinatorRoutesService.updateStop(activeRoute, currentStop);
        setStops(stops.map(s => s.id === currentStop.id ? res.data : s));
        alert('Cập nhật trạm dừng thành công!');
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi lưu trạm.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStop = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa trạm dừng này khỏi tuyến xe không?")) {
      try {
        await coordinatorRoutesService.deleteStop(activeRoute, id);
        setStops(stops.filter(s => s.id !== id));
      } catch (err) {
        console.error(err);
        alert('Xóa thất bại');
      }
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <Route className="w-8 h-8 text-brand-primary" /> Quản lý Tuyến & Trạm dừng
          </h1>
          <p className="text-brand-text/60 font-medium">Điều chỉnh lộ trình và cập nhật danh sách các trạm dừng xe.</p>
        </div>
        <button className="bg-brand-text text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-5 h-5" /> Thêm Tuyến Mới
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-hidden pb-6">
        
        {/* Column 1: Routes List */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col overflow-hidden">
          <div className="relative mb-6 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tuyến xe..." 
              className="w-full bg-brand-surface border border-black/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
            {isLoadingRoutes ? (
              <div className="flex flex-col items-center justify-center h-full text-brand-text/50">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="font-bold">Đang tải...</p>
              </div>
            ) : (
              routes.map(route => (
                <div 
                  key={route.id}
                  onClick={() => setActiveRoute(route.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${activeRoute === route.id ? 'border-brand-primary bg-brand-primary/5 shadow-sm' : 'border-black/5 bg-white hover:border-brand-primary/30'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-brand-text">{route.name}</h3>
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${route.active ? 'bg-brand-success' : 'bg-brand-danger'}`}></div>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-brand-text/60">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {route.stopsCount} trạm</span>
                    {activeRoute === route.id && <ArrowRight className="w-4 h-4 text-brand-primary" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2 & 3: Stops Management */}
        <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
          
          <div className="p-6 md:p-8 border-b border-black/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-surface/30 shrink-0">
            <div>
              <h2 className="text-xl font-bold mb-1">Cấu hình Trạm dừng</h2>
              <p className="text-sm font-bold text-brand-text/60">
                Lộ trình chi tiết của {routes.find(r => r.id === activeRoute)?.name || ''}
              </p>
            </div>
            <button 
              onClick={() => openModal('add')}
              className="bg-brand-primary text-brand-text px-4 py-2.5 rounded-xl font-bold hover:bg-brand-primary/80 transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Thêm Trạm
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
            <div className="flex flex-col gap-4 relative">
              
              {/* Timeline Connector */}
              {!isLoadingStops && stops.length > 0 && (
                <div className="absolute left-[39px] top-6 bottom-6 w-1 bg-brand-surface rounded-full z-0"></div>
              )}

              {isLoadingStops ? (
                <div className="flex flex-col items-center justify-center py-12 text-brand-text/50">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="font-bold">Đang tải trạm dừng...</p>
                </div>
              ) : (
                stops.map((stop, index) => (
                  <div key={stop.id} className="relative z-10 flex gap-4 items-center group">
                    
                    {/* Timeline Node */}
                    <div className="w-20 font-bold text-brand-text/40 text-sm text-right shrink-0">
                      {stop.timeFromStart}
                    </div>
                    
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${stop.type.includes('Điểm') ? 'bg-brand-primary' : 'bg-brand-text/20'}`}>
                    </div>
  
                    {/* Stop Card */}
                    <div className="flex-1 border border-black/5 rounded-2xl p-4 bg-white flex justify-between items-center hover:border-brand-primary/30 transition-colors">
                      <div>
                        <h3 className="font-bold text-brand-text mb-1">{stop.name}</h3>
                        <div className="text-xs font-bold text-brand-text/50 uppercase">{stop.type}</div>
                      </div>
                      
                      {/* Action Buttons (Visible on hover) */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal('edit', stop)}
                          className="w-8 h-8 rounded-lg bg-brand-surface text-brand-text flex items-center justify-center hover:bg-brand-secondary hover:text-white transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStop(stop.id)}
                          className="w-8 h-8 rounded-lg bg-brand-surface text-brand-danger flex items-center justify-center hover:bg-brand-danger hover:text-white transition-colors"
                          title="Xóa trạm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
  
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal CRUD Trạm dừng */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={closeModal}
              className="absolute top-6 right-6 w-8 h-8 bg-brand-surface rounded-full flex items-center justify-center hover:bg-brand-danger/10 hover:text-brand-danger transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h2 className="text-2xl font-black mb-6">
              {modalMode === 'add' ? 'Thêm Trạm dừng mới' : 'Chỉnh sửa Trạm dừng'}
            </h2>

            <form onSubmit={handleSaveStop} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2">Tên trạm dừng</label>
                <input 
                  type="text" 
                  required
                  value={currentStop.name}
                  onChange={(e) => setCurrentStop({...currentStop, name: e.target.value})}
                  placeholder="VD: Trạm xe buýt Bệnh viện..."
                  className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-brand-text/70 mb-2">Loại trạm</label>
                  <select 
                    value={currentStop.type}
                    onChange={(e) => setCurrentStop({...currentStop, type: e.target.value})}
                    className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all appearance-none"
                  >
                    <option value="Điểm đầu">Điểm đầu</option>
                    <option value="Trạm dừng">Trạm dừng thường</option>
                    <option value="Điểm cuối">Điểm cuối</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-brand-text/70 mb-2">TG từ bến đi</label>
                  <input 
                    type="text" 
                    required
                    value={currentStop.timeFromStart}
                    onChange={(e) => setCurrentStop({...currentStop, timeFromStart: e.target.value})}
                    placeholder="VD: 15 phút"
                    className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full py-4 mt-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl shadow-brand-text/20 disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                {modalMode === 'add' ? 'Lưu Trạm Mới' : 'Cập Nhật'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
