import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, User as UserIcon, AlertCircle, TrendingUp, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data;
      login(token, user);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Kiểm tra lại thông tin kết nối database.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrefill = (user: string) => {
    setUsername(user);
    setPassword('123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] px-4 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-yellow-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-yellow-600 p-3 rounded-2xl text-white shadow-xl shadow-yellow-500/15 mb-3">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">BD LightHuman</h1>
          <p className="text-xs text-slate-400 mt-1">Hệ thống quản trị khách hàng & trò chuyện nội bộ</p>
        </div>

        {/* Login Box */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-yellow-500" />
            Đăng nhập hệ thống
          </h2>

          {error && (
            <div className="p-3 mb-5 rounded-xl text-xs bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Tên đăng nhập (Username)</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-500 transition"
                  placeholder="Nhập username"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition active:scale-[0.98] shadow-lg shadow-yellow-500/10 mt-6"
            >
              {loading ? 'Đang xác thực...' : 'Vào Hệ Thống'}
            </button>
          </form>

          {/* Quick prefills for developer testing */}
          <div className="mt-8 pt-6 border-t border-slate-850">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
              ⚡ Tài khoản dùng thử nhanh (Mật khẩu: 123)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['an', 'binh', 'chi'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handlePrefill(u)}
                  className="bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 py-2 rounded-lg transition capitalize"
                >
                  {u === 'an' ? 'Nguyễn An' : u === 'binh' ? 'Trần Bình' : 'Lê Chi'}
                </button>
              ))}
            </div>
          </div>
          {/* Link to registration */}
          <div className="mt-6 text-center">
            <a
              href="/register"
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Chưa có tài khoản? Đăng ký ngay
            </a>
          </div>
        </div>

        {/* Warning if database might be unseeded */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Lần đầu chạy? DB sẽ tự động khởi tạo các tài khoản trên khi server hoạt động.
          </p>
        </div>
      </div>
    </div>
  );
};
