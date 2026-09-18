import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Clock, ExternalLink, Loader2 } from 'lucide-react';
import type { AppNotification } from '../../context/SocketContext';
import { formatRelativeTime } from '../../utils/datetime';
import { CATEGORY_META, getCategory } from './notificationCategory';

interface NotificationCardProps {
  item: AppNotification;
  onMarkAsRead: (id: string) => void;
  isMarking?: boolean;
}

/** Một thẻ thông báo trong danh sách. */
export const NotificationCard: React.FC<NotificationCardProps> = ({
  item,
  onMarkAsRead,
  isMarking = false,
}) => {
  const badge = CATEGORY_META[getCategory(item)];
  const BadgeIcon = badge.icon;

  return (
    <div
      className={`bg-white dark:bg-[#1d1c19] border rounded-2xl p-4 sm:p-5 transition shadow-sm hover:shadow-md flex flex-col sm:flex-row items-start justify-between gap-4 ${
        !item.isRead
          ? 'border-blue-300/80 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10'
          : 'border-gray-200 dark:border-[#332f2c]'
      }`}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#282522] border border-gray-200 dark:border-[#332f2c] flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-xs">
            {item.authorName ? (
              item.authorName.charAt(0).toUpperCase()
            ) : (
              <Bell className="w-4 h-4 text-gray-500" />
            )}
          </div>
          {!item.isRead && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white dark:border-[#1d1c19]" />
          )}
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${badge.color}`}
            >
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
            type="button"
            onClick={() => onMarkAsRead(item.id)}
            disabled={isMarking}
            className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isMarking ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            <span>Đã đọc</span>
          </button>
        )}
      </div>
    </div>
  );
};

