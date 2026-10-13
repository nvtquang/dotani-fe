import { Link } from 'react-router-dom';
import { Clock, MapPin, UsersRound } from 'lucide-react';
import { Badge, Card, StatusBadge, cn } from '../../components/ui';
import type { Event, ParticipationStatus } from '../../types/event';
import { formatDate, formatTime } from '../../utils/dateTime';
import { eventStatusLabel, eventTypeLabel, participationStatusLabel } from '../../utils/labels';
import { deadlinePassed, hasStarted, seatsLabel, seatsLeft } from './eventMeta';

const weekdayLong = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/** Calendar-style date tile: weekday, day, month. */
export const DateTile = ({ value, muted }: { value: string; muted?: boolean }) => {
  const date = new Date(value);
  return (
    <div
      className={cn(
        'flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-xl border text-center',
        muted ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-brand-200 bg-brand-50 text-brand-800',
      )}
      aria-hidden="true"
    >
      <span className={cn('w-full py-0.5 text-[11px] font-semibold', muted ? 'bg-slate-200 text-slate-700' : 'bg-brand-600 text-white')}>
        {weekdayLong[date.getDay()]}
      </span>
      <span className="pt-0.5 text-xl leading-tight font-bold">{date.getDate()}</span>
      <span className="pb-1 text-[11px]">Th {date.getMonth() + 1}</span>
    </div>
  );
};

type EventCardProps = {
  event: Event;
  /** officers see workflow states (draft, ...); members only see "cancelled" */
  showStatus?: boolean;
  myStatus?: ParticipationStatus | null;
  className?: string;
};

export const EventCard = ({ event, showStatus, myStatus, className }: EventCardProps) => {
  const past = hasStarted(event);
  const left = seatsLeft(event);
  const showStatusBadge = event.status === 'CANCELLED' || (showStatus && event.status !== 'PUBLISHED');

  return (
    <Card as="article" className={cn('relative transition-shadow hover:shadow-md', className)}>
      <div className="flex gap-3 p-4">
        <DateTile value={event.startTime} muted={past || event.status === 'CANCELLED'} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="gray">{eventTypeLabel[event.type]}</Badge>
            {showStatusBadge && <StatusBadge value={event.status} label={eventStatusLabel[event.status]} />}
            {myStatus && <StatusBadge value={myStatus} label={myStatus === 'GOING' ? 'Đã đăng ký' : participationStatusLabel[myStatus]} />}
          </div>
          <h2 className="text-base leading-snug font-semibold text-slate-900">
            {/* the whole card is clickable through this stretched link */}
            <Link to={`/events/${event.id}`} className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand-600">
              {event.title}
            </Link>
          </h2>
          <ul className="mt-1.5 space-y-1 text-sm text-slate-600">
            <li className="flex items-center gap-1.5">
              <Clock size={15} className="shrink-0" aria-hidden="true" />
              <span>
                {formatDate(event.startTime)} · {formatTime(event.startTime)}
                {event.organizationName && <> · {event.organizationName}</>}
              </span>
            </li>
            {event.location && (
              <li className="flex items-center gap-1.5">
                <MapPin size={15} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{event.location}</span>
              </li>
            )}
            <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={cn('flex items-center gap-1.5', left === 0 && 'font-medium text-accent-700')}>
                <UsersRound size={15} className="shrink-0" aria-hidden="true" />
                {seatsLabel(event)}
              </span>
              {!past && event.registrationDeadline && (
                <span className={cn(deadlinePassed(event) && 'text-accent-700')}>
                  {deadlinePassed(event) ? 'Hết hạn đăng ký' : `Hạn đăng ký ${formatDate(event.registrationDeadline)}`}
                </span>
              )}
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
