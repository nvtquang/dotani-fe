import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Field, Input, Select } from '../../components/ui';
import type { ProfileFormValues } from '../../services/memberService';
import type { Member } from '../../types/member';
import { applyApiErrors, optionalEmailSchema, optionalText, pastDateSchema, phoneSchema, requiredText } from '../../utils/forms';

const schema = z.object({
  fullName: requiredText('họ tên'),
  email: optionalEmailSchema,
  phone: phoneSchema,
  dateOfBirth: pastDateSchema('Ngày sinh'),
  gender: z.enum(['', 'MALE', 'FEMALE', 'OTHER']),
  address: optionalText(500),
});

type Values = z.infer<typeof schema>;

const toValues = (member: Member): Values => ({
  fullName: member.fullName,
  email: member.email ?? '',
  phone: member.phone ?? '',
  dateOfBirth: member.dateOfBirth ?? '',
  gender: member.gender ?? '',
  address: member.address ?? '',
});

type ProfileFormProps = {
  member: Member;
  /** throw to show the API error */
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  onError: (message: string) => void;
};

export const ProfileForm = ({ member, onSubmit, onError }: ProfileFormProps) => {
  const { register, handleSubmit, reset, setError, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(member) });
  const errors = formState.errors;

  useEffect(() => reset(toValues(member)), [member, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (caught) {
      onError(applyApiErrors(caught, setError, 'Không thể lưu hồ sơ'));
    }
  });

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
      <Field label="Họ tên" required error={errors.fullName?.message} className="sm:col-span-2">
        <Input autoComplete="name" {...register('fullName')} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" {...register('email')} />
      </Field>
      <Field label="Số điện thoại" error={errors.phone?.message}>
        <Input type="tel" autoComplete="tel" inputMode="tel" {...register('phone')} />
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
      <Field label="Địa chỉ" error={errors.address?.message} className="sm:col-span-2">
        <Input autoComplete="street-address" {...register('address')} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={formState.isSubmitting} disabled={!formState.isDirty}>
          Lưu thông tin
        </Button>
      </div>
    </form>
  );
};
