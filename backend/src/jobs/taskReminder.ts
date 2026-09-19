import { prisma } from '../config/db';
import { Notification } from '../models/Notification';
import { sendRealtimeNotification } from '../sockets/socketManager';
import { acquireJobLock } from '../config/redis';

/**
 * Nhắc trước giờ họp / giờ làm việc.
 *
 * Tái dùng nguyên hạ tầng thông báo đã có: ghi vào MongoDB rồi đẩy realtime qua
 * Socket.io, nên chuông thông báo ở frontend nhận được mà không phải sửa gì.
 *
 * CHẠY NHIỀU INSTANCE: bộ đếm nằm trong tiến trình nên mọi instance đều đánh
 * thức cùng lúc. Trước khi làm gì, mỗi lượt phải giành một khoá qua Redis; chỉ
 * instance thắng mới gửi nhắc, số còn lại bỏ qua lượt đó. Chưa cấu hình Redis
 * thì `acquireJobLock` luôn trả về true — một instance thì nó luôn là instance
 * duy nhất, không cần khoá.
 */

const TICK_MS = 60_000;

// Khoá giữ hơi ngắn hơn một lượt: nếu instance đang giữ khoá chết giữa chừng,
// lượt kế tiếp vẫn có người khác nhận được thay vì kẹt cho tới khi khoá hết hạn.
const LOCK_KEY = 'sidcorp:lock:task-reminder';
const LOCK_TTL_MS = TICK_MS - 5_000;

// Chặn trường hợp server tắt vài giờ rồi bật lại và bắn một loạt nhắc đã lỡ
const MAX_LATE_MS = 60 * 60 * 1000;

let timer: NodeJS.Timeout | null = null;

const formatTime = (d: Date) =>
  d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

export const runTaskReminderTick = async (now: Date = new Date()): Promise<number> => {
  // Chỉ xét việc còn mở, có mốc bắt đầu, có đặt nhắc, và chưa từng nhắc
  const candidates = await prisma.task.findMany({
    where: {
      status:      { in: ['TODO', 'IN_PROGRESS'] },
      reminded_at: null,
      start_at:    { not: null, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      remind_before_minutes: { not: null },
    },
    include: { customer: { select: { id: true, name: true } } },
    take: 200,
  });

  let sent = 0;

  for (const task of candidates) {
    if (!task.start_at || task.remind_before_minutes === null) continue;

    const remindAt = task.start_at.getTime() - task.remind_before_minutes * 60_000;
    const late = now.getTime() - remindAt;

    // Chưa tới giờ nhắc, hoặc đã trôi qua quá lâu (server vừa bật lại)
    if (late < 0) continue;
    if (late > MAX_LATE_MS) {
      await prisma.task.update({ where: { id: task.id }, data: { reminded_at: now } });
      continue;
    }

    const when  = formatTime(task.start_at);
    const label = task.type === 'MEETING' ? 'Cuộc họp' : 'Công việc';
    const withWho = task.customer?.name ? ` với ${task.customer.name}` : '';

    try {
      const notification = await Notification.create({
        user_id:           task.owner_id,
        type:              'reminder',
        title:             `${label} lúc ${when}`,
        content:           `${task.title}${withWho} bắt đầu lúc ${when}.`,
        note_content:      task.location ?? null,
        ref_customer_id:   task.customer_id,
        ref_customer_name: task.customer?.name ?? null,
        is_read:           false,
      });

      sendRealtimeNotification(String(task.owner_id), notification);

      // Đóng dấu SAU khi gửi: lỗi ở giữa thì lần chạy sau thử lại
      await prisma.task.update({ where: { id: task.id }, data: { reminded_at: now } });
      sent++;
    } catch (err) {
      console.error(`Không gửi được nhắc lịch cho công việc ${task.id}:`, err);
    }
  }

  return sent;
};

export const startTaskReminderJob = () => {
  if (timer) return;

  timer = setInterval(() => {
    // Giành khoá trước khi quét: nếu không, chạy hai instance là mỗi cuộc họp
    // bị nhắc hai lần, và người dùng nhận hai thông báo giống hệt nhau.
    acquireJobLock(LOCK_KEY, LOCK_TTL_MS)
      .then((acquired) => (acquired ? runTaskReminderTick() : 0))
      .catch((err) => console.error('Lỗi vòng chạy nhắc lịch:', err));
  }, TICK_MS);

  // Không giữ tiến trình sống chỉ vì bộ đếm này
  timer.unref?.();
  console.log('  Nhắc lịch công việc : đang chạy (mỗi 60 giây)');
};

export const stopTaskReminderJob = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
