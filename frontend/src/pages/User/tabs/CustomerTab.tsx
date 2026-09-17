import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, Search, Trash2, Download, Upload, FileSpreadsheet, ExternalLink, X, ChevronDown } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '../../../components/Table/DataTable';
import { Customer } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useCommonStore } from '../../../store/useCommonStore';
import { useCustomers, buildCustomerQuery } from '../../../hooks/useCustomers';
import api from '../../../services/api';
import { MentionTextarea } from '../../../components/MentionTextarea';
import { useExportExcel } from '../../../hooks/useExportExcel';
import { formatCurrency } from '../../../utils/formatters';
import { formatDate, fromDateTimeLocalValue } from '../../../utils/datetime';
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_CLASS, INITIAL_CUSTOMER_FORM } from '../../../utils/constants';

interface CustomerTabProps {
  onSelectCustomer: (id: string) => void;
  onOpenCompanyForm: (companyId: number | null) => void;
}

export const CustomerTab: React.FC<CustomerTabProps> = ({ onSelectCustomer, onOpenCompanyForm }) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { team, fetchTeam } = useCommonStore();
  const { exportToExcel } = useExportExcel();
  
  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Ô tìm kiếm ở thanh điều hướng trên cùng điều hướng tới /customers?search=...
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';

  const {
    customers, loading,
    page, setPage, totalPages,
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      await api.delete(`/customers/${id}`);
      alert('Đã xóa khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Không thể xóa khách hàng lúc này. Vui lòng thử lại sau.';
      console.error('Lỗi khi xóa:', errorMessage);
      alert(errorMessage);
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
      alert('Không thể xuất Excel lúc này. Vui lòng thử lại sau.');
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
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      
      const importedData: any[] = [];
      let isFirstRow = true;
      let headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
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
        alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        return;
      }

      const res = await api.post('/customers/bulk', { customers: importedData });
      alert(`Đã nhập thành công ${res.data.successCount} khách hàng. Đã bỏ qua ${res.data.skipCount} khách hàng bị trùng Email/SĐT.`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Lỗi khi nhập excel:', error);
      alert('Không thể nhập Excel. Vui lòng kiểm tra lại định dạng file.');
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────

  // ── Table columns ──────────────────────────────────────────────────────────

  const customerColumns: Column<Customer>[] = [
    {
      key: 'id',
      title: 'ID',
      width: '70px',
      render: (c) => <span className="text-slate-400 text-xs font-bold">{c.displayId || c.id}</span>,
    },
    {
      key: 'created_at',
      title: 'Ngày tạo',
      width: '100px',
      render: (c) => <span className="text-slate-400 text-[11px] font-mono">{formatDate(c.created_at)}</span>,
    },
    {
      key: 'name',
      title: 'Họ và tên & SĐT',
      render: (c) => (
        <div
          className="flex flex-col cursor-pointer group/name py-0.5"
          onClick={() => onSelectCustomer(c.id.toString())}
        >
          <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover/name:text-black dark:group-hover/name:text-white group-hover/name:underline transition text-xs">
            {c.name}
          </span>
          {c.phone_number && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">{c.phone_number}</span>
          )}
        </div>
      ),
    },
    {
      key: 'company',
      title: 'Đầu mối doanh nghiệp',
      render: (c) => {
        const hasCompany = !!c.company_id;
        const compName = c.company?.name ?? '';
        if (!hasCompany) return <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">-</span>;
        return (
          <span
            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
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
      render: (c) => <span className="text-xs text-gray-600 dark:text-gray-300">{c.field || '-'}</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (c) => (
        <span
          className={`whitespace-nowrap inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium border shadow-2xs ${
            CUSTOMER_STATUS_CLASS[c.status] ?? CUSTOMER_STATUS_CLASS.NEW
          }`}
        >
          {CUSTOMER_STATUS_LABEL[c.status] ?? c.status}
        </span>
      ),
    },
    {
      key: 'classified',
      title: 'Phân loại',
      render: (c) => {
        const cl = c.classified;
        const labels: Record<string, string> = { VIP: 'VIP', Lead: 'Tiềm năng', Normal: 'Thông thường' };
        if (!cl) return <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">-</span>;
        const badgeStyle =
          cl === 'VIP'
            ? 'border-amber-400 text-amber-700 bg-amber-50/60 dark:border-amber-400 dark:text-amber-400 dark:bg-amber-950/20'
            : cl === 'Lead'
            ? 'border-blue-400 text-blue-600 bg-blue-50/60 dark:border-blue-400 dark:text-blue-400 dark:bg-blue-950/20'
            : 'border-gray-300 text-gray-700 bg-gray-50/60 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800/30';
        return (
          <span className={`whitespace-nowrap inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border shadow-2xs ${badgeStyle}`}>
            {labels[cl] || cl}
          </span>
        );
      },
    },
    {
      key: 'price',
      title: 'Giá trị HĐ',
      render: (c) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
          {formatCurrency(c.price)}
        </span>
      ),
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      key: 'actions' as any,
      title: 'Thao tác',
      width: '90px',
      render: (c) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isOwnerOrAdmin = currentUser?.role === 'admin' || (c as any).owner_id === currentUser?.id;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectCustomer(c.id.toString());
              }}
              className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#282522] rounded-lg transition"
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
                className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-[#e8732c]" />
          Danh sách Khách hàng
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Trạng thái chăm sóc */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8732c] transition"
          >
            <option value="">Trạng thái chăm sóc</option>
            <option value="NEW">Mới tiếp nhận</option>
            <option value="DEMO_SENT">Đã gửi demo</option>
            <option value="QUOTED">Đã gửi báo giá</option>
            <option value="CONTRACT_SENT">Đã gửi hợp đồng</option>
            <option value="SIGNED">Đã ký hợp đồng</option>
            <option value="REJECTED">Đã hủy</option>
            <option value="CONSULTING">Đang tư vấn</option>
            <option value="STOPCONSULTING">Ngừng tư vấn</option>
          </select>

          {/* Filter Phân loại */}
          <select
            value={classifiedFilter}
            onChange={(e) => {
              setClassifiedFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8732c] transition"
          >
            <option value="">Tất cả phân loại</option>
            <option value="VIP">VIP</option>
            <option value="Lead">Tiềm năng (Lead)</option>
            <option value="Normal">Thông thường (Normal)</option>
          </select>

          {/* Filter Nhân viên (chỉ dành cho admin) */}
          {currentUser?.role === 'admin' ? (
            <select
              value={ownerFilter}
              onChange={(e) => {
                setOwnerFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#e8732c] transition"
            >
              <option value="">Tất cả nhân viên</option>
              {team.map(u => (
                <option key={u.id} value={u.id.toString()}>{u.name}</option>
              ))}
            </select>
          ) : null}

          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#e8732c] transition"
            />
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#232120] text-xs font-medium py-2 px-3.5 rounded-xl flex items-center gap-2 transition shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-500" />Tải File Mẫu
          </button>
          <button
            onClick={handleExport}
            className="border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#232120] text-xs font-medium py-2 px-3.5 rounded-xl flex items-center gap-2 transition shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-500" />Xuất Excel
          </button>
          
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#232120] text-xs font-medium py-2 px-3.5 rounded-xl flex items-center gap-2 transition shadow-2xs"
          >
            <Upload className="w-4 h-4 text-purple-500" />
            Nhập Excel
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm Khách Hàng
          </button>
        </div>
      </div>

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

      {/* MODAL THÊM KHÁCH HÀNG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#1d1c19] rounded-2xl shadow-2xl z-10 flex flex-col border border-gray-200 dark:border-[#332f2c] overflow-hidden animate-modal-pop">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Thêm Khách Hàng Mới
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Nhập thông tin người đại diện và doanh nghiệp để tạo hồ sơ khách hàng
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#282522] rounded-xl transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#1d1c19] custom-scrollbar">
              {formError && (
                <div className="p-3 mb-4 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Người đại diện *</label>
                    <input
                      type="text"
                      required
                      value={newCustomerData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A..."
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Đầu mối doanh nghiệp</label>
                    <input
                      type="text"
                      value={newCustomerData.company_name}
                      onChange={(e) => handleFormChange('company_name', e.target.value)}
                      placeholder="Nhập tên đầu mối doanh nghiệp mới..."
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Số điện thoại</label>
                    <input
                      type="text"
                      value={newCustomerData.phone_number}
                      onChange={(e) => handleFormChange('phone_number', e.target.value)}
                      placeholder="0901234567"
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={newCustomerData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Giá trị dự kiến (VNĐ)</label>
                    <input
                      type="number"
                      value={newCustomerData.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      placeholder="50,000,000"
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Lĩnh vực (Field)</label>
                    <input
                      type="text"
                      value={newCustomerData.field}
                      onChange={(e) => handleFormChange('field', e.target.value)}
                      placeholder="Bán lẻ, F&B, Logistics..."
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Nguồn khách hàng</label>
                    <div className="relative">
                      <select
                        value={newCustomerData.from_source}
                        onChange={(e) => handleFormChange('from_source', e.target.value)}
                        className="appearance-none w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
                      >
                        <option value="Facebook">Facebook</option>
                        <option value="Linkedin">Linkedin</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Website">Website</option>
                        <option value="Giới thiệu">Giới thiệu</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Đường dẫn liên kết (Link URL)</label>
                    <input
                      type="text"
                      value={newCustomerData.link_url}
                      onChange={(e) => handleFormChange('link_url', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Lịch hẹn tiếp theo</label>
                    <input
                      type="datetime-local"
                      value={newCustomerData.appointment}
                      onChange={(e) => handleFormChange('appointment', e.target.value)}
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Địa chỉ liên hệ</label>
                    <input
                      type="text"
                      value={newCustomerData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      placeholder="Số nhà, đường, quận/huyện..."
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Phân loại khách hàng</label>
                    <div className="relative">
                      <select
                        value={newCustomerData.classified}
                        onChange={(e) => handleFormChange('classified', e.target.value)}
                        className="appearance-none w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
                      >
                        <option value="">Chưa phân loại</option>
                        <option value="VIP">VIP</option>
                        <option value="Lead">Tiềm năng (Lead)</option>
                        <option value="Normal">Thông thường (Normal)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Trạng thái chăm sóc</label>
                    <div className="relative">
                      <select
                        value={newCustomerData.status}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        className="appearance-none w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
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
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {newCustomerData.status === 'REJECTED' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Hủy ở bước</label>
                      <div className="relative">
                        <select
                          value={newCustomerData.current_step || ''}
                          onChange={(e) => handleFormChange('current_step', e.target.value)}
                          className="appearance-none w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
                        >
                          <option value="">-- Chọn bước --</option>
                          <option value="Đã gửi demo">Đã gửi demo</option>
                          <option value="Đã gửi báo giá">Đã gửi báo giá</option>
                          <option value="Đã gửi hợp đồng">Đã gửi hợp đồng</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Lý do từ chối</label>
                      <input
                        type="text"
                        value={newCustomerData.reject_reason || ''}
                        onChange={(e) => handleFormChange('reject_reason', e.target.value)}
                        placeholder="Nhập lý do khách hàng từ chối..."
                        className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>
                )}

                <div className="relative z-50">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Nhu cầu khách hàng</label>
                  <MentionTextarea
                    value={newCustomerData.note || ''}
                    onChange={(val) => handleFormChange('note', val)}
                    placeholder="Nhập ghi chú (Gõ @Tên để tag nhân viên)..."
                    users={team.map(u => ({ id: u.id.toString(), name: u.name, role: u.role }))}
                    dropdownDirection="down"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-[#2b2826] gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setFormError(''); }}
                    className="px-4 py-2 bg-gray-100 dark:bg-[#232120] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2c2927] rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    Thêm Khách Hàng
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
