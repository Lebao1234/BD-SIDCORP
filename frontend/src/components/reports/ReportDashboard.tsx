import React, { useEffect, useState } from 'react';
import { AppLayout } from '../Layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
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

export const ReportDashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all');

  // Metrics
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPipelineValue, setTotalPipelineValue] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);

  // Chart data
  const [statusData, setStatusData] = useState<StatusItem[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceItem[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<CustomerActivity[]>([]);

  // Dynamic Donut & Monthly Column Data
  const [sourceData, setSourceData] = useState<DonutSegment[]>([]);
  const [monthlyData, setMonthlyData] = useState<ColumnBarData[]>([]);

  const extractArray = (resData: any): any[] => {
    if (Array.isArray(resData)) return resData;
    if (resData && Array.isArray(resData.data)) return resData.data;
    if (resData && Array.isArray(resData.customers)) return resData.customers;
    if (resData && Array.isArray(resData.items)) return resData.items;
    return [];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch real customers list from backend
      const custRes = await api.get('/customers?page=1&limit=500');
      const customersList: any[] = extractArray(custRes.data);

      // Filtering strictly based on Role and Filter Mode:
      // Regular User: MUST only see their own assigned customers
      // Admin in 'all' mode: sees entire company customers
      // Admin in 'mine' mode: sees only Admin's own assigned customers
      const targetCust = (isAdmin && filterMode === 'all')
        ? customersList
        : customersList.filter((c: any) =>
            String(c.owner_id) === String(user?.id) ||
            String(c.assigned_to) === String(user?.id) ||
            String(c.user_id) === String(user?.id)
          );

      setTotalCustomers(targetCust.length);

      // Total pipeline value
      const totalVal = targetCust.reduce((acc, c) => acc + (Number(c.price) || 0), 0);
      setTotalPipelineValue(totalVal);

      // Conversion rate (SIGNED or CONTRACT_SENT)
      const signedCount = targetCust.filter(c => c.status === 'SIGNED' || c.status === 'CONTRACT_SENT').length;
      const rate = targetCust.length > 0 ? Math.round((signedCount / targetCust.length) * 100) : 0;
      setConversionRate(rate);

      // 2. Fetch companies count
      try {
        const compRes = await api.get('/companies');
        const comps = compRes.data || [];
        setTotalCompanies(Array.isArray(comps) ? comps.length : 0);
      } catch (e) {
        setTotalCompanies(0);
      }

      // 3. Process Customer Status distribution & Lead Source distribution
      const statusCounts: Record<string, number> = {};
      const sourceCounts: Record<string, number> = {
        SOCIAL: 0,
        EMAIL: 0,
        CALL: 0,
        OTHERS: 0
      };

      // Monthly sales bucket (Thg 1 .. Thg 6)
      const monthBuckets: Record<string, number> = {
        'Thg 1': 0,
        'Thg 2': 0,
        'Thg 3': 0,
        'Thg 4': 0,
        'Thg 5': 0,
        'Thg 6': 0
      };

      targetCust.forEach((c) => {
        // Status count
        const st = c.status || 'NEW';
        statusCounts[st] = (statusCounts[st] || 0) + 1;

        // Source count parsing
        const src = (c.from_source || '').toUpperCase();
        if (src.includes('FACEBOOK') || src.includes('SOCIAL') || src.includes('MẠNG') || src.includes('FANPAGE')) {
          sourceCounts.SOCIAL++;
        } else if (src.includes('EMAIL') || src.includes('THƯ')) {
          sourceCounts.EMAIL++;
        } else if (src.includes('CALL') || src.includes('ĐIỆN THOẠI') || src.includes('HOTLINE') || src.includes('ZALO')) {
          sourceCounts.CALL++;
        } else {
          sourceCounts.OTHERS++;
        }

        // Monthly bucket calculation
        if (c.created_at) {
          const date = new Date(c.created_at);
          const monthNum = date.getMonth() + 1;
          const monthKey = `Thg ${monthNum <= 6 ? monthNum : ((monthNum - 1) % 6) + 1}`;
          monthBuckets[monthKey] = (monthBuckets[monthKey] || 0) + (Number(c.price) || 0);
        }
      });

      const computedStatus: StatusItem[] = Object.keys(statusCounts).map(stKey => ({
        name: CUSTOMER_STATUS_LABEL[stKey] || stKey,
        count: statusCounts[stKey],
        color: CUSTOMER_STATUS_DOT[stKey] || '#c9c5be',
      }));
      setStatusData(computedStatus);

      // 4. Update Dynamic Donut Chart (Exact real counts per role view)
      // Bốn sắc cam cũ gần như không phân biệt được trên vòng tròn; đổi sang
      // bốn màu tách bạch theo bảng màu trong .design/canvas.json.
      const computedSourceData: DonutSegment[] = [
        { label: 'Mạng xã hội', value: sourceCounts.SOCIAL, color: '#e8732c' },
        { label: 'Email / Telesales', value: sourceCounts.EMAIL, color: '#3f7dbd' },
        { label: 'Hotline / Zalo', value: sourceCounts.CALL, color: '#7a9a5b' },
        { label: 'Nguồn khác', value: sourceCounts.OTHERS, color: '#b9b4ab' },
      ];
      setSourceData(computedSourceData);

      // 5. Update Dynamic Monthly Revenue Column Chart
      const computedMonthlyData: ColumnBarData[] = Object.keys(monthBuckets).map(mKey => ({
        label: mKey,
        value: monthBuckets[mKey]
      }));
      setMonthlyData(computedMonthlyData);

      // 6. Sales performance data
      if (isAdmin && filterMode === 'all') {
        const ownerSales: Record<string, { totalVal: number; count: number }> = {};
        targetCust.forEach(c => {
          const oName = c.owner?.name || c.assigned_user?.name || 'Chưa gán';
          if (!ownerSales[oName]) ownerSales[oName] = { totalVal: 0, count: 0 };
          ownerSales[oName].totalVal += Number(c.price) || 0;
          ownerSales[oName].count += 1;
        });

        const compPerf: PerformanceItem[] = Object.keys(ownerSales).map(oName => ({
          label: oName,
          revenue: ownerSales[oName].totalVal,
          count: ownerSales[oName].count,
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

        setPerformanceData(compPerf);
      } else {
        const fieldSales: Record<string, { totalVal: number; count: number }> = {};
        targetCust.forEach(c => {
          const fieldName = c.field || 'Khác';
          if (!fieldSales[fieldName]) fieldSales[fieldName] = { totalVal: 0, count: 0 };
          fieldSales[fieldName].totalVal += Number(c.price) || 0;
          fieldSales[fieldName].count += 1;
        });

        const compPerf: PerformanceItem[] = Object.keys(fieldSales).map(fName => ({
          label: fName,
          revenue: fieldSales[fName].totalVal,
          count: fieldSales[fName].count,
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

        setPerformanceData(compPerf);
      }

      // 7. Recent activity customers
      const recent: CustomerActivity[] = targetCust
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          price: c.price ? Number(c.price) : null,
          ownerName: c.owner?.name || null,
          companyName: c.company?.name || null,
          updatedAt: c.updated_at || c.created_at,
        }));

      setRecentCustomers(recent);
    } catch (error) {
      console.error('Error loading report dashboard data:', error);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMode]);

  return (
    <AppLayout isAdminPage={isAdmin}>
      {!hasLoadedOnce ? (
        <ReportDashboardSkeleton isAdmin={isAdmin} />
      ) : (
        <div
          className={`flex flex-col gap-[18px] transition-opacity duration-300 ${
            loading ? 'opacity-75 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Thanh chỉ báo tải ngầm khi làm mới hoặc đổi bộ lọc */}
          {loading && (
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
                {isAdmin && filterMode === 'all'
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
                onClick={fetchData}
                disabled={loading}
                className="flex h-[30px] items-center gap-1.5 rounded-control border border-line bg-surface px-2.5
                  text-xs font-medium text-fg-muted transition hover:text-fg disabled:opacity-50
                  dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#a8a49d] dark:hover:text-[#f2f0ed] cursor-pointer shadow-2xs active:scale-98"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#e8732c]' : ''}`} strokeWidth={1.8} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* KPI Cards Component */}
          <ReportKpiCards
            totalCustomers={totalCustomers}
            totalPipelineValue={totalPipelineValue}
            totalCompanies={totalCompanies}
            conversionRate={conversionRate}
            isAdmin={isAdmin && filterMode === 'all'}
          />

          {/* Việc và lịch hôm nay — đặt ngay dưới KPI */}
          <TodayPanel />

          {/* Hàng biểu đồ 1 — donut & cột */}
          <div
            style={{ animationDelay: '260ms' }}
            className="grid grid-cols-1 gap-3 lg:grid-cols-[420px_minmax(0,1fr)] animate-fade-in-up"
          >
            <DonutChart
              title="Nguồn khách hàng"
              data={sourceData}
              unitLabel="khách hàng"
            />
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
              title={isAdmin && filterMode === 'all' ? 'Hiệu suất bán hàng theo nhân viên' : 'Doanh số theo lĩnh vực'}
            />
          </div>

          {/* Recent Activity Table Component */}
          <div style={{ animationDelay: '420ms' }} className="animate-fade-in-up">
            <RecentActivityTable customers={recentCustomers} />
          </div>
        </div>
      )}
    </AppLayout>
  );
};
