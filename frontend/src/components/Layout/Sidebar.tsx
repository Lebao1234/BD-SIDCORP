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
  Settings,
  FolderKanban,
  LogOut,
  User,
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';
import { useChatStore } from '../../store/useChatStore';

interface NavGroup {
  groupTitle: string;
  items: {
    title: string;
    path: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    activeCheck: (p: string) => boolean;
    badgeCount?: number;
  }[];
}

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const unreadForumCount = useChatStore((s) => s.unreadForumCount);

  const totalUnreadChat =
    Object.values(unreadCounts).reduce((acc, c) => acc + (c || 0), 0) + (unreadForumCount || 0);

  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  // Thứ tự theo tần suất dùng: khách hàng & doanh nghiệp ngay dưới Trang chủ,
  // việc hằng ngày ở giữa, tài liệu và ghi chú xuống dưới, cài đặt cuối cùng.
  const navGroups: NavGroup[] = [
    {
      groupTitle: 'Tổng quan',
      items: [
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
          activeCheck: (p: string) =>
            p === '/customers' &&
            !location.search.includes('tab=company') &&
            !location.search.includes('status='),
        },
        {
          title: 'Doanh nghiệp',
          path: '/customers?tab=company',
          icon: Building2,
          activeCheck: () => location.search.includes('tab=company'),
        },
      ],
    },
    {
      groupTitle: 'Công việc',
      items: [
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
          title: 'Tin nhắn',
          path: '/chat',
          icon: MessageSquare,
          activeCheck: (p: string) => p === '/chat',
          badgeCount: totalUnreadChat,
        },
      ],
    },
    {
      groupTitle: 'Tài liệu',
      items: [
        {
          title: 'Tài liệu Drive',
          path: '/resources',
          icon: FolderKanban,
          activeCheck: (p: string) => p === '/resources',
        },
        {
          title: 'Ghi chú',
          path: '/notes',
          icon: StickyNote,
          activeCheck: (p: string) => p === '/notes',
        },
      ],
    },
    {
      groupTitle: 'Hệ thống',
      items: [
        {
          title: 'Cài đặt',
          path: '/settings',
          icon: Settings,
          activeCheck: (p: string) => p === '/settings',
        },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between bg-panel transition-[width] duration-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Logo — nút thu gọn đã chuyển lên thanh trên cùng, trước đây nó nằm
            đè lên biểu tượng logo khi sidebar thu gọn. */}
        <div className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center' : 'px-5'}`}>
          <Link to="/" aria-label="BD-Hệ Thống — Trang chủ" className="flex min-w-0 items-center">
            <BrandMark size={collapsed ? 36 : 38} compact={collapsed} />
          </Link>
        </div>

        {/* Nhóm điều hướng */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-2 custom-scrollbar" aria-label="Điều hướng chính">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-0.5">
              {!collapsed && (
                <div className="px-3 pb-1.5 text-xs font-medium text-fg-faint">
                  {group.groupTitle}
                </div>
              )}

              {group.items.map((item) => {
                const IconComp = item.icon;
                const isActive = item.activeCheck(location.pathname);

                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    title={collapsed ? item.title : undefined}
                    className={`group relative flex h-9 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-brand-soft text-brand-text'
                        : 'text-fg-body hover:bg-raised hover:text-fg'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <IconComp
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-brand-text'
                          : 'text-fg-subtle group-hover:text-fg'
                      }`}
                      strokeWidth={isActive ? 2 : 1.8}
                    />

                    {!collapsed && (
                      <span className="truncate leading-none">
                        {item.title}
                      </span>
                    )}

                    {/* Số tin nhắn chưa đọc */}
                    {item.badgeCount && item.badgeCount > 0 ? (
                      <span
                        title={`${item.badgeCount} tin nhắn mới`}
                        className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-2xs font-semibold text-white ${
                          collapsed ? 'absolute right-1.5 top-1.5' : 'ml-auto'
                        }`}
                      >
                        {item.badgeCount > 9 ? '9+' : item.badgeCount}
                      </span>
                    ) : null}

                    {/* Nhãn nổi khi sidebar thu gọn */}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-control bg-fg px-2.5 py-1 text-xs font-medium text-canvas shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                        {item.title}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Tài khoản */}
        <div className="shrink-0 p-3">
          <div className="flex items-center gap-2.5 rounded-control p-1.5 transition-colors hover:bg-raised">
            <button
              onClick={() => navigate('/settings')}
              title="Cài đặt tài khoản"
              className={`flex min-w-0 flex-1 items-center gap-2.5 text-left ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-xs font-semibold text-brand-text">
                {user?.avatar_url || user?.avatarUrl ? (
                  <img
                    src={user.avatar_url || user.avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : user?.name ? (
                  // Tên tiếng Việt: chữ cái đầu của tên gọi (từ cuối)
                  (user.name.trim().split(/\s+/).pop() || user.name).charAt(0).toUpperCase()
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium leading-tight text-fg">
                    {user?.name || 'Tài khoản'}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                    {user?.email || (isAdmin ? 'Quản trị viên' : 'Nhân viên kinh doanh')}
                  </span>
                </div>
              )}
            </button>

            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-fg-faint transition hover:bg-danger/10 hover:text-danger"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
