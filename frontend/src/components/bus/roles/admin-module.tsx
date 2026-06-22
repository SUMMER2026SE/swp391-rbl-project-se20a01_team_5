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

import React, { useCallback, useEffect, useState } from "react";
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
  Search,
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
  formatVND,
  formatDateTime,
  formatDate,
} from "@/lib/prototype-data";
import {
  adminApi,
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
} from "@/lib/api/client";

type AdminModuleProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function AdminModule({ activeId, onNavigate }: AdminModuleProps) {
  const proto = useAdminPrototypeData();

  if (proto.loading) return <LoadingScreen label="Đang tải dữ liệu quản trị..." />;
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
    case "adm-violations":
      return <ViolationsScreen ctx={ctx} />;
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
  const firstName = (ctx.user.name || "bạn").split(" ").slice(-1)[0];
  const statCards = ctx.stats.slice(0, 4);

  const quickActions = [
    { id: "adm-users", label: "Người dùng", icon: Users, accent: "primary" as const },
    { id: "adm-universities", label: "Trường ĐH", icon: School, accent: "tertiary" as const },
    { id: "adm-complaints", label: "Khiếu nại", icon: ShieldAlert, accent: "error" as const },
    { id: "adm-fare", label: "Giá vé", icon: Tag, accent: "secondary" as const },
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
          text={`Xin chào, ${firstName}!`}
          className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface text-balance"
          stagger={0.06}
        />
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#dc2626] text-white text-xs font-bold shrink-0">
            <ShieldAlert className="size-3.5" />
            Quản trị viên
          </span>
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#14140f] text-white text-xs font-bold shrink-0">
            {ctx.users.length} người dùng
          </span>
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#144fcc] text-white text-xs font-bold shrink-0">
            {ctx.universities.length} trường
          </span>
        </div>
      </motion.div>

      <ScrollReveal>
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
              </motion.button>
            );
          })}
        </div>
      </ScrollReveal>

      {statCards.length > 0 && (
        <ScrollReveal delay={0.1}>
          <Section title="Thống kê hệ thống">
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

      {ctx.routeMetrics.length > 0 && (
        <ScrollReveal delay={0.15}>
          <Section title="Hiệu suất theo tuyến">
            <ExpressiveCard variant="elevated" className="overflow-hidden min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tuyến</TableHead>
                    <TableHead className="text-right">Số chuyến</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ctx.routeMetrics.slice(0, 10).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-3 rounded-full" style={{ backgroundColor: r.colorHex || "#14b8a6" }} />
                          <span className="font-bold truncate">{r.routeName}</span>
                          {r.routeCode && <Badge variant="outline" className="text-[10px]">{r.routeCode}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{r.trips}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-primary">{formatVND(r.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ExpressiveCard>
          </Section>
        </ScrollReveal>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <ScrollReveal delay={0.2}>
          <Section title="Khiếu nại mới" actions={<button onClick={() => onNavigate("adm-complaints")} className="text-xs font-bold text-primary">Xem tất cả</button>}>
            {ctx.complaints.length === 0 ? (
              <EmptyState icon={<ShieldAlert className="size-7" />} title="Không có khiếu nại" />
            ) : (
              <div className="space-y-2">
                {ctx.complaints.slice(0, 3).map((c: any) => (
                  <ExpressiveCard key={c.id} variant="filled" className="p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{c.subject}</p>
                        <p className="text-xs text-on-surface-variant line-clamp-2">{c.description}</p>
                      </div>
                      <M3StatusPill label={c.status} tone={c.status === "resolved" ? "success" : c.status === "rejected" ? "error" : "warning"} />
                    </div>
                  </ExpressiveCard>
                ))}
              </div>
            )}
          </Section>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <Section title="Vi phạm mới" actions={<button onClick={() => onNavigate("adm-violations")} className="text-xs font-bold text-primary">Xem tất cả</button>}>
            {ctx.violations.length === 0 ? (
              <EmptyState icon={<AlertOctagon className="size-7" />} title="Không có vi phạm" />
            ) : (
              <div className="space-y-2">
                {ctx.violations.slice(0, 3).map((v: any, i: number) => (
                  <ExpressiveCard key={i} variant="filled" className="p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{v.reporterName || "—"}</p>
                        <p className="text-xs text-on-surface-variant line-clamp-2">{v.content}</p>
                      </div>
                      <M3StatusPill label={v.status} tone={v.status === "RESOLVED" ? "success" : "warning"} />
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
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Vui lòng nhập đầy đủ họ tên, email, mật khẩu");
      return;
    }
    setSaving(true);
    try {
      await adminApi.createStaff({
        fullName: name.trim(),
        email: email.trim(),
        password,
        role,
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
