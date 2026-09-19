import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Khớp theo TÊN GÓI chứ không phải chuỗi con của đường dẫn.
          // Bản cũ dùng `id.includes('react')` nên gom nhầm mọi gói có chữ
          // "react" trong tên — emoji-picker-react, react-mentions,
          // lucide-react, @tanstack/react-query — vào chung một chunk nằm trên
          // đường tải quan trọng, đẩy nó từ ~180KB lên 553KB.
          const after = id.split('node_modules/').pop() ?? '';
          const parts = after.split('/');
          const pkg = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

          // Chỉ nhân lõi React mới cần nằm trong chunk tải ngay từ đầu
          if (['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'].includes(pkg)) {
            return 'vendor-react';
          }

          // Các gói nặng chỉ dùng ở một vài màn hình: để rollup tự tách theo
          // điểm import động, đừng ép vào chunk chung.
          if (['exceljs', 'emoji-picker-react', 'file-saver'].includes(pkg)) return;

          return 'vendor';
        }
      }
    }
  }
})
