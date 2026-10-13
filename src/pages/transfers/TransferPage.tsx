import { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { Alert, Button, Card, PageHeader, Pagination, Tabs } from '../../components/ui';
import { TransferList } from '../../features/transfers/TransferList';
import { TransferRequestDialog } from '../../features/transfers/TransferRequestDialog';
import { useMyProfile } from '../../hooks/useMembers';
import { useTransfers } from '../../hooks/useTransfers';
import { isManager, isWardRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { TransferStatus } from '../../types/transfer';

export const TransferPage = () => {
  const { role } = useAuth();
  const manager = isManager(role);
  const [status, setStatus] = useState<TransferStatus | ''>(manager ? 'PENDING' : '');
  const [page, setPage] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const transfersQuery = useTransfers({ status, page, size: 20 });
  const profileQuery = useMyProfile();

  return (
    <>
      <PageHeader
        title="Chuyển sinh hoạt"
        description={manager ? 'Đề nghị chuyển sinh hoạt giữa các tổ dân phố, duyệt và lịch sử' : 'Đề nghị chuyển sinh hoạt sang tổ dân phố khác và lịch sử của bạn'}
        actions={
          // ward officers belong to the ward, not to a TDP
          !isWardRole(role) && (
            <Button onClick={() => setRequesting(true)}>
              <ArrowRightLeft size={17} aria-hidden="true" />
              Đề nghị chuyển cho tôi
            </Button>
          )
        }
      />

      <Tabs
        label="Lọc theo trạng thái"
        idPrefix="transfer-tab"
        items={[
          { value: 'PENDING', label: 'Chờ duyệt' },
          { value: 'APPROVED', label: 'Đã duyệt' },
          { value: 'REJECTED', label: 'Từ chối' },
          { value: '', label: 'Tất cả' },
        ]}
        value={status}
        onChange={(value) => {
          setStatus(value as TransferStatus | '');
          setPage(0);
        }}
      />

      <Card className="mt-4 px-4 sm:px-6">
        {transfersQuery.isError && <Alert className="my-4">Không thể tải danh sách.</Alert>}
        <TransferList transfers={transfersQuery.data?.content ?? []} isLoading={transfersQuery.isLoading} />
      </Card>
      <Pagination page={page} totalPages={transfersQuery.data?.totalPages ?? 0} onChange={setPage} />

      <TransferRequestDialog open={requesting} onClose={() => setRequesting(false)} currentOrganizationId={profileQuery.data?.organizationId} />
    </>
  );
};
