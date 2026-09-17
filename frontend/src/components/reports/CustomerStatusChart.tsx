import React, { useState, useEffect } from 'react';
import { Panel } from './Panel';

export interface StatusItem {
  name: string;
  count: number;
  /** Mã màu HEX của chấm trạng thái (xem bảng màu trong .design/canvas.json). */
  color: string;
}

interface CustomerStatusChartProps {
  data: StatusItem[];
}

/* ==========================================================================
   PHÂN BỔ TRẠNG THÁI
   --------------------------------------------------------------------------
   Mỗi dòng: chấm màu + tên trạng thái, số liệu căn phải, thanh ngang bên
   dưới. Thanh mở rộng mượt mà khi dữ liệu nạp vào.
   ========================================================================== */

export const CustomerStatusChart: React.FC<CustomerStatusChartProps> = ({ data }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 90);
    return () => clearTimeout(timer);
  }, [data]);

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(...data.map((d) => d.count), 1);
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <Panel
      title="Phân bổ trạng thái khách hàng"
      subtitle={`${total.toLocaleString('vi-VN')} khách hàng theo tiến độ tư vấn`}
      bodyClassName="p-4"
    >
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-xs text-fg-empty dark:text-[#5c574f]">Chưa có dữ liệu trạng thái.</div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {sorted.map((item, idx) => {
            const share = total > 0 ? Math.round((item.count / total) * 100) : 0;
            const barWidth = Math.round((item.count / max) * 100);
            return (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="min-w-0 flex-1 truncate text-fg-body dark:text-[#cdc9c2]">{item.name}</span>
                  <span className="tnum font-medium text-fg dark:text-[#f2f0ed]">
                    {item.count.toLocaleString('vi-VN')}
                  </span>
                  <span className="tnum w-9 text-right text-fg-faint dark:text-[#7f7b74]">{share}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-divider dark:bg-[#2a2724]">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${isLoaded ? Math.max(barWidth, 2) : 0}%`,
                      transition: `width 850ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 85}ms`,
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
