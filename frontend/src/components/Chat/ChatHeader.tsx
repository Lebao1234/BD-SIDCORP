import React from 'react';
import { Video, Phone, MoreHorizontal, Users } from 'lucide-react';
import { useChatStore, useSelectedUser } from '../../store/useChatStore';
import { useSocket } from '../../context/SocketContext';

// Helper tạo chữ cái viết tắt cho avatar
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const ChatHeader: React.FC = () => {
  const activeTab = useChatStore((s) => s.activeTab);
  const selectedUserId = useChatStore((s) => s.selectedUserId);
  const user = useSelectedUser();
  const { onlineUsers } = useSocket();

  // ── Forum header ───────────────────────────────────────────────────────────
  if (activeTab === 'forum') {
    const onlineCount = onlineUsers.length;
    return (
      <div className="h-16 border-b border-gray-100 dark:border-[#2a2724] bg-white dark:bg-[#1d1c19] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] flex items-center justify-center text-gray-800 dark:text-gray-200">
              <Users className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#1d1c19] rounded-full"></span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
              Design Team
            </h2>
            <div className="text-xs font-medium text-emerald-500 flex items-center gap-1.5">
              <span>Online</span>
              <span className="text-gray-300 dark:text-gray-600 font-normal">•</span>
              <span className="text-gray-400 font-normal">{onlineCount} đang trực tuyến</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Video call, Voice call, More menu */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Cuộc gọi video nhóm"
            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Cuộc gọi thoại nhóm"
            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Tùy chọn khác"
            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── DM header (chưa chọn người trò chuyện) ────────────────────────────────
  if (!user) {
    return (
      <div className="h-16 border-b border-gray-100 dark:border-[#2a2724] bg-white dark:bg-[#1d1c19] flex items-center px-6 shrink-0">
        <div className="text-gray-400 dark:text-gray-500 text-xs">
          Vui lòng chọn một cuộc trò chuyện để bắt đầu
        </div>
      </div>
    );
  }

  // ── DM header (đã chọn người trò chuyện) ──────────────────────────────────
  const isOnline = selectedUserId ? onlineUsers.includes(String(selectedUserId)) : false;
  const initials = getInitials(user.name);

  return (
    <div className="h-16 border-b border-gray-100 dark:border-[#2a2724] bg-white dark:bg-[#1d1c19] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#1d1c19] rounded-full"></span>
          )}
        </div>
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
            {user.name}
          </h2>
          <div className={`text-xs font-medium ${isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Action Buttons: Video call, Voice call, More options */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Gọi Video"
          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition"
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Gọi Thoại"
          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Tùy chọn khác"
          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
