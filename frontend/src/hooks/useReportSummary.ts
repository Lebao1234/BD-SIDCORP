import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { queryClient } from '../lib/react-query';
import { taskSummaryQuery } from './useTasks';
import { withErrorMessage } from '../lib/errors';

export type ReportScope = 'all' | 'mine';

export interface ReportSummary {
  scope: ReportScope;
  totalCustomers: number;
  totalPipelineValue: number;
  totalCompanies: number;
  conversionRate: number;
  quotedValue?: number;
  quotedCount?: number;
  inProgressCount?: number;
  stoppedCount?: number;
  thisWeekRevenue?: number;
  lastWeekRevenue?: number;
  thisWeekCount?: number;
  daysOfWeek?: Array<{ day: string; revenue: number; count: number }>;
  topCategories?: Array<{ name: string; value: number; count: number }>;
  statusCounts: Array<{ status: string; count: number }>;
  sourceCounts: Array<{ source: string; count: number }>;
  monthly: Array<{ month: number; value: number; count?: number }>;
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

const reportSummaryQuery = (scope: ReportScope) =>
  queryOptions({
    queryKey: ['reportSummary', scope],
    queryFn: () =>
      withErrorMessage(
        async () => (await api.get(`/reports/summary?scope=${scope}`)).data as ReportSummary,
        'Không thể tải số liệu tổng quan.'
      ),
    staleTime: 2 * 60 * 1000,
  });

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
    ...reportSummaryQuery(scope),
    // Đổi giữa "Của tôi" và "Toàn công ty" là một query key khác, nên nếu không
    // giữ lại kết quả cũ thì `data` về undefined và cả trang chủ bị thay bằng
    // khung xương — chỉ để đổi một bộ lọc. Giữ số liệu cũ trên màn hình rồi
    // thay tại chỗ khi số mới về.
    placeholderData: keepPreviousData,
  });

const HOME_PATHS = ['/', '/dashboard', '/reports'];

/**
 * Gọi ngay khi ứng dụng khởi động, trước cả lúc React dựng cây component.
 *
 * Nếu không, trang chủ tải theo kiểu bậc thang: bundle chính → chunk
 * ReportDashboard (lazy) → lúc component gắn vào mới gọi API tổng quan → khung
 * xương biến mất thì TodayPanel mới gọi tiếp /tasks/summary. Ở đây cả hai API
 * và chunk được kéo về song song, nên khi trang hiện lên số liệu thường đã
 * có sẵn trong bộ đệm.
 */
export const prefetchHomeSummary = () => {
  if (!HOME_PATHS.includes(window.location.pathname)) return;
  try {
    if (!localStorage.getItem('crm_token')) return;
    const user = JSON.parse(localStorage.getItem('crm_user') || 'null');
    if (!user?.role) return;
    // Cùng quy tắc với ReportDashboard: quản trị viên mặc định xem toàn công ty.
    const scope: ReportScope = String(user.role).toLowerCase() === 'admin' ? 'all' : 'mine';
    void queryClient.prefetchQuery(reportSummaryQuery(scope));
    void queryClient.prefetchQuery(taskSummaryQuery);
    void import('../components/reports/ReportDashboard');
  } catch {
    // localStorage bị chặn hoặc dữ liệu hỏng: trang chủ vẫn tự tải như bình thường.
  }
};

export type RevenueRange = '7d' | '30d' | 'month' | 'quarter' | 'year' | 'all';
export type RevenueStage = 'all' | 'quoted' | 'pending' | 'won';

export interface RevenueReport {
  range: RevenueRange;
  stage: RevenueStage;
  unit: 'day' | 'month' | 'year';
  from: string;
  to: string;
  total: number;
  count: number;
  /** Số báo giá có ghi giá trị (> 0) — mẫu số của giá trị trung bình. */
  withPrice: number;
  /** null khi xem "Toàn thời gian" (không có kỳ trước để so). */
  prevTotal: number | null;
  prevCount: number | null;
  buckets: Array<{ key: string; value: number; count: number }>;
}

/** Doanh thu theo khoảng thời gian và nhóm khách — khối "Doanh thu" trên trang chủ. */
export const useRevenueReport = (scope: ReportScope, range: RevenueRange, stage: RevenueStage) =>
  useQuery({
    queryKey: ['revenueReport', scope, range, stage],
    queryFn: () =>
      withErrorMessage(
        async () =>
          (await api.get('/reports/revenue', { params: { scope, range, stage } })).data as RevenueReport,
        'Không thể tải số liệu doanh thu.'
      ),
    staleTime: 2 * 60 * 1000,
    // Đổi bộ lọc thì giữ biểu đồ cũ trên màn hình cho tới khi số mới về.
    placeholderData: keepPreviousData,
  });
