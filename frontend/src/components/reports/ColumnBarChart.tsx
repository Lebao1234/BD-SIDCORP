import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Panel } from './Panel';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

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

export const ColumnBarChart: React.FC<ColumnBarChartProps> = ({
  title = 'Doanh số theo tháng',
  subtitle,
  data,
  valuePrefix = '',
  valueSuffix = ' ₫',
  onExport,
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
    const timer = setTimeout(() => setEntranceDone(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Bật cổng ngay khi người dùng chọn giảm chuyển động: nếu vẫn chờ hết hẹn giờ
  // thì biểu đồ đứng ở mức 0 một nhịp rồi nhảy phắt sang giá trị thật — còn khó
  // chịu hơn chính hiệu ứng mà tuỳ chọn đó muốn tắt. Tính luôn trong lúc render
  // nên không cần thêm một lần setState trong effect.
  const isLoaded = prefersReducedMotion || entranceDone;

  const rawMax = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue ?? 0)), 1);
  // Làm tròn trần lên các bậc đẹp (1M, 10M, 100M, 1B...)
  const magnitude = Math.pow(10, Math.max(Math.floor(Math.log10(rawMax)), 1));
  const axisMax = Math.max(Math.ceil(rawMax / magnitude) * magnitude, 100_000);
  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);

  const formatAxis = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1).replace('.0', '').replace('.', ',')}T`;
    if (val >= 1_000_000) return `${Math.round(val / 1_000_000)}Tr`;
    if (val >= 1_000) return `${Math.round(val / 1_000)}K`;
    return `${val}`;
  };

  const formatFullCurrency = (val: number) => {
    return `${valuePrefix}${val.toLocaleString('vi-VN')}${valueSuffix}`;
  };

  const handleExportCSV = () => {
    if (onExport) {
      onExport();
      return;
    }
    const headers = ['Kỳ', 'Doanh số ghi nhận', 'Giá trị đang mở'];
    const rows = data.map((d) => [d.label, d.value, d.secondaryValue ?? 0]);
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((r) => r.join(',')).join('\n');
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
      subtitle={subtitle ?? 'Tổng giá trị thương vụ ghi nhận theo tháng'}
      bodyClassName="p-4 sm:p-5"
      actions={
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 text-xs text-zinc-500 sm:flex dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#e8732c]" />
              <span>Giá trị ghi nhận</span>
            </span>
            {hasSecondary && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                <span>Đang mở</span>
              </span>
            )}
          </div>
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
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <div className="flex gap-3 sm:gap-4">
          {/* Trục tung (Y-axis) */}
          <div className="flex w-11 shrink-0 flex-col items-end justify-between pb-7 text-right" style={{ height: 210 }}>
            {[1, 0.75, 0.5, 0.25, 0].map((f) => (
              <span key={f} className="tnum text-[11px] font-medium leading-none text-zinc-400 dark:text-zinc-500">
                {formatAxis(Math.round(axisMax * f))}
              </span>
            ))}
          </div>

          {/* Vùng đồ thị các cột */}
          <div className="relative flex-1 border-l border-zinc-200/80 pl-2 sm:pl-3 dark:border-zinc-800">
            {/* Vạch lưới ngang đứt nét tinh tế */}
            <div className="pointer-events-none absolute inset-x-0 left-2 sm:left-3 top-0 flex flex-col justify-between" style={{ height: 180 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-dashed border-zinc-100 dark:border-zinc-800/80 w-full" />
              ))}
            </div>

            {/* Grid chứa các cột tháng */}
            <div
              className="relative grid gap-1.5 sm:gap-3"
              style={{
                gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))`,
                height: 210
              }}
            >
              {data.map((item, idx) => {
                const primaryPct = axisMax > 0 ? Math.round((item.value / axisMax) * 100) : 0;
                const secondaryPct = axisMax > 0 ? Math.round(((item.secondaryValue ?? 0) / axisMax) * 100) : 0;
                const isHovered = hoveredIdx === idx;
                const hasValue = item.value > 0;

                return (
                  <div
                    key={idx}
                    className="group relative flex flex-col justify-end items-center cursor-pointer pb-1"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Cột sáng nền khi hover toàn ô */}
                    <div
                      className={`absolute inset-x-0 bottom-6 top-0 rounded-xl transition-all duration-200 pointer-events-none ${
                        isHovered ? 'bg-zinc-100/70 dark:bg-zinc-800/50' : ''
                      }`}
                    />

                    {/* Tooltip nổi phía trên cột */}
                    {isHovered && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-xl
                        border border-zinc-200 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-zinc-900 shadow-lg backdrop-blur-xs
                        dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-white animate-modal-pop pointer-events-none flex flex-col items-center">
                        <span className="text-[10px] text-zinc-400 font-normal">{item.label}</span>
                        <span className="text-xs font-bold text-[#e8732c]">
                          {formatFullCurrency(item.value)}
                        </span>
                      </div>
                    )}

                    {/* Vùng thân cột */}
                    <div className="relative z-10 flex w-full justify-center items-end gap-1.5" style={{ height: 180 }}>
                      {/* Cột chính (Doanh số) */}
                      <div className="w-full max-w-[32px] sm:max-w-[42px] flex items-end h-full justify-center">
                        {hasValue ? (
                          <div
                            className={`w-full rounded-t-lg bg-gradient-to-t from-[#e8732c] to-[#f97316] transition-all duration-700 ease-out shadow-xs ${
                              isHovered ? 'brightness-110 shadow-md shadow-orange-500/20 scale-[1.03]' : ''
                            }`}
                            style={{
                              height: `${isLoaded ? Math.max(primaryPct, 3) : 0}%`,
                              transitionDelay: `${idx * 45}ms`,
                            }}
                          />
                        ) : (
                          /* Điểm nhấn tinh tế cho tháng 0 đồng */
                          <div
                            className={`h-1 w-5 rounded-full bg-zinc-200 dark:bg-zinc-700 transition-all ${
                              isHovered ? 'w-8 bg-[#e8732c]/50' : ''
                            }`}
                          />
                        )}
                      </div>

                      {/* Cột phụ nếu có */}
                      {hasSecondary && (
                        <div className="w-full max-w-[24px] flex items-end h-full justify-center">
                          <div
                            className="w-full rounded-t-md bg-zinc-300 dark:bg-zinc-700 transition-all duration-700 ease-out"
                            style={{
                              height: `${isLoaded ? Math.max(secondaryPct, 2) : 0}%`,
                              transitionDelay: `${idx * 45 + 20}ms`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Nhãn tháng ở dưới trục hoành */}
                    <div className={`relative z-10 mt-2 text-center text-xs transition-colors ${
                      isHovered
                        ? 'font-bold text-zinc-900 dark:text-white'
                        : 'font-medium text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};
