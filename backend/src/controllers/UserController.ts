import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth';

// ─── Tạo người dùng mới ────────────────────────────────────────────────────────
export const createUser = async (req: Request, res: Response) => {
  const { email, password, role, approved, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email và Mật khẩu là bắt buộc.' });
  }

  try {
    const duplicate = await prisma.user.findUnique({ where: { email } });
    if (duplicate) {
      return res.status(400).json({ error: `Người dùng đã tồn tại với Email này.` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name || '',
        email,
        password: hashedPassword,
        role: role === 'admin' ? 'admin' : 'user',
        approved: approved !== undefined ? Boolean(approved) : false
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error('Lỗi tạo người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi tạo người dùng.' });
  }
};

// ─── Lấy danh sách tất cả người dùng ──────────────────────────────────────────
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true
      }
    });
    return res.json(users);
  } catch (err) {
    console.error('Lỗi lấy danh sách người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách.' });
  }
};

// ─── Lấy danh sách user chờ duyệt ─────────────────────────────────────────────
export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { approved: false } as any,
      select: { id: true, name: true, email: true, role: true }
    });
    return res.json({ data: users });
  } catch (err) {
    console.error('Lỗi lấy danh sách người dùng chờ duyệt:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách.' });
  }
};

// ─── Lấy chi tiết người dùng ──────────────────────────────────────────────────
export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng này.' });
    }

    return res.json(user);
  } catch (err) {
    console.error('Lỗi lấy chi tiết người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy chi tiết.' });
  }
};

// ─── Cập nhật người dùng chung ────────────────────────────────────────────────
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, password, role, approved, name } = req.body;

  try {
    if (email) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: Number(id) }
        }
      });

      if (duplicate) {
        return res.status(400).json({ error: `Không thể cập nhật. Email đã được sử dụng bởi người khác.` });
      }
    }

    const dataToUpdate: any = { email, role, approved, name };
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true
      }
    });

    return res.json(updatedUser);
  } catch (err) {
    console.error('Lỗi cập nhật người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật.' });
  }
};

// ─── Xóa người dùng ───────────────────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    if (req.user && Number(id) === req.user.id) {
      return res.status(400).json({ error: 'Không thể tự xóa chính mình.' });
    }

    // Xóa dữ liệu liên quan trước (Mentions, Exchanges, Documents...) nếu db không có cascade
    await prisma.user.delete({ where: { id: Number(id) } });
    
    return res.json({ message: 'Xóa người dùng thành công.' });
  } catch (err) {
    console.error('Lỗi xóa người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xóa.' });
  }
};

// ─── Duyệt user (Shortcut cho phê duyệt nhanh) ──────────────────────────────
export const approveUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data:  { approved: true },
      select: { id: true, email: true, approved: true }
    });

    return res.json({
      message: `Đã duyệt tài khoản ${user.email}`,
      data: user
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server', details: err });
  }
};

// ─── Đổi role user (Shortcut) ───────────────────────────────────────────────
export const changeRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role không hợp lệ' });
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data:  { role },
      select: { id: true, email: true, role: true }
    });

    return res.json({
      message: `Đã đổi role thành ${role}`,
      data: user
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server', details: err });
  }
};

// ─── Reset password user ──────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: Number(id) },
      data:  { password: hashed }
    });

    return res.json({ message: 'Đã reset mật khẩu thành công' });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server', details: err });
  }
};
