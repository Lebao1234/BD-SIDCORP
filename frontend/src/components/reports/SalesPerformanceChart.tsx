import React, { useState, useEffect } from 'react';
import { Panel } from './Panel';

export interface PerformanceItem {
  label: string;
  count: number;
  revenue: number;
}

interface SalesPerformanceChartProps {
  data: PerformanceItem[];
  title?: string;
}

/* ==========================================================================
   HIỆU SUẤT BÁN HÀNG
   --------------------------------------------------------------------------
   Bảng xếp hạng dạng danh sách: số thứ tự, tên, số khách, doanh số căn phải
   và thanh ngang mảnh. Có hiệu ứng mở rộng mượt mà khi tải dữ liệu.
   ========================================================================== */

export const SalesPerformanceChart: React.FC<SalesPerformanceChartProps> = ({
  data,
  title = 'Hiệu suất bán hàng theo nhân viên',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 90);
    return () => clearTimeout(timer);
  }, [data]);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  const formatShortValue = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
    if (val >= 1_000_000) return `${Math.round(val / 1_000_000).toLocaleString('vi-VN')} tr`;
    if (val === 0) return '—';
    return val.toLocaleString('vi-VN');
  };

  return (
    <Panel title={title} subtitle="Doanh số và số lượng thương vụ phụ trách" bodyClassName="p-4">
      {data.length === 0 ? (
        <div className="py-8 text-center text-xs text-fg-empty dark:text-[#5c574f]">Chưa có dữ liệu hiệu suất.</div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {data.map((item, idx) => {
            const barWidth = Math.round((item.revenue / maxRevenue) * 100);
            return (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="tnum w-3.5 shrink-0 text-fg-faint dark:text-[#7f7b74]">{idx + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-fg-body dark:text-[#cdc9c2]">{item.label}</span>
                  <span className="tnum text-fg-faint dark:text-[#7f7b74]">{item.count} khách</span>
                  <span className="tnum w-20 text-right font-medium text-fg dark:text-[#f2f0ed]">
                    {formatShortValue(item.revenue)}
                  </span>
                </div>
                <div className="ml-[22px] h-1.5 overflow-hidden rounded-full bg-divider dark:bg-[#2a2724]">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${isLoaded ? Math.max(barWidth, 2) : 0}%`,
                      transition: `width 850ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 85}ms`,
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
