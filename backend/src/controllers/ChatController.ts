import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { GlobalMessage } from '../models/GlobalMessage';
import { ChatReadState } from '../models/ChatReadState';
import { emitEventToUser } from '../sockets/socketManager';
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

/** Quy ước dùng chung với GlobalMessage.receiver_id: 0 là kênh diễn đàn. */
const FORUM_PEER_ID = 0;

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

    // Mốc đối phương đã đọc tới đâu, để màn hình hiển thị dấu "đã xem" dựa trên
    // dữ liệu thật thay vì gắn cứng cho mọi tin nhắn của mình.
    const peerState = await ChatReadState.findOne({ user_id: other, peer_id: user.id }).lean();

    return res.json({
      messages,
      hasMore,
      peerLastReadAt: peerState?.last_read_at ?? null,
    });
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

    // ── Số tin chưa đọc ───────────────────────────────────────────────────
    // Đếm theo mốc `last_read_at` của từng cuộc hội thoại. Cách này cho ra con
    // số ĐÚNG kể cả khi người dùng vừa offline nhiều ngày — thứ mà bản cũ (chỉ
    // đếm bằng sự kiện socket trong lúc đang mở trình duyệt) không làm được.
    const readStates = await ChatReadState.find({ user_id: userId }).lean();
    const lastReadByPeer = new Map<number, Date>(
      readStates.map((r) => [Number(r.peer_id), r.last_read_at])
    );

    const peerIds = Object.keys(conversations).map(Number);

    // Cuộc hội thoại chưa từng có mốc đọc thì lấy THỜI ĐIỂM HIỆN TẠI làm mốc
    // nền. Nếu không, ngay lần chạy đầu sau khi triển khai, mọi tin nhắn từ
    // trước tới giờ đều bị tính là chưa đọc và người dùng mở lên thấy một loạt
    // badge hàng trăm tin — một con số vừa sai vừa gây hoảng. Hệ thống cũ không
    // lưu trạng thái đọc ở đâu cả, nên điều trung thực nhất có thể nói là "bắt
    // đầu đếm từ bây giờ".
    //
    // `$setOnInsert` để hai tab mở cùng lúc không ghi đè mốc của nhau.
    const missingBaseline = [...peerIds, FORUM_PEER_ID].filter((id) => !lastReadByPeer.has(id));

    if (missingBaseline.length > 0) {
      const baseline = new Date();
      await ChatReadState.bulkWrite(
        missingBaseline.map((peerId) => ({
          updateOne: {
            filter: { user_id: userId, peer_id: peerId },
            update: { $setOnInsert: { last_read_at: baseline } },
            upsert: true,
          },
        }))
      );
      for (const peerId of missingBaseline) lastReadByPeer.set(peerId, baseline);
    }

    const unreadCounts: Record<number, number> = {};

    await Promise.all(
      peerIds.map(async (peerId) => {
        unreadCounts[peerId] = await GlobalMessage.countDocuments({
          sender_id:   peerId,
          receiver_id: userId,
          created_at:  { $gt: lastReadByPeer.get(peerId) },
        });
      })
    );

    const forumUnread = await GlobalMessage.countDocuments({
      receiver_id: FORUM_PEER_ID,
      sender_id:   { $ne: userId },
      created_at:  { $gt: lastReadByPeer.get(FORUM_PEER_ID) },
    });

    return res.json({ conversations, lastForumMessage, unreadCounts, forumUnread });
  } catch (err) {
    console.error('Lỗi lấy danh sách hội thoại:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách hội thoại.' });
  }
};

// ── Đánh dấu đã đọc một cuộc hội thoại ───────────────────────────────────────
//
// Ghi đúng MỘT bản ghi mốc thời gian, thay vì cập nhật cờ trên từng tin nhắn.
// Nhờ vậy thao tác này không nặng thêm khi đoạn chat dài ra.
export const markConversationRead = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực người dùng.' });

  const peerId = Number(req.body?.peerId);
  if (!Number.isInteger(peerId) || peerId < 0) {
    return res.status(400).json({ error: 'Mã cuộc hội thoại không hợp lệ.' });
  }

  try {
    const readAt = new Date();

    await ChatReadState.updateOne(
      { user_id: user.id, peer_id: peerId },
      { $set: { last_read_at: readAt } },
      { upsert: true }
    );

    // Báo cho đối phương biết tin của họ vừa được xem, để dấu đã xem ở màn hình
    // người gửi đổi ngay chứ không đợi lần tải lại sau. Kênh diễn đàn không có
    // "đối phương" nên bỏ qua.
    if (peerId !== FORUM_PEER_ID) {
      emitEventToUser(peerId, 'messages_read', { byUserId: user.id, readAt });
    }

    return res.json({ readAt });
  } catch (err) {
    console.error('Lỗi đánh dấu đã đọc:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi đánh dấu đã đọc.' });
  }
};
