"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Bell,
  LifeBuoy,
  Settings as SettingsIcon,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Lock,
  Send,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Bus,
  Gift,
  Star,
  Check,
  School,
  BadgeCheck,
  Clock,
  Building2,
} from "lucide-react";
import { PageHeader, Section, EmptyState, StatCard, ExpressiveCard } from "./primitives";
import { ExpressiveButton, StatusPill } from "@/components/m3/primitives";
import { ScrollReveal, StaggerGroup, StaggerItem, Counter } from "@/components/m3/motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { notifications, users, universities, universityById, calcSubsidy, formatVND } from "@/lib/mock-data";
import type { Role } from "@/lib/types";

/* Perk-style role colors — bold literal hex (NOT token-based, since tokens revert
   to default M3 outside student scope). Avatar fallback bg + contrast text. */
const ROLE_COLORS: Record<Role, { bg: string; fg: string }> = {
  student: { bg: "#beff50", fg: "#14140f" },
  driver: { bg: "#ff8c5f", fg: "#14140f" },
  assistant: { bg: "#144fcc", fg: "#ffffff" },
  coordinator: { bg: "#c8a0ff", fg: "#14140f" },
  admin: { bg: "#dc2626", fg: "#ffffff" },
  university_admin: { bg: "#144fcc", fg: "#ffffff" },
};
const ROLE_AVATAR: Record<Role, string> = {
  student: "MA",
  driver: "LÔ",
  assistant: "PT",
  coordinator: "BQ",
  admin: "HT",
  university_admin: "BN",
};

/* Notification type → BOLD icon circle (bold color text on 20% opacity tinted bg).
   Icon and accent text use the full bold color for contrast on warm-white surface. */
const typeStyle: Record<string, { bg: string; text: string; icon: typeof Info }> = {
  info: { bg: "bg-[#144fcc]/15", text: "text-[#144fcc]", icon: Info },
  success: { bg: "bg-[#16a34a]/15", text: "text-[#16a34a]", icon: CheckCircle2 },
  warning: { bg: "bg-[#f59e0b]/15", text: "text-[#f59e0b]", icon: AlertTriangle },
  danger: { bg: "bg-[#dc2626]/15", text: "text-[#dc2626]", icon: AlertCircle },
};

