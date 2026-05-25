import React from 'react';

export interface Column<T> {
  key: Extract<keyof T, string>;
  title: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Không có dữ liệu'
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
    </div>
  );
}
