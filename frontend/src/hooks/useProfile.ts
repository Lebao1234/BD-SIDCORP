import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { withErrorMessage } from '../lib/errors';

export interface ProfileFormValues {
  name: string;
  phone: string;
}

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
}

// Số điện thoại chưa có cột trong CSDL nên tạm giữ ở máy người dùng.
// Gom key vào một hằng để khi backend có cột thật thì chỉ phải sửa một chỗ.
const PHONE_STORAGE_KEY = 'sid_user_phone';

export const readStoredPhone = (): string => {
  try {
    return localStorage.getItem(PHONE_STORAGE_KEY) ?? '';
  } catch {
    // localStorage bị chặn (chế độ riêng tư) — không phải lỗi đáng dừng trang
    return '';
  }
};

const writeStoredPhone = (value: string) => {
  try {
    localStorage.setItem(PHONE_STORAGE_KEY, value);
  } catch {
    /* bỏ qua: đây chỉ là tiện ích ghi nhớ, không phải dữ liệu nghiệp vụ */
  }
};

/**
 * Các thao tác ghi lên hồ sơ người dùng đang đăng nhập.
 *
 * Trước đây bốn thao tác này nằm thẳng trong SettingsPage, mỗi cái kèm một cặp
 * `isXxxLoading` tự quản và một khối `catch (err: any)` tự bóc thông điệp lỗi.
 * Chuyển sang `useMutation` thì trạng thái đang chạy do react-query giữ, còn
 * `withErrorMessage` bảo đảm lỗi ném ra đã mang sẵn câu tiếng Việt hiển thị được.
 */
export const useProfile = () => {
  const { user, updateUser } = useAuth();

  const updateProfile = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      withErrorMessage(async () => {
        if (!user?.id) throw new Error('Không xác định được tài khoản đang đăng nhập.');

        const res = await api.put(`/users/${user.id}`, { name: values.name.trim() });
        writeStoredPhone(values.phone.trim());
        return res.data as { name: string; email: string };
      }, 'Không thể lưu hồ sơ. Vui lòng thử lại.'),
    onSuccess: (data) => {
      updateUser({ name: data.name, email: data.email });
    },
  });

  const changePassword = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      withErrorMessage(async () => {
        if (!user?.id) throw new Error('Không xác định được tài khoản đang đăng nhập.');

        await api.patch(`/users/${user.id}/reset-password`, {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
      }, 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.'),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) =>
      withErrorMessage(async () => {
        if (!user?.id) throw new Error('Không xác định được tài khoản đang đăng nhập.');

        const formData = new FormData();
        formData.append('avatar', file);

        const res = await api.post(`/users/${user.id}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.avatar_url as string;
      }, 'Không thể tải ảnh đại diện lên. Vui lòng thử lại.'),
    onSuccess: (avatarUrl) => {
      updateUser({ avatar_url: avatarUrl, avatarUrl });
    },
  });

  const removeAvatar = useMutation({
    mutationFn: () =>
      withErrorMessage(async () => {
        if (!user?.id) throw new Error('Không xác định được tài khoản đang đăng nhập.');
        await api.put(`/users/${user.id}`, { avatar_url: null });
      }, 'Không thể xóa ảnh đại diện.'),
    onSuccess: () => {
      updateUser({ avatar_url: undefined, avatarUrl: undefined });
    },
  });

  return { updateProfile, changePassword, uploadAvatar, removeAvatar };
};

/**
 * Số khách hàng đang do người dùng phụ trách.
 *
 * Chỉ cần con số tổng nên gọi `limit=1` và đọc trường `total` — không kéo về cả
 * trang dữ liệu chỉ để đếm. Trước đây con số này khởi tạo bằng 26 cứng, nên khi
 * request hỏng hoặc chưa về thì màn hình vẫn hiện "26" như một số liệu thật.
 */
export const useAssignedCustomerCount = () =>
  useQuery({
    queryKey: ['assignedCustomerCount'],
    queryFn: () =>
      withErrorMessage(async () => {
        const res = await api.get('/customers?page=1&limit=1');
        return typeof res.data?.total === 'number' ? res.data.total : 0;
      }, 'Không thể đếm số khách hàng phụ trách.'),
    staleTime: 5 * 60 * 1000,
  });
