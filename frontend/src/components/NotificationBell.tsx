import React, { useState } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { useSocket, AppNotification } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  onSelectCustomer?: (customerId: string) => void;
  isAdminPage?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const NotificationBell = ({ onSelectCustomer, isAdminPage }: NotificationBellProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.customerId) {
      if (onSelectCustomer) {
        onSelectCustomer(notif.customerId);
      } else {
        navigate(`/customers?customerId=${notif.customerId}`);
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 transition text-slate-400 hover:text-white focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close click outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Container */}
          <div className="absolute right-0 mt-3 w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Thông báo ({unreadCount})</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-[#e8732c] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Check className="w-3.5 h-3.5" />
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-900">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Bạn không có thông báo nào mới.
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left p-3.5 flex flex-col gap-1 transition ${
                      notif.isRead ? 'bg-transparent text-slate-400 hover:bg-slate-900/40' : 'bg-[#e8732c]/10 text-slate-200 border-l-2 border-[#e8732c] hover:bg-[#e8732c]/20'
                    }`}
                  >
                    <p className="text-xs font-medium leading-relaxed">
                      {notif.content}
                    </p>
                    <span className="text-[9px] text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleDateString('vi-VN')} {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
