/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { lazy, Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle, Paperclip, Smile } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { notify } from '../../lib/notify';
// Bảng emoji kéo theo toàn bộ dữ liệu emoji, nặng hơn cả phần còn lại của
// trang Chat cộng lại, mà chỉ hiện khi người dùng bấm vào biểu tượng mặt cười.
// Nạp động nên nó chỉ tải ở đúng lần bấm đầu tiên.
const EmojiPicker = lazy(() => import('emoji-picker-react'));

// Phải khớp với MAX_MESSAGE_LENGTH trong backend/src/sockets/socketManager.ts.
// Máy chủ mới là nơi thực sự từ chối; chặn ở đây chỉ để người dùng biết trước
// khi bấm gửi thay vì bị từ chối sau.
const MAX_MESSAGE_LENGTH = 4000;

// Bắt đầu hiện bộ đếm khi còn cách trần chừng này ký tự
const COUNTER_THRESHOLD = 500;

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Giữ lại nội dung vừa gửi để trả về ô nhập nếu máy chủ từ chối
  const lastSentRef = useRef('');
  const activeTab = useChatStore((s: { activeTab: any }) => s.activeTab);
  const selectedUserId = useChatStore((s: { selectedUserId: any }) => s.selectedUserId);
  const { socket } = useSocket();
  const { user: currentUser } = useAuth();

  // Forum luôn enabled; DM cần chọn user
  const disabled = activeTab === 'dm' && !selectedUserId;

  /*
   * Máy chủ phát `error_message` ở năm tình huống (người nhận không hợp lệ, nội
   * dung rỗng, tin nhắn quá dài, ghi MongoDB hỏng, không đủ quyền thu hồi) —
   * nhưng TRƯỚC ĐÂY KHÔNG CÓ AI LẮNG NGHE. Người dùng gõ xong, bấm gửi, ô nhập
   * trống đi, và tin nhắn đơn giản là không bao giờ xuất hiện. Không một dấu
   * hiệu nào cho biết vì sao.
   *
   * Ngoài việc hiện lỗi, còn trả lại nguyên văn nội dung vừa gõ: mất một đoạn
   * dài vì máy chủ từ chối là điều không thể chấp nhận.
   */
  useEffect(() => {
    if (!socket) return;

    const handleError = (data: { message?: string }) => {
      setSendError(data?.message ?? 'Không gửi được tin nhắn.');
      if (lastSentRef.current) {
        setMessage((current) => current || lastSentRef.current);
        lastSentRef.current = '';
      }
    };

    socket.on('error_message', handleError);
    return () => {
      socket.off('error_message', handleError);
    };
  }, [socket]);

  // Tự ẩn thông báo lỗi sau vài giây để nó không đứng đó mãi
  useEffect(() => {
    if (!sendError) return;
    const timer = setTimeout(() => setSendError(null), 6000);
    return () => clearTimeout(timer);
  }, [sendError]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim() || disabled || !socket || !currentUser) return;

      setSendError(null);
      lastSentRef.current = message.trim();

      if (activeTab === 'forum') {
        socket.emit('send_forum_message', {
          senderId: currentUser.id,
          senderName: currentUser.name,
          content: message.trim(),
        });
      } else {
        socket.emit('send_message', {
          senderId: currentUser.id,
          senderName: currentUser.name,
          receiverId: String(selectedUserId),
          content: message.trim(),
        });
      }

      setMessage('');
      setShowEmoji(false);
    },
    [message, disabled, socket, currentUser, activeTab, selectedUserId]
  );

  const onEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled || !socket || !currentUser) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/chat/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { publicUrl, fileName } = res.data;

      const msgData = {
        senderId: currentUser.id,
        senderName: currentUser.name,
        content: `Đã gửi tệp đính kèm: ${fileName}`,
        fileUrl: publicUrl,
      };

      if (activeTab === 'forum') {
        socket.emit('send_forum_message', msgData);
      } else {
        socket.emit('send_message', {
          ...msgData,
          receiverId: String(selectedUserId),
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      notify.error('Không thể tải tệp lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="p-4 bg-surface dark:bg-panel border-t border-divider dark:border-divider relative">
      {/* Emoji Picker Popup */}
      {showEmoji && (
        <div className="absolute bottom-full right-6 mb-3 z-50 shadow-2xl rounded-2xl overflow-hidden border border-line dark:border-line">
          <Suspense
            fallback={
              <div className="flex h-[350px] w-[300px] items-center justify-center bg-surface text-xs text-fg-faint dark:bg-surface">
                Đang tải bảng emoji…
              </div>
            }
          >
            <EmojiPicker onEmojiClick={onEmojiClick} theme={'auto' as any} />
          </Suspense>
        </div>
      )}

      {/* Lỗi gửi tin nhắn do máy chủ trả về */}
      {sendError && (
        <div className="mb-2 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2
          text-[11px] text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{sendError}</span>
          <button
            type="button"
            onClick={() => setSendError(null)}
            className="shrink-0 font-medium underline-offset-2 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Unified Input Container (theo mẫu thiết kế) */}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 border border-line dark:border-line rounded-2xl px-4 py-2 bg-surface dark:bg-surface shadow-2xs focus-within:border-line-strong dark:focus-within:border-gray-500 transition">
          {/* Ô nhập nội dung */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled}
            placeholder={
              disabled
                ? 'Chọn một người để bắt đầu nhắn tin...'
                : 'Type a message...'
            }
            maxLength={MAX_MESSAGE_LENGTH}
            className="flex-1 bg-transparent border-none text-sm text-fg dark:text-fg placeholder:text-fg-faint focus:outline-none py-1.5 disabled:opacity-50"
          />

          {/* Bộ đếm chỉ xuất hiện khi đã gần chạm trần, để không làm rối khung
              soạn tin trong phần lớn thời gian */}
          {message.length > MAX_MESSAGE_LENGTH - COUNTER_THRESHOLD && (
            <span
              className={`tnum shrink-0 text-[11px] ${
                message.length >= MAX_MESSAGE_LENGTH
                  ? 'font-medium text-rose-500'
                  : 'text-fg-faint'
              }`}
            >
              {message.length}/{MAX_MESSAGE_LENGTH}
            </span>
          )}

          {/* Cụm biểu tượng tiện ích bên phải: Smile, Paperclip, Send */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              title="Chèn biểu cảm"
              disabled={disabled}
              className={`p-1 transition text-fg-faint hover:text-fg-muted dark:hover:text-fg disabled:opacity-40 ${
                showEmoji ? 'text-fg dark:text-white' : ''
              }`}
            >
              <Smile className="w-5 h-5 stroke-[1.8]" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Đính kèm tài liệu / hình ảnh"
              disabled={disabled || isUploading}
              className="p-1 text-fg-faint hover:text-fg-muted dark:hover:text-fg transition disabled:opacity-40"
            >
              <Paperclip className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/*
              Đã gỡ nút ghi âm tin nhắn thoại. Nó chỉ chạy một alert nói tính
              năng "đang được kết nối", trong khi backend không có gì cho việc
              này — câu chữ đó hứa hẹn một thứ không tồn tại.
            */}

            {/* Nút gửi — hành động chính của khung chat */}
            <button
              type="submit"
              disabled={!message.trim() || disabled || isUploading}
              className="flex h-8 min-w-[64px] items-center justify-center rounded-control bg-brand px-4 text-[13px] font-medium text-white transition hover:bg-brand-hover active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-brand"
            >
              {isUploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Gửi'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
