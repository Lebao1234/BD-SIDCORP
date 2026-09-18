/**
 * Chuyển đổi thời gian giữa API và ô nhập của trình duyệt.
 *
 * Backend lưu DateTime ở UTC. Ô <input type="datetime-local"> lại làm việc bằng
 * GIỜ ĐỊA PHƯƠNG và không mang theo múi giờ. Trộn hai thứ này là nguồn gốc của
 * lỗi cũ: form nạp giá trị bằng `toISOString().slice(0,16)` (ra giờ UTC) rồi đưa
 * thẳng vào ô local, nên lịch hẹn 14:00 hiện thành 07:00 — và mỗi lần bấm Lưu
 * lại lùi thêm đúng một lần chênh múi giờ.
 *
 * Mọi chỗ đụng tới thời gian đều phải đi qua hai hàm dưới đây.
 */

// ISO (UTC) từ API  ->  chuỗi "YYYY-MM-DDTHH:mm" theo giờ máy người dùng
export const toDateTimeLocalValue = (iso: string | Date | null | undefined): string => {
  if (!iso) return '';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  // Bù chênh lệch múi giờ rồi mới cắt chuỗi, để phần giờ là giờ địa phương
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

// Chuỗi "YYYY-MM-DDTHH:mm" của ô nhập  ->  ISO (UTC) để gửi lên API
export const fromDateTimeLocalValue = (value: string | null | undefined): string | null => {
  if (!value) return null;
  // new Date("YYYY-MM-DDTHH:mm") được trình duyệt hiểu là giờ địa phương
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

// ISO -> "YYYY-MM-DD" theo giờ địa phương (cho <input type="date">)
export const toDateValue = (iso: string | Date | null | undefined): string =>
  toDateTimeLocalValue(iso).slice(0, 10);

// ─── Hiển thị ────────────────────────────────────────────────────────────────

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

export const formatTime = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (value: string | Date | null | undefined): string => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(d)} · ${formatTime(d)}`;
};

// Khoảng thời gian của một cuộc họp: "20/06/2026 · 14:00 – 15:30"
export const formatTimeRange = (
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string => {
  if (!start) return '—';
  const s = new Date(start);
  if (!end) return formatDateTime(s);

  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  return sameDay
    ? `${formatDate(s)} · ${formatTime(s)} – ${formatTime(e)}`
    : `${formatDateTime(s)} – ${formatDateTime(e)}`;
};

// ─── Mốc thời gian dùng cho bộ lọc ──────────────────────────────────────────

export const startOfDay = (d: Date = new Date()): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const endOfDay = (d: Date = new Date()): Date => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const addDays = (d: Date, days: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

export const isOverdue = (value: string | Date | null | undefined): boolean => {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
};

/**
 * Khoảng cách tới hiện tại dưới dạng câu ngắn: "Vừa xong", "5 phút trước".
 *
 * Quá 7 ngày thì "45 ngày trước" không còn giúp ích gì, nên chuyển sang ngày
 * tuyệt đối. Trả về chuỗi rỗng khi không có/không hợp lệ để chỗ gọi khỏi phải
 * tự phòng thủ.
 */
export const formatRelativeTime = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (diffMin < 0) return formatDate(d);          // mốc ở tương lai
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} giờ trước`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return formatDate(d);
};
