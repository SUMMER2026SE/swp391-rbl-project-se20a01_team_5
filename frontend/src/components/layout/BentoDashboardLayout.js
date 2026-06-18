"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Bell, CheckCheck, LogOut, Menu, Search, X } from 'lucide-react';
import { MotionPage } from '@/components/motion/MotionPage';
import { MaterialCard, StatusChip, TextButton, TonalButton, cn } from '@/components/ui/material';
import LogoutConfirmModal from '@/components/modals/LogoutConfirmModal';
import { authApi, clearAuthSession, getAuthSession, notificationApi, toApiAssetUrl, userApi } from '@/services/api';

export default function BentoDashboardLayout({ children, menuItems, roleName, profileHref }) {
  const [isRailExpanded, setIsRailExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [displayName, setDisplayName] = useState('Người dùng');
  const pathname = usePathname();
  const router = useRouter();

  const activeItem = useMemo(() => {
    const matches = menuItems.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return matches.sort((a, b) => b.href.length - a.href.length)[0] || menuItems[0];
  }, [menuItems, pathname]);

  useEffect(() => {
    const session = getAuthSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    let cancelled = false;
    userApi.getProfile()
      .then((profile) => {
        if (cancelled) return;
        const name = profile.fullName || profile.email || 'Người dùng';
        setDisplayName(name);
        setAvatarUrl(toApiAssetUrl(profile.avatarUrl) || null);
      })
      .catch(() => {
        // Header stays usable even if profile fetch fails.
      });

    notificationApi.getUnreadCount()
      .then((payload) => {
        if (!cancelled) setUnreadCount(payload?.count || 0);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });

    const handleAvatarUpdate = (event) => {
      setAvatarUrl(toApiAssetUrl(event.detail) || null);
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [router]);

  const handleLogoutConfirm = async () => {
    try {
      await authApi.logout();
    } catch {
      // The local session still needs to be cleared if the token is already invalid.
    }

    clearAuthSession();
    setShowLogoutModal(false);
    router.push('/login');
  };

  const loadNotifications = () => {
    setIsLoadingNotifications(true);
    notificationApi.listMine({ page: 0, size: 8 })
      .then((items) => {
        setNotifications(items || []);
        setUnreadCount((items || []).filter((item) => !item.read).length);
      })
      .catch(() => setNotifications([]))
      .finally(() => setIsLoadingNotifications(false));
  };

  const toggleNotifications = () => {
    setShowNotifications((current) => {
      const next = !current;
      if (next) loadNotifications();
      return next;
    });
  };

  const markNotificationRead = async (notification) => {
    if (!notification?.notificationId || notification.read) return;
    setNotifications((items) => items.map((item) => (
      item.notificationId === notification.notificationId ? { ...item, read: true } : item
    )));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await notificationApi.markRead(notification.notificationId);
    } catch {
      loadNotifications();
    }
  };

  return (
    <LayoutGroup id={`m3-shell-${roleName}`}>
      <div className="m3-app-bg min-h-screen font-sans text-[var(--md-sys-color-on-surface)] md:p-4 lg:p-6">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-4 md:min-h-[calc(100vh-2rem)] lg:gap-6">
          <aside className={cn('hidden shrink-0 transition-[width] duration-300 md:block', isRailExpanded ? 'w-72' : 'w-24')}>
            <MaterialCard className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[2rem] p-3 lg:top-6 lg:h-[calc(100vh-3rem)]">
              <RailHeader expanded={isRailExpanded} onToggle={() => setIsRailExpanded((current) => !current)} logoHref={menuItems[0]?.href || '/'} />
              <NavigationRail
                items={menuItems}
                pathname={pathname}
                expanded={isRailExpanded}
                onLogout={() => setShowLogoutModal(true)}
              />
            </MaterialCard>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col px-3 pb-28 pt-3 md:px-0 md:pb-0 md:pt-0">
            <TopAppBar
              activeTitle={activeItem?.name || roleName}
              roleName={roleName}
              displayName={displayName}
              avatarUrl={avatarUrl}
              profileHref={profileHref}
              pathname={pathname}
              unreadCount={unreadCount}
              showNotifications={showNotifications}
              notifications={notifications}
              isLoadingNotifications={isLoadingNotifications}
              onToggleNotifications={toggleNotifications}
              onCloseNotifications={() => setShowNotifications(false)}
              onMarkRead={markNotificationRead}
              onOpenMenu={() => setIsMobileMenuOpen(true)}
            />

            <MotionPage key={pathname} className="min-h-0 flex-1 overflow-hidden">
              {children}
            </MotionPage>
          </main>
        </div>

        <MobileNavigation
          items={menuItems}
          pathname={pathname}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />

        <AnimatePresence>
          {isMobileMenuOpen && (
            <MobileMenu
              items={menuItems}
              pathname={pathname}
              onClose={() => setIsMobileMenuOpen(false)}
              onLogout={() => setShowLogoutModal(true)}
            />
          )}
        </AnimatePresence>

        <LogoutConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogoutConfirm}
        />
      </div>
    </LayoutGroup>
  );
}

function TopAppBar({
  activeTitle,
  roleName,
  displayName,
  avatarUrl,
  profileHref,
  pathname,
  unreadCount,
  showNotifications,
  notifications,
  isLoadingNotifications,
  onToggleNotifications,
  onCloseNotifications,
  onMarkRead,
  onOpenMenu,
}) {
  return (
    <header className="mb-4 flex shrink-0 flex-col gap-3 md:mb-6">
      <MaterialCard className="flex min-h-20 items-center justify-between rounded-[1.75rem] px-4 py-3 md:px-5 lg:min-h-24 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="m3-state-layer m3-focus-ring flex h-12 w-12 items-center justify-center rounded-full text-[var(--md-sys-color-on-surface)] md:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <div className="text-xs font-black text-[var(--md-sys-color-on-surface-variant)] md:hidden">{roleName}</div>
            <h1 className="truncate text-2xl font-black tracking-tight text-[var(--md-sys-color-on-surface)] md:text-3xl">
              {activeTitle}
            </h1>
          </div>
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <label className="flex h-14 w-full max-w-md items-center gap-3 rounded-full bg-[var(--md-sys-color-surface-container-high)] px-5 text-[var(--md-sys-color-on-surface-variant)] transition-colors focus-within:bg-[var(--md-sys-color-surface-container-lowest)]">
            <Search className="h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full bg-transparent text-sm font-bold text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-on-surface-variant)]"
            />
          </label>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={onToggleNotifications}
              className="m3-state-layer m3-focus-ring relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]"
              aria-label="Mở thông báo"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-[var(--md-sys-color-surface-container-high)] bg-[var(--unibus-danger)]" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={onCloseNotifications}
                    aria-label="Đóng thông báo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    className="m3-surface-high absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-[1.75rem] p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-black">Thông báo</h3>
                      <StatusChip tone={unreadCount > 0 ? 'primary' : 'neutral'}>{unreadCount} mới</StatusChip>
                    </div>
                    <div className="custom-scrollbar flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
                      {isLoadingNotifications ? (
                        <div className="rounded-2xl bg-[var(--md-sys-color-surface-container)] p-6 text-center text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]">Đang tải thông báo...</div>
                      ) : notifications.length ? (
                        notifications.map((notification) => (
                          <button
                            key={notification.notificationId}
                            type="button"
                            onClick={() => onMarkRead(notification)}
                            className={cn(
                              'm3-state-layer w-full rounded-2xl border p-4 text-left transition-colors',
                              notification.read
                                ? 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]'
                                : 'border-[var(--md-sys-color-primary-container)] bg-[var(--md-sys-color-primary-container)]',
                            )}
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className={cn('h-2 w-2 rounded-full', notification.read ? 'bg-[var(--md-sys-color-outline)]' : 'bg-[var(--unibus-danger)]')} />
                              <p className="line-clamp-1 text-sm font-black text-[var(--md-sys-color-on-surface)]">{notification.title}</p>
                            </div>
                            <p className="line-clamp-2 pl-4 text-xs font-bold leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">{notification.content}</p>
                            <p className="mt-2 pl-4 text-[10px] font-black text-[var(--md-sys-color-on-surface-variant)]">{formatNotificationTime(notification.createdAt)}</p>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-[var(--md-sys-color-surface-container)] p-6 text-center text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]">Chưa có thông báo.</div>
                      )}
                    </div>
                    {notifications.some((notification) => !notification.read) && (
                      <TonalButton
                        type="button"
                        onClick={() => notifications.filter((notification) => !notification.read).forEach(onMarkRead)}
                        className="mt-3 w-full"
                      >
                        <CheckCheck className="h-4 w-4" /> Đánh dấu đã đọc
                      </TonalButton>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <Link
            href={profileHref || '#'}
            className={cn(
              'm3-state-layer m3-focus-ring flex items-center gap-3 rounded-full py-1.5 pl-3 pr-1.5 transition-colors',
              pathname === profileHref ? 'bg-[var(--md-sys-color-secondary-container)]' : 'hover:bg-[var(--md-sys-color-surface-container-high)]',
            )}
            aria-label="Mở hồ sơ cá nhân"
          >
            <div className="hidden max-w-40 text-right lg:block">
              <p className="truncate text-sm font-black">{displayName}</p>
              <p className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">{roleName}</p>
            </div>
            <Avatar avatarUrl={avatarUrl} displayName={displayName} />
          </Link>
        </div>
      </MaterialCard>
    </header>
  );
}

function RailHeader({ expanded, onToggle, logoHref }) {
  return (
    <div className={cn('mb-4 flex items-center gap-2 px-2 pt-2', expanded ? 'justify-between' : 'justify-center')}>
      {expanded && (
        <Link href={logoHref} className="m3-focus-ring rounded-[var(--md-sys-shape-corner-large)]">
          <img src="/logo.png" alt="UniBus Logo" className="h-20 w-auto object-contain" />
        </Link>
      )}
      <button
        type="button"
        onClick={onToggle}
        className="m3-state-layer m3-focus-ring flex h-12 w-12 items-center justify-center rounded-full text-[var(--md-sys-color-on-surface-variant)]"
        aria-label={expanded ? 'Thu gọn menu' : 'Mở rộng menu'}
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  );
}

function NavigationRail({ items, pathname, expanded, onLogout }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className="custom-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-1 pb-4">
        {expanded && <div className="px-4 py-2 text-xs font-black text-[var(--md-sys-color-on-surface-variant)]">Menu chính</div>}
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} expanded={expanded} />
        ))}
      </nav>

      <div className="border-t border-[var(--md-sys-color-outline-variant)] px-1 pt-3">
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            'm3-state-layer m3-focus-ring flex min-h-14 w-full items-center rounded-full px-4 font-black text-[var(--unibus-danger)]',
            expanded ? 'justify-start gap-3' : 'justify-center',
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {expanded && <span>Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
}

