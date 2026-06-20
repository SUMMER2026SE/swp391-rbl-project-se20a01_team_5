"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, History, MessageSquare, PackageSearch, QrCode, Route } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { AsyncBlock, DataList, StatusPill, UnavailablePanel, formatDateTime, getErrorMessage, useApiResource } from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { operationsApi, type ConductorTicketView, type DriverTripView, type TicketScanResult } from "@/lib/api/client";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function AssistantModule({ activeId }: Props) {
  if (["ast-lost", "ast-incident", "ast-contact"].includes(activeId)) {
    const title =
      activeId === "ast-lost" ? "Hỗ trợ mất đồ"
      : activeId === "ast-incident" ? "Báo cáo sự cố"
      : "Liên hệ tài xế";
    const icon =
      activeId === "ast-lost" ? <PackageSearch className="size-7" />
      : activeId === "ast-incident" ? <AlertTriangle className="size-7" />
      : <MessageSquare className="size-7" />;
    return <Unavailable title={title} icon={icon} />;
  }
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
                <Label>QR code</Label>
                <Input value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="Dán mã QR từ vé sinh viên" />
              </div>
              <ExpressiveButton onClick={scan}><QrCode className="size-4" /> Quét vé</ExpressiveButton>
            </ExpressiveCard>

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

function Unavailable({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div>
      <PageHeader title={title} description="MVP hiện chưa có endpoint thật cho chức năng này." icon={icon} />
      <UnavailablePanel />
    </div>
  );
}
