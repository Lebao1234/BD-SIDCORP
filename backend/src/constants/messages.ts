// ─── ERROR MESSAGES ───────────────────────────────────────────────────────────

export const MSG = {
  // Auth
  UNAUTHORIZED:        'Chưa xác thực.',
  TOKEN_MISSING:       'Từ chối truy cập: Chưa cung cấp token.',
  TOKEN_INVALID:       'Token không hợp lệ hoặc đã hết hạn.',
  FORBIDDEN:           'Bạn không có quyền truy cập tài nguyên này.',
  MISSING_FIELDS:      'Vui lòng nhập đầy đủ các trường thông tin bắt buộc.',
  EMAIL_TAKEN:         'Email đã được sử dụng.',
  REGISTER_SUCCESS:    'Đăng ký tài khoản thành công.',
  LOGIN_SUCCESS:       'Đăng nhập thành công.',
  LOGIN_MISSING:       'Vui lòng nhập đầy đủ Email/Tên và Mật khẩu.',
  LOGIN_WRONG:         'Tài khoản hoặc mật khẩu không chính xác.',
  JWT_NOT_CONFIGURED:  'JWT_SECRET chưa được cấu hình.',

  // Customer
  CUSTOMER_NOT_FOUND:      'Không tìm thấy khách hàng.',
  CUSTOMER_FORBIDDEN:      'Bạn không có quyền thao tác khách hàng này.',
  CUSTOMER_NOTE_FORBIDDEN: 'Bạn không có quyền xem ghi chú này.',

  // Note
  NOTE_NOT_FOUND:      'Không tìm thấy ghi chú.',
  NOTE_MISSING_FIELDS: 'Thiếu customer_id hoặc content.',
  NOTE_EMPTY_CONTENT:  'Content không được trống.',
  NOTE_FORBIDDEN:      'Bạn không có quyền thao tác ghi chú này.',
  NOTE_DELETED:        'Xóa ghi chú thành công.',

  // Notification
  NOTIFICATION_NOT_FOUND: 'Không tìm thấy thông báo.',
  NOTIFICATION_ALL_READ:  'Đã đánh dấu tất cả thông báo là đã đọc.',

  // System
  SYSTEM_ERROR: 'Lỗi hệ thống.',
} as const;

// ─── NOTIFICATION TEMPLATES ───────────────────────────────────────────────────

export const NOTIFY = {
  mention: (authorName: string, customerName: string) =>
    `${authorName} đã tag bạn trong ghi chú khách hàng "${customerName}".`,
} as const;