import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface CommonState {
  team: { id: number; name: string }[];
  fetchTeam: () => Promise<void>;
}

export const useCommonStore = create<CommonState>()(
  persist(
    (set, get) => ({
      team: [],
      fetchTeam: async () => {
        // Chỉ fetch nếu mảng team chưa có dữ liệu để tránh spam API
        if (get().team.length > 0) return;
        try {
          const res = await api.get('/users');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const admins = res.data.filter((u: any) => u.role?.toLowerCase() === 'admin');
          set({ team: admins });
        } catch (err) {
          console.error('Không thể lấy danh sách team:', err);
        }
      },
    }),
    {
      name: 'common-storage', // Tên lưu trong localStorage
    }
  )
);

