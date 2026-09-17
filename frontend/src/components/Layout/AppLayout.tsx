import React from 'react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../NotificationBell';
import { useTheme } from '../ThemeProvider';
import { useSidebar } from '../../context/SidebarContext';
import { Sun, Moon, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
  onSelectCustomer?: (customerId: string) => void;
  isAdminPage?: boolean;
}

// Tên trang hiển thị bên trái thanh trên cùng, thay cho việc lặp lại
// tên tài khoản (đã có ở đáy sidebar).
const pageTitle = (pathname: string, search: string): string => {
  if (search.includes('tab=company')) return 'Doanh nghiệp';
  if (pathname.startsWith('/customers')) return 'Khách hàng';
  if (pathname.startsWith('/tasks')) return 'Công việc';
  if (pathname.startsWith('/resources')) return 'Kho tài liệu Drive';
  if (pathname.startsWith('/chat')) return 'Thảo luận & Chat';
  if (pathname.startsWith('/settings')) return 'Cài đặt';
  if (pathname.includes('profile')) return 'Hồ sơ cá nhân';
  return 'Trang chủ';
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onSelectCustomer, isAdminPage }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed } = useSidebar();

  const isDark = theme === 'dark' || theme === 'luxury-dark';

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-fg transition-colors dark:bg-[#171614] dark:text-[#f2f0ed]">
      <Sidebar />

      <div className={`flex flex-1 flex-col transition-[margin] duration-200 ${collapsed ? 'ml-20' : 'ml-60'}`}>
        {/* Thanh trên cùng */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3.5 border-b border-line
          bg-surface px-5 dark:border-[#332f2c] dark:bg-[#232120]">
          <div className="text-[13px] font-semibold">{pageTitle(location.pathname, location.search)}</div>

          <div className="h-4 w-px bg-line dark:bg-[#332f2c]" />

          <div className="relative hidden w-[300px] sm:block">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-fg-faint" strokeWidth={1.9} />
            <input
              type="text"
              placeholder="Tìm khách hàng, doanh nghiệp…"
              defaultValue={new URLSearchParams(location.search).get('search') ?? ''}
              className="h-[30px] w-full rounded-md border border-line bg-canvas pl-8 pr-3 text-xs
                text-fg placeholder-fg-faint dark:border-[#332f2c] dark:bg-[#1d1c19] dark:text-[#f2f0ed]"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const target = e.currentTarget.value.trim();
                navigate(target ? `/customers?search=${encodeURIComponent(target)}` : '/customers');
              }}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-line
                bg-surface text-fg-muted transition hover:text-fg
                dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#a8a49d] dark:hover:text-[#f2f0ed]"
            >
              {isDark ? <Sun className="h-4 w-4" strokeWidth={1.7} /> : <Moon className="h-4 w-4" strokeWidth={1.7} />}
            </button>

            <NotificationBell onSelectCustomer={onSelectCustomer} isAdminPage={isAdminPage} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
};
