/**
 * Bộ chọn trường người dùng chuẩn hóa (User Projection Selectors).
 *
 * TÁC DỤNG:
 * 1. Tuyệt đối không bao giờ để lộ trường nhạy cảm `password`.
 * 2. Giảm tải dữ liệu truyền qua mạng và dung lượng RAM Node.js cấp phát.
 * 3. Tránh boilerplate copy-paste `select: { id: true, name: true, ... }` ở mọi controller.
 */

// Đầy đủ thông tin người dùng an toàn (dùng cho User profile, quản trị tài khoản)
export const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  approved: true,
  avatar_url: true,
} as const;

// Tóm tắt thông tin người phụ trách / người tạo (dùng cho quan hệ owner/writer trong Customer, Task, Note, Asset)
export const USER_SUMMARY_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar_url: true,
} as const;

// Tối giản nhất: chỉ gồm id và tên (dùng cho tác giả ghi chú, người sửa)
export const USER_MINIMAL_SELECT = {
  id: true,
  name: true,
} as const;

