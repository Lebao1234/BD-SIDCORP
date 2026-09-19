import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { withErrorMessage } from '../lib/errors';
import { Asset } from '../types';

// Trần an toàn, khớp với giới hạn phía máy chủ
export const RESOURCE_LIMIT = 200;

const QUERY_KEY = ['resourceAssets', RESOURCE_LIMIT];

const EMPTY_ASSETS: Asset[] = [];

interface ResourceAssetsResult {
  assets: Asset[];
  total: number;
}

/**
 * Kho tài liệu Google Drive.
 *
 * Bản cũ tự quản bằng `useState` + `useEffect`, nên mỗi lần vào lại trang là
 * một lần gọi mạng, và mọi thao tác ghi phải tự vá lại mảng trong state — ba
 * chỗ khác nhau, ba cách khác nhau. Chuyển sang react-query thì bộ đệm dùng
 * chung, và mỗi thao tác ghi chỉ cần làm mới đúng một query key.
 */
export const useResourceAssets = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      withErrorMessage(async (): Promise<ResourceAssetsResult> => {
        const res = await api.get('/assets', {
          params: { type: 'DOCUMENT', page: 1, limit: RESOURCE_LIMIT },
        });

        // Backend mới trả { data, total, ... }; bản cũ trả thẳng mảng
        const body = res.data;
        const rows = (Array.isArray(body) ? body : (body?.data ?? [])) as Asset[];
        return {
          assets: rows,
          total: typeof body?.total === 'number' ? body.total : rows.length,
        };
      }, 'Không thể tải danh sách tài liệu.'),
    staleTime: 5 * 60 * 1000,
  });

  const createAsset = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: any) =>
      withErrorMessage(
        async () => (await api.post('/assets', { ...data, type: 'DOCUMENT' })).data as Asset,
        'Không thể thêm tài liệu.'
      ),
    onSuccess: invalidate,
  });

  const updateAsset = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      withErrorMessage(
        async () => (await api.put(`/assets/${id}`, data)).data as Asset,
        'Không thể cập nhật tài liệu.'
      ),
    onSuccess: invalidate,
  });

  const deleteAsset = useMutation({
    mutationFn: (id: number) =>
      withErrorMessage(async () => {
        await api.delete(`/assets/${id}`);
      }, 'Không thể xóa tài liệu.'),
    onSuccess: invalidate,
  });

  const uploadAsset = useMutation({
    mutationFn: (formData: FormData) =>
      withErrorMessage(
        async () => {
          const res = await api.post('/assets/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return res.data as Asset;
        },
        'Không thể tải tệp lên.'
      ),
    onSuccess: invalidate,
  });

  const assets = query.data?.assets ?? EMPTY_ASSETS;
  const total = query.data?.total ?? 0;

  return {
    assets,
    total,
    isTruncated: total > assets.length,
    isLoading: query.isLoading,
    loadError: query.error as Error | null,
    createAsset,
    uploadAsset,
    updateAsset,
    deleteAsset,
  };
};
