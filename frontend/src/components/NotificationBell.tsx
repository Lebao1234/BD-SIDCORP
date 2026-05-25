import React, { useState, useRef, useEffect } from 'react';
import { Bell, AtSign, Check, CheckCheck, Clock, ExternalLink, MessageSquare } from 'lucide-react';
import { useSocket, AppNotification } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  onSelectCustomer?: (customerId: string) => void;
  isAdminPage?: boolean;
}

// ─── Thời gian tương đối ──────────────────────────────────────────────────────
const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
};

// ─── Icon theo type ───────────────────────────────────────────────────────────
const NotifIcon = ({ type }: { type: string }) => {
  if (type === 'mention') return <AtSign className="w-4 h-4 text-[#e8732c]" />;
  return <Bell className="w-4 h-4 text-blue-400" />;
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
    className={`w-full text-left px-4 py-3 flex gap-3 transition-all duration-200 group border-b border-slate-800/60 last:border-0 ${
      notif.isRead
        ? 'hover:bg-slate-900/40'
        : 'bg-[#e8732c]/8 border-l-[3px] border-l-[#e8732c] hover:bg-[#e8732c]/15'
    }`}
    style={{ borderLeftColor: notif.isRead ? 'transparent' : '#e8732c' }}
  >
    {/* Icon */}
    <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
      notif.isRead ? 'bg-slate-800' : 'bg-[#e8732c]/20'
    }`}>
      <NotifIcon type={notif.type} />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-semibold leading-snug ${notif.isRead ? 'text-slate-400' : 'text-white'}`}>
        {notif.title}
      </p>
      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
        {notif.content}
      </p>

      {/* Note preview */}
      {notif.noteContent && (
        <div className="mt-1.5 flex items-start gap-1.5 bg-slate-800/60 rounded-lg px-2 py-1.5">
          <MessageSquare className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-400 italic leading-snug line-clamp-2">
            "{notif.noteContent}"
          </p>
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-[9px] text-slate-500 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {timeAgo(notif.createdAt)}
        </span>
        {notif.customerName && (
          <span className="text-[9px] text-[#e8732c] font-semibold flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />
            KH: {notif.customerName}
          </span>
        )}
        {!notif.isRead && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e8732c] shrink-0" />
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

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) await markAsRead(notif.id);
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
        className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
          isOpen
            ? 'bg-[#e8732c]/20 border-[#e8732c]/50 text-[#e8732c]'
            : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#e8732c] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ animation: 'slideDown 0.15s ease-out' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#e8732c]" />
              <span className="text-xs font-bold text-white">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[#e8732c] text-white text-[9px] font-bold rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#e8732c] transition font-semibold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex px-3 pt-2 gap-1">
            {(['all', 'unread'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                  filter === tab
                    ? 'bg-[#e8732c]/20 text-[#e8732c]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'all' ? 'Tất cả' : `Chưa đọc (${unreadCount})`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto mt-1">
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3 text-slate-500">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                  <Check className="w-5 h-5" />
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
            <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/40 text-center">
              <span className="text-[9px] text-slate-600">
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
