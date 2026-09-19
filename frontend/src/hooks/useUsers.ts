import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { AdminUser } from '../types';

const EMPTY_USERS: AdminUser[] = [];

/**
 * Danh bạ nhân sự nội bộ.
 *
 * Trước đây `/users` bị gọi từ bốn nơi độc lập không chia sẻ gì với nhau: hook
 * `useTeam`, store `useCommonStore` (còn ghi cả vào localStorage), store chat,
 * và trang quản trị. Mở một phiên làm việc là vài lần tải cùng một danh sách.
 *
 * Gom về một query key nên react-query chỉ gọi mạng một lần và mọi màn hình
 * dùng chung kết quả đó. Danh sách nhân sự đổi rất chậm nên để staleTime dài.
 */
export const useUsers = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data as AdminUser[],
    staleTime: 10 * 60 * 1000,
  });

  return {
    users: data ?? EMPTY_USERS,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
};

/** Chỉ những tài khoản quản trị — dùng cho ô chọn người phụ trách và @mention. */
export const useAdmins = () => {
  const { users, loading, error, refetch } = useUsers();

  // Lọc ngay trên kết quả đã đệm, không cần thêm một lần gọi mạng nào
  const admins = users.filter((u) => u.role?.toLowerCase() === 'admin');

  return { admins, loading, error, refetch };
};
