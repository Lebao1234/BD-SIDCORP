import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ─── PRISMA (PostgreSQL) ──────────────────────────────────────────────────────

export const prisma = new PrismaClient({
  log: ['error', 'warn']
});

// ─── SUPABASE (Storage) ───────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── CONNECT ALL — gọi 1 lần duy nhất trong index.ts ─────────────────────────

export const connectAllDatabases = async () => {
  console.log('=============================================');
  console.log('  Đang kết nối cơ sở dữ liệu...');
  console.log('=============================================');

  // 1. Kiểm tra Prisma / PostgreSQL
  try {
    await prisma.$connect();
    console.log('PostgreSQL (Prisma)  : Kết nối thành công');
  } catch (err) {
    console.error('PostgreSQL (Prisma)  : Kết nối thất bại', err);
    process.exit(1);
  }

  // 2. Kết nối MongoDB
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn('MongoDB             : MONGO_URI chưa cấu hình — bỏ qua');
    } else {
      await mongoose.connect(mongoUri);
      console.log('MongoDB Atlas        : Kết nối thành công');
    }
  } catch (err) {
    console.error('MongoDB Atlas        : Kết nối thất bại', err);
    process.exit(1);
  }

  // 3. Kiểm tra Supabase
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase Storage    : SUPABASE_URL hoặc SUPABASE_KEY chưa cấu hình — bỏ qua');
  } else {
    console.log('Supabase Storage     : Đã khởi tạo client');
  }

  console.log('=============================================');
};

