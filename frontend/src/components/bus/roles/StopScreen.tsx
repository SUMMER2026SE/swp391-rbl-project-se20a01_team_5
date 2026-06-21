import React, { useState, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/bus/primitives";
import { School, MapPin } from "lucide-react";
import { AsyncBlock, DataList, useApiResource } from "@/components/bus/real-data";
import { ExpressiveCard, ExpressiveButton } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coordinatorRoutesApi, RouteListItem, RouteStopDto } from "@/lib/api/client";
import { toast } from "sonner";

export function StopScreen() {
  const routesLoader = useCallback(() => coordinatorRoutesApi.getRoutes(), []);
  const routesResource = useApiResource<RouteListItem[]>(routesLoader);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  return (
    <div>
      <PageHeader
        title="Quản lý Trạm dừng"
        description="Quản lý các trạm dừng trên một tuyến đường."
        icon={<School className="size-7" />}
      />
      <AsyncBlock resource={routesResource}>
        {(routes) => (
          <div className="space-y-6">
            <div className="w-full sm:w-1/2">
              <Label>Chọn Tuyến Đường</Label>
              <select 
                className="w-full p-2 mt-2 border rounded bg-surface border-outline/20 text-on-surface"
                value={selectedRouteId || ""}
                onChange={e => setSelectedRouteId(Number(e.target.value))}
              >
                <option value="">-- Chọn tuyến --</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
              </select>
            </div>
            {selectedRouteId ? <RouteStopsManager routeId={selectedRouteId} /> : <p className="text-on-surface-variant">Vui lòng chọn tuyến đường để xem trạm dừng.</p>}
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function RouteStopsManager({ routeId }: { routeId: number }) {
  const loader = useCallback(() => coordinatorRoutesApi.getRouteStops(routeId), [routeId]);
  const resource = useApiResource<RouteStopDto[]>(loader);
  const [newStop, setNewStop] = useState({ stopName: "", address: "", stopOrder: 1, minutesFromPreviousStop: 5 });
  const [adding, setAdding] = useState(false);

  // Sync default stopOrder when data loads
  useEffect(() => {
    if (resource.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewStop(prev => ({...prev, stopOrder: resource.data!.length + 1}));
    }
  }, [resource.data]);

  const handleAdd = async () => {
    if (!newStop.stopName) return;
    setAdding(true);
    try {
      await coordinatorRoutesApi.addStop(routeId, newStop);
      toast.success("Thêm trạm thành công");
      setNewStop({ stopName: "", address: "", stopOrder: (resource.data?.length || 0) + 2, minutesFromPreviousStop: 5 });
      resource.reload();
    } catch (e) {
      toast.error("Không thể thêm trạm");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (stopId: number) => {
    if (!confirm("Bạn có chắc muốn xoá trạm này?")) return;
    try {
      await coordinatorRoutesApi.deleteStop(routeId, stopId);
      toast.success("Đã xoá trạm");
      resource.reload();
    } catch (e) {
      toast.error("Không thể xoá trạm");
    }
  }

  return (
    <AsyncBlock resource={resource}>
      {(stops) => (
        <div className="space-y-6">
          <ExpressiveCard variant="elevated" className="p-4 space-y-4 max-w-3xl">
            <h3 className="font-bold flex items-center gap-2"><MapPin className="size-4"/> Thêm trạm dừng mới</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Tên trạm / Điểm dừng</Label>
                <Input placeholder="Vd: KTX Bách Khoa" value={newStop.stopName} onChange={e => setNewStop({...newStop, stopName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input type="number" value={newStop.stopOrder} onChange={e => setNewStop({...newStop, stopOrder: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Phút (từ trạm trước)</Label>
                <Input type="number" value={newStop.minutesFromPreviousStop} onChange={e => setNewStop({...newStop, minutesFromPreviousStop: Number(e.target.value)})} />
              </div>
            </div>
            <ExpressiveButton onClick={handleAdd} disabled={adding || !newStop.stopName}>
              + Thêm trạm
            </ExpressiveButton>
          </ExpressiveCard>

          <DataList emptyTitle="Chưa có trạm nào">
            {[...stops].sort((a,b) => a.stopOrder - b.stopOrder).map((s, idx) => (
              <ExpressiveCard key={s.id || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <h3 className="font-bold text-md">
                    <span className="inline-flex items-center justify-center bg-primary text-on-primary w-6 h-6 rounded-full text-xs mr-2">{s.stopOrder}</span>
                    {s.stopName}
                  </h3>
                  <p className="text-sm mt-1 text-on-surface-variant">Cách trạm trước: {s.minutesFromPreviousStop} phút</p>
                </div>
                <div className="mt-4 sm:mt-0">
                   <ExpressiveButton variant="tonal" onClick={() => handleDelete(s.stopId)}>Xoá</ExpressiveButton>
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        </div>
      )}
    </AsyncBlock>
  );
}
