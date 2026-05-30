"use client";

import { useState } from 'react';
import { MapPin, Route, Plus, Edit2, Trash2, Search, ArrowRight, Save, X } from 'lucide-react';

const MOCK_ROUTES = [
  { id: 'T1', name: 'Tuyến 1: KTX ⇄ Bách Khoa', stopsCount: 8, active: true },
  { id: 'T2', name: 'Tuyến 2: Ngã Ba Huế ⇄ Kinh Tế', stopsCount: 12, active: true },
  { id: 'T3', name: 'Tuyến 3: Cầu Rồng ⇄ Ngoại Ngữ', stopsCount: 6, active: false },
];

const INITIAL_STOPS = [
  { id: 'S01', name: 'KTX Tập trung Đà Nẵng', timeFromStart: '0 phút', type: 'Điểm đầu' },
  { id: 'S02', name: 'Ngã Ba Huế', timeFromStart: '15 phút', type: 'Trạm dừng' },
  { id: 'S03', name: 'Đại học Bách Khoa', timeFromStart: '30 phút', type: 'Trạm dừng' },
  { id: 'S04', name: 'Đại học Sư Phạm', timeFromStart: '45 phút', type: 'Điểm cuối' },
];

export default function CoordinatorRoutesPage() {
  const [activeRoute, setActiveRoute] = useState(MOCK_ROUTES[0].id);
  const [stops, setStops] = useState(INITIAL_STOPS);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentStop, setCurrentStop] = useState(null);

  const openModal = (mode, stop = null) => {
    setModalMode(mode);
    setCurrentStop(stop || { name: '', timeFromStart: '', type: 'Trạm dừng' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStop(null);
  };

  const handleSaveStop = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newStop = { ...currentStop, id: `S0${stops.length + 1}` };
      setStops([...stops, newStop]);
    } else {
      setStops(stops.map(s => s.id === currentStop.id ? currentStop : s));
    }
    closeModal();
    alert(modalMode === 'add' ? 'Đã thêm trạm dừng mới!' : 'Cập nhật trạm dừng thành công!');
  };

  const handleDeleteStop = (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa trạm dừng này khỏi tuyến xe không?")) {
      setStops(stops.filter(s => s.id !== id));
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
            {MOCK_ROUTES.map(route => (
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
            ))}
          </div>
        </div>

        {/* Column 2 & 3: Stops Management */}
        <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
          
          <div className="p-6 md:p-8 border-b border-black/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-surface/30 shrink-0">
            <div>
              <h2 className="text-xl font-bold mb-1">Cấu hình Trạm dừng</h2>
              <p className="text-sm font-bold text-brand-text/60">
                Lộ trình chi tiết của {MOCK_ROUTES.find(r => r.id === activeRoute)?.name}
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
              <div className="absolute left-[39px] top-6 bottom-6 w-1 bg-brand-surface rounded-full z-0"></div>

              {stops.map((stop, index) => (
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
              ))}
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
                className="w-full py-4 mt-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl shadow-brand-text/20"
              >
                <Save className="w-5 h-5" /> {modalMode === 'add' ? 'Lưu Trạm Mới' : 'Cập Nhật'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
