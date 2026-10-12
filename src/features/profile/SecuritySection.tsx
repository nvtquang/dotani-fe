import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../stores/AuthContext';
import { toApiError } from '../../utils/apiError';

export const SecuritySection = () => {
  const navigate = useNavigate();
  const { logoutEverywhere } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setIsSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.');
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không đổi được mật khẩu');
    } finally {
      setIsSaving(false);
    }
  };

  const onLogoutEverywhere = async () => {
    if (!window.confirm('Đăng xuất khỏi tất cả thiết bị, kể cả thiết bị này?')) {
      return;
    }
    await logoutEverywhere();
    navigate('/login', { replace: true });
  };

  return (
    <section className="surface">
      <p className="page-eyebrow">Bảo mật</p>
      <h2>Mật khẩu và phiên đăng nhập</h2>
      <form className="form-stack section-gap" onSubmit={onSubmit}>
        <label>
          Mật khẩu hiện tại
          <input
            autoComplete="current-password"
            required
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label>
          Mật khẩu mới (8-100 ký tự, có chữ và số)
          <input
            autoComplete="new-password"
            minLength={8}
            required
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <label>
          Nhập lại mật khẩu mới
          <input
            autoComplete="new-password"
            required
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        {error && <div className="error-box">{error}</div>}
        {success && (
          <div className="success-box" role="status" aria-live="polite">
            {success}
          </div>
        )}
        <div className="form-actions">
          <button className="primary-button inline-button" type="submit" disabled={isSaving}>
            Đổi mật khẩu
          </button>
          <button className="secondary-button inline-button" type="button" onClick={onLogoutEverywhere}>
            Đăng xuất mọi thiết bị
          </button>
        </div>
      </form>
    </section>
  );
};
