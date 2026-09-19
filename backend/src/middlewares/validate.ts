import { Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';
import { AuthRequest } from './auth';

interface ValidationTargets {
  body?:   ZodType;
  query?:  ZodType;
  params?: ZodType;
}

// Dữ liệu đã qua kiểm tra được gắn vào req.valid, KHÔNG ghi đè req.body/req.query
// (req.query ở Express 5 là thuộc tính chỉ đọc).
declare module 'express-serve-static-core' {
  interface Request {
    valid?: {
      body?:   unknown;
      query?:  unknown;
      params?: unknown;
    };
  }
}

// Zod phát thông báo mặc định bằng tiếng Anh. App này dùng tiếng Việt và lỗi
// validate hiển thị thẳng cho người nhập liệu, nên dịch các trường hợp phổ biến.
const localize = (issue: ZodError['issues'][number]): string => {
  const field = issue.path.join('.');

  switch (issue.code) {
    case 'invalid_type':
      return `Thiếu thông tin bắt buộc: ${field || 'dữ liệu'}.`;
    case 'invalid_value':
      return `Giá trị của "${field}" không nằm trong danh sách cho phép.`;
    case 'unrecognized_keys': {
      // Nêu đích danh trường bị từ chối. Câu chung chung khiến người gọi tưởng
      // mình gõ sai tên trường, trong khi thường là trường đó đã bị chuyển sang
      // một endpoint khác có kiểm soát chặt hơn (ví dụ `password`).
      const keys = (issue as { keys?: string[] }).keys ?? [];
      return keys.length
        ? `Dữ liệu gửi lên chứa trường không được phép: ${keys.join(', ')}.`
        : 'Dữ liệu gửi lên chứa trường không được phép.';
    }
    case 'too_big':
      return issue.origin === 'number'
        ? `Giá trị của "${field}" vượt quá giới hạn cho phép.`
        : `Nội dung của "${field}" quá dài.`;
    case 'too_small':
      return issue.origin === 'number'
        ? `Giá trị của "${field}" nhỏ hơn mức cho phép.`
        : `"${field}" không được để trống.`;
    default:
      // Thông báo do schema tự đặt (đã là tiếng Việt) thì giữ nguyên
      return issue.message;
  }
};

const formatIssues = (err: ZodError) =>
  err.issues.map((i) => ({
    field:   i.path.join('.') || '(gốc)',
    message: localize(i),
  }));

/**
 * Kiểm tra dữ liệu đầu vào trước khi controller chạy.
 *
 * Trước đây controller nhận thẳng req.body và tin tuyệt đối, nên mọi kiểu ép
 * dữ liệu đều nằm rải rác trong logic nghiệp vụ. Đặt ở đây thì controller chỉ
 * còn làm việc với dữ liệu đã đúng hình dạng.
 */
export const validate = (targets: ValidationTargets) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    req.valid = {};

    try {
      if (targets.body)   req.valid.body   = targets.body.parse(req.body);
      if (targets.query)  req.valid.query  = targets.query.parse(req.query);
      if (targets.params) req.valid.params = targets.params.parse(req.params);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = formatIssues(err);
        return res.status(400).json({
          error:  issues[0]?.message ?? 'Dữ liệu gửi lên không hợp lệ.',
          issues,
        });
      }
      return next(err);
    }
  };
};

// Đọc dữ liệu đã kiểm tra với đúng kiểu, tránh rải `as` khắp controller.
export const validBody  = <T>(req: AuthRequest): T => req.valid?.body   as T;
export const validQuery = <T>(req: AuthRequest): T => req.valid?.query  as T;
