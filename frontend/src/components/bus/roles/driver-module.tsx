"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarClock, History, MapPin, MessageSquare, PlayCircle, Route } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { AsyncBlock, DataList, StatusPill, UnavailablePanel, formatDate, formatDateTime, getErrorMessage, useApiResource } from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { experienceApi, operationsApi, type DriverDashboardView, type DriverTripView } from "@/lib/api/client";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function DriverModule({ activeId }: Props) {
  if (activeId === "drv-dashboard") return <DriverDashboardOverview />;
  if (activeId === "drv-contact") return <Unavailable title="Liên hệ điều phối" icon={<MessageSquare className="size-7" />} />;
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
