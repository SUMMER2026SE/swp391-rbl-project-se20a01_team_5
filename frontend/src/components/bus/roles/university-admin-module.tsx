"use client";

// =============================================================================
// University Admin Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// 9 role-specific screens:
//   uniadm-dashboard, uniadm-info, uniadm-domains, uniadm-import, uniadm-roster,
//   uniadm-subsidy, uniadm-stats, uniadm-notify, uniadm-recon
// Visual: keeps prototype v1.1 (hero perk card, university info card,
// import batch progress, roster table, subsidy policy cards, reconciliation summary).
// Data: real service data via /university-admin/* endpoints.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  School,
  Globe,
  FileSpreadsheet,
  Users,
  Percent,
  FileBarChart,
  Megaphone,
  ScrollText,
  Building2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Plus,
  Edit,
  Save,
  Trash2,
  Upload,
  Download,
  Filter,
  Banknote,
  BadgeCheck,
  GraduationCap,
  MapPin,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
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
  ExpressiveButton,
  ExpressiveCard,
  StatusPill as M3StatusPill,
  M3Progress,
} from "@/components/m3/primitives";
import {
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Counter,
  PageTransition,
} from "@/components/m3/motion";
import { PageHeader, StatCard, Section, EmptyState } from "../primitives";

import {
  useUniversityAdminPrototypeData,
  useUniAdminCampuses,
  useUniAdminDomains,
  useUniAdminRoster,
  useUniAdminImportBatches,
  useUniAdminReconciliation,
  formatVND,
  formatDateTime,
  formatDate,
} from "@/lib/prototype-data";
import {
  ApiError,
  universityApi,
  isPaidStatus,
  isUnpaidStatus,
  notificationApi,
  type CampusView,
  type DomainView,
  type ImportBatchView,
  type RosterStudentView,
  type SubsidyPolicyView,
  type UniversityStatsView,
  type ReconciliationView,
  type PaymentTransactionView,
  type UniversityAdminView,
  type ExperienceDashboardStat,
  type SubsidyType,
} from "@/lib/api/client";

type UniversityAdminModuleProps = {
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

const normalizedPaymentStatus = (status?: string | null) => (status || "").trim().toUpperCase();

const isSettledPaymentStatus = (status?: string | null) =>
  ["PAID", "SUCCESS", "COMPLETED"].includes(normalizedPaymentStatus(status));

const paymentStatusLabel = (status?: string | null) => {
  switch (normalizedPaymentStatus(status)) {
    case "PAID":
      return "Đã thanh toán";
    case "SUCCESS":
    case "COMPLETED":
      return "Thành công";
    case "PENDING":
    case "UNPAID":
      return "Chờ thanh toán";
    case "FAILED":
      return "Thất bại";
    case "CANCELLED":
    case "CANCELED":
      return "Đã hủy";
    case "REFUNDED":
      return "Đã hoàn tiền";
    default:
      return status || "Không rõ";
  }
};

const paymentStatusTone = (status?: string | null) => {
  switch (normalizedPaymentStatus(status)) {
    case "PAID":
    case "SUCCESS":
    case "COMPLETED":
      return "success";
    case "PENDING":
    case "UNPAID":
      return "warning";
    case "FAILED":
    case "CANCELLED":
    case "CANCELED":
    case "REFUNDED":
      return "error";
    default:
      return "neutral";
  }
};

const paymentStatusGroup = (status?: string | null) => {
  const normalized = normalizedPaymentStatus(status);
  if (["PAID", "SUCCESS", "COMPLETED"].includes(normalized)) return "paid";
  if (["PENDING", "UNPAID"].includes(normalized)) return "pending";
  if (["FAILED"].includes(normalized)) return "failed";
  if (["CANCELLED", "CANCELED", "REFUNDED"].includes(normalized)) return "cancelled";
  return "other";
};

const paymentDateValue = (payment: PaymentTransactionView) =>
  payment.paidAt || payment.transactionDate || payment.createdAt || "";

const paymentDateKey = (payment: PaymentTransactionView) => paymentDateValue(payment).slice(0, 10);

const rosterStatusLabel = (status?: string | null) => {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "Đang học";
    case "INACTIVE":
      return "Ngừng học";
    case "GRADUATED":
      return "Đã tốt nghiệp";
    case "SUSPENDED":
      return "Bị đình chỉ";
    default:
      return status || "Không rõ";
  }
};

const rosterStatusTone = (status?: string | null) =>
  (status || "").toUpperCase() === "ACTIVE"
    ? "success"
    : (status || "").toUpperCase() === "SUSPENDED"
      ? "error"
      : "neutral";

const importStatusLabel = (status?: string | null) => {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
      return "Hoàn tất";
    case "COMPLETED_WITH_ERRORS":
      return "Hoàn tất có lỗi";
    case "FAILED":
      return "Thất bại";
    default:
      return status || "Không rõ";
  }
};

const importErrorMessage = (message?: string | null) => {
  switch (message) {
    case "Email is required":
      return "Email bắt buộc hoặc không đúng định dạng";
    case "Student code is required":
      return "MSSV bắt buộc";
    case "Full name is required":
      return "Họ tên bắt buộc";
    case "Academic year must be a number":
      return "Năm học phải là số";
    case "MSSV is duplicated in this import file":
      return "MSSV bị trùng trong file import";
    case "MSSV already exists for another student in this university":
      return "MSSV đã tồn tại cho sinh viên khác trong trường";
    case "Email domain does not belong to this university":
      return "Email không thuộc domain đang hoạt động của trường";
    default:
      return message || "Dữ liệu không hợp lệ";
  }
};

