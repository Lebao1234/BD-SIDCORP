import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { ChartCard } from './ChartCard';
import { formatVndCompact } from '../../utils/formatters';

interface CategoryRadarChartProps {
  categories?: Array<{ name: string; value: number; count: number }>;
}

/* ==========================================================================
   DOANH THU THEO LĨNH VỰC
   --------------------------------------------------------------------------
   Thanh ngang xếp hạng thay cho biểu đồ radar: radar buộc người xem so diện
   tích trên các trục xoay vòng, còn thanh ngang so độ dài trên cùng một mốc.
   Bản radar trước còn ép điểm vào khoảng 30–90% (lĩnh vực nhỏ nhất trông như
   bằng một nửa lĩnh vực lớn nhất) và hiện năm lĩnh vực mẫu khi chưa có dữ liệu.
   ========================================================================== */

export const CategoryRadarChart: React.FC<CategoryRadarChartProps> = ({ categories = [] }) => {
  const [mode, setMode] = React.useState<'revenue' | 'count'>('revenue');

  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) =>
      mode === 'revenue' ? (b.value !== a.value ? b.value - a.value : b.count - a.count) : (b.count !== a.count ? b.count - a.count : b.value - a.value)
    );
  }, [categories, mode]);

  const rows = sortedCategories.slice(0, 5);
  const max = Math.max(...rows.map((c) => (mode === 'revenue' ? c.value : c.count)), 0);

  return (
    <ChartCard
      title="Doanh thu theo lĩnh vực"
      icon={LayoutGrid}
      actions={
        <div className="flex items-center rounded-control border border-line bg-surface p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('revenue')}
            className={`cursor-pointer rounded-chip px-2 py-0.5 text-xs transition ${
              mode === 'revenue' ? 'bg-raised font-semibold text-fg shadow-2xs' : 'text-fg-subtle hover:text-fg'
            }`}
          >
            Doanh số
          </button>
          <button
            type="button"
            onClick={() => setMode('count')}
            className={`cursor-pointer rounded-chip px-2 py-0.5 text-xs transition ${
              mode === 'count' ? 'bg-raised font-semibold text-fg shadow-2xs' : 'text-fg-subtle hover:text-fg'
            }`}
          >
            Số KH
          </button>
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="my-auto py-10 text-center text-sm text-fg-subtle">Chưa có khách hàng nào được gắn lĩnh vực.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3.5">
          {rows.map((c, i) => {
            const metricVal = mode === 'revenue' ? c.value : c.count;
            const barWidth = max > 0 ? `${Math.max((metricVal / max) * 100, metricVal > 0 ? 3 : 0)}%` : '0%';
            return (
              <li key={c.name} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-fg-body font-medium" title={c.name}>
                    {c.name}
                  </span>
                  <span className="tnum shrink-0 font-medium text-fg">
                    {mode === 'revenue' ? formatVndCompact(c.value) : `${c.count} khách`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: barWidth,
                        backgroundColor: i === 0 ? 'var(--series-1)' : 'var(--series-2)',
                      }}
                    />
                  </div>
                  <span className="tnum w-20 shrink-0 text-right text-xs text-fg-subtle">
                    {mode === 'revenue' ? `${c.count} khách` : formatVndCompact(c.value)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
};
