import multer from 'multer';

// Danh sách định dạng tệp tin cho phép tải lên hệ thống (chặn triệt để SVG, HTML, file thực thi .exe/.sh)
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/zip',
  'application/x-zip-compressed'
]);

// Lỗi do người dùng gửi sai tệp, không phải lỗi hệ thống. Có class riêng để
// handler lỗi chung ở index.ts nhận ra và trả 400 thay vì 500.
export class UploadRejectedError extends Error {}

const MAX_FILE_SIZE_MB = 10;

// Sử dụng memoryStorage để lưu trữ file tạm thời trong RAM trước khi đẩy lên Supabase Storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new UploadRejectedError('Định dạng tệp không được hỗ trợ vì lý do an toàn. Chỉ chấp nhận tài liệu Office, PDF, hình ảnh hoặc file nén zip.'));
    }
  }
});

// Đổi lỗi của multer thành phản hồi 4xx có thông báo tiếng Việt.
// Trả về null nếu `err` không phải lỗi upload.
export const uploadErrorResponse = (err: unknown): { status: number; error: string } | null => {
  if (err instanceof UploadRejectedError) {
    return { status: 400, error: err.message };
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return { status: 413, error: `Tệp vượt quá dung lượng cho phép (${MAX_FILE_SIZE_MB}MB).` };
    }
    // Sai tên trường file (LIMIT_UNEXPECTED_FILE), quá nhiều file...
    return { status: 400, error: 'Tệp tải lên không hợp lệ.' };
  }
  return null;
};
