"use client";

import { useCallback, useState } from "react";
import { Bell, CalendarClock, Megaphone, MessageSquare, Navigation, Route, School, UserCog } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { AsyncBlock, DataList, StatusPill, UnavailablePanel, formatDate, formatDateTime, getErrorMessage, useApiResource } from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { experienceApi, feedbackApi, notificationApi, operationsApi, type CoordinatorDashboardView, type FeedbackView, type LiveFleetVehicle, type ScheduleDashboard } from "@/lib/api/client";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function CoordinatorModule({ activeId }: Props) {
  if (activeId === "crd-dashboard") return <CoordinatorDashboard />;
  if (activeId === "crd-live") return <LiveFleetScreen />;
  if (activeId === "crd-schedule") return <ScheduleScreen />;
  if (activeId === "crd-feedback") return <FeedbackQueue />;
  if (activeId === "crd-notify") return <NotifyScreen />;
  if (["crd-assign-driver", "crd-assign-bus", "crd-routes", "crd-stops", "crd-by-university"].includes(activeId)) {
    const title =
      activeId === "crd-by-university" ? "Điều phối theo trường"
      : activeId === "crd-routes" ? "Tuyến đường"
      : activeId === "crd-stops" ? "Trạm dừng"
      : activeId === "crd-assign-bus" ? "Phân công xe bus"
      : "Phân công tài xế";
    return <Unavailable title={title} />;
  }
  return <CoordinatorDashboard />;
}

