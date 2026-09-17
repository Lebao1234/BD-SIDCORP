import { Response } from 'express';
import { Prisma, TaskStatus } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { validBody, validQuery } from '../middlewares/validate';
import { prisma } from '../config/db';
import { parseId } from '../helpers/parseId';
import type { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from '../schemas/task';

// Công việc luôn thuộc về một người. Khác khách hàng, admin KHÔNG xem việc của
// người khác — đây là danh sách việc cá nhân, không phải dữ liệu chung của đội.
const ownerScope = (userId: number): Prisma.TaskWhereInput => ({ owner_id: userId });

const taskInclude = {
  customer: { select: { id: true, name: true, phone_number: true } },
};

const OPEN_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS'];

// Việc có thể gắn giờ (start_at) hoặc chỉ có hạn chót (due_at). Khi lọc theo
// khoảng thời gian phải xét cả hai, nếu không việc chỉ có hạn chót sẽ biến mất
// khỏi lịch.
const withinRange = (from: Date, to: Date): Prisma.TaskWhereInput => ({
  OR: [
    { start_at: { gte: from, lte: to } },
    { due_at:   { gte: from, lte: to } },
    // Việc kéo dài vắt qua khoảng đang xem
    { AND: [{ start_at: { lte: from } }, { end_at: { gte: from } }] },
  ],
});

const buildScopeFilter = (scope: ListTasksQuery['scope']): Prisma.TaskWhereInput => {
  const now = new Date();

  switch (scope) {
    case 'today': {
      const from = new Date(now); from.setHours(0, 0, 0, 0);
      const to   = new Date(now); to.setHours(23, 59, 59, 999);
      return { status: { in: OPEN_STATUSES }, ...withinRange(from, to) };
    }
    case 'upcoming': {
      const to = new Date(now);
      to.setDate(to.getDate() + 7);
      return {
        status: { in: OPEN_STATUSES },
        OR: [
          { start_at: { gte: now, lte: to } },
          { due_at:   { gte: now, lte: to } },
          // Việc kéo dài vắt qua khoảng đang xem
          { AND: [{ start_at: { lte: now } }, { end_at: { gte: now } }] },
          // Việc chưa xếp lịch cụ thể (chờ xử lý / việc mở không có hạn)
          { AND: [{ start_at: null }, { due_at: null }] },
        ],
      };
    }
    case 'overdue':
      return {
        status: { in: OPEN_STATUSES },
        OR: [{ due_at: { lt: now } }, { start_at: { lt: now } }],
      };
    default:
      return {};
  }
};

// ─── LIST ────────────────────────────────────────────────────────────────────

export const GetAll = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const { page, limit, status, type, customer_id, from, to, scope } =
    validQuery<ListTasksQuery>(req);

  try {
    const rangeFilter =
      from && to && !Number.isNaN(Date.parse(from)) && !Number.isNaN(Date.parse(to))
        ? withinRange(new Date(from), new Date(to))
        : {};

    const where: Prisma.TaskWhereInput = {
      ...ownerScope(user.id),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(customer_id ? { customer_id } : {}),
      ...buildScopeFilter(scope),
      ...rangeFilter,
    };

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        include: taskInclude,
        // Việc có giờ lên trước, rồi tới việc chỉ có hạn chót, cuối cùng là
        // việc chưa đặt thời gian nào
        orderBy: [
          { start_at: { sort: 'asc', nulls: 'last' } },
          { due_at:   { sort: 'asc', nulls: 'last' } },
          { created_at: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return res.json({
      data: tasks,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách công việc:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách công việc.' });
  }
};

// ─── CREATE ──────────────────────────────────────────────────────────────────

export const Create = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const data = validBody<CreateTaskInput>(req);

  try {
    // Chỉ cho gắn việc vào khách hàng mình phụ trách
    if (data.customer_id) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customer_id },
        select: { owner_id: true },
      });
      if (!customer) return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
      if (user.role !== 'admin' && customer.owner_id !== user.id) {
        return res.status(403).json({ error: 'Bạn không có quyền gắn việc cho khách hàng này.' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title:       data.title,
        description: data.description,
        type:        data.type,
        status:      data.status,
        priority:    data.priority,
        start_at:    data.start_at ? new Date(data.start_at) : null,
        end_at:      data.end_at ? new Date(data.end_at) : null,
        due_at:      data.due_at ? new Date(data.due_at) : null,
        all_day:     data.all_day ?? false,
        location:    data.location,
        remind_before_minutes: data.remind_before_minutes,
        customer_id: data.customer_id,
        owner_id:    user.id,
      },
      include: taskInclude,
    });

    return res.status(201).json(task);
  } catch (err) {
    console.error('Lỗi tạo công việc:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi tạo công việc.' });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export const Update = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'ID công việc không hợp lệ.' });

  const data = validBody<UpdateTaskInput>(req);
  const sent = (key: keyof UpdateTaskInput) => key in data;

  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy công việc.' });
    if (existing.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa công việc này.' });
    }

    const payload: Prisma.TaskUpdateInput = {};

    if (sent('title'))       payload.title       = data.title;
    if (sent('description')) payload.description = data.description;
    if (sent('type'))        payload.type        = data.type;
    if (sent('priority'))    payload.priority    = data.priority;
    if (sent('location'))    payload.location    = data.location;
    if (sent('all_day'))     payload.all_day     = data.all_day;
    if (sent('due_at'))      payload.due_at      = data.due_at ? new Date(data.due_at) : null;
    if (sent('end_at'))      payload.end_at      = data.end_at ? new Date(data.end_at) : null;
    if (sent('remind_before_minutes')) payload.remind_before_minutes = data.remind_before_minutes;

    // Dời lịch thì phải cho phép nhắc lại, nếu không lần nhắc cũ đã khoá luôn
    if (sent('start_at')) {
      payload.start_at    = data.start_at ? new Date(data.start_at) : null;
      payload.reminded_at = null;
    }

    if (sent('status')) {
      payload.status = data.status;
      payload.completed_at = data.status === 'DONE' ? new Date() : null;
    }

    if (sent('customer_id')) {
      payload.customer = data.customer_id
        ? { connect: { id: data.customer_id } }
        : { disconnect: true };
    }

    const task = await prisma.task.update({ where: { id }, data: payload, include: taskInclude });
    return res.json(task);
  } catch (err) {
    console.error('Lỗi cập nhật công việc:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật công việc.' });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────

