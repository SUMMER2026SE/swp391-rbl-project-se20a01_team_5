"use client";

// =============================================================================
// Admin Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// 10 role-specific screens:
//   adm-dashboard, adm-universities, adm-uni-admins, adm-route-uni, adm-audit,
//   adm-users, adm-complaints, adm-violations, adm-fare, adm-notify
// Visual: keeps prototype v1.1 (hero perk card, dashboard stat grid,
// university logo cards, audit log table, user management list).
// Data: real backend via /admin/* endpoints.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  School,
  UserCog,
  Route as RouteIcon,
  ScrollText,
  Users,
  ShieldAlert,
  AlertOctagon,
  Tag,
  Megaphone,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Plus,
  Edit,
  Trash2,
  Save,
  Lock,
  Unlock,
  Filter,
  BarChart3,
  FileBarChart,
  Percent,
  Globe,
  GraduationCap,
  BadgeCheck,
  Banknote,
  Receipt,
  Search,
  CalendarClock,
  Wallet,
  Clock,
  Bus,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

import {
  useAdminPrototypeData,
  useAdminVerifications,
  useAdminPayments,
  formatVND,
  formatDateTime,
  formatDate,
} from "@/lib/prototype-data";
import {
  adminApi,
  isPaidStatus,
  isUnpaidStatus,
  experienceApi,
  notificationApi,
  type AdminUserView,
  type UniversityView,
  type UniversityAdminView,
  type VerificationView,
  type PaymentTransactionView,
  type AuditLogView,
  type RouteUniversityView,
  type SubsidyPolicyView,
  type ExperienceDashboardStat,
  type AdminStatsView,
} from "@/lib/api/client";
import { ProtectedImage } from "@/components/bus/protected-image";

type AdminModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

const paymentFinalAmount = (payment: PaymentTransactionView) => {
  if (payment.finalAmount != null) {
    if (payment.finalAmount > 0) return payment.finalAmount;
    const original = payment.originalAmount ?? payment.orderTotal ?? 0;
    const subsidy = payment.subsidyAmount ?? 0;
    if (original > 0 && subsidy >= original) return 0;
    if (!isPaidStatus(payment.paymentStatus) && !isUnpaidStatus(payment.paymentStatus)) return payment.finalAmount;
  }
  return payment.orderTotal ?? payment.amountIn ?? 0;
};

const paymentOriginalAmount = (payment: PaymentTransactionView) =>
  payment.originalAmount ?? payment.orderTotal ?? payment.amountIn ?? 0;

const paymentModeLabel = (payment: PaymentTransactionView) => {
  if (payment.orderMode === "journey-combo") return "Combo nhiều chặng";
  if (payment.ticketPeriod === "day" || payment.ticketType === "single") return "Vé ngày";
  return "Vé tháng";
};

const paymentPeriodLabel = (payment: PaymentTransactionView) => {
  if (payment.ticketType === "single" || payment.ticketPeriod === "day") return "day";
  return payment.ticketPeriod || "month";
};

const paymentJourneyLabel = (payment: PaymentTransactionView) =>
  payment.originLabel && payment.destinationLabel
    ? `${payment.originLabel} → ${payment.destinationLabel}`
    : payment.routeName || payment.ticketType || "—";

export function AdminModule({ activeId, onNavigate }: AdminModuleProps) {
  const proto = useAdminPrototypeData();

  if (proto.loading || !proto.data) return <LoadingScreen label="Đang tải dữ liệu quản trị..." />;
  if (proto.error) return <ErrorScreen message={proto.error} onRetry={proto.reload} />;

  const d = proto.data!;
  const ctx = {
    user: d.user,
    stats: d.stats,
    routeMetrics: d.routeMetrics,
    complaints: d.complaints,
    violations: d.violations,
    fares: d.fares,
    users: d.users,
    verifications: d.verifications,
    universities: d.universities,
    notifications: d.notifications,
    audits: d.audits,
    payments: d.payments,
    routeUnis: d.routeUnis,
    subsidies: d.subsidies,
    uniAdmins: d.uniAdmins,
    raw: {
      statsRaw: d.statsRaw,
      usersRaw: d.usersRaw,
      verificationsRaw: d.verificationsRaw,
      universitiesRaw: d.universitiesRaw,
      complaintsRaw: d.complaintsRaw,
      violationsRaw: d.violationsRaw,
      faresRaw: d.faresRaw,
      notificationsRaw: d.notificationsRaw,
      profileRaw: d.profileRaw,
      auditsRaw: d.auditsRaw,
      paymentsRaw: d.paymentsRaw,
      routeUnisRaw: d.routeUnisRaw,
      subsidiesRaw: d.subsidiesRaw,
      uniAdminsRaw: d.uniAdminsRaw,
    },
    reload: proto.reload,
  };

  switch (activeId) {
    case "adm-dashboard":
      return <DashboardScreen ctx={ctx} onNavigate={onNavigate} />;
    case "adm-universities":
      return <UniversitiesScreen ctx={ctx} />;
    case "adm-uni-admins":
      return <UniAdminsScreen ctx={ctx} />;
    case "adm-route-uni":
      return <RouteUniScreen ctx={ctx} />;
    case "adm-audit":
      return <AuditScreen ctx={ctx} />;
    case "adm-users":
      return <UsersScreen ctx={ctx} />;
    case "adm-complaints":
      return <ComplaintsScreen ctx={ctx} />;
    case "adm-verifications":
      return <VerificationsScreen ctx={ctx} />;
    case "adm-violations":
      return <ViolationsScreen ctx={ctx} />;
    case "adm-transactions":
      return <TransactionsScreen />;
    case "adm-fare":
      return <FareScreen ctx={ctx} />;
    case "adm-notify":
      return <NotifyScreen ctx={ctx} />;
    default:
      return <FallbackScreen activeId={activeId} />;
  }
}

