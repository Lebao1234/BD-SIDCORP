import React from 'react';
import { cn } from '../../lib/cn';

/* ==========================================================================
   BẢNG — theo cấu trúc shadcn/ui (Table, TableHeader, TableRow, TableHead…)
   --------------------------------------------------------------------------
   Giữ đúng API và cách chia lớp của shadcn để bảng nào trong dự án cũng dựng
   từ cùng một bộ phần tử, nhưng màu lấy từ token của dự án (line, fg-muted,
   surface-alt…) thay cho biến `muted` / `border` của shadcn.

     Khung      : viền 1px, bo --radius-card, không đổ bóng đậm
     Tiêu đề cột: cao 40px, 12px/500, màu fg-muted, nền surface-alt
     Dòng       : ô đệm 12px, mép trái/phải 16px, đường kẻ divider, hover nền surface-alt
     Mép bảng   : đổi bằng biến --table-edge trên <Table> (vd 20px để thẳng hàng
                  với tiêu đề ChartCard) thay vì ghi đè pl-* — hai class cùng
                  thuộc tính không đè nhau được một cách chắc chắn.
   ========================================================================== */

export const TableContainer = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('w-full min-w-0 overflow-hidden rounded-card border border-line bg-surface', className)} {...props} />
);

export const Table = ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="relative w-full overflow-x-auto custom-scrollbar">
    <table className={cn('w-full caption-bottom border-collapse text-sm', className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('[&_tr]:border-b [&_tr]:border-line [&_tr:hover]:bg-transparent', className)} {...props} />
);

export const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

export const TableFooter = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tfoot className={cn('border-t border-line bg-surface-alt font-medium [&>tr]:last:border-b-0', className)} {...props} />
);

export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      'group border-b border-divider transition-colors hover:bg-surface-alt data-[state=selected]:bg-brand-soft',
      className
    )}
    {...props}
  />
);

export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'table-sticky-header h-10 whitespace-nowrap px-3 text-left align-middle text-xs font-medium text-fg-muted first:pl-[var(--table-edge,16px)] last:pr-[var(--table-edge,16px)]',
      className
    )}
    {...props}
  />
);

export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('px-3 py-3 align-middle text-sm text-fg-body first:pl-[var(--table-edge,16px)] last:pr-[var(--table-edge,16px)]', className)} {...props} />
);

export const TableCaption = ({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) => (
  <caption className={cn('mt-4 text-sm text-fg-subtle', className)} {...props} />
);

/** Ô trống thống nhất cho mọi bảng. */
export const EmptyCell = () => <span className="text-fg-empty">—</span>;
