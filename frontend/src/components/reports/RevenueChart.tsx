import React, { useState } from 'react';
import { BarChart2, ChevronDown } from 'lucide-react';
import { ChartCard } from './ChartCard';
import { formatAxisVnd, formatVndCompact } from '../../utils/formatters';
import {
  useRevenueReport,
  type ReportScope,
  type RevenueRange,
  type RevenueStage,
  type RevenueReport,
} from '../../hooks/useReportSummary';

/* ==========================================================================
   DOANH THU — tổng theo bộ lọc
   --------------------------------------------------------------------------
   "Doanh thu" = tổng số tiền đã BÁO GIÁ cho khách, không phải tiền thu về.
   Hai bộ lọc: khoảng thời gian và nhóm báo giá (tất cả / đang chờ / đã chốt).
   Số lớn là tổng của kỳ đã chọn, so với kỳ liền trước cùng độ dài; biểu đồ cột
   chia kỳ đó theo ngày / tháng / năm (máy chủ tự chọn theo độ dài kỳ).

   Mốc thời gian là ngày tạo khách — hệ thống chưa lưu ngày gửi báo giá.
   ========================================================================== */

const RANGE_OPTIONS: Array<{ value: RevenueRange; label: string; prev: string }> = [
  { value: '7d', label: '7 ngày qua', prev: '7 ngày trước đó' },
  { value: '30d', label: '30 ngày qua', prev: '30 ngày trước đó' },
  { value: 'month', label: 'Tháng này', prev: 'cùng kỳ tháng trước' },
  { value: 'quarter', label: 'Quý này', prev: 'cùng kỳ quý trước' },
  { value: 'year', label: 'Năm nay', prev: 'cùng kỳ năm trước' },
  { value: 'all', label: 'Toàn thời gian', prev: '' },
];

const STAGE_OPTIONS: Array<{ value: RevenueStage; label: string }> = [
  { value: 'all', label: 'Tất cả dự án' },
  { value: 'quoted', label: 'Đã gửi báo giá' },
  { value: 'won', label: 'Đã chốt hợp đồng' },
];

const WEEKDAY = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

// Bộ lọc là tuỳ chọn riêng của người xem: nhớ lại lần chọn trước nếu trình
// duyệt cho phép, không thì dùng mặc định.
const STORE_KEY = 'dashboard_revenue_filter';
const readFilter = (): { range: RevenueRange; stage: RevenueStage } => {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (RANGE_OPTIONS.some((o) => o.value === v?.range) && STAGE_OPTIONS.some((o) => o.value === v?.stage)) return v;
  } catch {
    /* bỏ qua */
  }
  return { range: 'all', stage: 'all' };
};

const niceMax = (v: number) => {
  if (v <= 0) return 0;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 5, 10].find((m) => m * p >= v) ?? 10) * p;
};

const parts = (key: string) => key.split('-').map(Number) as [number, number, number];

const shortLabel = (key: string, unit: RevenueReport['unit'], multiYear: boolean) => {
  const [y, m, d] = parts(key);
  if (unit === 'year') return `${y}`;
  if (unit === 'month') return multiYear ? `Th${m}/${String(y).slice(2)}` : `Th${m}`;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
};

