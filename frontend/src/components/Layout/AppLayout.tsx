import React from 'react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../NotificationBell';
import { useTheme } from '../ThemeProvider';
import { useSidebar } from '../../context/SidebarContext';
import { Sun, Moon, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  if (pathname.startsWith('/calendar')) return 'Lịch làm việc';
  if (pathname.startsWith('/resources')) return 'Kho tài liệu Drive';
  if (pathname.startsWith('/chat')) return 'Thảo luận & Chat';
  if (pathname.startsWith('/notes')) return 'Ghi chú';
  if (pathname.startsWith('/settings')) return 'Cài đặt';
  if (pathname.includes('profile')) return 'Hồ sơ cá nhân';
  return 'Trang chủ';
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onSelectCustomer, isAdminPage }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleSidebar } = useSidebar();

  const isDark = theme === 'dark' || theme === 'luxury-dark';

  return (
    // Khung ngoài cùng mang màu của sidebar; phần nội dung là một tấm bo góc
    // đặt lùi vào trong 8px. Nhờ vậy chỗ sidebar gặp nội dung là một góc bo liền
    // mạch thay cho hai đường kẻ cắt nhau thành góc vuông. Cuộn dọc diễn ra bên
    // trong <main>, nên góc bo và thanh trên cùng luôn đứng yên.
    <div className="flex h-dvh overflow-hidden bg-panel font-sans text-fg transition-colors">
      <a href="#main-content" className="skip-link">Bỏ qua tới nội dung chính</a>
      <Sidebar />

      <div className={`flex min-w-0 flex-1 flex-col py-2 pr-2 transition-[margin] duration-200 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-line bg-canvas">
          {/* Thanh trên cùng */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 lg:px-6">
            <button
              type="button"
              onClick={toggleSidebar}
              title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-fg-subtle transition hover:bg-raised hover:text-fg"
            >
              {collapsed
                ? <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.7} />
                : <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.7} />}
            </button>

            <div className="text-md font-semibold text-fg">{pageTitle(location.pathname, location.search)}</div>

            <div className="ml-1 h-5 w-px bg-line" />

            <div className="relative ml-1 hidden w-[320px] sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-faint" strokeWidth={1.9} />
              <input
                type="text"
                placeholder="Tìm khách hàng, doanh nghiệp…"
                defaultValue={new URLSearchParams(location.search).get('search') ?? ''}
                aria-label="Tìm khách hàng, doanh nghiệp"
                className="h-9 w-full rounded-control border border-line bg-canvas pl-8 pr-3 text-sm
                  text-fg placeholder-fg-faint transition hover:border-line-strong"
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
                aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                className="flex h-9 w-9 items-center justify-center rounded-control border border-line
                  bg-surface text-fg-muted transition hover:border-line-strong hover:text-fg"
              >
                {isDark ? <Sun className="h-4 w-4" strokeWidth={1.7} /> : <Moon className="h-4 w-4" strokeWidth={1.7} />}
              </button>

              <NotificationBell onSelectCustomer={onSelectCustomer} isAdminPage={isAdminPage} />
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pt-6 pb-10 lg:px-7 focus:outline-none">
            {/* Giới hạn bề rộng để màn hình rất rộng không kéo bảng và biểu đồ ra quá mức đọc được */}
            <div className="mx-auto w-full max-w-[1560px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};
