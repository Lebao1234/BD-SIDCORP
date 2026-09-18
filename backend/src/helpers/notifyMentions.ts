import { prisma } from '../config/db';
import { Notification } from '../models/Notification';
import { sendRealtimeNotification } from '../sockets/socketManager';
import { NOTIFY } from '../constants/messages';
import { parseMentionedIds } from './mention';

interface NotifyMentionsArgs {
  content:  string;
  author:   { id: number; name?: string | null };
  customer: { id: number; name?: string | null };
  /** Bắt thêm dạng gõ tay "@Tên Nhân Viên" ngoài markup @[Tên](id) của react-mentions */
  matchPlainNames?: boolean;
}

// Tạo preview ngắn gọn: bỏ markup @[Tên](id) → @Tên
const buildPreview = (content: string): string => {
  const plain = content.replace(/@\[([^\]]+)\]\(\d+\)/g, '@$1');
  return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain;
};

/**
 * Quét @mention trong một đoạn nội dung, ghi lại vào Postgres và đẩy
 * notification realtime cho những người được nhắc tới.
 *
 * Dùng chung cho ghi chú (Exchange) lẫn trường note của khách hàng, để tránh
 * ba bản sao logic lệch nhau như trước.
 *
 * Tối ưu: dùng createMany + insertMany thay vì N lần create riêng lẻ.
 */
export const notifyMentions = async ({
  content,
  author,
  customer,
  matchPlainNames = false
}: NotifyMentionsArgs): Promise<number> => {
  if (!content) return 0;

  // Early exit nếu không có ký tự @ thì không cần query gì cả
  if (!content.includes('@')) return 0;

  const mentionedIds = parseMentionedIds(content);

  // Không có mention nào và cũng không cần quét tên gõ tay → thoát sớm
  if (mentionedIds.length === 0 && !matchPlainNames) return 0;

  const candidates = await prisma.user.findMany({
    where: matchPlainNames
      // Quét tên gõ tay cần đối chiếu toàn bộ danh sách user
      ? { id: { not: author.id } }
      : { id: { in: mentionedIds, not: author.id }, approved: true },
    select: { id: true, name: true, role: true }
  });

  const mentionedUsers = matchPlainNames
    ? candidates.filter(u =>
        mentionedIds.includes(u.id) || (u.name && content.includes(`@${u.name}`))
      )
    : candidates;

  if (mentionedUsers.length === 0) return 0;

  const authorName   = author.name ?? 'Someone';
  const customerName = customer.name ?? 'a customer';
  const payload      = NOTIFY.mention(authorName, customerName);
  const preview      = buildPreview(content);

  // ── Batch insert Postgres (1 query thay vì N queries) ──────────────────────
  try {
    await prisma.customerNoteMention.createMany({
      data: mentionedUsers.map(u => ({
        customer_id:       customer.id,
        mentioned_user_id: u.id,
        mentioned_by:      author.id,
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error('Không thể lưu mentions vào Postgres:', err);
  }

  // ── Batch insert MongoDB (1 query thay vì N queries) ───────────────────────
  let createdNotifications: Array<{ _id: unknown; user_id: number; [key: string]: unknown }> = [];
  try {
    createdNotifications = await Notification.insertMany(
      mentionedUsers.map(u => ({
        user_id:           u.id,
        type:              'mention',
        title:             payload.title,
        content:           payload.content,
        note_content:      preview,
        author_name:       authorName,
        ref_customer_id:   customer.id,
        ref_customer_name: customer.name ?? '',
        is_read:           false,
      })),
      { ordered: false } // tiếp tục nếu 1 bản ghi lỗi
    );
  } catch (err) {
    console.error('Không thể lưu notifications vào MongoDB:', err);
  }

  // ── Realtime emit vẫn gửi từng người (cần biết socket ID riêng) ───────────
  for (const notification of createdNotifications) {
    sendRealtimeNotification(String(notification.user_id), notification);
  }

  return mentionedUsers.length;
};
