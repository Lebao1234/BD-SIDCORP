import React from 'react';
import { Search, MessageCircle, Users } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useSocket } from '../../context/SocketContext';

const ChatSidebar: React.FC = () => {
  const contacts = useChatStore((s) => s.contacts);
  const selectedUserId = useChatStore((s) => s.selectedUserId);
  const setSelectedUserId = useChatStore((s) => s.setSelectedUserId);
  const activeTab = useChatStore((s) => s.activeTab);
  const setActiveTab = useChatStore((s) => s.setActiveTab);
  const { onlineUsers } = useSocket();

  const onlineCount = onlineUsers.length;

  return (
    <div className="w-80 flex flex-col border-r border-slate-800 bg-slate-950/50 backdrop-blur-md">
      {/* Tab switcher */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('dm')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold transition ${
            activeTab === 'dm'
              ? 'text-yellow-400 border-b-2 border-yellow-500 bg-yellow-500/5'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Tin nhắn
        </button>
        <button
          onClick={() => {
            setActiveTab('forum');
            setSelectedUserId(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold transition ${
            activeTab === 'forum'
              ? 'text-yellow-400 border-b-2 border-yellow-500 bg-yellow-500/5'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Users className="w-4 h-4" />
          Thảo luận
        </button>
      </div>

      {activeTab === 'dm' ? (
        <>
          {/* Search */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm đoạn chat..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
              />
            </div>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {contacts.map(user => {
              const isSelected = selectedUserId === Number(user.id);
              const isOnline = onlineUsers.includes(String(user.id));

              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(Number(user.id))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                    isSelected ? 'bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-yellow-500 font-bold border border-slate-700">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
                      isOnline ? 'bg-green-500' : 'bg-slate-600'
                    }`}></div>
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="font-semibold text-sm text-white truncate">{user.name}</div>
                    <div className={`text-xs truncate ${isOnline ? 'text-green-400' : 'text-slate-500'}`}>
                      {isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* Forum sidebar */
        <div className="flex-1 flex flex-col p-4">
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Diễn đàn Team</h3>
                <p className="text-xs text-slate-400">Tất cả thành viên</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-green-400 font-medium">{onlineCount} đang trực tuyến</span>
              <span className="text-slate-500">• {contacts.length + 1} thành viên</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3">Thành viên</div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
            {contacts.map(user => {
              const isOnline = onlineUsers.includes(String(user.id));
              return (
                <div key={user.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-yellow-500 border border-slate-700">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                      isOnline ? 'bg-green-500' : 'bg-slate-600'
                    }`}></div>
                  </div>
                  <span className="text-xs text-slate-300 truncate">{user.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