const campusStatusLabel = (status?: string | null) => {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "INACTIVE":
      return "Ngừng hoạt động";
    case "SUSPENDED":
      return "Tạm khóa";
    default:
      return status || "Không rõ";
  }
};

const campusStatusTone = (status?: string | null) =>
  (status || "").toUpperCase() === "ACTIVE"
    ? "success"
    : (status || "").toUpperCase() === "SUSPENDED"
      ? "error"
      : "neutral";

const domainStatusLabel = (status?: string | null) => {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "INACTIVE":
      return "Ngừng hoạt động";
    case "PENDING":
      return "Chờ duyệt";
    case "SUSPENDED":
      return "Tạm khóa";
    default:
      return status || "Không rõ";
  }
};

const domainStatusTone = (status?: string | null) =>
  (status || "").toUpperCase() === "ACTIVE"
    ? "success"
    : (status || "").toUpperCase() === "PENDING"
      ? "warning"
      : (status || "").toUpperCase() === "SUSPENDED"
        ? "error"
        : "neutral";

const subsidyStatusLabel = (status?: string | null) => {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "Đang áp dụng";
    case "INACTIVE":
      return "Tạm ngưng";
    case "EXPIRED":
      return "Hết hiệu lực";
    case "DRAFT":
      return "Nháp";
    default:
      return status || "Không rõ";
  }
};

const subsidyStatusTone = (status?: string | null) => {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "success";
    case "EXPIRED":
    case "SUSPENDED":
      return "error";
    case "DRAFT":
      return "warning";
    default:
      return "neutral";
  }
};

const isFixedAmountSubsidy = (subsidyType?: string | null) =>
  (subsidyType || "").toUpperCase() === "FIXED_AMOUNT";

const subsidyValueLabel = (policy: SubsidyPolicyView) =>
  isFixedAmountSubsidy(policy.subsidyType) ? formatVND(policy.value) : `${policy.value}%`;

const normalizeDomainInput = (value: string) => value.trim().toLowerCase().replace(/^@+/, "");

