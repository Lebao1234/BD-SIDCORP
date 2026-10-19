import React, { useState } from 'react';
import { Search, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChartCard } from './ChartCard';
import { StatusBadge } from '../common/StatusBadge';
import { CUSTOMER_STATUS_DOT, CUSTOMER_STATUS_LABEL } from '../../utils/constants';
import { toolbarButton } from '../common/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyCell } from '../ui/table';
import { formatCurrency } from '../../utils/formatters';

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
   KHÁCH HÀNG / GIAO DỊCH GẦN ĐÂY
   --------------------------------------------------------------------------
   Chỉ hiển thị dữ liệu thật từ /reports/summary. Ô không có dữ liệu là dấu
   gạch nhạt — không điền số tiền hay trạng thái giả để bảng "trông đầy đủ".
   ========================================================================== */


const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const initialsOf = (name: string | null) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const empty = <EmptyCell />;

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ customers }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const q = searchTerm.trim().toLowerCase();
  const filtered = q
    ? customers.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.companyName || '').toLowerCase().includes(q) ||
          `kh${c.id}`.includes(q.replace(/[^a-z0-9]/g, ''))
      )
    : customers;

  return (
    <ChartCard
      title="Giao dịch gần đây"
      icon={Users}
      flush
      actions={
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-faint" strokeWidth={1.9} />
            <input
              type="text"
              placeholder="Tìm khách hàng, doanh nghiệp…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Tìm trong giao dịch gần đây"
              className="h-8 w-52 rounded-control border border-line bg-surface pl-8 pr-3 text-sm text-fg placeholder:text-fg-faint transition hover:border-line-strong sm:w-64"
            />
          </div>
          <button type="button" onClick={() => navigate('/customers')} className={toolbarButton}>
            Xem tất cả
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </>
      }
    >
      <Table className="min-w-[760px]" style={{ ['--table-edge' as string]: '20px' }}>
        <TableHeader>
          <TableRow>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Mã</TableHead>
            <TableHead>Người phụ trách</TableHead>
            <TableHead>Cập nhật</TableHead>
            <TableHead className="text-right">Giá trị</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="h-28 text-center text-fg-subtle">
                {customers.length === 0 ? 'Chưa có giao dịch nào gần đây.' : 'Không có giao dịch nào khớp với tìm kiếm.'}
              </TableCell>
            </TableRow>
          ) : (
            filtered.slice(0, 7).map((c) => {
              const statusKey = (c.status || 'NEW').toUpperCase();
              const amount = c.price ? formatCurrency(c.price) : null;
              const date = formatDate(c.updatedAt);
              return (
                <TableRow
                  key={c.id}
                  onClick={() => navigate(`/customers?customerId=${c.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-text">
                        {initialsOf(c.name)}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-fg transition-colors group-hover:text-brand-text">
                          {c.name || 'Khách chưa đặt tên'}
                        </span>
                        <span className="truncate text-xs text-fg-subtle">{c.companyName || 'Khách hàng cá nhân'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tnum whitespace-nowrap text-xs font-medium text-fg-subtle">KH-{c.id}</TableCell>
                  <TableCell className="whitespace-nowrap text-fg-muted">{c.ownerName || empty}</TableCell>
                  <TableCell className="tnum whitespace-nowrap text-fg-muted">{date || empty}</TableCell>
                  <TableCell className="tnum whitespace-nowrap text-right font-medium text-fg">{amount || empty}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge
                      label={CUSTOMER_STATUS_LABEL[statusKey] || c.status || 'Mới tiếp nhận'}
                      color={CUSTOMER_STATUS_DOT[statusKey] ?? CUSTOMER_STATUS_DOT.NEW}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </ChartCard>
  );
};
