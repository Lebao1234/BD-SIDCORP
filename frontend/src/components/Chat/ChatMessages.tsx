import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  Trash2,
  CheckCheck,
  FileText,
  Download,
  MessageCircle,
} from 'lucide-react';

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

// Helper kiểm tra ảnh
const isImageUrl = (url: string) => /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url);

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
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#171614]">
        <div className="w-8 h-8 border-2 border-gray-800 dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Chưa chọn user trong DM mode
  if (activeTab === 'dm' && !selectedUserId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#171614] text-gray-400 dark:text-gray-500 gap-2 select-none">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-[#232120] flex items-center justify-center mb-1">
          <MessageCircle className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-xs font-medium">Chọn một đoạn chat để bắt đầu</p>
      </div>
    );
  }

  // Nếu cuộc trò chuyện chưa có tin nhắn nào trong CSDL
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#171614] text-gray-400 dark:text-gray-500 gap-2 p-8 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#232120] flex items-center justify-center text-gray-400 mb-1">
          <MessageCircle className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Chưa có tin nhắn nào
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          Hãy gửi tin nhắn bên dưới để bắt đầu cuộc trò chuyện!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-white dark:bg-[#171614] custom-scrollbar">
      {messages.map((msg, idx) => {
        const isMe = Number(msg.sender_id) === Number(currentUser?.id);
        const timeString = new Date(msg.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        const hasFile = Boolean(msg.file_url);
        const isImage = hasFile && isImageUrl(msg.file_url || '');

        return (
          <div
            key={msg.id || msg._id || idx}
            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
          >
            {/* Tên người gửi trong diễn đàn nếu là người khác */}
            {activeTab === 'forum' && !isMe && msg.sender_name && !msg.is_revoked && (
              <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1 pl-1">
                {msg.sender_name}
              </div>
            )}

            <div className="relative group max-w-[72%]">
              {/* Nút thu hồi tin nhắn cho tin nhắn của mình */}
              {isMe && !msg.is_revoked && (msg.id || msg._id) && (
                <button
                  type="button"
                  onClick={() => handleRevoke(msg.id || msg._id || '')}
                  className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                  title="Thu hồi tin nhắn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {msg.is_revoked ? (
                <div className="italic text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2">
                  Tin nhắn đã bị thu hồi
                </div>
              ) : (
                <>
                  {/* File ảnh thật đính kèm */}
                  {hasFile && isImage && (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl overflow-hidden max-w-sm border border-gray-200/80 dark:border-[#332f2c] shadow-2xs hover:opacity-95 transition mb-1"
                    >
                      <img
                        src={msg.file_url}
                        alt="Tệp ảnh đính kèm"
                        className="max-w-full max-h-72 object-cover"
                      />
                    </a>
                  )}

                  {/* Tệp tài liệu thật đính kèm */}
                  {hasFile && !isImage && (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className={`flex items-center gap-3 p-3 rounded-2xl max-w-sm border shadow-2xs transition mb-1 ${
                        isMe
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-800 dark:border-gray-200 hover:opacity-90'
                          : 'bg-gray-50 dark:bg-[#232120] text-gray-900 dark:text-gray-100 border-gray-200 dark:border-[#332f2c] hover:bg-gray-100 dark:hover:bg-[#282624]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isMe
                            ? 'bg-white/10 text-white dark:bg-gray-100 dark:text-gray-900'
                            : 'bg-gray-200 dark:bg-[#2a2724] text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">
                          {msg.content.replace('Đã gửi tệp đính kèm: ', '') || 'Tệp đính kèm'}
                        </div>
                        <div
                          className={`text-[10px] ${
                            isMe ? 'text-white/70 dark:text-gray-600' : 'text-gray-400'
                          }`}
                        >
                          Nhấn để tải về / xem tệp
                        </div>
                      </div>
                      <Download className="w-4 h-4 shrink-0 opacity-70" />
                    </a>
                  )}

                  {/* Tin nhắn văn bản chuẩn trắng đen */}
                  {(!hasFile || (hasFile && !msg.content.startsWith('Đã gửi tệp đính kèm:'))) && (
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm shadow-2xs whitespace-pre-wrap leading-relaxed ${
                        isMe
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-tr-xs'
                          : 'bg-gray-100 dark:bg-[#232120] text-gray-900 dark:text-gray-100 rounded-tl-xs border border-gray-200/60 dark:border-[#332f2c]'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Dấu thời gian & Trạng thái đọc dưới tin nhắn */}
            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
              <span>{timeString}</span>
              {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
