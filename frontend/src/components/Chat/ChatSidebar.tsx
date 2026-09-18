import React, { useState, useMemo } from 'react';
import { Search, Plus, CheckCheck, Users } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

// Helper tạo chữ cái viết tắt (VD: "Farand Hume" -> "FH")
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Helper định dạng thời gian thực tế
const formatMessageTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Hôm qua';
  }

  return `${date.getDate()}/${date.getMonth() + 1}`;
};

// Bảng màu trắng đen / xám trung tính cho avatar
const AVATAR_BG = [
  'bg-gray-100 text-gray-800 border-gray-200 dark:bg-[#232120] dark:text-gray-200 dark:border-[#332f2c]',
  'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
  'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
];

const ChatSidebar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const contacts = useChatStore((s) => s.contacts);
  const selectedUserId = useChatStore((s) => s.selectedUserId);
  const setSelectedUserId = useChatStore((s) => s.setSelectedUserId);
  const activeTab = useChatStore((s) => s.activeTab);
  const setActiveTab = useChatStore((s) => s.setActiveTab);
  const { onlineUsers } = useSocket();
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const unreadForumCount = useChatStore((s) => s.unreadForumCount);
  const clearUnread = useChatStore((s) => s.clearUnread);
  const clearForumUnread = useChatStore((s) => s.clearForumUnread);
  const conversations = useChatStore((s) => s.conversations);
  const lastForumMessage = useChatStore((s) => s.lastForumMessage);
  const messages = useChatStore((s) => s.messages);
  const { user: currentUser } = useAuth();

  // Lọc theo tìm kiếm
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  // Sắp xếp danh sách: những người có tin nhắn gần nhất sẽ đưa lên đầu
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      const convA = conversations[Number(a.id)];
      const convB = conversations[Number(b.id)];
      const timeA = convA?.created_at ? new Date(convA.created_at).getTime() : 0;
      const timeB = convB?.created_at ? new Date(convB.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [filteredContacts, conversations]);

  const isForumMatch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return 'diễn đàn team design thảo luận forum'.includes(q);
  }, [searchQuery]);

  return (
    <div className="w-[330px] shrink-0 flex flex-col border-r border-gray-100 dark:border-[#2a2724] bg-white dark:bg-[#1d1c19] select-none">
      {/* ── Header: "Chats" + Plus button ───────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Chats</h1>
        <button
          type="button"
          onClick={() => {
            if (activeTab !== 'forum') {
              setActiveTab('forum');
              setSelectedUserId(null);
            }
          }}
          title="Diễn đàn nhóm"
          className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* ── Search Bar: "Chats search..." ────────────────────────────── */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chats search..."
            className="w-full bg-[#f9fafb] dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition"
          />
        </div>
      </div>

      {/* ── Conversation List (Đồng bộ trực tiếp với CSDL) ─────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-100/80 dark:divide-[#2a2724]/70">
        {/* Kênh Diễn đàn Team */}
        {isForumMatch && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('forum');
              setSelectedUserId(null);
              clearForumUnread();
            }}
            className={`w-full px-4 py-3 flex items-center gap-3 transition text-left relative ${
              activeTab === 'forum'
                ? 'bg-gray-100/90 dark:bg-white/10'
                : 'hover:bg-gray-50/80 dark:hover:bg-white/5'
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] flex items-center justify-center text-gray-800 dark:text-gray-200">
                <Users className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm truncate ${unreadForumCount > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                  Design Team
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {unreadForumCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-sm animate-pulse" title="Tin nhắn mới trong nhóm" />
                  )}
                  <span className={`text-[11px] font-normal ${unreadForumCount > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                    {lastForumMessage ? formatMessageTime(lastForumMessage.created_at) : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                  {unreadForumCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-sm animate-pulse" />
                  )}
                  <span className={`truncate ${unreadForumCount > 0 ? 'font-medium text-gray-900 dark:text-gray-100' : ''}`}>
                    {lastForumMessage
                      ? `${lastForumMessage.sender_name || 'Thành viên'}: ${lastForumMessage.content}`
                      : 'Chưa có thảo luận nào'}
                  </span>
                </div>
                {unreadForumCount > 0 && (
                  <span className="min-w-[1.25rem] h-4 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {unreadForumCount > 9 ? '9+' : unreadForumCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        )}

        {/* Danh sách người dùng trực tiếp (Đồng bộ 100% CSDL) */}
        {sortedContacts.map((user, idx) => {
          const isSelected = activeTab === 'dm' && selectedUserId === Number(user.id);
          const isOnline = onlineUsers.includes(String(user.id));
          const unread = unreadCounts[Number(user.id)] || 0;
          const colorClass = AVATAR_BG[idx % AVATAR_BG.length];
          const initials = getInitials(user.name);

          // Lấy tin nhắn từ state hiện tại nếu đang chat, hoặc từ cache conversations đã đồng bộ từ DB
          const currentSessionLast =
            isSelected && messages.length > 0 ? messages[messages.length - 1] : null;
          const dbLast = conversations[Number(user.id)];
          const lastMsg = currentSessionLast || dbLast;

          const hasLastMsg = Boolean(lastMsg && lastMsg.content);
          const timeStr = hasLastMsg ? formatMessageTime(lastMsg?.created_at) : '';
          const isSentByMe = Number(lastMsg?.sender_id) === Number(currentUser?.id);

          return (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                setActiveTab('dm');
                setSelectedUserId(Number(user.id));
                clearUnread(Number(user.id));
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 transition text-left relative ${
                isSelected
                  ? 'bg-gray-100/90 dark:bg-white/10'
                  : 'hover:bg-gray-50/80 dark:hover:bg-white/5'
              }`}
            >
              {/* Avatar + Chấm xanh Online */}
              <div className="relative shrink-0">
                <div
                  className={`w-11 h-11 rounded-full border flex items-center justify-center font-bold text-xs tracking-wider overflow-hidden ${colorClass}`}
                >
                  {user.avatar_url || user.avatarUrl ? (
                    <img src={user.avatar_url || user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#1d1c19] rounded-full"></span>
                )}
              </div>

              {/* Tên, thời gian, nội dung tin nhắn thực tế từ CSDL */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                    {user.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {unread > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-sm animate-pulse" title="Tin nhắn mới tới" />
                    )}
                    {timeStr && (
                      <span className={`text-[11px] font-normal ${unread > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                        {timeStr}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                    {hasLastMsg && !isSentByMe && unread > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-sm animate-pulse" />
                    )}
                    {hasLastMsg && isSentByMe && (
                      <CheckCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    )}
                    <span className={`truncate ${unread > 0 ? 'font-medium text-gray-900 dark:text-gray-100' : ''}`}>
                      {hasLastMsg
                        ? lastMsg?.content
                        : 'Chưa có tin nhắn'}
                    </span>
                  </div>

                  {unread > 0 && (
                    <span className="min-w-[1.25rem] h-4 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredContacts.length === 0 && !isForumMatch && (
          <div className="p-6 text-center text-xs text-gray-400 dark:text-gray-500">
            Không tìm thấy kết quả nào
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
