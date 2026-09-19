import React from 'react';

/**
 * Màn hình chờ trong lúc chunk của một trang đang được tải về.
 *
 * Giữ nguyên nền của khung ứng dụng thay vì để trắng xoá, để lúc chuyển trang
 * không bị chớp một khung trắng giữa hai giao diện tối.
 */
export const RouteFallback: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-[#171614]">
    <div
      className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-brand
        dark:border-[#3d3934] dark:border-t-brand"
      role="status"
      aria-label="Đang tải trang"
    />
  </div>
);
