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
      subtitle={
        success
          ? undefined
          : 'Tài khoản mới cần Quản trị viên phê duyệt trước khi sử dụng.'
      }
      showSocial={!success}
      socialDividerText="Hoặc đăng ký với"
      footer={
        <p>
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="cursor-pointer font-semibold text-slate-900 transition hover:underline"
          >
            Đăng nhập
          </button>
        </p>
      }
    >
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] text-rose-700 animate-fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" strokeWidth={1.8} />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="text-center py-2 animate-fade-in">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Check className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1.5">
            Đăng ký thành công
          </h3>
          <p className="text-[13.5px] leading-relaxed text-slate-500 mb-6">
            Thông tin tài khoản đã được ghi nhận vào hệ thống và đang chờ phê duyệt. Vui lòng quay lại đăng nhập sau khi được kích hoạt.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className={authButtonClass}
          >
            Về trang đăng nhập
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className={`${authButtonClass} mt-2`}
          >
            {loading ? 'Đang tạo…' : 'Tạo tài khoản'}
          </button>
        </form>
      )}
    </AuthShell>
  );
};
