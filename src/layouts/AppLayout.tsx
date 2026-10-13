import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, LogOut, Menu, Search, X } from 'lucide-react';
import dotaniLogo from '../assets/dotani-logo.webp';
import { BottomTabBar } from '../components/layout/BottomTabBar';
import { CommandPalette, openCommandPalette } from '../components/layout/CommandPalette';
import { CountBadge, NavList, type NavCounts } from '../components/layout/NavList';
import { LoadingSkeleton, UserAvatar } from '../components/ui';
import { useChatInbox } from '../hooks/useChat';
import { useMyProfile } from '../hooks/useMembers';
import { useUnreadNotifications } from '../hooks/useNotifications';
import { navigationFor } from '../routes/navigation';
import { useAuth } from '../stores/AuthContext';
import { resolveAssetUrl } from '../utils/assetUrl';
import { roleLabel } from '../utils/labels';

const Brand = () => (
  <Link to="/dashboard" className="flex items-center gap-2.5 rounded-lg">
    <img src={dotaniLogo} alt="" width={36} height={36} className="size-9 rounded-full" />
    <span className="leading-tight">
      <strong className="block text-sm font-bold text-brand-800">DOTANI</strong>
      <span className="block text-xs text-slate-600">Phường Thượng Cát</span>
    </span>
  </Link>
);

export const AppLayout = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const items = useMemo(() => navigationFor(role), [role]);
  const profile = useMyProfile(Boolean(user?.memberId)).data;
  const { totalUnread } = useChatInbox();
  const notificationCount = useUnreadNotifications().data?.count ?? 0;
  const counts: NavCounts = { chat: totalUnread, notifications: notificationCount };
  const displayName = profile?.fullName ?? user?.username;
  const avatarUrl = resolveAssetUrl(profile?.avatarUrl);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (drawerOpen && !drawer.open) drawer.showModal();
    if (!drawerOpen && drawer.open) drawer.close();
  }, [drawerOpen]);

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const userCard = (
    <Link to="/profile" className="flex min-w-0 items-center gap-2 rounded-lg p-1 hover:bg-slate-100">
      <UserAvatar name={displayName} src={avatarUrl} size="sm" />
      <span className="min-w-0 leading-tight">
        <strong className="block truncate text-sm font-semibold text-slate-900">{displayName}</strong>
        <span className="block truncate text-xs text-slate-600">{user ? roleLabel[user.role] : ''}</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold text-brand-700 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Bỏ qua đến nội dung chính
      </a>

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavList items={items} role={role} counts={counts} />
        </div>
        <div className="flex items-center gap-1 border-t border-slate-200 p-3">
          <div className="min-w-0 flex-1">{userCard}</div>
          <button type="button" onClick={logout} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Đăng xuất" title="Đăng xuất">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-16">
        <div className="lg:hidden">
          <Brand />
        </div>
        <button
          type="button"
          onClick={openCommandPalette}
          className="ml-auto inline-flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:mr-auto lg:ml-0 lg:h-10 lg:w-80 lg:justify-start lg:gap-2 lg:border lg:border-slate-300 lg:px-3 lg:text-sm lg:text-slate-600"
          aria-label="Tìm kiếm (Ctrl+K)"
          aria-keyshortcuts="Control+K"
        >
          <Search size={18} aria-hidden="true" />
          <span className="hidden flex-1 text-left lg:inline">Tìm kiếm…</span>
          <kbd className="hidden rounded border border-slate-300 px-1.5 text-xs text-slate-600 lg:inline">Ctrl K</kbd>
        </button>
        <Link to="/notifications" className="relative hidden size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:inline-flex" aria-label={`Thông báo${notificationCount ? `, ${notificationCount} chưa đọc` : ''}`}>
          <Bell size={19} aria-hidden="true" />
          <CountBadge count={notificationCount} className="absolute -top-0.5 -right-0.5" />
        </Link>
        <div className="hidden max-w-56 lg:block">{userCard}</div>
        <button type="button" onClick={() => setDrawerOpen(true)} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden" aria-label="Mở menu" aria-haspopup="dialog">
          <Menu size={20} aria-hidden="true" />
        </button>
      </header>

      {/* phone drawer: the full menu (management pages are not in the tab bar) */}
      <dialog
        ref={drawerRef}
        aria-label="Menu"
        onCancel={(event) => {
          event.preventDefault();
          setDrawerOpen(false);
        }}
        onClick={(event) => event.target === drawerRef.current && setDrawerOpen(false)}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(20rem,85vw)] bg-white p-0 shadow-overlay open:flex open:flex-col lg:hidden"
      >
        {drawerOpen && (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 p-3">
              {userCard}
              <button type="button" onClick={() => setDrawerOpen(false)} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Đóng menu">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavList items={items} role={role} counts={counts} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={logout} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-accent-700 hover:bg-accent-50">
                <LogOut size={18} aria-hidden="true" />
                Đăng xuất
              </button>
            </div>
          </>
        )}
      </dialog>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 pt-4 pb-24 outline-none sm:px-6 sm:pt-6 lg:pb-10">
        <Suspense fallback={<LoadingSkeleton rows={8} />}>
          <Outlet />
        </Suspense>
      </main>

      <BottomTabBar items={items} role={role} counts={counts} />
      <CommandPalette />
    </div>
  );
};
