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
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Không có dữ liệu',
  pagination
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center glass-panel rounded-xl">
        <div className="animate-spin w-8 h-8 border-2 border-[#e8732c] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl glass-panel">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                style={{ width: col.width }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-slate-500 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-slate-800/30 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-4 text-sm text-slate-300">
                    {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-slate-800/50 bg-slate-900/50">
          <span className="text-xs text-slate-400">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition"
            >
              Trước
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-xs rounded-lg bg-[#e8732c] text-white hover:bg-[#f5882e] disabled:opacity-50 transition"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
