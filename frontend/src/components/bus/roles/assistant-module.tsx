"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  AlertTriangle, 
  BadgeCheck, 
  Camera, 
  History, 
  MessageSquare, 
  PackageSearch, 
  QrCode, 
  Route, 
  Send, 
  Phone, 
  ShieldAlert, 
  Search, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Clock,
  User as UserIcon,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { 
  AsyncBlock, 
  DataList, 
  StatusPill, 
  UnavailablePanel, 
  formatDate, 
  formatDateTime, 
  getErrorMessage, 
  useApiResource 
} from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrScannerModal } from "@/components/bus/qr-scanner-modal";
import {
  experienceApi,
  operationsApi,
  conductorApi,
  type ConductorTicketView,
  type DriverTripView,
  type ExperienceIncidentCard,
  type ExperienceLostItemCard,
  type TicketScanResult,
  type ConductorContactView,
  type ContactPersonView,
  type InternalMessageView
} from "@/lib/api/client";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function AssistantModule({ activeId }: Props) {
  if (activeId === "ast-dashboard") return <ConductorDashboardScreen />;
  if (activeId === "ast-history") return <ConductorHistoryScreen />;
  if (activeId === "ast-scan") return <ConductorScanScreen />;
  if (activeId === "ast-monthly") return <ConductorMonthlyScreen />;
  if (activeId === "ast-lost") return <AssistantLostItemsScreen />;
  if (activeId === "ast-incident") return <ConductorIncidentScreen />;
  if (activeId === "ast-contact") return <ConductorContactScreen />;
  return <Unavailable title="Chức năng" icon={<HelpCircle className="size-7" />} />;
}

