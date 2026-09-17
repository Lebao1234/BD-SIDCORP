import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { validBody, validQuery } from '../middlewares/validate';
import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';
import { notifyMentions } from '../helpers/notifyMentions';
import { canAccessCompany } from '../helpers/permissions';
import { parseId, formatCustomerId } from '../helpers/parseId';
import {
  bulkCreateCustomers,
  loadExistingIdentities,
  resolveCompanyIdsByName,
} from '../services/customerService';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersQuery,
} from '../schemas/customer';

// Mọi endpoint dưới đây đều chạy sau middleware `validate`, nên dữ liệu vào
// đã đúng hình dạng — controller chỉ còn lo quyền hạn và điều phối.

const detailInclude = {
  documents: {
    include: { uploader: { select: { id: true, name: true } } },
    orderBy: { created_at: 'desc' as const },
  },
  exchanges: {
    include: { writer: { select: { id: true, name: true } } },
    orderBy: { created_at: 'desc' as const },
  },
  owner:   { select: { id: true, name: true, email: true } },
  company: true,
};

// ─── CREATE ─────────────────────────────────────────────────────────────────

export const Create = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const data = validBody<CreateCustomerInput>(req);

  try {
    const existing = await loadExistingIdentities([data]);
    if (
      (data.email && existing.emails.has(data.email)) ||
      (data.phone_number && existing.phones.has(data.phone_number)) ||
      (data.link_url && existing.links.has(data.link_url))
    ) {
      return res.status(400).json({
        error: 'Khách hàng đã tồn tại với Email, Số điện thoại hoặc Liên kết này.',
      });
    }

    let companyId: number | null = data.company_id ? Number(data.company_id) : null;
    if (!companyId && data.company_name) {
      const map = await resolveCompanyIdsByName([data.company_name]);
      companyId = map.get(data.company_name.trim()) ?? null;
    }

    const customer = await prisma.customer.create({
      data: {
        name:          data.name,
        field:         data.field,
        from_source:   data.from_source,
        price:         data.price,
        status:        data.status,
        classified:    data.classified,
        email:         data.email,
        phone_number:  data.phone_number,
        address:       data.address,
        link_url:      data.link_url,
        appointment:   data.appointment ? new Date(data.appointment) : null,
        note:          data.note,
        reject_reason: data.reject_reason,
        current_step:  data.current_step,
        owner:   { connect: { id: user.id } },
        company: companyId ? { connect: { id: companyId } } : undefined,
      },
    });

    await notifyMentions({ content: data.note ?? '', author: user, customer });

    return res.status(201).json({ ...customer, displayId: formatCustomerId(customer.id) });
  } catch (err) {
    console.error('Lỗi tạo khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi tạo khách hàng.' });
  }
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────

