"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Bus,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  School,
  Sparkles,
  ChevronDown,
  User as UserIcon,
  Phone,
  Check,
  QrCode,
  Route,
  Star,
} from "lucide-react";
import { ExpressiveCard } from "@/components/m3/primitives";
import { SplitText, Marquee, ClipReveal } from "@/components/m3/motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { Role } from "@/lib/types";
import { authApi, setTokens, universityApi } from "@/lib/api/client";

type AuthScreen = "login" | "register" | "forgot";

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
    };
  }
}

function mapBackendRole(role?: string): Role {
  switch ((role || "").toUpperCase()) {
    case "DRIVER":
      return "driver";
    case "CONDUCTOR":
      return "assistant";
    case "DISPATCHER":
      return "coordinator";
    case "ADMIN":
      return "admin";
    case "UNIVERSITY_ADMIN":
      return "university_admin";
    default:
      return "student";
  }
}

export function AuthScreens({
  onLogin,
}: {
  onLogin: (role: Role) => void;
}) {
  const [screen, setScreen] = useState<AuthScreen>("login");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [partnerNames, setPartnerNames] = useState<string[]>([]);
  const authRef = useRef<HTMLDivElement>(null);

  const scrollToAuth = (s: AuthScreen) => {
    setScreen(s);
    requestAnimationFrame(() => {
      authRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    universityApi.daNang()
      .then(setPartnerNames)
      .catch(() => setPartnerNames([]));
  }, []);

  const handleGoogleLogin = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID để đăng nhập Google.");
      return;
    }
    if (!googleReady || !window.google?.accounts?.oauth2) {
      toast.error("Google Identity chưa sẵn sàng. Vui lòng thử lại sau vài giây.");
      return;
    }

    setGoogleLoading(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: async (response) => {
        if (response.error || !response.access_token) {
          setGoogleLoading(false);
          toast.error("Không nhận được token Google hợp lệ.");
          return;
        }
        try {
          const tokenPair = await authApi.googleLogin({ accessToken: response.access_token });
          setTokens(
            tokenPair.accessToken,
            tokenPair.refreshToken,
            tokenPair.role,
            tokenPair.studentVerificationStatus
          );
          toast.success("Đăng nhập Google thành công!");
          onLogin(mapBackendRole(tokenPair.role));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Không thể đăng nhập Google");
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    client.requestAccessToken({ prompt: "select_account" });
  }, [googleReady, onLogin]);

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />
      {/* Top nav */}
      <header className="sticky top-0 z-30 glass-m3 border-b border-outline-variant/40">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="UniBus Logo" width={48} height={48} priority className="h-10 w-auto shrink-0 object-contain" />
            <span className="text-lg font-bold tracking-tight">UniBus</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {["Tính năng", "Trường đối tác", "Bảng giá"].map((l) => (
              <button key={l} type="button" disabled className="h-9 px-4 rounded-full text-sm font-medium text-on-surface-variant/50 cursor-not-allowed">
                {l}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToAuth("login")}
              className="state-layer h-9 px-4 rounded-full text-sm font-bold text-[#14140f] hover:bg-[#14140f]/8"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => scrollToAuth("register")}
              className="state-layer h-9 px-4 rounded-full bg-[#14140f] text-[#beff50] text-sm font-bold hover:bg-[#14140f]/90"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <Hero onGetStarted={() => scrollToAuth("register")} />

      {/* Auth forms section */}
      <section
        ref={authRef}
        id="auth"
        className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 scroll-mt-20"
      >
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-start">
          {/* Left: benefits */}
          <div className="lg:sticky lg:top-24 min-w-0">
            <SplitText
              as="h2"
              text={screen === "register" ? "Tạo tài khoản" : screen === "forgot" ? "Quên mật khẩu" : "Đăng nhập"}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface"
              stagger={0.04}
            />
            <p className="mt-3 text-base sm:text-lg text-on-surface-variant text-pretty">
              {screen === "register"
                ? "Email trường giúp tự nhận diện trường đại học của bạn."
                : "Google hoặc email. Hệ thống tự biết bạn thuộc trường nào."}
            </p>
            <div className="mt-6 space-y-3">
              {[
                { icon: ShieldCheck, t: "Xác thực Google an toàn", bg: "#144fcc" },
                { icon: School, t: "Tự nhận diện trường qua email", bg: "#ff8c5f" },
                { icon: Sparkles, t: "Vé tháng trợ giá theo trường", bg: "#c8a0ff" },
              ].map((f, i) => (
                <motion.div
                  key={f.t}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 220, damping: 24 }}
                  className="flex items-center gap-3 min-w-0"
                >
                  <div
                    className="flex size-9 items-center justify-center rounded-xl shrink-0"
                    style={{ backgroundColor: f.bg, color: "#fff" }}
                  >
                    <f.icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-on-surface">{f.t}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: forms */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {screen === "login" && (
                <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
                  <LoginForm onLogin={onLogin} onSwitch={setScreen} onGoogleLogin={handleGoogleLogin} googleLoading={googleLoading} />
                </motion.div>
              )}
              {screen === "register" && (
                <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
                  <RegisterForm onBack={() => setScreen("login")} onGoogleLogin={handleGoogleLogin} googleLoading={googleLoading} />
                </motion.div>
              )}
              {screen === "forgot" && (
                <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
                  <ForgotForm onBack={() => setScreen("login")} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Features section — "Xem tính năng" scrolls here */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 scroll-mt-20">
        <SplitText
          as="h2"
          text="Tính năng nổi bật"
          className="text-3xl sm:text-5xl font-bold tracking-tight text-on-surface text-balance"
          stagger={0.05}
        />
        <p className="mt-3 text-base sm:text-lg text-on-surface-variant max-w-xl">
          Mọi thứ sinh viên cần để đi xe bus đến trường.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck, title: "Đăng nhập Google", desc: "Tự nhận diện trường qua domain email", bg: "#14140f", fg: "#beff50" },
            { icon: Route, title: "Tìm tuyến xe", desc: "Tra cứu trạm, tuyến và ETA từ backend", bg: "#c8a0ff", fg: "#14140f" },
            { icon: QrCode, title: "Vé QR điện tử", desc: "Vé tháng thật sau khi thanh toán", bg: "#beff50", fg: "#14140f" },
            { icon: Star, title: "Phản hồi chuyến đi", desc: "Gửi đánh giá trực tiếp cho điều phối", bg: "#ff8c5f", fg: "#14140f" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 240, damping: 24 }}
              className="rounded-2xl p-5 min-w-0"
              style={{ backgroundColor: f.bg, color: f.fg }}
            >
              <div className="flex size-11 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: f.fg, color: f.bg }}>
                <f.icon className="size-5" />
              </div>
              <p className="text-base font-bold">{f.title}</p>
              <p className="text-xs opacity-70 mt-1">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* University partners marquee */}
      <section className="py-10 sm:py-12 border-y border-outline-variant/40 bg-surface-container-low">
        <p className="text-center text-sm font-medium text-on-surface-variant mb-6 px-4">
          Đang phục vụ sinh viên các trường đại học tại Đà Nẵng
        </p>
        {partnerNames.length > 0 ? (
          <Marquee speed={32}>
            {partnerNames.map((name) => (
              <div key={name} className="flex items-center gap-3 px-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-outline-variant/40 bg-white text-sm font-black text-[#144fcc]">
                  {name.split(/\s+/).slice(-2).map((word) => word[0]).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">{name}</p>
                  <p className="text-xs text-on-surface-variant">Từ catalog backend</p>
                </div>
              </div>
            ))}
          </Marquee>
        ) : (
          <p className="text-center text-sm text-on-surface-variant">Danh sách trường sẽ hiển thị khi backend catalog phản hồi.</p>
        )}
      </section>

      <footer className="border-t border-outline-variant/40 py-10 px-6 text-center">
        <p className="text-sm text-on-surface-variant">© 2025 UniBus — Hệ thống Xe bus Sinh viên · Đà Nẵng</p>
      </footer>
    </div>
  );
}

