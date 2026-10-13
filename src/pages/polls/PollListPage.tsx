import { useId, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Vote } from 'lucide-react';
import { Alert, Button, Card, Dialog, EmptyState, LoadingSkeleton, PageHeader, Pagination, Tabs, useToast } from '../../components/ui';
import { PollCard } from '../../features/polls/PollCard';
import { PollForm } from '../../features/polls/PollForm';
import { useOrganizations } from '../../hooks/useOrganizations';
import { usePolls, useSavePoll } from '../../hooks/usePolls';
import { isManager, isTdpRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { PollStatus } from '../../types/poll';
import { toApiError } from '../../utils/apiError';
import { pollStatusLabel } from '../../utils/labels';

export const PollListPage = () => {
  const { role, user } = useAuth();
  const manager = isManager(role);
  const toast = useToast();
  const navigate = useNavigate();
  const formId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<PollStatus | ''>('OPEN');
  const [page, setPage] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const creating = manager && searchParams.get('create') === '1';

  const pollsQuery = usePolls({ status, page, size: 20 });
  const organizationsQuery = useOrganizations(manager);
  const savePoll = useSavePoll();
  const organizations = (organizationsQuery.data ?? []).filter((organization) => (isTdpRole(role) ? organization.id === user?.tdpId : true));
  const polls = pollsQuery.data?.content ?? [];

  const tabs = [
    { value: 'OPEN' as const, label: pollStatusLabel.OPEN },
    { value: 'CLOSED' as const, label: pollStatusLabel.CLOSED },
    ...(manager ? [{ value: 'DRAFT' as const, label: pollStatusLabel.DRAFT }] : []),
    { value: '' as const, label: 'Tất cả' },
  ];

  return (
    <>
      <PageHeader
        title="Khảo sát – biểu quyết"
        description="Lấy ý kiến đoàn viên và bỏ phiếu trong đại hội, hội nghị"
        actions={
          manager && (
            <Button onClick={() => setSearchParams({ create: '1' })}>
              <Plus size={17} aria-hidden="true" />
              Tạo biểu quyết
            </Button>
          )
        }
      />

      <Tabs
        label="Lọc theo trạng thái"
        idPrefix="poll-tab"
        items={tabs}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(0);
        }}
      />

      <section className="mt-4 grid gap-3 md:grid-cols-2" aria-busy={pollsQuery.isLoading}>
        {pollsQuery.isLoading && (
          <Card className="p-5 md:col-span-2">
            <LoadingSkeleton rows={5} />
          </Card>
        )}
        {pollsQuery.isError && <Alert className="md:col-span-2">Không thể tải danh sách biểu quyết.</Alert>}
        {!pollsQuery.isLoading && polls.length === 0 && (
          <Card className="md:col-span-2">
            <EmptyState icon={<Vote size={22} />} title="Chưa có khảo sát hay biểu quyết" description="Cuộc biểu quyết mới sẽ được thông báo cho bạn." />
          </Card>
        )}
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} />
        ))}
      </section>
      <Pagination page={page} totalPages={pollsQuery.data?.totalPages ?? 0} onChange={setPage} />

      {manager && (
        <Dialog
          open={creating}
          onClose={() => setSearchParams({}, { replace: true })}
          title="Tạo khảo sát / biểu quyết"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSearchParams({}, { replace: true })}>
                Hủy
              </Button>
              <Button type="submit" form={formId} loading={savePoll.isPending}>
                Tạo
              </Button>
            </>
          }
        >
          {formError && <Alert className="mb-4">{formError}</Alert>}
          {organizationsQuery.isLoading ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <PollForm
              formId={formId}
              organizations={organizations}
              eventId={searchParams.get('eventId')}
              onError={setFormError}
              onSubmit={(values) =>
                savePoll.mutate(values, {
                  onSuccess: (poll) => {
                    if (!poll) return;
                    toast.success(values.open ? 'Đã mở biểu quyết' : 'Đã lưu bản nháp');
                    setFormError(null);
                    navigate(`/polls/${poll.id}`);
                  },
                  onError: (caught) => setFormError(toApiError(caught).message ?? 'Không tạo được biểu quyết'),
                })
              }
            />
          )}
        </Dialog>
      )}
    </>
  );
};
