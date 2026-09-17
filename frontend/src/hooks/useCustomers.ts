import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Customer } from '../types';

interface UseCustomersFilters {
  page: number;
  classifiedFilter: string;
  ownerFilter: string;
  statusFilter: string;
  search: string;
}

const DEFAULT_FILTERS: UseCustomersFilters = {
  page: 1,
  classifiedFilter: '',
  ownerFilter: '',
  statusFilter: '',
  search: '',
};

// Dựng query string dùng chung cho cả danh sách phân trang lẫn export Excel,
// để hai nơi không bao giờ lọc lệch nhau.
export const buildCustomerQuery = (params: {
  page: number;
  limit: number;
  classified?: string;
  owner?: string;
  status?: string;
  search?: string;
}): string => {
  const qs = new URLSearchParams();
  qs.append('page', String(params.page));
  qs.append('limit', String(params.limit));
  if (params.classified) qs.append('classified', params.classified);
  if (params.owner)      qs.append('owner_id', params.owner);
  if (params.status)     qs.append('status', params.status);
  if (params.search)     qs.append('search', params.search);
  return qs.toString();
};

export const useCustomers = (initialFilters: Partial<UseCustomersFilters> = {}) => {
  const filters = { ...DEFAULT_FILTERS, ...initialFilters };

  const [page, setPage] = useState(filters.page);
  const [classifiedFilter, setClassifiedFilter] = useState(filters.classifiedFilter);
  const [ownerFilter, setOwnerFilter] = useState(filters.ownerFilter);
  const [statusFilter, setStatusFilter] = useState(filters.statusFilter);
  const [search, setSearch] = useState(filters.search);

  const fetchCustomers = async (p: number, classified: string, owner: string, status: string, keyword: string) => {
    const query = buildCustomerQuery({
      page: p,
      limit: 10,
      classified,
      owner,
      status,
      search: keyword,
    });

    const response = await api.get(`/customers?${query}`);
    if (response.data && response.data.data) {
      return {
        data: response.data.data as Customer[],
        totalPages: response.data.totalPages || 1,
        total: response.data.total ?? response.data.data.length,
      };
    }
    // Fallback backward compatibility
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: response.data as any as Customer[],
      totalPages: 1,
      total: Array.isArray(response.data) ? response.data.length : 0,
    };
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', page, classifiedFilter, ownerFilter, statusFilter, search],
    queryFn: () => fetchCustomers(page, classifiedFilter, ownerFilter, statusFilter, search),
    // Giữ kết quả cũ khi đổi trang/từ khoá để bảng không nhấp nháy về rỗng
    placeholderData: keepPreviousData,
  });

  return {
    customers: data?.data || [],
    loading: isLoading,
    page,
    setPage,
    totalPages: data?.totalPages || 1,
    total: data?.total || 0,
    classifiedFilter,
    setClassifiedFilter,
    ownerFilter,
    setOwnerFilter,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    refetch
  };
};
