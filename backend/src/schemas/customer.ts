import { z } from 'zod';

/**
 * Hợp đồng dữ liệu cho các endpoint khách hàng.
 *
 * File này cố ý không import gì ngoài zod, để sau này có thể tách ra thành gói
 * dùng chung giữa backend và frontend mà không kéo theo Prisma hay Express.
 */

export const CUSTOMER_STATUSES = [
  'NEW',
  'CONSULTING',
  'DEMO_SENT',
  'QUOTED',
  'CONTRACT_SENT',
  'SIGNED',
  'REJECTED',
  'STOPCONSULTING',
] as const;

export const CLASSIFIED_VALUES = ['VIP', 'Normal', 'Lead'] as const;

// Form HTML gửi chuỗi rỗng HOẶC null cho ô trống, tuỳ chỗ. Cả hai đều có nghĩa
// "xoá giá trị này", nên mọi trường tuỳ chọn phải nhận được cả ba dạng:
// vắng mặt (giữ nguyên), null và '' (xoá).
const blank = (v: unknown) => v === '' || v === null || v === undefined;

const optionalText = (max = 500) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (blank(v) ? null : String(v).trim()))
    .refine((v) => v === null || v.length <= max, {
      message: `Nội dung vượt quá ${max} ký tự.`,
    });

const optionalEmail = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (blank(v) ? null : String(v).trim()))
  .refine((v) => v === null || z.string().email().max(320).safeParse(v).success, {
    message: 'Email không đúng định dạng.',
  });

const optionalPhone = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (blank(v) ? null : String(v).trim()))
  .refine((v) => v === null || /^[0-9+().\s-]{6,30}$/.test(v), {
    message: 'Số điện thoại chỉ gồm chữ số và các ký tự + ( ) . - khoảng trắng.',
  });

// Giá trị hợp đồng: form có thể gửi số, chuỗi số, chuỗi rỗng hoặc null.
const optionalPrice = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (blank(v)) return null;
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  })
  .refine((v) => v === null || (v >= 0 && v <= 1e15), {
    message: 'Giá trị hợp đồng không hợp lệ.',
  });

const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (blank(v) ? null : String(v)))
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), {
    message: 'Thời điểm hẹn không đúng định dạng.',
  });

// Enum tuỳ chọn: '' và null đều nghĩa là "chưa phân loại"
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal(''), z.null()])
    .optional()
    .transform((v) => (blank(v) ? null : (v as T[number])));

// ─── Các trường doanh nghiệp đi kèm khách hàng ───────────────────────────────

export const customerCompanyFields = {
  company_id:              z.union([z.number(), z.string(), z.null()]).optional(),
  company_name:            z.union([z.string(), z.null()]).optional().transform((v) => (v === null || v === undefined ? undefined : String(v))),
  company_tax_code:        optionalText(50),
  company_email:           optionalText(320),
  company_phone:           optionalText(30),
  company_status:          optionalEnum(['active', 'inactive', 'potential'] as const),
  company_field:           optionalText(200),
  company_address:         optionalText(500),
  company_bank_name:       optionalText(200),
  company_bank_account_no: optionalText(50),
  company_bank_branch:     optionalText(200),
  company_note:            optionalText(2000),
};

// ─── Trường lõi của khách hàng ───────────────────────────────────────────────

const customerCoreFields = {
  name:          z.string().trim().min(1, 'Tên khách hàng là bắt buộc.').max(200),
  field:         optionalText(200),
  from_source:   optionalText(100),
  price:         optionalPrice,
  status:        optionalEnum(CUSTOMER_STATUSES),
  classified:    optionalEnum(CLASSIFIED_VALUES),
  email:         optionalEmail,
  phone_number:  optionalPhone,
  address:       optionalText(500),
  link_url:      optionalText(500),
  appointment:   optionalDate,
  note:          optionalText(5000),
  reject_reason: optionalText(1000),
  current_step:  optionalText(200),
};

export const createCustomerSchema = z
  .object({ ...customerCoreFields, ...customerCompanyFields })
  .strict();

// Cập nhật là partial: trường nào không gửi lên thì giữ nguyên giá trị cũ.
// Zod bỏ hẳn key vắng mặt khỏi kết quả parse, nên controller phân biệt được
// "không gửi" với "gửi giá trị rỗng" mà không phải dò req.body thủ công.
export const updateCustomerSchema = z
  .object({ ...customerCoreFields, ...customerCompanyFields })
  .partial()
  .strict();

export const listCustomersQuerySchema = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(500).default(10),
  owner_id:   z.coerce.number().int().positive().optional(),
  status:     z.enum(CUSTOMER_STATUSES).optional(),
  classified: z.enum(CLASSIFIED_VALUES).optional(),
  search:     z.string().trim().max(200).optional(),
});

// Nhập Excel: bản ghi lỏng hơn vì dữ liệu đến từ file người dùng tự soạn.
export const bulkCustomerSchema = z
  .object({
    ...customerCoreFields,
    name:         z.string().trim().max(200).optional(),
    company_name: z.string().trim().max(300).optional(),
  })
  .partial()
  .passthrough();

export const bulkCreateSchema = z.object({
  customers: z.array(bulkCustomerSchema).min(1, 'Danh sách khách hàng trống.').max(5000),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type BulkCustomerInput = z.infer<typeof bulkCustomerSchema>;
