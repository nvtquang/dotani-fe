import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field, Input, Select } from '../../components/ui';
import type { Member, MemberFormValues, MemberStatus } from '../../types/member';
import type { OrganizationUnit } from '../../types/organization';
import { applyApiErrors, optionalEmailSchema, optionalText, pastDateSchema, phoneSchema, requiredText } from '../../utils/forms';
import { memberStatusLabel } from '../../utils/labels';

const statusOptions = Object.keys(memberStatusLabel) as MemberStatus[];

const schema = z.object({
  fullName: requiredText('họ tên'),
  email: optionalEmailSchema,
  phone: phoneSchema,
  dateOfBirth: pastDateSchema('Ngày sinh'),
  gender: z.enum(['', 'MALE', 'FEMALE', 'OTHER']),
  organizationId: z.string().min(1, 'Chọn tổ dân phố'),
  memberStatus: z.enum(statusOptions as [MemberStatus, ...MemberStatus[]]),
  address: optionalText(500),
  youthUnionJoinDate: pastDateSchema('Ngày vào Đoàn'),
  userId: optionalText(36),
});

type Values = z.infer<typeof schema>;

type MemberFormProps = {
  formId: string;
  initialValue?: Member;
  /** TDPs the officer may assign */
  organizations: OrganizationUnit[];
  fixedOrganizationId?: string | null;
  onSubmit: (values: MemberFormValues) => Promise<void>;
  onError: (message: string) => void;
};

/** Member fields; the hosting dialog renders the submit button with form={formId}. Roles are changed separately. */
export const MemberForm = ({ formId, initialValue, organizations, fixedOrganizationId, onSubmit, onError }: MemberFormProps) => {
  const { register, handleSubmit, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: initialValue?.fullName ?? '',
      email: initialValue?.email ?? '',
      phone: initialValue?.phone ?? '',
      dateOfBirth: initialValue?.dateOfBirth ?? '',
      gender: initialValue?.gender ?? '',
      organizationId: fixedOrganizationId ?? initialValue?.organizationId ?? organizations[0]?.id ?? '',
      memberStatus: initialValue?.memberStatus ?? 'ACTIVE',
      address: initialValue?.address ?? '',
      youthUnionJoinDate: initialValue?.youthUnionJoinDate ?? '',
      userId: initialValue?.userId ?? '',
    },
  });
  const errors = formState.errors;

  const submit = handleSubmit(async (values) => {
    try {
      // the avatar is managed by the member; keep whatever is stored
      await onSubmit({ ...values, organizationId: fixedOrganizationId ?? values.organizationId, avatarUrl: initialValue?.avatarUrl ?? '' });
    } catch (caught) {
      onError(applyApiErrors(caught, setError, 'Không lưu được đoàn viên'));
    }
  });

  return (
    <form id={formId} className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
      <Field label="Họ tên" required error={errors.fullName?.message} className="sm:col-span-2">
        <Input autoComplete="off" {...register('fullName')} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" inputMode="email" {...register('email')} />
      </Field>
      <Field label="Số điện thoại" error={errors.phone?.message}>
        <Input type="tel" inputMode="tel" {...register('phone')} />
      </Field>
      <Field label="Ngày sinh" error={errors.dateOfBirth?.message}>
        <Input type="date" {...register('dateOfBirth')} />
      </Field>
      <Field label="Giới tính" error={errors.gender?.message}>
        <Select {...register('gender')}>
          <option value="">Chưa chọn</option>
          <option value="MALE">Nam</option>
          <option value="FEMALE">Nữ</option>
          <option value="OTHER">Khác</option>
        </Select>
      </Field>
      <Field label="Tổ dân phố" required error={errors.organizationId?.message}>
        <Select disabled={Boolean(fixedOrganizationId)} {...register('organizationId')}>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Trạng thái" error={errors.memberStatus?.message}>
        <Select {...register('memberStatus')}>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {memberStatusLabel[status]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Ngày vào Đoàn" error={errors.youthUnionJoinDate?.message}>
        <Input type="date" {...register('youthUnionJoinDate')} />
      </Field>
      <Field label="Địa chỉ" error={errors.address?.message} className="sm:col-span-2">
        <Input {...register('address')} />
      </Field>
      <details className="sm:col-span-2">
        <summary className="text-sm font-medium text-slate-700">Nâng cao</summary>
        <Field label="Mã tài khoản (User ID)" hint="Chỉ điền khi cần gắn hồ sơ với một tài khoản có sẵn" error={errors.userId?.message} className="mt-3">
          <Input {...register('userId')} />
        </Field>
      </details>
    </form>
  );
};
