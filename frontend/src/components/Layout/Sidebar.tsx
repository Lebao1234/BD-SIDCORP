import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  CalendarCheck,
  Calendar,
  StickyNote,
  Bell,
  Settings,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';
import logo1 from '../../assets/logo-1.png';
import { useChatStore } from '../../store/useChatStore';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, toggleSidebar } = useSidebar();
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const unreadForumCount = useChatStore((s) => s.unreadForumCount);

  const totalUnreadChat =
    Object.values(unreadCounts).reduce((acc, c) => acc + (c || 0), 0) + (unreadForumCount || 0);

  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  const navItems = [
    {
      title: 'Trang chủ',
      path: '/',
      icon: LayoutDashboard,
      activeCheck: (p: string) =>
        (p === '/' || p === '/dashboard' || p === '/reports' || p === '/admin/dashboard') &&
        !location.search.includes('tab=company'),
    },
    {
      title: 'Khách hàng',
      path: '/customers',
      icon: Users,
      activeCheck: (p: string) => p === '/customers' && !location.search.includes('tab=company'),
    },
    {
      title: 'Doanh nghiệp',
      path: '/customers?tab=company',
      icon: Building2,
      activeCheck: () => location.search.includes('tab=company'),
    },
    {
      title: 'Công việc',
      path: '/tasks',
      icon: CalendarCheck,
      activeCheck: (p: string) => p === '/tasks',
    },
    {
      title: 'Lịch làm việc',
      path: '/calendar',
      icon: Calendar,
      activeCheck: (p: string) => p === '/calendar',
    },
    {
      title: 'Ghi chú',
      path: '/notes',
      icon: StickyNote,
      activeCheck: (p: string) => p === '/notes',
    },
    {
      title: 'Tài liệu Drive',
      path: '/resources',
      icon: FolderKanban,
      activeCheck: (p: string) => p === '/resources',
    },
    {
      title: 'Thảo luận & Chat',
      path: '/chat',
      icon: MessageSquare,
      activeCheck: (p: string) => p === '/chat',
    },
    {
      title: 'Thông báo',
      path: '/notifications',
      icon: Bell,
      activeCheck: (p: string) => p === '/notifications',
    },
    {
      title: 'Cài đặt',
      path: '/settings',
      icon: Settings,
      activeCheck: (p: string) => p === '/settings',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between border-r
        border-line bg-panel transition-[width] duration-200 dark:border-[#332f2c] dark:bg-[#1d1c19]
        ${collapsed ? 'w-20' : 'w-60'}`}
    >
      <div>
        {/* Thương hiệu */}
        <div className="relative flex h-14 items-center border-b border-line px-4 dark:border-[#332f2c]">
          <div className={`flex min-w-0 items-center gap-2.5 ${collapsed ? 'w-full justify-center pr-4' : ''}`}>
            <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-md">
              <img src={logo1} alt="SIDCORP" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-[13px] font-semibold leading-none text-fg dark:text-[#f2f0ed]">SIDCORP</div>
                <div className="mt-1 truncate text-[11px] leading-none text-fg-faint">Hệ thống nội bộ</div>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            className={`flex h-6 w-6 items-center justify-center rounded-md border border-line
              bg-surface text-fg-subtle transition hover:text-fg
              dark:border-[#332f2c] dark:bg-[#232120] dark:hover:text-[#f2f0ed]
              ${collapsed ? 'absolute -right-3 top-4 z-50 shadow-sm' : 'ml-auto'}`}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Điều hướng */}
        <nav className="flex flex-col gap-0.5 p-2 pt-3.5">
          {!collapsed && (
            <div className="px-2 pb-2 text-[11px] font-medium text-fg-faint">Điều hướng</div>
          )}

          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = item.activeCheck(location.pathname);

            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.title : undefined}
                className={`group relative flex h-[34px] items-center gap-2.5 rounded-md pl-2.5 pr-2
                  text-[13px] transition-colors
                  ${isActive
                    ? 'bg-raised font-medium text-fg dark:bg-[#2c2a27] dark:text-[#f2f0ed]'
                    : 'text-fg-muted hover:bg-raised hover:text-fg dark:text-[#a8a49d] dark:hover:bg-[#262422] dark:hover:text-[#f2f0ed]'}
                  ${collapsed ? 'justify-center pl-2' : ''}`}
              >
                {/* Chỉ báo mục đang chọn — một trong số ít chỗ được dùng màu cam */}
                {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-sm bg-brand" />}

                <IconComp
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-fg dark:text-[#f2f0ed]' : 'text-fg-subtle'}`}
                  strokeWidth={1.7}
                />

                {!collapsed && <span className="truncate leading-none">{item.title}</span>}

                {/* Dấu chấm xanh báo tin nhắn tới cho mục Thảo luận & Chat */}
                {item.path === '/chat' && totalUnreadChat > 0 && (
                  <span className={`flex items-center gap-1 ${collapsed ? 'absolute top-1.5 right-1.5' : 'ml-auto'}`}>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm animate-pulse" title={`${totalUnreadChat} tin nhắn mới`} />
                    {!collapsed && totalUnreadChat > 1 && (
                      <span className="rounded-full bg-emerald-500 px-1 py-0.2 text-[9px] font-bold text-white leading-none">
                        {totalUnreadChat > 9 ? '9+' : totalUnreadChat}
                      </span>
                    )}
                  </span>
                )}

                {collapsed && (
                  <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-lg
                    bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg opacity-0 transition-opacity
                    dark:bg-white dark:text-gray-900
                    group-hover:opacity-100">
                    {item.title} {totalUnreadChat > 0 && item.path === '/chat' ? `(${totalUnreadChat})` : ''}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tài khoản — chỉ hiển thị ở đây, không lặp lại trên thanh trên cùng */}
      <div className="flex items-center gap-2.5 border-t border-line px-3 py-2.5 dark:border-[#332f2c]">
        <button
          onClick={() => navigate('/settings')}
          title="Cài đặt tài khoản"
          className={`flex min-w-0 flex-1 items-center gap-2.5 text-left transition hover:opacity-80
            ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border
            border-line-strong bg-raised text-[11px] font-semibold text-fg-muted
            dark:border-[#3d3934] dark:bg-[#2c2a27] dark:text-[#a8a49d] overflow-hidden">
            {user?.avatar_url || user?.avatarUrl ? (
              <img src={user.avatar_url || user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : user?.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
          </span>

          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium leading-none text-fg dark:text-[#f2f0ed]">
                {user?.name || 'Tài khoản'}
              </span>
              <span className="mt-1 block truncate text-[11px] leading-none text-fg-faint">
                {isAdmin ? 'Quản trị viên' : 'Nhân viên kinh doanh'}
              </span>
            </span>
          )}
        </button>

        {!collapsed && (
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-faint
              transition hover:bg-raised hover:text-danger dark:hover:bg-[#2c2a27]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.7} />
          </button>
        )}
      </div>
    </aside>
  );
};
