import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { validBody, validQuery } from '../middlewares/validate';
import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';
import { notifyMentions } from '../helpers/notifyMentions';
import { canAccessCompany } from '../helpers/permissions';
import { parseId, formatCustomerId } from '../helpers/parseId';
import { Notification } from '../models/Notification';
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

// ─── HELPERS DÙNG CHUNG ──────────────────────────────────────────────────────

// Kiểm tra trùng lặp Email, Số điện thoại hoặc Liên kết
const checkDuplicateIdentities = async (
  data: { email?: string | null; phone_number?: string | null; link_url?: string | null },
  excludeCustomerId?: number
): Promise<string | null> => {
  const existing = await loadExistingIdentities([data], excludeCustomerId);
  if (
    (data.email && existing.emails.has(data.email)) ||
    (data.phone_number && existing.phones.has(data.phone_number)) ||
    (data.link_url && existing.links.has(data.link_url))
  ) {
    return 'Khách hàng đã tồn tại với Email, Số điện thoại hoặc Liên kết này.';
  }
  return null;
};

// Danh sách các trường dữ liệu thông thường gán trực tiếp của Customer khi Update
const CUSTOMER_SCALAR_FIELDS: (keyof UpdateCustomerInput)[] = [
  'name',
  'field',
  'from_source',
  'status',
  'address',
  'note',
  'email',
  'phone_number',
  'link_url',
  'reject_reason',
  'current_step',
  'price',
];

// Bảng ánh xạ trường doanh nghiệp từ payload form sang cột trong CSDL Company
const COMPANY_PARAM_MAP: Record<string, string> = {
  company_tax_code: 'tax_code',
  company_email: 'email',
  company_phone: 'phone',
  company_address: 'address',
  company_bank_name: 'bank_name',
  company_bank_account_no: 'bank_account_no',
  company_bank_branch: 'bank_branch',
  company_note: 'note',
  company_field: 'field',
};

// Xây dựng payload cập nhật cho bảng Customer
const buildCustomerUpdatePayload = (data: UpdateCustomerInput): Prisma.CustomerUpdateInput => {
  const payload: Prisma.CustomerUpdateInput = {};

  for (const key of CUSTOMER_SCALAR_FIELDS) {
    if (key in data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload as any)[key] = data[key];
    }
  }

  if ('classified' in data) {
    payload.classified = data.classified ?? null;
  }

  if ('appointment' in data) {
    payload.appointment = data.appointment ? new Date(data.appointment) : null;
  }

  return payload;
};

// Xây dựng payload cập nhật cho bảng Company khi cập nhật từ Customer form
const buildCompanyUpdatePayload = (
  data: UpdateCustomerInput,
  existingCompanyStatus?: string
): Record<string, unknown> => {
  const fields: Record<string, unknown> = {};

  if ('company_status' in data) {
    fields.status = data.company_status ?? 'potential';
  } else if (existingCompanyStatus) {
    fields.status = existingCompanyStatus;
  }

  for (const [paramKey, dbCol] of Object.entries(COMPANY_PARAM_MAP)) {
    if (paramKey in data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fields[dbCol] = (data as any)[paramKey];
    }
  }

  return fields;
};

// ─── CREATE ─────────────────────────────────────────────────────────────────

export const Create = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const data = validBody<CreateCustomerInput>(req);

  try {
    const duplicateError = await checkDuplicateIdentities(data);
    if (duplicateError) {
      return res.status(400).json({ error: duplicateError });
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
          // Chỉ trả về các trường cần thiết cho danh sách, không lộ thông tin ngân hàng
          company: { select: { id: true, name: true, status: true, field: true } },
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

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parsedId },
      select: {
        owner_id:   true,
        company_id: true,
        company:    { select: { id: true, name: true, status: true } },
      },
    });
    if (!existingCustomer) return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });

    if (user.role !== 'admin' && existingCustomer.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật khách hàng này.' });
    }

    // Trùng email / sđt / liên kết với bản ghi KHÁC
    const duplicateError = await checkDuplicateIdentities(data, parsedId);
    if (duplicateError) {
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

    if ('company_name' in data && newCompanyName === '') {
      companyId = null;
      disconnectCompany = true;
    }

    const touchesCompany = [
      'company_name',
      'company_status',
      ...Object.keys(COMPANY_PARAM_MAP),
    ].some((k) => k in data);

    // Nhập một tên KHÁC nghĩa là chuyển khách sang doanh nghiệp đó, không phải
    // đổi tên doanh nghiệp đang liên kết (việc đó thuộc PUT /companies/:id).
    const isSwitchingCompany = Boolean(newCompanyName && newCompanyName !== (existingCompany?.name ?? null));

    if (isSwitchingCompany) {
      const map = await resolveCompanyIdsByName([newCompanyName!]);
      companyId = map.get(newCompanyName!) ?? null;
      disconnectCompany = false;
    } else if (companyId && touchesCompany) {
      if (!(await canAccessCompany(user, companyId))) {
        return res.status(403).json({ error: 'Bạn không có quyền cập nhật doanh nghiệp này.' });
      }
    }

    // ── Dựng payload cập nhật Customer và Company ──────────────────────────
    const payload = buildCustomerUpdatePayload(data);

    if (disconnectCompany) {
      payload.company = { disconnect: true };
    } else if (companyId) {
      payload.company = { connect: { id: companyId } };
    }

    // ── Thực thi Transaction đảm bảo toàn vẹn dữ liệu ────────────────────────
    const updatedCustomer = await prisma.$transaction(async (tx) => {
      // Nếu có cập nhật thông tin công ty và không phải chuyển sang công ty khác
      if (companyId && touchesCompany && !isSwitchingCompany) {
        const companyFields = buildCompanyUpdatePayload(data, existingCompany?.status);
        await tx.company.update({ where: { id: companyId }, data: companyFields });
      }

      return tx.customer.update({
        where: { id: parsedId },
        data: payload,
        // Trả về tối thiểu: không reload exchanges/documents (nặng).
        // Frontend dùng chi tiết thì gọi riêng GetById.
        include: {
          owner:   { select: { id: true, name: true, email: true } },
          company: { select: { id: true, name: true, status: true, field: true } },
        },
      });
    });

    if ('note' in data) {
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
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parsedId },
      select: { owner_id: true },
    });
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

    // Dọn dẹp thông báo liên quan trong MongoDB
    try {
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
