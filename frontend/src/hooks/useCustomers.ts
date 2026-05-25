import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Customer } from '../types';

interface UseCustomersFilters {
  page: number;
  classifiedFilter: string;
  ownerFilter: string;
  statusFilter: string;
}

export const useCustomers = (initialFilters: UseCustomersFilters = { page: 1, classifiedFilter: '', ownerFilter: '', statusFilter: '' }) => {
  const [page, setPage] = useState(initialFilters.page);
  const [classifiedFilter, setClassifiedFilter] = useState(initialFilters.classifiedFilter);
  const [ownerFilter, setOwnerFilter] = useState(initialFilters.ownerFilter);
  const [statusFilter, setStatusFilter] = useState(initialFilters.statusFilter);

  const fetchCustomers = async (p: number, classified: string, owner: string, status: string) => {
    const params = new URLSearchParams();
    params.append('page', p.toString());
    params.append('limit', '10');
    if (classified) params.append('classified', classified);
    if (owner) params.append('owner_id', owner);
    if (status) params.append('status', status);

    const response = await api.get(`/customers?${params.toString()}`);
    if (response.data && response.data.data) {
      return {
        data: response.data.data as Customer[],
        totalPages: response.data.totalPages || 1
      };
    }
    // Fallback backward compatibility
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: response.data as any as Customer[],
      totalPages: 1
    };
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', page, classifiedFilter, ownerFilter, statusFilter],
    queryFn: () => fetchCustomers(page, classifiedFilter, ownerFilter, statusFilter),
  });

  return {
    customers: data?.data || [],
    loading: isLoading,
    page,
    setPage,
    totalPages: data?.totalPages || 1,
    classifiedFilter,
    setClassifiedFilter,
    ownerFilter,
    setOwnerFilter,
    statusFilter,
    setStatusFilter,
    refetch
  };
};
