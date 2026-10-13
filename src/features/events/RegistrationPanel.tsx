import { CalendarClock, Check, UsersRound } from 'lucide-react';
import { Button, Card, cn } from '../../components/ui';
import type { Event, ParticipationStatus } from '../../types/event';
import { formatDateTime, formatRelative } from '../../utils/dateTime';
import { participationStatusLabel } from '../../utils/labels';
import { registrationClosedReason, seatsLabel, seatsLeft } from './eventMeta';

type RegistrationPanelProps = {
  event: Event;
  myStatus?: ParticipationStatus | null;
  pending: boolean;
  onChange: (status: ParticipationStatus) => void;
};

const Facts = ({ event }: { event: Event }) => {
  const left = seatsLeft(event);
  const deadline = event.registrationDeadline ?? event.startTime;
  return (
    <ul className="space-y-1 text-sm text-slate-700">
      <li className="flex items-center gap-1.5">
        <CalendarClock size={16} className="shrink-0 text-slate-600" aria-hidden="true" />
        <span>
          Hạn đăng ký: <strong className="font-semibold">{formatDateTime(deadline)}</strong>
          {new Date(deadline).getTime() > Date.now() && <span className="text-slate-600"> ({formatRelative(deadline)})</span>}
        </span>
      </li>
      <li className={cn('flex items-center gap-1.5', left === 0 && 'text-accent-700')}>
        <UsersRound size={16} className="shrink-0 text-slate-600" aria-hidden="true" />
        <span className="font-semibold">{seatsLabel(event)}</span>
      </li>
    </ul>
  );
};

/**
 * Register CTA: a card in the side column on wide screens, a bar pinned above the tab bar on phones,
 * so the action and its deadline/seats are always in view.
 */
export const RegistrationPanel = ({ event, myStatus, pending, onChange }: RegistrationPanelProps) => {
  const closedReason = registrationClosedReason(event);
  const going = myStatus === 'GOING';
  // seats can run out for others, but someone already going may still change their mind
  const canAct = !closedReason || (going && closedReason === 'Đã đủ số lượng');

  const primary = going ? (
    <Button variant="secondary" size="lg" className="w-full" loading={pending} disabled={!canAct} onClick={() => onChange('NOT_GOING')}>
      Hủy đăng ký
    </Button>
  ) : (
    <Button size="lg" className="w-full" loading={pending} disabled={!canAct} onClick={() => onChange('GOING')}>
      {closedReason ?? 'Đăng ký tham gia'}
    </Button>
  );

  const status = going ? (
    <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
      <Check size={18} aria-hidden="true" />
      Bạn đã đăng ký tham gia
    </p>
  ) : myStatus ? (
    <p className="text-sm text-slate-700">
      Phản hồi của bạn: <strong>{participationStatusLabel[myStatus]}</strong>
    </p>
  ) : null;

  return (
    <>
      <Card className="hidden p-5 lg:block">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Đăng ký tham gia</h2>
        <Facts event={event} />
        <div className="mt-4 space-y-3">
          {status}
          {primary}
          {canAct && !going && myStatus !== 'UNDECIDED' && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" disabled={pending} onClick={() => onChange('UNDECIDED')}>
                Chưa chắc
              </Button>
              {myStatus !== 'NOT_GOING' && (
                <Button variant="ghost" size="sm" className="flex-1" disabled={pending} onClick={() => onChange('NOT_GOING')}>
                  Không tham gia
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* phones */}
      <div className="h-28 lg:hidden" aria-hidden="true" />
      <section
        aria-label="Đăng ký tham gia"
        className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgb(15_23_42/0.08)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1 text-xs">
            {going ? (
              <p className="font-semibold text-emerald-800">✓ Đã đăng ký</p>
            ) : (
              <p className="truncate text-slate-700">
                Hạn: <strong>{formatDateTime(event.registrationDeadline ?? event.startTime)}</strong>
              </p>
            )}
            <p className={cn('truncate font-semibold', seatsLeft(event) === 0 ? 'text-accent-700' : 'text-slate-900')}>{seatsLabel(event)}</p>
          </div>
          <div className="w-44 shrink-0">{primary}</div>
        </div>
      </section>
    </>
  );
};
