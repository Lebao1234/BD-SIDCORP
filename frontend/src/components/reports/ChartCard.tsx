import React from 'react';

/* ==========================================================================
   KHUNG BIỂU ĐỒ
   --------------------------------------------------------------------------
   Một kiểu khung cho mọi biểu đồ trên trang chủ: viền 1px, bo theo
   --radius-card, tiêu đề 14px/600 kèm biểu tượng nhỏ, phần điều khiển (chú
   giải, bộ lọc) đẩy về bên phải. Trước đây mỗi biểu đồ tự viết khung riêng
   nên cỡ chữ, khoảng cách và hiệu ứng lệch nhau từng chút một.
   ========================================================================== */

interface ChartCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Chú giải, bộ lọc hoặc nhãn biến động đặt bên phải tiêu đề. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Nội dung tràn sát mép thẻ (bảng): bỏ padding thân, giữ padding tiêu đề. */
  flush?: boolean;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, icon: Icon, actions, children, flush = false, className = '' }) => (
  <section
    className={`flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-200 ${flush ? '' : 'p-6'} ${className}`}
  >
    <header
      className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 ${flush ? 'px-6 pb-4 pt-5' : 'pb-3'}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/70 bg-raised/50 text-fg-subtle">
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </span>
        )}
        <h2 className="truncate text-base font-semibold text-fg">{title}</h2>
      </div>
      {actions && <div className="ml-auto flex items-center gap-3">{actions}</div>}
    </header>
    <div className="flex flex-1 flex-col">{children}</div>
  </section>
);

/** Một mục chú giải: chấm màu + nhãn 12px. */
export const LegendItem: React.FC<{ color: string; label: React.ReactNode }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-2 text-xs font-medium text-fg-subtle">
    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
    {label}
  </span>
);

export default ChartCard;
