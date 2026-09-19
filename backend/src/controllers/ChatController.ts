import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { GlobalMessage } from '../models/GlobalMessage';
import { supabase } from '../config/supabase';
import { cleanFileNameForStorage } from '../helpers/fileUtils';

export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const file = req.file;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  if (!file) return res.status(400).json({ error: 'Không tìm thấy file để upload.' });

  try {
    const decodedFileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const cleanFileName = cleanFileNameForStorage(decodedFileName);
    const filePath = `chat/${user.id}/${Date.now()}_${cleanFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Lỗi upload lên Supabase:', uploadError);
      return res.status(500).json({ error: 'Không thể upload file lên Cloud Storage.' });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return res.status(201).json({ publicUrl, fileName: decodedFileName });
  } catch (err) {
    console.error('Lỗi upload file chat:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi upload file chat.' });
  }
};

/**
 * Số tin nhắn trả về cho mỗi lần tải lịch sử.
 *
 * Trước đây cả ba endpoint dưới đây gọi `find()` không kèm `limit`, nên mở một
 * đoạn chat là kéo về toàn bộ tin nhắn từ ngày đầu tiên. Với kho tin nhắn vài
 * chục nghìn dòng thì đó là vài MB JSON cho mỗi lần bấm vào một người.
 */
const HISTORY_PAGE_SIZE = 50;

// Cửa sổ trang: lấy N tin GẦN NHẤT (hoặc N tin ngay trước mốc `before`), rồi
// đảo lại thành thứ tự tăng dần để giao diện hiển thị từ cũ tới mới.
const loadPage = async (
  filter: Record<string, unknown>,
  before?: string
): Promise<{ messages: unknown[]; hasMore: boolean }> => {
  const cursor = before && !Number.isNaN(Date.parse(before)) ? new Date(before) : null;

  const query = cursor
    ? { ...filter, created_at: { $lt: cursor } }
    : filter;

  // Lấy dư một bản ghi để biết còn tin cũ hơn hay không, mà không phải đếm
  // toàn bộ collection.
  const rows = await GlobalMessage.find(query)
    .sort({ created_at: -1 })
    .limit(HISTORY_PAGE_SIZE + 1)
    .lean();

  const hasMore = rows.length > HISTORY_PAGE_SIZE;
  const page    = hasMore ? rows.slice(0, HISTORY_PAGE_SIZE) : rows;

  return { messages: page.reverse(), hasMore };
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { receiverId } = req.params;

  if (!user) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  const other = Number(receiverId);
  if (!other || Number.isNaN(other)) {
    return res.status(400).json({ error: 'Mã người nhận (receiverId) không hợp lệ.' });
  }

  try {
    const { messages, hasMore } = await loadPage(
      {
        $or: [
          { sender_id: user.id, receiver_id: other },
          { sender_id: other,   receiver_id: user.id }
        ]
      },
      req.query.before as string | undefined
    );

    return res.json({ messages, hasMore });
  } catch (err) {
    console.error('Lỗi lấy lịch sử chat:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy lịch sử chat.' });
  }
};

// ── Lịch sử Diễn đàn Thảo luận (receiver_id = 0) ─────────────────────────
export const getForumHistory = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  try {
    const { messages, hasMore } = await loadPage(
      { receiver_id: 0 },
      req.query.before as string | undefined
    );

    return res.json({ messages, hasMore });
  } catch (err) {
    console.error('Lỗi lấy lịch sử diễn đàn:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy lịch sử diễn đàn.' });
  }
};

// ── Danh sách hội thoại gần nhất kèm tin nhắn cuối cùng ──────────────────────
//
// Bản cũ kéo TOÀN BỘ tin nhắn liên quan tới người dùng (cộng toàn bộ tin nhắn
// diễn đàn) về Node rồi duyệt bằng vòng lặp để nhặt ra tin cuối của mỗi cuộc
// hội thoại. Việc đó khiến mỗi lần mở trang Chat là một lần quét cả collection
// và sắp xếp trong bộ nhớ — MongoDB chặn ở mốc 32MB nên đến một lúc nào đó
// endpoint sẽ hỏng hẳn chứ không chỉ chậm.
//
// Bản này để MongoDB tự gom nhóm: mỗi cuộc hội thoại chỉ trả về đúng một bản
// ghi, và tin nhắn diễn đàn lấy riêng bằng một truy vấn findOne có index.
export const getConversations = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  try {
    const userId = Number(user.id);

    const [grouped, forumLast] = await Promise.all([
      GlobalMessage.aggregate([
        {
          $match: {
            receiver_id: { $ne: 0 },
            $or: [{ sender_id: userId }, { receiver_id: userId }]
          }
        },
        { $sort: { created_at: -1 } },
        {
          $group: {
            // Khoá nhóm là "người còn lại" trong cuộc hội thoại
            _id: {
              $cond: [{ $eq: ['$sender_id', userId] }, '$receiver_id', '$sender_id']
            },
            last: { $first: '$$ROOT' }
          }
        },
        { $sort: { 'last.created_at': -1 } },
        { $limit: 200 }
      ]).option({ allowDiskUse: true }),

      GlobalMessage.findOne({ receiver_id: 0 }).sort({ created_at: -1 }).lean()
    ]);

    const conversations: Record<number, {
      content: string;
      created_at: string;
      sender_id: number;
      receiver_id: number;
      file_url?: string | null;
      is_revoked?: boolean;
    }> = {};

    for (const row of grouped) {
      const msg = row.last;
      conversations[Number(row._id)] = {
        content: msg.is_revoked ? 'Tin nhắn đã bị thu hồi' : (msg.content || 'Đã gửi tệp đính kèm'),
        created_at: new Date(msg.created_at).toISOString(),
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        file_url: msg.file_url,
        is_revoked: msg.is_revoked
      };
    }

    const lastForumMessage = forumLast
      ? {
          id: forumLast._id,
          content: forumLast.is_revoked
            ? 'Tin nhắn đã bị thu hồi'
            : (forumLast.content || 'Đã gửi tệp đính kèm'),
          created_at: forumLast.created_at,
          sender_id: forumLast.sender_id,
          sender_name: forumLast.sender_name,
          file_url: forumLast.file_url,
          is_revoked: forumLast.is_revoked
        }
      : null;

    return res.json({ conversations, lastForumMessage });
  } catch (err) {
    console.error('Lỗi lấy danh sách hội thoại:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách hội thoại.' });
  }
};
