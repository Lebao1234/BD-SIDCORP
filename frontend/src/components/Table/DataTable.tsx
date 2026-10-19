import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '../ui/table';
import { Pagination } from '../ui/pagination';

export interface Column<T> {
  key: Extract<keyof T, string>;
  title: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
  className?: string;
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
   Dựng từ bộ phần tử bảng kiểu shadcn/ui ở components/ui/table: tiêu đề cột
   40px, dòng dữ liệu ~52px, phân trang kiểu shadcn ở chân bảng. Mọi bảng danh
   sách trong ứng dụng đi qua đây hoặc dùng thẳng các phần tử đó, nên khoảng
   đệm, màu chữ và hover luôn giống nhau.
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
      // Khung xương giữ đúng số cột và chiều cao dòng của bảng thật, nên khi dữ
      // liệu về trang không bị nhảy bố cục.
      <TableContainer role="status" aria-label="Đang tải dữ liệu">
        <div className="table-sticky-header flex h-10 items-center gap-6 border-b border-line px-4">
          {columns.slice(0, 6).map((col, i) => (
            <div key={col.key} className="skeleton h-2.5" style={{ width: i === 0 ? 48 : 72 + ((i * 37) % 60) }} />
          ))}
        </div>
        {Array.from({ length: 8 }, (_, r) => (
          <div key={r} className="flex h-[52px] items-center gap-6 border-b border-divider px-4 last:border-b-0">
            {columns.slice(0, 6).map((col, i) => (
              <div
                key={col.key}
                className="skeleton h-3"
                style={{ width: i === 0 ? 48 : 80 + (((r + 1) * (i + 3) * 23) % 90), opacity: 1 - r * 0.08 }}
              />
            ))}
          </div>
        ))}
      </TableContainer>
    );
  }

  const isStickyLeft = (col: Column<T>, idx: number) =>
    col.sticky === 'left' || (stickyFirstColumns && idx <= 1);

  // Cột ghim trái nằm sau cột ghim trái khác phải lùi đúng bằng tổng bề rộng các cột
  // đó; dùng hằng số cố định sẽ chồng lên cột trước khi bề rộng cột thay đổi.
  const stickyLeftOffsets: (string | undefined)[] = [];
  let leftAcc = 0;
  columns.forEach((col, idx) => {
    if (!isStickyLeft(col, idx)) return;
    stickyLeftOffsets[idx] = `${leftAcc}px`;
    leftAcc += parseFloat(col.width || col.minWidth || '0') || 0;
  });

  // Nền khi hover của ô ghim do `tr:hover .table-sticky-cell` (index.css) đảm nhận:
  // màu phải đục, nếu trong suốt thì nội dung cuộn ngang sẽ lộ ra phía sau.
  const getStickyInfo = (col: Column<T>, idx: number, kind: 'header' | 'cell') => {
    const base = kind === 'header' ? 'table-sticky-header z-30' : 'table-sticky-cell z-10';
    if (col.sticky === 'right') {
      return `sticky right-0 ${base} shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.35)]`;
    }
    if (isStickyLeft(col, idx)) return `sticky ${base}`;
    return '';
  };

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const renderCell = (col: Column<T>, item: T) =>
    col.render ? col.render(item) : (item[col.key] as React.ReactNode);

  const colStyle = (col: Column<T>, idx: number): React.CSSProperties => ({
    width: col.width,
    minWidth: col.minWidth || col.width,
    left: stickyLeftOffsets[idx],
  });

  return (
    <TableContainer>
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead
                key={col.key}
                className={`${getAlignClass(col.align)} ${getStickyInfo(col, idx, 'header')} ${col.className || ''}`}
                style={colStyle(col, idx)}
              >
                {col.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-32 text-center text-fg-subtle">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((col, idx) => (
                  <TableCell
                    key={col.key}
                    className={`${getAlignClass(col.align)} ${getStickyInfo(col, idx, 'cell')} ${col.className || ''}`}
                    style={colStyle(col, idx)}
                  >
                    {col.maxWidth ? (
                      // max-width trên <td> bị trình duyệt bỏ qua (table-layout: auto),
                      // nên giới hạn đặt ở lớp bọc để nội dung `truncate` cắt được.
                      <div style={{ maxWidth: col.maxWidth }}>{renderCell(col, item)}</div>
                    ) : (
                      renderCell(col, item)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
          <span className="tnum text-sm text-fg-subtle">
            Trang <span className="font-medium text-fg">{pagination.page}</span> / {pagination.totalPages}
          </span>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={pagination.onPageChange} />
        </div>
      )}
    </TableContainer>
  );
}
