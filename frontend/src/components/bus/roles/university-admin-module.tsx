"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  BarChart3,
  Users,
  Wallet,
  Upload,
  FileSpreadsheet,
  Percent,
  Megaphone,
  FileText,
  MapPin,
  Search,
  MoreVertical,
  Plus,
  Trash2,
  Pencil,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  Building2,
  Globe,
  Download,
  Sparkles,
  GraduationCap,
  Hash,
  Save,
  FileDown,
  ShieldCheck,
  CalendarDays,
  TrendingUp,
  Info,
  School,
  Phone,
  Mail,
  BadgeCheck,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  Section,
  ExpressiveCard,
} from "../primitives";
import {
  ExpressiveButton,
  SegmentedButton,
  StatusPill,
} from "@/components/m3/primitives";
import {
  SplitText,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Magnetic,
  Counter,
  Shimmer,
} from "@/components/m3/motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  universityById,
  universityDomains,
  studentRoster,
  importBatches,
  subsidyPolicies,
  auditLogs,
  routes,
  universityStats,
  calcSubsidy,
  formatVND,
  routeById,
} from "@/lib/mock-data";
import type {
  Campus,
  ImportBatch,
  SubsidyPolicy,
  StudentRosterEntry,
  UniversityDomain,
} from "@/lib/types";

const UNI_ID = "uni1";

// ============================================================
// Main switch
// ============================================================
export function UniversityAdminModule({
  activeId,
  onNavigate,
}: {
  activeId: string;
  onNavigate: (id: string) => void;
}) {
  switch (activeId) {
    case "uniadm-dashboard":
      return <DashboardScreen onNavigate={onNavigate} />;
    case "uniadm-info":
      return <InfoScreen />;
    case "uniadm-domains":
      return <DomainsScreen />;
    case "uniadm-import":
      return <ImportScreen />;
    case "uniadm-roster":
      return <RosterScreen />;
    case "uniadm-subsidy":
      return <SubsidyScreen />;
    case "uniadm-stats":
      return <StatsScreen />;
    case "uniadm-notify":
      return <NotifyScreen />;
    case "uniadm-recon":
      return <ReconScreen />;
    default:
      return null;
  }
}

// ============================================================
// Shared helpers
// ============================================================
function useUniversity() {
  return useMemo(() => universityById(UNI_ID)!, []);
}
function useUniStats() {
  return useMemo(
    () => universityStats.find((s) => s.universityId === UNI_ID)!,
    []
  );
}

function RosterStatusPill({ status }: { status: StudentRosterEntry["status"] }) {
  const map: Record<StudentRosterEntry["status"], { tone: any; label: string }> = {
    ACTIVE: { tone: "success", label: "Đang học" },
    INACTIVE: { tone: "neutral", label: "Không hoạt động" },
    GRADUATED: { tone: "tertiary", label: "Đã tốt nghiệp" },
    SUSPENDED: { tone: "error", label: "Bị đình chỉ" },
  };
  const m = map[status];
  return <StatusPill label={m.label} tone={m.tone} />;
}

function ImportStatusPill({ status }: { status: ImportBatch["status"] }) {
  const map: Record<ImportBatch["status"], { tone: any; label: string }> = {
    completed: { tone: "success", label: "Hoàn tất" },
    processing: { tone: "warning", label: "Đang xử lý" },
    failed: { tone: "error", label: "Thất bại" },
  };
  const m = map[status];
  return <StatusPill label={m.label} tone={m.tone} />;
}

function SubsidyStatusPill({ status }: { status: SubsidyPolicy["status"] }) {
  const map: Record<SubsidyPolicy["status"], { tone: any; label: string }> = {
    active: { tone: "success", label: "Đang áp dụng" },
    expired: { tone: "neutral", label: "Đã hết hạn" },
    draft: { tone: "warning", label: "Bản nháp" },
  };
  const m = map[status];
  return <StatusPill label={m.label} tone={m.tone} />;
}

function DomainStatusPill({ status }: { status: UniversityDomain["status"] }) {
  const map: Record<UniversityDomain["status"], { tone: any; label: string }> = {
    active: { tone: "success", label: "Đang dùng" },
    locked: { tone: "error", label: "Đã khóa" },
  };
  const m = map[status];
  return <StatusPill label={m.label} tone={m.tone} />;
}

function RouteDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-2.5 rounded-full"
      style={{ background: color }}
    />
  );
}

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 text-on-surface-variant">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <div className="text-sm font-medium text-on-surface mt-0.5 break-words">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 1: uniadm-dashboard — Tổng quan trường (HERO)
// ============================================================
function DashboardScreen({ onNavigate }: { onNavigate: (id: string) => void }) {
  const uni = useUniversity();
  const stats = useUniStats();
  const logs = useMemo(
    () => auditLogs.filter((l) => l.university === "Duy Tân").slice(0, 5),
    []
  );

  // Perk palette — bold, no pale tints
  const passesByRoute = [
    { name: "DN-01", passes: 218, fill: "#beff50" },
    { name: "DN-02", passes: 102, fill: "#144fcc" },
    { name: "DN-03", passes: 92, fill: "#ff8c5f" },
  ];

  const tripsLast7 = [
    { day: "T2", trips: 1120 },
    { day: "T3", trips: 1245 },
    { day: "T4", trips: 1180 },
    { day: "T5", trips: 1310 },
    { day: "T6", trips: 1280 },
    { day: "T7", trips: 760 },
    { day: "CN", trips: 525 },
  ];

  const quickActions = [
    { id: "uniadm-domains", label: "Quản lý domain", desc: "duytan.edu.vn", icon: Globe, accent: "primary" as const },
    { id: "uniadm-import", label: "Import sinh viên", desc: "Danh sách SV", icon: Upload, accent: "tertiary" as const },
    { id: "uniadm-subsidy", label: "Chính sách trợ giá", desc: "30% vé tháng", icon: Percent, accent: "secondary" as const },
    { id: "uniadm-notify", label: "Gửi thông báo", desc: "Toàn trường", icon: Megaphone, accent: "error" as const },
  ];

  return (
    <div className="space-y-8">
      <SplitText
        text="Quản lý trường Duy Tân"
        className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface block"
      />

      {/* Hero card */}
      <ScrollReveal>
        <ExpressiveCard variant="elevated" className="overflow-hidden">
          <div
            className="p-6 sm:p-8 relative"
            style={{
              background: `linear-gradient(135deg, ${uni.color}, ${uni.color}cc 70%, ${uni.color}99)`,
            }}
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/30 blur-3xl" />
              <div className="absolute -left-10 bottom-0 size-40 rounded-full bg-black/10 blur-3xl" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="size-20 rounded-2xl bg-white p-2 flex items-center justify-center shrink-0 ring-1 ring-white/30">
                {uni.logoUrl ? (
                  <img src={uni.logoUrl} alt={`Logo ${uni.shortName}`} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: uni.color }}>{uni.logo}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white/80 text-xs font-medium uppercase tracking-wide">
                    {uni.code} · Đà Nẵng
                  </span>
                  <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur">
                    <BadgeCheck className="size-3.5" />
                    Đối tác chính thức
                  </span>
                </div>
                <h2 className="mt-1 text-white text-2xl sm:text-3xl font-bold leading-tight">
                  {uni.name}
                </h2>
                <div className="mt-3 flex flex-wrap gap-4 text-white/95 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="size-4" />
                    {uni.studentCount.toLocaleString("vi-VN")} sinh viên
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {uni.campuses.length} cơ sở
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BarChart3 className="size-4" />
                    {uni.routeCount} tuyến bus
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-4" />
                    {uni.subsidyActive ? "Đang trợ giá" : "Chưa trợ giá"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Stat cards */}
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Sinh viên đang hoạt động"
            value={<Counter to={stats.activeStudents} />}
            icon={<Users className="size-6" />}
            hint="Tăng 32 so với tháng trước"
            trend="up"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Vé tháng tháng này"
            value={<Counter to={stats.monthlyPasses} />}
            icon={<FileSpreadsheet className="size-6" />}
            hint="Đạt 34,8% sinh viên"
            trend="up"
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tuyến đông nhất"
            value={<span className="text-2xl">{stats.topRoute}</span>}
            icon={<BarChart3 className="size-6" />}
            hint="218 vé tháng / 4.120 lượt"
            accent="secondary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tổng trợ giá tháng"
            value={
              <Counter
                to={stats.totalSubsidy}
                format={(n) => Math.round(n).toLocaleString("vi-VN") + " đ"}
              />
            }
            icon={<Wallet className="size-6" />}
            hint="Trợ giá 30% vé tháng"
            trend="up"
            accent="success"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Charts + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScrollReveal className="lg:col-span-2">
          <ExpressiveCard variant="outlined" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-on-surface">
                  Vé tháng theo tuyến
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Tháng 09/2025 · Tổng {stats.monthlyPasses} vé
                </p>
              </div>
              <BarChart3 className="size-5 text-on-surface-variant" />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={passesByRoute} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--m3-outline-variant)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--m3-on-surface-variant)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--m3-on-surface-variant)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RTooltip
                    cursor={{ fill: "var(--m3-surface-container-highest)" }}
                    contentStyle={{
                      background: "var(--m3-surface-container-high)",
                      border: "1px solid var(--m3-outline-variant)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
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

        <ScrollReveal delay={0.1}>
          <ExpressiveCard variant="outlined" className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface">Lượt dùng xe 7 ngày</h3>
              <TrendingUp className="size-5 text-success" />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tripsLast7} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--m3-outline-variant)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "var(--m3-on-surface-variant)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--m3-on-surface-variant)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RTooltip
                    contentStyle={{
                      background: "var(--m3-surface-container-high)",
                      border: "1px solid var(--m3-outline-variant)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
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

      {/* Activity feed + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScrollReveal className="lg:col-span-2">
          <Section title="Hoạt động gần đây" description="Nhật ký thao tác trên dữ liệu trường Duy Tân">
            <ExpressiveCard variant="outlined" className="p-2">
              <StaggerGroup className="divide-y divide-outline-variant/60">
                {logs.map((log) => (
                  <StaggerItem key={log.id}>
                    <div className="flex items-start gap-3 px-3 py-3.5">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full",
                          log.result === "success"
                            ? "bg-success-container text-on-surface"
                            : "bg-error-container text-on-error-container"
                        )}
                      >
                        {log.result === "success" ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <XCircle className="size-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface">
                          {log.action}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                          {log.target}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                          <Clock className="size-3" />
                          {log.timestamp}
                          <span>·</span>
                          <span>{log.actor}</span>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </ExpressiveCard>
          </Section>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Section title="Truy cập nhanh">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((q) => (
                <Magnetic key={q.id} strength={0.18}>
                  <button
                    onClick={() => onNavigate(q.id)}
                    className="state-layer w-full h-full text-left rounded-2xl bg-surface-container-low border border-outline-variant/50 p-4 elev-1 transition-shadow hover:elev-3 flex flex-col gap-2.5"
                  >
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl",
                        q.accent === "primary" && "bg-primary-container text-on-primary-container",
                        q.accent === "tertiary" && "bg-tertiary-container text-on-tertiary-container",
                        q.accent === "secondary" && "bg-secondary-container text-on-secondary-container",
                        q.accent === "error" && "bg-error-container text-on-error-container"
                      )}
                    >
                      <q.icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface leading-tight min-w-0 truncate">
                        {q.label}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5 min-w-0 truncate">
                        {q.desc}
                      </p>
                    </div>
                  </button>
                </Magnetic>
              ))}
            </div>
          </Section>
        </ScrollReveal>
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 2: uniadm-info — Thông tin trường & campus
// ============================================================
function InfoScreen() {
  const uni = useUniversity();
  const [editMode, setEditMode] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>(uni.campuses);
  const [addOpen, setAddOpen] = useState(false);
  const [editCampus, setEditCampus] = useState<Campus | null>(null);
  const [deleteCampus, setDeleteCampus] = useState<Campus | null>(null);

  // Edit form state
  const [form, setForm] = useState({
    name: uni.name,
    shortName: uni.shortName,
    code: uni.code,
    contactEmail: uni.contactEmail,
    phone: uni.phone,
    address: uni.address,
    status: uni.status,
  });

  // New campus form
  const [newCampus, setNewCampus] = useState({
    code: "",
    name: "",
    address: "",
    lat: "",
    lng: "",
  });

  const handleSaveInfo = () => {
    toast.success("Đã cập nhật thông tin trường Duy Tân", {
      description: "Thay đổi sẽ hiển thị sau khi được System Admin phê duyệt.",
    });
    setEditMode(false);
  };

  const handleAddCampus = () => {
    if (!newCampus.code || !newCampus.name) {
      toast.error("Vui lòng nhập mã và tên cơ sở");
      return;
    }
    const c: Campus = {
      id: `c${Date.now()}`,
      universityId: UNI_ID,
      code: newCampus.code,
      name: newCampus.name,
      address: newCampus.address || "—",
      lat: parseFloat(newCampus.lat) || 0,
      lng: parseFloat(newCampus.lng) || 0,
      status: "active",
    };
    setCampuses((prev) => [...prev, c]);
    toast.success(`Đã thêm cơ sở "${c.name}"`);
    setNewCampus({ code: "", name: "", address: "", lat: "", lng: "" });
    setAddOpen(false);
  };

  const handleDeleteCampus = () => {
    if (!deleteCampus) return;
    setCampuses((prev) => prev.filter((c) => c.id !== deleteCampus.id));
    toast.success(`Đã xóa cơ sở "${deleteCampus.name}"`);
    setDeleteCampus(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Thông tin trường & cơ sở"
        description="Quản lý hồ sơ trường và danh sách cơ sở vật chất"
        icon={<School className="size-7" />}
        actions={
          editMode ? (
            <div className="flex gap-2">
              <ExpressiveButton variant="text" onClick={() => setEditMode(false)}>
                Hủy
              </ExpressiveButton>
              <Magnetic strength={0.2}>
                <ExpressiveButton variant="filled" onClick={handleSaveInfo}>
                  <Save className="size-4" />
                  Lưu thay đổi
                </ExpressiveButton>
              </Magnetic>
            </div>
          ) : (
            <ExpressiveButton variant="tonal" onClick={() => setEditMode(true)}>
              <Pencil className="size-4" />
              Chỉnh sửa
            </ExpressiveButton>
          )
        }
      />

      {/* University info card */}
      <ScrollReveal>
        <ExpressiveCard variant="outlined" className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div
              className="size-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0 elev-2"
              style={{ background: uni.color }}
            >
              {uni.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-on-surface">{uni.name}</h3>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Mã trường: {uni.code} · Đã tham gia 2023
              </p>
              <div className="mt-2 flex items-center gap-2">
                <StatusPill
                  label={form.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
                  tone={form.status === "active" ? "success" : "warning"}
                />
                {uni.subsidyActive && (
                  <StatusPill label="Đã bật trợ giá" tone="primary" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            {editMode ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-on-surface-variant">Tên đầy đủ</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-on-surface-variant">Tên viết tắt</Label>
                  <Input
                    value={form.shortName}
                    onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-on-surface-variant">Mã trường</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-on-surface-variant">Email liên hệ</Label>
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-on-surface-variant">Điện thoại</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-on-surface-variant">Trạng thái</Label>
                  <div className="flex items-center gap-3 h-10 px-3 rounded-xl border border-outline-variant">
                    <Switch
                      checked={form.status === "active"}
                      onCheckedChange={(v) =>
                        setForm({ ...form, status: v ? "active" : "inactive" })
                      }
                    />
                    <span className="text-sm text-on-surface">
                      {form.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
                    </span>
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-on-surface-variant">Địa chỉ</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <FieldRow icon={<Hash className="size-4" />} label="Tên viết tắt">
                  {uni.shortName}
                </FieldRow>
                <FieldRow icon={<Hash className="size-4" />} label="Mã trường">
                  {uni.code}
                </FieldRow>
                <FieldRow icon={<Mail className="size-4" />} label="Email liên hệ">
                  {uni.contactEmail}
                </FieldRow>
                <FieldRow icon={<Phone className="size-4" />} label="Điện thoại">
                  {uni.phone}
                </FieldRow>
                <div className="sm:col-span-2">
                  <FieldRow icon={<MapPin className="size-4" />} label="Địa chỉ trụ sở">
                    {uni.address}
                  </FieldRow>
                </div>
              </>
            )}
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Campuses */}
      <ScrollReveal delay={0.05}>
        <Section
          title="Cơ sở vật chất"
          description={`${campuses.length} cơ sở trực thuộc trường`}
          actions={
            <ExpressiveButton variant="tonal" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Thêm cơ sở
            </ExpressiveButton>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campuses.map((c) => (
              <ExpressiveCard key={c.id} variant="outlined" className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-11 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface-variant">{c.code}</p>
                      <h4 className="text-base font-semibold text-on-surface leading-tight truncate">
                        {c.name}
                      </h4>
                    </div>
                  </div>
                  <StatusPill
                    label={c.status === "active" ? "Hoạt động" : "Tạm dừng"}
                    tone={c.status === "active" ? "success" : "neutral"}
                  />
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="flex items-start gap-2 text-on-surface-variant">
                    <MapPin className="size-4 mt-0.5 shrink-0" />
                    <span className="text-on-surface">{c.address}</span>
                  </p>
                  <p className="flex items-center gap-2 text-on-surface-variant">
                    <Hash className="size-4 shrink-0" />
                    <span className="text-on-surface">
                      {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-outline-variant/60">
                  <ExpressiveButton
                    variant="text"
                    size="sm"
                    onClick={() => setEditCampus(c)}
                  >
                    <Pencil className="size-4" />
                    Sửa
                  </ExpressiveButton>
                  <ExpressiveButton
                    variant="text"
                    size="sm"
                    className="text-error"
                    onClick={() => setDeleteCampus(c)}
                  >
                    <Trash2 className="size-4" />
                    Xóa
                  </ExpressiveButton>
                </div>
              </ExpressiveCard>
            ))}
          </div>
        </Section>
      </ScrollReveal>

      {/* Add campus dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Thêm cơ sở mới</DialogTitle>
            <DialogDescription>
              Bổ sung cơ sở trực thuộc trường Duy Tân.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Mã cơ sở</Label>
                <Input
                  placeholder="VD: DTU-3"
                  value={newCampus.code}
                  onChange={(e) => setNewCampus({ ...newCampus, code: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tên cơ sở</Label>
                <Input
                  placeholder="VD: Cơ sở Hòa Khánh"
                  value={newCampus.name}
                  onChange={(e) => setNewCampus({ ...newCampus, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Địa chỉ</Label>
              <Input
                placeholder="Số nhà, đường, quận, Đà Nẵng"
                value={newCampus.address}
                onChange={(e) => setNewCampus({ ...newCampus, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Vĩ độ (lat)</Label>
                <Input
                  placeholder="16.0744"
                  value={newCampus.lat}
                  onChange={(e) => setNewCampus({ ...newCampus, lat: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Kinh độ (lng)</Label>
                <Input
                  placeholder="108.1522"
                  value={newCampus.lng}
                  onChange={(e) => setNewCampus({ ...newCampus, lng: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setAddOpen(false)}>
              Hủy
            </ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={handleAddCampus}>
              <Plus className="size-4" />
              Thêm cơ sở
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit campus dialog */}
      <Dialog
        open={!!editCampus}
        onOpenChange={(o) => !o && setEditCampus(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa cơ sở</DialogTitle>
            <DialogDescription>Cập nhật thông tin cơ sở.</DialogDescription>
          </DialogHeader>
          {editCampus && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Mã cơ sở</Label>
                  <Input
                    defaultValue={editCampus.code}
                    onChange={(e) =>
                      setEditCampus({ ...editCampus, code: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tên cơ sở</Label>
                  <Input
                    defaultValue={editCampus.name}
                    onChange={(e) =>
                      setEditCampus({ ...editCampus, name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Địa chỉ</Label>
                <Input
                  defaultValue={editCampus.address}
                  onChange={(e) =>
                    setEditCampus({ ...editCampus, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Vĩ độ</Label>
                  <Input
                    defaultValue={String(editCampus.lat)}
                    onChange={(e) =>
                      setEditCampus({
                        ...editCampus,
                        lat: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Kinh độ</Label>
                  <Input
                    defaultValue={String(editCampus.lng)}
                    onChange={(e) =>
                      setEditCampus({
                        ...editCampus,
                        lng: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setEditCampus(null)}>
              Hủy
            </ExpressiveButton>
            <ExpressiveButton
              variant="filled"
              onClick={() => {
                if (editCampus) {
                  setCampuses((prev) =>
                    prev.map((c) => (c.id === editCampus.id ? editCampus : c))
                  );
                  toast.success(`Đã cập nhật cơ sở "${editCampus.name}"`);
                  setEditCampus(null);
                }
              }}
            >
              <Save className="size-4" />
              Lưu
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete campus alert */}
      <AlertDialog
        open={!!deleteCampus}
        onOpenChange={(o) => !o && setDeleteCampus(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cơ sở này?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCampus && (
                <>
                  Hành động sẽ xóa cơ sở{" "}
                  <strong className="text-on-surface">{deleteCampus.name}</strong>{" "}
                  ({deleteCampus.code}). Bạn không thể hoàn tác.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-on-error rounded-full hover:bg-error/90"
              onClick={handleDeleteCampus}
            >
              Xóa cơ sở
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// SCREEN 3: uniadm-domains — Domain email
// ============================================================
function DomainsScreen() {
  const uni = useUniversity();
  const [domains, setDomains] = useState<UniversityDomain[]>(
    universityDomains.filter((d) => d.universityId === UNI_ID)
  );
  const [addOpen, setAddOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [deleteDomain, setDeleteDomain] = useState<UniversityDomain | null>(null);

  const handleAddDomain = () => {
    const trimmed = newDomain.trim().toLowerCase();
    const valid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(trimmed);
    if (!valid) {
      toast.error("Domain không hợp lệ", {
        description: "Vui lòng nhập đúng định dạng VD: st.duytan.edu.vn",
      });
      return;
    }
    if (domains.some((d) => d.domain === trimmed)) {
      toast.error("Domain đã tồn tại trong hệ thống");
      return;
    }
    const d: UniversityDomain = {
      id: `d${Date.now()}`,
      universityId: UNI_ID,
      domain: trimmed,
      status: "active",
      addedAt: new Date().toISOString().slice(0, 10),
    };
    setDomains((prev) => [...prev, d]);
    toast.success(`Đã thêm domain ${trimmed}`);
    setNewDomain("");
    setAddOpen(false);
  };

  const toggleDomainStatus = (id: string) => {
    setDomains((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: d.status === "active" ? "locked" : "active",
            }
          : d
      )
    );
    const target = domains.find((d) => d.id === id);
    if (target) {
      toast.success(
        target.status === "active"
          ? `Đã khóa domain ${target.domain}`
          : `Đã mở khóa domain ${target.domain}`
      );
    }
  };

  const handleDelete = () => {
    if (!deleteDomain) return;
    setDomains((prev) => prev.filter((d) => d.id !== deleteDomain.id));
    toast.success(`Đã xóa domain ${deleteDomain.domain}`);
    setDeleteDomain(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Domain email"
        description="Quản lý tên miền email dùng để tự nhận diện sinh viên"
        icon={<Globe className="size-7" />}
        actions={
          <ExpressiveButton variant="filled" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Thêm domain
          </ExpressiveButton>
        }
      />

      {/* Intro card */}
      <ScrollReveal>
        <ExpressiveCard variant="outlined" className="p-5 bg-surface-container-low">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
              <Info className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-on-surface">
                Domain email dùng để tự nhận diện sinh viên khi đăng nhập Google
              </h3>
              <p className="text-sm text-on-surface-variant mt-1.5">
                Khi sinh viên đăng nhập Google với email{" "}
                <code className="px-1.5 py-0.5 rounded-md bg-surface-container-highest text-on-surface text-xs">
                  @duytan.edu.vn
                </code>
                , hệ thống tự gắn họ vào trường{" "}
                <strong className="text-on-surface">{uni.name}</strong> và áp dụng
                chính sách trợ giá tương ứng.
              </p>
            </div>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Domains table */}
      <ScrollReveal delay={0.05}>
        <ExpressiveCard variant="outlined" className="overflow-hidden">
          <div className="max-h-96 overflow-y-auto scrollbar-soft">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
                <TableRow className="hover:bg-transparent border-outline-variant">
                  <TableHead className="text-on-surface-variant">Domain</TableHead>
                  <TableHead className="text-on-surface-variant">Trạng thái</TableHead>
                  <TableHead className="text-on-surface-variant">Ngày thêm</TableHead>
                  <TableHead className="text-on-surface-variant text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((d) => (
                  <TableRow
                    key={d.id}
                    className="border-outline-variant/60 hover:bg-surface-container-lowest"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
                          <Mail className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">
                            {d.domain}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">
                            @{d.domain.split(".")[0]}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DomainStatusPill status={d.status} />
                    </TableCell>
                    <TableCell className="text-sm text-on-surface-variant">
                      {d.addedAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={d.status === "active"}
                            onCheckedChange={() => toggleDomainStatus(d.id)}
                          />
                          <span className="text-xs text-on-surface-variant w-8">
                            {d.status === "active" ? "Mở" : "Khóa"}
                          </span>
                        </div>
                        <ExpressiveButton
                          variant="text"
                          size="icon-sm"
                          className="text-error"
                          onClick={() => setDeleteDomain(d)}
                        >
                          <Trash2 className="size-4" />
                        </ExpressiveButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Add domain dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Thêm domain email</DialogTitle>
            <DialogDescription>
              Domain sẽ được dùng để nhận diện sinh viên đăng nhập Google.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Tên domain</Label>
            <Input
              placeholder="VD: alumni.duytan.edu.vn"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
            <p className="text-xs text-on-surface-variant mt-1.5">
              Định dạng: miền.tld (VD: duytan.edu.vn). Không cần ký tự @.
            </p>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setAddOpen(false)}>
              Hủy
            </ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={handleAddDomain}>
              <Plus className="size-4" />
              Thêm domain
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteDomain}
        onOpenChange={(o) => !o && setDeleteDomain(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa domain này?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDomain && (
                <>
                  Sinh viên đăng nhập bằng email{" "}
                  <code className="px-1 py-0.5 rounded bg-surface-container-highest text-on-surface">
                    @{deleteDomain.domain}
                  </code>{" "}
                  sẽ không còn được tự động gắn vào trường Duy Tân.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-on-error rounded-full hover:bg-error/90"
              onClick={handleDelete}
            >
              Xóa domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// SCREEN 4: uniadm-import — Import danh sách sinh viên
// ============================================================
const IMPORT_ERRORS_IB1 = [
  { row: 145, studentCode: "SE20ABC", email: "invalid-email", reason: "Email không hợp lệ" },
  { row: 412, studentCode: "IT21B05", email: "lanlt@duytan.edu.vn", reason: "Trùng mã sinh viên đã có" },
  { row: 891, studentCode: "—", email: "student@duytan.edu.vn", reason: "Thiếu mã sinh viên" },
];

function ImportScreen() {
  const batches = useMemo(
    () => importBatches.filter((b) => b.universityId === UNI_ID),
    []
  );
  const [errorDialog, setErrorDialog] = useState<ImportBatch | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadClick = () => {
    setUploading(true);
    toast.info("Đang tải file lên...", {
      description: "ds_sinhvien_hk2_2526.csv · 1.2 MB",
    });
    setTimeout(() => {
      setUploading(false);
      toast.success("Đã tải file lên, đang xử lý", {
        description: "Bạn sẽ nhận được thông báo khi import xong.",
      });
    }, 1400);
  };

  const downloadTemplate = () => {
    toast.success("Đã tải template CSV", {
      description: "File ds_sinhvien_template.csv",
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Import danh sách sinh viên"
        description="Tải lên CSV/XLSX để cập nhật danh sách sinh viên trường Duy Tân"
        icon={<Upload className="size-7" />}
      />

      {/* Upload zone */}
      <ScrollReveal>
        <ExpressiveCard variant="outlined" className="p-6">
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className={cn(
              "state-layer relative w-full rounded-2xl border-2 border-dashed border-outline p-10 sm:p-14 flex flex-col items-center justify-center text-center transition-colors",
              uploading ? "bg-surface-container-lowest" : "hover:bg-surface-container-lowest"
            )}
          >
            {uploading ? (
              <>
                <div className="size-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
                  <Shimmer className="size-14 rounded-2xl opacity-60" />
                </div>
                <p className="mt-4 text-base font-medium text-on-surface">
                  Đang tải file lên...
                </p>
                <p className="text-sm text-on-surface-variant mt-1">
                  Vui lòng đợi trong giây lát
                </p>
              </>
            ) : (
              <>
                <div className="size-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
                  <FileSpreadsheet className="size-7" />
                </div>
                <p className="mt-4 text-base font-medium text-on-surface">
                  Kéo thả file CSV/XLSX hoặc chọn file
                </p>
                <p className="text-sm text-on-surface-variant mt-1 max-w-sm">
                  Hỗ trợ CSV, XLSX. Tối đa 5MB · 5.000 dòng mỗi lần tải
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <ExpressiveButton variant="filled" type="button">
                    <Upload className="size-4" />
                    Chọn file
                  </ExpressiveButton>
                  <ExpressiveButton variant="text" type="button" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
                    <Download className="size-4" />
                    Tải template CSV
                  </ExpressiveButton>
                </div>
              </>
            )}
          </button>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Import history */}
      <ScrollReveal delay={0.05}>
        <Section
          title="Lịch sử import"
          description={`${batches.length} lần tải lên gần nhất`}
        >
          <ExpressiveCard variant="outlined" className="overflow-hidden">
            <div className="max-h-96 overflow-y-auto scrollbar-soft">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
                  <TableRow className="hover:bg-transparent border-outline-variant">
                    <TableHead className="text-on-surface-variant">File</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Tổng</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Thành công</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Lỗi</TableHead>
                    <TableHead className="text-on-surface-variant">Trạng thái</TableHead>
                    <TableHead className="text-on-surface-variant">Thời gian</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow
                      key={b.id}
                      className="border-outline-variant/60 hover:bg-surface-container-lowest"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="size-4" />
                          </div>
                          <p className="text-sm font-medium text-on-surface truncate max-w-[200px]">
                            {b.fileName}
                          </p>
                        </div>
                        {b.status === "processing" && (
                          <div className="mt-2 w-48">
                            <Shimmer className="h-1.5 rounded-full" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-on-surface tabular-nums">
                        {b.totalRows.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right text-sm text-success tabular-nums">
                        {b.successRows.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {b.errorRows > 0 ? (
                          <span className="text-error">{b.errorRows}</span>
                        ) : (
                          <span className="text-on-surface-variant">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ImportStatusPill status={b.status} />
                      </TableCell>
                      <TableCell className="text-xs text-on-surface-variant">
                        {b.importedAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <ExpressiveButton
                          variant="text"
                          size="sm"
                          onClick={() => setErrorDialog(b)}
                          disabled={b.errorRows === 0 && b.status !== "processing"}
                        >
                          <Eye className="size-4" />
                          Chi tiết
                        </ExpressiveButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ExpressiveCard>
        </Section>
      </ScrollReveal>

      {/* Error details dialog */}
      <Dialog
        open={!!errorDialog}
        onOpenChange={(o) => !o && setErrorDialog(null)}
      >
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết import</DialogTitle>
            <DialogDescription>
              {errorDialog && (
                <>
                  File <strong>{errorDialog.fileName}</strong> · {errorDialog.totalRows.toLocaleString("vi-VN")} dòng · {errorDialog.errorRows} lỗi
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {errorDialog?.status === "processing" ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <Shimmer className="size-16 rounded-2xl" />
              <p className="text-sm text-on-surface-variant">
                File đang được xử lý, vui lòng quay lại sau.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-warning-container text-[#14140f]">
                <AlertTriangle className="size-5 shrink-0" />
                <p className="text-sm font-medium">
                  {IMPORT_ERRORS_IB1.length} dòng lỗi cần kiểm tra lại trước khi đưa vào hệ thống.
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto scrollbar-soft rounded-xl border border-outline-variant">
                <Table>
                  <TableHeader className="sticky top-0 bg-surface-container-high">
                    <TableRow className="hover:bg-transparent border-outline-variant">
                      <TableHead className="text-on-surface-variant">Dòng</TableHead>
                      <TableHead className="text-on-surface-variant">Mã SV</TableHead>
                      <TableHead className="text-on-surface-variant">Email</TableHead>
                      <TableHead className="text-on-surface-variant">Lý do</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {IMPORT_ERRORS_IB1.map((e, i) => (
                      <TableRow key={i} className="border-outline-variant/60">
                        <TableCell className="text-sm text-on-surface tabular-nums">
                          {e.row}
                        </TableCell>
                        <TableCell className="text-sm text-on-surface font-mono">
                          {e.studentCode}
                        </TableCell>
                        <TableCell className="text-sm text-on-surface-variant">
                          {e.email}
                        </TableCell>
                        <TableCell className="text-sm text-error">
                          {e.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setErrorDialog(null)}>
              Đóng
            </ExpressiveButton>
            {errorDialog?.errorRows && errorDialog.errorRows > 0 && (
              <ExpressiveButton variant="filled">
                <Download className="size-4" />
                Tải file lỗi
              </ExpressiveButton>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// SCREEN 5: uniadm-roster — Trạng thái sinh viên
// ============================================================
const ROSTER_STATUSES = ["ACTIVE", "INACTIVE", "GRADUATED", "SUSPENDED"] as const;
type RosterTab = "ALL" | (typeof ROSTER_STATUSES)[number];

function RosterScreen() {
  const allRoster = useMemo(
    () => studentRoster.filter((r) => r.universityId === UNI_ID),
    []
  );
  const [tab, setTab] = useState<RosterTab>("ALL");
  const [query, setQuery] = useState("");
  const [statusDialog, setStatusDialog] = useState<StudentRosterEntry | null>(null);
  const [newStatus, setNewStatus] = useState<StudentRosterEntry["status"]>("ACTIVE");
  const [reason, setReason] = useState("");

  const summary = useMemo(() => {
    return {
      total: allRoster.length,
      active: allRoster.filter((r) => r.status === "ACTIVE").length,
      suspended: allRoster.filter((r) => r.status === "SUSPENDED").length,
      graduated: allRoster.filter((r) => r.status === "GRADUATED").length,
    };
  }, [allRoster]);

  const filtered = useMemo(() => {
    return allRoster.filter((r) => {
      if (tab !== "ALL" && r.status !== tab) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          r.fullName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.studentCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allRoster, tab, query]);

  const openStatusDialog = (r: StudentRosterEntry) => {
    setStatusDialog(r);
    setNewStatus(r.status);
    setReason("");
  };

  const handleSaveStatus = () => {
    if (statusDialog) {
      toast.success(`Đã cập nhật trạng thái sinh viên ${statusDialog.studentCode}`, {
        description: `${statusDialog.status} → ${newStatus}${reason ? ` · ${reason}` : ""}`,
      });
      setStatusDialog(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trạng thái sinh viên"
        description={`${summary.total} sinh viên trong danh sách trường Duy Tân`}
        icon={<GraduationCap className="size-7" />}
      />

      {/* Summary */}
      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Tổng sinh viên"
            value={<Counter to={summary.total} />}
            icon={<Users className="size-6" />}
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Đang hoạt động"
            value={<Counter to={summary.active} />}
            icon={<CheckCircle2 className="size-6" />}
            accent="success"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Bị đình chỉ"
            value={<Counter to={summary.suspended} />}
            icon={<AlertTriangle className="size-6" />}
            accent="error"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Đã tốt nghiệp"
            value={<Counter to={summary.graduated} />}
            icon={<GraduationCap className="size-6" />}
            accent="tertiary"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Search + filter */}
      <ScrollReveal>
        <ExpressiveCard variant="outlined" className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
              <Input
                placeholder="Tìm theo mã SV, tên, email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 rounded-full"
              />
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as RosterTab)}>
              <TabsList className="bg-surface-container-highest rounded-full h-10 p-1">
                <TabsTrigger value="ALL" className="rounded-full data-[state=active]:bg-primary-container data-[state=active]:text-on-primary-container">
                  Tất cả
                </TabsTrigger>
                {ROSTER_STATUSES.map((s) => (
                  <TabsTrigger
                    key={s}
                    value={s}
                    className="rounded-full data-[state=active]:bg-primary-container data-[state=active]:text-on-primary-container"
                  >
                    {s === "ACTIVE" && "Đang học"}
                    {s === "INACTIVE" && "Không HĐ"}
                    {s === "GRADUATED" && "TN"}
                    {s === "SUSPENDED" && "Đình chỉ"}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Roster table */}
      <ScrollReveal delay={0.05}>
        <ExpressiveCard variant="outlined" className="overflow-hidden">
          <div className="max-h-96 overflow-y-auto scrollbar-soft">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
                <TableRow className="hover:bg-transparent border-outline-variant">
                  <TableHead className="text-on-surface-variant">Mã SV</TableHead>
                  <TableHead className="text-on-surface-variant">Họ tên</TableHead>
                  <TableHead className="text-on-surface-variant hidden sm:table-cell">Email</TableHead>
                  <TableHead className="text-on-surface-variant">Trạng thái</TableHead>
                  <TableHead className="text-on-surface-variant hidden md:table-cell">Ngày import</TableHead>
                  <TableHead className="text-on-surface-variant text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-on-surface-variant text-sm">
                      Không tìm thấy sinh viên phù hợp
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow
                      key={r.id}
                      className="border-outline-variant/60 hover:bg-surface-container-lowest"
                    >
                      <TableCell className="text-sm font-mono text-on-surface">
                        {r.studentCode}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-on-surface min-w-0 truncate">{r.fullName}</p>
                        <p className="text-xs text-on-surface-variant sm:hidden truncate">
                          {r.email}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-on-surface-variant hidden sm:table-cell">
                        {r.email}
                      </TableCell>
                      <TableCell>
                        <RosterStatusPill status={r.status} />
                      </TableCell>
                      <TableCell className="text-xs text-on-surface-variant hidden md:table-cell">
                        {r.importedAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="state-layer size-9 rounded-full inline-flex items-center justify-center text-on-surface-variant">
                              <MoreVertical className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => openStatusDialog(r)}>
                              <Pencil className="size-4" />
                              Cập nhật trạng thái
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`Xem chi tiết ${r.fullName}`)}>
                              <Eye className="size-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Status update dialog */}
      <Dialog
        open={!!statusDialog}
        onOpenChange={(o) => !o && setStatusDialog(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái sinh viên</DialogTitle>
            <DialogDescription>
              {statusDialog && (
                <>
                  {statusDialog.fullName} ({statusDialog.studentCode})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Trạng thái mới</Label>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as StudentRosterEntry["status"])}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ACTIVE">Đang học</SelectItem>
                  <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                  <SelectItem value="GRADUATED">Đã tốt nghiệp</SelectItem>
                  <SelectItem value="SUSPENDED">Bị đình chỉ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lý do (tùy chọn)</Label>
              <Textarea
                placeholder="VD: Bảo lưu học kỳ, chuyển trường, vi phạm kỷ luật..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
              <Info className="size-4 text-on-surface-variant shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface-variant">
                Thay đổi trạng thái sẽ ảnh hưởng quyền mua vé tháng trợ giá của sinh viên.
                Hành động được ghi vào nhật ký kiểm toán.
              </p>
            </div>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setStatusDialog(null)}>
              Hủy
            </ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={handleSaveStatus}>
              <Save className="size-4" />
              Lưu thay đổi
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// SCREEN 6: uniadm-subsidy — Chính sách trợ giá
// ============================================================
function SubsidyScreen() {
  const policies = useMemo(
    () => subsidyPolicies.filter((p) => p.universityId === UNI_ID),
    []
  );
  const stats = useUniStats();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<SubsidyPolicy | null>(null);

  const preview = calcSubsidy(180000, UNI_ID);

  const monthlyBudget = 20_000_000;
  const usedSubsidy = stats.totalSubsidy;
  const remainingBudget = monthlyBudget - usedSubsidy;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Chính sách trợ giá"
        description="Quản lý trợ giá vé tháng cho sinh viên trường Duy Tân"
        icon={<Percent className="size-7" />}
        actions={
          <ExpressiveButton variant="filled" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Tạo chính sách
          </ExpressiveButton>
        }
      />

      {/* Stat cards */}
      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Chính sách đang hoạt động"
            value={<Counter to={policies.filter((p) => p.status === "active").length} />}
            icon={<ShieldCheck className="size-6" />}
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tổng trợ giá tháng"
            value={
              <Counter
                to={stats.totalSubsidy}
                format={(n) => Math.round(n).toLocaleString("vi-VN") + " đ"}
              />
            }
            icon={<Wallet className="size-6" />}
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Sinh viên hưởng trợ giá"
            value={<Counter to={stats.monthlyPasses} />}
            icon={<Users className="size-6" />}
            accent="secondary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Hạn mức còn lại"
            value={
              <Counter
                to={remainingBudget}
                format={(n) => Math.round(n).toLocaleString("vi-VN") + " đ"}
              />
            }
            icon={<TrendingUp className="size-6" />}
            hint={`Ngân sách tháng: ${formatVND(monthlyBudget)}`}
            accent="success"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Policies table */}
      <ScrollReveal>
        <Section title="Danh sách chính sách">
          <ExpressiveCard variant="outlined" className="overflow-hidden">
            <div className="max-h-96 overflow-y-auto scrollbar-soft">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
                  <TableRow className="hover:bg-transparent border-outline-variant">
                    <TableHead className="text-on-surface-variant">Tên chính sách</TableHead>
                    <TableHead className="text-on-surface-variant">Loại</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Giá trị</TableHead>
                    <TableHead className="text-on-surface-variant hidden md:table-cell">Hiệu lực</TableHead>
                    <TableHead className="text-on-surface-variant">Trạng thái</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((p) => (
                    <TableRow
                      key={p.id}
                      className="border-outline-variant/60 hover:bg-surface-container-lowest"
                    >
                      <TableCell>
                        <p className="text-sm font-medium text-on-surface">{p.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {p.type === "percent"
                            ? `Trợ ${p.value}% vé tháng, tối đa ${formatVND(p.maxAmount ?? 0)}`
                            : `Trợ cố định ${formatVND(p.value)}`}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          label={p.type === "percent" ? "Theo %" : "Cố định"}
                          tone={p.type === "percent" ? "primary" : "tertiary"}
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm text-on-surface tabular-nums">
                        {p.type === "percent" ? `${p.value}%` : formatVND(p.value)}
                      </TableCell>
                      <TableCell className="text-xs text-on-surface-variant hidden md:table-cell">
                        {p.activeFrom} → {p.activeUntil}
                      </TableCell>
                      <TableCell>
                        <SubsidyStatusPill status={p.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <ExpressiveButton
                            variant="text"
                            size="icon-sm"
                            onClick={() => setEditPolicy(p)}
                          >
                            <Pencil className="size-4" />
                          </ExpressiveButton>
                          <ExpressiveButton
                            variant="text"
                            size="icon-sm"
                            className="text-error"
                            onClick={() => toast.success(`Đã xóa chính sách "${p.name}"`)}
                          >
                            <Trash2 className="size-4" />
                          </ExpressiveButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ExpressiveCard>
        </Section>
      </ScrollReveal>

      {/* Live preview */}
      <ScrollReveal delay={0.05}>
        <Section title="Xem trước trợ giá">
          <ExpressiveCard variant="elevated" className="p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="size-10 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-on-surface">
                  Ví dụ vé tháng tuyến DN-01
                </h3>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  Áp dụng chính sách {preview.policy?.name ?? "không có"} cho sinh viên Duy Tân
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-surface-container-lowest p-4 text-center border border-outline-variant/50">
                <p className="text-xs text-on-surface-variant">Giá gốc</p>
                <p className="mt-1.5 text-2xl font-bold text-on-surface tabular-nums">
                  {formatVND(preview.original)}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">Vé tháng DN-01</p>
              </div>
              <div className="rounded-2xl bg-tertiary-container p-4 text-center">
                <p className="text-xs text-on-tertiary-container/80">Trường hỗ trợ</p>
                <p className="mt-1.5 text-2xl font-bold text-on-tertiary-container tabular-nums">
                  −{formatVND(preview.subsidy)}
                </p>
                <p className="text-xs text-on-tertiary-container/80 mt-1">
                  {preview.policy?.type === "percent" ? `${preview.policy.value}%` : "Cố định"}
                </p>
              </div>
              <div className="rounded-2xl bg-primary-container p-4 text-center">
                <p className="text-xs text-on-primary-container/80">SV thanh toán</p>
                <p className="mt-1.5 text-2xl font-bold text-on-primary-container tabular-nums">
                  {formatVND(preview.final)}
                </p>
                <p className="text-xs text-on-primary-container/80 mt-1">
                  Tiết kiệm {Math.round((preview.subsidy / preview.original) * 100)}%
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-4 text-center">
              Ví dụ: vé tháng 180.000đ → sinh viên trả{" "}
              <strong className="text-on-surface">{formatVND(preview.final)}</strong> (trợ{" "}
              <strong className="text-on-surface">{formatVND(preview.subsidy)}</strong>)
            </p>
          </ExpressiveCard>
        </Section>
      </ScrollReveal>

      {/* Create dialog */}
      <CreatePolicyDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Edit dialog */}
      <EditPolicyDialog
        policy={editPolicy}
        onOpenChange={(o) => !o && setEditPolicy(null)}
      />
    </div>
  );
}

function CreatePolicyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    type: "percent" as SubsidyPolicy["type"],
    value: "",
    maxAmount: "",
    activeFrom: "",
    activeUntil: "",
  });

  const handleCreate = () => {
    if (!form.name || !form.value || !form.activeFrom || !form.activeUntil) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }
    toast.success(`Đã tạo chính sách "${form.name}"`, {
      description: "Chính sách sẽ được áp dụng sau khi System Admin phê duyệt.",
    });
    setForm({
      name: "",
      type: "percent",
      value: "",
      maxAmount: "",
      activeFrom: "",
      activeUntil: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo chính sách trợ giá mới</DialogTitle>
          <DialogDescription>
            Thiết lập mức trợ giá vé tháng cho sinh viên Duy Tân.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tên chính sách</Label>
            <Input
              placeholder="VD: Trợ giá học kỳ 2 năm 2026"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Loại trợ giá</Label>
            <SegmentedButton
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              options={[
                { value: "percent", label: "Theo %" },
                { value: "fixed", label: "Cố định" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                {form.type === "percent" ? "Phần trăm (%)" : "Số tiền (đ)"}
              </Label>
              <Input
                type="number"
                placeholder={form.type === "percent" ? "30" : "50000"}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hạn mức tối đa (đ)</Label>
              <Input
                type="number"
                placeholder="72000"
                value={form.maxAmount}
                onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Hiệu lực từ</Label>
              <Input
                type="date"
                value={form.activeFrom}
                onChange={(e) => setForm({ ...form, activeFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Đến ngày</Label>
              <Input
                type="date"
                value={form.activeUntil}
                onChange={(e) => setForm({ ...form, activeUntil: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <ExpressiveButton variant="text" onClick={() => onOpenChange(false)}>
            Hủy
          </ExpressiveButton>
          <ExpressiveButton variant="filled" onClick={handleCreate}>
            <Save className="size-4" />
            Tạo chính sách
          </ExpressiveButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPolicyDialog({
  policy,
  onOpenChange,
}: {
  policy: SubsidyPolicy | null;
  onOpenChange: (o: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Reset form whenever policy changes (key-based remount pattern below)
  React.useEffect(() => {
    if (policy) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(String(policy.value));
      setMaxAmount(String(policy.maxAmount ?? ""));
    }
  }, [policy]);

  if (!policy) return null;

  return (
    <Dialog open={!!policy} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md" key={policy.id}>
        <DialogHeader>
          <DialogTitle>Sửa chính sách</DialogTitle>
          <DialogDescription>{policy.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest">
            <span className="text-sm text-on-surface-variant">Loại</span>
            <StatusPill
              label={policy.type === "percent" ? "Theo %" : "Cố định"}
              tone={policy.type === "percent" ? "primary" : "tertiary"}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              {policy.type === "percent" ? "Phần trăm (%)" : "Số tiền (đ)"}
            </Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hạn mức tối đa (đ)</Label>
            <Input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest text-sm">
            <span className="text-on-surface-variant">Hiệu lực</span>
            <span className="text-on-surface font-medium">
              {policy.activeFrom} → {policy.activeUntil}
            </span>
          </div>
        </div>
        <DialogFooter>
          <ExpressiveButton variant="text" onClick={() => onOpenChange(false)}>
            Hủy
          </ExpressiveButton>
          <ExpressiveButton
            variant="filled"
            onClick={() => {
              toast.success(`Đã cập nhật chính sách "${policy.name}"`);
              onOpenChange(false);
            }}
          >
            <Save className="size-4" />
            Lưu
          </ExpressiveButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// SCREEN 7: uniadm-stats — Thống kê sử dụng
// ============================================================
function StatsScreen() {
  const stats = useUniStats();
  const [period, setPeriod] = useState<"7d" | "30d" | "12m">("30d");

  // 30-day mock
  const trips30 = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        day: `${i + 1}`,
        trips:
          220 +
          Math.round(60 * Math.sin(i * 0.45)) +
          (i % 7 === 5 || i % 7 === 6 ? -100 : 0),
      })),
    []
  );

  // Perk palette — bold, no pale tints
  const passesByRoute = [
    { name: "DN-01", passes: 218, fill: "#beff50" },
    { name: "DN-02", passes: 102, fill: "#144fcc" },
    { name: "DN-03", passes: 92, fill: "#ff8c5f" },
  ];

  const facultyDist = [
    { name: "Công nghệ thông tin", value: 480, fill: "#beff50" },
    { name: "Quản trị kinh doanh", value: 320, fill: "#144fcc" },
    { name: "Kỹ thuật", value: 250, fill: "#ff8c5f" },
    { name: "Ngôn ngữ", value: 120, fill: "#c8a0ff" },
    { name: "Khác", value: 78, fill: "#f59e0b" },
  ];

  const topRoutes = [
    { code: "DN-01", name: "Tuyến xanh Duy Tân — Trung tâm", students: 218, trips: 4120, fill: "#beff50" },
    { code: "DN-02", name: "Tuyến cam Duy Tân — Bách Khoa", students: 102, trips: 2200, fill: "#144fcc" },
    { code: "DN-03", name: "Tuyến teal Bách Khoa — Sư phạm", students: 92, trips: 2100, fill: "#ff8c5f" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Thống kê sử dụng"
        description="Tổng hợp hoạt động của sinh viên trường Duy Tân"
        icon={<BarChart3 className="size-7" />}
        actions={
          <SegmentedButton
            value={period}
            onChange={setPeriod}
            options={[
              { value: "7d", label: "7 ngày" },
              { value: "30d", label: "30 ngày" },
              { value: "12m", label: "12 tháng" },
            ]}
          />
        }
      />

      {/* Stat cards */}
      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Sinh viên dùng xe"
            value={<Counter to={stats.activeStudents} />}
            icon={<Users className="size-6" />}
            hint="Trong 30 ngày qua"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Vé tháng bán ra"
            value={<Counter to={stats.monthlyPasses} />}
            icon={<FileSpreadsheet className="size-6" />}
            hint="Tháng 09/2025"
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Chuyến thực hiện"
            value={<Counter to={stats.tripsThisMonth} />}
            icon={<BarChart3 className="size-6" />}
            hint="Tổng tháng 09"
            accent="secondary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tổng trợ giá"
            value={
              <Counter
                to={stats.totalSubsidy}
                format={(n) => Math.round(n).toLocaleString("vi-VN") + " đ"}
              />
            }
            icon={<Wallet className="size-6" />}
            hint="Quỹ trợ giá tháng"
            accent="success"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScrollReveal>
          <ExpressiveCard variant="outlined" className="p-5">
            <h3 className="text-lg font-semibold text-on-surface mb-1">
              Lượt dùng xe 30 ngày
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Tổng hợp số chuyến sinh viên tham gia theo ngày
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trips30} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--m3-outline-variant)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "var(--m3-on-surface-variant)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis tick={{ fill: "var(--m3-on-surface-variant)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RTooltip
                    contentStyle={{
                      background: "var(--m3-surface-container-high)",
                      border: "1px solid var(--m3-outline-variant)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="trips"
                    stroke="#144fcc"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <ExpressiveCard variant="outlined" className="p-5">
            <h3 className="text-lg font-semibold text-on-surface mb-1">
              Vé tháng theo tuyến
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Phân bố vé tháng bán ra theo tuyến bus
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={passesByRoute} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--m3-outline-variant)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--m3-on-surface-variant)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--m3-on-surface-variant)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RTooltip
                    cursor={{ fill: "var(--m3-surface-container-highest)" }}
                    contentStyle={{
                      background: "var(--m3-surface-container-high)",
                      border: "1px solid var(--m3-outline-variant)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ScrollReveal delay={0.1}>
          <ExpressiveCard variant="outlined" className="p-5 h-full">
            <h3 className="text-lg font-semibold text-on-surface mb-1">
              Sinh viên theo khoa
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              1.248 sinh viên hoạt động
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={facultyDist}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {facultyDist.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{
                      background: "var(--m3-surface-container-high)",
                      border: "1px solid var(--m3-outline-variant)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {facultyDist.map((f) => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ background: f.fill }}
                  />
                  <span className="text-on-surface-variant flex-1 truncate">
                    {f.name}
                  </span>
                  <span className="text-on-surface font-medium tabular-nums">
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.15} className="lg:col-span-2">
          <ExpressiveCard variant="outlined" className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-on-surface">
                  Tuyến đông nhất
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Top 3 tuyến theo số sinh viên sử dụng
                </p>
              </div>
              <ExpressiveButton
                variant="tonal"
                size="sm"
                onClick={() => toast.success("Đã xuất báo cáo Excel", { description: "thongke_duytan_09-2025.xlsx" })}
              >
                <FileDown className="size-4" />
                Xuất Excel
              </ExpressiveButton>
            </div>
            <div className="overflow-hidden rounded-xl border border-outline-variant">
              <Table>
                <TableHeader className="bg-surface-container-low">
                  <TableRow className="hover:bg-transparent border-outline-variant">
                    <TableHead className="text-on-surface-variant">Tuyến</TableHead>
                    <TableHead className="text-on-surface-variant text-right">SV dùng</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Lượt chuyến</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Tỷ trọng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topRoutes.map((r) => {
                    const total = topRoutes.reduce((a, b) => a + b.students, 0);
                    return (
                      <TableRow key={r.code} className="border-outline-variant/60">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <RouteDot color={r.fill} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-on-surface truncate">{r.code}</p>
                              <p className="text-xs text-on-surface-variant truncate">{r.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm text-on-surface tabular-nums">
                          {r.students}
                        </TableCell>
                        <TableCell className="text-right text-sm text-on-surface tabular-nums">
                          {r.trips.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2 w-32 justify-end">
                            <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(r.students / total) * 100}%`,
                                  background: r.fill,
                                }}
                              />
                            </div>
                            <span className="text-xs text-on-surface-variant w-10 text-right tabular-nums">
                              {Math.round((r.students / total) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 8: uniadm-notify — Gửi thông báo trường
// ============================================================
const RECENT_NOTIFY = [
  { id: "n1", title: "Thông báo lịch thi học kỳ 2", audience: "Toàn trường", sent: 1248, date: "2025-09-15 09:00", status: "sent" },
  { id: "n2", title: "Tạm dừng tuyến DN-03 chiều 25/09", audience: "Theo tuyến DN-03", sent: 412, date: "2025-09-24 16:30", status: "sent" },
  { id: "n3", title: "Mở đợt đăng ký vé tháng 10", audience: "Theo nhóm SV", sent: 1186, date: "2025-09-28 08:00", status: "sent" },
  { id: "n4", title: "Lịch nghỉ Quốc khánh 02/09", audience: "Toàn trường", sent: 1248, date: "2025-08-30 14:00", status: "scheduled" },
];

function NotifyScreen() {
  const uni = useUniversity();
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"info" | "warning" | "important">("info");
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [scheduleAt, setScheduleAt] = useState("");

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    toast.success(schedule === "now" ? "Đã gửi thông báo" : "Đã lên lịch gửi", {
      description:
        schedule === "now"
          ? `Gửi đến ${audience === "all" ? "toàn trường" : audience}`
          : `Sẽ gửi lúc ${scheduleAt}`,
    });
    setTitle("");
    setMessage("");
    setScheduleAt("");
  };

  const priorityTone = priority === "info" ? "primary" : priority === "warning" ? "warning" : "error";
  const priorityLabel = priority === "info" ? "Thông tin" : priority === "warning" ? "Cảnh báo" : "Quan trọng";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gửi thông báo trường"
        description="Thông báo tới sinh viên trường Duy Tân qua ứng dụng UniBus"
        icon={<Megaphone className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <ScrollReveal>
          <ExpressiveCard variant="outlined" className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">
              Soạn thông báo
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Đối tượng nhận</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Toàn trường (1.248 SV)</SelectItem>
                    <SelectItem value="campus">Theo cơ sở</SelectItem>
                    <SelectItem value="route">Theo tuyến</SelectItem>
                    <SelectItem value="group">Theo nhóm sinh viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Tiêu đề</Label>
                  <span className="text-xs text-on-surface-variant tabular-nums">
                    {title.length}/80
                  </span>
                </div>
                <Input
                  maxLength={80}
                  placeholder="VD: Lịch thi học kỳ 2 năm 2025-2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Nội dung</Label>
                  <span className="text-xs text-on-surface-variant tabular-nums">
                    {message.length}/500
                  </span>
                </div>
                <Textarea
                  maxLength={500}
                  placeholder="Nhập nội dung thông báo chi tiết..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Mức độ ưu tiên</Label>
                <SegmentedButton
                  value={priority}
                  onChange={setPriority}
                  options={[
                    { value: "info", label: "Thông tin" },
                    { value: "warning", label: "Cảnh báo" },
                    { value: "important", label: "Quan trọng" },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Thời gian gửi</Label>
                <SegmentedButton
                  value={schedule}
                  onChange={setSchedule}
                  options={[
                    { value: "now", label: "Gửi ngay" },
                    { value: "later", label: "Lên lịch" },
                  ]}
                />
                {schedule === "later" && (
                  <Input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="rounded-xl mt-2"
                  />
                )}
              </div>

              <Magnetic strength={0.18}>
                <ExpressiveButton
                  variant="filled"
                  className="w-full"
                  onClick={handleSend}
                >
                  <Send className="size-4" />
                  {schedule === "now" ? "Gửi thông báo" : "Lên lịch gửi"}
                </ExpressiveButton>
              </Magnetic>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Live preview */}
        <ScrollReveal delay={0.05}>
          <ExpressiveCard variant="outlined" className="p-6 h-full">
            <h3 className="text-lg font-semibold text-on-surface mb-4">
              Xem trước
            </h3>
            <div className="flex justify-center py-4">
              <div className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-4 border border-outline-variant/60 elev-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-on-surface-variant font-medium">
                    UniBus · Thông báo trường
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {schedule === "now" ? "bây giờ" : scheduleAt || "—"}
                  </span>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-3.5">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: uni.color }}
                  >
                    {uni.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {title || "Tiêu đề thông báo"}
                      </p>
                      <StatusPill label={priorityLabel} tone={priorityTone as any} />
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-4">
                      {message || "Nội dung thông báo sẽ hiển thị tại đây. Sinh viên sẽ nhận được thông báo này qua ứng dụng UniBus."}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-2">
                      Trường {uni.shortName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-surface-container-low p-3">
                <p className="text-xs text-on-surface-variant">Người nhận dự kiến</p>
                <p className="mt-1 text-lg font-bold text-on-surface">
                  {audience === "all" ? "1.248" : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-3">
                <p className="text-xs text-on-surface-variant">Kênh</p>
                <p className="mt-1 text-lg font-bold text-on-surface">Push + Email</p>
              </div>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>

      {/* Recent sent */}
      <ScrollReveal delay={0.1}>
        <Section title="Thông báo đã gửi gần đây">
          <ExpressiveCard variant="outlined" className="overflow-hidden">
            <div className="max-h-96 overflow-y-auto scrollbar-soft">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
                  <TableRow className="hover:bg-transparent border-outline-variant">
                    <TableHead className="text-on-surface-variant">Tiêu đề</TableHead>
                    <TableHead className="text-on-surface-variant hidden sm:table-cell">Đối tượng</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Đã gửi</TableHead>
                    <TableHead className="text-on-surface-variant hidden md:table-cell">Thời gian</TableHead>
                    <TableHead className="text-on-surface-variant">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RECENT_NOTIFY.map((n) => (
                    <TableRow
                      key={n.id}
                      className="border-outline-variant/60 hover:bg-surface-container-lowest"
                    >
                      <TableCell className="text-sm font-medium text-on-surface">
                        {n.title}
                      </TableCell>
                      <TableCell className="text-xs text-on-surface-variant hidden sm:table-cell">
                        {n.audience}
                      </TableCell>
                      <TableCell className="text-right text-sm text-on-surface tabular-nums">
                        {n.sent.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-xs text-on-surface-variant hidden md:table-cell">
                        {n.date}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          label={n.status === "sent" ? "Đã gửi" : "Đã lên lịch"}
                          tone={n.status === "sent" ? "success" : "warning"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ExpressiveCard>
        </Section>
      </ScrollReveal>
    </div>
  );
}

// ============================================================
// SCREEN 9: uniadm-recon — Báo cáo đối soát
// ============================================================
function ReconScreen() {
  const [month, setMonth] = useState("09");
  const [year, setYear] = useState("2025");

  // Per-route breakdown (r1, r3 — uni1's routes used for recon per spec)
  const reconRoutes = useMemo(() => {
    const r1 = routeById("r1")!;
    const r3 = routeById("r3")!;
    const r1Qty = 218;
    const r3Qty = 92;
    const r1Sub = calcSubsidy(r1.monthlyPass, UNI_ID);
    const r3Sub = calcSubsidy(r3.monthlyPass, UNI_ID);
    return [
      {
        route: r1,
        qty: r1Qty,
        fare: r1.monthlyPass,
        subsidyPer: r1Sub.subsidy,
        finalPer: r1Sub.final,
        original: r1.monthlyPass * r1Qty,
        subsidy: r1Sub.subsidy * r1Qty,
        final: r1Sub.final * r1Qty,
      },
      {
        route: r3,
        qty: r3Qty,
        fare: r3.monthlyPass,
        subsidyPer: r3Sub.subsidy,
        finalPer: r3Sub.final,
        original: r3.monthlyPass * r3Qty,
        subsidy: r3Sub.subsidy * r3Qty,
        final: r3Sub.final * r3Qty,
      },
    ];
  }, []);

  const totals = useMemo(
    () => ({
      original: reconRoutes.reduce((a, b) => a + b.original, 0),
      subsidy: reconRoutes.reduce((a, b) => a + b.subsidy, 0),
      final: reconRoutes.reduce((a, b) => a + b.final, 0),
    }),
    [reconRoutes]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Báo cáo đối soát"
        description="Đối soát trợ giá giữa trường, nhà xe và sinh viên"
        icon={<FileText className="size-7" />}
        actions={
          <div className="flex gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="rounded-full w-28 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m).padStart(2, "0")}>
                    Tháng {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="rounded-full w-28 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Summary card */}
      <ScrollReveal>
        <ExpressiveCard variant="elevated" className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="size-5 text-[#144fcc]" />
            <h3 className="text-lg font-semibold text-on-surface">
              Tổng hợp đối soát tháng {month}/{year}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-surface-container-lowest p-5 border border-outline-variant/50">
              <p className="text-xs text-on-surface-variant">Giá gốc vé tháng</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-on-surface tabular-nums">
                <Counter
                  to={totals.original}
                  format={(n) => Math.round(n).toLocaleString("vi-VN") + " đ"}
                />
              </p>
              <p className="text-xs text-on-surface-variant mt-1.5">
                {reconRoutes.reduce((a, b) => a + b.qty, 0)} vé tháng bán ra
              </p>
            </div>
            <div className="rounded-2xl bg-tertiary-container p-5">
              <p className="text-xs text-on-tertiary-container/80">Trường hỗ trợ</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-on-tertiary-container tabular-nums">
                <Counter
                  to={totals.subsidy}
                  format={(n) => Math.round(n).toLocaleString("vi-VN") + " đ"}
                />
              </p>
              <p className="text-xs text-on-tertiary-container/80 mt-1.5">
                Trợ giá 30% vé tháng
              </p>
            </div>
            <div className="rounded-2xl bg-primary-container p-5">
              <p className="text-xs text-on-primary-container/80">SV thanh toán</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-on-primary-container tabular-nums">
                <Counter
                  to={totals.final}
                  format={(n) => Math.round(n).toLocaleString("vi-VN") + " đ"}
                />
              </p>
              <p className="text-xs text-on-primary-container/80 mt-1.5">
                Đã thu từ sinh viên
              </p>
            </div>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Detailed table */}
      <ScrollReveal delay={0.05}>
        <Section
          title="Chi tiết theo tuyến"
          description="Phân tích vé tháng theo từng tuyến bus"
          actions={
            <div className="flex gap-2">
              <ExpressiveButton
                variant="tonal"
                onClick={() =>
                  toast.success("Đã xuất báo cáo CSV", {
                    description: `baocao_doi_soat_${month}_${year}.csv`,
                  })
                }
              >
                <FileDown className="size-4" />
                Xuất CSV
              </ExpressiveButton>
              <Magnetic strength={0.15}>
                <ExpressiveButton
                  variant="filled"
                  onClick={() =>
                    toast.success("Đang tạo file PDF...", {
                      description: "File sẽ được tải về trong giây lát",
                    })
                  }
                >
                  <FileText className="size-4" />
                  Xuất PDF
                </ExpressiveButton>
              </Magnetic>
            </div>
          }
        >
          <ExpressiveCard variant="outlined" className="overflow-hidden">
            <div className="max-h-96 overflow-y-auto scrollbar-soft">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
                  <TableRow className="hover:bg-transparent border-outline-variant">
                    <TableHead className="text-on-surface-variant">Tuyến</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Số vé</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Giá vé</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Giá gốc</TableHead>
                    <TableHead className="text-on-surface-variant text-right">Trợ giá</TableHead>
                    <TableHead className="text-on-surface-variant text-right">SV trả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconRoutes.map((r) => (
                    <TableRow
                      key={r.route.id}
                      className="border-outline-variant/60 hover:bg-surface-container-lowest"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <RouteDot color={r.route.color} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">
                              {r.route.code}
                            </p>
                            <p className="text-xs text-on-surface-variant truncate">
                              {r.route.from} → {r.route.to}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-on-surface tabular-nums">
                        {r.qty}
                      </TableCell>
                      <TableCell className="text-right text-sm text-on-surface-variant tabular-nums">
                        {formatVND(r.fare)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-on-surface tabular-nums">
                        {formatVND(r.original)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-success tabular-nums">
                        {formatVND(r.subsidy)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-on-surface font-semibold tabular-nums">
                        {formatVND(r.final)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-surface-container-low border-t-2 border-outline-variant">
                    <TableCell className="text-sm font-bold text-on-surface">
                      Tổng cộng
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-on-surface tabular-nums">
                      {reconRoutes.reduce((a, b) => a + b.qty, 0)}
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right text-sm font-bold text-on-surface tabular-nums">
                      {formatVND(totals.original)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-success tabular-nums">
                      {formatVND(totals.subsidy)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-on-surface tabular-nums">
                      {formatVND(totals.final)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </ExpressiveCard>
        </Section>
      </ScrollReveal>

      {/* Note card */}
      <ScrollReveal delay={0.1}>
        <ExpressiveCard variant="outlined" className="p-5 bg-surface-container-low">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <Info className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface">
                Lưu ý về báo cáo đối soát
              </h4>
              <p className="text-sm text-on-surface-variant mt-1">
                Báo cáo dùng để đối soát giữa trường, nhà xe và sinh viên vào cuối mỗi kỳ.
                Vui lòng xác nhận số liệu với phòng Kế toán nhà xe trước khi xuất file PDF
                gửi cho Phòng Công tác sinh viên.
              </p>
            </div>
          </div>
        </ExpressiveCard>
      </ScrollReveal>
    </div>
  );
}

export default UniversityAdminModule;
