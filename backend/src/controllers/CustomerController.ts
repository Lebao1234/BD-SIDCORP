import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import {prisma} from '../config/db';
import { Prisma, Classified } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { parseMentionedIds } from '../helpers/mention';
import { Notification } from '../models/Notification';
import { sendRealtimeNotification } from '../sockets/socketManager';
import { NOTIFY } from '../constants/messages';

import { parseId, formatCustomerId } from '../helpers/parseId';

// ─── CREATE ─────────────────────────────────────────────────────────────────

export const Create = async (req: AuthRequest, res: Response) => {
  const {name, company_id, company_name, field, from_source, price, status, classified, email, phone_number, address, link_url, appointment, note} = req.body;
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  try {
    // Kiểm tra trùng lặp email hoặc số điện thoại
    if (email || phone_number || link_url) {
      const orConditions = [
        email        ? { email }        : null,
        phone_number ? { phone_number } : null,
        link_url     ? { link_url }     : null
      ].filter(Boolean) as { email?: string; phone_number?: string; link_url?: string }[];

      const duplicate = await prisma.customer.findFirst({
        where: { OR: orConditions }
      });

      if (duplicate) {
        return res.status(400).json({
          error: 'Khách hàng đã tồn tại với Email hoặc Số điện thoại này.'
        });
      }
    }

    let finalCompanyId = company_id ? Number(company_id) : undefined;
    if (!finalCompanyId && company_name && company_name.trim() !== '') {
      let company = await prisma.company.findFirst({
        where: { name: company_name.trim() }
      });
      if (!company) {
        company = await prisma.company.create({
          data: { name: company_name.trim(), status: 'potential' }
        });
      }
      finalCompanyId = company.id;
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        company_id: finalCompanyId,
        field,
        from_source,
        price: price ? new Decimal(price) : undefined,
        status,
        classified,
        email:        email || null,
        phone_number: phone_number || null,
        address,
        link_url:     link_url || null,
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

    return res.status(201).json({
      ...customer,
      displayId: formatCustomerId(customer.id)
    });
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
  const { owner_id, classified, status, page = '1', limit = '10' } = req.query;

  try {
    const whereClause: Prisma.CustomerWhereInput = {
      owner_id: user.role === 'admin' 
        ? (owner_id ? Number(owner_id) : undefined) 
        : user.id,
      classified: classified ? (String(classified) as Classified) : undefined,
      status: status ? String(status) : undefined,
    };

    const pageNumber = Math.max(1, parseInt(String(page), 10));
    const pageSize = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNumber - 1) * pageSize;

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          owner:   { select: { name: true, email: true } },
          company: { select: { name: true } },
        },
        orderBy: { created_at: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.customer.count({ where: whereClause })
    ]);

    const formattedCustomers = customers.map(c => ({
      ...c,
      displayId: formatCustomerId(c.id)
    }));

    return res.json({
      data: formattedCustomers,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách.' });
  }
};
// ─── GET BY ID ───────────────────────────────────────────────────────────────

export const GetById = async (req: AuthRequest, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID khách hàng không hợp lệ.' });
  }

  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parsedId },
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

    return res.json({
      ...customer,
      displayId: formatCustomerId(customer.id)
    });
  } catch (err) {
    console.error('Lỗi lấy chi tiết khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy chi tiết.' });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export const Update = async (req: AuthRequest, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID khách hàng không hợp lệ.' });
  }

  const {
    name, company_id, company_name, field, from_source, price, status,
    classified, email, phone_number, address, link_url, appointment, note,
    company_tax_code, company_email, company_phone, company_status,
    company_address, company_bank_name, company_bank_account_no,
    company_bank_branch, company_note, company_field
  } = req.body;
  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parsedId },
      include: { company: true }
    });
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
    }

    if (user.role !== 'admin' && existingCustomer.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật khách hàng này.' });
    }

    // Kiểm tra trùng email / sđt / link_url với bản ghi khác
    if (email || phone_number || link_url) {
      const orConditions = [
        email        ? { email }        : null,
        phone_number ? { phone_number } : null,
        link_url     ? { link_url }     : null
      ].filter(Boolean) as { email?: string; phone_number?: string; link_url?: string }[];

      const duplicate = await prisma.customer.findFirst({
        where: {
          AND: [
            { id: { not: parsedId } },
            { OR: orConditions },
          ]
        }
      });

      if (duplicate) {
        return res.status(400).json({
          error: 'Không thể cập nhật. Email, Số điện thoại hoặc Link URL bị trùng.'
        });
      }
    }

    let finalCompanyId = company_id ? Number(company_id) : existingCustomer.company_id;
    const companyDataToSave = {
      name: company_name?.trim() || existingCustomer.company?.name || '',
      tax_code: company_tax_code || null,
      email: company_email || null,
      phone: company_phone || null,
      status: company_status || 'potential',
      address: company_address || null,
      bank_name: company_bank_name || null,
      bank_account_no: company_bank_account_no || null,
      bank_branch: company_bank_branch || null,
      note: company_note || null,
      field: company_field || null
    };

    if (finalCompanyId) {
      // Update existing company
      await prisma.company.update({
        where: { id: finalCompanyId },
        data: companyDataToSave
      });
    } else if (company_name && company_name.trim() !== '') {
      // Create new company
      let company = await prisma.company.findFirst({
        where: { name: company_name.trim() }
      });
      if (!company) {
        company = await prisma.company.create({
          data: companyDataToSave
        });
      }
      finalCompanyId = company.id;
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: parsedId },
      data: {
        name,
        company_id:  finalCompanyId,
        field,
        from_source,
        price:       price       ? new Decimal(price)    : null,
        status,
        classified,
        email:        email || null,
        phone_number: phone_number || null,
        address,
        link_url:     link_url || null,
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

    return res.json({
      ...updatedCustomer,
      displayId: formatCustomerId(updatedCustomer.id)
    });
  } catch (err) {
    console.error('Lỗi cập nhật khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật.' });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────

export const Delete = async (req: AuthRequest, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID khách hàng không hợp lệ.' });
  }

  const user = req.user;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parsedId }
    });
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
    }

    if (user.role !== 'admin' && existingCustomer.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa khách hàng này.' });
    }

    await prisma.$transaction([
      prisma.customerDocument.deleteMany({ where: { customer_id: parsedId } }),
      prisma.exchange.deleteMany({ where: { customer_id: parsedId } }),
      prisma.customerNoteMention.deleteMany({ where: { customer_id: parsedId } }),
      prisma.customer.delete({ where: { id: parsedId } })
    ]);
    return res.json({ message: 'Xóa khách hàng thành công.' });
  } catch (err) {
    console.error('Lỗi xóa khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xóa.' });
  }
};