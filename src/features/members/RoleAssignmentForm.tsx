import { FormEvent, useMemo, useState } from 'react';
import type { Member, MemberFormValues, MemberRole } from '../../types/member';
import type { OrganizationUnit } from '../../types/organization';
import { roleLabel } from '../../utils/labels';

type RoleAssignmentFormProps = {
  member: Member;
  organizations: OrganizationUnit[];
  isSubmitting?: boolean;
  onSubmit: (role: MemberRole, organizationId: string) => void;
  onCancel: () => void;
};

const assignableRoles: MemberRole[] = [
  'MEMBER',
  'TDP_SECRETARY',
  'TDP_DEPUTY_SECRETARY',
  'WARD_DEPUTY_SECRETARY',
];

const requiresTdp = (role: MemberRole) => role === 'TDP_SECRETARY' || role === 'TDP_DEPUTY_SECRETARY';

export const toMemberFormValues = (member: Member, organizationId = member.organizationId): MemberFormValues => ({
  userId: member.userId ?? '',
  fullName: member.fullName,
  dateOfBirth: member.dateOfBirth ?? '',
  gender: member.gender ?? '',
  phone: member.phone ?? '',
  email: member.email ?? '',
  address: member.address ?? '',
  avatarUrl: member.avatarUrl ?? '',
  youthUnionJoinDate: member.youthUnionJoinDate ?? '',
  memberStatus: member.memberStatus,
  organizationId,
});

export const RoleAssignmentForm = ({
  member,
  organizations,
  isSubmitting,
  onSubmit,
  onCancel,
}: RoleAssignmentFormProps) => {
  const branchOrganizations = useMemo(
    () => organizations.filter((organization) => organization.type === 'YOUTH_UNION_BRANCH'),
    [organizations],
  );
  const [selectedRole, setSelectedRole] = useState<MemberRole>(
    assignableRoles.includes(member.memberRole) ? member.memberRole : 'MEMBER',
  );
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    member.organizationId || branchOrganizations[0]?.id || '',
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextOrganizationId = requiresTdp(selectedRole) ? selectedOrganizationId : member.organizationId;
    const confirmed = window.confirm(
      `Xác nhận phân quyền ${member.fullName} thành ${roleLabel[selectedRole]}?`,
    );

    if (confirmed) {
      onSubmit(selectedRole, nextOrganizationId);
    }
  };

  return (
    <form className="member-form" onSubmit={handleSubmit}>
      <label>
        Vai trò mới
        <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as MemberRole)}>
          {assignableRoles.map((role) => (
            <option key={role} value={role}>
              {roleLabel[role]}
            </option>
          ))}
        </select>
      </label>

      {requiresTdp(selectedRole) && (
        <label>
          Tổ dân phố
          <select
            required
            value={selectedOrganizationId}
            onChange={(event) => setSelectedOrganizationId(event.target.value)}
          >
            {branchOrganizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
      )}

      

      <div className="form-actions form-wide">
        <button className="secondary-button inline-button" type="button" onClick={onCancel}>
          Hủy
        </button>
        <button className="primary-button inline-button" type="submit" disabled={isSubmitting}>
          Xác nhận phân quyền
        </button>
      </div>
    </form>
  );
};
