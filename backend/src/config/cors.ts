import dotenv from 'dotenv';

dotenv.config();

// FRONTEND_URL có thể chứa nhiều origin, phân tách bởi dấu phẩy.
// VD: FRONTEND_URL=https://portal.sidcorp.vn,https://sidcorp.vercel.app
export const allowedOrigins: string[] = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Cho phép request không có header Origin (Postman, health check, server-to-server)
export const isOriginAllowed = (origin?: string): boolean =>
  !origin || allowedOrigins.includes(origin);

export const corsOriginHandler = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  if (isOriginAllowed(origin)) return callback(null, true);
  return callback(new Error(`Origin không được phép bởi chính sách CORS: ${origin}`));
};
