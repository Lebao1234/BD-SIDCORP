import React, { useMemo, useState } from 'react';
import { AppLayout } from '../Layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { ReportKpiCards } from './ReportKpiCards';
import { RevenueChart } from './RevenueChart';
import { SalesPipelineStepChart } from './SalesPipelineStepChart';
import { CategoryRadarChart } from './CategoryRadarChart';
import { TrafficHeatmapChart } from './TrafficHeatmapChart';
import { OrderStatusDonutChart } from './OrderStatusDonutChart';
import { RecentActivityTable, CustomerActivity } from './RecentActivityTable';
import { TodayPanel } from './TodayPanel';
import { RefreshCw, Calendar, Globe } from 'lucide-react';
import { ReportDashboardSkeleton } from './ReportDashboardSkeleton';
import { useReportSummary, type ReportScope } from '../../hooks/useReportSummary';
import { iconButton } from '../common/ui';

export const ReportDashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  const [filterMode, setFilterMode] = useState<ReportScope>('all');
  const scope: ReportScope = isAdmin ? filterMode : 'mine';

  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useReportSummary(scope);

  const recentCustomers = useMemo<CustomerActivity[]>(
    () => (data?.recent ?? []) satisfies CustomerActivity[],
    [data]
  );

  const viewingWholeCompany = isAdmin && scope === 'all';

  // Khoảng ngày của tháng hiện tại, ví dụ "01 – 31 Thg 10, 2026"
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthRangeLabel = `01 – ${lastDay} Thg ${now.getMonth() + 1}, ${now.getFullYear()}`;

  if (isLoading && !data) {
    return (
      <AppLayout isAdminPage={isAdmin}>
        <ReportDashboardSkeleton isAdmin={isAdmin} />
      </AppLayout>
    );
  }

  return (
    <AppLayout isAdminPage={isAdmin}>
      <div
        className={`flex flex-col gap-5 transition-opacity duration-300 ${
          isPlaceholderData ? 'opacity-60' : 'opacity-100'
        }`}
      >
        {isFetching && (
          <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-brand-soft overflow-hidden">
            <div className="h-full bg-brand animate-pulse w-1/3 mx-auto rounded-full" />
          </div>
        )}

        {/* Đầu trang */}
        <div className="flex flex-col items-start gap-4 pt-1 lg:flex-row lg:items-end lg:justify-between animate-fade-in">
          <div className="flex flex-col gap-1">
            <h1 className="text-title font-semibold text-fg">Tổng quan kinh doanh</h1>
            <p className="text-sm text-fg-subtle">
              {viewingWholeCompany
                ? 'Doanh thu, khách hàng và giao dịch của toàn công ty.'
                : 'Doanh thu, khách hàng và giao dịch bạn đang phụ trách.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-8 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-sm text-fg-body">
              <Calendar className="h-3.5 w-3.5 text-fg-faint" strokeWidth={1.8} />
              <span className="tnum">{monthRangeLabel}</span>
            </div>

            {isAdmin && (
              <label className="flex h-8 items-center gap-1.5 rounded-control border border-line bg-surface pl-2.5 pr-1.5 text-sm text-fg-body">
                <Globe className="h-3.5 w-3.5 text-fg-faint" strokeWidth={1.8} />
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as ReportScope)}
                  className="h-full cursor-pointer bg-transparent pr-1 outline-none"
                  aria-label="Phạm vi dữ liệu"
                >
                  <option value="all">Toàn công ty</option>
                  <option value="mine">Của tôi</option>
                </select>
              </label>
            )}

            {/* Đã gỡ ô "Tất cả lĩnh vực" và nút "Xuất báo cáo": cả hai chưa từng nối
                với chức năng nào (ô lọc không lọc, nút xuất chỉ tải lại số liệu). */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Làm mới dữ liệu"
              aria-label="Làm mới dữ liệu"
              className={`${iconButton} disabled:opacity-50`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-brand' : ''}`} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Bốn chỉ số chính */}
        <ReportKpiCards
          totalCustomers={data?.totalCustomers ?? 0}
          totalPipelineValue={data?.totalPipelineValue ?? 0}
          totalCompanies={data?.totalCompanies ?? 0}
          conversionRate={data?.conversionRate ?? 0}
          quotedValue={data?.quotedValue}
          quotedCount={data?.quotedCount}
          inProgressCount={data?.inProgressCount}
          stoppedCount={data?.stoppedCount}
        />

        {/* Doanh thu có bộ lọc: chiếm trọn chiều ngang để chỉ số và trục thời gian
            (tới 31 cột theo ngày) đủ chỗ */}
        <div className="animate-fade-in-up">
          <RevenueChart scope={scope} />
        </div>

        {/* Kết quả theo quý · Tình trạng khách */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] animate-fade-in-up">
          <SalesPipelineStepChart monthly={data?.monthly} />
          <OrderStatusDonutChart statusCounts={data?.statusCounts} />
        </div>

        {/* Lĩnh vực · Nguồn khách */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 animate-fade-in-up">
          <CategoryRadarChart categories={data?.topCategories} />
          <TrafficHeatmapChart sourceCounts={data?.sourceCounts} />
        </div>

        {/* Giao dịch gần đây */}
        <div className="animate-fade-in-up">
          <RecentActivityTable customers={recentCustomers} />
        </div>

        {/* Lịch & công việc hôm nay */}
        <div className="animate-fade-in-up">
          <TodayPanel />
        </div>
      </div>
    </AppLayout>
  );
};

