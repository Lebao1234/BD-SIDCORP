import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ CẢNH BÁO: Cấu hình SUPABASE_URL hoặc SUPABASE_KEY bị thiếu trong biến môi trường. Tính năng upload file sẽ tạm thời không khả dụng.');
}

// Khởi tạo Supabase Client an toàn, tránh crash ứng dụng khi thiếu biến môi trường
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');
