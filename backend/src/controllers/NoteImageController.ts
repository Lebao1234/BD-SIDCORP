import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { supabase } from '../config/supabase';
import { cleanFileNameForStorage } from '../helpers/fileUtils';

/**
 * Ảnh minh hoạ của ghi chú cá nhân (trang Ghi chú).
 *
 * Ghi chú chỉ nằm trong localStorage của trình duyệt nên máy chủ không có bản ghi
 * nào nối ảnh với ghi chú. Trước đây ảnh đi chung đường `chat/{userId}/` và không
 * bao giờ bị xoá. Nay ảnh nằm riêng dưới `notes/{userId}/` để client tự dọn khi
 * thay/xoá ảnh, và endpoint xoá chỉ chấp nhận tệp trong thư mục của chính người
 * gọi — dán URL tệp chat hay tệp của người khác vào ghi chú cũng không xoá được.
 */

const BUCKET = 'attachments';
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ownFolder = (userId: number) => `notes/${userId}/`;

export const uploadNoteImage = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const file = req.file;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  if (!file) return res.status(400).json({ error: 'Không tìm thấy ảnh để tải lên.' });
  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    return res.status(400).json({ error: 'Chỉ chấp nhận ảnh PNG, JPG, WebP hoặc GIF.' });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return res.status(400).json({ error: 'Dung lượng ảnh tối đa 5MB.' });
  }

  try {
    const decodedFileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const filePath = `${ownFolder(user.id)}${Date.now()}_${cleanFileNameForStorage(decodedFileName)}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Lỗi upload ảnh ghi chú lên Supabase:', uploadError);
      return res.status(500).json({ error: 'Không thể tải ảnh lên Cloud Storage.' });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return res.status(201).json({ publicUrl });
  } catch (err) {
    console.error('Lỗi upload ảnh ghi chú:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi tải ảnh ghi chú.' });
  }
};

export const deleteNoteImage = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const url = typeof req.body?.url === 'string' ? req.body.url : '';

  if (!user) return res.status(401).json({ error: 'Chưa xác thực người dùng.' });

  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  let filePath = '';
  try {
    filePath = idx === -1 ? '' : decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  } catch {
    filePath = '';
  }

  if (!filePath.startsWith(ownFolder(user.id)) || filePath.includes('..')) {
    return res.status(403).json({ error: 'Chỉ xoá được ảnh ghi chú do chính bạn tải lên.' });
  }

  try {
    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) {
      console.error('Lỗi xoá ảnh ghi chú trên Supabase:', error);
      return res.status(500).json({ error: 'Không thể xoá ảnh trên Cloud Storage.' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('Lỗi xoá ảnh ghi chú:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xoá ảnh ghi chú.' });
  }
};
