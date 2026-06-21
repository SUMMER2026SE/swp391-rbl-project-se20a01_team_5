import React, { useState, useCallback } from "react";
import { PageHeader } from "@/components/bus/primitives";
import { UserCog, Save, Plus, Trash2 } from "lucide-react";
import { AsyncBlock, useApiResource } from "@/components/bus/real-data";
import { ExpressiveCard, ExpressiveButton } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { operationsApi, ScheduleDashboard } from "@/lib/api/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export function DriverAssignmentScreen() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const loader = useCallback(() => operationsApi.scheduleDashboard(date), [date]);
  const resource = useApiResource<ScheduleDashboard>(loader);
  const [saving, setSaving] = useState(false);
  const [busAssignments, setBusAssignments] = useState<Record<string, number | undefined>>({});
  const [driverAssignments, setDriverAssignments] = useState<Record<string, number | undefined>>({});
  const [conductorAssignments, setConductorAssignments] = useState<Record<string, number | undefined>>({});
  const [newShifts, setNewShifts] = useState<{id: string, routeId: number | "", departureTime: string}[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{scheduleId: number; routeName: string; departureTime: string} | null>(null);

  const handleSave = async () => {
    if (!resource.data) return;
    setSaving(true);
    try {
      const shiftsToSave = (resource.data?.shifts || []).map(shift => {
        const updatedBusId = busAssignments[shift.scheduleId || ""];
        const updatedDriverId = driverAssignments[shift.scheduleId || ""];
        const updatedConductorId = conductorAssignments[shift.scheduleId || ""];
        return {
          scheduleId: shift.scheduleId,
          routeId: shift.routeId,
          departureTime: shift.departureTime,
          busId: updatedBusId !== undefined ? updatedBusId : shift.busId,
          driverStaffId: updatedDriverId !== undefined ? updatedDriverId : shift.driverStaffId,
          conductorStaffId: updatedConductorId !== undefined ? updatedConductorId : shift.conductorStaffId,
          status: shift.status
        };
      });
      const additions = newShifts.filter(ns => ns.routeId).map(ns => ({
        routeId: Number(ns.routeId),
        departureTime: ns.departureTime + ":00",
        busId: busAssignments[ns.id],
        driverStaffId: driverAssignments[ns.id],
        conductorStaffId: conductorAssignments[ns.id]
      }));
      await operationsApi.saveSchedules({ serviceDate: date, shifts: [...shiftsToSave, ...additions] });
      toast.success("Lưu phân công xe chạy thành công!");
      setBusAssignments({});
      setDriverAssignments({});
      setConductorAssignments({});
      setNewShifts([]);
      resource.reload();
    } catch (e) {
      toast.error("Không thể lưu phân công");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = (scheduleId: number, routeName: string, departureTime: string) => {
    setDeleteTarget({ scheduleId, routeName, departureTime });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSchedule = async (scheduleId: number) => {
    try {
      await operationsApi.deleteSchedule(scheduleId, date);
      toast.success("Xóa ca chạy thành công!");
      resource.reload();
    } catch (e) {
      toast.error("Không thể xóa ca chạy. Có thể chuyến đi đang chạy hoặc đã hoàn thành.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Phân công xe chạy"
        description="Gán tài xế, phụ xe và xe bus cho các ca chạy."
        icon={<UserCog className="size-7" />}
        actions={
          <div className="flex gap-2 items-center">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-full bg-white w-40" />
            <ExpressiveButton variant="outlined" onClick={() => setNewShifts(prev => [...prev, { id: `new_${Date.now()}`, routeId: "", departureTime: "07:00" }])}>
              <Plus className="size-4 mr-2" /> Thêm ca chạy mới
            </ExpressiveButton>
            <ExpressiveButton onClick={handleSave} disabled={saving}><Save className="size-4 mr-2" /> Lưu</ExpressiveButton>
          </div>
        }
      />
      <AsyncBlock resource={resource}>
        {(dashboard) => (
          <div className="space-y-4">
            {dashboard.shifts.map((shift) => {
              const isLocked = shift.status === "RUNNING" || shift.status === "COMPLETED";
              return (
                <ExpressiveCard key={shift.scheduleId || `${shift.routeId}-${shift.departureTime}`} className="p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{shift.routeName} - {shift.departureTime}</h3>
                      {shift.status === "RUNNING" && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-600 border border-green-500/20">
                          Đang chạy
                        </span>
                      )}
                      {shift.status === "COMPLETED" && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-600 border border-gray-500/20">
                          Đã hoàn thành
                        </span>
                      )}
                    </div>
                    {!isLocked && shift.scheduleId && (
                      <ExpressiveButton
                        variant="outlined"
                        className="border-error text-error hover:bg-error/10 h-9 px-3 flex items-center gap-1.5 self-start sm:self-auto"
                        onClick={() => handleDeleteSchedule(shift.scheduleId!, shift.routeName || "", shift.departureTime || "")}
                      >
                        <Trash2 className="size-4" /> Xóa
                      </ExpressiveButton>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto">
                    <div className="w-full sm:w-48">
                      <Label>Chọn Xe Bus</Label>
                      <select 
                        className="w-full p-2 mt-1 border rounded bg-surface border-outline/20 text-on-surface disabled:opacity-60"
                        value={busAssignments[shift.scheduleId || ""] ?? (shift.busId || "")}
                        onChange={(e) => setBusAssignments(prev => ({...prev, [shift.scheduleId || ""]: Number(e.target.value) || undefined}))}
                        disabled={isLocked}
                      >
                        <option value="">-- Chưa phân công --</option>
                        {dashboard.buses.map(b => (
                           <option key={b.busId} value={b.busId}>{b.licensePlate} ({b.seatCount} chỗ)</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-48">
                      <Label>Chọn Tài Xế</Label>
                      <select 
                        className="w-full p-2 mt-1 border rounded bg-surface border-outline/20 text-on-surface disabled:opacity-60"
                        value={driverAssignments[shift.scheduleId || ""] ?? (shift.driverStaffId || "")}
                        onChange={(e) => setDriverAssignments(prev => ({...prev, [shift.scheduleId || ""]: Number(e.target.value) || undefined}))}
                        disabled={isLocked}
                      >
                        <option value="">-- Chưa phân công --</option>
                        {dashboard.drivers.map(d => (
                           <option key={d.staffId} value={d.staffId}>{d.fullName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-48">
                      <Label>Chọn Phụ Xe</Label>
                      <select 
                        className="w-full p-2 mt-1 border rounded bg-surface border-outline/20 text-on-surface disabled:opacity-60"
                        value={conductorAssignments[shift.scheduleId || ""] ?? (shift.conductorStaffId || "")}
                        onChange={(e) => setConductorAssignments(prev => ({...prev, [shift.scheduleId || ""]: Number(e.target.value) || undefined}))}
                        disabled={isLocked}
                      >
                        <option value="">-- Không có --</option>
                        {dashboard.conductors.map(c => (
                           <option key={c.staffId} value={c.staffId}>{c.fullName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </ExpressiveCard>
              );
            })}

            {newShifts.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="font-bold text-lg border-t pt-4">Ca chạy mới thêm</h3>
                {newShifts.map((ns) => (
                   <ExpressiveCard key={ns.id} variant="elevated" className="p-4 border-primary/50 border-2">
                     <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                       <div className="flex-1 space-y-2 w-full">
                         <Label>Tuyến đường</Label>
                         <select 
                           className="w-full p-2 border rounded bg-surface border-outline/20 text-on-surface"
                           value={ns.routeId} 
                           onChange={(e) => setNewShifts(prev => prev.map(s => s.id === ns.id ? {...s, routeId: e.target.value ? Number(e.target.value) : ""} : s))}
                         >
                           <option value="">-- Chọn tuyến --</option>
                           {(dashboard.routes || []).map(r => (
                              <option key={r.routeId} value={r.routeId}>{r.routeName}</option>
                           ))}
                         </select>
                       </div>
                       <div className="w-full xl:w-32 space-y-2">
                         <Label>Giờ chạy</Label>
                         <Input type="time" value={ns.departureTime} onChange={(e) => setNewShifts(prev => prev.map(s => s.id === ns.id ? {...s, departureTime: e.target.value} : s))} />
                       </div>
                       <div className="w-full xl:w-48 space-y-2">
                          <Label>Xe bus</Label>
                          <select 
                            className="w-full p-2 border rounded bg-surface border-outline/20 text-on-surface"
                            value={busAssignments[ns.id] || ""} 
                            onChange={(e) => setBusAssignments(prev => ({...prev, [ns.id]: Number(e.target.value) || undefined}))}
                          >
                            <option value="">-- Chưa phân công --</option>
                            {dashboard.buses.map(b => (
                               <option key={b.busId} value={b.busId}>{b.licensePlate} ({b.seatCount} chỗ)</option>
                            ))}
                          </select>
                       </div>
                       <div className="w-full xl:w-48 space-y-2">
                          <Label>Tài xế</Label>
                          <select 
                            className="w-full p-2 border rounded bg-surface border-outline/20 text-on-surface"
                            value={driverAssignments[ns.id] || ""} 
                            onChange={(e) => setDriverAssignments(prev => ({...prev, [ns.id]: Number(e.target.value) || undefined}))}
                          >
                            <option value="">-- Chưa phân công --</option>
                            {dashboard.drivers.map(d => (
                               <option key={d.staffId} value={d.staffId}>{d.fullName}</option>
                            ))}
                          </select>
                       </div>
                       <div className="w-full xl:w-48 space-y-2">
                          <Label>Phụ xe</Label>
                          <select 
                            className="w-full p-2 border rounded bg-surface border-outline/20 text-on-surface"
                            value={conductorAssignments[ns.id] || ""} 
                            onChange={(e) => setConductorAssignments(prev => ({...prev, [ns.id]: Number(e.target.value) || undefined}))}
                          >
                            <option value="">-- Không có --</option>
                            {dashboard.conductors.map(c => (
                               <option key={c.staffId} value={c.staffId}>{c.fullName}</option>
                            ))}
                          </select>
                       </div>
                       <div className="w-full xl:w-auto">
                          <ExpressiveButton variant="outlined" className="w-full border-error text-error hover:bg-error/10" onClick={() => {
                            setNewShifts(prev => prev.filter(s => s.id !== ns.id));
                            setBusAssignments(prev => { const next = {...prev}; delete next[ns.id]; return next; });
                            setDriverAssignments(prev => { const next = {...prev}; delete next[ns.id]; return next; });
                            setConductorAssignments(prev => { const next = {...prev}; delete next[ns.id]; return next; });
                          }}>
                             Hủy
                          </ExpressiveButton>
                       </div>
                     </div>
                   </ExpressiveCard>
                ))}
              </div>
            )}
          </div>
        )}
      </AsyncBlock>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border border-outline-variant/60 bg-white p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-on-surface">Xác nhận xóa ca chạy</AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant text-sm mt-2">
              Bạn có chắc chắn muốn xóa ca chạy lúc <span className="font-semibold text-on-surface">{deleteTarget?.departureTime}</span> của tuyến <span className="font-semibold text-on-surface">&quot;{deleteTarget?.routeName}&quot;</span> không?
              <br />
              <span className="text-xs text-error mt-2 block">Lưu ý: Hành động này sẽ xóa toàn bộ các chuyến đi liên quan trong ngày của ca chạy này và không thể hoàn tác.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end gap-3">
            <AlertDialogCancel asChild>
              <ExpressiveButton variant="outlined" onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteTarget(null);
              }}>
                Hủy
              </ExpressiveButton>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <ExpressiveButton 
                className="bg-error hover:bg-error-container text-white" 
                onClick={async () => {
                  if (deleteTarget) {
                    await confirmDeleteSchedule(deleteTarget.scheduleId);
                  }
                  setDeleteConfirmOpen(false);
                  setDeleteTarget(null);
                }}
              >
                Đồng ý xóa
              </ExpressiveButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
