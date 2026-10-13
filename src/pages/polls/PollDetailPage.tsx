import { useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Lock, Pencil, Play, Square, Trash2 } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Badge, Button, Card, Dialog, LoadingSkeleton, StatusBadge, Time, cn, useConfirm, useToast } from '../../components/ui';
import { PollForm } from '../../features/polls/PollForm';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useDeletePoll, usePoll, usePollAction, useSavePoll, useVote } from '../../hooks/usePolls';
import { isTdpRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import { toApiError } from '../../utils/apiError';
import { formatRate, pollStatusLabel, resultsVisibilityLabel } from '../../utils/labels';

export const PollDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const formId = useId();
  const { role, user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const pollQuery = usePoll(id);
  const canManage = Boolean(pollQuery.data?.canManage);
  const organizationsQuery = useOrganizations(canManage);
  const vote = useVote(id);
  const action = usePollAction();
  const savePoll = useSavePoll(id);
  const deletePoll = useDeletePoll();

  const fail = (fallback: string) => (caught: unknown) => toast.error(toApiError(caught).message ?? fallback);

  if (pollQuery.error && toApiError(pollQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }
  if (pollQuery.isLoading) {
    return (
      <Card className="p-5">
        <LoadingSkeleton rows={6} />
      </Card>
    );
  }
  if (!pollQuery.data) {
    return <Alert>Không tìm thấy khảo sát/biểu quyết.</Alert>;
  }

  const poll = pollQuery.data;
  const canVote = poll.status === 'OPEN' && poll.eligible && !poll.hasVoted;
  const single = poll.maxChoices === 1;
  const totalVotes = poll.options.reduce((sum, option) => sum + (option.voteCount ?? 0), 0);
  const maxVotes = Math.max(0, ...poll.options.map((option) => option.voteCount ?? 0));

  const toggle = (optionId: string) =>
    setSelected((current) =>
      single ? [optionId] : current.includes(optionId) ? current.filter((item) => item !== optionId) : current.length < poll.maxChoices ? [...current, optionId] : current,
    );

  const submitVote = async () => {
    const labels = poll.options.filter((option) => selected.includes(option.id)).map((option) => option.label).join(', ');
    if (!(await confirm({ title: 'Gửi biểu quyết?', description: `Bạn chọn: ${labels}. Không thể thay đổi sau khi gửi.`, confirmLabel: 'Gửi' }))) return;
    vote.mutate(selected, { onSuccess: () => toast.success('Đã ghi nhận biểu quyết của bạn'), onError: fail('Không gửi được biểu quyết') });
  };

  const runAction = async (next: 'open' | 'close') => {
    const ok = await confirm(
      next === 'open'
        ? { title: 'Mở biểu quyết?', description: 'Đoàn viên sẽ nhận thông báo. Sau khi mở không đổi được phương án.', confirmLabel: 'Mở' }
        : { title: 'Kết thúc biểu quyết?', description: 'Không ai biểu quyết thêm được.', confirmLabel: 'Kết thúc', tone: 'danger' },
    );
    if (ok) action.mutate({ id, action: next }, { onError: fail('Không thực hiện được') });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link to="/polls" className="inline-flex h-10 items-center gap-1.5 self-start text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft size={17} aria-hidden="true" />
        Khảo sát – biểu quyết
      </Link>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge value={poll.status} label={pollStatusLabel[poll.status]} />
          {poll.anonymous && (
            <Badge tone="gray">
              <Lock size={12} aria-hidden="true" />
              Bỏ phiếu kín
            </Badge>
          )}
          <Badge tone="gray">{single ? 'Chọn 1 phương án' : `Chọn tối đa ${poll.maxChoices} phương án`}</Badge>
        </div>
        <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{poll.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {poll.organizationName} · {poll.createdByName ?? 'Ban chấp hành'}
          {poll.closesAt && (
            <>
              {' '}
              · {poll.status === 'CLOSED' ? 'kết thúc' : 'kết thúc lúc'} <Time value={poll.closesAt} />
            </>
          )}
        </p>
        {poll.eventId && (
          <Link to={`/events/${poll.eventId}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
            <CalendarDays size={15} aria-hidden="true" />
            Xem sự kiện liên quan
          </Link>
        )}
        {poll.description && <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-slate-800">{poll.description}</p>}

        <div className="mt-5" role={canVote ? (single ? 'radiogroup' : 'group') : undefined} aria-label={canVote ? 'Phương án' : undefined}>
          <ul className="flex flex-col gap-2">
            {poll.options.map((option) => {
              const chosen = canVote ? selected.includes(option.id) : poll.myOptionIds.includes(option.id);
              const share = totalVotes ? (option.voteCount ?? 0) / totalVotes : 0;
              const leading = poll.resultsVisible && maxVotes > 0 && option.voteCount === maxVotes;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role={canVote ? (single ? 'radio' : 'checkbox') : undefined}
                    aria-checked={canVote ? chosen : undefined}
                    disabled={!canVote}
                    onClick={() => toggle(option.id)}
                    className={cn(
                      'relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default',
                      chosen ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-300',
                      canVote && 'hover:border-brand-500',
                    )}
                  >
                    {poll.resultsVisible && (
                      <span className="absolute inset-y-0 left-0 rounded-r-[4px] bg-brand-50" style={{ width: `${share * 100}%` }} aria-hidden="true" />
                    )}
                    <span className="relative flex items-center gap-3">
                      {canVote && (
                        <span
                          className={cn('size-4 shrink-0 border-2', single ? 'rounded-full' : 'rounded', chosen ? 'border-brand-600 bg-brand-600' : 'border-slate-400')}
                          aria-hidden="true"
                        />
                      )}
                      <span className={cn('flex-1 text-slate-900', leading && 'font-semibold')}>{option.label}</span>
                      {poll.resultsVisible && (
                        <span className="text-slate-700 tabular-nums">
                          {option.voteCount ?? 0} · {formatRate(share)}
                        </span>
                      )}
                    </span>
                    {option.voters && option.voters.length > 0 && (
                      <span className="relative mt-1 block text-xs text-slate-600">{option.voters.map((voter) => voter.fullName ?? 'Đoàn viên').join(', ')}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {poll.ballotCount}/{poll.eligibleCount} đoàn viên đã tham gia ({formatRate(poll.eligibleCount ? poll.ballotCount / poll.eligibleCount : null)})
            {!poll.resultsVisible && ` · ${resultsVisibilityLabel[poll.resultsVisibility]}`}
          </p>
          {canVote && (
            <Button onClick={submitVote} disabled={selected.length === 0} loading={vote.isPending}>
              Gửi biểu quyết
            </Button>
          )}
        </div>
        {poll.status === 'OPEN' && !poll.eligible && user?.memberId && (
          <Alert tone="info" className="mt-3">
            Bạn không thuộc đơn vị tham gia biểu quyết này.
          </Alert>
        )}
        {poll.hasVoted && (
          <Alert tone="info" className="mt-3">
            Bạn đã biểu quyết{poll.anonymous ? ' (bỏ phiếu kín: lựa chọn của bạn không được lưu kèm tên)' : ''}.
          </Alert>
        )}

        {canManage && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            {poll.status === 'DRAFT' && (
              <Button onClick={() => runAction('open')} loading={action.isPending}>
                <Play size={16} aria-hidden="true" />
                Mở biểu quyết
              </Button>
            )}
            {poll.status === 'OPEN' && (
              <Button variant="secondary" onClick={() => runAction('close')} loading={action.isPending}>
                <Square size={16} aria-hidden="true" />
                Kết thúc
              </Button>
            )}
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={16} aria-hidden="true" />
              Sửa
            </Button>
            <Button
              variant="danger"
              loading={deletePoll.isPending}
              onClick={async () => {
                if (!(await confirm({ title: 'Xóa khảo sát/biểu quyết này?', confirmLabel: 'Xóa', tone: 'danger' }))) return;
                deletePoll.mutate(id, {
                  onSuccess: () => {
                    toast.success('Đã xóa');
                    navigate('/polls');
                  },
                  onError: fail('Không xóa được'),
                });
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              Xóa
            </Button>
          </div>
        )}
      </Card>

      {canManage && (
        <Dialog
          open={editing}
          onClose={() => setEditing(false)}
          title="Sửa khảo sát / biểu quyết"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Hủy
              </Button>
              <Button type="submit" form={formId} loading={savePoll.isPending}>
                Lưu
              </Button>
            </>
          }
        >
          {formError && <Alert className="mb-4">{formError}</Alert>}
          <PollForm
            formId={formId}
            initialValue={poll}
            organizations={(organizationsQuery.data ?? []).filter((organization) => (isTdpRole(role) ? organization.id === user?.tdpId : true))}
            onError={setFormError}
            onSubmit={(values) =>
              savePoll.mutate(values, {
                onSuccess: () => {
                  toast.success('Đã lưu');
                  setFormError(null);
                  setEditing(false);
                },
                onError: (caught) => setFormError(toApiError(caught).message ?? 'Không lưu được'),
              })
            }
          />
        </Dialog>
      )}
    </div>
  );
};