export const Delete = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'ID công việc không hợp lệ.' });

  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy công việc.' });
    if (existing.owner_id !== user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền xoá công việc này.' });
    }

    await prisma.task.delete({ where: { id } });
    return res.json({ message: 'Đã xoá công việc.' });
  } catch (err) {
    console.error('Lỗi xoá công việc:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xoá công việc.' });
  }
};

// ─── TỔNG QUAN CHO TRANG CHỦ ─────────────────────────────────────────────────

export const Summary = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  try {
    const now  = new Date();
    const from = new Date(now); from.setHours(0, 0, 0, 0);
    const to   = new Date(now); to.setHours(23, 59, 59, 999);

    const [today, overdue, openCount] = await prisma.$transaction([
      prisma.task.findMany({
        where: { ...ownerScope(user.id), status: { in: OPEN_STATUSES }, ...withinRange(from, to) },
        include: taskInclude,
        orderBy: [{ start_at: { sort: 'asc', nulls: 'last' } }, { due_at: 'asc' }],
        take: 20,
      }),
      prisma.task.count({
        where: {
          ...ownerScope(user.id),
          status: { in: OPEN_STATUSES },
          OR: [{ due_at: { lt: from } }, { start_at: { lt: from } }],
        },
      }),
      prisma.task.count({ where: { ...ownerScope(user.id), status: { in: OPEN_STATUSES } } }),
    ]);

    return res.json({
      today,
      overdueCount: overdue,
      openCount,
      meetingsToday: today.filter((t) => t.type === 'MEETING').length,
    });
  } catch (err) {
    console.error('Lỗi lấy tổng quan công việc:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy tổng quan công việc.' });
  }
};