/* =========================== HERO =========================== */
function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[80vh] sm:min-h-[88vh] flex flex-col justify-center overflow-hidden">
      {/* Background — bold lime block top-right, dark block bottom-left */}
      <div className="absolute top-0 right-0 size-[50vw] rounded-full bg-[#beff50] blur-[100px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 size-[40vw] rounded-full bg-[#144fcc] blur-[100px] opacity-20 pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 size-[30vw] rounded-full bg-[#ff8c5f] blur-[80px] opacity-25 pointer-events-none" />

      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 pt-16 sm:pt-20">
        <SplitText
          as="h1"
          text="Xe bus dành cho sinh viên."
          className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-on-surface leading-[1.0]"
          stagger={0.05}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 180, damping: 24 }}
          className="mt-6 sm:mt-8 max-w-xl text-lg sm:text-xl lg:text-2xl text-on-surface font-medium text-pretty"
        >
          Nền tảng di chuyển thông minh dành cho bạn.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, type: "spring", stiffness: 180, damping: 24 }}
          className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3"
        >
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={onGetStarted}
            className="state-layer inline-flex items-center gap-2 h-14 px-7 rounded-full bg-[#beff50] text-[#14140f] text-base font-bold"
          >
            Trải nghiệm ngay
            <ArrowRight className="size-5" />
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="state-layer inline-flex items-center h-14 px-7 rounded-full bg-transparent text-[#14140f] text-base font-bold border-2 border-[#14140f]"
          >
            Xem tính năng
          </motion.button>
        </motion.div>

        {/* Floating production status card */}
        <ClipReveal delay={1.1} className="mt-12 sm:mt-16 max-w-md">
          <div className="rounded-2xl bg-[#14140f] text-white p-5 elev-3 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 size-32 rounded-full bg-[#beff50]/20 blur-2xl pointer-events-none" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#beff50] text-[#14140f] shrink-0">
                  <Bus className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/60">Dữ liệu vận hành</p>
                  <p className="font-bold truncate">Hiển thị sau khi đăng nhập</p>
                </div>
              </div>
              <span className="size-2.5 rounded-full bg-[#beff50] animate-pulse shrink-0" />
            </div>
            <div className="relative mt-4 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <motion.div
                className="h-full bg-[#beff50] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "68%" }}
                transition={{ delay: 1.5, duration: 1.4, ease: [0.05, 0.7, 0.1, 1] }}
              />
            </div>
            <div className="relative mt-3 flex items-center justify-between text-sm gap-2">
              <span className="text-white/70 truncate">Tuyến, ETA, vé QR, phản hồi</span>
              <span className="font-bold text-[#beff50] whitespace-nowrap">API thật</span>
            </div>
          </div>
        </ClipReveal>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-on-surface-variant pointer-events-none"
      >
        <span className="text-[11px] sm:text-xs">Cuộn xuống</span>
        <ChevronDown className="size-4 animate-bounce" />
      </motion.div>
    </section>
  );
}

