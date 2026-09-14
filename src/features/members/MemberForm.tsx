import { FormEvent, useEffect, useState } from 'react';
import type { Member, MemberFormValues, MemberStatus } from '../../types/member';
import type { OrganizationUnit } from '../../types/organization';
import { memberStatusLabel } from '../../utils/labels';

type MemberFormProps = {
  initialValue?: Member;
  organizations: OrganizationUnit[];
  fixedOrganizationId?: string | null;
  isSubmitting?: boolean;
  submitLabel: string;
  onSubmit: (values: MemberFormValues) => void;
  onCancel?: () => void;
};

const statusOptions: MemberStatus[] = ['ACTIVE', 'PENDING', 'INACTIVE'];

const toFormValues = (
  member: Member | undefined,
  defaultOrganizationId: string,
  fixedOrganizationId?: string | null,
): MemberFormValues => ({
  userId: member?.userId ?? '',
  fullName: member?.fullName ?? '',
  dateOfBirth: member?.dateOfBirth ?? '',
  gender: member?.gender ?? '',
  phone: member?.phone ?? '',
  email: member?.email ?? '',
  address: member?.address ?? '',
  avatarUrl: member?.avatarUrl ?? '',
  youthUnionJoinDate: member?.youthUnionJoinDate ?? '',
  memberStatus: member?.memberStatus ?? 'ACTIVE',
  organizationId: fixedOrganizationId ?? member?.organizationId ?? defaultOrganizationId,
});

export const MemberForm = ({
  initialValue,
  organizations,
  fixedOrganizationId,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: MemberFormProps) => {
  const defaultOrganizationId = organizations[0]?.id ?? fixedOrganizationId ?? '';
  const [values, setValues] = useState<MemberFormValues>(() =>
    toFormValues(initialValue, defaultOrganizationId, fixedOrganizationId),
  );

  useEffect(() => {
    setValues(toFormValues(initialValue, defaultOrganizationId, fixedOrganizationId));
  }, [defaultOrganizationId, fixedOrganizationId, initialValue]);

  const updateField = (field: keyof MemberFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form className="member-form" onSubmit={handleSubmit}>
      <label>
        Họ tên
        <input
          required
          maxLength={255}
          value={values.fullName}
          onChange={(event) => updateField('fullName', event.target.value)}
        />
      </label>

      <label>
        User ID
        <input
          maxLength={36}
          value={values.userId ?? ''}
          onChange={(event) => updateField('userId', event.target.value)}
        />
      </label>

      <label>
        Email
        <input
          type="email"
          maxLength={255}
          value={values.email ?? ''}
          onChange={(event) => updateField('email', event.target.value)}
        />
      </label>

      <label>
        Số điện thoại
        <input
          maxLength={30}
          value={values.phone ?? ''}
          onChange={(event) => updateField('phone', event.target.value)}
        />
      </label>

      <label>
        Ngày sinh
        <input
          type="date"
          value={values.dateOfBirth ?? ''}
          onChange={(event) => updateField('dateOfBirth', event.target.value)}
        />
      </label>

      <label>
        Giới tính
        <select value={values.gender ?? ''} onChange={(event) => updateField('gender', event.target.value)}>
          <option value="">Chưa chọn</option>
          <option value="MALE">Nam</option>
          <option value="FEMALE">Nữ</option>
          <option value="OTHER">Khác</option>
        </select>
      </label>

      <label>
        Tổ dân phố
        <select
          required
          disabled={Boolean(fixedOrganizationId)}
          value={values.organizationId}
          onChange={(event) => updateField('organizationId', event.target.value)}
        >
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Trạng thái
        <select
          value={values.memberStatus ?? 'ACTIVE'}
          onChange={(event) => updateField('memberStatus', event.target.value)}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {memberStatusLabel[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="form-wide">
        Địa chỉ
        <input
          maxLength={500}
          value={values.address ?? ''}
          onChange={(event) => updateField('address', event.target.value)}
        />
      </label>

      <label>
        Ngày vào Đoàn
        <input
          type="date"
          value={values.youthUnionJoinDate ?? ''}
          onChange={(event) => updateField('youthUnionJoinDate', event.target.value)}
        />
      </label>

      <label>
        Đường dẫn ảnh đại diện
        <input
          maxLength={1000}
          value={values.avatarUrl ?? ''}
          onChange={(event) => updateField('avatarUrl', event.target.value)}
        />
      </label>

      <div className="form-actions form-wide">
        {onCancel && (
          <button className="secondary-button inline-button" type="button" onClick={onCancel}>
            Hủy
          </button>
        )}
        <button className="primary-button inline-button" type="submit" disabled={isSubmitting}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
