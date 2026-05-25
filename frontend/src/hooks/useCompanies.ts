import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Company } from '../types';

export const useCompanies = (autoFetch: boolean = false) => {
  const fetchCompanies = async () => {
    const response = await api.get('/companies');
    return response.data as Company[];
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    enabled: autoFetch,
  });

  return {
    companies: data || [],
    loadingCompanies: isLoading,
    fetchCompanies: refetch,
  };
};
