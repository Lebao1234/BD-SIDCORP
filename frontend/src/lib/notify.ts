import { create } from 'zustand';
import { getErrorMessage } from './errors';

/* ==========================================================================
   THÔNG BÁO & XÁC NHẬN TOÀN CỤC
   --------------------------------------------------------------------------
   Thay cho alert() / confirm() của trình duyệt: hộp thoại hệ điều hành chặn
   cả trang, không theo giao diện sáng/tối và không đọc được tiếng Việt đẹp
   trên mọi máy. Gọi được từ bất kỳ đâu (kể cả ngoài component):

     notify.success('Đã lưu khách hàng.');
     notify.error(err, 'Không thể lưu khách hàng.');
     if (!(await confirmDialog({ title: 'Xoá khách hàng?', danger: true }))) return;

   Như useFeedback: thông báo thành công tự tắt, thông báo lỗi ở lại cho tới
   khi người dùng đóng — họ cần đọc kịp rằng thao tác đã không thành công.
   ========================================================================== */

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Hành động phá huỷ (xoá, thu hồi): nút xác nhận màu đỏ. */
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

interface NotifyState {
  toasts: Toast[];
  confirm: PendingConfirm | null;
  push: (kind: ToastKind, text: string) => void;
  dismiss: (id: number) => void;
  settle: (ok: boolean) => void;
}

const SUCCESS_MS = 3500;
let nextId = 1;

export const useNotifyStore = create<NotifyState>((set, get) => ({
  toasts: [],
  confirm: null,
  push: (kind, text) => {
    const id = nextId++;
    // Giữ tối đa 4 thông báo; cái cũ nhất nhường chỗ.
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, text }] }));
    if (kind !== 'error') setTimeout(() => get().dismiss(id), SUCCESS_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  settle: (ok) => {
    const pending = get().confirm;
    set({ confirm: null });
    pending?.resolve(ok);
  },
}));

export const notify = {
  success: (text: string) => useNotifyStore.getState().push('success', text),
  info: (text: string) => useNotifyStore.getState().push('info', text),
  /** Nhận chuỗi, hoặc lỗi bắt được kèm câu dự phòng. */
  error: (errOrText: unknown, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') =>
    useNotifyStore
      .getState()
      .push('error', typeof errOrText === 'string' ? errOrText : getErrorMessage(errOrText, fallback)),
};

export const confirmDialog = (options: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    // Hộp đang mở mà có yêu cầu mới thì coi như huỷ hộp cũ.
    useNotifyStore.getState().confirm?.resolve(false);
    useNotifyStore.setState({ confirm: { ...options, resolve } });
  });
