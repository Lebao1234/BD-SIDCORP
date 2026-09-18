import React, { useState, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import { Panel } from './Panel';
import { AnimatedCounter } from '../common/AnimatedCounter';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title?: string;
  subtitle?: string;
  data: DonutSegment[];
  unitLabel?: string;
  onExport?: () => void;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title = 'Nguồn khách hàng',
  subtitle,
  data,
  unitLabel = 'khách hàng',
  onExport,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Kích hoạt animation chuyển động mượt mà bằng CSS transitions
  useEffect(() => {
    setIsLoaded(false);
    const timer = setTimeout(() => setIsLoaded(true), 60);
    return () => clearTimeout(timer);
  }, [data]);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const defaultColors = ['#e8732c', '#3f7dbd', '#7a9a5b', '#b9b4ab', '#7a5bbd', '#b5730f'];

  // Bán kính chuẩn sao cho chu vi vòng tròn = 100 để tính % trực tiếp (2 * PI * 15.9155 ≈ 100)
  const radius = 15.9155;

  // Tính toán vị trí offset góc bắt đầu cho từng phân đoạn
  const segments = useMemo(() => {
    let currentOffset = 25; // Bắt đầu từ 12 giờ (đỉnh vòng tròn)
    return data.map((item, idx) => {
      const pct = total > 0 ? (item.value / total) * 100 : 0;
      const offset = currentOffset;
      currentOffset -= pct;
      return {
        ...item,
        pct,
        offset,
        color: item.color || defaultColors[idx % defaultColors.length]
      };
    });
  }, [data, total]);

  const handleExportCSV = () => {
    if (onExport) {
      onExport();
      return;
    }
    const headers = ['Nguồn', 'Số lượng', 'Tỷ lệ'];
    const rows = data.map((d) => [d.label, d.value, total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : '0%']);
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((r) => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <Panel
      title={title}
      subtitle={subtitle ?? `${total.toLocaleString('vi-VN')} ${unitLabel}`}
      bodyClassName="p-4 sm:p-5"
      actions={
        <button
          onClick={handleExportCSV}
          className="flex h-[30px] items-center gap-1.5 rounded-control border border-line bg-surface px-2.5
            text-xs font-medium text-fg-muted transition hover:text-fg hover:border-zinc-300
            dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#a8a49d] dark:hover:text-[#f2f0ed] cursor-pointer shadow-2xs active:scale-98"
          title="Xuất dữ liệu ra CSV"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
          <span>Xuất CSV</span>
        </button>
      }
    >
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        {/* Vòng tròn Donut SVG */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg width="148" height="148" viewBox="0 0 42 42" className="shrink-0 overflow-visible">
            {/* Vòng đệm nền (Track) */}
            <circle
              cx="21"
              cy="21"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-zinc-100 dark:text-zinc-800/80 transition-colors"
            />

            {/* Các phân đoạn có dữ liệu */}
            {total > 0 &&
              segments.map((seg, idx) => {
                if (seg.value === 0) return null;
                const isHovered = hoveredIdx === idx;
                const animatedPct = isLoaded ? seg.pct : 0;
                // Nếu chỉ có 1 phân đoạn duy nhất chiếm 100% thì không cần khoảng hở
                const hasMultiple = segments.filter(s => s.value > 0).length > 1;
                const strokeDash = hasMultiple && animatedPct > 3 ? Math.max(animatedPct - 1.2, 0.5) : animatedPct;
                const gap = 100 - strokeDash;

                return (
                  <circle
                    key={idx}
                    cx="21"
                    cy="21"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? 6.8 : 5.2}
                    strokeDasharray={`${strokeDash} ${gap}`}
                    strokeDashoffset={seg.offset}
                    strokeLinecap={hasMultiple ? 'round' : 'butt'}
                    className="cursor-pointer transition-all duration-700 ease-out"
                    style={{
                      transitionProperty: 'stroke-dasharray, stroke-width, opacity, filter',
                      transitionDuration: '700ms, 250ms, 250ms, 250ms',
                      opacity: hoveredIdx === null || isHovered ? 1 : 0.45,
                      filter: isHovered ? 'drop-shadow(0 2px 5px rgba(0,0,0,0.18))' : 'none',
                    }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
          </svg>

          {/* Tâm hiển thị thông tin khi hover hoặc tổng số */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-2 text-center animate-fade-in">
            <span className="tnum text-2xl font-bold leading-none tracking-tight text-zinc-900 dark:text-white transition-all">
              {activeSegment ? (
                activeSegment.value.toLocaleString('vi-VN')
              ) : (
                <AnimatedCounter value={total} duration={800} />
              )}
            </span>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1 max-w-[90px] truncate transition-all">
              {activeSegment ? `${Math.round(activeSegment.pct)}%` : unitLabel}
            </span>
            {activeSegment && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-[85px] truncate mt-0.5">
                {activeSegment.label}
              </span>
            )}
          </div>
        </div>

        {/* Chú giải tương tác (Interactive Legend) */}
        <div className="flex min-w-[200px] flex-1 flex-col gap-2 w-full">
          {segments.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const hasData = item.value > 0;

            return (
              <div
                key={idx}
                className={`group flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-1.5 transition-all ${
                  isHovered
                    ? 'bg-zinc-100/90 dark:bg-zinc-800/80 shadow-2xs scale-[1.01]'
                    : hasData
                    ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    : 'opacity-40 hover:opacity-75'
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Chấm màu & Tên nguồn */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform group-hover:scale-125"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={`text-xs truncate transition-colors ${
                    isHovered
                      ? 'font-semibold text-zinc-900 dark:text-white'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {item.label}
                  </span>
                </div>

                {/* Số liệu & Tỷ lệ % */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="tnum text-xs font-semibold text-zinc-900 dark:text-zinc-100 min-w-[20px] text-right">
                    {item.value.toLocaleString('vi-VN')}
                  </span>
                  <span className="tnum text-xs font-medium text-zinc-400 dark:text-zinc-500 w-10 text-right">
                    {Math.round(item.pct)}%
                  </span>
                </div>
              </div>
            );
          })}

          {data.length === 0 && (
            <div className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
              Chưa có dữ liệu nguồn khách hàng.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};
