import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserCheck, Key, AlertCircle, TrendingUp } from 'lucide-react';
import api from '../../services/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      // Đăng ký thành công → chuyển hướng đến trang đăng nhập
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-yellow-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="w-full max-w-md z-10 glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-yellow-500" />
          Đăng ký tài khoản
        </h2>
        {error && (
          <div className="p-3 mb-4 rounded-xl text-xs bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Họ và tên *</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-500 transition"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Email *</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-500 transition"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Mật khẩu *</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-500 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition active:scale-[0.98] shadow-lg shadow-yellow-500/10"
          >
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Đã có tài khoản? Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};
