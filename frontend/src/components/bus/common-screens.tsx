"use client";

import { useCallback, useState } from "react";
import { Bell, Check, KeyRound, LifeBuoy, Save, School, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, StatCard, EmptyState } from "@/components/bus/primitives";
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

export function ProfileScreen() {
  const loader = useCallback(() => profileApi.me(), []);
  const profile = useApiResource<UserProfile>(loader);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});

  const data = profile.data;
  const display = { ...data, ...form } as UserProfile;

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

            <div className="space-y-4">
              <StatCard label="Trạng thái tài khoản" value={<StatusPill status={display.status} />} icon={<Check className="size-6" />} accent="success" />
              <StatCard label="Xác minh sinh viên" value={<StatusPill status={display.studentVerificationStatus} />} icon={<School className="size-6" />} accent="secondary" />
            </div>
          </div>
        )}
      </AsyncBlock>
    </div>
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
      <PageHeader title="Thông báo" description="Thông báo thật từ hệ thống UniBus." icon={<Bell className="size-7" />} />
      {resource.loading && <LoadingPanel />}
      {resource.error && <ErrorPanel message={resource.error} onRetry={resource.reload} />}
      {!resource.loading && !resource.error && (
        <DataList emptyTitle="Chưa có thông báo" emptyDescription="Backend chưa trả về thông báo nào cho tài khoản này.">
          {(resource.data || []).map((item) => (
            <ExpressiveCard key={item.notificationId} variant="elevated" className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-on-surface">{item.title}</h3>
                    <StatusPill status={item.read ? "READ" : "UNREAD"} />
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
      <PageHeader title="Trường của tôi" description="Thông tin trường lấy từ hồ sơ sinh viên và catalog backend." icon={<School className="size-7" />} />
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

        <Section title="Catalog Đà Nẵng" description="Danh sách trường backend cho phép chọn khi xác minh.">
          {catalog.loading && <LoadingPanel />}
          {catalog.error && <ErrorPanel message={catalog.error} onRetry={catalog.reload} />}
          {!catalog.loading && !catalog.error && (
            <ExpressiveCard variant="elevated" className="max-h-[420px] overflow-auto p-4">
              {(catalog.data || []).length === 0 ? (
                <EmptyState icon={<School className="size-7" />} title="Catalog rỗng" description="Backend chưa trả về danh sách trường." />
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
      <PageHeader title="Cài đặt" description="Thiết lập tài khoản có endpoint backend thật." icon={<KeyRound className="size-7" />} />
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
      <PageHeader title="Yêu cầu hỗ trợ" description="MVP hiện dùng luồng phản hồi thật thay cho ticket hỗ trợ riêng." icon={<LifeBuoy className="size-7" />} />
      <UnavailablePanel
        title="Chưa có API ticket hỗ trợ riêng"
        description="Vui lòng dùng màn Phản hồi & đánh giá để gửi nội dung đến điều phối. Khi backend có support-ticket endpoint, màn này sẽ được bật lại."
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
