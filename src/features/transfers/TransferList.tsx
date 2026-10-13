import { useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { Alert, Button, Dialog, EmptyState, Field, LoadingSkeleton, StatusBadge, Textarea, Time, UserAvatar, useConfirm, useToast } from '../../components/ui';
import { useDecideTransfer } from '../../hooks/useTransfers';
import type { MemberTransfer } from '../../types/transfer';
import { toApiError } from '../../utils/apiError';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { transferStatusLabel } from '../../utils/labels';

type TransferListProps = {
  transfers: MemberTransfer[];
  isLoading?: boolean;
  /** hides the member column, e.g. in one member's history */
  compact?: boolean;
  emptyText?: string;
};

/** Transfers with their decision buttons; used on the transfers page and in a member's history. */
export const TransferList = ({ transfers, isLoading, compact, emptyText = 'Chưa có đề nghị chuyển sinh hoạt' }: TransferListProps) => {
  const toast = useToast();
  const confirm = useConfirm();
  const decide = useDecideTransfer();
  const [deciding, setDeciding] = useState<{ transfer: MemberTransfer; action: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');

  const fail = (caught: unknown) => toast.error(toApiError(caught).message ?? 'Không xử lý được đề nghị');

  const cancel = async (transfer: MemberTransfer) => {
    if (!(await confirm({ title: 'Hủy đề nghị chuyển sinh hoạt?', confirmLabel: 'Hủy đề nghị', tone: 'danger' }))) return;
    decide.mutate({ id: transfer.id, action: 'cancel' }, { onSuccess: () => toast.success('Đã hủy đề nghị'), onError: fail });
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (transfers.length === 0) return <EmptyState title={emptyText} />;

  return (
    <>
      <ul className="divide-y divide-slate-100">
        {transfers.map((transfer) => (
          <li key={transfer.id} className="flex flex-wrap items-start gap-3 py-3">
            {!compact && <UserAvatar name={transfer.memberName} src={resolveAssetUrl(transfer.memberAvatarUrl)} size="sm" />}
            <div className="min-w-0 flex-1 text-sm">
              {!compact && <p className="font-semibold text-slate-900">{transfer.memberName ?? 'Đoàn viên'}</p>}
              <p className="flex flex-wrap items-center gap-1.5 text-slate-800">
                {transfer.fromOrganizationName}
                <ArrowRight size={14} aria-label="chuyển đến" />
                <strong>{transfer.toOrganizationName}</strong>
              </p>
              {transfer.reason && <p className="mt-0.5 text-slate-700">Lý do: {transfer.reason}</p>}
              <p className="mt-0.5 text-xs text-slate-600">
                {transfer.requestedByName ? `Đề nghị bởi ${transfer.requestedByName}` : 'Đề nghị'} · <Time value={transfer.requestedAt} />
                {transfer.decidedAt && (
                  <>
                    {' '}
                    · {transferStatusLabel[transfer.status]} {transfer.decidedByName && `bởi ${transfer.decidedByName}`} · <Time value={transfer.decidedAt} />
                  </>
                )}
              </p>
              {transfer.decisionNote && <p className="mt-0.5 text-xs text-slate-700">Ghi chú: {transfer.decisionNote}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={transfer.status} label={transferStatusLabel[transfer.status]} />
              {transfer.canDecide && (
                <>
                  <Button size="sm" onClick={() => setDeciding({ transfer, action: 'approve' })}>
                    <Check size={15} aria-hidden="true" />
                    Duyệt
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeciding({ transfer, action: 'reject' })}>
                    <X size={15} aria-hidden="true" />
                    Từ chối
                  </Button>
                </>
              )}
              {transfer.canCancel && !transfer.canDecide && (
                <Button size="sm" variant="secondary" onClick={() => cancel(transfer)}>
                  Hủy đề nghị
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={Boolean(deciding)}
        onClose={() => setDeciding(null)}
        title={deciding?.action === 'approve' ? 'Duyệt chuyển sinh hoạt' : 'Từ chối chuyển sinh hoạt'}
        description={deciding ? `${deciding.transfer.memberName}: ${deciding.transfer.fromOrganizationName} → ${deciding.transfer.toOrganizationName}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeciding(null)}>
              Hủy
            </Button>
            <Button
              variant={deciding?.action === 'reject' ? 'accent' : 'primary'}
              loading={decide.isPending}
              onClick={() =>
                deciding &&
                decide.mutate(
                  { id: deciding.transfer.id, action: deciding.action, note: note.trim() || undefined },
                  {
                    onSuccess: () => {
                      toast.success(deciding.action === 'approve' ? 'Đã duyệt, đoàn viên đã được chuyển' : 'Đã từ chối đề nghị');
                      setDeciding(null);
                      setNote('');
                    },
                    onError: fail,
                  },
                )
              }
            >
              {deciding?.action === 'approve' ? 'Duyệt' : 'Từ chối'}
            </Button>
          </>
        }
      >
        {deciding?.action === 'approve' && (
          <Alert tone="info" className="mb-4">
            Đoàn viên sẽ thuộc tổ dân phố mới ngay. Nếu đang là cán bộ chi đoàn cũ, chức vụ sẽ trở về Đoàn viên.
          </Alert>
        )}
        <Field label="Ghi chú">
          <Textarea rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
        </Field>
      </Dialog>
    </>
  );
};