/* =========================== LOGIN FORM =========================== */
function LoginForm({
  onLogin,
  onSwitch,
  onGoogleLogin,
  googleLoading,
}: {
  onLogin: (r: Role) => void;
  onSwitch: (s: AuthScreen) => void;
  onGoogleLogin: () => void;
  googleLoading: boolean;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async () => {
    if (!email || !password) {
      toast.error("Vui lòng nhập email và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const tokenPair = await authApi.login(email, password);
      setTokens(
        tokenPair.accessToken,
        tokenPair.refreshToken,
        tokenPair.role,
        tokenPair.studentVerificationStatus
      );
      toast.success("Đăng nhập thành công!");
      onLogin(mapBackendRole(tokenPair.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExpressiveCard variant="elevated" className="p-6 sm:p-8">
      <h3 className="text-2xl font-bold tracking-tight">Đăng nhập</h3>
      <p className="text-sm text-on-surface-variant mt-1">
        Email trường để tự nhận diện.
      </p>

      {/* Google login — primary CTA */}
      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="w-full mt-6 inline-flex items-center justify-center gap-3 h-12 rounded-full bg-white text-[#14140f] text-base font-bold border-2 border-[#14140f] elev-1"
        onClick={onGoogleLogin}
        disabled={googleLoading}
      >
        <GoogleIcon />
        {googleLoading ? "Đang mở Google..." : "Tiếp tục với Google"}
      </motion.button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-xs text-on-surface-variant">hoặc</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant pointer-events-none" />
            <Input id="email" type="email" placeholder="ten@duytan.edu.vn" className="pl-11 h-12 rounded-xl bg-surface-container-lowest border-outline-variant" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password" className="shrink-0">Mật khẩu</Label>
            <button type="button" onClick={() => onSwitch("forgot")} className="text-xs text-[#144fcc] font-bold hover:underline whitespace-nowrap">
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant pointer-events-none" />
            <Input id="password" type={showPwd ? "text" : "password"} placeholder="••••••••" className="pl-11 pr-11 h-12 rounded-xl bg-surface-container-lowest border-outline-variant" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitLogin(); }} />
            <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg">
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember" defaultChecked />
          <Label htmlFor="remember" className="text-sm text-on-surface-variant font-normal cursor-pointer">
            Ghi nhớ đăng nhập
          </Label>
        </div>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="w-full h-12 rounded-full bg-[#beff50] text-[#14140f] text-base font-bold elev-2 flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={loading}
          onClick={submitLogin}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          <ArrowRight className="size-5" />
        </motion.button>
      </div>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        Chưa có tài khoản?{" "}
        <button onClick={() => onSwitch("register")} className="font-bold text-[#144fcc] hover:underline">
          Đăng ký ngay
        </button>
      </p>
    </ExpressiveCard>
  );
}

/* =========================== REGISTER FORM =========================== */
function RegisterForm({
  onBack,
  onGoogleLogin,
  googleLoading,
}: {
  onBack: () => void;
  onGoogleLogin: () => void;
  googleLoading: boolean;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [registering, setRegistering] = useState(false);

  const requestOtp = async () => {
    if (!email) {
      toast.error("Vui lòng nhập email trường trước");
      return;
    }
    setSendingOtp(true);
    try {
      await authApi.registerOtp(email);
      toast.success("Đã gửi mã OTP", { description: "Kiểm tra email trường của bạn." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const submitRegister = async () => {
    if (!lastName || !firstName || !email || !password || !otp) {
      toast.error("Vui lòng nhập đủ họ tên, email, mật khẩu và OTP");
      return;
    }
    setRegistering(true);
    try {
      await authApi.register({
        name: `${lastName.trim()} ${firstName.trim()}`.trim(),
        email,
        password,
        otp,
      });
      toast.success("Đăng ký thành công!", { description: "Bạn có thể đăng nhập bằng tài khoản vừa tạo." });
      onBack();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đăng ký");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <ExpressiveCard variant="elevated" className="p-6 sm:p-8">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface">
        <ArrowLeft className="size-4" /> Quay lại đăng nhập
      </button>
      <h3 className="text-2xl font-bold tracking-tight">Tạo tài khoản</h3>
      <p className="text-sm text-on-surface-variant mt-1">Email trường giúp tự nhận diện trường đại học.</p>

      {/* Google signup */}
      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="w-full mt-6 inline-flex items-center justify-center gap-3 h-12 rounded-full bg-white text-[#14140f] text-base font-bold border-2 border-[#14140f] elev-1"
        onClick={onGoogleLogin}
        disabled={googleLoading}
      >
        <GoogleIcon />
        {googleLoading ? "Đang mở Google..." : "Đăng ký với Google"}
      </motion.button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-xs text-on-surface-variant">hoặc</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="lastname">Họ</Label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant pointer-events-none" />
              <Input id="lastname" placeholder="Nguyễn" className="pl-11 h-12 rounded-xl bg-surface-container-lowest border-outline-variant" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstname">Tên</Label>
            <Input id="firstname" placeholder="Minh Anh" className="h-12 rounded-xl bg-surface-container-lowest border-outline-variant" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="remail">Email trường</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant pointer-events-none" />
            <Input id="remail" type="email" placeholder="ten@duytan.edu.vn" className="pl-11 h-12 rounded-xl bg-surface-container-lowest border-outline-variant" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <p className="text-xs text-on-surface-variant">Dùng email trường để tự động nhận diện trường đại học.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rotp">Mã OTP</Label>
          <div className="flex gap-2">
            <Input id="rotp" inputMode="numeric" maxLength={6} placeholder="6 số" className="h-12 rounded-xl bg-surface-container-lowest border-outline-variant" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <button
              type="button"
              onClick={requestOtp}
              disabled={sendingOtp}
              className="state-layer h-12 shrink-0 rounded-full border border-[#14140f]/20 bg-white px-4 text-sm font-bold text-[#14140f] disabled:opacity-60"
            >
              {sendingOtp ? "Đang gửi..." : "Gửi OTP"}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rphone">Số điện thoại</Label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant pointer-events-none" />
            <Input id="rphone" type="tel" placeholder="09xx xxx xxx" className="pl-11 h-12 rounded-xl bg-surface-container-lowest border-outline-variant" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rpassword">Mật khẩu</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant pointer-events-none" />
            <Input id="rpassword" type={showPwd ? "text" : "password"} placeholder="Ít nhất 8 ký tự" className="pl-11 pr-11 h-12 rounded-xl bg-surface-container-lowest border-outline-variant" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg">
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox id="terms" className="mt-0.5" defaultChecked />
          <Label htmlFor="terms" className="text-sm text-on-surface-variant font-normal cursor-pointer">
            Tôi đồng ý với <span className="text-[#144fcc] font-bold hover:underline">Điều khoản</span> và{" "}
            <span className="text-[#144fcc] font-bold hover:underline">Chính sách bảo mật</span>.
          </Label>
        </div>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="w-full h-12 rounded-full bg-[#beff50] text-[#14140f] text-base font-bold elev-2 flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={registering}
          onClick={submitRegister}
        >
          {registering ? "Đang tạo..." : "Tạo tài khoản"}
          <Check className="size-5" />
        </motion.button>
      </div>
    </ExpressiveCard>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const requestReset = async () => {
    if (!email) {
      toast.error("Vui lòng nhập email đăng ký");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPasswordOtp(email);
      toast.success("Nếu email tồn tại, mã OTP đặt lại đã được gửi.");
      onBack();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi OTP đặt lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExpressiveCard variant="elevated" className="p-6 sm:p-8">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface">
        <ArrowLeft className="size-4" /> Quay lại đăng nhập
      </button>
      <h3 className="text-2xl font-bold tracking-tight">Quên mật khẩu</h3>
      <p className="text-sm text-on-surface-variant mt-1">Nhập email — hệ thống gửi mã OTP đặt lại mật khẩu.</p>
      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="femail">Email đăng ký</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant pointer-events-none" />
            <Input id="femail" type="email" placeholder="ten@duytan.edu.vn" className="pl-11 h-12 rounded-xl bg-surface-container-lowest border-outline-variant" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="w-full h-12 rounded-full bg-[#beff50] text-[#14140f] text-base font-bold elev-2 flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={loading}
          onClick={requestReset}
        >
          {loading ? "Đang gửi..." : "Gửi OTP đặt lại"}
          <ArrowRight className="size-5" />
        </motion.button>
      </div>
    </ExpressiveCard>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
