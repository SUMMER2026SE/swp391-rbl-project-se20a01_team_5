"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowLeft, BadgeCheck, Bell, ChevronDown, Clock3, LogOut, Menu, PanelLeftClose, PanelLeftOpen, QrCode, School, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { NAV_CONFIG, ROLE_AVATARS, ROLE_COLORS, ROLE_LABELS, type NavItem } from "./nav-config";
import { PageTransition } from "@/components/m3/motion";
import { notificationApi, type UserProfile } from "@/lib/api/client";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

function initials(profile?: UserProfile | null, role?: Role) {
  const name = profile?.fullName || profile?.email || "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return role ? ROLE_AVATARS[role] : "UB";
}

export function AppShell({
  role,
  activeId,
  profile,
  onNavigate,
  onLogout,
  children,
}: {
  role: Role;
  activeId: string;
  profile: UserProfile | null;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPreviewOpen, setSidebarPreviewOpen] = useState(false);
  const nav = NAV_CONFIG[role] ?? NAV_CONFIG.student;
  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    nav.forEach((item) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    });
    return Array.from(map.entries());
  }, [nav]);

  const notificationsNavId =
    role === "student" ? "stu-notifications"
    : role === "driver" ? "drv-notifications"
    : role === "assistant" ? "ast-notifications"
    : role === "coordinator" ? "crd-notifications"
    : role === "admin" ? "adm-notifications"
    : "uniadm-notifications";
  const profileNavId =
    role === "student" ? "stu-profile"
    : role === "driver" ? "drv-profile"
    : role === "assistant" ? "ast-profile"
    : role === "coordinator" ? "crd-profile"
    : role === "admin" ? "adm-profile"
    : "uniadm-profile";

  const isFirstNav = nav.length > 0 && activeId === nav[0].id;
  const verificationStatus = profile?.studentVerificationStatus || "NOT_SUBMITTED";
  const verificationMenu = verificationStatus === "VERIFIED"
    ? { label: "Trường của tôi", icon: School }
    : verificationStatus === "PENDING_REVIEW"
      ? { label: "Hồ sơ đang chờ duyệt", icon: Clock3 }
      : { label: "Xác minh sinh viên", icon: BadgeCheck };
  const VerificationMenuIcon = verificationMenu.icon;
  const currentNav = nav.find((n) => n.id === activeId)
    ?? (role === "student" && activeId === "stu-university"
      ? { id: "stu-university", label: verificationMenu.label, icon: VerificationMenuIcon, group: "Tổng quan" }
      : nav[0]);
  const isStudentFindPage = role === "student" && activeId === "stu-find";
  const sidebarVisible = !sidebarCollapsed || sidebarPreviewOpen;
  const showSidebarHoverEdge = isStudentFindPage && sidebarCollapsed && !sidebarPreviewOpen;
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 20));
  const headerScrolled = !isStudentFindPage && scrolled;

  useEffect(() => {
    let mounted = true;
    notificationApi.unreadCount()
      .then((count) => {
        if (mounted) setUnread(Number(count) || 0);
      })
      .catch(() => {
        if (mounted) setUnread(null);
      });
    return () => {
      mounted = false;
    };
  }, [activeId]);

  useEffect(() => {
    if (isStudentFindPage) {
      setSidebarCollapsed(true);
    } else {
      setSidebarPreviewOpen(false);
    }
  }, [isStudentFindPage]);

  // Listen for real-time notification read events from NotificationsScreen
  useEffect(() => {
    const handleNotificationRead = () => {
      setUnread((prev) => (prev == null ? null : Math.max(0, prev - 1)));
    };
    window.addEventListener("notification-read", handleNotificationRead as EventListener);
    return () => window.removeEventListener("notification-read", handleNotificationRead as EventListener);
  }, []);

  // Debounce navigation to prevent lag when user clicks rapidly.
  // Each new click cancels the previous pending navigation.
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goTo = (id: string) => {
    setMobileOpen(false);
    setSidebarPreviewOpen(false);
    if (role === "student" && id === "stu-find") {
      setSidebarCollapsed(true);
    }
    // Cancel any pending navigation from previous click
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
    }
    // Defer heavy rendering to unblock the sidebar's closing animation
    navTimerRef.current = setTimeout(() => {
      onNavigate(id);
      window.scrollTo({ top: 0, behavior: "instant" });
      navTimerRef.current = null;
    }, 120);
  };

  // Cleanup pending navigation on unmount
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (previewOpenTimerRef.current) clearTimeout(previewOpenTimerRef.current);
      if (previewCloseTimerRef.current) clearTimeout(previewCloseTimerRef.current);
    };
  }, []);

  const SidebarContent = (
    <div className="flex h-full flex-col bg-surface-container-low">
      <div className="px-5 pt-6 pb-4">
        <button
          type="button"
          onClick={() => goTo(nav[0].id)}
          className="flex items-center gap-3 text-left"
        >
          <Image src="/logo.png" alt="UniBus Logo" width={64} height={64} loading="eager" className="h-12 w-auto shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-tight text-on-surface">UniBus</p>
            <p className="truncate text-[11px] text-on-surface-variant">{ROLE_LABELS[role]}</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-soft">
        <div className="space-y-5">
          {groups.map(([group, items]) => (
            <div key={group}>
              <p className="px-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = item.id === activeId;
                  const badge = item.id === notificationsNavId && unread ? String(unread) : item.badge;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goTo(item.id)}
                      className={cn(
                        "group relative flex min-h-11 w-full min-w-0 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors",
                        active ? "text-[#beff50]" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId={`nav-pill-${role}`}
                          className="absolute inset-0 rounded-2xl bg-[#14140f]"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <item.icon className={cn("relative size-5 shrink-0", active ? "text-[#beff50]" : "text-on-surface-variant group-hover:text-on-surface")} />
                      <span className="relative min-w-0 flex-1 truncate text-left">{item.label}</span>
                      {badge && (
                        <span className={cn("relative inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                          active ? "bg-[#beff50] text-[#14140f]" : "bg-[#dc2626] text-white")}>
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background" data-role-theme={role}>
      <motion.aside
        animate={{ width: sidebarVisible ? 288 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        onMouseEnter={() => {
          if (previewCloseTimerRef.current) clearTimeout(previewCloseTimerRef.current);
        }}
        onMouseLeave={() => {
          if (isStudentFindPage && sidebarCollapsed) {
            if (previewOpenTimerRef.current) clearTimeout(previewOpenTimerRef.current);
            previewCloseTimerRef.current = setTimeout(() => setSidebarPreviewOpen(false), 140);
          }
        }}
        className={cn(
          "fixed left-0 z-[2300] hidden shrink-0 flex-col overflow-hidden border-r border-outline-variant/40 bg-surface-container-low lg:flex",
          isStudentFindPage && sidebarCollapsed ? "top-16 h-[calc(100dvh-4rem)] rounded-tr-[24px]" : "top-0 h-screen",
          sidebarVisible ? "pointer-events-auto" : "pointer-events-none",
        )}
        style={{ width: 288 }}
      >
        {SidebarContent}
      </motion.aside>

      {showSidebarHoverEdge ? (
        <button
          type="button"
          aria-label="Mở nhanh menu"
          onMouseEnter={() => {
            if (previewCloseTimerRef.current) clearTimeout(previewCloseTimerRef.current);
            if (previewOpenTimerRef.current) clearTimeout(previewOpenTimerRef.current);
            previewOpenTimerRef.current = setTimeout(() => setSidebarPreviewOpen(true), 110);
          }}
          onMouseLeave={() => {
            if (previewOpenTimerRef.current) clearTimeout(previewOpenTimerRef.current);
          }}
          onFocus={() => setSidebarPreviewOpen(true)}
          onClick={() => setSidebarPreviewOpen(true)}
          className="fixed left-0 top-20 z-[2290] hidden h-[calc(100dvh-6rem)] w-3 rounded-r-full bg-on-surface/10 transition-colors hover:bg-on-surface/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:block"
        >
          <span className="absolute left-1 top-1/2 h-16 w-1 -translate-y-1/2 rounded-full bg-[#beff50]" />
          <span className="sr-only">Mở nhanh menu</span>
        </button>
      ) : null}

      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300",
          sidebarCollapsed ? "lg:ml-0" : "lg:ml-72",
        )}
      >
        <motion.header
          animate={{
            height: headerScrolled ? 52 : 64,
            marginLeft: headerScrolled ? 8 : 0,
            marginRight: headerScrolled ? 8 : 0,
            marginTop: headerScrolled ? 8 : 0,
            borderRadius: headerScrolled ? 20 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="glass-m3 sticky top-0 z-[2400] flex items-center gap-2 border border-outline-variant/40 px-3 sm:gap-3 sm:px-6"
        >
          {!isFirstNav ? (
            <button
              className="state-layer flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface lg:hidden"
              onClick={() => goTo(nav[0].id)}
              aria-label="Quay lại"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <button
              className="state-layer flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="size-5" />
            </button>
          )}

          {/* Toggle sidebar button (desktop only) */}
          <button
            className="state-layer flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface hidden lg:flex"
            onClick={() => {
              setSidebarPreviewOpen(false);
              setSidebarCollapsed((v) => !v);
            }}
            aria-label={sidebarCollapsed ? "Mở sidebar" : "Đóng sidebar"}
            title={sidebarCollapsed ? "Mở sidebar" : "Đóng sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>

          <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
            <span className="font-medium text-on-surface-variant">{ROLE_LABELS[role]}</span>
            <span className="text-on-surface-variant/40">/</span>
            <span className="truncate font-semibold text-on-surface">{currentNav?.label}</span>
          </div>

          <div className="flex min-w-0 flex-1 sm:hidden">
            <span className="truncate text-base font-semibold text-on-surface">{currentNav?.label}</span>
          </div>

          <div className="flex-1" />

          <button
            className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#111111] bg-white text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.06)] transition-colors hover:bg-[#FAF8F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#beff50] focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            onClick={() => goTo(notificationsNavId)}
            aria-label={unread && unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
            title={unread && unread > 0 ? `${unread} thông báo chưa đọc` : "Thông báo"}
          >
            <Bell className="size-5 stroke-[2.4]" />
            {unread != null && unread > 0 ? (
              <span className="absolute right-2 top-2 size-2.5 rounded-full bg-[#E21B3C] ring-2 ring-white" aria-hidden="true" />
            ) : null}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="state-layer flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-1 sm:pr-3">
                <Avatar className="size-9">
                  <AvatarImage src={profile?.avatarUrl} alt={profile?.fullName || "Avatar"} />
                  <AvatarFallback className={cn("text-xs font-bold text-white", ROLE_COLORS[role])}>
                    {initials(profile, role)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden max-w-40 min-w-0 flex-col items-start leading-tight sm:flex">
                  <span className="max-w-full truncate text-sm font-medium text-on-surface">{profile?.fullName || "Tài khoản UniBus"}</span>
                  <span className="max-w-full truncate text-[11px] text-on-surface-variant">{profile?.email || ROLE_LABELS[role]}</span>
                </div>
                <ChevronDown className="hidden size-4 text-on-surface-variant sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2">
              <div className="flex items-center gap-3 px-2 py-3 mb-1 rounded-xl bg-surface-container-low">
                <Avatar className="size-11 shrink-0">
                  <AvatarImage src={profile?.avatarUrl} alt={profile?.fullName || "Avatar"} />
                  <AvatarFallback className={cn("text-sm font-bold text-white", ROLE_COLORS[role])}>
                    {initials(profile, role)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-on-surface">{profile?.fullName || "Tài khoản UniBus"}</p>
                  <p className="truncate text-xs text-on-surface-variant">{profile?.email || ROLE_LABELS[role]}</p>
                  <span className="inline-flex mt-1 items-center gap-1 h-5 px-2 rounded-full bg-[#beff50] text-[#14140f] text-[10px] font-bold">
                    <School className="size-2.5" />
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              </div>
              <DropdownMenuItem onClick={() => goTo(profileNavId)}>
                <UserCircle className="size-4" /> Hồ sơ cá nhân
              </DropdownMenuItem>
              {role === "student" && (
                <DropdownMenuItem onClick={() => goTo("stu-university")}>
                  <VerificationMenuIcon className="size-4" /> {verificationMenu.label}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onLogout}>
                <LogOut className="size-4" /> Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <PageTransition
              key={activeId}
              id={activeId}
              className={cn("mx-auto", activeId === "stu-find" ? "max-w-none" : "max-w-7xl")}
            >
              {children}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-xs border-outline-variant p-0">
          {SidebarContent}
        </SheetContent>
      </Sheet>
    </div>
  );
}
