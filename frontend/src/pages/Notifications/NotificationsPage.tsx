import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck, RotateCw } from 'lucide-react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { Alert } from '../../components/common/Alert';
import { useSocket } from '../../context/SocketContext';
import { useFeedback } from '../../hooks/useFeedback';
import {
  NotificationCard,
  NotificationToolbar,
  buildFilterTabs,
  matchesFilter,
  matchesSearch,
  type FilterCategory,
} from '../../components/Notifications';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } =
    useSocket();
  const { feedback, showErrorFrom, clear } = useFeedback();

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    clear();
    try {
      await refreshNotifications();
    } catch (err) {
      showErrorFrom(err, 'Không thể làm mới danh sách thông báo.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    clear();
    try {
      await markAsRead(id);
    } catch (err) {
      showErrorFrom(err, 'Không thể đánh dấu thông báo đã đọc.');
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    clear();
    try {
      await markAllAsRead();
    } catch (err) {
      showErrorFrom(err, 'Không thể đánh dấu tất cả thông báo đã đọc.');
    }
  };

  const tabs = useMemo(() => buildFilterTabs(notifications), [notifications]);

  const filteredNotifications = useMemo(
    () =>
      notifications.filter(
        (item) => matchesFilter(item, activeFilter) && matchesSearch(item, searchQuery)
      ),
    [notifications, activeFilter, searchQuery]
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Thông báo &amp; Nhắc nhở
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
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Làm mới danh sách"
              className="p-2 border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#232120] rounded-xl text-xs font-medium transition cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#232120] rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>

        <Alert feedback={feedback} onDismiss={clear} />

        <NotificationToolbar
          tabs={tabs}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

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
            filteredNotifications.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onMarkAsRead={handleMarkAsRead}
                isMarking={markingId === item.id}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
