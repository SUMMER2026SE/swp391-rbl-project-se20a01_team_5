"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { QrCode, Search, Bell, LogOut, Menu, ChevronDown, Sparkles, UserCircle, School, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { NAV_CONFIG, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_COLORS, ROLE_AVATARS } from "./nav-config";
import type { NavItem } from "./nav-config";
import type { Role } from "@/lib/types";
import { users } from "@/lib/mock-data";
import { toast } from "sonner";
import { PageTransition } from "@/components/m3/motion";

export function AppShell({
  role,
  activeId,
  onNavigate,
  onSwitchRole,
  onLogout,
  children,
}: {
  role: Role;
  activeId: string;
  onNavigate: (id: string) => void;
  onSwitchRole: (r: Role) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = NAV_CONFIG[role];
  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    nav.forEach((item) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    });
    return Array.from(map.entries());
  }, [nav]);

  const currentNav = nav.find((n) => n.id === activeId);
  const user = users.find((u) => u.role === role) ?? users[0];

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

  // On mobile, show a back button when the user is NOT on the first nav item
  const isFirstNav = nav.length > 0 && activeId === nav[0].id;
  const handleMobileBack = () => {
    if (nav.length > 0) onNavigate(nav[0].id);
  };

  // Sticky topbar morph on scroll
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 20);
  });

  const SidebarContent = (
    <div className="flex h-full flex-col bg-surface-container-low">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#beff50] text-[#14140f]">
            <QrCode className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-tight text-on-surface">UniBus</p>
            <p className="text-[11px] text-on-surface-variant truncate">{ROLE_LABELS[role]}</p>
          </div>
        </div>
      </div>

      {/* Nav — sticky, rounded, smooth pill indicator */}
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
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onNavigate(item.id); setMobileOpen(false); setTimeout(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, 50); }}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors min-h-11 min-w-0",
                        active
                          ? "text-[#beff50]"
                          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId={`nav-pill-${role}`}
                          className="absolute inset-0 rounded-2xl bg-[#14140f]"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <item.icon className={cn("relative size-5 shrink-0 transition-colors", active ? "text-[#beff50]" : "text-on-surface-variant group-hover:text-on-surface")} />
                      <span className="relative flex-1 text-left truncate min-w-0">{item.label}</span>
                      {item.badge && (
                        <span className={cn("relative inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold shrink-0",
                          active ? "bg-[#beff50] text-[#14140f]" : "bg-[#dc2626] text-white")}>
                          {item.badge}
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

      {/* Role switcher */}
      <div className="p-3 border-t border-outline-variant/40">
        <RoleSwitcherCard current={role} onSwitch={onSwitchRole} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-background flex flex-col overflow-x-hidden" data-role-theme={role}>
      {/* Desktop sidebar — fixed */}
      <aside className="hidden lg:flex fixed top-0 left-0 w-72 shrink-0 flex-col border-r border-outline-variant/40 h-screen z-40 bg-surface-container-low">
        {SidebarContent}
      </aside>

      {/* Main content — offset for fixed sidebar */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen lg:ml-72">
          {/* M3 Top App Bar — framer-motion morph on scroll */}
          <motion.header
            animate={{
              height: scrolled ? 52 : 64,
              marginLeft: scrolled ? 8 : 0,
              marginRight: scrolled ? 8 : 0,
              marginTop: scrolled ? 8 : 0,
              borderRadius: scrolled ? 20 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 border border-outline-variant/40 glass-m3 px-3 sm:px-6 overflow-hidden"
          >
            {/* Mobile: back button (when not on first nav item) OR hamburger (when on first item) */}
            {!isFirstNav ? (
              <button
                className="lg:hidden state-layer size-10 rounded-full flex items-center justify-center text-on-surface shrink-0"
                onClick={handleMobileBack}
                aria-label="Quay lại"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <button
                className="lg:hidden state-layer size-10 rounded-full flex items-center justify-center text-on-surface shrink-0"
                onClick={() => setMobileOpen(true)}
                aria-label="Mở menu"
              >
                <Menu className="size-5" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 text-sm min-w-0">
              <span className="font-medium text-on-surface-variant">{ROLE_LABELS[role]}</span>
              <span className="text-on-surface-variant/40">/</span>
              <span className="font-semibold text-on-surface truncate">{currentNav?.label}</span>
            </div>

            {/* Mobile: show current page title */}
            <div className="flex sm:hidden flex-1 min-w-0">
              <span className="font-semibold text-on-surface truncate text-base">{currentNav?.label}</span>
            </div>

            <div className="flex-1 hidden sm:block" />

            <div className="hidden md:flex relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant pointer-events-none" />
              <Input placeholder="Tìm kiếm..." className="h-9 pl-9 rounded-full bg-surface-container-high border-transparent focus-visible:bg-surface-container-lowest" />
            </div>

            <button
              className="state-layer relative size-10 rounded-full flex items-center justify-center text-on-surface shrink-0"
              onClick={() => onNavigate(notificationsNavId)}
              aria-label="Thông báo"
            >
              <Bell className="size-5" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-error ring-2 ring-surface" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="state-layer flex items-center gap-2 rounded-full pl-1 pr-1 sm:pr-3 py-1 shrink-0">
                  <Avatar className="size-9">
                    <AvatarFallback className={cn("text-white text-xs font-bold", ROLE_COLORS[role])}>
                      {ROLE_AVATARS[role]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start leading-tight min-w-0 max-w-32">
                    <span className="text-sm font-medium text-on-surface truncate max-w-full">{user.name}</span>
                    <span className="text-[11px] text-on-surface-variant">{ROLE_LABELS[role]}</span>
                  </div>
                  <ChevronDown className="hidden sm:block size-4 text-on-surface-variant" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-xl">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate">{user.name}</span>
                  <span className="text-xs font-normal text-on-surface-variant truncate">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate(profileNavId)} className="rounded-lg">
                  <UserCircle className="size-4 mr-2" /> Hồ sơ cá nhân
                </DropdownMenuItem>
                {role === "student" && (
                  <DropdownMenuItem onClick={() => onNavigate("stu-university")} className="rounded-lg">
                    <School className="size-4 mr-2" /> Trường của tôi
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => toast.info("Cài đặt tài khoản (demo)")} className="rounded-lg">
                  <Sparkles className="size-4 mr-2" /> Cài đặt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-error focus:text-error rounded-lg" onClick={onLogout}>
                  <LogOut className="size-4 mr-2" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.header>

          {/* Main content */}
          <main className="flex-1 p-3 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <PageTransition key={activeId} id={activeId} className="mx-auto max-w-7xl">
                {children}
              </PageTransition>
            </AnimatePresence>
          </main>

          <footer className="hidden lg:block mt-auto border-t border-outline-variant/40 bg-surface-container-low px-6 py-4 text-center text-xs text-on-surface-variant">
            <p>UniBus — Hệ thống Xe bus Sinh viên liên kết trường ĐH · Đà Nẵng · Material 3 Expressive</p>
          </footer>
        </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-xs p-0 border-outline-variant">
          {SidebarContent}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RoleSwitcherCard({
  current,
  onSwitch,
}: {
  current: Role;
  onSwitch: (r: Role) => void;
}) {
  const [open, setOpen] = useState(false);
  const roles: Role[] = ["student", "driver", "assistant", "coordinator", "admin", "university_admin"];
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface-container p-2.5">
      <button onClick={() => setOpen((o) => !o)} className="state-layer flex w-full items-center gap-2.5 rounded-xl p-2">
        <div className={cn("flex size-9 items-center justify-center rounded-xl text-white text-xs font-bold", ROLE_COLORS[current])}>
          {ROLE_AVATARS[current]}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{ROLE_LABELS[current]}</p>
          <p className="text-[10px] text-on-surface-variant truncate">{ROLE_DESCRIPTIONS[current]}</p>
        </div>
        <ChevronDown className={cn("size-4 text-on-surface-variant transition-transform shrink-0", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 space-y-0.5">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => { onSwitch(r); setOpen(false); }}
                  className={cn(
                    "state-layer flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs transition-colors min-h-9",
                    r === current ? "bg-secondary-container text-on-secondary-container font-semibold" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <div className={cn("size-6 rounded-lg text-white text-[10px] font-bold flex items-center justify-center shrink-0", ROLE_COLORS[r])}>
                    {ROLE_AVATARS[r]}
                  </div>
                  <span className="flex-1 text-left truncate">{ROLE_LABELS[r]}</span>
                  <Sparkles className="size-3 text-on-surface-variant shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
