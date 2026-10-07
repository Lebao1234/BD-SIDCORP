import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Mail, Shield, Save, Key, Camera, Info, Loader2, Eye, EyeOff } from 'lucide-react';
import { AppLayout } from '../../components/Layout/AppLayout';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
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
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
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
      setMessage({ type: 'success', text: 'Cập nhật mật khẩu thành công!' });
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f2f0ed] tracking-tight">Hồ sơ Của bạn</h1>
          <p className="text-xs text-gray-500 dark:text-[#8f8b84] mt-1">Quản lý thông tin tài khoản cá nhân và cài đặt bảo mật.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#1d1c19] p-8 rounded-2xl border border-gray-200 dark:border-[#332f2c] flex flex-col items-center text-center shadow-2xs relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[#e8732c]/15 to-transparent"></div>
              
              <div className="relative group mt-2">
                <div className="w-28 h-28 rounded-full bg-gray-100 dark:bg-[#232120] border-4 border-gray-200 dark:border-[#332f2c] flex items-center justify-center text-4xl text-[#e8732c] font-bold shadow-md relative z-10 overflow-hidden">
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
                  className={`absolute bottom-0 right-0 w-9 h-9 bg-[#e8732c] hover:bg-[#d66522] text-white rounded-full flex items-center justify-center shadow-md transition z-20 group-hover:scale-105 ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="Thay đổi ảnh đại diện"
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
                </label>
              </div>

              <h2 className="text-lg font-bold text-gray-900 dark:text-[#f2f0ed] mt-5">{user?.name}</h2>
              <div className="flex items-center gap-2 text-xs text-[#e8732c] font-semibold mt-2 px-3 py-1 bg-[#e8732c]/10 rounded-full border border-[#e8732c]/20">
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
            <div className="bg-white dark:bg-[#1d1c19] p-6 sm:p-7 rounded-2xl border border-gray-200 dark:border-[#332f2c] shadow-2xs">
              <h3 className="text-base font-bold text-gray-900 dark:text-[#f2f0ed] mb-5 pb-3 border-b border-gray-100 dark:border-[#2a2724] flex items-center gap-2">
                <User className="w-4 h-4 text-[#e8732c]" />
                Thông tin chung
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-[#a8a49d] mb-1.5 block">Họ và Tên</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-[#f2f0ed] placeholder:text-gray-400 dark:placeholder:text-[#7f7b74] focus:outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-[#a8a49d] mb-1.5 block">Thư điện tử (Email)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#7f7b74]" />
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full bg-gray-50 dark:bg-[#171614] border border-gray-200 dark:border-[#332f2c] rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-500 dark:text-[#8f8b84] cursor-not-allowed shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-[#7f7b74] mt-1.5">Email được dùng để đăng nhập và không thể thay đổi.</p>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#e8732c] hover:bg-[#d66522] text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition disabled:opacity-50 shadow-2xs cursor-pointer active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Đang lưu...' : 'Lưu Thay đổi'}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Form */}
            <div className="bg-white dark:bg-[#1d1c19] p-6 sm:p-7 rounded-2xl border border-gray-200 dark:border-[#332f2c] shadow-2xs">
              <h3 className="text-base font-bold text-gray-900 dark:text-[#f2f0ed] mb-5 pb-3 border-b border-gray-100 dark:border-[#2a2724] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#e8732c]" />
                Đổi mật khẩu
              </h3>
              
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-[#a8a49d] mb-1.5 block">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      className="w-full bg-white dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] rounded-xl pl-4 pr-10 py-2.5 text-xs text-gray-900 dark:text-[#f2f0ed] focus:outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(prev => !prev)}
                      tabIndex={-1}
                      className="absolute right-3 top-2.5 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-[#f2f0ed] transition cursor-pointer"
                      title={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-[#a8a49d] mb-1.5 block">Mật khẩu mới</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        className="w-full bg-white dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] rounded-xl pl-4 pr-10 py-2.5 text-xs text-gray-900 dark:text-[#f2f0ed] focus:outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(prev => !prev)}
                        tabIndex={-1}
                        className="absolute right-3 top-2.5 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-[#f2f0ed] transition cursor-pointer"
                        title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-[#a8a49d] mb-1.5 block">Nhập lại mật khẩu mới</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full bg-white dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] rounded-xl pl-4 pr-10 py-2.5 text-xs text-gray-900 dark:text-[#f2f0ed] focus:outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        tabIndex={-1}
                        className="absolute right-3 top-2.5 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-[#f2f0ed] transition cursor-pointer"
                        title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#e8732c] hover:bg-[#d66522] text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition disabled:opacity-50 shadow-2xs cursor-pointer active:scale-98"
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

