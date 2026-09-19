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
        <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Chưa có dữ liệu hiệu suất.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data.map((item, idx) => {
            const barWidth = Math.round((item.revenue / maxRevenue) * 100);
            const isHovered = hoveredIdx === idx;
            const isTop1 = idx === 0;
            const isTop2 = idx === 1;
            const isTop3 = idx === 2;

            return (
              <div
                key={idx}
                className={`group flex flex-col gap-1.5 rounded-xl px-2.5 py-1.5 transition-all cursor-pointer ${
                  isHovered ? 'bg-zinc-50 dark:bg-zinc-800/60 shadow-2xs' : 'hover:bg-zinc-50/50'
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-2.5 text-xs">
                  {/* Huy hiệu thứ hạng Top 1, 2, 3 */}
                  <span
                    className={`h-4.5 w-4.5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isTop1
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-400/30'
                        : isTop2
                        ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        : isTop3
                        ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Tên lĩnh vực / nhân viên */}
                  <span className={`min-w-0 flex-1 truncate transition-colors ${
                    isHovered
                      ? 'font-semibold text-zinc-900 dark:text-white'
                      : 'text-zinc-700 dark:text-zinc-300 font-medium'
                  }`}>
                    {item.label}
                  </span>

                  {/* Số lượng khách hàng */}
                  <span className="tnum text-zinc-400 dark:text-zinc-500 text-xs">
                    {item.count} khách
                  </span>

                  {/* Doanh số */}
                  <span className={`tnum w-20 text-right font-bold text-xs ${
                    isTop1 ? 'text-[#e8732c]' : 'text-zinc-900 dark:text-zinc-100'
                  }`}>
                    {formatShortValue(item.revenue)}
                  </span>
                </div>

                {/* Thanh tiến độ có gradient và góc bo mềm mại */}
                <div className="ml-[26px] h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isTop1
                        ? 'bg-gradient-to-r from-[#e8732c] to-[#f97316]'
                        : 'bg-[#e8732c]/80'
                    }`}
                    style={{
                      width: `${isLoaded && item.revenue > 0 ? Math.max(barWidth, 3) : 0}%`,
                      transitionDelay: `${idx * 60}ms`,
                      opacity: isHovered ? 1 : 0.85,
                      filter: isHovered ? 'brightness(1.1)' : 'none',
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
