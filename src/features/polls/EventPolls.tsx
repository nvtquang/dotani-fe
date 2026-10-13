import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ButtonLink, Card, StatusBadge } from '../../components/ui';
import { usePolls } from '../../hooks/usePolls';
import { pollStatusLabel } from '../../utils/labels';

/** Votes held during an event (đại hội, hội nghị); officers managing the event can add one. */
export const EventPolls = ({ eventId, canManage }: { eventId: string; canManage: boolean }) => {
  const pollsQuery = usePolls({ eventId, page: 0, size: 20 });
  const polls = pollsQuery.data?.content ?? [];
  if (!canManage && polls.length === 0) return null;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Biểu quyết trong sự kiện</h2>
        {canManage && (
          <ButtonLink to={`/polls?create=1&eventId=${eventId}`} size="sm" variant="secondary">
            <Plus size={15} aria-hidden="true" />
            Tạo biểu quyết
          </ButtonLink>
        )}
      </div>
      {polls.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">Chưa có biểu quyết nào gắn với sự kiện này.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {polls.map((poll) => (
            <li key={poll.id} className="flex items-center gap-3 py-2">
              <Link to={`/polls/${poll.id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-brand-700 hover:underline">
                {poll.title}
              </Link>
              <span className="text-xs text-slate-600 tabular-nums">
                {poll.ballotCount}/{poll.eligibleCount}
              </span>
              <StatusBadge value={poll.status} label={pollStatusLabel[poll.status]} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
