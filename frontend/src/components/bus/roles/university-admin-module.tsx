"use client";

// =============================================================================
// University Admin Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// 9 role-specific screens:
//   uniadm-dashboard, uniadm-info, uniadm-domains, uniadm-import, uniadm-roster,
//   uniadm-subsidy, uniadm-notify, uniadm-recon
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
  TicketPercent,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  LabelList,
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
import { Switch } from "@/components/ui/switch";
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
  type ImportErrorView,
  type RosterImportConfirmView,
  type RosterImportPreviewView,
  type RosterStudentView,
  type RouteUniversityView,
  type SubsidyPolicyView,
  type UniversityStatsView,
  type ReconciliationView,
  type PaymentTransactionView,
  type UniversityAdminView,
  type ExperienceDashboardStat,
  type BlobDownload,
} from "@/lib/api/client";

type UniversityAdminModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
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
  if (!validType && contentType && !contentType.includes("text/csv")) {
    throw new Error(`Unsupported file response: ${contentType}`);
  }
  const url = URL.createObjectURL(download.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = download.fileName || fallbackFileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const effectiveSubsidyType = (policy?: Pick<SubsidyPolicyView, "subsidyType" | "value"> | null) => {
  if (policy?.subsidyType === "PERCENTAGE") return "PERCENTAGE";
  const value = Number(policy?.value || 0);
  if (policy?.subsidyType === "FIXED_AMOUNT" && value > 0 && value <= 100) {
    return "PERCENTAGE";
  }
  return "FIXED_AMOUNT";
};

const isPercentageSubsidy = (policy?: Pick<SubsidyPolicyView, "subsidyType" | "value"> | null) =>
  effectiveSubsidyType(policy) === "PERCENTAGE";

const subsidyConfigValueLabel = (policy?: Pick<SubsidyPolicyView, "subsidyType" | "value"> | null) => {
  const value = Math.round(Number(policy?.value || 0));
  return isPercentageSubsidy(policy) ? `${value}%` : formatVND(value);
};

const DETAIL_ROUTE_COLORS = ["#144fcc", "#16a34a", "#ff855d", "#f59e0b", "#7c3aed", "#0f766e", "#dc2626", "#64748b"];

const routeDisplayName = (routeCode?: string | null, routeName?: string | null) => {
  const code = routeCode?.trim();
  const name = routeName?.trim();
  if (code && name && code !== name) return `${code} - ${name}`;
  return name || code || "Tuyến chưa đặt tên";
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
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
  const code = message?.includes(":") ? message.split(":", 1)[0] : message;
  switch (code) {
    case "STUDENT_ACCOUNT_NOT_FOUND":
      return "Không tìm thấy tài khoản sinh viên đang sử dụng hệ thống";
    case "STUDENT_NOT_LINKED_TO_UNIVERSITY":
      return "Sinh viên dùng email cá nhân nhưng chưa liên kết với trường";
    case "STUDENT_LINKED_TO_ANOTHER_UNIVERSITY":
      return "Sinh viên đang liên kết với trường khác";
    case "EMAIL_DOMAIN_BELONGS_TO_ANOTHER_UNIVERSITY":
      return "Domain email thuộc trường khác";
    case "STUDENT_ACCOUNT_IDENTIFIER_CONFLICT":
      return "Email và MSSV đang thuộc hai tài khoản khác nhau";
  }
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

const importErrorCode = (error?: ImportErrorView | null) =>
  error?.errorCode || (error?.errorMessage?.includes(":") ? error.errorMessage.split(":", 1)[0] : undefined);

const importFieldLabel = (field?: string | null) => {
  const normalized = (field || "").replace(/[_\s-]/g, "").toLowerCase();
  if (normalized === "studentcode" || normalized === "mssv") return "MSSV";
  if (normalized === "email") return "Email";
  if (normalized === "fullname" || normalized === "name") return "Họ tên";
  if (normalized === "academicyear") return "Năm học";
  if (normalized === "status") return "Trạng thái";
  return field || "Dữ liệu";
};

const importPreviewErrorReason = (error: RosterImportPreviewView["errors"][number]) => {
  const fieldLabel = importFieldLabel(error.field);
  const code = (error.code || "").toUpperCase();
  switch (code) {
    case "STUDENT_ACCOUNT_NOT_FOUND":
      return "Chưa có tài khoản sinh viên";
    case "STUDENT_NOT_LINKED_TO_UNIVERSITY":
      return "Chưa liên kết trường";
    case "STUDENT_LINKED_TO_ANOTHER_UNIVERSITY":
      return "Liên kết trường khác";
    case "EMAIL_DOMAIN_BELONGS_TO_ANOTHER_UNIVERSITY":
      return "Domain thuộc trường khác";
    case "STUDENT_ACCOUNT_IDENTIFIER_CONFLICT":
      return "Email/MSSV không khớp";
  }
  if (code.includes("EXISTING") || code.includes("DUPLICATE")) return fieldLabel;
  if (code.includes("INVALID_EMAIL")) return "Email";
  if (code.includes("EMAIL")) return "Email";
  if (code.includes("STUDENT_CODE") || code.includes("MSSV")) return "MSSV";
  if (code.includes("FULL_NAME")) return "Họ tên";
  if (code.includes("ACADEMIC_YEAR")) return "Năm học";
  return fieldLabel;
};

const importErrorSuggestion = (error?: ImportErrorView | null) => {
  const message = error?.errorMessage || "";
  const code = importErrorCode(error);
  if (
    code === "STUDENT_ACCOUNT_NOT_FOUND" ||
    code === "STUDENT_NOT_LINKED_TO_UNIVERSITY" ||
    code === "STUDENT_LINKED_TO_ANOTHER_UNIVERSITY" ||
    code === "EMAIL_DOMAIN_BELONGS_TO_ANOTHER_UNIVERSITY" ||
    code === "STUDENT_ACCOUNT_IDENTIFIER_CONFLICT"
  ) {
    return "Đối chiếu tài khoản sinh viên, liên kết trường hoặc email/MSSV rồi import lại";
  }
  const field = (error?.fieldName || "").toLowerCase();
  if (message.includes("duplicated") || message.includes("already exists")) {
    return field === "email" ? "Giữ một email duy nhất hoặc kiểm tra lại sinh viên đã tồn tại" : "Giữ một dòng duy nhất cho MSSV này";
  }
  if (field === "email" || message.includes("Email")) return "Kiểm tra lại email và domain của trường";
  if (field === "studentcode" || field === "student_code" || message.includes("MSSV")) return "Kiểm tra lại MSSV, không để trống và không trùng";
  if (field === "fullname" || field === "full_name") return "Bổ sung họ tên sinh viên";
  if (field === "academicyear" || field === "academic_year") return "Nhập năm học dạng 4 chữ số, ví dụ 2024";
  return "Sửa dữ liệu ở dòng này rồi import lại";
};

function ImportErrorTable({ errors }: { errors?: ImportErrorView[] | null }) {
  if (!errors?.length) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant">
        Chưa có chi tiết lỗi cho lượt import này.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Dòng</TableHead>
            <TableHead>Cột</TableHead>
            <TableHead>Giá trị</TableHead>
            <TableHead>Nguyên nhân</TableHead>
            <TableHead>Gợi ý sửa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errors.map((error) => (
            <TableRow key={error.importErrorId || `${error.importBatchId}-${error.rowNumber}-${error.fieldName}`}>
              <TableCell className="font-mono font-bold">{error.rowNumber}</TableCell>
              <TableCell className="font-bold">{importFieldLabel(error.fieldName)}</TableCell>
              <TableCell className="max-w-[220px] truncate text-sm">{error.rawValue || "Trống"}</TableCell>
              <TableCell>
                <p className="font-bold text-error">{importFieldLabel(error.fieldName)}</p>
                <p className="text-xs text-on-surface-variant">{importErrorMessage(error.errorMessage)}</p>
              </TableCell>
              <TableCell className="text-sm text-on-surface-variant">{importErrorSuggestion(error)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ImportPreviewRowsTable({
  preview,
}: {
  preview?: RosterImportPreviewView | null;
}) {
  if (!preview?.previewRows?.length) return null;
  const errorsByRow = new Map<number, number>();
  for (const error of preview.errors || []) {
    errorsByRow.set(error.rowNumber, (errorsByRow.get(error.rowNumber) || 0) + 1);
  }
  const rowResult = (row: RosterImportPreviewView["previewRows"][number]) => {
    if (!row.valid || errorsByRow.has(row.rowNumber)) return { label: "Có lỗi", tone: "error" as const };
    if (row.existing || row.action === "SKIP_EXISTING") return { label: "Bỏ qua", tone: "warning" as const };
    if (row.action === "CREATE") return { label: "Tạo mới", tone: "success" as const };
    return { label: row.action || "Hợp lệ", tone: "success" as const };
  };
  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Dòng</TableHead>
            <TableHead>MSSV</TableHead>
            <TableHead>Họ tên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Kết quả</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.previewRows.map((row) => {
            const result = rowResult(row);
            return (
              <TableRow key={row.rowNumber}>
                <TableCell className="font-mono font-bold">{row.rowNumber}</TableCell>
                <TableCell className="font-mono font-bold">{row.studentCode || "Trống"}</TableCell>
                <TableCell className="font-bold">{row.fullName || "Trống"}</TableCell>
                <TableCell className="text-sm">{row.email || "Trống"}</TableCell>
                <TableCell className="text-sm">{row.status || "ACTIVE"}</TableCell>
                <TableCell><M3StatusPill label={result.label} tone={result.tone} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ImportPreviewErrorTable({ errors }: { errors?: RosterImportPreviewView["errors"] | null }) {
  if (!errors?.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Dòng</TableHead>
            <TableHead>Cột</TableHead>
            <TableHead>Giá trị</TableHead>
            <TableHead>Nguyên nhân</TableHead>
            <TableHead>Gợi ý sửa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errors.map((error) => (
            <TableRow key={`${error.rowNumber}-${error.field}-${error.code}`}>
              <TableCell className="font-mono font-bold">{error.rowNumber > 0 ? error.rowNumber : "File"}</TableCell>
              <TableCell className="font-bold">{importFieldLabel(error.field)}</TableCell>
              <TableCell className="max-w-[220px] truncate text-sm">{error.value || "Trống"}</TableCell>
              <TableCell>
                <p className="font-bold text-error">{importPreviewErrorReason(error)}</p>
                <p className="text-xs text-on-surface-variant">{error.message || "Dữ liệu không hợp lệ"}</p>
              </TableCell>
              <TableCell className="text-sm text-on-surface-variant">{error.suggestion || "Sửa dữ liệu ở dòng này rồi import lại"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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
  const [rosterImportBatchId, setRosterImportBatchId] = useState<number | undefined>();

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
    case "uniadm-students":
      screen = <StudentsScreen
        ctx={ctx}
        initialTab="import"
        importBatchId={rosterImportBatchId}
        onSetImportBatch={setRosterImportBatchId}
        onClearImportBatch={() => setRosterImportBatchId(undefined)}
      />;
      break;
    case "uniadm-import":
      screen = <StudentsScreen
        ctx={ctx}
        initialTab="import"
        importBatchId={rosterImportBatchId}
        onSetImportBatch={setRosterImportBatchId}
        onClearImportBatch={() => setRosterImportBatchId(undefined)}
      />;
      break;
    case "uniadm-roster":
      screen = <StudentsScreen
        ctx={ctx}
        initialTab="roster"
        importBatchId={rosterImportBatchId}
        onSetImportBatch={setRosterImportBatchId}
        onClearImportBatch={() => setRosterImportBatchId(undefined)}
      />;
      break;
    case "uniadm-subsidy":
      screen = <SubsidyScreen ctx={ctx} />;
      break;
    case "uniadm-notify":
      screen = <DashboardScreen ctx={ctx} onNavigate={onNavigate} />;
      break;
    case "uniadm-recon":
      screen = <TransactionsScreen ctx={ctx} />;
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
  const [detailRange, setDetailRange] = useState<"7d" | "30d" | "semester">("30d");

  const passesByRoute = useMemo(() => (s?.passesByRoute || []).map((point, index) => ({
    name: routeDisplayName(point.routeCode, point.routeName),
    passes: point.passes,
    fill: DETAIL_ROUTE_COLORS[index % DETAIL_ROUTE_COLORS.length],
  })), [s?.passesByRoute]);
  const monthlyPassRouteChart = useMemo(() => {
    const rows = passesByRoute
      .filter((route) => route.passes > 0)
      .map((route, index) => ({
        ...route,
        tickLabel: route.name.length > 24 ? `${route.name.slice(0, 24)}...` : route.name,
        fill: DETAIL_ROUTE_COLORS[index % DETAIL_ROUTE_COLORS.length],
      }));
    const total = rows.reduce((sum, route) => sum + route.passes, 0);
    const max = rows.reduce((value, route) => Math.max(value, route.passes), 0);
    return {
      rows: rows.map((route) => ({
        ...route,
        share: total ? Math.round((route.passes / total) * 100) : 0,
      })),
      total,
      routeCount: rows.length,
      yMax: max + 1,
    };
  }, [passesByRoute]);
  const tripsLast7 = s?.tripsSeries || [];
  const currentSubsidyPolicy = useMemo(
    () => [...ctx.subsidyPolicies].sort((a, b) => b.subsidyPolicyId - a.subsidyPolicyId)[0],
    [ctx.subsidyPolicies],
  );
  const detailRouteSeries = useMemo(() => {
    const weekCount = detailRange === "7d" ? 1 : detailRange === "semester" ? 16 : 4;
    const sourceRoutes = passesByRoute;
    const chartRoutes = sourceRoutes.length > 8
      ? [
          ...sourceRoutes.slice(0, 7),
          {
            name: "Khác",
            passes: sourceRoutes.slice(7).reduce((sum, route) => sum + route.passes, 0),
            fill: DETAIL_ROUTE_COLORS[7],
          },
        ]
      : sourceRoutes;
    const visibleRoutes = chartRoutes.map((route, index) => ({
      key: `route_${index}`,
      name: route.name,
      color: DETAIL_ROUTE_COLORS[index % DETAIL_ROUTE_COLORS.length],
      base: Math.max(route.passes || 0, 0),
    }));
    const routeWeeklyValues = visibleRoutes.map((route) => {
      const total = Math.max(0, Math.round(route.base));
      const basePerWeek = weekCount ? Math.floor(total / weekCount) : 0;
      const remainder = weekCount ? total % weekCount : 0;
      return Array.from({ length: weekCount }, (_, weekIndex) =>
        basePerWeek + (weekIndex >= weekCount - remainder ? 1 : 0),
      );
    });
    const weeks = Array.from({ length: weekCount }, (_, weekIndex) => {
      const row: Record<string, string | number> = { week: `Tuần ${weekIndex + 1}` };
      visibleRoutes.forEach((route, routeIndex) => {
        row[route.key] = routeWeeklyValues[routeIndex]?.[weekIndex] || 0;
      });
      return row;
    });
    const routeRows = visibleRoutes.map((route) => {
      const values = weeks.map((week) => Number(week[route.key] || 0));
      const total = values.reduce((sum, value) => sum + value, 0);
      const first = values[0] || 0;
      const latest = values[values.length - 1] || 0;
      return {
        ...route,
        total,
        latest,
        trend: latest - first,
      };
    }).sort((a, b) => b.total - a.total);
    const totalUses = routeRows.reduce((sum, route) => sum + route.total, 0);
    const latestWeekTotal = weeks.length
      ? visibleRoutes.reduce((sum, route) => sum + Number(weeks[weeks.length - 1][route.key] || 0), 0)
      : 0;
    const avgPerWeek = weeks.length ? Math.round(totalUses / weeks.length) : 0;
    const strongestRoute = routeRows[0];
    return { routes: visibleRoutes, weeks, routeRows, totalUses, latestWeekTotal, avgPerWeek, strongestRoute };
  }, [detailRange, passesByRoute]);

  const renderMonthlyPassLabel = useCallback((props: any) => {
    const { x, y, width, value, payload } = props;
    if (value == null || !payload) return null;
    return (
      <text
        x={Number(x) + Number(width) / 2}
        y={Number(y) - 10}
        textAnchor="middle"
        className="fill-on-surface text-[13px] font-medium"
      >
        {value} vé · {payload.share}%
      </text>
    );
  }, []);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
          {[
            {
              label: "Sinh viên",
              value: (s?.activeRosterStudents || 0).toLocaleString("vi-VN"),
              icon: GraduationCap,
              accent: "primary" as const,
            },
            {
              label: "Cơ sở",
              value: String(s?.activeCampuses || 0),
              icon: MapPin,
              accent: "success" as const,
            },
            {
              label: "Tuyến bus",
              value: String(s?.activeRoutes || 0),
              icon: FileBarChart,
              accent: "secondary" as const,
            },
            {
              label: "Trợ giá",
              value: ctx.subsidyPolicies.some((p) => p.status === "ACTIVE") ? "Đang áp dụng" : "Chưa có",
              icon: ShieldCheck,
              accent: "warning" as const,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                icon={<Icon className="size-6" />}
                accent={item.accent}
              />
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
                  Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()} · Tổng {monthlyPassRouteChart.total} vé · {monthlyPassRouteChart.routeCount} tuyến có phát sinh
                </p>
              </div>
              <FileBarChart className="size-5 text-on-surface-variant shrink-0" />
            </div>
            <div className="h-56 min-w-0">
              {monthlyPassRouteChart.rows.length === 0 ? (
                <EmptyState icon={<FileBarChart className="size-7" />} title="Chưa có vé tháng nào trong kỳ này" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPassRouteChart.rows} margin={{ top: 34, right: 8, left: -16, bottom: 54 }} barCategoryGap="46%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} opacity={0.5} />
                    <XAxis
                      dataKey="tickLabel"
                      stroke="var(--color-on-surface-variant)"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={58}
                      angle={-18}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="var(--color-on-surface-variant)"
                      fontSize={12}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, monthlyPassRouteChart.yMax]}
                    />
                    <RTooltip
                      cursor={{ fill: "var(--color-surface-container-highest)" }}
                      contentStyle={{
                        background: "#14140f",
                        border: "1px solid #14140f",
                        borderRadius: 12,
                        color: "#beff50",
                        fontSize: 12,
                      }}
                      formatter={(v: any, _name: any, item: any) => [`${v} vé · ${item?.payload?.share || 0}%`, "Vé tháng"]}
                      labelFormatter={(_label: any, payload: readonly any[]) => payload?.[0]?.payload?.name || ""}
                    />
                    <Bar dataKey="passes" radius={[8, 8, 0, 0]} barSize={50} maxBarSize={56}>
                      <LabelList dataKey="passes" content={renderMonthlyPassLabel} />
                      {monthlyPassRouteChart.rows.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
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

      {/* Charts row 2: subsidy config + recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <ScrollReveal className="min-w-0">
          <ExpressiveCard variant="outlined" className="p-5 h-full min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-on-surface">{"Ch\u00ednh s\u00e1ch tr\u1ee3 gi\u00e1"}</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {"C\u1ea5u h\u00ecnh \u0111ang \u00e1p d\u1ee5ng cho v\u00e9 th\u00e1ng c\u1ee7a tr\u01b0\u1eddng"}
                </p>
              </div>
              <M3StatusPill
                label={currentSubsidyPolicy?.status === "ACTIVE" ? "\u0110ang b\u1eadt" : "\u0110\u00e3 t\u1eaft"}
                tone={currentSubsidyPolicy?.status === "ACTIVE" ? "success" : "neutral"}
              />
            </div>

            <div className="mt-6 flex flex-col items-center text-center">
              <div className="relative flex size-36 items-center justify-center rounded-full bg-primary-container">
                <div className="absolute inset-3 rounded-full border-[10px] border-primary/20" />
                <div className="flex size-24 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                  <TicketPercent className="size-10" />
                </div>
              </div>
              <p className="mt-5 text-4xl font-black text-primary">
                {subsidyConfigValueLabel(currentSubsidyPolicy)}
              </p>
              <p className="mt-2 text-sm font-semibold text-on-surface">
                {isPercentageSubsidy(currentSubsidyPolicy) ? "Gi\u1ea3m theo ph\u1ea7n tr\u0103m" : "Gi\u1ea3m theo s\u1ed1 ti\u1ec1n c\u1ed1 \u0111\u1ecbnh"}
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-on-surface-variant">
                {"Sinh vi\u00ean thanh to\u00e1n v\u00e9 th\u00e1ng s\u1ebd \u0111\u01b0\u1ee3c \u00e1p d\u1ee5ng m\u1ee9c tr\u1ee3 gi\u00e1 n\u00e0y khi ch\u00ednh s\u00e1ch \u0111ang b\u1eadt."}
              </p>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="lg:col-span-2 min-w-0">
          <Section
            title={"Giao d\u1ecbch g\u1ea7n \u0111\u00e2y"}
            actions={
              <button onClick={() => onNavigate("uniadm-transactions")} className="text-xs font-bold text-primary">
                {"\u0110\u1ed1i so\u00e1t theo k\u1ef3"}
              </button>
            }
          >
            {ctx.payments.length === 0 ? (
              <EmptyState icon={<Banknote className="size-7" />} title={"Ch\u01b0a c\u00f3 giao d\u1ecbch"} />
            ) : (
              <div className="space-y-2">
                {ctx.payments.slice(0, 5).map((p) => (
                  <ExpressiveCard key={p.orderId} variant="filled" className="p-3 min-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{p.studentName || p.studentCode || "\u2014"}</p>
                        <p className="text-xs text-on-surface-variant truncate">{paymentModeLabel(p)} {"\u00b7"} {paymentJourneyLabel(p)}</p>
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

      <ScrollReveal>
        <div className="border-t border-outline-variant pt-6 min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between min-w-0">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-on-surface">Báo cáo chi tiết</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Xu hướng sử dụng theo từng tuyến</p>
            </div>
            <Select value={detailRange} onValueChange={(value) => setDetailRange(value as "7d" | "30d" | "semester")}>
              <SelectTrigger className="w-full sm:w-44 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 ngày qua</SelectItem>
                <SelectItem value="30d">30 ngày qua</SelectItem>
                <SelectItem value="semester">Học kỳ này</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ExpressiveCard variant="outlined" className="p-5 min-w-0">
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Tổng lượt dùng",
                  value: detailRouteSeries.totalUses.toLocaleString("vi-VN"),
                  hint: "Trong khoảng thời gian đã chọn",
                },
                {
                  label: "Tuyến nổi bật",
                  value: detailRouteSeries.strongestRoute?.name || "Chưa có",
                  hint: `${detailRouteSeries.strongestRoute?.total || 0} lượt dùng`,
                },
                {
                  label: "Trung bình mỗi tuần",
                  value: detailRouteSeries.avgPerWeek.toLocaleString("vi-VN"),
                  hint: "Lượt dùng/tuần",
                },
                {
                  label: "Tuần gần nhất",
                  value: detailRouteSeries.latestWeekTotal.toLocaleString("vi-VN"),
                  hint: "Tổng lượt dùng của tuần cuối kỳ",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-outline-variant bg-surface-container-low p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{item.label}</p>
                  <p className="mt-2 truncate text-2xl font-black text-on-surface">{item.value}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{item.hint}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between min-w-0">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-on-surface">Hiệu suất theo tuyến</h3>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  So sánh lượt dùng xe theo từng tuyến, gom theo tuần trong khoảng thời gian đã chọn.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {detailRouteSeries.routeRows.map((route) => (
                  <div key={route.key} className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                    <span className="size-2.5 rounded-[3px]" style={{ background: route.color }} />
                    <span>{route.name}</span>
                    <span className="font-bold text-on-surface">{route.total}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 overflow-x-auto pb-2">
              <div className="h-72 min-w-[720px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detailRouteSeries.weeks} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} opacity={0.55} />
                    <XAxis dataKey="week" stroke="var(--color-on-surface-variant)" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--color-on-surface-variant)" fontSize={12} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RTooltip
                      cursor={{ fill: "var(--color-surface-container-highest)" }}
                      contentStyle={{
                        background: "#14140f",
                        border: "1px solid #14140f",
                        borderRadius: 12,
                        color: "#beff50",
                        fontSize: 12,
                      }}
                      formatter={(value: any) => [`${value} lượt`, "Lượt dùng"]}
                    />
                    {detailRouteSeries.routes.map((route) => (
                      <Bar key={route.key} dataKey={route.key} name={route.name} fill={route.color} radius={[6, 6, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-[24px] border border-outline-variant">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-2 bg-surface-container-high px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                  <span>Tuyến</span>
                  <span className="text-right">Tổng lượt</span>
                  <span className="text-right">Tỷ trọng</span>
                  <span className="text-right">Xu hướng</span>
                </div>
                <div className="divide-y divide-outline-variant bg-surface">
                  {detailRouteSeries.routeRows.map((route) => {
                    const share = detailRouteSeries.totalUses ? Math.round((route.total / detailRouteSeries.totalUses) * 100) : 0;
                    return (
                      <div key={route.key} className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] items-center gap-2 px-4 py-3 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: route.color }} />
                          <span className="truncate font-semibold text-on-surface">{route.name}</span>
                        </div>
                        <span className="text-right font-bold tabular-nums text-on-surface">{route.total.toLocaleString("vi-VN")}</span>
                        <span className="text-right tabular-nums text-on-surface-variant">{share}%</span>
                        <span className={cn("text-right font-bold tabular-nums", route.trend >= 0 ? "text-success" : "text-error")}>
                          {route.trend >= 0 ? "+" : ""}{route.trend}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ExpressiveCard>
        </div>
      </ScrollReveal>
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
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingCampusId, setDeletingCampusId] = useState<number | null>(null);
  const [campusCode, setCampusCode] = useState("");
  const [campusName, setCampusName] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [campusStatus, setCampusStatus] = useState("ACTIVE");

  const resetCampusForm = () => {
    setCampusCode("");
    setCampusName("");
    setCampusAddress("");
    setCampusStatus("ACTIVE");
  };

  const addCampus = async () => {
    const code = campusCode.trim();
    const name = campusName.trim();
    const address = campusAddress.trim();

    if (!code || !name) {
      toast.error("Vui lòng nhập mã cơ sở và tên cơ sở");
      return;
    }

    setSaving(true);
    try {
      await universityApi.createCampus({
        code,
        name,
        address: address || undefined,
        status: campusStatus,
      });
      toast.success("Đã thêm cơ sở");
      resetCampusForm();
      setAdding(false);
      campusesResource.reload();
      ctx.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thêm cơ sở");
    } finally {
      setSaving(false);
    }
  };

  const deleteCampus = async (campus: CampusView) => {
    if (!window.confirm(`Xóa cơ sở ${campus.name}? Tuyến và chính sách đang trỏ tới cơ sở này sẽ được chuyển về không chọn cơ sở.`)) return;
    setDeletingCampusId(campus.campusId);
    try {
      await universityApi.deleteCampus(campus.campusId);
      toast.success("Đã xóa cơ sở");
      campusesResource.reload();
      ctx.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message.toLowerCase().includes("no static resource")
        ? "Backend đang chạy chưa có API xóa cơ sở. Restart backend rồi thử lại."
        : message || "Không thể xóa cơ sở");
    } finally {
      setDeletingCampusId(null);
    }
  };

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
        <Section
          title={`Cơ sở (${campuses.length})`}
          actions={
            <ExpressiveButton variant="filled" onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Thêm cơ sở
            </ExpressiveButton>
          }
        >
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
                      <ExpressiveButton
                        variant="tonal"
                        size="sm"
                        className="shrink-0"
                        onClick={() => deleteCampus(c)}
                        disabled={deletingCampusId === c.campusId}
                      >
                        {deletingCampusId === c.campusId ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        Xóa
                      </ExpressiveButton>
                    </div>
                  </ExpressiveCard>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </Section>
      </ScrollReveal>

      <Dialog open={adding} onOpenChange={(open) => {
        setAdding(open);
        if (!open) resetCampusForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm cơ sở</DialogTitle>
            <DialogDescription>Thêm cơ sở thuộc trường đang quản lý.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-bold">Mã cơ sở</Label>
                <Input
                  className="mt-1.5"
                  value={campusCode}
                  onChange={(e) => setCampusCode(e.target.value)}
                  placeholder="VD: DTU_MAIN"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Trạng thái</Label>
                <Select value={campusStatus} onValueChange={setCampusStatus}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                    <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
                    <SelectItem value="SUSPENDED">Tạm khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">Tên cơ sở</Label>
              <Input
                className="mt-1.5"
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                placeholder="VD: Cơ sở Nguyễn Văn Linh"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Địa chỉ</Label>
              <Textarea
                className="mt-1.5"
                value={campusAddress}
                onChange={(e) => setCampusAddress(e.target.value)}
                placeholder="VD: 254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setAdding(false)} disabled={saving}>
              Hủy
            </ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={addCampus} disabled={saving}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              Lưu cơ sở
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [deletingDomainId, setDeletingDomainId] = useState<number | null>(null);

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

  const deleteDomain = async (item: DomainView) => {
    if (!window.confirm(`Xóa domain @${item.domain}? Sinh viên dùng domain này sẽ không còn được tự liên kết mới.`)) return;
    setDeletingDomainId(item.domainId);
    try {
      await universityApi.deleteDomain(item.domainId);
      toast.success("Đã xóa domain");
      domainsResource.reload();
      ctx.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message.toLowerCase().includes("no static resource")
        ? "Backend đang chạy chưa có API xóa domain. Restart backend rồi thử lại."
        : message || "Không thể xóa domain");
    } finally {
      setDeletingDomainId(null);
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
                  <ExpressiveButton
                    variant="tonal"
                    size="sm"
                    className="shrink-0"
                    onClick={() => deleteDomain(d)}
                    disabled={deletingDomainId === d.domainId}
                  >
                    {deletingDomainId === d.domainId ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    Xóa
                  </ExpressiveButton>
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
// Screen 4: Students (import + roster)
// =============================================================================
type StudentsTab = "import" | "roster";

function StudentsScreen({
  ctx,
  initialTab,
  importBatchId,
  onSetImportBatch,
  onClearImportBatch,
}: {
  ctx: Ctx;
  initialTab: StudentsTab;
  importBatchId?: number;
  onSetImportBatch: (batchId: number) => void;
  onClearImportBatch: () => void;
}) {
  const [activeTab, setActiveTab] = useState<StudentsTab>(() => {
    if (typeof window === "undefined") return initialTab;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "danh-sach" || tab === "roster") return "roster";
    if (tab === "import") return "import";
    return initialTab;
  });
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [exportingRoster, setExportingRoster] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [committingImport, setCommittingImport] = useState(false);
  const [latestBatch, setLatestBatch] = useState<ImportBatchView | null>(null);
  const [latestPreview, setLatestPreview] = useState<RosterImportPreviewView | null>(null);
  const [latestPlan, setLatestPlan] = useState<RosterImportConfirmView | null>(null);
  const [detailBatch, setDetailBatch] = useState<ImportBatchView | null>(null);
  const [loadingDetailBatch, setLoadingDetailBatch] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const importBatchesResource = useUniAdminImportBatches();
  const importBatches = importBatchesResource.raw || ctx.importBatches;
  const rosterResource = useUniAdminRoster({
    keyword: search || undefined,
    importBatchId,
  });
  const roster = rosterResource.raw || (importBatchId ? [] : ctx.roster);
  const filtered = roster.filter((r) => {
    if (search && !`${r.fullName} ${r.email} ${r.studentCode || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectTab = useCallback((tab: StudentsTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab === "roster" ? "danh-sach" : "import");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const downloadTemplate = useCallback(async () => {
    setDownloadingTemplate(true);
    try {
      const file = await universityApi.rosterTemplate();
      downloadFile(file, "uniadmin-roster-template.xlsx", [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]);
      toast.success("Đã tải template nhập sinh viên.");
    } catch (error) {
      console.error("Failed to download roster template", error);
      toast.error("Không thể tải template XLSX. Vui lòng thử lại.");
    } finally {
      setDownloadingTemplate(false);
    }
  }, []);

  const exportRoster = useCallback(async () => {
    setExportingRoster(true);
    try {
      const file = await universityApi.rosterExportXlsx();
      downloadFile(file, "danh-sach-sinh-vien.xlsx", [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]);
      toast.success("Đã xuất danh sách sinh viên.");
    } catch (error) {
      console.error("Failed to export roster", error);
      toast.error("Không thể tải file. Vui lòng thử lại.");
    } finally {
      setExportingRoster(false);
    }
  }, []);

  const openImportBatchDetail = useCallback(async (batchId: number) => {
    setLoadingDetailBatch(true);
    try {
      const batch = await universityApi.importBatch(batchId);
      setDetailBatch(batch);
    } catch (error) {
      console.error("Failed to load roster import detail", error);
      toast.error("Không thể tải chi tiết lỗi import.");
    } finally {
      setLoadingDetailBatch(false);
    }
  }, []);

  const downloadImportReport = useCallback(async (batchId: number) => {
    setDownloadingReportId(batchId);
    try {
      const file = await universityApi.importBatchReport(batchId);
      downloadFile(file, `bao-cao-import-sinh-vien-${batchId}.xlsx`, [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/octet-stream",
      ]);
      toast.success("Đã tải báo cáo lỗi import.");
    } catch (error) {
      console.error("Failed to download roster import report", error);
      toast.error("Không thể tải báo cáo import.");
    } finally {
      setDownloadingReportId(null);
    }
  }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setLatestBatch(null);
    setLatestPreview(null);
    setLatestPlan(null);
    try {
      try {
        const preview = await universityApi.previewRosterImport(file);
        const plan = await universityApi.confirmRosterImport({ previewToken: preview.previewToken, mode: "ADD_NEW_ONLY" });
        setLatestPreview(preview);
        setLatestPlan(plan);
        if (!plan.canConfirm) {
          toast.error("Không có sinh viên mới hợp lệ để import.");
          return;
        }
        if (plan.canConfirm) {
          toast.success(`Đã kiểm tra file. Có thể import ${plan.importableRows} sinh viên hợp lệ.`);
          return;
        }
        const batch = await universityApi.commitRosterImport({
          previewToken: preview.previewToken,
          mode: "ADD_NEW_ONLY",
          idempotencyKey: preview.previewToken,
        });
        setLatestBatch(batch);
        importBatchesResource.reload();
        ctx.reload();
        toast.success(`Đã import ${batch.successRows} sinh viên mới.`);
      } catch (error) {
        const endpointMissing =
          error instanceof ApiError &&
          error.status === 404 &&
          /roster\/import\/preview|No static resource/i.test(`${error.message} ${error.details || ""}`);
        if (!endpointMissing) throw error;
        const batch = await universityApi.importRoster(file);
        setLatestBatch(batch);
        setLatestPreview(null);
        setLatestPlan(null);
        importBatchesResource.reload();
        ctx.reload();
        toast.warning("Backend hiện tại chưa hỗ trợ bước kiểm tra trước. Hệ thống đã import bằng luồng cũ.");
        toast.success(`Đã import ${batch.successRows} sinh viên mới.`);
      }
    } catch (error) {
      const detail = error instanceof ApiError && error.details ? String(error.details) : null;
      toast.error(detail || (error instanceof Error ? error.message : "Không thể import file"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const confirmImport = async () => {
    if (!latestPreview || !latestPlan) {
      toast.error("Vui lòng chọn file và kiểm tra trước khi import.");
      return;
    }
    if (!latestPlan.canConfirm || latestPlan.importableRows <= 0) {
      toast.error("Không có sinh viên hợp lệ để import.");
      return;
    }
    setCommittingImport(true);
    try {
      const batch = await universityApi.commitRosterImport({
        previewToken: latestPreview.previewToken,
        mode: "ADD_NEW_ONLY",
        idempotencyKey: latestPreview.previewToken,
      });
      setLatestBatch(batch);
      importBatchesResource.reload();
      ctx.reload();
      toast.success(`Đã import ${batch.successRows} sinh viên mới.`);
    } catch (error) {
      const detail = error instanceof ApiError && error.details ? String(error.details) : null;
      toast.error(detail || (error instanceof Error ? error.message : "Không thể xác nhận import"));
    } finally {
      setCommittingImport(false);
    }
  };

  const rosterCount = rosterResource.raw?.length ?? ctx.roster.length;
  const latestPreviewErrors = latestPreview
    ? [...(latestPreview.structuralErrors || []), ...(latestPreview.errors || [])]
    : [];

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Sinh viên"
        description="Nhập dữ liệu và quản lý danh sách sinh viên của trường."
        icon={<Users className="size-7" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <ExpressiveButton variant="tonal" onClick={downloadTemplate} disabled={downloadingTemplate}>
              {downloadingTemplate ? <RefreshCw className="size-4 animate-spin" /> : <Download className="size-4" />}
              Tải template nhập
            </ExpressiveButton>
            <ExpressiveButton variant="tonal" onClick={exportRoster} disabled={exportingRoster}>
              {exportingRoster ? <RefreshCw className="size-4 animate-spin" /> : <Download className="size-4" />}
              Xuất danh sách sinh viên
            </ExpressiveButton>
          </div>
        }
      />

      <div className="overflow-x-auto border-b border-outline-variant">
        <div className="flex min-w-max gap-6">
          <button
            type="button"
            onClick={() => selectTab("import")}
            className={cn(
              "border-b-2 px-1 pb-3 text-sm font-bold transition-colors",
              activeTab === "import" ? "border-primary text-on-surface" : "border-transparent text-on-surface-variant hover:text-on-surface",
            )}
          >
            Nhập dữ liệu
          </button>
          <button
            type="button"
            onClick={() => selectTab("roster")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-bold transition-colors",
              activeTab === "roster" ? "border-primary text-on-surface" : "border-transparent text-on-surface-variant hover:text-on-surface",
            )}
          >
            <span>Danh sách sinh viên</span>
            {rosterCount > 0 && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-[12px] font-bold text-on-surface-variant">
                {rosterCount.toLocaleString("vi-VN")}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className={activeTab === "import" ? "space-y-6" : "hidden"}>
        <ScrollReveal>
          <ExpressiveCard variant="elevated" className="p-8 text-center min-w-0">
            <input ref={fileRef} type="file" accept=".csv,.xlsx" onChange={onFile} className="hidden" />
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileRef.current?.click()}
              className="mx-auto max-w-md border-2 border-dashed border-outline-variant rounded-2xl p-8 cursor-pointer hover:border-primary hover:bg-primary-container/10 transition-colors"
            >
              {uploading ? <RefreshCw className="size-12 mx-auto text-primary animate-spin" /> : <Upload className="size-12 mx-auto text-on-surface-variant" />}
              <p className="mt-4 text-base font-bold">Chọn file để tải lên</p>
              <p className="text-xs text-on-surface-variant mt-1">Hỗ trợ CSV, XLSX. Tối đa 1000 dòng/lần.</p>
              <p className="text-xs text-on-surface-variant mt-2">File cần có Mã sinh viên, Họ và tên và Email sinh viên.</p>
              <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-3 text-left text-xs text-on-surface-variant">
                <p className="font-bold text-on-surface">Quy tắc nhập dữ liệu</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>Không đổi tên header và không thêm dòng ghi chú vào file import.</li>
                  <li>MSSV là bắt buộc, không trùng trong cùng file, nên định dạng Text để giữ số 0 đầu.</li>
                  <li>Email phải thuộc domain đang hoạt động của trường.</li>
                  <li>academicYear là năm nhập học dạng 4 chữ số, ví dụ 2024.</li>
                  <li>Nếu bỏ trống status, hệ thống mặc định là ACTIVE.</li>
                </ul>
              </div>
            </motion.div>
          </ExpressiveCard>
        </ScrollReveal>

        {latestPreview && latestPlan && !latestBatch && (
          <Section title="Kết quả kiểm tra file">
            <ExpressiveCard variant="elevated" className="p-5 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <M3StatusPill label={latestPlan.canConfirm ? "Sẵn sàng import" : "Không thể import"} tone={latestPlan.canConfirm ? "success" : "error"} />
                  <h3 className="mt-2 text-xl font-black truncate">{latestPreview.fileName}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Kiểm tra xong. Chỉ các dòng hợp lệ mới được import vào danh sách sinh viên.
                  </p>
                </div>
                <ExpressiveButton variant="filled" onClick={confirmImport} disabled={!latestPlan.canConfirm || committingImport}>
                  {committingImport ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Xác nhận import {latestPlan.importableRows} sinh viên
                </ExpressiveButton>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="text-xs text-on-surface-variant">Tổng số dòng</p><p className="mt-1 text-xl font-black">{latestPreview.totalRows}</p></div>
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="text-xs text-on-surface-variant">Hợp lệ</p><p className="mt-1 text-xl font-black text-success">{latestPreview.validRows}</p></div>
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="text-xs text-on-surface-variant">Có lỗi</p><p className="mt-1 text-xl font-black text-error">{latestPreview.errorRows}</p></div>
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="text-xs text-on-surface-variant">Có thể import</p><p className="mt-1 text-xl font-black">{latestPlan.importableRows}</p></div>
              </div>
              {latestPlan.warnings.length > 0 && (
                <div className="mt-4 rounded-xl border border-warning/30 bg-warning-container/20 p-3 text-sm text-on-surface-variant">
                  {latestPlan.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                </div>
              )}
              <div className="mt-5 space-y-3">
                <div>
                  <p className="font-bold">Chi tiết dòng lỗi</p>
                  <p className="text-xs text-on-surface-variant">
                    {latestPreviewErrors.length > 0
                      ? "Các dòng này sẽ không được đưa vào danh sách sinh viên."
                      : "Không có dòng lỗi trong file này."}
                  </p>
                </div>
                <ImportPreviewErrorTable errors={latestPreviewErrors} />
                {latestPreview.previewRows.length > 0 && (
                  <>
                    <div className="pt-2">
                      <p className="font-bold">Danh sách dòng kiểm tra</p>
                      <p className="text-xs text-on-surface-variant">Các dòng hợp lệ, bị lỗi hoặc bị bỏ qua trong file vừa tải lên.</p>
                    </div>
                  <ImportPreviewRowsTable preview={latestPreview} />
                  </>
                )}
              </div>
            </ExpressiveCard>
          </Section>
        )}

        {latestBatch && (
          <Section title="Kết quả import">
            <ExpressiveCard variant="elevated" className="p-5 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <M3StatusPill label={importStatusLabel(latestBatch.status)} tone={latestBatch.status === "COMPLETED" ? "success" : latestBatch.status === "FAILED" ? "error" : "warning"} />
                  <h3 className="mt-2 text-xl font-black truncate">{latestBatch.fileName}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">Hoàn tất: {latestBatch.completedAt ? formatDateTime(latestBatch.completedAt) : "Đang xử lý"}</p>
                </div>
                <ExpressiveButton variant="tonal" onClick={() => { onSetImportBatch(latestBatch.importBatchId); selectTab("roster"); }}>
                  <Users className="size-4" />
                  Xem sinh viên vừa import
                </ExpressiveButton>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="text-xs text-on-surface-variant">Tổng số dòng</p><p className="mt-1 text-xl font-black">{latestBatch.totalRows}</p></div>
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="text-xs text-on-surface-variant">Thành công</p><p className="mt-1 text-xl font-black text-success">{latestBatch.successRows}</p></div>
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="text-xs text-on-surface-variant">Lỗi</p><p className="mt-1 text-xl font-black text-error">{latestBatch.errorRows}</p></div>
              </div>
              {latestPlan && (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="text-xs text-on-surface-variant">Tạo mới</p><p className="mt-1 text-xl font-black">{latestPlan.createRows}</p></div>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="text-xs text-on-surface-variant">Đã tồn tại/bỏ qua</p><p className="mt-1 text-xl font-black">{latestPlan.skippedExistingRows}</p></div>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="text-xs text-on-surface-variant">Có thể import</p><p className="mt-1 text-xl font-black">{latestPlan.importableRows}</p></div>
                </div>
              )}
              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">Chi tiết dòng lỗi</p>
                    <p className="text-xs text-on-surface-variant">
                      {latestBatch.errorRows > 0
                        ? "Các dòng này không được đưa vào danh sách sinh viên."
                        : "Không có dòng lỗi trong lượt import này."}
                    </p>
                  </div>
                  {latestBatch.errorRows > 0 && (
                    <ExpressiveButton variant="tonal" onClick={() => downloadImportReport(latestBatch.importBatchId)} disabled={downloadingReportId === latestBatch.importBatchId}>
                      {downloadingReportId === latestBatch.importBatchId ? <RefreshCw className="size-4 animate-spin" /> : <Download className="size-4" />}
                      Tải báo cáo lỗi
                    </ExpressiveButton>
                  )}
                </div>
                <ImportErrorTable errors={latestBatch.errors} />
                {latestPreview?.previewRows?.length ? (
                  <>
                    <div className="pt-2">
                      <p className="font-bold">Danh sách dòng kiểm tra</p>
                      <p className="text-xs text-on-surface-variant">Tổng hợp trạng thái từng dòng trong file import.</p>
                    </div>
                  <ImportPreviewRowsTable preview={latestPreview} />
                  </>
                ) : null}
              </div>
            </ExpressiveCard>
          </Section>
        )}

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
                      <div><p className="text-on-surface-variant">Tổng số dòng</p><p className="font-bold">{b.totalRows}</p></div>
                      <div><p className="text-on-surface-variant">Thành công</p><p className="font-bold text-success">{b.successRows}</p></div>
                      <div><p className="text-on-surface-variant">Lỗi</p><p className="font-bold text-error">{b.errorRows}</p></div>
                    </div>
                    {b.totalRows > 0 && <M3Progress value={(b.successRows / b.totalRows) * 100} className="mt-3" />}
                    {b.errorRows > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ExpressiveButton variant="tonal" size="sm" onClick={() => openImportBatchDetail(b.importBatchId)} disabled={loadingDetailBatch}>
                          {loadingDetailBatch ? <RefreshCw className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                          Xem lỗi
                        </ExpressiveButton>
                        <ExpressiveButton variant="text" size="sm" onClick={() => downloadImportReport(b.importBatchId)} disabled={downloadingReportId === b.importBatchId}>
                          {downloadingReportId === b.importBatchId ? <RefreshCw className="size-4 animate-spin" /> : <Download className="size-4" />}
                          Tải báo cáo lỗi
                        </ExpressiveButton>
                      </div>
                    )}
                  </ExpressiveCard>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </Section>
      </div>

      <div className={activeTab === "roster" ? "space-y-6" : "hidden"}>
        {importBatchId && (
          <ExpressiveCard variant="elevated" className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">Đang xem sinh viên vừa import</p>
                <p className="text-xs text-on-surface-variant">Bộ lọc backend: imported_batch_id = {importBatchId}</p>
              </div>
              <ExpressiveButton variant="tonal" onClick={onClearImportBatch}>Bỏ lọc batch</ExpressiveButton>
            </div>
          </ExpressiveCard>
        )}
        <div className="flex flex-wrap gap-2 min-w-0">
          <div className="relative w-full flex-1 min-w-0 sm:min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
            <Input className="pl-9" placeholder="Tìm theo tên, email, mã SV..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
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
                    <TableCell><M3StatusPill label="Đang học" tone="success" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ExpressiveCard>
        )}
      </div>

      <Dialog open={Boolean(detailBatch)} onOpenChange={(open) => !open && setDetailBatch(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Chi tiết lỗi import</DialogTitle>
            <DialogDescription>
              {detailBatch?.fileName} • {detailBatch?.errorRows || 0} dòng lỗi
            </DialogDescription>
          </DialogHeader>
          <ImportErrorTable errors={detailBatch?.errors} />
          <DialogFooter>
            {detailBatch && (
              <ExpressiveButton variant="tonal" onClick={() => downloadImportReport(detailBatch.importBatchId)} disabled={downloadingReportId === detailBatch.importBatchId}>
                {downloadingReportId === detailBatch.importBatchId ? <RefreshCw className="size-4 animate-spin" /> : <Download className="size-4" />}
                Tải báo cáo lỗi
              </ExpressiveButton>
            )}
            <ExpressiveButton variant="filled" onClick={() => setDetailBatch(null)}>Đóng</ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
// Screen 6: Subsidy policies
// =============================================================================
function SubsidyScreen({ ctx }: { ctx: Ctx }) {
  const currentPolicy = useMemo(
    () => [...ctx.subsidyPolicies].sort((a, b) => b.subsidyPolicyId - a.subsidyPolicyId)[0],
    [ctx.subsidyPolicies],
  );
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [routeSubsidies, setRouteSubsidies] = useState<RouteUniversityView[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [routeSearch, setRouteSearch] = useState("");
  const [routeStatusFilter, setRouteStatusFilter] = useState("all");
  const [updatingRouteId, setUpdatingRouteId] = useState<number | null>(null);
  const [confirmDisableRoute, setConfirmDisableRoute] = useState<RouteUniversityView | null>(null);

  useEffect(() => {
    setValue(currentPolicy ? String(Math.round(Number(currentPolicy.value || 0))) : "");
  }, [currentPolicy]);

  const loadRouteSubsidies = useCallback(async () => {
    setLoadingRoutes(true);
    try {
      setRouteSubsidies(await universityApi.routeSubsidies());
    } catch (error) {
      console.error("Failed to load route subsidies", error);
      toast.error("Không thể tải danh sách tuyến được gán");
    } finally {
      setLoadingRoutes(false);
    }
  }, []);

  useEffect(() => {
    loadRouteSubsidies();
  }, [loadRouteSubsidies]);

  const filteredRouteSubsidies = useMemo(() => {
    const keyword = routeSearch.trim().toLowerCase();
    return routeSubsidies.filter((route) => {
      const routeStatus = (route.routeStatus || "").toUpperCase();
      const assignmentStatus = (route.status || "").toUpperCase();
      if (routeStatusFilter === "active" && !(routeStatus === "ACTIVE" && assignmentStatus === "ACTIVE")) return false;
      if (routeStatusFilter === "inactive" && routeStatus === "ACTIVE" && assignmentStatus === "ACTIVE") return false;
      if (!keyword) return true;
      return `${route.routeCode || ""} ${route.routeName || ""} ${route.routeStartStop || ""} ${route.routeEndStop || ""}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [routeSearch, routeStatusFilter, routeSubsidies]);

  const enabledRoutes = routeSubsidies.filter((route) =>
    route.subsidyEnabled && (route.status || "").toUpperCase() === "ACTIVE" && (route.routeStatus || "").toUpperCase() === "ACTIVE"
  ).length;

  const updateRouteSubsidy = async (route: RouteUniversityView, subsidyEnabled: boolean) => {
    if (!subsidyEnabled) {
      setConfirmDisableRoute(route);
      return;
    }
    setUpdatingRouteId(route.routeUniversityId);
    try {
      const updated = await universityApi.updateRouteSubsidy(route.routeUniversityId, { subsidyEnabled });
      setRouteSubsidies((items) => items.map((item) => item.routeUniversityId === updated.routeUniversityId ? updated : item));
      toast.success("Đã bật áp dụng trợ giá cho tuyến");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật tuyến trợ giá");
    } finally {
      setUpdatingRouteId(null);
    }
  };

  const confirmDisableRouteSubsidy = async () => {
    if (!confirmDisableRoute) return;
    setUpdatingRouteId(confirmDisableRoute.routeUniversityId);
    try {
      const updated = await universityApi.updateRouteSubsidy(confirmDisableRoute.routeUniversityId, { subsidyEnabled: false });
      setRouteSubsidies((items) => items.map((item) => item.routeUniversityId === updated.routeUniversityId ? updated : item));
      toast.success("Đã tắt áp dụng trợ giá cho tuyến");
      setConfirmDisableRoute(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật tuyến trợ giá");
    } finally {
      setUpdatingRouteId(null);
    }
  };

  const saveConfig = async (status?: "ACTIVE" | "INACTIVE", overrideValue?: number) => {
    const rawValue = overrideValue == null ? value : String(overrideValue);
    const numericValue = Number(rawValue);
    if (!rawValue.trim() || Number.isNaN(numericValue) || numericValue < 0) {
      toast.error("Vui lòng nhập mức trợ giá hợp lệ");
      return;
    }
    const nextSubsidyType = currentPolicy ? effectiveSubsidyType(currentPolicy) : "FIXED_AMOUNT";
    if (nextSubsidyType === "PERCENTAGE" && numericValue > 100) {
      toast.error("Phần trăm trợ giá không được vượt quá 100%");
      return;
    }
    const nextStatus = status || (currentPolicy?.status === "ACTIVE" ? "ACTIVE" : "INACTIVE");
    setSaving(true);
    try {
      try {
        await universityApi.updateSubsidyConfig({ value: numericValue, status: nextStatus, subsidyType: nextSubsidyType });
      } catch (error) {
        const missingUpdateEndpoint =
          error instanceof ApiError &&
          error.status === 404 &&
          /subsidy-policy|No static resource/i.test(error.message);
        if (!missingUpdateEndpoint) {
          throw error;
        }
        await universityApi.createSubsidyPolicy({
          policyName: "Cau hinh tro gia ve thang",
          subsidyType: nextSubsidyType,
          value: numericValue,
          status: nextStatus,
        });
      }
      toast.success(nextStatus === "ACTIVE" ? "Đã bật trợ giá" : "Đã cập nhật cấu hình trợ giá");
      setEditing(false);
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể cập nhật trợ giá");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    const currentValue = Math.round(Number(currentPolicy?.value || 0));
    setValue(String(currentValue));
    await saveConfig(currentPolicy?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE", currentValue);
  };

  const isActive = currentPolicy?.status === "ACTIVE";
  const isPercent = isPercentageSubsidy(currentPolicy);

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Chính sách trợ giá"
        description="Một cấu hình trợ giá vé tháng cho sinh viên trong trường."
        icon={<Percent className="size-7" />}
      />

      <ExpressiveCard variant="elevated" className="p-6 max-w-3xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold uppercase text-on-surface-variant">Mức trợ giá vé tháng</p>
              <M3StatusPill label={isActive ? "Đang bật" : "Đã tắt"} tone={isActive ? "success" : "neutral"} />
            </div>
            <p className="mt-3 text-4xl font-black text-primary">
              {subsidyConfigValueLabel(currentPolicy)}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              {isPercent
                ? "Khi b\u1eadt: sinh vi\u00ean \u0111\u01b0\u1ee3c gi\u1ea3m theo t\u1ef7 l\u1ec7 n\u00e0y tr\u00ean gi\u00e1 v\u00e9 th\u00e1ng."
                : "Khi b\u1eadt: sinh vi\u00ean \u0111\u01b0\u1ee3c gi\u1ea3m t\u1ed1i \u0111a m\u1ee9c n\u00e0y nh\u01b0ng kh\u00f4ng v\u01b0\u1ee3t qu\u00e1 gi\u00e1 v\u00e9 th\u00e1ng."}
            </p>
            <p className="mt-3 text-xs text-on-surface-variant">
              Cập nhật gần nhất: {currentPolicy?.updatedAt ? formatDateTime(currentPolicy.updatedAt) : "Chưa có cấu hình"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ExpressiveButton variant="tonal" onClick={() => setEditing(true)} disabled={saving}>
              <Edit className="size-4" />
              Chỉnh sửa mức trợ giá
            </ExpressiveButton>
            <ExpressiveButton variant={isActive ? "outlined" : "filled"} onClick={toggleStatus} disabled={saving}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {isActive ? "Tắt trợ giá" : "Bật trợ giá"}
            </ExpressiveButton>
          </div>
        </div>
      </ExpressiveCard>

      <Section title="Tuyến áp dụng trợ giá" description={`${enabledRoutes}/${routeSubsidies.length} tuyến đang áp dụng`}>
        <ExpressiveCard variant="elevated" className="p-5 min-w-0">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-1">
              <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
              <Input
                className="pl-9"
                value={routeSearch}
                onChange={(event) => setRouteSearch(event.target.value)}
                placeholder="Tìm theo mã tuyến, tên tuyến, điểm đầu/cuối..."
              />
            </div>
            <Select value={routeStatusFilter} onValueChange={setRouteStatusFilter}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tuyến</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm ngừng/không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isActive && (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning-container/20 p-3 text-sm text-on-surface-variant">
              Trợ giá chung của trường đang tắt. Các lựa chọn tuyến được giữ nguyên nhưng chưa có hiệu lực cho giao dịch mới.
            </div>
          )}

          <div className="mt-4">
            {loadingRoutes ? (
              <LoadingScreen label="Đang tải tuyến được gán..." />
            ) : routeSubsidies.length === 0 ? (
              <EmptyState
                icon={<TicketPercent className="size-7" />}
                title="Chưa có tuyến nào được gán cho trường"
                description="Vui lòng liên hệ quản trị viên hệ thống."
              />
            ) : filteredRouteSubsidies.length === 0 ? (
              <EmptyState icon={<TicketPercent className="size-7" />} title="Không có tuyến phù hợp với bộ lọc" />
            ) : (
              <div className="divide-y divide-outline-variant overflow-hidden rounded-xl border border-outline-variant">
                {filteredRouteSubsidies.map((route) => {
                  const routeActive = (route.routeStatus || "").toUpperCase() === "ACTIVE";
                  const assignmentActive = (route.status || "").toUpperCase() === "ACTIVE";
                  const switchDisabled = !isActive || !routeActive || !assignmentActive || updatingRouteId === route.routeUniversityId;
                  return (
                    <div key={route.routeUniversityId} className="flex flex-col gap-3 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono text-xs font-bold">
                            {route.routeCode || `#${route.routeId}`}
                          </span>
                          <p className="font-bold">{route.routeName}</p>
                          <M3StatusPill
                            label={routeActive && assignmentActive ? "Đang hoạt động" : "Tạm ngừng"}
                            tone={routeActive && assignmentActive ? "success" : "warning"}
                          />
                        </div>
                        {(route.routeStartStop || route.routeEndStop) && (
                          <p className="mt-1 text-sm text-on-surface-variant">
                            {[route.routeStartStop, route.routeEndStop].filter(Boolean).join(" – ")}
                          </p>
                        )}
                        {!routeActive && (
                          <p className="mt-1 text-xs font-bold text-warning">Tạm ngừng do tuyến không hoạt động</p>
                        )}
                        {routeActive && !assignmentActive && (
                          <p className="mt-1 text-xs font-bold text-warning">Tạm ngừng do gán tuyến không hoạt động</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <Label htmlFor={`route-subsidy-${route.routeUniversityId}`} className="text-sm font-bold">
                          Áp dụng trợ giá
                        </Label>
                        {updatingRouteId === route.routeUniversityId ? (
                          <RefreshCw className="size-5 animate-spin text-primary" />
                        ) : (
                          <Switch
                            id={`route-subsidy-${route.routeUniversityId}`}
                            checked={Boolean(route.subsidyEnabled)}
                            disabled={switchDisabled}
                            onCheckedChange={(checked) => updateRouteSubsidy(route, checked)}
                            aria-label={`Áp dụng trợ giá cho ${route.routeName}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ExpressiveCard>
      </Section>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa mức trợ giá</DialogTitle>
            <DialogDescription>Mức trợ giá mới chỉ áp dụng cho giao dịch phát sinh sau khi lưu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold">
                {isPercent ? "Ph\u1ea7n tr\u0103m tr\u1ee3 gi\u00e1" : "S\u1ed1 ti\u1ec1n tr\u1ee3 gi\u00e1 c\u1ed1 \u0111\u1ecbnh"}
              </Label>
              <Input
                className="mt-1.5"
                type="number"
                min="0"
                max={isPercent ? "100" : undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={isPercent ? "VD: 50" : "VD: 50000"}
              />
            </div>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setEditing(false)} disabled={saving}>Hủy</ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={() => saveConfig()} disabled={saving}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              Lưu mức trợ giá
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmDisableRoute)} onOpenChange={(open) => !open && setConfirmDisableRoute(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tắt trợ giá cho tuyến?</DialogTitle>
            <DialogDescription>
              Giao dịch mới trên tuyến {confirmDisableRoute?.routeCode || confirmDisableRoute?.routeName} sẽ không còn được trợ giá.
              Các giao dịch đã phát sinh trước đó không bị thay đổi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setConfirmDisableRoute(null)} disabled={updatingRouteId === confirmDisableRoute?.routeUniversityId}>
              Hủy
            </ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={confirmDisableRouteSubsidy} disabled={updatingRouteId === confirmDisableRoute?.routeUniversityId}>
              {updatingRouteId === confirmDisableRoute?.routeUniversityId ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Tắt trợ giá tuyến
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// =============================================================================
// Screen 7: Notify
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const reconciliationResource = useUniAdminReconciliation({
    from: from || undefined,
    to: to || undefined,
  });
  const reconciliation = reconciliationResource.raw || ctx.reconciliation;
  const filteredRows = rows.filter((payment) => {
    if (statusFilter !== "all" && paymentStatusGroup(payment.paymentStatus) !== statusFilter) return false;
    const date = paymentDateKey(payment);
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });
  const paidRows = filteredRows.filter((p) => isSettledPaymentStatus(p.paymentStatus));
  const pendingRows = filteredRows.filter((p) => paymentStatusGroup(p.paymentStatus) === "pending");
  const failedOrCancelledRows = filteredRows.filter((p) => ["failed", "cancelled"].includes(paymentStatusGroup(p.paymentStatus)));
  const financialOriginalTotal = reconciliation?.totalOriginalAmount ?? paidRows.reduce((sum, p) => sum + paymentOriginalAmount(p), 0);
  const financialSubsidyTotal = reconciliation?.totalSubsidyAmount ?? paidRows.reduce((sum, p) => sum + Number(p.subsidyAmount || 0), 0);
  const financialFinalTotal = reconciliation?.totalFinalAmount ?? paidRows.reduce((sum, p) => sum + paymentFinalAmount(p), 0);

  const reload = useCallback(() => {
    reconciliationResource.reload();
    ctx.reload();
  }, [ctx, reconciliationResource]);

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Đối soát và giao dịch"
        description="Tổng hợp trạng thái, tiền vé, trợ giá và số tiền sinh viên đã trả theo khoảng ngày."
        icon={<Banknote className="size-7" />}
      />

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Trạng thái giao dịch</p>
        <div className="grid grid-cols-1 gap-3 min-w-0 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Tổng giao dịch" value={filteredRows.length} icon={<Banknote className="size-5" />} accent="primary" />
          <StatCard label="Đã thanh toán" value={paidRows.length} icon={<CheckCircle2 className="size-5" />} accent="success" />
          <StatCard label="Chờ thanh toán" value={pendingRows.length} icon={<RefreshCw className="size-5" />} accent="secondary" />
          <StatCard label="Lỗi / hủy" value={failedOrCancelledRows.length} icon={<XCircle className="size-5" />} accent="error" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Tổng hợp tài chính</p>
        <div className="grid grid-cols-1 gap-3 min-w-0 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Tổng tiền gốc"
            value={<Counter to={financialOriginalTotal} format={(n) => formatVND(Math.round(n))} />}
            icon={<Banknote className="size-5" />}
            accent="primary"
          />
          <StatCard
            label="Tổng trợ giá"
            value={<Counter to={financialSubsidyTotal} format={(n) => formatVND(Math.round(n))} />}
            icon={<Wallet className="size-5" />}
            accent="success"
          />
          <StatCard
            label="Sinh viên đã trả"
            value={<Counter to={financialFinalTotal} format={(n) => formatVND(Math.round(n))} />}
            icon={<BadgeCheck className="size-5" />}
            accent="secondary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 min-w-0 md:grid-cols-[220px_180px_180px_auto]">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
            <SelectItem value="pending">Chờ thanh toán</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
            <SelectItem value="cancelled">Đã hủy / hoàn tiền</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          onInput={(event) => setFrom(event.currentTarget.value)}
          aria-label="Từ ngày"
        />
        <Input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          onInput={(event) => setTo(event.currentTarget.value)}
          aria-label="Đến ngày"
        />
        <ExpressiveButton variant="tonal" size="icon" onClick={reload} disabled={reconciliationResource.loading}>
          <RefreshCw className={cn("size-4", reconciliationResource.loading && "animate-spin")} />
        </ExpressiveButton>
      </div>

      {reconciliationResource.error && (
        <ExpressiveCard variant="outlined" className="border-error/30 bg-error/5 p-4 text-sm text-error">
          {reconciliationResource.error}
        </ExpressiveCard>
      )}

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={<Banknote className="size-7" />}
          title={rows.length === 0 ? "Chưa có giao dịch" : "Không có giao dịch phù hợp"}
          description={from || to ? `Không có giao dịch trong khoảng ${from ? formatDate(from) : "đầu kỳ"} - ${to ? formatDate(to) : "hiện tại"} với bộ lọc đã chọn.` : undefined}
        />
      ) : (
        <ExpressiveCard variant="elevated" className="overflow-x-auto min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SV</TableHead>
                <TableHead>Loại đơn</TableHead>
                <TableHead>Kỳ vé</TableHead>
                <TableHead>Chặng/Tuyến</TableHead>
                <TableHead className="text-right">Giá gốc</TableHead>
                <TableHead className="text-right">Trợ giá</TableHead>
                <TableHead className="text-right">SV trả</TableHead>
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
