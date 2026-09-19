import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { withErrorMessage } from '../lib/errors';
import {
  buildAssetPayload,
  mapAssetToEmail,
  type ArchivedEmail,
  type ArchivedEmailStatus,
  type EmailAssetRecord,
} from '../components/Emails';

// Trần an toàn cho kho lưu trữ email. Mỗi bản ghi mang theo cột `meta` chứa
// nội dung thư, nên đây là danh sách nặng nhất trong toàn hệ thống.
export const EMAIL_ARCHIVE_LIMIT = 200;

const QUERY_KEY = ['emailCampaigns', EMAIL_ARCHIVE_LIMIT];

// Tham chiếu cố định cho trạng thái rỗng: nếu tạo [] mới mỗi render thì mọi
// useMemo phụ thuộc vào `emails` ở trang Email đều tính lại vô ích.
const EMPTY_EMAILS: ArchivedEmail[] = [];

/**
 * Kho lưu trữ email tiếp thị.
 *
 * Bản cũ tự quản mọi thứ bằng tay: một `useState` giữ danh sách, một `loading`
 * riêng, một hàm `fetchArchivedEmails` gọi trong useEffect, và mỗi thao tác ghi
 * lại tự `setEmails` để cập nhật giao diện. Hai vấn đề nặng nhất:
 *
 * 1. Danh sách được khởi tạo bằng 4 email mẫu dựng sẵn, và chỉ bị thay khi API
 *    trả về MẢNG KHÁC RỖNG. Nên khi tài khoản chưa có email nào, hoặc khi gọi
 *    API hỏng, người dùng vẫn thấy 4 email "đã gửi" mà họ chưa từng gửi.
 * 2. Lỗi tải danh sách chỉ đi vào `console.warn`, màn hình không có dấu hiệu gì.
 *
 * Chuyển sang react-query thì trạng thái rỗng, đang tải và lỗi là ba trạng thái
 * tách bạch, và mọi thao tác ghi chỉ cần làm mới đúng một query key.
 */
export const useEmailCampaigns = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      withErrorMessage(async () => {
        const res = await api.get(`/assets?type=EMAIL_TEMPLATE&page=1&limit=${EMAIL_ARCHIVE_LIMIT}`);

        // Backend mới trả { data, total, ... }; bản cũ trả thẳng mảng
        const body = res.data;
        const rows: EmailAssetRecord[] = Array.isArray(body) ? body : (body?.data ?? []);
        const total = typeof body?.total === 'number' ? body.total : rows.length;

        return { emails: rows.map(mapAssetToEmail), total };
      }, 'Không thể tải danh sách email lưu trữ.'),
  });

  const createEmail = useMutation({
    mutationFn: (email: Omit<ArchivedEmail, 'id' | 'dbId'>) =>
      withErrorMessage(async () => {
        // `id` rỗng chỉ để khớp kiểu khi dựng payload; backend tự sinh id thật.
        const res = await api.post('/assets', buildAssetPayload({ ...email, id: '' }));
        return mapAssetToEmail(res.data as EmailAssetRecord);
      }, 'Không thể lưu trữ email. Vui lòng thử lại.'),
    onSuccess: invalidate,
  });

  const bulkCreateEmails = useMutation({
    mutationFn: (emails: Array<Omit<ArchivedEmail, 'id' | 'dbId'>>) =>
      withErrorMessage(async () => {
        const assets = emails.map((item) => buildAssetPayload({ ...item, id: '' }));
        const res = await api.post('/assets/bulk', { assets });
        return res.data;
      }, 'Không thể lưu danh sách email từ Excel. Vui lòng thử lại.'),
    onSuccess: invalidate,
  });

  const changeStatus = useMutation({
    mutationFn: ({ email, status }: { email: ArchivedEmail; status: ArchivedEmailStatus }) =>
      withErrorMessage(async () => {
        if (!email.dbId) throw new Error('Email này chưa được lưu trong cơ sở dữ liệu.');

        const next: ArchivedEmail = {
          ...email,
          status,
          // Chuyển về bản nháp thì xoá mốc đã gửi, nếu không lịch sử sẽ nói dối
          sentAt: status === 'sent' ? new Date().toISOString() : null,
        };
        await api.put(`/assets/${email.dbId}`, buildAssetPayload(next));
        return next;
      }, 'Không thể cập nhật trạng thái email.'),
    onSuccess: invalidate,
  });

  const deleteEmail = useMutation({
    mutationFn: (email: ArchivedEmail) =>
      withErrorMessage(async () => {
        if (!email.dbId) throw new Error('Email này chưa được lưu trong cơ sở dữ liệu.');
        await api.delete(`/assets/${email.dbId}`);
      }, 'Không thể xóa email khỏi lưu trữ.'),
    onSuccess: invalidate,
  });

  const bulkDeleteEmails = useMutation({
    mutationFn: (emails: ArchivedEmail[]) =>
      withErrorMessage(async () => {
        const ids = emails.map((e) => e.dbId).filter((id): id is number => Boolean(id));
        if (ids.length === 0) return;
        try {
          await api.post('/assets/bulk-delete', { ids });
        } catch {
          // Fallback nếu backend gặp trục trặc
          await Promise.all(ids.map((id) => api.delete(`/assets/${id}`)));
        }
      }, 'Không thể xóa các email đã chọn.'),
    onSuccess: invalidate,
  });

  const emails = query.data?.emails ?? EMPTY_EMAILS;
  const total = query.data?.total ?? 0;

  return {
    emails,
    total,
    isTruncated: total > emails.length,
    loading: query.isLoading,
    isRefreshing: query.isFetching,
    loadError: query.error as Error | null,
    refetch: query.refetch,
    createEmail,
    bulkCreateEmails,
    changeStatus,
    deleteEmail,
    bulkDeleteEmails,
  };
};
