import api from './api';

/** Thư mục mà POST /note-images lưu ảnh vào; chỉ ảnh trong đó mới xoá được. */
const NOTE_IMAGE_SEGMENT = '/attachments/notes/';

export const uploadNoteImage = async (file: File): Promise<string | undefined> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/note-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.publicUrl;
};

/**
 * Xoá ảnh ghi chú trên Storage, không chờ và không báo lỗi: ảnh mồ côi chỉ tốn
 * chỗ, còn bắt người dùng xử lý lỗi dọn dẹp thì vô lý. Bỏ qua URL dán tay hoặc
 * ảnh cũ nằm ngoài thư mục ghi chú — máy chủ cũng sẽ từ chối các URL đó.
 */
export const discardNoteImage = (url: string | null | undefined) => {
  if (!url || !url.includes(NOTE_IMAGE_SEGMENT)) return;
  api.delete('/note-images', { data: { url } }).catch((err) => {
    console.warn('Không xoá được ảnh ghi chú cũ:', err);
  });
};
