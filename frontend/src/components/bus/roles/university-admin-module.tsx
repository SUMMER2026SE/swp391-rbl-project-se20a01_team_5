"use client";

// =============================================================================
// University Admin Module — UniBus (M3 Expressive, aligned to UIPrototype v1.1)
// 9 role-specific screens:
//   uniadm-dashboard, uniadm-info, uniadm-domains, uniadm-import, uniadm-roster,
//   uniadm-subsidy, uniadm-stats, uniadm-notify, uniadm-recon
// Visual: keeps prototype v1.1 (hero perk card, university info card,
// import batch progress, roster table, subsidy policy cards, reconciliation summary).
// Data: real backend via /university-admin/* endpoints.
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
  SplitText,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Counter,
  PageTransition,
} from "@/components/m3/motion";
import { PageHeader, StatCard, Section, EmptyState } from "../primitives";

import {
  useUniversityAdminPrototypeData,
  formatVND,
  formatDateTime,
  formatDate,
} from "@/lib/prototype-data";
import {
  universityApi,
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
} from "@/lib/api/client";

type UniversityAdminModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function UniversityAdminModule({ activeId, onNavigate }: UniversityAdminModuleProps) {
  const proto = useUniversityAdminPrototypeData();

  if (proto.loading || !proto.data) return <LoadingScreen label="Đang tải dữ liệu admin trường..." />;
  if (proto.error) return <ErrorScreen message={proto.error} onRetry={proto.reload} />;

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

  switch (activeId) {
    case "uniadm-dashboard":
      return <DashboardScreen ctx={ctx} onNavigate={onNavigate} />;
    case "uniadm-info":
      return <InfoScreen ctx={ctx} />;
    case "uniadm-domains":
      return <DomainsScreen ctx={ctx} />;
    case "uniadm-import":
      return <ImportScreen ctx={ctx} />;
    case "uniadm-roster":
      return <RosterScreen ctx={ctx} />;
    case "uniadm-subsidy":
      return <SubsidyScreen ctx={ctx} />;
    case "uniadm-stats":
      return <StatsScreen ctx={ctx} />;
    case "uniadm-notify":
      return <NotifyScreen ctx={ctx} />;
    case "uniadm-recon":
    case "uniadm-transactions":
      return <ReconScreen ctx={ctx} />;
    default:
      return <FallbackScreen activeId={activeId} />;
  }
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
  const firstName = (ctx.user.name || "bạn").split(" ").slice(-1)[0];
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
    value: point.subsidyType === "PERCENT" ? point.value : Math.round(point.value / 1000),
    color: point.colorHex,
    unit: point.subsidyType === "PERCENT" ? "%" : "k",
  }));

  const quickActions = [
    { id: "uniadm-roster", label: "Danh sách SV", icon: Users, accent: "primary" as const },
    { id: "uniadm-import", label: "Nhập danh sách", icon: Upload, accent: "tertiary" as const },
    { id: "uniadm-subsidy", label: "Chính sách trợ giá", icon: Percent, accent: "secondary" as const },
    { id: "uniadm-stats", label: "Thống kê", icon: FileBarChart, accent: "primary" as const },
  ];

  return (
    <PageTransition className="space-y-6 sm:space-y-8 min-w-0">
      <SplitText
        as="h1"
        text={`Quản lý trường ${ua?.universityName || ""}`}
        className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface block text-balance"
        stagger={0.06}
      />

      {/* Hero card — gradient với logo trường */}
      <ScrollReveal>
        <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
          <div
            className="p-6 sm:p-8 relative"
            style={{
              background: "linear-gradient(135deg, #144fcc, #144fcccc 70%, #144fcc99)",
            }}
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/30 blur-3xl" />
              <div className="absolute -left-10 bottom-0 size-40 rounded-full bg-black/10 blur-3xl" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
              <div className="size-20 rounded-2xl bg-white p-2 flex items-center justify-center shrink-0 ring-1 ring-white/30">
                <span className="text-2xl font-black text-[#144fcc]">
                  {(ua?.universityName || "U").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white/80 text-xs font-medium uppercase tracking-wide">
                    {ua?.title || "Admin trường"} · Đà Nẵng
                  </span>
                  <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur">
                    <BadgeCheck className="size-3.5" />
                    Đối tác chính thức
                  </span>
                </div>
                <h2 className="mt-1 text-white text-2xl sm:text-3xl font-bold leading-tight truncate">
                  {ua?.universityName || "Trường đại học"}
                </h2>
                <div className="mt-3 flex flex-wrap gap-4 text-white/95 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="size-4" />
                    {s?.activeRosterStudents?.toLocaleString("vi-VN") || 0} sinh viên
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {s?.activeCampuses || 0} cơ sở
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FileBarChart className="size-4" />
                    {s?.activeRoutes || 0} tuyến bus
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-4" />
                    {ctx.subsidyPolicies.filter((p) => p.status === "ACTIVE").length > 0 ? "Đang trợ giá" : "Chưa trợ giá"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Quick actions */}
      <ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
          {quickActions.map((action) => {
            const accentMap: Record<string, { bg: string; fg: string }> = {
              primary: { bg: "#14140f", fg: "#beff50" },
              tertiary: { bg: "#ff8c5f", fg: "#14140f" },
              secondary: { bg: "#144fcc", fg: "#beff50" },
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
              </motion.button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* StatCards */}
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
        <StaggerItem>
          <StatCard
            label="Sinh viên đang hoạt động"
            value={<Counter to={s?.activeRosterStudents || 0} />}
            icon={<Users className="size-6" />}
            hint={`${s?.matchedStudents || 0} đã liên kết`}
            trend="up"
            accent="primary"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Vé tháng tháng này"
            value={<Counter to={s?.monthlyPasses || 0} />}
            icon={<FileSpreadsheet className="size-6" />}
            hint={`${s?.activeRosterStudents ? Math.round((s.monthlyPasses / s.activeRosterStudents) * 100) : 0}% sinh viên`}
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
          <Section title="Giao dịch gần đây" actions={<button onClick={() => onNavigate("uniadm-recon")} className="text-xs font-bold text-primary">Đối soát</button>}>
            {ctx.payments.length === 0 ? (
              <EmptyState icon={<Banknote className="size-7" />} title="Chưa có giao dịch" />
            ) : (
              <div className="space-y-2">
                {ctx.payments.slice(0, 5).map((p) => (
                  <ExpressiveCard key={p.orderId} variant="filled" className="p-3 min-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{p.studentName || p.studentCode || "—"}</p>
                        <p className="text-xs text-on-surface-variant truncate">{p.routeName || p.ticketType}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary">{p.orderTotal ? formatVND(p.orderTotal) : "—"}</p>
                        <M3StatusPill label={p.paymentStatus || "—"} tone={p.paymentStatus === "PAID" ? "success" : "warning"} />
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
        <Section title={`Cơ sở (${ctx.campuses.length})`}>
          {ctx.campuses.length === 0 ? (
            <EmptyState icon={<Building2 className="size-7" />} title="Chưa có cơ sở" />
          ) : (
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
              {ctx.campuses.map((c) => (
                <StaggerItem key={c.campusId}>
                  <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="size-10 shrink-0 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                        <Building2 className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{c.name}</p>
                        <p className="text-xs text-on-surface-variant">Mã: {c.code}</p>
                        {c.address && <p className="text-xs text-on-surface-variant line-clamp-2">{c.address}</p>}
                        <M3StatusPill label={c.status} tone={c.status === "ACTIVE" ? "success" : "neutral"} />
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
  const [adding, setAdding] = useState(false);
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!domain.trim()) {
      toast.error("Vui lòng nhập domain");
      return;
    }
    setSaving(true);
    try {
      await universityApi.createDomain({ domain: domain.trim() });
      toast.success("Đã thêm domain");
      setDomain("");
      setAdding(false);
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể thêm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Domain email"
        description={`${ctx.domains.length} domain`}
        icon={<Globe className="size-7" />}
        actions={<ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm domain</ExpressiveButton>}
      />
      {ctx.domains.length === 0 ? (
        <EmptyState icon={<Globe className="size-7" />} title="Chưa có domain" />
      ) : (
        <StaggerGroup className="space-y-2 min-w-0">
          {ctx.domains.map((d) => (
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
                  <M3StatusPill label={d.status} tone={d.status === "ACTIVE" ? "success" : "neutral"} />
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const batch = await universityApi.importRoster(f);
      toast.success(`Đã nhập ${batch.successRows}/${batch.totalRows} dòng`);
      ctx.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể nhập");
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
          </motion.div>
        </ExpressiveCard>
      </ScrollReveal>

      <Section title={`Lịch sử nhập (${ctx.importBatches.length})`}>
        {ctx.importBatches.length === 0 ? (
          <EmptyState icon={<FileSpreadsheet className="size-7" />} title="Chưa có lượt nhập" />
        ) : (
          <StaggerGroup className="space-y-3 min-w-0">
            {ctx.importBatches.map((b) => (
              <StaggerItem key={b.importBatchId}>
                <ExpressiveCard variant="elevated" className="p-4 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{b.fileName}</p>
                      <p className="text-xs text-on-surface-variant">{formatDateTime(b.createdAt)}</p>
                    </div>
                    <M3StatusPill label={b.status} tone={b.status === "COMPLETED" ? "success" : b.status === "FAILED" ? "error" : "warning"} />
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

  const filtered = ctx.roster.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !`${r.fullName} ${r.email} ${r.studentCode}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Danh sách sinh viên"
        description={`${ctx.roster.length} sinh viên`}
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
      {filtered.length === 0 ? (
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
                  <TableCell className="font-mono font-bold">{r.studentCode}</TableCell>
                  <TableCell className="font-bold truncate">{r.fullName}</TableCell>
                  <TableCell className="text-xs truncate">{r.email}</TableCell>
                  <TableCell className="text-xs">{r.faculty || "—"}</TableCell>
                  <TableCell><M3StatusPill label={r.status} tone={r.status === "ACTIVE" ? "success" : r.status === "SUSPENDED" ? "error" : "neutral"} /></TableCell>
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
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!name.trim() || !value.trim()) {
      toast.error("Vui lòng nhập tên và giá trị");
      return;
    }
    setSaving(true);
    try {
      await universityApi.createSubsidyPolicy({
        policyName: name.trim(),
        subsidyType: type,
        value: Number(value) || 0,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
      });
      toast.success("Đã thêm chính sách");
      setName(""); setValue(""); setMaxAmount("");
      setAdding(false);
      ctx.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể thêm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Chính sách trợ giá"
        description={`${ctx.subsidyPolicies.length} chính sách`}
        icon={<Percent className="size-7" />}
        actions={<ExpressiveButton variant="filled" onClick={() => setAdding(true)}><Plus className="size-4" /> Thêm chính sách</ExpressiveButton>}
      />
      {ctx.subsidyPolicies.length === 0 ? (
        <EmptyState icon={<Percent className="size-7" />} title="Chưa có chính sách" />
      ) : (
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
          {ctx.subsidyPolicies.map((p) => (
            <StaggerItem key={p.subsidyPolicyId}>
              <ExpressiveCard variant="elevated" className="p-5 h-full min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                  <p className="font-bold truncate">{p.policyName}</p>
                  <M3StatusPill label={p.status} tone={p.status === "ACTIVE" ? "success" : "neutral"} />
                </div>
                <div className="text-2xl font-black text-primary">
                  {p.subsidyType === "PERCENT" ? `${p.value}%` : formatVND(p.value)}
                </div>
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
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold">Tên chính sách</Label>
              <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Trợ giá 50%" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Loại</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Theo %</SelectItem>
                    <SelectItem value="FIXED">Số tiền cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Giá trị</Label>
                <Input className="mt-1.5" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "PERCENT" ? "VD: 50" : "VD: 100000"} />
              </div>
            </div>
            {type === "PERCENT" && (
              <div>
                <Label className="text-xs font-bold">Số tiền tối đa (VND, tùy chọn)</Label>
                <Input className="mt-1.5" type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
              </div>
            )}
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

  const send = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    setSending(true);
    try {
      await universityApi.notify({ title: title.trim(), content: content.trim() });
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
        description="Gửi thông báo đến sinh viên của trường."
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
// Screen 9: Reconciliation
// =============================================================================
function ReconScreen({ ctx }: { ctx: Ctx }) {
  const r = ctx.reconciliation;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const reload = useCallback(async () => {
    try {
      // The reload already happens via ctx.reload which re-fetches all hooks
      // For now we just trigger reload
      ctx.reload();
    } catch (e) {
      toast.error("Không thể tải dữ liệu đối soát");
    }
  }, [ctx]);

  return (
    <PageTransition className="space-y-6 min-w-0">
      <PageHeader
        title="Đối soát tài chính"
        description="Tổng hợp giao dịch và trợ giá theo kỳ."
        icon={<ScrollText className="size-7" />}
        actions={
          <div className="flex gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
            <ExpressiveButton variant="tonal" size="icon" onClick={reload}><RefreshCw className="size-4" /></ExpressiveButton>
          </div>
        }
      />
      {!r ? (
        <EmptyState icon={<ScrollText className="size-7" />} title="Chưa có dữ liệu đối soát" />
      ) : (
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
            <ExpressiveCard variant="elevated" className="p-6 min-w-0">
              <p className="text-xs text-on-surface-variant uppercase">Tổng tiền gốc</p>
              <p className="text-2xl font-black mt-2 text-primary">
                <Counter to={r.totalOriginalAmount} format={(n) => formatVND(Math.round(n))} />
              </p>
            </ExpressiveCard>
            <ExpressiveCard variant="elevated" className="p-6 min-w-0">
              <p className="text-xs text-on-surface-variant uppercase">Tổng trợ giá</p>
              <p className="text-2xl font-black mt-2 text-success">
                <Counter to={r.totalSubsidyAmount} format={(n) => formatVND(Math.round(n))} />
              </p>
            </ExpressiveCard>
            <ExpressiveCard variant="elevated" className="p-6 min-w-0">
              <p className="text-xs text-on-surface-variant uppercase">Tổng thu</p>
              <p className="text-2xl font-black mt-2 text-tertiary">
                <Counter to={r.totalFinalAmount} format={(n) => formatVND(Math.round(n))} />
              </p>
            </ExpressiveCard>
          </div>
        </ScrollReveal>
      )}

      {ctx.payments.length > 0 && (
        <ScrollReveal delay={0.1}>
          <Section title={`Chi tiết giao dịch (${ctx.payments.length})`}>
            <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SV</TableHead>
                    <TableHead>Tuyến</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ctx.payments.slice(0, 50).map((p) => (
                    <TableRow key={p.orderId}>
                      <TableCell className="truncate">{p.studentName || p.studentCode}</TableCell>
                      <TableCell className="truncate text-xs">{p.routeName || p.ticketType}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{p.orderTotal ? formatVND(p.orderTotal) : "—"}</TableCell>
                      <TableCell><M3StatusPill label={p.paymentStatus || "—"} tone={p.paymentStatus === "PAID" ? "success" : "warning"} /></TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{formatDate(p.paidAt || p.transactionDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ExpressiveCard>
          </Section>
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
