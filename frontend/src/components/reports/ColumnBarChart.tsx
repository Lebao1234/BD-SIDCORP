import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Panel } from './Panel';

export interface ColumnBarData {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface ColumnBarChartProps {
  title?: string;
  subtitle?: string;
  data: ColumnBarData[];
  valuePrefix?: string;
  valueSuffix?: string;
  onExport?: () => void;
}

/* ==========================================================================
   BIỂU ĐỒ CỘT
   --------------------------------------------------------------------------
   Cột phẳng một màu, có trục tung và vạch lưới ngang như mẫu tham chiếu.
   Có hiệu ứng mọc cột mượt mà (smooth grow) khi vừa tải trang.
   ========================================================================== */

export const ColumnBarChart: React.FC<ColumnBarChartProps> = ({
  title = 'Giá trị hợp đồng theo tháng',
  subtitle,
  data,
  valuePrefix = '',
  valueSuffix = '',
  onExport,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 80);
    return () => clearTimeout(timer);
  }, [data]);

  const rawMax = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue ?? 0)), 1);
  // Làm tròn trần lên bậc "đẹp" để bốn nhãn trục tung không ra số lẻ.
  const step = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const axisMax = Math.ceil(rawMax / step) * step;
  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);

  const formatAxis = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1).replace('.', ',')}T`;
    if (val >= 1_000_000) return `${Math.round(val / 1_000_000)}Tr`;
    if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
    return `${val}`;
  };

  const handleExportCSV = () => {
    if (onExport) {
      onExport();
      return;
    }
    const headers = ['Kỳ', 'Giá trị', 'Giá trị phụ'];
    const rows = data.map((d) => [d.label, d.value, d.secondaryValue ?? 0]);
    const csv = 'data:text/csv;charset=utf-8,﻿' + [headers, ...rows].map((r) => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Panel
      title={title}
      subtitle={subtitle}
      bodyClassName="p-4"
      actions={
        <>
          <div className="hidden items-center gap-3.5 text-[11px] text-fg-subtle sm:flex dark:text-[#8f8b84]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[2px] bg-brand" />
              Giá trị ghi nhận
            </span>
            {hasSecondary && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] bg-line-strong" />
                Đang mở
              </span>
            )}
          </div>
          <button
            onClick={handleExportCSV}
            className="flex h-[30px] items-center gap-1.5 rounded-control border border-line bg-surface px-2.5
              text-xs font-medium text-fg-muted transition hover:text-fg
              dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#a8a49d] dark:hover:text-[#f2f0ed]"
            title="Xuất dữ liệu ra CSV"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            Xuất CSV
          </button>
        </>
      }
    >
      <div className="flex gap-3.5">
        {/* Trục tung */}
        <div className="flex w-10 shrink-0 flex-col items-end justify-between pb-[26px]" style={{ height: 196 }}>
          {[1, 0.75, 0.5, 0.25, 0].map((f) => (
            <span key={f} className="tnum text-[11px] leading-none text-fg-faint dark:text-[#7f7b74]">
              {formatAxis(Math.round(axisMax * f))}
            </span>
          ))}
        </div>

        {/* Vùng cột */}
        <div className="relative flex-1 border-l border-divider pl-3.5 dark:border-[#2a2724]">
          <div className="pointer-events-none absolute inset-x-0 left-3.5 top-0 flex flex-col justify-between" style={{ height: 170 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-t border-divider dark:border-[#2a2724]" />
            ))}
          </div>

          <div className="relative grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))` }}>
            {data.map((item, idx) => {
              const primaryPct = Math.round((item.value / axisMax) * 100);
              const secondaryPct = Math.round(((item.secondaryValue ?? 0) / axisMax) * 100);
              return (
                <div
                  key={idx}
                  className="flex flex-col justify-end gap-2"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div className="relative flex items-end gap-[3px]" style={{ height: 170 }}>
                    {hoveredIdx === idx && item.value > 0 && (
                      <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-chip
                        border border-line-strong bg-surface px-2 py-1 text-[11px] font-medium text-fg
                        dark:border-[#3d3934] dark:bg-[#2c2a27] dark:text-[#f2f0ed]">
                        {valuePrefix}
                        {item.value.toLocaleString('vi-VN')}
                        {valueSuffix}
                      </div>
                    )}
                    <div
                      className="flex-1 rounded-t-[3px] bg-brand hover:brightness-110 cursor-pointer"
                      style={{
                        height: `${isLoaded && item.value > 0 ? Math.max(primaryPct, 1) : 0}%`,
                        transition: `height 850ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 65}ms, filter 150ms ease`,
                      }}
                    />
                    {hasSecondary && (
                      <div
                        className="flex-1 rounded-t-[3px] bg-line-strong hover:brightness-110 cursor-pointer dark:bg-[#3d3934]"
                        style={{
                          height: `${isLoaded ? secondaryPct : 0}%`,
                          transition: `height 850ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 65 + 30}ms, filter 150ms ease`,
                        }}
                      />
                    )}
                  </div>
                  <div className="truncate text-center text-[11px] text-fg-subtle dark:text-[#8f8b84]">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
};
