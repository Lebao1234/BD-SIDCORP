import React from 'react';
import {Info, Users } from 'lucide-react';
import { useChatStore, useSelectedUser } from '../../store/useChatStore';
import { useSocket } from '../../context/SocketContext';

const ChatHeader: React.FC = () => {
  const activeTab = useChatStore((s) => s.activeTab);
  const selectedUserId = useChatStore((s) => s.selectedUserId);
  const contacts = useChatStore((s) => s.contacts);
  const user = useSelectedUser();
  const { onlineUsers } = useSocket();

  // ── Forum header ───────────────────────────────────────────────────────────
  if (activeTab === 'forum') {
    const onlineCount = onlineUsers.length;
    return (
      <div className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e8732c] to-[#c9621f] flex items-center justify-center shadow-lg shadow-[#e8732c]/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Diễn đàn Thảo luận</h3>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span>{onlineCount} đang trực tuyến</span>
              <span className="text-slate-600">•</span>
              <span>{contacts.length + 1} thành viên</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── DM header (no user selected) ───────────────────────────────────────────
  if (!user) {
    return (
      <div className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center px-6">
        <div className="text-slate-400 text-sm">Vui lòng chọn một người để trò chuyện</div>
      </div>
    );
  }

  // ── DM header (user selected) ──────────────────────────────────────────────
  const isOnline = selectedUserId ? onlineUsers.includes(String(selectedUserId)) : false;

  return (
    <div className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[#e8732c] font-bold border border-slate-700">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
            isOnline ? 'bg-green-500' : 'bg-slate-600'
          }`}></div>
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">{user.name}</h3>
          <div className={`text-xs ${isOnline ? 'text-green-400' : 'text-slate-400'}`}>
            {isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition">
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
