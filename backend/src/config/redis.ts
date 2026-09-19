import { createClient, type RedisClientType } from 'redis';

/**
 * Kết nối Redis — TUỲ CHỌN.
 *
 * Ba cơ chế trong hệ thống này đều giữ trạng thái trong bộ nhớ của một tiến
 * trình Node duy nhất:
 *
 *   1. `userSocketMap` trong socketManager — bản đồ ai đang mở socket nào.
 *   2. Bộ đếm nhắc lịch trong jobs/taskReminder.
 *   3. Bộ đệm trạng thái tài khoản trong helpers/userStatusCache.
 *
 * Chừng nào còn chạy MỘT instance thì cả ba đều đúng. Nhưng khi nâng lên nhiều
 * instance — điều xảy ra ngay lần đầu bật tự động co giãn trên Render — chúng
 * hỏng theo ba kiểu khác nhau: tin nhắn riêng không tới được người đang kết nối
 * vào instance khác, mỗi cuộc họp bị nhắc nhiều lần, và mỗi instance giữ một
 * bản đệm quyền riêng.
 *
 * File này xử lý hai vấn đề đầu. Vấn đề thứ ba chấp nhận được: bộ đệm quyền có
 * TTL 60 giây, nên điều tệ nhất là một thay đổi quyền mất tối đa một phút mới
 * lan tới instance chưa nhận được lệnh xoá đệm.
 *
 * KHÔNG CẤU HÌNH REDIS_URL THÌ MỌI THỨ VẪN CHẠY NGUYÊN NHƯ CŨ, ở chế độ một
 * instance. Đây là lựa chọn có chủ ý: không bắt ai phải dựng thêm hạ tầng chỉ
 * để chạy được hệ thống.
 */

// Số lần thử kết nối trước khi bỏ cuộc và chạy ở chế độ một instance
const MAX_CONNECT_RETRIES = 5;

let pubClient: RedisClientType | null = null;
let subClient: RedisClientType | null = null;

export const isRedisEnabled = (): boolean => Boolean(process.env.REDIS_URL?.trim());

/**
 * Tạo cặp client publish/subscribe cho Socket.io adapter.
 *
 * Trả về null khi chưa cấu hình REDIS_URL, hoặc khi kết nối thất bại — thất bại
 * ở đây KHÔNG được phép làm sập server: chạy một instance không có Redis vẫn
 * tốt hơn là không chạy gì cả.
 */
export const createRedisPair = async (): Promise<{
  pubClient: RedisClientType;
  subClient: RedisClientType;
} | null> => {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  try {
    pubClient = createClient({
      url,
      socket: {
        // Bỏ cuộc sau vài lần thử thay vì thử lại mãi mãi. Cấu hình sai
        // REDIS_URL trên Render mà không có giới hạn này thì log ngập tràn
        // ECONNREFUSED cho tới khi ai đó để ý, và lỗi thật bị chôn lấp giữa
        // hàng nghìn dòng giống hệt nhau.
        reconnectStrategy: (retries) =>
          retries >= MAX_CONNECT_RETRIES ? false : Math.min(retries * 200, 2_000),
      },
    }) as RedisClientType;
    subClient = pubClient.duplicate();

    // Không gắn handler 'error' thì một lần mất kết nối sau này sẽ ném ra
    // unhandled error và giết tiến trình.
    pubClient.on('error', (err) => console.error('Redis (pub) lỗi:', err));
    subClient.on('error', (err) => console.error('Redis (sub) lỗi:', err));

    await Promise.all([pubClient.connect(), subClient.connect()]);

    return { pubClient, subClient };
  } catch (err) {
    console.error('Redis: kết nối thất bại — chạy tiếp ở chế độ một instance.', err);

    // Huỷ hẳn hai client, nếu không chúng vẫn âm thầm thử kết nối lại trong nền
    // dù ta đã quyết định chạy không Redis.
    for (const client of [pubClient, subClient]) {
      try {
        client?.destroy();
      } catch {
        /* client chưa từng mở thì destroy có thể ném — không ảnh hưởng gì */
      }
    }

    pubClient = null;
    subClient = null;
    return null;
  }
};

/**
 * Giành quyền chạy một công việc định kỳ trong khoảng thời gian cho trước.
 *
 * `SET key NX PX ttl` là một thao tác nguyên tử: trong tất cả các instance cùng
 * gọi, đúng một cái nhận được true. Đó là thứ giữ cho lời nhắc lịch không bị
 * gửi lặp khi chạy song song nhiều tiến trình.
 *
 * Chưa có Redis thì trả về true — một instance thì nó luôn là instance duy nhất.
 */
export const acquireJobLock = async (key: string, ttlMs: number): Promise<boolean> => {
  if (!pubClient?.isOpen) return true;

  try {
    const result = await pubClient.set(key, String(process.pid), { NX: true, PX: ttlMs });
    return result === 'OK';
  } catch (err) {
    // Redis trục trặc không được phép làm ngừng hẳn việc nhắc lịch. Nhắc trùng
    // vẫn hơn là im lặng bỏ qua một cuộc họp.
    console.error('Redis: không lấy được khoá công việc, chạy không khoá.', err);
    return true;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  await Promise.allSettled([
    pubClient?.isOpen ? pubClient.quit() : Promise.resolve(),
    subClient?.isOpen ? subClient.quit() : Promise.resolve(),
  ]);
  pubClient = null;
  subClient = null;
};
