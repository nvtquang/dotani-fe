import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Alert, ButtonLink, DetailList, Dialog, LoadingSkeleton, StatusBadge, UserAvatar } from '../../components/ui';
import { useMember } from '../../hooks/useMembers';
import { isTdpRole, isWardRole } from '../../routes/navigation';
import { useAuth } from '../../stores/AuthContext';
import type { MemberDirectoryItem } from '../../types/member';
import { toApiError } from '../../utils/apiError';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { formatDate } from '../../utils/dateTime';
import { genderLabel, memberStatusLabel, roleLabel } from '../../utils/labels';

type MemberProfileDialogProps = {
  memberId: string | null;
  /** public card (name, TDP, avatar) shown when the full profile is out of the viewer's scope */
  basic?: MemberDirectoryItem;
  onClose: () => void;
};

/** Full profiles (email, phone, ...) are only readable within the viewer's scope. */
export const useCanViewFullProfile = () => {
  const { user, role } = useAuth();
  return (memberId: string, organizationId?: string | null) =>
    memberId === user?.memberId || isWardRole(role) || (isTdpRole(role) && Boolean(user?.tdpId) && organizationId === user?.tdpId);
};

export const MemberProfileDialog = ({ memberId, basic, onClose }: MemberProfileDialogProps) => {
  const { user } = useAuth();
  const canViewFull = useCanViewFullProfile();
  const full = memberId ? canViewFull(memberId, basic?.organizationId) || !basic : false;
  const profileQuery = useMember(memberId && full ? memberId : '');
  const profile = profileQuery.data;
  const name = profile?.fullName ?? basic?.fullName ?? 'Đoàn viên';
  const organizationName = profile?.organizationName ?? basic?.organizationName ?? 'Chưa có TDP';
  const avatar = resolveAssetUrl(profile?.avatarUrl ?? basic?.avatarUrl);

  return (
    <Dialog open={Boolean(memberId)} onClose={onClose} title="Hồ sơ đoàn viên" size="md">
      <div className="flex items-center gap-4">
        <UserAvatar name={name} src={avatar} size="lg" />
        <div className="min-w-0">
          <p className="text-lg font-semibold text-slate-900">{name}</p>
          <p className="text-sm text-slate-600">{organizationName}</p>
          {profile && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge value={profile.memberStatus} label={memberStatusLabel[profile.memberStatus]} />
              <StatusBadge value="ROLE" label={roleLabel[profile.memberRole]} />
            </div>
          )}
        </div>
      </div>

      {profileQuery.isLoading && <LoadingSkeleton rows={4} />}
      {profileQuery.error && <Alert className="mt-4">{toApiError(profileQuery.error).message}</Alert>}

      {profile && (
        <DetailList
          className="mt-5"
          items={[
            { label: 'Email', value: profile.email },
            { label: 'Số điện thoại', value: profile.phone },
            { label: 'Ngày sinh', value: profile.dateOfBirth ? formatDate(profile.dateOfBirth) : null },
            { label: 'Giới tính', value: profile.gender ? genderLabel[profile.gender] : null },
            { label: 'Ngày vào Đoàn', value: profile.youthUnionJoinDate ? formatDate(profile.youthUnionJoinDate) : null },
            { label: 'Địa chỉ', value: profile.address },
          ]}
        />
      )}

      {memberId && memberId !== user?.memberId && (
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink to={`/chat?with=${memberId}`} variant="secondary" onClick={onClose}>
            <MessageSquare size={16} aria-hidden="true" />
            Nhắn tin
          </ButtonLink>
          {profile && full && user?.role !== 'MEMBER' && (
            <Link to={`/members/${memberId}`} onClick={onClose} className="inline-flex h-10 items-center px-2 text-sm font-semibold text-brand-700 hover:underline">
              Mở trang quản lý
            </Link>
          )}
        </div>
      )}
    </Dialog>
  );
};
