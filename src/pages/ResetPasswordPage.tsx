import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { toApiError } from '../utils/apiError';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setIsSaving(true);
    try {
      await authService.resetPassword(token, newPassword);
      setIsDone(true);
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không đặt lại được mật khẩu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <p className="page-eyebrow">DOTANI Thượng Cát</p>
      <h1 className="page-title">Đặt lại mật khẩu</h1>
      {!token ? (
        <div className="error-box section-gap">Liên kết không hợp lệ. Vui lòng yêu cầu liên kết mới.</div>
      ) : isDone ? (
        <div className="success-box section-gap" role="status">
          Đã đặt lại mật khẩu. Mọi thiết bị đã được đăng xuất, hãy đăng nhập bằng mật khẩu mới.
        </div>
      ) : (
        <form className="form-stack section-gap" onSubmit={onSubmit}>
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
          <button className="primary-button" type="submit" disabled={isSaving}>
            Đặt mật khẩu mới
          </button>
        </form>
      )}
      <Link className="text-action section-gap" to={isDone ? '/login' : '/forgot-password'}>
        {isDone ? 'Đến trang đăng nhập' : 'Yêu cầu liên kết mới'}
      </Link>
    </>
  );
};
