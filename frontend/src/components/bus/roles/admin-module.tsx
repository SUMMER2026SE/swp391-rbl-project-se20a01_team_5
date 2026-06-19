"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  ShieldAlert,
  AlertTriangle,
  Tag,
  Megaphone,
  UserPlus,
  Search,
  MoreVertical,
  Eye,
  Lock,
  Unlock,
  KeyRound,
  Bell,
  Send,
  TrendingUp,
  TrendingDown,
  Info,
  AlertCircle,
  Server,
  Wallet,
  Bus,
  CalendarClock,
  History,
  Percent,
  ChevronRight,
  School,
  GraduationCap,
  Route as RouteIcon,
  ScrollText,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Mail,
  Globe,
  Building2,
  Filter,
  ShieldCheck,
  ShieldX,
  Smartphone,
  Save,
  Pencil,
} from "lucide-react";
import { PageHeader, StatCard, Section, EmptyState } from "../primitives";
import {
  ExpressiveButton,
  ExpressiveCard,
  StatusPill,
  M3Progress,
  Chip,
} from "@/components/m3/primitives";
import {
  SplitText,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Counter,
} from "@/components/m3/motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  allUsers,
  complaints,
  incidents,
  routes,
  formatVND,
  universities,
  universityAdmins,
  routeUniversities,
  auditLogs,
  universityStats,
  universityById,
} from "@/lib/mock-data";
import type { Complaint } from "@/lib/types";

// ============================================================
// Main switch
// ============================================================
export function AdminModule({
  activeId,
  onNavigate: _onNavigate,
}: {
  activeId: string;
  onNavigate: (id: string) => void;
}) {
  switch (activeId) {
    case "adm-dashboard":
      return <DashboardScreen />;
    case "adm-universities":
      return <UniversitiesScreen />;
    case "adm-uni-admins":
      return <UniAdminsScreen />;
    case "adm-route-uni":
      return <RouteUniScreen />;
    case "adm-audit":
      return <AuditScreen />;
    case "adm-users":
      return <UsersScreen />;
    case "adm-complaints":
      return <ComplaintsScreen />;
    case "adm-violations":
      return <ViolationsScreen />;
    case "adm-fare":
      return <FareScreen />;
    case "adm-notify":
      return <NotifyScreen />;
    default:
      return null;
  }
}

// ============================================================
// Shared M3-tonal helpers
// ============================================================
function RolePill({ role }: { role: string }) {
  const toneMap: Record<string, "primary" | "tertiary" | "success" | "warning" | "error" | "neutral"> = {
    "Sinh viên": "success",
    "Tài xế": "warning",
    "Phụ xe": "tertiary",
    "Điều phối": "primary",
    "Quản trị": "error",
    "University Admin": "primary",
  };
  return <StatusPill label={role} tone={toneMap[role] ?? "neutral"} />;
}

function UserStatusPill({ status }: { status: string }) {
  if (status === "active") return <StatusPill label="Hoạt động" tone="success" />;
  if (status === "locked") return <StatusPill label="Đã khóa" tone="error" />;
  if (status === "pending") return <StatusPill label="Chờ duyệt" tone="warning" />;
  return <StatusPill label={status} tone="neutral" />;
}

function PriorityPill({ priority }: { priority: string }) {
  const map: Record<string, { tone: "error" | "warning" | "neutral"; label: string }> = {
    high: { tone: "error", label: "Cao" },
    medium: { tone: "warning", label: "Trung bình" },
    low: { tone: "neutral", label: "Thấp" },
  };
  const m = map[priority] ?? { tone: "neutral" as const, label: priority };
  return <StatusPill label={m.label} tone={m.tone} />;
}

function ComplaintStatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: "primary" | "warning" | "success" | "error"; label: string }> = {
    new: { tone: "primary", label: "Mới" },
    processing: { tone: "warning", label: "Đang xử lý" },
    resolved: { tone: "success", label: "Đã giải quyết" },
    rejected: { tone: "error", label: "Từ chối" },
  };
  const m = map[status] ?? { tone: "neutral" as const, label: status };
  return <StatusPill label={m.label} tone={m.tone} />;
}

function ViolationStatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: "error" | "warning" | "success"; label: string }> = {
    open: { tone: "error", label: "Đang mở" },
    investigating: { tone: "warning", label: "Đang điều tra" },
    closed: { tone: "success", label: "Đã đóng" },
  };
  const m = map[status] ?? { tone: "neutral" as const, label: status };
  return <StatusPill label={m.label} tone={m.tone} />;
}

function UniLogo({ logo, color, logoUrl, size = "md" }: { logo: string; color: string; logoUrl?: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "size-10" : size === "lg" ? "size-16" : "size-12";
  if (logoUrl) {
    return (
      <div
        className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-white p-1 border border-outline-variant/40 elev-1", sz)}
        aria-hidden
      >
        <img src={logoUrl} alt="" className="w-full h-full object-contain" />
      </div>
    );
  }
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-2xl font-bold text-white elev-1", sz, size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base")}
      style={{ background: color }}
      aria-hidden
    >
      {logo}
    </div>
  );
}

function RouteColorDot({ color }: { color: string }) {
  return <span className="inline-block size-3 rounded-full shrink-0" style={{ background: color }} aria-hidden />;
}

