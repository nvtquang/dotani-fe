import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { env } from '../api/config';
import { Alert, Button, Field, Input, Select } from '../components/ui';
import { usePublicOrganizations } from '../hooks/useOrganizations';
import { useAuth } from '../stores/AuthContext';
import { applyApiErrors, pastDateSchema, phoneSchema, requiredText } from '../utils/forms';

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | number | boolean>) => void;
        };
      };
    };
  }
}

const googleScriptId = 'google-identity-services';

const loadGoogleScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existingScript = document.getElementById(googleScriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Không thể tải Google Identity Services')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = googleScriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không thể tải Google Identity Services'));
    document.head.appendChild(script);
  });

const decodeGoogleName = (credential: string) => {
  try {
    const payload = credential.split('.')[1];
    if (!payload) {
      return '';
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const bytes = Uint8Array.from(window.atob(padded), (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return typeof parsed.name === 'string' ? parsed.name : '';
  } catch {
    return '';
  }
};

const loginSchema = z.object({
  usernameOrEmail: requiredText('tài khoản hoặc email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

const googleSchema = z.object({
  fullName: requiredText('họ tên'),
  organizationId: z.string().min(1, 'Vui lòng chọn tổ dân phố'),
  phone: phoneSchema.min(1, 'Vui lòng nhập số điện thoại'),
  dateOfBirth: z.string().min(1, 'Vui lòng chọn ngày sinh').pipe(pastDateSchema('Ngày sinh')),
});

type LoginValues = z.infer<typeof loginSchema>;
type GoogleValues = z.infer<typeof googleSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const organizationsQuery = usePublicOrganizations();
  const organizations = (organizationsQuery.data ?? []).filter((organization) => organization.type === 'YOUTH_UNION_BRANCH');
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [googleCredential, setGoogleCredential] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { usernameOrEmail: '', password: '' } });
  const googleForm = useForm<GoogleValues>({
    resolver: zodResolver(googleSchema),
    defaultValues: { fullName: '', organizationId: '', phone: '', dateOfBirth: '' },
  });

  const destination = typeof location.state?.from?.pathname === 'string' ? location.state.from.pathname : '/dashboard';

  useEffect(() => {
    if (!env.googleClientId || !googleButtonRef.current) {
      return;
    }
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !googleButtonRef.current) {
          return;
        }
        window.google.accounts.id.initialize({
          client_id: env.googleClientId,
          callback: (response) => {
            const credential = response.credential;
            if (!credential) {
              setError('Google không trả về thông tin đăng nhập.');
              return;
            }
            setError(null);
            setGoogleCredential(credential);
            if (!googleForm.getValues('fullName')) {
              googleForm.setValue('fullName', decodeGoogleName(credential));
            }
          },
        });
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: Math.min(320, googleButtonRef.current.clientWidth || 320),
          locale: 'vi',
        });
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Không thể tải đăng nhập Google'));
    return () => {
      cancelled = true;
    };
  }, [googleForm]);

  useEffect(() => {
    if (organizations.length && !googleForm.getValues('organizationId')) {
      googleForm.setValue('organizationId', organizations[0].id);
    }
  }, [organizations, googleForm]);

  const onLogin = loginForm.handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(applyApiErrors(caught, loginForm.setError, 'Đăng nhập không thành công'));
    }
  });

  const onGoogle = googleForm.handleSubmit(async (values) => {
    setError(null);
    try {
      await loginWithGoogle({ idToken: googleCredential, ...values });
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(applyApiErrors(caught, googleForm.setError, 'Đăng nhập Google không thành công'));
    }
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const loginErrors = loginForm.formState.errors;
  const googleErrors = googleForm.formState.errors;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Đăng nhập</h1>
      <p className="mt-1 text-sm text-slate-600">Quản lý đoàn viên, sự kiện, thông báo và hoạt động Đoàn.</p>

      {error && <Alert className="mt-4">{error}</Alert>}

      <form className="mt-5 flex flex-col gap-4" onSubmit={onLogin} noValidate>
        <Field label="Tài khoản hoặc email" error={loginErrors.usernameOrEmail?.message}>
          <Input autoComplete="username" {...loginForm.register('usernameOrEmail')} />
        </Field>
        <Field label="Mật khẩu" error={loginErrors.password?.message}>
          <Input type="password" autoComplete="current-password" {...loginForm.register('password')} />
        </Field>
        <div className="-mt-2 text-right">
          <Link className="text-sm font-medium text-brand-700 hover:underline" to="/forgot-password">
            Quên mật khẩu?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loginForm.formState.isSubmitting}>
          Đăng nhập
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-600" role="separator">
        <span className="h-px flex-1 bg-slate-200" />
        hoặc
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {env.googleClientId ? (
        <div ref={googleButtonRef} className="flex min-h-11 justify-center" />
      ) : (
        <p className="text-center text-sm text-slate-600">Đăng nhập Google chưa được cấu hình.</p>
      )}

      {googleCredential && (
        <form className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-5" onSubmit={onGoogle} noValidate>
          <Alert tone="info">Đã xác thực Google. Hoàn thiện hồ sơ đoàn viên để tiếp tục.</Alert>
          <Field label="Họ tên" required error={googleErrors.fullName?.message}>
            <Input autoComplete="name" {...googleForm.register('fullName')} />
          </Field>
          <Field label="Tổ dân phố" required error={googleErrors.organizationId?.message}>
            <Select disabled={organizationsQuery.isLoading} {...googleForm.register('organizationId')}>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Số điện thoại" required error={googleErrors.phone?.message}>
            <Input type="tel" autoComplete="tel" inputMode="tel" {...googleForm.register('phone')} />
          </Field>
          <Field label="Ngày sinh" required error={googleErrors.dateOfBirth?.message}>
            <Input type="date" {...googleForm.register('dateOfBirth')} />
          </Field>
          <Button type="submit" size="lg" loading={googleForm.formState.isSubmitting}>
            Hoàn tất đăng nhập Google
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-700">
        Chưa có tài khoản?{' '}
        <Link className="font-semibold text-brand-700 hover:underline" to="/register">
          Đăng ký đoàn viên
        </Link>
      </p>
    </>
  );
};
