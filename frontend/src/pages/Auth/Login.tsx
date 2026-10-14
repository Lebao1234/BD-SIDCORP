import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Key, User as UserIcon, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { PasswordInput } from '../../components/common/PasswordInput';

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
    <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 relative overflow-hidden text-zinc-900">
      {/* Decorative Subtle Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#0284c7]/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#1e3a5f]/6 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-7 flex flex-col items-center">
          <div className="p-3.5 bg-white rounded-2xl shadow-lg shadow-zinc-200/60 border border-zinc-200/80 mb-3 transition hover:shadow-xl">
            <img src="/logo.png" alt="SIDCORP Logo" width="160" height="80" fetchPriority="high" className="w-40 h-20 object-contain" />
          </div>
          <p className="text-xs font-medium text-zinc-500 mt-1">
            Hệ thống quản trị khách hàng & trò chuyện nội bộ
          </p>
        </div>

        {/* Login Box - 100% Light Theme */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-zinc-200/70 border border-zinc-200/80">
          <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#0284c7]/10 text-[#0284c7]">
              <LogIn className="w-4.5 h-4.5" />
            </span>
            <span>Đăng nhập hệ thống</span>
          </h2>

          {error && (
            <div className="p-3.5 mb-5 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5 animate-fade-in font-medium">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                Tên đăng nhập (Email)
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4.5 h-4.5 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/15 transition shadow-2xs"
                  placeholder="Nhập địa chỉ email"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                Mật khẩu
              </label>
              <PasswordInput
                size="lg"
                leftIcon={<Key className="absolute left-3.5 top-3 w-4.5 h-4.5 text-zinc-400" />}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl pl-11 pr-11 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/15 transition shadow-2xs"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition active:scale-[0.98] shadow-md shadow-[#0284c7]/20 mt-6 cursor-pointer"
            >
              {loading ? 'Đang xác thực...' : 'Vào Hệ Thống'}
            </button>
          </form>

          {/* Link to registration */}
          <div className="mt-6 text-center pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); navigate('/register'); }}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:underline transition cursor-pointer"
            >
              Chưa có tài khoản? <span className="text-[#0284c7] font-semibold">Đăng ký ngay</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
