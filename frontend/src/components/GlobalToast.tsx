import React, { useEffect, useState } from 'react';
import { AtSign, X, ExternalLink, MessageSquare, Bell } from 'lucide-react';
import { useSocket, AppNotification } from '../context/SocketContext';
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
  progress,
}: {
  notif: AppNotification;
  onClose: () => void;
  onOpen?: () => void;
  progress: number; // 0 → 100
}) => (
  <div
    className="relative overflow-hidden bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl"
    style={{
      minWidth: '320px',
      maxWidth: '380px',
      animation: 'toastSlide 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    }}
  >
    {/* Progress bar (shrinks over time) */}
    <div
      className="absolute top-0 left-0 h-0.5 bg-[#e8732c] transition-all duration-300 ease-linear"
      style={{ width: `${100 - progress}%` }}
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
          {notif.customerId && onOpen && (
            <button
              onClick={onOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8732c] hover:bg-[#f5882e] text-white text-[11px] font-bold rounded-lg transition active:scale-95"
            >
              <ExternalLink className="w-3 h-3" />
              {notif.customerName ? `KH: ${notif.customerName}` : 'Mở khách hàng'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] rounded-lg transition"
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
  const [progress, setProgress] = useState(0);

  const DURATION = 6000; // ms

  useEffect(() => {
    if (!toastNotification) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [toastNotification]);

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
          notif={toastNotification}
          onClose={clearToast}
          onOpen={toastNotification.customerId ? handleOpen : undefined}
          progress={progress}
        />
      </div>
    </div>
  );
};
