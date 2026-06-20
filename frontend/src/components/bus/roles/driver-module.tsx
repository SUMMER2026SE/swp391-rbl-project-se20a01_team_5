"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, History, Loader2, MapPin, MessageSquare, Navigation, Phone, PlayCircle, RefreshCw, Route, Send, ShieldAlert, Wrench } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { AsyncBlock, DataList, StatusPill, formatDate, formatDateTime, getErrorMessage, useApiResource } from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { driverDispatchApi, operationsApi, type DispatcherContact, type DriverTripOverview, type DriverTripView } from "@/lib/api/client";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

const SOS_OPTIONS = [
  { label: "Hỏng xe / Nổ lốp", type: "TECHNICAL", description: "Tài xế báo hỏng xe hoặc nổ lốp, cần điều phối hỗ trợ.", icon: Wrench },
  { label: "Kẹt xe nghiêm trọng", type: "OTHER", description: "Tài xế báo kẹt xe nghiêm trọng, có thể ảnh hưởng lịch trình.", icon: AlertTriangle },
  { label: "Tai nạn / Cấp cứu y tế", type: "EMERGENCY", description: "Tài xế báo tai nạn hoặc tình huống y tế khẩn cấp.", icon: ShieldAlert },
];

export function DriverModule({ activeId, onNavigate }: Props) {
  if (activeId === "drv-dashboard") return <DriverDashboardOverview onNavigate={onNavigate} />;
  if (activeId === "drv-contact") return <DriverContact />;
  return <TripsScreen mode={activeId} />;
}

function DriverDashboardOverview({ onNavigate }: { onNavigate: (id: string) => void }) {
  const resource = useApiResource<DriverTripOverview>(useCallback(() => operationsApi.driverTripOverview(), []));
  return (
    <div>
      <PageHeader title="Tổng quan tài xế" description="Chuyến gần nhất, lịch chạy tiếp theo và lịch sử từ backend hiện tại." icon={<CalendarClock className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(overview) => {
          const nearest = overview.nearestTrip;
          const running = nearest?.status === "RUNNING";
          return (
            <div className="grid items-start gap-5 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="space-y-5">
                <ExpressiveCard variant="elevated" className="p-5 sm:p-7">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-primary">Chuyến được phân công gần nhất</p>
                      <h1 className="mt-1 text-2xl font-black text-on-surface">{nearest?.routeName || "Chưa có chuyến"}</h1>
                    </div>
                    <StatusPill status={nearest?.status || "NONE"} />
                  </div>
                  <div onClick={() => onNavigate("drv-schedule")} className="flex h-[320px] max-h-[45vh] cursor-pointer items-center justify-center rounded-3xl border border-outline-variant bg-surface-container-highest p-6 text-center transition hover:border-primary">
                    {nearest ? (
                      <div className="max-w-md">
                        <MapPin className="mx-auto mb-3 size-10 text-primary" />
                        <h2 className="text-2xl font-black text-on-surface">{nearest.routeName}</h2>
                        <p className="mt-2 font-bold text-on-surface-variant">{formatDate(nearest.serviceDate)} · {nearest.departureTime || "Chưa có giờ"} · {nearest.licensePlate || "Chưa gán xe"}</p>
                        <p className="mt-1 text-sm text-on-surface-variant">{nearest.tripId ? "Nhấn để xem chi tiết chuyến" : "Chưa tạo chuyến, sẽ hiện nút chạy khi điều phối tạo trip"}</p>
                      </div>
                    ) : (
                      <EmptyState icon={<Navigation className="size-7" />} title="Chưa có chuyến được phân công" description="Kiểm tra lịch điều phối hoặc tài khoản tài xế." />
                    )}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <ExpressiveButton onClick={() => onNavigate(running ? "drv-active" : "drv-schedule")} disabled={!nearest}>
                      <PlayCircle className="size-4" /> {running ? "Mở chuyến đang chạy" : "Mở chuyến được phân công"}
                    </ExpressiveButton>
                    <ExpressiveButton variant="tonal" onClick={resource.reload}><RefreshCw className="size-4" /> Làm mới</ExpressiveButton>
                  </div>
                </ExpressiveCard>
              </div>

              <div className="space-y-5">
                <TripList title="Lịch chạy tiếp theo" icon={<CalendarClock className="size-5" />} trips={overview.upcomingTrips} empty="Chưa có lịch tiếp theo" />
                <TripList title="Lịch sử chuyến đi" icon={<History className="size-5" />} trips={overview.historyTrips.slice(0, 5)} empty="Chưa có lịch sử chuyến đi" compact />
                <ExpressiveCard variant="outlined" className="p-5">
                  <h3 className="font-black text-on-surface">Hỗ trợ khẩn cấp</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">Liên hệ điều phối khi có sự cố hoặc thay đổi lịch trình.</p>
                  <ExpressiveButton className="mt-4 w-full" variant="tonal" onClick={() => onNavigate("drv-contact")}><MessageSquare className="size-4" /> Liên hệ điều phối</ExpressiveButton>
                </ExpressiveCard>
              </div>
            </div>
          );
        }}
      </AsyncBlock>
    </div>
  );
}

