import React, { useState } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../components/ThemeProvider';
import { useFeedback } from '../../hooks/useFeedback';
import {
  readStoredPhone,
  useAssignedCustomerCount,
  useProfile,
  type ProfileFormValues,
} from '../../hooks/useProfile';
import {
  useNotificationPreferences,
  AccountSidebar,
  AppearanceTab,
  NotificationsTab,
  ProfileTab,
  SecurityTab,
} from '../../components/Settings';

type TabKey = 'profile' | 'account' | 'appearance' | 'notifications';

const TABS: { id: TabKey; label: string }[] = [
  { id: 'profile', label: 'Hồ sơ cá nhân' },
  { id: 'account', label: 'Bảo mật' },
  { id: 'appearance', label: 'Giao diện' },
  { id: 'notifications', label: 'Thông báo' },
];

const getInitials = (name?: string): string => {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Trang Cài đặt — chỉ còn nhiệm vụ điều phối.
 *
 * Mỗi tab tự giữ state của riêng nó (form mật khẩu nằm trong SecurityTab, lỗi
 * ảnh đại diện nằm trong ProfileTab), nên trang này không còn ôm hơn mười biến
 * state rời rạc và không phải vẽ lại toàn bộ mỗi khi người dùng gõ một ký tự.
 */
export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { updateProfile, changePassword, uploadAvatar, removeAvatar } = useProfile();
  const { data: assignedCount } = useAssignedCustomerCount();
  const { preferences, setPreference } = useNotificationPreferences();
  const { feedback, showSuccess, showErrorFrom, clear } = useFeedback();

  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  // AuthProvider chỉ render children sau khi đã đọc xong phiên đăng nhập, nên
  // `user` đã sẵn sàng ngay lần render đầu. Khởi tạo thẳng từ đó thay vì đồng bộ
  // lại trong useEffect — cách cũ vừa gây render thừa vừa không khôi phục được
  // giá trị khi người dùng xoá trắng ô rồi bấm Hủy.
  const [profileValues, setProfileValues] = useState<ProfileFormValues>({
    name: user?.name ?? '',
    phone: readStoredPhone(),
  });

  const handleSaveProfile = async () => {
    clear();
    try {
      await updateProfile.mutateAsync(profileValues);
      showSuccess('Cập nhật hồ sơ cá nhân thành công!');
    } catch (err) {
      showErrorFrom(err, 'Không thể lưu hồ sơ. Vui lòng thử lại.');
    }
  };

  const handleResetProfile = () => {
    clear();
    setProfileValues({ name: user?.name ?? '', phone: readStoredPhone() });
  };

  const handleUploadAvatar = async (file: File) => {
    clear();
    await uploadAvatar.mutateAsync(file);
    showSuccess('Ảnh đại diện đã được cập nhật thành công!');
  };

  const handleRemoveAvatar = async () => {
    clear();
    await removeAvatar.mutateAsync();
    showSuccess('Đã xóa ảnh đại diện thành công.');
  };

  const avatarUrl = user?.avatar_url ?? user?.avatarUrl ?? null;
  const isAvatarBusy = uploadAvatar.isPending || removeAvatar.isPending;

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 p-5 max-w-[1240px] mx-auto w-full min-h-0 text-[13px] text-[#1c1b19] dark:text-[#f2f0ed]">
        <div className="flex flex-col gap-1">
          <h1 className="text-[19px] font-semibold tracking-[-0.01em] text-[#1c1b19] dark:text-white">
            Cài đặt tài khoản
          </h1>
          <p className="text-xs text-[#7d7a73] dark:text-[#97938c]">
            Thông tin cá nhân, bảo mật và tuỳ chọn hiển thị
          </p>
        </div>

        {/* Băng thông báo mang theo loại thành công/lỗi, nên câu báo lỗi không còn
            hiện trong khung màu xanh kèm dấu tích như trước. */}
        <Alert feedback={feedback} onDismiss={clear} />

        <div className="flex items-center gap-5 border-b border-[#e6e4e0] dark:border-[#332f2c] overflow-x-auto select-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center h-[38px] px-1 text-[13px] transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-[#e8732c] font-semibold text-[#1c1b19] dark:text-white'
                    : 'border-transparent text-[#7d7a73] dark:text-[#97938c] hover:text-[#1c1b19] dark:hover:text-white font-normal'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start pt-1">
          <div className="flex flex-col gap-4">
            {activeTab === 'profile' && (
              <ProfileTab
                values={profileValues}
                onChange={setProfileValues}
                email={user?.email ?? ''}
                avatarUrl={avatarUrl}
                initials={getInitials(profileValues.name || user?.name)}
                isSaving={updateProfile.isPending}
                isAvatarBusy={isAvatarBusy}
                onSubmit={handleSaveProfile}
                onReset={handleResetProfile}
                onUploadAvatar={handleUploadAvatar}
                onRemoveAvatar={handleRemoveAvatar}
              />
            )}

            {activeTab === 'account' && (
              <SecurityTab
                isSubmitting={changePassword.isPending}
                onChangePassword={(values) => changePassword.mutateAsync(values).then(() => undefined)}
              />
            )}

            {activeTab === 'appearance' && (
              <AppearanceTab theme={theme} onSelectTheme={setTheme} />
            )}

            {activeTab === 'notifications' && (
              <NotificationsTab preferences={preferences} onChange={setPreference} />
            )}
          </div>

          <AccountSidebar
            role={user?.role}
            approved={user?.approved}
            assignedCount={assignedCount ?? null}
            preferences={preferences}
            onPreferenceChange={setPreference}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
