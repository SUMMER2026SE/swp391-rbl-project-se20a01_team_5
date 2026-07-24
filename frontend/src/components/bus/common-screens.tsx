"use client";

import { useCallback, useState } from "react";
import { Bell, Check, KeyRound, LifeBuoy, Save, School, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, EmptyState } from "@/components/bus/primitives";
import {
  AsyncBlock,
  DataList,
  ErrorPanel,
  LoadingPanel,
  StatusPill,
  UnavailablePanel,
  formatDateTime,
  getErrorMessage,
  useApiResource,
} from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notificationApi, profileApi, studentApi, universityApi, type NotificationView, type UserProfile } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function ProfileScreen() {
  const loader = useCallback(() => profileApi.me(), []);
  const profile = useApiResource<UserProfile>(loader);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const data = profile.data;
  const display = { ...data, ...form } as UserProfile;
  const isStudentProfile = String(display.role || "").toUpperCase() === "STUDENT";

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const updated = await profileApi.update({
        fullName: display.fullName,
        phoneNumber: display.phoneNumber,
        address: display.address,
        avatarUrl: display.avatarUrl,
      });
      profile.setData(updated);
      setForm({});
      toast.success("Đã lưu hồ sơ");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể lưu hồ sơ"));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!data) return;
    setPasswordSaving(true);
    try {
      await profileApi.changePassword({
        currentPassword: data.hasPassword ? currentPassword : undefined,
        newPassword,
        confirmPassword,
      });
      profile.setData({ ...data, hasPassword: true });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(data.hasPassword ? "Đã đổi mật khẩu" : "Đã tạo mật khẩu đăng nhập");
    } catch (error) {
      toast.error(getErrorMessage(error, data.hasPassword ? "Không thể đổi mật khẩu" : "Không thể tạo mật khẩu"));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Dữ liệu tài khoản lấy trực tiếp từ backend."
        icon={<UserCircle className="size-7" />}
        actions={<ExpressiveButton onClick={save} disabled={!data || saving}><Save className="size-4" />{saving ? "Đang lưu..." : "Lưu"}</ExpressiveButton>}
      />
      <AsyncBlock resource={profile}>
        {() => (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <ExpressiveCard variant="elevated" className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Họ tên">
                    <Input value={display.fullName || ""} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
                  </Field>
                  <Field label="Email">
                    <Input value={display.email || ""} disabled />
                  </Field>
                  <Field label="Số điện thoại">
                    <Input value={display.phoneNumber || ""} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
                  </Field>
                  <Field label="Vai trò">
                    <Input value={display.role || ""} disabled />
                  </Field>
                </div>
                <Field label="Địa chỉ">
                  <Textarea value={display.address || ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </Field>
              </ExpressiveCard>

              <ExpressiveCard variant="elevated" className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <KeyRound className="size-5 text-primary" />
                      <h3 className="font-bold text-on-surface">Mật khẩu</h3>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {data?.hasPassword
                        ? "Đổi mật khẩu đăng nhập email của bạn."
                        : "Tài khoản Google chưa có mật khẩu riêng. Tạo mật khẩu để có thể đăng nhập bằng email."}
                    </p>
                  </div>
                </div>
                <div className={data?.hasPassword ? "grid gap-4 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
                  {data?.hasPassword && (
                    <Field label="Mật khẩu hiện tại">
                      <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </Field>
                  )}
                  <Field label={data?.hasPassword ? "Mật khẩu mới" : "Mật khẩu muốn tạo"}>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </Field>
                  <Field label="Nhập lại">
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </Field>
                </div>
                <ExpressiveButton onClick={changePassword} disabled={passwordSaving || !newPassword || !confirmPassword || (data?.hasPassword && !currentPassword)}>
                  <KeyRound className="size-4" />
                  {passwordSaving ? (data?.hasPassword ? "Đang đổi..." : "Đang tạo...") : (data?.hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu")}
                </ExpressiveButton>
              </ExpressiveCard>
            </div>

            <div className="space-y-3">
              <ProfileStatusCard label="Trạng thái tài khoản" value={display.status} icon={<Check className="size-5" />} tone="success" />
              {isStudentProfile ? (
                <ProfileStatusCard label="Xác minh sinh viên" value={display.studentVerificationStatus || "NOT_SUBMITTED"} icon={<School className="size-5" />} tone="secondary" />
              ) : null}
            </div>
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function ProfileStatusCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value?: string;
  icon: React.ReactNode;
  tone: "success" | "secondary";
}) {
  const isSuccess = tone === "success";
  return (
    <ExpressiveCard variant="elevated" className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
          <div className="mt-2">
            <StatusPill status={value || "UNKNOWN"} />
          </div>
        </div>
        <div className={cn(
          "grid size-11 shrink-0 place-items-center rounded-2xl",
          isSuccess ? "bg-success/12 text-success" : "bg-[#144fcc]/10 text-[#144fcc]"
        )}>
          {icon}
        </div>
      </div>
    </ExpressiveCard>
  );
}
export function NotificationsScreen() {
  const loader = useCallback(() => notificationApi.mine(), []);
  const resource = useApiResource<NotificationView[]>(loader);

  const markRead = async (item: NotificationView) => {
    try {
      await notificationApi.markRead(item.notificationId);
      resource.setData((resource.data || []).map((n) => n.notificationId === item.notificationId ? { ...n, read: true } : n));
      // Notify app-shell to update bell badge in real-time
      window.dispatchEvent(new CustomEvent("notification-read", { detail: { notificationId: item.notificationId } }));
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể đánh dấu đã đọc"));
    }
  };

  return (
    <div>
      <PageHeader title="Thông báo" description="Cập nhật mới từ UniBus." icon={<Bell className="size-7" />} />
      {resource.loading && <LoadingPanel />}
      {resource.error && <ErrorPanel message={resource.error} onRetry={resource.reload} />}
      {!resource.loading && !resource.error && (
        <DataList emptyTitle="Chưa có thông báo" emptyDescription="Bạn chưa có cập nhật mới.">
          {(resource.data || []).map((item) => (
            <ExpressiveCard key={item.notificationId} variant="elevated" className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-on-surface">{item.title}</h3>
                    {!item.read && <StatusPill status="CHƯA ĐỌC" />}
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">{item.content}</p>
                  <p className="mt-2 text-xs text-on-surface-variant">{formatDateTime(item.createdAt)} · {item.senderName || "UniBus"}</p>
                </div>
                {!item.read && (
                  <ExpressiveButton variant="tonal" size="sm" onClick={() => markRead(item)}>
                    Đánh dấu đã đọc
                  </ExpressiveButton>
                )}
              </div>
            </ExpressiveCard>
          ))}
        </DataList>
      )}
    </div>
  );
}

export function MyUniversityScreen() {
  const profileLoader = useCallback(() => studentApi.profile(), []);
  const catalogLoader = useCallback(() => universityApi.daNang(), []);
  const profile = useApiResource(profileLoader);
  const catalog = useApiResource(catalogLoader);

  return (
    <div>
      <PageHeader title="Trường của tôi" description="Thông tin trường và trạng thái xác minh." icon={<School className="size-7" />} />
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <AsyncBlock resource={profile}>
          {(data) => (
            <ExpressiveCard variant="elevated" className="p-5">
              <h2 className="text-xl font-bold text-on-surface">{data.university || "Chưa khai báo trường"}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Mã sinh viên" value={data.studentCode} />
                <Info label="Khoa" value={data.faculty} />
                <Info label="Khóa" value={data.academicYear} />
                <Info label="Xác minh" value={<StatusPill status={data.studentVerificationStatus} />} />
              </div>
            </ExpressiveCard>
          )}
        </AsyncBlock>

        <Section title="Danh sách trường" description="Các trường đang hỗ trợ tại Đà Nẵng.">
          {catalog.loading && <LoadingPanel />}
          {catalog.error && <ErrorPanel message={catalog.error} onRetry={catalog.reload} />}
          {!catalog.loading && !catalog.error && (
            <ExpressiveCard variant="elevated" className="max-h-[420px] overflow-auto p-4">
              {(catalog.data || []).length === 0 ? (
                <EmptyState icon={<School className="size-7" />} title="Chưa có trường" description="Danh sách trường sẽ được cập nhật sau." />
              ) : (
                <ul className="space-y-2">
                  {(catalog.data || []).map((name) => (
                    <li key={name} className="rounded-xl bg-surface-container-high px-3 py-2 text-sm font-medium text-on-surface">
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </ExpressiveCard>
          )}
        </Section>
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    setSaving(true);
    try {
      await profileApi.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đã đổi mật khẩu");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể đổi mật khẩu"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Cài đặt" description="Bảo mật và thông tin tài khoản." icon={<KeyRound className="size-7" />} />
      <ExpressiveCard variant="elevated" className="max-w-2xl space-y-4 p-5">
        <Field label="Mật khẩu hiện tại">
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </Field>
        <Field label="Mật khẩu mới">
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </Field>
        <Field label="Nhập lại mật khẩu mới">
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </Field>
        <ExpressiveButton onClick={changePassword} disabled={saving || !newPassword || !confirmPassword}>
          <KeyRound className="size-4" />
          {saving ? "Đang đổi..." : "Đổi mật khẩu"}
        </ExpressiveButton>
      </ExpressiveCard>
    </div>
  );
}

export function SupportScreen() {
  return (
    <div>
      <PageHeader title="Yêu cầu hỗ trợ" description="Gửi phản hồi để UniBus hỗ trợ bạn." icon={<LifeBuoy className="size-7" />} />
      <UnavailablePanel
        title="Dùng phản hồi"
        description="Vui lòng gửi nội dung qua mục Phản hồi & đánh giá."
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-container-high p-3">
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <div className="mt-1 text-sm font-bold text-on-surface">{value || "Chưa có"}</div>
    </div>
  );
}
