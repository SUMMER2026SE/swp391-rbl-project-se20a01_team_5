import React, { useState, useCallback } from "react";
import { PageHeader } from "@/components/bus/primitives";
import { Route, Trash2, Edit } from "lucide-react";
import { AsyncBlock, DataList, useApiResource } from "@/components/bus/real-data";
import { ExpressiveCard, ExpressiveButton } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { coordinatorRoutesApi, RouteListItem } from "@/lib/api/client";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function RouteScreen() {
  const loader = useCallback(() => coordinatorRoutesApi.getRoutes(), []);
  const resource = useApiResource<RouteListItem[]>(loader);
  const [newRoute, setNewRoute] = useState({ routeName: "", description: "", estimatedMinutes: 60 });
  const [creating, setCreating] = useState(false);

  // Delete states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RouteListItem | null>(null);

  // Edit states
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RouteListItem | null>(null);
  const [editForm, setEditForm] = useState({ routeName: "", description: "", estimatedMinutes: 60 });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newRoute.routeName) return;
    setCreating(true);
    try {
      await coordinatorRoutesApi.createRoute(newRoute);
      toast.success("Tạo tuyến đường thành công");
      setNewRoute({ routeName: "", description: "", estimatedMinutes: 60 });
      resource.reload();
    } catch (e) {
      toast.error("Không thể tạo tuyến đường");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoute = (route: RouteListItem) => {
    setDeleteTarget(route);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteRoute = async (routeId: number) => {
    try {
      await coordinatorRoutesApi.deleteRoute(routeId);
      toast.success("Xóa tuyến đường thành công!");
      resource.reload();
    } catch (e: any) {
      toast.error(e.message || "Không thể xóa tuyến đường");
    }
  };

  const handleEditRoute = (route: RouteListItem) => {
    setEditTarget(route);
    setEditForm({
      routeName: route.routeName,
      description: route.description || "",
      estimatedMinutes: route.estimatedMinutes,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editForm.routeName) return;
    setSaving(true);
    try {
      await coordinatorRoutesApi.updateRoute(editTarget.id, editForm);
      toast.success("Cập nhật tuyến đường thành công!");
      setEditOpen(false);
      setEditTarget(null);
      resource.reload();
    } catch (e: any) {
      toast.error(e.message || "Không thể cập nhật tuyến đường");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Quản lý Tuyến đường"
        description="Thêm, sửa tuyến đường xe bus."
        icon={<Route className="size-7" />}
      />
      <div className="mb-6 max-w-2xl">
        <ExpressiveCard variant="elevated" className="p-4 space-y-4">
          <h3 className="font-bold">Thêm tuyến đường mới</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên tuyến</Label>
              <Input placeholder="Vd: BK - KTX" value={newRoute.routeName} onChange={e => setNewRoute({...newRoute, routeName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Thời gian ước tính (phút)</Label>
              <Input type="number" value={newRoute.estimatedMinutes} onChange={e => setNewRoute({...newRoute, estimatedMinutes: Number(e.target.value)})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả lộ trình</Label>
            <Textarea placeholder="Vd: Bách Khoa -> KTX -> ..." value={newRoute.description} onChange={e => setNewRoute({...newRoute, description: e.target.value})} />
          </div>
          <ExpressiveButton onClick={handleCreate} disabled={creating || !newRoute.routeName}>
            + Tạo tuyến
          </ExpressiveButton>
        </ExpressiveCard>
      </div>

      <AsyncBlock resource={resource}>
        {(routes) => (
          <DataList emptyTitle="Chưa có tuyến đường">
            {routes.map(r => (
              <ExpressiveCard key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">{r.routeName}</h3>
                  <p className="text-sm text-on-surface-variant">{r.description || "Chưa có mô tả"}</p>
                  <p className="text-xs mt-1">Thời gian: {r.estimatedMinutes} phút</p>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <ExpressiveButton
                    variant="outlined"
                    className="h-9 px-3 flex items-center gap-1.5"
                    onClick={() => handleEditRoute(r)}
                  >
                    <Edit className="size-4" /> Sửa
                  </ExpressiveButton>
                  <ExpressiveButton
                    variant="outlined"
                    className="border-error text-error hover:bg-error/10 h-9 px-3 flex items-center gap-1.5"
                    onClick={() => handleDeleteRoute(r)}
                  >
                    <Trash2 className="size-4" /> Xóa
                  </ExpressiveButton>
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>

      {/* Dialog Xóa tuyến đường */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border border-outline-variant/60 bg-white p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-on-surface">Xác nhận xóa tuyến đường</AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant text-sm mt-2">
              Bạn có chắc chắn muốn xóa tuyến đường <span className="font-semibold text-on-surface">&quot;{deleteTarget?.routeName}&quot;</span> không?
              <br />
              <span className="text-xs text-error mt-2 block">Lưu ý: Hành động này sẽ xóa toàn bộ các trạm dừng liên kết của tuyến đường này và không thể hoàn tác. Chỉ có thể xóa nếu tuyến chưa có lịch trình hoặc chuyến xe chạy.</span>
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
                    await confirmDeleteRoute(deleteTarget.id);
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

      {/* Dialog Sửa tuyến đường */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl border border-outline-variant/60 bg-white p-6 shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-on-surface">Chỉnh sửa tuyến đường</DialogTitle>
            <DialogDescription className="text-on-surface-variant text-sm mt-1">
              Cập nhật thông tin chi tiết cho tuyến đường.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên tuyến</Label>
                <Input 
                  placeholder="Vd: BK - KTX" 
                  value={editForm.routeName} 
                  onChange={e => setEditForm({...editForm, routeName: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Thời gian ước tính (phút)</Label>
                <Input 
                  type="number" 
                  value={editForm.estimatedMinutes} 
                  onChange={e => setEditForm({...editForm, estimatedMinutes: Number(e.target.value)})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mô tả lộ trình</Label>
              <Textarea 
                placeholder="Vd: Bách Khoa -> KTX -> ..." 
                value={editForm.description} 
                onChange={e => setEditForm({...editForm, description: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <ExpressiveButton variant="outlined" onClick={() => {
              setEditOpen(false);
              setEditTarget(null);
            }}>
              Hủy
            </ExpressiveButton>
            <ExpressiveButton onClick={handleSaveEdit} disabled={saving || !editForm.routeName}>
              Lưu thay đổi
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
