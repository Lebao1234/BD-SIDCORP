import React from 'react';
import { AtSign, X, ExternalLink, MessageSquare, Bell, MessageCircle, Users } from 'lucide-react';
import { useSocket, AppNotification } from '../context/SocketContext';
import { useChatStore } from '../store/useChatStore';
import { useNavigate } from 'react-router-dom';

interface GlobalToastProps {
  /** Nếu truyền vào thì click vào "Mở KH" sẽ dùng callback này (dùng ở Customer page) */
  onSelectCustomer?: (customerId: string) => void;
  isAdminPage?: boolean;
}

const NotifTypeIcon = ({ type }: { type: string }) => {
  if (type === 'mention') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-text">
        <AtSign className="h-4 w-4" strokeWidth={1.9} />
      </div>
    );
  }
  if (type === 'chat_message') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-raised text-fg-muted">
        <MessageCircle className="h-4 w-4" strokeWidth={1.9} />
      </div>
    );
  }
  if (type === 'chat_forum') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-raised text-fg-muted">
        <Users className="h-4 w-4" strokeWidth={1.9} />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-raised text-fg-muted">
      <Bell className="h-4 w-4" strokeWidth={1.9} />
    </div>
  );
};

const ToastCard = ({
  notif,
  onClose,
  onOpen,
  durationMs,
}: {
  notif: AppNotification;
  onClose: () => void;
  onOpen?: () => void;
  durationMs: number;
}) => (
  <div
    className="relative overflow-hidden rounded-card border border-line bg-surface shadow-2xl"
    style={{
      minWidth: '320px',
      maxWidth: '380px',
      animation: 'toastSlide 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    }}
  >
    {/* Thanh tiến trình: do CSS chạy, React không tham gia */}
    <div
      className="toast-progress absolute top-0 left-0 h-0.5 bg-brand"
      style={{ animationDuration: `${durationMs}ms` }}
    />

    <div className="p-3.5 flex gap-3 items-start">
      <NotifTypeIcon type={notif.type} />

      <div className="flex-1 min-w-0">
        {/* Title */}
        <p className="text-[13px] font-semibold leading-snug text-fg">{notif.title}</p>

        {/* Content */}
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-muted">{notif.content}</p>

        {/* Note preview */}
        {notif.noteContent && (
          <div className="mt-2 flex items-start gap-1.5 rounded-control border border-divider bg-surface-alt px-2.5 py-2">
            <MessageSquare className="w-3 h-3 text-fg-subtle mt-0.5 shrink-0" />
            <p className="line-clamp-2 text-[12px] leading-snug text-fg-body">
              "{notif.noteContent}"
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {notif.chatUserId ? (
            <button
              onClick={() => {
                onClose();
                useChatStore.getState().setActiveTab('dm');
                useChatStore.getState().setSelectedUserId(notif.chatUserId!);
                useChatStore.getState().clearUnread(notif.chatUserId!);
                window.location.href = '/chat';
              }}
              className="flex items-center gap-1.5 h-7 px-2.5 bg-brand hover:bg-brand-hover text-white text-[12px] font-medium rounded-control transition active:scale-[0.98] cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Trả lời tin nhắn
            </button>
          ) : notif.chatTab === 'forum' ? (
            <button
              onClick={() => {
                onClose();
                useChatStore.getState().setActiveTab('forum');
                useChatStore.getState().clearForumUnread();
                window.location.href = '/chat';
              }}
              className="flex items-center gap-1.5 h-7 px-2.5 bg-brand hover:bg-brand-hover text-white text-[12px] font-medium rounded-control transition active:scale-[0.98] cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              Mở Diễn đàn
            </button>
          ) : notif.customerId && onOpen ? (
            <button
              onClick={onOpen}
              className="flex items-center gap-1.5 h-7 px-2.5 bg-brand hover:bg-brand-hover text-white text-[12px] font-medium rounded-control transition active:scale-[0.98] cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              {notif.customerName ? `KH: ${notif.customerName}` : 'Mở khách hàng'}
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="h-7 px-2.5 rounded-control border border-line bg-surface text-[12px] font-medium text-fg-body hover:border-line-strong hover:text-fg transition cursor-pointer"
          >
            Bỏ qua
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Đóng thông báo"
        className="p-1 text-fg-faint hover:text-fg hover:bg-raised rounded-chip transition shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>

    <style>{`
      @keyframes toastSlide {
        from { opacity: 0; transform: translateX(100%) scale(0.9); }
        to   { opacity: 1; transform: translateX(0)   scale(1);   }
      }
    `}</style>
  </div>
);

// ─── Main Export ──────────────────────────────────────────────────────────────
export const GlobalToast: React.FC<GlobalToastProps> = ({ onSelectCustomer, isAdminPage }) => {
  const { toastNotification, clearToast } = useSocket();
  const navigate = useNavigate();

  const DURATION = 6000; // ms — khớp với hẹn giờ tự tắt trong SocketContext

  if (!toastNotification) return null;

  const handleOpen = () => {
    if (!toastNotification.customerId) return;
    clearToast();
    if (onSelectCustomer) {
      onSelectCustomer(toastNotification.customerId);
    } else {
      navigate(
        isAdminPage
          ? `/admin/dashboard?customerId=${toastNotification.customerId}`
          : `/customers?customerId=${toastNotification.customerId}`
      );
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      <div className="pointer-events-auto">
        <ToastCard
          /* key theo id: toast mới phải là một node mới, nếu không animation
             của thanh tiến trình không chạy lại từ đầu */
          key={toastNotification.id}
          notif={toastNotification}
          onClose={clearToast}
          onOpen={toastNotification.customerId ? handleOpen : undefined}
          durationMs={DURATION}
        />
      </div>
    </div>
  );
};