// ----------------------------------------------------
// 1. CHUYẾN ĐƯỢC PHÂN (ast-dashboard)
// ----------------------------------------------------
function ConductorDashboardScreen() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const loader = useCallback(() => operationsApi.conductorTrips(date), [date]);
  const tripsResource = useApiResource<DriverTripView[]>(loader);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  
  const [tickets, setTickets] = useState<ConductorTicketView[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const trips = useMemo(() => {
    const list = tripsResource.data || [];
    return list.filter(t => t.status !== "COMPLETED" && t.status !== "CANCELLED");
  }, [tripsResource.data]);

  const activeTrip = useMemo(() => {
    if (selectedTripId) {
      return trips.find(t => t.tripId === selectedTripId) || null;
    }
    return trips[0] || null;
  }, [selectedTripId, trips]);

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
    const timer = setTimeout(() => {
      if (activeTrip?.tripId) {
        loadTickets(activeTrip.tripId);
      } else {
        setTickets([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTrip?.tripId, loadTickets]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chuyến được phân"
        description="Danh sách ca chạy được phân công trong ngày."
        icon={<Route className="size-7" />}
        actions={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-full bg-white px-4 border" />}
      />

      <AsyncBlock resource={tripsResource}>
        {() => (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
            <ExpressiveCard variant="elevated" className="p-4 space-y-4">
              <h3 className="text-base font-bold text-on-surface">Chuyến trong ngày ({trips.length})</h3>
              <DataList emptyTitle="Chưa có chuyến" emptyDescription="Không có chuyến xe nào được phân công trong ngày này.">
                {trips.map((trip) => {
                  const isSelected = activeTrip?.tripId === trip.tripId;
                  return (
                    <ExpressiveCard 
                      key={trip.tripId} 
                      variant={isSelected ? "filled" : "elevated"} 
                      onClick={() => setSelectedTripId(trip.tripId)}
                      className={`p-4 cursor-pointer transition-all border ${isSelected ? "border-primary bg-primary/5" : "border-transparent"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="font-bold text-on-surface text-sm sm:text-base">{trip.routeName}</h4>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1">
                            <Clock className="size-3.5" /> Xuất phát: {trip.departureTime || "Chưa có"}
                          </p>
                          <p className="text-xs text-on-surface-variant">Xe: {trip.licensePlate || "Chưa gán"}</p>
                        </div>
                        <StatusPill status={trip.status} />
                      </div>
                    </ExpressiveCard>
                  );
                })}
              </DataList>
            </ExpressiveCard>

            <div className="space-y-6">
              {activeTrip ? (
                <>
                  <ExpressiveCard variant="elevated" className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h3 className="text-xl font-bold text-on-surface">{activeTrip.routeName}</h3>
                        <p className="text-sm text-on-surface-variant mt-0.5">Mã lịch chạy: #{activeTrip.scheduleId} · Ngày chạy: {formatDate(activeTrip.serviceDate)}</p>
                      </div>
                      <StatusPill status={activeTrip.status} />
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-3 text-sm">
                      <div className="space-y-0.5">
                        <span className="text-xs text-on-surface-variant font-medium">Tài xế</span>
                        <p className="font-semibold text-on-surface">{activeTrip.driverName || "Chưa gán"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-on-surface-variant font-medium">Biển số xe</span>
                        <p className="font-semibold text-on-surface">{activeTrip.licensePlate || "Chưa gán"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-on-surface-variant font-medium">Giờ xuất phát</span>
                        <p className="font-semibold text-on-surface">{activeTrip.departureTime || "Chưa có"}</p>
                      </div>
                    </div>
                  </ExpressiveCard>

                  <Section 
                    title={`Hành khách & Vé trong chuyến (${tickets.length})`} 
                    description={ticketsLoading ? "Đang tải danh sách vé..." : "Danh sách vé đã đăng ký trên chuyến xe này."}
                  >
                    <DataList emptyTitle="Chưa có vé" emptyDescription="Chưa có lượt đặt vé nào trên chuyến xe này.">
                      {tickets.map((ticket) => (
                        <ExpressiveCard key={`${ticket.ticketKind}-${ticket.ticketId}`} variant="elevated" className="p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <h4 className="font-bold text-on-surface">{ticket.studentName || ticket.studentCode || `Vé #${ticket.ticketId}`}</h4>
                              <p className="text-sm text-on-surface-variant">{ticket.routeName} · Trạm: {ticket.boardingStopName || "?"} {"->"} {ticket.alightingStopName || "?"}</p>
                              {ticket.lastScannedAt && (
                                <p className="text-xs text-on-surface-variant flex items-center gap-1">
                                  <History className="size-3.5" /> Quét lúc: {formatDateTime(ticket.lastScannedAt)}
                                </p>
                              )}
                            </div>
                            <StatusPill status={ticket.status} />
                          </div>
                        </ExpressiveCard>
                      ))}
                    </DataList>
                  </Section>
                </>
              ) : (
                <div className="rounded-[28px] bg-surface-container p-8 text-center text-on-surface-variant">
                  Vui lòng chọn một chuyến xe ở bên trái để xem chi tiết.
                </div>
              )}
            </div>
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}
// ----------------------------------------------------
// 2. LỊCH SỬ CHUYẾN (ast-history)
// ----------------------------------------------------
function ConductorHistoryScreen() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const loader = useCallback(() => operationsApi.conductorTrips(date), [date]);
  const tripsResource = useApiResource<DriverTripView[]>(loader);

  const historyTrips = useMemo(() => {
    const list = tripsResource.data || [];
    return list.filter(t => t.status === "COMPLETED" || t.status === "CANCELLED");
  }, [tripsResource.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử chuyến"
        description="Danh sách các chuyến xe đã hoàn thành hoặc hủy trong ngày."
        icon={<History className="size-7" />}
        actions={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-full bg-white px-4 border" />}
      />

      <AsyncBlock resource={tripsResource}>
        {() => (
          <DataList emptyTitle="Không có lịch sử" emptyDescription="Không tìm thấy chuyến xe đã kết thúc hoặc hủy nào trong ngày này.">
            {historyTrips.map((trip) => (
              <ExpressiveCard key={trip.tripId} variant="elevated" className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-bold text-on-surface">{trip.routeName}</h3>
                      <StatusPill status={trip.status} />
                    </div>
                    <p className="text-sm text-on-surface-variant">Mã chuyến: #{trip.tripId} · Mã lịch chạy: #{trip.scheduleId}</p>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs text-on-surface-variant pt-1">
                      <p>Xuất phát: {trip.departureTime || "Chưa rõ"}</p>
                      <p>Xe: {trip.licensePlate || "Chưa gán"}</p>
                      {trip.departedAt && <p>Bắt đầu thực tế: {formatDateTime(trip.departedAt)}</p>}
                      {trip.endedAt && <p>Kết thúc thực tế: {formatDateTime(trip.endedAt)}</p>}
                    </div>
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

// ----------------------------------------------------
// 3. QUÉT QR VÉ (ast-scan)
// ----------------------------------------------------
function ConductorScanScreen() {
  const [date] = useState(() => new Date().toISOString().slice(0, 10));
  const loader = useCallback(() => operationsApi.conductorTrips(date), [date]);
  const tripsResource = useApiResource<DriverTripView[]>(loader);
  
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [scanResult, setScanResult] = useState<TicketScanResult | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isCheckingTicket, setIsCheckingTicket] = useState(false);

  const activeTrips = useMemo(() => {
    const list = tripsResource.data || [];
    return list.filter(t => t.status === "RUNNING" || t.status === "ASSIGNED");
  }, [tripsResource.data]);

  const activeTrip = useMemo(() => {
    if (selectedTripId) {
      return activeTrips.find(t => t.tripId === selectedTripId) || null;
    }
    return activeTrips[0] || null;
  }, [selectedTripId, activeTrips]);

  const scan = async () => {
    if (!activeTrip?.tripId || !qrCode.trim()) {
      toast.error("Vui lòng chọn chuyến xe và nhập mã QR!");
      return;
    }
    try {
      const result = await operationsApi.scanTicket(activeTrip.tripId, qrCode.trim());
      setScanResult(result);
      toast[result.valid ? "success" : "error"](result.message || (result.valid ? "Vé hợp lệ" : "Vé không hợp lệ"));
      setQrCode("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể quét vé"));
    }
  };

  const handleCameraScan = async (scannedCode: string) => {
    if (!activeTrip?.tripId) {
      toast.error("Vui lòng chọn chuyến xe trước khi quét!");
      setScannerOpen(false);
      return;
    }
    if (isCheckingTicket) return;
    
    setIsCheckingTicket(true);
    try {
      const result = await operationsApi.scanTicket(activeTrip.tripId, scannedCode.trim());
      setScanResult(result);
      toast[result.valid ? "success" : "error"](result.message || (result.valid ? "Vé hợp lệ" : "Vé không hợp lệ"));
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể quét vé"));
    } finally {
      setIsCheckingTicket(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quét QR vé"
        description="Kiểm soát và quét vé hành khách lên xe."
        icon={<QrCode className="size-7" />}
      />

      <AsyncBlock resource={tripsResource}>
        {() => (
          <div className="max-w-2xl mx-auto space-y-6">
            <ExpressiveCard variant="elevated" className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-on-surface-variant">Chọn chuyến đang kiểm soát</Label>
                {activeTrips.length === 0 ? (
                  <div className="text-sm text-error font-medium p-3 bg-error-container/10 rounded-2xl border border-error/20">
                    Không tìm thấy chuyến xe nào đang hoạt động hôm nay. Vui lòng kiểm tra lại ca chạy.
                  </div>
                ) : (
                  <select
                    value={activeTrip?.tripId || ""}
                    onChange={(event) => setSelectedTripId(Number(event.target.value))}
                    className="h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm font-semibold outline-none focus:border-primary"
                  >
                    {activeTrips.map((trip) => (
                      <option key={trip.tripId} value={trip.tripId}>{trip.routeName} ({trip.departureTime})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="rounded-2xl bg-surface-container-low p-5 space-y-4 border border-outline-variant/30">
                <ExpressiveButton 
                  onClick={() => setScannerOpen(true)} 
                  disabled={!activeTrip}
                  className="w-full justify-center bg-[#beff50] text-[#14140f] hover:bg-[#a6e639] h-16 text-lg font-black shadow-lg rounded-full"
                >
                  <Camera className="size-6 mr-2" />
                  BẬT CAMERA QUÉT VÉ
                </ExpressiveButton>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-outline-variant/50" />
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Hoặc nhập mã tay</span>
                  <div className="flex-1 h-px bg-outline-variant/50" />
                </div>

                <div className="flex gap-2">
                  <Input 
                    value={qrCode} 
                    onChange={(e) => setQrCode(e.target.value)} 
                    placeholder="Nhập mã vé..." 
                    disabled={!activeTrip}
                    className="h-12 bg-surface-container-lowest text-center text-sm font-bold uppercase rounded-2xl" 
                  />
                  <ExpressiveButton onClick={scan} disabled={!activeTrip || !qrCode.trim()} className="h-12 px-6 bg-[#14140f] text-white hover:bg-black/90 rounded-2xl">
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
              <ExpressiveCard 
                variant="elevated" 
                className={`p-5 border-2 rounded-[2rem] ${scanResult.valid ? 'border-emerald-600 bg-emerald-50/50' : 'border-error bg-error-container/10'}`}
              >
                <div className="flex items-start gap-4">
                  {scanResult.valid ? (
                    <CheckCircle2 className="size-8 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="size-8 text-error shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <h3 className={`text-lg font-bold ${scanResult.valid ? 'text-emerald-700' : 'text-error'}`}>
                      {scanResult.message}
                    </h3>
                    {scanResult.ticket && (
                      <div className="text-sm text-on-surface space-y-0.5">
                        <p className="font-semibold">{scanResult.ticket.studentName || scanResult.ticket.studentCode}</p>
                        <p className="text-xs text-on-surface-variant">{scanResult.ticket.routeName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </ExpressiveCard>
            )}
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}
// ----------------------------------------------------
// 4. KIỂM TRA VÉ THÁNG (ast-monthly)
// ----------------------------------------------------
function ConductorMonthlyScreen() {
  const [date] = useState(() => new Date().toISOString().slice(0, 10));
  const loader = useCallback(() => operationsApi.conductorTrips(date), [date]);
  const tripsResource = useApiResource<DriverTripView[]>(loader);
  
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [tickets, setTickets] = useState<ConductorTicketView[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const activeTrips = useMemo(() => {
    return (tripsResource.data || []).filter(t => t.status !== "CANCELLED");
  }, [tripsResource.data]);

  const activeTrip = useMemo(() => {
    if (selectedTripId) {
      return activeTrips.find(t => t.tripId === selectedTripId) || null;
    }
    return activeTrips[0] || null;
  }, [selectedTripId, activeTrips]);

  const loadTickets = useCallback(async (tripId: number) => {
    setLoading(true);
    try {
      const all = await operationsApi.conductorTickets(tripId);
      setTickets(all.filter(t => t.ticketKind === "MONTHLY"));
    } catch (error) {
      toast.error("Không tải được danh sách vé tháng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTrip?.tripId) {
        loadTickets(activeTrip.tripId);
      } else {
        setTickets([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTrip?.tripId, loadTickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(t => 
      (t.studentName || "").toLowerCase().includes(q) || 
      (t.studentCode || "").toLowerCase().includes(q) ||
      (t.qrCode || "").toLowerCase().includes(q)
    );
  }, [tickets, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kiểm tra vé tháng"
        description="Danh sách và thông tin chi tiết vé tháng của hành khách."
        icon={<BadgeCheck className="size-7" />}
      />

      <AsyncBlock resource={tripsResource}>
        {() => (
          <div className="space-y-6">
            <ExpressiveCard variant="elevated" className="p-5 grid gap-4 sm:grid-cols-2 items-end">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-on-surface-variant">Chọn chuyến xe</Label>
                <select
                  value={activeTrip?.tripId || ""}
                  onChange={(event) => setSelectedTripId(Number(event.target.value))}
                  className="h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm font-semibold outline-none focus:border-primary"
                >
                  {activeTrips.map((trip) => (
                    <option key={trip.tripId} value={trip.tripId}>{trip.routeName} ({trip.departureTime})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-on-surface-variant">Tìm kiếm vé tháng</Label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập tên, mã SV hoặc QR code..."
                    className="h-12 pl-10 rounded-2xl bg-surface-container-lowest"
                  />
                </div>
              </div>
            </ExpressiveCard>

            <Section title={`Danh sách vé tháng (${filteredTickets.length})`} description={loading ? "Đang cập nhật..." : ""}>
              <DataList emptyTitle="Không tìm thấy vé tháng" emptyDescription="Không có vé tháng nào khớp với thông tin tìm kiếm.">
                {filteredTickets.map((ticket) => (
                  <ExpressiveCard key={ticket.ticketId} variant="elevated" className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <h4 className="font-bold text-on-surface text-base">{ticket.studentName || ticket.studentCode}</h4>
                        <p className="text-sm text-on-surface-variant">Mã SV: {ticket.studentCode} · QR: {ticket.qrCode}</p>
                        <p className="text-xs text-on-surface-variant">Tuyến: {ticket.routeName} · Trạm boarding: {ticket.boardingStopName || "?"}</p>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-1 text-xs">
                        <StatusPill status={ticket.status} />
                        {ticket.lastScannedAt && <p className="text-on-surface-variant mt-1">Quét lúc: {formatDateTime(ticket.lastScannedAt)}</p>}
                      </div>
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

// ----------------------------------------------------
// 5. HỖ TRỢ MẤT ĐỒ (ast-lost)
// ----------------------------------------------------
function AssistantLostItemsScreen() {
  const resource = useApiResource<ExperienceLostItemCard[]>(useCallback(() => experienceApi.assistantLostItems(), []));

  const update = async (item: ExperienceLostItemCard, status: string) => {
    try {
      await experienceApi.updateAssistantLostItem(item.lostItemReportId, {
        status,
        notes: status === "FOUND" ? "Phụ xe đã tìm thấy và liên hệ sinh viên." : item.notes,
      });
      toast.success("Đã cập nhật trạng thái mất đồ");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật đồ thất lạc"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Hỗ trợ mất đồ" description="Hỗ trợ tìm kiếm và trả lại đồ thất lạc cho sinh viên." icon={<PackageSearch className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có báo mất đồ" emptyDescription="Danh sách khai báo mất đồ của sinh viên sẽ xuất hiện ở đây.">
            {items.map((item) => (
              <ExpressiveCard key={item.lostItemReportId} variant="elevated" className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-on-surface text-base sm:text-lg">{item.itemDescription}</h3>
                    <p className="text-sm text-on-surface-variant font-medium">Báo bởi: {item.reporterName || "Sinh viên"} · Tuyến: {item.routeCode || item.routeName || "Chưa gắn"}</p>
                    <p className="text-xs text-on-surface-variant">Thời gian báo: {formatDateTime(item.reportedAt)}</p>
                    {item.notes && <p className="mt-2 rounded-2xl bg-surface-container-low p-3.5 text-sm text-on-surface-variant border border-outline-variant/20">{item.notes}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <StatusPill status={item.status} />
                    <div className="flex gap-1.5 w-full sm:w-auto">
                      <ExpressiveButton size="sm" variant="tonal" onClick={() => update(item, "SEARCHING")}>Đang tìm</ExpressiveButton>
                      <ExpressiveButton size="sm" onClick={() => update(item, "FOUND")}>Đã tìm thấy</ExpressiveButton>
                      <ExpressiveButton size="sm" variant="error" onClick={() => update(item, "NOT_FOUND")}>Không thấy</ExpressiveButton>
                    </div>
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
// ----------------------------------------------------
// 6. BÁO CÁO SỰ CỐ (ast-incident)
// ----------------------------------------------------
function ConductorIncidentScreen() {
  const [date] = useState(() => new Date().toISOString().slice(0, 10));
  const tripsResource = useApiResource<DriverTripView[]>(useCallback(() => operationsApi.conductorTrips(date), [date]));
  const resource = useApiResource<ExperienceIncidentCard[]>(useCallback(() => experienceApi.incidents(), []));

  const [selectedTripId, setSelectedTripId] = useState("");
  const [incidentType, setIncidentType] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tripsResource.data) {
        const running = tripsResource.data.find(t => t.status === "RUNNING");
        if (running) {
          setSelectedTripId(String(running.tripId));
        } else if (tripsResource.data.length > 0) {
          setSelectedTripId(String(tripsResource.data[0].tripId));
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [tripsResource.data]);

  const submit = async () => {
    if (!selectedTripId || !description.trim()) {
      toast.error("Vui lòng chọn hoặc nhập Trip ID và mô tả sự cố!");
      return;
    }
    setSaving(true);
    try {
      await experienceApi.createIncident({
        tripId: Number(selectedTripId),
        incidentType,
        description,
      });
      setDescription("");
      toast.success("Báo cáo sự cố gửi thành công!");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể báo cáo sự cố"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Báo cáo sự cố" description="Khai báo các sự cố kỹ thuật, quá tải hoặc khẩn cấp xảy ra trên xe." icon={<AlertTriangle className="size-7" />} />
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <ExpressiveCard variant="elevated" className="space-y-4 p-5 h-fit">
          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-on-surface-variant">Chọn chuyến xe bị sự cố</Label>
            <AsyncBlock resource={tripsResource}>
              {() => (
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm font-semibold outline-none focus:border-primary"
                >
                  <option value="">-- Nhập Trip ID thủ công --</option>
                  {(tripsResource.data || []).map((t) => (
                    <option key={t.tripId} value={t.tripId}>{t.routeName} ({t.departureTime})</option>
                  ))}
                </select>
              )}
            </AsyncBlock>
            {!selectedTripId && (
              <Input 
                type="number" 
                placeholder="Nhập Trip ID tự do..." 
                value={selectedTripId} 
                onChange={(e) => setSelectedTripId(e.target.value)} 
                className="mt-2 rounded-2xl bg-surface-container-lowest" 
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-on-surface-variant">Loại sự cố</Label>
            <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className="h-12 w-full rounded-2xl border bg-surface-container-lowest px-4 text-sm font-semibold outline-none focus:border-primary">
              <option value="OVERCROWDED">Hành khách quá tải</option>
              <option value="TECHNICAL">Sự cố kỹ thuật</option>
              <option value="EMERGENCY">Trường hợp khẩn cấp</option>
              <option value="OTHER">Sự cố khác</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-on-surface-variant">Mô tả chi tiết</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập chi tiết sự cố..."
              rows={4}
              className="w-full rounded-2xl border bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary resize-none transition-colors"
            />
          </div>
          <ExpressiveButton onClick={submit} disabled={saving} className="w-full justify-center rounded-full mt-2 bg-[#14140f] text-white">
            {saving ? "Đang gửi..." : "Gửi báo cáo"}
          </ExpressiveButton>
        </ExpressiveCard>

        <AsyncBlock resource={resource}>
          {(items) => (
            <DataList emptyTitle="Chưa có báo cáo sự cố" emptyDescription="Các sự cố đã gửi sẽ hiển thị ở danh sách bên dưới.">
              {items.map((item) => (
                <ExpressiveCard key={item.incidentId} variant="elevated" className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold text-on-surface text-base">{item.incidentType}</h4>
                      <p className="text-sm text-on-surface-variant">{item.description}</p>
                      <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5 pt-0.5">
                        <Clock className="size-3.5" /> Báo lúc: {formatDateTime(item.reportedAt)} · Trip: #{item.tripId}
                      </p>
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

// ----------------------------------------------------
// 7. HỖ TRỢ & LIÊN HỆ (ast-contact)
// ----------------------------------------------------
function ConductorContactScreen() {
  const [contact, setContact] = useState<ConductorContactView | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [chatText, setChatText] = useState("");
  const [recipientType, setRecipientType] = useState<"DRIVER" | "DISPATCHER">("DRIVER");

  // Incident/Support state
  const [reportType, setReportType] = useState("OTHER");
  const [passengerName, setPassengerName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const loadContact = useCallback(async () => {
    try {
      const data = await conductorApi.contact();
      setContact(data);
    } catch (err) {
      console.error("Lỗi lấy thông tin liên hệ phụ xe:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContact();
    }, 0);
    const interval = setInterval(() => {
      loadContact();
    }, 4000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !contact) return;
    try {
      setSending(true);
      await conductorApi.sendMessage({
        tripId: contact.activeTripId || undefined,
        recipientType,
        content: chatText.trim()
      });
      setChatText("");
      await loadContact();
    } catch (err: any) {
      toast.error(err.message || "Không gửi được tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const handleReportSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !contact) return;
    if (!contact.activeTripId) {
      toast.error("Bạn cần có chuyến xe đang hoạt động để gửi báo cáo hỗ trợ!");
      return;
    }
    try {
      setReporting(true);
      await conductorApi.submitSupport({
        tripId: contact.activeTripId,
        reportType,
        passengerName: passengerName.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim()
      });
      toast.success("Báo cáo hỗ trợ đã được gửi thành công!");
      setDescription("");
      setPassengerName("");
      setLocation("");
      await loadContact();
    } catch (err: any) {
      toast.error(err.message || "Gửi báo cáo thất bại");
    } finally {
      setReporting(false);
    }
  };

  const displayMessages = useMemo(() => {
    if (!contact || !contact.messages) return [];
    
    const targetContact = contact.contacts?.find(c => c.role.toUpperCase() === recipientType);
    const targetUserId = targetContact?.userId;

    return contact.messages.filter(msg => {
      if (msg.content.startsWith("[INCIDENT]") || msg.content.startsWith("[LOST_ITEM]")) {
        return false;
      }
      if (recipientType === "DRIVER") {
        return (msg.recipientUserId === targetUserId) || (msg.senderUserId === targetUserId);
      } else {
        const otherContact = contact.contacts?.find(c => c.userId === (msg.senderUserId === msg.recipientUserId ? msg.recipientUserId : (msg.senderName === "Phụ xe" ? msg.recipientUserId : msg.senderUserId)));
        return otherContact?.role?.toUpperCase() === "DISPATCHER" || msg.senderName.includes("Dispatcher") || msg.recipientName.includes("Dispatcher");
      }
    });
  }, [contact, recipientType]);

  if (loading && !contact) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="rounded-[28px] bg-surface-container p-6 text-center text-on-surface-variant">
        Không tìm thấy thông tin liên hệ điều phối và tài xế cho ca trực này.
      </div>
    );
  }

  const driver = contact.contacts?.find(c => c.role.toUpperCase() === "DRIVER");
  const dispatcher = contact.contacts?.find(c => c.role.toUpperCase() === "DISPATCHER" && c.primary) || contact.contacts?.find(c => c.role.toUpperCase() === "DISPATCHER");

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Liên hệ tài xế & điều phối" 
        description="Trao đổi với tài xế, điều phối viên hoặc gửi báo cáo hỗ trợ/SOS." 
        icon={<MessageSquare className="size-7" />} 
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        <ExpressiveCard variant="elevated" className="flex flex-col h-[550px] p-0 overflow-hidden">
          <div className="flex border-b bg-surface-container-low shrink-0">
            <button 
              onClick={() => setRecipientType("DRIVER")}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                recipientType === "DRIVER" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Tài xế ({driver?.name || "Chưa phân"})
            </button>
            <button 
              onClick={() => setRecipientType("DISPATCHER")}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                recipientType === "DISPATCHER" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Điều phối ({dispatcher?.name || "Ban Điều Phối"})
            </button>
          </div>

          <div className="px-4 py-2 bg-surface-container-low border-b flex justify-between items-center text-xs text-on-surface-variant shrink-0">
            <span>
              {recipientType === "DRIVER" 
                ? `Tài xế: ${driver?.name || "Chưa rõ"} · ${driver?.phoneNumber || "Chưa có SĐT"}`
                : `Điều phối viên chính: ${dispatcher?.name || "Chưa rõ"}`}
            </span>
            {recipientType === "DRIVER" && driver?.phoneNumber && (
              <a href={`tel:${driver.phoneNumber}`} className="flex items-center gap-1 font-bold text-primary hover:underline">
                <Phone className="size-3" /> Gọi tài xế
              </a>
            )}
            {recipientType === "DISPATCHER" && dispatcher?.phoneNumber && (
              <a href={`tel:${dispatcher.phoneNumber}`} className="flex items-center gap-1 font-bold text-primary hover:underline">
                <Phone className="size-3" /> Gọi điều phối
              </a>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-lowest scrollbar-soft">
            {displayMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                Chưa có tin nhắn nào với {recipientType === "DRIVER" ? "Tài xế" : "Điều phối viên"}.
              </div>
            ) : (
              displayMessages.map((msg) => {
                const isMe = msg.senderName === "Phụ xe" || msg.senderUserId === contact.contacts?.find(c => c.name === "Phụ xe")?.userId;
                const senderDisplayName = msg.senderName === "Phụ xe" ? "Bạn" : msg.senderName;
                return (
                  <div key={msg.messageId} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[75%] space-y-0.5">
                      {!isMe && <p className="text-[10px] text-on-surface-variant/80 font-semibold px-1">{senderDisplayName}</p>}
                      <div className={`rounded-[1.25rem] px-4 py-2 text-sm ${
                        isMe 
                          ? "bg-[#beff50] text-[#14140f] rounded-tr-none font-medium" 
                          : "bg-surface-container-high text-on-surface rounded-tl-none"
                      }`}>
                        <p className="break-words">{msg.content}</p>
                        <p className="mt-0.5 text-[9px] opacity-60 text-right">
                          {msg.sentAt ? formatDateTime(msg.sentAt).split(" ")[0] : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="border-t p-3 bg-surface-container-low flex gap-2 shrink-0">
            <Input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={`Nhắn cho ${recipientType === "DRIVER" ? "Tài xế" : "Điều phối viên"}...`}
              disabled={sending}
              className="flex-1 rounded-full bg-surface-container border-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            <button 
              type="submit" 
              disabled={sending || !chatText.trim()}
              className="flex size-10 items-center justify-center rounded-full bg-[#14140f] text-white hover:bg-black/80 disabled:opacity-40 transition-colors"
            >
              <Send className="size-4" />
            </button>
          </form>
        </ExpressiveCard>

        {/* Khung Báo Cáo Hỗ Trợ/SOS */}
        <ExpressiveCard variant="elevated" className="p-5 h-fit space-y-4 border border-error/20 bg-error-container/5">
          <div className="flex items-center gap-2 text-error">
            <ShieldAlert className="size-6 shrink-0" />
            <h3 className="font-bold text-lg">Báo cáo & Hỗ trợ (SOS)</h3>
          </div>
          
          <form onSubmit={handleReportSupport} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Phân loại báo cáo</label>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-2xl border bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="OTHER">Hỗ trợ khác</option>
                <option value="LOST_ITEM">Khai báo mất đồ</option>
                <option value="TECHNICAL">Sự cố kỹ thuật xe</option>
                <option value="OVERCROWDED">Hành khách quá tải</option>
                <option value="EMERGENCY">Khẩn cấp / Y tế / Tai nạn</option>
              </select>
            </div>

            {reportType === "LOST_ITEM" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant">Tên hành khách (nếu có)</label>
                <Input 
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Tên hoặc mã SV của hành khách..."
                  className="rounded-2xl bg-surface-container-lowest"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Vị trí hiện tại</label>
              <Input 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Nhập tên trạm hoặc tọa độ hiện tại..."
                className="rounded-2xl bg-surface-container-lowest"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Mô tả sự việc</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả sự việc chi tiết để tài xế và điều phối hỗ trợ..."
                required
                rows={4}
                className="w-full rounded-2xl border bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary resize-none transition-colors"
              />
            </div>

            {contact.activeTripId ? (
              <p className="text-[11px] text-on-surface-variant/80">
                Báo cáo sẽ được chuyển tới Tài xế và Ban Điều Phối ngay lập tức.
              </p>
            ) : (
              <p className="text-[11px] text-error font-medium">
                Cảnh báo: Bạn không có chuyến xe nào đang chạy. Chỉ có thể gửi báo cáo khi có chuyến đang hoạt động.
              </p>
            )}

            <ExpressiveButton 
              type="submit" 
              variant="error" 
              disabled={reporting || !description.trim() || !contact.activeTripId} 
              className="w-full justify-center gap-1.5 rounded-full"
            >
              <AlertTriangle className="size-4" />
              {reporting ? "Đang gửi báo cáo..." : "GỬI BÁO CÁO NGAY"}
            </ExpressiveButton>
          </form>
        </ExpressiveCard>
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
