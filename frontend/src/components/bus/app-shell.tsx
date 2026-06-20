"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowLeft, Bell, ChevronDown, LogOut, Menu, QrCode, Search, School, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
  const nav = NAV_CONFIG[role] ?? NAV_CONFIG.student;
  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    nav.forEach((item) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    });
    return Array.from(map.entries());
  }, [nav]);

  const currentNav = nav.find((n) => n.id === activeId) ?? nav[0];
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
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 20));

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

  const goTo = (id: string) => {
    setMobileOpen(false);
    // Defer heavy rendering to unblock the sidebar's closing animation (300ms)
    setTimeout(() => {
      onNavigate(id);
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 150);
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-surface-container-low">
      <div className="px-5 pt-6 pb-4">
        <button
          type="button"
          onClick={() => goTo(nav[0].id)}
          className="flex items-center gap-3 text-left"
        >
          <img src="/logo.png" alt="UniBus Logo" className="h-12 w-auto object-contain shrink-0" />
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
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 shrink-0 flex-col border-r border-outline-variant/40 bg-surface-container-low lg:flex">
        {SidebarContent}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-72">
        <motion.header
          animate={{
            height: scrolled ? 52 : 64,
            marginLeft: scrolled ? 8 : 0,
            marginRight: scrolled ? 8 : 0,
            marginTop: scrolled ? 8 : 0,
            borderRadius: scrolled ? 20 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="glass-m3 sticky top-0 z-30 flex items-center gap-2 overflow-hidden border border-outline-variant/40 px-3 sm:gap-3 sm:px-6"
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

          <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
            <span className="font-medium text-on-surface-variant">{ROLE_LABELS[role]}</span>
            <span className="text-on-surface-variant/40">/</span>
            <span className="truncate font-semibold text-on-surface">{currentNav?.label}</span>
          </div>

          <div className="flex min-w-0 flex-1 sm:hidden">
            <span className="truncate text-base font-semibold text-on-surface">{currentNav?.label}</span>
          </div>

          <div className="hidden flex-1 sm:block" />

          <div className="relative hidden w-56 md:flex">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
            <Input placeholder="Tìm trong màn hiện tại..." className="h-9 rounded-full border-transparent bg-surface-container-high pl-9 focus-visible:bg-surface-container-lowest" />
          </div>

          <button
            className="state-layer relative flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface"
            onClick={() => goTo(notificationsNavId)}
            aria-label="Thông báo"
          >
            <Bell className="size-5" />
            {!!unread && <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-white ring-2 ring-surface">{unread}</span>}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="state-layer flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-1 sm:pr-3">
                <Avatar className="size-9">
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
            <DropdownMenuContent align="end" className="w-64 rounded-xl">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="truncate">{profile?.fullName || "Tài khoản UniBus"}</span>
                <span className="truncate text-xs font-normal text-on-surface-variant">{profile?.email || ROLE_LABELS[role]}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => goTo(profileNavId)} className="rounded-lg">
                <UserCircle className="mr-2 size-4" /> Hồ sơ cá nhân
              </DropdownMenuItem>
              {role === "student" && (
                <DropdownMenuItem onClick={() => goTo("stu-university")} className="rounded-lg">
                  <School className="mr-2 size-4" /> Trường của tôi
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg text-error focus:text-error" onClick={onLogout}>
                <LogOut className="mr-2 size-4" /> Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <PageTransition key={activeId} id={activeId} className="mx-auto max-w-7xl">
              {children}
            </PageTransition>
          </AnimatePresence>
        </main>

        <footer className="mt-auto hidden border-t border-outline-variant/40 bg-surface-container-low px-6 py-4 text-center text-xs text-on-surface-variant lg:block">
          <p>UniBus - Hệ thống xe bus sinh viên liên kết trường đại học tại Đà Nẵng</p>
        </footer>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-xs border-outline-variant p-0">
          {SidebarContent}
        </SheetContent>
      </Sheet>
    </div>
  );
}
