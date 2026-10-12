import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { toApiError } from '../utils/apiError';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSending(true);
    try {
      await authService.forgotPassword(email.trim());
      setIsSent(true);
    } catch (caught) {
      setError(toApiError(caught).message ?? 'Không gửi được yêu cầu');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <p className="page-eyebrow">DOTANI Thượng Cát</p>
      <h1 className="page-title">Quên mật khẩu</h1>
      {isSent ? (
        <div className="success-box section-gap" role="status">
          Nếu email này đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút. Liên kết có hiệu lực 30
          phút và chỉ dùng được một lần.
        </div>
      ) : (
        <form className="form-stack section-gap" onSubmit={onSubmit}>
          <p className="page-description">Nhập email đăng ký tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
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
          {error && <div className="error-box">{error}</div>}
          <button className="primary-button" type="submit" disabled={isSending}>
            Gửi liên kết
          </button>
        </form>
      )}
      <Link className="text-action section-gap" to="/login">
        Quay lại đăng nhập
      </Link>
    </>
  );
};
