import { prisma } from '../config/db';
import { Notification } from '../models/Notification';
import { sendRealtimeNotification } from '../sockets/socketManager';

/**
 * Nhắc trước giờ họp / giờ làm việc.
 *
 * Tái dùng nguyên hạ tầng thông báo đã có: ghi vào MongoDB rồi đẩy realtime qua
 * Socket.io, nên chuông thông báo ở frontend nhận được mà không phải sửa gì.
 *
 * GIỚI HẠN ĐÃ BIẾT: bộ đếm chạy trong tiến trình Node, nên nó gắn với ràng buộc
 * một instance của backend (giống userSocketMap). Chạy hai instance song song
 * sẽ nhắc hai lần. Khi nào cần scale ngang thì chuyển phần này sang hàng đợi
 * có khoá phân tán (BullMQ + Redis) cùng lúc với Socket.io adapter.
 */

const TICK_MS = 60_000;

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
    runTaskReminderTick().catch((err) =>
      console.error('Lỗi vòng chạy nhắc lịch:', err)
    );
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