export default AdminModule;

// =============================================================================
interface Ctx {
  user: any;
  stats: ExperienceDashboardStat[];
  routeMetrics: any[];
  complaints: any[];
  violations: any[];
  fares: any[];
  users: AdminUserView[];
  verifications: VerificationView[];
  universities: UniversityView[];
  notifications: any[];
  audits: AuditLogView[];
  payments: PaymentTransactionView[];
  routeUnis: RouteUniversityView[];
  subsidies: SubsidyPolicyView[];
  uniAdmins: UniversityAdminView[];
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
          <RefreshCw className="size-4" /> Thử lại
        </ExpressiveButton>
      )}
    </div>
  );
}

// =============================================================================
// Screen 1: Dashboard
// =============================================================================
function DashboardScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const statsRaw = ctx.raw.statsRaw?.raw as AdminStatsView | null;
  const statValue = (label: string) => {
    const value = ctx.stats.find((item) => item.label?.toLowerCase().includes(label))?.value;
    return typeof value === "number" ? value : Number(value) || 0;
  };
  const totalUsers = statValue("người dùng");
  const totalUniversities = statValue("trường đối tác");
  const pendingVerifications = statValue("chờ xác thực");

  const revenueData = statsRaw?.revenueSeries || [];
  const tripsData = (statsRaw?.tripsSeries || []).map((point, index) => ({
    ...point,
    color: ["#144fcc", "#0f9d76", "#eaa21a", "#d84c7f"][index % 4],
  }));

  const roleDist = useMemo(() => {
    const palette: Record<string, string> = {
      STUDENT: "#beff50",
      DRIVER: "#ff8c5f",
      CONDUCTOR: "#144fcc",
      DISPATCHER: "#c8a0ff",
      ADMIN: "#dc2626",
      UNIVERSITY_ADMIN: "#f59e0b",
      OTHER: "#94a3b8",
    };
    const labels: Record<string, string> = {
      STUDENT: "Sinh viên",
      DRIVER: "Tài xế",
      CONDUCTOR: "Phụ xe",
      DISPATCHER: "Điều phối",
      ADMIN: "Quản trị",
      UNIVERSITY_ADMIN: "Admin trường",
      OTHER: "Khác",
    };
    return (statsRaw?.roleDistribution || []).map((item) => ({
      name: labels[item.role] || item.role,
      value: item.value,
      color: palette[item.role] || "#94a3b8",
    }));
  }, [statsRaw]);

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const tripsToday = statsRaw?.tripsSeries.at(-1)?.trips || 0;

  // Activities (derive from recent audit logs)
  const activities = useMemo(() => {
    return ctx.audits.slice(0, 8).map((a) => {
      const action = (a.action || "").toLowerCase();
      let icon = Info, tint = "bg-surface-container-high text-on-surface-variant";
      if (action.includes("create") || action.includes("register")) {
        icon = UserPlus; tint = "bg-primary-container text-on-primary-container";
      } else if (action.includes("lock") || action.includes("reject")) {
        icon = Lock; tint = "bg-error-container text-error-container";
      } else if (action.includes("payment") || action.includes("invoice")) {
        icon = Wallet; tint = "bg-secondary-container text-on-secondary-container";
      } else if (action.includes("verify") || action.includes("approve")) {
        icon = BadgeCheck; tint = "bg-tertiary-container text-on-tertiary-container";
      } else if (action.includes("alert") || action.includes("incident")) {
        icon = AlertTriangle; tint = "bg-warning-container text-on-surface";
      }
      return {
        id: a.auditLogId,
        icon,
        tint,
        title: a.action?.replace(/_/g, " ") || "Thao tác",
        desc: `${a.performerName || "Hệ thống"} · ${a.affectedTable || ""}`.trim(),
        time: a.performedAt ? formatDateTime(a.performedAt) : "",
      };
    });
  }, [ctx.audits]);

  // Warnings panel
  const warnings = [
    { id: 1, label: "Khiếu nại chờ xử lý", count: ctx.complaints.filter((c: any) => c.status === "new" || c.status === "processing").length, severity: "high" as const, hint: "Cần xử lý trong 24h" },
    { id: 2, label: "Vi phạm đang mở", count: ctx.violations.filter((v: any) => v.status !== "RESOLVED").length, severity: "high" as const, hint: `${ctx.violations.length} báo cáo` },
    { id: 3, label: "Xác thực chờ duyệt", count: pendingVerifications, severity: "low" as const, hint: "Sinh viên chờ xác thực" },
  ];
  const warnTone: Record<string, "error" | "warning" | "neutral"> = {
    high: "error",
    medium: "warning",
    low: "neutral",
  };

  return (
    <PageTransition className="space-y-6 sm:space-y-8 min-w-0">
      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="space-y-3 min-w-0"
      >
        <SplitText
          as="h1"
          text="Thống kê hệ thống"
          className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface text-balance leading-[1.05]"
          stagger={0.06}
        />
        <ScrollReveal>
          <p className="text-base text-on-surface-variant text-pretty">
            Tổng quan hoạt động UniBus theo thời gian thực — {totalUniversities} trường đối tác, {ctx.routeMetrics.length} tuyến xe, {totalUsers.toLocaleString("vi-VN")} người dùng đang hoạt động.
          </p>
        </ScrollReveal>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#dc2626] text-white text-xs font-bold shrink-0">
            <ShieldAlert className="size-3.5" />
            Quản trị viên
          </span>
          <ExpressiveButton variant="outlined" size="sm">
            <CalendarClock className="size-4" /> Tháng {new Date().getMonth() + 1}, {new Date().getFullYear()}
          </ExpressiveButton>
          <ExpressiveButton variant="text" size="sm" onClick={() => toast.info("Xuất báo cáo đang được phát triển")}>
            <BarChart3 className="size-4" /> Xuất báo cáo
          </ExpressiveButton>
        </div>
      </motion.div>

      {/* StatCards — 1 hàng 4 card (giống prototype, bỏ quickActions row riêng) */}
      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
        <StaggerItem>
          <StatCard
            label="Tổng người dùng"
            value={<Counter to={totalUsers} />}
            icon={<Users className="size-6" />}
            hint={`${pendingVerifications} chờ xác thực`}
            trend="up"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Chuyến hôm nay"
            value={<Counter to={tripsToday} />}
            icon={<Bus className="size-6" />}
            hint={`${ctx.routeMetrics.length} tuyến hoạt động`}
            trend="up"
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Doanh thu 7 ngày"
            value={
              <Counter
                to={totalRevenue}
                format={(n) => formatVND(Math.round(n))}
              />
            }
            icon={<Wallet className="size-6" />}
            hint="Dữ liệu thanh toán thực"
            trend="up"
            accent="success"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Trường đối tác"
            value={<Counter to={totalUniversities} />}
            icon={<School className="size-6" />}
            hint={`${statValue("sinh viên").toLocaleString("vi-VN")} sinh viên`}
            trend="up"
            accent="secondary"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Charts row 1: Revenue (Area) + Role dist (Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <ScrollReveal className="lg:col-span-2 min-w-0">
          <ExpressiveCard variant="filled" className="p-6 min-w-0">
            <div className="flex items-end justify-between mb-4 min-w-0">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-on-surface">Doanh thu 7 ngày qua</h2>
                <p className="text-sm text-on-surface-variant">Tổng {formatVND(totalRevenue)}</p>
              </div>
              <M3StatusPill label="Tuần này" tone="primary" />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData} margin={{ left: -16, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#144fcc" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#144fcc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.5} vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}tr`} />
                <RTooltip
                  contentStyle={{ background: "#14140f", border: "1px solid #14140f", borderRadius: 16, color: "#beff50" }}
                  formatter={(v: any) => [formatVND(v), "Doanh thu"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#144fcc" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="min-w-0">
          <ExpressiveCard variant="filled" className="p-6 h-full min-w-0">
            <h2 className="text-lg font-semibold text-on-surface mb-1">Phân bố vai trò</h2>
            <p className="text-sm text-on-surface-variant mb-2">Tổng {totalUsers.toLocaleString("vi-VN")} tài khoản</p>
            {roleDist.length === 0 ? (
              <EmptyState icon={<Users className="size-7" />} title="Chưa có dữ liệu" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={roleDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {roleDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{ background: "#14140f", border: "1px solid #14140f", borderRadius: 16, color: "#beff50" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-1 gap-1.5">
                  {roleDist.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="size-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                        <span className="text-on-surface-variant truncate">{r.name}</span>
                      </div>
                      <span className="font-medium text-on-surface tabular-nums shrink-0">{r.value.toLocaleString("vi-VN")}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ExpressiveCard>
        </ScrollReveal>
      </div>

      {/* Charts row 2: Trips BarChart + Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <ScrollReveal className="lg:col-span-2 min-w-0">
          <ExpressiveCard variant="filled" className="p-6 min-w-0">
            <div className="flex items-end justify-between mb-4 min-w-0">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-on-surface">Số chuyến 7 ngày qua</h2>
                <p className="text-sm text-on-surface-variant">Dữ liệu vận hành thực</p>
              </div>
              <M3StatusPill label="7 ngày" tone="tertiary" />
            </div>
            {tripsData.length === 0 ? (
              <EmptyState icon={<BarChart3 className="size-7" />} title="Chưa có dữ liệu" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={tripsData} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.5} vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                  <RTooltip
                    contentStyle={{ background: "#14140f", border: "1px solid #14140f", borderRadius: 16, color: "#beff50" }}
                    formatter={(v: any) => [`${v} chuyến`, "Số chuyến"]}
                  />
                  <Bar dataKey="trips" radius={[8, 8, 0, 0]} maxBarSize={64}>
                    {tripsData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="min-w-0">
          <ExpressiveCard variant="filled" className="p-6 h-full min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="size-5 text-warning" />
              <h2 className="text-lg font-semibold text-on-surface">Cảnh báo hệ thống</h2>
            </div>
            <div className="space-y-3">
              {warnings.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-3 border border-outline-variant/40 gap-2 min-w-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{w.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">{w.hint}</p>
                  </div>
                  <M3StatusPill label={String(w.count)} tone={warnTone[w.severity]} />
                </div>
              ))}
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>

      {/* Activity feed */}
      <ScrollReveal>
        <ExpressiveCard variant="filled" className="p-6 min-w-0">
          <div className="flex items-center justify-between mb-4 min-w-0">
            <h2 className="text-lg font-semibold text-on-surface">Hoạt động gần đây</h2>
            <ExpressiveButton variant="text" size="sm" onClick={() => onNavigate("adm-audit")}>
              Xem tất cả <ChevronRight className="size-4" />
            </ExpressiveButton>
          </div>
          {activities.length === 0 ? (
            <EmptyState icon={<Info className="size-7" />} title="Chưa có hoạt động" />
          ) : (
            <div className="max-h-96 overflow-y-auto scrollbar-soft pr-1 min-w-0">
              <StaggerGroup className="space-y-2 min-w-0">
                {activities.map((a) => (
                  <StaggerItem key={a.id}>
                    <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-surface-container-lowest transition-colors min-w-0">
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", a.tint)}>
                        <a.icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{a.title}</p>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">{a.desc}</p>
                      </div>
                      <span className="text-xs text-on-surface-variant shrink-0">{a.time}</span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          )}
        </ExpressiveCard>
      </ScrollReveal>
    </PageTransition>
  );
}

// =============================================================================
// Screen 2: Universities
// =============================================================================
function UniversitiesScreen({ ctx }: { ctx: Ctx }) {
  const [adding, setAdding] = useState(false);
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Trường đại học"
        description={`${ctx.universities.length} trường trong hệ thống`}
        icon={<School className="size-7" />}
        actions={<ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm trường</ExpressiveButton>}
      />
      {ctx.universities.length === 0 ? (
        <EmptyState icon={<School className="size-7" />} title="Chưa có trường" />
      ) : (
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
          {ctx.universities.map((u) => (
            <StaggerItem key={u.universityId}>
              <ExpressiveCard variant="elevated" className="p-5 h-full min-w-0">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="size-14 shrink-0 rounded-2xl bg-[#beff50] text-[#14140f] flex items-center justify-center text-xl font-black">
                    {(u.shortName || u.name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{u.name}</p>
                    {u.shortName && <p className="text-xs text-on-surface-variant">{u.shortName}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="text-[10px]">{u.code}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{u.campusCount} cơ sở</Badge>
                      <Badge variant="secondary" className="text-[10px]">{u.rosterCount} SV</Badge>
                    </div>
                  </div>
                </div>
                {u.contactEmail && <p className="text-xs text-on-surface-variant mt-3 truncate">{u.contactEmail}</p>}
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
      <Dialog open={adding} onOpenChange={setAdding}>
        <UniversityAddDialog onClose={() => setAdding(false)} onAdded={() => { setAdding(false); ctx.reload(); }} />
      </Dialog>
    </PageTransition>
  );
}

function UniversityAddDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error("Vui lòng nhập mã và tên trường");
      return;
    }
    setSaving(true);
    try {
      await adminApi.createUniversity({
        code: code.trim(),
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        contactEmail: email.trim() || undefined,
      });
      toast.success("Đã thêm trường");
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể thêm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Thêm trường đại học</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold">Mã trường</Label>
            <Input className="mt-1.5" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: DTU" />
          </div>
          <div>
            <Label className="text-xs font-bold">Tên ngắn</Label>
            <Input className="mt-1.5" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="VD: Duy Tân" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-bold">Tên đầy đủ</Label>
          <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Trường ĐH Duy Tân" />
        </div>
        <div>
          <Label className="text-xs font-bold">Email liên hệ</Label>
          <Input className="mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <ExpressiveButton variant="text" onClick={onClose} disabled={saving}>Hủy</ExpressiveButton>
        <ExpressiveButton variant="filled" onClick={save} disabled={saving}>
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Thêm
        </ExpressiveButton>
      </DialogFooter>
    </DialogContent>
  );
}

// =============================================================================
// Screen 3: University Admins
// =============================================================================
function UniAdminsScreen({ ctx }: { ctx: Ctx }) {
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Admin trường ĐH"
        description={`${ctx.uniAdmins.length} quản trị viên trường`}
        icon={<UserCog className="size-7" />}
      />
      {ctx.uniAdmins.length === 0 ? (
        <EmptyState icon={<UserCog className="size-7" />} title="Chưa có admin trường" />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {ctx.uniAdmins.map((u) => (
            <StaggerItem key={u.universityAdminId}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-12 shrink-0 rounded-2xl bg-[#144fcc] text-[#beff50] flex items-center justify-center font-black">
                    {(u.fullName || "").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{u.fullName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                    <p className="text-xs text-on-surface-variant truncate">{u.universityName}</p>
                  </div>
                  <M3StatusPill label={u.status} tone={u.status === "ACTIVE" ? "success" : "neutral"} />
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
// Screen 4: Route-University linking
// =============================================================================
function RouteUniScreen({ ctx }: { ctx: Ctx }) {
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Tuyến ↔ Trường"
        description={`${ctx.routeUnis.length} liên kết tuyến-trường`}
        icon={<RouteIcon className="size-7" />}
      />
      {ctx.routeUnis.length === 0 ? (
        <EmptyState icon={<RouteIcon className="size-7" />} title="Chưa có liên kết" />
      ) : (
        <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tuyến</TableHead>
                <TableHead>Trường</TableHead>
                <TableHead>Cơ sở</TableHead>
                <TableHead>Hiệu lực</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ctx.routeUnis.map((ru) => (
                <TableRow key={ru.routeUniversityId}>
                  <TableCell className="font-bold truncate">{ru.routeName}</TableCell>
                  <TableCell className="truncate">{ru.universityName}</TableCell>
                  <TableCell className="truncate">{ru.campusName || "—"}</TableCell>
                  <TableCell className="text-xs">{formatDate(ru.activeFrom)} → {formatDate(ru.activeUntil)}</TableCell>
                  <TableCell><M3StatusPill label={ru.status} tone={ru.status === "ACTIVE" ? "success" : "neutral"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ExpressiveCard>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 5: Audit logs
// =============================================================================
function AuditScreen({ ctx }: { ctx: Ctx }) {
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Nhật ký hệ thống"
        description={`${ctx.audits.length} bản ghi`}
        icon={<ScrollText className="size-7" />}
      />
      {ctx.audits.length === 0 ? (
        <EmptyState icon={<ScrollText className="size-7" />} title="Chưa có log" />
      ) : (
        <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Người thực hiện</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Kết quả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ctx.audits.slice(0, 100).map((a) => (
                <TableRow key={a.auditLogId}>
                  <TableCell className="text-xs whitespace-nowrap">{formatDateTime(a.performedAt)}</TableCell>
                  <TableCell className="truncate">{a.performerName || "—"}</TableCell>
                  <TableCell className="font-mono text-xs truncate">{a.action}</TableCell>
                  <TableCell>
                    <M3StatusPill label={a.result || "SUCCESS"} tone={a.result === "FAILURE" ? "error" : "success"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ExpressiveCard>
      )}
    </PageTransition>
  );
}


// =============================================================================
// Screen 6: Users
// =============================================================================
function UsersScreen({ ctx }: { ctx: Ctx }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [lockTarget, setLockTarget] = useState<AdminUserView | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [working, setWorking] = useState(false);
  const [adding, setAdding] = useState(false);

  const filtered = ctx.users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search && !`${u.fullName} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleLock = async (u: AdminUserView) => {
    setWorking(true);
    try {
      const newStatus = u.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
      await adminApi.updateUserStatus(u.userId, { status: newStatus as any, lockReason: newStatus === "LOCKED" ? lockReason : undefined });
      toast.success(newStatus === "LOCKED" ? "Đã khóa tài khoản" : "Đã mở khóa");
      setLockTarget(null);
      setLockReason("");
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể cập nhật");
    } finally {
      setWorking(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Người dùng"
        description={`${ctx.users.length} người dùng`}
        icon={<Users className="size-7" />}
        actions={<ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm nhân viên</ExpressiveButton>}
      />
      <div className="flex flex-wrap gap-2 min-w-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <Input className="pl-9" placeholder="Tìm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="STUDENT">Sinh viên</SelectItem>
            <SelectItem value="DRIVER">Tài xế</SelectItem>
            <SelectItem value="CONDUCTOR">Phụ xe</SelectItem>
            <SelectItem value="DISPATCHER">Điều phối</SelectItem>
            <SelectItem value="ADMIN">Quản trị</SelectItem>
            <SelectItem value="UNIVERSITY_ADMIN">Admin trường</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="size-7" />} title="Không có người dùng" />
      ) : (
        <StaggerGroup className="space-y-2 min-w-0">
          {filtered.slice(0, 100).map((u) => (
            <StaggerItem key={u.userId}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 shrink-0 rounded-xl bg-surface-container-high flex items-center justify-center font-bold text-sm">
                    {(u.fullName || "").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{u.fullName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                  <M3StatusPill label={u.status} tone={u.status === "ACTIVE" ? "success" : "error"} />
                  <ExpressiveButton
                    variant="text"
                    size="icon-sm"
                    onClick={() => setLockTarget(u)}
                  >
                    {u.status === "ACTIVE" ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                  </ExpressiveButton>
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      <AlertDialog open={!!lockTarget} onOpenChange={(o) => !o && setLockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lockTarget?.status === "ACTIVE" ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {lockTarget?.status === "ACTIVE"
                ? `Người dùng ${lockTarget?.fullName} sẽ không thể đăng nhập.`
                : `Người dùng ${lockTarget?.fullName} sẽ có thể đăng nhập lại.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {lockTarget?.status === "ACTIVE" && (
            <div>
              <Label className="text-xs">Lý do khóa</Label>
              <Textarea className="mt-1.5" value={lockReason} onChange={(e) => setLockReason(e.target.value)} rows={2} />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => lockTarget && toggleLock(lockTarget)} disabled={working}>
              {working ? <RefreshCw className="size-4 animate-spin" /> : null}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={adding} onOpenChange={setAdding}>
        <CreateStaffDialog onClose={() => setAdding(false)} onCreated={() => { setAdding(false); ctx.reload(); }} />
      </Dialog>
    </PageTransition>
  );
}

function CreateStaffDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"DRIVER" | "CONDUCTOR" | "DISPATCHER" | "ADMIN">("DRIVER");
  const [phone, setPhone] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Vui lòng nhập đầy đủ họ tên, email, mật khẩu");
      return;
    }
    if (role === "DRIVER" && !licenseNumber.trim()) {
      toast.error("Tài xế cần số giấy phép lái xe");
      return;
    }
    if ((role === "CONDUCTOR" || role === "DISPATCHER") && !employeeCode.trim()) {
      toast.error("Phụ xe/điều phối cần mã nhân viên");
      return;
    }
    setSaving(true);
    try {
      await adminApi.createStaff({
        fullName: name.trim(),
        email: email.trim(),
        password,
        role,
        employeeCode: employeeCode.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        phoneNumber: phone.trim() || undefined,
      });
      toast.success("Đã tạo tài khoản nhân viên");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể tạo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Tạo tài khoản nhân viên</DialogTitle>
        <DialogDescription>Tài khoản cho tài xế, phụ xe, điều phối, hoặc quản trị.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div>
          <Label className="text-xs font-bold">Họ tên</Label>
          <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-bold">Email</Label>
          <Input className="mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-bold">Mật khẩu tạm</Label>
          <Input className="mt-1.5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold">Vai trò</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRIVER">Tài xế</SelectItem>
                <SelectItem value="CONDUCTOR">Phụ xe</SelectItem>
                <SelectItem value="DISPATCHER">Điều phối</SelectItem>
                <SelectItem value="ADMIN">Quản trị</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold">Điện thoại</Label>
            <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        {role === "DRIVER" ? (
          <div>
            <Label className="text-xs font-bold">Số giấy phép lái xe</Label>
            <Input className="mt-1.5" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="Ví dụ: GPLX-DEMO-001" />
          </div>
        ) : role === "CONDUCTOR" || role === "DISPATCHER" ? (
          <div>
            <Label className="text-xs font-bold">Mã nhân viên</Label>
            <Input className="mt-1.5" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="Ví dụ: NV-DEMO-001" />
          </div>
        ) : null}
      </div>
      <DialogFooter>
        <ExpressiveButton variant="text" onClick={onClose} disabled={saving}>Hủy</ExpressiveButton>
        <ExpressiveButton variant="filled" onClick={save} disabled={saving}>
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Tạo
        </ExpressiveButton>
      </DialogFooter>
    </DialogContent>
  );
}

// =============================================================================
// Screen 7: Student verifications
// =============================================================================
type VerificationReviewAction = "approve" | "reject" | "resubmit";

function adminVerificationMeta(status?: string) {
  const meta: Record<string, { label: string; tone: "neutral" | "primary" | "tertiary" | "success" | "warning" | "error" }> = {
    NOT_SUBMITTED: { label: "Chưa gửi", tone: "neutral" },
    PENDING_REVIEW: { label: "Chờ duyệt", tone: "warning" },
    VERIFIED: { label: "Đã duyệt", tone: "success" },
    REJECTED: { label: "Từ chối", tone: "error" },
    RESUBMISSION_REQUIRED: { label: "Cần gửi lại", tone: "warning" },
  };
  return meta[status || ""] || { label: status || "Không rõ", tone: "neutral" as const };
}

function normalizeCompare(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasOcrMismatch(expected?: string | null, actual?: string | null) {
  const a = normalizeCompare(expected);
  const b = normalizeCompare(actual);
  if (!a || !b) return false;
  return !a.includes(b) && !b.includes(a);
}

function formatAdminConfidence(score?: number) {
  if (score == null || Number.isNaN(score)) return "Chưa có";
  const percent = score <= 1 ? score * 100 : score;
  return `${Math.round(percent)}%`;
}

function ReviewField({
  label,
  submitted,
  ocr,
}: {
  label: string;
  submitted?: string | null;
  ocr?: string | null;
}) {
  const mismatch = hasOcrMismatch(submitted, ocr);
  return (
    <div className="rounded-2xl bg-surface-container-low p-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
        {mismatch && <Badge variant="destructive" className="text-[10px]">Lệch OCR</Badge>}
      </div>
      <p className="mt-1 truncate text-sm font-bold text-on-surface">{submitted || "—"}</p>
      <p className={cn("mt-1 truncate text-xs", mismatch ? "text-error" : "text-on-surface-variant")}>
        OCR: {ocr || "—"}
      </p>
    </div>
  );
}

function VerificationsScreen({ ctx }: { ctx: Ctx }) {
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [review, setReview] = useState<{ item: VerificationView; action: VerificationReviewAction } | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const resource = useAdminVerifications(statusFilter === "all" ? undefined : statusFilter);
  const items = resource.raw || [];

  const openReview = (item: VerificationView, action: VerificationReviewAction) => {
    setReason("");
    setReview({ item, action });
  };

  const runReview = async () => {
    if (!review?.item.verificationId) return;
    if ((review.action === "reject" || review.action === "resubmit") && !reason.trim()) {
      toast.error("Vui lòng nhập lý do để sinh viên biết cần sửa gì");
      return;
    }

    setWorking(true);
    try {
      if (review.action === "approve") {
        await adminApi.approveVerification(review.item.verificationId);
        toast.success("Đã duyệt xác minh sinh viên");
      } else if (review.action === "reject") {
        await adminApi.rejectVerification(review.item.verificationId, reason.trim());
        toast.success("Đã từ chối hồ sơ");
      } else {
        await adminApi.requestResubmission(review.item.verificationId, reason.trim());
        toast.success("Đã yêu cầu sinh viên gửi lại");
      }
      setReview(null);
      setReason("");
      resource.reload();
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể cập nhật hồ sơ");
    } finally {
      setWorking(false);
    }
  };

  const actionCopy = review?.action === "approve"
    ? { title: "Duyệt hồ sơ?", description: "Sinh viên sẽ được liên kết với trường và trạng thái chuyển sang đã xác minh.", cta: "Duyệt" }
    : review?.action === "reject"
      ? { title: "Từ chối hồ sơ?", description: "Sinh viên sẽ thấy lý do từ chối và có thể gửi lại hồ sơ mới.", cta: "Từ chối" }
      : { title: "Yêu cầu gửi lại?", description: "Sinh viên sẽ phải bổ sung ảnh hoặc thông tin theo lý do bạn nhập.", cta: "Yêu cầu gửi lại" };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Xác minh sinh viên"
        description={`${items.length} hồ sơ theo bộ lọc hiện tại`}
        icon={<BadgeCheck className="size-7" />}
        actions={
          <ExpressiveButton variant="tonal" onClick={resource.reload} disabled={resource.loading}>
            <RefreshCw className={cn("size-4", resource.loading && "animate-spin")} />
            Làm mới
          </ExpressiveButton>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING_REVIEW">Chờ duyệt</SelectItem>
            <SelectItem value="RESUBMISSION_REQUIRED">Cần gửi lại</SelectItem>
            <SelectItem value="REJECTED">Từ chối</SelectItem>
            <SelectItem value="VERIFIED">Đã duyệt</SelectItem>
            <SelectItem value="all">Tất cả</SelectItem>
          </SelectContent>
        </Select>
        {resource.loading && <span className="text-sm text-on-surface-variant">Đang tải...</span>}
        {resource.error && <span className="text-sm text-error">{resource.error}</span>}
      </div>

      {items.length === 0 && !resource.loading ? (
        <EmptyState
          icon={<BadgeCheck className="size-7" />}
          title="Không có hồ sơ"
          description="Bộ lọc hiện tại chưa có sinh viên cần xử lý."
        />
      ) : (
        <StaggerGroup className="space-y-4 min-w-0">
          {items.map((item) => {
            const meta = adminVerificationMeta(item.status);
            const pending = item.status === "PENDING_REVIEW";
            return (
              <StaggerItem key={item.verificationId || `${item.userId}-${item.submittedAt}`}>
                <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                  <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                    <ProtectedImage
                      src={item.cardImageUrl}
                      alt={`Ảnh thẻ sinh viên của ${item.fullName}`}
                      className="aspect-[4/3] w-full rounded-2xl border border-outline-variant/60"
                    />
                    <div className="space-y-4 min-w-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-on-surface">{item.fullName}</h3>
                            <M3StatusPill label={meta.label} tone={meta.tone} />
                          </div>
                          <p className="mt-1 truncate text-sm text-on-surface-variant">{item.email}</p>
                          <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                            Gửi lúc: {formatDateTime(item.submittedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-3">
                        <ReviewField label="Họ tên" submitted={item.fullName} ocr={item.ocrFullName} />
                        <ReviewField label="MSSV" submitted={item.studentCode} ocr={item.ocrStudentCode} />
                        <ReviewField label="Trường" submitted={item.university} ocr={item.ocrUniversity} />
                      </div>

                      {(item.ocrRawText || item.ocrConfidenceScore != null) && (
                        <details className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3">
                          <summary className="cursor-pointer text-xs font-bold text-on-surface">Xem chi tiết OCR</summary>
                          <div className="mt-2 space-y-2 text-xs text-on-surface-variant">
                            {item.ocrConfidenceScore != null && (
                              <p>Độ tin cậy OCR: <span className="font-bold text-on-surface">{formatAdminConfidence(item.ocrConfidenceScore)}</span></p>
                            )}
                            {item.ocrRawText && (
                              <p className="max-h-32 overflow-y-auto whitespace-pre-wrap scrollbar-soft">
                                {item.ocrRawText}
                              </p>
                            )}
                          </div>
                        </details>
                      )}

                      {item.rejectionReason && (
                        <div className="rounded-2xl border border-error/25 bg-error-container/40 p-3 text-sm">
                          <p className="font-bold text-error">Lý do hiện tại</p>
                          <p className="mt-1 text-on-surface-variant">{item.rejectionReason}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <ExpressiveButton
                          variant="filled"
                          disabled={!pending}
                          onClick={() => openReview(item, "approve")}
                        >
                          <CheckCircle2 className="size-4" /> Duyệt
                        </ExpressiveButton>
                        <ExpressiveButton
                          variant="tonal"
                          disabled={!pending}
                          onClick={() => openReview(item, "resubmit")}
                        >
                          <RefreshCw className="size-4" /> Yêu cầu gửi lại
                        </ExpressiveButton>
                        <ExpressiveButton
                          variant="text"
                          disabled={!pending}
                          onClick={() => openReview(item, "reject")}
                        >
                          <XCircle className="size-4" /> Từ chối
                        </ExpressiveButton>
                      </div>
                    </div>
                  </div>
                </ExpressiveCard>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}

      <Dialog open={!!review} onOpenChange={(open) => !open && !working && setReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionCopy.title}</DialogTitle>
            <DialogDescription>{actionCopy.description}</DialogDescription>
          </DialogHeader>
          {review?.action !== "approve" && (
            <div className="space-y-2 py-2">
              <Label htmlFor="verification-review-reason">Lý do gửi cho sinh viên</Label>
              <Textarea
                id="verification-review-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Ảnh bị mờ, MSSV trên thẻ không khớp thông tin đã nhập..."
              />
            </div>
          )}
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setReview(null)} disabled={working}>Hủy</ExpressiveButton>
            <ExpressiveButton
              variant={review?.action === "reject" ? "text" : "filled"}
              onClick={runReview}
              disabled={working}
            >
              {working ? <RefreshCw className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
              {actionCopy.cta}
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

function TransactionsScreen() {
  const payments = useAdminPayments();
  const rows = payments.raw || [];
  const paidRows = rows.filter((row) => isPaidStatus(row.paymentStatus));
  const totalPaid = paidRows.reduce((sum, row) => sum + paymentFinalAmount(row), 0);
  const pendingRows = rows.filter((row) => !isPaidStatus(row.paymentStatus)).length;

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lịch sử giao dịch"
        description={`${rows.length} giao dịch SePay/vé tháng`}
        icon={<Receipt className="size-7" />}
        actions={
          <ExpressiveButton variant="tonal" onClick={payments.reload} disabled={payments.loading}>
            <RefreshCw className={cn("size-4", payments.loading && "animate-spin")} />
            Làm mới
          </ExpressiveButton>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Đã thanh toán" value={paidRows.length} icon={<CheckCircle2 className="size-5" />} accent="success" />
        <StatCard label="Tổng tiền" value={formatVND(totalPaid)} icon={<Banknote className="size-5" />} accent="primary" />
        <StatCard label="Chưa tất toán" value={pendingRows} icon={<Clock className="size-5" />} accent="warning" />
      </div>

      {payments.error && (
        <ExpressiveCard variant="filled" className="p-4 text-sm text-error">{payments.error}</ExpressiveCard>
      )}

      {rows.length === 0 && !payments.loading ? (
        <EmptyState icon={<Receipt className="size-7" />} title="Chưa có giao dịch" />
      ) : (
        <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sinh viên</TableHead>
                <TableHead>Trường</TableHead>
                <TableHead>Loại/Chặng</TableHead>
                <TableHead className="text-right">Gốc / Trả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 100).map((p) => (
                <TableRow key={`${p.orderId}-${p.transactionId || p.sepayTransactionId || "order"}`}>
                  <TableCell className="truncate">
                    <p className="font-semibold">{p.studentName || p.studentCode || "—"}</p>
                    {p.referenceNumber && <p className="text-[11px] text-on-surface-variant">{p.referenceNumber}</p>}
                  </TableCell>
                  <TableCell className="truncate text-xs">{p.universityName || "—"}</TableCell>
                  <TableCell className="truncate text-xs">{paymentModeLabel(p)}<div className="text-[10px] text-on-surface-variant truncate">{paymentJourneyLabel(p)}</div></TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    <div>{formatVND(paymentOriginalAmount(p))}</div>
                    <div className="text-[10px] text-on-surface-variant">→ {formatVND(paymentFinalAmount(p))}</div>
                  </TableCell>
                  <TableCell>
                    <M3StatusPill label={p.paymentStatus || "—"} tone={isPaidStatus(p.paymentStatus) ? "success" : "warning"} />
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{formatDateTime(p.paidAt || p.transactionDate || p.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ExpressiveCard>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 7: Complaints
// =============================================================================
function ComplaintsScreen({ ctx }: { ctx: Ctx }) {
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Khiếu nại"
        description={`${ctx.complaints.length} khiếu nại`}
        icon={<ShieldAlert className="size-7" />}
      />
      {ctx.complaints.length === 0 ? (
        <EmptyState icon={<ShieldAlert className="size-7" />} title="Không có khiếu nại" />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {ctx.complaints.map((c: any) => (
            <StaggerItem key={c.id}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                  <p className="font-bold truncate">{c.subject}</p>
                  <M3StatusPill label={c.status} tone={c.status === "resolved" ? "success" : c.status === "rejected" ? "error" : "warning"} />
                </div>
                <p className="text-xs text-on-surface-variant mb-2">{formatDate(c.createdAt)}</p>
                <p className="text-sm line-clamp-3">{c.description}</p>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 8: Violations
// =============================================================================
function ViolationsScreen({ ctx }: { ctx: Ctx }) {
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Vi phạm"
        description={`${ctx.violations.length} báo cáo vi phạm`}
        icon={<AlertOctagon className="size-7" />}
      />
      {ctx.violations.length === 0 ? (
        <EmptyState icon={<AlertOctagon className="size-7" />} title="Không có vi phạm" />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {ctx.violations.map((v: any, i: number) => (
            <StaggerItem key={i}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                  <p className="font-bold truncate">{v.reporterName || "—"}</p>
                  <M3StatusPill label={v.status} tone={v.status === "RESOLVED" ? "success" : "warning"} />
                </div>
                <p className="text-xs text-on-surface-variant mb-2">{formatDate(v.submittedAt)}</p>
                <p className="text-sm line-clamp-3">{v.content}</p>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </PageTransition>
  );
}

// =============================================================================
// Screen 9: Fares
// =============================================================================
function FareScreen({ ctx }: { ctx: Ctx }) {
  const [editing, setEditing] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await experienceApi.updateFare(editing.fareId, {
        amount: Number(amount) || 0,
        notes: notes.trim() || undefined,
      });
      toast.success("Đã cập nhật giá vé");
      setEditing(null);
      setAmount("");
      setNotes("");
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể lưu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Giá vé"
        description={`${ctx.fares.length} bảng giá`}
        icon={<Tag className="size-7" />}
      />
      {ctx.fares.length === 0 ? (
        <EmptyState icon={<Tag className="size-7" />} title="Chưa có giá vé" />
      ) : (
        <StaggerGroup className="space-y-2 min-w-0">
          {ctx.fares.map((f) => (
            <StaggerItem key={f.fareId}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{f.routeName}</p>
                    <p className="text-xs text-on-surface-variant">{f.fareType}</p>
                    {f.notes && <p className="text-xs mt-1 line-clamp-1">{f.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-primary text-lg">{formatVND(f.amount)}</p>
                    <ExpressiveButton variant="text" size="sm" onClick={() => { setEditing(f); setAmount(String(f.amount)); setNotes(f.notes || ""); }}>
                      <Edit className="size-3" /> Sửa
                    </ExpressiveButton>
                  </div>
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa giá vé</DialogTitle>
            <DialogDescription>{editing?.routeName} • {editing?.fareType}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold">Số tiền (VND)</Label>
              <Input className="mt-1.5" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-bold">Ghi chú</Label>
              <Textarea className="mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setEditing(null)} disabled={saving}>Hủy</ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={save} disabled={saving}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              Lưu
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// =============================================================================
// Screen 10: Notify
// =============================================================================
function NotifyScreen({ ctx }: { ctx: Ctx }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    setSending(true);
    try {
      await notificationApi.create({ title: title.trim(), content: content.trim() });
      toast.success("Đã gửi thông báo");
      setTitle("");
      setContent("");
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể gửi");
    } finally {
      setSending(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Gửi thông báo"
        description="Gửi thông báo toàn hệ thống."
        icon={<Megaphone className="size-7" />}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-5 min-w-0">
            <h3 className="text-base font-bold mb-4">Soạn thông báo</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold">Tiêu đề</Label>
                <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-bold">Nội dung</Label>
                <Textarea className="mt-1.5" value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
              </div>
              <ExpressiveButton variant="filled" className="w-full" onClick={send} disabled={sending}>
                {sending ? <RefreshCw className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
                Gửi
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <Section title={`Gần đây (${ctx.notifications.length})`}>
            {ctx.notifications.length === 0 ? (
              <EmptyState icon={<Megaphone className="size-7" />} title="Chưa có thông báo" />
            ) : (
              <div className="space-y-2">
                {ctx.notifications.slice(0, 6).map((n: any) => (
                  <ExpressiveCard key={n.id} variant="filled" className="p-3 min-w-0">
                    <p className="font-bold text-sm truncate">{n.title}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">{formatDateTime(n.createdAt)}</p>
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
function FallbackScreen({ activeId }: { activeId: string }) {
  return (
    <EmptyState
      icon={<Info className="size-7" />}
      title="Màn chưa hỗ trợ"
      description={`Mãn "${activeId}" chưa được triển khai.`}
    />
  );
}

