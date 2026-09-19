import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { createHash } from 'crypto';
import apiRoute  from './routes/api';
import authRoute from './routes/authRoute';
import mongoose from 'mongoose';
import { connectAllDatabases, prisma } from './config/db';
import { initSocket } from './sockets/socketManager';
import { startTaskReminderJob, stopTaskReminderJob } from './jobs/taskReminder';
import { corsOriginHandler, allowedOrigins } from './config/cors';
import { disconnectRedis } from './config/redis';

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
// Chặn brute-force mật khẩu: 10 lần thử SAI / 15 phút / IP.
// `skipSuccessfulRequests` khiến đăng nhập đúng không bị tính, nên người dùng
// bình thường không bao giờ chạm trần.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 15 phút.' }
});

// Đăng ký thì đếm CẢ lần thành công. Dùng chung cấu hình với đăng nhập là sai:
// `skipSuccessfulRequests` ở đó nghĩa là một địa chỉ IP tạo được bao nhiêu tài
// khoản cũng được, miễn là lần nào cũng thành công.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Bạn đã tạo quá nhiều tài khoản. Vui lòng thử lại sau.' }
});

// Giới hạn chung cho API nghiệp vụ.
//
// Đếm theo IP là sai với một công ty: cả văn phòng đi chung một địa chỉ NAT,
// nên chỉ cần vài người cùng làm việc là tất cả bắt đầu nhận 429 — và biểu
// hiện ra ngoài y hệt "hệ thống lag". Đếm theo phiên đăng nhập thì hạn mức
// thuộc về từng người.
//
// Middleware này chạy TRƯỚC authenticateToken nên chưa có req.user; băm chính
// chuỗi token làm khoá là đủ để tách người dùng, và không cần giải mã gì.
// Request chưa đăng nhập vẫn rơi về khoá theo IP.
const rateLimitKey = (req: Request): string => {
  const header = req.headers['authorization'];
  const token  = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '').trim() : '';

  if (token) return `u:${createHash('sha256').update(token).digest('hex').slice(0, 32)}`;
  return ipKeyGenerator(req.ip ?? '');
};

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
  message: { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.' }
});

// ─── KHỞI ĐỘNG ────────────────────────────────────────────────────────────────
const start = async () => {
  // Kết nối tất cả DB trước, rồi mới chạy server
  await connectAllDatabases();

  // Socket.io
  await initSocket(server);

  // Nhắc trước giờ họp / giờ làm việc
  startTaskReminderJob();

  // Routes
  app.use('/api/auth/login',    loginLimiter);
  app.use('/api/auth/register', registerLimiter);
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

  // ─── GRACEFUL SHUTDOWN ──────────────────────────────────────────────────────
  const handleShutdown = async (signal: string) => {
    console.log(`\nNhận tín hiệu ${signal}. Đang tiến hành đóng server an toàn...`);
    stopTaskReminderJob();

    server.close(async () => {
      console.log('HTTP & Socket.io server đã đóng.');
      try {
        await prisma.$disconnect();
        console.log('Prisma PostgreSQL đã ngắt kết nối.');
        await mongoose.disconnect();
        console.log('Mongoose MongoDB đã ngắt kết nối.');
        await disconnectRedis();
      } catch (e) {
        console.error('Lỗi khi giải phóng tài nguyên database:', e);
      }
      process.exit(0);
    });

    // Ép buộc dừng sau 10 giây nếu các kết nối bị treo
    setTimeout(() => {
      console.error('Không thể hoàn tất đóng các kết nối sau 10 giây. Ép buộc dừng.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

start();
