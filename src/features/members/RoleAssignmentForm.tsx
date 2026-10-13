import { useState } from 'react';
import { Field, Select, useConfirm } from '../../components/ui';
import type { Member, MemberFormValues, MemberRole } from '../../types/member';
import type { OrganizationUnit } from '../../types/organization';
import { roleLabel } from '../../utils/labels';

const assignableRoles: MemberRole[] = ['MEMBER', 'TDP_SECRETARY', 'TDP_DEPUTY_SECRETARY', 'WARD_DEPUTY_SECRETARY'];

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

type RoleAssignmentFormProps = {
  formId: string;
  member: Member;
  organizations: OrganizationUnit[];
  onSubmit: (role: MemberRole, organizationId: string) => void;
};

export const RoleAssignmentForm = ({ formId, member, organizations, onSubmit }: RoleAssignmentFormProps) => {
  const confirm = useConfirm();
  const branches = organizations.filter((organization) => organization.type === 'YOUTH_UNION_BRANCH');
  const [role, setRole] = useState<MemberRole>(assignableRoles.includes(member.memberRole) ? member.memberRole : 'MEMBER');
  const [organizationId, setOrganizationId] = useState(member.organizationId || branches[0]?.id || '');

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const ok = await confirm({
          title: 'Xác nhận phân quyền',
          description: `${member.fullName} sẽ trở thành ${roleLabel[role]}${requiresTdp(role) ? ` của ${branches.find((item) => item.id === organizationId)?.name ?? 'TDP đã chọn'}` : ''}.`,
          confirmLabel: 'Phân quyền',
        });
        if (ok) onSubmit(role, requiresTdp(role) ? organizationId : member.organizationId);
      }}
    >
      <p className="text-sm text-slate-700">
        Vai trò hiện tại: <strong>{roleLabel[member.memberRole]}</strong>
      </p>
      <Field label="Vai trò mới">
        <Select value={role} onChange={(event) => setRole(event.target.value as MemberRole)}>
          {assignableRoles.map((item) => (
            <option key={item} value={item}>
              {roleLabel[item]}
            </option>
          ))}
        </Select>
      </Field>
      {requiresTdp(role) && (
        <Field label="Tổ dân phố" required>
          <Select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
            {branches.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </form>
  );
};
