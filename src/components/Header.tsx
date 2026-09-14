import { LogOut, Menu, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMyProfile } from '../hooks/useMembers';
import { useAuth } from '../stores/AuthContext';
import { resolveAssetUrl } from '../utils/assetUrl';
import { roleLabel } from '../utils/labels';
import { NotificationBell } from './NotificationBell';
import { UserAvatar } from './ui';

type HeaderProps = {
  onMenuClick: () => void;
};

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { logout, user } = useAuth();
  const profileQuery = useMyProfile(Boolean(user?.memberId));
  const profile = profileQuery.data;
  const displayName = profile?.fullName ?? user?.username;
  const avatarUrl = resolveAssetUrl(profile?.avatarUrl);

  return (
    <header className="app-header">
      <button className="icon-button menu-button" type="button" onClick={onMenuClick} aria-label="Mở menu">
        <Menu size={20} aria-hidden="true" />
      </button>
      <div className="header-search" role="search">
        <Search size={17} aria-hidden="true" />
        <span>Tìm kiếm nhanh</span>
      </div>
      {user && (
        <div className="header-right">
          <NotificationBell />
          <Link className="header-user" to="/profile" title="Mở hồ sơ cá nhân">
            <UserAvatar name={displayName} src={avatarUrl} size="sm" />
            <div>
              <strong>{displayName}</strong>
              <span>{roleLabel[user.role] ?? user.role}</span>
            </div>
          </Link>
          <button className="icon-button" type="button" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  );
};
