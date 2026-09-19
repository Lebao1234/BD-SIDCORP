import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { withErrorMessage } from '../lib/errors';

export type ReportScope = 'all' | 'mine';

export interface ReportSummary {
  scope: ReportScope;
  totalCustomers: number;
  totalPipelineValue: number;
  totalCompanies: number;
  conversionRate: number;
  statusCounts: Array<{ status: string; count: number }>;
  sourceCounts: Array<{ source: string; count: number }>;
  monthly: Array<{ month: number; value: number }>;
  performance: Array<{ label: string; revenue: number; count: number }>;
  recent: Array<{
    id: number;
    name: string | null;
    status: string;
    price: number | null;
    ownerName: string | null;
    companyName: string | null;
    updatedAt: string;
  }>;
}

/**
 * Số liệu trang chủ, gom nhóm sẵn ở phía máy chủ.
 *
 * Bản cũ nằm thẳng trong ReportDashboard: `useState` cho từng con số, một
 * `useEffect` gọi `/customers?limit=500`, rồi năm vòng lặp trên mảng 500 phần
 * tử. Vì không đi qua react-query nên không có bộ đệm nào — mà ba đường dẫn
 * `/`, `/dashboard` và `/reports` cùng trỏ vào màn hình này, nên mỗi lần chuyển
 * qua lại là một lần tải lại toàn bộ.
 */
export const useReportSummary = (scope: ReportScope) =>
  useQuery({
    queryKey: ['reportSummary', scope],
    queryFn: () =>
      withErrorMessage(
        async () => (await api.get(`/reports/summary?scope=${scope}`)).data as ReportSummary,
        'Không thể tải số liệu tổng quan.'
      ),
    staleTime: 2 * 60 * 1000,
  });
