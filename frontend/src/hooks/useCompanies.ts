import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Company } from '../types';

// Hằng số mảng rỗng cố định: tránh tạo instance [] mới mỗi render
// gây các useEffect/useMemo phụ thuộc bị kích hoạt lại không cần thiết.
const EMPTY_COMPANIES: Company[] = [];

export const useCompanies = (autoFetch: boolean = false) => {
  const fetchCompanies = async () => {
    const response = await api.get('/companies');
    // Backend mới trả { data, total, page, totalPages }; cũ trả mảng trực tiếp
    const res = response.data;
    return (Array.isArray(res) ? res : (res?.data ?? [])) as Company[];
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    enabled: autoFetch,
  });

  return {
    companies: data ?? EMPTY_COMPANIES,
    loadingCompanies: isLoading,
    isFetching,
    fetchCompanies: refetch,
    refetch,
  };
};
