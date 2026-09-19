import React from 'react';
import { useSidebar } from '../context/SidebarContext';

/**
 * Màn hình chờ trong lúc chunk của một trang đang được tải về.
 *
 * Bản đầu là một vòng xoay giữa màn hình trắng. Vấn đề: khung ứng dụng
 * (sidebar + thanh trên cùng) nằm BÊN TRONG từng trang, nên trong lúc chờ chunk
 * thì cả khung biến mất — người dùng đang bấm vào sidebar thì thấy nguyên trang
 * chớp trắng rồi mới hiện lại. Với những trang chưa từng mở, đó là một lần nháy
 * rất rõ.
 *
 * Bản này dựng lại đúng hình khối của khung: dải sidebar đúng bề rộng đang
 * dùng, thanh tiêu đề đúng chiều cao. Nhờ vậy khi trang thật gắn vào, không có
 * gì nhảy vị trí — chỉ là phần rỗng được điền nội dung.
 */
export const RouteFallback: React.FC = () => {
  const { collapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-canvas dark:bg-[#171614]" aria-busy="true">
      {/* Dải sidebar giữ chỗ, khớp bề rộng với Sidebar thật (w-20 / w-60) */}
      <div
        className={`fixed left-0 top-0 bottom-0 z-40 border-r border-line bg-surface
          transition-[width] duration-200 dark:border-[#332f2c] dark:bg-[#232120]
          ${collapsed ? 'w-20' : 'w-60'}`}
      />

      <div
        className={`flex flex-1 flex-col transition-[margin] duration-200 ${
          collapsed ? 'ml-20' : 'ml-60'
        }`}
      >
        {/* Thanh trên cùng giữ chỗ, khớp chiều cao h-14 của AppLayout */}
        <div className="h-14 shrink-0 border-b border-line bg-surface dark:border-[#332f2c] dark:bg-[#232120]" />

        <div className="flex flex-1 items-center justify-center p-5">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-brand
              dark:border-[#3d3934] dark:border-t-brand"
            role="status"
            aria-label="Đang tải trang"
          />
        </div>
      </div>
    </div>
  );
};