// ============================================================
// 1. Dashboard (REQ-ADM-005) — SplitText + Counter + ScrollReveal
// ============================================================
function DashboardScreen() {
  const revenueData = [
    { day: "T2", revenue: 1240000 },
    { day: "T3", revenue: 1580000 },
    { day: "T4", revenue: 1320000 },
    { day: "T5", revenue: 1740000 },
    { day: "T6", revenue: 1960000 },
    { day: "T7", revenue: 980000 },
    { day: "CN", revenue: 720000 },
  ];

  const tripsData = routes.map((r) => ({
    route: r.code,
    trips: r.code === "DN-01" ? 42 : r.code === "DN-02" ? 35 : r.code === "DN-03" ? 28 : 8,
    color: r.color,
  }));

  // Perk palette — bold, no pale tints
  const roleDist = [
    { name: "Sinh viên", value: 1240, color: "#beff50" },
    { name: "Tài xế", value: 5, color: "#ff8c5f" },
    { name: "Phụ xe", value: 2, color: "#144fcc" },
    { name: "Điều phối", value: 1, color: "#c8a0ff" },
    { name: "Quản trị trường", value: 4, color: "#f59e0b" },
  ];

  const activities = [
    { id: 1, icon: UserPlus, tint: "bg-primary-container text-on-primary-container", title: "Người dùng mới đăng ký", desc: "Hoàng Thị Mai · Sinh viên Duy Tân", time: "5 phút trước" },
    { id: 2, icon: ShieldAlert, tint: "bg-error-container text-on-error-container", title: "Khiếu nại mới được tạo", desc: "CP-2025-0042 — Hành vi tài xế", time: "20 phút trước" },
    { id: 3, icon: School, tint: "bg-tertiary-container text-on-tertiary-container", title: "Import danh sách sinh viên", desc: "Bách Khoa · 856 dòng thành công", time: "1 giờ trước" },
    { id: 4, icon: Wallet, tint: "bg-secondary-container text-on-secondary-container", title: "Thanh toán thành công", desc: "Vé tháng DN-01 · 180.000 đ", time: "2 giờ trước" },
    { id: 5, icon: AlertTriangle, tint: "bg-warning-container text-on-surface", title: "Sự cố được báo cáo", desc: "INC-2025-0090 — Hỏng máy lạnh", time: "3 giờ trước" },
    { id: 6, icon: Lock, tint: "bg-error-container text-on-error-container", title: "Tài khoản bị khóa", desc: "Lê Minh Tuấn · Việt-Hàn", time: "5 giờ trước" },
  ];

  const warnings = [
    { id: 1, label: "Khiếu nại chờ xử lý", count: 2, severity: "high" as const, hint: "Cần xử lý trong 24h" },
    { id: 2, label: "Sự cố đang mở", count: 1, severity: "high" as const, hint: "INC-2025-0090" },
    { id: 3, label: "Xe đang bảo trì", count: 1, severity: "medium" as const, hint: "43B-52345" },
    { id: 4, label: "Hóa đơn quá hạn", count: 1, severity: "low" as const, hint: "INV-2025-0701" },
  ];

  const warnTone: Record<string, "error" | "warning" | "neutral"> = {
    high: "error",
    medium: "warning",
    low: "neutral",
  };

  return (
    <div className="space-y-6">
      {/* Headline — SplitText */}
      <div className="space-y-3">
        <SplitText
          as="h1"
          text="Thống kê hệ thống"
          className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface text-balance leading-[1.05]"
        />
        <ScrollReveal>
          <p className="text-base text-on-surface-variant text-pretty">
            Tổng quan hoạt động UniBus theo thời gian thực — 4 trường đối tác, 4 tuyến xe, 1.248 sinh viên đang hoạt động.
          </p>
        </ScrollReveal>
        <div className="flex items-center gap-2 pt-1">
          <ExpressiveButton variant="outlined" size="sm">
            <CalendarClock className="size-4" /> Tháng 6, 2025
          </ExpressiveButton>
          <ExpressiveButton variant="text" size="sm">
            <BarChart3 className="size-4" /> Xuất báo cáo
          </ExpressiveButton>
        </div>
      </div>

      {/* StatCards — StaggerGroup + Counter */}
      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Tổng người dùng"
            value={<Counter to={1248} />}
            icon={<Users className="size-6" />}
            hint="+12 so với tháng trước"
            trend="up"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Chuyến hôm nay"
            value={<Counter to={113} />}
            icon={<Bus className="size-6" />}
            hint="6 đang chạy"
            trend="up"
            accent="tertiary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Doanh thu tháng"
            value={<Counter to={94600000} format={(n) => formatVND(n)} />}
            icon={<Wallet className="size-6" />}
            hint="+8,4% so với tháng trước"
            trend="up"
            accent="success"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tỷ lệ đúng giờ"
            value={<Counter to={92} format={(n) => `${Math.round(n)}%`} />}
            icon={<Clock className="size-6" />}
            hint="Mục tiêu 90%"
            trend="up"
            accent="secondary"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ScrollReveal className="lg:col-span-2 min-w-0">
          <ExpressiveCard variant="filled" className="p-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-on-surface">Doanh thu 7 ngày qua</h2>
                <p className="text-sm text-on-surface-variant">Tổng 9.540.000 đ</p>
              </div>
              <StatusPill label="Tuần này" tone="primary" />
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
                  formatter={(v: number) => [formatVND(v), "Doanh thu"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#144fcc" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </ExpressiveCard>
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="min-w-0">
          <ExpressiveCard variant="filled" className="p-6 h-full">
            <h2 className="text-lg font-semibold text-on-surface mb-1">Phân bố vai trò</h2>
            <p className="text-sm text-on-surface-variant mb-2">Tổng 1.252 tài khoản</p>
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
                <div key={i} className="flex items-center justify-between text-sm gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                    <span className="text-on-surface-variant truncate">{r.name}</span>
                  </div>
                  <span className="font-medium text-on-surface tabular-nums shrink-0">{r.value.toLocaleString("vi-VN")}</span>
                </div>
              ))}
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ScrollReveal className="lg:col-span-2 min-w-0">
          <ExpressiveCard variant="filled" className="p-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-on-surface">Số chuyến theo tuyến</h2>
                <p className="text-sm text-on-surface-variant">Hôm nay</p>
              </div>
              <StatusPill label="4 tuyến" tone="tertiary" />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tripsData} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.5} vertical={false} />
                <XAxis dataKey="route" stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-on-surface-variant)" fontSize={12} tickLine={false} axisLine={false} />
                <RTooltip
                  contentStyle={{ background: "#14140f", border: "1px solid #14140f", borderRadius: 16, color: "#beff50" }}
                  formatter={(v: number) => [`${v} chuyến`, "Số chuyến"]}
                />
                <Bar dataKey="trips" radius={[8, 8, 0, 0]} maxBarSize={64}>
                  {tripsData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Warnings panel */}
        <ScrollReveal delay={0.08} className="min-w-0">
          <ExpressiveCard variant="filled" className="p-6 h-full">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="size-5 text-warning" />
              <h2 className="text-lg font-semibold text-on-surface">Cảnh báo hệ thống</h2>
            </div>
            <div className="space-y-3">
              {warnings.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-3 border border-outline-variant/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{w.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{w.hint}</p>
                  </div>
                  <StatusPill label={String(w.count)} tone={warnTone[w.severity]} />
                </div>
              ))}
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>

      {/* Activity feed — StaggerGroup */}
      <ScrollReveal>
        <ExpressiveCard variant="filled" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-on-surface">Hoạt động gần đây</h2>
            <ExpressiveButton variant="text" size="sm">
              Xem tất cả <ChevronRight className="size-4" />
            </ExpressiveButton>
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-soft pr-1">
            <StaggerGroup className="space-y-2">
              {activities.map((a) => (
                <StaggerItem key={a.id}>
                  <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-surface-container-lowest transition-colors">
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
        </ExpressiveCard>
      </ScrollReveal>
    </div>
  );
}

// ============================================================
// 2. Universities — NEW (Trường đại học đối tác)
// ============================================================
function UniversitiesScreen() {
  const [list, setList] = useState(() => universities.map((u) => ({ ...u })));
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState<typeof universities[number] | null>(null);
  const [lockTarget, setLockTarget] = useState<typeof universities[number] | null>(null);

  const stats = useMemo(() => {
    const total = list.length;
    const active = list.filter((u) => u.status === "active").length;
    const students = list.reduce((s, u) => s + u.studentCount, 0);
    const subsidies = list.filter((u) => u.subsidyActive).length;
    return { total, active, students, subsidies };
  }, [list]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trường đại học đối tác"
        description="Quản lý thông tin trường, cơ sở, domain và trợ giá vé."
        icon={<School className="size-6" />}
        actions={
          <ExpressiveButton variant="filled" size="sm" onClick={() => setOpenAdd(true)}>
            <Plus className="size-4" /> Thêm trường
          </ExpressiveButton>
        }
      />

      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard label="Tổng trường đối tác" value={<Counter to={stats.total} />} icon={<School className="size-6" />} accent="primary" hint={`${stats.active} đang hoạt động`} trend="up" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Sinh viên đăng ký" value={<Counter to={stats.students} />} icon={<GraduationCap className="size-6" />} accent="tertiary" hint="Trên 4 trường" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Trường có trợ giá" value={<Counter to={stats.subsidies} />} icon={<Percent className="size-6" />} accent="success" hint="DTU, DUT" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Tuyến đã gán" value={<Counter to={list.reduce((s, u) => s + u.routeCount, 0)} />} icon={<RouteIcon className="size-6" />} accent="secondary" hint="6 tuyến — trường" />
        </StaggerItem>
      </StaggerGroup>

      {/* Universities table */}
      <ExpressiveCard variant="filled" className="p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-outline-variant/40">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-on-surface">Danh sách trường</h2>
            <p className="text-sm text-on-surface-variant">{list.length} trường</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
              <Input placeholder="Tìm trường..." className="pl-9 w-full h-10 rounded-full bg-surface-container-lowest" />
            </div>
          </div>
        </div>
        <div className="max-h-[520px] overflow-y-auto overflow-x-auto scrollbar-soft">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
              <TableRow className="border-outline-variant/40 hover:bg-transparent">
                <TableHead className="min-w-[260px]">Trường</TableHead>
                <TableHead>Cơ sở</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead className="text-right">Sinh viên</TableHead>
                <TableHead className="text-right">Tuyến</TableHead>
                <TableHead>Trợ giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((u) => (
                <TableRow key={u.id} className="border-outline-variant/30 cursor-pointer" onClick={() => setEditing(u)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UniLogo logo={u.logo} color={u.color} logoUrl={u.logoUrl} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{u.name}</p>
                        <p className="text-xs text-on-surface-variant">{u.code} · {u.shortName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm text-on-surface">
                      <Building2 className="size-3.5 text-on-surface-variant" /> {u.campuses.length}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant">
                      <Globe className="size-3.5" /> {u.domains.length}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-on-surface">{u.studentCount.toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-on-surface">{u.routeCount}</TableCell>
                  <TableCell>
                    {u.subsidyActive ? <StatusPill label="Đang áp dụng" tone="success" /> : <StatusPill label="Không" tone="neutral" />}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.status === "active"}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          setLockTarget(u);
                        } else {
                          setList((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: "active" } : x)));
                          toast.success(`Đã mở khóa trường ${u.shortName}`);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="state-layer inline-flex size-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest"
                          aria-label="Thao tác"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => setEditing(u)}>
                          <Eye className="size-4" /> Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditing(u)}>
                          <Pencil className="size-4" /> Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-error"
                          onClick={() => setLockTarget(u)}
                        >
                          <Lock className="size-4" /> {u.status === "active" ? "Khóa trường" : "Mở khóa"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ExpressiveCard>

      {/* Add Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm trường đại học đối tác</DialogTitle>
            <DialogDescription>Nhập thông tin cơ bản. Có thể bổ sung cơ sở và domain sau.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-code">Mã trường</Label>
              <Input id="add-code" placeholder="VD: DTU" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-short">Tên viết tắt</Label>
              <Input id="add-short" placeholder="VD: Duy Tân" className="rounded-xl" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="add-name">Tên đầy đủ</Label>
              <Input id="add-name" placeholder="Trường Đại học Duy Tân" className="rounded-xl" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="add-email">Email liên hệ</Label>
              <Input id="add-email" type="email" placeholder="studentaffairs@duytan.edu.vn" className="rounded-xl" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="add-addr">Địa chỉ</Label>
              <Input id="add-addr" placeholder="254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setOpenAdd(false)}>Hủy</ExpressiveButton>
            <ExpressiveButton
              variant="filled"
              onClick={() => {
                setOpenAdd(false);
                toast.success("Đã thêm trường mới. Vui lòng bổ sung cơ sở và domain.");
              }}
            >
              <Save className="size-4" /> Lưu trường
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Detail Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-soft">
          {editing && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <UniLogo logo={editing.logo} color={editing.color} size="lg" />
                  <div>
                    <DialogTitle className="text-2xl">{editing.name}</DialogTitle>
                    <DialogDescription>{editing.code} · {editing.contactEmail}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="space-y-1.5">
                  <Label>Mã trường</Label>
                  <Input defaultValue={editing.code} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tên viết tắt</Label>
                  <Input defaultValue={editing.shortName} className="rounded-xl" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Email liên hệ</Label>
                  <Input defaultValue={editing.contactEmail} className="rounded-xl" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Địa chỉ</Label>
                  <Input defaultValue={editing.address} className="rounded-xl" />
                </div>
              </div>

              {/* Campuses list */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-on-surface">Cơ sở ({editing.campuses.length})</p>
                  <ExpressiveButton variant="text" size="sm"><Plus className="size-4" /> Thêm cơ sở</ExpressiveButton>
                </div>
                <div className="space-y-2">
                  {editing.campuses.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-tertiary-container text-on-tertiary-container">
                        <MapPin className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{c.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{c.address}</p>
                      </div>
                      <StatusPill label={c.code} tone="tertiary" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Domains */}
              <div className="mt-3">
                <p className="text-sm font-medium text-on-surface mb-2">Domain email ({editing.domains.length})</p>
                <div className="flex flex-wrap gap-2">
                  {editing.domains.map((d) => (
                    <Chip key={d} variant="input">
                      <Globe className="size-3.5" /> {d}
                    </Chip>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <ExpressiveButton variant="text" onClick={() => setEditing(null)}>Đóng</ExpressiveButton>
                <ExpressiveButton
                  variant="filled"
                  onClick={() => {
                    setEditing(null);
                    toast.success(`Đã cập nhật thông tin ${editing.shortName}`);
                  }}
                >
                  <Save className="size-4" /> Lưu thay đổi
                </ExpressiveButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lock/Unlock AlertDialog */}
      <AlertDialog open={!!lockTarget} onOpenChange={(o) => !o && setLockTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lockTarget?.status === "active" ? "Khóa trường đối tác?" : "Mở khóa trường?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lockTarget?.status === "active"
                ? `Trường ${lockTarget?.shortName} sẽ ngừng hoạt động. Sinh viên sẽ không thể đăng ký mới, nhưng dữ liệu vẫn được giữ lại.`
                : `Trường ${lockTarget?.shortName} sẽ hoạt động trở lại. Sinh viên có thể tiếp tục đăng ký.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => {
                if (!lockTarget) return;
                const next = lockTarget.status === "active" ? "inactive" : "active";
                setList((prev) => prev.map((x) => (x.id === lockTarget.id ? { ...x, status: next } : x)));
                toast.success(next === "inactive" ? `Đã khóa trường ${lockTarget.shortName}` : `Đã mở khóa ${lockTarget.shortName}`);
                setLockTarget(null);
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// 3. Uni Admins — NEW (Tài khoản Admin trường)
// ============================================================
function UniAdminsScreen() {
  const [list, setList] = useState(() => universityAdmins.map((u) => ({ ...u })));
  const [openAdd, setOpenAdd] = useState(false);
  const [lockTarget, setLockTarget] = useState<typeof universityAdmins[number] | null>(null);
  const [resetTarget, setResetTarget] = useState<typeof universityAdmins[number] | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài khoản Admin trường"
        description="Quản lý tài khoản quản trị trường — kích hoạt, khóa, đặt lại mật khẩu."
        icon={<GraduationCap className="size-6" />}
        actions={
          <ExpressiveButton variant="filled" size="sm" onClick={() => setOpenAdd(true)}>
            <UserPlus className="size-4" /> Thêm Admin trường
          </ExpressiveButton>
        }
      />

      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard label="Tổng tài khoản" value={<Counter to={list.length} />} icon={<Users className="size-6" />} accent="primary" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Đang hoạt động" value={<Counter to={list.filter((u) => u.status === "active").length} />} icon={<ShieldCheck className="size-6" />} accent="success" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Chờ duyệt" value={<Counter to={list.filter((u) => u.status === "pending").length} />} icon={<Clock className="size-6" />} accent="warning" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Đã khóa" value={<Counter to={list.filter((u) => u.status === "locked").length} />} icon={<ShieldX className="size-6" />} accent="error" />
        </StaggerItem>
      </StaggerGroup>

      <ExpressiveCard variant="filled" className="p-0 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/40">
          <h2 className="text-lg font-semibold text-on-surface">Danh sách University Admin</h2>
          <p className="text-sm text-on-surface-variant">{list.length} tài khoản trên 4 trường</p>
        </div>
        <div className="max-h-[520px] overflow-y-auto overflow-x-auto scrollbar-soft">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
              <TableRow className="border-outline-variant/40 hover:bg-transparent">
                <TableHead className="min-w-[260px]">Người dùng</TableHead>
                <TableHead>Trường</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Đăng nhập gần nhất</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((u) => (
                <TableRow key={u.id} className="border-outline-variant/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container font-medium text-sm">
                        {u.name.split(" ").slice(-2).map((p) => p[0]).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{u.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><StatusPill label={u.university} tone="tertiary" /></TableCell>
                  <TableCell><UserStatusPill status={u.status} /></TableCell>
                  <TableCell className="text-sm text-on-surface-variant">{u.createdAt}</TableCell>
                  <TableCell className="text-sm text-on-surface-variant">{u.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="state-layer inline-flex size-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest" aria-label="Thao tác">
                          <MoreVertical className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onClick={() => {
                            const next = u.status === "active" ? "locked" : "active";
                            if (u.status === "active") {
                              setLockTarget(u);
                            } else {
                              setList((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: next } : x)));
                              toast.success(`Đã mở khóa ${u.name}`);
                            }
                          }}
                        >
                          {u.status === "active" ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                          {u.status === "active" ? "Khóa tài khoản" : "Kích hoạt"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetTarget(u)}>
                          <KeyRound className="size-4" /> Đặt lại mật khẩu
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-error">
                          <ShieldX className="size-4" /> Xóa tài khoản
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ExpressiveCard>

      {/* Add Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm tài khoản University Admin</DialogTitle>
            <DialogDescription>Tài khoản sẽ được kích hoạt sau khi trường xác nhận email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Trường đại học</Label>
              <Select defaultValue="uni1">
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adm-name">Họ và tên</Label>
              <Input id="adm-name" placeholder="VD: Nguyễn Văn A" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adm-email">Email</Label>
              <Input id="adm-email" type="email" placeholder="admin@duytan.edu.vn" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setOpenAdd(false)}>Hủy</ExpressiveButton>
            <ExpressiveButton
              variant="filled"
              onClick={() => {
                setOpenAdd(false);
                toast.success("Đã tạo tài khoản University Admin. Email kích hoạt đã được gửi.");
              }}
            >
              <UserPlus className="size-4" /> Tạo tài khoản
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock AlertDialog */}
      <AlertDialog open={!!lockTarget} onOpenChange={(o) => !o && setLockTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Khóa tài khoản University Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              {lockTarget?.name} ({lockTarget?.email}) sẽ không thể đăng nhập. Các thao tác đã thực hiện vẫn được giữ lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-error text-on-error hover:bg-error/90"
              onClick={() => {
                if (!lockTarget) return;
                setList((prev) => prev.map((x) => (x.id === lockTarget.id ? { ...x, status: "locked" } : x)));
                toast.success(`Đã khóa tài khoản ${lockTarget.name}`);
                setLockTarget(null);
              }}
            >
              <Lock className="size-4" /> Khóa tài khoản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password AlertDialog */}
      <AlertDialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Đặt lại mật khẩu?</AlertDialogTitle>
            <AlertDialogDescription>
              Mật khẩu mới sẽ được gửi tới email {resetTarget?.email}. Mật khẩu hiện tại sẽ bị vô hiệu ngay lập tức.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => {
                toast.success(`Đã gửi email đặt lại mật khẩu tới ${resetTarget?.email}`);
                setResetTarget(null);
              }}
            >
              <KeyRound className="size-4" /> Gửi email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// 4. Route ↔ University — NEW (Gán tuyến cho trường)
// ============================================================
function RouteUniScreen() {
  const [mappings, setMappings] = useState(() => routeUniversities.map((m) => ({ ...m })));
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0].id);
  const [selectedUniId, setSelectedUniId] = useState<string>("");

  const isMapped = (routeId: string, uniId: string) =>
    mappings.some((m) => m.routeId === routeId && m.universityId === uniId && m.status === "active");

  const toggle = (routeId: string, uniId: string) => {
    const existing = mappings.find((m) => m.routeId === routeId && m.universityId === uniId);
    const uni = universityById(uniId);
    const route = routes.find((r) => r.id === routeId);
    if (existing) {
      // toggle status
      setMappings((prev) => prev.map((m) => (m.routeId === routeId && m.universityId === uniId ? { ...m, status: m.status === "active" ? "inactive" : "active" } : m)));
      toast.success(`Đã hủy gán tuyến ${route?.code} cho ${uni?.shortName}`);
    } else {
      setMappings((prev) => [...prev, { routeId, universityId: uniId, activeFrom: new Date().toISOString().slice(0, 10), status: "active" }]);
      toast.success(`Đã gán tuyến ${route?.code} cho ${uni?.shortName}`);
    }
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);
  const selectedUni = universities.find((u) => u.id === selectedUniId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gán tuyến cho trường"
        description="Quản lý liên kết tuyến xe — trường đối tác. Bật/tắt để gán hoặc hủy gán."
        icon={<RouteIcon className="size-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left pane — Routes */}
        <ExpressiveCard variant="filled" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-on-surface">Tuyến xe</h2>
              <p className="text-xs text-on-surface-variant">{routes.length} tuyến · Chọn để xem trường đã gán</p>
            </div>
            <RouteIcon className="size-5 text-on-surface-variant" />
          </div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto scrollbar-soft pr-1">
            {routes.map((r) => {
              const count = mappings.filter((m) => m.routeId === r.id && m.status === "active").length;
              const selected = r.id === selectedRouteId;
              return (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRouteId(r.id); setSelectedUniId(""); }}
                  className={cn(
                    "state-layer w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-colors",
                    selected ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-lowest hover:bg-surface-container-high"
                  )}
                >
                  <RouteColorDot color={r.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.code} · {r.name}</p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">{r.from} → {r.to}</p>
                  </div>
                  <StatusPill label={`${count} trường`} tone={count > 0 ? "primary" : "neutral"} />
                </button>
              );
            })}
          </div>
        </ExpressiveCard>

        {/* Right pane — Universities */}
        <ExpressiveCard variant="filled" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-on-surface">Trường đại học</h2>
              <p className="text-xs text-on-surface-variant">{universities.length} trường · Chọn để xem tuyến đã gán</p>
            </div>
            <School className="size-5 text-on-surface-variant" />
          </div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto scrollbar-soft pr-1">
            {universities.map((u) => {
              const count = mappings.filter((m) => m.universityId === u.id && m.status === "active").length;
              const selected = u.id === selectedUniId;
              return (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUniId(u.id); setSelectedRouteId(""); }}
                  className={cn(
                    "state-layer w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-colors",
                    selected ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-lowest hover:bg-surface-container-high"
                  )}
                >
                  <UniLogo logo={u.logo} color={u.color} logoUrl={u.logoUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.shortName}</p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">{u.code} · {u.campuses.length} cơ sở</p>
                  </div>
                  <StatusPill label={`${count} tuyến`} tone={count > 0 ? "primary" : "neutral"} />
                </button>
              );
            })}
          </div>
        </ExpressiveCard>
      </div>

      {/* Mapping matrix */}
      <ExpressiveCard variant="filled" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">
              {selectedRoute ? `Tuyến ${selectedRoute.code} — gán cho trường` : selectedUni ? `${selectedUni.shortName} — các tuyến đã gán` : "Ma trận gán tuyến — trường"}
            </h2>
            <p className="text-sm text-on-surface-variant">Bật/tắt công tắc để gán hoặc hủy gán</p>
          </div>
          {(selectedRoute || selectedUni) && (
            <ExpressiveButton
              variant="text"
              size="sm"
              onClick={() => { setSelectedRouteId(""); setSelectedUniId(""); }}
            >
              Xem tất cả
            </ExpressiveButton>
          )}
        </div>

        {/* Mobile stacked view — one card per route */}
        <div className="sm:hidden space-y-3">
          {routes.map((r) => (
            <div
              key={r.id}
              className={cn(
                "rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-3",
                selectedRoute && r.id !== selectedRoute.id && "opacity-40"
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <RouteColorDot color={r.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-on-surface">{r.code}</p>
                  <p className="text-xs text-on-surface-variant truncate">{r.from} → {r.to}</p>
                </div>
              </div>
              <div className="space-y-1">
                {universities.map((u) => {
                  const mapped = isMapped(r.id, u.id);
                  const dim = selectedUni && u.id !== selectedUni.id;
                  return (
                    <div
                      key={u.id}
                      className={cn(
                        "flex items-center justify-between gap-2 min-h-11 rounded-xl px-2 -mx-2 state-layer",
                        dim && "opacity-40"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UniLogo logo={u.logo} color={u.color} logoUrl={u.logoUrl} size="sm" />
                        <span className="text-sm text-on-surface truncate">{u.shortName}</span>
                      </div>
                      <Switch
                        checked={mapped}
                        onCheckedChange={() => toggle(r.id, u.id)}
                        aria-label={`Gán ${r.code} cho ${u.shortName}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Matrix — desktop only */}
        <div className="hidden sm:block overflow-x-auto scrollbar-soft">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-on-surface-variant uppercase tracking-wide px-3 py-2">Tuyến</th>
                {universities.map((u) => (
                  <th key={u.id} className="px-3 py-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <UniLogo logo={u.logo} color={u.color} logoUrl={u.logoUrl} size="sm" />
                      <span className="text-xs font-medium text-on-surface">{u.code}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id} className={cn("border-t border-outline-variant/30", selectedRoute && r.id !== selectedRoute.id && "opacity-40")}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <RouteColorDot color={r.color} />
                      <div>
                        <p className="text-sm font-medium text-on-surface">{r.code}</p>
                        <p className="text-xs text-on-surface-variant">{r.from} → {r.to}</p>
                      </div>
                    </div>
                  </td>
                  {universities.map((u) => {
                    const mapped = isMapped(r.id, u.id);
                    const dim = selectedUni && u.id !== selectedUni.id;
                    return (
                      <td key={u.id} className={cn("px-3 py-3 text-center", dim && "opacity-40")}>
                        <div className="flex justify-center">
                          <Switch
                            checked={mapped}
                            onCheckedChange={() => toggle(r.id, u.id)}
                            aria-label={`Gán ${r.code} cho ${u.shortName}`}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {mappings.filter((m) => m.status === "active").map((m, i) => {
            const r = routes.find((x) => x.id === m.routeId);
            const u = universities.find((x) => x.id === m.universityId);
            if (!r || !u) return null;
            return (
              <Chip key={i} variant="input">
                <RouteColorDot color={r.color} /> {r.code} ↔ {u.code}
              </Chip>
            );
          })}
          {mappings.filter((m) => m.status === "active").length === 0 && (
            <p className="text-sm text-on-surface-variant">Chưa có gán tuyến nào.</p>
          )}
        </div>
      </ExpressiveCard>
    </div>
  );
}

// ============================================================
// 5. Audit — NEW (Audit log)
// ============================================================
function AuditScreen() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      if (roleFilter !== "all" && log.actorRole !== roleFilter) return false;
      if (resultFilter !== "all" && log.result !== resultFilter) return false;
      if (search && !log.action.toLowerCase().includes(search.toLowerCase()) && !log.actor.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [roleFilter, resultFilter, search]);

  const roleLabel: Record<string, string> = {
    admin: "Quản trị",
    coordinator: "Điều phối",
    university_admin: "Admin trường",
    student: "Sinh viên",
    driver: "Tài xế",
    assistant: "Phụ xe",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Nhật ký các thao tác quan trọng — import sinh viên, gán tuyến, trợ giá, khóa/mở tài khoản."
        icon={<ScrollText className="size-6" />}
      />

      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard label="Tổng sự kiện" value={<Counter to={auditLogs.length} />} icon={<History className="size-6" />} accent="primary" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Thành công" value={<Counter to={auditLogs.filter((l) => l.result === "success").length} />} icon={<CheckCircle2 className="size-6" />} accent="success" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Thất bại" value={<Counter to={auditLogs.filter((l) => l.result === "failure").length} />} icon={<XCircle className="size-6" />} accent="error" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Hôm nay" value={<Counter to={3} />} icon={<Clock className="size-6" />} accent="tertiary" />
        </StaggerItem>
      </StaggerGroup>

      <ExpressiveCard variant="filled" className="p-0 overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-outline-variant/40">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
            <Input
              placeholder="Tìm theo hành động hoặc người thực hiện..."
              className="pl-9 h-10 rounded-full bg-surface-container-lowest"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10 rounded-full"><Filter className="size-4 mr-1" /><SelectValue placeholder="Vai trò" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="admin">Quản trị</SelectItem>
              <SelectItem value="university_admin">Admin trường</SelectItem>
              <SelectItem value="coordinator">Điều phối</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-full"><SelectValue placeholder="Kết quả" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kết quả</SelectItem>
              <SelectItem value="success">Thành công</SelectItem>
              <SelectItem value="failure">Thất bại</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="max-h-[560px] overflow-y-auto overflow-x-auto scrollbar-soft">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
              <TableRow className="border-outline-variant/40 hover:bg-transparent">
                <TableHead className="min-w-[160px]">Thời gian</TableHead>
                <TableHead className="min-w-[200px]">Người thực hiện</TableHead>
                <TableHead className="min-w-[260px]">Hành động</TableHead>
                <TableHead>Trường</TableHead>
                <TableHead>Kết quả</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      icon={<ScrollText className="size-6" />}
                      title="Không có bản ghi phù hợp"
                      description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => (
                  <TableRow key={log.id} className="border-outline-variant/30">
                    <TableCell className="text-sm text-on-surface-variant whitespace-nowrap">{log.timestamp}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn("flex size-8 items-center justify-center rounded-xl text-xs font-medium",
                          log.actorRole === "admin" ? "bg-error-container text-on-error-container"
                            : log.actorRole === "university_admin" ? "bg-primary-container text-on-primary-container"
                              : log.actorRole === "coordinator" ? "bg-tertiary-container text-on-tertiary-container"
                                : "bg-surface-container-highest text-on-surface-variant"
                        )}>
                          {log.actor.split(" ").slice(-1)[0][0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{log.actor}</p>
                          <p className="text-xs text-on-surface-variant">{roleLabel[log.actorRole] ?? log.actorRole}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-on-surface">{log.action}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{log.target}</p>
                    </TableCell>
                    <TableCell>
                      {log.university ? <StatusPill label={log.university} tone="tertiary" /> : <span className="text-sm text-on-surface-variant">—</span>}
                    </TableCell>
                    <TableCell>
                      {log.result === "success" ? <StatusPill label="Thành công" tone="success" /> : <StatusPill label="Thất bại" tone="error" />}
                    </TableCell>
                    <TableCell className="text-xs text-on-surface-variant font-mono">{log.ip}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/40 text-xs text-on-surface-variant">
          <span>Hiển thị {filtered.length} / {auditLogs.length} bản ghi</span>
          <span>Cập nhật lần cuối: vừa xong</span>
        </div>
      </ExpressiveCard>
    </div>
  );
}

// ============================================================
// 6. Users (REQ-ADM-004, 001)
// ============================================================
function UsersScreen() {
  const [list, setList] = useState(() => allUsers.map((u) => ({ ...u })));
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<typeof allUsers[number] | null>(null);
  const [lockTarget, setLockTarget] = useState<typeof allUsers[number] | null>(null);
  const [resetTarget, setResetTarget] = useState<typeof allUsers[number] | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = useMemo(() => {
    return list.filter((u) => {
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    });
  }, [list, search, roleFilter, statusFilter]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  // Reset to page 1 on filter change (basic effect)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài khoản người dùng"
        description="Quản lý toàn bộ tài khoản trong hệ thống — sinh viên, tài xế, phụ xe, điều phối, quản trị trường."
        icon={<Users className="size-6" />}
        actions={
          <ExpressiveButton variant="filled" size="sm" onClick={() => setOpenAdd(true)}>
            <UserPlus className="size-4" /> Thêm người dùng
          </ExpressiveButton>
        }
      />

      {/* Filters */}
      <ExpressiveCard variant="filled" className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
            <Input
              placeholder="Tìm theo tên hoặc email..."
              className="pl-9 h-10 rounded-full bg-surface-container-lowest"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10 rounded-full"><SelectValue placeholder="Vai trò" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="Sinh viên">Sinh viên</SelectItem>
              <SelectItem value="Tài xế">Tài xế</SelectItem>
              <SelectItem value="Phụ xe">Phụ xe</SelectItem>
              <SelectItem value="Điều phối">Điều phối</SelectItem>
              <SelectItem value="Quản trị">Quản trị</SelectItem>
              <SelectItem value="University Admin">University Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 rounded-full"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="locked">Đã khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ExpressiveCard>

      {/* Table */}
      <ExpressiveCard variant="filled" className="p-0 overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-soft">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
              <TableRow className="border-outline-variant/40 hover:bg-transparent">
                <TableHead className="min-w-[260px]">Người dùng</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Số chuyến</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState icon={<Users className="size-6" />} title="Không tìm thấy người dùng" description="Thử thay đổi bộ lọc." />
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((u) => (
                  <TableRow key={u.id} className="border-outline-variant/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container font-medium text-sm">
                          {u.name.split(" ").slice(-2).map((p) => p[0]).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{u.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><RolePill role={u.role} /></TableCell>
                    <TableCell><UserStatusPill status={u.status} /></TableCell>
                    <TableCell className="text-sm text-on-surface-variant">{u.createdAt}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-on-surface">{u.trips}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="state-layer inline-flex size-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest" aria-label="Thao tác">
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => setDetail(u)}>
                            <Eye className="size-4" /> Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLockTarget(u)}>
                            {u.status === "active" ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                            {u.status === "active" ? "Khóa tài khoản" : "Mở khóa"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetTarget(u)}>
                            <KeyRound className="size-4" /> Đặt lại mật khẩu
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/40 text-xs text-on-surface-variant">
          <span>Hiển thị {paged.length} / {filtered.length} người dùng</span>
          <div className="flex items-center gap-2">
            <ExpressiveButton variant="outlined" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</ExpressiveButton>
            <span className="text-on-surface font-medium">Trang {page} / {totalPages}</span>
            <ExpressiveButton variant="outlined" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</ExpressiveButton>
          </div>
        </div>
      </ExpressiveCard>

      {/* Add user Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm người dùng</DialogTitle>
            <DialogDescription>Tài khoản sẽ được tạo với mật khẩu tạm thời, gửi qua email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nu-name">Họ và tên</Label>
              <Input id="nu-name" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-email">Email</Label>
              <Input id="nu-email" type="email" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vai trò</Label>
                <Select defaultValue="Sinh viên">
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sinh viên">Sinh viên</SelectItem>
                    <SelectItem value="Tài xế">Tài xế</SelectItem>
                    <SelectItem value="Phụ xe">Phụ xe</SelectItem>
                    <SelectItem value="Điều phối">Điều phối</SelectItem>
                    <SelectItem value="Quản trị">Quản trị</SelectItem>
                    <SelectItem value="University Admin">University Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nu-phone">Điện thoại</Label>
                <Input id="nu-phone" className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <ExpressiveButton variant="text" onClick={() => setOpenAdd(false)}>Hủy</ExpressiveButton>
            <ExpressiveButton variant="filled" onClick={() => { setOpenAdd(false); toast.success("Đã tạo tài khoản. Email kích hoạt đã được gửi."); }}>
              <UserPlus className="size-4" /> Tạo tài khoản
            </ExpressiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết người dùng</DialogTitle>
                <DialogDescription>{detail.email}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container font-bold">
                    {detail.name.split(" ").slice(-2).map((p) => p[0]).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-on-surface truncate">{detail.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <RolePill role={detail.role} />
                      <UserStatusPill status={detail.status} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Email</p>
                    <p className="text-on-surface font-medium truncate">{detail.email}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Ngày tạo</p>
                    <p className="text-on-surface font-medium">{detail.createdAt}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Số chuyến</p>
                    <p className="text-on-surface font-medium">{detail.trips}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Vai trò</p>
                    <p className="text-on-surface font-medium">{detail.role}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <ExpressiveButton variant="text" onClick={() => setDetail(null)}>Đóng</ExpressiveButton>
                <ExpressiveButton variant="filled" onClick={() => { setDetail(null); toast.success("Đã lưu thông tin."); }}>
                  <Save className="size-4" /> Lưu
                </ExpressiveButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lock AlertDialog */}
      <AlertDialog open={!!lockTarget} onOpenChange={(o) => !o && setLockTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{lockTarget?.status === "active" ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {lockTarget?.status === "active"
                ? `${lockTarget?.name} sẽ không thể đăng nhập. Lịch sử giao dịch vẫn được giữ.`
                : `${lockTarget?.name} sẽ có thể đăng nhập lại bình thường.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className={cn("rounded-full", lockTarget?.status === "active" && "bg-error text-on-error hover:bg-error/90")}
              onClick={() => {
                if (!lockTarget) return;
                const next = lockTarget.status === "active" ? "locked" : "active";
                setList((prev) => prev.map((x) => (x.id === lockTarget.id ? { ...x, status: next } : x)));
                toast.success(next === "locked" ? `Đã khóa ${lockTarget.name}` : `Đã mở khóa ${lockTarget.name}`);
                setLockTarget(null);
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password AlertDialog */}
      <AlertDialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Đặt lại mật khẩu?</AlertDialogTitle>
            <AlertDialogDescription>
              Mật khẩu mới sẽ được gửi tới {resetTarget?.email}. Mật khẩu hiện tại bị vô hiệu ngay lập tức.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => {
                toast.success(`Đã gửi email đặt lại mật khẩu tới ${resetTarget?.email}`);
                setResetTarget(null);
              }}
            >
              <KeyRound className="size-4" /> Gửi email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// 7. Complaints (REQ-ADM-002)
// ============================================================
function ComplaintsScreen() {
  const [list, setList] = useState(() => complaints.map((c) => ({ ...c })));
  const [tab, setTab] = useState("all");
  const [detail, setDetail] = useState<Complaint | null>(null);
  const [note, setNote] = useState("");

  const counts = {
    all: list.length,
    new: list.filter((c) => c.status === "new").length,
    processing: list.filter((c) => c.status === "processing").length,
    resolved: list.filter((c) => c.status === "resolved").length,
    rejected: list.filter((c) => c.status === "rejected").length,
  };

  const filtered = tab === "all" ? list : list.filter((c) => c.status === tab);

  const updateStatus = (id: string, status: Complaint["status"]) => {
    setList((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    setDetail((d) => (d && d.id === id ? { ...d, status } : d));
    const label: Record<string, string> = { new: "Mới", processing: "Đang xử lý", resolved: "Đã giải quyết", rejected: "Từ chối" };
    toast.success(`Đã cập nhật trạng thái: ${label[status]}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xử lý khiếu nại"
        description="Theo dõi, phân loại và giải quyết khiếu nại từ sinh viên."
        icon={<ShieldAlert className="size-6" />}
      />

      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem><StatCard label="Mới" value={<Counter to={counts.new} />} icon={<Bell className="size-6" />} accent="primary" /></StaggerItem>
        <StaggerItem><StatCard label="Đang xử lý" value={<Counter to={counts.processing} />} icon={<Clock className="size-6" />} accent="warning" /></StaggerItem>
        <StaggerItem><StatCard label="Đã giải quyết" value={<Counter to={counts.resolved} />} icon={<CheckCircle2 className="size-6" />} accent="success" /></StaggerItem>
        <StaggerItem><StatCard label="Từ chối" value={<Counter to={counts.rejected} />} icon={<XCircle className="size-6" />} accent="error" /></StaggerItem>
      </StaggerGroup>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto scrollbar-soft pb-1">
          <TabsList className="rounded-full h-11 p-1 bg-surface-container-high">
            <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">Tất cả ({counts.all})</TabsTrigger>
            <TabsTrigger value="new" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">Mới ({counts.new})</TabsTrigger>
            <TabsTrigger value="processing" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">Đang xử lý ({counts.processing})</TabsTrigger>
            <TabsTrigger value="resolved" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">Đã giải quyết ({counts.resolved})</TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-full data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container">Từ chối ({counts.rejected})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={tab} className="mt-4">
          <ExpressiveCard variant="filled" className="p-0 overflow-hidden">
            <div className="max-h-[520px] overflow-y-auto overflow-x-auto scrollbar-soft">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
                  <TableRow className="border-outline-variant/40 hover:bg-transparent">
                    <TableHead className="min-w-[140px]">Mã</TableHead>
                    <TableHead>Sinh viên</TableHead>
                    <TableHead className="min-w-[220px]">Chủ đề</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Ưu tiên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyState icon={<ShieldAlert className="size-6" />} title="Không có khiếu nại" description="Chưa có khiếu nại nào trong mục này." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c) => (
                      <TableRow key={c.id} className="border-outline-variant/30 cursor-pointer" onClick={() => { setDetail(c); setNote(""); }}>
                        <TableCell className="text-sm font-mono text-on-surface">{c.code}</TableCell>
                        <TableCell className="text-sm text-on-surface">{c.studentName}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-on-surface truncate max-w-[240px]">{c.subject}</p>
                        </TableCell>
                        <TableCell className="text-sm text-on-surface-variant">{c.category}</TableCell>
                        <TableCell><PriorityPill priority={c.priority} /></TableCell>
                        <TableCell><ComplaintStatusPill status={c.status} /></TableCell>
                        <TableCell className="text-sm text-on-surface-variant whitespace-nowrap">{c.createdAt}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ExpressiveCard>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-base">{detail.code}</span>
                  <ComplaintStatusPill status={detail.status} />
                </DialogTitle>
                <DialogDescription>{detail.subject}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Sinh viên</p>
                    <p className="text-on-surface font-medium">{detail.studentName}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Danh mục</p>
                    <p className="text-on-surface font-medium">{detail.category}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Ưu tiên</p>
                    <div className="mt-1"><PriorityPill priority={detail.priority} /></div>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Ngày tạo</p>
                    <p className="text-on-surface font-medium">{detail.createdAt}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3">
                  <p className="text-xs text-on-surface-variant mb-1">Mô tả chi tiết</p>
                  <p className="text-sm text-on-surface leading-relaxed">{detail.description}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="note">Ghi chú xử lý</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Mô tả hướng xử lý, kết quả điều tra, biện pháp..."
                    className="rounded-xl min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <ExpressiveButton
                  variant="outlined"
                  onClick={() => updateStatus(detail.id, "processing")}
                  disabled={detail.status === "processing"}
                >
                  <Clock className="size-4" /> Đang xử lý
                </ExpressiveButton>
                <ExpressiveButton
                  variant="tonal"
                  onClick={() => updateStatus(detail.id, "resolved")}
                  disabled={detail.status === "resolved"}
                >
                  <CheckCircle2 className="size-4" /> Đã giải quyết
                </ExpressiveButton>
                <ExpressiveButton
                  variant="error"
                  onClick={() => updateStatus(detail.id, "rejected")}
                  disabled={detail.status === "rejected"}
                >
                  <XCircle className="size-4" /> Từ chối
                </ExpressiveButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// 8. Violations (REQ-ADM-003)
// ============================================================
function ViolationsScreen() {
  const mockViolations = [
    { id: "v1", code: "VIO-2025-0034", reporter: "Lê Thị Phương", routeCode: "DN-02", type: "Dùng điện thoại khi lái", severity: "high", description: "Phụ xe báo cáo tài xế Đinh Văn Hùng gọi điện trong lúc chạy.", status: "investigating", createdAt: "2025-06-10" },
    { id: "v2", code: "VIO-2025-0033", reporter: "Lê Thị Phương", routeCode: "DN-01", type: "Không quét vé", severity: "medium", description: "Phụ xe không quét mã vé sinh viên Trần Bảo.", status: "open", createdAt: today_iso() },
    { id: "v3", code: "VIO-2025-0032", reporter: "Phạm Quốc Bảo", routeCode: "DN-03", type: "Bỏ trạm", severity: "medium", description: "Xe 43B-32345 không dừng trạm Chợ Linh Trung theo lịch.", status: "closed", createdAt: "2025-06-08" },
    { id: "v4", code: "VIO-2025-0031", reporter: "Phạm Quốc Bảo", routeCode: "DN-02", type: "Chạy quá tốc độ", severity: "high", description: "Tài xế chạy 62 km/h tại khu dân cư.", status: "closed", createdAt: "2025-06-05" },
  ];
  const all = [
    ...incidents.map((i) => ({ ...i, type: i.type === "delay" ? "Chậm chuyến" : i.type === "breakdown" ? "Hỏng xe" : i.type === "behavior" ? "Hành vi" : "Khác" })),
    ...mockViolations,
  ];
  const [list] = useState(all);
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<typeof all[number] | null>(null);

  const filtered = list.filter((v) => {
    if (sevFilter !== "all" && v.severity !== sevFilter) return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    return true;
  });

  const categoryStats = [
    { label: "Hành vi tài xế", count: list.filter((v) => String(v.type).includes("Hành vi") || String(v.type).includes("Điện thoại")).length, color: "var(--color-error)" },
    { label: "Chậm chuyến", count: list.filter((v) => v.type === "Chậm chuyến").length, color: "var(--color-warning)" },
    { label: "Hỏng xe", count: list.filter((v) => v.type === "Hỏng xe").length, color: "var(--color-tertiary)" },
    { label: "Khác", count: list.filter((v) => v.type === "Khác" || v.type === "Không quét vé" || v.type === "Bỏ trạm" || v.type === "Chạy quá tốc độ").length, color: "var(--color-primary)" },
  ];
  const maxCount = Math.max(...categoryStats.map((c) => c.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo vi phạm"
        description="Tổng hợp sự cố và vi phạm quy định của nhân viên và sinh viên."
        icon={<AlertTriangle className="size-6" />}
      />

      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem><StatCard label="Tổng vi phạm tháng" value={<Counter to={list.length} />} icon={<AlertTriangle className="size-6" />} accent="primary" /></StaggerItem>
        <StaggerItem><StatCard label="Mức độ cao" value={<Counter to={list.filter((v) => v.severity === "high").length} />} icon={<AlertCircle className="size-6" />} accent="error" /></StaggerItem>
        <StaggerItem><StatCard label="Đang điều tra" value={<Counter to={list.filter((v) => v.status === "investigating" || v.status === "open").length} />} icon={<Clock className="size-6" />} accent="warning" /></StaggerItem>
        <StaggerItem><StatCard label="Đã đóng" value={<Counter to={list.filter((v) => v.status === "closed").length} />} icon={<CheckCircle2 className="size-6" />} accent="success" /></StaggerItem>
      </StaggerGroup>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ExpressiveCard variant="filled" className="p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-on-surface mb-4">Phân loại vi phạm</h2>
          <div className="space-y-4">
            {categoryStats.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-on-surface-variant">{c.label}</span>
                  <span className="font-medium text-on-surface">{c.count}</span>
                </div>
                <M3Progress value={(c.count / maxCount) * 100} />
              </div>
            ))}
          </div>
        </ExpressiveCard>

        <ExpressiveCard variant="filled" className="p-0 overflow-hidden lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-outline-variant/40">
            <h2 className="text-lg font-semibold text-on-surface flex-1">Danh sách vi phạm</h2>
            <Select value={sevFilter} onValueChange={setSevFilter}>
              <SelectTrigger className="h-9 rounded-full sm:w-36"><SelectValue placeholder="Mức độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="high">Cao</SelectItem>
                <SelectItem value="medium">Trung bình</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 rounded-full sm:w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="open">Đang mở</SelectItem>
                <SelectItem value="investigating">Đang điều tra</SelectItem>
                <SelectItem value="closed">Đã đóng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="max-h-[460px] overflow-y-auto overflow-x-auto scrollbar-soft">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
                <TableRow className="border-outline-variant/40 hover:bg-transparent">
                  <TableHead className="min-w-[140px]">Mã</TableHead>
                  <TableHead className="min-w-[200px]">Loại</TableHead>
                  <TableHead>Tuyến</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState icon={<AlertTriangle className="size-6" />} title="Không có vi phạm" />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((v) => (
                    <TableRow key={v.id} className="border-outline-variant/30 cursor-pointer" onClick={() => setDetail(v)}>
                      <TableCell className="text-sm font-mono text-on-surface">{v.code}</TableCell>
                      <TableCell className="text-sm font-medium text-on-surface">{v.type}</TableCell>
                      <TableCell><StatusPill label={v.routeCode} tone="tertiary" /></TableCell>
                      <TableCell><PriorityPill priority={v.severity} /></TableCell>
                      <TableCell><ViolationStatusPill status={v.status} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ExpressiveCard>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-base">{detail.code}</span>
                  <ViolationStatusPill status={detail.status} />
                </DialogTitle>
                <DialogDescription>{detail.type} · Tuyến {detail.routeCode}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Người báo cáo</p>
                    <p className="text-on-surface font-medium">{detail.reporter}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Mức độ</p>
                    <div className="mt-1"><PriorityPill priority={detail.severity} /></div>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Ngày</p>
                    <p className="text-on-surface font-medium">{detail.createdAt}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-3">
                    <p className="text-xs text-on-surface-variant">Tuyến</p>
                    <p className="text-on-surface font-medium">{detail.routeCode}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3">
                  <p className="text-xs text-on-surface-variant mb-1">Mô tả</p>
                  <p className="text-sm text-on-surface leading-relaxed">{detail.description}</p>
                </div>
              </div>
              <DialogFooter>
                <ExpressiveButton variant="text" onClick={() => setDetail(null)}>Đóng</ExpressiveButton>
                <ExpressiveButton
                  variant="filled"
                  onClick={() => {
                    toast.success("Đã đánh giá và chuyển quy trình xử lý kỷ luật.");
                    setDetail(null);
                  }}
                >
                  <ShieldCheck className="size-4" /> Đánh giá & Chuyển xử lý
                </ExpressiveButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function today_iso() {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// 9. Fare (REQ-ADM-007)
// ============================================================
function FareScreen() {
  const [list, setList] = useState(() => routes.map((r) => ({ ...r })));
  const [applyNext, setApplyNext] = useState(false);
  const [editing, setEditing] = useState<typeof list[number] | null>(null);
  const [newFare, setNewFare] = useState("0");
  const [newPass, setNewPass] = useState("0");
  const [reason, setReason] = useState("");

  const history = [
    { id: 1, route: "DN-01", oldFare: 4000, newFare: 5000, date: "01/06/2025", by: "Võ Thu Hà", reason: "Điều chỉnh theo giá xăng" },
    { id: 2, route: "DN-02", oldFare: 6000, newFare: 7000, date: "01/06/2025", by: "Võ Thu Hà", reason: "Tăng cước theo khoảng cách" },
    { id: 3, route: "DN-03", oldFare: 5000, newFare: 6000, date: "15/05/2025", by: "Võ Thu Hà", reason: "Bù chi phí bảo trì" },
    { id: 4, route: "DN-01", oldPass: 160000, newPass: 180000, date: "01/05/2025", by: "Võ Thu Hà", reason: "Tăng giá vé tháng" },
  ];

  const openEdit = (r: typeof list[number]) => {
    setEditing(r);
    setNewFare(String(r.fare));
    setNewPass(String(r.monthlyPass));
    setReason("");
  };

  const fareChange = editing ? ((Number(newFare) - editing.fare) / editing.fare) * 100 : 0;
  const passChange = editing ? ((Number(newPass) - editing.monthlyPass) / editing.monthlyPass) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điều chỉnh giá vé"
        description="Quản lý giá vé lượt và vé tháng cho từng tuyến. Áp dụng ngay hoặc cho tháng tiếp theo."
        icon={<Tag className="size-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="apply-next" className="text-sm text-on-surface-variant">Áp dụng tháng tiếp theo</Label>
            <Switch id="apply-next" checked={applyNext} onCheckedChange={setApplyNext} />
          </div>
        }
      />

      <ExpressiveCard variant="filled" className="p-0 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/40">
          <h2 className="text-lg font-semibold text-on-surface">Bảng giá hiện hành</h2>
          <p className="text-sm text-on-surface-variant">{list.length} tuyến · Cập nhật lần cuối: 01/06/2025</p>
        </div>
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-soft">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
              <TableRow className="border-outline-variant/40 hover:bg-transparent">
                <TableHead className="min-w-[280px]">Tuyến</TableHead>
                <TableHead>Tần suất</TableHead>
                <TableHead className="text-right">Vé lượt</TableHead>
                <TableHead className="text-right">Vé tháng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => (
                <TableRow key={r.id} className="border-outline-variant/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <RouteColorDot color={r.color} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{r.code} · {r.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{r.from} → {r.to}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-on-surface-variant">{r.frequencyMin} phút/chuyến</TableCell>
                  <TableCell className="text-right text-sm font-medium text-on-surface">{formatVND(r.fare)}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-on-surface">{formatVND(r.monthlyPass)}</TableCell>
                  <TableCell className="text-right">
                    <ExpressiveButton variant="tonal" size="sm" onClick={() => openEdit(r)}>
                      <Pencil className="size-4" /> Sửa
                    </ExpressiveButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ExpressiveCard>

      {/* History */}
      <ExpressiveCard variant="filled" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="size-5 text-on-surface-variant" />
          <h2 className="text-lg font-semibold text-on-surface">Lịch sử điều chỉnh</h2>
        </div>
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl",
                (h.newFare ?? h.newPass) > (h.oldFare ?? h.oldPass)
                  ? "bg-error-container text-on-error-container"
                  : "bg-success-container text-on-surface"
              )}>
                {(h.newFare ?? h.newPass) > (h.oldFare ?? h.oldPass)
                  ? <TrendingUp className="size-5" />
                  : <TrendingDown className="size-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  Tuyến {h.route} · {h.oldFare ? `${formatVND(h.oldFare)} → ${formatVND(h.newFare)}` : `${formatVND(h.oldPass!)} → ${formatVND(h.newPass!)}`}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5 truncate">{h.reason} · {h.date} · bởi {h.by}</p>
              </div>
              <StatusPill label={((h.newFare ?? h.newPass) > (h.oldFare ?? h.oldPass)) ? "Tăng" : "Giảm"} tone={((h.newFare ?? h.newPass) > (h.oldFare ?? h.oldPass)) ? "error" : "success"} />
            </div>
          ))}
        </div>
      </ExpressiveCard>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RouteColorDot color={editing.color} /> Điều chỉnh giá — {editing.code}
                </DialogTitle>
                <DialogDescription>{editing.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fare">Vé lượt mới (đ)</Label>
                    <Input id="fare" type="number" value={newFare} onChange={(e) => setNewFare(e.target.value)} className="rounded-xl" />
                    <p className={cn("text-xs font-medium flex items-center gap-1",
                      fareChange > 0 ? "text-error" : fareChange < 0 ? "text-success" : "text-on-surface-variant"
                    )}>
                      <Percent className="size-3" />
                      {fareChange > 0 ? "+" : ""}{fareChange.toFixed(1)}% so với hiện tại
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pass">Vé tháng mới (đ)</Label>
                    <Input id="pass" type="number" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="rounded-xl" />
                    <p className={cn("text-xs font-medium flex items-center gap-1",
                      passChange > 0 ? "text-error" : passChange < 0 ? "text-success" : "text-on-surface-variant"
                    )}>
                      <Percent className="size-3" />
                      {passChange > 0 ? "+" : ""}{passChange.toFixed(1)}% so với hiện tại
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eff-date">Ngày áp dụng</Label>
                  <Input id="eff-date" type="date" defaultValue={today_iso()} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reason">Lý do điều chỉnh</Label>
                  <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Điều chỉnh theo giá xăng, bù chi phí..." className="rounded-xl min-h-[70px]" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
                  <div>
                    <p className="text-sm font-medium text-on-surface">Áp dụng cho tháng tiếp theo</p>
                    <p className="text-xs text-on-surface-variant">Nếu tắt, thay đổi có hiệu lực ngay</p>
                  </div>
                  <Switch defaultChecked={applyNext} />
                </div>
              </div>
              <DialogFooter>
                <ExpressiveButton variant="text" onClick={() => setEditing(null)}>Hủy</ExpressiveButton>
                <ExpressiveButton
                  variant="filled"
                  onClick={() => {
                    setList((prev) => prev.map((r) => (r.id === editing.id ? { ...r, fare: Number(newFare), monthlyPass: Number(newPass) } : r)));
                    toast.success(`Đã cập nhật giá vé tuyến ${editing.code}.`);
                    setEditing(null);
                  }}
                >
                  <Save className="size-4" /> Lưu thay đổi
                </ExpressiveButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// 10. Notify (REQ-ADM-006)
// ============================================================
function NotifyScreen() {
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("info");
  const [scheduleLater, setScheduleLater] = useState(false);
  const [sendAt, setSendAt] = useState("");

  const recent = [
    { id: 1, title: "Tuyến DN-04 tạm dừng hoạt động", audience: "Tất cả sinh viên", sent: 1248, date: "12/06/2025 09:00", status: "sent" },
    { id: 2, title: "Khuyến mãi vé tháng 7 — giảm 10%", audience: "Theo trường: Duy Tân", sent: 1248, date: "10/06/2025 14:30", status: "sent" },
    { id: 3, title: "Nhắc nhở thanh toán vé tháng 6", audience: "Sinh viên nợ phí", sent: 42, date: "05/06/2025 08:00", status: "sent" },
    { id: 4, title: "Bảo trì hệ thống 22/06 02:00-04:00", audience: "Tất cả người dùng", sent: 1261, date: "03/06/2025 17:00", status: "sent" },
    { id: 5, title: "Tuyển phụ xe tuyến DN-02", audience: "Nhân viên", sent: 12, date: "01/06/2025 10:00", status: "sent" },
  ];

  const priorityTone: Record<string, "primary" | "warning" | "error"> = {
    info: "primary",
    warning: "warning",
    important: "error",
  };
  const priorityLabel: Record<string, string> = { info: "Thông tin", warning: "Cảnh báo", important: "Quan trọng" };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gửi thông báo"
        description="Soạn và gửi thông báo tới sinh viên, nhân viên hoặc theo trường/campus."
        icon={<Megaphone className="size-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compose form */}
        <ExpressiveCard variant="filled" className="p-6">
          <h2 className="text-lg font-semibold text-on-surface mb-4">Soạn thông báo</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Đối tượng nhận</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả người dùng</SelectItem>
                  <SelectItem value="students">Tất cả sinh viên</SelectItem>
                  <SelectItem value="drivers">Tất cả tài xế</SelectItem>
                  <SelectItem value="uni">Theo trường</SelectItem>
                  <SelectItem value="campus">Theo campus</SelectItem>
                  <SelectItem value="staff">Nhân viên UniBus</SelectItem>
                </SelectContent>
              </Select>
              {(audience === "uni" || audience === "campus") && (
                <Select defaultValue="uni1">
                  <SelectTrigger className="rounded-xl h-11 mt-2"><SelectValue placeholder="Chọn trường" /></SelectTrigger>
                  <SelectContent>
                    {universities.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Tiêu đề</Label>
                <span className="text-xs text-on-surface-variant">{title.length}/80</span>
              </div>
              <Input
                id="title"
                value={title}
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Tuyến DN-04 tạm dừng hoạt động"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="msg">Nội dung</Label>
                <span className="text-xs text-on-surface-variant">{message.length}/240</span>
              </div>
              <Textarea
                id="msg"
                value={message}
                maxLength={240}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mô tả chi tiết thông báo..."
                className="rounded-xl min-h-[100px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mức độ ưu tiên</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Thông tin</SelectItem>
                  <SelectItem value="warning">Cảnh báo</SelectItem>
                  <SelectItem value="important">Quan trọng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
              <div>
                <p className="text-sm font-medium text-on-surface">Lên lịch gửi sau</p>
                <p className="text-xs text-on-surface-variant">Nếu tắt, gửi ngay lập tức</p>
              </div>
              <Switch checked={scheduleLater} onCheckedChange={setScheduleLater} />
            </div>
            {scheduleLater && (
              <div className="space-y-1.5">
                <Label htmlFor="send-at">Thời gian gửi</Label>
                <Input id="send-at" type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} className="rounded-xl" />
              </div>
            )}

            <ExpressiveButton
              variant="filled"
              size="lg"
              className="w-full"
              onClick={() => {
                if (!title.trim() || !message.trim()) {
                  toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
                  return;
                }
                toast.success(scheduleLater ? `Đã lên lịch gửi lúc ${sendAt || "sau"}.` : "Đã gửi thông báo tới người dùng.");
                setTitle("");
                setMessage("");
                setScheduleLater(false);
                setSendAt("");
              }}
            >
              <Send className="size-5" /> {scheduleLater ? "Lên lịch gửi" : "Gửi thông báo"}
            </ExpressiveButton>
          </div>
        </ExpressiveCard>

        {/* Live preview */}
        <ExpressiveCard variant="filled" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-on-surface">Xem trước</h2>
            <span className="text-xs text-on-surface-variant">Giao diện điện thoại</span>
          </div>
          <div className="mx-auto max-w-[320px]">
            <div className="rounded-[2.5rem] bg-surface-container-lowest border-4 border-outline-variant/60 p-3 elev-2">
              <div className="rounded-[2rem] overflow-hidden bg-surface-container-low">
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 py-2 text-xs text-on-surface-variant">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <Smartphone className="size-3" />
                    <span>100%</span>
                  </div>
                </div>
                {/* Notification card */}
                <div className="p-4">
                  <div className="rounded-2xl bg-surface-container-high p-4 elev-1">
                    <div className="flex items-start gap-3">
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl",
                        priority === "info" && "bg-primary-container text-on-primary-container",
                        priority === "warning" && "bg-warning-container text-on-surface",
                        priority === "important" && "bg-error-container text-on-error-container",
                      )}>
                        <Bell className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-on-surface truncate">UniBus</p>
                          <span className="text-xs text-on-surface-variant">vừa xong</span>
                        </div>
                        <p className="text-sm font-medium text-on-surface mt-1 line-clamp-2">
                          {title || "Tiêu đề thông báo sẽ hiển thị ở đây"}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-3">
                          {message || "Nội dung thông báo sẽ hiển thị ở đây. Sinh viên có thể xem chi tiết khi nhấn vào."}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <StatusPill label={priorityLabel[priority]} tone={priorityTone[priority]} />
                          <span className="text-xs text-on-surface-variant">1.248 người nhận</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ExpressiveCard>
      </div>

      {/* Recent sent */}
      <ExpressiveCard variant="filled" className="p-0 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/40">
          <h2 className="text-lg font-semibold text-on-surface">Thông báo đã gửi gần đây</h2>
          <p className="text-sm text-on-surface-variant">{recent.length} thông báo</p>
        </div>
        <div className="max-h-[420px] overflow-y-auto overflow-x-auto scrollbar-soft">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high">
              <TableRow className="border-outline-variant/40 hover:bg-transparent">
                <TableHead className="min-w-[260px]">Tiêu đề</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead className="text-right">Đã gửi</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((n) => (
                <TableRow key={n.id} className="border-outline-variant/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bell className="size-4 text-on-surface-variant shrink-0" />
                      <p className="text-sm font-medium text-on-surface truncate">{n.title}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-on-surface-variant">{n.audience}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-on-surface">{n.sent.toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-sm text-on-surface-variant whitespace-nowrap">{n.date}</TableCell>
                  <TableCell><StatusPill label="Đã gửi" tone="success" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ExpressiveCard>
    </div>
  );
}
