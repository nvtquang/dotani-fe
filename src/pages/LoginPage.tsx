import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { env } from '../api/config';
import { usePublicOrganizations } from '../hooks/useOrganizations';
import { useAuth } from '../stores/AuthContext';
import { toApiError } from '../utils/apiError';

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
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
      existingScript.addEventListener('error', () => reject(new Error('Không thể tải Google Identity Services')), {
        once: true,
      });
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
    const parsed = JSON.parse(window.atob(padded));
    return typeof parsed.name === 'string' ? parsed.name : '';
  } catch {
    return '';
  }
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const organizationsQuery = usePublicOrganizations();
  const organizations = (organizationsQuery.data ?? []).filter((organization) => organization.type === 'YOUTH_UNION_BRANCH');
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleCredential, setGoogleCredential] = useState('');
  const [googleFullName, setGoogleFullName] = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  const [googleDateOfBirth, setGoogleDateOfBirth] = useState('');
  const [googleOrganizationId, setGoogleOrganizationId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const selectedGoogleOrganizationId = googleOrganizationId || organizations[0]?.id || '';

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
            setGoogleFullName((current) => current || decodeGoogleName(credential));
          },
        });
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 320,
          locale: 'vi',
        });
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Không thể tải đăng nhập Google'));

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await login({ usernameOrEmail, password });
      const destination = typeof location.state?.from?.pathname === 'string' ? location.state.from.pathname : '/dashboard';
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Đăng nhập không thành công');
    }
  };

  const onGoogleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!googleCredential) {
      setError('Vui lòng đăng nhập Google trước.');
      return;
    }
    if (!selectedGoogleOrganizationId) {
      setError('Vui lòng chọn tổ dân phố.');
      return;
    }

    try {
      await loginWithGoogle({
        idToken: googleCredential,
        fullName: googleFullName,
        phone: googlePhone,
        dateOfBirth: googleDateOfBirth,
        organizationId: selectedGoogleOrganizationId,
      });
      const destination = typeof location.state?.from?.pathname === 'string' ? location.state.from.pathname : '/dashboard';
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Đăng nhập Google không thành công');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <p className="page-eyebrow">DOTANI Thượng Cát</p>
      <h1 className="page-title">Đăng nhập hệ thống</h1>
      <p className="page-description">Quản lý đoàn viên, sự kiện, thông báo và hoạt động Đoàn.</p>

      <div className="section-gap google-login-block">
        {env.googleClientId ? (
          <div ref={googleButtonRef} />
        ) : (
          <div className="error-box">Chưa cấu hình Google Client ID cho frontend.</div>
        )}
      </div>

      {googleCredential && (
        <form className="form-stack section-gap" onSubmit={onGoogleSubmit}>
          <div className="success-box">Đã xác thực Google. Vui lòng hoàn thiện hồ sơ đoàn viên.</div>
          <label>
            Họ tên
            <input
              autoComplete="name"
              maxLength={255}
              required
              value={googleFullName}
              onChange={(event) => setGoogleFullName(event.target.value)}
            />
          </label>
          <label>
            Tổ dân phố
            <select
              required
              disabled={organizationsQuery.isLoading || organizations.length === 0}
              value={selectedGoogleOrganizationId}
              onChange={(event) => setGoogleOrganizationId(event.target.value)}
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số điện thoại
            <input
              autoComplete="tel"
              maxLength={30}
              required
              value={googlePhone}
              onChange={(event) => setGooglePhone(event.target.value)}
            />
          </label>
          <label>
            Ngày sinh
            <input
              required
              type="date"
              value={googleDateOfBirth}
              onChange={(event) => setGoogleDateOfBirth(event.target.value)}
            />
          </label>
          <button className="primary-button" type="submit" disabled={isLoading || organizationsQuery.isLoading}>
            Hoàn tất đăng nhập Google
          </button>
        </form>
      )}

      <div className="auth-divider">hoặc đăng nhập bằng tài khoản hệ thống</div>

      <form className="form-stack section-gap" onSubmit={onSubmit}>
        <label>
          Tài khoản hoặc email
          <input
            autoComplete="username"
            required
            value={usernameOrEmail}
            onChange={(event) => setUsernameOrEmail(event.target.value)}
          />
        </label>
        <label>
          Mật khẩu
          <input
            autoComplete="current-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-button" type="submit" disabled={isLoading}>
          Đăng nhập
        </button>
        <Link className="text-action" to="/register">
          Tạo tài khoản đoàn viên
        </Link>
      </form>
    </>
  );
};
