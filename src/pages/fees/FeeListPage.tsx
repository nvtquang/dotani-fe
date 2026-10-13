import { useId, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CircleCheck, CircleDashed, Plus, Wallet } from 'lucide-react';
import { Alert, Badge, Button, Card, Dialog, EmptyState, LoadingSkeleton, PageHeader, Pagination, StatusBadge, Tabs, useToast } from '../../components/ui';
import { FeePeriodForm } from '../../features/fees/FeePeriodForm';
import { useFeePeriods, useSaveFeePeriod } from '../../hooks/useFees';
import { useMyProfile } from '../../hooks/useMembers';
import { useOrganizations } from '../../hooks/useOrganizations';
import { isManager, isTdpRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { FeePeriod, FeePeriodStatus } from '../../types/fee';
import { formatDate } from '../../utils/dateTime';
import { feePeriodStatusLabel, formatMoney } from '../../utils/labels';

const Progress = ({ period }: { period: FeePeriod }) => {
  const summary = period.summary;
  if (!summary) return null;
  const ratio = summary.expectedCount ? summary.paidCount / summary.expectedCount : 0;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-slate-600">
        <span>
          Đã đóng <strong className="text-slate-900">{summary.paidCount}</strong>/{summary.expectedCount}
        </span>
        <span>{formatMoney(summary.collectedAmount)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={summary.expectedCount} aria-valuenow={summary.paidCount} aria-label="Tiến độ thu">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
};

export const FeeListPage = () => {
  const { role, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const formId = useId();
  const manager = isManager(role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<FeePeriodStatus | ''>('');
  const [page, setPage] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const creating = manager && searchParams.get('create') === '1';

  const periodsQuery = useFeePeriods(status, page);
  const organizationsQuery = useOrganizations(manager);
  const profileQuery = useMyProfile(manager);
  const savePeriod = useSaveFeePeriod();

  const creatable = useMemo(
    () => (organizationsQuery.data ?? []).filter((organization) => (isTdpRole(role) ? organization.id === user?.tdpId : true)),
    [organizationsQuery.data, role, user?.tdpId],
  );
  const periods = periodsQuery.data?.content ?? [];
  const unpaid = periods.filter((period) => period.myPayment && !period.myPayment.paid && period.status === 'OPEN');

  return (
    <>
      <PageHeader
        title="Đoàn phí"
        description={manager ? 'Các kỳ thu đoàn phí, tiến độ thu và nhắc nợ' : 'Các kỳ đoàn phí của bạn và thông tin chuyển khoản'}
        actions={
          manager && (
            <Button onClick={() => setSearchParams({ create: '1' })}>
              <Plus size={17} aria-hidden="true" />
              Tạo kỳ thu
            </Button>
          )
        }
      />

      {unpaid.length > 0 && (
        <Alert tone="info" className="mb-4">
          Bạn còn {unpaid.length} kỳ đoàn phí chưa đóng. Mở kỳ để xem thông tin chuyển khoản.
        </Alert>
      )}

      <Tabs
        label="Lọc theo trạng thái"
        idPrefix="fee-tab"
        items={[
          { value: '', label: 'Tất cả' },
          { value: 'OPEN', label: feePeriodStatusLabel.OPEN },
          { value: 'CLOSED', label: feePeriodStatusLabel.CLOSED },
        ]}
        value={status}
        onChange={(value) => {
          setStatus(value as FeePeriodStatus | '');
          setPage(0);
        }}
      />

      <section className="mt-4 grid gap-3 md:grid-cols-2" aria-busy={periodsQuery.isLoading}>
        {periodsQuery.isLoading && (
          <Card className="p-5 md:col-span-2">
            <LoadingSkeleton rows={5} />
          </Card>
        )}
        {periodsQuery.isError && <Alert className="md:col-span-2">Không thể tải danh sách đoàn phí.</Alert>}
        {!periodsQuery.isLoading && periods.length === 0 && (
          <Card className="md:col-span-2">
            <EmptyState icon={<Wallet size={22} />} title="Chưa có kỳ đoàn phí" description={manager ? 'Tạo kỳ thu đầu tiên cho phường hoặc tổ dân phố.' : 'Kỳ đoàn phí mới sẽ xuất hiện ở đây.'} />
          </Card>
        )}
        {periods.map((period) => (
          <Card key={period.id} as="article" className="relative p-4 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">
                  <Link to={`/fees/${period.id}`} className="after:absolute after:inset-0">
                    {period.name}
                  </Link>
                </h2>
                <p className="text-sm text-slate-600">
                  {period.organizationName} · {formatMoney(period.amount)}
                  {period.dueDate && ` · hạn ${formatDate(period.dueDate)}`}
                </p>
              </div>
              <StatusBadge value={period.status} label={feePeriodStatusLabel[period.status]} />
            </div>
            {period.myPayment && (
              <p className="mt-3 flex items-center gap-1.5 text-sm">
                {period.myPayment.paid ? (
                  <Badge tone="green">
                    <CircleCheck size={14} aria-hidden="true" />
                    Bạn đã đóng
                  </Badge>
                ) : (
                  <Badge tone="yellow">
                    <CircleDashed size={14} aria-hidden="true" />
                    Bạn chưa đóng
                  </Badge>
                )}
              </p>
            )}
            <Progress period={period} />
          </Card>
        ))}
      </section>

      <Pagination page={page} totalPages={periodsQuery.data?.totalPages ?? 0} onChange={setPage} />

      {manager && (
        <Dialog
          open={creating}
          onClose={() => setSearchParams({}, { replace: true })}
          title="Tạo kỳ đoàn phí"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSearchParams({}, { replace: true })}>
                Hủy
              </Button>
              <Button type="submit" form={formId} loading={savePeriod.isPending}>
                Tạo kỳ thu
              </Button>
            </>
          }
        >
          {formError && <Alert className="mb-4">{formError}</Alert>}
          {organizationsQuery.isLoading ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <FeePeriodForm
              formId={formId}
              organizations={creatable}
              me={{ memberId: user?.memberId, name: profileQuery.data?.fullName }}
              onError={setFormError}
              onSubmit={async (values) => {
                const period = await savePeriod.mutateAsync(values);
                toast.success('Đã tạo kỳ đoàn phí');
                setFormError(null);
                navigate(`/fees/${period.id}`);
              }}
            />
          )}
        </Dialog>
      )}
    </>
  );
};
