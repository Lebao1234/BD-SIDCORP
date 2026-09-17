import { z } from 'zod';

/**
 * Hợp đồng dữ liệu cho công việc và lịch họp.
 * Giống schemas/customer.ts: chỉ phụ thuộc zod, không kéo theo Prisma.
 */

export const TASK_TYPES      = ['TASK', 'MEETING', 'CALL', 'FOLLOW_UP'] as const;
export const TASK_STATUSES   = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export const TASK_PRIORITIES = ['LOW', 'NORMAL', 'HIGH'] as const;

const blank = (v: unknown) => v === '' || v === null || v === undefined;

const optionalText = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (blank(v) ? null : String(v).trim()))
    .refine((v) => v === null || v.length <= max, { message: `Nội dung vượt quá ${max} ký tự.` });

// Thời điểm luôn đi qua đây dưới dạng ISO (UTC). Frontend chịu trách nhiệm
// quy đổi từ giờ địa phương — xem utils/datetime.ts.
const optionalInstant = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (blank(v) ? null : String(v)))
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), {
    message: 'Thời điểm không đúng định dạng.',
  });

const optionalId = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (blank(v)) return null;
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  });

const taskCoreFields = {
  title:       z.string().trim().min(1, 'Tiêu đề công việc là bắt buộc.').max(300),
  description: optionalText(5000),
  type:        z.enum(TASK_TYPES).optional(),
  status:      z.enum(TASK_STATUSES).optional(),
  priority:    z.enum(TASK_PRIORITIES).optional(),

  start_at:    optionalInstant,
  end_at:      optionalInstant,
  due_at:      optionalInstant,
  all_day:     z.boolean().optional(),

  location:    optionalText(500),
  remind_before_minutes: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (blank(v)) return null;
      const n = Number(v);
      return Number.isInteger(n) && n >= 0 && n <= 10080 ? n : null;
    }),

  customer_id: optionalId,
};

// Kết thúc phải sau bắt đầu — kiểm ở đây để controller khỏi phải nhớ.
const endAfterStart = (data: { start_at?: string | null; end_at?: string | null }) =>
  !data.start_at || !data.end_at || Date.parse(data.end_at) >= Date.parse(data.start_at);

export const createTaskSchema = z
  .object(taskCoreFields)
  .strict()
  .refine(endAfterStart, {
    message: 'Thời điểm kết thúc phải sau thời điểm bắt đầu.',
    path: ['end_at'],
  });

export const updateTaskSchema = z
  .object(taskCoreFields)
  .partial()
  .strict()
  .refine(endAfterStart, {
    message: 'Thời điểm kết thúc phải sau thời điểm bắt đầu.',
    path: ['end_at'],
  });

export const listTasksQuerySchema = z.object({
  page:        z.coerce.number().int().min(1).default(1),
  limit:       z.coerce.number().int().min(1).max(500).default(50),
  status:      z.enum(TASK_STATUSES).optional(),
  type:        z.enum(TASK_TYPES).optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  // Khoảng thời gian dùng cho khung lịch: lấy việc giao với [from, to]
  from:        z.string().optional(),
  to:          z.string().optional(),
  // Lối tắt cho khối "Hôm nay" và danh sách việc quá hạn
  scope:       z.enum(['today', 'upcoming', 'overdue', 'all']).default('all'),
});

export type CreateTaskInput   = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput   = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery    = z.infer<typeof listTasksQuerySchema>;
