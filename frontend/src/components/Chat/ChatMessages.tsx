import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { confirmDialog } from '../../lib/notify';
import {
  Check,
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
  const hasMoreMessages = useChatStore((s) => s.hasMoreMessages);
  const hasMoreForum = useChatStore((s) => s.hasMoreForum);
  const isLoadingOlder = useChatStore((s) => s.isLoadingOlder);
  const loadOlderMessages = useChatStore((s) => s.loadOlderMessages);
  const peerLastReadAt = useChatStore((s) => s.peerLastReadAt);
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = activeTab === 'forum' ? forumMessages : dmMessages;
  const isLoading = activeTab === 'forum' ? isLoadingForum : isLoadingDM;
  const hasMore = activeTab === 'forum' ? hasMoreForum : hasMoreMessages;

  // Mốc đối phương đã đọc tới. Trước đây mọi tin nhắn của mình đều hiện dấu hai
  // tích xanh vô điều kiện — tức là màn hình khẳng định "đã xem" mà không dựa
  // trên bất kỳ dữ liệu nào. Diễn đàn không có khái niệm đối phương nên không
  // hiện trạng thái đọc.
  const peerReadUntil = peerLastReadAt ? new Date(peerLastReadAt).getTime() : 0;

  // Chỉ cuộn xuống đáy khi có tin MỚI ở cuối danh sách. Nếu phụ thuộc vào cả
  // mảng `messages` thì thao tác "xem tin cũ hơn" (thêm vào ĐẦU mảng) cũng bị
  // kéo tuột xuống đáy, đúng chỗ người dùng vừa rời đi.
  const lastMessageId = messages.length
    ? messages[messages.length - 1].id || messages[messages.length - 1]._id
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId]);

  // Giữ nguyên vị trí đang đọc sau khi chèn thêm một trang tin cũ lên phía trên
  const handleLoadOlder = async () => {
    const container = scrollRef.current;
    const heightBefore = container?.scrollHeight ?? 0;
    await loadOlderMessages();
    if (container) {
      container.scrollTop += container.scrollHeight - heightBefore;
    }
  };

  const handleRevoke = async (msgId: string) => {
    if (!socket || !currentUser) return;
    if (await confirmDialog({ title: 'Thu hồi tin nhắn này?', message: 'Mọi người trong cuộc trò chuyện sẽ không còn thấy nội dung tin nhắn.', confirmLabel: 'Thu hồi', danger: true })) {
      socket.emit('revoke_message', { messageId: msgId, senderId: currentUser.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface dark:bg-canvas">
        <div className="w-8 h-8 border-2 border-gray-800 dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Chưa chọn user trong DM mode
  if (activeTab === 'dm' && !selectedUserId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface dark:bg-canvas text-fg-faint dark:text-fg-subtle gap-2 select-none">
        <div className="w-14 h-14 rounded-full bg-raised dark:bg-surface flex items-center justify-center mb-1">
          <MessageCircle className="w-7 h-7 text-fg-faint" />
        </div>
        <p className="text-xs font-medium">Chọn một đoạn chat để bắt đầu</p>
      </div>
    );
  }

  // Nếu cuộc trò chuyện chưa có tin nhắn nào trong CSDL
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface dark:bg-canvas text-fg-faint dark:text-fg-subtle gap-2 p-8 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-raised dark:bg-surface flex items-center justify-center text-fg-faint mb-1">
          <MessageCircle className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-fg-muted dark:text-fg-body">
          Chưa có tin nhắn nào
        </p>
        <p className="text-[11px] text-fg-faint dark:text-fg-subtle">
          Hãy gửi tin nhắn bên dưới để bắt đầu cuộc trò chuyện!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-5 space-y-3 bg-surface dark:bg-canvas custom-scrollbar"
    >
      {hasMore && (
        <div className="flex justify-center pb-1">
          <button
            type="button"
            onClick={handleLoadOlder}
            disabled={isLoadingOlder}
            className="rounded-full border border-line dark:border-line bg-surface-alt dark:bg-surface
              px-3.5 py-1 text-[11px] font-medium text-fg-subtle dark:text-fg-muted
              transition hover:text-fg dark:hover:text-fg disabled:opacity-50"
          >
            {isLoadingOlder ? 'Đang tải…' : 'Xem tin nhắn cũ hơn'}
          </button>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isMe = Number(msg.sender_id) === Number(currentUser?.id);
        const timeString = new Date(msg.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        const hasFile = Boolean(msg.file_url);
        const isImage = hasFile && isImageUrl(msg.file_url || '');

        // Đã xem khi đối phương đọc tới một thời điểm SAU khi tin này được gửi
        const isSeen = peerReadUntil > 0 && new Date(msg.created_at).getTime() <= peerReadUntil;

        return (
          <div
            key={msg.id || msg._id || idx}
            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
          >
            {/* Tên người gửi trong diễn đàn nếu là người khác */}
            {activeTab === 'forum' && !isMe && msg.sender_name && !msg.is_revoked && (
              <div className="text-[11px] font-semibold text-fg-body dark:text-fg-body mb-1 pl-1">
                {msg.sender_name}
              </div>
            )}

            <div className="relative group max-w-[72%]">
              {/* Nút thu hồi tin nhắn cho tin nhắn của mình */}
              {isMe && !msg.is_revoked && (msg.id || msg._id) && (
                <button
                  type="button"
                  onClick={() => handleRevoke(msg.id || msg._id || '')}
                  className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-fg-faint hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                  title="Thu hồi tin nhắn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {msg.is_revoked ? (
                <div className="italic text-xs text-fg-faint dark:text-fg-subtle bg-surface-alt dark:bg-raised/40 border border-dashed border-line dark:border-line-input rounded-2xl px-4 py-2">
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
                      className="block rounded-2xl overflow-hidden max-w-sm border border-line/80 dark:border-line shadow-2xs hover:opacity-95 transition mb-1"
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
                          ? 'bg-brand text-white border-brand hover:bg-brand-hover'
                          : 'bg-surface-alt dark:bg-surface text-fg dark:text-fg border-line dark:border-line hover:bg-raised dark:hover:bg-raised'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isMe
                            ? 'bg-surface/10 text-white dark:bg-gray-100 dark:text-gray-900'
                            : 'bg-line dark:bg-divider text-fg-body dark:text-fg'
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
                            isMe ? 'text-white/70 dark:text-fg-faint' : 'text-fg-faint'
                          }`}
                        >
                          Nhấn để tải về / xem tệp
                        </div>
                      </div>
                      <Download className="w-4 h-4 shrink-0 opacity-70" />
                    </a>
                  )}

                  {/* Tin nhắn văn bản: của mình màu thương hiệu, của người khác nền trung tính */}
                  {(!hasFile || (hasFile && !msg.content.startsWith('Đã gửi tệp đính kèm:'))) && (
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm shadow-2xs whitespace-pre-wrap leading-relaxed ${
                        isMe
                          ? 'bg-brand text-white rounded-tr-xs'
                          : 'bg-raised dark:bg-surface text-fg dark:text-fg rounded-tl-xs border border-line/60 dark:border-line'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Dấu thời gian & Trạng thái đọc dưới tin nhắn */}
            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-fg-faint dark:text-fg-subtle">
              <span>{timeString}</span>
              {isMe && activeTab === 'dm' && (
                isSeen ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-500" aria-label="Đã xem" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-fg-faint" aria-label="Đã gửi" />
                )
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
