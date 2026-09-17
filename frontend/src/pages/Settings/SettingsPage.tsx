import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../components/ThemeProvider';
import api from '../../services/api';
import {
  User,
  ShieldCheck,
  CreditCard,
  Paintbrush,
  Bell,
  Monitor,
  Plus,
  Trash2,
  Upload,
  Check,
  Moon,
  Sun,
  Laptop,
  Database,
  Server,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

type TabKey = 'profile' | 'account' | 'billing' | 'appearance' | 'notifications' | 'display';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  // Profile fields synchronized with DB
  const [username, setUsername] = useState(user?.name || '');
  const [selectedEmail, setSelectedEmail] = useState(user?.email || '');
  const [bio, setBio] = useState('Chuyên gia Tư vấn Quản trị & Giải pháp Chuyển đổi số CRM.');
  const [urls, setUrls] = useState<string[]>([
    'https://sidcorp.vn',
    'https://linkedin.com/company/sidcorp',
  ]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Sync state if user loads later
  useEffect(() => {
    if (user) {
      if (!username) setUsername(user.name || '');
      if (!selectedEmail) setSelectedEmail(user.email || '');
    }
  }, [user]);

  // Security / Account
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Notifications
  const [emailDigest, setEmailDigest] = useState(true);
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopNotif, setDesktopNotif] = useState(true);

  // Message alert
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleAddUrl = () => {
    setUrls([...urls, '']);
  };

  const handleUrlChange = (index: number, val: string) => {
    const updated = [...urls];
    updated[index] = val;
    setUrls(updated);
  };

  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSavingProfile(true);
    try {
      const res = await api.put(`/users/${user.id}`, {
        name: username.trim(),
        email: selectedEmail.trim(),
      });

      // Update in AuthContext & localStorage so header/sidebar updates immediately
      updateUser({
        name: res.data.name,
        email: res.data.email,
      });

      setSaveMsg('Cập nhật hồ sơ thành công vào cơ sở dữ liệu!');
      setTimeout(() => setSaveMsg(null), 3500);
    } catch (err: any) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      setSaveMsg(err.response?.data?.error || 'Không thể lưu hồ sơ. Vui lòng thử lại.');
      setTimeout(() => setSaveMsg(null), 3500);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới phải dài ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.patch(`/users/${user.id}/reset-password`, {
        currentPassword,
        newPassword,
      });

      setPasswordMsg({ type: 'success', text: 'Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật vào hệ thống.' });
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const tabs: { id: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
    { id: 'account', label: 'Tài khoản & Bảo mật', icon: ShieldCheck },
    { id: 'appearance', label: 'Giao diện', icon: Paintbrush },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'display', label: 'Hệ thống & Dữ liệu', icon: Monitor },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Page Title */}
        <div className="border-b border-gray-200 dark:border-[#332f2c] pb-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Cài đặt Hệ thống</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Quản lý thông tin tài khoản người dùng, bảo mật mật khẩu và cấu hình kết nối CRM.
          </p>
        </div>

        {saveMsg && (
          <div className="p-3.5 rounded-xl text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 animate-fade-in flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveMsg}</span>
          </div>
        )}

        {/* 2-Column Layout matching shadcn style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Left Vertical Sub-Navigation */}
          <nav className="flex flex-col gap-1">
            {tabs.map(tab => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-gray-100 dark:bg-[#282522] text-gray-900 dark:text-white font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#232120] hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Content Area */}
          <div className="md:col-span-3 bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#282522] border border-gray-200 dark:border-[#3a3532] flex items-center justify-center text-gray-400 overflow-hidden shrink-0 shadow-2xs">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition inline-flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Thay đổi ảnh đại diện</span>
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      JPG, PNG dung lượng dưới 2MB.
                    </p>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Họ và tên hiển thị *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs outline-none focus:border-gray-900 dark:focus:border-white transition shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Tên này sẽ hiển thị trên hệ thống CRM, dòng thời gian trao đổi và đề cập @mention.
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Email tài khoản *
                  </label>
                  <input
                    type="email"
                    required
                    value={selectedEmail}
                    onChange={e => setSelectedEmail(e.target.value)}
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs outline-none focus:border-gray-900 dark:focus:border-white transition shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Email dùng để đăng nhập và nhận thông báo công việc.
                  </p>
                </div>

                {/* Role (Read only from DB) */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Vai trò hệ thống
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-[#282522] border border-gray-200 dark:border-[#3a3532] text-gray-800 dark:text-gray-200 rounded-lg text-xs font-mono font-semibold">
                      {user?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Nhân viên (User)'}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Đã kích hoạt tài khoản
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Mô tả chuyên môn (Bio)
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs outline-none focus:border-gray-900 dark:focus:border-white transition shadow-2xs resize-none"
                  />
                </div>

                {/* URLs */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Liên kết cá nhân / Portfolio
                  </label>
                  <div className="space-y-2">
                    {urls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={url}
                          onChange={e => handleUrlChange(idx, e.target.value)}
                          placeholder="https://..."
                          className="flex-1 bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs outline-none focus:border-gray-900 dark:focus:border-white transition shadow-2xs"
                        />
                        {urls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUrl(idx)}
                            className="p-2 text-gray-400 hover:text-rose-500 rounded-xl transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium inline-flex items-center gap-1.5 transition cursor-pointer pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm liên kết</span>
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Đang lưu vào DB...' : 'Cập nhật hồ sơ'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: ACCOUNT & SECURITY */}
            {activeTab === 'account' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Bảo mật tài khoản</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Đổi mật khẩu định kỳ để bảo vệ dữ liệu khách hàng và thông tin kinh doanh.
                  </p>
                </div>

                {passwordMsg && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200'
                    }`}
                  >
                    {passwordMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs outline-none focus:border-gray-900 dark:focus:border-white transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Mật khẩu mới *
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs outline-none focus:border-gray-900 dark:focus:border-white transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Xác nhận mật khẩu mới *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs outline-none focus:border-gray-900 dark:focus:border-white transition shadow-2xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isUpdatingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Giao diện hiển thị</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Tùy chỉnh chủ đề sáng, tối hoặc theo cài đặt hệ điều hành của thiết bị.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Light */}
                  <div
                    onClick={() => setTheme('light')}
                    className={`border rounded-2xl p-4 cursor-pointer transition flex flex-col items-center gap-3 ${
                      theme === 'light'
                        ? 'border-gray-900 dark:border-white ring-2 ring-gray-900/10 dark:ring-white/10'
                        : 'border-gray-200 dark:border-[#332f2c] hover:border-gray-400'
                    }`}
                  >
                    <div className="w-full h-20 bg-gray-100 rounded-xl border border-gray-200 p-2 flex flex-col gap-1.5 justify-center">
                      <div className="w-3/4 h-2 bg-gray-300 rounded" />
                      <div className="w-1/2 h-2 bg-gray-200 rounded" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      <Sun className="w-3.5 h-3.5" />
                      <span>Chế độ Sáng</span>
                    </div>
                  </div>

                  {/* Dark */}
                  <div
                    onClick={() => setTheme('dark')}
                    className={`border rounded-2xl p-4 cursor-pointer transition flex flex-col items-center gap-3 ${
                      theme === 'dark'
                        ? 'border-gray-900 dark:border-white ring-2 ring-gray-900/10 dark:ring-white/10'
                        : 'border-gray-200 dark:border-[#332f2c] hover:border-gray-400'
                    }`}
                  >
                    <div className="w-full h-20 bg-[#171614] rounded-xl border border-[#332f2c] p-2 flex flex-col gap-1.5 justify-center">
                      <div className="w-3/4 h-2 bg-[#2d2927] rounded" />
                      <div className="w-1/2 h-2 bg-[#221f1e] rounded" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      <Moon className="w-3.5 h-3.5" />
                      <span>Chế độ Tối</span>
                    </div>
                  </div>

                  {/* System */}
                  <div
                    onClick={() => setTheme('luxury-dark')}
                    className={`border rounded-2xl p-4 cursor-pointer transition flex flex-col items-center gap-3 ${
                      theme === 'luxury-dark'
                        ? 'border-gray-900 dark:border-white ring-2 ring-gray-900/10 dark:ring-white/10'
                        : 'border-gray-200 dark:border-[#332f2c] hover:border-gray-400'
                    }`}
                  >
                    <div className="w-full h-20 bg-linear-to-r from-gray-100 to-[#171614] rounded-xl border border-gray-200 dark:border-[#332f2c] p-2 flex flex-col gap-1.5 justify-center">
                      <div className="w-3/4 h-2 bg-gray-400 rounded" />
                      <div className="w-1/2 h-2 bg-gray-300 rounded" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Hệ thống</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Cấu hình thông báo</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Kiểm soát cách thức bạn nhận thông báo và âm thanh nhắc việc.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-[#332f2c] cursor-pointer hover:bg-gray-50/50 dark:hover:bg-[#232120]/50 transition">
                    <div>
                      <div className="text-xs font-semibold text-gray-900 dark:text-white">Email nhắc việc định kỳ</div>
                      <div className="text-[11px] text-gray-500">Nhận báo cáo tổng hợp các công việc quá hạn mỗi sáng</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailDigest}
                      onChange={e => setEmailDigest(e.target.checked)}
                      className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-[#332f2c] cursor-pointer hover:bg-gray-50/50 dark:hover:bg-[#232120]/50 transition">
                    <div>
                      <div className="text-xs font-semibold text-gray-900 dark:text-white">Âm thanh nhắc thông báo</div>
                      <div className="text-[11px] text-gray-500">Phát âm thanh chuông khi có tin nhắn hoặc @mention mới</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={e => setSoundEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-[#332f2c] cursor-pointer hover:bg-gray-50/50 dark:hover:bg-[#232120]/50 transition">
                    <div>
                      <div className="text-xs font-semibold text-gray-900 dark:text-white">Thông báo đẩy trên màn hình (Desktop Push)</div>
                      <div className="text-[11px] text-gray-500">Hiển thị popup thông báo góc màn hình ngay cả khi thu nhỏ trình duyệt</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={desktopNotif}
                      onChange={e => setDesktopNotif(e.target.checked)}
                      className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB: DISPLAY / SYSTEM INFO */}
            {activeTab === 'display' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Hệ thống & Hạ tầng Dữ liệu</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Thông tin phiên bản kiến trúc cơ sở dữ liệu và kết nối thời gian thực.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">Cơ sở dữ liệu Quan hệ CRM</div>
                        <div className="text-[11px] text-gray-500">PostgreSQL · Prisma ORM (Quản lý Khách hàng, Tasks, Assets, Users)</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 font-semibold">Kết nối tốt</span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Server className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">Máy chủ Thông báo & Chat Realtime</div>
                        <div className="text-[11px] text-gray-500">Socket.io + MongoDB (Lưu trữ tin nhắn nội bộ & thông báo @mention)</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 font-semibold">Hoạt động</span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">Tài khoản & Phiên làm việc</div>
                        <div className="text-[11px] text-gray-500">Mã NV: USER-{String(user?.id || 1).padStart(3, '0')} · {user?.email}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
export default SettingsPage;
