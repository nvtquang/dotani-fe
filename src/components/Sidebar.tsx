import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import dotaniLogo from '../assets/dotani-logo.png';
import { useChatUnread } from '../hooks/useChatUnread';
import { useAuth } from '../stores/AuthContext';
import type { NavigationItem } from '../types/navigation';

type SidebarProps = {
  items: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
};

export const Sidebar = ({ items, isOpen, onClose }: SidebarProps) => {
  const { logout } = useAuth();
  const location = useLocation();
  const { totalUnread } = useChatUnread({ enabled: !location.pathname.startsWith('/chat') });
  const groups = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'personal', label: 'Cá nhân' },
    { key: 'activity', label: 'Hoạt động' },
    { key: 'management', label: 'Quản lý' },
    { key: 'system', label: 'Hệ thống' },
  ] as const;
  const iconMap = {
    dashboard: LayoutDashboard,
    members: UsersRound,
    organizations: Landmark,
    events: CalendarDays,
    posts: FileText,
    chat: MessageSquare,
    notifications: Bell,
    profile: UserRound,
    audit: ShieldCheck,
  } as const;

  return (
    <>
      <div className={isOpen ? 'sidebar-backdrop open' : 'sidebar-backdrop'} onClick={onClose} />
      <aside className={isOpen ? 'sidebar open' : 'sidebar'}>
        <Link className="brand" to="/dashboard" onClick={onClose}>
          <div className="brand-mark">
            <img src={dotaniLogo} alt="DOTANI" />
          </div>
          <div>
            <strong>DOTANI</strong>
            <span>Phường Thượng Cát</span>
          </div>
        </Link>

        <nav className="nav-list" aria-label="Điều hướng chính">
          {groups.map((group) => {
            const groupItems = items.filter((item) => item.group === group.key);

            if (!groupItems.length) {
              return null;
            }

            return (
              <div className="nav-group" key={group.key}>
                <span className="nav-group-label">{group.label}</span>
                {groupItems.map((item) => {
                  const Icon = iconMap[item.icon] ?? ScrollText;
                  return (
                    <NavLink key={item.to} className="nav-link" to={item.to} onClick={onClose}>
                      <Icon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                      {item.icon === 'chat' && totalUnread > 0 && (
                        <strong className="nav-unread-badge">{totalUnread > 99 ? '99+' : totalUnread}</strong>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <button className="sidebar-logout-button" type="button" onClick={logout} title="Đăng xuất">
          <LogOut size={17} aria-hidden="true" />
          <span>Đăng xuất</span>
        </button>
      </aside>
    </>
  );
};
