import { useId, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, MessageSquare, Pencil, ShieldCheck, UserX } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Alert, Button, ButtonLink, Card, DetailList, Dialog, LoadingSkeleton, StatusBadge, UserAvatar, useConfirm, useToast } from '../../components/ui';
import { BankingSection } from '../../features/banking/BankingSection';
import { EmulationSection } from '../../features/emulation/EmulationSection';
import { TransferList } from '../../features/transfers/TransferList';
import { TransferRequestDialog } from '../../features/transfers/TransferRequestDialog';
import { useTransfers } from '../../hooks/useTransfers';
import { MemberForm } from '../../features/members/MemberForm';
import { RoleAssignmentForm, toMemberFormValues } from '../../features/members/RoleAssignmentForm';
import { useDisableMember, useMember, useMemberBanking, useUpdateMember, useUpdateMemberRole } from '../../hooks/useMembers';
import { useOrganizations } from '../../hooks/useOrganizations';
import { isTdpRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { MemberFormValues, MemberRole } from '../../types/member';
import { toApiError } from '../../utils/apiError';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { formatDate } from '../../utils/dateTime';
import { genderLabel, memberStatusLabel, roleLabel } from '../../utils/labels';

export const MemberDetailPage = () => {
  const { id = '' } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const editFormId = useId();
  const roleFormId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, user } = useAuth();
  const canAssignRole = role === 'WARD_SECRETARY';
  const mode = searchParams.get('mode');
  const closeMode = () => setSearchParams({}, { replace: true });
  const [formError, setFormError] = useState<string | null>(null);

  const memberQuery = useMember(id);
  const organizationsQuery = useOrganizations();
  const fixedOrganizationId = isTdpRole(role) ? user?.tdpId : undefined;
  const branches = (organizationsQuery.data ?? []).filter(
    (organization) => organization.type === 'YOUTH_UNION_BRANCH' && (!fixedOrganizationId || organization.id === fixedOrganizationId),
  );
  const updateMember = useUpdateMember(id);
  const updateMemberRole = useUpdateMemberRole(id);
  const disableMember = useDisableMember();
  const bankingQuery = useMemberBanking(id);
  const transfersQuery = useTransfers({ memberId: id, page: 0, size: 10 });

  const handleUpdate = async (values: MemberFormValues) => {
    await updateMember.mutateAsync(values);
    toast.success('Đã lưu hồ sơ');
    closeMode();
  };

  const handleRole = async (nextRole: MemberRole, nextOrganizationId: string) => {
    const member = memberQuery.data;
    if (!member) return;
    try {
      if (nextOrganizationId && nextOrganizationId !== member.organizationId) {
        await updateMember.mutateAsync(toMemberFormValues(member, nextOrganizationId));
      }
      await updateMemberRole.mutateAsync(nextRole);
      await memberQuery.refetch();
      toast.success(`Đã phân quyền ${roleLabel[nextRole]}`);
      closeMode();
    } catch (caught) {
      setFormError(toApiError(caught).message ?? 'Không phân quyền được');
    }
  };

  const handleDisable = async () => {
    if (!(await confirm({ title: 'Vô hiệu hóa đoàn viên này?', description: 'Tài khoản sẽ không đăng nhập được nữa.', confirmLabel: 'Vô hiệu hóa', tone: 'danger' }))) return;
    disableMember.mutate(id, {
      onSuccess: () => {
        toast.success('Đã vô hiệu hóa đoàn viên');
        void memberQuery.refetch();
      },
      onError: (caught) => toast.error(toApiError(caught).message ?? 'Không vô hiệu hóa được'),
    });
  };

  if (memberQuery.error && toApiError(memberQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }
  if (memberQuery.isLoading) {
    return (
      <Card className="p-5">
        <LoadingSkeleton rows={6} />
      </Card>
    );
  }
  if (!memberQuery.data) {
    return <Alert>Không tìm thấy đoàn viên.</Alert>;
  }

  const member = memberQuery.data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link to="/members" className="inline-flex h-10 items-center gap-1.5 self-start text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft size={17} aria-hidden="true" />
        Đoàn viên
      </Link>

      <Card className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:items-start sm:text-left">
        <UserAvatar name={member.fullName} src={resolveAssetUrl(member.avatarUrl)} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-900">{member.fullName}</h1>
          <p className="text-sm text-slate-600">{member.organizationName || 'Chưa có TDP'}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            <StatusBadge value={member.memberStatus} label={memberStatusLabel[member.memberStatus]} />
            <StatusBadge value="ROLE" label={roleLabel[member.memberRole]} />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button variant="secondary" size="sm" onClick={() => setSearchParams({ mode: 'edit' })}>
              <Pencil size={16} aria-hidden="true" />
              Sửa hồ sơ
            </Button>
            {canAssignRole && (
              <Button variant="secondary" size="sm" onClick={() => setSearchParams({ mode: 'role' })}>
                <ShieldCheck size={16} aria-hidden="true" />
                Phân quyền
              </Button>
            )}
            {member.organizationId !== user?.organizationId && (
              <Button variant="secondary" size="sm" onClick={() => setSearchParams({ mode: 'transfer' })}>
                <ArrowRightLeft size={16} aria-hidden="true" />
                Chuyển sinh hoạt
              </Button>
            )}
            {member.id !== user?.memberId && (
              <ButtonLink to={`/chat?with=${member.id}`} variant="secondary" size="sm">
                <MessageSquare size={16} aria-hidden="true" />
                Nhắn tin
              </ButtonLink>
            )}
            {member.memberStatus !== 'INACTIVE' && member.id !== user?.memberId && (
              <Button variant="danger" size="sm" onClick={handleDisable} loading={disableMember.isPending}>
                <UserX size={16} aria-hidden="true" />
                Vô hiệu hóa
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Thông tin cá nhân</h2>
        <DetailList
          items={[
            { label: 'Email', value: member.email },
            { label: 'Số điện thoại', value: member.phone },
            { label: 'Ngày sinh', value: member.dateOfBirth ? formatDate(member.dateOfBirth) : null },
            { label: 'Giới tính', value: member.gender ? genderLabel[member.gender] : null },
            { label: 'Ngày vào Đoàn', value: member.youthUnionJoinDate ? formatDate(member.youthUnionJoinDate) : null },
            { label: 'Địa chỉ', value: member.address },
          ]}
        />
      </Card>

      <EmulationSection memberId={member.id} />

      <Card className="px-4 pt-4 sm:px-6 sm:pt-6">
        <h2 className="text-base font-semibold text-slate-900">Lịch sử chuyển sinh hoạt</h2>
        <TransferList compact transfers={transfersQuery.data?.content ?? []} isLoading={transfersQuery.isLoading} emptyText="Chưa chuyển sinh hoạt lần nào" />
      </Card>

      <BankingSection banking={bankingQuery.data} isLoading={bankingQuery.isLoading} errorMessage={bankingQuery.error ? toApiError(bankingQuery.error).message : null} />

      <TransferRequestDialog
        open={mode === 'transfer'}
        onClose={closeMode}
        member={{ id: member.id, fullName: member.fullName }}
        currentOrganizationId={member.organizationId}
      />

      <Dialog
        open={mode === 'edit'}
        onClose={closeMode}
        title="Sửa hồ sơ đoàn viên"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeMode}>
              Hủy
            </Button>
            <Button type="submit" form={editFormId} loading={updateMember.isPending}>
              Lưu
            </Button>
          </>
        }
      >
        {formError && <Alert className="mb-4">{formError}</Alert>}
        <MemberForm formId={editFormId} initialValue={member} organizations={branches} fixedOrganizationId={fixedOrganizationId} onSubmit={handleUpdate} onError={setFormError} />
      </Dialog>

      {canAssignRole && (
        <Dialog
          open={mode === 'role'}
          onClose={closeMode}
          title="Phân quyền"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={closeMode}>
                Hủy
              </Button>
              <Button type="submit" form={roleFormId} loading={updateMember.isPending || updateMemberRole.isPending}>
                Tiếp tục
              </Button>
            </>
          }
        >
          {formError && <Alert className="mb-4">{formError}</Alert>}
          <RoleAssignmentForm formId={roleFormId} member={member} organizations={organizationsQuery.data ?? []} onSubmit={handleRole} />
        </Dialog>
      )}
    </div>
  );
};
