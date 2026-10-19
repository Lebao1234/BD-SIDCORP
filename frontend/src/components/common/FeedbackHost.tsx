import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useNotifyStore, type ToastKind } from '../../lib/notify';

/* ==========================================================================
   NƠI VẼ THÔNG BÁO & HỘP XÁC NHẬN
   --------------------------------------------------------------------------
   Gắn một lần ở App. Toast nằm góc dưới bên phải, cùng ngôn ngữ với phần còn
   lại: nền bề mặt, viền 1px, chấm màu cho loại thông báo. Hộp xác nhận bẫy
   focus vào nút an toàn (Huỷ), Esc để huỷ, Enter để xác nhận.
   ========================================================================== */

const DOT: Record<ToastKind, string> = {
  success: 'bg-ok',
  error: 'bg-danger',
  info: 'bg-brand',
};

export const FeedbackHost: React.FC = () => {
  const toasts = useNotifyStore((s) => s.toasts);
  const dismiss = useNotifyStore((s) => s.dismiss);
  const confirm = useNotifyStore((s) => s.confirm);
  const settle = useNotifyStore((s) => s.settle);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirm) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
      if (e.key === 'Enter') settle(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm, settle]);

  return (
    <>
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[min(380px,calc(100vw-2.5rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex items-start gap-3 rounded-card border border-line bg-surface px-3.5 py-3
              text-[13px] leading-snug text-fg-body shadow-lg animate-fade-in-up"
          >
            <span className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${DOT[t.kind]}`} />
            <span className="flex-1">{t.text}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Đóng thông báo"
              className="-mr-1 shrink-0 rounded-chip p-0.5 text-fg-faint transition hover:bg-raised hover:text-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0c0d10]/40 animate-fade-in" onClick={() => settle(false)} />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative w-full max-w-[420px] rounded-card border border-line bg-surface p-5 shadow-2xl animate-modal-pop"
          >
            <h2 id="confirm-title" className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
              {confirm.title}
            </h2>
            {confirm.message && (
              <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{confirm.message}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => settle(false)}
                className="h-8 cursor-pointer rounded-control border border-line bg-surface px-3.5 text-[13px] font-medium
                  text-fg-body transition hover:border-line-strong hover:text-fg"
              >
                {confirm.cancelLabel ?? 'Huỷ'}
              </button>
              <button
                type="button"
                onClick={() => settle(true)}
                className={`h-8 cursor-pointer rounded-control px-3.5 text-[13px] font-medium text-white transition active:scale-[0.98] ${
                  confirm.danger ? 'bg-danger hover:opacity-90' : 'bg-brand hover:bg-brand-hover'
                }`}
              >
                {confirm.confirmLabel ?? (confirm.danger ? 'Xoá' : 'Xác nhận')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackHost;
