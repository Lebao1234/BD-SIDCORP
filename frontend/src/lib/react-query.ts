import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Thường không cần thiết trừ khi ứng dụng thay đổi real-time cực cao
      retry: 1, // Thử lại 1 lần nếu lỗi
      staleTime: 1000 * 60 * 5, // Dữ liệu được coi là mới trong 5 phút
    },
  },
});
