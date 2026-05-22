import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoute  from './routes/api';
import authRoute from './routes/authRoute';
import { connectAllDatabases } from './config/db';   // ← 1 import duy nhất
import { initSocket } from './sockets/socketManager';

dotenv.config();

const app    = express();
const server = createServer(app);

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── KHỞI ĐỘNG ────────────────────────────────────────────────────────────────
const start = async () => {
  // Kết nối tất cả DB trước, rồi mới chạy server
  await connectAllDatabases();

  // Socket.io
  initSocket(server);

  // Routes
  app.use('/api/auth', authRoute);
  app.use('/api',      apiRoute);

  // Health check
  app.get('/', (req, res) => {
    res.json({
      status:  'online',
      message: 'CRM + Chat Internal API Server is running smoothly!'
    });
  });

  // Lắng nghe cổng
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`  Backend đang chạy tại: http://localhost:${PORT}`);
    console.log('=============================================');
  });
};

start();