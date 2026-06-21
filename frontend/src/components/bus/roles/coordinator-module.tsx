"use client";

import { useCallback, useMemo, useState } from "react";
import { Bell, CalendarClock, Megaphone, MessageSquare, Navigation, Route, School, UserCog } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { AsyncBlock, DataList, StatusPill, UnavailablePanel, formatDate, formatDateTime, getErrorMessage, useApiResource } from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { experienceApi, feedbackApi, notificationApi, operationsApi, type CoordinatorDashboardView, type FeedbackView, type LiveFleetVehicle, type ScheduleDashboard } from "@/lib/api/client";
import { DriverAssignmentScreen } from "./DriverAssignmentScreen";
import { RouteScreen } from "./RouteScreen";
import { StopScreen } from "./StopScreen";

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
  if (activeId === "crd-assign") return <DriverAssignmentScreen />;
  if (activeId === "crd-routes") return <RouteScreen />;
  if (activeId === "crd-stops") return <StopScreen />;
  if (["crd-assign-driver", "crd-assign-bus", "crd-by-university"].includes(activeId)) {
    const title =
      activeId === "crd-by-university" ? "Điều phối theo trường"
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
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "RESOLVED">("ALL");
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [resolving, setResolving] = useState(false);

  const handleSubmitResolve = async (feedbackId: number) => {
    setResolving(true);
    try {
      await feedbackApi.resolve(feedbackId, replyText);
      toast.success("Đã xử lý phản hồi thành công!");
      setResolvingId(null);
      setReplyText("");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể xử lý phản hồi"));
    } finally {
      setResolving(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!resource.data) return [];
    if (statusFilter === "ALL") return resource.data;
    return resource.data.filter(
      (item) => (item.status || "").toUpperCase() === statusFilter
    );
  }, [resource.data, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Phản hồi sinh viên"
        description="Danh sách phản hồi thật từ backend."
        icon={<MessageSquare className="size-7" />}
        actions={
          <div className="flex gap-2 items-center">
            <Label className="text-sm font-medium text-on-surface-variant hidden sm:inline">Trạng thái:</Label>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
              <SelectTrigger className="h-10 rounded-full border border-outline-variant/60 bg-white px-4 text-sm font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-outline-variant/50">
                <SelectItem value="ALL">Tất cả phản hồi</SelectItem>
                <SelectItem value="PENDING">Chưa xử lý (Đang chờ)</SelectItem>
                <SelectItem value="RESOLVED">Đã xử lý</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      <AsyncBlock resource={resource}>
        {() => (
          <DataList emptyTitle="Chưa có phản hồi" emptyDescription="Không tìm thấy phản hồi nào phù hợp.">
            {filteredItems.map((item) => (
              <ExpressiveCard key={item.feedbackId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-on-surface">{item.studentName || item.studentCode || "Sinh viên"}</h3>
                      <StatusPill status={item.status} />
                    </div>
                    <p className="text-sm text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30 mt-1.5">{item.content}</p>
                    <p className="text-xs text-on-surface-variant/80 pt-1">
                      Tuyến: <span className="font-medium text-on-surface">{item.routeName || "Không gắn tuyến"}</span> · {formatDateTime(item.createdAt)}
                    </p>
                    {item.status?.toUpperCase() === "RESOLVED" && item.response && (
                      <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/25 text-sm">
                        <p className="font-semibold text-primary">Phản hồi của điều phối:</p>
                        <p className="text-on-surface-variant mt-0.5">{item.response}</p>
                      </div>
                    )}
                  </div>
                  
                  {(item.status || "").toUpperCase() !== "RESOLVED" && (
                    <div className="w-full sm:w-80 shrink-0">
                      {resolvingId === item.feedbackId ? (
                        <div className="space-y-2 bg-surface-container-low p-3 rounded-xl border border-outline-variant/40">
                          <Label className="text-xs font-semibold text-on-surface-variant">Phản hồi cho sinh viên:</Label>
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Nhập nội dung trả lời..."
                            className="w-full text-sm bg-white border-outline-variant/60"
                            rows={3}
                          />
                          <div className="flex gap-2 justify-end">
                            <ExpressiveButton variant="outlined" size="sm" onClick={() => {
                              setResolvingId(null);
                              setReplyText("");
                            }}>
                              Hủy
                            </ExpressiveButton>
                            <ExpressiveButton size="sm" disabled={!replyText.trim() || resolving} onClick={() => handleSubmitResolve(item.feedbackId)}>
                              Gửi
                            </ExpressiveButton>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <ExpressiveButton variant="tonal" size="sm" onClick={() => {
                            setResolvingId(item.feedbackId);
                            setReplyText("Đã ghi nhận và xử lý bởi điều phối.");
                          }}>
                            Xử lý
                          </ExpressiveButton>
                        </div>
                      )}
                    </div>
                  )}
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
        <Field label="Đối tượng">
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="h-11 rounded-full border border-outline-variant/60 bg-white px-4 text-sm font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 w-full">
              <SelectValue placeholder="Chọn đối tượng nhận thông báo" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-outline-variant/50">
              <SelectItem value="ALL">Tất cả mọi người (Sinh viên, tài xế & phụ xe)</SelectItem>
              <SelectItem value="all_students">Tất cả sinh viên</SelectItem>
              <SelectItem value="all_drivers_conductors">Tất cả tài xế & phụ xe</SelectItem>
            </SelectContent>
          </Select>
        </Field>
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
