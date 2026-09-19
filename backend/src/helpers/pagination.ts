/**
 * Tiện ích phân trang an toàn (Pagination Helpers).
 *
 * TÁC DỤNG:
 * 1. Ép trần an toàn `maxLimit` (mặc định tối đa 100-200), ngăn chặn kẻ xấu hoặc client
 *    gửi ?limit=999999 làm sập RAM máy chủ Node.js (Denial of Service).
 * 2. Tự động tính toán `skip` cho Prisma: `(page - 1) * limit`.
 * 3. Chuẩn hóa format phản hồi { data, total, page, limit, totalPages } đồng nhất cho toàn hệ thống.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getPagination = (
  query: { page?: unknown; limit?: unknown },
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams => {
  const page = Math.max(1, parseInt(String(query?.page), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(query?.limit), 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPaginated = <T>(
  data: T[],
  total: number,
  { page, limit }: { page: number; limit: number }
): PaginatedResult<T> => {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};
