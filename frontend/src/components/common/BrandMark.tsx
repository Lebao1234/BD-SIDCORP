import React from 'react';
import logoFull from '../../assets/logo-full.png';
import logoFullDark from '../../assets/logo-full-dark.png';
import logoMark from '../../assets/logo-mark.png';

/* ==========================================================================
   LOGO BD-HỆ THỐNG
   --------------------------------------------------------------------------
   Dựng từ file gốc src/assets/Logo.png (2172×724, 519 KB). Ảnh gốc quá nặng
   cho web nên được xuất lại thành ba bản nhẹ, cắt sát viền:
     - logo-full.png       biểu tượng + chữ đen, cho nền sáng   (~30 KB)
     - logo-full-dark.png  biểu tượng + chữ trắng, cho nền tối  (~26 KB)
     - logo-mark.png       chỉ biểu tượng tròn                  (~11 KB)
   Muốn thay logo: thay Logo.png rồi xuất lại ba file trên cùng tỉ lệ.
   ========================================================================== */

/** Tỉ lệ rộng/cao của logo đầy đủ sau khi cắt sát viền. */
const FULL_RATIO = 3.707;

interface BrandMarkProps {
  /** Chiều cao hiển thị (px). */
  size?: number;
  /** Chỉ hiện biểu tượng tròn (sidebar thu gọn). */
  compact?: boolean;
  /**
   * Nền đặt logo:
   *  - 'auto'  theo giao diện sáng/tối của ứng dụng
   *  - 'dark'  luôn dùng bản chữ trắng (panel tối cố định)
   *  - 'light' luôn dùng bản chữ đen
   */
  tone?: 'auto' | 'dark' | 'light';
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 32,
  compact = false,
  tone = 'auto',
  className = '',
}) => {
  if (compact) {
    return (
      <img
        src={logoMark}
        alt="BD-Hệ Thống"
        width={size}
        height={size}
        className={`shrink-0 select-none ${className}`}
        draggable={false}
      />
    );
  }

  const width = Math.round(size * FULL_RATIO);
  const common = { width, height: size, draggable: false, style: { height: size, width: 'auto' } } as const;

  if (tone !== 'auto') {
    return (
      <img
        src={tone === 'dark' ? logoFullDark : logoFull}
        alt="BD-Hệ Thống Ecommerce"
        className={`shrink-0 select-none ${className}`}
        {...common}
      />
    );
  }

  return (
    <span className={`inline-flex shrink-0 select-none ${className}`}>
      <img src={logoFull} alt="BD-Hệ Thống Ecommerce" className="dark:hidden" {...common} />
      <img src={logoFullDark} alt="" aria-hidden className="hidden dark:block" {...common} />
    </span>
  );
};

/** Chỉ biểu tượng tròn — dùng nơi cần một dấu hiệu nhỏ (thanh header cũ). */
export const BrandTile: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <img src={logoMark} alt="" aria-hidden width={size} height={size} className="shrink-0 select-none" draggable={false} />
);

export default BrandMark;
