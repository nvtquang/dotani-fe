import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, Field, Input, useConfirm, useToast } from '../../components/ui';
import { authService } from '../../services/authService';
import { useAuth } from '../../stores/AuthContext';
import { applyApiErrors, passwordSchema } from '../../utils/forms';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' });

type Values = z.infer<typeof schema>;

export const SecuritySection = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { logoutEverywhere, user } = useAuth();
  const { register, handleSubmit, reset, setError, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const errors = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      reset();
      toast.success('Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.');
    } catch (caught) {
      toast.error(applyApiErrors(caught, setError, 'Không đổi được mật khẩu'));
    }
  });

  const onLogoutEverywhere = async () => {
    const ok = await confirm({
      title: 'Đăng xuất mọi thiết bị?',
      description: 'Tất cả phiên đăng nhập của tài khoản, kể cả thiết bị này, sẽ kết thúc.',
      confirmLabel: 'Đăng xuất tất cả',
      tone: 'danger',
    });
    if (!ok) {
      return;
    }
    await logoutEverywhere();
    navigate('/login', { replace: true });
  };

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Mật khẩu và phiên đăng nhập</h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit} noValidate>
        {/* lets password managers pair the new password with the account */}
        <input type="text" name="username" autoComplete="username" value={user?.username ?? ''} readOnly hidden />
        <Field label="Mật khẩu hiện tại" error={errors.currentPassword?.message} className="sm:col-span-2">
          <Input type="password" autoComplete="current-password" {...register('currentPassword')} />
        </Field>
        <Field label="Mật khẩu mới" hint="8-100 ký tự, có chữ và số" error={errors.newPassword?.message}>
          <Input type="password" autoComplete="new-password" {...register('newPassword')} />
        </Field>
        <Field label="Nhập lại mật khẩu mới" error={errors.confirmPassword?.message}>
          <Input type="password" autoComplete="new-password" {...register('confirmPassword')} />
        </Field>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" loading={formState.isSubmitting}>
            Đổi mật khẩu
          </Button>
          <Button variant="danger" onClick={onLogoutEverywhere}>
            Đăng xuất mọi thiết bị
          </Button>
        </div>
      </form>
    </Card>
  );
};
