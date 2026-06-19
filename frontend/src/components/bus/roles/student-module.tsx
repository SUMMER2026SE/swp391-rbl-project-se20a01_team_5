"use client";

import { useCallback, useState } from "react";
import { Bell, CreditCard, History, MapPin, QrCode, Route, School, Star, TicketCheck } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { EmptyState, PageHeader, Section, StatCard } from "@/components/bus/primitives";
import {
  AsyncBlock,
  DataList,
  ErrorPanel,
  LoadingPanel,
  StatusPill,
  UnavailablePanel,
  formatDate,
  formatDateTime,
  formatMoney,
  getErrorMessage,
  useApiResource,
} from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  feedbackApi,
  notificationApi,
  studentApi,
  transportApi,
  type EtaDTO,
  type PassesDashboard,
  type RegistrationDTO,
  type RouteSuggestionDTO,
  type StopDTO,
  type StudentProfile,
  type StudentUniversityView,
  type TravelHistoryView,
} from "@/lib/api/client";

type StudentModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

async function optional<T>(loader: () => Promise<T>): Promise<T | null> {
  try {
    return await loader();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function StudentModule({ activeId, onNavigate }: StudentModuleProps) {
  if (activeId === "stu-dashboard") return <StudentDashboard onNavigate={onNavigate} />;
  if (activeId === "stu-university") return <StudentUniversityScreen />;
  if (activeId === "stu-stops") return <StopsScreen />;
  if (activeId === "stu-find") return <FindRouteScreen />;
  if (activeId === "stu-tracking") return <TrackingScreen />;
  if (activeId === "stu-my-routes") return <RegistrationScreen />;
  if (activeId === "stu-my-ticket") return <TicketsScreen title="Vé của tôi" />;
  if (activeId === "stu-payment") return <TicketsScreen title="Thanh toán & vé" />;
  if (activeId === "stu-invoices") return <InvoicesScreen />;
  if (activeId === "stu-history") return <HistoryScreen />;
  if (activeId === "stu-feedback") return <FeedbackScreen />;
  if (activeId === "stu-ai") return <Unavailable title="AI gợi ý tuyến" />;
  if (activeId === "stu-chatbot") return <Unavailable title="Chatbot tra cứu" />;
  if (activeId === "stu-lost") return <Unavailable title="Báo mất đồ" />;
  return <Unavailable title="Màn sinh viên" />;
}

function StudentUniversityScreen() {
  const resource = useApiResource<StudentUniversityView>(useCallback(() => studentApi.university(), []));
  return (
    <div>
      <PageHeader title="Trường của tôi" description="Trạng thái liên kết trường từ roster/domain backend." icon={<School className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(university) => (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <ExpressiveCard variant="elevated" className="p-5">
              <h2 className="text-xl font-bold text-on-surface">{university.universityName || university.domainHint || "Chưa liên kết trường"}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {university.universityName
                  ? "Tài khoản của bạn đã được gắn với trường trong hệ thống UniBus."
                  : university.domainHint
                    ? "Email Google khớp domain trường, nhưng chưa có roster ACTIVE để tự xác minh."
                    : "Chưa tìm thấy domain hoặc roster khớp email hiện tại."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill status={university.linkStatus} />
                <StatusPill status={university.studentVerificationStatus} />
              </div>
            </ExpressiveCard>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="MSSV" value={university.studentCode || "Chưa có"} />
              <Info label="Roster" value={<StatusPill status={university.rosterStatus || "UNKNOWN"} />} />
              <Info label="Gợi ý domain" value={university.domainHint || "Chưa có"} />
              <Info label="Tên ngắn" value={university.shortName || "Chưa có"} />
            </div>
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function StudentDashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const loader = useCallback(async () => {
    const [profile, registration, tickets, unread] = await Promise.all([
      studentApi.profile(),
      optional(() => studentApi.currentRegistration()),
      studentApi.tickets(),
      notificationApi.unreadCount().catch(() => 0),
    ]);
    return { profile, registration, tickets, unread };
  }, []);
  const resource = useApiResource(loader);

  return (
    <div>
      <PageHeader
        title="Trang chủ sinh viên"
        description="Tổng quan lấy từ hồ sơ, tuyến đăng ký, vé và thông báo thật."
        icon={<School className="size-7" />}
      />
      <AsyncBlock resource={resource}>
        {({ profile, registration, tickets, unread }) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Trường" value={profile.university || "Chưa có"} icon={<School className="size-6" />} accent="secondary" />
              <StatCard label="Xác minh" value={<StatusPill status={profile.studentVerificationStatus} />} icon={<TicketCheck className="size-6" />} accent="success" />
              <StatCard label="Tuyến hiện tại" value={registration?.routeName || "Chưa đăng ký"} icon={<Route className="size-6" />} accent="primary" />
              <StatCard label="Thông báo chưa đọc" value={unread} icon={<Bell className="size-6" />} accent="tertiary" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <ExpressiveCard variant="elevated" className="p-5">
                <h2 className="text-xl font-bold text-on-surface">Tuyến đang sử dụng</h2>
                {registration ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Info label="Tuyến" value={registration.routeName} />
                    <Info label="Trạng thái" value={<StatusPill status={registration.status} />} />
                    <Info label="Điểm lên" value={registration.boardingStopName} />
                    <Info label="Điểm xuống" value={registration.alightingStopName} />
                  </div>
                ) : (
                  <EmptyState
                    icon={<Route className="size-7" />}
                    title="Chưa đăng ký tuyến"
                    description="Tìm tuyến phù hợp rồi đăng ký để mua vé tháng."
                    action={<ExpressiveButton onClick={() => onNavigate("stu-find")}>Tìm tuyến xe</ExpressiveButton>}
                  />
                )}
              </ExpressiveCard>

              <ExpressiveCard variant="elevated" className="p-5">
                <h2 className="text-xl font-bold text-on-surface">Vé tháng</h2>
                <TicketSummary dashboard={tickets} onNavigate={onNavigate} />
              </ExpressiveCard>
            </div>
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function StopsScreen() {
  const loader = useCallback(() => transportApi.stops(), []);
  const resource = useApiResource<StopDTO[]>(loader);

  return (
    <div>
      <PageHeader title="Trạm dừng" description="Danh sách trạm từ backend transport." icon={<MapPin className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(stops) => (
          <DataList emptyTitle="Chưa có trạm" emptyDescription="Backend chưa trả về trạm dừng nào.">
            {stops.map((stop) => (
              <ExpressiveCard key={stop.stopId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{stop.stopName}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{stop.address || "Chưa có địa chỉ"}</p>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {stop.latitude ?? "?"}, {stop.longitude ?? "?"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(stop.routes || []).map((route) => (
                      <StatusPill key={route.routeId} status={route.routeName} />
                    ))}
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

function FindRouteScreen() {
  const stopsResource = useApiResource(useCallback(() => transportApi.stops(), []));
  const [boardingStopId, setBoardingStopId] = useState("");
  const [alightingStopId, setAlightingStopId] = useState("");
  const [routes, setRoutes] = useState<RouteSuggestionDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!boardingStopId || !alightingStopId) {
      toast.error("Chọn điểm lên và điểm xuống");
      return;
    }
    setLoading(true);
    try {
      setRoutes(await transportApi.searchRoutes(boardingStopId, alightingStopId));
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tìm tuyến"));
    } finally {
      setLoading(false);
    }
  };

  const register = async (routeId: number) => {
    try {
      await studentApi.registerRoute({
        routeId,
        boardingStopId: Number(boardingStopId),
        alightingStopId: Number(alightingStopId),
      });
      toast.success("Đã đăng ký tuyến");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể đăng ký tuyến"));
    }
  };

  return (
    <div>
      <PageHeader title="Tìm tuyến xe" description="Tìm tuyến qua endpoint route search thật." icon={<Route className="size-7" />} />
      <AsyncBlock resource={stopsResource}>
        {(stops) => (
          <div className="space-y-5">
            <ExpressiveCard variant="elevated" className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <SelectStop label="Điểm lên" value={boardingStopId} onChange={setBoardingStopId} stops={stops} />
              <SelectStop label="Điểm xuống" value={alightingStopId} onChange={setAlightingStopId} stops={stops} />
              <ExpressiveButton onClick={search} disabled={loading}>{loading ? "Đang tìm..." : "Tìm tuyến"}</ExpressiveButton>
            </ExpressiveCard>

            <DataList emptyTitle="Chưa có kết quả" emptyDescription="Chọn điểm lên/xuống để tìm tuyến phù hợp.">
              {routes.map((route) => (
                <ExpressiveCard key={route.routeId} variant="elevated" className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">{route.routeName}</h3>
                      <p className="text-sm text-on-surface-variant">
                        {route.distanceKm ? `${route.distanceKm} km` : "Chưa có khoảng cách"} · {route.estimatedMinutes ? `${route.estimatedMinutes} phút` : "Chưa có ETA"}
                      </p>
                      <p className="mt-2 text-xs text-on-surface-variant">
                        {(route.stops || []).map((s) => s.stopName).join(" -> ") || "Backend chưa trả về danh sách trạm của tuyến"}
                      </p>
                    </div>
                    <ExpressiveButton onClick={() => register(route.routeId)}>Đăng ký tuyến</ExpressiveButton>
                  </div>
                </ExpressiveCard>
              ))}
            </DataList>
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function TrackingScreen() {
  const loader = useCallback(async () => {
    const registration = await optional(() => studentApi.currentRegistration());
    let eta: EtaDTO | null = null;
    if (registration) {
      eta = await transportApi.eta(registration.routeId, registration.boardingStopId).catch(() => null);
    }
    return { registration, eta };
  }, []);
  const resource = useApiResource(loader);

  return (
    <div>
      <PageHeader title="Theo dõi xe" description="ETA thật theo tuyến và trạm đang đăng ký." icon={<MapPin className="size-7" />} />
      <AsyncBlock resource={resource}>
        {({ registration, eta }) => registration ? (
          <ExpressiveCard variant="elevated" className="p-5">
            <h2 className="text-xl font-bold text-on-surface">{registration.routeName}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Điểm lên" value={registration.boardingStopName} />
              <Info label="Điểm xuống" value={registration.alightingStopName} />
              <Info label="Dự kiến đến" value={eta?.estimatedArrivalAt ? formatDateTime(eta.estimatedArrivalAt) : "Chưa có ETA"} />
              <Info label="Cập nhật" value={eta?.updatedAt ? formatDateTime(eta.updatedAt) : "Chưa có"} />
            </div>
          </ExpressiveCard>
        ) : (
          <EmptyState icon={<Route className="size-7" />} title="Chưa có tuyến để theo dõi" description="Đăng ký tuyến trước để xem ETA." />
        )}
      </AsyncBlock>
    </div>
  );
}

function RegistrationScreen() {
  const loader = useCallback(() => optional(() => studentApi.currentRegistration()), []);
  const resource = useApiResource<RegistrationDTO | null>(loader);

  const cancel = async (registrationId: number) => {
    try {
      await studentApi.cancelRegistration(registrationId, "Student cancelled from frontend");
      resource.setData(null);
      toast.success("Đã hủy đăng ký tuyến");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể hủy đăng ký"));
    }
  };

  return (
    <div>
      <PageHeader title="Tuyến của tôi" description="Đăng ký tuyến hiện tại từ backend." icon={<TicketCheck className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(registration) => registration ? (
          <ExpressiveCard variant="elevated" className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-on-surface">{registration.routeName}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{registration.boardingStopName} {"->"} {registration.alightingStopName}</p>
                <p className="mt-2 text-xs text-on-surface-variant">Ngày hiệu lực: {formatDate(registration.effectiveDate)}</p>
              </div>
              <div className="flex gap-2">
                <StatusPill status={registration.status} />
                <ExpressiveButton variant="error" onClick={() => cancel(registration.registrationId)}>Hủy</ExpressiveButton>
              </div>
            </div>
          </ExpressiveCard>
        ) : (
          <EmptyState icon={<Route className="size-7" />} title="Chưa đăng ký tuyến" description="Tuyến đăng ký sẽ xuất hiện tại đây sau khi backend lưu thành công." />
        )}
      </AsyncBlock>
    </div>
  );
}

function TicketsScreen({ title }: { title: string }) {
  const loader = useCallback(() => studentApi.tickets(), []);
  const resource = useApiResource<PassesDashboard>(loader);
  const [buying, setBuying] = useState(false);

  const purchase = async () => {
    setBuying(true);
    try {
      await studentApi.purchaseMonthlyPass("E_WALLET");
      toast.success("Đã mua vé tháng");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể mua vé tháng"));
    } finally {
      setBuying(false);
    }
  };

  return (
    <div>
      <PageHeader title={title} description="Vé và thanh toán thật từ ticketing backend." icon={<QrCode className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(dashboard) => (
          <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
            <ExpressiveCard variant="elevated" className="p-5">
              <TicketSummary dashboard={dashboard} onNavigate={() => {}} />
              <div className="mt-5">
                <ExpressiveButton onClick={purchase} disabled={buying} className="w-full">
                  <CreditCard className="size-4" />
                  {buying ? "Đang mua..." : "Mua vé tháng"}
                </ExpressiveButton>
              </div>
            </ExpressiveCard>
            <Section title="Danh sách vé">
              <DataList emptyTitle="Chưa có vé" emptyDescription="Mua vé tháng để QR xuất hiện tại đây.">
                {(dashboard.tickets || []).map((ticket) => (
                  <ExpressiveCard key={ticket.ticketId} variant="elevated" className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-bold text-on-surface">{ticket.routeName}</h3>
                        <p className="text-sm text-on-surface-variant">{ticket.boardingStopName} {"->"} {ticket.alightingStopName}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">Hết hạn: {formatDateTime(ticket.expiresAt)}</p>
                        <div className="mt-2"><StatusPill status={ticket.status} /></div>
                      </div>
                      {ticket.qrCode && (
                        <div className="rounded-2xl bg-white p-3">
                          <QRCodeCanvas value={ticket.qrCode} size={112} />
                        </div>
                      )}
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

function InvoicesScreen() {
  const loader = useCallback(() => studentApi.payments(), []);
  const resource = useApiResource(loader);
  return (
    <div>
      <PageHeader title="Hóa đơn" description="Thanh toán và hóa đơn từ backend." icon={<CreditCard className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(payments) => (
          <DataList emptyTitle="Chưa có hóa đơn" emptyDescription="Các thanh toán thành công sẽ xuất hiện tại đây.">
            {payments.map((payment) => (
              <ExpressiveCard key={payment.paymentId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{payment.invoiceNumber || `Payment #${payment.paymentId}`}</h3>
                    <p className="text-sm text-on-surface-variant">{formatDateTime(payment.createdAt)} · {payment.method || "Chưa có phương thức"}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-black text-on-surface">{formatMoney(payment.finalAmount ?? payment.amount)}</p>
                    <StatusPill status={payment.status} />
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

function HistoryScreen() {
  const loader = useCallback(() => studentApi.travelHistory(), []);
  const resource = useApiResource<TravelHistoryView[]>(loader);
  return (
    <div>
      <PageHeader title="Lịch sử chuyến" description="Lịch sử quét vé lên/xuống xe từ backend." icon={<History className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có lịch sử" emptyDescription="Sau khi vé được quét, lịch sử chuyến sẽ xuất hiện.">
            {items.map((item) => (
              <ExpressiveCard key={item.travelHistoryId} variant="elevated" className="p-4">
                <h3 className="font-bold text-on-surface">{item.routeName}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{item.boardingStopName || "?"} {"->"} {item.alightingStopName || "?"}</p>
                <p className="mt-2 text-xs text-on-surface-variant">{formatDate(item.serviceDate)} · Lên xe: {formatDateTime(item.boardedAt)}</p>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function FeedbackScreen() {
  const loader = useCallback(() => feedbackApi.mine(), []);
  const resource = useApiResource(loader);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("GENERAL");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!content.trim()) {
      toast.error("Nhập nội dung phản hồi");
      return;
    }
    setSending(true);
    try {
      await feedbackApi.create({ content, rating, category });
      setContent("");
      toast.success("Đã gửi phản hồi");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi phản hồi"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Phản hồi & đánh giá" description="Gửi và xem phản hồi thật của sinh viên." icon={<Star className="size-7" />} />
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <ExpressiveCard variant="elevated" className="space-y-4 p-5">
          <Field label="Mức đánh giá">
            <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
          </Field>
          <Field label="Nhóm phản hồi">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Nội dung">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
          </Field>
          <ExpressiveButton onClick={submit} disabled={sending}>{sending ? "Đang gửi..." : "Gửi phản hồi"}</ExpressiveButton>
        </ExpressiveCard>
        <AsyncBlock resource={resource}>
          {(items) => (
            <DataList emptyTitle="Chưa có phản hồi" emptyDescription="Phản hồi đã gửi sẽ xuất hiện tại đây.">
              {items.map((item) => (
                <ExpressiveCard key={item.feedbackId} variant="elevated" className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-bold text-on-surface">{item.category || "Phản hồi"}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">{item.content}</p>
                      {item.response && <p className="mt-2 rounded-xl bg-surface-container-high p-3 text-sm text-on-surface">Phản hồi: {item.response}</p>}
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

function TicketSummary({ dashboard, onNavigate }: { dashboard: PassesDashboard; onNavigate: (id: string) => void }) {
  const active = (dashboard.tickets || []).find((ticket) => ["ACTIVE", "VALID"].includes((ticket.status || "").toUpperCase())) || dashboard.tickets?.[0];
  if (!active) {
    return (
      <EmptyState
        icon={<QrCode className="size-7" />}
        title="Chưa có vé tháng"
        description={dashboard.monthlyPassQuote ? `Giá dự kiến: ${formatMoney(dashboard.monthlyPassQuote.payableAmount ?? dashboard.monthlyPassQuote.finalFareAmount)}` : "Đăng ký tuyến trước để backend báo giá vé tháng."}
        action={<ExpressiveButton variant="tonal" onClick={() => onNavigate("stu-payment")}>Mở thanh toán</ExpressiveButton>}
      />
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-on-surface">{active.routeName}</h3>
        <p className="text-sm text-on-surface-variant">Hết hạn: {formatDateTime(active.expiresAt)}</p>
        <div className="mt-2"><StatusPill status={active.status} /></div>
      </div>
      {active.qrCode && (
        <div className="mx-auto w-fit rounded-3xl bg-white p-4">
          <QRCodeCanvas value={active.qrCode} size={180} />
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Info label="Gốc" value={formatMoney(active.originalFareAmount ?? active.fareAmount)} />
        <Info label="Trợ giá" value={formatMoney(active.subsidyAmount)} />
        <Info label="Thanh toán" value={formatMoney(active.finalFareAmount)} />
      </div>
    </div>
  );
}

function SelectStop({
  label,
  value,
  onChange,
  stops,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  stops: StopDTO[];
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-[#144fcc]"
      >
        <option value="">Chọn trạm</option>
        {stops.map((stop) => (
          <option key={stop.stopId} value={stop.stopId}>{stop.stopName}</option>
        ))}
      </select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-container-high p-3">
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <div className="mt-1 text-sm font-bold text-on-surface">{value || "Chưa có"}</div>
    </div>
  );
}

function Unavailable({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} description="UI được giữ lại, nhưng backend thật cho chức năng này chưa có trong MVP." icon={<Route className="size-7" />} />
      <UnavailablePanel />
    </div>
  );
}
