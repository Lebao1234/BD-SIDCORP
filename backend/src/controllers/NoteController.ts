import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import {prisma} from '../config/db';
import { Notification } from '../models/Notification';
import { MSG } from '../constants/messages';
import { isAdminOrOwner } from '../helpers/permissions';
import { notifyMentions } from '../helpers/notifyMentions';

// ─── GET GHI CHÚ THEO CUSTOMER ───────────────────────────────────────────────

export const getCustomerNotes = async (req: AuthRequest, res: Response) => {
  const { customerId } = req.params;
  const user = req.user;

  if (!user) return res.status(401).json({ error: MSG.UNAUTHORIZED });

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(customerId) }
    });

    if (!customer) return res.status(404).json({ error: MSG.CUSTOMER_NOT_FOUND });

    if (!isAdminOrOwner(user, customer.owner_id ?? -1)) {
      return res.status(403).json({ error: MSG.CUSTOMER_NOTE_FORBIDDEN });
    }

    const notes = await prisma.exchange.findMany({
      where:   { customer_id: Number(customerId) },
      include: { writer: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' }
    });

    return res.json(notes);
  } catch (err) {
    console.error('Lỗi lấy ghi chú:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};

// ─── CREATE GHI CHÚ + XỬ LÝ @MENTION ────────────────────────────────────────

export const createNote = async (req: AuthRequest, res: Response) => {
  const { customer_id, content } = req.body;
  const author = req.user;

  if (!author) return res.status(401).json({ error: MSG.UNAUTHORIZED });
  if (!customer_id || !content) {
    return res.status(400).json({ error: MSG.NOTE_MISSING_FIELDS });
  }

  try {
    // 1. Kiểm tra customer + quyền
    const customer = await prisma.customer.findUnique({
      where: { id: Number(customer_id) }
    });

    if (!customer) return res.status(404).json({ error: MSG.CUSTOMER_NOT_FOUND });

    if (!isAdminOrOwner(author, customer.owner_id ?? -1)) {
      return res.status(403).json({ error: MSG.CUSTOMER_FORBIDDEN });
    }

    // 2. Lưu ghi chú vào Exchange
    const newNote = await prisma.exchange.create({
      data: {
        customer_id: Number(customer_id),
        writer_id:   author.id,
        content
      },
      include: {
        writer: { select: { id: true, name: true } }
      }
    });

    // 3. Xử lý @mention — hỗ trợ cả markup @[Name](id) lẫn dạng gõ tay @Name
    await notifyMentions({
      content,
      author,
      customer,
      matchPlainNames: true
    });

    return res.status(201).json(newNote);
  } catch (err) {
    console.error('Lỗi tạo ghi chú:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};

// ─── UPDATE GHI CHÚ ───────────────────────────────────────────────────────────

export const updateNote = async (req: AuthRequest, res: Response) => {
  const { id }    = req.params;
  const { content } = req.body;
  const user      = req.user;

  if (!user)    return res.status(401).json({ error: MSG.UNAUTHORIZED });
  if (!content) return res.status(400).json({ error: MSG.NOTE_EMPTY_CONTENT });

  try {
    const existing = await prisma.exchange.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) return res.status(404).json({ error: MSG.NOTE_NOT_FOUND });

    if (!isAdminOrOwner(user, existing.writer_id)) {
      return res.status(403).json({ error: MSG.NOTE_FORBIDDEN });
    }

    const updated = await prisma.exchange.update({
      where:   { id: Number(id) },
      data:    { content },
      include: { writer: { select: { id: true, name: true } } }
    });

    return res.json(updated);
  } catch (err) {
    console.error('Lỗi cập nhật ghi chú:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};

// ─── DELETE GHI CHÚ ───────────────────────────────────────────────────────────

export const deleteNote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user   = req.user;

  if (!user) return res.status(401).json({ error: MSG.UNAUTHORIZED });

  try {
    const existing = await prisma.exchange.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) return res.status(404).json({ error: MSG.NOTE_NOT_FOUND });

    if (!isAdminOrOwner(user, existing.writer_id)) {
      return res.status(403).json({ error: MSG.NOTE_FORBIDDEN });
    }

    // KHÔNG xoá customer_note_mentions ở đây.
    // Bảng này chỉ lưu theo customer_id (chưa có cột note_id), nên deleteMany
    // theo customer_id sẽ xoá luôn mention của mọi ghi chú khác cùng khách hàng.
    // Mention được giữ lại như lịch sử; muốn dọn chính xác cần thêm cột note_id.
    await prisma.exchange.delete({ where: { id: Number(id) } });

    return res.json({ message: MSG.NOTE_DELETED });
  } catch (err) {
    console.error('Lỗi xóa ghi chú:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};

// ─── GET NOTIFICATIONS (MongoDB) ─────────────────────────────────────────────

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: MSG.UNAUTHORIZED });

  try {
    const notifications = await Notification.find({ user_id: user.id })
      .sort({ created_at: -1 });

    return res.json(notifications);
  } catch (err) {
    console.error('Lỗi lấy thông báo:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};

// ─── MARK 1 NOTIFICATION AS READ ─────────────────────────────────────────────

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user   = req.user;

  if (!user) return res.status(401).json({ error: MSG.UNAUTHORIZED });

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user_id: user.id },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: MSG.NOTIFICATION_NOT_FOUND });
    }

    return res.json(notification);
  } catch (err) {
    console.error('Lỗi đánh dấu đã đọc:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};

// ─── MARK ALL NOTIFICATIONS AS READ ──────────────────────────────────────────

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: MSG.UNAUTHORIZED });

  try {
    await Notification.updateMany(
      { user_id: user.id, is_read: false },
      { is_read: true }
    );

    return res.json({ message: MSG.NOTIFICATION_ALL_READ });
  } catch (err) {
    console.error('Lỗi đánh dấu đọc tất cả:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};

// ─── GET MENTIONABLE USERS (autocomplete @) ───────────────────────────────────

export const getMentionableUsers = async (req: AuthRequest, res: Response) => {
  const { customerId } = req.params;
  const user           = req.user;

  if (!user) return res.status(401).json({ error: MSG.UNAUTHORIZED });

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(customerId) }
    });

    if (!customer) return res.status(404).json({ error: MSG.CUSTOMER_NOT_FOUND });

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: user.id } },
          {
            OR: [
              { role: 'admin' },
              ...(customer.owner_id ? [{ id: customer.owner_id }] : [])
            ]
          }
        ]
      },
      select: { id: true, name: true, role: true }
    });

    // Trả thêm field `tag` để frontend dùng autocomplete
    // "Nguyen Van A" → tag: "Nguyen_Van_A"
    const formatted = users.map(u => ({
      ...u,
      tag: u.name?.replace(/ /g, '_') ?? ''
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Lỗi lấy mentionable users:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};