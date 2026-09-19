import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth';
import { parseId, formatUserId } from '../helpers/parseId';
import { supabase } from '../config/supabase';
import { cleanFileNameForStorage } from '../helpers/fileUtils';
import { invalidateUserStatus } from '../helpers/userStatusCache';
import { hashPassword, verifyPassword } from '../helpers/password';
import { generateToken } from './AuthController';
import { USER_SAFE_SELECT } from '../helpers/userSelect';

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

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name || '',
        email,
        password: hashedPassword,
        role: role === 'admin' ? 'admin' : 'user',
        approved: approved !== undefined ? Boolean(approved) : false
      },
      select: USER_SAFE_SELECT,
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
      select: USER_SAFE_SELECT,
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
      select: USER_SAFE_SELECT,
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
      select: USER_SAFE_SELECT,
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

  // `password` KHÔNG nằm trong danh sách này, và updateUserSchema dùng .strict()
  // nên payload chứa `password` bị từ chối ngay ở middleware validate. Đổi mật
  // khẩu chỉ còn một đường duy nhất: PATCH /users/:id/reset-password.
  const { email, role, approved, name, avatar_url } = req.body;

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

    const updatedUser = await prisma.user.update({
      where: { id: parsedId },
      data: dataToUpdate,
      select: USER_SAFE_SELECT,
    });

    // Payload có thể chứa role/approved — bỏ bản đệm cũ để thay đổi có hiệu lực
    // ngay ở request kế tiếp thay vì phải đợi hết TTL.
    invalidateUserStatus(parsedId);

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
    invalidateUserStatus(parsedId);

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
      select: USER_SAFE_SELECT,
    });

    invalidateUserStatus(parsedId);

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

    invalidateUserStatus(parsedId);

    return res.json({
      ...user,
      displayId: formatUserId(user.id)
    });
  } catch (err) {
    console.error('Lỗi thay đổi vai trò người dùng:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi thay đổi vai trò.' });
  }
};

/**
 * Đường DUY NHẤT để đặt lại mật khẩu.
 *
 * Độ mạnh của mật khẩu mới do `resetPasswordSchema` gác ở middleware validate,
 * nên hàm này chỉ còn lo hai việc: ai được phép đổi mật khẩu của ai, và dọn
 * sạch các phiên cũ sau khi đổi.
 */
export const resetPassword = async (req: AuthRequest, res: Response) => {
  const parsedId = parseId(req.params.id);
  if (parsedId === null) {
    return res.status(400).json({ error: 'ID nhân viên không hợp lệ.' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Chưa xác thực' });
  }

  try {
    const { newPassword, currentPassword } = req.body as {
      newPassword: string;
      currentPassword?: string;
    };

    const isSelf = req.user.id === parsedId;

    if (!isSelf && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' });
    }

    const user = await prisma.user.findUnique({
      where:  { id: parsedId },
      select: { id: true, name: true, email: true, role: true, password: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    // Đổi mật khẩu của CHÍNH MÌNH luôn phải qua mật khẩu hiện tại — kể cả quản
    // trị viên. Bản cũ miễn trừ cho admin (`req.user.role !== 'admin'`), nghĩa
    // là ai mượn được máy của admin đang mở phiên là đổi được mật khẩu ngay.
    if (isSelf) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Cần nhập mật khẩu hiện tại' });
      }

      const isMatch = await verifyPassword(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
      }
    } else {
      // Quản trị viên đặt lại hộ người khác: không biết mật khẩu cũ là đúng
      // quy trình, nhưng vẫn phải chặn việc đặt trùng lại mật khẩu đang dùng.
      const isSame = await verifyPassword(newPassword, user.password);
      if (isSame) {
        return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
      }
    }

    const changedAt = new Date();

    await prisma.user.update({
      where: { id: parsedId },
      data:  {
        password: await hashPassword(newPassword),
        password_changed_at: changedAt,
      },
    });

    // Bỏ bản đệm để lớp kiểm tra token trong middleware đọc được mốc mới ngay
    // ở request kế tiếp, thay vì đợi hết TTL 60 giây.
    invalidateUserStatus(parsedId);

    // Mốc `password_changed_at` vừa đặt làm vô hiệu MỌI token cũ — kể cả token
    // mà chính người dùng đang cầm. Nếu họ tự đổi mật khẩu của mình thì cấp
    // luôn token mới, để thao tác đổi mật khẩu không tự đá họ ra màn hình đăng
    // nhập. Các thiết bị khác vẫn bị đăng xuất, đúng như mong muốn.
    if (isSelf) {
      const token = generateToken({
        id:    user.id,
        name:  user.name  ?? '',
        email: user.email ?? '',
        role:  user.role,
      });

      return res.json({
        message: 'Đã đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất.',
        token,
      });
    }

    return res.json({ message: 'Đã đặt lại mật khẩu thành công.' });
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
      select: USER_SAFE_SELECT,
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

