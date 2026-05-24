import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Mail, Shield, Save, Key, Camera } from 'lucide-react';
import { Header } from '../../components/Header';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.put(`/users/${user?.id}`, { name: formData.name });
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể cập nhật hồ sơ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#070b13] overflow-y-auto custom-scrollbar">
      <Header />
      
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Hồ sơ Của bạn</h1>
          <p className="text-slate-400 mt-2">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-yellow-600/20 to-transparent"></div>
              
              <div className="relative group mt-4">
                <div className="w-32 h-32 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center text-5xl text-yellow-500 font-bold shadow-xl relative z-10">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-full flex items-center justify-center shadow-lg transition z-20 group-hover:scale-110">
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-white mt-6">{user?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-yellow-500 font-semibold mt-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                <Shield className="w-4 h-4" />
                {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </div>
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-2 space-y-8">
            {message && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <Info className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            {/* General Info Form */}
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-yellow-500" />
                Thông tin chung
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-slate-400 mb-2 block">Họ và Tên</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-400 mb-2 block">Thư điện tử (Email)</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Email được dùng để đăng nhập và không thể thay đổi.</p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition disabled:opacity-50 shadow-lg shadow-yellow-500/20"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Đang lưu...' : 'Lưu Thay đổi'}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Form */}
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-slate-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-500" />
                Đổi mật khẩu
              </h3>
              
              <form className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-slate-400 mb-2 block">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-400 mb-2 block">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-400 mb-2 block">Nhập lại mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg"
                  >
                    Cập nhật Mật khẩu
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Also import Info for the message box
import { Info } from 'lucide-react';

export default ProfilePage;