export const GetAll = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const { page, limit, owner_id, status, classified, search } = validQuery<ListCustomersQuery>(req);

  try {
    const whereClause: Prisma.CustomerWhereInput = {
      // User thường luôn bị khoá về dữ liệu của chính mình, bỏ qua owner_id gửi lên
      owner_id: user.role === 'admin' ? owner_id : user.id,
      status,
      classified,
      ...(search
        ? {
            OR: [
              { name:         { contains: search, mode: 'insensitive' as const } },
              { email:        { contains: search, mode: 'insensitive' as const } },
              { phone_number: { contains: search } },
              { company: { name: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          owner:   { select: { id: true, name: true, email: true } },
          // Trả nguyên object doanh nghiệp giống endpoint chi tiết, để frontend
          // không phải xử lý hai hình dạng khác nhau cho cùng một trường.
          company: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    return res.json({
      data: customers.map((c) => ({ ...c, displayId: formatCustomerId(c.id) })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách.' });
  }
};

// ─── GET BY ID ───────────────────────────────────────────────────────────────

export const GetById = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const parsedId = parseId(req.params.id);
  if (parsedId === null) return res.status(400).json({ error: 'ID khách hàng không hợp lệ.' });

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parsedId },
      include: detailInclude,
    });

    if (!customer) return res.status(404).json({ error: 'Không tìm thấy khách hàng này.' });

    if (user.role !== 'admin' && customer.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền xem khách hàng này.' });
    }

    return res.json({ ...customer, displayId: formatCustomerId(customer.id) });
  } catch (err) {
    console.error('Lỗi lấy chi tiết khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy chi tiết.' });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export const Update = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const parsedId = parseId(req.params.id);
  if (parsedId === null) return res.status(400).json({ error: 'ID khách hàng không hợp lệ.' });

  const data = validBody<UpdateCustomerInput>(req);
  // Zod loại bỏ hẳn key vắng mặt, nên `in` phân biệt được "không gửi" với
  // "gửi giá trị rỗng" — trường không gửi phải giữ nguyên giá trị cũ.
  const sent = (key: keyof UpdateCustomerInput) => key in data;

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parsedId },
      include: { company: true },
    });
    if (!existingCustomer) return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });

    if (user.role !== 'admin' && existingCustomer.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật khách hàng này.' });
    }

    // Trùng email / sđt / liên kết với bản ghi KHÁC
    const existing = await loadExistingIdentities([data], parsedId);
    if (
      (data.email && existing.emails.has(data.email)) ||
      (data.phone_number && existing.phones.has(data.phone_number)) ||
      (data.link_url && existing.links.has(data.link_url))
    ) {
      return res.status(400).json({
        error: 'Không thể cập nhật. Email, Số điện thoại hoặc Liên kết bị trùng với khách hàng khác.',
      });
    }

    // ── Doanh nghiệp ────────────────────────────────────────────────────────
    const existingCompany = existingCustomer.company;
    const newCompanyName  = data.company_name?.trim();

    let companyId: number | null = data.company_id
      ? Number(data.company_id)
      : existingCustomer.company_id;
    let disconnectCompany = false;

    if (sent('company_name') && newCompanyName === '') {
      companyId = null;
      disconnectCompany = true;
    }

    const touchesCompany = ([
      'company_name', 'company_tax_code', 'company_email', 'company_phone',
      'company_status', 'company_address', 'company_bank_name',
      'company_bank_account_no', 'company_bank_branch', 'company_note', 'company_field',
    ] as const).some(sent);

    const companyFields = {
      status: sent('company_status')
        ? (data.company_status ?? 'potential')
        : (existingCompany?.status ?? 'potential'),
      ...(sent('company_tax_code')        ? { tax_code:        data.company_tax_code } : {}),
      ...(sent('company_email')           ? { email:           data.company_email } : {}),
      ...(sent('company_phone')           ? { phone:           data.company_phone } : {}),
      ...(sent('company_address')         ? { address:         data.company_address } : {}),
      ...(sent('company_bank_name')       ? { bank_name:       data.company_bank_name } : {}),
      ...(sent('company_bank_account_no') ? { bank_account_no: data.company_bank_account_no } : {}),
      ...(sent('company_bank_branch')     ? { bank_branch:     data.company_bank_branch } : {}),
      ...(sent('company_note')            ? { note:            data.company_note } : {}),
      ...(sent('company_field')           ? { field:           data.company_field } : {}),
    };

    // Nhập một tên KHÁC nghĩa là chuyển khách sang doanh nghiệp đó, không phải
    // đổi tên doanh nghiệp đang liên kết (việc đó thuộc PUT /companies/:id).
    const isSwitchingCompany = !!newCompanyName && newCompanyName !== (existingCompany?.name ?? null);

    if (isSwitchingCompany) {
      const map = await resolveCompanyIdsByName([newCompanyName]);
      companyId = map.get(newCompanyName!) ?? null;
      disconnectCompany = false;
    } else if (companyId && touchesCompany) {
      if (!(await canAccessCompany(user, companyId))) {
        return res.status(403).json({ error: 'Bạn không có quyền cập nhật doanh nghiệp này.' });
      }
      await prisma.company.update({ where: { id: companyId }, data: companyFields });
    }

    // ── Dựng payload chỉ gồm những trường thực sự được gửi ──────────────────
    const payload: Prisma.CustomerUpdateInput = {};

    if (disconnectCompany)  payload.company = { disconnect: true };
    else if (companyId)     payload.company = { connect: { id: companyId } };

    if (sent('name'))          payload.name          = data.name;
    if (sent('field'))         payload.field         = data.field;
    if (sent('from_source'))   payload.from_source   = data.from_source;
    if (sent('status'))        payload.status        = data.status;
    if (sent('classified'))    payload.classified    = data.classified ?? null;
    if (sent('address'))       payload.address       = data.address;
    if (sent('note'))          payload.note          = data.note;
    if (sent('email'))         payload.email         = data.email;
    if (sent('phone_number'))  payload.phone_number  = data.phone_number;
    if (sent('link_url'))      payload.link_url      = data.link_url;
    if (sent('reject_reason')) payload.reject_reason = data.reject_reason;
    if (sent('current_step'))  payload.current_step  = data.current_step;
    if (sent('price'))         payload.price         = data.price;
    if (sent('appointment'))   payload.appointment   = data.appointment ? new Date(data.appointment) : null;

    const updatedCustomer = await prisma.customer.update({
      where: { id: parsedId },
      data: payload,
      include: detailInclude,
    });

    if (sent('note')) {
      await notifyMentions({ content: data.note ?? '', author: user, customer: updatedCustomer });
    }

    return res.json({ ...updatedCustomer, displayId: formatCustomerId(updatedCustomer.id) });
  } catch (err) {
    console.error('Lỗi cập nhật khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật.' });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────

export const Delete = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const parsedId = parseId(req.params.id);
  if (parsedId === null) return res.status(400).json({ error: 'ID khách hàng không hợp lệ.' });

  try {
    const existingCustomer = await prisma.customer.findUnique({ where: { id: parsedId } });
    if (!existingCustomer) return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });

    if (user.role !== 'admin' && existingCustomer.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa khách hàng này.' });
    }

    await prisma.$transaction([
      prisma.customerDocument.deleteMany({ where: { customer_id: parsedId } }),
      prisma.exchange.deleteMany({ where: { customer_id: parsedId } }),
      prisma.customerNoteMention.deleteMany({ where: { customer_id: parsedId } }),
      prisma.customer.delete({ where: { id: parsedId } }),
    ]);

    // Thông báo nằm ở MongoDB nên không thuộc transaction trên. Không dọn ở đây
    // thì người dùng bấm vào thông báo cũ sẽ mở ra một khách hàng đã bị xoá.
    try {
      const { Notification } = await import('../models/Notification');
      await Notification.deleteMany({ ref_customer_id: parsedId });
    } catch (mongoErr) {
      console.error('Không thể dọn thông báo của khách hàng đã xoá:', mongoErr);
    }

    return res.json({ message: 'Xóa khách hàng thành công.' });
  } catch (err) {
    console.error('Lỗi xóa khách hàng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xóa.' });
  }
};

// ─── BULK CREATE (IMPORT) ───────────────────────────────────────────────────

export const BulkCreate = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const { customers } = validBody<{ customers: Parameters<typeof bulkCreateCustomers>[0] }>(req);

  try {
    const result = await bulkCreateCustomers(customers, user.id);
    return res.status(201).json({ message: 'Nhập dữ liệu thành công', ...result });
  } catch (err) {
    console.error('Lỗi nhập dữ liệu khách hàng hàng loạt:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi nhập dữ liệu.' });
  }
};
