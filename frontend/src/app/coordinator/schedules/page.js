"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Map, Users, BusFront, CheckCircle2, AlertCircle, ChevronDown, Save, Plus, Loader2 } from 'lucide-react';
import { coordinatorScheduleApi } from '@/services/api';

function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeShift(shift) {
  return {
    key: shift.scheduleId ? `schedule-${shift.scheduleId}` : `draft-${crypto.randomUUID()}`,
    scheduleId: shift.scheduleId || null,
    tripId: shift.tripId || null,
    routeId: shift.routeId || '',
    routeName: shift.routeName || 'Chưa chọn tuyến',
    busId: shift.busId || '',
    licensePlate: shift.licensePlate || '',
    driverStaffId: shift.driverStaffId || '',
    driverName: shift.driverName || '',
    conductorStaffId: shift.conductorStaffId || '',
    conductorName: shift.conductorName || '',
    weekdayNumber: shift.weekdayNumber || null,
    departureTime: shift.departureTime || shift.time || '07:00',
    status: shift.driverStaffId && shift.busId ? 'assigned' : 'unassigned',
    tripStatus: shift.status || 'NOT_CREATED',
  };
}

export default function CoordinatorSchedulesPage() {
  const [serviceDate, setServiceDate] = useState(toDateInputValue());
  const [shifts, setShifts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (date) => {
    setIsLoading(true);
    setError('');
    setNotice('');
    try {
      const dashboard = await coordinatorScheduleApi.getDashboard(date);
      setDrivers(dashboard?.drivers || []);
      setConductors(dashboard?.conductors || []);
      setBuses(dashboard?.buses || []);
      setRoutes(dashboard?.routes || []);
      setShifts((dashboard?.shifts || []).map(normalizeShift));
    } catch (err) {
      setError(err.message);
      setShifts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => loadDashboard(serviceDate), 0);
    return () => window.clearTimeout(handle);
  }, [loadDashboard, serviceDate]);

  const handleAssign = (shiftKey, field, value) => {
    setShifts((current) => current.map((shift) => {
      if (shift.key !== shiftKey) return shift;
      const updated = { ...shift, [field]: value };
      if (field === 'routeId') {
        const route = routes.find((item) => String(item.routeId) === String(value));
        updated.routeName = route?.routeName || updated.routeName;
      }
      if (field === 'busId') {
        const bus = buses.find((item) => String(item.busId) === String(value));
        updated.licensePlate = bus?.licensePlate || '';
      }
      updated.status = updated.driverStaffId && updated.busId ? 'assigned' : 'unassigned';
      return updated;
    }));
  };

  const handleAddShift = () => {
    const firstRoute = routes[0];
    const firstBus = buses.find((bus) => bus.status === 'AVAILABLE') || buses[0];
    const firstDriver = drivers[0];
    setShifts((current) => [
      ...current,
      normalizeShift({
        routeId: firstRoute?.routeId || '',
        routeName: firstRoute?.routeName || 'Chưa chọn tuyến',
        busId: firstBus?.busId || '',
        licensePlate: firstBus?.licensePlate || '',
        driverStaffId: firstDriver?.staffId || '',
        driverName: firstDriver?.fullName || '',
        departureTime: '07:00',
      }),
    ]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        serviceDate,
        shifts: shifts.map((shift) => ({
          scheduleId: shift.scheduleId || null,
          routeId: Number(shift.routeId) || null,
          busId: Number(shift.busId) || null,
          driverStaffId: Number(shift.driverStaffId) || null,
          conductorStaffId: Number(shift.conductorStaffId) || null,
          weekdayNumber: shift.weekdayNumber || null,
          departureTime: shift.departureTime,
        })),
      };
      const dashboard = await coordinatorScheduleApi.save(payload);
      setShifts((dashboard?.shifts || []).map(normalizeShift));
      setNotice('Đã lưu phân công và sinh trip cho ngày đã chọn.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const availableDrivers = drivers.length;
  const availableBuses = buses.filter((bus) => bus.status !== 'MAINTENANCE' && bus.status !== 'INACTIVE').length;
  const driverCapacity = drivers.length ? 100 : 0;
  const busCapacity = buses.length ? (availableBuses / buses.length) * 100 : 0;
  const assignedCount = useMemo(() => shifts.filter((shift) => shift.status === 'assigned').length, [shifts]);

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-brand-primary" /> Phân công & Lịch trình
          </h1>
          <p className="text-brand-text/60 font-medium">Sắp xếp ca chạy, gán tài xế và xe bus cho từng tuyến.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="date"
            value={serviceDate}
            onChange={(event) => setServiceDate(event.target.value)}
            className="bg-white border border-black/5 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-brand-primary shadow-sm"
          />
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading || shifts.length === 0}
            className="bg-brand-text text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? 'Đang lưu...' : 'Lưu Phân Công'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 overflow-hidden pb-6">
        <div className="xl:col-span-3 bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-black/5 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-brand-surface/30">
            <h2 className="text-xl font-bold">Bảng phân công tuyến</h2>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-success bg-brand-success/10 px-3 py-1 rounded-md">
                <CheckCircle2 className="w-4 h-4" /> Đã gán: {assignedCount}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-brand-danger bg-brand-danger/10 px-3 py-1 rounded-md">
                <AlertCircle className="w-4 h-4" /> Trống: {shifts.length - assignedCount}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {error && (
              <div className="mb-4 rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">
                {error}
              </div>
            )}
            {notice && (
              <div className="mb-4 rounded-2xl border border-brand-success/20 bg-brand-success/10 p-4 text-sm font-bold text-brand-success">
                {notice}
              </div>
            )}

            {isLoading ? (
              <div className="py-16 flex items-center justify-center gap-3 text-brand-text/50 font-bold">
                <Loader2 className="w-5 h-5 animate-spin" /> Đang tải lịch phân công...
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {shifts.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-brand-surface/40 p-8 text-center text-sm font-bold text-brand-text/50">
                    Chưa có ca chạy cho ngày này. Tạo ca mới để bắt đầu phân công.
                  </div>
                )}
                {shifts.map((shift) => (
                  <div key={shift.key} className={`border rounded-2xl p-5 flex flex-col gap-5 transition-colors ${shift.status === 'unassigned' ? 'border-brand-danger/30 bg-brand-danger/5' : 'border-black/5 hover:border-brand-primary/50'}`}>
                    <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr_1fr] gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-black text-lg">{shift.scheduleId ? `SCH-${shift.scheduleId}` : 'Ca mới'}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${shift.status === 'assigned' ? 'bg-brand-success text-white' : 'bg-brand-danger text-white'}`}>
                            {shift.status === 'assigned' ? 'Đã phân công' : 'Cần phân công'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-brand-surface text-brand-text/60">
                            {shift.tripStatus}
                          </span>
                        </div>
                        <label className="block text-xs font-bold text-brand-text/50 uppercase mb-1 flex items-center gap-1">
                          <Map className="w-3.5 h-3.5" /> Tuyến
                        </label>
                        <Select value={shift.routeId} onChange={(value) => handleAssign(shift.key, 'routeId', value)}>
                          <option value="">-- Chọn tuyến --</option>
                          {routes.map((route) => (
                            <option key={route.routeId} value={route.routeId}>{route.routeName}</option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-text/50 uppercase mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Giờ xuất bến
                        </label>
                        <input
                          type="time"
                          value={shift.departureTime?.slice(0, 5) || '07:00'}
                          onChange={(event) => handleAssign(shift.key, 'departureTime', event.target.value)}
                          className="w-full rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/50 border bg-brand-surface border-transparent text-brand-text"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-text/50 uppercase mb-1 flex items-center gap-1">
                          <BusFront className="w-3.5 h-3.5" /> Xe bus
                        </label>
                        <Select value={shift.busId} danger={!shift.busId} onChange={(value) => handleAssign(shift.key, 'busId', value)}>
                          <option value="">-- Chưa gán --</option>
                          {buses.map((bus) => (
                            <option key={bus.busId} value={bus.busId}>
                              {bus.licensePlate} ({bus.busType || 'Bus'}) {bus.status !== 'AVAILABLE' ? `- ${bus.status}` : ''}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-brand-text/50 uppercase mb-1 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> Tài xế
                        </label>
                        <Select value={shift.driverStaffId} danger={!shift.driverStaffId} onChange={(value) => handleAssign(shift.key, 'driverStaffId', value)}>
                          <option value="">-- Chưa gán --</option>
                          {drivers.map((driver) => (
                            <option key={driver.staffId} value={driver.staffId}>{driver.fullName} ({driver.staffId})</option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-text/50 uppercase mb-1 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> Phụ xe
                        </label>
                        <Select value={shift.conductorStaffId || ''} onChange={(value) => handleAssign(shift.key, 'conductorStaffId', value)}>
                          <option value="">-- Không gán --</option>
                          {conductors.map((conductor) => (
                            <option key={conductor.staffId} value={conductor.staffId}>{conductor.fullName} ({conductor.staffId})</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleAddShift}
              disabled={isLoading || routes.length === 0 || drivers.length === 0 || buses.length === 0}
              className="w-full mt-6 py-4 bg-brand-surface border border-black/5 border-dashed text-brand-text font-bold rounded-2xl hover:bg-brand-primary hover:text-brand-text transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" /> Thêm ca chạy mới
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-brand-primary/10 rounded-3xl p-6 border border-brand-primary/20">
            <h2 className="text-lg font-black mb-4">Tình trạng nguồn lực</h2>
            <Progress label="Tài xế khả dụng" icon={Users} value={availableDrivers} percent={driverCapacity} />
            <Progress label="Xe khả dụng" icon={BusFront} value={availableBuses} percent={busCapacity} />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
            <h3 className="font-bold mb-4">Danh sách tài xế</h3>
            <div className="flex flex-col gap-2">
              {drivers.length === 0 && (
                <div className="rounded-xl border border-dashed border-black/10 bg-brand-surface/40 p-4 text-center text-xs font-bold text-brand-text/50">
                  Chưa có tài xế active từ backend.
                </div>
              )}
              {drivers.map((driver) => (
                <div key={driver.staffId} className="flex justify-between items-center p-2 rounded-lg hover:bg-brand-surface">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{driver.fullName}</span>
                    <span className="text-[10px] font-bold text-brand-text/50">STAFF-{driver.staffId} • {driver.status}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-brand-success"></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Select({ value, onChange, children, danger = false }) {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full appearance-none rounded-xl p-3 pr-10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/50 border transition-colors ${danger ? 'bg-white border-brand-danger/50 text-brand-danger' : 'bg-brand-surface border-transparent text-brand-text'}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40 pointer-events-none" />
    </div>
  );
}

function Progress({ label, icon: Icon, value, percent }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-end mb-2">
        <span className="font-bold text-brand-text/70 flex items-center gap-2"><Icon className="w-5 h-5" /> {label}</span>
        <span className="text-3xl font-black text-brand-primary">{value}</span>
      </div>
      <div className="w-full bg-brand-text/10 rounded-full h-2">
        <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
