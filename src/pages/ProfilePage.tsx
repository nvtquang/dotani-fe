import { Alert, Card, DetailList, LoadingSkeleton, StatusBadge, useConfirm, useToast } from '../components/ui';
import { BankingSection } from '../features/banking/BankingSection';
import { EmulationSection } from '../features/emulation/EmulationSection';
import { AvatarSection } from '../features/profile/AvatarSection';
import { ProfileForm } from '../features/profile/ProfileForm';
import { SecuritySection } from '../features/profile/SecuritySection';
import {
  useDeleteAvatar,
  useDeleteBankQr,
  useMyBanking,
  useMyProfile,
  useUpdateMyBanking,
  useUpdateMyProfile,
  useUploadAvatar,
  useUploadBankQr,
} from '../hooks/useMembers';
import { useAuth } from '../stores/AuthContext';
import { toApiError } from '../utils/apiError';
import { formatDate } from '../utils/dateTime';
import { memberStatusLabel, roleLabel } from '../utils/labels';

export const ProfilePage = () => {
  const { role } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  // members receive support transfers; officers also collect đoàn phí to this account (its QR is shown to payers)
  const hasBanking = Boolean(role);
  const bankingTitle = role === 'MEMBER' ? 'Thông tin ngân hàng' : 'Tài khoản nhận đoàn phí';
  const profileQuery = useMyProfile();
  const bankingQuery = useMyBanking(hasBanking);
  const updateProfile = useUpdateMyProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const updateBanking = useUpdateMyBanking();
  const uploadBankQr = useUploadBankQr();
  const deleteBankQr = useDeleteBankQr();

  const fail = (fallback: string) => (caught: unknown) => toast.error(toApiError(caught).message ?? fallback);

  if (profileQuery.isLoading) {
    return (
      <Card className="p-5">
        <LoadingSkeleton rows={6} />
      </Card>
    );
  }
  if (profileQuery.error || !profileQuery.data) {
    return <Alert>{toApiError(profileQuery.error).message ?? 'Không thể tải hồ sơ'}</Alert>;
  }

  const member = profileQuery.data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <AvatarSection
        member={member}
        subtitle={`${roleLabel[member.memberRole]} · ${member.organizationName || 'Chưa có TDP'}`}
        isUploading={uploadAvatar.isPending}
        isDeleting={deleteAvatar.isPending}
        onUpload={(file) => uploadAvatar.mutate(file, { onSuccess: () => toast.success('Đã đổi ảnh đại diện'), onError: fail('Không thể tải ảnh đại diện') })}
        onDelete={async () => {
          if (await confirm({ title: 'Xóa ảnh đại diện?', confirmLabel: 'Xóa', tone: 'danger' })) {
            deleteAvatar.mutate(undefined, { onSuccess: () => toast.success('Đã xóa ảnh đại diện'), onError: fail('Không thể xóa ảnh đại diện') });
          }
        }}
      />

      <Card className="p-4 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Thông tin Đoàn</h2>
        <DetailList
          items={[
            { label: 'Tổ dân phố', value: member.organizationName || 'Chưa có TDP' },
            { label: 'Trạng thái', value: <StatusBadge value={member.memberStatus} label={memberStatusLabel[member.memberStatus]} /> },
            { label: 'Vai trò', value: roleLabel[member.memberRole] },
            { label: 'Ngày vào Đoàn', value: member.youthUnionJoinDate ? formatDate(member.youthUnionJoinDate) : null },
          ]}
        />
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Thông tin cá nhân</h2>
        <ProfileForm
          member={member}
          onSubmit={async (values) => {
            await updateProfile.mutateAsync(values);
            toast.success('Đã lưu thông tin cá nhân');
          }}
          onError={toast.error}
        />
      </Card>

      {hasBanking && (
        <BankingSection
          title={bankingTitle}
          banking={bankingQuery.data}
          isLoading={bankingQuery.isLoading}
          errorMessage={bankingQuery.error ? toApiError(bankingQuery.error).message : null}
          edit={{
            isUploading: uploadBankQr.isPending,
            isDeleting: deleteBankQr.isPending,
            onSave: async (values) => {
              await updateBanking.mutateAsync(values);
              toast.success('Đã lưu thông tin ngân hàng');
            },
            onUploadQr: (file) => uploadBankQr.mutate(file, { onSuccess: () => toast.success('Đã cập nhật mã QR'), onError: fail('Không thể tải mã QR') }),
            onDeleteQr: async () => {
              if (await confirm({ title: 'Xóa mã QR ngân hàng?', confirmLabel: 'Xóa', tone: 'danger' })) {
                deleteBankQr.mutate(undefined, { onSuccess: () => toast.success('Đã xóa mã QR'), onError: fail('Không thể xóa mã QR') });
              }
            },
            onError: toast.error,
          }}
        />
      )}

      <EmulationSection memberId={member.id} />

      <SecuritySection />
    </div>
  );
};
