import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export const PageHeader = ({ title, description, eyebrow, actions }: PageHeaderProps) => (
  <header className="page-header">
    <div>
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </div>
    {actions && <div className="header-actions">{actions}</div>}
  </header>
);

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`surface ${className}`.trim()}>{children}</section>
);

type BadgeTone = 'blue' | 'red' | 'yellow' | 'green' | 'gray';

export const Badge = ({ children, tone = 'blue' }: { children: ReactNode; tone?: BadgeTone }) => (
  <span className={`badge badge-${tone}`}>{children}</span>
);

export const StatusBadge = ({ value, label }: { value?: string | null; label?: string }) => {
  const normalized = value ?? 'UNKNOWN';
  const tone: BadgeTone =
    normalized.includes('ACTIVE') || normalized.includes('PUBLISHED') || normalized.includes('GOING')
      ? 'green'
      : normalized.includes('PENDING') || normalized.includes('DRAFT') || normalized.includes('UNDECIDED')
        ? 'yellow'
        : normalized.includes('INACTIVE') || normalized.includes('CANCELLED') || normalized.includes('NOT_GOING')
          ? 'red'
          : 'gray';

  return <Badge tone={tone}>{label ?? (normalized === 'UNKNOWN' ? 'Không xác định' : normalized)}</Badge>;
};

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="empty-state">
    <div className="empty-state-icon" aria-hidden="true" />
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

export const LoadingSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="skeleton-stack" aria-label="Đang tải">
    {Array.from({ length: rows }).map((_, index) => (
      <div className="skeleton-line" key={index} />
    ))}
  </div>
);

export const UserAvatar = ({
  name,
  src,
  size = 'md',
}: {
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const initial = (name || 'H').trim().charAt(0).toUpperCase();

  return (
    <div className={`user-avatar user-avatar-${size}`}>
      {src ? <img src={src} alt={name ?? 'Avatar'} /> : <span>{initial}</span>}
    </div>
  );
};
