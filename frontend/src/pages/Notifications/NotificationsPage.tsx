import React, { useState, useMemo } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { useSocket, AppNotification } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import {
  Bell,
  Search,
  CheckCheck,
  Ticket,
  Users,
  MessageSquare,
  Clock,
  Trash2,
  Check,
  X,
  FileText,
  ExternalLink,
  Layers,
  RotateCw,
  AtSign,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

type FilterCategory = 'all' | 'unread' | 'mention' | 'customer' | 'task';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useSocket();

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Filter and search
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      // Filter by category
      if (activeFilter === 'unread' && item.isRead) return false;
      if (activeFilter === 'mention' && !item.type?.toLowerCase().includes('mention') && !item.content?.includes('@')) return false;
      if (activeFilter === 'customer' && !item.customerId && !item.type?.toLowerCase().includes('customer')) return false;
      if (activeFilter === 'task' && !item.type?.toLowerCase().includes('task') && !item.type?.toLowerCase().includes('remind')) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchContent = item.content?.toLowerCase().includes(q);
        const matchCustomer = item.customerName?.toLowerCase().includes(q);
        const matchAuthor = item.authorName?.toLowerCase().includes(q);
        return matchTitle || matchContent || matchCustomer || matchAuthor;
      }

      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs} giờ trước`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  const getCategoryBadge = (item: AppNotification) => {
    if (item.type?.toLowerCase().includes('mention') || item.content?.includes('@')) {
      return {
        label: 'Nhắc tên',
        icon: AtSign,
        color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      };
    }
    if (item.customerId || item.type?.toLowerCase().includes('customer')) {
      return {
        label: 'Khách hàng',
        icon: Briefcase,
        color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      };
    }
    if (item.type?.toLowerCase().includes('task') || item.type?.toLowerCase().includes('remind')) {
      return {
        label: 'Công việc',
        icon: Clock,
        color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    }
    return {
      label: 'Hệ thống',
      icon: Bell,
      color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    };
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        {/* Header matching media_1789637442769.png */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Thông báo & Nhắc nhở
              </h1>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Trung tâm tiếp nhận các đề cập @mention, lịch hẹn khách hàng và công việc cần xử lý.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleRefresh}
              title="Làm mới danh sách"
              className="p-2 border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232120] rounded-xl text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#232120] rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] p-3 sm:p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Tất cả', count: notifications.length },
              { id: 'unread', label: 'Chưa đọc', count: unreadCount },
              { id: 'mention', label: 'Nhắc tên (@)', count: notifications.filter(n => n.type?.includes('mention') || n.content?.includes('@')).length },
              { id: 'customer', label: 'Khách hàng', count: notifications.filter(n => n.customerId).length },
              { id: 'task', label: 'Công việc', count: notifications.filter(n => n.type?.includes('task') || n.type?.includes('remind')).length },
            ].map(tab => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as FilterCategory)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-2xs font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#232120]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                          : 'bg-gray-200 dark:bg-[#2e2b28] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nội dung thông báo..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-gray-50 dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl text-xs outline-none focus:border-gray-900 dark:focus:border-white transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List matching media_1789637442769.png */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] rounded-2xl p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#232120] flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Không có thông báo nào
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'Không tìm thấy thông báo phù hợp với từ khóa tìm kiếm.'
                  : 'Bạn đã xem hết toàn bộ thông báo hoặc chưa có tương tác mới.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(item => {
              const badge = getCategoryBadge(item);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-[#1d1c19] border rounded-2xl p-4 sm:p-5 transition shadow-sm hover:shadow-md flex flex-col sm:flex-row items-start justify-between gap-4 ${
                    !item.isRead
                      ? 'border-blue-300/80 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10'
                      : 'border-gray-200 dark:border-[#332f2c]'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Avatar / Icon */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#282522] border border-gray-200 dark:border-[#332f2c] flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-xs">
                        {item.authorName ? item.authorName.charAt(0).toUpperCase() : <Bell className="w-4 h-4 text-gray-500" />}
                      </div>
                      {!item.isRead && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white dark:border-[#1d1c19]" />
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${badge.color}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>

                        {item.customerName && (
                          <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                            KH: {item.customerName}
                          </span>
                        )}

                        <span className="text-[10px] text-gray-400 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h4>

                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                        {item.content}
                      </p>

                      {item.noteContent && (
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#232120] border border-gray-100 dark:border-[#2f2b28] text-[11px] text-gray-700 dark:text-gray-300 italic font-mono">
                          "{item.noteContent}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-[#2b2826] w-full sm:w-auto justify-end">
                    {item.customerId && (
                      <Link
                        to={`/?id=${item.customerId}`}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-[#232120] hover:bg-gray-200 dark:hover:bg-[#2a2825] text-gray-800 dark:text-gray-200 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Xem khách hàng</span>
                      </Link>
                    )}

                    {!item.isRead && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
                      >
                        <Check className="w-3 h-3" />
                        <span>Đã đọc</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
};
export default NotificationsPage;
