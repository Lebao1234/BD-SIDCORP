import React from 'react';
import { BrandTile } from './BrandMark';
import { useNotifyStore } from '../../lib/notify';

/* ==========================================================================
   KHUNG TRANG ĐĂNG NHẬP / ĐĂNG KÝ (DẠNG THẺ TẬP TRUNG - MODERN CARD)
   --------------------------------------------------------------------------
   Bố cục dạng thẻ trung tâm (Clean Floating Card) theo phong cách hiện đại:
     - Nền ngoài sáng nhẹ, tối giản.
     - Khối thẻ nổi ở giữa với icon logo góc trên, tiêu đề, biểu mẫu.
     - Phân cách "Hoặc tiếp tục với" và các nút đăng nhập mạng xã hội (Google, Apple, GitHub).
     - Chân trang (liên kết chuyển hướng) nằm tinh tế bên dưới thẻ.
   ========================================================================== */

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showSocial?: boolean;
  socialDividerText?: string;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const AppleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 .6-2.65 1.36-.56.65-.96 1.7-0.83 2.73 1.01.08 2.02-.54 2.55-1.24" />
  </svg>
);

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const AuthShell: React.FC<AuthShellProps> = ({
  title,
  subtitle,
  children,
  footer,
  showSocial = true,
  socialDividerText = 'Hoặc tiếp tục với',
}) => {
  const handleSocialClick = (provider: string) => {
    useNotifyStore
      .getState()
      .push('info', `Phương thức đăng nhập qua ${provider} hiện yêu cầu tài khoản SSO doanh nghiệp liên kết.`);
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#f8fafc] px-4 py-12 sm:px-6">
      {/* Thẻ đăng nhập trung tâm */}
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200/90 bg-white p-7 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] sm:p-9 animate-fade-in">
        {/* Biểu tượng logo ở đầu thẻ */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/90 bg-white shadow-2xs">
          <BrandTile size={28} />
        </div>

        {/* Tiêu đề & phụ đề */}
        <h1 className="text-center text-[23px] font-bold tracking-tight text-slate-900 sm:text-[25px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-center text-[13.5px] leading-relaxed text-slate-500">
            {subtitle}
          </p>
        )}

        {/* Nội dung biểu mẫu chính */}
        <div className="mt-6">{children}</div>

        {/* Khối đăng nhập với bên thứ 3 */}
        {showSocial && (
          <div className="mt-6">
            <div className="relative mb-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[12px] font-normal text-slate-400">
                {socialDividerText}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSocialClick('Google')}
                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
                title="Đăng nhập bằng Google"
              >
                <GoogleIcon className="h-4 w-4 shrink-0" />
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialClick('Apple')}
                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
                title="Đăng nhập bằng Apple"
              >
                <AppleIcon className="h-4 w-4 shrink-0 text-slate-900" />
                <span>Apple</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialClick('GitHub')}
                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
                title="Đăng nhập bằng GitHub"
              >
                <GithubIcon className="h-4 w-4 shrink-0 text-slate-900" />
                <span>GitHub</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liên kết dưới chân thẻ */}
      {footer && <div className="mt-6 text-center text-[13.5px] text-slate-600">{footer}</div>}
    </main>
  );
};

/** Kiểu ô nhập dùng chung cho hai trang xác thực - Phong cách viền mỏng, bo góc mềm mại */
export const authInputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 shadow-2xs ' +
  'placeholder:text-slate-400 transition ' +
  'focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:cursor-not-allowed';

export const authLabelClass = 'mb-1.5 block text-[13px] font-medium text-slate-800';

export const authButtonClass =
  'flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[#111827] text-[14px] font-medium ' +
  'text-white shadow-xs transition hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50';

export default AuthShell;
