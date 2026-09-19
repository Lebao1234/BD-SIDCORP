import { prisma } from '../config/db';

/**
 * Bộ nhớ đệm trạng thái tài khoản dùng cho middleware `approvedUser`.
 *
 * Middleware đó chạy trên MỌI request dưới /api, và trước đây mỗi lần đều bắn
 * một `findUnique` xuống PostgreSQL chỉ để đọc hai cột `approved` và `role`.
 * Giữa Render và cơ sở dữ liệu có độ trễ mạng khoảng 30-150ms, nên một lần mở
 * trang bắn 5-6 request phải trả thêm ngần ấy lần round-trip thuần tuý trước
 * khi query nghiệp vụ kịp bắt đầu.
 *
 * Đệm trong bộ nhớ tiến trình với thời hạn ngắn. Đánh đổi có ý thức: sau khi
 * quản trị viên đổi quyền hoặc thu hồi duyệt, tài khoản đó còn giữ quyền cũ
 * tối đa TTL_MS. Các thao tác quản trị gọi `invalidateUserStatus` nên trên thực
 * tế thay đổi có hiệu lực ngay; TTL chỉ là lưới an toàn cho những đường ghi
 * chưa được gắn (ví dụ sửa trực tiếp trong cơ sở dữ liệu).
 *
 * GIỚI HẠN ĐÃ BIẾT: bộ đệm nằm trong tiến trình, giống `userSocketMap` và bộ
 * đếm nhắc lịch. Chạy nhiều instance thì mỗi instance giữ bản sao riêng, và
 * `invalidateUserStatus` chỉ xoá được bản sao của instance nhận request. Khi
 * nào cần scale ngang thì chuyển cả ba sang Redis cùng một lúc.
 */

export interface UserStatus {
  approved: boolean;
  role:     string;
}

const TTL_MS = 60_000;

// Trần an toàn: chặn bộ đệm phình vô hạn nếu có ai đó bắn token của hàng loạt
// tài khoản không tồn tại.
const MAX_ENTRIES = 5_000;

interface CacheEntry {
  status:    UserStatus | null; // null = tài khoản không còn tồn tại
  expiresAt: number;
}

const cache = new Map<number, CacheEntry>();

export const invalidateUserStatus = (userId: number) => {
  cache.delete(userId);
};

export const clearUserStatusCache = () => {
  cache.clear();
};

export const getUserStatus = async (userId: number): Promise<UserStatus | null> => {
  const now    = Date.now();
  const cached = cache.get(userId);

  if (cached && cached.expiresAt > now) return cached.status;

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { approved: true, role: true },
  });

  // Dọn sạch khi chạm trần thay vì xoá từng phần tử: đơn giản, và lần dọn kế
  // tiếp chỉ tốn thêm một lượt nạp lại cho những người đang hoạt động.
  if (cache.size >= MAX_ENTRIES) cache.clear();

  cache.set(userId, { status: user, expiresAt: now + TTL_MS });
  return user;
};
