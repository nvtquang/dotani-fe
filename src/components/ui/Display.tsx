import { useState, type ReactNode } from 'react';
import { Inbox, TriangleAlert } from 'lucide-react';
import { cn } from './cn';

export const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) => (
  <header className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </header>
);

export const Card = ({ children, className, as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) => (
  <Tag className={cn('rounded-card border border-slate-200 bg-surface shadow-card', className)}>{children}</Tag>
);

export type BadgeTone = 'blue' | 'red' | 'yellow' | 'green' | 'gray';

const badgeTones: Record<BadgeTone, string> = {
  blue: 'bg-brand-50 text-brand-700 ring-brand-200',
  red: 'bg-accent-50 text-accent-700 ring-accent-100',
  yellow: 'bg-amber-50 text-amber-800 ring-amber-200',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export const Badge = ({ children, tone = 'blue', className }: { children: ReactNode; tone?: BadgeTone; className?: string }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', badgeTones[tone], className)}>
    {children}
  </span>
);

const statusTone = (value: string): BadgeTone => {
  if (/NOT_GOING|INACTIVE|CANCELLED|FAILURE/.test(value)) return 'red';
  if (/ACTIVE|PUBLISHED|GOING|SUCCESS|COMPLETED/.test(value)) return 'green';
  if (/PENDING|DRAFT|UNDECIDED/.test(value)) return 'yellow';
  return 'gray';
};

export const StatusBadge = ({ value, label }: { value?: string | null; label?: string }) => (
  <Badge tone={statusTone(value ?? '')}>{label ?? value ?? 'Không xác định'}</Badge>
);

export const EmptyState = ({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) => (
  <div className="flex flex-col items-center px-4 py-10 text-center">
    <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600" aria-hidden="true">
      {icon ?? <Inbox size={22} />}
    </div>
    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    {description && <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-slate-200', className)} aria-hidden="true" />
);

export const LoadingSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3 p-1" role="status" aria-label="Đang tải">
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} className={cn('h-4', index % 3 === 2 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
);

export const Alert = ({ children, tone = 'error', className }: { children: ReactNode; tone?: 'error' | 'info'; className?: string }) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={cn(
      'flex items-start gap-2 rounded-xl border px-4 py-3 text-sm',
      tone === 'error' ? 'border-accent-100 bg-accent-50 text-accent-700' : 'border-brand-200 bg-brand-50 text-brand-900',
      className,
    )}
  >
    {tone === 'error' && <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

const avatarSizes = { xs: 'size-7 text-xs', sm: 'size-9 text-sm', md: 'size-11 text-base', lg: 'size-20 text-2xl' };

export const UserAvatar = ({ name, src, size = 'md', className }: { name?: string | null; src?: string | null; size?: keyof typeof avatarSizes; className?: string }) => {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-bold text-brand-800',
        avatarSizes[size],
        className,
      )}
    >
      {showImage ? (
        <img src={src!} alt="" className="size-full object-cover" loading="lazy" onError={() => setFailedSrc(src ?? null)} />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
};

/** Label/value pairs; wraps to one column on phones. */
export const DetailList = ({ items, className }: { items: Array<{ label: string; value: ReactNode }>; className?: string }) => (
  <dl className={cn('grid gap-x-6 gap-y-3 sm:grid-cols-2', className)}>
    {items.map((item) => (
      <div key={item.label} className="min-w-0">
        <dt className="text-xs font-medium text-slate-600">{item.label}</dt>
        <dd className="mt-0.5 break-words text-sm text-slate-900">{item.value || '-'}</dd>
      </div>
    ))}
  </dl>
);

export const Pagination = ({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) => {
  if (totalPages <= 1) {
    return null;
  }
  const button = 'inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50';
  return (
    <nav className="mt-4 flex items-center justify-center gap-3" aria-label="Phân trang">
      <button type="button" className={button} disabled={page === 0} onClick={() => onChange(page - 1)}>
        Trước
      </button>
      <span className="text-sm text-slate-700">
        Trang {page + 1} / {totalPages}
      </span>
      <button type="button" className={button} disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Sau
      </button>
    </nav>
  );
};
