"use client";

import { useCallback, useState } from "react";
import { BarChart3, CreditCard, GraduationCap, Megaphone, School, ShieldAlert, Tag, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { AsyncBlock, DataList, StatusPill, formatDateTime, formatMoney, getErrorMessage, useApiResource } from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminApi,
  experienceApi,
  feedbackApi,
  notificationApi,
  type AdminStatsView,
  type AdminUserView,
  type AuditLogView,
  type FeedbackView,
  type PaymentTransactionView,
  type RouteUniversityView,
  type SubsidyPolicyView,
  type UniversityAdminView,
  type UniversityView,
  type VerificationView,
} from "@/lib/api/client";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function AdminModule({ activeId }: Props) {
  if (activeId === "adm-dashboard") return <AdminDashboard />;
  if (activeId === "adm-users") return <UsersScreen />;
  if (activeId === "adm-complaints") return <FeedbackAdminScreen />;
  if (activeId === "adm-violations") return <VerificationsScreen />;
  if (activeId === "adm-notify") return <NotifyScreen />;
  if (activeId === "adm-universities") return <UniversitiesScreen />;
  if (activeId === "adm-uni-admins") return <UniversityAdminsScreen />;
  if (activeId === "adm-route-uni") return <RouteUniversitiesScreen />;
  if (activeId === "adm-audit") return <AuditScreen />;
  if (activeId === "adm-transactions") return <PaymentTransactionsScreen />;
  if (activeId === "adm-fare") return <FaresScreen />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const loader = useCallback(async () => {
    const [stats, users, verifications, transactions] = await Promise.all([
      experienceApi.adminStats(),
      adminApi.users(),
      adminApi.verifications().catch(() => []),
      adminApi.paymentTransactions().catch(() => []),
    ]);
    return { stats, users, verifications, transactions };
  }, []);
  const resource = useApiResource(loader);

  return (
    <div>
      <PageHeader title="Thống kê hệ thống" description="Tổng quan thật từ admin APIs hiện có." icon={<BarChart3 className="size-7" />} />
      <AsyncBlock resource={resource}>
        {({ stats, users, verifications, transactions }) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.stats.map((stat) => (
                <StatCard key={stat.label} label={stat.label} value={`${stat.value}${stat.unit ? ` ${stat.unit}` : ""}`} icon={<BarChart3 className="size-6" />} accent={adminTone(stat.tone)} />
              ))}
            </div>
            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <Section title="Route metrics" description="Doanh thu và số chuyến theo tuyến">
                <ExpressiveCard variant="elevated" className="mb-3 h-64 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.routeMetrics}>
                      <XAxis dataKey="routeCode" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={70} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                      <Tooltip formatter={(value) => formatMoney(Number(value))} />
                      <Bar dataKey="revenue" fill="#144fcc" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ExpressiveCard>
                <DataList emptyTitle="Chưa có metrics" emptyDescription="Khi có route/trip/payment, metrics sẽ xuất hiện.">
                  {stats.routeMetrics.map((metric) => (
                    <ExpressiveCard key={metric.routeCode || metric.routeName} variant="elevated" className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-on-surface">{metric.routeCode || metric.routeName}</h3>
                          <p className="text-sm text-on-surface-variant">{metric.trips} chuyến · {formatMoney(metric.revenue)}</p>
                        </div>
                        <span className="size-4 rounded-full" style={{ backgroundColor: metric.colorHex || "#144fcc" }} />
                      </div>
                    </ExpressiveCard>
                  ))}
                </DataList>
              </Section>
              <Section title="Người dùng gần đây" description={`${verifications.length} hồ sơ xác minh trong hệ thống`}>
                <UserList users={users.slice(0, 6)} onRefresh={resource.reload} />
              </Section>
            </div>
            <Section title="Lịch sử giao dịch hệ thống" description="Theo dõi các đơn thanh toán SePay và giao dịch ngân hàng mới nhất.">
              <ExpressiveCard variant="elevated" className="overflow-x-auto p-4">
                <table className="w-full text-left text-sm text-on-surface">
                  <thead>
                    <tr className="border-b border-outline-variant font-bold text-on-surface-variant">
                      <th className="pb-3 pr-4">Thời gian</th>
                      <th className="pb-3 pr-4">Sinh viên</th>
                      <th className="pb-3 pr-4">Số tiền</th>
                      <th className="pb-3 pr-4">Tuyến/vé</th>
                      <th className="pb-3">Mã CK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(transactions || []).slice(0, 10).map((tx) => (
                      <tr key={`dash-tx-${tx.orderId}-${tx.transactionId || 0}`} className="border-b border-outline-variant/40 hover:bg-surface-variant/20">
                        <td className="py-3 pr-4 text-xs font-semibold text-on-surface-variant">{formatDateTime(tx.paidAt || tx.transactionDate || tx.createdAt)}</td>
                        <td className="py-3 pr-4 font-bold">{tx.studentName || tx.studentCode || "Không rõ"}</td>
                        <td className="py-3 pr-4 font-black text-blue-600">{formatMoney(tx.orderTotal || tx.amountIn || 0)}</td>
                        <td className="py-3 pr-4">
                          <span className="mr-2 rounded-lg bg-surface-variant px-2 py-1 text-xs font-semibold uppercase">
                            {tx.ticketType === "monthly" ? "Tháng" : "Thường"}
                          </span>
                          {tx.routeName || "Chưa có tuyến"}
                        </td>
                        <td className="py-3 font-mono text-xs font-bold text-red-600">{tx.referenceNumber || tx.transactionContent || `DH${tx.orderId}`}</td>
                      </tr>
                    ))}
                    {(transactions || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center font-semibold text-on-surface-variant">Chưa có lịch sử giao dịch.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ExpressiveCard>
            </Section>
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function adminTone(tone?: string): "primary" | "tertiary" | "secondary" | "error" | "success" | "warning" {
  if (tone === "success") return "success";
  if (tone === "error") return "error";
  if (tone === "warning") return "warning";
  if (tone === "secondary") return "secondary";
  if (tone === "tertiary") return "tertiary";
  return "primary";
}

function UsersScreen() {
  const loader = useCallback(() => adminApi.users(), []);
  const resource = useApiResource<AdminUserView[]>(loader);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <PageHeader
        title="Tài khoản người dùng"
        description="Quản lý người dùng qua admin users API."
        icon={<Users className="size-7" />}
        actions={<ExpressiveButton onClick={() => setShowCreate((v) => !v)}><UserPlus className="size-4" />Tạo staff</ExpressiveButton>}
      />
      {showCreate && <CreateStaffForm onCreated={resource.reload} />}
      <AsyncBlock resource={resource}>
        {(users) => <UserList users={users} onRefresh={resource.reload} />}
      </AsyncBlock>
    </div>
  );
}

function UserList({ users, onRefresh }: { users: AdminUserView[]; onRefresh: () => void }) {
  const updateStatus = async (user: AdminUserView) => {
    const next = user.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
    try {
      await adminApi.updateUserStatus(user.userId, {
        status: next,
        lockReason: next === "LOCKED" ? "Locked by admin from UniBus frontend" : undefined,
      });
      toast.success(next === "ACTIVE" ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
      onRefresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật tài khoản"));
    }
  };

  return (
    <DataList emptyTitle="Chưa có người dùng" emptyDescription="Backend chưa trả về tài khoản nào.">
      {users.map((user) => (
        <ExpressiveCard key={user.userId} variant="elevated" className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-bold text-on-surface">{user.fullName}</h3>
              <p className="text-sm text-on-surface-variant">{user.email} · {user.role}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{formatDateTime(user.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill status={user.status} />
              <ExpressiveButton variant="tonal" size="sm" onClick={() => updateStatus(user)}>
                {user.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
              </ExpressiveButton>
            </div>
          </div>
        </ExpressiveCard>
      ))}
    </DataList>
  );
}

function CreateStaffForm({ onCreated }: { onCreated: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"DRIVER" | "CONDUCTOR" | "DISPATCHER" | "ADMIN">("DRIVER");
  const [employeeCode, setEmployeeCode] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await adminApi.createStaff({ fullName, email, password, role, employeeCode, licenseNumber, phoneNumber });
      toast.success("Đã tạo tài khoản staff");
      setFullName("");
      setEmail("");
      setPassword("");
      onCreated();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tạo tài khoản"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ExpressiveCard variant="elevated" className="mb-5 grid gap-4 p-5 md:grid-cols-2">
      <Field label="Họ tên"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
      <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Mật khẩu"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      <Field label="Vai trò">
        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm">
          <option value="DRIVER">Driver</option>
          <option value="CONDUCTOR">Conductor</option>
          <option value="DISPATCHER">Dispatcher</option>
          <option value="ADMIN">Admin</option>
        </select>
      </Field>
      <Field label="Mã nhân viên"><Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} /></Field>
      <Field label="Bằng lái"><Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} /></Field>
      <Field label="Số điện thoại"><Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></Field>
      <div className="flex items-end">
        <ExpressiveButton onClick={submit} disabled={saving || !fullName || !email || !password}>{saving ? "Đang tạo..." : "Tạo tài khoản"}</ExpressiveButton>
      </div>
    </ExpressiveCard>
  );
}

function VerificationsScreen() {
  const loader = useCallback(() => adminApi.verifications(), []);
  const resource = useApiResource<VerificationView[]>(loader);

  const review = async (item: VerificationView, action: "approve" | "reject" | "request") => {
    try {
      if (action === "approve") await adminApi.approveVerification(item.verificationId, "Approved from admin UI");
      if (action === "reject") await adminApi.rejectVerification(item.verificationId, "Rejected from admin UI");
      if (action === "request") await adminApi.requestResubmission(item.verificationId, "Please resubmit student card");
      toast.success("Đã cập nhật xác minh");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật xác minh"));
    }
  };

  return (
    <div>
      <PageHeader title="Xác minh sinh viên" description="Duyệt hồ sơ xác minh qua admin student-verifications API." icon={<GraduationCap className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có hồ sơ xác minh" emptyDescription="Backend chưa trả về hồ sơ xác minh nào.">
            {items.map((item) => (
              <ExpressiveCard key={item.verificationId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{item.fullName}</h3>
                    <p className="text-sm text-on-surface-variant">{item.email} · {item.university || "Chưa có trường"} · {item.studentCode || "Chưa có MSSV"}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Nộp: {formatDateTime(item.submittedAt)}</p>
                    {item.rejectionReason && <p className="mt-2 rounded-xl bg-surface-container-high p-3 text-sm text-on-surface">{item.rejectionReason}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill status={item.status} />
                    <ExpressiveButton size="sm" onClick={() => review(item, "approve")}>Duyệt</ExpressiveButton>
                    <ExpressiveButton size="sm" variant="tonal" onClick={() => review(item, "request")}>Yêu cầu nộp lại</ExpressiveButton>
                    <ExpressiveButton size="sm" variant="error" onClick={() => review(item, "reject")}>Từ chối</ExpressiveButton>
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

function FeedbackAdminScreen() {
  const loader = useCallback(() => feedbackApi.all(), []);
  const resource = useApiResource<FeedbackView[]>(loader);

  const resolve = async (item: FeedbackView) => {
    try {
      await feedbackApi.resolve(item.feedbackId, "Đã xử lý bởi quản trị viên.");
      toast.success("Đã xử lý phản hồi");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể xử lý phản hồi"));
    }
  };

  return (
    <div>
      <PageHeader title="Xử lý khiếu nại" description="Phản hồi/khiếu nại thật từ backend feedback API." icon={<ShieldAlert className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có phản hồi" emptyDescription="Backend chưa trả về phản hồi nào.">
            {items.map((item) => (
              <ExpressiveCard key={item.feedbackId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{item.studentName || item.studentCode || "Sinh viên"}</h3>
                    <p className="text-sm text-on-surface-variant">{item.content}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{item.routeName || "Không gắn tuyến"} · {formatDateTime(item.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill status={item.status} />
                    {(item.status || "").toUpperCase() !== "RESOLVED" && <ExpressiveButton size="sm" onClick={() => resolve(item)}>Xử lý</ExpressiveButton>}
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

function NotifyScreen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("ALL");
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await notificationApi.create({ title, content, target });
      setTitle("");
      setContent("");
      toast.success("Đã gửi thông báo");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi thông báo"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Gửi thông báo" description="Tạo thông báo qua backend notifications API." icon={<Megaphone className="size-7" />} />
      <ExpressiveCard variant="elevated" className="max-w-2xl space-y-4 p-5">
        <Field label="Tiêu đề"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Đối tượng"><Input value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
        <Field label="Nội dung"><Textarea value={content} onChange={(e) => setContent(e.target.value)} /></Field>
        <ExpressiveButton onClick={send} disabled={sending || !title || !content}>{sending ? "Đang gửi..." : "Gửi thông báo"}</ExpressiveButton>
      </ExpressiveCard>
    </div>
  );
}

function UniversitiesScreen() {
  const resource = useApiResource<UniversityView[]>(useCallback(() => adminApi.universities(), []));
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await adminApi.createUniversity({ code, name, shortName, contactEmail });
      setCode("");
      setName("");
      setShortName("");
      setContactEmail("");
      toast.success("Đã tạo trường đối tác");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tạo trường"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Trường đại học đối tác" description="Quản lý universities thật cho domain, route và trợ giá." icon={<School className="size-7" />} />
      <ExpressiveCard variant="elevated" className="mb-5 grid gap-4 p-5 md:grid-cols-4">
        <Field label="Mã trường"><Input value={code} onChange={(e) => setCode(e.target.value)} /></Field>
        <Field label="Tên trường"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Tên ngắn"><Input value={shortName} onChange={(e) => setShortName(e.target.value)} /></Field>
        <Field label="Email liên hệ"><Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></Field>
        <div className="md:col-span-4"><ExpressiveButton onClick={submit} disabled={saving || !code || !name}>{saving ? "Đang tạo..." : "Tạo trường"}</ExpressiveButton></div>
      </ExpressiveCard>
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có trường đối tác" emptyDescription="Tạo trường để gắn domain, roster và trợ giá.">
            {items.map((item) => (
              <ExpressiveCard key={item.universityId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{item.name}</h3>
                    <p className="text-sm text-on-surface-variant">{item.code} · {item.contactEmail || "Chưa có email"}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{item.campusCount} campus · {item.domainCount} domain · {item.rosterCount} roster</p>
                  </div>
                  <StatusPill status={item.status} />
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function UniversityAdminsScreen() {
  const resource = useApiResource<UniversityAdminView[]>(useCallback(() => adminApi.universityAdmins(), []));
  const universities = useApiResource<UniversityView[]>(useCallback(() => adminApi.universities(), []));
  const [universityId, setUniversityId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await adminApi.createUniversityAdmin({ universityId: Number(universityId), fullName, email, password, title });
      setFullName("");
      setEmail("");
      setPassword("");
      setTitle("");
      toast.success("Đã tạo admin trường");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tạo admin trường"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Tài khoản Admin trường" description="Tạo user role UNIVERSITY_ADMIN và scope vào một trường." icon={<GraduationCap className="size-7" />} />
      <ExpressiveCard variant="elevated" className="mb-5 grid gap-4 p-5 md:grid-cols-3">
        <Field label="Trường">
          <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm">
            <option value="">Chọn trường</option>
            {(universities.data || []).map((item) => <option key={item.universityId} value={item.universityId}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="Họ tên"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Mật khẩu"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Field label="Chức danh"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="flex items-end"><ExpressiveButton onClick={submit} disabled={saving || !universityId || !fullName || !email || !password}>{saving ? "Đang tạo..." : "Tạo admin trường"}</ExpressiveButton></div>
      </ExpressiveCard>
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có admin trường" emptyDescription="Tạo tài khoản UNIVERSITY_ADMIN để trường tự quản lý roster.">
            {items.map((item) => (
              <ExpressiveCard key={item.universityAdminId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{item.fullName}</h3>
                    <p className="text-sm text-on-surface-variant">{item.email} · {item.universityName}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{item.title || "University Admin"} · {formatDateTime(item.assignedAt)}</p>
                  </div>
                  <StatusPill status={item.status} />
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function RouteUniversitiesScreen() {
  const resource = useApiResource<RouteUniversityView[]>(useCallback(() => adminApi.routeUniversities(), []));
  const universities = useApiResource<UniversityView[]>(useCallback(() => adminApi.universities(), []));
  const [routeId, setRouteId] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await adminApi.createRouteUniversity({ routeId: Number(routeId), universityId: Number(universityId) });
      setRouteId("");
      toast.success("Đã gán tuyến cho trường");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gán tuyến"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Gán tuyến cho trường" description="Liên kết route_universities để lọc route và tính trợ giá." icon={<School className="size-7" />} />
      <ExpressiveCard variant="elevated" className="mb-5 grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Field label="Trường">
          <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm">
            <option value="">Chọn trường</option>
            {(universities.data || []).map((item) => <option key={item.universityId} value={item.universityId}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="Route ID"><Input type="number" value={routeId} onChange={(e) => setRouteId(e.target.value)} /></Field>
        <ExpressiveButton onClick={submit} disabled={saving || !routeId || !universityId}>{saving ? "Đang gán..." : "Gán tuyến"}</ExpressiveButton>
      </ExpressiveCard>
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có route-university" emptyDescription="Gán tuyến để sinh viên trường đó nhìn thấy route.">
            {items.map((item) => (
              <ExpressiveCard key={item.routeUniversityId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{item.routeName}</h3>
                    <p className="text-sm text-on-surface-variant">{item.universityName} · Route #{item.routeId}</p>
                  </div>
                  <StatusPill status={item.status} />
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function FaresScreen() {
  const resource = useApiResource<AdminStatsView["fares"]>(useCallback(() => experienceApi.fares(), []));
  const [editing, setEditing] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (fare: AdminStatsView["fares"][number]) => {
    setEditing(fare.fareId);
    setAmount(String(fare.amount ?? ""));
    setNotes(fare.notes || "");
  };

  const save = async () => {
    if (!editing || !amount) return;
    setSaving(true);
    try {
      await experienceApi.updateFare(editing, { amount: Number(amount), notes });
      setEditing(null);
      setAmount("");
      setNotes("");
      toast.success("Đã cập nhật giá vé");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật giá vé"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Điều chỉnh giá vé" description="Cập nhật bảng fares thật, không dùng dữ liệu demo frontend." icon={<Tag className="size-7" />} />
      {editing && (
        <ExpressiveCard variant="elevated" className="mb-5 grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field label="Số tiền"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Ghi chú"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <ExpressiveButton onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu giá vé"}</ExpressiveButton>
        </ExpressiveCard>
      )}
      <AsyncBlock resource={resource}>
        {(fares) => (
          <DataList emptyTitle="Chưa có fares" emptyDescription="Seed hoặc tạo fares để admin điều chỉnh giá.">
            {fares.map((fare) => (
              <ExpressiveCard key={fare.fareId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{fare.routeCode || fare.routeName} · {fare.fareType}</h3>
                    <p className="text-sm text-on-surface-variant">{formatMoney(fare.amount)} · từ {fare.effectiveFrom || "chưa rõ"}</p>
                    {fare.notes && <p className="mt-1 text-xs text-on-surface-variant">{fare.notes}</p>}
                  </div>
                  <ExpressiveButton size="sm" variant="tonal" onClick={() => startEdit(fare)}>Sửa giá</ExpressiveButton>
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function SubsidyPoliciesScreen() {
  const resource = useApiResource<SubsidyPolicyView[]>(useCallback(() => adminApi.subsidyPolicies(), []));
  return (
    <div>
      <PageHeader title="Điều chỉnh giá vé" description="Danh sách chính sách trợ giá đang cấu hình cho các trường." icon={<Tag className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có chính sách trợ giá" emptyDescription="University Admin hoặc Admin tạo policy để áp dụng vé tháng.">
            {items.map((item) => (
              <ExpressiveCard key={item.subsidyPolicyId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{item.policyName}</h3>
                    <p className="text-sm text-on-surface-variant">{item.universityName} · {item.subsidyType} · {item.value}</p>
                  </div>
                  <StatusPill status={item.status} />
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function PaymentTransactionsScreen() {
  const resource = useApiResource<PaymentTransactionView[]>(useCallback(() => adminApi.paymentTransactions(), []));
  return (
    <div>
      <PageHeader title="Lịch sử giao dịch" description="Theo dõi đơn thanh toán SePay và giao dịch ngân hàng." icon={<CreditCard className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(transactions) => (
          <DataList emptyTitle="Chưa có giao dịch" emptyDescription="Các đơn thanh toán sẽ xuất hiện tại đây.">
            {transactions.map((tx) => (
              <ExpressiveCard key={`admin-tx-${tx.orderId}-${tx.transactionId || 0}`} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-on-surface">
                        {formatDateTime(tx.paidAt || tx.transactionDate || tx.createdAt)} | {tx.studentName ? `${tx.studentName} (${tx.studentCode})` : tx.studentCode} | {formatMoney(tx.orderTotal || tx.amountIn || 0)}
                      </h3>
                      <StatusPill status={tx.paymentStatus || "UNKNOWN"} />
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">Thông tin chuyến xe: {tx.universityName ? `${tx.universityName} - ` : ""}{tx.routeName || "Chưa có tuyến"}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Nội dung chuyển khoản: {tx.transactionContent || `DH${tx.orderId}`} | Ref: {tx.referenceNumber || "Chưa có"}</p>
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

function AuditScreen() {
  const resource = useApiResource<AuditLogView[]>(useCallback(() => adminApi.auditLogs(), []));
  return (
    <div>
      <PageHeader title="Audit log" description="Theo dõi hành động admin/university-admin liên quan university MVP." icon={<ShieldAlert className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(items) => (
          <DataList emptyTitle="Chưa có audit log" emptyDescription="Khi có thao tác university, log sẽ xuất hiện.">
            {items.map((item) => (
              <ExpressiveCard key={item.auditLogId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{item.action}</h3>
                    <p className="text-sm text-on-surface-variant">{item.universityName || "Toàn hệ thống"} · {item.performerName || `User #${item.performedByUserId}`}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{formatDateTime(item.performedAt)} · {item.notes || item.affectedTable}</p>
                  </div>
                  <StatusPill status={item.result} />
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
