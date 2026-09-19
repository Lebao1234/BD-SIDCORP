import React, { useState, useEffect } from 'react';
import { Panel } from './Panel';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export interface StatusItem {
  name: string;
  count: number;
  /** Mã màu HEX của chấm trạng thái (xem bảng màu trong constants.ts). */
  color: string;
}

interface CustomerStatusChartProps {
  data: StatusItem[];
}

export const CustomerStatusChart: React.FC<CustomerStatusChartProps> = ({ data }) => {
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
    const timer = setTimeout(() => setEntranceDone(true), 90);
    return () => clearTimeout(timer);
  }, []);

  // Bật cổng ngay khi người dùng chọn giảm chuyển động: nếu vẫn chờ hết hẹn giờ
  // thì biểu đồ đứng ở mức 0 một nhịp rồi nhảy phắt sang giá trị thật — còn khó
  // chịu hơn chính hiệu ứng mà tuỳ chọn đó muốn tắt. Tính luôn trong lúc render
  // nên không cần thêm một lần setState trong effect.
  const isLoaded = prefersReducedMotion || entranceDone;

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(...data.map((d) => d.count), 1);
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <Panel
      title="Phân bổ trạng thái khách hàng"
      subtitle={`${total.toLocaleString('vi-VN')} khách hàng theo tiến độ tư vấn`}
      bodyClassName="p-4 sm:p-5"
    >
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Chưa có dữ liệu trạng thái.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((item, idx) => {
            const share = total > 0 ? Math.round((item.count / total) * 100) : 0;
            const barWidth = Math.round((item.count / max) * 100);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className={`group flex flex-col gap-1.5 rounded-xl px-2.5 py-1.5 transition-all cursor-pointer ${
                  isHovered ? 'bg-zinc-50 dark:bg-zinc-800/60 shadow-2xs' : 'hover:bg-zinc-50/50'
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-2 text-xs">
                  {/* Chấm tròn trạng thái */}
                  <span
                    className="h-2 w-2 shrink-0 rounded-full transition-transform group-hover:scale-125"
                    style={{ backgroundColor: item.color }}
                  />
                  {/* Tên trạng thái */}
                  <span className={`min-w-0 flex-1 truncate transition-colors ${
                    isHovered
                      ? 'font-semibold text-zinc-900 dark:text-white'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {item.name}
                  </span>
                  {/* Số lượng */}
                  <span className="tnum font-semibold text-zinc-900 dark:text-zinc-100 min-w-[24px] text-right">
                    {item.count.toLocaleString('vi-VN')}
                  </span>
                  {/* Tỷ lệ % */}
                  <span className="tnum w-9 text-right font-medium text-zinc-400 dark:text-zinc-500">
                    {share}%
                  </span>
                </div>

                {/* Thanh đo tương ứng màu sắc thực của từng trạng thái */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      backgroundColor: item.color,
                      width: `${isLoaded ? Math.max(barWidth, 3) : 0}%`,
                      transitionDelay: `${idx * 60}ms`,
                      opacity: isHovered ? 1 : 0.85,
                      filter: isHovered ? 'brightness(1.1)' : 'none',
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
