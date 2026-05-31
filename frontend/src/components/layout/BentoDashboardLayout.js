"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bus, Menu, Bell, Search, UserCircle, LogOut, Wallet } from 'lucide-react';
import LogoutConfirmModal from '@/components/modals/LogoutConfirmModal';
import { walletService } from '@/services/wallet.service';

export default function BentoDashboardLayout({ children, menuItems, roleName, profileHref }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  // Auth Guard: Redirect to login if no token
  useEffect(() => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
    } else if (!sessionStorage.getItem('access_token')) {
      // Sync from local to session if resuming from another tab
      sessionStorage.setItem('access_token', token);
      sessionStorage.setItem('user_role', localStorage.getItem('user_role'));
    }

    // Listen for avatar updates
    const handleAvatarUpdate = (e) => {
      setAvatarUrl(e.detail);
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);

    // Listen for wallet updates
    if (roleName === 'Sinh viên') {
      walletService.getBalance().then(res => setWalletBalance(res.balance)).catch(() => setWalletBalance(0));
    }
    const handleWalletUpdate = (e) => {
      setWalletBalance(e.detail);
    };
    window.addEventListener('walletUpdated', handleWalletUpdate);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
      window.removeEventListener('walletUpdated', handleWalletUpdate);
    };
  }, [router, pathname, roleName]);

  const handleLogoutConfirm = (rememberPassword) => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user_role');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    
    if (rememberPassword) {
      localStorage.setItem('remember_device', 'true');
    } else {
      localStorage.removeItem('remember_device');
    }
    
    setShowLogoutModal(false);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-brand-surface font-sans text-brand-text p-4 md:p-6 flex gap-4 md:gap-6">
      
      {/* Sidebar Bento Block */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} shrink-0 transition-all duration-300 hidden md:flex flex-col`}>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex-1 flex flex-col h-fit max-h-[calc(100vh-3rem)] sticky top-6">
          
          <div className="flex items-center justify-between mb-10">
            {isSidebarOpen && (
              <div className="flex items-center justify-center w-full px-2">
                <img 
                  src="/logo.png" 
                  alt="UniBus Logo" 
                  className="h-12 w-auto object-contain rounded-xl" 
                />
              </div>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl hover:bg-black/5 text-brand-text/60 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 -mr-2">
            {isSidebarOpen && <div className="text-xs font-bold text-brand-text/40 mb-2 uppercase tracking-wider pl-4">Menu Chính</div>}
            
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-medium ${isActive ? 'bg-brand-text text-white shadow-sm' : 'hover:bg-brand-surface text-brand-text/70 hover:text-brand-text'}`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              )
            })}

            {isSidebarOpen && <div className="text-xs font-bold text-brand-text/40 mt-8 mb-2 uppercase tracking-wider pl-4">Cá nhân</div>}
            <Link href={profileHref || "#"} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-medium ${pathname === profileHref ? 'bg-brand-text text-white shadow-sm' : 'hover:bg-brand-surface text-brand-text/70 hover:text-brand-text'}`}>
              <UserCircle className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>Hồ sơ cá nhân</span>}
            </Link>

            {/* Logout */}
            <div className="pt-6 mt-8 border-t border-black/5">
              <button 
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl text-brand-danger font-bold hover:bg-brand-danger/10 transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span>Đăng xuất</span>}
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header Bento Block */}
        <header className="bg-white rounded-3xl p-4 px-6 md:px-8 shadow-sm border border-black/5 flex items-center justify-between mb-4 md:mb-6 shrink-0 h-24">
          
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden p-2 rounded-xl hover:bg-black/5 text-brand-text transition-colors">
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

          <div className="flex items-center gap-4 md:gap-6">
            {walletBalance !== null && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20 text-brand-text font-bold shadow-sm">
                <Wallet className="w-4 h-4 text-brand-primary" />
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletBalance)}
              </div>
            )}
            <button className="p-3 rounded-2xl bg-brand-surface hover:bg-brand-surface/70 text-brand-text transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-brand-danger rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-black/5 hidden md:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-brand-text">Người Dùng</p>
                <p className="text-xs text-brand-text/50 font-medium">{roleName}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-brand-text font-bold text-lg border border-black/5 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  "U"
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Block */}
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
