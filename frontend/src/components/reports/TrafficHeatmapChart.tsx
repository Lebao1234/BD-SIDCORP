import React from 'react';
import { Share2 } from 'lucide-react';
import { ChartCard } from './ChartCard';

interface TrafficHeatmapChartProps {
  sourceCounts?: Array<{ source: string; count: number }>;
}

/* ==========================================================================
   NGUỒN KHÁCH HÀNG
   --------------------------------------------------------------------------
   Một thanh tỷ trọng 100% + danh sách từng nguồn với số khách và phần trăm.
   Bản trước là ma trận "nguồn × tuần" nhưng máy chủ không có số liệu theo tuần:
   ô nào cao/thấp được gán cứng theo thứ hạng của nguồn — trông như dữ liệu
   nhưng không phải. Ở đây mọi con số đều lấy từ sourceCounts.
   ========================================================================== */

// Ba nguồn lớn nhất mỗi nguồn một màu, phần còn lại gộp thành "Nguồn khác" (xám).
// Không dùng --series-low: ở chế độ tối nó gần trùng màu nền thẻ.
const COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)'];
const OTHER_COLOR = 'var(--series-other)';

export const TrafficHeatmapChart: React.FC<TrafficHeatmapChartProps> = ({ sourceCounts = [] }) => {
  // Gom cả nguồn null, chuỗi rỗng và chuỗi 'null' về cùng nhãn "Trực tiếp / Chưa gán"
  const merged = new Map<string, number>();
  for (const s of sourceCounts) {
    const raw = (s.source ?? '').trim();
    const cleanSource = (!raw || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined')
      ? 'Trực tiếp / Chưa gán'
      : raw;
    merged.set(cleanSource, (merged.get(cleanSource) ?? 0) + s.count);
  }
  const sorted = Array.from(merged, ([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
  const total = sorted.reduce((a, s) => a + s.count, 0);

  const top = sorted.slice(0, 3).map((s, i) => ({ label: s.source || 'Trực tiếp / Chưa gán', count: s.count, color: COLORS[i] }));
  const restCount = sorted.slice(3).reduce((a, s) => a + s.count, 0);
  const segments = restCount > 0 ? [...top, { label: 'Nguồn khác', count: restCount, color: OTHER_COLOR }] : top;

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <ChartCard
      title="Nguồn khách hàng"
      icon={Share2}
      actions={<span className="tnum text-xs text-fg-subtle">{total.toLocaleString('vi-VN')} khách</span>}
    >
      {total === 0 ? (
        <p className="my-auto py-10 text-center text-sm text-fg-subtle">Chưa có dữ liệu nguồn khách hàng.</p>
      ) : (
        <>
          <div className="mt-5 flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Tỷ trọng nguồn khách hàng">
            {segments.map((s) => (
              <div
                key={s.label}
                title={`${s.label}: ${s.count} khách (${pct(s.count)}%)`}
                style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
                className="h-full min-w-[3px]"
              />
            ))}
          </div>

          <ul className="mt-5 flex flex-col divide-y divide-divider">
            {segments.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 py-2.5 text-sm first:pt-0 last:pb-0">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="min-w-0 flex-1 truncate text-fg-body" title={s.label}>
                  {s.label}
                </span>
                <span className="tnum font-medium text-fg">{s.count}</span>
                <span className="tnum w-10 text-right text-xs text-fg-subtle">{pct(s.count)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </ChartCard>
  );
};
