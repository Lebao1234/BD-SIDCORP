import React, { useState } from 'react';
import { GitCommit, ChevronDown } from 'lucide-react';
import { ChartCard } from './ChartCard';
import { formatAxisVnd, formatVndCompact } from '../../utils/formatters';

interface SalesPipelineStepChartProps {
  monthly?: Array<{ month: number; value: number; count?: number }>;
}

/* ==========================================================================
   KẾT QUẢ THEO QUÝ
   --------------------------------------------------------------------------
   Ba tháng của quý đang chọn, hai chỉ số: số khách mới và giá trị. Bản trước
   vẽ đường bậc thang có thêm các bậc nhô lên cố định (không ứng với dữ liệu nào)
   và tự thay số của quý bằng tổng toàn thời gian khi quý chưa có dữ liệu — nên
   con số hiển thị không khớp với nhãn. Giờ mỗi cột là đúng một tháng.
   ========================================================================== */

const QUARTERS = [1, 2, 3, 4] as const;

const MiniColumns: React.FC<{
  values: number[];
  months: number[];
  color: string;
  format: (v: number) => string;
  /** Nhãn ngắn trên đầu cột (cột hẹp, không đủ chỗ cho "638 triệu ₫"). */
  short?: (v: number) => string;
}> = ({ values, months, color, format, short = format }) => {
  const max = Math.max(...values, 0);
  return (
    <div className="mt-5 flex h-40 gap-3">
      {values.map((v, i) => (
        <div key={months[i]} className="flex h-full flex-1 flex-col items-center">
          {/* Cột cao nhất chiếm 80% vùng vẽ, chừa chỗ cho nhãn giá trị phía trên */}
          <div className="flex w-full flex-1 flex-col items-center justify-end gap-1">
            <span className="tnum whitespace-nowrap text-2xs text-fg-muted">{v > 0 ? short(v) : ''}</span>
            <div
              title={`Tháng ${months[i]}: ${format(v)}`}
              style={{ height: max > 0 ? `${(v / max) * 80}%` : '0%', backgroundColor: color }}
              className={`w-full max-w-12 rounded-t-[4px] ${v > 0 ? 'min-h-[2px]' : ''}`}
            />
          </div>
          <div className="h-px w-full bg-line" />
          <span className="mt-1.5 text-xs text-fg-subtle">Th{months[i]}</span>
        </div>
      ))}
    </div>
  );
};

export const SalesPipelineStepChart: React.FC<SalesPipelineStepChartProps> = ({ monthly = [] }) => {
  const [quarter, setQuarter] = useState(() => Math.floor(new Date().getMonth() / 3) + 1);

  const months = [0, 1, 2].map((i) => (quarter - 1) * 3 + 1 + i);
  const rows = months.map((m) => monthly.find((x) => x.month === m));
  const counts = rows.map((r) => r?.count ?? 0);
  const values = rows.map((r) => r?.value ?? 0);

  const totalCount = counts.reduce((a, b) => a + b, 0);
  const totalValue = values.reduce((a, b) => a + b, 0);

  return (
    <ChartCard
      title="Kết quả theo quý"
      icon={GitCommit}
      actions={
        <div className="relative">
          <select
            value={quarter}
            onChange={(e) => setQuarter(Number(e.target.value))}
            aria-label="Chọn quý"
            className="h-7 cursor-pointer appearance-none rounded-control border border-line bg-surface pl-2.5 pr-7 text-xs font-medium text-fg transition hover:border-line-strong"
          >
            {QUARTERS.map((q) => (
              <option key={q} value={q}>
                Quý {q}, {new Date().getFullYear()}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
        </div>
      }
    >
      <div className="mt-4 grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col">
          <span className="text-xs text-fg-subtle">Khách hàng mới</span>
          <span className="tnum text-title font-semibold text-fg">{totalCount.toLocaleString('vi-VN')}</span>
          <MiniColumns values={counts} months={months} color="var(--series-1)" format={(v) => `${v}`} />
        </div>

        <div className="flex flex-col border-t border-divider pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <span className="text-xs text-fg-subtle">Giá trị</span>
          <span className="tnum text-title font-semibold text-fg">{formatVndCompact(totalValue)}</span>
          <MiniColumns values={values} months={months} color="var(--series-2)" format={formatVndCompact} short={formatAxisVnd} />
        </div>
      </div>
    </ChartCard>
  );
};
