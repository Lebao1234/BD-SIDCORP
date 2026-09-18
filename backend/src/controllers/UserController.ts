import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth';
import { parseId, formatUserId } from '../helpers/parseId';
import { supabase } from '../config/supabase';
import { cleanFileNameForStorage } from '../helpers/fileUtils';

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

    const newUser = await prisma.user.create({
      data: {
        name: name || '',
        email,
        password: hashedPassword,
        role: role === 'admin' ? 'admin' : 'user',
        approved: approved !== undefined ? Boolean(approved) : false
      },
      select: { id: true, name: true, email: true, role: true, approved: true, avatar_url: true }
    });

    return res.status(201).json({
      ...newUser,
      displayId: formatUserId(newUser.id)
    });
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
        approved: true,
        avatar_url: true
      }
    });
    const formattedUsers = users.map(u => ({ ...u, displayId: formatUserId(u.id) }));
    return res.json(formattedUsers);
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
      select: { id: true, name: true, email: true, role: true, approved: true, avatar_url: true }
    });
    const formattedUsers = users.map(u => ({ ...u, displayId: formatUserId(u.id) }));
    return res.json(formattedUsers);
  } catch (err) {
    console.error('Lỗi lấy danh sách người dùng chờ duyệt:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách.' });
  }
};

// ─── Lấy chi tiết người dùng ──────────────────────────────────────────────────
export const getUserById = async (req: Request, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID nhân viên không hợp lệ.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        avatar_url: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng này.' });
    }

    return res.json({ ...user, displayId: formatUserId(user.id) });
  } catch (err) {
    console.error('Lỗi lấy chi tiết người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy chi tiết.' });
  }
};

// ─── Cập nhật người dùng chung ────────────────────────────────────────────────
export const updateUser = async (req: AuthRequest, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID nhân viên không hợp lệ.' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Chưa xác thực' });
  }

  // Normal user cannot update other users
  if (req.user.role !== 'admin' && req.user.id !== parsedId) {
    return res.status(403).json({ error: 'Bạn không có quyền cập nhật thông tin người khác.' });
  }

  const { email, password, role, approved, name, avatar_url } = req.body;

  // Normal user cannot change their own role or approved status
  if (req.user.role !== 'admin' && (role !== undefined || approved !== undefined)) {
    return res.status(403).json({ error: 'Bạn không có quyền thay đổi role hoặc trạng thái phê duyệt.' });
  }

  try {
    if (email) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: parsedId }
        }
      });

      if (duplicate) {
        return res.status(400).json({ error: `Không thể cập nhật. Email đã được sử dụng bởi người khác.` });
      }
    }

    const dataToUpdate: any = { email, role, approved, name };
    if (avatar_url !== undefined) {
      dataToUpdate.avatar_url = avatar_url;
    }
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parsedId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        avatar_url: true
      }
    });

    return res.json({ ...updatedUser, displayId: formatUserId(updatedUser.id) });
  } catch (err) {
    console.error('Lỗi cập nhật người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật.' });
  }
};

// ─── Xóa người dùng ───────────────────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID nhân viên không hợp lệ.' });
  }

  try {
    if (req.user && parsedId === req.user.id) {
      return res.status(400).json({ error: 'Không thể tự xóa chính mình.' });
    }

    await prisma.user.delete({ where: { id: parsedId } });
    
    return res.json({ message: 'Xóa người dùng thành công.' });
  } catch (err) {
    console.error('Lỗi xóa người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xóa.' });
  }
};

// ─── Duyệt user (Shortcut cho phê duyệt nhanh) ──────────────────────────────
export const approveUser = async (req: Request, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID nhân viên không hợp lệ.' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: parsedId },
      data:  { approved: true },
      select: { id: true, name: true, email: true, role: true, approved: true, avatar_url: true }
    });

    return res.json({
      ...user,
      displayId: formatUserId(user.id)
    });
  } catch (err) {
    console.error('Lỗi duyệt người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi duyệt người dùng.' });
  }
};

// ─── Đổi role user (Shortcut) ───────────────────────────────────────────────
export const changeRole = async (req: Request, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID nhân viên không hợp lệ.' });
  }

  try {
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role không hợp lệ' });
    }

    const user = await prisma.user.update({
      where: { id: parsedId },
      data:  { role },
      select: { id: true, name: true, email: true, role: true, approved: true }
    });

    return res.json({
      ...user,
      displayId: formatUserId(user.id)
    });
  } catch (err) {
    console.error('Lỗi thay đổi vai trò người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi thay đổi vai trò.' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID nhân viên không hợp lệ.' });
  }
  
  try {
    const { newPassword, currentPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Chưa xác thực' });
    }
    
    if (req.user.role !== 'admin' && req.user.id !== parsedId) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' });
    }

    if (req.user.id === parsedId && req.user.role !== 'admin') {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Cần nhập mật khẩu hiện tại' });
      }
      
      const user = await prisma.user.findUnique({ where: { id: parsedId } });
      if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng' });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: parsedId },
      data:  { password: hashed }
    });

    return res.json({ message: 'Đã reset mật khẩu thành công' });
  } catch (err) {
    console.error('Lỗi đặt lại mật khẩu:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi đặt lại mật khẩu.' });
  }
};

// ─── Tải lên ảnh đại diện ──────────────────────────────────────────────────
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID nhân viên không hợp lệ.' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Chưa xác thực.' });
  }

  if (req.user.role !== 'admin' && req.user.id !== parsedId) {
    return res.status(403).json({ error: 'Bạn không có quyền thay đổi ảnh đại diện của người khác.' });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'Vui lòng chọn hình ảnh đại diện.' });
  }

  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Tệp tải lên phải là hình ảnh (JPEG, PNG, WebP, GIF).' });
  }

  try {
    const fileExt = file.originalname.split('.').pop() || 'png';
    const cleanExt = cleanFileNameForStorage(fileExt);
    const filePath = `avatars/user_${parsedId}_${Date.now()}.${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Lỗi upload avatar lên Supabase:', uploadError);
      return res.status(500).json({ error: 'Không thể upload ảnh lên Cloud Storage.' });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    const updatedUser = await prisma.user.update({
      where: { id: parsedId },
      data: { avatar_url: publicUrl },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        avatar_url: true
      }
    });

    return res.json({
      message: 'Cập nhật ảnh đại diện thành công.',
      avatar_url: publicUrl,
      user: {
        ...updatedUser,
        displayId: formatUserId(updatedUser.id)
      }
    });
  } catch (err) {
    console.error('Lỗi cập nhật ảnh đại diện:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật ảnh đại diện.' });
  }
};

