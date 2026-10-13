import { useState } from 'react';
import { Alert, Button, Dialog, Field, Select, Textarea, useToast } from '../../components/ui';
import { usePublicOrganizations } from '../../hooks/useOrganizations';
import { useRequestTransfer } from '../../hooks/useTransfers';
import { toApiError } from '../../utils/apiError';

type TransferRequestDialogProps = {
  open: boolean;
  onClose: () => void;
  /** the member to move; omitted: the signed-in member asks for themself */
  member?: { id: string; fullName: string };
  currentOrganizationId?: string | null;
};

/** Đề nghị chuyển sinh hoạt sang tổ dân phố khác; the receiving side or the ward approves it. */
export const TransferRequestDialog = ({ open, onClose, member, currentOrganizationId }: TransferRequestDialogProps) => {
  const toast = useToast();
  const branchesQuery = usePublicOrganizations();
  const requestTransfer = useRequestTransfer();
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const targets = (branchesQuery.data ?? []).filter((branch) => branch.id !== currentOrganizationId);

  const close = () => {
    setTarget('');
    setReason('');
    setError(null);
    onClose();
  };

  const submit = () => {
    if (!target) {
      setError('Chọn tổ dân phố muốn chuyển đến.');
      return;
    }
    requestTransfer.mutate(
      { memberId: member?.id, toOrganizationId: target, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Đã gửi đề nghị chuyển sinh hoạt');
          close();
        },
        onError: (caught) => setError(toApiError(caught).message ?? 'Không gửi được đề nghị'),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Đề nghị chuyển sinh hoạt"
      description={member ? `Chuyển ${member.fullName} sang tổ dân phố khác` : 'Chi đoàn nơi đến hoặc Đoàn phường sẽ xem xét đề nghị của bạn.'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Hủy
          </Button>
          <Button onClick={submit} loading={requestTransfer.isPending}>
            Gửi đề nghị
          </Button>
        </>
      }
    >
      {error && <Alert className="mb-4">{error}</Alert>}
      <div className="grid gap-4">
        <Field label="Chuyển đến" required>
          <Select value={target} onChange={(event) => setTarget(event.target.value)}>
            <option value="">Chọn tổ dân phố</option>
            {targets.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Lý do" hint="Ví dụ: chuyển nơi cư trú, đi làm xa...">
          <Textarea rows={3} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
};