const longLabel = (key: string, unit: RevenueReport['unit']) => {
  const [y, m, d] = parts(key);
  if (unit === 'year') return `Năm ${y}`;
  if (unit === 'month') return `Tháng ${m}, ${y}`;
  return `${WEEKDAY[new Date(y, m - 1, d).getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
};

const FilterSelect = <T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  label: string;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      aria-label={label}
      className="h-8 cursor-pointer appearance-none rounded-control border border-line bg-surface pl-2.5 pr-7 text-xs font-medium text-fg transition hover:border-line-strong"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
  </div>
);

export const RevenueChart: React.FC<{ scope: ReportScope }> = ({ scope }) => {
  const [filter, setFilter] = useState(readFilter);
  const [hovered, setHovered] = useState<number | null>(null);
  // Ngày hôm nay theo giờ VN (YYYY-MM-DD) để làm mờ các mốc chưa tới.
  const [todayKey] = useState(() => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10));

  const update = (next: Partial<typeof filter>) => {
    const merged = { ...filter, ...next };
    setFilter(merged);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(merged));
    } catch {
      /* bỏ qua */
    }
  };

  const { data, isLoading, isError, isPlaceholderData } = useRevenueReport(scope, filter.range, filter.stage);

  const buckets = data?.buckets ?? [];
  const unit = data?.unit ?? 'day';
  const maxAxis = niceMax(Math.max(0, ...buckets.map((b) => b.value)));
  const multiYear = new Set(buckets.map((b) => b.key.slice(0, 4))).size > 1;
  // Kỳ dài (30 ngày, 31 ngày) không đủ chỗ ghi nhãn từng cột: ghi cách quãng.
  const labelEvery = buckets.length > 14 ? Math.ceil(buckets.length / 8) : 1;

  const total = data?.total ?? 0;
  const prev = data?.prevTotal ?? null;
  const change = prev !== null && prev > 0 ? Math.round(((total - prev) / prev) * 100) : null;
  const rangeInfo = RANGE_OPTIONS.find((o) => o.value === filter.range)!;
  const avg = data && data.withPrice > 0 ? total / data.withPrice : 0;

  const isAllProjects = filter.stage === 'all';
  const stageUnitLabel = isAllProjects ? 'dự án' : filter.stage === 'won' ? 'hợp đồng' : 'báo giá';

  return (
    <ChartCard
      title="Doanh thu"
      icon={BarChart2}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="Phân loại" value={filter.stage} options={STAGE_OPTIONS} onChange={(stage) => update({ stage })} />
          <FilterSelect label="Khoảng thời gian" value={filter.range} options={RANGE_OPTIONS} onChange={(range) => update({ range })} />
        </div>
      }
    >
      <div
        className={`mt-4 flex flex-col gap-6 transition-opacity duration-200 lg:flex-row lg:gap-8 ${
          isPlaceholderData ? 'opacity-60' : ''
        }`}
      >
        {/* Chỉ số — cột trái trên màn rộng, hàng trên trên màn hẹp */}
        <div className="flex flex-col gap-5 lg:w-64 lg:shrink-0 lg:border-r lg:border-divider lg:pr-8">
          <div className="flex flex-col">
            <span className="text-xs text-fg-subtle">
              {isAllProjects ? 'Tổng giá trị dự án' : 'Tổng doanh thu'} · {rangeInfo.label.toLowerCase()}
            </span>
            {isLoading ? (
              <span className="skeleton mt-1 h-8 w-40" />
            ) : (
              <span className="tnum text-kpi font-semibold text-fg">{formatVndCompact(total)}</span>
            )}
            {!isLoading && prev !== null && (
              <span className="mt-1 text-xs text-fg-subtle">
                {change !== null ? (
                  <>
                    <span className={`tnum font-semibold ${change >= 0 ? 'text-ok' : 'text-danger'}`}>
                      {change >= 0 ? '+' : ''}
                      {change.toLocaleString('vi-VN')}%
                    </span>{' '}
                    so với {rangeInfo.prev} ({formatVndCompact(prev)})
                  </>
                ) : (
                  `${rangeInfo.prev.charAt(0).toUpperCase()}${rangeInfo.prev.slice(1)} chưa có dữ liệu để so sánh`
                )}
              </span>
            )}
          </div>

          <div className="flex gap-8 border-t border-divider pt-4">
            <div className="flex flex-col">
              <span className="text-xs text-fg-subtle">Số {stageUnitLabel}</span>
              <span className="tnum text-md font-semibold text-fg">{(data?.count ?? 0).toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-fg-subtle">Trung bình / {stageUnitLabel}</span>
              <span className="tnum text-md font-semibold text-fg">{avg > 0 ? formatVndCompact(avg) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Biểu đồ cột */}
        <div className="relative flex h-60 min-w-0 flex-1 gap-3 pt-2">
          <div className="tnum -mt-2 flex w-11 shrink-0 flex-col justify-between pb-4 text-right text-2xs leading-4 text-fg-faint select-none">
            {[1, 0.5, 0].map((r) => (
              <span key={r}>{formatAxisVnd(maxAxis * r)}</span>
            ))}
          </div>

          <div className="relative flex min-w-0 flex-1 items-end gap-1">
            <div className="pointer-events-none absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-full border-b border-dashed border-line" />
              ))}
            </div>

            {!isLoading && (isError || maxAxis === 0) && (
              <div className="absolute inset-x-0 bottom-6 top-0 z-10 flex items-center justify-center">
                <span className="rounded-chip bg-surface px-2 text-xs text-fg-subtle">
                  {isError ? 'Không tải được số liệu doanh thu.' : `Chưa có ${stageUnitLabel} nào trong khoảng này`}
                </span>
              </div>
            )}

            {buckets.map((b, idx) => {
              const h = maxAxis > 0 ? (b.value / maxAxis) * 100 : 0;
              const active = hovered === idx;
              const future = unit === 'day' ? b.key > todayKey : b.key.slice(0, 7) > todayKey.slice(0, 7);
              // Không bật nhãn của cột đang trỏ: nó sẽ đè lên nhãn bên cạnh, tooltip đã ghi đủ ngày.
              const showLabel = idx % labelEvery === 0;
              return (
                <div
                  key={b.key}
                  className="relative z-10 flex h-full min-w-0 flex-1 flex-col items-center"
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {active && (
                    <div
                      className={`absolute -top-1 z-30 -translate-y-full whitespace-nowrap rounded-control border border-line bg-surface px-3 py-2 text-xs shadow-lg ${
                        idx < buckets.length / 3 ? 'left-0' : idx > (buckets.length * 2) / 3 ? 'right-0' : ''
                      }`}
                    >
                      <div className="font-semibold text-fg">{longLabel(b.key, unit)}</div>
                      <div className="tnum mt-0.5 text-fg-muted">
                        {future ? 'Chưa tới' : `${formatVndCompact(b.value)} · ${b.count} ${stageUnitLabel}`}
                      </div>
                    </div>
                  )}
                  <div className="flex w-full flex-1 flex-col items-center justify-end">
                    <div
                      style={{ height: `${h}%`, backgroundColor: 'var(--series-1)' }}
                      className={`w-full max-w-10 rounded-t-[3px] transition-[height,opacity] duration-300 ${
                        hovered !== null && !active ? 'opacity-45' : ''
                      } ${b.value > 0 ? 'min-h-[2px]' : ''}`}
                    />
                  </div>
                  <span
                    className={`tnum mt-2 h-4 whitespace-nowrap text-2xs select-none ${
                      active ? 'font-medium text-fg' : future ? 'text-fg-empty' : 'text-fg-subtle'
                    } ${showLabel ? '' : 'invisible'}`}
                  >
                    {shortLabel(b.key, unit, multiYear)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ChartCard>
  );
};
