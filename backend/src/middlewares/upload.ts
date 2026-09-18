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

// Sử dụng memoryStorage để lưu trữ file tạm thời trong RAM trước khi đẩy lên Supabase Storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn kích thước file tải lên: 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Định dạng tệp không được hỗ trợ vì lý do an toàn. Chỉ chấp nhận tài liệu Office, PDF, hình ảnh hoặc file nén zip.'));
    }
  }
});