const validateDomainInput = (value: string) => {
  const raw = value.trim();
  const normalized = normalizeDomainInput(value);
  if (!raw) return { error: "Vui lòng nhập domain email" };
  if (/\s/.test(raw)) return { error: "Domain không được chứa khoảng trắng" };
  if (/^https?:\/\//i.test(raw) || raw.includes("/")) return { error: "Chỉ nhập domain, không nhập http://, https:// hoặc đường dẫn" };
  if (normalized.includes("@")) return { error: "Không nhập email đầy đủ, chỉ nhập domain như duytan.edu.vn" };
  if (!normalized.includes(".")) return { error: "Domain phải có dấu chấm, ví dụ duytan.edu.vn" };
  if (normalized.startsWith(".") || normalized.endsWith(".") || normalized.includes("..")) return { error: "Domain không hợp lệ" };
  return { domain: normalized };
};

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

export function UniversityAdminModule({ activeId, onNavigate }: UniversityAdminModuleProps) {
  const proto = useUniversityAdminPrototypeData();

  if (proto.error) return <ErrorScreen message={proto.error} onRetry={proto.reload} />;
  if (proto.loading || !proto.data) return <LoadingScreen label="Đang tải dữ liệu admin trường..." />;

  const d = proto.data!;
  const ctx = {
    user: d.user,
    universityAdmin: d.universityAdmin,
    campuses: d.campuses,
    domains: d.domains,
    roster: d.roster,
    importBatches: d.importBatches,
    subsidyPolicies: d.subsidyPolicies,
    stats: d.stats,
    reconciliation: d.reconciliation,
    payments: d.payments,
    notifications: d.notifications,
    raw: {
      profileRaw: d.profileRaw,
      campusesRaw: d.campusesRaw,
      domainsRaw: d.domainsRaw,
      rosterRaw: d.rosterRaw,
      importBatchesRaw: d.importBatchesRaw,
      subsidyPoliciesRaw: d.subsidyPoliciesRaw,
      statsRaw: d.statsRaw,
      reconciliationRaw: d.reconciliationRaw,
      paymentsRaw: d.paymentsRaw,
      notificationsRaw: d.notificationsRaw,
      userProfileRaw: d.userProfileRaw,
    },
    reload: proto.reload,
  };

  let screen: React.ReactNode;

  switch (activeId) {
    case "uniadm-dashboard":
      screen = <DashboardScreen ctx={ctx} onNavigate={onNavigate} />;
      break;
    case "uniadm-info":
      screen = <InfoScreen ctx={ctx} />;
      break;
    case "uniadm-domains":
      screen = <DomainsScreen ctx={ctx} />;
      break;
    case "uniadm-import":
      screen = <ImportScreen ctx={ctx} />;
      break;
    case "uniadm-roster":
      screen = <RosterScreen ctx={ctx} />;
      break;
    case "uniadm-subsidy":
      screen = <SubsidyScreen ctx={ctx} />;
      break;
    case "uniadm-stats":
      screen = <StatsScreen ctx={ctx} />;
      break;
    case "uniadm-notify":
      screen = <NotifyScreen ctx={ctx} />;
      break;
    case "uniadm-recon":
      screen = <ReconScreen ctx={ctx} />;
      break;
    case "uniadm-transactions":
      screen = <TransactionsScreen ctx={ctx} />;
      break;
    default:
      screen = <FallbackScreen activeId={activeId} />;
  }

  return <div className="uniadmin-glm min-w-0">{screen}</div>;
}

export default UniversityAdminModule;

// =============================================================================
interface Ctx {
  user: any;
  universityAdmin: UniversityAdminView | null;
  campuses: CampusView[];
  domains: DomainView[];
  roster: RosterStudentView[];
  importBatches: ImportBatchView[];
  subsidyPolicies: SubsidyPolicyView[];
  stats: UniversityStatsView | null;
  reconciliation: ReconciliationView | null;
  payments: PaymentTransactionView[];
  notifications: any[];
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
  const ua = ctx.universityAdmin;
  const s = ctx.stats;

  const passesByRoute = (s?.passesByRoute || []).map((point) => ({
    name: point.routeCode || point.routeName,
    passes: point.passes,
    fill: point.colorHex || "#144fcc",
  }));
  const tripsLast7 = s?.tripsSeries || [];
  const subsidyDist = (s?.subsidyDistribution || []).map((point) => ({
    name: point.policyName,
    value: point.subsidyType === "PERCENTAGE" ? point.value : Math.round(point.value / 1000),
    color: point.colorHex,
    unit: point.subsidyType === "PERCENTAGE" ? "%" : "k",
  }));

  const quickActions = [
    { id: "uniadm-roster", label: "Danh sách sinh viên", description: "Tra cứu và kiểm tra trạng thái", icon: Users },
    { id: "uniadm-import", label: "Nhập danh sách", description: "Cập nhật roster sinh viên", icon: Upload },
    { id: "uniadm-subsidy", label: "Chính sách trợ giá", description: "Thiết lập mức hỗ trợ", icon: Percent },
    { id: "uniadm-stats", label: "Thống kê", description: "Theo dõi số liệu vận hành", icon: FileBarChart },
  ];

  return (
    <PageTransition className="space-y-6 sm:space-y-8 min-w-0">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-normal text-on-surface truncate">
          {ua?.universityName || "Trường đại học"}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Tổng quan hoạt động bus, sinh viên và trợ giá của trường
        </p>
      </div>

      <ScrollReveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
          {[
            {
              label: "Sinh viên",
              value: (s?.activeRosterStudents || 0).toLocaleString("vi-VN"),
              icon: GraduationCap,
              tone: "blue",
            },
            {
              label: "Cơ sở",
              value: String(s?.activeCampuses || 0),
              icon: MapPin,
              tone: "emerald",
            },
            {
              label: "Tuyến bus",
              value: String(s?.activeRoutes || 0),
              icon: FileBarChart,
              tone: "violet",
            },
            {
              label: "Trợ giá",
              value: ctx.subsidyPolicies.some((p) => p.status === "ACTIVE") ? "Đang áp dụng" : "Chưa có",
              icon: ShieldCheck,
              tone: "amber",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface p-4 min-w-0">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    item.tone === "blue" && "bg-blue-50 text-blue-600",
                    item.tone === "emerald" && "bg-emerald-50 text-emerald-600",
                    item.tone === "violet" && "bg-violet-50 text-violet-600",
                    item.tone === "amber" && "bg-amber-50 text-amber-600"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-on-surface-variant">{item.label}</p>
                  <p className="text-sm font-semibold tabular-nums text-on-surface truncate">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 min-w-0">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group flex min-h-[118px] flex-col justify-between rounded-xl border border-outline-variant bg-surface p-4 text-left transition-colors hover:bg-surface-container-low min-w-0"
              >
                <Icon className="size-5 text-on-surface-variant transition-colors group-hover:text-on-surface" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-on-surface">{action.label}</p>
                  <p className="mt-1 text-xs leading-snug text-on-surface-variant">{action.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* StatCards */}
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
        <StaggerItem>
          <StatCard
            label="Sinh viên có giao dịch"
            value={<Counter to={s?.activeRosterStudents || 0} />}
            icon={<Users className="size-6" />}
            hint={`${s?.matchedStudents || 0} hồ sơ sinh viên`}
            trend="up"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Vé tháng tháng này"
            value={<Counter to={s?.monthlyPasses || 0} />}
            icon={<FileSpreadsheet className="size-6" />}
            hint={`${s?.activeRosterStudents ? Math.round((s.monthlyPasses / s.activeRosterStudents) * 100) : 0}% SV có giao dịch`}
            trend="up"
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tuyến đang hoạt động"
            value={<Counter to={s?.activeRoutes || 0} />}
            icon={<FileBarChart className="size-6" />}
            hint={`${s?.activeSubsidyPolicies || 0} chính sách trợ giá`}
            accent="secondary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tổng trợ giá tháng"
            value={
              <Counter
                to={s?.totalSubsidyAmount || 0}
                format={(n) => formatVND(Math.round(n))}
              />
            }
            icon={<Wallet className="size-6" />}
            hint="Trợ giá vé tháng"
            trend="up"
            accent="success"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Charts row 1: passes by route (Bar) + trips 7 days (Line) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <ScrollReveal className="lg:col-span-2 min-w-0">
          <ExpressiveCard variant="outlined" className="p-5 min-w-0">
            <div className="flex items-center justify-between mb-4 min-w-0">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-on-surface">Vé tháng theo tuyến</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()} · Tổng {passesByRoute.reduce((s, d) => s + d.passes, 0)} vé
                </p>
              </div>
              <FileBarChart className="size-5 text-on-surface-variant shrink-0" />
            </div>
            <div className="h-56 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={passesByRoute} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="name" stroke="var(--color-on-surface-variant)" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--color-on-surface-variant)" fontSize={12} axisLine={false} tickLine={false} />
                  <RTooltip
                    cursor={{ fill: "var(--color-surface-container-highest)" }}
                    contentStyle={{
                      background: "#14140f",
                      border: "1px solid #14140f",
                      borderRadius: 12,
                      color: "#beff50",
                      fontSize: 12,
                    }}
                    formatter={(v: any) => [`${v} vé`, "Vé tháng"]}
                  />
                  <Bar dataKey="passes" radius={[8, 8, 0, 0]}>
                    {passesByRoute.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="min-w-0">
          <ExpressiveCard variant="outlined" className="p-5 h-full min-w-0">
            <div className="flex items-center justify-between mb-4 min-w-0">
              <h3 className="text-lg font-semibold text-on-surface">Lượt dùng xe 7 ngày</h3>
              <TrendingUp className="size-5 text-success shrink-0" />
            </div>
            <div className="h-56 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tripsLast7} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="day" stroke="var(--color-on-surface-variant)" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--color-on-surface-variant)" fontSize={12} axisLine={false} tickLine={false} />
                  <RTooltip
                    contentStyle={{
                      background: "#14140f",
                      border: "1px solid #14140f",
                      borderRadius: 12,
                      color: "#beff50",
                      fontSize: 12,
                    }}
                    formatter={(v: any) => [`${v} lượt`, "Lượt xe"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="trips"
                    stroke="#144fcc"
                    strokeWidth={3}
                    dot={{ fill: "#144fcc", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>

      {/* Charts row 2: subsidy pie + recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <ScrollReveal className="min-w-0">
          <ExpressiveCard variant="outlined" className="p-5 h-full min-w-0">
            <h3 className="text-lg font-semibold text-on-surface mb-2">Chính sách trợ giá</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={subsidyDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {subsidyDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <RTooltip
                  contentStyle={{ background: "#14140f", border: "1px solid #14140f", borderRadius: 16, color: "#beff50" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5 min-w-0">
              {subsidyDist.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-on-surface-variant truncate">{s.name}</span>
                  </div>
                  <span className="font-bold text-on-surface shrink-0">{s.value}{s.unit}</span>
                </div>
              ))}
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="lg:col-span-2 min-w-0">
          <Section title="Giao dịch gần đây" actions={<button onClick={() => onNavigate("uniadm-recon")} className="text-xs font-bold text-primary">Đối soát theo kỳ</button>}>
            {ctx.payments.length === 0 ? (
              <EmptyState icon={<Banknote className="size-7" />} title="Chưa có giao dịch" />
            ) : (
              <div className="space-y-2">
                {ctx.payments.slice(0, 5).map((p) => (
                  <ExpressiveCard key={p.orderId} variant="filled" className="p-3 min-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{p.studentName || p.studentCode || "—"}</p>
                        <p className="text-xs text-on-surface-variant truncate">{paymentModeLabel(p)} · {paymentJourneyLabel(p)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary">{formatVND(paymentFinalAmount(p))}</p>
                        <M3StatusPill label={paymentStatusLabel(p.paymentStatus)} tone={paymentStatusTone(p.paymentStatus)} />
                      </div>
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
// Screen 2: Info — university + campuses
// =============================================================================
function InfoScreen({ ctx }: { ctx: Ctx }) {
  const ua = ctx.universityAdmin;
  const campusesResource = useUniAdminCampuses();
  const campuses = campusesResource.raw || ctx.campuses;
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Thông tin trường"
        description="Thông tin trường và cơ sở."
        icon={<School className="size-7" />}
      />
      {ua && (
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-6 min-w-0">
            <div className="flex items-start gap-4 min-w-0">
              <div className="size-16 shrink-0 rounded-2xl bg-[#beff50] text-[#14140f] flex items-center justify-center text-2xl font-black">
                {(ua.universityName || "U").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate">{ua.universityName}</h2>
                <p className="text-sm text-on-surface-variant mt-1">Admin: <span className="font-bold">{ua.fullName}</span></p>
                <p className="text-sm text-on-surface-variant">Email: {ua.email}</p>
                {ua.title && <p className="text-sm text-on-surface-variant">Chức danh: {ua.title}</p>}
              </div>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.1}>
        <Section title={`Cơ sở (${campuses.length})`}>
          {campusesResource.loading ? (
            <LoadingScreen label="Đang tải cơ sở..." />
          ) : campuses.length === 0 ? (
            <EmptyState icon={<Building2 className="size-7" />} title="Chưa có cơ sở" />
          ) : (
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
              {campuses.map((c) => (
                <StaggerItem key={c.campusId}>
                  <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="size-10 shrink-0 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                        <Building2 className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{c.name}</p>
                        {c.code && <p className="text-xs text-on-surface-variant">Mã cơ sở: {c.code}</p>}
                        {c.address && <p className="text-xs text-on-surface-variant line-clamp-2">{c.address}</p>}
                        <M3StatusPill label={campusStatusLabel(c.status)} tone={campusStatusTone(c.status)} />
                      </div>
                    </div>
                  </ExpressiveCard>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </Section>
      </ScrollReveal>
    </PageTransition>
  );
}

// =============================================================================
// Screen 3: Domains
// =============================================================================
function DomainsScreen({ ctx }: { ctx: Ctx }) {
  const domainsResource = useUniAdminDomains();
  const domains = domainsResource.raw || ctx.domains;
  const [adding, setAdding] = useState(false);
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    const validation = validateDomainInput(domain);
    if (validation.error || !validation.domain) {
      toast.error(validation.error || "Domain không hợp lệ");
      return;
    }
    setSaving(true);
    try {
      await universityApi.createDomain({ domain: validation.domain });
      toast.success("Đã thêm domain");
      setDomain("");
      setAdding(false);
      domainsResource.reload();
      ctx.reload();
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      toast.error(/duplicate|unique|exists|already/i.test(message) ? "Domain này đã tồn tại" : message || "Không thể thêm domain");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Domain email"
        description="Sinh viên dùng email thuộc domain này sẽ được liên kết với trường."
        icon={<Globe className="size-7" />}
        actions={<ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm domain</ExpressiveButton>}
      />
      {domainsResource.loading ? (
        <LoadingScreen label="Đang tải domain..." />
      ) : domains.length === 0 ? (
        <EmptyState icon={<Globe className="size-7" />} title="Chưa có domain" />
      ) : (
        <StaggerGroup className="space-y-2 min-w-0">
          {domains.map((d) => (
            <StaggerItem key={d.domainId}>
              <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 shrink-0 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                    <Globe className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">@{d.domain}</p>
                    <p className="text-xs text-on-surface-variant">Thêm: {formatDate(d.createdAt)}</p>
                  </div>
                  <M3StatusPill label={domainStatusLabel(d.status)} tone={domainStatusTone(d.status)} />
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm domain email</DialogTitle>
            <DialogDescription>Sinh viên có email thuộc domain này sẽ được tự động liên kết với trường.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs font-bold">Domain</Label>
            <Input className="mt-1.5" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="VD: duytan.edu.vn" />
            <p className="mt-1 text-xs text-on-surface-variant">Chỉ nhập domain, không nhập email đầy đủ. Có thể nhập dạng @duytan.edu.vn.</p>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setAdding(false)} disabled={saving}>Hủy</ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={add} disabled={saving}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Thêm
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// =============================================================================
// Screen 4: Import roster (CSV/XLSX)
// =============================================================================
function ImportScreen({ ctx }: { ctx: Ctx }) {
  const importBatchesResource = useUniAdminImportBatches();
  const importBatches = importBatchesResource.raw || ctx.importBatches;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [latestBatch, setLatestBatch] = useState<ImportBatchView | null>(null);

  const downloadTemplate = useCallback(() => {
    const rows = [
      ["email", "studentCode", "fullName", "faculty", "academicYear", "status"],
      ["nguyenvana@duytan.edu.vn", "DTU202032312", "Nguyen Van A", "Cong nghe thong tin", "2024", "ACTIVE"],
      ["tranthib@duytan.edu.vn", "DTU202045678", "Tran Thi B", "Kinh te", "2024", "INACTIVE"],
      ["# Ghi chu: MSSV bat buoc, khong trung MSSV trong cung file, email nen thuoc domain truong, khong doi ten header, MSSV co so 0 dau nen nhap dang text."],
    ];
    const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCell).join(",")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "uniadmin-roster-template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setLatestBatch(null);
    try {
      const batch = await universityApi.importRoster(f);
      setLatestBatch(batch);
      if (batch.errorRows > 0) {
        toast.warning(`Đã nhập ${batch.successRows}/${batch.totalRows} dòng, ${batch.errorRows} dòng lỗi`);
      } else {
        toast.success(`Đã nhập ${batch.successRows}/${batch.totalRows} dòng`);
      }
      importBatchesResource.reload();
      ctx.reload();
    } catch (err) {
      const detail = err instanceof ApiError && err.details ? String(err.details) : null;
      toast.error(detail || (err instanceof Error ? err.message : "Không thể nhập danh sách sinh viên"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Nhập danh sách sinh viên"
        description="Tải lên file CSV/XLSX danh sách sinh viên."
        icon={<Upload className="size-7" />}
        actions={
          <ExpressiveButton variant="tonal" onClick={downloadTemplate}>
            <Download className="size-4" />
            Tải template mẫu
          </ExpressiveButton>
        }
      />
      <ScrollReveal>
        <ExpressiveCard variant="elevated" className="p-8 text-center min-w-0">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFile}
            className="hidden"
          />
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileRef.current?.click()}
            className="mx-auto max-w-md border-2 border-dashed border-outline-variant rounded-2xl p-8 cursor-pointer hover:border-primary hover:bg-primary-container/10 transition-colors"
          >
            {uploading ? (
              <RefreshCw className="size-12 mx-auto text-primary animate-spin" />
            ) : (
              <Upload className="size-12 mx-auto text-on-surface-variant" />
            )}
            <p className="mt-4 text-base font-bold">Chọn file để tải lên</p>
            <p className="text-xs text-on-surface-variant mt-1">Hỗ trợ CSV, XLSX. Tối đa 1000 dòng/lần.</p>
            <p className="text-xs text-on-surface-variant mt-2">
              Cột bắt buộc: email, studentCode, fullName. Trạng thái hợp lệ: ACTIVE, INACTIVE, GRADUATED, SUSPENDED.
            </p>
          </motion.div>
        </ExpressiveCard>
      </ScrollReveal>

      <Section title={`Lịch sử nhập (${importBatches.length})`}>
        {importBatchesResource.loading ? (
          <LoadingScreen label="Đang tải lịch sử import..." />
        ) : importBatches.length === 0 ? (
          <EmptyState icon={<FileSpreadsheet className="size-7" />} title="Chưa có lượt nhập" />
        ) : (
          <StaggerGroup className="space-y-3 min-w-0">
            {importBatches.map((b) => (
              <StaggerItem key={b.importBatchId}>
                <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{b.fileName}</p>
                      <p className="text-xs text-on-surface-variant">{formatDateTime(b.createdAt)}</p>
                    </div>
                    <M3StatusPill label={importStatusLabel(b.status)} tone={b.status === "COMPLETED" ? "success" : b.status === "FAILED" ? "error" : "warning"} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-on-surface-variant">Tổng số dòng</p>
                      <p className="font-bold">{b.totalRows}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Thành công</p>
                      <p className="font-bold text-success">{b.successRows}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant">Lỗi</p>
                      <p className="font-bold text-error">{b.errorRows}</p>
                    </div>
                  </div>
                  {b.totalRows > 0 && (
                    <M3Progress value={(b.successRows / b.totalRows) * 100} className="mt-3" />
                  )}
                  {(() => {
                    const errors = latestBatch?.importBatchId === b.importBatchId ? latestBatch.errors || [] : b.errors || [];
                    return errors.length > 0 ? (
                      <div className="mt-3 rounded-lg border border-error/25 bg-error/5 p-3 text-xs">
                        <p className="font-bold text-error">Lỗi import cần kiểm tra</p>
                        <div className="mt-2 space-y-1">
                          {errors.slice(0, 6).map((error) => (
                            <p key={error.importErrorId || `${error.rowNumber}-${error.fieldName}`} className="text-on-surface-variant">
                              Dòng {error.rowNumber}
                              {error.fieldName ? ` · ${error.fieldName}` : ""}: {importErrorMessage(error.errorMessage)}
                              {error.rawValue ? ` (${error.rawValue})` : ""}
                            </p>
                          ))}
                          {errors.length > 6 && <p className="text-on-surface-variant">Còn {errors.length - 6} lỗi khác.</p>}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </ExpressiveCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </Section>
    </PageTransition>
  );
}

// =============================================================================
// Screen 5: Roster
// =============================================================================
function RosterScreen({ ctx }: { ctx: Ctx }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const rosterResource = useUniAdminRoster({ keyword: search || undefined, status: statusFilter === "all" ? undefined : statusFilter });
  const roster = rosterResource.raw || ctx.roster;

  const filtered = roster.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !`${r.fullName} ${r.email} ${r.studentCode || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Danh sách sinh viên"
        description={`${roster.length} sinh viên`}
        icon={<Users className="size-7" />}
      />
      <div className="flex flex-wrap gap-2 min-w-0">
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <Input className="pl-9" placeholder="Tìm theo tên, email, mã SV..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Đang học</SelectItem>
            <SelectItem value="INACTIVE">Ngừng học</SelectItem>
            <SelectItem value="GRADUATED">Đã tốt nghiệp</SelectItem>
            <SelectItem value="SUSPENDED">Bị đình chỉ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {rosterResource.loading ? (
        <LoadingScreen label="Đang tải danh sách sinh viên..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="size-7" />} title="Không có sinh viên" />
      ) : (
        <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã SV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Khoa</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((r) => (
                <TableRow key={r.rosterId}>
                  <TableCell className="font-mono font-bold">{r.studentCode?.trim() || "Chưa có MSSV"}</TableCell>
                  <TableCell className="font-bold truncate">{r.fullName}</TableCell>
                  <TableCell className="text-xs truncate">{r.email}</TableCell>
                  <TableCell className="text-xs">{r.faculty || "—"}</TableCell>
                  <TableCell><M3StatusPill label={rosterStatusLabel(r.status)} tone={rosterStatusTone(r.status)} /></TableCell>
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
// Screen 6: Subsidy policies
// =============================================================================
function SubsidyScreen({ ctx }: { ctx: Ctx }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<SubsidyType>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    const numericValue = Number(value);
    const numericMaxAmount = Number(maxAmount);
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên chính sách");
      return;
    }
    if (!value.trim() || Number.isNaN(numericValue) || numericValue <= 0) {
      toast.error(type === "PERCENTAGE" ? "Vui lòng nhập phần trăm trợ giá hợp lệ" : "Vui lòng nhập số tiền trợ giá hợp lệ");
      return;
    }
    if (type === "PERCENTAGE" && numericValue > 100) {
      toast.error("Phần trăm trợ giá không được vượt quá 100%");
      return;
    }
    if (type === "PERCENTAGE" && maxAmount.trim() && (Number.isNaN(numericMaxAmount) || numericMaxAmount <= 0)) {
      toast.error("Số tiền tối đa phải lớn hơn 0");
      return;
    }
    setSaving(true);
    try {
      await universityApi.createSubsidyPolicy({
        policyName: name.trim(),
        subsidyType: type,
        value: numericValue,
        maxAmount: type === "PERCENTAGE" && maxAmount.trim() ? numericMaxAmount : undefined,
      });
      toast.success("Đã thêm chính sách trợ giá");
      setName(""); setValue(""); setMaxAmount("");
      setAdding(false);
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể thêm chính sách trợ giá");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Chính sách trợ giá"
        description="Áp dụng cho sinh viên của trường khi mua vé."
        icon={<Percent className="size-7" />}
        actions={<ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm chính sách</ExpressiveButton>}
      />
      {ctx.subsidyPolicies.length === 0 ? (
        <EmptyState icon={<Percent className="size-7" />} title="Chưa có chính sách trợ giá" />
      ) : (
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
          {ctx.subsidyPolicies.map((p) => (
            <StaggerItem key={p.subsidyPolicyId}>
              <ExpressiveCard variant="elevated" className="p-5 h-full min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                  <p className="font-bold truncate">{p.policyName}</p>
                  <M3StatusPill label={subsidyStatusLabel(p.status)} tone={subsidyStatusTone(p.status)} />
                </div>
                <div className="text-2xl font-black text-primary">
                  {subsidyValueLabel(p)}
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  {p.subsidyType === "PERCENTAGE" ? "Theo phần trăm giá vé" : "Số tiền cố định"}
                </p>
                {p.maxAmount != null && (
                  <p className="text-xs text-on-surface-variant mt-1">Tối đa: {formatVND(p.maxAmount)}</p>
                )}
                <div className="mt-3 space-y-1 text-xs text-on-surface-variant">
                  {p.activeFrom && <p>Hiệu lực từ: {formatDate(p.activeFrom)}</p>}
                  {p.activeUntil && <p>Đến: {formatDate(p.activeUntil)}</p>}
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm chính sách trợ giá</DialogTitle>
            <DialogDescription>Chính sách áp dụng cho sinh viên của trường. Chọn phần trăm hoặc số tiền cố định.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold">Tên chính sách</Label>
              <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Trợ giá 50% vé tháng" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Loại trợ giá</Label>
                <Select value={type} onValueChange={(v: SubsidyType) => setType(v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Theo %</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Số tiền cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">{type === "PERCENTAGE" ? "Phần trăm trợ giá" : "Số tiền trợ giá"}</Label>
                <Input className="mt-1.5" type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "PERCENTAGE" ? "VD: 50" : "VD: 100000"} />
              </div>
            </div>
            {type === "PERCENTAGE" && (
              <div>
                <Label className="text-xs font-bold">Số tiền tối đa (VND, tùy chọn)</Label>
                <Input className="mt-1.5" type="number" min="0" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="VD: 90000" />
              </div>
            )}
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setAdding(false)} disabled={saving}>Hủy</ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={add} disabled={saving}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Thêm chính sách
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// =============================================================================
// Screen 7: Stats
// =============================================================================
function StatsScreen({ ctx }: { ctx: Ctx }) {
  const s = ctx.stats;
  if (!s) {
    return (
      <PageTransition>
        <PageHeader title="Thống kê" icon={<FileBarChart className="size-7" />} />
        <EmptyState icon={<FileBarChart className="size-7" />} title="Chưa có dữ liệu" />
      </PageTransition>
    );
  }
  const stats: { label: string; value: number; unit?: string; tone?: string }[] = [
    { label: "Sinh viên hoạt động", value: s.activeRosterStudents, tone: "primary" },
    { label: "Sinh viên đã match", value: s.matchedStudents, tone: "success" },
    { label: "Domain hoạt động", value: s.activeDomains, tone: "tertiary" },
    { label: "Cơ sở hoạt động", value: s.activeCampuses, tone: "secondary" },
    { label: "Tuyến hoạt động", value: s.activeRoutes, tone: "primary" },
    { label: "Chính sách trợ giá", value: s.activeSubsidyPolicies, tone: "tertiary" },
    { label: "Tổng trợ giá", value: s.totalSubsidyAmount, unit: "VND", tone: "secondary" },
    { label: "Vé tháng đã bán", value: s.monthlyPasses, tone: "success" },
  ];
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Thống kê"
        description={`Trường ${s.universityName}`}
        icon={<FileBarChart className="size-7" />}
      />
      <ScrollReveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
          {stats.map((stat, i) => (
            <StatCard
              key={i}
              label={stat.label}
              value={
                <Counter
                  to={stat.value}
                  format={(n) =>
                    stat.unit === "VND"
                      ? formatVND(Math.round(n))
                      : Math.round(n).toLocaleString("vi-VN")
                  }
                />
              }
              icon={<TrendingUp className="size-5" />}
              accent={(stat.tone as any) || "primary"}
            />
          ))}
        </div>
      </ScrollReveal>
    </PageTransition>
  );
}

// =============================================================================
// Screen 8: Notify
// =============================================================================
function NotifyScreen({ ctx }: { ctx: Ctx }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sentHistory, setSentHistory] = useState<
    { id: string; title: string; content: string; recipientCount: number; sentAt: string }[]
  >([]);

  const send = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    const sentTitle = title.trim();
    const sentContent = content.trim();
    setSending(true);
    try {
      const recipientCount = await universityApi.notify({ title: sentTitle, content: sentContent });
      toast.success("Đã gửi thông báo");
      setSentHistory((items) => [
        {
          id: `${Date.now()}`,
          title: sentTitle,
          content: sentContent,
          recipientCount,
          sentAt: new Date().toISOString(),
        },
        ...items,
      ]);
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
        title="Gửi thông báo cho sinh viên"
        description="Trường gửi thông báo đến sinh viên thuộc danh sách của trường."
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
                Gửi thông báo
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <Section title={`Đã gửi trong phiên này (${sentHistory.length})`}>
            {sentHistory.length === 0 ? (
              <EmptyState
                icon={<Megaphone className="size-7" />}
                title="Chưa có lịch sử thông báo đã gửi"
                description="Các thông báo gửi thành công trong phiên làm việc hiện tại sẽ hiển thị tại đây."
              />
            ) : (
              <div className="space-y-2">
                {sentHistory.map((item) => (
                  <ExpressiveCard key={item.id} variant="filled" className="p-3 min-w-0">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{item.title}</p>
                        <p className="text-xs text-on-surface-variant line-clamp-2">{item.content}</p>
                        <p className="text-[10px] text-on-surface-variant mt-1">{formatDateTime(item.sentAt)}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{item.recipientCount} SV</Badge>
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
// Screen 9A: Transactions — payment/order history, not reconciliation
// =============================================================================
function TransactionsScreen({ ctx }: { ctx: Ctx }) {
  const rows = ctx.payments || [];
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const paidRows = rows.filter((p) => isSettledPaymentStatus(p.paymentStatus));
  const pendingRows = rows.filter((p) => paymentStatusGroup(p.paymentStatus) === "pending");
  const failedOrCancelledRows = rows.filter((p) => ["failed", "cancelled"].includes(paymentStatusGroup(p.paymentStatus)));
  const finalTotal = paidRows.reduce((sum, p) => sum + paymentFinalAmount(p), 0);
  const filteredRows = rows.filter((payment) => {
    if (statusFilter !== "all" && paymentStatusGroup(payment.paymentStatus) !== statusFilter) return false;
    if (dateFilter && paymentDateKey(payment) !== dateFilter) return false;
    return true;
  });

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lịch sử giao dịch"
        description="Tra cứu từng giao dịch/order của sinh viên theo trạng thái và ngày giao dịch."
        icon={<Banknote className="size-7" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 min-w-0">
        <StatCard label="Tổng giao dịch" value={rows.length} icon={<Banknote className="size-5" />} accent="primary" />
        <StatCard label="Đã thanh toán" value={paidRows.length} icon={<CheckCircle2 className="size-5" />} accent="success" />
        <StatCard label="Chờ thanh toán" value={pendingRows.length} icon={<RefreshCw className="size-5" />} accent="secondary" />
        <StatCard label="Lỗi/Hủy" value={failedOrCancelledRows.length} icon={<XCircle className="size-5" />} accent="error" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_180px] gap-2 min-w-0">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
          Sinh viên đã trả: <span className="font-bold text-on-surface">{formatVND(finalTotal)}</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
            <SelectItem value="pending">Chờ thanh toán</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
            <SelectItem value="cancelled">Đã hủy/hoàn tiền</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          onInput={(event) => setDateFilter(event.currentTarget.value)}
        />
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={<Banknote className="size-7" />}
          title={rows.length === 0 ? "Chưa có giao dịch" : "Không có giao dịch phù hợp"}
          description={dateFilter ? `Không có giao dịch trong ngày ${formatDate(dateFilter)} với bộ lọc đã chọn.` : undefined}
        />
      ) : (
        <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SV</TableHead>
                <TableHead>Loại đơn</TableHead>
                <TableHead>Kỳ vé</TableHead>
                <TableHead>Chặng/Tuyến</TableHead>
                <TableHead className="text-right">Giá gốc</TableHead>
                <TableHead className="text-right">Trợ giá</TableHead>
                <TableHead className="text-right">Sinh viên trả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.slice(0, 100).map((p) => (
                <TableRow key={`${p.orderId}-${p.transactionId || p.sepayTransactionId || "order"}`}>
                  <TableCell className="truncate">
                    <div className="font-medium truncate">{p.studentName || "—"}</div>
                    {p.studentCode && <div className="text-[10px] text-on-surface-variant font-mono">{p.studentCode}</div>}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{paymentModeLabel(p)}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{paymentPeriodLabel(p)}</TableCell>
                  <TableCell className="truncate text-xs">{paymentJourneyLabel(p)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatVND(paymentOriginalAmount(p))}</TableCell>
                  <TableCell className="text-right tabular-nums text-success">{formatVND(p.subsidyAmount || 0)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{formatVND(paymentFinalAmount(p))}</TableCell>
                  <TableCell><M3StatusPill label={paymentStatusLabel(p.paymentStatus)} tone={paymentStatusTone(p.paymentStatus)} /></TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{formatDate(paymentDateValue(p))}</TableCell>
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
// Screen 9: Reconciliation
// =============================================================================
function ReconScreen({ ctx }: { ctx: Ctx }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const reconciliationResource = useUniAdminReconciliation({
    from: from || undefined,
    to: to || undefined,
  });
  const r = reconciliationResource.raw || ctx.reconciliation;

  const reload = useCallback(() => {
    reconciliationResource.reload();
  }, [reconciliationResource]);

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Đối soát tài chính"
        description="Tổng hợp tiền vé, trợ giá và số tiền sinh viên đã thanh toán theo khoảng ngày."
        icon={<ScrollText className="size-7" />}
        actions={
          <div className="flex gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
            <ExpressiveButton variant="tonal" size="icon" onClick={reload} disabled={reconciliationResource.loading}>
              <RefreshCw className={cn("size-4", reconciliationResource.loading && "animate-spin")} />
            </ExpressiveButton>
          </div>
        }
      />
      {reconciliationResource.loading && !r ? (
        <LoadingScreen label="Đang tải dữ liệu đối soát..." />
      ) : reconciliationResource.error ? (
        <ErrorScreen message={reconciliationResource.error} onRetry={reload} />
      ) : !r ? (
        <EmptyState
          icon={<ScrollText className="size-7" />}
          title="Chưa có dữ liệu đối soát trong khoảng thời gian này"
          description="Không tìm thấy dữ liệu thanh toán trong khoảng ngày đã chọn."
        />
      ) : (
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
            <ExpressiveCard variant="elevated" className="p-6 min-w-0">
              <p className="text-xs text-on-surface-variant uppercase">Tổng tiền gốc</p>
              <p className="text-2xl font-black mt-2 text-primary">
                <Counter to={r.totalOriginalAmount} format={(n) => formatVND(Math.round(n))} />
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">{r.totalOrders || r.monthlyPasses} đơn/vé trong kỳ</p>
            </ExpressiveCard>
            <ExpressiveCard variant="elevated" className="p-6 min-w-0">
              <p className="text-xs text-on-surface-variant uppercase">Tổng trợ giá</p>
              <p className="text-2xl font-black mt-2 text-success">
                <Counter to={r.totalSubsidyAmount} format={(n) => formatVND(Math.round(n))} />
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">Phần trường hỗ trợ sinh viên</p>
            </ExpressiveCard>
            <ExpressiveCard variant="elevated" className="p-6 min-w-0">
              <p className="text-xs text-on-surface-variant uppercase">Sinh viên đã trả</p>
              <p className="text-2xl font-black mt-2 text-tertiary">
                <Counter to={r.totalFinalAmount} format={(n) => formatVND(Math.round(n))} />
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">{r.journeyOrders || 0} combo · {r.dayTickets || 0} vé ngày · {r.monthlyPasses || 0} vé tháng</p>
            </ExpressiveCard>
          </div>
        </ScrollReveal>
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
