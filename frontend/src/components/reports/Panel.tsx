import React from 'react';

/* ==========================================================================
   PANEL
   --------------------------------------------------------------------------
   Khung thẻ dùng chung cho mọi khối ở trang Báo cáo: viền 1px, bo 8px, không
   shadow, không backdrop-blur. Tiêu đề nằm trong một dải header có vạch chia
   phía dưới — phần điều khiển (bộ lọc, nút export) đẩy về mép phải.
   ========================================================================== */

interface PanelProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  actions,
  children,
  bodyClassName = 'p-4',
  className = '',
}) => (
  <div
    className={`flex flex-col rounded-card border border-line bg-surface
      dark:border-[#332f2c] dark:bg-[#232120] ${className}`}
  >
    <div className="flex min-h-[46px] items-center gap-3 border-b border-divider px-4 py-3 dark:border-[#2a2724]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="truncate text-[13px] font-semibold text-fg dark:text-[#f2f0ed]">{title}</div>
        {subtitle && <div className="truncate text-[11px] text-fg-faint dark:text-[#7f7b74]">{subtitle}</div>}
      </div>
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
    <div className={`flex-1 ${bodyClassName}`}>{children}</div>
  </div>
);

/* --------------------------------------------------------------------------
   SEGMENT GROUP
   Nhóm nút chọn kiểu "Last 3 months / 30 days / 7 days" trong ảnh mẫu: nền
   chìm, mục đang chọn là ô trắng có viền — không tô cam.
   -------------------------------------------------------------------------- */

interface SegmentGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentGroup<T extends string>({ options, value, onChange }: SegmentGroupProps<T>) {
  return (
    <div className="flex h-[30px] items-stretch rounded-control border border-line bg-raised p-0.5
      dark:border-[#332f2c] dark:bg-[#1d1c19]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center rounded-chip px-3 text-xs transition ${
              active
                ? 'border border-line-input bg-surface font-medium text-fg dark:border-[#3d3934] dark:bg-[#2c2a27] dark:text-[#f2f0ed]'
                : 'text-fg-subtle hover:text-fg dark:text-[#8f8b84] dark:hover:text-[#f2f0ed]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------------
   DELTA
   Chỉ số tăng/giảm cạnh con số lớn trong thẻ KPI. Màu chỉ nằm ở mũi tên và
   con số, phần giải thích giữ màu chữ phụ.
   -------------------------------------------------------------------------- */

export const Delta: React.FC<{ value: string; direction: 'up' | 'down' | 'flat'; note: string }> = ({
  value,
  direction,
  note,
}) => {
  const tone =
    direction === 'up'
      ? 'text-ok'
      : direction === 'down'
        ? 'text-danger'
        : 'text-fg-faint';

  return (
    <div className="flex items-center gap-1.5 text-xs text-fg-subtle dark:text-[#8f8b84]">
      <span className={`tnum font-medium ${tone}`}>
        {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '·'} {value}
      </span>
      <span className="truncate">{note}</span>
    </div>
  );
};
