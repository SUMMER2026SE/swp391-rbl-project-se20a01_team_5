"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, Camera, History, MessageSquare, PackageSearch, QrCode, Route } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { AsyncBlock, DataList, StatusPill, UnavailablePanel, formatDateTime, getErrorMessage, useApiResource } from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrScannerModal } from "@/components/bus/qr-scanner-modal";
import {
  experienceApi,
  operationsApi,
  type ConductorTicketView,
  type DriverTripView,
  type ExperienceIncidentCard,
  type ExperienceLostItemCard,
  type TicketScanResult,
} from "@/lib/api/client";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function AssistantModule({ activeId }: Props) {
  if (activeId === "ast-lost") return <AssistantLostItemsScreen />;
  if (activeId === "ast-incident") return <IncidentScreen />;
  if (activeId === "ast-contact") return <Unavailable title="Liên hệ tài xế" icon={<MessageSquare className="size-7" />} />;
  return <ConductorWorkspace mode={activeId} />;
}

function ConductorWorkspace({ mode }: { mode: string }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const loader = useCallback(() => operationsApi.conductorTrips(date), [date]);
  const tripsResource = useApiResource<DriverTripView[]>(loader);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [tickets, setTickets] = useState<ConductorTicketView[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [scanResult, setScanResult] = useState<TicketScanResult | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isCheckingTicket, setIsCheckingTicket] = useState(false);

  const trips = useMemo(() => tripsResource.data || [], [tripsResource.data]);
  const normalizedSelectedTripId = useMemo(() => {
    if (selectedTripId && trips.some((trip) => trip.tripId === selectedTripId)) return selectedTripId;
    return trips[0]?.tripId ?? null;
  }, [selectedTripId, trips]);
  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.tripId === normalizedSelectedTripId) || null,
    [normalizedSelectedTripId, trips]
  );

  const loadTickets = useCallback(async (tripId: number) => {
    setTicketsLoading(true);
    try {
      setTickets(await operationsApi.conductorTickets(tripId));
    } catch (error) {
      toast.error(getErrorMessage(error, "Không tải được danh sách vé"));
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (selectedTrip?.tripId) {
        loadTickets(selectedTrip.tripId);
      } else {
        setTickets([]);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [selectedTrip?.tripId, loadTickets]);

  const scan = async () => {
    if (!selectedTrip?.tripId || !qrCode.trim()) {
      toast.error("Chọn chuyến và nhập QR code");
      return;
    }
    try {
      const result = await operationsApi.scanTicket(selectedTrip.tripId, qrCode.trim());
      setScanResult(result);
      toast[result.valid ? "success" : "error"](result.message || (result.valid ? "Vé hợp lệ" : "Vé không hợp lệ"));
      loadTickets(selectedTrip.tripId);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể quét vé"));
    }
  };

  const handleCameraScan = async (scannedCode: string) => {
    if (!selectedTrip?.tripId) {
      toast.error("Vui lòng chọn chuyến trước khi quét");
      setScannerOpen(false);
      return;
    }
    if (isCheckingTicket) return;
    
    setIsCheckingTicket(true);
    try {
      const result = await operationsApi.scanTicket(selectedTrip.tripId, scannedCode.trim());
      setScanResult(result);
      toast[result.valid ? "success" : "error"](result.message || (result.valid ? "Vé hợp lệ" : "Vé không hợp lệ"));
      loadTickets(selectedTrip.tripId);
      // Keep camera open for continuous scanning, user will close manually
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể quét vé"));
    } finally {
      setIsCheckingTicket(false);
    }
  };

  const title =
    mode === "ast-scan" ? "Quét QR vé"
    : mode === "ast-monthly" ? "Kiểm tra vé tháng"
    : mode === "ast-history" ? "Lịch sử chuyến"
    : "Chuyến được phân";

  return (
    <div>
      <PageHeader
        title={title}
        description="Dữ liệu phụ xe lấy từ conductor operations API."
        icon={<QrCode className="size-7" />}
        actions={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-full bg-white" />}
      />
      <AsyncBlock resource={tripsResource}>
        {() => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Chuyến trong ngày" value={trips.length} icon={<Route className="size-6" />} accent="primary" />
              <StatCard label="Chuyến chọn" value={selectedTrip?.routeName || "Chưa có"} icon={<BadgeCheck className="size-6" />} accent="secondary" />
              <StatCard label="Vé trong chuyến" value={tickets.length} icon={<QrCode className="size-6" />} accent="success" />
              <StatCard label="Scan gần nhất" value={scanResult ? (scanResult.valid ? "Hợp lệ" : "Từ chối") : "Chưa quét"} icon={<History className="size-6" />} accent={scanResult?.valid ? "success" : "tertiary"} />
            </div>

            <ExpressiveCard variant="elevated" className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <div className="space-y-2">
                <Label>Chuyến</Label>
                <select
                  value={normalizedSelectedTripId || ""}
                  onChange={(event) => setSelectedTripId(Number(event.target.value))}
                  className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-[#144fcc]"
                >
                  {trips.map((trip) => (
                    <option key={trip.tripId} value={trip.tripId}>{trip.routeName} · {trip.departureTime || "chưa có giờ"}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Quét vé bằng Camera</Label>
                <ExpressiveButton 
                  onClick={() => setScannerOpen(true)} 
                  className="w-full justify-center bg-[#beff50] text-[#14140f] hover:bg-[#a6e639] h-12 text-base font-bold"
                >
                  <Camera className="size-5 mr-1" />
                  Mở Camera Quét QR
                </ExpressiveButton>
              </div>
              <div className="space-y-2">
                <Label className="sr-only">Nhập tay</Label>
                <div className="flex gap-2">
                  <Input value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="Hoặc nhập mã tay..." className="h-12" />
                  <ExpressiveButton onClick={scan} className="h-12 w-12 shrink-0 p-0"><QrCode className="size-5" /></ExpressiveButton>
                </div>
              </div>
            </ExpressiveCard>

            <QrScannerModal
              open={scannerOpen}
              onOpenChange={setScannerOpen}
              onScan={handleCameraScan}
              isLoading={isCheckingTicket}
            />

            {scanResult && (
              <ExpressiveCard variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{scanResult.message}</h3>
                    {scanResult.ticket && (
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {scanResult.ticket.studentName || scanResult.ticket.studentCode} · {scanResult.ticket.routeName}
                      </p>
                    )}
                  </div>
                  <StatusPill status={scanResult.valid ? "VALID" : "INVALID"} />
                </div>
              </ExpressiveCard>
            )}

            <Section title="Vé trong chuyến" description={ticketsLoading ? "Đang tải danh sách vé..." : "Danh sách từ backend theo trip đang chọn."}>
              <DataList emptyTitle="Chưa có vé trong chuyến" emptyDescription="Backend chưa trả về vé nào cho chuyến này.">
                {tickets.map((ticket) => (
                  <ExpressiveCard key={`${ticket.ticketKind}-${ticket.ticketId}`} variant="elevated" className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-bold text-on-surface">{ticket.studentName || ticket.studentCode || `Ticket #${ticket.ticketId}`}</h3>
                        <p className="text-sm text-on-surface-variant">{ticket.routeName} · {ticket.boardingStopName || "?"} {"->"} {ticket.alightingStopName || "?"}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">Scan gần nhất: {formatDateTime(ticket.lastScannedAt)}</p>
                      </div>
                      <StatusPill status={ticket.status} />
                    </div>
                  </ExpressiveCard>
                ))}
              </DataList>
            </Section>
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function AssistantLostItemsScreen() {
  const resource = useApiResource<ExperienceLostItemCard[]>(useCallback(() => experienceApi.assistantLostItems(), []));

  const update = async (item: ExperienceLostItemCard, status: string) => {
    try {
      await experienceApi.updateAssistantLostItem(item.lostItemReportId, {
        status,
        notes: status === "FOUND" ? "Phụ xe đã tìm thấy và liên hệ sinh viên." : item.notes,
      });
      toast.success("Đã cập nhật đồ thất lạc");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật đồ thất lạc"));
    }
  };

  return (
    <div>
      <PageHeader title="Hỗ trợ mất đồ" description="Queue đồ thất lạc thật từ lost_item_reports." icon={<PackageSearch className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có báo mất đồ" emptyDescription="Sinh viên báo mất đồ thì queue sẽ xuất hiện tại đây.">
            {items.map((item) => (
              <ExpressiveCard key={item.lostItemReportId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{item.itemDescription}</h3>
                    <p className="text-sm text-on-surface-variant">{item.reporterName || "Sinh viên"} · {item.routeCode || item.routeName || "Chưa gắn tuyến"}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Báo lúc {formatDateTime(item.reportedAt)}</p>
                    {item.notes && <p className="mt-2 rounded-xl bg-surface-container-high p-3 text-sm text-on-surface">{item.notes}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill status={item.status} />
                    <ExpressiveButton size="sm" variant="tonal" onClick={() => update(item, "SEARCHING")}>Đang tìm</ExpressiveButton>
                    <ExpressiveButton size="sm" onClick={() => update(item, "FOUND")}>Đã tìm thấy</ExpressiveButton>
                    <ExpressiveButton size="sm" variant="error" onClick={() => update(item, "NOT_FOUND")}>Không thấy</ExpressiveButton>
                  </div>
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function IncidentScreen() {
  const resource = useApiResource<ExperienceIncidentCard[]>(useCallback(() => experienceApi.incidents(), []));
  const [tripId, setTripId] = useState("");
  const [incidentType, setIncidentType] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!tripId || !description.trim()) {
      toast.error("Nhập Trip ID và mô tả sự cố");
      return;
    }
    setSaving(true);
    try {
      await experienceApi.createIncident({
        tripId: Number(tripId),
        incidentType,
        description,
      });
      setDescription("");
      toast.success("Đã báo cáo sự cố");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể báo cáo sự cố"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Báo cáo sự cố" description="Sự cố được lưu thật vào bảng incidents." icon={<AlertTriangle className="size-7" />} />
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <ExpressiveCard variant="elevated" className="space-y-4 p-5">
          <div className="space-y-2">
            <Label>Trip ID</Label>
            <Input type="number" value={tripId} onChange={(e) => setTripId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Loại sự cố</Label>
            <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm">
              <option value="OVERCROWDED">Quá tải</option>
              <option value="TECHNICAL">Kỹ thuật</option>
              <option value="EMERGENCY">Khẩn cấp</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <ExpressiveButton onClick={submit} disabled={saving}>{saving ? "Đang gửi..." : "Gửi sự cố"}</ExpressiveButton>
        </ExpressiveCard>
        <AsyncBlock resource={resource}>
          {(items) => (
            <DataList emptyTitle="Chưa có sự cố" emptyDescription="Các sự cố đã báo cáo sẽ xuất hiện tại đây.">
              {items.map((item) => (
                <ExpressiveCard key={item.incidentId} variant="elevated" className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-bold text-on-surface">{item.incidentType}</h3>
                      <p className="text-sm text-on-surface-variant">{item.description}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{item.routeCode || item.routeName || `Trip #${item.tripId}`} · {formatDateTime(item.reportedAt)}</p>
                    </div>
                    <StatusPill status={item.status} />
                  </div>
                </ExpressiveCard>
              ))}
            </DataList>
          )}
        </AsyncBlock>
      </div>
    </div>
  );
}

function Unavailable({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div>
      <PageHeader title={title} description="MVP hiện chưa có endpoint thật cho chức năng này." icon={icon} />
      <UnavailablePanel />
    </div>
  );
}