function TripsScreen({ mode }: { mode: string }) {
  const resource = useApiResource<DriverTripOverview>(useCallback(() => operationsApi.driverTripOverview(), []));
  const title = mode === "drv-active" ? "Chuyến đang chạy" : mode === "drv-history" ? "Lịch sử chuyến" : mode === "drv-route" ? "Tuyến được phân" : "Lịch chạy xe";

  const start = async (trip: DriverTripView) => {
    if (!trip.tripId) return toast.error("Chuyến chưa được tạo, chưa thể bắt đầu");
    try {
      await operationsApi.startTrip(trip.tripId);
      toast.success("Đã bắt đầu chuyến");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể bắt đầu chuyến"));
    }
  };

  const end = async (trip: DriverTripView) => {
    if (!trip.tripId) return toast.error("Chuyến chưa được tạo");
    try {
      await operationsApi.endTrip(trip.tripId);
      toast.success("Đã kết thúc chuyến");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể kết thúc chuyến"));
    }
  };

  return (
    <div>
      <PageHeader title={title} description="Không chọn ngày thủ công; dữ liệu lấy từ overview tài xế theo main hiện tại." icon={<Route className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(overview) => {
          const allTrips = [overview.nearestTrip, ...overview.upcomingTrips, ...overview.historyTrips].filter(Boolean) as DriverTripView[];
          const activeTrips = allTrips.filter((trip) => trip.status === "RUNNING");
          const visibleTrips = mode === "drv-active" ? activeTrips : mode === "drv-history" ? overview.historyTrips : allTrips;
          return (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Chuyến gần nhất" value={overview.nearestTrip?.routeName || "Chưa có"} icon={<Navigation className="size-6" />} accent="primary" />
                <StatCard label="Đang chạy" value={activeTrips.length ? "Có" : "Không"} icon={<PlayCircle className="size-6" />} accent={activeTrips.length ? "success" : "secondary"} />
                <StatCard label="Sắp tới" value={overview.upcomingTrips.length} icon={<CalendarClock className="size-6" />} accent="tertiary" />
                <StatCard label="Lịch sử" value={overview.historyTrips.length} icon={<History className="size-6" />} accent="success" />
              </div>
              {mode === "drv-active" && activeTrips.length === 0 ? (
                <EmptyState icon={<PlayCircle className="size-7" />} title="Chưa có chuyến đang chạy" description="Bắt đầu một chuyến trong lịch để trạng thái xuất hiện tại đây." />
              ) : (
                <Section title="Danh sách chuyến">
                  <DataList emptyTitle="Chưa có chuyến" emptyDescription="Backend chưa phân chuyến phù hợp.">
                    {visibleTrips.map((trip, index) => <TripCard key={tripKey(trip, index)} trip={trip} onStart={() => start(trip)} onEnd={() => end(trip)} />)}
                  </DataList>
                </Section>
              )}
            </div>
          );
        }}
      </AsyncBlock>
    </div>
  );
}

function TripList({ title, icon, trips, empty, compact = false }: { title: string; icon: React.ReactNode; trips: DriverTripView[]; empty: string; compact?: boolean }) {
  return (
    <ExpressiveCard variant="elevated" className="p-5">
      <h3 className="mb-4 flex items-center gap-2 font-black text-on-surface">{icon}{title}</h3>
      <DataList emptyTitle={empty} emptyDescription="Dữ liệu lấy từ backend operations.">
        {trips.map((trip, index) => <TripMiniCard key={tripKey(trip, index)} trip={trip} compact={compact} />)}
      </DataList>
    </ExpressiveCard>
  );
}

function TripMiniCard({ trip, compact = false }: { trip: DriverTripView; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-on-surface">{formatDate(trip.serviceDate)} · {trip.departureTime || "Chưa có giờ"}</p>
          <p className="mt-1 text-sm font-bold text-on-surface">{trip.routeName}</p>
          {!compact && <p className="text-xs text-on-surface-variant">{trip.licensePlate || "Chưa gán xe"} · {trip.conductorName || "Chưa gán phụ xe"}</p>}
        </div>
        <StatusPill status={trip.status} />
      </div>
    </div>
  );
}

