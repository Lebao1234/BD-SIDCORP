import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../lib/errors';

export type FeedbackKind = 'success' | 'error';

export interface Feedback {
  kind: FeedbackKind;
  text: string;
}

const AUTO_DISMISS_MS = 3500;

/**
 * Băng thông báo thành công / thất bại dùng chung cho các trang có form.
 *
 * Trước đây mỗi trang tự giữ một `saveMsg: string | null` rồi `setTimeout` để
 * xoá. Vì chuỗi không mang theo loại thông điệp nên câu báo lỗi vẫn được vẽ
 * trong khung MÀU XANH kèm dấu tích — người dùng lưu hỏng mà tưởng đã lưu xong.
 * Tách `kind` ra là để chuyện đó không tái diễn.
 *
 * Lỗi không tự tắt: người dùng cần đọc kịp và biết thao tác đã không thành công.
 */
export const useFeedback = () => {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Tránh setState sau khi component đã unmount (bấm Lưu rồi rời trang ngay)
  useEffect(() => clearTimer, []);

  const showSuccess = useCallback((text: string) => {
    clearTimer();
    setFeedback({ kind: 'success', text });
    timerRef.current = setTimeout(() => setFeedback(null), AUTO_DISMISS_MS);
  }, []);

  const showError = useCallback((text: string) => {
    clearTimer();
    setFeedback({ kind: 'error', text });
  }, []);

  /** Dùng thẳng trong `catch`: tự bóc thông điệp rồi hiển thị dạng lỗi. */
  const showErrorFrom = useCallback((err: unknown, fallback: string) => {
    clearTimer();
    setFeedback({ kind: 'error', text: getErrorMessage(err, fallback) });
  }, []);

  const clear = useCallback(() => {
    clearTimer();
    setFeedback(null);
  }, []);

  return { feedback, showSuccess, showError, showErrorFrom, clear };
};
