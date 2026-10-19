import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { PasswordInput } from '../../components/common/PasswordInput';
import { AuthShell, authInputClass, authLabelClass, authButtonClass } from '../../components/common/AuthShell';

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
      // Tài khoản chưa duyệt nay bị máy chủ chặn bằng 403 và không được cấp
      // token, nên nhánh đó rơi thẳng vào khối catch bên dưới. Trước đây máy chủ
      // vẫn trả token về rồi trông chờ đoạn mã này tự nguyện không dùng nó.
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
    } catch (err: unknown) {
      console.error(err);
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Đăng nhập thất bại. Kiểm tra lại thông tin kết nối database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Dùng email công việc để vào hệ thống."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="cursor-pointer font-medium text-fg underline decoration-line-strong underline-offset-4 transition hover:decoration-fg"
          >
            Đăng ký tài khoản
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className={authLabelClass}>Email</label>
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
          <label htmlFor="login-password" className={authLabelClass}>Mật khẩu</label>
          <PasswordInput
            id="login-password"
            size="lg"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${authInputClass} pr-11`}
            placeholder="Nhập mật khẩu"
          />
        </div>

        <button type="submit" disabled={loading} className={`${authButtonClass} mt-2`}>
          {loading ? 'Đang xác thực…' : 'Đăng nhập'}
        </button>
      </form>
    </AuthShell>
  );
};
