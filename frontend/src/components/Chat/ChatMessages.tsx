import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../context/AuthContext';

export interface ChatMessage {
  id: string;
  _id?: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  sender_name?: string;
  created_at: string;
}

const ChatMessages: React.FC = () => {
  const activeTab = useChatStore((s) => s.activeTab);
  const dmMessages = useChatStore((s) => s.messages);
  const forumMessages = useChatStore((s) => s.forumMessages);
  const isLoadingDM = useChatStore((s) => s.isLoadingMessages);
  const isLoadingForum = useChatStore((s) => s.isLoadingForum);
  const selectedUserId = useChatStore((s) => s.selectedUserId);
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeTab === 'forum' ? forumMessages : dmMessages;
  const isLoading = activeTab === 'forum' ? isLoadingForum : isLoadingDM;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/40">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
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
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-yellow-500 border border-slate-700 mr-2 mt-1 shrink-0">
                {(msg.sender_name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
              isMe 
                ? 'bg-yellow-500 text-slate-950 rounded-tr-none' 
                : 'bg-slate-800 text-white rounded-tl-none border border-slate-700/50'
            }`}>
              {/* Hiện tên người gửi trong forum hoặc DM nhóm */}
              {!isMe && msg.sender_name && (
                <div className="text-[10px] font-bold text-yellow-500 mb-1 opacity-80">
                  {msg.sender_name}
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className={`text-[10px] text-right mt-1 ${isMe ? 'text-slate-800' : 'text-slate-500'}`}>
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
