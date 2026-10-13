import { formatDateTime, formatFull, formatRelative } from '../../utils/dateTime';

/** A <time> element: relative ("2 giờ trước") or absolute ("T6, 30/10 · 14:46"), full date in the tooltip. */
export const Time = ({ value, relative = false, className }: { value?: string | null; relative?: boolean; className?: string }) => {
  if (!value) {
    return <span className={className}>-</span>;
  }
  return (
    <time dateTime={value} title={formatFull(value)} className={className}>
      {relative ? formatRelative(value) : formatDateTime(value)}
    </time>
  );
};
