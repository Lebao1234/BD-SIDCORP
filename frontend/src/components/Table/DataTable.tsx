import React from 'react';

export interface Column<T> {
  key: Extract<keyof T, string>;
  title: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: PaginationProps;
  onRowClick?: (item: T) => void;
  stickyFirstColumns?: boolean;
}

/* ==========================================================================
   BẢNG DỮ LIỆU
   --------------------------------------------------------------------------
   Mật độ theo hồ sơ thiết kế: dòng dữ liệu 44px, dòng tiêu đề 34px, tiêu đề
   cột 11px chữ thường (không IN HOA giãn chữ).
   ========================================================================== */

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Không có dữ liệu',
  pagination,
  onRowClick,
  stickyFirstColumns = false,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex h-44 w-full items-center justify-center rounded-card border border-line bg-surface
        dark:border-[#332f2c] dark:bg-[#232120]">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-line-strong border-t-brand dark:border-[#3d3934] dark:border-t-brand" />
          <span className="text-xs text-fg-subtle dark:text-[#8f8b84]">Đang tải dữ liệu…</span>
        </div>
      </div>
    );
  }

  const stickyClass = (idx: number, kind: 'header' | 'cell') => {
    if (!stickyFirstColumns || idx > 1) return '';
    const base = kind === 'header' ? 'table-sticky-header z-30' : 'table-sticky-cell z-10';
    return `sticky ${idx === 0 ? 'left-0' : 'left-[75px]'} ${base}`;
  };

  return (
    <div className="w-full overflow-hidden rounded-card border border-line bg-surface
      dark:border-[#332f2c] dark:bg-[#232120]">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left">
          <thead>
            <tr className="table-sticky-header sticky top-0 z-20 border-b border-divider dark:border-[#2a2724]">
              {columns.map((col, idx) => (
                <th
                  key={col.key}
                  className={`h-[34px] whitespace-nowrap px-3.5 text-[11px] font-medium text-fg-faint
                    dark:text-[#7f7b74] ${stickyClass(idx, 'header')}`}
                  style={{ width: col.width }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-xs text-fg-empty dark:text-[#5c574f]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`group border-b border-divider last:border-b-0 transition-colors duration-150
                    hover:bg-slate-50/90 dark:border-[#2a2724] dark:hover:bg-[#262422] ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                >
                  {columns.map((col, idx) => (
                    <td
                      key={col.key}
                      className={`h-11 px-3.5 text-xs text-fg-body dark:text-[#cdc9c2] ${stickyClass(idx, 'cell')}`}
                    >
                      {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-divider px-4 py-2.5
          dark:border-[#2a2724]">
          <span className="tnum text-xs text-fg-subtle dark:text-[#8f8b84]">
            Trang {pagination.page} / {pagination.totalPages}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="h-[30px] rounded-control border border-line bg-surface px-3 text-xs font-medium
                text-fg-muted transition hover:text-fg disabled:pointer-events-none disabled:opacity-40
                dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#a8a49d] dark:hover:text-[#f2f0ed]"
            >
              Trước
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (pagination.totalPages > 5 && pagination.page > 3) {
                pageNum = pagination.page - 3 + i;
                if (pageNum > pagination.totalPages) pageNum = pagination.totalPages - (4 - i);
              }
              const isActive = pageNum === pagination.page;
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`tnum h-[30px] w-[30px] rounded-control text-xs transition ${
                    isActive
                      ? 'border border-line-strong bg-raised font-medium text-fg dark:border-[#3d3934] dark:bg-[#2c2a27] dark:text-[#f2f0ed]'
                      : 'text-fg-subtle hover:text-fg dark:text-[#8f8b84] dark:hover:text-[#f2f0ed]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="h-[30px] rounded-control border border-line bg-surface px-3 text-xs font-medium
                text-fg-muted transition hover:text-fg disabled:pointer-events-none disabled:opacity-40
                dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#a8a49d] dark:hover:text-[#f2f0ed]"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
