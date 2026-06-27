"use client";

// =============================================================================
// Assistant (Conductor) Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// 7 role-specific screens:
//   ast-dashboard, ast-scan, ast-monthly, ast-lost, ast-incident, ast-contact,
//   ast-history
// Visual: keeps prototype v1.1 (hero perk card, lime accent, scan modal,
// vertical timeline, incident cards, contact cards).
// Data: real backend via /conductor/dashboard, /conductor/tickets/scan, etc.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ScanLine,
  QrCode,
  TicketCheck,
  PackageSearch,
  AlertTriangle,
  Phone,
  History,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Send,
  RefreshCw,
  Coffee,
  Bus,
  MessageSquare,
  PhoneCall,
  TrendingUp,
  ChevronRight,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  ExpressiveButton,
  ExpressiveCard,
  StatusPill as M3StatusPill,
  M3Progress,
} from "@/components/m3/primitives";
import {
  SplitText,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Counter,
  PageTransition,
} from "@/components/m3/motion";
import { PageHeader, StatCard, Section, EmptyState } from "../primitives";
import { QrScannerModal } from "@/components/bus/qr-scanner-modal";

import {
  useAssistantPrototypeData,
  formatVND,
  formatDateTime,
  formatDate,
} from "@/lib/prototype-data";
import {
  operationsApi,
  experienceApi,
  type DriverTripView,
  type ConductorTicketView,
  type TicketScanResult,
  type ExperienceDashboardStat,
  conductorApi,
  type ConductorContactView,
} from "@/lib/api/client";

type AssistantModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function AssistantModule({ activeId, onNavigate }: AssistantModuleProps) {
  const proto = useAssistantPrototypeData();

  if (proto.loading) return <LoadingScreen label="Đang tải dữ liệu phụ xe..." />;
  if (proto.error) return <ErrorScreen message={proto.error} onRetry={proto.reload} />;

  const d = proto.data!;
  const ctx = {
    user: d.user,
    trips: d.trips,
    activeTrip: d.activeTrip,
    tickets: d.tickets,
    incidents: d.incidents,
    lostItems: d.lostItems,
    stats: d.stats,
    notifications: d.notifications,
    conductorTrips: d.conductorTrips,
    raw: {
      dashboard: d.dashboard,
      tripsRaw: d.tripsRaw,
      notificationsRaw: d.notificationsRaw,
      profileRaw: d.profileRaw,
    },
    reload: proto.reload,
  };

  switch (activeId) {
    case "ast-dashboard":
      return <AssistantDashboard ctx={ctx} onNavigate={onNavigate} />;
    case "ast-scan":
      return <AssistantScan ctx={ctx} />;
    case "ast-monthly":
      return <AssistantMonthly ctx={ctx} />;
    case "ast-lost":
      return <AssistantLost ctx={ctx} />;
    case "ast-incident":
      return <AssistantIncident ctx={ctx} />;
    case "ast-contact":
      return <AssistantContact ctx={ctx} />;
    case "ast-history":
      return <AssistantHistory ctx={ctx} />;
    default:
      return <FallbackScreen activeId={activeId} />;
  }
}

export default AssistantModule;

// =============================================================================
interface Ctx {
  user: any;
  trips: any[];
  activeTrip: any | null;
  tickets: any[];
  incidents: any[];
  lostItems: any[];
  stats: ExperienceDashboardStat[];
  notifications: any[];
  conductorTrips: any[];
  raw: any;
  reload: () => void;
}

function LoadingScreen({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="mt-5 text-sm font-medium text-on-surface-variant">{label}</p>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-error-container">
        <AlertTriangle className="size-7 text-error" />
      </div>
      <p className="mt-4 text-lg font-bold text-on-surface">Không tải được dữ liệu</p>
      <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">{message}</p>
      {onRetry && (
        <ExpressiveButton variant="filled" className="mt-5" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Thử lại
        </ExpressiveButton>
      )}
    </div>
  );
}

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

