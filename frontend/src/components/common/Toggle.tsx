import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  /**
   * 'row'  — thẻ có viền, dùng trong tab Thông báo ở cột trái.
   * 'plain' — không viền, dùng trong thẻ tóm tắt ở cột phải.
   */
  variant?: 'row' | 'plain';
  disabled?: boolean;
}

/**
 * Công tắc bật/tắt một tuỳ chọn.
 *
 * Trước đây đúng ba tuỳ chọn thông báo được vẽ tay hai lần trong SettingsPage
 * (một lần ở tab, một lần ở thẻ tóm tắt bên phải) — sáu khối JSX gần như giống
 * hệt nhau. Sửa màu hay kích thước công tắc phải nhớ sửa đủ sáu chỗ, và chỉ cần
 * quên một chỗ là giao diện lệch.
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  variant = 'row',
  disabled = false,
}) => {
  const wrapperClass =
    variant === 'row'
      ? 'flex items-center justify-between p-3 rounded-lg border border-[#e6e4e0] dark:border-[#332f2c] bg-[#fbfbfa] dark:bg-[#232120]'
      : 'flex items-center gap-2.5';

  const textWrapperClass =
    variant === 'row' ? 'flex flex-col gap-0.5' : 'flex flex-col gap-0.5 flex-grow min-w-0';

  const descriptionClass =
    variant === 'row' ? 'text-[11px] text-[#97938c]' : 'text-[11px] text-[#97938c] truncate';

  return (
    <div className={wrapperClass}>
      <div className={textWrapperClass}>
        <div className="text-xs font-medium text-[#1c1b19] dark:text-white">{label}</div>
        {description && <div className={descriptionClass}>{description}</div>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`flex items-center w-8 h-[18px] p-0.5 rounded-full transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-[#e8732c]' : 'bg-[#e0ddd8] dark:bg-[#3a3532]'
        }`}
      >
        <div
          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-3.5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
