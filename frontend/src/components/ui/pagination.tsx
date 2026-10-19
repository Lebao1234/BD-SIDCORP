import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

/* ==========================================================================
   PHÂN TRANG — kiểu shadcn/ui
   --------------------------------------------------------------------------
   Trang hiện tại là nút viền (outline), các trang khác là nút trơn (ghost);
   khoảng trang bị lược đi hiện dấu "…". Bản cũ tô đen kín trang hiện tại và
   chỉ hiện 5 trang liền nhau, không có đường tới trang đầu/cuối.
   ========================================================================== */

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// 1 … 4 5 [6] 7 8 … 20
const pageList = (page: number, total: number): Array<number | 'gap'> => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const from = Math.max(2, Math.min(page - 1, total - 4));
  const to = Math.min(total - 1, Math.max(page + 1, 5));
  const middle = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return [1, ...(from > 2 ? ['gap' as const] : []), ...middle, ...(to < total - 1 ? ['gap' as const] : []), total];
};

const base =
  'inline-flex h-8 items-center justify-center gap-1 rounded-control text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40';

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange, className }) => (
  <nav aria-label="Phân trang" className={cn('flex items-center gap-1', className)}>
    <button
      type="button"
      onClick={() => onPageChange(page - 1)}
      disabled={page <= 1}
      className={cn(base, 'px-2.5 text-fg-body hover:bg-raised hover:text-fg')}
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
      Trước
    </button>

    {pageList(page, totalPages).map((p, i) =>
      p === 'gap' ? (
        <span key={`gap-${i}`} className="flex h-8 w-8 items-center justify-center text-fg-faint" aria-hidden>
          …
        </span>
      ) : (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={cn(
            base,
            'tnum w-8',
            p === page
              ? 'border border-line bg-surface text-fg shadow-[0_1px_2px_rgba(15,23,42,0.05)]'
              : 'text-fg-muted hover:bg-raised hover:text-fg'
          )}
        >
          {p}
        </button>
      )
    )}

    <button
      type="button"
      onClick={() => onPageChange(page + 1)}
      disabled={page >= totalPages}
      className={cn(base, 'px-2.5 text-fg-body hover:bg-raised hover:text-fg')}
    >
      Sau
      <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
    </button>
  </nav>
);
