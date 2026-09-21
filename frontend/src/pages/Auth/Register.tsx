import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { PasswordChecklist } from '../../components/common/PasswordChecklist';
import { PASSWORD_MIN_LENGTH, firstPasswordIssue, isPasswordValid } from '../../utils/password';

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

  // Ép buộc giao diện sáng (Light theme) cho trang đăng ký, không dùng theme dark
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-luxury-dark');
    root.classList.add('light', 'theme-light');
    document.body.classList.remove('dark', 'theme-luxury-dark');
    document.body.classList.add('light', 'theme-light');

    return () => {
      const savedTheme = localStorage.getItem('app_theme') || 'light';
      if (savedTheme === 'dark' || savedTheme === 'luxury-dark') {
        root.classList.add('dark', 'theme-luxury-dark');
        root.classList.remove('theme-light', 'light');
        document.body.classList.add('dark', 'theme-luxury-dark');
        document.body.classList.remove('theme-light', 'light');
      }
    };
  }, []);

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
    <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 relative overflow-hidden text-zinc-900">
      {/* Decorative Subtle Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#e8732c]/8 blur-[120px] pointer-events-none" />
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

        {/* Register Box - 100% Light Theme */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-zinc-200/70 border border-zinc-200/80">
          <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#e8732c]/10 text-[#be5110]">
              <UserCheck className="w-4.5 h-4.5" />
            </span>
            <span>Đăng ký tài khoản</span>
          </h2>

          {error && (
            <div className="p-3.5 mb-5 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5 animate-fade-in font-medium">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center animate-fade-in">
              <div className="p-3.5 rounded-full bg-emerald-50 border border-emerald-200">
                <UserCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-zinc-900 font-bold text-base">Đăng ký thành công!</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Tài khoản của bạn đã được ghi nhận và đang chờ quản trị viên phê duyệt.<br />
                Vui lòng liên hệ admin hoặc thử đăng nhập lại sau khi được kích hoạt.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-2 text-xs bg-[#be5110] hover:bg-[#a3440b] text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md shadow-[#be5110]/20 cursor-pointer"
              >
                Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-[#be5110] focus:ring-2 focus:ring-[#be5110]/15 transition shadow-2xs"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Email làm việc *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-[#be5110] focus:ring-2 focus:ring-[#be5110]/15 transition shadow-2xs"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-[#be5110] focus:ring-2 focus:ring-[#be5110]/15 transition shadow-2xs"
                  placeholder="••••••••••"
                />
                <PasswordChecklist password={form.password} owner={passwordOwner} />
              </div>

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full bg-[#be5110] hover:bg-[#a3440b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl transition active:scale-[0.98] shadow-md shadow-[#be5110]/20 mt-6 cursor-pointer"
              >
                {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:underline transition cursor-pointer"
            >
              Đã có tài khoản? <span className="text-[#b8551a] font-semibold">Quay lại đăng nhập</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
