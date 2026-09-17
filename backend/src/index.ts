import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRoute  from './routes/api';
import authRoute from './routes/authRoute';
import { connectAllDatabases } from './config/db';   // ← 1 import duy nhất
import { initSocket } from './sockets/socketManager';
import { startTaskReminderJob } from './jobs/taskReminder';
import { corsOriginHandler, allowedOrigins } from './config/cors';

dotenv.config();

const app    = express();
const server = createServer(app);

// ─── KIỂM TRA CẤU HÌNH BẮT BUỘC ──────────────────────────────────────────────
// Thiếu JWT_SECRET thì toàn bộ xác thực mất tác dụng — dừng ngay thay vì chạy tiếp.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET chưa được cấu hình hoặc quá ngắn (cần tối thiểu 32 ký tự).');
  console.error('Tạo chuỗi mới: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
// Đứng sau reverse proxy (Render/Railway/Nginx) để rate-limit đọc đúng IP thật
app.set('trust proxy', 1);

app.use(helmet({
  // API trả JSON và file trên Supabase, không phục vụ HTML nên tắt CSP mặc định
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(cors({
  origin: corsOriginHandler,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── RATE LIMIT ───────────────────────────────────────────────────────────────
// Chặn brute-force mật khẩu: 10 lần thử / 15 phút / IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 15 phút.' }
});

// Giới hạn chung cho API nghiệp vụ
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.' }
});

// ─── KHỞI ĐỘNG ────────────────────────────────────────────────────────────────
const start = async () => {
  // Kết nối tất cả DB trước, rồi mới chạy server
  await connectAllDatabases();

  // Socket.io
  initSocket(server);

  // Nhắc trước giờ họp / giờ làm việc
  startTaskReminderJob();

  // Routes
  app.use('/api/auth/login',    authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth', authRoute);
  app.use('/api', apiLimiter, apiRoute);

  // Health check
  app.get('/', (req, res) => {
    res.json({
      status:  'online',
      message: 'CRM + Chat Internal API Server is running smoothly!'
    });
  });

  // ─── XỬ LÝ LỖI TẬP TRUNG ────────────────────────────────────────────────────
  // Đặt sau toàn bộ route. Không có handler này, mọi lỗi chưa bắt đều rơi vào
  // handler mặc định của Express và có thể trả nguyên stack trace ra ngoài.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    // Origin bị chặn bởi allowlist -> 403 rõ ràng thay vì 500
    if (err?.message?.startsWith('Origin không được phép')) {
      return res.status(403).json({ error: 'Origin không được phép bởi chính sách CORS.' });
    }

    // Body JSON hỏng
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Dữ liệu gửi lên không phải JSON hợp lệ.' });
    }

    console.error('Lỗi không được xử lý:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống.' });
  });

  // Lắng nghe cổng
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`  Backend đang chạy tại: http://localhost:${PORT}`);
    console.log(`  Origin được phép     : ${allowedOrigins.join(', ')}`);
    console.log('=============================================');
  });
};

start();
