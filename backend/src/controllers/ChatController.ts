import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { GlobalMessage } from '../models/GlobalMessage';

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { receiverId } = req.params;

  if (!user) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  if (!receiverId) {
    return res.status(400).json({ error: 'Mã người nhận (receiverId) là bắt buộc.' });
  }

  try {
    // Tìm toàn bộ tin nhắn qua lại giữa user hiện tại và receiverId
    const chatHistory = await GlobalMessage.find({
      $or: [
        { sender_id: user.id, receiver_id: receiverId },
        { sender_id: receiverId, receiver_id: user.id }
      ]
    }).sort({ created_at: 1 }); // Xếp tăng dần theo thời gian gửi

    return res.json(chatHistory);
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
    const forumHistory = await GlobalMessage.find({
      receiver_id: 0
    }).sort({ created_at: 1 });

    return res.json(forumHistory);
  } catch (err) {
    console.error('Lỗi lấy lịch sử diễn đàn:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy lịch sử diễn đàn.' });
  }
};
