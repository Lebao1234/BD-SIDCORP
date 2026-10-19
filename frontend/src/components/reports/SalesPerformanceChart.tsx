import React, { useState, useEffect } from 'react';
import { Panel } from './Panel';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export interface PerformanceItem {
  label: string;
  count: number;
  revenue: number;
}

interface SalesPerformanceChartProps {
  data: PerformanceItem[];
  title?: string;
}

export const SalesPerformanceChart: React.FC<SalesPerformanceChartProps> = ({
  data,
  title = 'Doanh số theo lĩnh vực',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [entranceDone, setEntranceDone] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Hiệu ứng xuất hiện chỉ chạy MỘT LẦN lúc gắn vào cây.
  //
  // Bản cũ để `[data]` trong mảng phụ thuộc và gọi `setIsLoaded(false)` mỗi lần
  // dữ liệu đổi, nên cứ mỗi lần làm mới mà có một con số khác đi là toàn bộ
  // thanh/cung tụt về 0 rồi mọc lại. Trên trang chủ, nơi dữ liệu tự làm mới
  // ngầm, người dùng thấy biểu đồ nhấp nháy mà không hiểu vì sao.
  //
  // Giữ `isLoaded` đúng một lần thì lúc dữ liệu đổi, CSS transition có sẵn tự
  // chuyển mượt từ giá trị cũ sang giá trị mới — đúng thứ người xem cần thấy.
  useEffect(() => {
    const timer = setTimeout(() => setEntranceDone(true), 90);
    return () => clearTimeout(timer);
  }, []);

  // Bật cổng ngay khi người dùng chọn giảm chuyển động: nếu vẫn chờ hết hẹn giờ
  // thì biểu đồ đứng ở mức 0 một nhịp rồi nhảy phắt sang giá trị thật — còn khó
  // chịu hơn chính hiệu ứng mà tuỳ chọn đó muốn tắt. Tính luôn trong lúc render
  // nên không cần thêm một lần setState trong effect.
  const isLoaded = prefersReducedMotion || entranceDone;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  const formatShortValue = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1).replace('.0', '').replace('.', ',')} tỷ`;
    if (val >= 1_000_000) return `${Math.round(val / 1_000_000).toLocaleString('vi-VN')} tr`;
    if (val === 0) return '—';
    return `${val.toLocaleString('vi-VN')} ₫`;
  };

  return (
    <Panel title={title} subtitle="Doanh số và số lượng thương vụ phụ trách" bodyClassName="p-4 sm:p-5">
      {data.length === 0 ? (
        <div className="py-8 text-center text-xs text-fg-faint">
          Chưa có dữ liệu hiệu suất.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data.map((item, idx) => {
            const barWidth = Math.round((item.revenue / maxRevenue) * 100);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className={`group flex flex-col gap-1.5 rounded-control px-2.5 py-2 transition-colors cursor-default ${
                  isHovered ? 'bg-surface-alt' : ''
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-2.5 text-xs">
                  {/* Huy hiệu thứ hạng Top 1, 2, 3 */}
                  <span
                    className={`tnum w-4 shrink-0 text-right text-2xs ${
                      idx < 3 ? 'font-semibold text-fg-muted' : 'text-fg-faint'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Tên lĩnh vực / nhân viên */}
                  <span className={`min-w-0 flex-1 truncate transition-colors ${
                    isHovered
                      ? 'font-semibold text-fg'
                      : 'text-fg-body font-medium'
                  }`}>
                    {item.label}
                  </span>

                  {/* Số lượng khách hàng */}
                  <span className="tnum text-fg-faint text-xs">
                    {item.count} khách
                  </span>

                  {/* Doanh số */}
                  <span className="tnum w-20 text-right text-sm font-semibold text-fg">
                    {formatShortValue(item.revenue)}
                  </span>
                </div>

                {/* Thanh tỷ trọng doanh số so với người dẫn đầu */}
                <div className="ml-[26px] h-1.5 overflow-hidden rounded-full bg-raised">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-700 ease-out"
                    style={{
                      width: `${isLoaded && item.revenue > 0 ? Math.max(barWidth, 3) : 0}%`,
                      transitionDelay: `${idx * 60}ms`,
                      opacity: isHovered ? 1 : 0.8,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
};
