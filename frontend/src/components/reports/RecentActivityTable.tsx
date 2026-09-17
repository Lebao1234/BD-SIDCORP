import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Panel } from './Panel';
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_CLASS } from '../../utils/constants';

export interface CustomerActivity {
  id: number;
  name: string | null;
  status: string | null;
  price: number | null;
  ownerName?: string | null;
  companyName?: string | null;
  updatedAt: string;
}

interface RecentActivityTableProps {
  customers: CustomerActivity[];
}

/* ==========================================================================
   KHÁCH HÀNG MỚI CẬP NHẬT
   --------------------------------------------------------------------------
   Bảng mật độ cao: dòng 44px, tiêu đề cột 11px chữ thường, tiền căn phải và
   dùng chữ số đều bề rộng. Trạng thái hiển thị bằng chấm + chữ; ô trống là
   dấu gạch nhạt chứ không phải "0 đ" tô xanh.
   ========================================================================== */

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ customers }) => {
  const navigate = useNavigate();

  const formatCurrency = (val: number | null) =>
    val ? `${val.toLocaleString('vi-VN')} ₫` : '—';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
  };

  return (
    <Panel
      title="Khách hàng mới cập nhật"
      subtitle="5 hồ sơ vừa được tương tác gần đây"
      bodyClassName="p-0"
      actions={
        <button
          onClick={() => navigate('/customers')}
          className="flex h-[30px] items-center gap-1.5 rounded-control px-2 text-xs font-medium
            text-brand-text transition hover:text-[#8f4114] dark:text-[#f0955a] dark:hover:text-[#f5b183]"
        >
          Xem tất cả
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      }
    >
      {customers.length === 0 ? (
        <div className="py-10 text-center text-xs text-fg-empty dark:text-[#5c574f]">Chưa có hoạt động gần đây.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-divider dark:border-[#2a2724]">
                {['Khách hàng', 'Doanh nghiệp', 'Trạng thái', 'Người phụ trách', 'Cập nhật'].map((h) => (
                  <th key={h} className="h-[34px] px-4 text-[11px] font-medium text-fg-faint dark:text-[#7f7b74]">
                    {h}
                  </th>
                ))}
                <th className="h-[34px] px-4 text-right text-[11px] font-medium text-fg-faint dark:text-[#7f7b74]">
                  Giá trị
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const statusKey = (c.status || 'NEW').toUpperCase();
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/customers?customerId=${c.id}`)}
                    className="cursor-pointer border-b border-divider last:border-b-0 transition-colors
                      hover:bg-surface-alt dark:border-[#2a2724] dark:hover:bg-[#262422]"
                  >
                    <td className="h-11 max-w-[220px] truncate px-4 text-[13px] font-medium text-fg dark:text-[#f2f0ed]">
                      {c.name || 'Khách chưa đặt tên'}
                    </td>
                    <td className="h-11 max-w-[180px] truncate px-4 text-xs text-fg-muted dark:text-[#a8a49d]">
                      {c.companyName || 'Cá nhân'}
                    </td>
                    <td className="h-11 px-4 text-xs">
                      <span
                        className={`whitespace-nowrap inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border shadow-2xs ${
                          CUSTOMER_STATUS_CLASS[statusKey] ?? CUSTOMER_STATUS_CLASS.NEW
                        }`}
                      >
                        {CUSTOMER_STATUS_LABEL[statusKey] || c.status || 'Mới tiếp nhận'}
                      </span>
                    </td>
                    <td className="h-11 max-w-[160px] truncate px-4 text-xs text-fg-muted dark:text-[#a8a49d]">
                      {c.ownerName || <span className="text-fg-empty dark:text-[#5c574f]">Chưa gán</span>}
                    </td>
                    <td className="tnum h-11 px-4 text-xs text-fg-muted dark:text-[#a8a49d]">
                      {formatDate(c.updatedAt)}
                    </td>
                    <td className="tnum h-11 px-4 text-right text-[13px] text-fg dark:text-[#f2f0ed]">
                      {c.price ? formatCurrency(c.price) : <span className="text-fg-empty dark:text-[#5c574f]">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
};
