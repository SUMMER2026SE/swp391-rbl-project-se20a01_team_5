"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bell, Bot, Bus, CreditCard, History, MapPin, Navigation, PackageSearch, QrCode, Route, School, Send, ShieldCheck, Sparkles, Star, TicketCheck, XCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { EmptyState, PageHeader, Section } from "@/components/bus/primitives";
import {
  AsyncBlock,
  DataList,
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
  experienceApi,
  feedbackApi,
  studentApi,
  transportApi,
  type EtaDTO,
  type ExperienceLostItemCard,
  type StudentDashboardView,
  type PassesDashboard,
  type RegistrationDTO,
  type RouteSuggestionDTO,
  type StopDTO,
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
  if (activeId === "stu-ai") return <AiRouteSuggestionsScreen />;
  if (activeId === "stu-chatbot") return <ChatbotScreen />;
  if (activeId === "stu-lost") return <LostItemsScreen />;
  return <Unavailable title="Màn sinh viên" />;
}

/**
 * REQ-STU-016: AI gợi ý tuyến xe phù hợp - rule-based suggestions from backend.
 */
function AiRouteSuggestionsScreen() {
  const [preference, setPreference] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    routeId: number;
    routeName: string;
    routeCode: string | null;
    colorHex: string | null;
    distanceKm: number | null;
    estimatedMinutes: number | null;
    frequencyMin: number | null;
    finalFare: number | null;
    hasSubsidy: boolean;
    directMatch: boolean;
    reasons: string;
  }>>([]);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/students/me/route-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("unibus_access_token") || ""}`,
        },
        body: JSON.stringify({ preference: preference || null }),
      });
      if (res.ok) {
        const json = await res.json();
        setSuggestions(json.data || []);
      } else {
        toast.error("Không lấy được gợi ý tuyến");
      }
    } catch {
      toast.error("Lỗi mạng");
    } finally {
      setLoading(false);
    }
  }, [preference]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="AI gợi ý tuyến"
        description="Hệ thống phân tích tuyến xe liên kết trường và xếp hạng theo tần suất, thời gian, khoảng cách và trợ giá."
        icon={<Sparkles className="size-7" />}
      />
      <div className="space-y-4">
        <ExpressiveCard variant="elevated" className="p-4">
          <Label htmlFor="ai-preference">Sở thích của bạn</Label>
          <Input
            id="ai-preference"
            placeholder="VD: nhanh, rẻ, gần... (để trống để gợi ý mặc định)"
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchSuggestions();
            }}
            className="mt-1"
          />
          <ExpressiveButton variant="filled" className="mt-3" onClick={fetchSuggestions} disabled={loading}>
            <Sparkles className="size-4" /> {loading ? "Đang gợi ý..." : "Gợi ý lại"}
          </ExpressiveButton>
        </ExpressiveCard>

        <DataList emptyTitle="Chưa có gợi ý" emptyDescription="Hoàn tất xác thực sinh viên để nhận gợi ý tuyến.">
          {suggestions.map((s, idx) => (
            <ExpressiveCard key={s.routeId} variant="elevated" className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      #{idx + 1}
                    </span>
                    <h3 className="font-bold text-on-surface">{s.routeCode || s.routeName}</h3>
                    {s.hasSubsidy && (
                      <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-bold text-success">Có trợ giá</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">{s.routeName}</p>
                  {s.reasons && (
                    <p className="mt-2 text-xs text-on-surface-variant">💡 {s.reasons}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-on-surface-variant">
                    {s.estimatedMinutes && <span>⏱ {s.estimatedMinutes} phút</span>}
                    {s.distanceKm && <span>📏 {s.distanceKm} km</span>}
                    {s.frequencyMin && <span>🔄 mỗi {s.frequencyMin} phút</span>}
                    {s.finalFare != null && <span>💰 {s.finalFare.toLocaleString("vi-VN")}đ/tháng</span>}
                  </div>
                </div>
              </div>
            </ExpressiveCard>
          ))}
        </DataList>
      </div>
    </div>
  );
}

/**
 * REQ-STU-017: Chatbot tra cứu tuyến và giá vé - rule-based NLP from backend.
 */
function ChatbotScreen() {
  const [messages, setMessages] = useState<Array<{
    chatHistoryId?: number;
    role: "USER" | "AI";
    content: string;
    sentAt: string;
  }>>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/students/me/assistant-chat", {
          headers: { Authorization: `Bearer ${localStorage.getItem("unibus_access_token") || ""}` },
        });
        if (res.ok) {
          const json = await res.json();
          setMessages(json.data || []);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(async () => {
    if (!draft.trim() || loading) return;
    const userMsg = { role: "USER" as const, content: draft.trim(), sentAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/students/me/assistant-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("unibus_access_token") || ""}`,
        },
        body: JSON.stringify({ message: userMsg.content }),
      });
      if (res.ok) {
        const json = await res.json();
        const turn = json.data;
        setMessages((prev) => [...prev, { role: "AI", content: turn.content, sentAt: turn.sentAt, chatHistoryId: turn.chatHistoryId }]);
      } else {
        toast.error("Chatbot đang bận, thử lại sau");
      }
    } catch {
      toast.error("Lỗi mạng");
    } finally {
      setLoading(false);
    }
  }, [draft, loading]);

  const suggestions = [
    "Giá vé tuyến 1 bao nhiêu?",
    "Lịch chạy tuyến 2",
    "Gợi ý tuyến phù hợp",
    "Mấy giờ chuyến cuối tuyến 1?",
  ];

  return (
    <div>
      <PageHeader
        title="Trợ lý UniBus"
        description="Tra cứu giá vé, lịch chạy xe và gợi ý tuyến bằng tiếng Việt."
        icon={<Bot className="size-7" />}
      />
      <div className="space-y-4">
        <div ref={scrollRef} className="max-h-[500px] min-h-[300px] space-y-3 overflow-y-auto rounded-2xl bg-surface-container p-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-on-surface-variant">
              <Bot className="mx-auto mb-2 size-10 opacity-50" />
              Xin chào! Mình là trợ lý ảo UniBus. Hỏi mình về giá vé, lịch chạy hoặc gợi ý tuyến nhé!
            </div>
          )}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl p-3 text-sm ${
                  m.role === "USER"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-surface-container-high p-3 text-sm text-on-surface-variant">
                Đang gõ...
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setDraft(s)}
              className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-highest"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nhập câu hỏi bằng tiếng Việt..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={loading}
            className="flex-1"
          />
          <ExpressiveButton variant="filled" onClick={send} disabled={!draft.trim() || loading}>
            <Send className="size-4" /> Gửi
          </ExpressiveButton>
        </div>
      </div>
    </div>
  );
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
  const resource = useApiResource<StudentDashboardView>(useCallback(() => experienceApi.studentDashboard(), []));
  const [qrExpanded, setQrExpanded] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8">
      <AsyncBlock resource={resource}>
        {(dashboard) => {
          const firstName = (dashboard.fullName || "bạn").trim().split(/\s+/).slice(-1)[0];
          const hour = new Date().getHours();
          const greeting = hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
          const activeRoute = dashboard.registration
            ? dashboard.routes.find((route) => route.routeId === dashboard.registration?.routeId)
            : dashboard.routes[0];
          const nextTrip = dashboard.nextTrip;
          const activeTicket = dashboard.activeTicket;
          const unread = dashboard.notifications.filter((item) => !item.read).length;

          return (
            <>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 24 }}
                className="space-y-3"
              >
                <h1 className="text-4xl font-black tracking-tight text-on-surface sm:text-5xl">
                  {greeting}, {firstName}!
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {dashboard.universityName && (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#beff50] px-3 text-xs font-black text-[#14140f]">
                      <School className="size-3.5" />
                      {dashboard.universityName}
                    </span>
                  )}
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#14140f] px-3 text-xs font-black text-white">
                    <ShieldCheck className="size-3.5" />
                    {dashboard.verificationStatus || "UNKNOWN"}
                  </span>
                  {dashboard.studentCode && (
                    <span className="inline-flex h-8 items-center rounded-full bg-[#144fcc] px-3 text-xs font-black text-white">
                      {dashboard.studentCode}
                    </span>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="relative overflow-hidden rounded-[28px] bg-[#beff50] p-5 text-[#14140f] shadow-[0_18px_50px_rgba(20,20,15,0.12)] sm:p-7"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-[#14140f]/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-8 size-40 rounded-full bg-[#144fcc]/10 blur-3xl" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-7 items-center rounded-full bg-[#14140f] px-3 text-xs font-black text-white">
                        {nextTrip?.routeCode || activeRoute?.routeCode || "UNIBUS"}
                      </span>
                      <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[#14140f]/10 px-3 text-xs font-black">
                        <motion.span
                          className="size-1.5 rounded-full bg-[#14140f]"
                          animate={{ opacity: [1, 0.28, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        />
                        {nextTrip?.status === "RUNNING" ? "Đang chạy" : "Sắp khởi hành"}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black leading-tight sm:text-3xl">Chuyến sắp tới</h2>
                    <p className="truncate text-sm font-semibold opacity-80 sm:text-base">
                      {activeRoute?.fromStopName || dashboard.registration?.boardingStopName || "Điểm lên"} {"->"} {activeRoute?.toStopName || dashboard.registration?.alightingStopName || "Điểm xuống"}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <HeroMetric label="Khởi hành" value={timeText(nextTrip?.departureTime) || activeRoute?.firstTrip || "Hôm nay"} />
                      <HeroMetric label="Biển số" value={nextTrip?.licensePlate || "Đang gán"} />
                      <HeroMetric label="Mật độ" value={nextTrip?.occupancy != null ? `${nextTrip.occupancy}/${nextTrip.seatCount || "?"}` : "Đang cập nhật"} />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setQrExpanded(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative flex size-24 items-center justify-center rounded-full bg-[#14140f] shadow-[0_12px_30px_rgba(20,20,15,0.25)]"
                    >
                      <motion.span
                        className="absolute inset-0 rounded-full bg-[#beff50]/40"
                        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                      />
                      <QrCode className="relative size-10 text-[#beff50]" />
                    </motion.button>
                    <div className="flex flex-wrap justify-center gap-2">
                      <ExpressiveButton onClick={() => onNavigate("stu-tracking")} className="bg-[#14140f] text-white hover:bg-[#14140f]/90">
                        <Navigation className="size-4" />
                        Theo dõi
                      </ExpressiveButton>
                      <ExpressiveButton variant="tonal" onClick={() => onNavigate("stu-payment")} className="border-2 border-[#14140f] bg-white text-[#14140f]">
                        Mua vé
                        <ArrowRight className="size-4" />
                      </ExpressiveButton>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <PrototypeStat tone="dark" label="Tuyến khả dụng" value={dashboard.routes.length} helper="Theo trường của bạn" icon={<Route className="size-5" />} />
                <PrototypeStat tone="coral" label="Trạm phục vụ" value={dashboard.stops.length} helper="Đà Nẵng" icon={<MapPin className="size-5" />} />
                <PrototypeStat tone="blue" label="Thông báo" value={unread} helper="Chưa đọc" icon={<Bell className="size-5" />} />
                <PrototypeStat tone="purple" label="Lượt đi" value={dashboard.history.length} helper="Gần đây" icon={<History className="size-5" />} />
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <Section title="Tuyến của tôi" description="Đang sử dụng tháng này">
                  <ExpressiveCard variant="filled" className="p-2">
                    {dashboard.registration ? (
                      <RouteRow
                        routeCode={dashboard.registration.routeCode}
                        routeName={dashboard.registration.routeName}
                        colorHex={dashboard.registration.colorHex}
                        from={dashboard.registration.boardingStopName}
                        to={dashboard.registration.alightingStopName}
                        onClick={() => onNavigate("stu-my-routes")}
                      />
                    ) : (
                      <EmptyState
                        icon={<Route className="size-7" />}
                        title="Chưa đăng ký tuyến"
                        description="Tìm tuyến phù hợp rồi đăng ký để mua vé tháng."
                        action={<ExpressiveButton onClick={() => onNavigate("stu-find")}>Tìm tuyến xe</ExpressiveButton>}
                      />
                    )}
                    {dashboard.routes.slice(0, 3).map((route) => (
                      <RouteRow
                        key={route.routeId}
                        routeCode={route.routeCode}
                        routeName={route.routeName}
                        colorHex={route.colorHex}
                        from={route.fromStopName}
                        to={route.toStopName}
                        meta={`${route.frequencyMin || "?"} phút/chuyến · ${formatMoney(route.monthlyFare)}`}
                        onClick={() => onNavigate("stu-find")}
                      />
                    ))}
                  </ExpressiveCard>
                </Section>

                <Section title="Truy cập nhanh" description="Lối tắt các tác vụ phổ biến">
                  <div className="grid grid-cols-2 gap-3">
                    <QuickAction id="stu-find" label="Tìm tuyến xe" icon={<Route className="size-5" />} bg="#144fcc" fg="#fff" onNavigate={onNavigate} />
                    <QuickAction id="stu-tracking" label="Theo dõi xe" icon={<Navigation className="size-5" />} bg="#ff8c5f" fg="#14140f" onNavigate={onNavigate} />
                    <QuickAction id="stu-payment" label="Mua vé tháng" icon={<CreditCard className="size-5" />} bg="#14140f" fg="#fff" onNavigate={onNavigate} />
                    <QuickAction id="stu-lost" label="Báo mất đồ" icon={<PackageSearch className="size-5" />} bg="#c8a0ff" fg="#14140f" onNavigate={onNavigate} />
                  </div>
                </Section>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <ExpressiveCard variant="elevated" className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-on-surface">Vé tháng</h2>
                      <p className="text-sm text-on-surface-variant">QR, trợ giá và giá cuối</p>
                    </div>
                    <StatusPill status={activeTicket?.status || "EMPTY"} />
                  </div>
                  <TicketSummary dashboard={dashboardToPasses(dashboard)} onNavigate={onNavigate} />
                </ExpressiveCard>

                <div className="grid gap-4 md:grid-cols-2">
                  <ExpressiveCard variant="elevated" className="p-5">
                    <h2 className="text-lg font-black text-on-surface">Thông báo gần đây</h2>
                    <div className="mt-4 space-y-3">
                      {dashboard.notifications.slice(0, 4).map((item) => (
                        <div key={item.notificationId} className="rounded-2xl bg-surface-container-high p-3">
                          <p className="text-sm font-bold text-on-surface">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{item.content}</p>
                        </div>
                      ))}
                      {dashboard.notifications.length === 0 && <p className="text-sm text-on-surface-variant">Chưa có thông báo.</p>}
                    </div>
                  </ExpressiveCard>

                  <ExpressiveCard variant="elevated" className="p-5">
                    <h2 className="text-lg font-black text-on-surface">Lịch sử chuyến</h2>
                    <div className="mt-4 space-y-3">
                      {dashboard.history.slice(0, 4).map((item) => (
                        <div key={item.travelHistoryId} className="rounded-2xl bg-surface-container-high p-3">
                          <p className="text-sm font-bold text-on-surface">{item.routeCode || item.routeName}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">{item.boardingStopName || "?"} {"->"} {item.alightingStopName || "?"}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">{formatDateTime(item.boardedAt)}</p>
                        </div>
                      ))}
                      {dashboard.history.length === 0 && <p className="text-sm text-on-surface-variant">Chưa có lịch sử chuyến.</p>}
                    </div>
                  </ExpressiveCard>
                </div>
              </div>

              {/* QR expand overlay — framer-motion animation */}
              <AnimatePresence>
                {qrExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(20, 20, 15, 0.75)" }}
                    onClick={() => setQrExpanded(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0, borderRadius: "50%" }}
                      animate={{ scale: 1, opacity: 1, borderRadius: "24px" }}
                      exit={{ scale: 0.5, opacity: 0, borderRadius: "50%" }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="relative bg-[#14140f] text-white rounded-3xl p-5 sm:p-8 max-w-sm w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-[#beff50] text-[#14140f]">
                            <QrCode className="size-5" />
                          </div>
                          <p className="text-sm font-bold">Vé của tôi</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQrExpanded(false)}
                          className="state-layer size-8 rounded-full flex items-center justify-center text-white/60 hover:text-white"
                        >
                          <XCircle className="size-5" />
                        </button>
                      </div>

                      <div className="flex justify-center mb-4">
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 18 }}
                          className="bg-white rounded-2xl p-4"
                        >
                          {activeTicket?.qrCode ? (
                            <QRCodeCanvas value={activeTicket.qrCode} size={170} />
                          ) : (
                            <div className="flex size-[170px] flex-col items-center justify-center text-center text-sm font-medium text-black/50">
                              Chưa có vé<br />để hiển thị
                            </div>
                          )}
                        </motion.div>
                      </div>

                      <div className="text-center">
                        <p className="text-xl font-black">{dashboard.universityName || "Sinh viên"}</p>
                        <p className="text-sm opacity-60">
                          {activeRoute?.fromStopName || dashboard.registration?.boardingStopName || "Điểm lên"} {"->"} {activeRoute?.toStopName || dashboard.registration?.alightingStopName || "Điểm xuống"}
                        </p>
                        <p className="mt-3 text-xs font-bold text-[#beff50]">QUÉT ĐỂ LÊN XE</p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          );
        }}
      </AsyncBlock>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-0.5 text-lg font-black tabular-nums sm:text-xl">{value || "Chưa có"}</p>
    </div>
  );
}

function PrototypeStat({
  tone,
  label,
  value,
  helper,
  icon,
}: {
  tone: "dark" | "coral" | "blue" | "purple";
  label: string;
  value: React.ReactNode;
  helper: string;
  icon: React.ReactNode;
}) {
  const styles = {
    dark: "bg-[#14140f] text-white",
    coral: "bg-[#ff8c5f] text-[#14140f]",
    blue: "bg-[#144fcc] text-white",
    purple: "bg-[#c8a0ff] text-[#14140f]",
  }[tone];
  const iconStyles = tone === "dark" || tone === "blue" ? "bg-[#beff50] text-[#14140f]" : "bg-[#14140f] text-white";
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`rounded-2xl p-4 shadow-[0_14px_34px_rgba(20,20,15,0.10)] sm:p-5 ${styles}`}
    >
      <div className={`mb-3 flex size-10 items-center justify-center rounded-xl ${iconStyles}`}>{icon}</div>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-65">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] font-bold opacity-75">{helper}</p>
    </motion.div>
  );
}

function RouteRow({
  routeCode,
  routeName,
  colorHex,
  from,
  to,
  meta,
  onClick,
}: {
  routeCode?: string;
  routeName?: string;
  colorHex?: string;
  from?: string;
  to?: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-surface-container-high"
    >
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: colorHex || "#144fcc" }}
      >
        <Bus className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-on-surface">{routeCode ? `${routeCode} · ` : ""}{routeName || "Tuyến xe"}</p>
        <p className="truncate text-xs text-on-surface-variant">{from || "Điểm lên"} {"->"} {to || "Điểm xuống"}</p>
        {meta && <p className="mt-1 truncate text-xs font-semibold text-on-surface-variant">{meta}</p>}
      </div>
      <ArrowRight className="size-4 text-on-surface-variant" />
    </button>
  );
}

