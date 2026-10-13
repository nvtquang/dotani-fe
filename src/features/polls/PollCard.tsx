import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Badge, Card, StatusBadge, Time } from '../../components/ui';
import type { Poll } from '../../types/poll';
import { pollStatusLabel } from '../../utils/labels';

export const PollCard = ({ poll }: { poll: Poll }) => (
  <Card as="article" className="relative p-4 transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900">
          <Link to={`/polls/${poll.id}`} className="after:absolute after:inset-0">
            {poll.title}
          </Link>
        </h2>
        <p className="mt-0.5 text-sm text-slate-600">
          {poll.organizationName} · {poll.options.length} phương án
          {poll.closesAt && poll.status === 'OPEN' && (
            <>
              {' '}
              · kết thúc <Time value={poll.closesAt} relative />
            </>
          )}
        </p>
      </div>
      <StatusBadge value={poll.status} label={pollStatusLabel[poll.status]} />
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
      {poll.anonymous && (
        <Badge tone="gray">
          <Lock size={12} aria-hidden="true" />
          Bỏ phiếu kín
        </Badge>
      )}
      {poll.hasVoted ? <Badge tone="green">Bạn đã biểu quyết</Badge> : poll.status === 'OPEN' && poll.eligible && <Badge tone="yellow">Chờ bạn biểu quyết</Badge>}
      <span>
        {poll.ballotCount}/{poll.eligibleCount} đã tham gia
      </span>
    </div>
  </Card>
);
