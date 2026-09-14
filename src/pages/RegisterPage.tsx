import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePublicOrganizations } from '../hooks/useOrganizations';
import { useAuth } from '../stores/AuthContext';
import { toApiError } from '../utils/apiError';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const organizationsQuery = usePublicOrganizations();
  const organizations = (organizationsQuery.data ?? []).filter((organization) => organization.type === 'YOUTH_UNION_BRANCH');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedOrganizationId = organizationId || organizations[0]?.id || '';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!selectedOrganizationId) {
      setError('Vui lòng chọn tổ dân phố.');
      return;
    }

    try {
      await register({
        username,
        fullName,
        email,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        password,
        organizationId: selectedOrganizationId,
      });
      navigate('/dashboard', { replace: true });
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Đăng ký không thành công');
    }
  };

  return (
    <>
      <p className="page-eyebrow">Đăng ký đoàn viên</p>
      <h1 className="page-title">Tạo tài khoản</h1>
      <p className="page-description">Tài khoản đăng ký công khai chỉ được tạo quyền đoàn viên và phải thuộc một TDP.</p>
      <form className="form-stack section-gap" onSubmit={onSubmit}>
        <label>
          Họ tên
          <input
            autoComplete="name"
            maxLength={255}
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>
        <label>
          Tổ dân phố
          <select
            required
            disabled={organizationsQuery.isLoading || organizations.length === 0}
            value={selectedOrganizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
          >
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
        {organizationsQuery.isError && <div className="error-box">Không thể tải danh sách TDP. Vui lòng thử lại.</div>}
        <label>
          Tên đăng nhập
          <input
            autoComplete="username"
            minLength={3}
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Email
          <input
            autoComplete="email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Số điện thoại
          <input
            autoComplete="tel"
            maxLength={30}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label>
          Ngày sinh
          <input
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
        </label>
        <label>
          Mật khẩu
          <input
            autoComplete="new-password"
            minLength={8}
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-button" type="submit" disabled={isLoading || organizationsQuery.isLoading}>
          Đăng ký
        </button>
        <Link className="text-action" to="/login">
          Đã có tài khoản
        </Link>
      </form>
    </>
  );
};
