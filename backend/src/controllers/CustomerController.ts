import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import {prisma} from '../config/db';
import { Decimal } from '@prisma/client/runtime/library';
import { parseMentionedIds } from '../helpers/mention';
import { Notification } from '../models/Notification';
import { sendRealtimeNotification } from '../sockets/socketManager';
import { NOTIFY } from '../constants/messages';

// ─── CREATE ─────────────────────────────────────────────────────────────────

export const Create = async (req: AuthRequest, res: Response) => {
  const {
    name, company_id, field, from_source, price, status,
    classified, email, phone_number, location, address, appointment, note
  } = req.body;
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  try {
    // Kiểm tra trùng lặp email hoặc số điện thoại
    if (email || phone_number) {
      const orConditions = [
        email        ? { email }        : null,
        phone_number ? { phone_number } : null,
      ].filter(Boolean) as { email?: string; phone_number?: string }[];

      const duplicate = await prisma.customer.findFirst({
        where: { OR: orConditions }
      });

      if (duplicate) {
        return res.status(400).json({
          error: 'Khách hàng đã tồn tại với Email hoặc Số điện thoại này.'
        });
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        company_id: company_id ? Number(company_id) : undefined,
        field,
        from_source,
        price: price ? new Decimal(price) : undefined,
        status,
        classified,
        email,
        phone_number,
        location,
        address,
        appointment:  appointment  ? new Date(appointment)     : undefined,
        note,
        owner_id:     user.id,
      }
    });

    // Parse @mention từ trường note (nếu có)
    if (note) {
      const mentionedIds = parseMentionedIds(note);
      if (mentionedIds.length > 0) {
        const mentionedUsers = await prisma.user.findMany({
          where: {
            id: { in: mentionedIds, not: user.id },
            approved: true
          }
        });

        await Promise.all(
          mentionedUsers.map(async (taggedUser) => {
            // Lưu mention vào DB
            await prisma.customerNoteMention.create({
              data: {
                customer_id:       customer.id,
                mentioned_user_id: taggedUser.id,
                mentioned_by:      user.id
              }
            });

            // Gửi Notification
            const notification = await Notification.create({
              user_id:         taggedUser.id,
              type:            'mention',
              content:         NOTIFY.mention(user.name ?? 'Someone', customer.name ?? 'a customer'),
              ref_customer_id: customer.id,
              is_read:         false
            });

            sendRealtimeNotification(String(taggedUser.id), notification);
          })
        );
      }
    }

    return res.status(201).json(customer);
  } catch (err) {
    console.error('Lỗi tạo khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi tạo khách hàng.' });
  }
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────

export const GetAll = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  // Admin có thể lọc theo user_id cụ thể qua query param
  const { owner_id } = req.query;

  try {
    let whereClause = {};

    if (user.role === 'admin') {
      // Admin: xem tất cả, hoặc lọc theo owner_id nếu muốn xem của 1 user
      whereClause = owner_id ? { owner_id: Number(owner_id) } : {};
    } else {
      // User thường: chỉ xem của mình, KHÔNG cho phép lọc theo owner khác
      whereClause = { owner_id: user.id };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        owner:   { select: { name: true, email: true } },
        company: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json(customers);
  } catch (err) {
    console.error('Lỗi lấy danh sách khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách.' });
  }
};
// ─── GET BY ID ───────────────────────────────────────────────────────────────

export const GetById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
      include: {
        documents: {
          include: { uploader: { select: { id: true, name: true } } },
          orderBy:  { created_at: 'desc' },
        },
        exchanges: {
          include: { writer: { select: { id: true, name: true } } },
          orderBy:  { created_at: 'desc' },
        },
        owner:   { select: { id: true, name: true } },
        company: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng này.' });
    }

    // Chỉ admin hoặc chính chủ mới được xem chi tiết
    if (user.role !== 'admin' && customer.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền xem khách hàng này.' });
    }

    return res.json(customer);
  } catch (err) {
    console.error('Lỗi lấy chi tiết khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy chi tiết.' });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export const Update = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name, company_id, field, from_source, price, status,
    classified, email, phone_number, location, address, appointment, note
  } = req.body;
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: Number(id) }
    });
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
    }

    if (user.role !== 'admin' && existingCustomer.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật khách hàng này.' });
    }

    // Kiểm tra trùng email / sđt với bản ghi khác
    if (email || phone_number) {
      const orConditions = [
        email        ? { email }        : null,
        phone_number ? { phone_number } : null,
      ].filter(Boolean) as { email?: string; phone_number?: string }[];

      const duplicate = await prisma.customer.findFirst({
        where: {
          AND: [
            { id: { not: Number(id) } },
            { OR: orConditions },
          ]
        }
      });

      if (duplicate) {
        return res.status(400).json({
          error: 'Không thể cập nhật. Email hoặc Số điện thoại bị trùng.'
        });
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: Number(id) },
      data: {
        name,
        company_id:  company_id  ? Number(company_id)   : null,
        field,
        from_source,
        price:       price       ? new Decimal(price)    : null,
        status,
        classified,
        email,
        phone_number,
        location,
        address,
        appointment: appointment ? new Date(appointment) : null,
        note,
      },
      include: {
        owner:   { select: { id: true, name: true, email: true } },
        company: true,
        documents: {
          include: { uploader: { select: { id: true, name: true } } },
          orderBy:  { created_at: 'desc' },
        },
        exchanges: {
          include: { writer: { select: { id: true, name: true } } },
          orderBy:  { created_at: 'desc' },
        }
      }
    });

    // Parse @mention từ trường note (nếu có)
    if (note) {
      const mentionedIds = parseMentionedIds(note);
      if (mentionedIds.length > 0) {
        const mentionedUsers = await prisma.user.findMany({
          where: {
            id: { in: mentionedIds, not: user.id },
            approved: true
          }
        });

        await Promise.all(
          mentionedUsers.map(async (taggedUser) => {
            // Lưu mention vào DB
            await prisma.customerNoteMention.create({
              data: {
                customer_id:       updatedCustomer.id,
                mentioned_user_id: taggedUser.id,
                mentioned_by:      user.id
              }
            });

            // Gửi Notification
            const notification = await Notification.create({
              user_id:         taggedUser.id,
              type:            'mention',
              content:         NOTIFY.mention(user.name ?? 'Someone', updatedCustomer.name ?? 'a customer'),
              ref_customer_id: updatedCustomer.id,
              is_read:         false
            });

            sendRealtimeNotification(String(taggedUser.id), notification);
          })
        );
      }
    }

    return res.json(updatedCustomer);
  } catch (err) {
    console.error('Lỗi cập nhật khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật.' });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────

export const Delete = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: Number(id) }
    });
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
    }

    if (user.role !== 'admin' && existingCustomer.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa khách hàng này.' });
    }

    await prisma.customer.delete({ where: { id: Number(id) } });
    return res.json({ message: 'Xóa khách hàng thành công.' });
  } catch (err) {
    console.error('Lỗi xóa khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xóa.' });
  }
};