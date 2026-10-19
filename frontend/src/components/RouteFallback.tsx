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
    <div className="flex h-dvh overflow-hidden bg-panel" aria-busy="true">
      {/* Giữ chỗ khớp với AppLayout: dải sidebar (w-20 / w-64) + tấm nội dung bo góc */}
      <div className={`flex min-w-0 flex-1 flex-col py-2 pr-2 transition-[margin] duration-200 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-line bg-canvas">
          <div className="h-14 shrink-0 border-b border-line bg-surface" />
          <div className="flex flex-1 items-center justify-center p-5">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-brand dark:border-line-input"
              role="status"
              aria-label="Đang tải trang"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
