import React from 'react';
import { BrandMark } from './BrandMark';

/* ==========================================================================
   KHUNG TRANG ĐĂNG NHẬP / ĐĂNG KÝ
   --------------------------------------------------------------------------
   Bố cục chia đôi: bên trái là panel mực đậm mang thương hiệu BD-HỆ THỐNG,
   bên phải là biểu mẫu trên nền sáng. Dưới 1024px chỉ còn cột biểu mẫu, logo
   chuyển lên đầu form.

   Các trang này luôn ở giao diện sáng (LIGHT_ONLY_PATHS), nên panel tối dùng
   màu cố định thay vì token.
   ========================================================================== */

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const HIGHLIGHTS = [
  { label: 'Khách hàng & doanh nghiệp', note: 'Một hồ sơ cho mọi lần tiếp xúc' },
  { label: 'Công việc & lịch hẹn', note: 'Việc hôm nay nằm cạnh số liệu' },
  { label: 'Trao đổi nội bộ', note: 'Thảo luận ngay trên từng khách hàng' },
];

export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children, footer }) => (
  <main className="grid min-h-screen w-full overflow-x-hidden bg-canvas text-fg lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
    {/* Panel thương hiệu */}
    <section className="relative hidden overflow-hidden bg-[#0b0d12] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Lưới mảnh và quầng sáng cobalt — tạo chiều sâu mà không cần ảnh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 30% 40%, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 30% 40%, #000 30%, transparent 75%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full opacity-40 blur-[110px]"
        style={{ background: 'radial-gradient(circle, #0066f5 0%, transparent 70%)' }}
      />

      <div className="relative">
        <BrandMark size={48} tone="dark" />
      </div>

      <div className="relative max-w-xl">
        <h1 className="text-[clamp(1.75rem,2.5vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.035em]">
          Mọi khách hàng, mọi thương vụ
          <br />
          <span className="text-white/45">trong một hệ thống.</span>
        </h1>

        <dl className="mt-12 grid grid-cols-1 border-t border-white/10">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="flex items-baseline justify-between gap-6 border-b border-white/10 py-4">
              <dt className="text-[14px] font-medium text-white/90">{h.label}</dt>
              <dd className="text-right text-[13px] text-white/45">{h.note}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="relative text-[12px] text-white/35">
        © {new Date().getFullYear()} BD-Hệ Thống Ecommerce · Công cụ nội bộ
      </p>
    </section>

    {/* Biểu mẫu */}
    <section className="flex items-center justify-center px-5 py-12 sm:px-10">
      <div className="w-full max-w-[400px] animate-fade-in">
        <BrandMark size={44} tone="light" className="mb-10 lg:hidden" />

        <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.025em] text-fg">{title}</h2>
        {subtitle && <p className="mt-2 text-[13.5px] text-fg-subtle">{subtitle}</p>}

        <div className="mt-8">{children}</div>

        {footer && <div className="mt-8 border-t border-line pt-5 text-[13px] text-fg-subtle">{footer}</div>}
      </div>
    </section>
  </main>
);

/** Kiểu ô nhập dùng chung cho hai trang xác thực. */
export const authInputClass =
  'h-11 w-full rounded-control border border-line-input bg-surface px-3.5 text-[14px] text-fg ' +
  'placeholder:text-fg-faint transition';

export const authLabelClass = 'mb-1.5 block text-[13px] font-medium text-fg-body';

export const authButtonClass =
  'flex h-11 w-full cursor-pointer items-center justify-center rounded-control bg-fg text-[14px] font-medium ' +
  'text-canvas transition hover:bg-fg-body active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50';

export default AuthShell;