/* =========================== PROFILE =========================== */
export function ProfileScreen({ role }: { role: Role }) {
  const user = users.find((u) => u.role === role) ?? users[0];
  const [editing, setEditing] = useState(false);
  const uni = user.universityId ? universityById(user.universityId) : undefined;
  const rc = ROLE_COLORS[role];

  const roleFields: { label: string; value?: string }[] =
    role === "student" ? [
      { label: "Mã sinh viên", value: user.studentId },
      { label: "Khoa", value: user.faculty },
      { label: "Lớp", value: user.class },
      ...(uni ? [{ label: "Trường", value: uni.name }] : []),
    ]
    : role === "driver" ? [
      { label: "Mã nhân viên", value: user.employeeId },
      { label: "Số GPLX", value: user.licenseNo },
    ]
    : [{ label: "Mã nhân viên", value: user.employeeId }];

  return (
    <div className="min-w-0 overflow-x-hidden">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Xem và cập nhật thông tin tài khoản của bạn."
        icon={<UserIcon className="size-6" />}
        actions={
          !editing ? (
            <ExpressiveButton onClick={() => setEditing(true)}>Chỉnh sửa</ExpressiveButton>
          ) : (
            <>
              <ExpressiveButton variant="outlined" onClick={() => setEditing(false)}>Hủy</ExpressiveButton>
              <ExpressiveButton onClick={() => { setEditing(false); toast.success("Đã lưu thay đổi"); }}>Lưu</ExpressiveButton>
            </>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar card — keeps avatar fallback as role bold color */}
        <ExpressiveCard variant="elevated" className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="size-24">
                <AvatarFallback
                  className="text-2xl font-bold border-2 border-white/40"
                  style={{ backgroundColor: rc.bg, color: rc.fg }}
                >
                  {ROLE_AVATAR[role]}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-[#beff50] text-[#14140f] elev-2"
                aria-label="Đổi ảnh đại diện"
              >
                <Camera className="size-4" />
              </button>
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#14140f] truncate w-full">{user.name}</h3>
            <p className="text-sm text-on-surface-variant truncate w-full">{user.email}</p>
            {/* Verification badges — bold pills: dark+lime / lime+dark / blue+white */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
              <span className="inline-flex items-center h-6 px-3 rounded-full text-xs font-bold bg-[#14140f] text-[#beff50]">
                {role}
              </span>
              {role === "student" && user.verificationStatus === "VERIFIED" && (
                <span className="inline-flex items-center gap-1 h-6 px-3 rounded-full text-xs font-bold bg-[#beff50] text-[#14140f]">
                  <BadgeCheck className="size-3.5" /> Đã xác thực
                </span>
              )}
              {user.authProvider === "google" && (
                <span className="inline-flex items-center h-6 px-3 rounded-full text-xs font-bold bg-[#144fcc] text-white">
                  Google
                </span>
              )}
            </div>
            <div className="mt-6 w-full space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-on-surface-variant min-w-0">
                <Mail className="size-4 shrink-0" /> <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant min-w-0">
                <Phone className="size-4 shrink-0" /> <span className="truncate">{user.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant min-w-0">
                <Calendar className="size-4 shrink-0" /> <span className="truncate">Tham gia {user.createdAt}</span>
              </div>
            </div>
          </CardContent>
        </ExpressiveCard>

        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Info fields — surface-container-low cards (off-white) */}
          <ExpressiveCard variant="filled" className="bg-surface-container-low">
            <CardHeader>
              <CardTitle className="text-base text-[#14140f]">Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 min-w-0">
                <Label>Họ và tên</Label>
                <Input defaultValue={user.name} disabled={!editing} className="h-11 rounded-xl bg-surface-container-lowest" />
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Số điện thoại</Label>
                <Input defaultValue={user.phone} disabled={!editing} className="h-11 rounded-xl bg-surface-container-lowest" />
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Email</Label>
                <Input defaultValue={user.email} disabled className="h-11 rounded-xl bg-surface-container-lowest" />
                <p className="text-xs text-on-surface-variant">Email không thể thay đổi</p>
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Địa chỉ</Label>
                <Input placeholder="Số nhà, đường, phường" disabled={!editing} className="h-11 rounded-xl bg-surface-container-lowest" defaultValue="KTX khu A, Đà Nẵng" />
              </div>
              {roleFields.map((f) => (
                <div key={f.label} className="space-y-2 min-w-0">
                  <Label>{f.label}</Label>
                  <Input defaultValue={f.value} disabled className="h-11 rounded-xl bg-surface-container-lowest" />
                </div>
              ))}
            </CardContent>
          </ExpressiveCard>

          {/* Security section — dark accent card */}
          <div className="rounded-xl overflow-hidden elev-2 bg-[#14140f] text-white">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#beff50] text-[#14140f]">
                  <Lock className="size-5" />
                </div>
                <h3 className="text-base font-bold">Bảo mật</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Mật khẩu</p>
                    <p className="text-xs text-white/60 truncate">Đổi mật khẩu định kỳ để bảo mật</p>
                  </div>
                  <button
                    onClick={() => toast.info("Mở modal đổi mật khẩu (demo)")}
                    className="shrink-0 inline-flex items-center gap-2 h-9 px-4 text-sm font-bold rounded-full bg-[#beff50] text-[#14140f] hover:opacity-90 transition-opacity"
                  >
                    Đổi mật khẩu
                  </button>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Xác thực 2 bước</p>
                    <p className="text-xs text-white/60 truncate">Bảo vệ thêm cho tài khoản</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================== NOTIFICATIONS =========================== */
export function NotificationsScreen() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const list = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  return (
    <div className="min-w-0 overflow-x-hidden">
      <PageHeader
        title="Thông báo"
        description="Các thông báo hệ thống, đặt vé và hoạt động tài khoản."
        icon={<Bell className="size-6" />}
        actions={
          <ExpressiveButton
            variant="outlined"
            className="border-[#14140f] text-[#14140f]"
            size="sm"
            onClick={() => toast.success("Đã đánh dấu tất cả là đã đọc")}
          >
            <Check className="size-4" /> Đánh dấu đã đọc
          </ExpressiveButton>
        }
      />
      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tất cả ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Chưa đọc ({notifications.filter((n) => !n.read).length})</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-0">
          <StaggerGroup className="space-y-2">
            {list.length === 0 ? (
              <EmptyState icon={<Bell className="size-6" />} title="Không có thông báo" description="Các thông báo mới sẽ hiển thị tại đây." />
            ) : (
              list.map((n) => {
                const st = typeStyle[n.type];
                return (
                  <StaggerItem key={n.id}>
                    <ExpressiveCard
                      variant={n.read ? "filled" : "outlined"}
                      className={cn(!n.read && "border-[#144fcc]/40 bg-[#144fcc]/5")}
                    >
                      <CardContent className="flex items-start gap-3 py-4">
                        {/* Icon circle — BOLD color text on 20% opacity tinted bg */}
                        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", st.bg, st.text)}>
                          <st.icon className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-[#14140f] truncate">{n.title}</p>
                            {/* Unread dot = #144fcc blue (NOT bg-primary which is invisible lime on light) */}
                            {!n.read && <span className="size-2 rounded-full bg-[#144fcc] shrink-0" />}
                          </div>
                          <p className="text-sm text-on-surface-variant mt-0.5 text-pretty">{n.body}</p>
                          <p className="text-xs text-on-surface-variant/70 mt-1.5">{n.createdAt}</p>
                        </div>
                      </CardContent>
                    </ExpressiveCard>
                  </StaggerItem>
                );
              })
            )}
          </StaggerGroup>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* =========================== SUPPORT =========================== */
export function SupportScreen() {
  const [sent, setSent] = useState(false);
  /* Contact cards — bold icon circles (blue/coral/dark) */
  const contacts = [
    { icon: Phone, label: "Hotline", val: "1900 1234 (24/7)", bg: "#144fcc", fg: "#ffffff" },
    { icon: Mail, label: "Email", val: "hotro@busgo.edu.vn", bg: "#ff8c5f", fg: "#14140f" },
    { icon: MapPin, label: "Văn phòng", val: "Phòng A.101, Trạm điều phối", bg: "#14140f", fg: "#beff50" },
  ];
  return (
    <div className="min-w-0 overflow-x-hidden">
      <PageHeader title="Yêu cầu hỗ trợ" description="Gửi yêu cầu hỗ trợ đến đội ngũ quản trị hệ thống." icon={<LifeBuoy className="size-6" />} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-w-0">
          <ExpressiveCard variant="filled" className="bg-surface-container-low">
            <CardHeader>
              <CardTitle className="text-base text-[#14140f]">Tạo yêu cầu mới</CardTitle>
              <CardDescription>Mô tả rõ vấn đề để được hỗ trợ nhanh chóng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 min-w-0">
                  <Label>Chủ đề</Label>
                  <Input placeholder="VD: Không nhận được email xác thực" className="h-11 rounded-xl bg-surface-container-lowest" />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Danh mục</Label>
                  <Select defaultValue="account">
                    <SelectTrigger className="h-11 rounded-xl bg-surface-container-lowest"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Tài khoản</SelectItem>
                      <SelectItem value="payment">Thanh toán</SelectItem>
                      <SelectItem value="route">Tuyến xe</SelectItem>
                      <SelectItem value="bug">Lỗi hệ thống</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Mô tả chi tiết</Label>
                <Textarea placeholder="Nhập mô tả vấn đề của bạn..." rows={5} className="rounded-xl bg-surface-container-lowest" />
              </div>
              <div className="flex justify-end">
                <ExpressiveButton onClick={() => { setSent(true); toast.success("Đã gửi yêu cầu. Chúng tôi sẽ phản hồi trong 24h."); }}>
                  <Send className="size-4" /> Gửi yêu cầu
                </ExpressiveButton>
              </div>
            </CardContent>
          </ExpressiveCard>
        </div>
        <div className="space-y-4 min-w-0">
          <ExpressiveCard variant="filled" className="bg-surface-container-low">
            <CardHeader><CardTitle className="text-base text-[#14140f]">Liên hệ trực tiếp</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {contacts.map((c) => (
                <div key={c.label} className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: c.bg, color: c.fg }}
                  >
                    <c.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#14140f] truncate">{c.label}</p>
                    <p className="text-on-surface-variant truncate">{c.val}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </ExpressiveCard>
          {/* Success confirmation — dark card with lime accent */}
          {sent && (
            <div className="rounded-xl overflow-hidden elev-2 bg-[#14140f] text-white">
              <div className="p-5 flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#beff50] text-[#14140f]">
                  <CheckCircle2 className="size-5" />
                </div>
                <div className="text-sm min-w-0">
                  <p className="font-bold text-[#beff50]">Yêu cầu đã được gửi</p>
                  <p className="text-white/80 mt-1 text-pretty">Mã: SUP-2025-0128. Bạn sẽ nhận phản hồi qua email trong 24h.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================== SETTINGS =========================== */
export function SettingsScreen() {
  return (
    <div className="min-w-0 overflow-x-hidden">
      <PageHeader title="Cài đặt" description="Tùy chỉnh trải nghiệm sử dụng UniBus." icon={<SettingsIcon className="size-6" />} />
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Toggle cards — surface-container-low, switches stay */}
        <ExpressiveCard variant="filled" className="bg-surface-container-low">
          <CardHeader>
            <CardTitle className="text-base text-[#14140f] font-bold">Thông báo</CardTitle>
            <CardDescription>Chọn loại thông báo bạn muốn nhận.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Xe sắp đến trạm", desc: "Thông báo khi xe cách trạm 5 phút", on: true },
              { label: "Xác nhận đặt vé", desc: "Email & thông báo khi đặt vé thành công", on: true },
              { label: "Khuyến mãi", desc: "Các ưu đãi vé tháng, sự kiện", on: false },
              { label: "Tin hệ thống", desc: "Thông báo thay đổi lịch trình, bảo trì", on: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#14140f] truncate">{s.label}</p>
                  <p className="text-xs text-on-surface-variant truncate">{s.desc}</p>
                </div>
                <Switch defaultChecked={s.on} />
              </div>
            ))}
          </CardContent>
        </ExpressiveCard>
        <ExpressiveCard variant="filled" className="bg-surface-container-low">
          <CardHeader>
            {/* Section header — dark bold icon + title */}
            <CardTitle className="text-base text-[#14140f] font-bold flex items-center gap-2">
              <Shield className="size-4 text-[#144fcc]" /> Quyền riêng tư
            </CardTitle>
            <CardDescription>Kiểm soát dữ liệu cá nhân.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Chia sẻ vị trí", desc: "Cho phép theo dõi vị trí để gợi ý tuyến", on: true },
              { label: "Hiển thị hồ sơ công khai", desc: "Sinh viên khác có thể xem tên bạn", on: false },
              { label: "Lưu lịch sử chuyến đi", desc: "Lưu trữ lịch sử để gợi ý AI", on: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#14140f] truncate">{s.label}</p>
                  <p className="text-xs text-on-surface-variant truncate">{s.desc}</p>
                </div>
                <Switch defaultChecked={s.on} />
              </div>
            ))}
          </CardContent>
        </ExpressiveCard>
      </div>
    </div>
  );
}

/* =========================== STUDENT: MY UNIVERSITY ===========================
   REQ: Xác định trường · Xem trạng thái xác thực · Xem tuyến theo trường · Vé tháng trợ giá
*/
export function MyUniversityScreen() {
  const user = users.find((u) => u.role === "student")!;
  const uni = universityById(user.universityId || "uni1")!;
  /* Route list — bold color icon circles (lime for DN-01, blue for DN-03) */
  const routes = [
    { id: "r1", code: "DN-01", name: "Tuyến xanh Duy Tân — Trung tâm", from: "KTX A", to: "Cơ sở chính", fare: 180000, iconBg: "#beff50", iconFg: "#14140f" },
    { id: "r3", code: "DN-03", name: "Tuyến teal Bách Khoa — Sư phạm", from: "Sân bay", to: "Bến xe", fare: 210000, iconBg: "#144fcc", iconFg: "#ffffff" },
  ];

  return (
    <div className="min-w-0 overflow-x-hidden">
      <PageHeader
        title="Trường của tôi"
        description="Thông tin liên kết trường đại học và trợ giá của bạn."
        icon={<School className="size-6" />}
      />

      {/* University hero card — real logoUrl in white rounded container, gradient from uni.color */}
      <ScrollReveal>
        <ExpressiveCard variant="elevated" className="overflow-hidden mb-6">
          <div className="relative p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${uni.color}1f, transparent)` }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-white p-2 elev-2 border border-outline-variant/40 shrink-0">
                {uni.logoUrl ? (
                  <img src={uni.logoUrl} alt={`Logo ${uni.shortName}`} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: uni.color }}>{uni.logo}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold tracking-tight text-[#14140f] truncate">{uni.name}</h2>
                  <StatusPill label={uni.status === "active" ? "Đang hoạt động" : "Tạm dừng"} tone={uni.status === "active" ? "success" : "warning"} />
                </div>
                <p className="text-sm text-on-surface-variant mt-1 truncate">{uni.address}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <StatusPill label="Đã xác thực" tone="success" />
                  <span className="text-xs text-on-surface-variant truncate">MSSV: {user.studentId} · Email: {user.email}</span>
                </div>
              </div>
            </div>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Verification StatCards — bold (success=#16a34a, primary=#14140f dark, tertiary=#ff8c5f) */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <StatCard label="Trạng thái xác thực" value={<span className="text-white">VERIFIED</span>} icon={<BadgeCheck className="size-6" />} accent="success" hint="Tự nhận diện qua domain email" trend="up" />
        <StatCard label="Phương thức đăng nhập" value="Google" icon={<Shield className="size-6" />} accent="primary" hint={`${user.email}`} />
        <StatCard label="Cơ sở hiện tại" value={uni.campuses[0].code} icon={<Building2 className="size-6" />} accent="tertiary" hint={uni.campuses[0].name} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Routes for my university */}
        <div className="lg:col-span-2 min-w-0">
          <Section title="Tuyến xe dành cho trường của bạn" description={`Chỉ hiển thị các tuyến được liên kết với ${uni.shortName}.`}>
            <StaggerGroup className="space-y-3">
              {routes.map((r) => {
                const sub = calcSubsidy(r.fare, uni.id);
                return (
                  <StaggerItem key={r.id}>
                    <ExpressiveCard variant="filled" interactive>
                      <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Route color bold — dark icon on lime for DN-01, white icon on blue for DN-03 */}
                        <div
                          className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: r.iconBg, color: r.iconFg }}
                        >
                          <Bus className="size-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#14140f]">{r.code}</span>
                            <span className="text-sm font-medium text-on-surface truncate">{r.name}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{r.from} → {r.to}</p>
                        </div>
                        <div className="text-right shrink-0 min-w-0">
                          <p className="text-xs text-on-surface-variant line-through">{formatVND(sub.original)}</p>
                          <p className="text-lg font-bold text-[#16a34a]">{formatVND(sub.final)}</p>
                          <p className="text-[11px] text-[#16a34a] font-medium">Tiết kiệm {formatVND(sub.subsidy)}</p>
                        </div>
                      </CardContent>
                    </ExpressiveCard>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </Section>
        </div>

        {/* Subsidy card — tertiary-container (#ff8c5f coral) bold, dark text */}
        <div className="min-w-0">
          <div className="rounded-xl overflow-hidden elev-2 bg-[#ff8c5f] text-[#14140f]">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#14140f] text-[#beff50]">
                  <Gift className="size-5" />
                </div>
                <h3 className="text-base font-bold">Chính sách trợ giá</h3>
              </div>
              <div className="space-y-3 text-sm">
                {(() => {
                  const sub = calcSubsidy(180000, uni.id);
                  return (
                    <>
                      <div className="flex justify-between gap-2">
                        <span className="text-[#14140f]/80">Giá gốc vé tháng</span>
                        <span className="font-medium">{formatVND(sub.original)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-[#14140f]/80">Trợ giá từ {uni.shortName}</span>
                        <span className="font-bold">−{formatVND(sub.subsidy)}</span>
                      </div>
                      <div className="h-px bg-[#14140f]/15 my-2" />
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold">Bạn thanh toán</span>
                        <span className="font-bold text-lg">{formatVND(sub.final)}</span>
                      </div>
                      {sub.policy && (
                        <p className="text-xs text-[#14140f]/80 mt-2 text-pretty">Áp dụng: {sub.policy.name} · Hiệu lực đến {sub.policy.activeUntil}</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