function NavLink({ item, pathname, expanded }) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'm3-focus-ring relative flex min-h-14 items-center rounded-full px-4 font-black transition-colors',
        expanded ? 'justify-start gap-3' : 'justify-center',
        isActive ? 'text-[var(--md-sys-color-on-secondary-container)]' : 'm3-state-layer text-[var(--md-sys-color-on-surface-variant)]',
      )}
    >
      {isActive && (
        <motion.span
          layoutId="desktop-active-nav"
          className="absolute inset-0 rounded-full bg-[var(--md-sys-color-secondary-container)]"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <Icon className="relative z-10 h-5 w-5 shrink-0" />
      {expanded && <span className="relative z-10 truncate">{item.name}</span>}
    </Link>
  );
}

function MobileNavigation({ items, pathname, onOpenMenu }) {
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-30 md:hidden">
      <MaterialCard className="rounded-[2rem] px-2 py-2">
        <div className="custom-scrollbar flex items-center gap-1 overflow-x-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'm3-focus-ring relative flex min-w-[4.75rem] flex-col items-center justify-center gap-1 rounded-[1.5rem] px-3 py-2 text-center text-[11px] font-black',
                  isActive ? 'text-[var(--md-sys-color-on-secondary-container)]' : 'm3-state-layer text-[var(--md-sys-color-on-surface-variant)]',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-active-nav"
                    className="absolute inset-x-2 top-1 h-8 rounded-full bg-[var(--md-sys-color-secondary-container)]"
                    transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  />
                )}
                <Icon className="relative z-10 h-5 w-5" />
                <span className="relative z-10 line-clamp-1">{item.name}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onOpenMenu}
            className="m3-state-layer m3-focus-ring flex min-w-[4.75rem] flex-col items-center justify-center gap-1 rounded-[1.5rem] px-3 py-2 text-[11px] font-black text-[var(--md-sys-color-on-surface-variant)]"
          >
            <Menu className="h-5 w-5" />
            <span>Thêm</span>
          </button>
        </div>
      </MaterialCard>
    </nav>
  );
}

function MobileMenu({ items, pathname, onClose, onLogout }) {
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <motion.button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Đóng menu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.aside
        initial={{ y: 36, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 430, damping: 34 }}
        className="m3-surface-high absolute bottom-3 left-3 right-3 max-h-[82vh] rounded-[2rem] p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <img src="/logo.png" alt="UniBus Logo" className="h-14 w-auto object-contain" />
          <button
            type="button"
            onClick={onClose}
            className="m3-state-layer m3-focus-ring flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="custom-scrollbar grid max-h-[56vh] grid-cols-1 gap-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} expanded />
          ))}
        </div>
        <TextButton
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="mt-3 w-full text-[var(--unibus-danger)]"
        >
          <LogOut className="h-5 w-5" /> Đăng xuất
        </TextButton>
      </motion.aside>
    </div>
  );
}

function Avatar({ avatarUrl, displayName }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--md-sys-color-primary-container)] text-lg font-black text-[var(--md-sys-color-on-primary-container)] ring-2 ring-[var(--md-sys-color-surface-container-lowest)]">
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        displayName.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function formatNotificationTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}
