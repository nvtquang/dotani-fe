import { NavLink } from 'react-router-dom';
import { cn } from '../ui';
import { navLabel, type NavItem } from '../../routes/navigation';
import type { Role } from '../../types/api';
import { CountBadge, type NavCounts } from './NavList';

/** Phone-only tab bar: Bảng tin, Sự kiện, Chat, Thông báo, Hồ sơ. */
export const BottomTabBar = ({ items, role, counts }: { items: NavItem[]; role: Role | null; counts: NavCounts }) => (
  <nav
    aria-label="Thanh điều hướng"
    className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
  >
    <ul className="mx-auto grid max-w-lg grid-cols-5">
      {items
        .filter((item) => item.mobileTab)
        .map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                    isActive ? 'text-brand-700' : 'text-slate-600',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', isActive && 'bg-brand-50')}>
                      <Icon size={20} aria-hidden="true" strokeWidth={isActive ? 2.4 : 2} />
                    </span>
                    <span className="max-w-full truncate px-1">{navLabel(item, role)}</span>
                    {item.badge && <CountBadge count={counts[item.badge]} className="absolute top-1.5 left-1/2 ml-1" />}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
    </ul>
  </nav>
);
