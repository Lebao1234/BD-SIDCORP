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
 */
export const notifyMentions = async ({
  content,
  author,
  customer,
  matchPlainNames = false
}: NotifyMentionsArgs): Promise<number> => {
  if (!content) return 0;

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

  const authorName  = author.name ?? 'Someone';
  const customerName = customer.name ?? 'a customer';
  const payload     = NOTIFY.mention(authorName, customerName);
  const preview     = buildPreview(content);

  await Promise.all(
    mentionedUsers.map(async (taggedUser) => {
      try {
        // Lưu mention vào Postgres
        await prisma.customerNoteMention.create({
          data: {
            customer_id:       customer.id,
            mentioned_user_id: taggedUser.id,
            mentioned_by:      author.id
          }
        });

        // Tạo notification trong MongoDB (title là trường bắt buộc của schema)
        const notification = await Notification.create({
          user_id:           taggedUser.id,
          type:              'mention',
          title:             payload.title,
          content:           payload.content,
          note_content:      preview,
          author_name:       authorName,
          ref_customer_id:   customer.id,
          ref_customer_name: customer.name ?? '',
          is_read:           false
        });

        // Realtime push qua Socket.io
        sendRealtimeNotification(String(taggedUser.id), notification);
      } catch (err) {
        // Một mention lỗi không được làm hỏng cả thao tác lưu khách hàng/ghi chú
        console.error(`Không thể gửi mention tới user ${taggedUser.id}:`, err);
      }
    })
  );

  return mentionedUsers.length;
};
