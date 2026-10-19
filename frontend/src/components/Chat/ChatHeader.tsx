import React from 'react';
import { Users } from 'lucide-react';
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
      <div className="h-16 border-b border-divider dark:border-divider bg-surface dark:bg-panel flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-raised dark:bg-surface border border-line dark:border-line flex items-center justify-center text-fg dark:text-fg">
              <Users className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-panel rounded-full"></span>
          </div>
          <div>
            <h2 className="font-bold text-fg dark:text-white text-sm leading-tight">
              Thảo luận chung
            </h2>
            <div className="text-xs font-medium text-ok flex items-center gap-1.5">
              <span>Trực tuyến</span>
              <span className="text-fg-empty dark:text-fg-faint font-normal">•</span>
              <span className="text-fg-faint font-normal">{onlineCount} đang trực tuyến</span>
            </div>
          </div>
        </div>

        {/*
          Đã gỡ ba nút Gọi video / Gọi thoại / Tùy chọn khác.
          Chúng không có onClick nào — bấm vào không có phản ứng gì, và một nút
          im lặng khiến người dùng tưởng hệ thống treo chứ không nghĩ là chưa
          có tính năng. Khi nào backend thực sự có cuộc gọi thì thêm lại.
        */}
      </div>
    );
  }

  // ── DM header (chưa chọn người trò chuyện) ────────────────────────────────
  if (!user) {
    return (
      <div className="h-16 border-b border-divider dark:border-divider bg-surface dark:bg-panel flex items-center px-6 shrink-0">
        <div className="text-fg-faint dark:text-fg-subtle text-xs">
          Vui lòng chọn một cuộc trò chuyện để bắt đầu
        </div>
      </div>
    );
  }

  // ── DM header (đã chọn người trò chuyện) ──────────────────────────────────
  const isOnline = selectedUserId ? onlineUsers.includes(String(selectedUserId)) : false;
  const initials = getInitials(user.name);

  return (
    <div className="h-16 border-b border-divider dark:border-divider bg-surface dark:bg-panel flex items-center px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-raised dark:bg-raised text-fg dark:text-fg border border-line dark:border-line-input flex items-center justify-center font-bold text-xs overflow-hidden">
            {user.avatar_url || user.avatarUrl ? (
              <img src={user.avatar_url || user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-panel rounded-full"></span>
          )}
        </div>
        <div>
          <h2 className="font-bold text-fg dark:text-white text-sm leading-tight">
            {user.name}
          </h2>
          <div className={`text-xs font-medium ${isOnline ? 'text-emerald-500' : 'text-fg-faint'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/*
        Đã gỡ ba nút Gọi video / Gọi thoại / Tùy chọn khác.
        Chúng không có onClick nào — bấm vào không có phản ứng gì, và một nút
        im lặng khiến người dùng tưởng hệ thống treo chứ không nghĩ là chưa
        có tính năng. Khi nào backend thực sự có cuộc gọi thì thêm lại.
      */}
    </div>
  );
};

export default ChatHeader;
