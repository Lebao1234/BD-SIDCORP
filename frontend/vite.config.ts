import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500, // Tăng giới hạn cảnh báo lên 1500kB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Tách các thư viện lớn ra thành từng file riêng để tránh bị gộp chung làm file quá to
            if (id.includes('exceljs')) return 'vendor-exceljs';
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
            return 'vendor'; // Các thư viện còn lại
          }
        }
      }
    }
  }
})
