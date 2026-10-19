/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Trash2, Download, Upload, FileSpreadsheet, ExternalLink, X, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '../../../components/Table/DataTable';
import { Customer } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useAdmins } from '../../../hooks/useUsers';
import { useCustomers, buildCustomerQuery } from '../../../hooks/useCustomers';
import api from '../../../services/api';
import { MentionTextarea } from '../../../components/MentionTextarea';
import { useExportExcel } from '../../../hooks/useExportExcel';
import { formatCurrency } from '../../../utils/formatters';
import { formatDate, fromDateTimeLocalValue } from '../../../utils/datetime';
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_DOT, INITIAL_CUSTOMER_FORM } from '../../../utils/constants';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { toolbarSelect, toolbarSearch, toolbarButton, primaryButton, pageTitle } from '../../../components/common/ui';
import { notify, confirmDialog } from '../../../lib/notify';

interface CustomerTabProps {
  onSelectCustomer: (id: string) => void;
  onOpenCompanyForm: (companyId: number | null) => void;
}

export const CustomerTab: React.FC<CustomerTabProps> = ({ onSelectCustomer, onOpenCompanyForm }) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { admins: team } = useAdmins();
  const { exportToExcel } = useExportExcel();

  // Ô tìm kiếm ở thanh điều hướng trên cùng điều hướng tới /customers?search=...
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';

  const {
    customers, loading,
    page, setPage, totalPages, total,
    classifiedFilter, setClassifiedFilter,
    ownerFilter, setOwnerFilter,
    statusFilter, setStatusFilter,
    search, setSearch
  } = useCustomers({ search: urlSearch });

  // Giá trị đang gõ trong ô input; chỉ đẩy xuống server sau khi ngừng gõ
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  // Đồng bộ khi người dùng tìm kiếm từ thanh điều hướng lúc đang ở trang này.
  // Điều chỉnh state ngay trong lúc render (pattern React khuyến nghị) thay vì
  // dùng useEffect — tránh một vòng render thừa.
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch);
  if (urlSearch !== lastUrlSearch) {
    setLastUrlSearch(urlSearch);
    setSearchQuery(urlSearch);
  }

  // Debounce 400ms: tránh bắn một request cho mỗi ký tự
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery === search) return;
      setSearch(searchQuery);
      setPage(1);

      // Phản ánh từ khoá lên URL để có thể chia sẻ/tải lại trang
      const next = new URLSearchParams(searchParams);
      if (searchQuery) next.set('search', searchQuery);
      else next.delete('search');
      setSearchParams(next, { replace: true });
    }, 400);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState(INITIAL_CUSTOMER_FORM);
  const [formError, setFormError] = useState('');

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post<Customer>('/customers', {
        ...newCustomerData,
        classified:  newCustomerData.classified || null,
        price:       newCustomerData.price ? Number(newCustomerData.price) : 0,
        appointment: fromDateTimeLocalValue(newCustomerData.appointment),
      });
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddModalOpen(false);
      setNewCustomerData(INITIAL_CUSTOMER_FORM);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error ?? 'Không thể tạo khách hàng.';
      setFormError(message);
    }
  };

  const handleFormChange = (field: keyof typeof INITIAL_CUSTOMER_FORM, value: string) => {
    setNewCustomerData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'status' && value !== 'REJECTED') {
        updated.current_step = '';
      }
      return updated;
    });
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!(await confirmDialog({ title: 'Xoá khách hàng này?', message: 'Hồ sơ, ghi chú và tệp đính kèm của khách hàng sẽ bị xoá.', danger: true }))) return;
    try {
      await api.delete(`/customers/${id}`);
      notify.success('Đã xoá khách hàng.');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Không thể xóa khách hàng lúc này. Vui lòng thử lại sau.';
      console.error('Lỗi khi xóa:', errorMessage);
      notify.error(errorMessage);
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const handleExport = async () => {
    try {
      // Lấy toàn bộ khách hàng khớp bộ lọc hiện tại. Server chặn limit ở 500/lần
      // nên tải theo từng lô cho tới khi hết dữ liệu.
      const PAGE_SIZE = 500;
      const exportCustomers: Customer[] = [];
      let currentPage = 1;
      let totalPagesToFetch = 1;

      do {
        const query = buildCustomerQuery({
          page: currentPage,
          limit: PAGE_SIZE,
          classified: classifiedFilter,
          owner: ownerFilter,
          status: statusFilter,
          search: searchQuery,
        });

        const response = await api.get(`/customers?${query}`);

        if (response.data && response.data.data) {
          exportCustomers.push(...(response.data.data as Customer[]));
          totalPagesToFetch = response.data.totalPages || 1;
        } else if (Array.isArray(response.data)) {
          exportCustomers.push(...(response.data as Customer[]));
          totalPagesToFetch = 1;
        }

        currentPage += 1;
      } while (currentPage <= totalPagesToFetch);

      const exportData = exportCustomers.map((c) => ({
        stt: c.displayId || `KH-${String(c.id).padStart(3, '0')}`,
        created_at: formatDate(c.created_at),
        name: c.name,
        company: c.company?.name ?? '',
        field: c.field || '',
        status: CUSTOMER_STATUS_LABEL[c.status] ?? c.status,
        reject_reason: c.reject_reason || '',
        classified: c.classified || '',
        from_source: c.from_source || '',
        price: c.price || 0,
        phone_number: c.phone_number || '',
        email: c.email || '',
        address: c.address || '',
        link_url: c.link_url || '',
        appointment: c.appointment ? formatDate(c.appointment) : '',
        note: c.note || '',
        updated_at: formatDate(c.updated_at),
      }));

      exportToExcel({
        data: exportData,
        fileName: 'Danh_Sach_Khach_Hang',
        sheetName: 'Khách hàng',
        headers: {
          stt: 'STT',
          created_at: 'Ngày tạo',
          name: 'Họ và tên',
          company: 'Đầu mối doanh nghiệp',
          field: 'Lĩnh vực',
          status: 'Trạng thái',
          reject_reason: 'Lý do ngừng / Hủy',
          classified: 'Phân loại',
          from_source: 'Nguồn khách hàng',
          price: 'Giá trị HD',
          phone_number: 'Số điện thoại',
          email: 'Email',
          address: 'Địa chỉ',
          link_url: 'Link URL',
          appointment: 'Lịch hẹn',
          note: 'Nhu cầu khách hàng',
          updated_at: 'Ngày cập nhật',
        }
      });
    } catch (error) {
      console.error('Lỗi khi xuất excel:', error);
      notify.error('Không thể xuất Excel lúc này. Vui lòng thử lại sau.');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      stt: '1',
      created_at: formatDate(new Date().toISOString()),
      name: 'Nguyễn Văn A',
      company: 'Công ty ABC',
      field: 'Bất động sản',
      status: 'Mới tiếp nhận',
      reject_reason: '',
      classified: 'VIP',
      from_source: 'Facebook',
      price: '10.000.000',
      phone_number: '0901234567',
      email: 'nguyenvana@example.com',
      address: '123 Đường Số 1, Quận 1, TP.HCM',
      link_url: 'https://fb.com/nguyenvana',
      appointment: '',
      note: 'Khách hàng quan tâm dự án X',
      updated_at: formatDate(new Date().toISOString()),
    }];

    exportToExcel({
      data: templateData,
      fileName: 'Mau_Nhap_Khach_Hang',
      sheetName: 'Mẫu Khách hàng',
      headers: {
        stt: 'STT',
        created_at: 'Ngày tạo',
        name: 'Họ và tên',
        company: 'Đầu mối doanh nghiệp',
        field: 'Lĩnh vực',
        status: 'Trạng thái',
        reject_reason: 'Lý do ngừng / Hủy',
        classified: 'Phân loại',
        from_source: 'Nguồn khách hàng',
        price: 'Giá trị HD',
        phone_number: 'Số điện thoại',
        email: 'Email',
        address: 'Địa chỉ',
        link_url: 'Link URL',
        appointment: 'Lịch hẹn',
        note: 'Nhu cầu khách hàng',
        updated_at: 'Ngày cập nhật',
      }
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Nạp ExcelJS đúng lúc người dùng chọn file, không phải lúc mở trang
      const { default: ExcelJS } = await import('exceljs');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      
      const importedData: any[] = [];
      let isFirstRow = true;
      let headers: string[] = [];

      worksheet.eachRow((row) => {
        if (isFirstRow) {
          headers = (row.values as string[]).map(val => val ? val.toString().trim() : '');
          isFirstRow = false;
        } else {
          const rowData: any = {};
          (row.values as any[]).forEach((val, index) => {
            if (index === 0) return; // exceljs array is 1-based
            const header = headers[index];
            if (header) {
              rowData[header] = val;
            }
          });
          
          if (rowData['Họ và tên']) {
            // Map status label back to key
            let statusCode = 'NEW';
            for (const [key, label] of Object.entries(CUSTOMER_STATUS_LABEL)) {
              if (label === rowData['Trạng thái']) {
                statusCode = key;
                break;
              }
            }

            importedData.push({
              name: rowData['Họ và tên']?.toString(),
              company_name: rowData['Đầu mối doanh nghiệp']?.toString(),
              field: rowData['Lĩnh vực']?.toString(),
              status: statusCode,
              reject_reason: rowData['Lý do ngừng / Hủy']?.toString(),
              classified: rowData['Phân loại']?.toString(),
              from_source: rowData['Nguồn khách hàng']?.toString(),
              price: rowData['Giá trị HD'] ? parseFloat(rowData['Giá trị HD'].toString().replace(/\D/g, '')) : undefined,
              phone_number: rowData['Số điện thoại']?.toString(),
              email: rowData['Email']?.toString(),
              address: rowData['Địa chỉ']?.toString(),
            });
          }
        }
      });

      if (importedData.length === 0) {
        notify.error('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        return;
      }

      const res = await api.post('/customers/bulk', { customers: importedData });
      notify.success(`Đã nhập thành công ${res.data.successCount} khách hàng. Đã bỏ qua ${res.data.skipCount} khách hàng bị trùng Email/SĐT.`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Lỗi khi nhập excel:', error);
      notify.error('Không thể nhập Excel. Vui lòng kiểm tra lại định dạng file.');
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────

  const customerColumns: Column<Customer>[] = [
    {
      key: 'id',
      title: 'Mã / Ngày tạo',
      width: '108px',
      minWidth: '108px',
      render: (c) => (
        <div className="tnum flex flex-col whitespace-nowrap">
          <span className="text-sm font-medium text-fg-body">{c.displayId || c.id}</span>
          <span className="text-xs text-fg-subtle">{formatDate(c.created_at)}</span>
        </div>
      ),
    },
    {
      key: 'name',
      title: 'Họ và tên & SĐT',
      minWidth: '150px',
      maxWidth: '200px',
      render: (c) => (
        <div
          className="flex flex-col cursor-pointer group/name"
          onClick={() => onSelectCustomer(c.id.toString())}
        >
          <span
            className="truncate text-sm font-medium text-fg transition group-hover/name:text-brand-text"
            title={c.name}
          >
            {c.name}
          </span>
          {c.phone_number && (
            <span className="tnum whitespace-nowrap text-xs text-fg-subtle">
              {c.phone_number}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'company',
      title: 'Đầu mối doanh nghiệp',
      minWidth: '160px',
      maxWidth: '220px',
      render: (c) => {
        const hasCompany = !!c.company_id;
        const compName = c.company?.name ?? '';
        if (!hasCompany) return <span className="text-fg-empty">—</span>;
        return (
          <span
            className="block cursor-pointer truncate text-sm text-fg-body underline-offset-2 hover:text-fg hover:underline"
            title={compName}
            onClick={(e) => {
              e.stopPropagation();
              onOpenCompanyForm(c.company_id!);
            }}
          >
            {compName}
          </span>
        );
      },
    },
    {
      key: 'field',
      title: 'Lĩnh vực',
      minWidth: '96px',
      maxWidth: '130px',
      render: (c) => (
        <span className="block truncate text-sm text-fg-muted" title={c.field || ''}>
          {c.field || <span className="text-fg-empty">—</span>}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '136px',
      minWidth: '136px',
      render: (c) => (
        <StatusBadge
          label={CUSTOMER_STATUS_LABEL[c.status] ?? c.status}
          color={CUSTOMER_STATUS_DOT[c.status] ?? CUSTOMER_STATUS_DOT.NEW}
        />
      ),
    },
    {
      key: 'classified',
      title: 'Phân loại',
      width: '104px',
      minWidth: '104px',
      render: (c) => {
        const cl = c.classified;
        const labels: Record<string, string> = { VIP: 'VIP', Lead: 'Tiềm năng', Normal: 'Thông thường' };
        if (!cl) return <span className="text-fg-empty">—</span>;
        return (
          <span
            className={`whitespace-nowrap ${
              cl === 'VIP'
                ? 'inline-flex h-[22px] items-center rounded-chip bg-brand-soft px-2 text-xs font-semibold text-brand-text'
                : 'text-sm text-fg-muted'
            }`}
          >
            {labels[cl] || cl}
          </span>
        );
      },
    },
    {
      key: 'price',
      title: 'Giá trị HĐ',
      width: '128px',
      minWidth: '128px',
      align: 'right',
      render: (c) => {
        const hasPrice = c.price && Number(c.price) > 0;
        return (
          <span
            className={`tnum whitespace-nowrap text-sm ${hasPrice ? 'font-medium text-fg' : 'text-fg-empty'}`}
          >
            {hasPrice ? formatCurrency(c.price) : '—'}
          </span>
        );
      },
    },
    {
      key: 'actions' as any,
      title: '',
      width: '80px',
      minWidth: '80px',
      align: 'right',
      sticky: 'right',
      render: (c) => {
        const isOwnerOrAdmin = currentUser?.role === 'admin' || (c as any).owner_id === currentUser?.id;
        return (
          <div className="flex items-center justify-end gap-0.5 whitespace-nowrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectCustomer(c.id.toString());
              }}
              className="flex h-7 w-7 items-center justify-center rounded-control text-fg-subtle transition hover:bg-raised hover:text-fg"
              title="Xem & Cập nhật chi tiết"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            {isOwnerOrAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCustomer(c.id.toString());
                }}
                className="flex h-7 w-7 items-center justify-center rounded-control text-fg-subtle transition hover:bg-danger/10 hover:text-danger"
                title="Xóa khách hàng"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-5 flex w-full min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className={pageTitle}>Khách hàng</h2>
            <p className="tnum text-[13px] text-fg-subtle">
              {total > 0 ? `${total.toLocaleString('vi-VN')} hồ sơ` : 'Danh sách khách hàng bạn có quyền xem'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleDownloadTemplate} className={toolbarButton} title="Tải file Excel mẫu">
              <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.8} />
              File mẫu
            </button>
            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImport} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className={toolbarButton}>
              <Upload className="h-3.5 w-3.5" strokeWidth={1.8} />
              Nhập Excel
            </button>
            <button onClick={handleExport} className={toolbarButton}>
              <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
              Xuất Excel
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className={primaryButton}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Thêm khách hàng
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-faint" strokeWidth={1.9} />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={toolbarSearch}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={toolbarSelect}
          >
            <option value="">Mọi trạng thái</option>
            <option value="NEW">Mới tiếp nhận</option>
            <option value="CONSULTING">Đang tư vấn</option>
            <option value="DEMO_SENT">Đã gửi demo</option>
            <option value="QUOTED">Đã gửi báo giá</option>
            <option value="CONTRACT_SENT">Đã gửi hợp đồng</option>
            <option value="SIGNED">Đã ký hợp đồng</option>
            <option value="STOPCONSULTING">Ngừng tư vấn</option>
            <option value="REJECTED">Đã hủy</option>
          </select>

          <select
            value={classifiedFilter}
            onChange={(e) => {
              setClassifiedFilter(e.target.value);
              setPage(1);
            }}
            className={toolbarSelect}
          >
            <option value="">Mọi phân loại</option>
            <option value="VIP">VIP</option>
            <option value="Lead">Tiềm năng</option>
            <option value="Normal">Thông thường</option>
          </select>

          {currentUser?.role === 'admin' ? (
            <select
              value={ownerFilter}
              onChange={(e) => {
                setOwnerFilter(e.target.value);
                setPage(1);
              }}
              className={toolbarSelect}
            >
              <option value="">Mọi nhân viên</option>
              {team.map(u => (
                <option key={u.id} value={u.id.toString()}>{u.name}</option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <div className="w-full min-w-0">
        <DataTable
          columns={customerColumns}
          data={customers}
          keyExtractor={(c) => c.id.toString()}
          isLoading={loading}
          onRowClick={(c) => onSelectCustomer(c.id.toString())}
          emptyMessage="Không có khách hàng nào."
          pagination={{
            page,
            totalPages,
            onPageChange: setPage
          }}
        />
      </div>

      {/* MODAL THÊM KHÁCH HÀNG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
          <div
            className="fixed inset-0 bg-[#0c0d10]/45 transition-opacity animate-fade-in"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-xl max-h-[90vh] bg-surface dark:bg-panel rounded-2xl shadow-2xl z-10 flex flex-col border border-line dark:border-line overflow-hidden animate-modal-pop">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-divider dark:border-line bg-surface dark:bg-panel shrink-0">
              <div>
                <h3 className="text-base font-bold text-fg dark:text-white">
                  Thêm khách hàng
                </h3>
                <p className="text-xs text-fg-subtle dark:text-fg-muted mt-0.5">
                  Nhập thông tin người đại diện và doanh nghiệp để tạo hồ sơ khách hàng
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-fg-faint hover:text-fg-body dark:hover:text-white hover:bg-raised dark:hover:bg-raised rounded-xl transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-surface dark:bg-panel custom-scrollbar">
              {formError && (
                <div className="p-3 mb-4 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Người đại diện *</label>
                    <input
                      type="text"
                      required
                      value={newCustomerData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A..."
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Đầu mối doanh nghiệp</label>
                    <input
                      type="text"
                      value={newCustomerData.company_name}
                      onChange={(e) => handleFormChange('company_name', e.target.value)}
                      placeholder="Nhập tên đầu mối doanh nghiệp mới..."
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Số điện thoại</label>
                    <input
                      type="text"
                      value={newCustomerData.phone_number}
                      onChange={(e) => handleFormChange('phone_number', e.target.value)}
                      placeholder="0901234567"
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={newCustomerData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Giá trị dự kiến (VNĐ)</label>
                    <input
                      type="number"
                      value={newCustomerData.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      placeholder="50,000,000"
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Lĩnh vực (Field)</label>
                    <input
                      type="text"
                      value={newCustomerData.field}
                      onChange={(e) => handleFormChange('field', e.target.value)}
                      placeholder="Bán lẻ, F&B, Logistics..."
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Nguồn khách hàng</label>
                    <div className="relative">
                      <select
                        value={newCustomerData.from_source}
                        onChange={(e) => handleFormChange('from_source', e.target.value)}
                        className="appearance-none w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
                      >
                        <option value="Facebook">Facebook</option>
                        <option value="Linkedin">Linkedin</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Website">Website</option>
                        <option value="Giới thiệu">Giới thiệu</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Đường dẫn liên kết (Link URL)</label>
                    <input
                      type="text"
                      value={newCustomerData.link_url}
                      onChange={(e) => handleFormChange('link_url', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Lịch hẹn tiếp theo</label>
                    <input
                      type="datetime-local"
                      value={newCustomerData.appointment}
                      onChange={(e) => handleFormChange('appointment', e.target.value)}
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Địa chỉ liên hệ</label>
                    <input
                      type="text"
                      value={newCustomerData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      placeholder="Số nhà, đường, quận/huyện..."
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Phân loại khách hàng</label>
                    <div className="relative">
                      <select
                        value={newCustomerData.classified}
                        onChange={(e) => handleFormChange('classified', e.target.value)}
                        className="appearance-none w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
                      >
                        <option value="">Chưa phân loại</option>
                        <option value="VIP">VIP</option>
                        <option value="Lead">Tiềm năng (Lead)</option>
                        <option value="Normal">Thông thường (Normal)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Trạng thái chăm sóc</label>
                    <div className="relative">
                      <select
                        value={newCustomerData.status}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        className="appearance-none w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
                      >
                        <option value="NEW">Mới tiếp nhận</option>
                        <option value="DEMO_SENT">Đã gửi demo</option>
                        <option value="QUOTED">Đã gửi báo giá</option>
                        <option value="CONTRACT_SENT">Đã gửi hợp đồng</option>
                        <option value="SIGNED">Đã ký hợp đồng</option>
                        <option value="REJECTED">Đã hủy</option>
                        <option value="CONSULTING">Đang tư vấn</option>
                        <option value="STOPCONSULTING">Ngừng tư vấn</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
                    </div>
                  </div>
                </div>

                {newCustomerData.status === 'REJECTED' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Hủy ở bước</label>
                      <div className="relative">
                        <select
                          value={newCustomerData.current_step || ''}
                          onChange={(e) => handleFormChange('current_step', e.target.value)}
                          className="appearance-none w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
                        >
                          <option value="">-- Chọn bước --</option>
                          <option value="Đã gửi demo">Đã gửi demo</option>
                          <option value="Đã gửi báo giá">Đã gửi báo giá</option>
                          <option value="Đã gửi hợp đồng">Đã gửi hợp đồng</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Lý do từ chối</label>
                      <input
                        type="text"
                        value={newCustomerData.reject_reason || ''}
                        onChange={(e) => handleFormChange('reject_reason', e.target.value)}
                        placeholder="Nhập lý do khách hàng từ chối..."
                        className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>
                )}

                <div className="relative z-50">
                  <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Nhu cầu khách hàng</label>
                  <MentionTextarea
                    value={newCustomerData.note || ''}
                    onChange={(val) => handleFormChange('note', val)}
                    placeholder="Nhập ghi chú (Gõ @Tên để tag nhân viên)..."
                    users={team.map(u => ({ id: u.id.toString(), name: u.name, role: u.role }))}
                    dropdownDirection="down"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-divider dark:border-line gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setFormError(''); }}
                    className="px-4 py-2 bg-raised dark:bg-surface text-fg-body dark:text-fg-body hover:bg-line dark:hover:bg-raised rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-[0.98]"
                  >
                    Thêm khách hàng
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
