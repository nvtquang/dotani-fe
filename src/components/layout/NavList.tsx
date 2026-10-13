import { NavLink } from 'react-router-dom';
import { cn } from '../ui';
import { NAV_GROUP_LABELS, navLabel, type NavItem } from '../../routes/navigation';
import type { Role } from '../../types/api';

export type NavCounts = { chat: number; notifications: number };

export const CountBadge = ({ count, className }: { count: number; className?: string }) =>
  count > 0 ? (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full bg-accent-600 px-1.5 text-[11px] leading-5 font-bold text-white',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
      <span className="sr-only"> chưa đọc</span>
    </span>
  ) : null;

/** Grouped navigation links, used by the desktop sidebar and the phone drawer. */
export const NavList = ({ items, role, counts, onNavigate }: { items: NavItem[]; role: Role | null; counts: NavCounts; onNavigate?: () => void }) => {
  const groups = (Object.keys(NAV_GROUP_LABELS) as NavItem['group'][])
    .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
    .filter((entry) => entry.items.length > 0);

  return (
    <nav aria-label="Điều hướng chính" className="flex flex-col gap-5">
      {groups.map(({ group, items: groupItems }) => (
        <div key={group}>
          <p className="mb-1 px-3 text-xs font-semibold tracking-wide text-slate-600 uppercase">{NAV_GROUP_LABELS[group]}</p>
          <ul className="flex flex-col gap-0.5">
            {groupItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                      )
                    }
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="flex-1">{navLabel(item, role)}</span>
                    {item.badge && <CountBadge count={counts[item.badge]} />}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};
