"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, Search, X } from 'lucide-react';
import LogoutConfirmModal from '@/components/modals/LogoutConfirmModal';
import { authApi, clearAuthSession, getAuthSession, toApiAssetUrl, userApi } from '@/services/api';

export default function BentoDashboardLayout({ children, menuItems, roleName, profileHref }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [displayName, setDisplayName] = useState('Người dùng');
  const pathname = usePathname();
  const router = useRouter();

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
        setDisplayName(profile.fullName || profile.email || 'Người dùng');
        setAvatarUrl(toApiAssetUrl(profile.avatarUrl) || null);
      })
      .catch(() => {
        // Header stays usable even if profile fetch fails.
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

  return (
    <div className="min-h-screen bg-brand-surface font-sans text-brand-text p-3 md:p-6 flex gap-4 md:gap-6">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} shrink-0 transition-all duration-300 hidden md:flex flex-col`}>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex-1 flex flex-col h-fit max-h-[calc(100vh-3rem)] sticky top-6">
          <SidebarHeader isSidebarOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((current) => !current)} />
          <SidebarNav
            menuItems={menuItems}
            pathname={pathname}
            isSidebarOpen={isSidebarOpen}
            onLogout={() => setShowLogoutModal(true)}
          />
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute left-3 top-3 bottom-3 w-[min(20rem,calc(100vw-1.5rem))] bg-white rounded-3xl p-5 shadow-2xl border border-black/10 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <img src="/logo.png" alt="UniBus Logo" className="h-10 w-auto object-contain rounded-xl" />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-black/5 text-brand-text/60 transition-colors"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarNav
            menuItems={menuItems}
            pathname={pathname}
            isSidebarOpen
            onNavigate={() => setIsMobileMenuOpen(false)}
            onLogout={() => setShowLogoutModal(true)}
          />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white rounded-3xl p-4 px-4 md:px-8 shadow-sm border border-black/5 flex items-center justify-between mb-4 md:mb-6 shrink-0 h-20 md:h-24">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-black/5 text-brand-text transition-colors"
              aria-label="Mở menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-3 bg-brand-surface rounded-2xl w-full max-w-md border border-black/5 focus-within:border-brand-secondary focus-within:bg-white transition-all">
              <Search className="w-5 h-5 text-brand-text/40" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="bg-transparent border-none outline-none w-full text-sm font-medium text-brand-text placeholder-brand-text/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button className="p-3 rounded-2xl bg-brand-surface hover:bg-brand-surface/70 text-brand-text transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-brand-danger rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-black/5 hidden md:block"></div>
            <Link
              href={profileHref || '#'}
              className={`flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors ${pathname === profileHref ? 'bg-brand-surface' : 'hover:bg-brand-surface'}`}
              aria-label="Mở hồ sơ cá nhân"
            >
              <div className="text-right hidden md:block max-w-40">
                <p className="text-sm font-bold text-brand-text truncate">{displayName}</p>
                <p className="text-xs text-brand-text/50 font-medium">{roleName}</p>
              </div>
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-brand-text font-bold text-lg border border-black/5 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}

function SidebarHeader({ isSidebarOpen, onToggle }) {
  return (
    <div className="flex items-center justify-between mb-10">
      {isSidebarOpen && (
        <div className="flex items-center justify-center w-full px-2">
          <img src="/logo.png" alt="UniBus Logo" className="h-12 w-auto object-contain rounded-xl" />
        </div>
      )}
      <button onClick={onToggle} className="p-2 rounded-xl hover:bg-black/5 text-brand-text/60 transition-colors">
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
}

function SidebarNav({ menuItems, pathname, isSidebarOpen, onNavigate, onLogout }) {
  return (
    <nav className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 -mr-2">
      {isSidebarOpen && <div className="text-xs font-bold text-brand-text/40 mb-2 uppercase tracking-wider pl-4">Menu chính</div>}

      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-medium ${isActive ? 'bg-brand-text text-white shadow-sm' : 'hover:bg-brand-surface text-brand-text/70 hover:text-brand-text'}`}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>{item.name}</span>}
          </Link>
        );
      })}

      <div className="pt-6 mt-8 border-t border-black/5">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl text-brand-danger font-bold hover:bg-brand-danger/10 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {isSidebarOpen && <span>Đăng xuất</span>}
        </button>
      </div>
    </nav>
  );
}
