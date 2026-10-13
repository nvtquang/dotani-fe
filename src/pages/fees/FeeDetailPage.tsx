import { useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BellRing, Check, Pencil, QrCode, Trash2, Undo2 } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import {
  Alert,
  Badge,
  Button,
  Card,
  DetailList,
  Dialog,
  EmptyState,
  Field,
  Input,
  LoadingSkeleton,
  Pagination,
  Select,
  StatusBadge,
  Tabs,
  Time,
  UserAvatar,
  useConfirm,
  useToast,
} from '../../components/ui';
import { FeePeriodForm } from '../../features/fees/FeePeriodForm';
import { useCancelPayment, useDeleteFeePeriod, useFeeMembers, useFeePeriod, useRecordPayment, useRemindFee, useSaveFeePeriod } from '../../hooks/useFees';
import { useMyProfile } from '../../hooks/useMembers';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useProtectedImage } from '../../hooks/useProtectedImage';
import { isManager, isTdpRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { FeeMemberStatus, FeePeriod, PaymentMethod } from '../../types/fee';
import { toApiError } from '../../utils/apiError';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { formatDate } from '../../utils/dateTime';
import { feePeriodStatusLabel, formatMoney, paymentMethodLabel } from '../../utils/labels';

/** Where to transfer: the collector's bank details and QR Banking (the same QR they set up in their profile). */
const TransferInfo = ({ period }: { period: FeePeriod }) => {
  const collector = period.collector;
  const qrUrl = useProtectedImage(collector?.qrImageUrl);
  const [zoomed, setZoomed] = useState(false);
  if (!collector) {
    return <p className="text-sm text-slate-600">Kỳ này chưa chỉ định người thu. Vui lòng nộp trực tiếp cho Bí thư chi đoàn.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
      <DetailList
        className="sm:grid-cols-1"
        items={[
          { label: 'Người thu', value: collector.fullName },
          { label: 'Ngân hàng', value: [collector.bankName, collector.bankCode].filter(Boolean).join(' · ') },
          { label: 'Số tài khoản', value: collector.accountNumber && <span className="font-mono text-base tracking-wide">{collector.accountNumber}</span> },
          { label: 'Chủ tài khoản', value: collector.accountHolderName },
          { label: 'Số tiền', value: <strong>{formatMoney(period.amount)}</strong> },
        ]}
      />
      <div className="flex aspect-square w-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
        {qrUrl ? (
          <button type="button" onClick={() => setZoomed(true)} aria-label="Phóng to mã QR" className="size-full">
            <img src={qrUrl} alt="Mã QR chuyển khoản đoàn phí" className="size-full object-contain" />
          </button>
        ) : (
          <span className="flex flex-col items-center gap-1 px-3 text-center text-xs text-slate-600">
            <QrCode size={28} aria-hidden="true" />
            Người thu chưa có mã QR
          </span>
        )}
      </div>
      <Dialog open={zoomed && Boolean(qrUrl)} onClose={() => setZoomed(false)} title="Mã QR chuyển khoản" size="sm">
        {qrUrl && <img src={qrUrl} alt="Mã QR chuyển khoản phóng to" className="mx-auto w-full max-w-xs" />}
      </Dialog>
    </div>
  );
};

type PaidFilter = 'ALL' | 'UNPAID' | 'PAID';

export const FeeDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const formId = useId();
  const { role, user } = useAuth();
  const officer = isManager(role);
  const [filter, setFilter] = useState<PaidFilter>('UNPAID');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [paying, setPaying] = useState<FeeMemberStatus | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState('');

  const periodQuery = useFeePeriod(id);
  const membersQuery = useFeeMembers(id, { paid: filter === 'ALL' ? undefined : filter === 'PAID', keyword: keyword.trim(), page, size: 30 }, officer);
  const organizationsQuery = useOrganizations(officer);
  const profileQuery = useMyProfile(officer);
  const savePeriod = useSaveFeePeriod(id);
  const deletePeriod = useDeleteFeePeriod();
  const recordPayment = useRecordPayment(id);
  const cancelPayment = useCancelPayment(id);
  const remind = useRemindFee(id);

  const fail = (fallback: string) => (caught: unknown) => toast.error(toApiError(caught).message ?? fallback);

  if (periodQuery.error && toApiError(periodQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }
  if (periodQuery.isLoading) {
    return (
      <Card className="p-5">
        <LoadingSkeleton rows={6} />
      </Card>
    );
  }
  if (!periodQuery.data) {
    return <Alert>Không tìm thấy kỳ đoàn phí.</Alert>;
  }

  const period = periodQuery.data;
  const summary = period.summary;
  const open = period.status === 'OPEN';
  const rows = membersQuery.data?.content ?? [];

  const handleDelete = async () => {
    if (!(await confirm({ title: 'Xóa kỳ đoàn phí này?', description: 'Chỉ xóa được khi chưa có ai đóng.', confirmLabel: 'Xóa', tone: 'danger' }))) return;
    deletePeriod.mutate(id, {
      onSuccess: () => {
        toast.success('Đã xóa kỳ đoàn phí');
        navigate('/fees');
      },
      onError: fail('Không xóa được kỳ đoàn phí'),
    });
  };

  const handleRemind = async () => {
    const description = isTdpRole(role) ? 'Đoàn viên chưa đóng trong tổ dân phố của bạn sẽ nhận thông báo.' : 'Mọi đoàn viên chưa đóng sẽ nhận thông báo.';
    if (!(await confirm({ title: 'Gửi nhắc đóng đoàn phí?', description, confirmLabel: 'Gửi nhắc' }))) return;
    remind.mutate(undefined, {
      onSuccess: (result) => toast.success(`Đã nhắc ${result.recipientCount} đoàn viên`),
      onError: fail('Không gửi được nhắc nợ'),
    });
  };

  const handleCancelPayment = async (row: FeeMemberStatus) => {
    if (!row.paymentId) return;
    if (!(await confirm({ title: `Hủy khoản đóng của ${row.fullName}?`, confirmLabel: 'Hủy khoản đóng', tone: 'danger' }))) return;
    cancelPayment.mutate(row.paymentId, { onSuccess: () => toast.success('Đã hủy khoản đóng'), onError: fail('Không hủy được') });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <Link to="/fees" className="inline-flex h-10 items-center gap-1.5 self-start text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft size={17} aria-hidden="true" />
        Đoàn phí
      </Link>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{period.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {period.organizationName} · {formatMoney(period.amount)} mỗi đoàn viên{period.dueDate && ` · hạn nộp ${formatDate(period.dueDate)}`}
            </p>
          </div>
          <StatusBadge value={period.status} label={feePeriodStatusLabel[period.status]} />
        </div>
        {period.description && <p className="mt-3 text-sm whitespace-pre-line text-slate-700">{period.description}</p>}

        {period.myPayment && (
          <div className="mt-4">
            {period.myPayment.paid ? (
              <Alert tone="info">
                Bạn đã đóng {formatMoney(period.myPayment.amount)}
                {period.myPayment.method && ` (${paymentMethodLabel[period.myPayment.method].toLowerCase()})`}
                {period.myPayment.paidAt && (
                  <>
                    {' '}
                    lúc <Time value={period.myPayment.paidAt} />
                  </>
                )}
                .
              </Alert>
            ) : (
              <Alert tone="info">Bạn chưa đóng đoàn phí kỳ này. Sau khi chuyển khoản, cán bộ chi đoàn sẽ xác nhận cho bạn.</Alert>
            )}
          </div>
        )}

        {(period.canManage || officer) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            {officer && open && (
              <Button variant="secondary" onClick={handleRemind} loading={remind.isPending}>
                <BellRing size={16} aria-hidden="true" />
                Nhắc đoàn viên chưa đóng
              </Button>
            )}
            {period.canManage && (
              <>
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil size={16} aria-hidden="true" />
                  Sửa
                </Button>
                <Button variant="danger" onClick={handleDelete} loading={deletePeriod.isPending}>
                  <Trash2 size={16} aria-hidden="true" />
                  Xóa
                </Button>
              </>
            )}
            {period.lastRemindedAt && (
              <span className="self-center text-xs text-slate-600">
                Nhắc gần nhất <Time value={period.lastRemindedAt} relative />
              </span>
            )}
          </div>
        )}
      </Card>

      {(period.myPayment || !officer) && (
        <Card className="p-4 sm:p-6">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Thông tin chuyển khoản</h2>
          <TransferInfo period={period} />
        </Card>
      )}

      {officer && summary && (
        <Card className="overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Đoàn viên {isTdpRole(role) ? 'tổ dân phố của bạn' : ''}</h2>
                <p className="text-sm text-slate-600">
                  Đã đóng {summary.paidCount}/{summary.expectedCount} · đã thu {formatMoney(summary.collectedAmount)} / {formatMoney(summary.expectedAmount)}
                </p>
              </div>
              <Input
                type="search"
                aria-label="Tìm đoàn viên"
                placeholder="Tìm theo tên"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(0);
                }}
                className="w-56!"
              />
            </div>
            <Tabs
              className="mt-3"
              label="Lọc đoàn viên"
              idPrefix="fee-members"
              items={[
                { value: 'UNPAID', label: 'Chưa đóng', count: summary.unpaidCount },
                { value: 'PAID', label: 'Đã đóng', count: summary.paidCount },
                { value: 'ALL', label: 'Tất cả' },
              ]}
              value={filter}
              onChange={(value) => {
                setFilter(value);
                setPage(0);
              }}
            />
          </div>
          {membersQuery.isLoading && (
            <div className="px-4 pb-4">
              <LoadingSkeleton rows={5} />
            </div>
          )}
          {!membersQuery.isLoading && rows.length === 0 && (
            <EmptyState title={filter === 'UNPAID' ? 'Mọi đoàn viên đã đóng' : 'Không có đoàn viên'} description={keyword ? 'Thử tìm tên khác.' : undefined} />
          )}
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {rows.map((row) => (
              <li key={row.memberId} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
                <UserAvatar name={row.fullName} src={resolveAssetUrl(row.avatarUrl)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{row.fullName}</p>
                  <p className="truncate text-xs text-slate-600">
                    {row.organizationName}
                    {row.paid && (
                      <>
                        {' '}
                        · {formatMoney(row.amount)} · {row.method && paymentMethodLabel[row.method]} · <Time value={row.paidAt} />
                        {row.recordedByName && ` · ghi bởi ${row.recordedByName}`}
                      </>
                    )}
                  </p>
                </div>
                {row.paid ? (
                  <>
                    <Badge tone="green">
                      <Check size={13} aria-hidden="true" />
                      Đã đóng
                    </Badge>
                    {open && (
                      <Button size="icon" variant="ghost" aria-label={`Hủy khoản đóng của ${row.fullName}`} onClick={() => handleCancelPayment(row)}>
                        <Undo2 size={16} aria-hidden="true" />
                      </Button>
                    )}
                  </>
                ) : (
                  open && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setPaying(row);
                        setMethod('CASH');
                        setNote('');
                      }}
                    >
                      Ghi nhận đã đóng
                    </Button>
                  )
                )}
              </li>
            ))}
          </ul>
          <div className="pb-4">
            <Pagination page={page} totalPages={membersQuery.data?.totalPages ?? 0} onChange={setPage} />
          </div>
        </Card>
      )}

      <Dialog
        open={Boolean(paying)}
        onClose={() => setPaying(null)}
        title="Ghi nhận đóng đoàn phí"
        description={paying ? `${paying.fullName} · ${formatMoney(period.amount)}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaying(null)}>
              Hủy
            </Button>
            <Button
              loading={recordPayment.isPending}
              onClick={() =>
                paying &&
                recordPayment.mutate(
                  { memberId: paying.memberId, method, note: note.trim() || undefined },
                  {
                    onSuccess: () => {
                      toast.success(`Đã ghi nhận ${paying.fullName} đóng đoàn phí`);
                      setPaying(null);
                    },
                    onError: fail('Không ghi nhận được'),
                  },
                )
              }
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Hình thức">
            <Select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
              {(Object.keys(paymentMethodLabel) as PaymentMethod[]).map((item) => (
                <option key={item} value={item}>
                  {paymentMethodLabel[item]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ghi chú">
            <Input value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Mã giao dịch, người nộp hộ..." />
          </Field>
        </div>
      </Dialog>

      {period.canManage && (
        <Dialog
          open={editing}
          onClose={() => setEditing(false)}
          title="Sửa kỳ đoàn phí"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Hủy
              </Button>
              <Button type="submit" form={formId} loading={savePeriod.isPending}>
                Lưu
              </Button>
            </>
          }
        >
          {formError && <Alert className="mb-4">{formError}</Alert>}
          <FeePeriodForm
            formId={formId}
            initialValue={period}
            organizations={(organizationsQuery.data ?? []).filter((organization) => (isTdpRole(role) ? organization.id === user?.tdpId : true))}
            me={{ memberId: user?.memberId, name: profileQuery.data?.fullName }}
            onError={setFormError}
            onSubmit={async (values) => {
              await savePeriod.mutateAsync(values);
              toast.success('Đã lưu kỳ đoàn phí');
              setFormError(null);
              setEditing(false);
            }}
          />
        </Dialog>
      )}
    </div>
  );
};
