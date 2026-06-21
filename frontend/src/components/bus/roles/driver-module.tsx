"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, History, MapPin, MessageSquare, PlayCircle, Route, Send, AlertTriangle, Phone, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { AsyncBlock, DataList, StatusPill, UnavailablePanel, formatDate, formatDateTime, getErrorMessage, useApiResource } from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { experienceApi, operationsApi, driverDispatchApi, type DriverDashboardView, type DriverTripView, type DispatcherContact } from "@/lib/api/client";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function DriverModule({ activeId }: Props) {
  if (activeId === "drv-dashboard") return <DriverDashboardOverview />;
  if (activeId === "drv-contact") return <ContactScreen />;
  return <TripsScreen mode={activeId} />;
}

function DriverDashboardOverview() {
  const resource = useApiResource<DriverDashboardView>(useCallback(() => experienceApi.driverDashboard(), []));
  return (
    <div>
      <PageHeader title="Tổng quan tài xế" description="Ca chạy, chuyến active và phản hồi từ dữ liệu thật." icon={<CalendarClock className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(dashboard) => (
          <div className="space-y-6">
            <div className="rounded-[28px] bg-[#14140f] p-5 text-white shadow-[0_18px_50px_rgba(20,20,15,0.16)] sm:p-7">
              <p className="text-sm font-semibold text-white/60">Xin chào</p>
              <h1 className="mt-1 text-3xl font-black sm:text-4xl">{dashboard.fullName}</h1>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <InfoDark label="Chuyến active" value={dashboard.activeTrip?.routeCode || dashboard.activeTrip?.routeName || "Chưa có"} />
                <InfoDark label="Biển số" value={dashboard.activeTrip?.licensePlate || "Chưa gán"} />
                <InfoDark label="Mật độ" value={dashboard.activeTrip?.occupancy != null ? `${dashboard.activeTrip.occupancy}/${dashboard.activeTrip.seatCount || "?"}` : "Đang cập nhật"} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dashboard.stats.map((stat) => (
                <StatCard key={stat.label} label={stat.label} value={`${stat.value}${stat.unit ? ` ${stat.unit}` : ""}`} icon={<Route className="size-6" />} accent={toAccent(stat.tone)} />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <Section title="Chuyến hôm nay" description="Danh sách từ dashboard aggregate">
                <DataList emptyTitle="Chưa có chuyến" emptyDescription="Backend chưa phân chuyến cho tài xế này.">
                  {dashboard.trips.slice(0, 5).map((trip) => (
                    <ExpressiveCard key={trip.tripId} variant="elevated" className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-on-surface">{trip.routeCode || trip.routeName}</h3>
                          <p className="text-sm text-on-surface-variant">Xe {trip.licensePlate || "chưa gán"} · {trip.departureTime || "chưa có giờ"}</p>
                        </div>
                        <StatusPill status={trip.status} />
                      </div>
                    </ExpressiveCard>
                  ))}
                </DataList>
              </Section>
              <Section title="Phản hồi gần đây" description="Feedback gắn với chuyến của tài xế">
                <DataList emptyTitle="Chưa có phản hồi" emptyDescription="Phản hồi từ sinh viên sẽ xuất hiện tại đây.">
                  {dashboard.feedback.slice(0, 4).map((item) => (
                    <ExpressiveCard key={item.feedbackId} variant="elevated" className="p-4">
                      <h3 className="font-bold text-on-surface">{item.studentName || "Sinh viên"}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">{item.content}</p>
                    </ExpressiveCard>
                  ))}
                </DataList>
              </Section>
            </div>
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function toAccent(tone?: string): "primary" | "tertiary" | "secondary" | "error" | "success" | "warning" {
  if (tone === "success") return "success";
  if (tone === "error") return "error";
  if (tone === "warning") return "warning";
  if (tone === "secondary") return "secondary";
  if (tone === "tertiary") return "tertiary";
  return "primary";
}

function InfoDark({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 truncate text-lg font-black">{value || "Chưa có"}</p>
    </div>
  );
}

function TripsScreen({ mode }: { mode: string }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const loader = useCallback(() => operationsApi.driverTrips(date), [date]);
  const resource = useApiResource<DriverTripView[]>(loader);

  const activeTrip = useMemo(
    () => (resource.data || []).find((trip) => !trip.endedAt && ["RUNNING", "STARTED", "IN_PROGRESS"].includes((trip.status || "").toUpperCase())),
    [resource.data]
  );

  const title =
    mode === "drv-active" ? "Chuyến đang chạy"
    : mode === "drv-route" ? "Tuyến được phân"
    : mode === "drv-history" ? "Lịch sử chuyến"
    : "Lịch chạy xe";

  const description =
    mode === "drv-active" ? "Thông tin chuyến xe bạn đang thực hiện live."
    : mode === "drv-route" ? "Lộ trình và các trạm dừng của tuyến được phân công."
    : mode === "drv-history" ? "Lịch sử các chuyến xe đã hoàn thành hoặc hủy."
    : "Danh sách lịch trình chạy xe được phân công hôm nay.";

  const start = async (trip: DriverTripView) => {
    try {
      await operationsApi.startTrip(trip.tripId);
      toast.success("Đã bắt đầu chuyến chạy!");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể bắt đầu chuyến"));
    }
  };

  const end = async (trip: DriverTripView) => {
    try {
      await operationsApi.endTrip(trip.tripId);
      toast.success("Đã kết thúc chuyến chạy!");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể kết thúc chuyến"));
    }
  };

  const displayTrips = useMemo(() => {
    const list = resource.data || [];
    if (mode === "drv-active") {
      return activeTrip ? [activeTrip] : [];
    }
    if (mode === "drv-history") {
      return list.filter(t => t.status === "COMPLETED" || t.status === "CANCELLED");
    }
    if (mode === "drv-schedule") {
      return list.filter(t => t.status !== "COMPLETED" && t.status !== "CANCELLED");
    }
    if (mode === "drv-route") {
      const seen = new Set();
      const routes: DriverTripView[] = [];
      for (const trip of list) {
        const key = trip.routeName;
        if (!seen.has(key)) {
          seen.add(key);
          routes.push(trip);
        }
      }
      return routes;
    }
    return list;
  }, [resource.data, mode, activeTrip]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        icon={<CalendarClock className="size-7" />}
        actions={mode !== "drv-active" && (
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="h-11 rounded-full bg-white px-4 border" 
          />
        )}
      />
      <AsyncBlock resource={resource}>
        {() => (
          <div className="space-y-6">
            {mode !== "drv-active" && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tổng chuyến" value={(resource.data || []).length} icon={<Route className="size-6" />} accent="primary" />
                <StatCard label="Đang chạy" value={activeTrip ? "Có" : "Không"} icon={<PlayCircle className="size-6" />} accent={activeTrip ? "success" : "secondary"} />
                <StatCard label="Ngày xem" value={formatDate(date)} icon={<CalendarClock className="size-6" />} accent="tertiary" />
                <StatCard label="Hoàn tất" value={(resource.data || []).filter((t) => t.status === "COMPLETED").length} icon={<History className="size-6" />} accent="success" />
              </div>
            )}

            {mode === "drv-active" && displayTrips.length === 0 ? (
              <EmptyState 
                icon={<PlayCircle className="size-7" />} 
                title="Chưa có chuyến đang chạy" 
                description="Hãy vào phần 'Lịch chạy xe' để bắt đầu chuyến đi được phân công của bạn." 
              />
            ) : mode === "drv-route" ? (
              <Section title="Tuyến đường của bạn">
                <DataList emptyTitle="Chưa có tuyến đường" emptyDescription="Không tìm thấy tuyến đường được phân công nào cho ngày này.">
                  {displayTrips.map((route) => (
                    <ExpressiveCard key={route.tripId} variant="elevated" className="p-5 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div>
                          <h3 className="text-lg font-bold text-on-surface">{route.routeName}</h3>
                          <p className="text-xs text-on-surface-variant mt-1">Xe chạy: {route.licensePlate || "Chưa gán"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Danh sách trạm dừng lộ trình:</p>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {(route.stops || []).map((stop) => (
                            <div key={stop.stopId} className="rounded-xl bg-surface-container-high p-3 border">
                              <div className="flex items-center gap-2">
                                <MapPin className="size-4 text-primary shrink-0" />
                                <span className="truncate text-sm font-bold text-on-surface">{stop.stopName}</span>
                              </div>
                              <p className="mt-1 text-xs text-on-surface-variant">Thứ tự: {stop.stopOrder}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ExpressiveCard>
                  ))}
                </DataList>
              </Section>
            ) : (
              <Section title={mode === "drv-active" ? "Thông tin chuyến chạy live" : "Danh sách chuyến đi"}>
                <DataList 
                  emptyTitle={mode === "drv-history" ? "Chưa có lịch sử" : "Chưa có lịch chạy"} 
                  emptyDescription={mode === "drv-history" ? "Các chuyến đã chạy xong hoặc hủy sẽ xuất hiện tại đây." : "Không có lịch trình phân công chạy xe cho ngày này."}
                >
                  {displayTrips.map((trip) => (
                    <TripCard key={trip.tripId} trip={trip} onStart={() => start(trip)} onEnd={() => end(trip)} />
                  ))}
                </DataList>
              </Section>
            )}
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function TripCard({
  trip,
  onStart,
  onEnd,
}: {
  trip: DriverTripView;
  onStart: () => void;
  onEnd: () => void;
}) {
  const running = !!trip.departedAt && !trip.endedAt;
  return (
    <ExpressiveCard variant="elevated" className="p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-on-surface">{trip.routeName}</h3>
            <StatusPill status={trip.status} />
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            Xe {trip.licensePlate || "chưa gán"} · Phụ xe {trip.conductorName || "chưa gán"} · {trip.departureTime || "chưa có giờ"}
          </p>
          <p className="mt-2 text-xs text-on-surface-variant">
            Bắt đầu: {formatDateTime(trip.departedAt)} · Kết thúc: {formatDateTime(trip.endedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExpressiveButton variant="filled" disabled={!!trip.departedAt} onClick={onStart}>
            <PlayCircle className="size-4" /> Bắt đầu
          </ExpressiveButton>
          <ExpressiveButton variant="tonal" disabled={!running} onClick={onEnd}>
            Kết thúc
          </ExpressiveButton>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {(trip.stops || []).slice(0, 8).map((stop) => (
          <div key={`${trip.tripId}-${stop.stopId}`} className="rounded-xl bg-surface-container-high p-3">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-on-surface-variant" />
              <span className="truncate text-sm font-bold text-on-surface">{stop.stopName}</span>
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">Thứ tự {stop.stopOrder}</p>
          </div>
        ))}
      </div>
    </ExpressiveCard>
  );
}

function Unavailable({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div>
      <PageHeader title={title} description="UI được giữ lại, nhưng MVP hiện chưa có API chat/call riêng." icon={icon} />
      <UnavailablePanel />
    </div>
  );
}


function ContactScreen() {
  const [contact, setContact] = useState<DispatcherContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [chatText, setChatText] = useState("");
  
  // Incident Form State
  const [incidentType, setIncidentType] = useState("OTHER");
  const [description, setDescription] = useState("");

  const loadContact = useCallback(async () => {
    try {
      const data = await driverDispatchApi.contact();
      setContact(data);
    } catch (err: any) {
      console.error("Lỗi lấy thông tin liên hệ điều phối:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll messages every 4 seconds
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
      await driverDispatchApi.sendMessage({
        tripId: contact.activeTripId || undefined,
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

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !contact) return;
    if (!contact.activeTripId) {
      toast.error("Bạn cần có chuyến xe đang chạy để gửi báo cáo sự cố SOS!");
      return;
    }
    try {
      setReporting(true);
      await driverDispatchApi.reportIncident({
        tripId: contact.activeTripId,
        incidentType,
        description: description.trim()
      });
      toast.success("Đã gửi báo cáo sự cố khẩn cấp SOS!");
      setDescription("");
      await loadContact();
    } catch (err: any) {
      toast.error(err.message || "Gửi báo cáo thất bại");
    } finally {
      setReporting(false);
    }
  };

  // Lọc bỏ tin nhắn SOS trong khung chat nội bộ
  const displayMessages = useMemo(() => {
    if (!contact || !contact.messages) return [];
    return contact.messages.filter(m => !m.content.startsWith("[SOS]"));
  }, [contact]);

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
        Không tìm thấy thông tin điều phối chính cho ca chạy này.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Liên hệ điều phối" 
        description="Gửi tin nhắn hoặc báo cáo sự cố khẩn cấp (SOS)." 
        icon={<MessageSquare className="size-7" />} 
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        {/* Khung Chat Nội Bộ */}
        <ExpressiveCard variant="elevated" className="flex flex-col h-[520px] p-0 overflow-hidden">
          {/* Dispatcher Header */}
          <div className="flex items-center justify-between border-b p-4 bg-surface-container-low shrink-0">
            <div>
              <h3 className="font-bold text-on-surface text-base">{contact.dispatcherName}</h3>
              <p className="text-xs text-on-surface-variant">{contact.department || "Ban Điều Phối"} · {contact.phoneNumber || "Không có SĐT"}</p>
            </div>
            {contact.phoneNumber && (
              <a 
                href={`tel:${contact.phoneNumber}`} 
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                <Phone className="size-3.5" /> Gọi điện
              </a>
            )}
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-lowest scrollbar-soft">
            {displayMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện.
              </div>
            ) : (
              displayMessages.map((msg) => {
                const isMe = msg.senderName !== contact.dispatcherName;
                return (
                  <div key={msg.messageId} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-[1.5rem] px-4 py-2.5 text-sm ${
                      isMe 
                        ? "bg-[#beff50] text-[#14140f] rounded-tr-none font-medium" 
                        : "bg-surface-container-high text-on-surface rounded-tl-none"
                    }`}>
                      <p className="break-words">{msg.content}</p>
                      <p className="mt-1 text-[10px] opacity-60 text-right">
                        {msg.sentAt ? formatDateTime(msg.sentAt).split(" ")[0] : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send Input Footer */}
          <form onSubmit={handleSendMessage} className="border-t p-3 bg-surface-container-low flex gap-2 shrink-0">
            <Input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Nhập tin nhắn..."
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

        {/* Khung Báo Cáo Sự Cố (SOS) - h-fit để không bị giãn */}
        <ExpressiveCard variant="elevated" className="p-5 h-fit space-y-4 border border-error/20 bg-error-container/10">
          <div className="flex items-center gap-2 text-error">
            <ShieldAlert className="size-6 shrink-0" />
            <h3 className="font-bold text-lg">Báo cáo sự cố (SOS)</h3>
          </div>
          
          <form onSubmit={handleReportIncident} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Phân loại sự cố</label>
              <select 
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full rounded-2xl border bg-surface-container-lowest px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="OTHER">Nội bộ / Khác</option>
                <option value="TECHNICAL">Sự cố kỹ thuật</option>
                <option value="OVERCROWDED">Xe quá tải</option>
                <option value="EMERGENCY">Khẩn cấp / Tai nạn</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Mô tả chi tiết</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả sự cố cụ thể để điều phối hỗ trợ kịp thời..."
                required
                rows={4}
                className="w-full rounded-2xl border bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary resize-none transition-colors"
              />
            </div>

            {contact.activeTripId ? (
              <p className="text-[11px] text-on-surface-variant/80">
                Sự cố sẽ được liên kết trực tiếp với chuyến xe đang chạy của bạn.
              </p>
            ) : (
              <p className="text-[11px] text-error font-medium">
                Cảnh báo: Bạn hiện không có chuyến xe nào đang chạy. SOS chỉ được gửi khi đang trong chuyến xe.
              </p>
            )}

            <ExpressiveButton 
              type="submit" 
              variant="error" 
              disabled={reporting || !description.trim() || !contact.activeTripId} 
              className="w-full justify-center gap-1.5 rounded-full"
            >
              <AlertTriangle className="size-4" />
              {reporting ? "Đang gửi báo cáo..." : "GỬI BÁO CÁO KHẨN CẤP"}
            </ExpressiveButton>
          </form>
        </ExpressiveCard>
      </div>
    </div>
  );
}
