import React, { useState, useEffect } from 'react';
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

/* ==========================================================================
   DONUT
   --------------------------------------------------------------------------
   Vòng tròn đặt bên trái, chú giải là danh sách dòng bên phải (nhãn — số —
   phần trăm) thay vì bốn ô vuông có viền như bản cũ. Cách này đọc nhanh hơn
   và không cần tô nền cho từng mục.
   ========================================================================== */

export const DonutChart: React.FC<DonutChartProps> = ({
  title = 'Nguồn khách hàng',
  subtitle,
  data,
  unitLabel = 'khách hàng',
  onExport,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let animationFrameId: number;
    const duration = 1000;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic: 1 - (1 - progress)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const delayTimer = setTimeout(() => {
      animationFrameId = requestAnimationFrame(animate);
    }, 80);

    return () => {
      clearTimeout(delayTimer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [data]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const defaultColors = ['#e8732c', '#3f7dbd', '#7a9a5b', '#b9b4ab', '#7a5bbd', '#b5730f'];

  // Vòng tròn vẽ theo hệ toạ độ 42×42, chu vi ≈ 100 nên stroke-dasharray
  // nhận thẳng giá trị phần trăm — không phải quy đổi qua 2πr.
  const radius = 15.9;
  let offsetAcc = 25; // 25 = xoay điểm bắt đầu lên đỉnh vòng tròn

  const handleExportCSV = () => {
    if (onExport) {
      onExport();
      return;
    }
    const headers = ['Nguồn', 'Số lượng', 'Tỷ lệ'];
    const rows = data.map((d) => [d.label, d.value, total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : '0%']);
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
      subtitle={subtitle ?? `${total.toLocaleString('vi-VN')} ${unitLabel}`}
      bodyClassName="p-4"
      actions={
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
      }
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative shrink-0">
          <svg width="132" height="132" viewBox="0 0 42 42" className="shrink-0">
            <circle cx="21" cy="21" r={radius} fill="none" stroke="currentColor" strokeWidth="5.5"
              className="text-divider dark:text-[#2a2724]" />
            {total > 0 &&
              data.map((item, idx) => {
                const fullPct = (item.value / total) * 100;
                const pct = fullPct * animProgress;
                const dashoffset = offsetAcc;
                offsetAcc -= pct;
                const color = item.color || defaultColors[idx % defaultColors.length];
                const isHovered = hoveredIdx === idx;
                return (
                  <circle
                    key={idx}
                    cx="21"
                    cy="21"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHovered ? 7.2 : 5.5}
                    strokeDasharray={`${pct} ${100 - pct}`}
                    strokeDashoffset={dashoffset}
                    className="cursor-pointer"
                    style={{
                      transition: 'stroke-width 200ms ease, opacity 200ms ease',
                      opacity: hoveredIdx === null || isHovered ? 1 : 0.6,
                    }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="tnum text-xl font-semibold leading-none tracking-[-0.02em] text-fg dark:text-[#f2f0ed]">
              {hoveredIdx !== null ? (
                data[hoveredIdx].value.toLocaleString('vi-VN')
              ) : (
                <AnimatedCounter value={total} duration={1000} />
              )}
            </span>
            <span className="max-w-[80px] truncate text-[11px] text-fg-faint dark:text-[#7f7b74]">
              {hoveredIdx !== null ? data[hoveredIdx].label : unitLabel}
            </span>
          </div>
        </div>

        <div className="flex min-w-[180px] flex-1 flex-col gap-2">
          {data.map((item, idx) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const color = item.color || defaultColors[idx % defaultColors.length];
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={idx}
                className={`flex cursor-pointer items-center gap-2.5 rounded px-2 py-1 -mx-2 transition ${
                  isHovered ? 'bg-raised dark:bg-[#2c2a27]' : ''
                }`}
                style={{
                  opacity: animProgress > 0 ? 1 : 0,
                  transform: `translateX(${animProgress > 0 ? 0 : -6}px)`,
                  transition: `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 70}ms, transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 70}ms, background-color 150ms ease`,
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
                <span className="min-w-0 flex-1 truncate text-xs text-fg-body dark:text-[#cdc9c2]">{item.label}</span>
                <span className="tnum text-xs font-medium text-fg dark:text-[#f2f0ed]">
                  {item.value.toLocaleString('vi-VN')}
                </span>
                <span className="tnum w-9 text-right text-xs text-fg-faint dark:text-[#7f7b74]">{pct}%</span>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="py-6 text-center text-xs text-fg-empty dark:text-[#5c574f]">Chưa có dữ liệu.</div>
          )}
        </div>
      </div>
    </Panel>
  );
};
