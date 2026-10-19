import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { PasswordChecklist } from '../../components/common/PasswordChecklist';
import { PASSWORD_MIN_LENGTH, firstPasswordIssue, isPasswordValid } from '../../utils/password';
import { PasswordInput } from '../../components/common/PasswordInput';
import { AuthShell, authInputClass, authLabelClass, authButtonClass } from '../../components/common/AuthShell';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Máy chủ mới là nơi thực sự từ chối mật khẩu yếu; chặn ở đây chỉ để người
  // dùng không phải chờ một vòng mạng mới biết mình thiếu điều kiện nào.
  const passwordOwner = { email: form.email, name: form.name };
  const canSubmit = isPasswordValid(form.password, passwordOwner);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const issue = firstPasswordIssue(form.password, passwordOwner);
    if (issue) {
      setError(issue);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={success ? 'Đã gửi yêu cầu' : 'Tạo tài khoản'}
      subtitle={success ? undefined : 'Tài khoản mới cần quản trị viên phê duyệt trước khi dùng.'}
      footer={
        <>
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="cursor-pointer font-medium text-fg underline decoration-line-strong underline-offset-4 transition hover:decoration-fg"
          >
            Quay lại đăng nhập
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-control border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] text-rose-700 animate-fade-in">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="animate-fade-in">
          <div className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Check className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <p className="text-[13.5px] leading-relaxed text-fg-body">
              Tài khoản của bạn đã được ghi nhận và đang chờ quản trị viên phê duyệt. Hãy đăng nhập lại sau khi
              được kích hoạt.
            </p>
          </div>
          <button type="button" onClick={() => navigate('/login')} className={`${authButtonClass} mt-6`}>
            Về trang đăng nhập
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="reg-name" className={authLabelClass}>Họ và tên</label>
            <input
              id="reg-name"
              type="text"
              name="name"
              required
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              className={authInputClass}
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className={authLabelClass}>Email công việc</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className={authInputClass}
              placeholder="ten@congty.vn"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className={authLabelClass}>Mật khẩu</label>
            <PasswordInput
              id="reg-password"
              size="lg"
              name="password"
              required
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              value={form.password}
              onChange={handleChange}
              className={`${authInputClass} pr-11`}
              placeholder={`Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`}
            />
            <PasswordChecklist password={form.password} owner={passwordOwner} />
          </div>

          <button type="submit" disabled={loading || !canSubmit} className={`${authButtonClass} mt-2`}>
            {loading ? 'Đang tạo…' : 'Tạo tài khoản'}
          </button>
        </form>
      )}
    </AuthShell>
  );
};
