import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  RotateCw,
  Download,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Company } from '../../../types';
import { useCompanies, COMPANIES_LIMIT } from '../../../hooks/useCompanies';
import { AnimatedCounter } from '../../../components/common/AnimatedCounter';
import { formatDate } from '../../../utils/datetime';
import { COMPANY_STATUS_DOT, COMPANY_STATUS_LABEL } from '../../../utils/constants';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyCell } from '../../../components/ui/table';
import { toolbarSearch, toolbarButton, iconButton, primaryButton, pageTitle } from '../../../components/common/ui';
import api from '../../../services/api';
import { notify, confirmDialog } from '../../../lib/notify';

interface CompanyTabProps {
  onOpenCompanyForm: (companyId: number | null) => void;
}

type StatusFilter = 'all' | 'active' | 'potential' | 'inactive';

export const CompanyTab: React.FC<CompanyTabProps> = ({ onOpenCompanyForm }) => {
  const queryClient = useQueryClient();
  const { companies, total, isTruncated, loadingCompanies, isFetching, refetch } = useCompanies(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Thống kê nhanh – 1 vòng lặp reduce thay vì 3 lần filter riêng biệt
  const statusCounts = useMemo(() =>
    companies.reduce(
      (acc, c) => {
        if (c.status === 'active')    acc.active++;
        else if (c.status === 'potential') acc.potential++;
        else if (c.status === 'inactive')  acc.inactive++;
        return acc;
      },
      { active: 0, potential: 0, inactive: 0 }
    ),
    [companies]
  );
  const totalCount = companies.length;
  const { active: activeCount, potential: potentialCount, inactive: inactiveCount } = statusCounts;


  // Bộ lọc và tìm kiếm
  const filteredCompanies = useMemo(() => {
    return companies.filter((comp) => {
      const matchesStatus = activeFilter === 'all' ? true : comp.status === activeFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesStatus;

      const matchesSearch =
        (comp.name && comp.name.toLowerCase().includes(q)) ||
        (comp.tax_code && comp.tax_code.toLowerCase().includes(q)) ||
        (comp.phone && comp.phone.toLowerCase().includes(q)) ||
        (comp.email && comp.email.toLowerCase().includes(q)) ||
        (comp.field && comp.field.toLowerCase().includes(q)) ||
        (comp.address && comp.address.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [companies, activeFilter, searchQuery]);

  // Xóa doanh nghiệp
  const handleDeleteCompany = async (comp: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!(await confirmDialog({ title: `Xoá doanh nghiệp "${comp.name}"?`, message: 'Các khách hàng đang liên kết sẽ không còn gắn với doanh nghiệp này.', danger: true }))) {
      return;
    }

    setIsDeletingId(comp.id);
    try {
      await api.delete(`/companies/${comp.id}`);
      setToastMessage(`Đã xóa doanh nghiệp "${comp.name}" thành công.`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setTimeout(() => setToastMessage(null), 3500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      notify.error(err, 'Không thể xoá doanh nghiệp lúc này. Vui lòng thử lại.');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Xuất Excel danh sách doanh nghiệp
  const handleExportExcel = async () => {
    if (filteredCompanies.length === 0) return;
    setIsExporting(true);

    try {
      // Nạp ExcelJS (930KB) đúng lúc bấm xuất, thay vì kéo theo mỗi lần mở trang
      const [{ default: ExcelJS }, { default: fileSaver }] = await Promise.all([
        import('exceljs'),
        import('file-saver'),
      ]);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'BD-HỆ THỐNG';
      const sheet = workbook.addWorksheet('Danh_Sach_Doanh_Nghiep', {
        views: [{ showGridLines: true }],
      });

      sheet.columns = [
        { header: 'Mã DN', key: 'id', width: 12 },
        { header: 'Tên Doanh nghiệp', key: 'name', width: 35 },
        { header: 'Mã số thuế', key: 'tax_code', width: 18 },
        { header: 'Lĩnh vực', key: 'field', width: 22 },
        { header: 'Trạng thái', key: 'status', width: 18 },
        { header: 'Số điện thoại', key: 'phone', width: 18 },
        { header: 'Email liên hệ', key: 'email', width: 28 },
        { header: 'Website', key: 'website', width: 25 },
        { header: 'Địa chỉ', key: 'address', width: 40 },
        { header: 'Số KH liên kết', key: 'customer_count', width: 16 },
        { header: 'Ngày tạo', key: 'created_at', width: 16 },
      ];

      // Format header
      const headerRow = sheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8732C' },
        };
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      filteredCompanies.forEach((comp, idx) => {
        const row = sheet.addRow({
          id: `DN-${comp.id.toString().padStart(3, '0')}`,
          name: comp.name,
          tax_code: comp.tax_code || '',
          field: comp.field || '',
          status: COMPANY_STATUS_LABEL[comp.status] || comp.status,
          phone: comp.phone || '',
          email: comp.email || '',
          website: comp.website || '',
          address: comp.address || '',
          customer_count: comp._count?.customers ?? 0,
          created_at: formatDate(comp.created_at),
        });

        row.height = 22;
        row.eachCell((cell) => {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        if (idx % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFBFBFA' },
            };
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      fileSaver.saveAs(blob, `Danh_Sach_Doanh_Nghiep_BD_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Lỗi xuất Excel doanh nghiệp:', err);
      notify.error('Không thể xuất file Excel. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const empty = <EmptyCell />;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 pb-12 animate-fade-in">
      {/* Đầu trang */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className={pageTitle}>Doanh nghiệp</h2>
          <p className="text-[13px] text-fg-subtle">
            Hồ sơ pháp nhân, mã số thuế, thông tin liên hệ và khách hàng liên kết.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Làm mới danh sách"
            className={`${iconButton} disabled:opacity-60`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting || filteredCompanies.length === 0}
            className={`${toolbarButton} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            {isExporting ? 'Đang xuất…' : 'Xuất Excel'}
          </button>
          <button type="button" onClick={() => onOpenCompanyForm(null)} className={primaryButton}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Thêm doanh nghiệp
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2 rounded-control border border-line bg-surface px-3.5 py-2.5 text-[13px] text-fg-body shadow-card animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" strokeWidth={1.8} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bộ lọc trạng thái + tìm kiếm */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả', count: totalCount },
            { id: 'active', label: 'Đang hoạt động', count: activeCount },
            { id: 'potential', label: 'Tiềm năng', count: potentialCount },
            { id: 'inactive', label: 'Ngừng hoạt động', count: inactiveCount },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as StatusFilter)}
                className={`flex h-8 cursor-pointer items-center gap-2 whitespace-nowrap rounded-control px-3 text-[13px] transition ${
                  isActive
                    ? 'bg-surface font-medium text-fg shadow-card ring-1 ring-line'
                    : 'text-fg-subtle hover:bg-raised hover:text-fg'
                }`}
              >
                {tab.id !== 'all' && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: COMPANY_STATUS_DOT[tab.id] }}
                  />
                )}
                {tab.label}
                <span className={`tnum text-[12px] ${isActive ? 'text-fg-subtle' : 'text-fg-faint'}`}>
                  <AnimatedCounter value={tab.count} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-faint" strokeWidth={1.9} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, MST, SĐT, email…"
            className={toolbarSearch}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title="Xóa tìm kiếm"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bảng */}
      <div className="w-full min-w-0 overflow-hidden rounded-card border border-line bg-surface">
        {loadingCompanies ? (
          <div className="flex h-44 flex-col items-center justify-center gap-2.5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
            <p className="text-[13px] text-fg-subtle">Đang tải danh sách doanh nghiệp…</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <h3 className="text-[14px] font-medium text-fg">Không tìm thấy doanh nghiệp nào</h3>
            <p className="mt-1 text-[13px] text-fg-subtle">
              {searchQuery
                ? 'Không có kết quả khớp với từ khóa tìm kiếm.'
                : 'Bấm "Thêm doanh nghiệp" để tạo hồ sơ đầu tiên.'}
            </p>
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className={`${toolbarButton} mt-4`}>
                Xóa tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Mã</TableHead>
                  <TableHead className="min-w-[220px]">Doanh nghiệp</TableHead>
                  <TableHead className="w-32">Mã số thuế</TableHead>
                  <TableHead className="min-w-[130px]">Lĩnh vực</TableHead>
                  <TableHead className="w-36">Trạng thái</TableHead>
                  <TableHead className="min-w-[180px]">Liên hệ</TableHead>
                  <TableHead className="min-w-[180px]">Địa chỉ</TableHead>
                  <TableHead className="w-24 text-right">Khách hàng</TableHead>
                  <TableHead className="w-28 text-right">Ngày tạo</TableHead>
                  <TableHead className="sticky right-0 z-20 w-20 text-right shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.35)]">
                    <span className="sr-only">Thao tác</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredCompanies.map((comp) => {
                  const customerCount = comp._count?.customers ?? 0;
                  const isDeleting = isDeletingId === comp.id;

                  return (
                    <TableRow key={comp.id} onClick={() => onOpenCompanyForm(comp.id)} className="cursor-pointer">
                      <TableCell className="tnum whitespace-nowrap text-xs font-medium text-fg-subtle">
                        #{comp.id}
                      </TableCell>

                      <TableCell>
                        <div className="flex max-w-[280px] flex-col gap-0.5">
                          <span
                            className="truncate text-sm font-medium text-fg transition-colors group-hover:text-brand-text"
                            title={comp.name}
                          >
                            {comp.name}
                          </span>
                          {comp.website && (
                            <a
                              href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-fit max-w-[220px] truncate text-xs text-fg-subtle underline-offset-2 hover:text-fg hover:underline"
                            >
                              {comp.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="tnum whitespace-nowrap text-sm text-fg-body">
                        {comp.tax_code || empty}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm text-fg-muted">
                        {comp.field ? (
                          <span className="block max-w-[160px] truncate" title={comp.field}>{comp.field}</span>
                        ) : empty}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <StatusBadge
                          label={COMPANY_STATUS_LABEL[comp.status] ?? comp.status}
                          color={COMPANY_STATUS_DOT[comp.status] ?? COMPANY_STATUS_DOT.potential}
                        />
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {comp.phone && <span className="tnum text-sm text-fg-body">{comp.phone}</span>}
                          {comp.email && (
                            <span className="max-w-[200px] truncate text-xs text-fg-subtle" title={comp.email}>
                              {comp.email}
                            </span>
                          )}
                          {!comp.phone && !comp.email && empty}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-fg-muted">
                        {comp.address ? (
                          <span className="block max-w-[220px] truncate" title={comp.address}>{comp.address}</span>
                        ) : empty}
                      </TableCell>

                      <TableCell className="tnum whitespace-nowrap text-right text-sm">
                        {customerCount > 0 ? (
                          <span className="font-medium text-fg">{customerCount}</span>
                        ) : (
                          <span className="text-fg-empty">0</span>
                        )}
                      </TableCell>

                      <TableCell className="tnum whitespace-nowrap text-right text-xs text-fg-subtle">
                        {formatDate(comp.created_at)}
                      </TableCell>

                      <TableCell
                        className={`table-sticky-cell sticky right-0 z-10 w-20 text-right shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.35)]`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => onOpenCompanyForm(comp.id)}
                            title="Chỉnh sửa doanh nghiệp"
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-control text-fg-subtle transition hover:bg-raised hover:text-fg"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCompany(comp, e)}
                            disabled={isDeleting}
                            title="Xóa doanh nghiệp"
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-control text-fg-subtle transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
          </Table>
        )}

        {filteredCompanies.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm text-fg-subtle">
            <span className="tnum">
              {filteredCompanies.length.toLocaleString('vi-VN')} doanh nghiệp
              {activeFilter !== 'all' && ` · ${COMPANY_STATUS_LABEL[activeFilter] || activeFilter}`}
            </span>
            <span className="text-fg-faint">
              {isTruncated
                ? `Đang hiển thị ${COMPANIES_LIMIT} trên tổng ${total} doanh nghiệp — dùng ô tìm kiếm để thu hẹp`
                : 'Bấm vào một dòng để xem và chỉnh sửa'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyTab;
