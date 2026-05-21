import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../config/db';
import { CustomerNote } from '../models/CustomerNote';
import { sendRealtimeNotification } from '../sockets/socketManager';

export const createNote = async (req: AuthRequest, res: Response) => {
  const { customerId, content } = req.body;
  const author = req.user;

  if (!customerId || !content) {
    return res.status(400).json({ error: 'Mã khách hàng và Nội dung ghi chú không được trống.' });
  }

  if (!author) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  try {
    // 1. Kiểm tra khách hàng tồn tại trong Postgres
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng để thêm ghi chú.' });
    }

    // 2. Lưu Note vào MongoDB Atlas
    const newNote = await CustomerNote.create({
      customerId,
      authorId: author.id,
      authorName: author.username,
      content,
      createdAt: new Date()
    });

    // 3. Quét regex để tìm '@username'
    const tagRegex = /@(\w+)/g;
    const matches: string[] = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      matches.push(match[1]); // Lấy phần username (bỏ dấu @)
    }

    // Lọc bỏ username trùng lặp trong một note
    const uniqueUsernames = Array.from(new Set(matches));

    for (const username of uniqueUsernames) {
      // Tìm user trong Postgres
      const taggedUser = await prisma.user.findUnique({
        where: { username }
      });

      // Nếu tìm thấy và không phải chính người tạo Note tự tag mình
      if (taggedUser && taggedUser.id !== author.id) {
        // Tạo bản ghi thông báo trong Postgres
        const notification = await prisma.notification.create({
          data: {
            title: 'Bạn được nhắc tên',
            content: `${author.username} đã tag bạn trong ghi chú khách hàng "${customer.name}".`,
            type: 'TAG',
            customerId: customer.id,
            userId: taggedUser.id
          }
        });

        // Bắn Socket.io Realtime (nếu user đang online)
        const isOnline = sendRealtimeNotification(taggedUser.id, notification);
        console.log(`Đã tag user ${username}. Online status: ${isOnline}`);
      }
    }

    return res.status(201).json(newNote);
  } catch (err) {
    console.error('Lỗi thêm ghi chú note:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi thêm ghi chú.' });
  }
};

export const getCustomerNotes = async (req: Request, res: Response) => {
  const { customerId } = req.params;
  try {
    const notes = await CustomerNote.find({ customerId }).sort({ createdAt: -1 });
    return res.json(notes);
  } catch (err) {
    console.error('Lỗi lấy notes:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy notes.' });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(notifications);
  } catch (err) {
    console.error('Lỗi lấy thông báo:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy thông báo.' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  try {
    const notification = await prisma.notification.update({
      where: { id, userId: user.id },
      data: { isRead: true }
    });
    return res.json(notification);
  } catch (err) {
    console.error('Lỗi đánh dấu đã đọc thông báo:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật thông báo.' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true }
    });
    return res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
  } catch (err) {
    console.error('Lỗi đánh dấu đọc tất cả thông báo:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
};
