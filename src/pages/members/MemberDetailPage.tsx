import { useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, ShieldCheck } from 'lucide-react';
import { ForbiddenMessage } from '../../components/ForbiddenMessage';
import { Card, LoadingSkeleton, PageHeader, StatusBadge, UserAvatar } from '../../components/ui';
import { BankingSection } from '../../features/banking/BankingSection';
import { MemberForm } from '../../features/members/MemberForm';
import { RoleAssignmentForm, toMemberFormValues } from '../../features/members/RoleAssignmentForm';
import { useMember, useMemberBanking, useUpdateMember, useUpdateMemberRole } from '../../hooks/useMembers';
import { useOrganizations } from '../../hooks/useOrganizations';
import { useAuth } from '../../stores/AuthContext';
import type { ApiError } from '../../types/api';
import type { MemberFormValues, MemberRole } from '../../types/member';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { genderLabel, memberStatusLabel, roleLabel } from '../../utils/labels';
import { toApiError } from '../../utils/apiError';

const isTdpOfficer = (role: string | null) => role === 'TDP_SECRETARY' || role === 'TDP_DEPUTY_SECRETARY';

export const MemberDetailPage = () => {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, user } = useAuth();
  const mode = searchParams.get('mode');
  const isEditing = mode === 'edit';
  const isAssigningRole = mode === 'role';
  const canAssignRole = role === 'WARD_SECRETARY';
  const [formError, setFormError] = useState<ApiError | null>(null);

  const memberQuery = useMember(id);
  const organizationsQuery = useOrganizations();
  const organizations = useMemo(
    () => (organizationsQuery.data ?? []).filter((organization) => organization.type === 'YOUTH_UNION_BRANCH'),
    [organizationsQuery.data],
  );
  const updateMember = useUpdateMember(id);
  const updateMemberRole = useUpdateMemberRole(id);
  const bankingQuery = useMemberBanking(id);
  const fixedOrganizationId = isTdpOfficer(role) ? user?.tdpId : undefined;

  const handleUpdate = async (values: MemberFormValues) => {
    setFormError(null);
    try {
      await updateMember.mutateAsync({
        ...values,
        organizationId: fixedOrganizationId ?? values.organizationId,
      });
      setSearchParams({});
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  const handleRoleUpdate = async (nextRole: MemberRole, nextOrganizationId: string) => {
    if (!memberQuery.data) {
      return;
    }

    setFormError(null);
    try {
      let currentMember = memberQuery.data;

      if (nextOrganizationId && nextOrganizationId !== currentMember.organizationId) {
        currentMember = await updateMember.mutateAsync(toMemberFormValues(currentMember, nextOrganizationId));
      }

      await updateMemberRole.mutateAsync(nextRole);
      await memberQuery.refetch();
      setSearchParams({});
    } catch (error) {
      setFormError(toApiError(error));
    }
  };

  if (isAssigningRole && !canAssignRole) {
    return <Navigate to={`/members/${id}`} replace />;
  }

  if (memberQuery.error && toApiError(memberQuery.error).status === 403) {
    return <ForbiddenMessage />;
  }

  if (memberQuery.isLoading) {
    return (
      <Card>
        <LoadingSkeleton rows={5} />
      </Card>
    );
  }

  if (!memberQuery.data) {
    return <section className="error-box">Không tìm thấy đoàn viên.</section>;
  }

  const member = memberQuery.data;
  const avatarUrl = resolveAssetUrl(member.avatarUrl);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Hồ sơ đoàn viên"
        title={member.fullName}
        description="Phân quyền được xử lý bằng chức năng riêng, không nằm trong form hồ sơ."
        actions={
          <>
            <Link className="secondary-button inline-button" to="/members">
              <ArrowLeft size={17} aria-hidden="true" />
              Quay lại
            </Link>
            <button
              className="primary-button inline-button"
              type="button"
              onClick={() => setSearchParams(isEditing ? {} : { mode: 'edit' })}
            >
              <Pencil size={17} aria-hidden="true" />
              {isEditing ? 'Xem chi tiết' : 'Sửa hồ sơ'}
            </button>
            {canAssignRole && (
              <button
                className="primary-button inline-button"
                type="button"
                onClick={() => setSearchParams(isAssigningRole ? {} : { mode: 'role' })}
              >
                <ShieldCheck size={17} aria-hidden="true" />
                {isAssigningRole ? 'Đóng phân quyền' : 'Phân quyền'}
              </button>
            )}
          </>
        }
      />

      {formError?.status === 403 && <ForbiddenMessage />}
      {formError && formError.status !== 403 && <section className="error-box">{formError.message}</section>}

      {isEditing && (
        <Card>
          <div className="section-heading">
            <h2>Sửa đoàn viên</h2>
          </div>
          <MemberForm
            initialValue={member}
            organizations={organizations}
            fixedOrganizationId={fixedOrganizationId}
            isSubmitting={updateMember.isPending}
            submitLabel="Lưu thay đổi"
            onSubmit={handleUpdate}
            onCancel={() => setSearchParams({})}
          />
        </Card>
      )}

      {isAssigningRole && canAssignRole && (
        <Card>
          <div className="section-heading">
            <h2>Phân quyền</h2>
          </div>
          <RoleAssignmentForm
            member={member}
            organizations={organizations}
            isSubmitting={updateMember.isPending || updateMemberRole.isPending}
            onSubmit={handleRoleUpdate}
            onCancel={() => setSearchParams({})}
          />
        </Card>
      )}

      {!isEditing && !isAssigningRole && (
        <>
          <Card className="profile-card">
            <UserAvatar name={member.fullName} src={avatarUrl} size="lg" />
            <div>
              <p className="page-eyebrow">Thông tin hồ sơ</p>
              <h2>{member.fullName}</h2>
              <p className="page-description">{member.organizationName || 'Chưa có TDP'}</p>
              <div className="form-actions section-gap">
                <StatusBadge value={member.memberStatus} label={memberStatusLabel[member.memberStatus]} />
                <StatusBadge value={member.memberRole} label={roleLabel[member.memberRole] ?? member.memberRole} />
              </div>
            </div>
          </Card>

          <Card className="detail-grid">
            <div>
              <span>Email</span>
              <strong>{member.email || '-'}</strong>
            </div>
            <div>
              <span>Số điện thoại</span>
              <strong>{member.phone || '-'}</strong>
            </div>
            <div>
              <span>Ngày sinh</span>
              <strong>{member.dateOfBirth || '-'}</strong>
            </div>
            <div>
              <span>Giới tính</span>
              <strong>{member.gender ? genderLabel[member.gender] : '-'}</strong>
            </div>
            <div>
              <span>Tổ dân phố</span>
              <strong>{member.organizationName || 'Chưa có TDP'}</strong>
            </div>
            <div>
              <span>Ngày vào Đoàn</span>
              <strong>{member.youthUnionJoinDate || '-'}</strong>
            </div>
            <div className="detail-wide">
              <span>Địa chỉ</span>
              <strong>{member.address || '-'}</strong>
            </div>
          </Card>

          <BankingSection
            banking={bankingQuery.data}
            errorMessage={bankingQuery.error ? toApiError(bankingQuery.error).message : null}
            isLoading={bankingQuery.isLoading}
          />
        </>
      )}
    </div>
  );
};
