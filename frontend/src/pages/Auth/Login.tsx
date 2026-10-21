import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { PasswordInput } from '../../components/common/PasswordInput';
import { AuthShell, authInputClass, authLabelClass, authButtonClass } from '../../components/common/AuthShell';
import { useNotifyStore } from '../../lib/notify';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
    } catch (err: unknown) {
      console.error(err);
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Đăng nhập thất bại. Kiểm tra lại thông tin kết nối database.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    useNotifyStore
      .getState()
      .push('info', 'Vui lòng liên hệ Quản trị viên (Admin) để hỗ trợ đặt lại mật khẩu cho tài khoản nội bộ.');
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Dùng email công việc để vào hệ thống."
      footer={
        <p>
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="cursor-pointer font-semibold text-slate-900 transition hover:underline"
          >
            Đăng ký tài khoản
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className={authLabelClass}>
            Email hoặc tên đăng nhập
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            placeholder="ten@congty.vn"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="text-[13px] font-medium text-slate-800">
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="cursor-pointer text-[12.5px] font-normal text-slate-500 transition hover:text-slate-900"
            >
              Quên mật khẩu?
            </button>
          </div>
          <PasswordInput
            id="login-password"
            size="lg"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${authInputClass} pr-11`}
            placeholder="Nhập mật khẩu của bạn"
          />
        </div>

        <button type="submit" disabled={loading} className={`${authButtonClass} mt-2`}>
          {loading ? 'Đang xác thực…' : 'Đăng nhập'}
        </button>
      </form>
    </AuthShell>
  );
};
