"use client";

import { useState, useEffect } from 'react';
import { CalendarDays, Clock, Map, Users, BusFront, CheckCircle2, AlertCircle, ChevronDown, Save, Loader2, Info } from 'lucide-react';
import { scheduleService } from '@/services/schedule.service';

export default function CoordinatorSchedulesPage() {
  const [shifts, setShifts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await scheduleService.getScheduleData();
        setDrivers(data.drivers);
        setBuses(data.buses);
        setShifts(data.shifts);
      } catch (err) {
        setError(err.message || 'Lỗi tải dữ liệu phân công');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssign = (shiftId, field, value) => {
    setShifts(shifts.map(shift => {
      if (shift.id === shiftId) {
        const updatedShift = { ...shift, [field]: value };
        // Check if both driver and bus are assigned
        if (updatedShift.driver && updatedShift.bus) {
          updatedShift.status = 'assigned';
        } else {
          updatedShift.status = 'unassigned';
        }
        return updatedShift;
      }
      return shift;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await scheduleService.saveShifts(shifts);
      alert('Đã lưu lịch phân công thành công!');
    } catch (err) {
      alert('Lỗi lưu phân công: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const availableDrivers = drivers.filter(d => d.status === 'available').length;
  const availableBuses = buses.filter(b => b.status === 'available').length;

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-brand-primary" /> Phân công & Lịch trình
          </h1>
          <p className="text-brand-text/60 font-medium">Sắp xếp ca chạy, gán Tài xế và Xe Bus cho từng tuyến.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input type="date" className="bg-white border border-black/5 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-brand-primary shadow-sm" defaultValue="2026-05-25" />
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-text text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
          >
            <Save className="w-5 h-5" /> {isSaving ? 'Đang lưu...' : 'Lưu Phân Công'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 overflow-hidden pb-6">
        
        {/* Main Board Area (Spans 3 cols) */}
        <div className="xl:col-span-3 bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
          
          <div className="p-6 border-b border-black/5 flex justify-between items-center bg-brand-surface/30">
            <h2 className="text-xl font-bold">Bảng Phân Công Tuyến</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-success bg-brand-success/10 px-3 py-1 rounded-md">
                <CheckCircle2 className="w-4 h-4" /> Đã gán: {shifts.filter(s => s.status === 'assigned').length}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-brand-danger bg-brand-danger/10 px-3 py-1 rounded-md">
                <AlertCircle className="w-4 h-4" /> Trống: {shifts.filter(s => s.status === 'unassigned').length}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-brand-text/40">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="font-bold text-lg">Đang tải lịch trình...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-brand-danger/60">
                  <Info className="w-10 h-10 mb-4" />
                  <p className="font-bold text-lg">{error}</p>
                </div>
              ) : shifts.map(shift => (
                <div key={shift.id} className={`border rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center gap-6 transition-colors ${shift.status === 'unassigned' ? 'border-brand-danger/30 bg-brand-danger/5' : 'border-black/5 hover:border-brand-primary/50'}`}>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-black text-lg">{shift.id}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${shift.status === 'assigned' ? 'bg-brand-success text-white' : 'bg-brand-danger text-white'}`}>
                        {shift.status === 'assigned' ? 'Đã phân công' : 'Cần phân công'}
                      </span>
                    </div>
                    <div className="font-bold text-brand-text mb-1 flex items-center gap-2">
                      <Map className="w-4 h-4 text-brand-primary" /> {shift.route}
                    </div>
                    <div className="text-sm font-bold text-brand-text/60 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {shift.time}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 xl:w-1/2">
                    {/* Driver Selection */}
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-brand-text/50 uppercase mb-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Chọn Tài xế
                      </label>
                      <div className="relative">
                        <select 
                          value={shift.driver}
                          onChange={(e) => handleAssign(shift.id, 'driver', e.target.value)}
                          className={`w-full appearance-none rounded-xl p-3 pr-10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/50 border transition-colors ${!shift.driver ? 'bg-white border-brand-danger/50 text-brand-danger' : 'bg-brand-surface border-transparent text-brand-text'}`}
                        >
                          <option value="">-- Chưa gán --</option>
                          {drivers.map(d => (
                            <option key={d.id} value={d.id} disabled={d.status !== 'available' && shift.driver !== d.id}>
                              {d.name} ({d.id}) {d.status !== 'available' && '- Bận'}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40 pointer-events-none" />
                      </div>
                    </div>

                    {/* Bus Selection */}
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-brand-text/50 uppercase mb-1 flex items-center gap-1">
                        <BusFront className="w-3.5 h-3.5" /> Chọn Xe Bus
                      </label>
                      <div className="relative">
                        <select 
                          value={shift.bus}
                          onChange={(e) => handleAssign(shift.id, 'bus', e.target.value)}
                          className={`w-full appearance-none rounded-xl p-3 pr-10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/50 border transition-colors ${!shift.bus ? 'bg-white border-brand-danger/50 text-brand-danger' : 'bg-brand-surface border-transparent text-brand-text'}`}
                        >
                          <option value="">-- Chưa gán --</option>
                          {buses.map(b => (
                            <option key={b.id} value={b.id} disabled={b.status !== 'available' && shift.bus !== b.id}>
                              {b.id} ({b.type}) {b.status !== 'available' && '- Bận'}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-4 bg-brand-surface border border-black/5 border-dashed text-brand-text font-bold rounded-2xl hover:bg-brand-primary hover:text-brand-text transition-colors flex items-center justify-center gap-2">
              + Thêm Ca Chạy Mới
            </button>
          </div>
        </div>

        {/* Sidebar: Resources Stats */}
        <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          
          <div className="bg-brand-primary/10 rounded-3xl p-6 border border-brand-primary/20">
            <h2 className="text-lg font-black mb-4">Tình trạng Nguồn lực</h2>
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-brand-text/70 flex items-center gap-2"><Users className="w-5 h-5"/> Tài xế rảnh</span>
              <span className="text-3xl font-black text-brand-primary">{availableDrivers}</span>
            </div>
            <div className="w-full bg-brand-text/10 rounded-full h-2 mb-6">
              <div className="bg-brand-primary h-2 rounded-full" style={{width: `${drivers.length ? (availableDrivers/drivers.length)*100 : 0}%`}}></div>
            </div>

            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-brand-text/70 flex items-center gap-2"><BusFront className="w-5 h-5"/> Xe trống</span>
              <span className="text-3xl font-black text-brand-primary">{availableBuses}</span>
            </div>
            <div className="w-full bg-brand-text/10 rounded-full h-2">
              <div className="bg-brand-primary h-2 rounded-full" style={{width: `${buses.length ? (availableBuses/buses.length)*100 : 0}%`}}></div>
            </div>
          </div>

          {/* Quick List Drivers */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold mb-4">Danh sách Tài xế</h3>
            <div className="flex flex-col gap-2">
              {drivers.map(d => (
                <div key={d.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-brand-surface">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{d.name}</span>
                    <span className="text-[10px] font-bold text-brand-text/50">{d.id}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${d.status === 'available' ? 'bg-brand-success' : d.status === 'busy' ? 'bg-brand-danger' : 'bg-black/20'}`}></span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
