import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/* ==========================================================================
   Ô MẬT KHẨU CÓ NÚT ẨN/HIỆN
   --------------------------------------------------------------------------
   Dùng chung cho Đăng nhập, Đăng ký, Hồ sơ và Bảo mật. Mỗi ô tự giữ trạng thái
   ẩn/hiện của mình. `size` chỉ đổi cỡ biểu tượng và khoảng cách nút mắt cho khớp
   chiều cao ô nhập của từng màn hình; kiểu dáng ô nhập truyền qua `className`.
   ========================================================================== */

const SIZES = {
  sm: { button: 'right-2.5', icon: 'h-3.5 w-3.5' },
  md: { button: 'right-3 p-0.5', icon: 'h-4 w-4' },
  lg: { button: 'right-3.5 p-1', icon: 'h-4.5 w-4.5' },
} as const;

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: keyof typeof SIZES;
  /** Biểu tượng đặt bên trái ô nhập (ô nhập phải tự chừa padding trái). */
  leftIcon?: React.ReactNode;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ size = 'md', leftIcon, ...inputProps }) => {
  const [visible, setVisible] = useState(false);
  const { button, icon } = SIZES[size];
  const label = visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';

  return (
    <div className="relative">
      {leftIcon}
      <input {...inputProps} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        // Bỏ khỏi thứ tự Tab để Tab đi thẳng từ ô mật khẩu sang ô/nút kế tiếp.
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className={`absolute top-1/2 -translate-y-1/2 ${button} cursor-pointer text-zinc-400 transition
          hover:text-zinc-600 dark:hover:text-zinc-200`}
        title={label}
        aria-label={label}
      >
        {visible ? <EyeOff className={icon} /> : <Eye className={icon} />}
      </button>
    </div>
  );
};
