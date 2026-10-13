import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Field, Input } from '../components/ui';
import { authService } from '../services/authService';
import { applyApiErrors, passwordSchema } from '../utils/forms';

const schema = z
  .object({ newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((values) => values.newPassword === values.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' });

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setError: setFieldError, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    setError(null);
    try {
      await authService.resetPassword(token, newPassword);
      setIsDone(true);
    } catch (caught) {
      setError(applyApiErrors(caught, setFieldError, 'Không đặt lại được mật khẩu'));
    }
  });

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Đặt lại mật khẩu</h1>
      {!token ? (
        <Alert className="mt-4">Liên kết không hợp lệ. Vui lòng yêu cầu liên kết mới.</Alert>
      ) : isDone ? (
        <Alert tone="info" className="mt-4">
          Đã đặt lại mật khẩu. Mọi thiết bị đã được đăng xuất, hãy đăng nhập bằng mật khẩu mới.
        </Alert>
      ) : (
        <form className="mt-4 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          {error && <Alert>{error}</Alert>}
          <Field label="Mật khẩu mới" hint="8-100 ký tự, có chữ và số" error={formState.errors.newPassword?.message}>
            <Input type="password" autoComplete="new-password" {...register('newPassword')} />
          </Field>
          <Field label="Nhập lại mật khẩu mới" error={formState.errors.confirmPassword?.message}>
            <Input type="password" autoComplete="new-password" {...register('confirmPassword')} />
          </Field>
          <Button type="submit" size="lg" loading={formState.isSubmitting}>
            Đặt mật khẩu mới
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link className="font-semibold text-brand-700 hover:underline" to={isDone ? '/login' : '/forgot-password'}>
          {isDone ? 'Đến trang đăng nhập' : 'Yêu cầu liên kết mới'}
        </Link>
      </p>
    </>
  );
};
