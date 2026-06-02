import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import {prisma} from '../config/db';
import { supabase } from '../config/supabase';
import { cleanFileNameForStorage } from '../helpers/fileUtils';

export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  const { customerId } = req.body;
  const user = req.user;
  const file = req.file;

  if (!customerId) {
    return res.status(400).json({ error: 'Mã khách hàng (customerId) là bắt buộc.' });
  }

  if (!file) {
    return res.status(400).json({ error: 'Không tìm thấy file để upload.' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  try {
    // 1. Kiểm tra khách hàng tồn tại trong Postgres
    const customer = await prisma.customer.findUnique({
      where: { id: Number(customerId) }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng tương ứng.' });
    }

    // 2. Tạo đường dẫn lưu trữ độc bản trên Supabase Storage
    const decodedFileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const cleanFileName = cleanFileNameForStorage(decodedFileName);
    const filePath = `customers/${customerId}/${Date.now()}_${cleanFileName}`;

    // 3. Upload file buffer lên Supabase Bucket "attachments"
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Lỗi upload lên Supabase:', uploadError);
      return res.status(500).json({ error: 'Không thể upload file.' });
    }

    // 4. Lấy link URL tải về của file
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    // 5. Lưu thông tin file đính kèm vào database Postgres qua Prisma
    const attachment = await prisma.customerDocument.create({
      data: {
        file_name: decodedFileName,
        file_url: publicUrl,
        customer_id: Number(customerId),
        uploaded_by: user.id
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.status(201).json(attachment);
  } catch (err) {
    console.error('Lỗi upload file:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi upload file.' });
  }
};

export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
  }

  try {
    const attachment = await prisma.customerDocument.findUnique({
      where: { id: Number(id) }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Không tìm thấy file đính kèm này.' });
    }

    // Tiến hành xóa file trên Supabase Storage trước
    // Cần tách đường dẫn tương đối từ URL
    // URL có dạng: https://xxx.supabase.co/storage/v1/object/public/attachments/customers/cid/xxx_file.pdf
    // Ta lấy phần sau ".../attachments/"
    const urlParts = attachment.file_url ? attachment.file_url.split('/attachments/') : [];
    if (urlParts.length > 1) {
      const storageFilePath = urlParts[1];
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([storageFilePath]);
      
      if (storageError) {
        console.warn('Cảnh báo: Không thể xóa file trên Supabase Storage:', storageError.message);
      }
    }

    // Xóa record trong CSDL Postgres
    await prisma.customerDocument.delete({
      where: { id: Number(id) }
    });

    return res.json({ message: 'Xóa tệp đính kèm thành công.' });
  } catch (err) {
    console.error('Lỗi xóa file đính kèm:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xóa file.' });
  }
};
