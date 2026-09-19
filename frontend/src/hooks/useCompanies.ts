import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Company } from '../types';

// Hằng số mảng rỗng cố định: tránh tạo instance [] mới mỗi render
// gây các useEffect/useMemo phụ thuộc bị kích hoạt lại không cần thiết.
const EMPTY_COMPANIES: Company[] = [];

/**
 * Trần an toàn cho danh sách doanh nghiệp.
 *
 * Màn hình Doanh nghiệp lọc và tìm kiếm ngay trên trình duyệt nên cần cả danh
 * sách, nhưng "cả danh sách" phải có giới hạn. Trước đây trần này nằm ẩn trong
 * giá trị mặc định của máy chủ, nên khi vượt ngưỡng thì màn hình âm thầm cắt
 * bớt mà không ai biết. Nay nó nằm ở đây, và `isTruncated` để giao diện nói
 * thật với người dùng.
 */
export const COMPANIES_LIMIT = 200;

interface CompaniesResult {
  companies: Company[];
  total: number;
}

export const useCompanies = (autoFetch: boolean = false) => {
  const fetchCompanies = async (): Promise<CompaniesResult> => {
    const response = await api.get(`/companies?page=1&limit=${COMPANIES_LIMIT}`);
    const res = response.data;

    // Backend mới trả { data, total, page, totalPages }; cũ trả mảng trực tiếp
    const rows = (Array.isArray(res) ? res : (res?.data ?? [])) as Company[];
    return {
      companies: rows,
      total: typeof res?.total === 'number' ? res.total : rows.length,
    };
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['companies', COMPANIES_LIMIT],
    queryFn: fetchCompanies,
    enabled: autoFetch,
  });

  const companies = data?.companies ?? EMPTY_COMPANIES;
  const total = data?.total ?? 0;

  return {
    companies,
    total,
    isTruncated: total > companies.length,
    loadingCompanies: isLoading,
    isFetching,
    fetchCompanies: refetch,
    refetch,
  };
};
