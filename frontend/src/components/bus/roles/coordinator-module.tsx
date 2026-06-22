"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bell, CalendarClock, Loader2, MapPinned, Megaphone, MessageSquare, Navigation, Plus, Route, School, Search, Send, UserCog, X } from "lucide-react";
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
import { experienceApi, feedbackApi, coordinatorFeedbackApi, notificationApi, operationsApi, messagingApi, type CoordinatorDashboardView, type FeedbackView, type LiveFleetVehicle, type ScheduleDashboard, type ContactThreadCard, type InternalMessageCard } from "@/lib/api/client";
import { DriverAssignmentScreen } from "./DriverAssignmentScreen";
import { RouteScreen } from "./RouteScreen";
import { StopScreen } from "./StopScreen";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function CoordinatorModule({ activeId, onNavigate }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const renderScreen = () => {
    if (activeId === "crd-dashboard") return <CoordinatorDashboard onNavigate={onNavigate} />;
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
    return <CoordinatorDashboard onNavigate={onNavigate} />;
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)]">
      {renderScreen()}

      {/* Floating Chat Button */}
      <FloatingChatButton onClick={() => setChatOpen(!chatOpen)} open={chatOpen} unreadCount={unreadCount} />

      {/* Slide-out Chat Panel Drawer */}
      <InternalChatPanel 
        open={chatOpen} 
        onOpenChange={setChatOpen} 
        onUnreadCountChange={setUnreadCount} 
      />
    </div>
  );
}

function CoordinatorDashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const resource = useApiResource<CoordinatorDashboardView>(useCallback(() => experienceApi.coordinatorDashboard(), []));

  const features = [
    {
      id: "crd-live",
      title: "Theo dõi xe chạy (Live)",
      description: "Giám sát thời gian thực vị trí xe, lượng hành khách và trạng thái hoạt động trên bản đồ.",
      icon: Navigation,
      color: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      buttonText: "Bản đồ vận hành",
    },
    {
      id: "crd-schedule",
      title: "Lịch trình xe chạy",
      description: "Xem và quản lý thời gian xuất bến, giãn cách giữa các chuyến và theo dõi tiến độ lịch trình.",
      icon: CalendarClock,
      color: "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 hover:bg-blue-500/10 text-blue-700 dark:text-blue-400",
      buttonText: "Xem lịch biểu",
    },
    {
      id: "crd-assign",
      title: "Phân công xe & tài xế",
      description: "Điều phối nhân sự, gán tài xế, phụ xe và gán xe chạy cụ thể vào từng khung giờ trong ngày.",
      icon: UserCog,
      color: "border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 hover:bg-violet-500/10 text-violet-700 dark:text-violet-400",
      buttonText: "Thực hiện phân công",
    },
    {
      id: "crd-routes",
      title: "Quản lý tuyến đường",
      description: "Thiết lập hành trình các tuyến bus, điểm đầu điểm cuối và thời gian chạy dự kiến giữa các điểm.",
      icon: Route,
      color: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400",
      buttonText: "Danh sách tuyến",
    },
    {
      id: "crd-stops",
      title: "Hệ thống trạm dừng",
      description: "Quản lý vị trí các trạm đón trả khách trên bản đồ, nhà chờ và kết nối trạm vào các tuyến đường.",
      icon: MapPinned,
      color: "border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
      buttonText: "Quản lý trạm",
    },
    {
      id: "crd-by-university",
      title: "Điều phối theo trường",
      description: "Điều phối xe bus chuyên dụng phục vụ các đối tác trường đại học và lịch trình của từng campus.",
      icon: School,
      color: "border-pink-500/20 bg-pink-500/5 hover:border-pink-500/40 hover:bg-pink-500/10 text-pink-700 dark:text-pink-400",
      buttonText: "Theo campus",
    },
    {
      id: "crd-feedback",
      title: "Ý kiến phản hồi",
      description: "Tiếp nhận đóng góp, đánh giá sao từ sinh viên, tài xế và phụ xe để kịp thời điều chỉnh.",
      icon: MessageSquare,
      color: "border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40 hover:bg-orange-500/10 text-orange-700 dark:text-orange-400",
      buttonText: "Hộp thư góp ý",
    },
    {
      id: "crd-notify",
      title: "Gửi thông báo rộng rãi",
      description: "Gửi thông báo khẩn cấp hoặc tin tức điều chỉnh lịch trình đến toàn bộ hệ thống người dùng.",
      icon: Megaphone,
      color: "border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400",
      buttonText: "Tạo thông báo mới",
    },
  ];

  // Framer motion variants for staggered loading
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 120, 
        damping: 18 
      } 
    }
  };

  return (
    <div>
      <PageHeader title="Tổng quan điều phối" description="Báo cáo hiệu suất vận hành, giám sát lộ trình và quản lý ý kiến phản hồi hệ thống." icon={<Navigation className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(dashboard) => (
          <div className="space-y-8">
            {/* Real-time Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Xe live" value={dashboard.liveFleet.length} icon={<Navigation className="size-6" />} accent="success" />
              <StatCard label="Tuyến" value={dashboard.routes.length} icon={<Route className="size-6" />} accent="primary" />
              <StatCard label="Trạm" value={dashboard.stops.length} icon={<MapPinned className="size-6" />} accent="secondary" />
              <StatCard label="Phản hồi" value={dashboard.feedback.length} icon={<MessageSquare className="size-6" />} accent="tertiary" />
            </div>

            {/* Feature Hub - Staggered entrance */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                <div>
                  <h2 className="text-xl font-bold text-on-surface">Trung tâm điều phối chức năng</h2>
                  <p className="text-xs text-on-surface-variant">Tổng hợp tất cả nghiệp vụ của điều phối viên UniBus</p>
                </div>
              </div>
              <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="show"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                {features.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <motion.div 
                      key={feat.id} 
                      variants={itemVariants}
                      whileHover={{ y: -4, transition: { duration: 0.15 } }}
                      className={`flex flex-col h-full rounded-2xl border p-4 transition-all shadow-xs hover:shadow-md cursor-pointer ${feat.color}`}
                      onClick={() => onNavigate(feat.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white/70 border border-outline-variant/20 shadow-2xs shrink-0 flex items-center justify-center">
                          <Icon className="size-5 shrink-0" />
                        </div>
                        <h3 className="font-bold text-on-surface text-sm line-clamp-1">{feat.title}</h3>
                      </div>
                      <p className="text-xs text-on-surface-variant/90 leading-relaxed mt-3 flex-1">
                        {feat.description}
                      </p>
                      <div className="flex justify-end pt-3 mt-auto border-t border-outline-variant/10">
                        <span className="text-[11px] font-bold underline hover:opacity-80 transition-opacity">
                          {feat.buttonText} →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Active Feeds Grid */}
            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
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
              <Section title="Ý kiến phản hồi cần theo dõi" description="Ý kiến đóng góp từ người dùng">
                <DataList emptyTitle="Chưa có phản hồi" emptyDescription="Các ý kiến phản hồi sẽ xuất hiện tại đây.">
                  {dashboard.feedback.slice(0, 5).map((item) => (
                    <ExpressiveCard key={item.feedbackId} variant="elevated" className="p-4">
                      <h3 className="font-bold text-on-surface">{item.studentName || "Người phản hồi"}</h3>
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
        description="Quản lý và cập nhật danh sách các ca chạy, phân công tài xế và thời gian vận hành."
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
      <DataList emptyTitle="Chưa có lịch chạy" emptyDescription="Hiện tại chưa có lịch chạy nào được ghi nhận cho ngày này.">
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
  const loader = useCallback(() => coordinatorFeedbackApi.all(), []);
  const resource = useApiResource<FeedbackView[]>(loader);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "RESOLVED">("ALL");
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [resolving, setResolving] = useState(false);

  const handleSubmitResolve = async (feedbackId: number) => {
    setResolving(true);
    try {
      await coordinatorFeedbackApi.resolve(feedbackId, replyText);
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
        title="Ý kiến phản hồi"
        description="Tiếp nhận và xử lý ý kiến đóng góp, phản hồi từ sinh viên, tài xế và phụ xe."
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
                      <h3 className="font-bold text-on-surface">{item.studentName || item.studentCode || "Người phản hồi"}</h3>
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
                          <Label className="text-xs font-semibold text-on-surface-variant">Trả lời phản hồi:</Label>
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
      await notificationApi.createCoordinator({ title, content, target });
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
      <PageHeader title="Gửi thông báo" description="Soạn thảo và gửi thông báo nhanh tới học sinh, tài xế, phụ xe hoặc toàn hệ thống." icon={<Megaphone className="size-7" />} />
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
      <PageHeader title={title} description="Tính năng đang được nâng cấp và tối ưu hóa hệ thống dữ liệu." icon={<UserCog className="size-7" />} />
      <UnavailablePanel
        title="Tính năng đang được phát triển"
        description="Chúng tôi đang kết nối dữ liệu vận hành thực tế cho chức năng này. Vui lòng quay lại sau."
      />
    </div>
  );
}

// =========================================================================
// Internal Chat UI Components & Format Helpers
// =========================================================================

function FloatingChatButton({ onClick, open, unreadCount }: { onClick: () => void; open: boolean; unreadCount: number }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#14140f] text-[#beff50] shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
      aria-label={open ? "Đóng chat nội bộ" : "Mở chat nội bộ"}
    >
      {open ? <X className="size-6" /> : <MessageSquare className="size-6" />}
      {!open && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white ring-2 ring-white animate-bounce">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

interface InternalChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadCountChange: (count: number) => void;
}

function InternalChatPanel({ open, onOpenChange, onUnreadCountChange }: InternalChatPanelProps) {
  const [threads, setThreads] = useState<ContactThreadCard[]>([]);
  const [activeThread, setActiveThread] = useState<ContactThreadCard | null>(null);
  const [messages, setMessages] = useState<InternalMessageCard[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [isNewChatMode, setIsNewChatMode] = useState(false);
  const [staffList, setStaffList] = useState<{ userId: number; fullName: string; role: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const chatMessages = useMemo(() => {
    return messages.filter((msg) => !(msg.body || "").startsWith("[SOS]"));
  }, [messages]);

  // Poll active threads & count unread messages
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const data = await messagingApi.getThreads();
        setThreads(data);
        const driverConductorUnread = data
          .filter((t) => ["DRIVER", "CONDUCTOR"].includes(t.peerRole?.toUpperCase()))
          .reduce((sum, t) => sum + t.unreadCount, 0);
        onUnreadCountChange(driverConductorUnread);
      } catch (error) {
        console.error("Failed to fetch message threads:", error);
      }
    };

    if (open) {
      setTimeout(() => setLoadingThreads(true), 0);
      fetchThreads().finally(() => {
        setTimeout(() => setLoadingThreads(false), 0);
      });
      
      const interval = setInterval(fetchThreads, 4000);
      return () => clearInterval(interval);
    } else {
      // Slow poll when closed to update floating button badge
      fetchThreads();
      const interval = setInterval(fetchThreads, 15000);
      return () => clearInterval(interval);
    }
  }, [open, onUnreadCountChange]);

  // Poll conversation messages when a thread is active
  useEffect(() => {
    if (!open || !activeThread) {
      setTimeout(() => setMessages([]), 0);
      return;
    }

    const fetchConversation = async () => {
      try {
        const data = await messagingApi.getConversation(activeThread.peerUserId);
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch conversation:", error);
      }
    };

    // Mark as read immediately
    messagingApi.markAsRead(activeThread.peerUserId).catch(() => {});

    setTimeout(() => setLoadingMessages(true), 0);
    fetchConversation().finally(() => {
      setTimeout(() => setLoadingMessages(false), 0);
    });

    const interval = setInterval(fetchConversation, 3000);
    return () => clearInterval(interval);
  }, [open, activeThread]);

  // Fetch driver/conductor list for starting new chats
  useEffect(() => {
    if (!open || !isNewChatMode) return;

    const fetchStaff = async () => {
      try {
        const data = await operationsApi.scheduleDashboard();
        const list: { userId: number; fullName: string; role: string }[] = [];
        (data.drivers || []).forEach((d: any) => {
          if (d.userId) list.push({ userId: d.userId, fullName: d.fullName, role: "DRIVER" });
        });
        (data.conductors || []).forEach((c: any) => {
          if (c.userId) list.push({ userId: c.userId, fullName: c.fullName, role: "CONDUCTOR" });
        });
        setStaffList(list);
      } catch (error) {
        console.error("Failed to fetch staff list:", error);
      }
    };

    fetchStaff();
  }, [open, isNewChatMode]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeThread || sending) return;

    const text = messageText.trim();
    setMessageText("");
    setSending(true);
    try {
      await messagingApi.sendMessage({
        recipientUserId: activeThread.peerUserId,
        body: text,
      });
      // immediately reload conversation
      const updatedMsgs = await messagingApi.getConversation(activeThread.peerUserId);
      setMessages(updatedMsgs);
      // reload threads to update last message
      const updatedThreads = await messagingApi.getThreads();
      setThreads(updatedThreads);
    } catch (error) {
      toast.error("Không thể gửi tin nhắn");
      setMessageText(text); // restore text
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = (staff: { userId: number; fullName: string; role: string }) => {
    // Check if thread already exists
    const existing = threads.find((t) => t.peerUserId === staff.userId);
    if (existing) {
      setActiveThread(existing);
    } else {
      // Create a temporary thread object
      const tempThread: ContactThreadCard = {
        peerUserId: staff.userId,
        peerName: staff.fullName,
        peerRole: staff.role,
        lastMessageBody: "",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      };
      setActiveThread(tempThread);
    }
    setIsNewChatMode(false);
    setSearchQuery("");
  };

  // Filter threads by role (Driver & Conductor only) and search query
  const filteredThreads = threads
    .filter((t) => ["DRIVER", "CONDUCTOR"].includes(t.peerRole?.toUpperCase()))
    .filter((t) => t.peerName.toLowerCase().includes(searchQuery.toLowerCase()));

  // Filter staff list by search query (only showing staff that don't already have an active thread)
  const filteredStaff = staffList
    .filter((s) => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((s) => !threads.some((t) => t.peerUserId === s.userId));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-0 right-0 w-full h-full sm:bottom-6 sm:right-[92px] sm:w-[380px] sm:h-[580px] sm:rounded-3xl border border-outline-variant/40 p-0 z-40 flex flex-col bg-surface-container-lowest shadow-2xl overflow-hidden focus:outline-none"
        >
          {/* Header section */}
          <div className="border-b border-outline-variant/30 p-4 bg-surface-container-low flex items-center justify-between">
            {activeThread ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveThread(null)}
                    className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                    aria-label="Quay lại"
                  >
                    <ArrowLeft className="size-5 text-on-surface" />
                  </button>
                  <div>
                    <h3 className="font-bold text-on-surface text-sm line-clamp-1">{activeThread.peerName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="size-2 rounded-full bg-green-500" />
                      <span className="text-[11px] font-medium text-on-surface-variant">
                        {activeThread.peerRole === "DRIVER" ? "Tài xế" : "Phụ xe"}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                  aria-label="Đóng"
                >
                  <X className="size-5 text-on-surface-variant" />
                </button>
              </div>
            ) : isNewChatMode ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setIsNewChatMode(false);
                      setSearchQuery("");
                    }}
                    className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                    aria-label="Quay lại"
                  >
                    <ArrowLeft className="size-5 text-on-surface" />
                  </button>
                  <h3 className="font-bold text-on-surface text-sm">Bắt đầu trò chuyện mới</h3>
                </div>
                <button 
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                  aria-label="Đóng"
                >
                  <X className="size-5 text-on-surface-variant" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-5 text-primary" />
                  <h3 className="font-bold text-on-surface text-sm">Chat nội bộ</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsNewChatMode(true);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-[#14140f] text-[#beff50] hover:scale-105 transition-all cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Chat mới
                  </button>
                  <button 
                    onClick={() => onOpenChange(false)}
                    className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                    aria-label="Đóng"
                  >
                    <X className="size-5 text-on-surface-variant" />
                  </button>
                </div>
              </div>
            )}
          </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-surface-container-lowest">
          {activeThread ? (
            /* Conversation messages */
            loadingMessages && chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/80 gap-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs">Đang tải tin nhắn...</span>
              </div>
            ) : (
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-soft"
              >
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant/70">
                    <MessageSquare className="size-10 text-on-surface-variant/40 mb-2" />
                    <p className="text-xs font-semibold">Chưa có tin nhắn</p>
                    <p className="text-[11px] mt-1">Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện.</p>
                  </div>
                ) : (
                  chatMessages.slice().reverse().map((msg) => {
                    const isMe = msg.senderUserId !== activeThread.peerUserId;
                    return (
                      <div 
                        key={msg.messageId} 
                        className={cn(
                          "flex flex-col max-w-[80%]", 
                          isMe ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        <div 
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm shadow-xs whitespace-pre-wrap break-words", 
                            isMe 
                              ? "bg-[#beff50] text-[#14140f] rounded-tr-none font-medium" 
                              : "bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/20"
                          )}
                        >
                          {msg.body}
                        </div>
                        <span className="text-[9px] text-on-surface-variant/70 mt-1 px-1">
                          {formatTime(msg.sentAt)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )
          ) : isNewChatMode ? (
            /* Staff List for New Chat */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-outline-variant/20 bg-surface-container-low">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 size-4 text-on-surface-variant/70" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm tài xế hoặc phụ xe..."
                    className="w-full h-10 rounded-full pl-9 pr-4 text-sm bg-white border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-soft">
                {filteredStaff.length === 0 ? (
                  <div className="py-8 text-center text-xs text-on-surface-variant/70 font-medium">
                    Không tìm thấy nhân viên phù hợp hoặc tất cả đã có trong lịch sử chat.
                  </div>
                ) : (
                  filteredStaff.map((staff) => (
                    <button
                      key={staff.userId}
                      onClick={() => startNewConversation(staff)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container-high text-left transition-colors duration-150 border border-transparent hover:border-outline-variant/30"
                    >
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0 border border-primary/20">
                        {staff.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface text-sm truncate">{staff.fullName}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {staff.role === "DRIVER" ? "Tài xế" : "Phụ xe"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Thread List View */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-outline-variant/20 bg-surface-container-low">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 size-4 text-on-surface-variant/70" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    className="w-full h-10 rounded-full pl-9 pr-4 text-sm bg-white border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface"
                  />
                </div>
              </div>
              
              {loadingThreads && threads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/80 gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <span className="text-xs">Đang tải cuộc trò chuyện...</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-soft">
                  {filteredThreads.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant/70">
                      <MessageSquare className="size-12 text-on-surface-variant/30 mb-2" />
                      <p className="text-xs font-semibold">Chưa có cuộc hội thoại nào</p>
                      <p className="text-[11px] mt-1">Bấm nút {"+ Chat mới"} phía trên để gửi tin nhắn đến tài xế hoặc phụ xe.</p>
                    </div>
                  ) : (
                    filteredThreads.map((thread) => (
                      <button
                        key={thread.peerUserId}
                        onClick={() => setActiveThread(thread)}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all duration-150 border",
                          thread.unreadCount > 0 
                            ? "bg-primary/5 border-primary/20 shadow-xs" 
                            : "border-transparent hover:bg-surface-container-high hover:border-outline-variant/30"
                        )}
                      >
                        <div className={cn(
                          "size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border relative",
                          thread.unreadCount > 0 
                            ? "bg-primary text-white border-primary" 
                            : "bg-surface-container-high text-on-surface border-outline-variant/40"
                        )}>
                          {thread.peerName.slice(0, 2).toUpperCase()}
                          {thread.unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 size-3 bg-red-600 rounded-full ring-2 ring-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className={cn("text-sm truncate", thread.unreadCount > 0 ? "font-extrabold text-on-surface" : "font-bold text-on-surface-variant")}>
                              {thread.peerName}
                            </h4>
                            <span className="text-[10px] text-on-surface-variant/70 shrink-0 ml-2">
                              {formatThreadTime(thread.lastMessageAt)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-1">
                            <p className={cn("text-xs truncate flex-1 pr-2", thread.unreadCount > 0 ? "font-semibold text-on-surface" : "text-on-surface-variant/80")}>
                              {thread.lastMessageBody && !thread.lastMessageBody.startsWith("[SOS]") 
                                ? thread.lastMessageBody 
                                : "Bắt đầu cuộc hội thoại..."}
                            </p>
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                              thread.peerRole === "DRIVER" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                            )}>
                              {thread.peerRole === "DRIVER" ? "Tài xế" : "Phụ xe"}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar (Only displayed in Conversation View) */}
        {activeThread && (
          <form 
            onSubmit={handleSendMessage}
            className="p-3 border-t border-outline-variant/30 bg-surface-container-low flex items-center gap-2"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={sending}
              className="flex-1 h-10 rounded-full px-4 text-sm bg-white border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder:text-on-surface-variant/60"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className={cn(
                "size-10 rounded-full flex items-center justify-center text-white transition-all shrink-0 cursor-pointer",
                messageText.trim() && !sending 
                  ? "bg-[#14140f] text-[#beff50] hover:scale-105" 
                  : "bg-surface-container-high text-on-surface-variant/40"
              )}
              aria-label="Gửi tin nhắn"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin text-[#beff50]" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </form>
        )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helpers
function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatThreadTime(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    if (isYesterday) {
      return "Hôm qua";
    }
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}
