import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Mail, Shield, Save, Key, Camera, Info, Loader2 } from 'lucide-react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { PasswordInput } from '../../components/common/PasswordInput';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  useEffect(() => {
    // Đồng bộ dữ liệu mới nhất từ server
    const fetchLatestProfile = async () => {
      if (user?.id) {
        try {
          const response = await api.get(`/users/${user.id}`);
          if (response.data && (response.data.name !== user.name || response.data.avatar_url !== user.avatar_url)) {
            updateUser(response.data);
          }
        } catch (err) {
          console.error('Không thể lấy thông tin mới nhất', err);
        }
      }
    };
    
    fetchLatestProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount hoặc khi load lại trang

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn tệp hình ảnh hợp lệ (JPEG, PNG, WebP).' });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post(`/users/${user.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newAvatarUrl = res.data.avatar_url;
      updateUser({
        avatar_url: newAvatarUrl,
        avatarUrl: newAvatarUrl
      });
      setMessage({ type: 'success', text: 'Đã cập nhật ảnh đại diện.' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Lỗi upload avatar:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Không thể tải ảnh đại diện lên.' });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.put(`/users/${user?.id}`, { name: formData.name });
      setMessage({ type: 'success', text: 'Đã cập nhật hồ sơ.' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể cập nhật hồ sơ' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại.' });
      return;
    }
    if (!passwords.new || passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp hoặc bị trống.' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    try {
      await api.patch(`/users/${user?.id}/reset-password`, { 
        currentPassword: passwords.current,
        newPassword: passwords.new 
      });
      setMessage({ type: 'success', text: 'Đã đổi mật khẩu.' });
      setPasswords({ current: '', new: '', confirm: '' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Không thể cập nhật mật khẩu';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout isAdminPage={user?.role === 'admin'}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-fg dark:text-fg tracking-tight">Hồ sơ của bạn</h1>
          <p className="text-xs text-fg-subtle dark:text-fg-subtle mt-1">Quản lý thông tin tài khoản cá nhân và cài đặt bảo mật.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface dark:bg-panel p-8 rounded-2xl border border-line dark:border-line flex flex-col items-center text-center shadow-2xs relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand/15 to-transparent"></div>
              
              <div className="relative group mt-2">
                <div className="w-28 h-28 rounded-full bg-raised dark:bg-surface border-4 border-line dark:border-line flex items-center justify-center text-4xl text-brand font-bold shadow-md relative z-10 overflow-hidden">
                  {user?.avatar_url || user?.avatarUrl ? (
                    <img src={user.avatar_url || user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label 
                  className={`absolute bottom-0 right-0 w-9 h-9 bg-brand hover:bg-brand-hover text-white rounded-full flex items-center justify-center shadow-md transition z-20 group-hover:scale-105 ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="Thay đổi ảnh đại diện"
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
                </label>
              </div>

              <h2 className="text-lg font-bold text-fg dark:text-fg mt-5">{user?.name}</h2>
              <div className="flex items-center gap-2 text-xs text-brand font-semibold mt-2 px-3 py-1 bg-brand/10 rounded-full border border-brand/20">
                <Shield className="w-3.5 h-3.5" />
                {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </div>
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-2 space-y-6">
            {message && (
              <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-medium ${
                message.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400'
              }`}>
                <Info className="w-4 h-4 shrink-0" />
                <p>{message.text}</p>
              </div>
            )}

            {/* General Info Form */}
            <div className="bg-surface dark:bg-panel p-6 sm:p-7 rounded-2xl border border-line dark:border-line shadow-2xs">
              <h3 className="text-base font-bold text-fg dark:text-fg mb-5 pb-3 border-b border-divider dark:border-divider flex items-center gap-2">
                <User className="w-4 h-4 text-brand" />
                Thông tin chung
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Họ và tên</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-surface dark:bg-surface border border-line dark:border-line rounded-xl px-4 py-2.5 text-xs text-fg dark:text-fg placeholder:text-fg-faint dark:placeholder:text-fg-faint focus:outline-none focus:border-brand dark:focus:border-brand transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Thư điện tử (Email)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint dark:text-fg-faint" />
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full bg-surface-alt dark:bg-canvas border border-line dark:border-line rounded-xl pl-10 pr-4 py-2.5 text-xs text-fg-subtle dark:text-fg-subtle cursor-not-allowed shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-fg-faint dark:text-fg-faint mt-1.5">Email được dùng để đăng nhập và không thể thay đổi.</p>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition disabled:opacity-50 shadow-2xs cursor-pointer active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Đang lưu...' : 'Lưu Thay đổi'}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Form */}
            <div className="bg-surface dark:bg-panel p-6 sm:p-7 rounded-2xl border border-line dark:border-line shadow-2xs">
              <h3 className="text-base font-bold text-fg dark:text-fg mb-5 pb-3 border-b border-divider dark:border-divider flex items-center gap-2">
                <Key className="w-4 h-4 text-brand" />
                Đổi mật khẩu
              </h3>
              
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Mật khẩu hiện tại</label>
                  <PasswordInput
                    size="md"
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    className="w-full bg-surface dark:bg-surface border border-line dark:border-line rounded-xl pl-4 pr-10 py-2.5 text-xs text-fg dark:text-fg focus:outline-none focus:border-brand dark:focus:border-brand transition shadow-2xs"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Mật khẩu mới</label>
                    <PasswordInput
                      size="md"
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      className="w-full bg-surface dark:bg-surface border border-line dark:border-line rounded-xl pl-4 pr-10 py-2.5 text-xs text-fg dark:text-fg focus:outline-none focus:border-brand dark:focus:border-brand transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Nhập lại mật khẩu mới</label>
                    <PasswordInput
                      size="md"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      className="w-full bg-surface dark:bg-surface border border-line dark:border-line rounded-xl pl-4 pr-10 py-2.5 text-xs text-fg dark:text-fg focus:outline-none focus:border-brand dark:focus:border-brand transition shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition disabled:opacity-50 shadow-2xs cursor-pointer active:scale-98"
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;

