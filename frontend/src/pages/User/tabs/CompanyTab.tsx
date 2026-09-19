import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  RotateCw,
  Download,
  Phone,
  Mail,
  MapPin,
  Users,
  Edit2,
  Trash2,
  ExternalLink,
  Globe,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Company } from '../../../types';
import { useCompanies, COMPANIES_LIMIT } from '../../../hooks/useCompanies';
import { AnimatedCounter } from '../../../components/common/AnimatedCounter';
import { formatDate } from '../../../utils/datetime';
import { COMPANY_STATUS_CLASS, COMPANY_STATUS_LABEL } from '../../../utils/constants';
import api from '../../../services/api';

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
    if (!window.confirm(`Bạn có chắc chắn muốn xóa doanh nghiệp "${comp.name}"?`)) {
      return;
    }

    setIsDeletingId(comp.id);
    try {
      await api.delete(`/companies/${comp.id}`);
      setToastMessage(`Đã xóa doanh nghiệp "${comp.name}" thành công.`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa doanh nghiệp lúc này. Vui lòng thử lại.');
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
      workbook.creator = 'SIDCORP CRM';
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
      fileSaver.saveAs(blob, `Danh_Sach_Doanh_Nghiep_SIDCORP_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Lỗi xuất Excel doanh nghiệp:', err);
      alert('Không thể xuất file Excel. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* ══ HEADER BAR ══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <span>Danh sách Đầu mối Doanh nghiệp</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Quản lý hồ sơ pháp nhân, thông tin liên hệ, mã số thuế và các đầu mối khách hàng liên kết.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Làm mới danh sách doanh nghiệp"
            className="h-8 w-8 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs disabled:opacity-60"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting || filteredCompanies.length === 0}
            title="Xuất file Excel danh sách doanh nghiệp"
            className="h-8 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCompanyForm(null)}
            className="h-8 px-3.5 bg-[#e8732c] hover:bg-[#d66522] text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Đầu Mối Doanh Nghiệp</span>
          </button>
        </div>
      </div>

      {/* ══ ALERT TOAST ══ */}
      {toastMessage && (
        <div className="p-3 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 animate-fade-in flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ══ KPI STATISTICS CARDS ══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#1d1c19] border border-zinc-200/80 dark:border-zinc-800 px-4 py-3 rounded-xl shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Tổng doanh nghiệp</div>
          <div className="text-xl font-semibold text-zinc-900 dark:text-white mt-1">
            <AnimatedCounter value={totalCount} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1d1c19] border border-zinc-200/80 dark:border-zinc-800 px-4 py-3 rounded-xl shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Đang hoạt động</div>
          <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <AnimatedCounter value={activeCount} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1d1c19] border border-zinc-200/80 dark:border-zinc-800 px-4 py-3 rounded-xl shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Tiềm năng</div>
          <div className="text-xl font-semibold text-blue-600 dark:text-blue-400 mt-1">
            <AnimatedCounter value={potentialCount} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1d1c19] border border-zinc-200/80 dark:border-zinc-800 px-4 py-3 rounded-xl shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Ngừng hoạt động</div>
          <div className="text-xl font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
            <AnimatedCounter value={inactiveCount} />
          </div>
        </div>
      </div>

      {/* ══ TOOLBAR: FILTER TABS & SEARCH ══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="inline-flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 self-start overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'Tất cả', count: totalCount },
            { id: 'active', label: 'Đang hoạt động', count: activeCount },
            { id: 'potential', label: 'Tiềm năng', count: potentialCount },
            { id: 'inactive', label: 'Ngừng HĐ', count: inactiveCount },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as StatusFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-[#1d1c19] text-zinc-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên DN, MST, SĐT, email..."
            className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-[#1d1c19] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs placeholder:text-zinc-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ══ DATA TABLE ══ */}
      <div className="bg-white dark:bg-[#1d1c19] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs overflow-hidden">
        {loadingCompanies ? (
          <div className="p-16 text-center">
            <RotateCw className="w-5 h-5 animate-spin text-zinc-400 mx-auto mb-3" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Đang tải danh sách doanh nghiệp...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Không tìm thấy doanh nghiệp nào
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {searchQuery
                ? 'Không có kết quả nào khớp với từ khóa tìm kiếm.'
                : 'Bấm "Thêm Đầu Mối Doanh Nghiệp" để tạo hồ sơ doanh nghiệp đầu tiên.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 text-[11px] font-medium select-none">
                  <th className="w-14 px-3 py-2.5 text-center">Mã DN</th>
                  <th className="min-w-[280px] px-3.5 py-2.5">Tên đầu mối doanh nghiệp</th>
                  <th className="w-32 px-3 py-2.5">Mã số thuế</th>
                  <th className="w-32 px-3 py-2.5">Lĩnh vực</th>
                  <th className="w-32 px-3 py-2.5 text-center">Trạng thái</th>
                  <th className="min-w-[200px] px-3.5 py-2.5">Liên hệ</th>
                  <th className="min-w-[220px] px-3.5 py-2.5">Địa chỉ</th>
                  <th className="w-24 px-3 py-2.5 text-center">Khách hàng</th>
                  <th className="w-28 px-3 py-2.5 text-center">Ngày tạo</th>
                  <th className="w-20 px-3 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredCompanies.map((comp) => {
                  const customerCount = comp._count?.customers ?? 0;
                  const isDeleting = isDeletingId === comp.id;

                  return (
                    <tr
                      key={comp.id}
                      onClick={() => onOpenCompanyForm(comp.id)}
                      className="group hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    >
                      {/* Mã DN */}
                      <td className="px-3 py-3 text-center text-zinc-400 font-mono text-[11px]">
                        #{comp.id}
                      </td>

                      {/* Tên đầu mối */}
                      <td className="px-3.5 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#e8732c] dark:group-hover:text-[#e8732c] transition-colors leading-snug">
                            {comp.name}
                          </span>
                          {comp.website && (
                            <a
                              href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-[#e8732c] transition-colors w-fit"
                            >
                              <Globe className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{comp.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Mã số thuế */}
                      <td className="px-3 py-3 font-mono text-zinc-700 dark:text-zinc-300 text-[11px]">
                        {comp.tax_code ? (
                          <span className="bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-200/80 dark:border-zinc-700/60">
                            {comp.tax_code}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Lĩnh vực */}
                      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                        {comp.field ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80">
                            {comp.field}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border shadow-2xs ${
                            COMPANY_STATUS_CLASS[comp.status] ?? COMPANY_STATUS_CLASS.potential
                          }`}
                        >
                          {COMPANY_STATUS_LABEL[comp.status] ?? comp.status}
                        </span>
                      </td>

                      {/* Liên hệ: SĐT & Email */}
                      <td className="px-3.5 py-3">
                        <div className="flex flex-col gap-0.5">
                          {comp.phone ? (
                            <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>{comp.phone}</span>
                            </span>
                          ) : null}
                          {comp.email ? (
                            <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px] truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="truncate">{comp.email}</span>
                            </span>
                          ) : null}
                          {!comp.phone && !comp.email && <span className="text-zinc-400">—</span>}
                        </div>
                      </td>

                      {/* Địa chỉ */}
                      <td className="px-3.5 py-3 text-zinc-600 dark:text-zinc-400">
                        {comp.address ? (
                          <div className="flex items-start gap-1.5 max-w-[220px]" title={comp.address}>
                            <MapPin className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                            <span className="truncate">{comp.address}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Số khách hàng liên kết */}
                      <td className="px-3 py-3 text-center">
                        {customerCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
                            <Users className="w-3 h-3" />
                            <span>{customerCount} KH</span>
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">0</span>
                        )}
                      </td>

                      {/* Ngày tạo */}
                      <td className="px-3 py-3 text-center text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(comp.created_at)}
                      </td>

                      {/* Thao tác */}
                      <td className="px-3 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenCompanyForm(comp.id)}
                            title="Chỉnh sửa thông tin doanh nghiệp"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteCompany(comp, e)}
                            disabled={isDeleting}
                            title="Xóa doanh nghiệp"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer: Item count */}
        {filteredCompanies.length > 0 && (
          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>
              Hiển thị <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredCompanies.length}</span> doanh nghiệp
              {activeFilter !== 'all' && ` (${COMPANY_STATUS_LABEL[activeFilter] || activeFilter})`}
            </span>
            <span className="text-[11px] text-zinc-400">
              {isTruncated
                ? `Đang hiển thị ${COMPANIES_LIMIT} trên tổng ${total} doanh nghiệp — hãy dùng ô tìm kiếm để thu hẹp`
                : 'Nhấp vào bất kỳ dòng nào để xem và chỉnh sửa thông tin chi tiết'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyTab;
