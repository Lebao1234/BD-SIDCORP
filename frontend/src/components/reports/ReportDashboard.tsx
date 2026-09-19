import React, { useMemo, useState } from 'react';
import { AppLayout } from '../Layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { ReportKpiCards } from './ReportKpiCards';
import { TodayPanel } from './TodayPanel';
import { CustomerStatusChart, StatusItem } from './CustomerStatusChart';
import { SalesPerformanceChart, PerformanceItem } from './SalesPerformanceChart';
import { DonutChart, DonutSegment } from './DonutChart';
import { ColumnBarChart, ColumnBarData } from './ColumnBarChart';
import { RecentActivityTable, CustomerActivity } from './RecentActivityTable';
import { CUSTOMER_STATUS_DOT, CUSTOMER_STATUS_LABEL } from '../../utils/constants';
import { SegmentGroup } from './Panel';
import { RefreshCw } from 'lucide-react';
import { ReportDashboardSkeleton } from './ReportDashboardSkeleton';
import { useReportSummary, type ReportScope } from '../../hooks/useReportSummary';

/**
 * Nhóm nguồn khách hàng.
 *
 * Máy chủ trả về số lượng theo từng giá trị `from_source` thô (chỉ vài dòng),
 * việc gán chúng vào bốn nhóm hiển thị vẫn thuộc về giao diện — đó là quyết
 * định trình bày, không phải quyết định dữ liệu.
 */
const SOURCE_BUCKETS = [
  { key: 'SOCIAL', label: 'Mạng xã hội',       color: '#e8732c', patterns: ['FACEBOOK', 'SOCIAL', 'MẠNG', 'FANPAGE', 'INSTAGRAM', 'TIKTOK'] },
  { key: 'EMAIL',  label: 'Email / Telesales', color: '#3f7dbd', patterns: ['EMAIL', 'THƯ'] },
  { key: 'CALL',   label: 'Hotline / Zalo',    color: '#7a9a5b', patterns: ['CALL', 'ĐIỆN THOẠI', 'HOTLINE', 'ZALO'] },
] as const;

const OTHER_BUCKET = { key: 'OTHERS', label: 'Nguồn khác', color: '#b9b4ab' } as const;

