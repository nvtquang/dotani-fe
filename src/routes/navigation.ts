import type { Role } from '../types/api';
import type { NavigationItem } from '../types/navigation';

const wardSecretaryMenu: NavigationItem[] = [
  { to: '/dashboard', label: 'Tổng quan', icon: 'dashboard', group: 'overview' },
  { to: '/profile', label: 'Hồ sơ', icon: 'profile', group: 'personal' },
  { to: '/events', label: 'Sự kiện', icon: 'events', group: 'activity' },
  { to: '/posts', label: 'Bài viết', icon: 'posts', group: 'activity' },
  { to: '/members', label: 'Đoàn viên', icon: 'members', group: 'management' },
  { to: '/organizations', label: 'Tổ dân phố', icon: 'organizations', group: 'management' },
  { to: '/chat', label: 'Chat', icon: 'chat', group: 'personal' },
  { to: '/notifications', label: 'Thông báo', icon: 'notifications', group: 'personal' },
  { to: '/audit-logs', label: 'Audit / Phân quyền', icon: 'audit', group: 'system' },
];

const wardDeputyMenu: NavigationItem[] = [
  { to: '/dashboard', label: 'Tổng quan', icon: 'dashboard', group: 'overview' },
  { to: '/profile', label: 'Hồ sơ', icon: 'profile', group: 'personal' },
  { to: '/events', label: 'Sự kiện', icon: 'events', group: 'activity' },
  { to: '/posts', label: 'Bài viết', icon: 'posts', group: 'activity' },
  { to: '/members', label: 'Đoàn viên', icon: 'members', group: 'management' },
  { to: '/organizations', label: 'Tổ dân phố', icon: 'organizations', group: 'management' },
  { to: '/chat', label: 'Chat', icon: 'chat', group: 'personal' },
  { to: '/notifications', label: 'Thông báo', icon: 'notifications', group: 'personal' },
  { to: '/audit-logs', label: 'Audit nghiệp vụ', icon: 'audit', group: 'system' },
];

const tdpAdminMenu: NavigationItem[] = [
  { to: '/dashboard', label: 'Tổng quan', icon: 'dashboard', group: 'overview' },
  { to: '/profile', label: 'Hồ sơ', icon: 'profile', group: 'personal' },
  { to: '/events', label: 'Sự kiện', icon: 'events', group: 'activity' },
  { to: '/posts', label: 'Bài viết', icon: 'posts', group: 'activity' },
  { to: '/members', label: 'Đoàn viên TDP', icon: 'members', group: 'management' },
  { to: '/chat', label: 'Chat', icon: 'chat', group: 'personal' },
  { to: '/notifications', label: 'Thông báo', icon: 'notifications', group: 'personal' },
];

const memberMenu: NavigationItem[] = [
  { to: '/dashboard', label: 'Tổng quan', icon: 'dashboard', group: 'overview' },
  { to: '/profile', label: 'Hồ sơ', icon: 'profile', group: 'personal' },
  { to: '/events', label: 'Sự kiện', icon: 'events', group: 'activity' },
  { to: '/posts', label: 'Bài viết', icon: 'posts', group: 'activity' },
  { to: '/chat', label: 'Chat', icon: 'chat', group: 'personal' },
  { to: '/notifications', label: 'Thông báo', icon: 'notifications', group: 'personal' },
];

export const getNavigationForRole = (role: Role | null): NavigationItem[] => {
  switch (role) {
    case 'WARD_SECRETARY':
      return wardSecretaryMenu;
    case 'WARD_DEPUTY_SECRETARY':
      return wardDeputyMenu;
    case 'TDP_SECRETARY':
    case 'TDP_DEPUTY_SECRETARY':
      return tdpAdminMenu;
    case 'MEMBER':
      return memberMenu;
    default:
      return [];
  }
};
