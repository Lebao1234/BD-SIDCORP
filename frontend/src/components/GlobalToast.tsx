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
      <div className="w-10 h-10 rounded-xl bg-[#e8732c] flex items-center justify-center shrink-0 shadow-lg shadow-[#e8732c]/30">
        <AtSign className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (type === 'chat_message') {
    return (
      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
        <MessageCircle className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (type === 'chat_forum') {
    return (
      <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/30">
        <Users className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
      <Bell className="w-5 h-5 text-white" />
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
    className="relative overflow-hidden bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl"
    style={{
      minWidth: '320px',
      maxWidth: '380px',
      animation: 'toastSlide 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    }}
  >
    {/* Thanh tiến trình: do CSS chạy, React không tham gia */}
    <div
      className="toast-progress absolute top-0 left-0 h-0.5 bg-[#e8732c]"
      style={{ animationDuration: `${durationMs}ms` }}
    />

    <div className="p-4 flex gap-3 items-start">
      <NotifTypeIcon type={notif.type} />

      <div className="flex-1 min-w-0">
        {/* Title */}
        <p className="text-sm font-bold text-white leading-snug">{notif.title}</p>

        {/* Content */}
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{notif.content}</p>

        {/* Note preview */}
        {notif.noteContent && (
          <div className="mt-2 flex items-start gap-1.5 bg-slate-800 rounded-lg px-2.5 py-2">
            <MessageSquare className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-300 italic leading-snug line-clamp-2">
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-[11px] font-bold rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              Mở Diễn đàn
            </button>
          ) : notif.customerId && onOpen ? (
            <button
              onClick={onOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8732c] hover:bg-[#f5882e] text-white text-[11px] font-bold rounded-lg transition active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              {notif.customerName ? `KH: ${notif.customerName}` : 'Mở khách hàng'}
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] rounded-lg transition cursor-pointer"
          >
            Bỏ qua
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="p-1 text-slate-600 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0"
      >
        <X className="w-4 h-4" />
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
