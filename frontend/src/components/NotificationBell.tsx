import React, { useState, useRef, useEffect } from 'react';
import { Bell, AtSign, Check, CheckCheck, Clock, ExternalLink, MessageSquare } from 'lucide-react';
import { useSocket, AppNotification } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  onSelectCustomer?: (customerId: string) => void;
  isAdminPage?: boolean;
}

// ─── Thời gian tương đối ──────────────────────────────────────────────────────
const TIME_UNITS = [
  { label: 'ngày', ms: 86400000 },
  { label: 'giờ', ms: 3600000 },
  { label: 'phút', ms: 60000 },
] as const;

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const unit = TIME_UNITS.find(u => diff >= u.ms);
  return unit ? `${Math.floor(diff / unit.ms)} ${unit.label} trước` : 'Vừa xong';
};

// ─── Icon theo type ───────────────────────────────────────────────────────────
const NotifIcon = ({ type }: { type: string }) => {
  if (type === 'mention') return <AtSign className="w-4 h-4 text-brand" />;
  return <Bell className="w-4 h-4 text-fg-muted" />;
};

// ─── Single Notification Item ─────────────────────────────────────────────────
const NotifItem = ({
  notif,
  onClick,
}: {
  notif: AppNotification;
  onClick: (n: AppNotification) => void;
}) => (
  <button
    onClick={() => onClick(notif)}
    className={`w-full text-left px-4 py-3 flex gap-3 transition-colors duration-150 group border-b border-divider dark:border-divider last:border-0 cursor-pointer ${
      notif.isRead
        ? 'hover:bg-surface-alt dark:hover:bg-surface'
        : 'bg-brand/5 dark:bg-brand/10 border-l-[3px] border-l-brand hover:bg-brand/10'
    }`}
    style={{ borderLeftColor: notif.isRead ? 'transparent' : '#0284c7' }}
  >
    {/* Icon */}
    <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
      notif.isRead ? 'bg-raised dark:bg-surface text-fg-subtle dark:text-fg-subtle' : 'bg-brand/20'
    }`}>
      <NotifIcon type={notif.type} />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-semibold leading-snug ${notif.isRead ? 'text-fg-subtle dark:text-fg-subtle' : 'text-fg dark:text-fg'}`}>
        {notif.title}
      </p>
      <p className="text-2xs text-fg-subtle dark:text-fg-subtle mt-0.5 leading-relaxed line-clamp-2">
        {notif.content}
      </p>

      {/* Note preview */}
      {notif.noteContent && (
        <div className="mt-1.5 flex items-start gap-1.5 bg-raised dark:bg-surface rounded-lg px-2 py-1.5">
          <MessageSquare className="w-3 h-3 text-fg-faint dark:text-fg-faint mt-0.5 shrink-0" />
          <p className="text-2xs text-fg-muted dark:text-fg-muted italic leading-snug line-clamp-2">
            "{notif.noteContent}"
          </p>
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-2xs text-fg-faint dark:text-fg-faint flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {timeAgo(notif.createdAt)}
        </span>
        {notif.customerName && (
          <span className="text-2xs text-brand font-semibold flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />
            KH: {notif.customerName}
          </span>
        )}
        {!notif.isRead && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
        )}
      </div>
    </div>
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const NotificationBell = ({ onSelectCustomer, isAdminPage }: NotificationBellProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleMarkAllAsRead = () => {
    markAllAsRead().catch(err =>
      console.error('Không thể đánh dấu tất cả đã đọc:', err)
    );
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    // Đánh dấu đã đọc hỏng thì vẫn phải mở được khách hàng — điều hướng là việc
    // người dùng vừa yêu cầu, không nên chặn nó vì một thao tác phụ thất bại.
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
      } catch (err) {
        console.error('Không thể đánh dấu đã đọc:', err);
      }
    }
    setIsOpen(false);
    if (notif.customerId) {
      if (onSelectCustomer) {
        onSelectCustomer(notif.customerId);
      } else {
        navigate(
          isAdminPage
            ? `/admin/dashboard?customerId=${notif.customerId}`
            : `/customers?customerId=${notif.customerId}`
        );
      }
    }
  };

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo"
        className={`relative flex h-9 w-9 items-center justify-center rounded-control border transition cursor-pointer ${
          isOpen
            ? 'border-brand/50 bg-brand/10 text-brand'
            : 'border-line bg-surface text-fg-muted hover:text-fg dark:border-line dark:bg-surface dark:text-fg-muted dark:hover:text-fg'
        }`}
      >
        <Bell className="h-4 w-4" strokeWidth={1.7} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 bg-brand text-white text-2xs font-semibold rounded-full flex items-center justify-center border border-white dark:border-surface">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[360px] bg-surface dark:bg-panel border border-line dark:border-line rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ animation: 'slideDown 0.15s ease-out' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-divider dark:border-divider bg-surface-alt/70 dark:bg-surface flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand" />
              <span className="text-xs font-semibold text-fg dark:text-fg">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-brand text-white text-2xs font-semibold rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-2xs text-fg-subtle dark:text-fg-subtle hover:text-brand dark:hover:text-brand transition font-semibold cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex px-3 pt-2 gap-1 border-b border-divider dark:border-divider pb-2">
            {(['all', 'unread'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-2xs font-semibold transition cursor-pointer ${
                  filter === tab
                    ? 'bg-brand/15 text-brand'
                    : 'text-fg-subtle dark:text-fg-subtle hover:text-fg dark:hover:text-fg'
                }`}
              >
                {tab === 'all' ? 'Tất cả' : `Chưa đọc (${unreadCount})`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3 text-fg-faint dark:text-fg-faint">
                <div className="w-10 h-10 rounded-full bg-raised dark:bg-surface flex items-center justify-center">
                  <Check className="w-5 h-5 text-fg-faint dark:text-fg-faint" />
                </div>
                <p className="text-xs">
                  {filter === 'unread' ? 'Không có thông báo chưa đọc.' : 'Chưa có thông báo nào.'}
                </p>
              </div>
            ) : (
              displayed.map(notif => (
                <NotifItem key={notif.id} notif={notif} onClick={handleNotificationClick} />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-divider dark:border-divider bg-surface-alt/50 dark:bg-surface/50 text-center">
              <span className="text-2xs text-fg-subtle dark:text-fg-faint">
                {notifications.length} thông báo · {unreadCount} chưa đọc
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
