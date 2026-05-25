import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Key, User as UserIcon, AlertCircle } from 'lucide-react';
import logo from '../../assets/logo.png';
import api from '../../services/api';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      if(!user.approved) {
        setError('Tài khoản của bạn đang chờ duyệt. Vui lòng liên hệ quản trị viên.');
        return;
      }
      login(token, user);
      
    } catch (err: unknown) {
      console.error(err);
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Đăng nhập thất bại. Kiểm tra lại thông tin kết nối database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] px-4 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#e8732c]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#1e3a5f]/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-3 rounded-2xl text-white shadow-xl shadow-[#e8732c]/15 mb-3">
            <img src={logo} alt="Logo" className="w-40 h-20" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Hệ thống quản trị khách hàng & trò chuyện nội bộ</p>
        </div>

        {/* Login Box */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-[#e8732c]" />
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e8732c] transition"
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e8732c] transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e8732c] hover:bg-[#f5882e] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition active:scale-[0.98] shadow-lg shadow-[#e8732c]/10 mt-6"
            >
              {loading ? 'Đang xác thực...' : 'Vào Hệ Thống'}
            </button>
          </form>

          {/* Link to registration */}
          <div className="mt-6 text-center">
            <button
              onClick={(e) => { e.preventDefault(); navigate('/register'); }}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Chưa có tài khoản? Đăng ký ngay
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
