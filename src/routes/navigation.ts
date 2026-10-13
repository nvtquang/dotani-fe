import {
  Bell,
  CalendarDays,
  FileText,
  Landmark,
  MessageSquare,
  Newspaper,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../types/api';

export const ALL_ROLES: Role[] = ['WARD_SECRETARY', 'WARD_DEPUTY_SECRETARY', 'TDP_SECRETARY', 'TDP_DEPUTY_SECRETARY', 'MEMBER'];
export const WARD_ROLES: Role[] = ['WARD_SECRETARY', 'WARD_DEPUTY_SECRETARY'];
export const TDP_ROLES: Role[] = ['TDP_SECRETARY', 'TDP_DEPUTY_SECRETARY'];
export const MANAGER_ROLES: Role[] = [...WARD_ROLES, ...TDP_ROLES];

export type NavItem = {
  to: string;
  label: string;
  /** Overrides label for some roles, e.g. "Đoàn viên TDP" for TDP officers. */
  labelFor?: Partial<Record<Role, string>>;
  icon: LucideIcon;
  roles: Role[];
  group: 'main' | 'manage' | 'personal';
  /** Shown in the bottom tab bar on phones (keep it to five). */
  mobileTab?: boolean;
  /** Live counter shown next to the item. */
  badge?: 'chat' | 'notifications';
  /** Extra words the Ctrl+K palette matches. */
  keywords?: string;
};

/** The one menu definition: sidebar, bottom tab bar, command palette and route guards all read it. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Bảng tin', icon: Newspaper, roles: ALL_ROLES, group: 'main', mobileTab: true, keywords: 'tong quan trang chu' },
  { to: '/events', label: 'Sự kiện', icon: CalendarDays, roles: ALL_ROLES, group: 'main', mobileTab: true, keywords: 'lich hoat dong' },
  { to: '/posts', label: 'Bài viết', icon: FileText, roles: ALL_ROLES, group: 'main', keywords: 'tin tuc bao cao' },
  { to: '/chat', label: 'Chat', icon: MessageSquare, roles: ALL_ROLES, group: 'main', mobileTab: true, badge: 'chat', keywords: 'tin nhan' },
  { to: '/notifications', label: 'Thông báo', icon: Bell, roles: ALL_ROLES, group: 'main', mobileTab: true, badge: 'notifications' },
  {
    to: '/members',
    label: 'Đoàn viên',
    labelFor: { TDP_SECRETARY: 'Đoàn viên TDP', TDP_DEPUTY_SECRETARY: 'Đoàn viên TDP' },
    icon: UsersRound,
    roles: MANAGER_ROLES,
    group: 'manage',
    keywords: 'thanh vien danh sach',
  },
  { to: '/organizations', label: 'Tổ dân phố', icon: Landmark, roles: WARD_ROLES, group: 'manage', keywords: 'tdp to chuc chi doan' },
  { to: '/audit-logs', label: 'Nhật ký hệ thống', icon: ShieldCheck, roles: WARD_ROLES, group: 'manage', keywords: 'audit phan quyen' },
  { to: '/profile', label: 'Hồ sơ', icon: UserRound, roles: ALL_ROLES, group: 'personal', mobileTab: true, keywords: 'ca nhan tai khoan mat khau' },
];

export const NAV_GROUP_LABELS: Record<NavItem['group'], string> = {
  main: 'Hoạt động',
  manage: 'Quản lý',
  personal: 'Cá nhân',
};

export const navLabel = (item: NavItem, role: Role | null) => (role && item.labelFor?.[role]) || item.label;

export const navigationFor = (role: Role | null) => (role ? NAV_ITEMS.filter((item) => item.roles.includes(role)) : []);

/** Roles allowed on a path, for the route guard. */
export const rolesFor = (path: string) => NAV_ITEMS.find((item) => item.to === path)?.roles ?? ALL_ROLES;

export const isManager = (role: Role | null | undefined) => Boolean(role && MANAGER_ROLES.includes(role));
export const isWardRole = (role: Role | null | undefined) => Boolean(role && WARD_ROLES.includes(role));
export const isTdpRole = (role: Role | null | undefined) => Boolean(role && TDP_ROLES.includes(role));
