import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Field, Input, Select } from '../components/ui';
import { usePublicOrganizations } from '../hooks/useOrganizations';
import { useAuth } from '../stores/AuthContext';
import { applyApiErrors, emailSchema, passwordSchema, pastDateSchema, phoneSchema, requiredText } from '../utils/forms';

const schema = z.object({
  fullName: requiredText('họ tên'),
  organizationId: z.string().min(1, 'Vui lòng chọn tổ dân phố'),
  username: z
    .string()
    .trim()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(100, 'Tên đăng nhập tối đa 100 ký tự'),
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: pastDateSchema('Ngày sinh'),
  password: passwordSchema,
});

type Values = z.infer<typeof schema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();
  const organizationsQuery = usePublicOrganizations();
  const organizations = (organizationsQuery.data ?? []).filter((organization) => organization.type === 'YOUTH_UNION_BRANCH');
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setError: setFieldError, setValue, getValues, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', organizationId: '', username: '', email: '', phone: '', dateOfBirth: '', password: '' },
  });
  const errors = formState.errors;

  useEffect(() => {
    if (organizations.length && !getValues('organizationId')) {
      setValue('organizationId', organizations[0].id);
    }
  }, [organizations, getValues, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await registerAccount({
        ...values,
        phone: values.phone || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (caught) {
      setError(applyApiErrors(caught, setFieldError, 'Đăng ký không thành công'));
    }
  });

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Tạo tài khoản đoàn viên</h1>
      <p className="mt-1 text-sm text-slate-600">Tài khoản đăng ký công khai có quyền đoàn viên và thuộc một tổ dân phố.</p>

      {error && <Alert className="mt-4">{error}</Alert>}
      {organizationsQuery.isError && <Alert className="mt-4">Không thể tải danh sách TDP. Vui lòng thử lại.</Alert>}

      <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <Field label="Họ tên" required error={errors.fullName?.message}>
          <Input autoComplete="name" {...register('fullName')} />
        </Field>
        <Field label="Tổ dân phố" required error={errors.organizationId?.message}>
          <Select disabled={organizationsQuery.isLoading} {...register('organizationId')}>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tên đăng nhập" required error={errors.username?.message}>
          <Input autoComplete="username" autoCapitalize="none" {...register('username')} />
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" inputMode="email" {...register('email')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Số điện thoại" error={errors.phone?.message}>
            <Input type="tel" autoComplete="tel" inputMode="tel" {...register('phone')} />
          </Field>
          <Field label="Ngày sinh" error={errors.dateOfBirth?.message}>
            <Input type="date" {...register('dateOfBirth')} />
          </Field>
        </div>
        <Field label="Mật khẩu" required hint="8-100 ký tự, có chữ và số" error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Button type="submit" size="lg" loading={formState.isSubmitting} disabled={organizationsQuery.isLoading}>
          Đăng ký
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-700">
        Đã có tài khoản?{' '}
        <Link className="font-semibold text-brand-700 hover:underline" to="/login">
          Đăng nhập
        </Link>
      </p>
    </>
  );
};
