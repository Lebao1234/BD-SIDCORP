import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Trash2 } from 'lucide-react';

export interface ChatMessage {
  id: string;
  _id?: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  file_url?: string;
  is_revoked?: boolean;
  sender_name?: string;
  created_at: string;
}

// Helper để check xem có phải ảnh không
const isImageUrl = (url: string) => {
  return /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url);
};

const ChatMessages: React.FC = () => {
  const activeTab = useChatStore((s) => s.activeTab);
  const dmMessages = useChatStore((s) => s.messages);
  const forumMessages = useChatStore((s) => s.forumMessages);
  const isLoadingDM = useChatStore((s) => s.isLoadingMessages);
  const isLoadingForum = useChatStore((s) => s.isLoadingForum);
  const selectedUserId = useChatStore((s) => s.selectedUserId);
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeTab === 'forum' ? forumMessages : dmMessages;
  const isLoading = activeTab === 'forum' ? isLoadingForum : isLoadingDM;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRevoke = (msgId: string) => {
    if (!socket || !currentUser) return;
    if (confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) {
      socket.emit('revoke_message', { messageId: msgId, senderId: currentUser.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/40">
        <div className="w-8 h-8 border-2 border-[#e8732c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Chưa chọn user trong DM mode
  if (activeTab === 'dm' && !selectedUserId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 text-slate-500 gap-2">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm">Chọn một đoạn chat để bắt đầu</p>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 text-slate-500">
        <p>{activeTab === 'forum' ? 'Chưa có tin nhắn nào trong diễn đàn. Hãy bắt đầu thảo luận!' : 'Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/40 custom-scrollbar">
      {messages.map((msg, idx) => {
        const isMe = Number(msg.sender_id) === Number(currentUser?.id);
        const timeString = new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        return (
          <div key={msg.id || msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar cho forum tin nhắn người khác */}
            {activeTab === 'forum' && !isMe && (
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-[#e8732c] border border-slate-700 mr-2 mt-1 shrink-0">
                {(msg.sender_name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm relative group ${
              msg.is_revoked 
                ? 'bg-slate-800 text-slate-500 italic'
                : isMe 
                  ? 'bg-[#e8732c] text-slate-950 rounded-tr-none' 
                  : 'bg-slate-800 text-white rounded-tl-none border border-slate-700/50'
            }`}>
              {/* Nút thu hồi (chỉ hiện khi hover vào tin nhắn của mình và chưa thu hồi) */}
              {isMe && !msg.is_revoked && (msg.id || msg._id) && (
                <button
                  onClick={() => handleRevoke(msg.id || msg._id || '')}
                  className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                  title="Thu hồi tin nhắn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Hiện tên người gửi trong forum hoặc DM nhóm */}
              {!isMe && msg.sender_name && !msg.is_revoked && (
                <div className="text-[10px] font-bold text-[#e8732c] mb-1 opacity-80">
                  {msg.sender_name}
                </div>
              )}
              
              {msg.is_revoked ? (
                <span>Tin nhắn đã bị thu hồi</span>
              ) : (
                <>
                  {msg.file_url && isImageUrl(msg.file_url) ? (
                    <img src={msg.file_url} alt="attachment" className="max-w-full max-h-64 rounded-lg mb-2 object-cover" />
                  ) : msg.file_url ? (
                    <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg mb-2 hover:bg-black/30 transition">
                      <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      <span className="truncate">{msg.content.replace('Đã gửi tệp đính kèm: ', '')}</span>
                    </a>
                  ) : null}
                  <div className="whitespace-pre-wrap">{msg.file_url ? '' : msg.content}</div>
                </>
              )}
              
              <div className={`text-[10px] text-right mt-1 ${msg.is_revoked ? 'text-slate-600' : isMe ? 'text-slate-800' : 'text-slate-500'}`}>
                {timeString}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