function QuickAction({
  id,
  label,
  icon,
  bg,
  fg,
  onNavigate,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  bg: string;
  fg: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onNavigate(id)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex min-h-[112px] w-full flex-col rounded-2xl p-4 text-left shadow-[0_12px_30px_rgba(20,20,15,0.10)]"
      style={{ backgroundColor: bg, color: fg }}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-white/90 text-[#14140f]">{icon}</div>
      <span className="text-sm font-black">{label}</span>
    </motion.button>
  );
}

function dashboardToPasses(dashboard: StudentDashboardView): PassesDashboard {
  return {
    tickets: dashboard.activeTicket
      ? [{
          ticketId: dashboard.activeTicket.ticketId,
          ticketType: dashboard.activeTicket.ticketType,
          routeId: dashboard.activeTicket.routeId,
          routeName: dashboard.activeTicket.routeName,
          boardingStopName: dashboard.activeTicket.boardingStopName,
          alightingStopName: dashboard.activeTicket.alightingStopName,
          validFrom: dashboard.activeTicket.validFrom,
          expiresAt: dashboard.activeTicket.expiresAt || dashboard.activeTicket.expiresOn,
          originalFareAmount: dashboard.activeTicket.originalFareAmount,
          subsidyAmount: dashboard.activeTicket.subsidyAmount,
          finalFareAmount: dashboard.activeTicket.finalFareAmount,
          fareAmount: dashboard.activeTicket.finalFareAmount,
          qrCode: dashboard.activeTicket.qrCode,
          status: dashboard.activeTicket.status,
        }]
      : [],
    payments: [],
    monthlyPassQuote: null,
  };
}

function timeText(value?: string) {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
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
    let eta: EtaDTO[] = [];
    if (registration) {
      eta = await transportApi.eta(registration.routeId, registration.boardingStopId).catch(() => []);
    }
    return { registration, eta };
  }, []);
  const resource = useApiResource(loader);

  return (
    <div>
      <PageHeader title="Theo dõi xe" description="ETA thật theo tuyến và trạm đang đăng ký." icon={<MapPin className="size-7" />} />
      <AsyncBlock resource={resource}>
        {({ registration, eta }) => {
          const nextEta = eta[0];
          return registration ? (
            <ExpressiveCard variant="elevated" className="p-5">
              <h2 className="text-xl font-bold text-on-surface">{registration.routeName}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Điểm lên" value={registration.boardingStopName} />
                <Info label="Điểm xuống" value={registration.alightingStopName} />
                <Info label="Dự kiến đến" value={nextEta?.estimatedArrivalAt ? formatDateTime(nextEta.estimatedArrivalAt) : "Chưa có ETA"} />
                <Info label="Cập nhật" value={nextEta?.updatedAt ? formatDateTime(nextEta.updatedAt) : "Chưa có"} />
              </div>
            </ExpressiveCard>
          ) : (
            <EmptyState icon={<Route className="size-7" />} title="Chưa có tuyến để theo dõi" description="Đăng ký tuyến trước để xem ETA." />
          );
        }}
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "MOMO" | "BANK_TRANSFER" | "CASH">("VNPAY");

  const purchase = async () => {
    setBuying(true);
    try {
      // Simulate payment gateway redirect: open modal first, then confirm on the modal.
      setShowPaymentModal(true);
    } finally {
      setBuying(false);
    }
  };

  const confirmPayment = async () => {
    setBuying(true);
    try {
      // In a real VNPay/MoMo integration, we'd:
      // 1. POST /api/v1/payments/checkout to get redirect URL
      // 2. window.location.href = redirectUrl
      // 3. gateway returns to /payment/return?token=xxx
      // 4. backend IPN webhook confirms PAID
      // For mock gateway, we just call purchaseMonthlyPass directly with the selected method.
      const apiMethod = paymentMethod === "VNPAY" || paymentMethod === "MOMO" ? "E_WALLET" : paymentMethod;
      await studentApi.purchaseMonthlyPass(apiMethod);
      toast.success("Thanh toán thành công qua " + paymentMethod);
      setShowPaymentModal(false);
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Thanh toán thất bại"));
    } finally {
      setBuying(false);
    }
  };

  return (
    <div>
      <PageHeader title={title} description="Vé và thanh toán thật từ ticketing backend. Tích hợp VNPay/MoMo (mock) cho demo." icon={<QrCode className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(dashboard) => (
          <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
            <ExpressiveCard variant="elevated" className="p-5">
              <TicketSummary dashboard={dashboard} onNavigate={() => {}} />
              <div className="mt-5">
                <ExpressiveButton onClick={purchase} disabled={buying} className="w-full">
                  <CreditCard className="size-4" />
                  {buying ? "Đang xử lý..." : "Mua vé tháng"}
                </ExpressiveButton>
                <p className="mt-2 text-center text-xs text-on-surface-variant">
                  Hỗ trợ VNPay, MoMo, chuyển khoản
                </p>
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

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <ExpressiveCard variant="elevated" className="w-full max-w-md p-6">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-on-surface">Thanh toán vé tháng</h2>
              <button
                onClick={() => !buying && setShowPaymentModal(false)}
                className="rounded-full p-1 hover:bg-surface-container-high"
                disabled={buying}
              >
                <XCircle className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">
              Chọn phương thức thanh toán. Bạn sẽ được chuyển đến cổng thanh toán.
            </p>
            <div className="mt-4 space-y-2">
              {([
                { id: "VNPAY", name: "VNPay QR", desc: "Quét mã QR VNPay để thanh toán" },
                { id: "MOMO", name: "MoMo Wallet", desc: "Ví điện tử MoMo" },
                { id: "BANK_TRANSFER", name: "Chuyển khoản ngân hàng", desc: "Vietcombank, Techcombank, MB Bank" },
                { id: "CASH", name: "Tiền mặt trên xe", desc: "Thanh toán trực tiếp cho phụ xe" },
              ] as const).map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${
                    paymentMethod === m.id ? "border-primary bg-primary/5" : "border-outline"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={m.id}
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-bold text-on-surface">{m.name}</p>
                    <p className="text-xs text-on-surface-variant">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <ExpressiveButton
              variant="filled"
              className="mt-4 w-full"
              onClick={confirmPayment}
              disabled={buying}
            >
              <CreditCard className="size-4" />
              {buying ? "Đang xử lý..." : `Xác nhận thanh toán (${paymentMethod})`}
            </ExpressiveButton>
            <p className="mt-3 text-center text-xs text-on-surface-variant">
              🔒 Mock gateway - demo only. Thanh toán sẽ được tự động xác nhận.
            </p>
          </ExpressiveCard>
        </div>
      )}
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

function LostItemsScreen() {
  const resource = useApiResource<ExperienceLostItemCard[]>(useCallback(() => experienceApi.studentLostItems(), []));
  const [itemDescription, setItemDescription] = useState("");
  const [tripId, setTripId] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!itemDescription.trim()) {
      toast.error("Nhập mô tả đồ thất lạc");
      return;
    }
    setSending(true);
    try {
      await experienceApi.createStudentLostItem({
        itemDescription,
        tripId: tripId ? Number(tripId) : undefined,
      });
      setItemDescription("");
      setTripId("");
      toast.success("Đã gửi báo mất đồ");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi báo mất đồ"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Báo mất đồ" description="Tạo và theo dõi báo cáo đồ thất lạc bằng dữ liệu thật." icon={<PackageSearch className="size-7" />} />
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <ExpressiveCard variant="elevated" className="space-y-4 p-5">
          <Field label="Trip ID nếu nhớ">
            <Input type="number" value={tripId} onChange={(e) => setTripId(e.target.value)} placeholder="Ví dụ: 12" />
          </Field>
          <Field label="Mô tả đồ thất lạc">
            <Textarea value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} placeholder="Màu sắc, vị trí ghế, thời gian..." />
          </Field>
          <ExpressiveButton onClick={submit} disabled={sending}>
            <Send className="size-4" />
            {sending ? "Đang gửi..." : "Gửi báo cáo"}
          </ExpressiveButton>
        </ExpressiveCard>
        <AsyncBlock resource={resource}>
          {(items) => (
            <DataList emptyTitle="Chưa có báo mất đồ" emptyDescription="Các báo cáo thất lạc của bạn sẽ xuất hiện tại đây.">
              {items.map((item) => (
                <ExpressiveCard key={item.lostItemReportId} variant="elevated" className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-bold text-on-surface">{item.itemDescription}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">{item.routeCode || item.routeName || "Chưa gắn tuyến"} · {formatDateTime(item.reportedAt)}</p>
                      {item.notes && <p className="mt-2 rounded-xl bg-surface-container-high p-3 text-sm text-on-surface">{item.notes}</p>}
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
