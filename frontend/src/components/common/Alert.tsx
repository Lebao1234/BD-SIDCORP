import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { Feedback } from '../../hooks/useFeedback';

interface AlertProps {
  feedback: Feedback | null;
  onDismiss?: () => void;
  className?: string;
}

const STYLES: Record<Feedback['kind'], string> = {
  success:
    'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
  error:
    'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
};

/**
 * Băng thông báo cho kết quả của một thao tác.
 *
 * Màu sắc và biểu tượng bám theo `kind`, nên không thể lỡ tay hiển thị câu báo
 * lỗi trong khung màu xanh như trước.
 */
export const Alert: React.FC<AlertProps> = ({ feedback, onDismiss, className = '' }) => {
  if (!feedback) return null;

  const Icon = feedback.kind === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={feedback.kind === 'error' ? 'alert' : 'status'}
      className={`px-3.5 py-2.5 rounded-lg text-xs font-medium border flex items-center gap-2 animate-fade-in shadow-2xs ${STYLES[feedback.kind]} ${className}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{feedback.text}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="shrink-0 opacity-60 hover:opacity-100 transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
