import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Field, Input } from '../components/ui';
import { authService } from '../services/authService';
import { applyApiErrors, emailSchema } from '../utils/forms';

const schema = z.object({ email: emailSchema });

export const ForgotPasswordPage = () => {
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setError: setFieldError, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await authService.forgotPassword(email);
      setIsSent(true);
    } catch (caught) {
      setError(applyApiErrors(caught, setFieldError, 'Không gửi được yêu cầu'));
    }
  });

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Quên mật khẩu</h1>
      {isSent ? (
        <Alert tone="info" className="mt-4">
          Nếu email này đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút. Liên kết có hiệu lực 30 phút và chỉ dùng
          được một lần.
        </Alert>
      ) : (
        <form className="mt-4 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <p className="text-sm text-slate-600">Nhập email đăng ký tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
          {error && <Alert>{error}</Alert>}
          <Field label="Email" error={formState.errors.email?.message}>
            <Input type="email" autoComplete="email" inputMode="email" {...register('email')} />
          </Field>
          <Button type="submit" size="lg" loading={formState.isSubmitting}>
            Gửi liên kết
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link className="font-semibold text-brand-700 hover:underline" to="/login">
          Quay lại đăng nhập
        </Link>
      </p>
    </>
  );
};