export const ReportDashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  const [filterMode, setFilterMode] = useState<ReportScope>('all');

  // Người dùng thường không có công tắc phạm vi; máy chủ cũng khoá cứng về
  // dữ liệu của chính họ, nên gửi 'mine' để hai bên nói cùng một điều.
  const scope: ReportScope = isAdmin ? filterMode : 'mine';

  const { data, isLoading, isFetching, refetch } = useReportSummary(scope);

  const statusData = useMemo<StatusItem[]>(
    () =>
      (data?.statusCounts ?? []).map((s) => ({
        name: CUSTOMER_STATUS_LABEL[s.status] || s.status,
        count: s.count,
        color: CUSTOMER_STATUS_DOT[s.status] || '#c9c5be',
      })),
    [data]
  );

  const sourceData = useMemo<DonutSegment[]>(() => {
    const totals: Record<string, number> = { SOCIAL: 0, EMAIL: 0, CALL: 0, OTHERS: 0 };

    for (const row of data?.sourceCounts ?? []) {
      const raw = (row.source || '').toUpperCase();
      const bucket = SOURCE_BUCKETS.find((b) => b.patterns.some((p) => raw.includes(p)));
      totals[bucket ? bucket.key : OTHER_BUCKET.key] += row.count;
    }

    return [
      ...SOURCE_BUCKETS.map((b) => ({ label: b.label, value: totals[b.key], color: b.color })),
      { label: OTHER_BUCKET.label, value: totals.OTHERS, color: OTHER_BUCKET.color },
    ];
  }, [data]);

  const monthlyData = useMemo<ColumnBarData[]>(() => {
    const rows = data?.monthly ?? [];
    // Bỏ các tháng chưa phát sinh doanh số để biểu đồ gọn hơn; nếu cả năm chưa
    // có gì thì vẫn vẽ sáu tháng đầu làm khung trống.
    const nonEmpty = rows.filter((r) => r.value > 0);
    const shown = nonEmpty.length > 0 ? nonEmpty : rows.slice(0, 6);
    return shown.map((r) => ({ label: `Thg ${r.month}`, value: r.value }));
  }, [data]);

  const performanceData = useMemo<PerformanceItem[]>(
    () => (data?.performance ?? []).map((p) => ({ ...p })),
    [data]
  );

  const recentCustomers = useMemo<CustomerActivity[]>(
    () => (data?.recent ?? []) satisfies CustomerActivity[],
    [data]
  );

  const viewingWholeCompany = isAdmin && scope === 'all';

  // Chỉ hiện khung xương ở lần tải đầu. Đổi bộ lọc hay bấm làm mới thì giữ
  // nguyên số liệu cũ trên màn hình và báo tiến trình bằng thanh mảnh trên đỉnh.
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
        className={`flex flex-col gap-[18px] transition-opacity duration-300 ${
          isFetching ? 'opacity-75 pointer-events-none' : 'opacity-100'
        }`}
      >
        {isFetching && (
          <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full bg-[#e8732c] animate-pulse w-1/3 mx-auto rounded-full" />
          </div>
        )}

        {/* Đầu trang: tiêu đề */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end animate-fade-in">
          <div className="flex flex-col gap-1">
            <h1 className="text-[19px] font-semibold tracking-[-0.01em] text-fg dark:text-[#f2f0ed]">
              Tổng quan kinh doanh
            </h1>
            <p className="text-xs text-fg-subtle dark:text-[#8f8b84]">
              {viewingWholeCompany
                ? 'Số liệu toàn công ty · cập nhật theo thời gian thực'
                : 'Số liệu của các khách hàng bạn đang phụ trách'}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            {isAdmin && (
              <SegmentGroup
                value={filterMode}
                onChange={setFilterMode}
                options={[
                  { value: 'mine', label: 'Của tôi' },
                  { value: 'all', label: 'Toàn công ty' },
                ]}
              />
            )}

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex h-[30px] items-center gap-1.5 rounded-control border border-line bg-surface px-2.5
                text-xs font-medium text-fg-muted transition hover:text-fg disabled:opacity-50
                dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#a8a49d] dark:hover:text-[#f2f0ed] cursor-pointer shadow-2xs active:scale-98"
              title="Làm mới dữ liệu"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-[#e8732c]' : ''}`}
                strokeWidth={1.8}
              />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        <ReportKpiCards
          totalCustomers={data?.totalCustomers ?? 0}
          totalPipelineValue={data?.totalPipelineValue ?? 0}
          totalCompanies={data?.totalCompanies ?? 0}
          conversionRate={data?.conversionRate ?? 0}
          isAdmin={viewingWholeCompany}
        />

        {/* Việc và lịch hôm nay — đặt ngay dưới KPI */}
        <TodayPanel />

        {/* Hàng biểu đồ 1 — donut & cột */}
        <div
          style={{ animationDelay: '260ms' }}
          className="grid grid-cols-1 gap-3 lg:grid-cols-[420px_minmax(0,1fr)] animate-fade-in-up"
        >
          <DonutChart title="Nguồn khách hàng" data={sourceData} unitLabel="khách hàng" />
          <ColumnBarChart
            title="Doanh số theo tháng"
            subtitle="Tổng giá trị thương vụ ghi nhận theo tháng"
            data={monthlyData}
            valueSuffix=" ₫"
          />
        </div>

        {/* Hàng biểu đồ 2 */}
        <div
          style={{ animationDelay: '340ms' }}
          className="grid grid-cols-1 gap-3 lg:grid-cols-2 animate-fade-in-up"
        >
          <CustomerStatusChart data={statusData} />
          <SalesPerformanceChart
            data={performanceData}
            title={
              viewingWholeCompany
                ? 'Hiệu suất bán hàng theo nhân viên'
                : 'Doanh số theo lĩnh vực'
            }
          />
        </div>

        <div style={{ animationDelay: '420ms' }} className="animate-fade-in-up">
          <RecentActivityTable customers={recentCustomers} />
        </div>
      </div>
    </AppLayout>
  );
};