function CoordinatorDashboard() {
  const resource = useApiResource<CoordinatorDashboardView>(useCallback(() => experienceApi.coordinatorDashboard(), []));

  return (
    <div>
      <PageHeader title="Tổng quan điều phối" description="Tổng hợp lịch, đội xe live và phản hồi thật." icon={<Navigation className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(dashboard) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Xe live" value={dashboard.liveFleet.length} icon={<Navigation className="size-6" />} accent="success" />
              <StatCard label="Tuyến" value={dashboard.routes.length} icon={<Route className="size-6" />} accent="primary" />
              <StatCard label="Trạm" value={dashboard.stops.length} icon={<School className="size-6" />} accent="secondary" />
              <StatCard label="Phản hồi" value={dashboard.feedback.length} icon={<MessageSquare className="size-6" />} accent="tertiary" />
            </div>
            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <Section title="Live fleet" description="Xe đang chạy hoặc vừa cập nhật">
                <DataList emptyTitle="Chưa có xe live" emptyDescription="Driver cập nhật vị trí thì dữ liệu hiện tại đây.">
                  {dashboard.liveFleet.slice(0, 6).map((trip) => (
                    <ExpressiveCard key={trip.tripId} variant="elevated" className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-on-surface">{trip.routeCode || trip.routeName}</h3>
                          <p className="text-sm text-on-surface-variant">Xe {trip.licensePlate || "chưa gán"} · {trip.occupancy ?? 0}/{trip.seatCount || "?"} khách</p>
                        </div>
                        <StatusPill status={trip.status} />
                      </div>
                    </ExpressiveCard>
                  ))}
                </DataList>
              </Section>
              <Section title="Phản hồi cần theo dõi" description="Không fake record khi backend rỗng">
                <DataList emptyTitle="Chưa có phản hồi" emptyDescription="Phản hồi sinh viên sẽ xuất hiện tại đây.">
                  {dashboard.feedback.slice(0, 5).map((item) => (
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

function LiveFleetScreen() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const loader = useCallback(() => operationsApi.liveFleet(date), [date]);
  const resource = useApiResource<LiveFleetVehicle[]>(loader);
  return (
    <div>
      <PageHeader
        title="Theo dõi tất cả xe"
        description="Dữ liệu live fleet từ backend."
        icon={<Navigation className="size-7" />}
        actions={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-full bg-white" />}
      />
      <AsyncBlock resource={resource}>
        {(vehicles) => (
          <DataList emptyTitle="Chưa có xe live" emptyDescription="Xe sẽ xuất hiện khi driver cập nhật vị trí.">
            {vehicles.map((vehicle) => (
              <ExpressiveCard key={vehicle.tripId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{vehicle.routeName}</h3>
                    <p className="text-sm text-on-surface-variant">Xe {vehicle.licensePlate || "chưa có biển"} · Tài xế {vehicle.driverName || "chưa gán"}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Vị trí: {vehicle.latitude ?? "?"}, {vehicle.longitude ?? "?"} · {vehicle.occupancy ?? 0} khách · {formatDateTime(vehicle.locationUpdatedAt)}
                    </p>
                  </div>
                  <StatusPill status={vehicle.status} />
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function ScheduleScreen() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const loader = useCallback(() => operationsApi.scheduleDashboard(date), [date]);
  const resource = useApiResource<ScheduleDashboard>(loader);
  return (
    <div>
      <PageHeader
        title="Lịch trình xe"
        description="Dashboard lịch chạy thật từ coordinator schedules API."
        icon={<CalendarClock className="size-7" />}
        actions={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-full bg-white" />}
      />
      <AsyncBlock resource={resource}>
        {(dashboard) => <ScheduleList dashboard={dashboard} />}
      </AsyncBlock>
    </div>
  );
}

function ScheduleList({ dashboard }: { dashboard: ScheduleDashboard }) {
  return (
    <Section title={`Lịch ngày ${formatDate(dashboard.serviceDate)}`} description="Các thao tác tạo/sửa phân công sẽ bật khi có form production đầy đủ.">
      <DataList emptyTitle="Chưa có lịch chạy" emptyDescription="Backend chưa trả về ca chạy cho ngày này.">
        {(dashboard.shifts || []).map((shift) => (
          <ExpressiveCard key={shift.scheduleId || shift.tripId || `${shift.routeId}-${shift.departureTime}`} variant="elevated" className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-bold text-on-surface">{shift.routeName || "Tuyến chưa đặt tên"}</h3>
                <p className="text-sm text-on-surface-variant">
                  {shift.departureTime || shift.time || "chưa có giờ"} · Xe {shift.licensePlate || "chưa gán"}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Tài xế {shift.driverName || "chưa gán"} · Phụ xe {shift.conductorName || "chưa gán"}
                </p>
              </div>
              <StatusPill status={shift.status} />
            </div>
          </ExpressiveCard>
        ))}
      </DataList>
    </Section>
  );
}

function FeedbackQueue() {
  const loader = useCallback(() => feedbackApi.all(), []);
  const resource = useApiResource<FeedbackView[]>(loader);

  const resolve = async (item: FeedbackView) => {
    try {
      await feedbackApi.resolve(item.feedbackId, "Đã ghi nhận và xử lý bởi điều phối.");
      toast.success("Đã xử lý phản hồi");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể xử lý phản hồi"));
    }
  };

  return (
    <div>
      <PageHeader title="Phản hồi sinh viên" description="Danh sách phản hồi thật từ backend." icon={<MessageSquare className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có phản hồi" emptyDescription="Không có phản hồi nào trong backend.">
            {items.map((item) => (
              <ExpressiveCard key={item.feedbackId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{item.studentName || item.studentCode || "Sinh viên"}</h3>
                    <p className="text-sm text-on-surface-variant">{item.content}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{item.routeName || "Không gắn tuyến"} · {formatDateTime(item.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill status={item.status} />
                    {(item.status || "").toUpperCase() !== "RESOLVED" && (
                      <ExpressiveButton variant="tonal" size="sm" onClick={() => resolve(item)}>Xử lý</ExpressiveButton>
                    )}
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

function NotifyScreen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("ALL");
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await notificationApi.create({ title, content, target });
      setTitle("");
      setContent("");
      toast.success("Đã gửi thông báo");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi thông báo"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Gửi thông báo" description="Tạo thông báo qua backend notifications API." icon={<Megaphone className="size-7" />} />
      <ExpressiveCard variant="elevated" className="max-w-2xl space-y-4 p-5">
        <Field label="Tiêu đề"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Đối tượng"><Input value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
        <Field label="Nội dung"><Textarea value={content} onChange={(e) => setContent(e.target.value)} /></Field>
        <ExpressiveButton onClick={send} disabled={sending || !title || !content}>
          <Bell className="size-4" /> {sending ? "Đang gửi..." : "Gửi thông báo"}
        </ExpressiveButton>
      </ExpressiveCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Unavailable({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} description="UI được giữ lại, nhưng MVP hiện chưa có endpoint thật cho phần này." icon={<UserCog className="size-7" />} />
      <UnavailablePanel
        title="Chưa có API production"
        description="Không hiển thị dữ liệu mẫu. Khi backend có endpoint, màn này sẽ được nối vào data thật."
      />
    </div>
  );
}
