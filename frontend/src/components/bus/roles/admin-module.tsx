"use client";

// =============================================================================
// Admin Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// Admin console screens:
//   adm-dashboard, adm-accounts, adm-schools, adm-verifications, adm-finance,
//   adm-pricing, adm-risk, adm-audit
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PageHeader, StatCard, EmptyState } from "../primitives";

import {
  useAdminPrototypeData,
  useAdminUsers,
  useAdminUniversities,
  useAdminRouteUnis,
  useAdminUniAdmins,
  useAdminVerifications,
  useAdminPayments,
  useAdminViolations,
  formatVND,
  formatDateTime,
  formatDate,
} from "@/lib/prototype-data";
import {
  adminApi,
  isPaidStatus,
  isUnpaidStatus,
  experienceApi,
  coordinatorRoutesApi,
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
  type BlobDownload,
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

const normalizePaymentStatus = (status?: string | null) =>
  (status || "").trim().toLowerCase();

const isPendingPaymentStatus = (status?: string | null) => {
  const normalized = normalizePaymentStatus(status);
  return normalized === "pending" || normalized === "unpaid";
};

const paymentStatusLabel = (status?: string | null) => {
  const normalized = normalizePaymentStatus(status);
  if (normalized === "paid") return "Đã thanh toán";
  if (normalized === "success") return "Thành công";
  if (normalized === "completed") return "Hoàn tất";
  if (normalized === "pending") return "Đang chờ";
  if (normalized === "unpaid") return "Chưa thanh toán";
  if (normalized === "failed") return "Thất bại";
  if (normalized === "cancelled" || normalized === "canceled") return "Đã hủy";
  if (normalized === "refunded") return "Đã hoàn tiền";
  return status || "Không rõ";
};

const paymentStatusTone = (status?: string | null): "neutral" | "primary" | "tertiary" | "success" | "warning" | "error" => {
  const normalized = normalizePaymentStatus(status);
  if (normalized === "paid" || normalized === "success" || normalized === "completed") return "success";
  if (normalized === "pending" || normalized === "unpaid") return "warning";
  if (normalized === "failed" || normalized === "cancelled" || normalized === "canceled") return "error";
  return "neutral";
};

const paymentMethodLabel = (payment: PaymentTransactionView) =>
  payment.gateway || (payment.sepayTransactionId ? "SePay" : "Đơn nội bộ");

const paymentCode = (payment: PaymentTransactionView) =>
  payment.referenceNumber || payment.transactionId || payment.sepayTransactionId || payment.orderId || "—";

const auditActionLabel = (action?: string | null) => {
  const normalized = (action || "").trim().toLowerCase();
  if (!normalized) return "Cập nhật dữ liệu";
  if (normalized.includes("student_verification_approve")) return "Sinh viên được xác minh";
  if (normalized.includes("student_verification_rejected")) return "Từ chối hồ sơ xác minh";
  if (normalized.includes("student_verification_resubmission_required")) return "Yêu cầu bổ sung hồ sơ";
  if (normalized.includes("user_status_update")) return "Cập nhật trạng thái tài khoản";
  if (normalized.includes("user_create")) return "Tạo tài khoản nhân sự";
  if (normalized.includes("fare_update")) return "Cập nhật giá vé";
  if (normalized.includes("admin_report_export")) return "Xuất báo cáo";
  if (normalized.includes("university_notification_send")) return "Gửi thông báo trường";
  if (normalized.includes("university_admin_create")) return "Tạo admin trường";
  if (normalized.includes("domain_create")) return "Thêm domain trường";
  if (normalized.includes("domain_status_update")) return "Cập nhật trạng thái domain";
  if (normalized.includes("campus_create")) return "Thêm cơ sở trường";
  if (normalized.includes("roster_import")) return "Import danh sách sinh viên";
  if (normalized.includes("subsidy_policy_create")) return "Tạo chính sách trợ giá";
  if (normalized.includes("route_university_create")) return "Gán tuyến cho trường";
  if (normalized.includes("student") && normalized.includes("register")) return "Sinh viên mới đăng ký";
  if (normalized.includes("verify") || normalized.includes("approve")) return "Sinh viên được xác minh";
  if (normalized.includes("university") && normalized.includes("create")) return "Trường mới được thêm";
  if ((normalized.includes("route") && normalized.includes("university")) || normalized.includes("assign")) return "Gán tuyến cho trường";
  if (normalized.includes("payment") || normalized.includes("transaction") || normalized.includes("order")) return "Giao dịch mới";
  if (normalized.includes("create")) return "Tạo dữ liệu";
  if (normalized.includes("update")) return "Admin cập nhật dữ liệu";
  if (normalized.includes("delete")) return "Xóa dữ liệu";
  if (normalized.includes("lock")) return "Khóa tài khoản";
  if (normalized.includes("reject")) return "Từ chối hồ sơ";
  return (action || "Cập nhật dữ liệu").replace(/_/g, " ");
};

const auditTargetLabel = (table?: string | null) => {
  const normalized = (table || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("universit")) return "Trường";
  if (normalized.includes("route")) return "Tuyến xe";
  if (normalized.includes("student")) return "Sinh viên";
  if (normalized.includes("payment") || normalized.includes("transaction") || normalized.includes("order")) return "Thanh toán";
  if (normalized.includes("subsid")) return "Trợ giá";
  if (normalized.includes("user")) return "Tài khoản";
  return (table || "").replace(/_/g, " ");
};

const hiddenAuditActions = new Set([
  "DOMAIN_AUTO_LINK",
  "GOOGLE_ROSTER_AUTO_LINK",
]);

const isVisibleAdminAudit = (action?: string | null) =>
  !hiddenAuditActions.has((action || "").trim().toUpperCase());

const isSystemAdminAudit = (audit: AuditLogView, userRoleById?: Map<number, string>) => {
  const role = (audit.performerRole || "").trim().toUpperCase();
  const mappedRole = audit.performedByUserId ? (userRoleById?.get(audit.performedByUserId) || "").trim().toUpperCase() : "";
  if (role) return role === "ADMIN";
  if (mappedRole) return mappedRole === "ADMIN";
  return false;
};

const importantAdminAuditActions = new Set([
  "USER_CREATE",
  "USER_STATUS_UPDATE",
  "UNIVERSITY_CREATE",
  "UNIVERSITY_UPDATE",
  "UNIVERSITY_ADMIN_CREATE",
  "CAMPUS_CREATE",
  "DOMAIN_CREATE",
  "DOMAIN_STATUS_UPDATE",
  "ROUTE_UNIVERSITY_CREATE",
  "ROUTE_SUBSIDY_TOGGLE",
  "SUBSIDY_CONFIG_UPDATE",
  "SUBSIDY_POLICY_CREATE",
  "FARE_UPDATE",
  "STUDENT_VERIFICATION_APPROVE",
  "STUDENT_VERIFICATION_REJECTED",
  "STUDENT_VERIFICATION_RESUBMISSION_REQUIRED",
  "ROSTER_IMPORT",
  "ROSTER_IMPORT_COMMIT",
]);

const isImportantAdminAudit = (action?: string | null) =>
  importantAdminAuditActions.has((action || "").trim().toUpperCase());

const isClosedViolationStatus = (status?: string | null) => {
  const normalized = (status || "").trim().toUpperCase();
  return normalized === "CLOSED" || normalized === "RESOLVED";
};

const violationStatusLabel = (status?: string | null) => {
  const normalized = (status || "").trim().toUpperCase();
  if (normalized === "CLOSED" || normalized === "RESOLVED") return "Đã đóng";
  if (normalized === "IN_PROGRESS") return "Đang xử lý";
  return "Đang mở";
};

type AdminReportPreset = "today" | "last7" | "month" | "custom";

const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const monthStartValue = () => {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
};

const todayValue = () => toDateInputValue(new Date());

const normalizeForFilter = (value?: string | number | null) =>
  String(value ?? "").trim().toLowerCase();

const includesFilter = (value: unknown, search: string) =>
  normalizeForFilter(value as string).includes(normalizeForFilter(search));

const dateOnly = (value?: string | null) => value?.slice(0, 10) || "";

const isDateInRange = (value: string | undefined, from: string, to: string) => {
  const date = dateOnly(value);
  if (!date) return !from && !to;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

const adminDeleteErrorMessage = (error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message : "";
  if (message.toLowerCase().includes("no static resource")) {
    return "Backend đang chạy chưa có API xóa mới. Restart backend rồi thử lại.";
  }
  return message || fallback;
};

const downloadFile = (download: BlobDownload, fallbackFileName: string, allowedContentTypes: string[]) => {
  const contentType = download.contentType.toLowerCase();
  const validType = allowedContentTypes.some((type) => contentType.includes(type));
  if (contentType.includes("application/json")) {
    throw new Error("Invalid file response");
  }
  if (download.blob.size <= 0) {
    throw new Error("Empty file response");
  }
  if (!validType) {
    throw new Error(`Unsupported file response: ${contentType || "unknown"}`);
  }
  const url = URL.createObjectURL(download.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = download.fileName || fallbackFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadBlobFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const xmlEscape = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const spreadsheetCell = (value: unknown, header = false) => {
  const numeric = typeof value === "number" && Number.isFinite(value);
  return `<Cell ss:StyleID="${header ? "Header" : numeric ? "Number" : "Text"}"><Data ss:Type="${numeric ? "Number" : "String"}">${xmlEscape(value)}</Data></Cell>`;
};

const spreadsheetRows = (rows: unknown[][]) =>
  rows.map((row, rowIndex) => `<Row>${row.map((cell) => spreadsheetCell(cell, rowIndex === 0)).join("")}</Row>`).join("");

const spreadsheetSheet = (name: string, rows: unknown[][]) => `
  <Worksheet ss:Name="${xmlEscape(name)}">
    <Table>${spreadsheetRows(rows)}</Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane>
    </WorksheetOptions>
  </Worksheet>`;

const downloadAdminReportFallback = (
  fileName: string,
  range: { from: string; to: string },
  statsRaw: AdminStatsView,
  reportStats: ExperienceDashboardStat[],
  totalTripsInRange: number,
) => {
  const summaryRows: unknown[][] = [
    ["Bao cao tong quan UniBus", "", "", ""],
    ["Tu ngay", range.from, "", ""],
    ["Den ngay", range.to, "", ""],
    ["Ngay xuat", todayValue(), "", ""],
    [],
    ["Nhom", "Chi so", "Gia tri", "Don vi"],
    ...reportStats.map((item) => ["Tong quan", item.label, Number(item.value) || 0, item.unit || ""]),
    ["Tong quan", "Chuyen trong ky", totalTripsInRange, "chuyen"],
  ];
  const dailyRows: unknown[][] = [
    ["Ngay", "Thu", "Doanh thu", "So chuyen"],
    ...statsRaw.revenueSeries.map((point) => [
      point.date,
      point.day,
      Number(point.revenue) || 0,
      statsRaw.tripsSeries.find((trip) => trip.date === point.date)?.trips || 0,
    ]),
  ];
  const routeRows: unknown[][] = [
    ["Ma tuyen", "Ten tuyen", "So chuyen", "Doanh thu"],
    ...statsRaw.routeMetrics.map((route) => [
      route.routeCode || "",
      route.routeName,
      route.trips,
      Number(route.revenue) || 0,
    ]),
  ];
  const roleRows: unknown[][] = [
    ["Vai tro", "So luong"],
    ...statsRaw.roleDistribution.map((role) => [role.role, role.value]),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1F4E78" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Number"><NumberFormat ss:Format="#,##0"/></Style>
    <Style ss:ID="Text"/>
  </Styles>
  ${spreadsheetSheet("Tong quan", summaryRows)}
  ${spreadsheetSheet("Doanh thu va chuyen", dailyRows)}
  ${spreadsheetSheet("Tuyen xe", routeRows)}
  ${spreadsheetSheet("Vai tro nguoi dung", roleRows)}
</Workbook>`;
  downloadBlobFile(new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" }), fileName);
};

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
    case "adm-accounts":
      return <AccountsScreen ctx={ctx} />;
    case "adm-schools":
      return <SchoolsScreen ctx={ctx} />;
    case "adm-finance":
      return <TransactionsScreen />;
    case "adm-pricing":
      return <FareScreen ctx={ctx} />;
    case "adm-risk":
      return <RiskScreen ctx={ctx} />;
    case "adm-universities":
    case "adm-route-uni":
      return <SchoolsScreen ctx={ctx} />;
    case "adm-uni-admins":
      return <AccountsScreen ctx={ctx} />;
    case "adm-audit":
      return <AuditScreen ctx={ctx} />;
    case "adm-users":
      return <AccountsScreen ctx={ctx} />;
    case "adm-complaints":
      return <ViolationsScreen ctx={ctx} />;
    case "adm-verifications":
      return <VerificationsScreen ctx={ctx} />;
    case "adm-violations":
      return <ViolationsScreen ctx={ctx} />;
    case "adm-transactions":
      return <TransactionsScreen />;
    case "adm-fare":
      return <FareScreen ctx={ctx} />;
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

type AccountTab = "users" | "uni-admins";

const accountTabs: Array<{ id: AccountTab; label: string; icon: typeof Users }> = [
  { id: "users", label: "Tất cả tài khoản", icon: Users },
  { id: "uni-admins", label: "Admin trường", icon: UserCog },
];

function AccountsScreen({ ctx }: { ctx: Ctx }) {
  const [activeTab, setActiveTab] = useState<AccountTab>("users");
  const users = useAdminUsers({ page: 0, size: 500 });
  const uniAdmins = useAdminUniAdmins();
  const tabCounts: Record<AccountTab, number> = {
    users: users.raw?.totalElements ?? users.raw?.length ?? ctx.users.length,
    "uni-admins": uniAdmins.raw?.length ?? ctx.uniAdmins.length,
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("accountTab");
    if (tab === "users" || tab === "uni-admins") {
      setActiveTab(tab);
    }
  }, []);

  const selectTab = (tab: AccountTab) => {
    setActiveTab(tab);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("accountTab", tab);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + accountTabs.length) % accountTabs.length;
    const nextTab = accountTabs[nextIndex].id;
    selectTab(nextTab);
    window.setTimeout(() => document.getElementById(`admin-account-tab-${nextTab}`)?.focus(), 0);
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <div role="tablist" aria-label="Tài khoản và admin trường" className="flex flex-wrap items-center justify-start gap-2">
        {accountTabs.map((tab, index) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`admin-account-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`admin-account-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={cn(
                "group inline-flex h-12 items-center gap-2 rounded-[14px] border px-4 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#beff50] focus-visible:ring-offset-2",
                active
                  ? "border-[#14140f] bg-[#14140f] text-[#beff50] shadow-sm"
                  : "border-outline-variant/60 bg-white text-on-surface hover:border-[#14140f]/25 hover:bg-surface-container-low"
              )}
            >
              <Icon className={cn("size-4", active ? "text-[#beff50]" : "text-on-surface-variant group-hover:text-on-surface")} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "ml-1 inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-black",
                  active ? "bg-[#beff50] text-[#14140f]" : "bg-surface-container-high text-on-surface"
                )}
              >
                {tabCounts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === "users" ? (
        <div
          id="admin-account-panel-users"
          role="tabpanel"
          aria-labelledby="admin-account-tab-users"
          className="min-w-0"
        >
          <UsersScreen ctx={ctx} />
        </div>
      ) : (
        <div
          id="admin-account-panel-uni-admins"
          role="tabpanel"
          aria-labelledby="admin-account-tab-uni-admins"
          className="min-w-0"
        >
          <UniAdminsScreen ctx={ctx} />
        </div>
      )}
    </PageTransition>
  );
}

type SchoolTab = "universities" | "routes";

const schoolTabs: Array<{ id: SchoolTab; label: string; icon: typeof School }> = [
  { id: "universities", label: "Danh sách trường", icon: School },
  { id: "routes", label: "Tuyến được gán", icon: RouteIcon },
];

function SchoolsScreen({ ctx }: { ctx: Ctx }) {
  const [activeTab, setActiveTab] = useState<SchoolTab>("universities");
  const universities = useAdminUniversities();
  const routeUnis = useAdminRouteUnis();
  const tabCounts: Record<SchoolTab, number> = {
    universities: universities.raw?.length ?? ctx.universities.length,
    routes: routeUnis.raw?.length ?? ctx.routeUnis.length,
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("schoolTab");
    if (tab === "universities" || tab === "routes") {
      setActiveTab(tab);
    }
  }, []);

  const selectTab = (tab: SchoolTab) => {
    setActiveTab(tab);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("schoolTab", tab);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + schoolTabs.length) % schoolTabs.length;
    const nextTab = schoolTabs[nextIndex].id;
    selectTab(nextTab);
    window.setTimeout(() => document.getElementById(`admin-school-tab-${nextTab}`)?.focus(), 0);
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <div role="tablist" aria-label="Trường đối tác" className="flex flex-wrap items-center justify-start gap-2">
        {schoolTabs.map((tab, index) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`admin-school-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`admin-school-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={cn(
                "group inline-flex h-12 items-center gap-2 rounded-[14px] border px-4 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#beff50] focus-visible:ring-offset-2",
                active
                  ? "border-[#14140f] bg-[#14140f] text-[#beff50] shadow-sm"
                  : "border-outline-variant/60 bg-white text-on-surface hover:border-[#14140f]/25 hover:bg-surface-container-low"
              )}
            >
              <Icon className={cn("size-4", active ? "text-[#beff50]" : "text-on-surface-variant group-hover:text-on-surface")} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "ml-1 inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-black",
                  active ? "bg-[#beff50] text-[#14140f]" : "bg-surface-container-high text-on-surface"
                )}
              >
                {tabCounts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === "universities" ? (
        <div
          id="admin-school-panel-universities"
          role="tabpanel"
          aria-labelledby="admin-school-tab-universities"
          className="min-w-0"
        >
          <UniversitiesScreen ctx={ctx} />
        </div>
      ) : (
        <div
          id="admin-school-panel-routes"
          role="tabpanel"
          aria-labelledby="admin-school-tab-routes"
          className="min-w-0"
        >
          <RouteUniScreen ctx={ctx} />
        </div>
      )}
    </PageTransition>
  );
}

function RiskScreen({ ctx }: { ctx: Ctx }) {
  return (
    <PageTransition className="space-y-6 min-w-0">
      <div
        id="admin-risk-panel-violations"
        role="tabpanel"
        aria-labelledby="admin-risk-tab-violations"
        className="min-w-0"
      >
        <ViolationsScreen ctx={ctx} />
      </div>
    </PageTransition>
  );
}

// =============================================================================
// Screen 1: Dashboard
// =============================================================================
function DashboardScreen({ ctx, onNavigate }: { ctx: Ctx; onNavigate: (id: string) => void }) {
  const initialStats = ctx.raw.statsRaw?.raw as AdminStatsView | null;
  const [reportPreset, setReportPreset] = useState<AdminReportPreset>("last7");
  const [customFrom, setCustomFrom] = useState(toDateInputValue(addDays(new Date(), -6)));
  const [customTo, setCustomTo] = useState(todayValue());
  const [reportStatsRaw, setReportStatsRaw] = useState<AdminStatsView | null>(initialStats);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const auditUsers = useAdminUsers({ page: 0, size: 500 });
  const auditUserRoleById = useMemo(() => {
    const map = new Map<number, string>();
    (auditUsers.raw || []).forEach((user) => map.set(user.userId, user.role));
    return map;
  }, [auditUsers.raw]);

  const reportRange = useMemo(() => {
    const today = todayValue();
    if (reportPreset === "today") return { from: today, to: today, label: "Hôm nay" };
    if (reportPreset === "month") return { from: monthStartValue(), to: today, label: "Tháng hiện tại" };
    if (reportPreset === "custom") return { from: customFrom, to: customTo, label: "Tùy chỉnh" };
    return { from: toDateInputValue(addDays(new Date(), -6)), to: today, label: "7 ngày gần nhất" };
  }, [customFrom, customTo, reportPreset]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!reportRange.from || !reportRange.to) return;
      if (reportRange.from > reportRange.to) {
        setReportError("Ngày bắt đầu không được sau ngày kết thúc");
        return;
      }
      setReportLoading(true);
      setReportError(null);
      try {
        const data = await experienceApi.adminStats({ from: reportRange.from, to: reportRange.to });
        if (active) setReportStatsRaw(data);
      } catch (e) {
        if (active) setReportError(e instanceof Error ? e.message : "Không thể tải báo cáo");
      } finally {
        if (active) setReportLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [reportRange.from, reportRange.to]);

  const statsRaw = reportStatsRaw || initialStats;
  const reportStats = statsRaw?.stats || ctx.stats;
  const statValue = (label: string) => {
    const value = reportStats.find((item) => item.label?.toLowerCase().includes(label))?.value;
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

  const totalRevenue = statValue("doanh thu") || revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalTripsInRange = tripsData.reduce((s, d) => s + d.trips, 0);
  const hasRevenueData = revenueData.some((d) => d.revenue > 0);
  const hasTripsData = tripsData.some((d) => d.trips > 0);

  const exportReport = async () => {
    if (!statsRaw) {
      toast.error("Chua co du lieu bao cao de xuat");
      return;
    }
    setExporting(true);
    try {
      let fallbackExport = false;
      const fallbackFileName = `bao-cao-admin-${reportRange.from}-to-${reportRange.to}.xls`;
      try {
        const file = await adminApi.statsReportXlsx({ from: reportRange.from, to: reportRange.to });
        downloadFile(file, `bao-cao-admin-${reportRange.from}-to-${reportRange.to}.xlsx`, [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/octet-stream",
        ]);
      } catch (downloadError) {
        console.warn("Admin XLSX endpoint is unavailable, using browser export fallback", downloadError);
        fallbackExport = true;
        downloadAdminReportFallback(
          fallbackFileName,
          { from: reportRange.from, to: reportRange.to },
          statsRaw,
          reportStats,
          totalTripsInRange,
        );
      }
      try {
        await adminApi.auditReportExport({ from: reportRange.from, to: reportRange.to, format: fallbackExport ? "XLS_FALLBACK" : "XLSX" });
        ctx.reload();
      } catch (auditError) {
        console.warn("Failed to write report export audit log", auditError);
        toast.warning("File da xuat, nhung chua ghi duoc nhat ky xuat bao cao.");
      }
      toast.success(fallbackExport ? "Da xuat file Excel tam thoi. Restart backend de dung ban XLSX day du." : "Da xuat bao cao");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Khong the xuat bao cao");
    } finally {
      setExporting(false);
    }
  };
  // Activities (derive from recent audit logs)
  const activities = useMemo(() => {
    return ctx.audits.filter((audit) => isSystemAdminAudit(audit, auditUserRoleById) && isVisibleAdminAudit(audit.action) && isImportantAdminAudit(audit.action)).slice(0, 8).map((a) => {
      const action = (a.action || "").toLowerCase();
      let icon = Info, tint = "bg-surface-container-high text-on-surface-variant";
      if (action.includes("fare")) {
        icon = Tag; tint = "bg-secondary-container text-on-secondary-container";
      } else if (action.includes("user_status") || action.includes("lock")) {
        icon = Lock; tint = "bg-error-container text-error-container";
      } else if (action.includes("create") || action.includes("register")) {
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
        title: auditActionLabel(a.action),
        desc: [a.performerName || "Hệ thống", auditTargetLabel(a.affectedTable)].filter(Boolean).join(" · "),
        time: a.performedAt ? formatDateTime(a.performedAt) : "",
      };
    });
  }, [auditUserRoleById, ctx.audits]);

  // Warnings panel
  const openViolations = ctx.violations.filter((v: any) => !isClosedViolationStatus(v.status)).length;
  const closedViolations = ctx.violations.filter((v: any) => isClosedViolationStatus(v.status)).length;
  const warnings = [
    { id: 1, label: "Vi phạm đang mở", count: openViolations, severity: openViolations > 0 ? "high" as const : "low" as const, hint: "Cần xử lý" },
    { id: 2, label: "Vi phạm đã đóng", count: closedViolations, severity: "low" as const, hint: "Đã xử lý xong" },
  ];  const warnTone: Record<string, "error" | "warning" | "neutral"> = {
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
          <Select value={reportPreset} onValueChange={(value) => setReportPreset(value as AdminReportPreset)}>
            <SelectTrigger className="h-9 w-[210px] rounded-full">
              <CalendarClock className="mr-2 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="last7">7 ngày gần nhất</SelectItem>
              <SelectItem value="month">Tháng hiện tại</SelectItem>
              <SelectItem value="custom">Tùy chỉnh</SelectItem>
            </SelectContent>
          </Select>
          {reportPreset === "custom" && (
            <>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 w-[150px] rounded-full"
              />
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 w-[150px] rounded-full"
              />
            </>
          )}
          <ExpressiveButton variant="text" size="sm" onClick={exportReport} disabled={exporting || reportLoading || !!reportError}>
            {exporting ? <RefreshCw className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
            Xuất báo cáo
          </ExpressiveButton>
          {reportLoading && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-outline-variant px-3 text-xs font-bold text-on-surface-variant">
              <RefreshCw className="size-3.5 animate-spin" /> Đang tải báo cáo
            </span>
          )}
        </div>
        {reportError && <p className="text-sm font-semibold text-error">{reportError}</p>}
      </motion.div>

      {/* StatCards — 1 hàng 4 card (giống prototype, bỏ quickActions row riêng) */}
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 min-w-0">
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
            label="Chuyến trong kỳ"
            value={<Counter to={totalTripsInRange} />}
            icon={<Bus className="size-6" />}
            hint={reportRange.label}
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
            hint={reportRange.label}
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
            {!hasRevenueData ? (
              <EmptyState icon={<Wallet className="size-7" />} title="Không có giao dịch trong khoảng thời gian này" />
            ) : (
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
            )}
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
            {!hasTripsData ? (
              <EmptyState icon={<BarChart3 className="size-7" />} title="Chưa có dữ liệu vận hành trong khoảng thời gian này" />
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
            <EmptyState icon={<Info className="size-7" />} title="Chưa có hoạt động gần đây" />
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
  const [deletingUniversityId, setDeletingUniversityId] = useState<number | null>(null);
  const universities = useAdminUniversities();
  const rows = universities.raw || [];

  const deleteUniversity = async (university: UniversityView) => {
    if (!window.confirm(`Xóa trường ${university.name}? Các cấu hình như cơ sở, domain, admin trường và tuyến được gán sẽ bị xóa theo.`)) return;
    setDeletingUniversityId(university.universityId);
    try {
      await adminApi.deleteUniversity(university.universityId);
      toast.success("Đã xóa trường");
      await universities.reload();
      await ctx.reload();
    } catch (e) {
      toast.error(adminDeleteErrorMessage(e, "Không thể xóa trường"));
    } finally {
      setDeletingUniversityId(null);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[#14140f] text-[#beff50]">
            <School className="size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black leading-tight text-on-surface">Trường đại học</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{rows.length} trường trong hệ thống</p>
          </div>
        </div>
        <ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm trường</ExpressiveButton>
      </div>
      {universities.error && (
        <ExpressiveCard variant="filled" className="p-4 text-sm text-error">{universities.error}</ExpressiveCard>
      )}
      {rows.length === 0 && !universities.loading ? (
        <EmptyState icon={<School className="size-7" />} title="Chưa có trường" />
      ) : (
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
          {rows.map((u) => (
            <StaggerItem key={u.universityId}>
              <ExpressiveCard variant="elevated" className="group flex h-full min-h-[218px] min-w-0 flex-col overflow-hidden border border-outline-variant/50 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#beff50]/70 hover:shadow-md">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-[16px] bg-[#beff50] text-xl font-black text-[#14140f] shadow-sm ring-1 ring-black/5">
                    {(u.shortName || u.code || u.name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[17px] font-black leading-tight text-on-surface">{u.name}</p>
                        <p className="mt-1 text-sm font-medium text-on-surface-variant">{u.shortName || u.code}</p>
                      </div>
                      <div className="shrink-0">
                        <M3StatusPill label={u.status} tone={u.status === "ACTIVE" ? "success" : "neutral"} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-[14px] border border-outline-variant/50 bg-surface-container-low px-3 py-2">
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase text-on-surface-variant">
                      <Building2 className="size-3.5" />
                      Cơ sở
                    </div>
                    <p className="text-xl font-black leading-none text-on-surface">{u.campusCount}</p>
                  </div>
                  <div className="rounded-[14px] border border-outline-variant/50 bg-surface-container-low px-3 py-2">
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase text-on-surface-variant">
                      <Globe className="size-3.5" />
                      Domain
                    </div>
                    <p className="text-xl font-black leading-none text-on-surface">{u.domainCount}</p>
                  </div>
                  <div className="rounded-[14px] border border-outline-variant/50 bg-surface-container-low px-3 py-2">
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase text-on-surface-variant">
                      <Users className="size-3.5" />
                      SV
                    </div>
                    <p className="text-xl font-black leading-none text-on-surface">{u.rosterCount}</p>
                  </div>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  <div className="min-w-0">
                    <Badge variant="outline" className="mb-1.5 max-w-full rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                      {u.code}
                    </Badge>
                    {u.contactEmail && (
                      <p className="max-w-[220px] truncate text-xs text-on-surface-variant">{u.contactEmail}</p>
                    )}
                  </div>
                  <ExpressiveButton
                    variant="tonal"
                    size="sm"
                    className="shrink-0"
                    onClick={() => deleteUniversity(u)}
                    disabled={deletingUniversityId === u.universityId}
                  >
                    {deletingUniversityId === u.universityId ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    Xóa
                  </ExpressiveButton>
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
      <Dialog open={adding} onOpenChange={setAdding}>
        <UniversityAddDialog onClose={() => setAdding(false)} onAdded={() => { setAdding(false); universities.reload(); ctx.reload(); }} />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  const admins = useAdminUniAdmins();
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const rows = admins.raw || [];
  const deleteAdmin = async (admin: UniversityAdminView) => {
    if (!window.confirm(`Xóa admin trường ${admin.fullName}? Tài khoản này sẽ bị xóa khỏi hệ thống nếu không còn liên kết khác.`)) return;
    setDeletingId(admin.universityAdminId);
    try {
      await adminApi.deleteUniversityAdmin(admin.universityAdminId);
      toast.success("Đã xóa admin trường");
      await admins.reload();
      await ctx.reload();
    } catch (e) {
      toast.error(adminDeleteErrorMessage(e, "Không thể xóa admin trường"));
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Admin trường ĐH"
        description={`${rows.length} quản trị viên trường`}
        icon={<UserCog className="size-7" />}
        actions={<ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm admin trường</ExpressiveButton>}
      />
      {admins.error && (
        <ExpressiveCard variant="filled" className="p-4 text-sm text-error">{admins.error}</ExpressiveCard>
      )}
      {rows.length === 0 && !admins.loading ? (
        <EmptyState icon={<UserCog className="size-7" />} title="Chưa có admin trường" />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {rows.map((u) => (
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
                  <div className="flex shrink-0 items-center gap-2">
                    <M3StatusPill label={u.status} tone={u.status === "ACTIVE" ? "success" : "neutral"} />
                    <ExpressiveButton
                      variant="tonal"
                      size="sm"
                      onClick={() => deleteAdmin(u)}
                      disabled={deletingId === u.universityAdminId}
                    >
                      {deletingId === u.universityAdminId ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      Xóa
                    </ExpressiveButton>
                  </div>
                </div>
              </ExpressiveCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <CreateUniversityAdminDialog
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            admins.reload();
            ctx.reload();
          }}
        />
      </Dialog>
    </PageTransition>
  );
}

function CreateUniversityAdminDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const universities = useAdminUniversities({ status: "ACTIVE" });
  const [universityId, setUniversityId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const rows = universities.raw || [];

  const save = async () => {
    const parsedUniversityId = Number(universityId);
    if (!parsedUniversityId || !fullName.trim() || !email.trim() || !password.trim()) {
      toast.error("Vui lòng chọn trường và nhập họ tên, email, mật khẩu");
      return;
    }
    if (password.length < 8) {
      toast.error("Mật khẩu tạm phải có ít nhất 8 ký tự");
      return;
    }

    setSaving(true);
    try {
      await adminApi.createUniversityAdmin({
        universityId: parsedUniversityId,
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim() || undefined,
        title: title.trim() || undefined,
      });
      toast.success("Đã tạo tài khoản admin trường");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể tạo admin trường");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Thêm admin trường</DialogTitle>
        <DialogDescription>Tạo tài khoản UNIVERSITY_ADMIN và gán trực tiếp vào một trường.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div>
          <Label className="text-xs font-bold">Trường</Label>
          <Select value={universityId} onValueChange={setUniversityId} disabled={universities.loading}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder={universities.loading ? "Đang tải danh sách trường..." : "Chọn trường"} />
            </SelectTrigger>
            <SelectContent>
              {rows.map((university) => (
                <SelectItem key={university.universityId} value={String(university.universityId)}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold">Họ tên</Label>
            <Input className="mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-bold">Chức danh</Label>
            <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Quản trị tài chính" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-bold">Email đăng nhập</Label>
          <Input className="mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold">Mật khẩu tạm</Label>
            <Input className="mt-1.5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-bold">Điện thoại</Label>
            <Input className="mt-1.5" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <ExpressiveButton variant="text" onClick={onClose} disabled={saving}>Hủy</ExpressiveButton>
        <ExpressiveButton variant="filled" onClick={save} disabled={saving || universities.loading}>
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Tạo tài khoản
        </ExpressiveButton>
      </DialogFooter>
    </DialogContent>
  );
}

// =============================================================================
// Screen 4: Route-University linking
// =============================================================================
function RouteUniScreen({ ctx }: { ctx: Ctx }) {
  const routeLinks = useAdminRouteUnis();
  const universities = useAdminUniversities();
  const [routes, setRoutes] = useState<{ routeId: number; routeCode?: string; routeName: string }[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [universityId, setUniversityId] = useState("");
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingRouteUniversityId, setDeletingRouteUniversityId] = useState<number | null>(null);
  const [deletingUniversityRoutes, setDeletingUniversityRoutes] = useState(false);
  const rows = useMemo(() => routeLinks.raw || [], [routeLinks.raw]);
  const parsedUniversityId = Number(universityId);
  const activeRouteIdsForUniversity = useMemo(
    () => new Set(rows
      .filter((item) => item.universityId === parsedUniversityId && item.status === "ACTIVE")
      .map((item) => item.routeId)),
    [rows, parsedUniversityId]
  );
  const availableRoutes = useMemo(
    () => routes.filter((route) => !activeRouteIdsForUniversity.has(route.routeId)),
    [routes, activeRouteIdsForUniversity]
  );
  const selectedUniversityRouteCount = useMemo(
    () => rows.filter((item) => item.universityId === parsedUniversityId).length,
    [rows, parsedUniversityId]
  );

  useEffect(() => {
    let active = true;
    setRoutesLoading(true);
    coordinatorRoutesApi.getRoutes()
      .then((items) => {
        if (!active) return;
        setRoutes((items || [])
          .filter((route) => route.status === "ACTIVE")
          .map((route) => ({
            routeId: Number(route.id),
            routeName: route.routeName || `Tuyến #${route.id}`,
          }))
          .filter((route) => Number.isFinite(route.routeId)));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Không thể tải danh sách tuyến"))
      .finally(() => {
        if (active) setRoutesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const saveRouteUniversity = async () => {
    const selectedRouteIds = routeIds.map(Number).filter(Number.isFinite);
    if (!parsedUniversityId || selectedRouteIds.length === 0) {
      toast.error("Vui lòng chọn trường và tuyến");
      return;
    }
    const duplicatedRouteIds = selectedRouteIds.filter((selectedRouteId) => activeRouteIdsForUniversity.has(selectedRouteId));
    if (duplicatedRouteIds.length) {
      toast.error("Có tuyến đã được gán cho trường");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(selectedRouteIds.map((selectedRouteId) =>
        adminApi.createRouteUniversity({
          universityId: parsedUniversityId,
          routeId: selectedRouteId,
          status: "ACTIVE",
        })
      ));
      toast.success(selectedRouteIds.length > 1 ? "Đã gán các tuyến cho trường" : "Đã gán tuyến cho trường");
      setRouteIds([]);
      await routeLinks.reload();
      await ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể gán tuyến");
    } finally {
      setSaving(false);
    }
  };

  const deleteRouteUniversity = async (link: RouteUniversityView) => {
    if (!window.confirm(`Xóa tuyến "${link.routeName}" khỏi trường ${link.universityName}?`)) return;
    setDeletingRouteUniversityId(link.routeUniversityId);
    try {
      await adminApi.deleteRouteUniversity(link.routeUniversityId);
      toast.success("Đã xóa liên kết tuyến-trường");
      await routeLinks.reload();
      await ctx.reload();
    } catch (e) {
      toast.error(adminDeleteErrorMessage(e, "Không thể xóa liên kết tuyến-trường"));
    } finally {
      setDeletingRouteUniversityId(null);
    }
  };

  const deleteSelectedUniversityRoutes = async () => {
    if (!parsedUniversityId || selectedUniversityRouteCount === 0) return;
    const selectedUniversityName = (universities.raw || []).find((u) => u.universityId === parsedUniversityId)?.name || "trường đã chọn";
    if (!window.confirm(`Xóa toàn bộ ${selectedUniversityRouteCount} tuyến được gán khỏi ${selectedUniversityName}?`)) return;
    setDeletingUniversityRoutes(true);
    try {
      await adminApi.deleteRouteUniversitiesForUniversity(parsedUniversityId);
      toast.success("Đã xóa toàn bộ tuyến được gán khỏi trường");
      await routeLinks.reload();
      await ctx.reload();
    } catch (e) {
      toast.error(adminDeleteErrorMessage(e, "Không thể xóa các tuyến được gán"));
    } finally {
      setDeletingUniversityRoutes(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[#14140f] text-[#beff50]">
          <RouteIcon className="size-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black leading-tight text-on-surface">Tuyến được gán</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{rows.length} liên kết tuyến-trường</p>
        </div>
      </div>
      <ExpressiveCard variant="elevated" className="border border-outline-variant/40 bg-white p-4 min-w-0">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end">
          <div>
            <Label className="text-xs font-bold">Trường</Label>
            <Select value={universityId} onValueChange={(value) => {
              setUniversityId(value);
              setRouteIds([]);
            }}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder={universities.loading ? "Đang tải trường..." : "Chọn trường"} /></SelectTrigger>
              <SelectContent>
                {(universities.raw || []).map((u) => (
                  <SelectItem key={u.universityId} value={String(u.universityId)}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold">Tuyến</Label>
            <div className="mt-1.5 max-h-44 overflow-y-auto rounded-[14px] border border-outline-variant/70 bg-surface p-2">
              {routesLoading ? (
                <p className="px-2 py-2 text-sm text-on-surface-variant">Đang tải tuyến...</p>
              ) : !universityId ? (
                <p className="px-2 py-2 text-sm text-on-surface-variant">Chọn trường trước</p>
              ) : availableRoutes.length === 0 ? (
                <p className="px-2 py-2 text-sm text-on-surface-variant">Trường này đã được gán tất cả tuyến khả dụng</p>
              ) : (
                availableRoutes.map((route) => {
                  const value = String(route.routeId);
                  const checked = routeIds.includes(value);
                  return (
                    <label key={route.routeId} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-surface-container">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(isChecked) => setRouteIds((current) =>
                          isChecked ? [...current, value] : current.filter((id) => id !== value)
                        )}
                      />
                      <span className="min-w-0 truncate">
                        {route.routeCode ? `${route.routeCode} - ${route.routeName}` : route.routeName}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <ExpressiveButton variant="filled" onClick={saveRouteUniversity} disabled={saving || universities.loading || routesLoading || !universityId || routeIds.length === 0}>
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            Lưu
          </ExpressiveButton>
          <ExpressiveButton
            variant="tonal"
            onClick={deleteSelectedUniversityRoutes}
            disabled={deletingUniversityRoutes || !parsedUniversityId || selectedUniversityRouteCount === 0}
          >
            {deletingUniversityRoutes ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Xóa tuyến của trường
          </ExpressiveButton>
        </div>
        {(routeLinks.error || universities.error) && (
          <p className="mt-3 text-sm font-semibold text-error">{routeLinks.error || universities.error}</p>
        )}
      </ExpressiveCard>
      {rows.length === 0 && !routeLinks.loading ? (
        <EmptyState icon={<RouteIcon className="size-7" />} title="Chưa có liên kết" />
      ) : (
        <ExpressiveCard variant="elevated" className="overflow-hidden border border-outline-variant/40 bg-white min-w-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container-low">
                <TableHead>Tuyến</TableHead>
                <TableHead>Trường</TableHead>
                <TableHead>Cơ sở</TableHead>
                <TableHead>Hiệu lực</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((ru) => (
                <TableRow key={ru.routeUniversityId} className="hover:bg-surface-container-low/70">
                  <TableCell className="min-w-[220px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#14140f] text-[#beff50]">
                        <Bus className="size-4" />
                      </div>
                      <span className="font-bold truncate">{ru.routeName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[220px] font-semibold truncate">{ru.universityName}</TableCell>
                  <TableCell className="truncate text-on-surface-variant">{ru.campusName || "—"}</TableCell>
                  <TableCell className="text-xs text-on-surface-variant">{formatDate(ru.activeFrom)} → {formatDate(ru.activeUntil)}</TableCell>
                  <TableCell><M3StatusPill label={ru.status} tone={ru.status === "ACTIVE" ? "success" : "neutral"} /></TableCell>
                  <TableCell className="text-right">
                    <ExpressiveButton
                      variant="text"
                      size="sm"
                      onClick={() => deleteRouteUniversity(ru)}
                      disabled={deletingRouteUniversityId === ru.routeUniversityId}
                    >
                      {deletingRouteUniversityId === ru.routeUniversityId ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      Xóa
                    </ExpressiveButton>
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
// Screen 5: Audit logs
// =============================================================================
function AuditScreen({ ctx }: { ctx: Ctx }) {
  const [search, setSearch] = useState("");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const auditUsers = useAdminUsers({ page: 0, size: 500 });
  const auditUserRoleById = useMemo(() => {
    const map = new Map<number, string>();
    (auditUsers.raw || []).forEach((user) => map.set(user.userId, user.role));
    return map;
  }, [auditUsers.raw]);
  const visibleAudits = useMemo(
    () => ctx.audits.filter((audit) => isSystemAdminAudit(audit, auditUserRoleById) && isVisibleAdminAudit(audit.action)),
    [auditUserRoleById, ctx.audits]
  );

  const universityOptions = useMemo(() => {
    const map = new Map<number, string>();
    visibleAudits.forEach((audit) => {
      if (audit.universityId && audit.universityName) map.set(audit.universityId, audit.universityName);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [visibleAudits]);

  const actionOptions = useMemo(() => {
    const actions = new Set<string>();
    visibleAudits.forEach((audit) => {
      if (audit.action) actions.add(audit.action);
    });
    return Array.from(actions).sort();
  }, [visibleAudits]);

  const filteredAudits = useMemo(() => visibleAudits.filter((audit) => {
    if (universityFilter !== "all" && String(audit.universityId || "") !== universityFilter) return false;
    if (actionFilter !== "all" && audit.action !== actionFilter) return false;
    if (resultFilter !== "all" && normalizeForFilter(audit.result || "SUCCESS") !== resultFilter) return false;
    if (!isDateInRange(audit.performedAt, fromDate, toDate)) return false;
    if (search) {
      const target = [
        audit.performerName,
        auditActionLabel(audit.action),
        audit.action,
        auditTargetLabel(audit.affectedTable),
        audit.affectedTable,
        audit.universityName,
        audit.notes,
        audit.affectedRecordId,
      ].join(" ");
      if (!includesFilter(target, search)) return false;
    }
    return true;
  }), [actionFilter, fromDate, resultFilter, search, toDate, universityFilter, visibleAudits]);

  const resetFilters = () => {
    setSearch("");
    setUniversityFilter("all");
    setActionFilter("all");
    setResultFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Nhật ký Admin hệ thống"
        description={`${filteredAudits.length} hoạt động của admin hệ thống`}
        icon={<ScrollText className="size-7" />}
      />
      <ExpressiveCard variant="filled" className="p-4 min-w-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm người, hành động, ghi chú"
            />
          </div>
          <Select value={universityFilter} onValueChange={setUniversityFilter}>
            <SelectTrigger><SelectValue placeholder="Trường" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trường</SelectItem>
              {universityOptions.map(([id, name]) => (
                <SelectItem key={id} value={String(id)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger><SelectValue placeholder="Hoạt động" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả hoạt động</SelectItem>
              {actionOptions.map((action) => (
                <SelectItem key={action} value={action}>{auditActionLabel(action)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger><SelectValue placeholder="Kết quả" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kết quả</SelectItem>
              <SelectItem value="success">Thành công</SelectItem>
              <SelectItem value="failure">Thất bại</SelectItem>
            </SelectContent>
          </Select>
          <ExpressiveButton variant="tonal" onClick={resetFilters}>
            <Filter className="size-4" />
            Xóa lọc
          </ExpressiveButton>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div>
            <Label className="text-xs font-bold">Từ ngày</Label>
            <Input className="mt-1.5" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-bold">Đến ngày</Label>
            <Input className="mt-1.5" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
        </div>
      </ExpressiveCard>
      {visibleAudits.length === 0 ? (
        <EmptyState icon={<ScrollText className="size-7" />} title="Chưa có hoạt động gần đây" />
      ) : filteredAudits.length === 0 ? (
        <EmptyState icon={<ScrollText className="size-7" />} title="Chưa có nhật ký phù hợp với bộ lọc" />
      ) : (
        <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Người thực hiện</TableHead>
                <TableHead>Hoạt động</TableHead>
                <TableHead>Kết quả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudits.slice(0, 100).map((a) => (
                <TableRow key={a.auditLogId}>
                  <TableCell className="text-xs whitespace-nowrap">{formatDateTime(a.performedAt)}</TableCell>
                  <TableCell className="truncate">{a.performerName || "—"}</TableCell>
                  <TableCell className="truncate">
                    <p className="text-sm font-semibold">{auditActionLabel(a.action)}</p>
                    <p className="text-[11px] text-on-surface-variant">{auditTargetLabel(a.affectedTable) || "—"}</p>
                  </TableCell>
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
  const users = useAdminUsers({
    role: roleFilter === "all" ? undefined : roleFilter,
    search: search.trim() || undefined,
    page: 0,
    size: 500,
  });
  const rows = users.raw || [];
  const totalUserCount = users.raw?.totalElements ?? rows.length;

  const filtered = rows.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search && !`${u.fullName} ${u.email} ${u.staffCode || ""} ${u.licenseNumber || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
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
      users.reload();
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
        description={`${totalUserCount} người dùng`}
        icon={<Users className="size-7" />}
        actions={<ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm nhân viên</ExpressiveButton>}
      />
      {users.error && (
        <ExpressiveCard variant="filled" className="p-4 text-sm text-error">{users.error}</ExpressiveCard>
      )}
      <div className="flex flex-wrap gap-2 min-w-0">
        <div className="relative w-full flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
          <Input className="pl-9" placeholder="Tìm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
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
      {filtered.length === 0 && !users.loading ? (
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
        <CreateStaffDialog onClose={() => setAdding(false)} onCreated={() => { setAdding(false); users.reload(); ctx.reload(); }} />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <Input className="mt-1.5" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="Ví dụ: 480123456789" />
          </div>
        ) : role === "CONDUCTOR" || role === "DISPATCHER" ? (
          <div>
            <Label className="text-xs font-bold">Mã nhân viên</Label>
            <Input className="mt-1.5" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="Ví dụ: NV-0001" />
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
    PENDING_REVIEW: { label: "Chờ xác minh", tone: "warning" },
    VERIFIED: { label: "Đã xác minh", tone: "success" },
    REJECTED: { label: "Từ chối", tone: "error" },
    RESUBMISSION_REQUIRED: { label: "Cần bổ sung thông tin", tone: "warning" },
  };
  return meta[status || ""] || { label: status || "Không rõ", tone: "neutral" as const };
}

function ReviewField({
  label,
  submitted,
}: {
  label: string;
  submitted?: string | null;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-3 min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-on-surface">{submitted || "—"}</p>
    </div>
  );
}

const OCR_LOW_CONFIDENCE_THRESHOLD = 0.65;

const ocrStatusCopy: Record<string, { label: string; tone: "neutral" | "primary" | "tertiary" | "success" | "warning" | "error" }> = {
  NOT_STARTED: { label: "Chưa bắt đầu", tone: "neutral" },
  PROCESSING: { label: "Đang xử lý", tone: "warning" },
  COMPLETED: { label: "Hoàn tất", tone: "success" },
  FAILED: { label: "Lỗi OCR", tone: "error" },
  DISABLED: { label: "Đã tắt OCR", tone: "neutral" },
};

const matchStatusCopy: Record<string, { label: string; tone: "neutral" | "primary" | "tertiary" | "success" | "warning" | "error" }> = {
  MATCHED: { label: "Khớp", tone: "success" },
  NORMALIZED_MATCH: { label: "Khớp sau chuẩn hóa", tone: "success" },
  PARTIAL_MATCH: { label: "Khớp một phần", tone: "warning" },
  NOT_MATCHED: { label: "Không khớp", tone: "error" },
  NOT_DETECTED: { label: "Không đọc được", tone: "error" },
  MULTIPLE_CANDIDATES: { label: "Có nhiều kết quả", tone: "warning" },
};

function formatOcrPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

function aggregateOcrConfidence(item: VerificationView) {
  const scores = [
    item.nameSimilarityScore,
    item.studentCodeSimilarityScore,
    item.universitySimilarityScore,
  ].filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
  if (scores.length > 0) {
    return scores.reduce((total, value) => total + value, 0) / scores.length;
  }
  return item.ocrConfidenceScore ?? null;
}

function formatOcrConfidence(item: VerificationView) {
  const value = aggregateOcrConfidence(item);
  if (value == null || Number.isNaN(value)) return "Không có dữ liệu";
  return formatOcrPercent(value);
}

function hasAnyOcrData(item: VerificationView) {
  return Boolean(
    item.ocrStatus ||
      item.ocrProvider ||
      item.ocrFullName ||
      item.ocrStudentCode ||
      item.ocrUniversity ||
      item.ocrRawText ||
      item.ocrConfidenceScore != null ||
      item.nameMatchStatus ||
      item.studentCodeMatchStatus ||
      item.universityMatchStatus
  );
}

function ocrWarnings(item: VerificationView) {
  const warnings: string[] = [];
  if (item.ocrStatus === "FAILED") warnings.push("OCR gặp lỗi. Admin vẫn có thể kiểm tra ảnh thẻ và xử lý thủ công.");
  if (item.ocrStatus === "DISABLED") warnings.push("OCR đang tắt cho hồ sơ này hoặc môi trường hiện tại.");
  if (item.ocrStatus === "PROCESSING") warnings.push("Đang xử lý OCR...");
  const aggregateConfidence = aggregateOcrConfidence(item);
  if (aggregateConfidence != null && aggregateConfidence < OCR_LOW_CONFIDENCE_THRESHOLD) {
    warnings.push("Độ tin cậy OCR thấp, cần đối chiếu kỹ với ảnh thẻ.");
  }
  if (item.studentCodeMatchStatus === "NOT_DETECTED") warnings.push("OCR không đọc được MSSV.");
  if (
    item.nameMatchStatus === "MULTIPLE_CANDIDATES" ||
    item.studentCodeMatchStatus === "MULTIPLE_CANDIDATES" ||
    item.universityMatchStatus === "MULTIPLE_CANDIDATES"
  ) {
    warnings.push("OCR có nhiều kết quả ứng viên, cần kiểm tra thủ công.");
  }
  if (item.nameMatchStatus === "NOT_MATCHED") warnings.push("Họ tên OCR không khớp với thông tin khai báo.");
  if (item.universityMatchStatus === "NOT_MATCHED") warnings.push("Tên trường OCR không khớp với thông tin khai báo.");
  if (hasAnyOcrData(item) && (!item.nameMatchStatus || !item.studentCodeMatchStatus || !item.universityMatchStatus)) {
    warnings.push("Chưa có kết quả OCR đầy đủ cho hồ sơ này.");
  }
  if (warnings.length === 0 && !hasAnyOcrData(item)) {
    warnings.push("Chưa có kết quả OCR đầy đủ cho hồ sơ này.");
  }
  return warnings;
}

function OcrMatchBadge({ status }: { status?: string | null }) {
  if (!status) return <M3StatusPill label="Chưa có dữ liệu" tone="neutral" />;
  const meta = matchStatusCopy[status] || { label: status, tone: "neutral" as const };
  return <M3StatusPill label={meta.label} tone={meta.tone} />;
}

function OcrComparisonTable({ item }: { item: VerificationView }) {
  const rows = [
    { label: "Họ tên", submitted: item.fullName, ocr: item.ocrFullName, status: item.nameMatchStatus, score: item.nameSimilarityScore },
    { label: "MSSV", submitted: item.studentCode, ocr: item.ocrStudentCode, status: item.studentCodeMatchStatus, score: item.studentCodeSimilarityScore },
    { label: "Trường", submitted: item.university, ocr: item.ocrUniversity, status: item.universityMatchStatus, score: item.universitySimilarityScore },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-outline-variant/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trường</TableHead>
            <TableHead>Sinh viên khai báo</TableHead>
            <TableHead>OCR đọc được</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Điểm</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="font-bold">{row.label}</TableCell>
              <TableCell className="max-w-[220px] whitespace-normal">{row.submitted || "—"}</TableCell>
              <TableCell className="max-w-[220px] whitespace-normal">{row.ocr || "—"}</TableCell>
              <TableCell><OcrMatchBadge status={row.status} /></TableCell>
              <TableCell>{formatOcrPercent(row.score)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OcrRawTextPanel({ rawText }: { rawText?: string | null }) {
  return (
    <details className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-3">
      <summary className="cursor-pointer text-sm font-black text-on-surface">Raw text OCR</summary>
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-surface-container p-3 text-xs text-on-surface-variant">
        {rawText?.trim() || "Không có raw text"}
      </pre>
    </details>
  );
}

function StudentVerificationOcrPanel({
  item,
  onRetry,
  retrying,
}: {
  item: VerificationView;
  onRetry: (item: VerificationView) => void;
  retrying: boolean;
}) {
  const statusMeta = item.ocrStatus
    ? ocrStatusCopy[item.ocrStatus] || { label: item.ocrStatus, tone: "neutral" as const }
    : { label: "Chưa có trạng thái OCR", tone: "neutral" as const };
  const warnings = ocrWarnings(item);
  const retrySupported = Boolean(item.ocrStatus);
  const canRetry = retrySupported && item.status === "PENDING_REVIEW" && item.ocrStatus !== "PROCESSING";

  return (
    <div className="space-y-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-black text-on-surface">Kết quả OCR</h4>
            <M3StatusPill label={statusMeta.label} tone={statusMeta.tone} />
            {item.ocrProvider && <Badge variant="outline" className="rounded-full text-[11px]">{item.ocrProvider}</Badge>}
          </div>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">
            OCR chỉ là dữ liệu hỗ trợ. Admin cần kiểm tra ảnh thẻ trước khi quyết định.
          </p>
        </div>
        {retrySupported ? (
          <ExpressiveButton variant="tonal" size="sm" disabled={!canRetry || retrying} onClick={() => onRetry(item)}>
            <RefreshCw className={cn("size-4", retrying && "animate-spin")} />
            {item.ocrStatus === "PROCESSING" ? "Đang xử lý OCR..." : "Chạy lại OCR"}
          </ExpressiveButton>
        ) : (
          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
            Backend chưa trả trạng thái retry
          </span>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-warning/30 bg-warning-container/40 p-3 text-sm text-on-surface">
          {warnings.map((warning) => (
            <div key={warning} className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <p>{warning}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        <ReviewField label="OCR họ tên" submitted={item.ocrFullName} />
        <ReviewField label="OCR MSSV" submitted={item.ocrStudentCode} />
        <ReviewField label="OCR trường" submitted={item.ocrUniversity} />
        <ReviewField label="Độ tin cậy" submitted={formatOcrConfidence(item)} />
        <ReviewField label="Số lần OCR" submitted={item.ocrAttemptCount == null ? "—" : String(item.ocrAttemptCount)} />
        <ReviewField label="Xử lý gần nhất" submitted={formatDateTime(item.ocrLastAttemptAt || item.ocrProcessedAt)} />
      </div>

      {(item.ocrErrorCode || item.ocrErrorMessage) && (
        <div className="rounded-2xl border border-error/25 bg-error-container/40 p-3 text-sm">
          <p className="font-bold text-error">{item.ocrErrorCode || "OCR_ERROR"}</p>
          <p className="mt-1 text-on-surface-variant">{item.ocrErrorMessage || "OCR không xử lý được hồ sơ này."}</p>
        </div>
      )}

      <OcrComparisonTable item={item} />
      <OcrRawTextPanel rawText={item.ocrRawText} />
    </div>
  );
}

function VerificationsScreen({ ctx }: { ctx: Ctx }) {
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [review, setReview] = useState<{ item: VerificationView; action: VerificationReviewAction } | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);
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
        toast.success("Đã xác minh sinh viên");
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

  const retryOcr = async (item: VerificationView) => {
    if (!item.verificationId || item.ocrStatus === "PROCESSING") return;
    setRetryingId(item.verificationId);
    try {
      await adminApi.retryVerificationOcr(item.verificationId);
      toast.success("Đã chạy lại OCR");
      resource.reload();
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể chạy lại OCR");
    } finally {
      setRetryingId(null);
    }
  };

  const actionCopy = review?.action === "approve"
    ? { title: "Xác minh hồ sơ?", description: "Sinh viên sẽ được liên kết với trường và trạng thái chuyển sang đã xác minh.", cta: "Xác minh" }
    : review?.action === "reject"
      ? { title: "Từ chối hồ sơ?", description: "Sinh viên sẽ thấy lý do từ chối và có thể gửi lại hồ sơ mới.", cta: "Từ chối" }
      : { title: "Yêu cầu gửi lại?", description: "Sinh viên sẽ phải bổ sung ảnh hoặc thông tin theo lý do bạn nhập.", cta: "Yêu cầu gửi lại" };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Xác minh sinh viên"
        description={`Admin hệ thống xử lý ${items.length} hồ sơ theo bộ lọc hiện tại`}
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
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING_REVIEW">Chờ xác minh</SelectItem>
            <SelectItem value="RESUBMISSION_REQUIRED">Cần bổ sung thông tin</SelectItem>
            <SelectItem value="REJECTED">Từ chối</SelectItem>
            <SelectItem value="VERIFIED">Đã xác minh</SelectItem>
            <SelectItem value="all">Tất cả</SelectItem>
          </SelectContent>
        </Select>
        {resource.loading && <span className="text-sm text-on-surface-variant">Đang tải...</span>}
        {resource.error && <span className="text-sm text-error">{resource.error}</span>}
      </div>

      {items.length === 0 && !resource.loading ? (
        <EmptyState
          icon={<BadgeCheck className="size-7" />}
          title={statusFilter === "PENDING_REVIEW" ? "Chưa có sinh viên chờ xác minh" : "Chưa có hồ sơ phù hợp với bộ lọc"}
          description="Dữ liệu hiển thị theo danh sách xác minh sinh viên hiện có."
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
                        <ReviewField label="Họ tên" submitted={item.fullName} />
                        <ReviewField label="MSSV" submitted={item.studentCode} />
                        <ReviewField label="Trường" submitted={item.university} />
                      </div>

                      <div className="grid gap-2 md:grid-cols-3">
                        <ReviewField label="Email" submitted={item.email} />
                        <ReviewField label="Gửi lúc" submitted={formatDateTime(item.submittedAt)} />
                        <ReviewField label="Trạng thái" submitted={meta.label} />
                      </div>

                      <StudentVerificationOcrPanel
                        item={item}
                        onRetry={retryOcr}
                        retrying={retryingId === item.verificationId}
                      />

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
                          <CheckCircle2 className="size-4" /> Xác minh
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
  const [search, setSearch] = useState("");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const rows = useMemo(() => payments.raw || [], [payments.raw]);

  const universityOptions = useMemo(() => {
    const map = new Map<number, string>();
    rows.forEach((payment) => {
      if (payment.universityId && payment.universityName) map.set(payment.universityId, payment.universityName);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filteredRows = useMemo(() => rows.filter((payment) => {
    if (universityFilter !== "all" && String(payment.universityId || "") !== universityFilter) return false;
    if (statusFilter !== "all") {
      const normalized = normalizePaymentStatus(payment.paymentStatus);
      if (statusFilter === "pending") {
        if (!isPendingPaymentStatus(payment.paymentStatus)) return false;
      } else if (statusFilter === "cancelled") {
        if (normalized !== "cancelled" && normalized !== "canceled") return false;
      } else if (normalized !== statusFilter) {
        return false;
      }
    }
    if (!isDateInRange(payment.paidAt || payment.transactionDate || payment.createdAt, fromDate, toDate)) return false;
    if (search) {
      const target = [
        paymentCode(payment),
        payment.studentName,
        payment.studentCode,
        payment.universityName,
        payment.routeName,
        payment.ticketType,
        payment.orderMode,
        payment.originLabel,
        payment.destinationLabel,
        payment.referenceNumber,
        payment.transactionContent,
        payment.paymentStatus,
      ].join(" ");
      if (!includesFilter(target, search)) return false;
    }
    return true;
  }), [fromDate, rows, search, statusFilter, toDate, universityFilter]);

  const paidRows = filteredRows.filter((row) => isPaidStatus(row.paymentStatus));
  const totalPaid = paidRows.reduce((sum, row) => sum + paymentFinalAmount(row), 0);
  const pendingRows = filteredRows.filter((row) => isPendingPaymentStatus(row.paymentStatus)).length;

  const resetFilters = () => {
    setSearch("");
    setUniversityFilter("all");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Lịch sử giao dịch"
        description={`${filteredRows.length}/${rows.length} đơn thanh toán và giao dịch đã phát sinh`}
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
        <StatCard label="Đang chờ thanh toán" value={pendingRows} icon={<Clock className="size-5" />} accent="warning" />
      </div>

      {payments.error && (
        <ExpressiveCard variant="filled" className="p-4 text-sm text-error">{payments.error}</ExpressiveCard>
      )}

      <ExpressiveCard variant="filled" className="p-4 min-w-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã, sinh viên, tuyến"
            />
          </div>
          <Select value={universityFilter} onValueChange={setUniversityFilter}>
            <SelectTrigger><SelectValue placeholder="Trường" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trường</SelectItem>
              {universityOptions.map(([id, name]) => (
                <SelectItem key={id} value={String(id)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="paid">Đã thanh toán</SelectItem>
              <SelectItem value="pending">Đang chờ / Chưa thanh toán</SelectItem>
              <SelectItem value="failed">Thất bại</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
              <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
            </SelectContent>
          </Select>
          <div>
            <Label className="text-xs font-bold">Từ ngày</Label>
            <Input className="mt-1.5" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-bold">Đến ngày</Label>
            <Input className="mt-1.5" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <ExpressiveButton variant="tonal" onClick={resetFilters}>
            <Filter className="size-4" />
            Xóa lọc
          </ExpressiveButton>
        </div>
      </ExpressiveCard>

      {rows.length === 0 && !payments.loading ? (
        <EmptyState icon={<Receipt className="size-7" />} title="Không có giao dịch trong khoảng thời gian này" />
      ) : filteredRows.length === 0 ? (
        <EmptyState icon={<Receipt className="size-7" />} title="Không có giao dịch phù hợp với bộ lọc" />
      ) : (
        <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã giao dịch</TableHead>
                <TableHead>Người thanh toán</TableHead>
                <TableHead>Trường</TableHead>
                <TableHead>Loại/Chặng</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.slice(0, 100).map((p) => (
                <TableRow key={`${p.orderId}-${p.transactionId || p.sepayTransactionId || "order"}`}>
                  <TableCell className="truncate">
                    <p className="font-semibold">{paymentCode(p)}</p>
                    <p className="text-[11px] text-on-surface-variant">{paymentMethodLabel(p)}</p>
                  </TableCell>
                  <TableCell className="truncate">
                    <p className="font-semibold">{p.studentName || p.studentCode || "—"}</p>
                    {p.studentCode && <p className="text-[11px] text-on-surface-variant">{p.studentCode}</p>}
                  </TableCell>
                  <TableCell className="truncate text-xs">{p.universityName || "—"}</TableCell>
                  <TableCell className="truncate text-xs">{paymentModeLabel(p)}<div className="text-[10px] text-on-surface-variant truncate">{paymentJourneyLabel(p)}</div></TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    <div>{formatVND(paymentOriginalAmount(p))}</div>
                    <div className="text-[10px] text-on-surface-variant">→ {formatVND(paymentFinalAmount(p))}</div>
                  </TableCell>
                  <TableCell>
                    <M3StatusPill label={paymentStatusLabel(p.paymentStatus)} tone={paymentStatusTone(p.paymentStatus)} />
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
              <ExpressiveCard variant="elevated" className="border border-outline-variant/40 bg-white p-4 min-w-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3 mb-2 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#14140f] text-[#beff50]">
                      <ShieldAlert className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{c.subject}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(c.createdAt)}</p>
                    </div>
                  </div>
                  <M3StatusPill label={c.status} tone={c.status === "resolved" ? "success" : c.status === "rejected" ? "error" : "warning"} />
                </div>
                <p className="text-sm line-clamp-3 text-on-surface-variant">{c.description}</p>
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
  const violationsResource = useAdminViolations();
  const [statusFilter, setStatusFilter] = useState<"open" | "closed">("open");
  const [closingId, setClosingId] = useState<number | null>(null);
  const rows = violationsResource.raw || ctx.violations;
  const openRows = rows.filter((v: any) => !isClosedViolationStatus(v.status));
  const closedRows = rows.filter((v: any) => isClosedViolationStatus(v.status));
  const visibleRows = statusFilter === "open" ? openRows : closedRows;

  const closeViolation = async (violationId: number) => {
    setClosingId(violationId);
    try {
      try {
        await experienceApi.reviewViolation(violationId, {
          status: "CLOSED",
          actionTaken: "Admin đã xử lý và đóng báo cáo vi phạm.",
        });
      } catch (closedError) {
        console.warn("Backend does not accept CLOSED yet, falling back to RESOLVED", closedError);
        await experienceApi.reviewViolation(violationId, {
          status: "RESOLVED",
          actionTaken: "Admin đã xử lý và đóng báo cáo vi phạm.",
        });
      }
      toast.success("Đã đóng báo cáo vi phạm");
      violationsResource.reload();
      ctx.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đóng vi phạm");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Vi phạm"
        description={`${openRows.length} đang mở · ${closedRows.length} đã đóng`}
        icon={<AlertOctagon className="size-7" />}
      />
      <div className="flex flex-wrap gap-2">
        <ExpressiveButton variant={statusFilter === "open" ? "filled" : "tonal"} onClick={() => setStatusFilter("open")}>
          <AlertOctagon className="size-4" />
          Đang mở ({openRows.length})
        </ExpressiveButton>
        <ExpressiveButton variant={statusFilter === "closed" ? "filled" : "tonal"} onClick={() => setStatusFilter("closed")}>
          <CheckCircle2 className="size-4" />
          Đã đóng ({closedRows.length})
        </ExpressiveButton>
      </div>
      {violationsResource.loading ? (
        <LoadingScreen label="Đang tải báo cáo vi phạm..." />
      ) : rows.length === 0 ? (
        <EmptyState icon={<AlertOctagon className="size-7" />} title="Không có vi phạm" />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          icon={statusFilter === "open" ? <AlertOctagon className="size-7" /> : <CheckCircle2 className="size-7" />}
          title={statusFilter === "open" ? "Không còn vi phạm đang mở" : "Chưa có vi phạm đã đóng"}
        />
      ) : (
        <StaggerGroup className="space-y-3 min-w-0">
          {visibleRows.map((v: any) => {
            const closed = isClosedViolationStatus(v.status);
            return (
            <StaggerItem key={v.violationReportId}>
              <ExpressiveCard variant="elevated" className="border border-outline-variant/40 bg-white p-4 min-w-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3 mb-2 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#14140f] text-[#beff50]">
                      <AlertOctagon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{v.reporterName || "—"}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(v.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <M3StatusPill label={violationStatusLabel(v.status)} tone={closed ? "success" : "warning"} />
                    {!closed && (
                      <ExpressiveButton
                        variant="tonal"
                        size="sm"
                        onClick={() => closeViolation(v.violationReportId)}
                        disabled={closingId === v.violationReportId}
                      >
                        {closingId === v.violationReportId ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                        Đóng
                      </ExpressiveButton>
                    )}
                  </div>
                </div>
                <p className="text-sm line-clamp-3 text-on-surface-variant">{v.content}</p>
              </ExpressiveCard>
            </StaggerItem>
            );
          })}
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
function FallbackScreen({ activeId }: { activeId: string }) {
  return (
    <EmptyState
      icon={<Info className="size-7" />}
      title="Màn chưa hỗ trợ"
      description={`Mãn "${activeId}" chưa được triển khai.`}
    />
  );
}
