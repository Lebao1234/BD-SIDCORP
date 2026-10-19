import React from 'react';
import { PieChart } from 'lucide-react';
import { ChartCard, LegendItem } from './ChartCard';

interface OrderStatusDonutChartProps {
  statusCounts?: Array<{ status: string; count: number }>;
}

/* ==========================================================================
   TÌNH TRẠNG KHÁCH HÀNG
   --------------------------------------------------------------------------
   Hai nhóm: đang theo đuổi (mọi trạng thái còn mở) và đã dừng / huỷ.
   ========================================================================== */

const STOPPED = ['REJECTED', 'STOPCONSULTING'];
const ACTIVE_COLOR = 'var(--series-1)';
// Xám trung tính: "đã dừng" không cần nổi bật, và vẫn đủ tương phản ở chế độ tối.
const STOPPED_COLOR = 'var(--series-other)';

export const OrderStatusDonutChart: React.FC<OrderStatusDonutChartProps> = ({ statusCounts = [] }) => {
  const stopped = statusCounts.filter((s) => STOPPED.includes(s.status)).reduce((a, s) => a + s.count, 0);
  const active = statusCounts.filter((s) => !STOPPED.includes(s.status)).reduce((a, s) => a + s.count, 0);
  const total = active + stopped;
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  // Khe hở 2 đơn vị giữa hai cung, chỉ khi cả hai cung đều có giá trị
  const gap = active > 0 && stopped > 0 ? 2 : 0;
  const activeLen = (active / (total || 1)) * circumference;

  return (
    <ChartCard title="Tình trạng khách hàng" icon={PieChart}>
      <div className="relative my-auto flex items-center justify-center py-4">
        <svg width="168" height="168" viewBox="0 0 100 100" className="-rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth={12} style={{ stroke: total > 0 ? STOPPED_COLOR : 'var(--color-raised)' }} />
          {active > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth={12}
              strokeDasharray={`${Math.max(activeLen - gap, 0)} ${circumference}`}
              strokeDashoffset={-gap / 2}
              style={{ stroke: ACTIVE_COLOR }}
              className="transition-[stroke-dasharray] duration-700 ease-out"
            />
          )}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-fg-subtle">Tổng khách</span>
          <span className="tnum text-title font-semibold text-fg">{total.toLocaleString('vi-VN')}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-divider pt-3.5">
        <LegendItem
          color={ACTIVE_COLOR}
          label={
            <>
              Đang theo đuổi <span className="tnum font-medium text-fg">{active}</span>
              <span className="tnum text-fg-faint"> · {activePct}%</span>
            </>
          }
        />
        <LegendItem
          color={STOPPED_COLOR}
          label={
            <>
              Đã dừng / Huỷ <span className="tnum font-medium text-fg">{stopped}</span>
              <span className="tnum text-fg-faint"> · {total > 0 ? 100 - activePct : 0}%</span>
            </>
          }
        />
      </div>
    </ChartCard>
  );
};
