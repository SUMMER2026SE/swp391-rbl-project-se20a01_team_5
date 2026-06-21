"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, History, MapPin, MessageSquare, Navigation, PlayCircle, Route } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { AsyncBlock, DataList, StatusPill, formatDate, formatDateTime, getErrorMessage, useApiResource } from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { experienceApi, operationsApi, type DriverDashboardView, type DriverTripView } from "@/lib/api/client";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function DriverModule({ activeId }: Props) {
  if (activeId === "drv-dashboard") return <DriverDashboardOverview />;
  if (activeId === "drv-contact") return <ContactCoordinator />;
  return <TripsScreen mode={activeId} />;
}

/**
 * REQ-DRV-006: Liên hệ điều phối viên - in-app messaging via internal_messages.
 */
function ContactCoordinator() {
  return <MessagingPanel title="Liên hệ điều phối viên" icon={<MessageSquare className="size-7" />} />;
}

function MessagingPanel({ title, icon }: { title: string; icon: React.ReactNode }) {
  const [threads, setThreads] = useState<Array<{
    peerUserId: number;
    peerName: string;
    peerRole: string;
    lastMessageBody: string;
    lastMessageAt: string;
    unreadCount: number;
  }>>([]);
  const [selectedPeer, setSelectedPeer] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{
    messageId: number;
    senderUserId: number;
    senderName: string;
    recipientUserId: number;
    recipientName: string;
    body: string;
    sentAt: string;
    readAt: string | null;
  }>>([]);
  const [draft, setDraft] = useState("");
  const [recipientId, setRecipientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/me/messages/threads", {
        headers: { Authorization: `Bearer ${localStorage.getItem("unibus_access_token") || ""}` },
      });
      if (res.ok) {
        const json = await res.json();
        setThreads(json.data || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadThreads();
  }, [loadThreads]);

  const loadConversation = useCallback(async (peerId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/me/messages/${peerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("unibus_access_token") || ""}` },
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data || []);
        setSelectedPeer(peerId);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const send = useCallback(async () => {
    if (!recipientId || !draft.trim()) return;
    try {
      const res = await fetch("/api/v1/me/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("unibus_access_token") || ""}`,
        },
        body: JSON.stringify({ recipientUserId: recipientId, body: draft.trim() }),
      });
      if (res.ok) {
        setDraft("");
        if (selectedPeer === recipientId) {
          await loadConversation(recipientId);
        }
        await loadThreads();
        toast.success("Đã gửi tin nhắn");
      } else {
        toast.error("Không gửi được tin nhắn");
      }
    } catch {
      toast.error("Lỗi mạng");
    }
  }, [recipientId, draft, selectedPeer, loadConversation, loadThreads]);

  return (
    <div>
      <PageHeader title={title} description="Trao đổi nội bộ với điều phối viên và tài xế qua internal messages." icon={icon} />
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Section title="Hội thoại" description="Danh sách cuộc trò chuyện">
          <DataList emptyTitle="Chưa có tin nhắn" emptyDescription="Bắt đầu một cuộc trò chuyện bằng cách nhập user ID người nhận bên dưới.">
            {threads.map((t) => (
              <ExpressiveCard
                key={t.peerUserId}
                variant="elevated"
                className={`cursor-pointer p-4 ${selectedPeer === t.peerUserId ? "ring-2 ring-primary" : ""}`}
                onClick={() => loadConversation(t.peerUserId)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{t.peerName}</h3>
                    <p className="text-xs text-on-surface-variant">{t.peerRole}</p>
                    <p className="mt-1 truncate text-sm text-on-surface-variant">{t.lastMessageBody}</p>
                  </div>
                  {t.unreadCount > 0 && (
                    <span className="rounded-full bg-error px-2 py-0.5 text-xs font-bold text-white">{t.unreadCount}</span>
                  )}
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        </Section>
        <Section title="Tin nhắn" description={selectedPeer ? `Cuộc trò chuyện với user #${selectedPeer}` : "Chọn một hội thoại"}>
          {loading ? <p className="text-sm text-on-surface-variant">Đang tải...</p> : null}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {messages.length === 0 && !loading && (
              <p className="text-sm text-on-surface-variant">Chưa có tin nhắn. Hãy gửi tin đầu tiên!</p>
            )}
            {messages.map((m) => (
              <div
                key={m.messageId}
                className={`rounded-2xl p-3 ${m.senderUserId === selectedPeer ? "bg-surface-container-high" : "bg-primary/10 ml-auto max-w-[80%]"}`}
              >
                <p className="text-sm">{m.body}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{formatDateTime(m.sentAt)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t pt-3">
            <Input
              type="number"
              placeholder="User ID người nhận (ví dụ: 5)"
              value={recipientId ?? ""}
              onChange={(e) => setRecipientId(e.target.value ? Number(e.target.value) : null)}
              className="h-10"
            />
            <div className="flex gap-2">
              <Input
                placeholder="Nhập tin nhắn..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="flex-1"
              />
              <ExpressiveButton variant="filled" onClick={send} disabled={!recipientId || !draft.trim()}>
                Gửi
              </ExpressiveButton>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
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
    : mode === "drv-schedule" ? "Lịch chạy xe"
    : "Lịch hôm nay";

  const start = async (trip: DriverTripView) => {
    try {
      await operationsApi.startTrip(trip.tripId);
      toast.success("Đã bắt đầu chuyến");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể bắt đầu chuyến"));
    }
  };

  const end = async (trip: DriverTripView) => {
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
      <PageHeader
        title={title}
        description="Dữ liệu chuyến xe thật từ driver operations API."
        icon={<CalendarClock className="size-7" />}
        actions={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-full bg-white" />}
      />
      <AsyncBlock resource={resource}>
        {(trips) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Tổng chuyến" value={trips.length} icon={<Route className="size-6" />} accent="primary" />
              <StatCard label="Đang chạy" value={activeTrip ? "Có" : "Không"} icon={<PlayCircle className="size-6" />} accent={activeTrip ? "success" : "secondary"} />
              <StatCard label="Ngày" value={formatDate(date)} icon={<CalendarClock className="size-6" />} accent="tertiary" />
              <StatCard label="Hoàn tất" value={trips.filter((t) => t.endedAt).length} icon={<History className="size-6" />} accent="success" />
            </div>

            {mode === "drv-active" && !activeTrip ? (
              <EmptyState icon={<PlayCircle className="size-7" />} title="Chưa có chuyến đang chạy" description="Bắt đầu một chuyến trong lịch để trạng thái xuất hiện tại đây." />
            ) : (
              <Section title={mode === "drv-active" ? "Chuyến đang chạy" : "Danh sách chuyến"}>
                <DataList emptyTitle="Chưa có chuyến" emptyDescription="Backend chưa phân chuyến nào cho ngày này.">
                  {(mode === "drv-active" ? trips.filter((trip) => trip.tripId === activeTrip?.tripId) : trips).map((trip) => (
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
  const [gpsStatus, setGpsStatus] = useState<"idle" | "tracking" | "error" | "denied">("idle");
  const gpsWatchRef = useRef<number | null>(null);

  // REQ-DRV-003 AC1: GPS tracking bắt đầu trong 10 giây - start watching position when trip is RUNNING.
  useEffect(() => {
    if (!running) {
      if (gpsWatchRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGpsStatus("idle");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsStatus("error");
      return;
    }

    setGpsStatus("tracking");
    const pushLocation = (pos: GeolocationPosition) => {
      const token = localStorage.getItem("unibus_access_token") || "";
      fetch(`/api/v1/driver/trips/${trip.tripId}/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
          speedKmh: pos.coords.speed != null && pos.coords.speed >= 0 ? pos.coords.speed * 3.6 : null,
          occupancy: null,
        }),
      }).catch(() => {
        /* silent fail - GPS push is best-effort */
      });
    };

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      pushLocation,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("denied");
        } else {
          setGpsStatus("error");
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
    };
  }, [running, trip.tripId]);

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
          {running && (
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
              gpsStatus === "tracking" ? "bg-success/20 text-success"
              : gpsStatus === "denied" ? "bg-error/20 text-error"
              : gpsStatus === "error" ? "bg-warning/20 text-warning"
              : "bg-surface-container-high text-on-surface-variant"
            }`}>
              <Navigation className="size-3" />
              {gpsStatus === "tracking" ? "Đang truyền GPS"
                : gpsStatus === "denied" ? "GPS bị từ chối"
                : gpsStatus === "error" ? "Lỗi GPS"
                : "Chờ GPS"}
            </span>
          )}
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
