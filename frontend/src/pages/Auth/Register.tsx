import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
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
  const [success, setSuccess] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#e8732c]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#1e3a5f]/10 blur-[100px] pointer-events-none" />
      <div className="w-full max-w-md z-10 glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#e8732c]" />
          Đăng ký tài khoản
        </h2>
        {error && (
          <div className="bg-rose-900/30 border border-rose-800 text-rose-300 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
            <UserCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-white font-bold text-base">Đăng ký thành công!</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tài khoản của bạn đang chờ quản trị viên phê duyệt.<br />
            Vui lòng liên hệ admin hoặc thử đăng nhập lại sau.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-2 text-xs bg-[#e8732c] hover:bg-[#f5882e] text-white font-bold py-2 px-6 rounded-xl transition"
          >
            Quay lại đăng nhập
          </button>
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
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e8732c] transition"
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
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e8732c] transition"
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
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#e8732c] transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e8732c] hover:bg-[#f5882e] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition active:scale-[0.98] shadow-lg shadow-[#e8732c]/10"
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
