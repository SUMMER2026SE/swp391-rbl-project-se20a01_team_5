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
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const loader = useCallback(() => operationsApi.conductorTrips(today), [today]);
  const tripsResource = useApiResource<DriverTripView[]>(loader);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [tickets, setTickets] = useState<ConductorTicketView[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [scanResult, setScanResult] = useState<TicketScanResult | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isCheckingTicket, setIsCheckingTicket] = useState(false);

  const trips = useMemo(() => tripsResource.data || [], [tripsResource.data]);
  const tripsWithId = useMemo(() => trips.filter((trip) => !!trip.tripId), [trips]);
  const normalizedSelectedTripId = useMemo(() => {
    if (selectedTripId && tripsWithId.some((trip) => trip.tripId === selectedTripId)) return selectedTripId;
    return tripsWithId[0]?.tripId ?? null;
  }, [selectedTripId, tripsWithId]);
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
      />
      <AsyncBlock resource={tripsResource}>
        {() => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:gap-4 lg:grid-cols-4">
              <StatCard label="Chuyến trong ngày" value={trips.length} icon={<Route className="size-6" />} accent="primary" />
              <StatCard label="Chuyến chọn" value={selectedTrip?.routeName || "Chưa có"} icon={<BadgeCheck className="size-6" />} accent="secondary" />
              <StatCard label="Vé trong chuyến" value={tickets.length} icon={<QrCode className="size-6" />} accent="success" />
              <StatCard label="Scan gần nhất" value={scanResult ? (scanResult.valid ? "Hợp lệ" : "Từ chối") : "Chưa quét"} icon={<History className="size-6" />} accent={scanResult?.valid ? "success" : "tertiary"} />
            </div>

            <ExpressiveCard variant="elevated" className="flex flex-col gap-5 p-4 sm:p-5">
              <div className="space-y-2">
                <Label className="text-base font-bold text-on-surface">Chuyến đang làm việc</Label>
                <select
                  value={normalizedSelectedTripId || ""}
                  onChange={(event) => setSelectedTripId(Number(event.target.value))}
                  className="h-14 w-full rounded-2xl border-2 border-outline-variant bg-surface-container-lowest px-4 text-base font-bold text-[#144fcc] outline-none focus-visible:border-[#144fcc]"
                >
                  {trips.map((trip) => (
                    <option key={trip.tripId} value={trip.tripId}>{trip.routeName} · {trip.departureTime || "chưa có giờ"}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-4 sm:p-5 space-y-4 border border-outline-variant/30">
                <ExpressiveButton 
                  onClick={() => setScannerOpen(true)}
                  disabled={!selectedTrip?.tripId}
                  className="w-full justify-center bg-[#beff50] text-[#14140f] hover:bg-[#a6e639] h-16 text-lg font-black shadow-lg disabled:opacity-50"
                >
                  <Camera className="size-6 mr-2" />
                  BẬT CAMERA QUÉT VÉ
                </ExpressiveButton>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-outline-variant/50" />
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Hoặc nhập mã tay</span>
                  <div className="flex-1 h-px bg-outline-variant/50" />
                </div>

                <div className="flex gap-2">
                  <Input value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="Nhập mã vé..." className="h-12 bg-surface-container-lowest text-center text-base tracking-widest font-bold uppercase" />
                  <ExpressiveButton onClick={scan} className="h-12 px-6 bg-[#14140f] text-white hover:bg-[#14140f]/90">
                    Gửi
                  </ExpressiveButton>
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
              <ExpressiveCard variant="elevated" className={`p-5 border-2 ${scanResult.valid ? 'border-[#34a853] bg-[#34a853]/10' : 'border-[#ea4335] bg-[#ea4335]/10'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className={`text-xl font-black ${scanResult.valid ? 'text-[#34a853]' : 'text-[#ea4335]'}`}>
                      {scanResult.message}
                    </h3>
                    {scanResult.ticket && (
                      <p className="mt-1 text-base font-bold text-on-surface">
                        {scanResult.ticket.studentName || scanResult.ticket.studentCode} · {scanResult.ticket.routeName}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <StatusPill status={scanResult.valid ? "VALID" : "INVALID"} />
                  </div>
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
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const resource = useApiResource<ExperienceIncidentCard[]>(useCallback(() => experienceApi.incidents(), []));
  const tripsResource = useApiResource<DriverTripView[]>(useCallback(() => operationsApi.conductorTrips(today), [today]));
  const trips = useMemo(() => (tripsResource.data || []).filter((trip) => !!trip.tripId), [tripsResource.data]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [incidentType, setIncidentType] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const activeTripId = selectedTripId || trips[0]?.tripId || null;

  const submit = async () => {
    if (!activeTripId || !description.trim()) {
      toast.error("Ch?n chuy?n v? nh?p m? t? s? c?");
      return;
    }
    setSaving(true);
    try {
      await experienceApi.createIncident({
        tripId: activeTripId,
        incidentType,
        description,
      });
      setDescription("");
      toast.success("?? b?o c?o s? c?");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Kh?ng th? b?o c?o s? c?"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="B?o c?o s? c?" description="Ph? xe ch?n chuy?n h?m nay r?i g?i incident v?o backend." icon={<AlertTriangle className="size-7" />} />
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <ExpressiveCard variant="elevated" className="space-y-4 p-5">
          <div className="space-y-2">
            <Label>Chuy?n h?m nay</Label>
            <select value={activeTripId || ""} onChange={(e) => setSelectedTripId(Number(e.target.value))} className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm font-bold">
              {trips.map((trip) => <option key={trip.tripId} value={trip.tripId}>{trip.routeName} ? {trip.departureTime || "ch?a c? gi?"}</option>)}
            </select>
            {tripsResource.loading && <p className="text-xs text-on-surface-variant">?ang t?i chuy?n...</p>}
          </div>
          <div className="space-y-2">
            <Label>Lo?i s? c?</Label>
            <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm">
              <option value="OVERCROWDED">Qu? t?i</option>
              <option value="TECHNICAL">K? thu?t</option>
              <option value="EMERGENCY">Kh?n c?p</option>
              <option value="OTHER">Kh?c</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>M? t?</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <ExpressiveButton onClick={submit} disabled={saving || !activeTripId}>{saving ? "?ang g?i..." : "G?i s? c?"}</ExpressiveButton>
        </ExpressiveCard>
        <AsyncBlock resource={resource}>
          {(items) => (
            <DataList emptyTitle="Ch?a c? s? c?" emptyDescription="C?c s? c? ?? b?o c?o s? xu?t hi?n t?i ??y.">
              {items.map((item) => (
                <ExpressiveCard key={item.incidentId} variant="elevated" className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-bold text-on-surface">{item.incidentType}</h3>
                      <p className="text-sm text-on-surface-variant">{item.description}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{item.routeCode || item.routeName || `Trip #${item.tripId}`} ? {formatDateTime(item.reportedAt)}</p>
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
