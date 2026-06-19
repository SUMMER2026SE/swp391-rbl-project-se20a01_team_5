"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bus,
  QrCode,
  ScanLine,
  Camera,
  CalendarDays,
  Search,
  PackageSearch,
  Siren,
  Phone,
  MessageSquare,
  PhoneCall,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ShieldCheck,
  CalendarClock,
  TrendingUp,
  History,
  Sparkles,
  CircleDot,
  UserCheck,
  IdCard,
  Clock,
} from "lucide-react";

import {
  ExpressiveButton,
  ExpressiveCard,
  Chip,
  SegmentedButton,
  ListItem,
  StatusPill,
} from "@/components/m3/primitives";
import {
  SplitText,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
  Magnetic,
  Counter,
  PageTransition,
} from "@/components/m3/motion";
import {
  PageHeader,
  StatCard,
  EmptyState,
} from "@/components/bus/primitives";
import { cn } from "@/lib/utils";
import {
  users,
  buses,
  routes,
  trips,
  lostItems,
  incidents,
  routeById,
  busById,
} from "@/lib/mock-data";

/* ============================================================================
   Assistant (Phụ xe) Module — Material 3 Expressive + GSAP-style motion
   Assistant u3 = Lê Thị Phương, bus b1 (43B-12345), route r1 (DN-01)
   Serves Đại học Duy Tân (Đà Nẵng) along with driver Trần Hoàng Long.
   ============================================================================ */

const ASSISTANT = users.find((u) => u.id === "u3")!;
const DRIVER = users.find((u) => u.id === "u2")!;
const COORDINATOR = users.find((u) => u.id === "u4")!;
const BUS = buses.find((b) => b.id === "b1")!;
const ROUTE = routes.find((r) => r.id === "r1")!;
const UNIVERSITY_NAME = "Đại học Duy Tân";

const todayISO = new Date().toISOString().slice(0, 10);

/* ---------------- helpers ---------------- */
function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/* ============================================================================
   1) ASSISTANT DASHBOARD
   ============================================================================ */
function AssistantDashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const activeTrip = trips.find((t) => t.assistantId === ASSISTANT.id && t.status === "running");
  const [scanned, setScanned] = React.useState(28);
  const [valid, setValid] = React.useState(26);
  const [errors, setErrors] = React.useState(2);

  const quickActions = [
    { id: "ast-scan", label: "Quét vé", icon: QrCode, accent: "bg-primary-container text-on-primary-container" },
    { id: "ast-monthly", label: "Vé tháng", icon: CalendarDays, accent: "bg-tertiary-container text-on-tertiary-container" },
    { id: "ast-lost", label: "Đồ thất lạc", icon: PackageSearch, accent: "bg-secondary-container text-on-secondary-container" },
    { id: "ast-incident", label: "Báo sự cố", icon: Siren, accent: "bg-error-container text-on-error-container" },
  ];

  const handleDemoScan = () => {
    setScanned((s) => s + 1);
    setValid((v) => v + 1);
    toast.success("Quét thành công!", {
      description: "Vé hợp lệ — sinh viên Nguyễn Minh Anh (SE20A01)",
    });
  };

  return (
    <PageTransition id="ast-dashboard">
      {/* Greeting */}
      <ScrollReveal>
        <div className="mb-6 min-w-0">
          <SplitText
            text={`${greetingByHour()}, ${ASSISTANT.name}!`}
            as="h1"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface"
            stagger={0.04}
          />
          <p className="mt-1.5 text-sm text-on-surface-variant flex items-center gap-2 min-w-0">
            <Sparkles className="size-4 text-tertiary shrink-0" />
            <span className="truncate">Phụ xe tuyến {ROUTE.code} · Xe {BUS.plate} · Phục vụ sinh viên {UNIVERSITY_NAME}</span>
          </p>
        </div>
      </ScrollReveal>

      {/* Trip info — bold dark card with lime accents */}
      <ScrollReveal delay={0.05}>
        <ExpressiveCard variant="filled" className="relative overflow-hidden mb-6 bg-[#14140f]">
          <div className="absolute inset-0 grid-texture opacity-10" />
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#beff50]/20 blur-2xl" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#beff50]" />
          <div className="relative p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3 flex-wrap min-w-0">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#beff50] px-3 py-1 text-xs font-bold text-[#14140f]">
                  <span className="size-1.5 rounded-full bg-[#14140f] animate-pulse" />
                  CHUYẾN ĐANG PHỤC VỤ
                </div>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight text-white truncate">
                  {ROUTE.code} · {ROUTE.from} → {ROUTE.to}
                </h2>
                <p className="mt-1 text-sm text-white/70 flex items-center gap-3 flex-wrap min-w-0">
                  <span className="inline-flex items-center gap-1 truncate"><Bus className="size-4" /> {BUS.plate}</span>
                  <span className="opacity-60">·</span>
                  <span className="inline-flex items-center gap-1 truncate"><Clock className="size-4" /> {activeTrip?.departTime ?? "07:15"}</span>
                  <span className="opacity-60">·</span>
                  <span className="inline-flex items-center gap-1 truncate"><Users className="size-4" /> {activeTrip?.passengerCount ?? 18}/{BUS.capacity}</span>
                </p>
              </div>
              <div className="hidden sm:flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#beff50] text-[#14140f]">
                <Bus className="size-8" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3 min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-[#beff50]/70">Tài xế</p>
                <p className="text-base font-bold mt-0.5 text-white truncate">{DRIVER.name}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-[#beff50]/70">Trường phục vụ</p>
                <p className="text-base font-bold mt-0.5 text-white truncate">{UNIVERSITY_NAME}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 col-span-2 sm:col-span-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-[#beff50]/70">Trạm tiếp theo</p>
                <p className="text-base font-bold mt-0.5 text-white truncate">Chợ Bà Chiểu</p>
              </div>
            </div>
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Scan stats */}
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StaggerItem>
          <StatCard label="Vé đã quét" accent="primary" icon={<QrCode className="size-5" />} value={<Counter to={scanned} />} hint="Hôm nay" trend="up" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Vé hợp lệ" accent="success" icon={<CheckCircle2 className="size-5" />} value={<Counter to={valid} />} hint={`${Math.round((valid / Math.max(1, scanned)) * 100)}% tỷ lệ hợp lệ`} trend="up" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Vé lỗi" accent="error" icon={<XCircle className="size-5" />} value={<Counter to={errors} />} hint="Cần kiểm tra" trend="down" />
        </StaggerItem>
      </StaggerGroup>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <ScrollReveal className="lg:col-span-2" delay={0.05}>
          <ExpressiveCard variant="outlined" className="p-5">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Truy cập nhanh</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((a, i) => (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 220, damping: 26 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onNavigate(a.id)}
                  className="state-layer flex flex-col items-center gap-2 rounded-2xl bg-surface-container-low p-4 text-center border border-outline-variant/50 elev-1 hover:elev-2"
                >
                  <div className={cn("flex size-12 items-center justify-center rounded-2xl", a.accent)}>
                    <a.icon className="size-6" />
                  </div>
                  <span className="text-sm font-medium text-on-surface">{a.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-outline-variant">
              <p className="text-sm font-medium text-on-surface mb-3">Demo quét vé</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Magnetic strength={0.25} className="flex-1">
                  <ExpressiveButton variant="filled" size="md" className="w-full" onClick={handleDemoScan}>
                    <QrCode className="size-5" /> Quét thử
                  </ExpressiveButton>
                </Magnetic>
                <ExpressiveButton variant="tonal" size="md" className="flex-1" onClick={() => onNavigate("ast-scan")}>
                  <Camera className="size-5" /> Mở camera
                </ExpressiveButton>
              </div>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Driver contact side */}
        <ScrollReveal delay={0.1}>
          <ExpressiveCard variant="filled" className="p-5 bg-secondary-container text-on-secondary-container h-full">
            <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Tài xế trên chuyến</p>
            <div className="flex items-center gap-3 mt-2 min-w-0">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-on-secondary-container/15 font-bold text-lg">
                {DRIVER.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{DRIVER.name}</p>
                <p className="text-xs opacity-80 truncate">{DRIVER.phone}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <ExpressiveButton
                variant="elevated"
                size="sm"
                className="flex-1 bg-surface text-[#144fcc]"
                onClick={() => toast.success(`Đang gọi ${DRIVER.name}…`)}
              >
                <PhoneCall className="size-4" /> Gọi
              </ExpressiveButton>
              <ExpressiveButton
                variant="outlined"
                size="sm"
                className="flex-1 border-on-secondary-container/40 text-on-secondary-container"
                onClick={() => toast.success(`Đã gửi tin nhắn đến ${DRIVER.name}`)}
              >
                <MessageSquare className="size-4" /> Nhắn
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

/* ============================================================================
   2) ASSISTANT SCAN QR
   ============================================================================ */
function AssistantScan() {
  const [cameraOn, setCameraOn] = React.useState(false);
  const [scans, setScans] = React.useState<{ id: string; student: string; code: string; time: string; status: "valid" | "used" | "error" }[]>([
    { id: "sc1", student: "Nguyễn Minh Anh", code: "SE20A01", time: "07:18", status: "valid" },
    { id: "sc2", student: "Trần Bảo", code: "SE20A02", time: "07:20", status: "used" },
    { id: "sc3", student: "Lê Thị Lan", code: "IT21B05", time: "07:22", status: "valid" },
    { id: "sc4", student: "Võ Thị Mai", code: "SE22A03", time: "07:24", status: "valid" },
    { id: "sc5", student: "—", code: "UNKNOWN", time: "07:25", status: "error" },
  ]);

  const handleDemoScan = () => {
    const samples = [
      { student: "Phạm Hoàng Long", code: "BA19C12", status: "valid" as const },
      { student: "Đặng Quang Huy", code: "IT20A11", status: "valid" as const },
      { student: "Bùi Thanh Nhã", code: "SE21B07", status: "used" as const },
      { student: "—", code: "EXP-9981", status: "error" as const },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    const time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setScans((s) => [{ id: `sc${Date.now()}`, time, ...pick }, ...s]);
    if (pick.status === "valid") toast.success("Vé hợp lệ!", { description: `${pick.student} (${pick.code})` });
    else if (pick.status === "used") toast.warning("Vé đã được sử dụng", { description: `${pick.student} (${pick.code})` });
    else toast.error("Vé lỗi / không hợp lệ", { description: `Mã: ${pick.code}` });
  };

  const statusMap = {
    valid: { label: "Hợp lệ", tone: "success" as const, icon: CheckCircle2 },
    used: { label: "Đã dùng", tone: "warning" as const, icon: AlertTriangle },
    error: { label: "Lỗi", tone: "error" as const, icon: XCircle },
  };

  return (
    <PageTransition id="ast-scan">
      <PageHeader
        title="Quét QR vé"
        description="Đưa mã vé sinh viên vào khung hình để xác thực lên xe."
        icon={<QrCode className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Viewfinder */}
        <ScrollReveal>
          <ExpressiveCard variant="outlined" className="p-5">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-lowest elev-1">
              {/* Dark inner */}
              <div className="absolute inset-0 bg-surface-container-lowest" />
              {/* Primary grid texture */}
              <div className="absolute inset-0 grid-texture opacity-40" />
              <div className="absolute inset-0 bg-aurora-m3 opacity-20" />

              {/* L-shaped corner brackets */}
              {[
                "top-4 left-4 border-t-4 border-l-4 rounded-tl-2xl",
                "top-4 right-4 border-t-4 border-r-4 rounded-tr-2xl",
                "bottom-4 left-4 border-b-4 border-l-4 rounded-bl-2xl",
                "bottom-4 right-4 border-b-4 border-r-4 rounded-br-2xl",
              ].map((pos) => (
                <div
                  key={pos}
                  className={cn("absolute size-16 border-primary", pos)}
                />
              ))}

              {/* Animated scan line */}
              <motion.div
                className="absolute left-8 right-8 h-0.5 bg-primary"
                style={{
                  boxShadow: "0 0 16px 4px var(--m3-primary), 0 0 32px 8px color-mix(in oklch, var(--m3-primary) 50%, transparent)",
                }}
                animate={{ top: ["12%", "84%", "12%"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div
                  className="absolute inset-x-0 -bottom-12 h-12"
                  style={{
                    background: "linear-gradient(to bottom, color-mix(in oklch, var(--m3-primary) 30%, transparent), transparent)",
                  }}
                />
              </motion.div>

              {/* Center pulsing icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="relative flex size-20 items-center justify-center rounded-3xl bg-primary text-on-primary elev-3"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="absolute inset-0 rounded-3xl bg-primary/40 animate-ping" />
                  <QrCode className="size-10 relative" />
                </motion.div>
              </div>

              {/* Status text */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className="rounded-full bg-surface-container-high/90 backdrop-blur px-4 py-1.5 elev-1">
                  <p className="text-xs font-medium text-on-surface">
                    {cameraOn ? "Camera đang hoạt động" : "Camera đang tắt"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <ExpressiveButton
                variant={cameraOn ? "tonal" : "filled"}
                size="md"
                className="flex-1"
                onClick={() => {
                  setCameraOn((v) => !v);
                  toast.success(cameraOn ? "Đã tắt camera" : "Đã bật camera");
                }}
              >
                <Camera className="size-5" /> {cameraOn ? "Tắt camera" : "Mở camera"}
              </ExpressiveButton>
              <ExpressiveButton variant="error" size="md" className="flex-1" onClick={handleDemoScan}>
                <ScanLine className="size-5" /> Quét thử
              </ExpressiveButton>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Recent scan results */}
        <ScrollReveal delay={0.05}>
          <ExpressiveCard variant="outlined" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface">Kết quả quét gần đây</h3>
              <span className="text-xs text-on-surface-variant">{scans.length} lượt</span>
            </div>
            <div className="space-y-2 max-h-[28rem] overflow-y-auto scrollbar-soft pr-1">
              {scans.map((s, i) => {
                const m = statusMap[s.status];
                const Icon = m.icon;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 220, damping: 26 }}
                  >
                    <ExpressiveCard variant="filled" className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center rounded-xl shrink-0",
                            s.status === "valid" && "bg-success-container text-on-surface",
                            s.status === "used" && "bg-warning-container text-on-surface",
                            s.status === "error" && "bg-error-container text-on-error-container"
                          )}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{s.student}</p>
                          <p className="text-xs text-on-surface-variant font-mono">{s.code} · {s.time}</p>
                        </div>
                        <StatusPill label={m.label} tone={m.tone} />
                      </div>
                    </ExpressiveCard>
                  </motion.div>
                );
              })}
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

/* ============================================================================
   3) ASSISTANT MONTHLY PASS LOOKUP
   ============================================================================ */
function AssistantMonthly() {
  const [query, setQuery] = React.useState("");
  const [searched, setSearched] = React.useState(false);

  // Mock lookup result
  const result = {
    studentName: "Nguyễn Minh Anh",
    studentCode: "SE20A01",
    email: "minhanh@duytan.edu.vn",
    university: "Đại học Duy Tân",
    routeCode: "DN-01",
    routeName: "Tuyến xanh Duy Tân — Trung tâm",
    validFrom: "01/06/2025",
    validUntil: "30/06/2025",
    daysLeft: 18,
    status: "active" as const,
    owner: "Nguyễn Minh Anh",
  };

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error("Vui lòng nhập mã sinh viên");
      return;
    }
    setSearched(true);
    toast.success("Đã tìm thấy vé tháng", { description: `Sinh viên ${result.studentName}` });
  };

  return (
    <PageTransition id="ast-monthly">
      <PageHeader
        title="Kiểm tra vé tháng"
        description="Tra cứu thông tin vé tháng của sinh viên theo mã sinh viên hoặc mã QR."
        icon={<CalendarDays className="size-7" />}
      />

      {/* Lookup form */}
      <ScrollReveal>
        <ExpressiveCard variant="outlined" className="p-5 mb-6">
          <label className="block text-sm font-medium text-on-surface mb-2">Mã sinh viên</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-on-surface-variant" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="VD: SE20A01"
                className="w-full h-12 rounded-full bg-surface-container-high text-on-surface pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#144fcc]/30 border-2 border-outline-variant"
              />
            </div>
            <Magnetic strength={0.25}>
              <ExpressiveButton variant="filled" size="lg" onClick={handleSearch}>
                <Search className="size-5" /> Tra cứu
              </ExpressiveButton>
            </Magnetic>
            <ExpressiveButton variant="tonal" size="lg" onClick={() => toast.info("Mở camera quét QR sinh viên")}>
              <QrCode className="size-5" /> Quét QR
            </ExpressiveButton>
          </div>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-on-surface-variant">Gợi ý:</span>
            {["SE20A01", "IT21B05", "SE22A03", "BA19C12"].map((s) => (
              <Chip key={s} variant="suggestion" onClick={() => setQuery(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </ExpressiveCard>
      </ScrollReveal>

      {/* Result — bold dark card with lime accents */}
      {searched && (
        <ScrollReveal delay={0.05}>
          <ExpressiveCard variant="filled" className="relative overflow-hidden bg-[#14140f]">
            <div className="absolute inset-0 grid-texture opacity-10" />
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#beff50]/20 blur-2xl" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#beff50]" />
            <div className="relative p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3 flex-wrap min-w-0">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-3 py-1 text-xs font-bold text-white">
                    <ShieldCheck className="size-3.5" /> VÉ THÁNG HỢP LỆ
                  </div>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white truncate">{result.studentName}</h2>
                  <p className="text-sm text-white/70 mt-0.5 truncate">{result.studentCode} · {result.university}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs uppercase tracking-wide text-[#beff50]/70">Còn lại</p>
                  <p className="text-4xl font-bold text-[#beff50]">
                    <Counter to={result.daysLeft} />
                    <span className="text-base font-medium text-white/70"> ngày</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Tuyến đăng ký", value: `${result.routeCode} · ${result.routeName}` },
                  { label: "Chủ vé", value: result.owner },
                  { label: "Hiệu lực từ", value: result.validFrom },
                  { label: "Hiệu lực đến", value: result.validUntil },
                ].map((f) => (
                  <div key={f.label} className="rounded-2xl bg-white/10 px-4 py-3 min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-[#beff50]/70">{f.label}</p>
                    <p className="text-sm font-semibold mt-0.5 text-white truncate">{f.value}</p>
                  </div>
                ))}
              </div>

              <Magnetic strength={0.2} className="block mt-6">
                <ExpressiveButton variant="elevated" size="lg" className="w-full sm:w-auto bg-[#beff50] text-[#14140f] hover:brightness-95" onClick={() => toast.success("Đã xác nhận lên xe!", { description: result.studentName })}>
                  <UserCheck className="size-5" /> Xác nhận lên xe
                </ExpressiveButton>
              </Magnetic>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      )}

      {!searched && (
        <ScrollReveal>
          <EmptyState
            icon={<CalendarClock className="size-7" />}
            title="Chưa có kết quả"
            description="Nhập mã sinh viên hoặc quét QR để tra cứu thông tin vé tháng."
          />
        </ScrollReveal>
      )}
    </PageTransition>
  );
}

/* ============================================================================
   4) ASSISTANT LOST ITEMS
   ============================================================================ */
function AssistantLost() {
  const [filter, setFilter] = React.useState<"all" | "reported" | "found" | "returned" | "closed">("all");
  const [selectedId, setSelectedId] = React.useState<string>(lostItems[0].id);
  const [items, setItems] = React.useState(lostItems);

  // Form state for "found item" entry
  const [form, setForm] = React.useState({ item: "", description: "" });

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const selected = items.find((i) => i.id === selectedId) ?? filtered[0];

  const filterOptions: { value: typeof filter; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "reported", label: "Mới báo" },
    { value: "found", label: "Đã tìm thấy" },
    { value: "returned", label: "Đã trả" },
    { value: "closed", label: "Đã đóng" },
  ];

  const statusMap = {
    reported: { label: "Mới báo", tone: "warning" as const },
    found: { label: "Đã tìm thấy", tone: "primary" as const },
    returned: { label: "Đã trả", tone: "success" as const },
    closed: { label: "Đã đóng", tone: "neutral" as const },
  };

  const handleAddFound = () => {
    if (!form.item.trim()) {
      toast.error("Vui lòng nhập tên đồ vật");
      return;
    }
    const newItem = {
      id: `li${Date.now()}`,
      studentName: "—",
      routeCode: ROUTE.code,
      tripDate: todayISO,
      item: form.item,
      description: form.description || "Phụ xe ghi nhận",
      status: "found" as const,
      createdAt: todayISO,
    };
    setItems((prev) => [newItem, ...prev]);
    setSelectedId(newItem.id);
    setForm({ item: "", description: "" });
    toast.success("Đã ghi nhận đồ tìm thấy", { description: form.item });
  };

  const updateStatus = (id: string, status: "found" | "returned" | "closed") => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    const labels = { found: "Đã tìm thấy", returned: "Đã trả cho sinh viên", closed: "Đã đóng hồ sơ" };
    toast.success(labels[status]);
  };

  return (
    <PageTransition id="ast-lost">
      <PageHeader
        title="Hỗ trợ báo mất đồ"
        description="Quản lý các đồ vật sinh viên để quên trên xe và xử lý trả lại."
        icon={<PackageSearch className="size-7" />}
      />

      {/* Filter pills */}
      <ScrollReveal>
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-soft pb-1">
          {filterOptions.map((o) => (
            <Chip
              key={o.value}
              variant={filter === o.value ? "filter-selected" : "filter"}
              onClick={() => setFilter(o.value)}
            >
              {o.label}
              <span className="ml-1 text-xs opacity-70">
                {o.value === "all" ? items.length : items.filter((i) => i.status === o.value).length}
              </span>
            </Chip>
          ))}
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <ScrollReveal className="lg:col-span-2" delay={0.05}>
          <ExpressiveCard variant="outlined" className="p-3">
            <div className="max-h-[34rem] overflow-y-auto scrollbar-soft space-y-1.5">
              {filtered.map((it) => {
                const m = statusMap[it.status];
                return (
                  <ListItem
                    key={it.id}
                    active={it.id === selectedId}
                    onClick={() => setSelectedId(it.id)}
                    leading={
                      <div className="flex size-10 items-center justify-center rounded-xl bg-tertiary-container text-on-tertiary-container">
                        <PackageSearch className="size-5" />
                      </div>
                    }
                    title={it.item}
                    subtitle={`${it.routeCode} · ${it.studentName} · ${new Date(it.tripDate).toLocaleDateString("vi-VN")}`}
                    trailing={<StatusPill label={m.label} tone={m.tone} />}
                  />
                );
              })}
              {filtered.length === 0 && (
                <EmptyState icon={<PackageSearch className="size-7" />} title="Không có đồ vật" />
              )}
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Detail + form */}
        <ScrollReveal className="lg:col-span-3" delay={0.1}>
          <div className="space-y-4">
            {selected && (
              <ExpressiveCard variant="filled" className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wide">Đồ vật</p>
                    <h3 className="text-xl font-bold text-on-surface mt-0.5">{selected.item}</h3>
                  </div>
                  <StatusPill label={statusMap[selected.status].label} tone={statusMap[selected.status].tone} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-on-surface-variant">Sinh viên báo</p>
                    <p className="font-semibold text-on-surface">{selected.studentName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Tuyến</p>
                    <p className="font-semibold text-on-surface">{selected.routeCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Ngày đi xe</p>
                    <p className="font-semibold text-on-surface">{new Date(selected.tripDate).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Ngày báo</p>
                    <p className="font-semibold text-on-surface">{new Date(selected.createdAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-on-surface-variant">Mô tả</p>
                  <p className="text-sm text-on-surface mt-1">{selected.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-5">
                  {selected.status !== "found" && selected.status !== "returned" && (
                    <ExpressiveButton variant="tonal" size="sm" onClick={() => updateStatus(selected.id, "found")}>
                      <CheckCircle2 className="size-4" /> Đã tìm thấy
                    </ExpressiveButton>
                  )}
                  {selected.status === "found" && (
                    <ExpressiveButton variant="tonal" size="sm" onClick={() => updateStatus(selected.id, "returned")}>
                      <UserCheck className="size-4" /> Đã trả
                    </ExpressiveButton>
                  )}
                  <ExpressiveButton
                    variant="outlined"
                    size="sm"
                    onClick={() => toast.success("Đã gửi tin nhắn liên hệ sinh viên")}
                  >
                    <MessageSquare className="size-4" /> Liên hệ SV
                  </ExpressiveButton>
                  {selected.status !== "closed" && (
                    <ExpressiveButton
                      variant="text"
                      size="sm"
                      onClick={() => updateStatus(selected.id, "closed")}
                    >
                      Đóng hồ sơ
                    </ExpressiveButton>
                  )}
                </div>
              </ExpressiveCard>
            )}

            {/* Found item form */}
            <ExpressiveCard variant="outlined" className="p-5">
              <h3 className="text-base font-semibold text-on-surface mb-3 flex items-center gap-2">
                <PackageSearch className="size-5 text-[#144fcc]" /> Ghi nhận đồ tìm thấy
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Tên đồ vật</label>
                  <input
                    value={form.item}
                    onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
                    placeholder="VD: Balo đen, thẻ sinh viên, điện thoại…"
                    className="w-full h-11 rounded-xl bg-surface-container-high text-on-surface px-4 text-sm outline-none focus:ring-2 focus:ring-[#144fcc]/30 border-2 border-outline-variant"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Mô tả</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Đặc điểm nhận dạng, vị trí tìm thấy…"
                    rows={3}
                    className="w-full rounded-xl bg-surface-container-high text-on-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#144fcc]/30 border-2 border-outline-variant resize-none"
                  />
                </div>
                <ExpressiveButton variant="filled" size="md" className="w-full" onClick={handleAddFound}>
                  <CheckCircle2 className="size-5" /> Thêm đồ tìm thấy
                </ExpressiveButton>
              </div>
            </ExpressiveCard>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

/* ============================================================================
   5) ASSISTANT INCIDENT REPORT
   ============================================================================ */
function AssistantIncident() {
  const [type, setType] = React.useState("delay");
  const [severity, setSeverity] = React.useState<"low" | "medium" | "high">("low");
  const [description, setDescription] = React.useState("");

  const [recent, setRecent] = React.useState(incidents);

  const typeOptions = [
    { value: "delay", label: "Chậm trễ" },
    { value: "breakdown", label: "Hỏng xe" },
    { value: "accident", label: "Tai nạn" },
    { value: "behavior", label: "Hành vi" },
    { value: "other", label: "Khác" },
  ];

  const severityOptions = [
    { value: "low" as const, label: "Thấp", icon: <CircleDot className="size-4" /> },
    { value: "medium" as const, label: "Trung bình", icon: <AlertTriangle className="size-4" /> },
    { value: "high" as const, label: "Cao", icon: <Siren className="size-4" /> },
  ];

  const severityMap = {
    low: { label: "Thấp", tone: "success" as const },
    medium: { label: "Trung bình", tone: "warning" as const },
    high: { label: "Cao", tone: "error" as const },
  };

  const statusMap = {
    open: { label: "Mở", tone: "primary" as const },
    investigating: { label: "Đang xử lý", tone: "warning" as const },
    closed: { label: "Đã đóng", tone: "neutral" as const },
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error("Vui lòng mô tả sự cố");
      return;
    }
    const typeLabel = typeOptions.find((o) => o.value === type)?.label ?? "Khác";
    const newIncident = {
      id: `ic${Date.now()}`,
      code: `INC-2025-${String(100 + recent.length).padStart(4, "0")}`,
      reporter: ASSISTANT.name,
      routeCode: ROUTE.code,
      type: type as any,
      severity,
      description,
      status: "open" as const,
      createdAt: todayISO,
    };
    setRecent((r) => [newIncident, ...r]);
    setDescription("");
    toast.success("Đã gửi báo cáo sự cố", {
      description: `${typeLabel} · Mức độ: ${severityMap[severity].label}`,
    });
  };

  return (
    <PageTransition id="ast-incident">
      <PageHeader
        title="Báo cáo sự cố"
        description="Ghi nhận sự cố xảy ra trên chuyến xe để điều phối xử lý kịp thời."
        icon={<Siren className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <ScrollReveal>
          <ExpressiveCard variant="outlined" className="p-5">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Tạo báo cáo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Loại sự cố</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {typeOptions.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setType(o.value)}
                      className={cn(
                        "state-layer h-10 rounded-full text-sm font-medium border-2 transition-colors",
                        type === o.value
                          ? "border-[#14140f] bg-[#144fcc] text-on-secondary-container"
                          : "border-outline-variant bg-transparent text-on-surface-variant"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Mức độ nghiêm trọng</label>
                <SegmentedButton
                  options={severityOptions}
                  value={severity}
                  onChange={(v) => setSeverity(v)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Mô tả chi tiết</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả diễn biến sự cố, vị trí, các bên liên quan…"
                  rows={5}
                  className="w-full rounded-xl bg-surface-container-high text-on-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#144fcc]/30 border-2 border-outline-variant resize-none"
                />
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4 text-xs text-on-surface-variant flex items-start gap-2">
                <Bus className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-on-surface">Thông tin chuyến</p>
                  <p>Tuyến {ROUTE.code} · Xe {BUS.plate} · Tài xế {DRIVER.name}</p>
                  <p>Phụ xe {ASSISTANT.name} · {new Date().toLocaleDateString("vi-VN")}</p>
                </div>
              </div>
              <Magnetic strength={0.2}>
                <ExpressiveButton variant="filled" size="lg" className="w-full" onClick={handleSubmit}>
                  <Send className="size-5" /> Gửi báo cáo
                </ExpressiveButton>
              </Magnetic>
            </div>
          </ExpressiveCard>
        </ScrollReveal>

        {/* Recent incidents */}
        <ScrollReveal delay={0.05}>
          <ExpressiveCard variant="outlined" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface">Sự cố gần đây</h3>
              <span className="text-xs text-on-surface-variant">{recent.length} báo cáo</span>
            </div>
            <div className="space-y-2 max-h-[34rem] overflow-y-auto scrollbar-soft pr-1">
              {recent.map((inc, i) => {
                const sev = severityMap[inc.severity];
                const st = statusMap[inc.status];
                return (
                  <motion.div
                    key={inc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 220, damping: 26 }}
                  >
                    <ExpressiveCard variant="filled" className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex size-9 items-center justify-center rounded-xl shrink-0",
                              inc.severity === "high" && "bg-error-container text-on-error-container",
                              inc.severity === "medium" && "bg-warning-container text-on-surface",
                              inc.severity === "low" && "bg-success-container text-on-surface"
                            )}
                          >
                            <Siren className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{inc.code}</p>
                            <p className="text-xs text-on-surface-variant">{inc.reporter} · {inc.routeCode}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <StatusPill label={sev.label} tone={sev.tone} />
                          <StatusPill label={st.label} tone={st.tone} />
                        </div>
                      </div>
                      <p className="text-sm text-on-surface-variant line-clamp-2">{inc.description}</p>
                      <p className="text-xs text-on-surface-variant/70 mt-2">{new Date(inc.createdAt).toLocaleDateString("vi-VN")}</p>
                    </ExpressiveCard>
                  </motion.div>
                );
              })}
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

/* ============================================================================
   6) ASSISTANT CONTACT
   ============================================================================ */
function AssistantContact() {
  const [messages, setMessages] = React.useState([
    { id: "m1", from: "them", text: "Lê Phương ơi, chiều nay tăng cường quét vé nhé.", time: "06:30", name: COORDINATOR.name },
    { id: "m2", from: "me", text: "Dạ em biết rồi ạ.", time: "06:32", name: ASSISTANT.name },
    { id: "m3", from: "them", text: "Anh Long bảo kẹt xe nhẹ, đến trạm trễ 5 phút.", time: "07:10", name: DRIVER.name },
    { id: "m4", from: "me", text: "Em sẽ thông báo cho sinh viên.", time: "07:11", name: ASSISTANT.name },
  ]);
  const [message, setMessage] = React.useState("");

  const send = () => {
    if (!message.trim()) return;
    setMessages((m) => [
      ...m,
      { id: `m${m.length + 1}`, from: "me", text: message, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }), name: ASSISTANT.name },
    ]);
    setMessage("");
    toast.success("Đã gửi tin nhắn");
  };

  return (
    <PageTransition id="ast-contact">
      <PageHeader
        title="Liên hệ"
        description="Kênh liên lạc với tài xế và điều phối viên — Đà Nẵng."
        icon={<Phone className="size-7" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Two contact cards */}
        <ScrollReveal>
          <div className="space-y-4">
            <ContactCard
              person={DRIVER}
              role="Tài xế trên chuyến"
              accent="bg-primary-container text-on-primary-container"
              onCall={() => toast.success(`Đang gọi ${DRIVER.name}…`, { description: DRIVER.phone })}
              onMessage={() => toast.info("Đã mở khung chat")}
            />
            <ContactCard
              person={COORDINATOR}
              role="Điều phối viên"
              accent="bg-tertiary-container text-on-tertiary-container"
              onCall={() => toast.success(`Đang gọi ${COORDINATOR.name}…`, { description: COORDINATOR.phone })}
              onMessage={() => toast.info("Đã mở khung chat")}
            />
            <ExpressiveCard variant="outlined" className="p-5">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-2">Trung tâm điều hành</p>
              <p className="text-sm font-semibold text-on-surface">UniBus Đà Nẵng</p>
              <p className="text-xs text-on-surface-variant mt-1">254 Nguyễn Văn Linh, Thanh Khê</p>
              <p className="text-xs text-on-surface-variant mt-1">Hotline: 0236 3650 529</p>
            </ExpressiveCard>
          </div>
        </ScrollReveal>

        {/* Messages */}
        <ScrollReveal className="lg:col-span-2" delay={0.05}>
          <ExpressiveCard variant="outlined" className="flex flex-col h-[32rem]">
            <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-outline-variant">
              <div className="flex size-10 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container font-bold">
                {COORDINATOR.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">{COORDINATOR.name}</p>
                <p className="text-xs text-success inline-flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" /> Đang hoạt động
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-soft p-4 space-y-3">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5",
                      m.from === "me"
                        ? "bg-[#144fcc] text-white rounded-br-md"
                        : "bg-surface-container-high text-on-surface rounded-bl-md"
                    )}
                  >
                    {m.from === "them" && (
                      <p className={cn("text-[10px] font-semibold mb-0.5", m.name === DRIVER.name ? "text-[#ff8c5f]" : "text-[#144fcc]")}>
                        {m.name}
                      </p>
                    )}
                    <p className="text-sm break-words">{m.text}</p>
                    <p className={cn("text-[10px] mt-1 opacity-70", m.from === "me" ? "text-white/70" : "text-on-surface-variant")}>
                      {m.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="border-t-2 border-outline-variant p-3 flex items-center gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Nhập tin nhắn…"
                className="flex-1 h-11 rounded-full bg-surface-container-high text-on-surface px-5 text-sm outline-none focus:ring-2 focus:ring-[#144fcc]/30"
              />
              <Magnetic strength={0.3}>
                <ExpressiveButton variant="filled" size="icon" onClick={send}>
                  <Send className="size-5" />
                </ExpressiveButton>
              </Magnetic>
            </div>
          </ExpressiveCard>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}

function ContactCard({
  person,
  role,
  accent,
  onCall,
  onMessage,
}: {
  person: typeof DRIVER;
  role: string;
  accent: string;
  onCall: () => void;
  onMessage: () => void;
}) {
  return (
    <ExpressiveCard variant="elevated" className="p-5">
      <div className="flex items-start gap-4">
        <div className={cn("flex size-14 shrink-0 items-center justify-center rounded-2xl font-bold", accent)}>
          {person.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-on-surface truncate">{person.name}</p>
          <p className="text-sm text-on-surface-variant">{role}</p>
          <p className="text-xs text-on-surface-variant mt-1 truncate">{person.phone}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Magnetic strength={0.25} className="flex-1">
          <ExpressiveButton variant="tonal" size="md" className="w-full" onClick={onCall}>
            <PhoneCall className="size-4" /> Gọi
          </ExpressiveButton>
        </Magnetic>
        <Magnetic strength={0.25} className="flex-1">
          <ExpressiveButton variant="outlined" size="md" className="w-full" onClick={onMessage}>
            <MessageSquare className="size-4" /> Nhắn
          </ExpressiveButton>
        </Magnetic>
      </div>
    </ExpressiveCard>
  );
}

/* ============================================================================
   7) ASSISTANT HISTORY
   ============================================================================ */
function AssistantHistory() {
  const history = React.useMemo(() => {
    const mock = [
      { id: "h1", date: "2025-06-13", routeId: "r1", busId: "b1", departTime: "16:00", scans: 32, incidents: 0 },
      { id: "h2", date: "2025-06-13", routeId: "r1", busId: "b1", departTime: "06:30", scans: 38, incidents: 1 },
      { id: "h3", date: "2025-06-12", routeId: "r1", busId: "b1", departTime: "16:00", scans: 25, incidents: 0 },
      { id: "h4", date: "2025-06-12", routeId: "r1", busId: "b1", departTime: "06:30", scans: 41, incidents: 0 },
      { id: "h5", date: "2025-06-11", routeId: "r1", busId: "b4", departTime: "12:00", scans: 18, incidents: 0 },
      { id: "h6", date: "2025-06-11", routeId: "r1", busId: "b1", departTime: "06:30", scans: 35, incidents: 1 },
      { id: "h7", date: "2025-06-10", routeId: "r1", busId: "b1", departTime: "16:00", scans: 29, incidents: 0 },
    ];
    return mock;
  }, []);

  const totalTrips = history.length;
  const totalScans = history.reduce((s, t) => s + t.scans, 0);
  const totalIncidents = history.reduce((s, t) => s + t.incidents, 0);
  const avgScans = Math.round(totalScans / history.length);

  return (
    <PageTransition id="ast-history">
      <PageHeader
        title="Lịch sử chuyến"
        description="Tổng kết các chuyến đã phụ trách trong thời gian gần đây."
        icon={<History className="size-7" />}
      />

      <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StaggerItem>
          <StatCard label="Tổng chuyến" accent="primary" icon={<Bus className="size-5" />} value={<Counter to={totalTrips} />} hint="Đã hoàn thành" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Tổng vé quét" accent="tertiary" icon={<QrCode className="size-5" />} value={<Counter to={totalScans} />} trend="up" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Trung bình/chuyến" accent="secondary" icon={<TrendingUp className="size-5" />} value={<Counter to={avgScans} />} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Sự cố ghi nhận" accent="error" icon={<Siren className="size-5" />} value={<Counter to={totalIncidents} />} hint="Đã xử lý" />
        </StaggerItem>
      </StaggerGroup>

      <ScrollReveal>
        <ExpressiveCard variant="outlined" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b-2 border-outline-variant">
            <h3 className="text-lg font-semibold text-on-surface">Bảng chuyến gần đây</h3>
            <span className="text-xs text-on-surface-variant">{history.length} chuyến</span>
          </div>
          <div className="max-h-[28rem] overflow-y-auto scrollbar-soft">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-container-high text-on-surface-variant">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Ngày</th>
                  <th className="text-left font-semibold px-3 py-3 hidden sm:table-cell">Tuyến</th>
                  <th className="text-left font-semibold px-3 py-3 hidden md:table-cell">Xe</th>
                  <th className="text-left font-semibold px-3 py-3">Giờ</th>
                  <th className="text-right font-semibold px-3 py-3">Vé quét</th>
                  <th className="text-right font-semibold px-5 py-3">Sự cố</th>
                </tr>
              </thead>
              <tbody>
                {history.map((t, idx) => {
                  const r = routeById(t.routeId);
                  const b = busById(t.busId);
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, type: "spring", stiffness: 220, damping: 26 }}
                      className="border-t border-outline-variant hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-on-surface">
                        {new Date(t.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ background: r?.color }} />
                          <span className="text-on-surface-variant">{r?.code}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-on-surface-variant">{b?.plate}</td>
                      <td className="px-3 py-3 text-on-surface-variant font-mono text-xs tabular-nums">{t.departTime}</td>
                      <td className="px-3 py-3 text-right font-semibold text-on-surface">{t.scans}</td>
                      <td className="px-5 py-3 text-right">
                        {t.incidents === 0 ? (
                          <span className="text-xs text-on-surface-variant">—</span>
                        ) : (
                          <StatusPill label={`${t.incidents}`} tone="warning" />
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ExpressiveCard>
      </ScrollReveal>
    </PageTransition>
  );
}

/* ============================================================================
   EXPORT
   ============================================================================ */
export function AssistantModule({
  activeId,
  onNavigate,
}: {
  activeId: string;
  onNavigate: (id: string) => void;
}) {
  switch (activeId) {
    case "ast-dashboard":
      return <AssistantDashboard onNavigate={onNavigate} />;
    case "ast-scan":
      return <AssistantScan />;
    case "ast-monthly":
      return <AssistantMonthly />;
    case "ast-lost":
      return <AssistantLost />;
    case "ast-incident":
      return <AssistantIncident />;
    case "ast-contact":
      return <AssistantContact />;
    case "ast-history":
      return <AssistantHistory />;
    default:
      return <AssistantDashboard onNavigate={onNavigate} />;
  }
}

export default AssistantModule;