// =============================================================================
// Screen 1: Assistant Dashboard
// =============================================================================
function AssistantDashboard({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const firstName = (ctx.user.name || "bạn").split(" ").slice(-1)[0];
  const activeTrip = ctx.activeTrip;
  const statCards = ctx.stats.slice(0, 4);

  const quickActions = [
    { id: "ast-scan", label: "Quét vé", icon: ScanLine, accent: "primary" as const },
    { id: "ast-monthly", label: "Vé tháng", icon: TicketCheck, accent: "tertiary" as const },
    { id: "ast-incident", label: "Báo sự cố", icon: AlertTriangle, accent: "error" as const },
    { id: "ast-lost", label: "Đồ thất lạc", icon: PackageSearch, accent: "secondary" as const },
  ];

  return (
    <PageTransition className="space-y-6 sm:space-y-8 min-w-0">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="space-y-3 min-w-0"
      >
        <SplitText
          as="h1"
          text={`${greetingByHour()}, ${firstName}!`}
          className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface text-balance"
          stagger={0.06}
        />
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#144fcc] text-white text-xs font-bold shrink-0">
            <Bus className="size-3.5" />
            Phụ xe
          </span>
          {activeTrip && (
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#beff50] text-[#14140f] text-xs font-bold shrink-0">
              <motion.span
                className="size-1.5 rounded-full bg-[#14140f]"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              Đang trong chuyến
            </span>
          )}
        </div>
      </motion.div>

      {activeTrip ? (
        <ScrollReveal>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative overflow-hidden rounded-3xl p-5 sm:p-7 elev-2"
            style={{ backgroundColor: "#beff50", color: "#14140f" }}
          >
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#14140f]/8 blur-3xl pointer-events-none" />
            <div className="relative min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold items-center">
                  <motion.span
                    className="size-1.5 rounded-full bg-[#beff50]"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  CHUYẾN ĐANG CHẠY
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 truncate">
                {activeTrip.routeName || "Chuyến xe"}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold opacity-70 uppercase">Biển số</p>
                  <p className="font-bold">{activeTrip.licensePlate || activeTrip.busPlate || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-70 uppercase">Khởi hành</p>
                  <p className="font-bold">{activeTrip.departTime || activeTrip.departureTime || "—"}</p>
                </div>
              </div>
              <ExpressiveButton
                variant="filled"
                className="mt-4 bg-[#14140f] text-[#beff50]"
                onClick={() => onNavigate("ast-scan")}
              >
                <ScanLine className="size-4" />
                Bắt đầu quét vé
              </ExpressiveButton>
            </div>
          </motion.div>
        </ScrollReveal>
      ) : (
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-6 text-center min-w-0">
            <Coffee className="size-10 mx-auto text-on-surface-variant" />
            <p className="mt-3 text-base font-bold">Không có chuyến đang chạy</p>
            <p className="text-sm text-on-surface-variant mt-1">Đợi điều phối phân công chuyến.</p>
          </ExpressiveCard>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.1}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
          {quickActions.map((action) => {
            const accentMap: Record<string, { bg: string; fg: string }> = {
              primary: { bg: "#14140f", fg: "#beff50" },
              tertiary: { bg: "#ff8c5f", fg: "#14140f" },
              secondary: { bg: "#144fcc", fg: "#beff50" },
              error: { bg: "#dc2626", fg: "#ffffff" },
            };
            const a = accentMap[action.accent];
            return (
              <motion.button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="group relative overflow-hidden rounded-2xl p-4 elev-1 hover:elev-2 transition-shadow text-left min-w-0"
                style={{ backgroundColor: a.bg, color: a.fg }}
              >
                <action.icon className="size-6 mb-3" />
                <p className="text-sm font-bold leading-tight">{action.label}</p>
                <ChevronRight className="size-4 mt-2 opacity-70 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            );
          })}
        </div>
      </ScrollReveal>

      {statCards.length > 0 && (
        <ScrollReveal delay={0.15}>
          <Section title="Tổng quan">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
              {statCards.map((s, i) => (
                <StatCard
                  key={i}
                  label={s.label}
                  value={
                    <Counter
                      to={typeof s.value === "number" ? s.value : 0}
                      format={(n) =>
                        typeof s.value === "string"
                          ? s.value
                          : Math.round(n).toLocaleString("vi-VN")
                      }
                    />
                  }
                  icon={<TrendingUp className="size-5" />}
                  hint={s.unit}
                  accent={(s.tone as any) || "primary"}
                />
              ))}
            </div>
          </Section>
        </ScrollReveal>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal delay={0.2}>
          <Section title="Sự cố gần đây" actions={<button onClick={() => onNavigate("ast-incident")} className="text-xs font-bold text-primary">Xem tất cả</button>}>
            {ctx.incidents.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle className="size-7" />}
                title="Không có sự cố"
                description="Mọi chuyến đều ổn định."
              />
            ) : (
              <div className="space-y-2">
                {ctx.incidents.slice(0, 3).map((inc: any) => (
                  <ExpressiveCard key={inc.id} variant="filled" className="p-3 min-w-0">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertTriangle className="size-4 text-error mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{inc.description}</p>
                        <p className="text-xs text-on-surface-variant">{formatDate(inc.createdAt)}</p>
                      </div>
                      <M3StatusPill label={inc.status} tone={inc.status === "closed" ? "neutral" : "warning"} />
                    </div>
                  </ExpressiveCard>
                ))}
              </div>
            )}
          </Section>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <Section title="Đồ thất lạc" actions={<button onClick={() => onNavigate("ast-lost")} className="text-xs font-bold text-primary">Xem tất cả</button>}>
            {ctx.lostItems.length === 0 ? (
              <EmptyState
                icon={<PackageSearch className="size-7" />}
                title="Không có đồ thất lạc"
                description="Chưa có báo mất nào trên chuyến của bạn."
              />
            ) : (
              <div className="space-y-2">
                {ctx.lostItems.slice(0, 3).map((l: any) => (
                  <ExpressiveCard key={l.id} variant="filled" className="p-3 min-w-0">
                    <div className="flex items-start gap-2 min-w-0">
                      <PackageSearch className="size-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{l.item}</p>
                        <p className="text-xs text-on-surface-variant">{formatDate(l.createdAt)}</p>
                      </div>
                      <M3StatusPill label={l.status} tone={l.status === "returned" ? "success" : "warning"} />
                    </div>
                  </ExpressiveCard>
                ))}
              </div>
            )}
          </Section>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

// =============================================================================
// Screen 2: Scan — QR scanner + manual QR entry
// =============================================================================
function AssistantScan({ ctx }: { ctx: Ctx }) {
  const [tripId, setTripId] = useState<number | null>(null);
  const [qrInput, setQrInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastResult, setLastResult] = useState<TicketScanResult | null>(null);
  const [tickets, setTickets] = useState<ConductorTicketView[] | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (!tripId && ctx.conductorTrips.length > 0) {
      setTripId(ctx.conductorTrips[0].tripId);
    }
  }, [ctx.conductorTrips]);

  const loadTickets = useCallback(async () => {
    if (!tripId) return;
    setLoadingTickets(true);
    try {
      const t = await operationsApi.conductorTickets(tripId);
      setTickets(t);
    } catch {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, [tripId]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const scan = async (qrCode?: string) => {
    const code = qrCode ?? qrInput.trim();
    if (!code || !tripId) {
      toast.error("Vui lòng nhập mã QR và chọn chuyến");
      return;
    }
    if (scanning) return;
    setScanning(true);
    try {
      const r = await operationsApi.scanTicket(tripId, code);
      setLastResult(r);
      if (r.valid) toast.success(r.message || "Vé hợp lệ");
      else toast.error(r.message || "Vé không hợp lệ");
      setQrInput("");
      loadTickets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể quét vé");
    } finally {
      setScanning(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Quét vé"
        description="Quét mã QR vé tháng để kiểm tra hợp lệ."
        icon={<ScanLine className="size-7" />}
        actions={
          <Select value={tripId ? String(tripId) : ""} onValueChange={(v) => setTripId(Number(v))}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Chọn chuyến" /></SelectTrigger>
            <SelectContent>
              {ctx.conductorTrips.map((t) => (
                <SelectItem key={t.tripId} value={String(t.tripId)}>{t.routeName} — {formatDate(t.serviceDate)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-6 min-w-0">
            <h3 className="text-base font-bold mb-4">Máy quét</h3>
            <div className="aspect-square max-w-xs mx-auto bg-[#14140f] rounded-3xl p-8 flex items-center justify-center relative overflow-hidden">
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-[#beff50]"
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <QrCode className="size-32 text-[#beff50]/40" />
            </div>
            <div className="mt-5 space-y-3">
              <ExpressiveButton
                variant="filled"
                className="w-full h-14 bg-[#beff50] text-[#14140f] hover:bg-[#a6e639]"
                onClick={() => {
                  if (!tripId) {
                    toast.error("Vui lòng chọn chuyến trước khi quét");
                    return;
                  }
                  setScannerOpen(true);
                }}
                disabled={scanning}
              >
                <ScanLine className="size-5" />
                Bật camera quét vé
              </ExpressiveButton>
              <div>
                <Label className="text-xs font-bold">Nhập mã QR thủ công</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Nhập mã QR vé..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && scan()}
                />
              </div>
              <ExpressiveButton variant="filled" className="w-full" onClick={() => scan()} disabled={scanning || !qrInput.trim()}>
                {scanning ? <RefreshCw className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
                Quét vé
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          {lastResult ? (
            <ExpressiveCard
              variant="elevated"
              className={cn(
                "p-6 min-w-0 border-4",
                lastResult.valid ? "border-success" : "border-error"
              )}
            >
              <div className="flex flex-col items-center text-center min-w-0">
                {lastResult.valid ? (
                  <CheckCircle2 className="size-16 text-success" />
                ) : (
                  <XCircle className="size-16 text-error" />
                )}
                <p className={cn("text-xl font-bold mt-3", lastResult.valid ? "text-success" : "text-error")}>
                  {lastResult.valid ? "Vé hợp lệ" : "Vé không hợp lệ"}
                </p>
                <p className="text-sm text-on-surface-variant mt-1">{lastResult.message}</p>
                {lastResult.ticket && (
                  <div className="mt-4 w-full p-3 rounded-xl bg-surface-container-low text-left min-w-0">
                    <p className="text-xs text-on-surface-variant">Mã sinh viên</p>
                    <p className="font-bold">{lastResult.ticket.studentCode || "—"}</p>
                    <p className="text-xs text-on-surface-variant mt-2">Tên sinh viên</p>
                    <p className="font-bold">{lastResult.ticket.studentName || "—"}</p>
                    <p className="text-xs text-on-surface-variant mt-2">Tuyến</p>
                    <p className="font-bold">{lastResult.ticket.routeName || "—"}</p>
                  </div>
                )}
              </div>
            </ExpressiveCard>
          ) : (
            <ExpressiveCard variant="filled" className="p-6 min-w-0">
              <h3 className="text-base font-bold mb-3">Kết quả quét</h3>
              <EmptyState
                icon={<ScanLine className="size-7" />}
                title="Chưa có kết quả"
                description="Quét vé để xem kết quả tại đây."
              />
            </ExpressiveCard>
          )}
        </ScrollReveal>
      </div>

      <QrScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(code) => scan(code)}
        isLoading={scanning}
      />

      <Section title={`Vé đã quét chuyến này (${tickets?.length || 0})`}>
        {loadingTickets ? (
          <LoadingScreen label="Đang tải danh sách vé..." />
        ) : !tickets || tickets.length === 0 ? (
          <EmptyState
            icon={<TicketCheck className="size-7" />}
            title="Chưa có vé nào"
            description="Danh sách vé đã quét sẽ hiển thị tại đây."
          />
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <ExpressiveCard key={t.ticketId} variant="elevated" className="p-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 shrink-0 rounded-xl bg-success-container text-success flex items-center justify-center">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{t.studentName || t.studentCode || "Sinh viên"}</p>
                    <p className="text-xs text-on-surface-variant truncate">{t.routeName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-on-surface-variant">{formatDateTime(t.lastScannedAt)}</p>
                    <M3StatusPill label={t.status} tone={t.status === "VALID" || t.status === "ACTIVE" ? "success" : "warning"} />
                  </div>
                </div>
              </ExpressiveCard>
            ))}
          </div>
        )}
      </Section>
    </PageTransition>
  );
}

// =============================================================================
// Screen 3: Monthly — list of monthly pass holders on this trip
// =============================================================================
function AssistantMonthly({ ctx }: { ctx: Ctx }) {
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Vé tháng"
        description="Danh sách vé tháng có hiệu lực trên chuyến."
        icon={<TicketCheck className="size-7" />}
      />
      {ctx.tickets.length === 0 ? (
        <EmptyState
          icon={<TicketCheck className="size-7" />}
          title="Không có vé tháng"
          description="Chưa có sinh viên đăng ký vé tháng cho chuyến này."
        />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {ctx.tickets.map((t) => (
            <StaggerItem key={t.ticketId}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-12 shrink-0 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
                    <TicketCheck className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{t.studentName || t.studentCode || "Sinh viên"}</p>
                    <p className="text-xs text-on-surface-variant truncate">{t.routeName}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      Hiệu lực: {formatDate(t.validFrom)} → {formatDate(t.expiresAt)}
                    </p>
                  </div>
                  <M3StatusPill label={t.status} tone={t.status === "ACTIVE" || t.status === "VALID" ? "success" : "warning"} />
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 4: Lost Items
// =============================================================================
function AssistantLost({ ctx }: { ctx: Ctx }) {
  const [updating, setUpdating] = useState<number | null>(null);
  const [showNotes, setShowNotes] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const updateStatus = async (id: number, status: string, notesValue?: string) => {
    setUpdating(id);
    try {
      await experienceApi.updateAssistantLostItem(id, { status, notes: notesValue });
      toast.success(`Đã cập nhật trạng thái: ${status}`);
      ctx.reload();
      setShowNotes(null);
      setNotes("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể cập nhật");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Đồ thất lạc"
        description="Quản lý đồ thất lạc trên chuyến."
        icon={<PackageSearch className="size-7" />}
      />
      {ctx.lostItems.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-7" />}
          title="Không có đồ thất lạc"
          description="Chưa có báo mất nào trên chuyến của bạn."
        />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {ctx.lostItems.map((l: any) => (
            <StaggerItem key={l.id}>
              <ExpressiveCard variant="elevated" className="p-5 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-10 shrink-0 rounded-xl bg-warning-container text-warning flex items-center justify-center">
                      <PackageSearch className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{l.item}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(l.createdAt)}</p>
                      {l.description && l.description !== l.item && (
                        <p className="text-xs mt-1 line-clamp-2">{l.description}</p>
                      )}
                    </div>
                  </div>
                  <M3StatusPill label={l.status} tone={l.status === "returned" ? "success" : l.status === "found" ? "primary" : "warning"} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {l.status !== "found" && l.status !== "returned" && (
                    <ExpressiveButton variant="tonal" size="sm" onClick={() => updateStatus(l.id, "found")} disabled={updating === l.id}>
                      <CheckCircle2 className="size-4" />
                      Đã tìm thấy
                    </ExpressiveButton>
                  )}
                  {l.status === "found" && (
                    <ExpressiveButton variant="filled" size="sm" onClick={() => setShowNotes(l.id)} disabled={updating === l.id}>
                      <CheckCircle2 className="size-4" />
                      Trả lại
                    </ExpressiveButton>
                  )}
                </div>
                {showNotes === l.id && (
                  <div className="mt-3 p-3 rounded-xl bg-surface-container-low space-y-2">
                    <Label className="text-xs font-bold">Ghi chú (tùy chọn)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="VD: Đã trả cho sinh viên tại trạm..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <ExpressiveButton variant="text" size="sm" onClick={() => setShowNotes(null)}>Hủy</ExpressiveButton>
                      <ExpressiveButton variant="filled" size="sm" onClick={() => updateStatus(l.id, "returned", notes)} disabled={updating === l.id}>
                        Xác nhận trả
                      </ExpressiveButton>
                    </div>
                  </div>
                )}
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 5: Incident — report incident + list
// =============================================================================
function AssistantIncident({ ctx }: { ctx: Ctx }) {
  const [tripId, setTripId] = useState<number | null>(null);
  const [type, setType] = useState("delay");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tripId && ctx.conductorTrips.length > 0) setTripId(ctx.conductorTrips[0].tripId);
  }, [ctx.conductorTrips]);

  const submit = async () => {
    if (!tripId || !description.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      await experienceApi.createIncident({ tripId, incidentType: type, description: description.trim() });
      toast.success("Đã báo sự cố. Điều phối sẽ xử lý.");
      setDescription("");
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể báo sự cố");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Sự cố"
        description="Báo cáo sự cố trong chuyến và theo dõi trạng thái."
        icon={<AlertTriangle className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-5 min-w-0">
            <h3 className="text-base font-bold mb-4">Báo sự cố mới</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold">Chuyến</Label>
                <Select value={tripId ? String(tripId) : ""} onValueChange={(v) => setTripId(Number(v))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn chuyến" /></SelectTrigger>
                  <SelectContent>
                    {ctx.conductorTrips.map((t) => (
                      <SelectItem key={t.tripId} value={String(t.tripId)}>{t.routeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Loại sự cố</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delay">Chậm trễ</SelectItem>
                    <SelectItem value="breakdown">Hỏng xe</SelectItem>
                    <SelectItem value="accident">Tai nạn</SelectItem>
                    <SelectItem value="behavior">Hành vi</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Mô tả</Label>
                <Textarea
                  className="mt-1.5"
                  placeholder="Mô tả chi tiết sự cố..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <ExpressiveButton variant="filled" className="w-full" onClick={submit} disabled={submitting}>
                {submitting ? <RefreshCw className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                Gửi báo cáo
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Section title={`Sự cố đã báo (${ctx.incidents.length})`}>
            {ctx.incidents.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle className="size-7" />}
                title="Chưa có sự cố"
                description="Các sự cố bạn báo sẽ hiển thị tại đây."
              />
            ) : (
              <div className="space-y-3">
                {ctx.incidents.map((inc: any) => (
                  <ExpressiveCard key={inc.id} variant="filled" className="p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                      <p className="text-sm font-bold capitalize truncate">{inc.type}</p>
                      <M3StatusPill label={inc.status} tone={inc.status === "closed" ? "neutral" : "warning"} />
                    </div>
                    <p className="text-sm line-clamp-2">{inc.description}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{formatDate(inc.createdAt)}</p>
                  </ExpressiveCard>
                ))}
              </div>
            )}
          </Section>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

// =============================================================================
// Screen 6: Contact
// =============================================================================
function AssistantContact({ ctx }: { ctx: Ctx }) {
  const [contact, setContact] = useState<ConductorContactView | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadContact = useCallback(async () => {
    try {
      const data = await conductorApi.contact();
      setContact(data);
    } catch (err: any) {
      toast.error(err.message || "Không tải được liên hệ phụ xe");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContact();
    const timer = window.setInterval(loadContact, 4000);
    return () => window.clearInterval(timer);
  }, [loadContact]);

  const send = async () => {
    if (!message.trim() || sending) return;
    try {
      setSending(true);
      await conductorApi.sendMessage({
        tripId: contact?.activeTripId,
        recipientType: "DISPATCHER",
        content: message.trim(),
      });
      setMessage("");
      await loadContact();
    } catch (err: any) {
      toast.error(err.message || "Không gửi được tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const messages = contact?.messages ?? [];
  const contacts = contact?.contacts?.length ? contact.contacts : [];
  const dispatcher = contacts.find((c) => c.role === "DISPATCHER");
  const driver = contacts.find((c) => c.role === "DRIVER");

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Liên hệ"
        description="Trao đổi nội bộ với tài xế và điều phối viên theo chuyến đang chạy."
        icon={<Phone className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal>
          <Section title="Danh bạ chuyến xe">
            <div className="space-y-3">
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-12 shrink-0 rounded-2xl bg-[#beff50] text-[#14140f] flex items-center justify-center font-black">
                    TX
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface-variant">Tài xế</p>
                    <p className="font-bold truncate">{driver?.name || contact?.driverName || "Chưa có tài xế"}</p>
                    <p className="text-xs text-on-surface-variant">{driver?.phoneNumber || contact?.driverPhone || "Chưa có số điện thoại"}</p>
                  </div>
                  {(driver?.phoneNumber || contact?.driverPhone) && (
                    <a href={`tel:${driver?.phoneNumber || contact?.driverPhone}`} className="shrink-0">
                      <ExpressiveButton variant="tonal" size="icon-sm"><PhoneCall className="size-4" /></ExpressiveButton>
                    </a>
                  )}
                </div>
              </ExpressiveCard>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-12 shrink-0 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center font-black">
                    ĐP
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface-variant">Điều phối viên</p>
                    <p className="font-bold truncate">{dispatcher?.name || "Chưa có điều phối"}</p>
                    <p className="text-xs text-on-surface-variant">{dispatcher?.phoneNumber || "Chưa có số điện thoại"}</p>
                  </div>
                  {dispatcher?.phoneNumber && (
                    <a href={`tel:${dispatcher.phoneNumber}`} className="shrink-0">
                      <ExpressiveButton variant="tonal" size="icon-sm"><PhoneCall className="size-4" /></ExpressiveButton>
                    </a>
                  )}
                </div>
              </ExpressiveCard>
              <ExpressiveCard variant="filled" className="p-4">
                <p className="text-xs text-on-surface-variant">Chuyến đang liên hệ</p>
                <p className="font-bold">{contact?.routeName || ctx.activeTrip?.routeName || "Chưa có chuyến đang chạy"}</p>
              </ExpressiveCard>
            </div>
          </Section>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <ExpressiveCard variant="elevated" className="flex flex-col h-[460px] min-w-0">
            <div className="p-4 border-b-2 border-outline-variant">
              <h3 className="font-bold flex items-center gap-2">
                <MessageSquare className="size-4" />
                Chat nội bộ
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-w-0">
              {loading && <p className="text-sm text-on-surface-variant text-center mt-8">Đang tải tin nhắn...</p>}
              {!loading && messages.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center mt-8">Gửi tin nhắn khi cần hỗ trợ.</p>
              )}
              {messages.map((m) => {
                const isMe = m.senderName !== dispatcher?.name && m.senderName !== driver?.name;
                return (
                  <motion.div
                    key={m.messageId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex max-w-[85%]", isMe && "ml-auto justify-end")}
                  >
                    <div className={cn("px-3 py-2 rounded-2xl text-sm min-w-0", isMe ? "bg-primary text-on-primary" : "bg-surface-container-high")}>
                      <p className="text-[10px] opacity-70 mb-1 truncate">{m.senderName}</p>
                      <p className="break-words">{m.content}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="p-3 border-t-2 border-outline-variant flex gap-2 min-w-0">
              <Input
                placeholder="Nhập tin nhắn..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={sending}
                className="flex-1 min-w-0"
              />
              <ExpressiveButton variant="filled" size="icon" onClick={send} disabled={sending || !message.trim()}>
                {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

// =============================================================================
// Screen 7: History
// =============================================================================
function AssistantHistory({ ctx }: { ctx: Ctx }) {
  const completed = ctx.trips.filter((t: any) => t.status === "completed");
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lịch sử chuyến"
        description={`${completed.length} chuyến đã hoàn thành`}
        icon={<History className="size-7" />}
      />
      {completed.length === 0 ? (
        <EmptyState
          icon={<History className="size-7" />}
          title="Chưa có chuyến hoàn thành"
          description="Lịch sử các chuyến sẽ hiển thị tại đây."
        />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {completed.map((t: any) => (
            <StaggerItem key={t.id}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 shrink-0 rounded-xl bg-success-container text-success flex items-center justify-center">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{t.routeName}</p>
                    <p className="text-xs text-on-surface-variant">{formatDate(t.date)} • {t.departTime}</p>
                  </div>
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
function FallbackScreen({ activeId }: { activeId: string }) {
  return (
    <EmptyState
      icon={<Info className="size-7" />}
      title="Màn chưa hỗ trợ"
      description={`Màn "${activeId}" chưa được triển khai.`}
    />
  );
}
