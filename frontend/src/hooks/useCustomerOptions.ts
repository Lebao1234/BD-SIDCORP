import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { withErrorMessage } from '../lib/errors';

/** Bản rút gọn của khách hàng, chỉ gồm những trường các ô chọn thực sự cần. */
export interface CustomerOption {
  id: number;
  name: string | null;
  email?: string | null;
  phone_number: string | null;
  company?: { id: number; name: string } | null;
}

interface CustomerOptionsResult {
  options: CustomerOption[];
  /** Tổng số khách hàng thực có trong CSDL, để biết danh sách có bị cắt không. */
  total: number;
}

// Trần an toàn cho một ô chọn. Vượt ngưỡng này thì ô chọn không còn là công cụ
// phù hợp nữa — lúc đó cần ô tìm kiếm gọi API theo từ khoá.
export const CUSTOMER_OPTIONS_LIMIT = 200;

/**
 * Danh sách khách hàng dùng cho các ô chọn (soạn email, gắn lịch, gắn ghi chú).
 *
 * Trước đây ba trang cùng gọi `api.get('/customers?limit=100')` trong useEffect
 * riêng, mỗi trang một bản sao state và một `.catch(() => {})` nuốt lỗi. Hệ quả:
 * ba lần gọi mạng cho cùng một dữ liệu, và khi vượt 100 khách hàng thì cả ba
 * trang âm thầm cắt bớt mà không ai biết.
 *
 * Gom về một query key nên react-query chỉ gọi mạng một lần và chia sẻ kết quả.
 * `isTruncated` để màn hình nói thật với người dùng khi danh sách bị cắt.
 */
export const useCustomerOptions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customerOptions', CUSTOMER_OPTIONS_LIMIT],
    queryFn: () =>
      withErrorMessage(async (): Promise<CustomerOptionsResult> => {
        const res = await api.get(`/customers?page=1&limit=${CUSTOMER_OPTIONS_LIMIT}`);
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        return {
          options: rows as CustomerOption[],
          total: typeof res.data?.total === 'number' ? res.data.total : rows.length,
        };
      }, 'Không thể tải danh sách khách hàng.'),
    // Danh bạ khách hàng đổi chậm hơn nhiều so với dữ liệu nghiệp vụ khác
    staleTime: 10 * 60 * 1000,
  });

  const options = data?.options ?? [];
  const total = data?.total ?? 0;

  return {
    options,
    total,
    isTruncated: total > options.length,
    loading: isLoading,
    error: error as Error | null,
  };
};