function TripCard({ trip, onStart, onEnd }: { trip: DriverTripView; onStart: () => void; onEnd: () => void }) {
  const running = trip.status === "RUNNING" || (!!trip.departedAt && !trip.endedAt);
  const finished = trip.status === "COMPLETED" || trip.status === "CANCELLED" || !!trip.endedAt;
  return (
    <ExpressiveCard variant="elevated" className="p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-on-surface">{trip.routeName}</h3>
            <StatusPill status={trip.status} />
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">{formatDate(trip.serviceDate)} · {trip.departureTime || "Chưa có giờ"} · Xe {trip.licensePlate || "chưa gán"} · Phụ xe {trip.conductorName || "chưa gán"}</p>
          <p className="mt-2 text-xs text-on-surface-variant">Bắt đầu: {formatDateTime(trip.departedAt)} · Kết thúc: {formatDateTime(trip.endedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExpressiveButton variant="filled" disabled={!trip.tripId || !!trip.departedAt || finished} onClick={onStart}><PlayCircle className="size-4" /> Bắt đầu</ExpressiveButton>
          <ExpressiveButton variant="tonal" disabled={!trip.tripId || !running} onClick={onEnd}>Kết thúc</ExpressiveButton>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {(trip.stops || []).slice(0, 8).map((stop) => (
          <div key={`${tripKey(trip)}-${stop.stopId}`} className="rounded-xl bg-surface-container-high p-3">
            <div className="flex items-center gap-2"><MapPin className="size-4 text-on-surface-variant" /><span className="truncate text-sm font-bold text-on-surface">{stop.stopName}</span></div>
            <p className="mt-1 text-xs text-on-surface-variant">Thứ tự {stop.stopOrder}</p>
          </div>
        ))}
      </div>
    </ExpressiveCard>
  );
}

function DriverContact() {
  const resource = useApiResource<DispatcherContact>(useCallback(() => driverDispatchApi.contact(), []));
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [incidentType, setIncidentType] = useState<string | null>(null);

  const sendMessage = async (contact: DispatcherContact) => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const created = await driverDispatchApi.sendMessage({ tripId: contact.activeTripId, content: message.trim() });
      resource.setData({ ...contact, messages: [...(contact.messages || []), created] });
      setMessage("");
      toast.success("Đã gửi tin nhắn");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không gửi được tin nhắn"));
    } finally {
      setSending(false);
    }
  };

  const sendSos = async (contact: DispatcherContact, option: (typeof SOS_OPTIONS)[number]) => {
    setIncidentType(option.type);
    try {
      await driverDispatchApi.reportIncident({ tripId: contact.activeTripId, incidentType: option.type, description: option.description });
      toast.success(`Đã gửi SOS ${option.label}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không gửi được SOS"));
    } finally {
      setIncidentType(null);
    }
  };

  return (
    <div>
      <PageHeader title="Liên hệ điều phối" description="Chat nội bộ giữ riêng với SOS; SOS vẫn gửi sang điều phối nhưng không làm trôi khung chat." icon={<MessageSquare className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(contact) => {
          const messages = [...(contact.messages || [])].filter((msg) => !msg.content?.trim().startsWith("[SOS]")).sort((a, b) => new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime());
          return (
            <div className="grid items-start gap-5 xl:grid-cols-[0.9fr_1fr]">
              <div className="space-y-5">
                <ExpressiveCard variant="elevated" className="p-5">
                  <h2 className="text-xl font-black text-on-surface">{contact.dispatcherName || "Chưa có điều phối viên"}</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">{contact.department || "Trung tâm điều phối"}</p>
                  <ExpressiveButton className="mt-4 w-full" variant="tonal" disabled={!contact.phoneNumber} onClick={() => contact.phoneNumber && window.open(`tel:${contact.phoneNumber.replaceAll(" ", "")}`)}><Phone className="size-4" /> Gọi điện thoại</ExpressiveButton>
                </ExpressiveCard>
                <ExpressiveCard variant="outlined" className="p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-black text-on-surface"><AlertTriangle className="size-5 text-error" /> Báo cáo sự cố (SOS)</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SOS_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const busy = incidentType === option.type;
                      return <ExpressiveButton key={option.type} variant={option.type === "EMERGENCY" ? "error" : "tonal"} className="min-h-24 flex-col" disabled={busy || !contact.dispatcherUserId} onClick={() => sendSos(contact, option)}>{busy ? <Loader2 className="size-5 animate-spin" /> : <Icon className="size-5" />} {option.label}</ExpressiveButton>;
                    })}
                  </div>
                </ExpressiveCard>
              </div>
              <ExpressiveCard variant="elevated" className="flex h-[620px] max-h-[70vh] flex-col overflow-hidden">
                <div className="border-b border-outline-variant p-5"><h3 className="font-black text-on-surface">Chat nội bộ</h3></div>
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {messages.length === 0 ? <EmptyState icon={<MessageSquare className="size-7" />} title="Chưa có tin nhắn" description="Tin nhắn SOS được ẩn khỏi khung chat tài xế." /> : messages.map((msg) => {
                    const mine = msg.senderUserId !== contact.dispatcherUserId;
                    return <div key={msg.messageId} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm font-semibold ${mine ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"}`}><p>{msg.content}</p><p className="mt-1 text-[11px] opacity-70">{formatDateTime(msg.sentAt)}</p></div></div>;
                  })}
                </div>
                <div className="flex gap-2 border-t border-outline-variant p-4">
                  <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Nhập tin nhắn..." onKeyDown={(event) => { if (event.key === "Enter") sendMessage(contact); }} />
                  <ExpressiveButton disabled={sending || !message.trim() || !contact.dispatcherUserId} onClick={() => sendMessage(contact)}>{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</ExpressiveButton>
                </div>
              </ExpressiveCard>
            </div>
          );
        }}
      </AsyncBlock>
    </div>
  );
}

function tripKey(trip: DriverTripView, index = 0) {
  return trip.tripId ? `trip-${trip.tripId}` : `schedule-${trip.scheduleId || "x"}-${trip.serviceDate || "x"}-${index}`;
}
