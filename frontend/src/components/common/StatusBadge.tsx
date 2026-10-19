import React from 'react';

/* ==========================================================================
   NHÃN TRẠNG THÁI
   --------------------------------------------------------------------------
   Chấm màu 6px + chữ thường trên nền trung tính. Màu chỉ nằm ở chấm, chữ giữ
   màu đọc chuẩn — quét được nhanh trong bảng dài mà không biến mỗi dòng thành
   một mảng màu pastel.
   ========================================================================== */

interface StatusBadgeProps {
  label: string;
  color: string;
  /** Bỏ khung viền, chỉ giữ chấm + chữ (dùng trong dòng chữ phụ). */
  bare?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, color, bare = false }) => (
  <span
    className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-fg-body ${
      bare ? '' : 'h-[22px] rounded-chip border border-line bg-surface px-2'
    }`}
  >
    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
    <span className="truncate">{label}</span>
  </span>
);

export default StatusBadge;
